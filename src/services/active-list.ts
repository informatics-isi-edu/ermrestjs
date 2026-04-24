// models
import ActiveListCondition from '@isrd-isi-edu/ermrestjs/src/models/active-list-condition';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import type { Reference, VisibleColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference/reference';
import type { Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { PseudoColumn, ForeignKeyPseudoColumn, KeyPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type { ConditionDefinition } from '@isrd-isi-edu/ermrestjs/src/models/table-source-definitions';
import type { ResolvedCondition } from '@isrd-isi-edu/ermrestjs/src/models/reference-column/reference-column';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { createPseudoColumn, isAllOutboundColumn, isRelatedColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';

// legacy
import { _isEntryContext } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

// ============================================================================
// TYPES
// ============================================================================

export type ActiveListRequestObject = {
  /** The index of the object in the column's values array */
  index?: number;
  /** whether this is for a visible column */
  column?: boolean;
  /** whether this is for a related entity */
  related?: boolean;
  /** whether this is for an inline related entity */
  inline?: boolean;
  /** whether this is for the citation */
  citation?: boolean;
  /** whether this is for a condition evaluation (index refers to the conditionalGroups index) */
  condition?: boolean;

  isWaitFor: boolean;
};

export type ActiveListRequest = {
  column: VisibleColumn;

  /**
   * whether the request is "first outbound" type.
   * These booleans are used for figuring out how the data should be fetched.
   */
  firstOutbound?: boolean;
  /**
   * whether the request is for an aggregate column.
   */
  aggregate?: boolean;
  entity?: boolean;
  /**
   * whether the request is an entityset.
   */
  entityset?: boolean;

  /** where this request is needed. */
  objects: Array<ActiveListRequestObject>;
};

export type ActiveListRelatedEntityRequest = {
  /**
   * whether the request is for an inline related entity.
   * the .index indicated which related entity it is
   */
  inline?: boolean;
  /**
   * whether the request is for a related entity.
   * the .index indicated which related entity it is
   */
  related?: boolean;
  /** the index of the related entity in the reference.related array */
  index: number;
};

export type ActiveListConditionalGroup = {
  /** The condition object (class with evaluateCondition method) */
  condition: ActiveListCondition;
  /** Requests gated behind this condition (main content + its wait-fors) */
  dependentRequests: Array<ActiveListRequest | ActiveListRelatedEntityRequest>;
};

export type ActiveList = {
  /**
   * The list of requests that need to be made.
   * Already ordered based on the priority needed for the page load (top to bottom).
   */
  requests: Array<ActiveListRequest | ActiveListRelatedEntityRequest>;
  /** The list of conditional groups that need to be evaluated. */
  conditionalGroups: ActiveListConditionalGroup[];
  allOutBounds: Array<PseudoColumn | ForeignKeyPseudoColumn>;
  selfLinks: Array<KeyPseudoColumn>;
};

export enum ActiveListRequestTypes {
  COLUMN = 'column',
  RELATED = 'related',
  INLINE = 'inline',
  CITATION = 'citation',
  CONDITION = 'condition',
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Builds an ActiveList for a Reference. Encapsulates the dedup state and
 * the various add* helpers that used to live as nested closures inside
 * Reference.generateActiveList.
 *
 * Behavior is intended to be 1:1 with the previous nested implementation.
 */
export class ActiveListBuilder {
  // result buckets (public so the driver in reference.ts can push directly
  // for the related-entity case, matching the original code).
  requests: Array<ActiveListRequest | ActiveListRelatedEntityRequest> = [];
  allOutBounds: Array<PseudoColumn | ForeignKeyPseudoColumn> = [];
  selfLinks: Array<KeyPseudoColumn> = [];
  conditionalGroups: ActiveListConditionalGroup[] = [];

  // dedup maps
  private consideredUniqueFiltered: { [key: string]: number } = {};
  private consideredSets: { [key: string]: number } = {};
  private consideredOutbounds: { [key: string]: boolean } = {};
  private consideredAggregates: { [key: string]: number } = {};
  private consideredSelfLinks: { [key: string]: boolean } = {};
  private consideredEntryWaitFors: { [key: string]: number } = {};

  private isEntry: boolean;

  constructor(
    private reference: Reference,
    /**
     * The main request tuple.
     */
    private tuple: Tuple | undefined,
    /**
     * Whether the active list is being built for detailed context
     */
    private isDetailed: boolean,
  ) {
    this.isEntry = _isEntryContext(reference.context);
  }

  /**
   * Whether the given column is aggregate (either hasWaitForAggregate or is a path column with aggregate)
   */
  hasAggregate(col: VisibleColumn): boolean {
    return col.hasWaitForAggregate || ((col as PseudoColumn).isPathColumn && (col as PseudoColumn).hasAggregate);
  }

  /**
   * col: the column that we need its data
   * isWaitFor: whether it was part of waitFor or just visible
   * type: where in the page it belongs to
   * index: the container index (column index, or related index) (optional)
   */
  addCol(col: VisibleColumn, isWaitFor: boolean, type: ActiveListRequestTypes, index?: number): void {
    const obj: ActiveListRequestObject = { isWaitFor: isWaitFor };

    // add the type
    obj[type] = true;

    // add index if available (not available in citation)
    if (Number.isInteger(index)) {
      obj.index = index;
    }

    if (isWaitFor && this.isEntry) {
      if (col.name in this.consideredEntryWaitFors) {
        (this.requests[this.consideredEntryWaitFors[col.name]] as ActiveListRequest).objects.push(obj);
        return;
      }
      this.consideredEntryWaitFors[col.name] = this.requests.length;
      this.requests.push({ firstOutbound: true, column: col, objects: [obj] });
      return;
    }

    // unique filtered
    // TODO FILTER_IN_SOURCE chaise should use this type of column as well?
    // TODO FILTER_IN_SOURCE should be added to documentation as well
    if ((col as PseudoColumn).sourceObjectWrapper?.isUniqueFiltered) {
      // duplicate
      if (col.name in this.consideredUniqueFiltered) {
        (this.requests[this.consideredUniqueFiltered[col.name]] as ActiveListRequest).objects.push(obj);
        return;
      }

      // new
      this.consideredUniqueFiltered[col.name] = this.requests.length;
      this.requests.push({ entity: true, column: col, objects: [obj] });
      return;
    }

    // aggregates
    if ((col as PseudoColumn).isPathColumn && (col as PseudoColumn).hasAggregate) {
      // duplicate
      if (col.name in this.consideredAggregates) {
        (this.requests[this.consideredAggregates[col.name]] as ActiveListRequest).objects.push(obj);
        return;
      }

      // new
      this.consideredAggregates[col.name] = this.requests.length;
      this.requests.push({ aggregate: true, column: col, objects: [obj] });
      return;
    }

    // entitysets
    if (isRelatedColumn(col)) {
      if (!this.isDetailed) {
        return; // only acceptable in detailed
      }

      if (col.name in this.consideredSets) {
        (this.requests[this.consideredSets[col.name]] as ActiveListRequest).objects.push(obj);
        return;
      }

      this.consideredSets[col.name] = this.requests.length;
      this.requests.push({ entityset: true, column: col, objects: [obj] });
    }

    // all outbounds
    if (isAllOutboundColumn(col)) {
      if (col.name in this.consideredOutbounds) return;
      this.consideredOutbounds[col.name] = true;
      this.allOutBounds.push(col as PseudoColumn | ForeignKeyPseudoColumn);
    }

    // self-links
    if ((col as KeyPseudoColumn).isKey) {
      if (col.name in this.consideredSelfLinks) return;
      this.consideredSelfLinks[col.name] = true;
      this.selfLinks.push(col as KeyPseudoColumn);
    }
  }

  /**
   * Same as addCol, but adds to a dependent requests array
   * instead of the main requests array. Used for conditional groups.
   */
  addColToDependent(
    dependentRequests: Array<ActiveListRequest | ActiveListRelatedEntityRequest>,
    col: VisibleColumn,
    isWaitFor: boolean,
    type: ActiveListRequestTypes,
    index?: number,
  ): void {
    const obj: ActiveListRequestObject = { isWaitFor: isWaitFor };
    obj[type] = true;
    if (Number.isInteger(index)) {
      obj.index = index;
    }

    // aggregates
    if ((col as PseudoColumn).isPathColumn && (col as PseudoColumn).hasAggregate) {
      // check if already in dependentRequests
      const existing = dependentRequests.find((r) => (r as ActiveListRequest).column?.name === col.name && (r as ActiveListRequest).aggregate) as
        | ActiveListRequest
        | undefined;
      if (existing) {
        existing.objects.push(obj);
        return;
      }
      dependentRequests.push({ aggregate: true, column: col, objects: [obj] });
      return;
    }

    // entitysets
    if (isRelatedColumn(col)) {
      const existing = dependentRequests.find((r) => (r as ActiveListRequest).column?.name === col.name && (r as ActiveListRequest).entityset) as
        | ActiveListRequest
        | undefined;
      if (existing) {
        existing.objects.push(obj);
        return;
      }
      dependentRequests.push({ entityset: true, column: col, objects: [obj] });
      return;
    }

    // all outbounds — still add to main allOutBounds
    if (isAllOutboundColumn(col)) {
      if (!(col.name in this.consideredOutbounds)) {
        this.consideredOutbounds[col.name] = true;
        this.allOutBounds.push(col as PseudoColumn | ForeignKeyPseudoColumn);
      }
    }

    // self-links — still add to main selfLinks
    if ((col as KeyPseudoColumn).isKey) {
      if (!(col.name in this.consideredSelfLinks)) {
        this.consideredSelfLinks[col.name] = true;
        this.selfLinks.push(col as KeyPseudoColumn);
      }
    }
  }

  /**
   * Add a visible column and its waitFors to the active list as inline requests (with deduplication).
   */
  addInline(col: VisibleColumn, i: number): void {
    if (isRelatedColumn(col)) {
      this.requests.push({ inline: true, index: i });
    } else {
      this.addCol(col, false, ActiveListRequestTypes.COLUMN, i);
    }

    col.waitFor.forEach((wf) => {
      this.addCol(wf, true, isRelatedColumn(col) ? ActiveListRequestTypes.INLINE : ActiveListRequestTypes.COLUMN, i);
    });
  }

  /** Same as addInline but adds to dependent requests in a conditional group */
  addInlineToDependent(dependentRequests: Array<ActiveListRequest | ActiveListRelatedEntityRequest>, col: VisibleColumn, i: number): void {
    if (isRelatedColumn(col)) {
      dependentRequests.push({ inline: true, index: i });
    } else {
      this.addColToDependent(dependentRequests, col, false, ActiveListRequestTypes.COLUMN, i);
    }

    col.waitFor.forEach((wf) => {
      this.addColToDependent(dependentRequests, wf, true, isRelatedColumn(col) ? ActiveListRequestTypes.INLINE : ActiveListRequestTypes.COLUMN, i);
    });
  }

  /** Create a PseudoColumn for a condition source definition. */
  private createConditionColumn(condDef: ConditionDefinition): VisibleColumn | undefined {
    try {
      const sds = this.reference.table.sourceDefinitions;
      let condSourceWrapper: SourceObjectWrapper;
      if (condDef.sourcekey) {
        const sd = sds.getSource(condDef.sourcekey, this.tuple);
        if (!sd) {
          $log.info('condition sourcekey `' + condDef.sourcekey + '` could not be resolved.');
          return undefined;
        }
        condSourceWrapper = sd.clone({}, this.reference.table, false, this.tuple);
      } else if (condDef.source) {
        condSourceWrapper = new SourceObjectWrapper({ source: condDef.source }, this.reference.table, false, undefined, this.tuple);
      } else {
        return undefined;
      }
      return createPseudoColumn(this.reference, condSourceWrapper, this.tuple);
    } catch (e: unknown) {
      $log.info('failed to create condition column: ' + (e instanceof Error ? e.message : String(e)));
      return undefined;
    }
  }

  /**
   * Process a column or related entity that has a condition.
   * Returns true if the item was handled (either added to a conditional group or skipped).
   * Returns false if it should be processed normally (condition evaluated synchronously to show or no valid condition found).
   */
  processConditionedItem(
    resolvedCondition: ResolvedCondition,
    addToDependent: (dependentRequests: Array<ActiveListRequest | ActiveListRelatedEntityRequest>) => void,
  ): boolean {
    const condCol = this.createConditionColumn(resolvedCondition.conditionDef);
    if (!condCol) return false; // invalid condition, process normally

    const condition = new ActiveListCondition(resolvedCondition.conditionDef, condCol, this.reference, this.tuple);

    // synchronous condition already evaluated in _resolveCondition
    if (resolvedCondition.conditionHide) return true;

    // synchronous conditions (all-outbound source) without async wait_for
    // don't need a conditional group — they'll be evaluated when main data arrives
    if (!resolvedCondition.isAsync && !condition.hasWaitFor) return false;

    // condition source needs a secondary request (or has async wait_fors)
    const conditionIndex = this.conditionalGroups.length;

    // add condition source to main requests
    this.addCol(condCol, true, ActiveListRequestTypes.CONDITION, conditionIndex);

    // add condition wait_for columns to main requests
    condition.waitFor.forEach((wf) => {
      this.addCol(wf, true, ActiveListRequestTypes.CONDITION, conditionIndex);
    });

    // create dependent requests
    const dependentRequests: Array<ActiveListRequest | ActiveListRelatedEntityRequest> = [];
    addToDependent(dependentRequests);

    // create the conditional group
    this.conditionalGroups.push({
      condition,
      dependentRequests,
    });

    return true; // handled
  }

  /** Add a fkey from sourceDefinitions to allOutBounds (with dedup). */
  addAllOutBound(fkCol: ForeignKeyPseudoColumn): void {
    if (fkCol.name in this.consideredOutbounds) return;
    this.consideredOutbounds[fkCol.name] = true;
    this.allOutBounds.push(fkCol);
  }

  /**
   * Return the built ActiveList object. After calling this method, the builder should not be used anymore.
   */
  build(): ActiveList {
    return {
      requests: this.requests,
      conditionalGroups: this.conditionalGroups,
      allOutBounds: this.allOutBounds,
      selfLinks: this.selfLinks,
    };
  }
}
