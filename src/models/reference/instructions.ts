import type { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { ConditionDefinition } from '@isrd-isi-edu/ermrestjs/src/models/table-source-definitions';
import { PresentationValue } from '@isrd-isi-edu/ermrestjs/src/models/presentation-value';
import ActiveListCondition from '@isrd-isi-edu/ermrestjs/src/models/active-list-condition';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { processMarkdownPattern } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

export interface InstructionsAnnotation {
  markdown_pattern: string;
  template_engine?: string;
  /**
   * inline condition that decides whether the instructions are displayed.
   * only the no-source form (just `condition_pattern`) is honored for now.
   */
  condition?: ConditionDefinition;
  /**
   * key of a condition defined in the source-definitions annotation. takes precedence over `condition`.
   */
  condition_key?: string;
}

export class Instructions {
  private _instructionsAnnotation: InstructionsAnnotation;
  private _reference: Reference;
  private _condition: ActiveListCondition | null;

  constructor(reference: Reference, annotation: InstructionsAnnotation) {
    this._reference = reference;
    this._instructionsAnnotation = annotation;
    this._condition = this._resolveCondition();
  }

  compute(): PresentationValue {
    const reference = this._reference;
    const annot = this._instructionsAnnotation;

    if (this._condition) {
      let shouldShow = true;
      try {
        shouldShow = this._condition.evaluateCondition({}, null).shouldShow;
      } catch (e) {
        $log.warn('instructions condition evaluation failed; defaulting to show: ' + (e instanceof Error ? e.message : String(e)));
      }
      if (!shouldShow) {
        return { isHTML: false, value: '' };
      }
    }

    const unformatted = annot.markdown_pattern;
    if (!isStringAndNotEmpty(unformatted)) {
      return { isHTML: false, value: '' };
    }

    // an empty render means there aren't any instructions, so we don't want the show_null value
    return processMarkdownPattern(unformatted, {}, reference.table, reference.context, {
      templateEngine: annot.template_engine,
      ignoreShowNull: true,
    });
  }

  /**
   * Resolve the condition that controls whether the instructions are displayed.
   *
   * Follows the same rules as `ReferenceColumn._resolveCondition`: `condition_key` takes precedence
   * over the inline `condition`, and an invalid or missing condition means "always show".
   * With-source conditions are ignored, since instructions are only supported in entry contexts
   * where there isn't a single main tuple to evaluate them against.
   */
  private _resolveCondition(): ActiveListCondition | null {
    const reference = this._reference;
    const annot = this._instructionsAnnotation;

    let condDef: ConditionDefinition | undefined, condKey: string | undefined;
    if (isStringAndNotEmpty(annot.condition_key)) {
      condKey = annot.condition_key as string;
      condDef = reference.table.sourceDefinitions.getCondition(condKey);
      if (!condDef) {
        $log.info('instructions: condition_key `' + condKey + '` not found in source-definitions conditions.');
        return null;
      }
    } else if (isObjectAndNotNull(annot.condition)) {
      condDef = annot.condition as ConditionDefinition;
    } else {
      return null;
    }

    // checked before constructing, so we don't build a pseudo-column just to throw it away
    const hasSource = !!condDef.source || isStringAndNotEmpty(condDef.sourcekey);
    if (hasSource) {
      $log.info('instructions: conditions with `source`/`sourcekey` are not supported; ignoring.');
      return null;
    }

    try {
      return new ActiveListCondition(condDef, reference, undefined, condKey);
    } catch (e) {
      $log.warn('instructions: ' + (e instanceof Error ? e.message : String(e)));
      return null;
    }
  }
}
