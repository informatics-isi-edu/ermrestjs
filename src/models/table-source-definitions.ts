// models
import { Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// legacy
import { Column, ForeignKeyRef, Table } from '@isrd-isi-edu/ermrestjs/js/core';

/**
 * Defines a condition that controls visibility of a column or related entity.
 * Used in source-definitions annotation under the `conditions` key, or inline
 * on a column-directive via `condition` / `condition_key`.
 */
export type ConditionDefinition = {
  /** reference to an existing sourcekey whose data determines the condition */
  sourcekey?: string;
  /** inline source path (alternative to sourcekey) */
  source?: unknown;
  /** behavior when condition source returns empty: "hide" (default) or "show" */
  on_empty?: 'show' | 'hide';
  /** optional Mustache template — evaluated with $self, no markdown rendering */
  condition_pattern?: string;
};

/**
 * Result of Table.sourceDefinitions
 */
class TableSourceDefinitions {
  /**
   * the table that these source definitions are for
   */
  private table: Table;
  /**
   * columns that will be available in the templating environment
   */
  columns: Column[] = [];
  /**
   * foreign keys that will be available in the templating environment
   */
  fkeys: ForeignKeyRef[] = [];
  /**
   * valid source-definitions
   * NOTE: if the source has a filter, this will not validate it and so should not be
   * used directly.
   */
  private sources: Record<string, SourceObjectWrapper> = {};
  /**
   * mapping of hash to the defined source names.
   */
  sourceMapping: Record<string, string[]> = {};
  /**
   * for each sourcekey, what are the other sourcekeys that it depends on (includes self as well)
   * this has been added because of path prefix where a sourcekey might rely on other sourcekeys
   */
  sourceDependencies: Record<string, string[]> = {};
  /**
   * reusable condition definitions defined in the source-definitions annotation
   */
  private conditions: Record<string, ConditionDefinition> = {};

  constructor(
    table: Table,
    columns: Column[],
    fkeys: ForeignKeyRef[],
    sources: Record<string, SourceObjectWrapper>,
    sourceMapping: Record<string, string[]>,
    sourceDependencies: Record<string, string[]>,
    conditions: Record<string, ConditionDefinition> = {},
  ) {
    this.table = table;
    this.columns = columns;
    this.fkeys = fkeys;
    this.sources = sources;
    this.sourceMapping = sourceMapping;
    this.sourceDependencies = sourceDependencies;
    this.conditions = conditions;
  }

  /**
   * Get a condition definition by its key.
   * @param key The key of the condition definition.
   * @returns The condition definition or undefined if not found.
   */
  getCondition(key: string): ConditionDefinition | undefined {
    return this.conditions[key];
  }

  /**
   * Get all valid source definitions for the table.
   * This will process the filter nodes of each source definition and return only those that do not
   * throw an error when processing the filter nodes.
   * @param mainTuple The main tuple to use for processing the filter nodes.
   * @returns the valid source definitions.
   */
  getSources(mainTuple?: Tuple): Record<string, SourceObjectWrapper> {
    const validSources: Record<string, SourceObjectWrapper> = {};
    for (const sourcekey in this.sources) {
      const sd = this.sources[sourcekey];
      try {
        void sd.processFilterNodes(mainTuple);
        validSources[sourcekey] = sd;
      } catch (exp: unknown) {
        // if the source definition has a filter, it will throw an error if the filter is
        const message = `source definition, table =${this.table.name}, name=${sourcekey}`;
        $log.info(`${message}: ${exp instanceof Error ? exp.message : String(exp)}`);
      }
    }
    return validSources;
  }

  /**
   * Get a source definition by its key.
   * This will also make sure the filter nodes are processed and valid.
   * @param sourcekey The key of the source definition.
   * @param mainTuple The main tuple to use for processing the filter nodes.
   * @returns The source object wrapper or undefined if not found.
   */
  getSource(sourcekey: string, mainTuple?: Tuple): SourceObjectWrapper | undefined {
    const sd = this.sources[sourcekey];

    if (!sd || !sd.processFilterNodes(mainTuple, true).success) {
      return undefined;
    }

    return sd;
  }
}

export default TableSourceDefinitions;
