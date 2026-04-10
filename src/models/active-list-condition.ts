// models
import type { Reference, VisibleColumn, Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { ReferenceColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type { ConditionDefinition } from '@isrd-isi-edu/ermrestjs/src/models/table-source-definitions';

// utils
import { buildSelfTemplateVariables } from '@isrd-isi-edu/ermrestjs/src/utils/template-utils';

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
  /** "show" or "hide" (default "hide") */
  onEmpty: 'show' | 'hide';
  /** Optional template (no markdown rendering) */
  conditionPattern?: string;
  /** Template engine for condition_pattern: "mustache" (default) or "handlebars" */
  templateEngine?: string;

  private _condDef: ConditionDefinition;
  private _reference: Reference;
  private _tuple?: Tuple;

  private _waitFor?: ReferenceColumn[];
  private _hasWaitFor?: boolean;
  private _hasWaitForAggregate?: boolean;

  constructor(condDef: ConditionDefinition, column: VisibleColumn, reference: Reference, tuple?: Tuple) {
    this._condDef = condDef;
    this.column = column;
    this._reference = reference;
    this._tuple = tuple;

    this.onEmpty = condDef.on_empty || 'hide';
    this.conditionPattern = condDef.condition_pattern;
    this.templateEngine = condDef.template_engine;
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
      const res = _processWaitForList(this._condDef.wait_for || [], this._reference, this._reference.table, null, this._tuple, 'condition');
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

    if (this.conditionPattern) {
      const selfTemplateVariables = buildSelfTemplateVariables(this.column as ReferenceColumn, mainTuple, conditionValue);
      const keyValues: any = {};
      Object.assign(keyValues, templateVariables, selfTemplateVariables);

      // evaluate template (no markdown rendering)
      const rendered = _renderTemplate(this.conditionPattern, keyValues, this.column.table.schema.catalog, {
        templateEngine: this.templateEngine,
      });
      isEmpty = !rendered || rendered.trim() === '';
    } else {
      // no pattern: check if condition source returned data
      isEmpty = this._isConditionValueEmpty(conditionValue);
    }

    // on_empty: "hide" (default) -> hide when empty -> show when NOT empty
    // on_empty: "show" -> show when empty -> hide when NOT empty
    const shouldShow = this.onEmpty === 'show' ? isEmpty : !isEmpty;
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
