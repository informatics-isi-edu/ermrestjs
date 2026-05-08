// models
import type { Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { ReferenceColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type { PseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column/pseudo-column';
import type { ForeignKeyPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column/foreign-key-pseudo-column';
import type { KeyPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column/key-pseudo-column';

// legacy
import { _getRowTemplateVariables } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/**
 * Build the `$self` (and where applicable `$_self`) template variables for a
 * given column and tuple. Consolidates the derivation logic that used to be
 * duplicated across `sourceFormatPresentation` in `ReferenceColumn`,
 * `PseudoColumn`, `ForeignKeyPseudoColumn`, `KeyPseudoColumn`, and
 * `ActiveListCondition`.
 *
 * The returned shape varies with the column:
 * - scalar sources (local column, all-outbound scalar) ⇒ `{ $self, $_self }`
 *   where `$_self` is the raw value and `$self` is `formatvalue(...)`'d.
 * - entity-mode sources (key, foreign-key, all-outbound entity, entityset) ⇒
 *   `{ $self }` only, where `$self` is the row template (`{ values, rowName, uri, ... }`).
 * - aggregates ⇒ `columnValue.templateVariables` directly (already contains
 *   `$self`/`$_self`).
 * - missing data (entity row didn't load, etc.) ⇒ `{}`.
 *
 * @param column - the column whose `$self` we are building.
 * @param mainTuple - the main record tuple. Used to source `$self`/`$_self`
 *   for any path that doesn't require an async fetch (local columns,
 *   all-outbound, key, foreign-key).
 * @param columnValue - the fetched value, only meaningful for async sources:
 *   - **entityset** (Reference.read result): a {@link Page} — `templateVariables`
 *     is read from it.
 *   - **aggregate** (column.getAggregatedValue result, unwrapped first row):
 *     `{ value, templateVariables }` — `templateVariables` is read from it.
 *   - **null/undefined** for sync sources, or before the fetch has completed
 *     (sync paths ignore it; async paths return `{}`).
 * @returns the `$self`/`$_self` slice ready to be merged into the
 *   accumulated template variables.
 */
export function buildSelfTemplateVariables(column: ReferenceColumn, mainTuple: Tuple, columnValue?: any): Record<string, any> {
  const context = (column as any)._context as string;

  // KeyPseudoColumn: $self is row-level template variables from mainTuple.data
  if ((column as any).isKey) {
    const keyCol = column as KeyPseudoColumn;
    return {
      $self: _getRowTemplateVariables(keyCol.table, context, mainTuple.data),
    };
  }

  // ForeignKeyPseudoColumn: $self is row-level template variables from linkedData
  if ((column as any).isForeignKey) {
    const fkCol = column as ForeignKeyPseudoColumn;
    if (!mainTuple.linkedData[fkCol.name]) {
      return {};
    }
    return {
      $self: _getRowTemplateVariables(fkCol.table, context, mainTuple.linkedData[fkCol.name]),
    };
  }

  // PseudoColumn (path-based source column)
  if ((column as any).isPathColumn) {
    const pseudoCol = column as PseudoColumn;

    // aggregate: use precomputed templateVariables from the fetched value
    if (pseudoCol.hasAggregate && columnValue) {
      return columnValue.templateVariables || {};
    }

    // all-outbound (isUnique): use mainTuple.linkedData
    if (pseudoCol.hasPath && pseudoCol.isUnique) {
      if (!mainTuple.linkedData[pseudoCol.name]) {
        return {};
      }
      // scalar
      if (!pseudoCol.isEntityMode) {
        const baseCol = pseudoCol.baseColumn;
        return {
          $self: baseCol.formatvalue(mainTuple.linkedData[pseudoCol.name][baseCol.name], context),
          $_self: mainTuple.linkedData[pseudoCol.name][baseCol.name],
        };
      }
      // entity
      return {
        $self: _getRowTemplateVariables(pseudoCol.table, context, mainTuple.linkedData[pseudoCol.name]),
      };
    }

    // entityset: use templateVariables from the page result
    if (columnValue && columnValue.templateVariables) {
      return columnValue.templateVariables;
    }

    // other paths with a base column (scalar)
    if (pseudoCol.baseColumn) {
      return {
        $self: pseudoCol.baseColumn.formatvalue(mainTuple.data[pseudoCol.baseColumn.name], context),
        $_self: mainTuple.data[pseudoCol.baseColumn.name],
      };
    }

    return {};
  }

  // Base ReferenceColumn (non-pseudo, simple column)
  const baseCol = column.baseColumns[0];
  if (baseCol) {
    return {
      $self: baseCol.formatvalue(mainTuple.data[baseCol.name], context),
      $_self: mainTuple.data[baseCol.name],
    };
  }

  return {};
}
