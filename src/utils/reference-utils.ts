// models
import { InvalidPageCriteria, InvalidSortCriteria, UnsupportedFilters } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import SourceObjectWrapper, { FacetObjectGroupWrapper } from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import {
  AssetPseudoColumn,
  FacetColumn,
  FacetGroup,
  ForeignKeyPseudoColumn,
  InboundForeignKeyPseudoColumn,
  KeyPseudoColumn,
  PseudoColumn,
  ReferenceColumn,
  VirtualColumn,
} from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import {
  generateRelatedReference,
  type Reference,
  type RelatedReference,
  type Tuple,
  type VisibleColumn,
} from '@isrd-isi-edu/ermrestjs/src/models/reference';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

// utils
import { fixedEncodeURIComponent, shallowCopyExtras, simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { isObjectAndNotNull, isStringAndNotEmpty, isInteger } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { createPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';
import {
  _ERMrestFeatures,
  _nonSortableTypes,
  _parserAliases,
  _specialSourceDefinitions,
  _sourceDefinitionAttributes,
  _contexts,
  _annotations,
  _FacetsLogicalOperators,
  _displayTypes,
  _compactFacetingContexts,
  _warningMessages,
  _constraintTypes,
  _systemColumns,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy imports
import { _sourceColumnHelpers, _facetColumnHelpers } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';
import { _getSearchTerm, Location } from '@isrd-isi-edu/ermrestjs/js/parser';
import {
  _getAnnotationValueByContext,
  _getRecursiveAnnotationValue,
  _getHierarchicalDisplayAnnotationValue,
  _processColumnOrderList,
  _isEntryContext,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import type { ForeignKeyRef, Column, Key } from '@isrd-isi-edu/ermrestjs/js/core';

export interface ReadPathResult {
  value: string;
  isAttributeGroup: boolean;
}

export type ValidatedFacetFilters = {
  facetObjectWrappers: Array<SourceObjectWrapper | FacetObjectGroupWrapper>;
  newFilters: Array<any>;
  issues: UnsupportedFilters | null;
};

export type ReferenceDisplay = {
  /**
   * The display type ('table', 'markdown', or 'module')
   */
  type: string;
  /**
   * Whether to hide the row count
   */
  hideRowCount: boolean;
  /**
   * Whether faceting is enabled
   */
  showFaceting: boolean;
  /**
   * Maximum facet depth allowed
   */
  maxFacetDepth: number;
  /**
   * Whether the facet panel should be open by default
   */
  facetPanelOpen: boolean | null;
  /**
   * whether to show the saved query panel
   */
  showSavedQuery: boolean;
  /**
   * used for computing "custom display" for related tables
   */
  _separator: string;
  /**
   * used for computing "custom display" for related tables
   */
  _prefix: string;
  /**
   * used for computing "custom display" for related tables
   */
  _suffix: string;
  /**
   * how to order the rows
   */
  _rowOrder?: Array<
    | {
        column: Column;
        descending: boolean;
      }
    | {
        num_occurrences: true;
        descending: boolean;
      }
  >;

  /**
   * default page size (25)
   */
  defaultPageSize?: number;
  /**
   * whether the column headers should be hidden (in record page)
   */
  hideColumnHeaders?: boolean;
  /**
   * whether the toc should be collapsed (in record page)
   */
  collapseToc?: boolean;
  /**
   * The template engine to use with the markdown patterns
   */
  templateEngine?: string;
  /**
   * The markdown pattern to use for the page
   */
  _pageMarkdownPattern?: string;
  /**
   * The markdown pattern to use for the row
   */
  _rowMarkdownPattern?: string;
  /**
   * the wait-fors that the markdown pattern has
   */
  sourceWaitFor: Array<VisibleColumn>;
  /**
   * whether the markdown pattern has any wait-fors
   */
  sourceHasWaitFor: boolean;
  /**
   * the markdown pattern defined on the source def
   */
  sourceMarkdownPattern?: string;
  /**
   * the template engine to use with the source markdown pattern
   */
  sourceTemplateEngine?: string;
};

/**
 * Computes the actual path that will be used for read request.
 * It will return an object that will have:
 *  - value: the string value of the path
 *  - isAttributeGroup: whether we should use attributegroup api or not.
 *                      (if the reference doesn't have any fks, we don't need to use attributegroup)
 * NOTE Might throw an error if modifiers are not valid
 * @param reference The reference object
 * @param useEntity whether we should use entity api or not (if true, we won't get foreignkey data)
 * @param getTRS whether we should fetch the table-level row acls (if table supports it)
 * @param getTCRS whether we should fetch the table-level and column-level row acls (if table supports it)
 * @param getUnlinkTRS whether we should fetch the acls of association
 *                     table. Use this only if the association is based on facet syntax
 */
export function computeReadPath(
  reference: Reference | RelatedReference,
  useEntity?: boolean,
  getTRS?: boolean,
  getTCRS?: boolean,
  getUnlinkTRS?: boolean,
): ReadPathResult {
  const allOutBounds = reference.activeList.allOutBounds;
  const findAllOutBoundIndex = (name: string) => allOutBounds.findIndex((aob) => aob.name === name);

  const hasSort = Array.isArray(reference.location.sortObject) && reference.location.sortObject.length !== 0;
  const locationPath = reference.location.path;
  const fkAliasPrefix = _parserAliases.FOREIGN_KEY_PREFIX;
  const allOutBoundUsedAliases: string[] = [];
  const _modifiedSortObject: any[] = []; // the sort object that is used for url creation (if location has sort).
  const allOutBoundSortMap: { [key: string]: any } = {}; // maps an alias to PseudoColumn, used for sorting
  let sortObject: any; // the sort that will be accessible by reference._location.sortObject
  const sortColNames: { [key: string]: boolean } = {}; // to avoid adding duplicate columns
  const sortObjectNames: { [key: string]: boolean } = {}; // to avoid computing sortObject logic more than once
  let addSort: boolean;
  let hasFKSort = false;
  let sortCols: any;
  let col: any;

  // make sure the page and modified sort object have the same length
  const checkPageObject = (loc: Location, sortObject?: any) => {
    sortObject = sortObject || loc.sortObject;
    if (loc.afterObject && loc.afterObject.length !== sortObject.length) {
      throw new InvalidPageCriteria('sort and after should have the same number of columns.', locationPath);
    }

    if (loc.beforeObject && loc.beforeObject.length !== sortObject.length) {
      throw new InvalidPageCriteria('sort and before should have the same number of columns.', locationPath);
    }

    return true;
  };

  /** Check the sort object. Does not change the `reference.location` object.
   *   - Throws an error if the column doesn't exist or is not sortable.
   *   - maps the sorting to its sort columns.
   *       - for columns it's straightforward and uses the actual column name.
   *       - for PseudoColumns we need
   *           - A new alias: F# where the # is a positive integer.
   *           - The sort column name must be the "foreignkey_alias:column_name".
   * */
  const processSortObject = (ref: Reference) => {
    let colName: string;
    let desc: boolean;

    for (let i = 0, k = 1; i < sortObject.length; i++) {
      // find the column in ReferenceColumns
      try {
        col = ref.getColumnByName(sortObject[i].column);
      } catch {
        throw new InvalidSortCriteria('Given column name `' + sortObject[i].column + '` in sort is not valid.', locationPath);
      }
      // sortObject[i].column = col.name;

      // column is not sortable
      if (!col.sortable) {
        throw new InvalidSortCriteria('Column ' + sortObject[i].column + ' is not sortable.', locationPath);
      }

      // avoid computing columns twice
      if (sortObject[i].column in sortObjectNames) {
        continue;
      }
      sortObjectNames[sortObject[i].column] = true;
      addSort = true;

      sortCols = col._sortColumns;

      // use the sort columns instead of the actual column.
      for (let j = 0; j < sortCols.length; j++) {
        if (col.isForeignKey || (col.isPathColumn && col.isUnique)) {
          // TODO if the code asks for entity read,
          // we should make sure only include the ones that are needed
          // for sort, but currently we're just switching to attributegroup
          hasFKSort = true;

          // the column must be part of outbounds, so we don't need to check for it
          // NOTE what about the backward compatibility code?
          const fkIndex = findAllOutBoundIndex(col.name);
          // create a new projection alias to be used for this sort column
          colName = fkAliasPrefix + (allOutBounds.length + k++);
          // store the actual column name and foreignkey info for later
          // the alias used for the fk might be different from what we expect now
          // (because of the shared prefix code)
          allOutBoundSortMap[colName] = {
            fkIndex: fkIndex,
            colName: fixedEncodeURIComponent(sortCols[j].column.name),
          };
        } else {
          colName = sortCols[j].column.name;
          if (colName in sortColNames) {
            addSort = false;
          }
          sortColNames[colName] = true;
        }

        desc = sortObject[i].descending !== undefined ? sortObject[i].descending : false;
        // if descending is true on the column_order, then the sort should be reverted
        if (sortCols[j].descending) {
          desc = !desc;
        }

        if (addSort) {
          _modifiedSortObject.push({
            column: colName,
            descending: desc,
          });
        }
      }
    }
  };

  if (hasSort) {
    sortObject = reference.location.sortObject;
    processSortObject(reference);
  }
  // use row-order if sort was not provided
  else if (reference.display._rowOrder) {
    sortObject = reference.display._rowOrder.map(function (ro: any) {
      return { column: ro.column.name, descending: ro.descending };
    });
    processSortObject(reference);
  }

  // ermrest requires key columns to be in sort param for paging
  if (typeof sortObject !== 'undefined') {
    // if any of the sortCols is a key, then we don't need to add the shortest key
    const hasKey = reference.table.keys.all().some(function (key: any) {
      // all the columns in the key must be not-null
      return (
        key._notNull &&
        key.colset.columns.every(function (c: any) {
          return c.name in sortColNames;
        })
      );
    });

    if (!hasKey) {
      for (let i = 0; i < reference.shortestKey.length; i++) {
        // all the key columns
        col = reference.shortestKey[i].name;
        // add if key col is not in the sortby list
        if (!(col in sortColNames)) {
          sortObject.push({ column: col, descending: false }); // add key to sort
          _modifiedSortObject.push({ column: col, descending: false });
        }
      }
    }
  } else {
    // no sort provided: use shortest key for sort
    sortObject = [];
    for (let sk = 0; sk < reference.shortestKey.length; sk++) {
      col = reference.shortestKey[sk];
      // make sure the column is sortable based on model
      if (_nonSortableTypes.indexOf(col.type.name) === -1) {
        sortObject.push({ column: col.name, descending: false });
      }
    }
  }

  // this will update location.sort and all the uri and path
  reference.location.sortObject = sortObject;

  let uri = reference.location.ermrestCompactPath; // used for the http request

  const associationRef = (reference as RelatedReference).derivedAssociationReference;
  const associationTableAlias = _parserAliases.ASSOCIATION_TABLE;

  let isAttributeGroup = hasFKSort || !useEntity;
  if (isAttributeGroup) {
    isAttributeGroup =
      allOutBounds.length > 0 ||
      (getTCRS && reference.canUseTCRS) ||
      ((getTCRS || getTRS) && reference.canUseTRS) ||
      !!(getUnlinkTRS && associationRef && associationRef.canUseTRS);
  }

  /** Change api to attributegroup for retrieving extra information
   * These information include:
   * - Values for the foreignkeys.
   * - Value for one-to-one pseudo-columns. These are the columns
   * that their defined path is all in the outbound direction.
   * - trs or tcrs of main table (if asked for, supported, and needed)
   * - trs of the association table for unlink feature (if asked for, supported, and needed)
   *
   * This will just affect the http request and not reference.location
   *
   * NOTE:
   * This piece of code is dependent on the same assumptions as the current parser, which are:
   *   0. There is no table called `A`, `T`, `M`, `F1`, `F2`, ...
   *   1. There is no alias in url (more precisely `tcrs`, `trs`, `A_trs`, `A`, `T`, `M`, `F1`, `F2`, `F3`, ...)
   *   2. Filter comes before the link syntax.
   *   3. There is no trailing `/` in uri (as it will break the ermrest too).
   * */
  if (isAttributeGroup) {
    const attrGroupProps = reference._readAttributeGroupPathProps;
    const compactPath = attrGroupProps.path;
    // to ensure we're not modifying the original object, I'm creating a deep copy
    const pathPrefixAliasMapping = JSON.parse(JSON.stringify(attrGroupProps.pathPrefixAliasMapping));
    const mainTableAlias = reference.location.mainTableAlias;
    const aggList: string[] = [];
    let sortColumn: string;
    const aggFn = 'array_d';
    let allOutBound: any;
    let pseudoPathRes: any;
    let rightSummFn: string;

    // generate the projection for given pseudo column
    const getPseudoPath = function (l: number, outAlias: string) {
      let sourcekey = '';

      if (isObjectAndNotNull(allOutBounds[l].sourceObject) && isStringAndNotEmpty(allOutBounds[l].sourceObject.sourcekey)) {
        sourcekey = allOutBounds[l].sourceObject.sourcekey;
      }

      return _sourceColumnHelpers.parseAllOutBoundNodes(
        allOutBounds[l].sourceObjectNodes,
        allOutBounds[l].lastForeignKeyNode,
        allOutBounds[l].foreignKeyPathLength,
        sourcekey,
        pathPrefixAliasMapping,
        mainTableAlias,
        outAlias,
      );
    };

    // create the uri with attributegroup and alias
    uri = compactPath + '/';

    // add all the allOutBounds
    for (let k = allOutBounds.length - 1; k >= 0; k--) {
      allOutBound = allOutBounds[k];
      pseudoPathRes = getPseudoPath(k, fkAliasPrefix + (k + 1));
      // capture the used aliases (used in sorting)
      allOutBoundUsedAliases[k] = pseudoPathRes.usedOutAlias;

      // TODO could be improved by adding $M to the beginning?
      // if the result is just the alias, we don't need to add it at all
      if (pseudoPathRes.path !== '$' + pseudoPathRes.usedOutAlias) {
        //F2:=left(id)=(s:t:c)/$M/F1:=left(id2)=(s1:t1:c1)/$M/
        uri += pseudoPathRes.path + '/$' + mainTableAlias + '/';
      }

      // entity mode: F2:array_d(F2:*),F1:array_d(F1:*)
      // scalar mode: F2:=F2:col,F1:=F1:col
      if (allOutBound.isPathColumn && allOutBound.canUseScalarProjection) {
        aggList.push(fkAliasPrefix + (k + 1) + ':=' + pseudoPathRes.usedOutAlias + ':' + fixedEncodeURIComponent(allOutBound.baseColumn.name));
      } else {
        aggList.push(fkAliasPrefix + (k + 1) + ':=' + aggFn + '(' + pseudoPathRes.usedOutAlias + ':*)');
      }
    }

    // add trs or tcrs for main table
    if (getTCRS && reference.canUseTCRS) {
      rightSummFn = _ERMrestFeatures.TABLE_COL_RIGHTS_SUMMARY;
      aggList.push(rightSummFn + ':=' + rightSummFn + '(' + mainTableAlias + ':RID' + ')');
    } else if ((getTCRS || getTRS) && reference.canUseTRS) {
      rightSummFn = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
      aggList.push(rightSummFn + ':=' + rightSummFn + '(' + mainTableAlias + ':RID' + ')');
    }

    // add trs for the association table
    // TODO feels hacky! this is assuming that the alias exists
    if (getUnlinkTRS && associationRef && associationRef.canUseTRS) {
      rightSummFn = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
      aggList.push(associationTableAlias + '_' + rightSummFn + ':=' + rightSummFn + '(' + associationTableAlias + ':RID' + ')');
    }

    // add sort columns (it will include the key)
    if (hasSort) {
      sortCols = _modifiedSortObject.map(function (sort: any) {
        return sort.column;
      });
    } else {
      sortCols = sortObject.map(function (sort: any) {
        return sort.column;
      });
    }

    const addedCols: { [key: string]: number } = {};
    for (let k = 0; k < sortCols.length; k++) {
      if (sortCols[k] in allOutBoundSortMap) {
        const allOutBoundSortMapInfo = allOutBoundSortMap[sortCols[k]];
        // the sortCols[k] is an alias that we assigned before
        // this will be in format of: <new-alias>:=<fk-alias>:<col-name>
        // so for example: F10:=F1:name
        sortColumn = sortCols[k] + ':=' + allOutBoundUsedAliases[allOutBoundSortMapInfo.fkIndex] + ':' + allOutBoundSortMapInfo.colName;
      } else {
        sortColumn = fixedEncodeURIComponent(sortCols[k]);
      }

      // don't add duplicate columns
      if (!(sortColumn in addedCols)) {
        addedCols[sortColumn] = 1;
      }
    }

    uri += Object.keys(addedCols).join(',') + ';' + mainTableAlias + ':=' + aggFn + '(' + mainTableAlias + ':*),' + aggList.join(',');
  }

  // insert @sort()
  if (hasSort) {
    // then we have modified the sort
    // if sort is modified, we should use the modified sort Object for uri,
    // and the actual sort object for reference.location.sortObject
    reference.location.sortObject = _modifiedSortObject; // this will change the reference.location.sort
    uri = uri + reference.location.sort;

    reference.location.sortObject = sortObject;
  } else if (reference.location.sort) {
    // still there will be sort (shortestkey)
    uri = uri + reference.location.sort;
  }

  // check that page object is valid
  checkPageObject(reference.location, hasSort ? _modifiedSortObject : null);

  // insert paging
  if (reference.location.paging) {
    uri = uri + reference.location.paging;
  }

  return { value: uri, isAttributeGroup: isAttributeGroup };
}

/**
 * Generate the list of columns for this reference based on context and annotations
 */
export function generateColumnsList(reference: Reference | RelatedReference, tuple?: Tuple, columnsList?: any[], skipLog?: boolean): VisibleColumn[] {
  const resultColumns: VisibleColumn[] = [];
  const consideredColumns: { [key: string]: boolean } = {}; // to avoid duplicate pseudo columns
  const tableColumns: { [key: string]: boolean } = {}; // to make sure the hashes we generate are not clashing with table column names
  const virtualColumnNames: { [key: string]: boolean } = {}; // to make sure the names generated for virtual names are not the same
  const compositeFKs: ForeignKeyPseudoColumn[] = []; // to add composite keys at the end of the list
  const assetColumns: AssetPseudoColumn[] = []; // columns that have asset annotation
  const usedIframeInputMappings: { [key: string]: boolean } = {}; // column names that are used in iframe column mappings.
  const hiddenFKR = (reference as RelatedReference).origFKR;
  const refTable = reference.table;

  const context = reference.context;
  const isEntry = _isEntryContext(context);
  const isCompact = typeof context === 'string' && context.startsWith(_contexts.COMPACT);
  const isCompactEntry = typeof context === 'string' && context.startsWith(_contexts.COMPACT_ENTRY);

  // check if we should hide some columns or not.
  // NOTE: if the reference is actually an inbound related reference, we should hide the foreign key that created reference link.
  const hasOrigFKRToHide = typeof context === 'string' && context.startsWith(_contexts.COMPACT_BRIEF) && isObjectAndNotNull(hiddenFKR);

  // should hide the origFKR in case of inbound foreignKey (only in compact/brief)
  const hideFKR = (fkr: ForeignKeyRef) => {
    return hasOrigFKRToHide && fkr === hiddenFKR;
  };

  // should hide the columns that are part of origFKR. (only in compact/brief)
  const hideColumn = (column: Column) => {
    return hasOrigFKRToHide && hiddenFKR.colset.columns.indexOf(column) !== -1;
  };

  const _addAssetColumn = (column: Column, sourceObjectWrapper?: SourceObjectWrapper, name?: string, heuristics?: boolean) => {
    const assetCol = new AssetPseudoColumn(reference, column, sourceObjectWrapper, name, tuple);
    assetColumns.push(assetCol);
    resultColumns.push(assetCol);

    // as part of heuristics we only want the asset be added and not the column,
    // so adding it to considered ones to avoid adding it again.
    if (heuristics && assetCol.filenameColumn) {
      consideredColumns[assetCol.filenameColumn.name] = true;
    }
  };

  // reference function will take care of adding column and asset column
  const addColumn = (column: Column, sourceObjectWrapper?: SourceObjectWrapper, name?: string, heuristics?: boolean) => {
    if (column.isAssetURL) {
      _addAssetColumn(column, sourceObjectWrapper, name, heuristics);
      return;
    }

    // in entry context we don't want to show any of the asset metadata columns as chaise cannot handle it.
    if (isEntry && (column.isAssetFilename || column.isAssetByteCount || column.isAssetMd5 || column.isAssetSha256)) {
      return;
    }

    // for heuristics we should take care of the asset metadata columns differently
    if (heuristics) {
      // as part of heuristics, treat the asset filename the same as the asset itself.
      // and only add one of them.
      if (column.isAssetFilename) {
        if (column.assetURLColumnName in consideredColumns) {
          return;
        }
        consideredColumns[column.assetURLColumnName] = true;
        _addAssetColumn(reference.table.columns.get(column.assetURLColumnName), sourceObjectWrapper, name, heuristics);
        return;
      }

      // in compact context we should hide md5 and sha256
      if (isCompact && (column.isAssetMd5 || column.isAssetSha256)) {
        return;
      }
    }

    // add it as a reference column
    resultColumns.push(new ReferenceColumn(reference, [column], sourceObjectWrapper, name, tuple));
  };

  // make sure generated hash is not the name of any columns in the table
  const nameExistsInTable = (name: string, obj?: any) => {
    if (name in tableColumns) {
      if (!skipLog) {
        $log.info(`Generated Hash \`${name}\` for pseudo-column exists in table \`${reference.table.name}\`.`);
        $log.info('Ignoring the following in visible-columns: ', obj);
      }
      return true;
    }
    return false;
  };

  const wm = _warningMessages;
  const logCol = (bool: boolean, message: string, index?: number) => {
    if (bool && !skipLog) {
      $log.info(`columns list for table: ${reference.table.name}, context: ${context}, column index:${index}`);
      $log.info(message);
    }
    return bool;
  };

  // create a map of tableColumns to make it easier to find one
  reference.table.columns.all().forEach((c: any) => {
    tableColumns[c.name] = true;
  });

  // get columns from the input (used when we just want to process the given list of columns)
  let columns: unknown = -1;
  if (Array.isArray(columnsList)) {
    columns = columnsList;
  }
  // get column orders from annotation
  else if (reference.table.annotations.contains(_annotations.VISIBLE_COLUMNS)) {
    columns = _getRecursiveAnnotationValue(reference.context, reference.table.annotations.get(_annotations.VISIBLE_COLUMNS).content);
  }

  // annotation
  if (columns !== -1 && Array.isArray(columns)) {
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      // foreignKey or key
      if (Array.isArray(col)) {
        const constRes = reference.table.schema.catalog.constraintByNamePair(col);
        if (constRes !== null) {
          const consName = constRes.object.name;
          switch (constRes.subject) {
            case _constraintTypes.FOREIGN_KEY: {
              const fk = constRes.object as ForeignKeyRef;
              // fk is in this table, avoid duplicate and it's not hidden.
              if (!hideFKR(fk)) {
                // outbound foreignkey
                if (fk.table === reference.table) {
                  // avoid duplicate and same name in database
                  if (!logCol(consName in consideredColumns, wm.DUPLICATE_FK, i) && !nameExistsInTable(consName, col)) {
                    consideredColumns[consName] = true;
                    resultColumns.push(new ForeignKeyPseudoColumn(reference, fk));
                  }
                }
                // inbound foreignkey
                else if (fk.key.table === reference.table && !isEntry) {
                  // this is inbound foreignkey, so the name must change.
                  const fkColName = _sourceColumnHelpers.generateForeignKeyName(fk, true) as string;
                  if (
                    !logCol(fkColName in consideredColumns, wm.DUPLICATE_FK, i) &&
                    !logCol(context !== _contexts.DETAILED && context.indexOf(_contexts.EXPORT) === -1, wm.NO_INBOUND_IN_NON_DETAILED, i) &&
                    !nameExistsInTable(fkColName, col)
                  ) {
                    consideredColumns[consName] = true;
                    resultColumns.push(
                      new InboundForeignKeyPseudoColumn(reference, generateRelatedReference(reference, fk, tuple, true), undefined, fkColName),
                    );
                  }
                } else {
                  logCol(true, wm.FK_NOT_RELATED, i);
                }
              }
              break;
            }
            case _constraintTypes.KEY: {
              const key = constRes.object as Key;
              // key is in this table, and avoid duplicate
              if (!logCol(consName in consideredColumns, wm.DUPLICATE_KEY, i) && !nameExistsInTable(consName, col) && key.table === reference.table) {
                consideredColumns[consName] = true;
                // if in edit context: add its constituent columns
                if (isEntry) {
                  key.colset.columns.forEach((col) => {
                    if (!(col.name in consideredColumns) && !hideColumn(col)) {
                      consideredColumns[col.name] = true;
                      addColumn(col);
                    }
                  });
                } else {
                  resultColumns.push(new KeyPseudoColumn(reference, key));
                }
              }
              break;
            }
            default:
            // visible-columns annotation only supports key, foreignkey and columns.
          }
        }
      }
      // pseudo-column
      else if (isObjectAndNotNull(col)) {
        // virtual column
        if (!col.source && !col.sourcekey) {
          const ignore =
            logCol(!isStringAndNotEmpty(col.markdown_name), wm.INVALID_VIRTUAL_NO_NAME, i) ||
            logCol(!isObjectAndNotNull(col.display) || !isStringAndNotEmpty(col.display.markdown_pattern), wm.INVALID_VIRTUAL_NO_VALUE, i) ||
            isEntry;

          if (!ignore) {
            // generate name for virtual-column
            let extra = 0;
            let pseudoName = '$' + col.markdown_name;
            while (pseudoName in tableColumns || pseudoName in virtualColumnNames) {
              extra++;
              pseudoName += '-' + extra;
            }
            virtualColumnNames[pseudoName] = true;
            resultColumns.push(new VirtualColumn(reference, new SourceObjectWrapper(col), pseudoName, tuple));
          }
          continue;
        }

        // pseudo-column
        let wrapper: SourceObjectWrapper;
        try {
          // if both source and sourcekey are defined, ignore the source and use sourcekey
          if (col.sourcekey) {
            const sd = reference.table.sourceDefinitions.getSource(col.sourcekey);
            if (logCol(!sd, wm.INVALID_SOURCEKEY, i) || !sd) {
              continue;
            }
            // merge the two together
            // might throw an error if the filter in source operand_pattern returns empty
            wrapper = sd.clone(col, reference.table, false, tuple);
          } else {
            wrapper = new SourceObjectWrapper(col, reference.table, false, undefined, tuple);
          }
        } catch (exp: unknown) {
          logCol(true, wm.INVALID_SOURCE + ': ' + (exp as Error).message, i);
          continue;
        }

        // definitions that will be ignored:
        // - duplicate
        // - used in another iframe_input mapping.
        // - column/foreignkey that needs to be hidden.
        // - invalid self_link (must be not-null and part of a simple key)
        // - invalid aggregate function
        // - invalid filter path usage
        // - used path in entry
        // - (the if statement after reference) input_iframe with invalid or missing properties
        let ignore =
          logCol(wrapper.name in consideredColumns, wm.DUPLICATE_PC, i) ||
          logCol(wrapper.name in usedIframeInputMappings, wm.USED_IN_IFRAME_INPUT, i) ||
          (wrapper.hasPath && !wrapper.hasInbound && wrapper.foreignKeyPathLength === 1 && hideFKR(wrapper.firstForeignKeyNode?.nodeObject)) ||
          (!wrapper.hasPath && wrapper.column && hideColumn(wrapper.column)) ||
          logCol(wrapper.sourceObject.self_link === true && !wrapper.column?.isUniqueNotNull, wm.INVALID_SELF_LINK, i) ||
          logCol(!wrapper.hasAggregate && wrapper.hasInbound && !wrapper.isEntityMode, wm.MULTI_SCALAR_NEED_AGG, i) ||
          logCol(
            !wrapper.hasAggregate &&
              wrapper.hasInbound &&
              wrapper.isEntityMode &&
              context !== _contexts.DETAILED &&
              context.indexOf(_contexts.EXPORT) === -1,
            wm.MULTI_ENT_NEED_AGG,
            i,
          ) ||
          logCol(wrapper.hasAggregate && isEntry, wm.NO_AGG_IN_ENTRY, i) ||
          logCol(wrapper.isUniqueFiltered, wm.FILTER_NO_PATH_NOT_ALLOWED) ||
          logCol(
            isEntry && wrapper.hasPath && (wrapper.hasInbound || wrapper.isFiltered || wrapper.foreignKeyPathLength > 1),
            wm.NO_PATH_IN_ENTRY,
            i,
          );

        if (!ignore && isEntry && isObjectAndNotNull(wrapper.sourceObject.input_iframe)) {
          const inputIframeRes = wrapper.processInputIframe(reference, usedIframeInputMappings, tuple);
          ignore = true;
          if (inputIframeRes.error) {
            logCol(true, 'processing iframe_input: ' + inputIframeRes.message, i);
          } else if (inputIframeRes.success && inputIframeRes.columns) {
            ignore = false;
            // keep track of the columns used in the mapping
            const usedColumns: { [key: string]: boolean } = {};
            let iframeColIndex = 0;
            for (iframeColIndex = 0; iframeColIndex < inputIframeRes.columns.length; iframeColIndex++) {
              usedColumns[inputIframeRes.columns[iframeColIndex].name] = true;
            }
            Object.assign(usedIframeInputMappings, usedColumns);
          }
        }

        // avoid duplicates and hide the column
        if (!ignore) {
          consideredColumns[wrapper.name] = true;
          const refCol = createPseudoColumn(reference, wrapper, tuple);

          // we want to call the addColumn for asset and local columns since it will take care of other things as well.
          if ((refCol as AssetPseudoColumn).isAsset || !refCol.isPseudo) {
            addColumn(wrapper.column!, wrapper, wrapper.name, false);
          } else {
            // if entity and KeyPseudoColumn, we should instead add the underlying columns
            if (isEntry && (refCol as KeyPseudoColumn).isKey) {
              (refCol as KeyPseudoColumn).key.colset.columns.forEach((col) => {
                if (!(col.name in consideredColumns) && !hideColumn(col)) {
                  consideredColumns[col.name] = true;
                  addColumn(col);
                }
              });
            }

            // 2 conditions:
            // isEntry && (refCol.isPathColumn || refCol.isInboundForeignKey || refCol.isKey)
            // OR
            // isCompactEntry && (refCol.hasWaitFor || refCol.hasAggregate || (refCol.isPathColumn && refCol.foreignKeyPathLength > 1)
            const removePseudo =
              (isEntry &&
                ((refCol as PseudoColumn).isPathColumn ||
                  (refCol as InboundForeignKeyPseudoColumn).isInboundForeignKey ||
                  (refCol as KeyPseudoColumn).isKey)) ||
              (isCompactEntry &&
                ((refCol as PseudoColumn).hasWaitFor ||
                  (refCol as PseudoColumn).hasAggregate ||
                  ((refCol as PseudoColumn).isPathColumn && refCol.foreignKeyPathLength !== undefined && refCol.foreignKeyPathLength > 1)));

            // in entry mode, pseudo-column, inbound fk, and key are not allowed
            if (!removePseudo) {
              resultColumns.push(refCol);
            }
          }
        }
      }
      // column
      else if (typeof col === 'string') {
        let colObj: Column | null = null;
        try {
          colObj = reference.table.columns.get(col);
        } catch {
          // fail silently (this means that the table doesn't have the column)
        }

        // if column is not defined, processed before, or should be hidden
        const ignore =
          logCol(typeof colObj !== 'object' || colObj === null, wm.INVALID_COLUMN, i) ||
          logCol(colObj!.name in consideredColumns, wm.DUPLICATE_COLUMN, i) ||
          hideColumn(colObj!);

        if (!ignore) {
          consideredColumns[colObj!.name] = true;
          addColumn(colObj!);
        }
      } else {
        logCol(true, wm.INVALID_COLUMN_DEF, i);
      }
    }
  }
  // heuristics
  else {
    // fetch config option for system columns heuristics (true|false|Array)
    // if true, add all system columns
    // if false, don't move system columns definitions within the list
    // if array, add the ones defined
    //
    // order of system columns will always be the same
    // RID will always be first in the visible columns list
    // the rest will always be at the end in this order ('RCB', 'RMB', 'RCT', 'RMT')
    //
    // if compact or detailed, check for system column config option
    let systemColumnsMode: any;
    if (ConfigService.systemColumnsHeuristicsMode) {
      systemColumnsMode = ConfigService.systemColumnsHeuristicsMode(reference.context);
    }

    // if (array and RID exists) or true, add RID to the list of columns
    if ((Array.isArray(systemColumnsMode) && systemColumnsMode.indexOf('RID') !== -1) || systemColumnsMode === true) {
      const ridKey = reference.table.keys.all().find((key) => {
        // should only ever be 1 column for RID key colset
        return key.simple && key.colset.columns[0].name === 'RID';
      });

      if (ridKey) {
        resultColumns.push(new KeyPseudoColumn(reference, ridKey));
        consideredColumns[ridKey.colset.columns[0].name] = true;
      }
    }

    // add the key
    if (!isEntry && reference.context !== _contexts.DETAILED) {
      const key = reference.table._getRowDisplayKey(reference.context);
      if (key !== undefined && !nameExistsInTable(key.name, 'display key')) {
        const keyColumns = key.colset.columns;

        // make sure key columns won't be added twice
        let addedKey = false;
        keyColumns.forEach((column) => {
          if (column.name in consideredColumns) addedKey = true;
        });

        if (!addedKey) {
          keyColumns.forEach((col) => {
            consideredColumns[col.name] = true;
          });

          // if the key is asset or asset filename, add the asset
          if (key.simple && (keyColumns[0].isAssetURL || keyColumns[0].isAssetFilename)) {
            addColumn(keyColumns[0], undefined, undefined, true);
          }
          // otherwise just add the key pseudo-column
          else {
            resultColumns.push(new KeyPseudoColumn(reference, key));
          }
        }
      }
    }

    let tableColumns = reference.table.columns.all() as Column[];

    // if systemColumnsMode is defined, we have to change the order of system columns
    if (systemColumnsMode === true || Array.isArray(systemColumnsMode)) {
      // if it's true: add all the system columns
      let addedSystemColumnNames = _systemColumns;
      const addedSystemColumns: any[] = [];

      // if array: add the ones defined in array of config property (preserves order defined in `_systemColumns`)
      if (Array.isArray(systemColumnsMode)) {
        addedSystemColumnNames = _systemColumns.filter((colName: string) => {
          return systemColumnsMode.indexOf(colName) !== -1;
        });
      }

      // turn column names to column objects
      addedSystemColumnNames.forEach((cname: string) => {
        try {
          const col = refTable.columns.get(cname);
          addedSystemColumns.push(col);
        } catch {
          // fail silently (this means that the table doesn't have the system column)
        }
      });

      // add system columns to the end of the list
      tableColumns = reference.table.columns
        .all()
        .filter((column) => {
          return _systemColumns.indexOf(column.name) === -1;
        })
        .concat(addedSystemColumns);
    }

    tableColumns.forEach((col) => {
      // avoid duplicate, or should be hidden
      if (col.name in consideredColumns || hideColumn(col)) {
        return;
      }

      // if column is serial and part of a simple key
      if (col.type.name.toUpperCase().startsWith('SERIAL') && col.memberOfKeys.length === 1 && col.memberOfKeys[0].simple) {
        return;
      }

      // add the column if it's not part of any foreign keys
      // or if the column type is array (currently ermrest doesn't support this either)
      if (col.memberOfForeignKeys.length === 0) {
        addColumn(col, undefined, undefined, true);
      } else {
        let colFKs: ForeignKeyRef[] = [];

        // sort foreign keys of a column
        if (col.memberOfForeignKeys.length > 1) {
          colFKs = col.memberOfForeignKeys.sort((a, b) => {
            // sort by constraint name to ensure we're getting a deterministic result
            return a._constraintName.localeCompare(b._constraintName);
          });
        } else {
          colFKs = col.memberOfForeignKeys;
        }

        colFKs.forEach((fk) => {
          const fkName = fk.name;

          // hide the origFKR or exists
          if (hideFKR(fk)) return;

          if (fk.simple) {
            // simple FKR
            if (!(fkName in consideredColumns) && !nameExistsInTable(fkName, fk._constraintName)) {
              consideredColumns[fkName] = true;
              resultColumns.push(new ForeignKeyPseudoColumn(reference, fk));
            }
          } else {
            // composite FKR

            // add the column if context is not entry and avoid duplicate
            // don't add the column if it's also part of a simple fk
            if (!isEntry && !col.isPartOfSimpleForeignKey && !(col.name in consideredColumns)) {
              consideredColumns[col.name] = true;
              addColumn(col, undefined, undefined, true);
            }

            if (!(fkName in consideredColumns) && !nameExistsInTable(fkName, fk._constraintName)) {
              consideredColumns[fkName] = true;
              // hold composite FKR
              compositeFKs.push(new ForeignKeyPseudoColumn(reference, fk));
            }
          }
        });
      }

      consideredColumns[col.name] = true;
    });

    // append composite FKRs
    compositeFKs.forEach((fk) => resultColumns.push(fk));
  }

  // If not in edit context i.e in read context remove the hidden columns which cannot be selected.
  if (!isEntry) {
    // Iterate over all reference columns
    for (let i = 0; i < resultColumns.length; i++) {
      const refCol = resultColumns[i];
      let isHidden = false;

      // Iterate over the base columns. If any of them are hidden then hide the column
      for (let k = 0; k < refCol.baseColumns.length; k++) {
        if (refCol.baseColumns[k].isHiddenPerACLs) {
          isHidden = true;
          break;
        }
      }

      // If isHidden flag is true then remove the column at ith index
      if (isHidden) {
        resultColumns.splice(i, 1);
        i--;
      }
    }
  }

  return resultColumns;
}

/**
 * Generate a list of facetColumns that should be used for the given reference.
 * will also attach _facetColumns to the reference.
 * If skipMappingEntityChoices=true, it will return the result synchronously
 * otherwise will return a promise resolved with the following object:
 * {
 *   facetColumns: <an array of FacetColumn objects>
 *   issues: <if null it means that there wasn't any issues, otherwise will be a UnsupportedFilters object>
 * }
 *
 * @param skipMappingEntityChoices - whether we should map entity choices or not
 * @private
 */
export function generateFacetColumns(
  reference: Reference,
  skipMappingEntityChoices: boolean,
):
  | Promise<{ facetColumns: FacetColumn[]; issues: UnsupportedFilters | null; facetColumnsStructure: Array<number | FacetGroup> }>
  | { facetColumns: FacetColumn[]; issues: UnsupportedFilters | null; facetColumnsStructure: Array<number | FacetGroup> } {
  const andOperator = _FacetsLogicalOperators.AND;
  let searchTerm = reference.location.searchTerm;
  const helpers = _facetColumnHelpers;

  // if location has facet or filter, we should honor it and we should not add preselected facets in annotation
  const hasFilterOrFacet = !!reference.location.facets || !!reference.location.filter || !!reference.location.customFacets;

  const andFilters = reference.location.facets ? reference.location.facets.andFilters : [];
  // change filters to facet NOTE can be optimized to actually merge instead of just appending to list
  if (reference.location.filter && reference.location.filter.depth === 1 && Array.isArray(reference.location.filter.facet.and)) {
    Array.prototype.push.apply(andFilters, reference.location.filter.facet.and);
    reference.location.removeFilters();
  }

  let annotationCols: any = -1;
  let usedAnnotation = false;
  const facetObjectWrappers: Array<SourceObjectWrapper | FacetObjectGroupWrapper> = [];

  // get column orders from annotation
  if (reference.table.annotations.contains(_annotations.VISIBLE_COLUMNS)) {
    annotationCols = _getAnnotationValueByContext(_contexts.FILTER, reference.table.annotations.get(_annotations.VISIBLE_COLUMNS).content);
    if (Object.prototype.hasOwnProperty.call(annotationCols, andOperator) && Array.isArray(annotationCols[andOperator])) {
      annotationCols = annotationCols[andOperator];
    } else {
      annotationCols = -1;
    }
  }

  if (annotationCols !== -1) {
    usedAnnotation = true;
    // NOTE We're allowing duplicates in annotation.
    annotationCols.forEach((obj: any, objIndex: number) => {
      // if we have filters in the url, we will get the filters only from url
      if (obj.sourcekey === _specialSourceDefinitions.SEARCH_BOX && andFilters.length === 0) {
        if (!searchTerm) {
          searchTerm = _getSearchTerm({ and: [obj] });
        }
        return;
      }

      // make sure it's not referring to the annotation object.
      obj = simpleDeepCopy(obj);

      if ('and' in obj) {
        try {
          facetObjectWrappers.push(new FacetObjectGroupWrapper(obj, reference.table, hasFilterOrFacet));
        } catch (exp: unknown) {
          $log.error(`Error processing facet group at index ${objIndex}: ` + (exp as Error).message);
          return;
        }
      } else {
        const wrapper = helpers.sourceDefToFacetObjectWrapper(obj, reference.table, hasFilterOrFacet);
        if (!wrapper) return;

        facetObjectWrappers.push(wrapper);
      }
    });
  }
  // annotation didn't exist, so we are going to use the
  // visible columns in detailed and related entities in detailed
  else {
    // this reference should be only used for getting the list,
    const detailedRef = reference.context === _contexts.DETAILED ? reference : reference.contextualize.detailed;
    const compactRef = reference.context === _contexts.COMPACT ? reference : reference.contextualize.compact;

    // all the visible columns in compact context
    compactRef.columns.forEach((col: any) => {
      const fcObj = helpers.checkRefColumn(col);
      if (!fcObj) return;

      facetObjectWrappers.push(new SourceObjectWrapper(fcObj, reference.table, true));
    });

    // all the related in detailed context
    detailedRef.related.forEach((relRef: any) => {
      let fcObj: any;
      if (relRef.pseudoColumn && !relRef.pseudoColumn.isInboundForeignKey) {
        fcObj = simpleDeepCopy(relRef.pseudoColumn.sourceObject);
      } else {
        fcObj = helpers.checkRefColumn(new InboundForeignKeyPseudoColumn(reference, relRef));
      }
      if (!fcObj) return;

      /*
       * Because of alternative logic, the table that detailed is referring to
       * might be different than compact.
       * Since we're using the detailed just for its related entities api,
       * if detailed is actually an alternative table, it won't have any
       * related entities. Therefore we don't need to handle that case.
       * The only case we need to cover are:
       * detailed is main, compact is alternative
       *    - Add the linkage from main to alternative to all the detailed related entities.
       * NOTE: If we change the related logic, to return the
       * related entities to the main table instead of alternative, this should be changed.
       */
      if (detailedRef.table !== compactRef.table && !detailedRef.table._isAlternativeTable() && compactRef.table._isAlternativeTable()) {
        fcObj.source.unshift({ outbound: compactRef.table._altForeignKey.constraint_names[0] });
      }
      facetObjectWrappers.push(new SourceObjectWrapper(fcObj, reference.table, true));
    });
  }

  // if we have filters in the url, we should just get the structure from annotation
  const finalize = (res: ValidatedFacetFilters) => {
    const facetColumns: FacetColumn[] = [];
    const facetColumnsStructure: Array<number | FacetGroup> = [];

    // turn facetObjectWrappers into facetColumn
    res.facetObjectWrappers.forEach((fo) => {
      // if it's a group, we should create object for all children and add their index to the group
      if ('children' in fo) {
        // TODO should this be a proper check for FacetObjectGroupWrapper?
        const structureIndex = facetColumnsStructure.length;
        const childIndexes: number[] = [];
        fo.children.forEach((child) => {
          // if the function returns false, it couldn't handle that case, and therefore we are ignoring it.
          if (!helpers.checkForAlternative(child, usedAnnotation, reference.table)) return;
          const usedIndex = facetColumns.length;
          facetColumns.push(new FacetColumn(reference, usedIndex, child, structureIndex));
          childIndexes.push(usedIndex);
        });
        if (childIndexes.length === 0) return; // if there wasn't any valid child, ignore the group
        facetColumnsStructure.push(new FacetGroup(reference, structureIndex, fo, childIndexes));
      }
      // individual facet column
      else {
        // if the function returns false, it couldn't handle that case, and therefore we are ignoring it.
        if (!helpers.checkForAlternative(fo, usedAnnotation, reference.table)) return;
        const usedIndex = facetColumns.length;
        facetColumns.push(new FacetColumn(reference, usedIndex, fo));
        facetColumnsStructure.push(usedIndex);
      }
    });

    // get the existing facets on the columns (coming from annotation)
    facetColumns.forEach((fc) => {
      if (fc.filters.length !== 0) {
        res.newFilters.push(fc.toJSON());
      }
    });

    // NOTE we should make sure this is being called before read.
    if (res.newFilters.length > 0) {
      reference.location.facets = { and: res.newFilters };
    } else {
      reference.location.facets = null;
    }

    return { facetColumns, facetColumnsStructure };
  };

  // if we don't want to map entity choices, then function will work in sync mode
  if (skipMappingEntityChoices) {
    const res = validateFacetsFilters(reference, andFilters, facetObjectWrappers, searchTerm, skipMappingEntityChoices) as ValidatedFacetFilters;
    const finalizedRes = finalize(res);
    return {
      facetColumns: finalizedRes.facetColumns,
      facetColumnsStructure: finalizedRes.facetColumnsStructure,
      issues: res.issues,
    };
  } else {
    return new Promise((resolve, reject) => {
      (validateFacetsFilters(reference, andFilters, facetObjectWrappers, searchTerm, skipMappingEntityChoices) as Promise<ValidatedFacetFilters>)
        .then((res) => {
          const finalizedRes = finalize(res);
          resolve({
            facetColumns: finalizedRes.facetColumns,
            facetColumnsStructure: finalizedRes.facetColumnsStructure,
            issues: res.issues,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

/**
 * This will go over all the facets and make sure they are fine
 * if not, will try to transform or remove them and
 * in the end will update the list
 *
 * NOTE this should be called before doing read or as part of it
 * @param reference The reference object
 * @param facetAndFilters the filters in the url
 * @param facetObjectWrappers the generated facet objects
 * @param searchTerm the search term that is used
 * @param skipMappingEntityChoices if true, it will return a sync result
 * @param changeLocation whether we should change reference.location or not
 */
export function validateFacetsFilters(
  reference: Reference,
  facetAndFilters: any,
  facetObjectWrappers: Array<SourceObjectWrapper | FacetObjectGroupWrapper>,
  searchTerm?: string,
  skipMappingEntityChoices?: boolean,
  changeLocation?: boolean,
): ValidatedFacetFilters | Promise<ValidatedFacetFilters> {
  const helpers = _facetColumnHelpers;
  const promises: any[] = [];
  const checkedObjects: { [key: string]: boolean } = {};
  let j: number;
  const facetLen = facetObjectWrappers.length;
  let andFilterObject: SourceObjectWrapper;

  /*
   * In some cases we are updating the given sources and therefore the
   * filter will change, so we must make sure that we update the url
   * to reflect those changes. These changes are
   * 1. When annotation is used and we have preselected filters.
   * 2. When the main table has an alternative table.
   * 3. When facet tables have alternative table
   * This is just to make sure the facet filters and url are in sync.
   */
  const res = {
    facetObjectWrappers: facetObjectWrappers,
    newFilters: [] as any[],
    issues: null as UnsupportedFilters | null,
  };

  const discardedFacets: any[] = [];
  const partialyDiscardedFacets: any[] = [];
  const addToIssues = function (obj: any, message: string, discardedChoices?: any[]) {
    // TODO https://github.com/informatics-isi-edu/ermrestjs/issues/940
    let name = obj.markdown_name;
    if (!name && obj.sourcekey) {
      name = obj.sourcekey;
    }
    $log.warn('invalid facet ' + (name ? name : '') + ': ' + message);
    if (Array.isArray(discardedChoices) && discardedChoices.length > 0) {
      partialyDiscardedFacets.push({
        markdown_name: name,
        choices: discardedChoices,
        total_choice_count: obj.choices.length + discardedChoices.length,
      });
    } else {
      discardedFacets.push({
        markdown_name: name,
        choices: obj.choices,
        ranges: obj.ranges,
        not_null: obj.not_null,
      });
    }
  };

  searchTerm = searchTerm || reference.location.searchTerm;
  // add the search term
  if (typeof searchTerm === 'string') {
    res.newFilters.push({ sourcekey: _specialSourceDefinitions.SEARCH_BOX, search: [searchTerm] });
  }

  if (facetAndFilters == null || !Array.isArray(facetAndFilters)) {
    facetAndFilters = reference.location.facets ? reference.location.facets.andFilters : [];
  }

  // if there wasn't any facets in the url, just return
  if (facetAndFilters.length == 0) {
    if (skipMappingEntityChoices) {
      return res;
    } else {
      return Promise.resolve(res);
    }
  }

  // go over the list of facets in the url and process them if needed
  facetAndFilters.forEach((facetAndFilter: any) => {
    if (facetAndFilter.sourcekey === _specialSourceDefinitions.SEARCH_BOX) {
      return;
    }

    if (typeof facetAndFilter.sourcekey === 'string') {
      const urlSourceDef = reference.table.sourceDefinitions.getSource(facetAndFilter.sourcekey);

      // invalid sourcekey
      if (!urlSourceDef) {
        addToIssues(facetAndFilter, '`' + facetAndFilter.sourcekey + '` is not a valid sourcekey.');
        return;
      }

      // TODO depending on what we want to do when
      //      just source is passed, we would have to move this
      // validate entity mode if it's defined
      if (typeof facetAndFilter.entity === 'boolean') {
        if (urlSourceDef.isEntityMode != facetAndFilter.entity) {
          addToIssues(facetAndFilter, '`' + facetAndFilter.sourcekey + '` entity mode has changed.');
        }
      }

      // copy the elements that are defined in the source def but not the one already defined
      shallowCopyExtras(facetAndFilter, urlSourceDef.sourceObject, _sourceDefinitionAttributes);
    }

    if (facetAndFilter.hidden) {
      // NOTE does this make sense?
      res.newFilters.push(facetAndFilter);
      return;
    }

    // validate the source definition
    try {
      andFilterObject = new SourceObjectWrapper(facetAndFilter, reference.table, true);
    } catch (exp: any) {
      addToIssues(facetAndFilter, exp.message);
      return;
    }

    // validate source_domain
    if (isObjectAndNotNull(facetAndFilter.source_domain)) {
      const col = andFilterObject.column;
      if (col && isStringAndNotEmpty(facetAndFilter.source_domain.schema) && col.table.schema.name !== facetAndFilter.source_domain.schema) {
        // make sure the schema name is valid
        if (col.table.schema.catalog.schemas.has(facetAndFilter.source_domain.schema)) {
          addToIssues(facetAndFilter, 'The state of facet has changed (schema missmatch).');
          return;
        }
      }

      if (col && isStringAndNotEmpty(facetAndFilter.source_domain.table) && col.table.name !== facetAndFilter.source_domain.table) {
        // make sure the table name is valid
        if (col.table.schema.tables.has(facetAndFilter.source_domain.table)) {
          addToIssues(facetAndFilter, 'The state of facet has changed (table missmatch).');
          return;
        }
      }

      // validate the given column name
      if (col && isStringAndNotEmpty(facetAndFilter.source_domain.column) && !col.table.columns.has(facetAndFilter.source_domain.column)) {
        delete facetAndFilter.source_domain.column;
      }

      // modify the last column name to be the one in source_domain in scalar mode
      if (
        col &&
        !andFilterObject.isEntityMode &&
        isStringAndNotEmpty(facetAndFilter.source_domain.column) &&
        col.name !== facetAndFilter.source_domain.column
      ) {
        if (Array.isArray(facetAndFilter.source)) {
          facetAndFilter.source[facetAndFilter.source.length - 1] = facetAndFilter.source_domain.column;
        } else {
          facetAndFilter.source = facetAndFilter.source_domain.column;
        }
        facetAndFilter.entity = false;
        andFilterObject = new SourceObjectWrapper(facetAndFilter, reference.table, true);
      }
    }

    // in case of entity choice picker we have to translate the given choices
    if (!skipMappingEntityChoices && andFilterObject.isEntityMode && Array.isArray(facetAndFilter.choices)) {
      promises.push({ andFilterObject: andFilterObject, mapEntityChoices: true });
    } else {
      promises.push({
        andFilterObject: andFilterObject,
      });
    }
  });

  const finalize = (response: any[]) => {
    response.forEach((resp: any) => {
      // if in entity mode some choices were invalid
      if (Array.isArray(resp.invalidChoices) && resp.invalidChoices.length > 0) {
        // if no choices was left, then we don't need to merge it with anything and we should ignore it
        if (resp.andFilterObject.sourceObject.choices.length === 0 || resp.andFilterObject.entityChoiceFilterTuples.length === 0) {
          // adding the choices back so we can produce proper error message
          resp.andFilterObject.sourceObject.choices = resp.originalChoices;
          addToIssues(resp.andFilterObject.sourceObject, 'None of the encoded choices were available');
          return;
        } else {
          addToIssues(
            resp.andFilterObject.sourceObject,
            'The following encoded choices were not available: ' + resp.invalidChoices.join(', '),
            resp.invalidChoices,
          );
        }
      }

      // if facetObjectWrappers is passed, we have to create a facet or merge with existing
      if (res.facetObjectWrappers) {
        // find the facet corresponding to the filter
        let found = false;
        for (j = 0; j < facetLen; j++) {
          const curr = res.facetObjectWrappers[j];

          if (curr instanceof FacetObjectGroupWrapper) {
            curr.children.forEach((child, childIndex) => {
              if (checkedObjects[`${j}_${childIndex}`]) return;
              if (child.name === resp.andFilterObject.name) {
                checkedObjects[`${j}_${childIndex}`] = true;
                found = true;
                // merge facet objects
                helpers.mergeFacetObjects(child.sourceObject, resp.andFilterObject.sourceObject);

                // make sure the page object is stored
                if (resp.andFilterObject.entityChoiceFilterTuples) {
                  child.entityChoiceFilterTuples = resp.andFilterObject.entityChoiceFilterTuples;
                }
              }
            });
          } else {
            // it can be merged only once, since in a facet the filter is
            // `or` and outside it's `and`.
            if (checkedObjects[j]) continue;

            const facetObjectWrapper = curr as SourceObjectWrapper;

            // we want to make sure these two sources are exactly the same
            // so we can compare their hashnames
            if (facetObjectWrapper.name === resp.andFilterObject.name) {
              checkedObjects[j] = true;
              found = true;
              // merge facet objects
              helpers.mergeFacetObjects(facetObjectWrapper.sourceObject, resp.andFilterObject.sourceObject);

              // make sure the page object is stored
              if (resp.andFilterObject.entityChoiceFilterTuples) {
                facetObjectWrapper.entityChoiceFilterTuples = resp.andFilterObject.entityChoiceFilterTuples;
              }
            }
          }
        }

        // couldn't find the facet, create a new facet object
        if (!found) {
          res.facetObjectWrappers.push(resp.andFilterObject);
        }
      }
      // otherwise just capture the filters in url
      else {
        res.newFilters.push(resp.andFilterObject);
      }
    });

    if (changeLocation) {
      if (res.newFilters.length > 0) {
        reference.location.facets = { and: res.newFilters };
      } else {
        reference.location.facets = null;
      }
    }

    if (discardedFacets.length > 0 || partialyDiscardedFacets.length > 0) {
      res.issues = new UnsupportedFilters(discardedFacets, partialyDiscardedFacets);
    }
  };

  if (skipMappingEntityChoices) {
    finalize(promises);
    return res;
  } else {
    return new Promise((resolve, reject) => {
      helpers.runAllEntityChoicePromises(
        promises,
        (response: any) => {
          finalize(response);
          resolve(res);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  }
}

/**
 * Computes the display property for a Reference.
 * This is a TypeScript version of the display getter from the JavaScript reference.js file.
 * @param reference - The reference object
 * @returns The display configuration object
 */
export function computeReferenceDisplay(reference: Reference): ReferenceDisplay {
  // displaytype default value for compact/brief/inline should be markdown. otherwise table
  const displayType = reference.context === _contexts.COMPACT_BRIEF_INLINE ? _displayTypes.MARKDOWN : _displayTypes.TABLE;

  const display: ReferenceDisplay = {
    type: displayType,
    hideRowCount: false,
    showFaceting: false,
    maxFacetDepth: 0,
    facetPanelOpen: null,
    showSavedQuery: false,
    _separator: '\n',
    _prefix: '',
    _suffix: '',
    sourceWaitFor: [],
    sourceHasWaitFor: false,
  };

  let annotation: any;
  // If table has table-display annotation then set it in annotation variable
  if (reference.table.annotations.contains(_annotations.TABLE_DISPLAY)) {
    annotation = _getRecursiveAnnotationValue(reference.context, reference.table.annotations.get(_annotations.TABLE_DISPLAY).content);
  }

  // get the hide_row_count from display annotation
  const hideRowCount = _getHierarchicalDisplayAnnotationValue(reference.table, reference.context, 'hide_row_count', true);
  display.hideRowCount = typeof hideRowCount === 'boolean' ? hideRowCount : false;

  // If annotation is defined then parse it
  if (annotation) {
    // Set row_order value
    // this will just whatever is defined in row_order, it will not
    // take care of columns that have column_order. The caller should do that.
    if (Array.isArray(annotation.row_order)) {
      display._rowOrder = _processColumnOrderList(annotation.row_order, reference.table);
    }

    // Set default page size value
    if (typeof annotation.page_size === 'number') {
      display.defaultPageSize = annotation.page_size;
    }

    // set whether the column headers should be hidden (applies to record app currently)
    // backwards compatibility: the old name was hide_column_headers
    if (annotation.hide_column_header || annotation.hide_column_headers) {
      display.hideColumnHeaders = annotation.hide_column_header || annotation.hide_column_headers;
    }

    // set whether the table of contents should be collapsed by default (applies to record app currently)
    if (annotation.collapse_toc_panel) {
      display.collapseToc = annotation.collapse_toc_panel;
    }

    // If module is not empty then set its associated properties
    // Else if row_markdown_pattern is not empty then set its associated properties
    if (typeof annotation.module === 'string') {
      // TODO: write code for module handling
      display.type = _displayTypes.MODULE;
    } else if (typeof annotation.row_markdown_pattern === 'string' || typeof annotation.page_markdown_pattern === 'string') {
      display.type = _displayTypes.MARKDOWN;
      display.templateEngine = annotation.template_engine;

      if (typeof annotation.page_markdown_pattern === 'string') {
        display._pageMarkdownPattern = annotation.page_markdown_pattern;
      } else {
        // Render the row by composing a markdown representation
        display._rowMarkdownPattern = annotation.row_markdown_pattern;

        // Insert separator markdown text between each expanded rowpattern when presenting row sets. Default is new line "\n"
        display._separator = typeof annotation.separator_markdown === 'string' ? annotation.separator_markdown : '\n';

        // Insert prefix markdown before the first rowpattern expansion when presenting row sets. (Default empty string "".)
        display._prefix = typeof annotation.prefix_markdown === 'string' ? annotation.prefix_markdown : '';

        // Insert suffix markdown after the last rowpattern expansion when presenting row sets. (Default empty string "".)
        display._suffix = typeof annotation.suffix_markdown === 'string' ? annotation.suffix_markdown : '';
      }
    }
  }

  // attach the display settings defined on the source definition
  if (reference.pseudoColumn && reference.pseudoColumn.display) {
    const displ = reference.pseudoColumn.display;
    display.sourceWaitFor = reference.pseudoColumn.waitFor || [];
    display.sourceHasWaitFor = reference.pseudoColumn.hasWaitFor || false;

    if (displ.sourceMarkdownPattern) {
      display.type = _displayTypes.MARKDOWN;
      display.sourceMarkdownPattern = displ.sourceMarkdownPattern;
      display.sourceTemplateEngine = displ.sourceTemplateEngine;
    }
  } else {
    display.sourceWaitFor = [];
    display.sourceHasWaitFor = false;
  }

  // if facetpanel won't be used or the ConfigService.clientConfig.facetPanelDisplay doesn't include the current context or a parent context, set to null
  let fpo: boolean | null = null;
  let maxFacetDepth: number | null = null;

  // NOTE: clientConfig should always be defined if used by a client, some ermrestJS tests don't always set it, so don't calculate this for those tests
  if (reference.context && ConfigService.verifyClientConfig(true)) {
    // ConfigService.clientConfig.facetPanelDisplay will be defined from configuration or based on chaise defaults
    const ccFacetDisplay = ConfigService.clientConfig.facetPanelDisplay;
    const context = reference.context;

    // facet panel is not available in COMPACT_BRIEF and it's subcontexts, and other non-compact contexts
    if (context.startsWith(_contexts.COMPACT) && !context.startsWith(_contexts.COMPACT_BRIEF)) {
      // get it from the display annotation
      maxFacetDepth = _getHierarchicalDisplayAnnotationValue(reference.table, context, 'max_facet_depth', true);
      // missing from the annotation, so get it from the chaise-config
      if (maxFacetDepth === -1 && typeof ccFacetDisplay.maxFacetDepth === 'number') {
        maxFacetDepth = ccFacetDisplay.maxFacetDepth;
      }
      // validate the value
      if (maxFacetDepth !== null && (!isInteger(maxFacetDepth) || maxFacetDepth < 0)) {
        maxFacetDepth = 1;
      } else if (maxFacetDepth !== null && maxFacetDepth > 2) {
        maxFacetDepth = 2;
      }

      if (ccFacetDisplay.closed && ccFacetDisplay.closed.includes('*')) fpo = false;
      if (ccFacetDisplay.open && ccFacetDisplay.open.includes('*')) fpo = true;
      // check inheritence
      // array is in order from parent context to more specific sub contexts
      for (let i = 0; i < _compactFacetingContexts.length; i++) {
        const ctx = _compactFacetingContexts[i];
        // only check contexts that match
        // "compact/select/*"" where * can be association (or subcontexts), foreign_key, saved_queries, or show_more
        if (context.startsWith(ctx)) {
          if (ccFacetDisplay.closed && ccFacetDisplay.closed.includes(ctx)) fpo = false;
          if (ccFacetDisplay.open && ccFacetDisplay.open.includes(ctx)) fpo = true;

          // stop checking if we found the current context in the array, inheritence checks should be complete
          if (context === ctx) break;
        }
      }
    }
  }
  // for other contexts that don't allow facet
  maxFacetDepth = maxFacetDepth === null ? 0 : maxFacetDepth;

  display.maxFacetDepth = maxFacetDepth;
  display.showFaceting = maxFacetDepth > 0;
  display.facetPanelOpen = fpo;

  /**
   * Check the catalog, schema, and table to see if the saved query UI should show
   *  1. check the table to see if the value is a boolean
   *    a. if true or false, we are done and use that value
   *    b. if undefined, display annotation defined but show_saved_query property was undefined
   *    c. if null, display annotation was not defined (initial value)
   *  2. check the schema to see if the value is a boolean
   *    a. if true or false, we are done and use that value
   *    b. if undefined, display annotation defined but show_saved_query property was undefined
   *    c. if null, display annotation was not defined (initial value)
   *  3. check the catalog to see if the value is a boolean
   *    a. if true or false, we are done and use that value
   *    b. if undefined, display annotation defined but show_saved_query property was undefined
   *    c. if null, display annotation was not defined (initial value)
   *  4. default to false if not defined on any of the above
   */
  display.showSavedQuery = (reference.table as any)._showSavedQuery || false;

  return display;
}
