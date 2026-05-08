// models
import type { Reference, VisibleColumn, Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { ReferenceColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type { ConditionDefinition } from '@isrd-isi-edu/ermrestjs/src/models/table-source-definitions';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';

// utils
import { buildSelfTemplateVariables } from '@isrd-isi-edu/ermrestjs/src/utils/template-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _warningMessages } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { createPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';

// legacy
import { _renderTemplate } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _processWaitForList } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

/**
 * Encapsulates condition evaluation logic for conditionally visible
 * columns and related entities in the record page.
 */
export default class ActiveListCondition {
  /** The PseudoColumn for fetching condition data */
  column: VisibleColumn;

  /** Whether the condition source requires a secondary request (has inbound path or aggregate) */
  isAsync: boolean;

  /**
   * if the condition definition is shared across multiple columns/entities,
   * this key can be used to link them together for efficient evaluation.
   */
  conditionKey?: string;

  private _condDef: ConditionDefinition;
  private _reference: Reference;
  private _tuple?: Tuple;

  private _waitFor?: ReferenceColumn[];
  private _hasWaitFor?: boolean;
  private _hasWaitForAggregate?: boolean;

  constructor(condDef: ConditionDefinition, reference: Reference, tuple?: Tuple, conditionKey?: string) {
    this._condDef = condDef;
    this._reference = reference;
    this._tuple = tuple;
    this.conditionKey = conditionKey;

    const wm = _warningMessages;

    if (typeof condDef !== 'object' || (!condDef.source && !isStringAndNotEmpty(condDef.sourcekey))) {
      throw new Error(wm.CONDITION.INVALID_SOURCE);
    }

    let condSourceWrapper: SourceObjectWrapper;
    try {
      const sds = this._reference.table.sourceDefinitions;
      if (condDef.sourcekey) {
        const sd = sds.getSource(condDef.sourcekey as string);
        if (!sd) {
          throw new Error('condition sourcekey `' + condDef.sourcekey + '` could not be resolved.');
        }
        // SourceObjectWrapper.clone mutates its first argument (deletes `source`,
        // copies in keys from the resolved source). condDef may be the shared
        // object stored in TableSourceDefinitions.conditions (for condition_key
        // references), so pass a shallow copy to avoid corrupting the shared def.
        condSourceWrapper = sd.clone({ ...condDef }, this._reference.table, false, this._tuple);
      } else {
        condSourceWrapper = new SourceObjectWrapper(condDef, this._reference.table, false, undefined, this._tuple);
      }
      this.column = createPseudoColumn(this._reference, condSourceWrapper!, this._tuple);
    } catch (e: unknown) {
      throw new Error('failed to create condition column: ' + (e instanceof Error ? e.message : String(e)));
    }

    this.isAsync = condSourceWrapper.hasInbound || condSourceWrapper.hasAggregate;
  }

  /**
   * Whether there are aggregate or entity set columns in the wait_for list of this condition.
   */
  get hasWaitFor(): boolean {
    if (this._hasWaitFor === undefined) {
      this.waitFor; // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    return this._hasWaitFor!;
  }

  /**
   * Whether there are aggregate columns in the wait_for list of this condition.
   */
  get hasWaitForAggregate(): boolean {
    if (this._hasWaitForAggregate === undefined) {
      this.waitFor; // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    return this._hasWaitForAggregate!;
  }

  /**
   * Array of columns that the condition evaluation depends on.
   * Follows the same pattern as ReferenceColumn.waitFor.
   */
  get waitFor(): ReferenceColumn[] {
    if (this._waitFor === undefined) {
      const res = _processWaitForList(this._condDef.wait_for, this._reference, this._reference.table, null, this._tuple, 'condition');
      this._waitFor = res.waitForList;
      this._hasWaitFor = res.hasWaitFor;
      this._hasWaitForAggregate = res.hasWaitForAggregate;
    }
    return this._waitFor!;
  }

  /**
   * Decide whether the conditioned content should be shown.
   *
   * Three internal paths, dispatched on `condition_pattern` and `this.isAsync`:
   *
   * 1. **`condition_pattern` set.** Render the pattern. `$self` / `$_self` come
   *    from {@link buildSelfTemplateVariables}, which sources from `mainTuple`
   *    for sync sources and from `conditionValue` for async sources. Blank
   *    rendered output ⇒ empty.
   * 2. **No pattern + `isAsync === true`.** Caller already fetched the data;
   *    emptiness is computed from `conditionValue` by {@link _isConditionValueEmpty}.
   * 3. **No pattern + `isAsync === false`.** `conditionValue` is ignored (sync
   *    sources have no fetched value). The raw value is pulled from `mainTuple`
   *    via {@link buildSelfTemplateVariables}: scalar sources are empty when
   *    `$_self` is `null`/`undefined`/`''`; entity-mode sources are empty when
   *    `$self` is undefined (the joined row didn't load).
   *
   * The `on_empty` flag then maps `isEmpty` to "show": `"hide"` (default) shows
   * when not empty; `"show"` shows when empty.
   *
   * @param templateVariables - accumulated `$x`/`$_x` template variables for
   *   every other source (only consulted by the pattern branch).
   * @param conditionValue - the fetched value for an async source.
   *   - **entityset** (Reference.read result): a {@link Page} object — has
   *     `length` (used by `_isConditionValueEmpty`) and `templateVariables`
   *     (used by `buildSelfTemplateVariables` when there is a pattern).
   *   - **aggregate** (column.getAggregatedValue result): the unwrapped first
   *     element, shaped `{ value, templateVariables }` — `value` is the
   *     scalar; `templateVariables` carries `$self`/`$_self`.
   *   - **null** if the request failed or there's no fetched value (treated
   *     as empty).
   *   Ignored entirely for sync sources (path 3).
   * @param mainTuple - the main record tuple. Always required: the pattern
   *   branch and the sync no-pattern branch both look up `$self`/`$_self`
   *   from it.
   * @returns whether the conditioned content should be shown.
   */
  evaluateCondition(templateVariables: any, conditionValue: any, mainTuple: Tuple): { shouldShow: boolean } {
    let isEmpty: boolean;
    const condDef = this._condDef;

    if (condDef.condition_pattern) {
      const selfTemplateVariables = buildSelfTemplateVariables(this.column as ReferenceColumn, mainTuple, conditionValue);
      const keyValues: any = {};
      Object.assign(keyValues, templateVariables, selfTemplateVariables);

      // evaluate template (no markdown rendering)
      const rendered = _renderTemplate(condDef.condition_pattern as string, keyValues, this.column.table.schema.catalog, {
        templateEngine: condDef.template_engine,
      });
      isEmpty = !rendered || rendered.trim() === '';
    } else if (this.isAsync) {
      // no pattern, async: caller fetched the value
      isEmpty = this._isConditionValueEmpty(conditionValue);
    } else {
      // no pattern, sync: derive the raw value from the tuple via the same
      // helper sourceFormatPresentation uses, then decide emptiness directly.
      const selfVars = buildSelfTemplateVariables(this.column as ReferenceColumn, mainTuple, null);
      if ('$_self' in selfVars) {
        // scalar source (local column or all-outbound scalar)
        const v = selfVars.$_self;
        isEmpty = v === null || v === undefined || v === '';
      } else {
        // entity-mode source (key, foreign-key, all-outbound entity):
        // the row exists iff buildSelfTemplateVariables returned a $self.
        isEmpty = selfVars.$self === undefined;
      }
    }

    // on_empty: "hide" (default) -> hide when empty -> show when NOT empty
    // on_empty: "show" -> show when empty -> hide when NOT empty
    const shouldShow = condDef.on_empty === 'show' ? isEmpty : !isEmpty;
    return { shouldShow };
  }

  /**
   * Check if a fetched async condition value is "empty".
   * Only called from the no-pattern async branch of evaluateCondition; expects
   * one of the shapes produced by Chaise's secondary-fetch:
   * - page object (entityset)            — empty iff `length === 0`
   * - `{ value, templateVariables }`     — empty iff `value` is null/''/0
   * - `null`/`undefined`                 — empty (request failed / missing)
   */
  private _isConditionValueEmpty(conditionValue: any): boolean {
    if (conditionValue === null || conditionValue === undefined) {
      return true;
    }

    // page object (entityset)
    if (typeof conditionValue.length === 'number') {
      return conditionValue.length === 0;
    }

    // aggregate single value: { value, templateVariables }
    if (typeof conditionValue === 'object') {
      const inner = (conditionValue as { value?: unknown }).value;
      if (inner === null || inner === undefined || inner === '') return true;
      // count-style aggregates may serialize as a numeric string ("0"); coerce.
      const num = typeof inner === 'number' ? inner : Number(inner);
      return !isNaN(num) && num === 0;
    }

    return false;
  }
}
