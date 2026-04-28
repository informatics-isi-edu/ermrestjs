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
   * For synchronous conditions (all-outbound, no wait_for): whether the condition evaluated to hide.
   * undefined for async conditions (evaluation happens later on the client).
   */
  conditionHide?: boolean;

  /**
   * if the condition definition is shared across multiple columns/entities,
   * this key can be used to link them together for efficient evaluation.
   */
  conditonKey?: string;

  private _condDef: ConditionDefinition;
  private _reference: Reference;
  private _tuple?: Tuple;

  private _waitFor?: ReferenceColumn[];
  private _hasWaitFor?: boolean;
  private _hasWaitForAggregate?: boolean;

  constructor(condDef: ConditionDefinition, reference: Reference, tuple?: Tuple, conditonKey?: string) {
    this._condDef = condDef;
    this._reference = reference;
    this._tuple = tuple;
    this.conditonKey = conditonKey;

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
        condSourceWrapper = sd.clone(condDef, this._reference.table, false, this._tuple);
      } else {
        condSourceWrapper = new SourceObjectWrapper(condDef, this._reference.table, false, undefined, this._tuple);
      }
      this.column = createPseudoColumn(this._reference, condSourceWrapper!, this._tuple);
    } catch (e: unknown) {
      throw new Error('failed to create condition column: ' + (e instanceof Error ? e.message : String(e)));
    }

    const isAsync = condSourceWrapper.hasInbound || condSourceWrapper.hasAggregate;

    // for synchronous conditions, evaluate now and store the result
    let conditionHide: boolean | undefined;
    if (!isAsync && this._tuple && !this.hasWaitFor) {
      const result = this.evaluateCondition(this._tuple.templateVariables, null, this._tuple);
      conditionHide = !result.shouldShow;
    }

    this.conditionHide = conditionHide;
    this.isAsync = isAsync;
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
   * Evaluate the condition given fetched data.
   *
   * @param templateVariables - the accumulated template variables
   * @param conditionValue - the fetched value (aggregate result or page for entityset)
   * @param mainTuple - the main record tuple
   * @returns whether the conditioned content should be shown
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
    } else {
      // no pattern: check if condition source returned data
      isEmpty = this._isConditionValueEmpty(conditionValue);
    }

    // on_empty: "hide" (default) -> hide when empty -> show when NOT empty
    // on_empty: "show" -> show when empty -> hide when NOT empty
    const shouldShow = condDef.on_empty === 'show' ? isEmpty : !isEmpty;
    return { shouldShow };
  }

  /**
   * Check if the condition value is "empty" (no data returned).
   */
  private _isConditionValueEmpty(conditionValue: any): boolean {
    if (conditionValue === null || conditionValue === undefined) {
      return true;
    }

    // aggregate result: check if the value is null/empty
    if (Array.isArray(conditionValue)) {
      if (conditionValue.length === 0) return true;
      const val = conditionValue[0];
      return val === null || val === undefined || val.value === '' || val.value === null;
    }

    // page object (entityset): check if length is 0
    if (typeof conditionValue.length === 'number') {
      return conditionValue.length === 0;
    }

    // aggregate single value
    if (typeof conditionValue === 'object') {
      if (conditionValue.value === null || conditionValue.value === '' || conditionValue.value === undefined) {
        return true;
      }
    }

    return false;
  }
}
