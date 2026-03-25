// models
import type { VisibleColumn, Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { PseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';

// legacy
import { _renderTemplate, _getRowTemplateVariables } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

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

  constructor(column: VisibleColumn, onEmpty: 'show' | 'hide', conditionPattern?: string, templateEngine?: string) {
    this.column = column;
    this.onEmpty = onEmpty;
    this.conditionPattern = conditionPattern;
    this.templateEngine = templateEngine;
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
      // Build $self/$_self based on column type (mirroring sourceFormatPresentation logic)
      const selfTemplateVariables = this._buildSelfVariables(conditionValue, mainTuple);
      const keyValues: any = {};
      Object.assign(keyValues, templateVariables, selfTemplateVariables);

      // Evaluate template (no markdown rendering)
      const col = this.column as PseudoColumn;
      const rendered = _renderTemplate(this.conditionPattern, keyValues, col.table.schema.catalog, {
        templateEngine: this.templateEngine,
      });
      isEmpty = !rendered || rendered.trim() === '';
    } else {
      // No pattern — check if condition source returned data
      isEmpty = this._isConditionValueEmpty(conditionValue);
    }

    // on_empty: "hide" (default) → hide when empty → show when NOT empty
    // on_empty: "show" → show when empty → hide when NOT empty
    const shouldShow = this.onEmpty === 'show' ? isEmpty : !isEmpty;
    return { shouldShow };
  }

  /**
   * Build $self/$_self template variables based on column type.
   * Mirrors PseudoColumn.sourceFormatPresentation logic.
   */
  private _buildSelfVariables(conditionValue: any, mainTuple: Tuple): any {
    const col = this.column as PseudoColumn;
    const context = (col as any)._context;

    // aggregate: use precomputed templateVariables
    if (col.hasAggregate && conditionValue) {
      return conditionValue.templateVariables || {};
    }

    // all-outbound (isUnique): use mainTuple.linkedData
    if (col.hasPath && col.isUnique) {
      if (!mainTuple.linkedData[col.name]) {
        return {};
      }
      // scalar
      if (!col.isEntityMode) {
        const baseCol = col.baseColumn;
        return {
          $self: baseCol.formatvalue(mainTuple.linkedData[col.name][baseCol.name], context),
          $_self: mainTuple.linkedData[col.name][baseCol.name],
        };
      }
      // entity
      return {
        $self: _getRowTemplateVariables(col.table, context, mainTuple.linkedData[col.name]),
      };
    }

    // entityset: use conditionValue.templateVariables (page)
    if (conditionValue && conditionValue.templateVariables) {
      return conditionValue.templateVariables;
    }

    // scalar column
    if (col.baseColumn) {
      return {
        $self: col.baseColumn.formatvalue(mainTuple.data[col.baseColumn.name], context),
        $_self: mainTuple.data[col.baseColumn.name],
      };
    }

    return {};
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
