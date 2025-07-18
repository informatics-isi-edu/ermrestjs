// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// legacy
import { Column, ForeignKeyRef, Table } from '@isrd-isi-edu/ermrestjs/js/core';
import { Tuple } from '@isrd-isi-edu/ermrestjs/js/reference';
import { SourceObjectWrapper } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

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

  constructor(
    table: Table,
    columns: Column[],
    fkeys: ForeignKeyRef[],
    sources: Record<string, SourceObjectWrapper>,
    sourceMapping: Record<string, string[]>,
    sourceDependencies: Record<string, string[]>,
  ) {
    this.table = table;
    this.columns = columns;
    this.fkeys = fkeys;
    this.sources = sources;
    this.sourceMapping = sourceMapping;
    this.sourceDependencies = sourceDependencies;
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
   * @param sourcekey The key of the source definition.
   * @returns The source definition or undefined if not found.
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
