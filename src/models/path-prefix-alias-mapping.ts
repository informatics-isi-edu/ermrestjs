import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _specialSourceDefinitions } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { Table } from '@isrd-isi-edu/ermrestjs/js/core';

/**
 * This class is used for the shared prefix logic.
 */
class PathPrefixAliasMapping {
  /**
   * Aliases that already mapped to a join statement
   * <sourcekey> -> <alias>
   */
  public aliases: Record<string, string> = {};

  /**
   * sourcekeys that are used more than once and require alias
   * <sourcekey> -> value is not important
   */
  public usedSourceKeys: Record<string, number> = {};

  /**
   * The index of last added alias
   */
  public lastIndex: number = 0;

  /**
   * The aliases that must be used for the given sourcekeys
   * <sourcekey> -> <alias>
   */
  public forcedAliases: Record<string, string> = {};

  /**
   * @param forcedAliases        The aliases that must be used for the given sourcekeys
   * @param usedSourceObjects The source objects that are used in the url
   *                                      (used for populating usedSourceKeys)
   * @param rootTable    The table that the source objects start from
   *                                      (used for populating usedSourceKeys)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(forcedAliases?: Record<string, string>, usedSourceObjects?: any[], rootTable?: Table) {
    if (isObjectAndNotNull(forcedAliases)) {
      this.forcedAliases = forcedAliases!;
    }

    // populate the this.usedSourceKeys based on the given objects
    this._populateUsedSourceKeys(usedSourceObjects, rootTable);
  }

  private _addToSourceKey(key: string, rootTable: Table): void {
    if (!(key in rootTable.sourceDefinitions.sourceDependencies)) return;

    rootTable.sourceDefinitions.sourceDependencies[key].forEach((dep: string) => {
      if (dep in this.usedSourceKeys) {
        this.usedSourceKeys[dep]++;
      } else {
        this.usedSourceKeys[dep] = 1;
      }
    });
  }

  /**
   * Given an array of source objects will populate the used source keys
   * in the given first parameter.
   * NOTE: this function doesn't account for cases where a recursive path
   * is used twice. for example assume the following scenario:
   * {
   *   "key1": {
   *     "source": [{"inbound": ["s", "const"]}, "RID"]
   *   },
   *   "key1_i1": {
   *     "source": [{"sourcekey": "key1"}, {"inbound": ["s", "const2"]}, "RID"]
   *   },
       "key1_key1_i1": {
   *     "source": [{"sourcekey": "key1_i1"}, {"inbound": ["s", "const3"]}, "RID"]
   *   }
   * }
   * if "key1_i1" and "key1_key1_i1" are used in multiple sources, then it will include "key1" as well as
   * "key1_i1" as part of usedSourcekeys even though adding alias for "key1_i1" is enough and
   * we don't need any for "key1".
   *
   * @param sources the source objects that are used in the url
   * @param rootTable the table that the source objects start from
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _populateUsedSourceKeys(sources?: any[], rootTable?: Table): void {
    if (!Array.isArray(sources) || sources.length === 0 || !rootTable) return;

    sources.forEach((srcObj) => {
      if (!isObjectAndNotNull(srcObj)) return;

      if (typeof srcObj.sourcekey === 'string') {
        if (srcObj.sourcekey === _specialSourceDefinitions.SEARCH_BOX) {
          // add the search columns as well
          if (rootTable.searchSourceDefinition && Array.isArray(rootTable.searchSourceDefinition.columns)) {
            rootTable.searchSourceDefinition.columns.forEach((col: any, index: number) => {
              // if the all are coming from the same path prefix, just look at the first one
              if (index > 0 && rootTable.searchSourceDefinition && rootTable.searchSourceDefinition.allSamePathPrefix) {
                return;
              }
              if (col.sourceObject && col.sourceObject.sourcekey) {
                this._addToSourceKey(col.sourceObject.sourcekey, rootTable);
              } else if (col.sourceObjectNodes.length > 0 && col.sourceObjectNodes[0].isPathPrefix) {
                this._addToSourceKey(col.sourceObjectNodes[0].pathPrefixSourcekey, rootTable);
              }
            });
          }
          return;
        }
        this._addToSourceKey(srcObj.sourcekey, rootTable);
        return;
      }

      if (!Array.isArray(srcObj.source) || !isStringAndNotEmpty(srcObj.source[0].sourcekey)) {
        return;
      }
      // if this is the case, then it's an invalid url that will throw error later
      if (srcObj.source[0].sourcekey === _specialSourceDefinitions.SEARCH_BOX) {
        return;
      }
      this._addToSourceKey(srcObj.source[0].sourcekey, rootTable);
    });

    for (const k in this.usedSourceKeys) {
      if (this.usedSourceKeys[k] < 2) delete this.usedSourceKeys[k];
    }
  }
}

export default PathPrefixAliasMapping;
