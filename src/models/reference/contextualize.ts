// services
import CatalogSerivce from '@isrd-isi-edu/ermrestjs/src/services/catalog';

// models
import { type Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// utils
import { _constraintTypes, _contexts, FILTER_TYPES } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _FacetsLogicalOperators } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import { _sourceColumnHelpers } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

/**
 * Contructs the Contextualize object.
 *
 * Usage:
 * Clients _do not_ directly access this constructor.
 * See {@link Reference#contextualize}
 *
 * It will be used for creating contextualized references.
 */
export class Contextualize {
  private _reference: Reference;

  constructor(reference: Reference) {
    this._reference = reference;
  }

  /**
   * The _record_ context of this reference.
   */
  get detailed(): Reference {
    return this._contextualize(_contexts.DETAILED);
  }

  /**
   * The _compact_ context of this reference.
   */
  get compact(): Reference {
    return this._contextualize(_contexts.COMPACT);
  }

  /**
   * The _compact/brief_ context of this reference.
   */
  get compactBrief(): Reference {
    return this._contextualize(_contexts.COMPACT_BRIEF);
  }

  /**
   * The _compact/select_ context of this reference.
   */
  get compactSelect(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT);
  }

  /**
   * The _compact/select/association_ context of this reference.
   */
  get compactSelectAssociation(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_ASSOCIATION);
  }

  /**
   * The _compact/select/association/link_ context of this reference.
   */
  get compactSelectAssociationLink(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_ASSOCIATION_LINK);
  }

  /**
   * The _compact/select/association/unlink_ context of this reference.
   */
  get compactSelectAssociationUnlink(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_ASSOCIATION_UNLINK);
  }

  /**
   * The _compact/select/foreign_key_ context of this reference.
   */
  get compactSelectForeignKey(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_FOREIGN_KEY);
  }

  /**
   * The _compact/select/foreign_key/bulk_ context of this reference.
   */
  get compactSelectBulkForeignKey(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_BULK_FOREIGN_KEY);
  }

  /**
   * The _compact/select/saved_queries_ context of this reference.
   */
  get compactSelectSavedQueries(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_SAVED_QUERIES);
  }

  /**
   * The _compact/select/show_more_ context of this reference.
   */
  get compactSelectShowMore(): Reference {
    return this._contextualize(_contexts.COMPACT_SELECT_SHOW_MORE);
  }

  /**
   * The _entry_ context of this reference.
   */
  get entry(): Reference {
    return this._contextualize(_contexts.ENTRY);
  }

  /**
   * The _entry/create_ context of this reference.
   */
  get entryCreate(): Reference {
    return this._contextualize(_contexts.CREATE);
  }

  /**
   * The _entry/edit_ context of this reference.
   */
  get entryEdit(): Reference {
    return this._contextualize(_contexts.EDIT);
  }

  /**
   * The _entry/compact_ context of this reference.
   */
  get compactEntry(): Reference {
    return this._contextualize(_contexts.COMPACT_ENTRY);
  }

  /**
   * get compactBriefInline - The compact brief inline context of the reference
   */
  get compactBriefInline(): Reference {
    return this._contextualize(_contexts.COMPACT_BRIEF_INLINE);
  }

  /**
   * get Export - export context
   */
  get export(): Reference {
    return this._contextualize(_contexts.EXPORT);
  }

  /**
   * get exportCompact - export context for compact view
   */
  get exportCompact(): Reference {
    return this._contextualize(_contexts.EXPORT_COMPACT);
  }

  /**
   * get exportDetailed - export context for detailed view
   */
  get exportDetailed(): Reference {
    return this._contextualize(_contexts.EXPORT_DETAILED);
  }

  private _contextualize(context: string): Reference {
    const source = this._reference;

    const newRef = source.copy();
    newRef.setContext(isStringAndNotEmpty(context) ? context : '');

    // use the base table to get the alternative table of that context.
    // a base table's .baseTable is itself
    const newTable = source.table._baseTable._getAlternativeTable(context);
    const catalog = newTable.schema.catalog;

    /**
     * cases:
     *   1. same table: do nothing
     *   2. has join
     *       2.1. source is base, newTable is alternative:
     *           - If the join is on the alternative shared key, swap the joins.
     *       2.2. otherwise: use join
     *   3. has facets
     *       3.1. source is base, newTable is alternative, go through filters
     *           3.1.1. If first foreign is from base to alternative, remove it.
     *           3.1.2. otherwise add a fk from alternative to base.
     *       3.2. source is alternative, newTable is base, go through filters
     *           3.1.1. If first foreign is from alternative to base, remove it.
     *           3.1.2. otherwise add a fk from base to alternative.
     *       3.3. source is alternative, newTable is alternative, go through filters
     *           3.1.1. If first foreign is to base, change the first foreignkey to be from the newTable to main.
     *           3.1.2. otherwise add fk from newTable to main table, and from main table to source.
     *   4. doesn't have join
     *       4.1. no filter: swap table and update location only
     *       4.2. has filter
     *           4.2.1. single entity filter using shared key: swap table and convert filter to mapped columns (TODO alt to alt)
     *           4.2.2. otherwise: use join
     *
     * NOTE:
     * If switched to a new table (could be a base table or alternative table)
     * need to update reference's table, key, displayname, location
     * modifiers are not kept because columns are not guarenteed to exist when we switch to another table
     */
    if (newTable !== source.table) {
      // swap to new table
      newRef.setNewTable(newTable);

      let newLocationString: string | undefined;
      const newFacetFilters: any[] = [];

      if (source.location.hasJoin) {
        // returns true if join is on alternative shared key
        const joinOnAlternativeKey = (): boolean => {
          // NOTE in some cases the join must be based on
          // aliases and we don't have the column data (share path logic)
          if (!source.location.lastJoin.hasColumnMapping) return false;

          const joinCols = source.location.lastJoin.toCols;
          const keyCols = source.table._baseTable._altSharedKey.colset.columns;

          if (joinCols.length !== keyCols.length) {
            return false;
          }

          return keyCols.every((keyCol) => {
            return joinCols.some((joinCol: any) => joinCol.name === keyCol.name);
          });
        };

        // creates the new join
        const generateJoin = (): string => {
          /*
           * let's assume we have T1, T1_alt, and T2
           * last join is from T2 to T1-> T2/(id)=(T1:id)
           * now we want to change this to point to T1_alt, to do this we can
           * T2/(id)=(T1:id)/(id)=(T1_alt:id) but the better way is
           * T2/(id)=(T1_alt:id)
           * so we need to map the T1 key that is used in the join to T1_alt key.
           * we can do this only if we know the mapping between foreignkey and key (which is true in this case).
           */

          const currJoin = source.location.lastJoin;
          const newRightCols: string[] = [];
          let col: any;

          for (let i = 0; i < currJoin.toCols.length; i++) {
            // find the column object
            col = source.table.columns.get(currJoin.toCols[i]);

            // map the column from source table to alternative table
            col = newTable._altForeignKey.mapping.getFromColumn(col);

            // the first column must have schema and table name
            newRightCols.push(i === 0 ? col.toString() : fixedEncodeURIComponent(col.name));
          }

          return '(' + currJoin.fromColsStr + ')=(' + newRightCols.join(',') + ')';
        };

        // 2.1. if _altSharedKey is the same as the join
        if (!source.table._isAlternativeTable() && newTable._isAlternativeTable() && joinOnAlternativeKey()) {
          // change to-columns of the join
          newLocationString = source.location.compactUri;

          // remove the last join
          newLocationString = newLocationString.substring(0, newLocationString.lastIndexOf('/') + 1);

          // add the new join
          newLocationString += generateJoin();
        }
      } else if (source.location.facets) {
        //TODO needs refactoring
        const currentFacets = JSON.parse(JSON.stringify(source.location.facets.decoded[_FacetsLogicalOperators.AND]));

        // facetColumns is applying extra logic for alternative, and it only
        // makes sense in the context of facetColumns list. not here.
        // Therefore we should go based on the facets on the location object, not facetColumns.
        // TODO should be modified to support the alternative syntaxes
        const modifyFacetFilters = (funct: (f: any, fk: any) => any): void => {
          currentFacets.forEach((f: any) => {
            if (!f.source) return;

            let fk = null;

            //‌ُ TODO this should not be called here, we should refactor this part later
            if (_sourceColumnHelpers._sourceHasNodes(f.source)) {
              let cons: any;
              let isInbound = false;

              if ('inbound' in f.source[0]) {
                cons = f.source[0].inbound;
                isInbound = true;
              } else if ('outbound' in f.source[0]) {
                cons = f.source[0].outbound;
              } else {
                return;
              }

              const fkObj = CatalogSerivce.getConstraintObject(catalog.id, cons[0], cons[1]);
              if (fkObj === undefined || fkObj === null || fkObj.subject !== _constraintTypes.FOREIGN_KEY) {
                return;
              }

              fk = { obj: fkObj.object, isInbound: isInbound };
            }

            newFacetFilters.push(funct(f, fk));
          });
        };

        // TODO FILTER_IN_SOURCE
        // source: main table newTable: alternative
        if (!source.table._isAlternativeTable() && newTable._isAlternativeTable()) {
          modifyFacetFilters((facetFilter: any, firstFk: any) => {
            if (firstFk && firstFk.isInbound && firstFk.obj.table === newTable) {
              facetFilter.source.shift();
              if (facetFilter.source.length === 1) {
                facetFilter.source = facetFilter.source[0];
              }
            } else {
              if (!Array.isArray(facetFilter.source)) {
                facetFilter.source = [facetFilter.source];
              }
              facetFilter.source.unshift({ outbound: newTable._altForeignKey.constraint_names[0] });
            }
            return facetFilter;
          });
        }
        // source: alternative newTable: main table
        else if (source.table._isAlternativeTable() && !newTable._isAlternativeTable()) {
          modifyFacetFilters((facetFilter: any, firstFk: any) => {
            if (firstFk && !firstFk.isInbound && firstFk.obj.key.table === newTable) {
              facetFilter.source.shift();
              if (facetFilter.source.length == 1) {
                facetFilter.source = facetFilter.source[0];
              }
            } else {
              if (!Array.isArray(facetFilter.source)) {
                facetFilter.source = [facetFilter.source];
              }
              facetFilter.source.unshift({ inbound: source.table._altForeignKey.constraint_names[0] });
            }
            return facetFilter;
          });
        }
        // source: alternative newTable: alternative
        else {
          modifyFacetFilters((facetFilter: any, firstFk: any) => {
            if (firstFk && !firstFk.isInbound && firstFk.obj.key.table === newTable._baseTable) {
              facetFilter.source[0] = { outbound: newTable._altForeignKey.constraint_names[0] };
            } else {
              if (!Array.isArray(facetFilter.source)) {
                facetFilter.source = [facetFilter.source];
              }
              facetFilter.source.unshift(
                { outbound: newTable._altForeignKey.constraint_names[0] },
                { inbound: source.table._altForeignKey.constraint_names[0] },
              );
            }
            return facetFilter;
          });
        }

        newLocationString =
          source.location.service +
          '/catalog/' +
          catalog.id +
          '/' +
          source.location.api +
          '/' +
          fixedEncodeURIComponent(newTable.schema.name) +
          ':' +
          fixedEncodeURIComponent(newTable.name);
      } else {
        if (source.location.filter === undefined) {
          // 4.1 no filter
          newLocationString =
            source.location.service +
            '/catalog/' +
            catalog.id +
            '/' +
            source.location.api +
            '/' +
            fixedEncodeURIComponent(newTable.schema.name) +
            ':' +
            fixedEncodeURIComponent(newTable.name);
        } else {
          // 4.2.1 single entity key filter (without any join), swap table and switch to mapping key
          // filter is single entity if it is binary filters using the shared key of the alternative tables
          // or a conjunction of binary predicate that is a key of the alternative tables

          // use base table's alt shared key
          const sharedKey = source.table._baseTable._altSharedKey;
          const filter = source.location.filter;
          let filterString: string;

          // binary filters using shared key
          if (filter.type === FILTER_TYPES.BINARYPREDICATE && filter.operator === '=' && sharedKey.colset.length() === 1) {
            // filter using shared key
            if (
              (source.table._isAlternativeTable() && filter.column === source.table._altForeignKey.colset.columns[0].name) ||
              (!source.table._isAlternativeTable() && filter.column === sharedKey.colset.columns[0].name)
            ) {
              if (newTable._isAlternativeTable()) {
                // to alternative table
                filterString = fixedEncodeURIComponent(newTable._altForeignKey.colset.columns[0].name) + '=' + filter.value;
              } else {
                // to base table
                filterString = fixedEncodeURIComponent(sharedKey.colset.columns[0].name) + '=' + filter.value;
              }

              newLocationString =
                source.location.service +
                '/catalog/' +
                catalog.id +
                '/' +
                source.location.api +
                '/' +
                fixedEncodeURIComponent(newTable.schema.name) +
                ':' +
                fixedEncodeURIComponent(newTable.name) +
                '/' +
                filterString;
            }
          } else if (filter.type === FILTER_TYPES.CONJUNCTION && filter.filters.length === sharedKey.colset.length()) {
            // check that filter is shared key
            let keyColNames: string[];
            if (source.table._isAlternativeTable()) {
              keyColNames = source.table._altForeignKey.colset.columns.map((column: any) => {
                return column.name;
              });
            } else {
              keyColNames = sharedKey.colset.columns.map((column: any) => {
                return column.name;
              });
            }

            const filterColNames = filter.filters.map((f: any) => {
              return f.column;
            });

            // all shared key columns must be used in the filters
            if (
              keyColNames.every((keyColName: string) => {
                return filterColNames.indexOf(keyColName) !== -1;
              })
            ) {
              // every filter is binary predicate of "="
              if (
                filter.filters.every((f: any) => {
                  return f.type === FILTER_TYPES.BINARYPREDICATE && f.operator === '=';
                })
              ) {
                // find column mapping from source to newRef
                const mapping: { [key: string]: string } = {};
                let newCol: any;
                if (!source.table._isAlternativeTable() && newTable._isAlternativeTable()) {
                  // base to alternative
                  sharedKey.colset.columns.forEach((column) => {
                    newCol = newTable._altForeignKey.mapping.getFromColumn(column);
                    mapping[column.name] = newCol.name;
                  });
                } else if (source.table._isAlternativeTable() && !newTable._isAlternativeTable()) {
                  // alternative to base
                  source.table._altForeignKey.colset.columns.forEach((column) => {
                    newCol = source.table._altForeignKey.mapping.get(column);
                    mapping[column.name] = newCol.name;
                  });
                } else {
                  // alternative to alternative
                  source.table._altForeignKey.colset.columns.forEach((column) => {
                    const baseCol = source.table._altForeignKey.mapping.get(column); // alt 1 col -> base col
                    newCol = newTable._altForeignKey.mapping.getFromColumn(baseCol); // base col -> alt 2
                    mapping[column.name] = newCol.name;
                  });
                }

                filterString = '';

                for (let j = 0; j < filter.filters.length; j++) {
                  const f = filter.filters[j];
                  // map column
                  filterString += (j === 0 ? '' : '&') + fixedEncodeURIComponent(mapping[f.column]) + '=' + fixedEncodeURIComponent(f.value);
                }

                newLocationString =
                  source.location.service +
                  '/catalog/' +
                  catalog.id +
                  '/' +
                  source.location.api +
                  '/' +
                  fixedEncodeURIComponent(newTable.schema.name) +
                  ':' +
                  fixedEncodeURIComponent(newTable.name) +
                  '/' +
                  filterString;
              }
            }
          }
        }
      }

      if (!newLocationString) {
        // all other cases (2.2., 3.2.2), use join
        let join: string;
        if (source.table._isAlternativeTable() && newTable._isAlternativeTable()) {
          join = source.table._altForeignKey.toString(true) + '/' + newTable._altForeignKey.toString();
        } else if (!source.table._isAlternativeTable()) {
          // base to alternative
          join = newTable._altForeignKey.toString();
        } else {
          // alternative to base
          join = source.table._altForeignKey.toString(true);
        }
        newLocationString = source.location.compactUri + '/' + join;
      }

      //add the query parameters
      if (source.location.queryParamsString) {
        newLocationString += '?' + source.location.queryParamsString;
      }

      newRef.setLocation(parse(newLocationString, catalog));

      // change the face filters
      if (newFacetFilters.length > 0) {
        newRef.location.facets = { and: newFacetFilters };
      }
    }

    return newRef;
  }
}
