/* eslint-disable prettier/prettier */

// models
import SourceObjectNode from '@isrd-isi-edu/ermrestjs/src/models/source-object-node';
import { ReferenceColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { Tuple, Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// services
// import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _contexts, _facetFilterTypes, _pseudoColAggregateFns, _sourceDefinitionAttributes, _warningMessages } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { createPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';

// legacy imports that need to be accessed
import { _sourceColumnHelpers } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';
import { Column, Table } from '@isrd-isi-edu/ermrestjs/js/core';

export type FilterPropsType = {
  /**
   * whether the filter is processed or not
   */
  isFilterProcessed: boolean;
  /**
   * whether there's any filter applied to the root (the first node)
   */
  hasRootFilter: boolean;
  /**
   * whether there's any filter applied to the nodes in between
   * (i.e. not the root and not the leaf)
   */
  hasFilterInBetween: boolean;
  /**
   * the leaf filter string
   */
  leafFilterString: string;
};

export type InputIframePropsType = {
  /**
   * the url pattern that should be used to generate the iframe url
   */
  urlPattern: string;
  /**
   * the template engine that should be used to generate the url
   */
  urlTemplateEngine?: string;
  /**
   * the columns used in the mapping
   */
  columns: ReferenceColumn[];
  /**
   * an object from field name to column.
   */
  fieldMapping: Record<string, ReferenceColumn>;
  /**
   * name of optional fields
   */
  optionalFieldNames: string[];
  /**
   * the message that we should show when user wants to submit empty.
   */
  emptyFieldConfirmMessage: string;
};

/**
 * Represents a column-directive
 */
class SourceObjectWrapper {
  /**
   * the source object
   */
  public sourceObject: Record<string, unknown>;
  /**
   * the column that this source object refers to
   * undefined if it's a virtual column
   */
  public column?: Column;
  /**
   * whether the source object has a prefix or not
   */
  public hasPrefix = false;
  /**
   * whether the source object has a foreign key path or not
   */
  public hasPath = false;
  /**
   * the length of the foreign key path
   * this is the number of foreign key nodes in the path
   */
  public foreignKeyPathLength = 0;
  /**
   * whether the source object has an inbound foreign key path or not
   */
  public hasInbound = false;
  /**
   * whether the source object has an aggregate function or not
   */
  public hasAggregate = false;
  /**
   * whether any of the source object nodes is filtered or not
   */
  public isFiltered = false;
  public filterProps?: FilterPropsType = {
    isFilterProcessed: true,
    hasRootFilter: false,
    hasFilterInBetween: false,
    leafFilterString: ''
  };

  /**
   * whether this is an entity mode or not
   */
  public isEntityMode = false;
  /**
   * whether this represents a unique row or not
   */
  public isUnique = false;
  /**
   * whether this is unique and filtered
   */
  public isUniqueFiltered = false;
  /**
   * returns true if all foreign keys are outbound and all the columns involved are not null.
   */
  public isAllOutboundNotNullPerModel = false;
  /**
   *
   */
  public isAllOutboundNotNull = false;
  public lastForeignKeyNode?: SourceObjectNode;
  public firstForeignKeyNode?: SourceObjectNode;
  public name = '';
  public isHash = false;
  public sourceObjectNodes: SourceObjectNode[] = [];
  public isInputIframe = false;
  public inputIframeProps?: InputIframePropsType;


  /**
   * used for facets
   * TODO is there a better way to manage this?
   */
  public entityChoiceFilterTuples?: Tuple[];

  /**
   * @param sourceObject the column directive object
   * @param table the root (starting) table
   * @param isFacet whether this is a facet or not
   * @param sources already generated source (only useful for source-def generation)
   * @param mainTuple the main tuple that is used for filters
   * @param skipProcessingFilters whether we should skip processing filters or not
   */
  constructor(
    sourceObject: Record<string, unknown>,
    table?: Table,
    isFacet?: boolean,
    sources?: unknown,
    mainTuple?: Tuple,
    skipProcessingFilters?: boolean,
  ) {
    this.sourceObject = sourceObject;

    // if the extra objects are not passed, we cannot process
    if (isObjectAndNotNull(table)) {
      const res = this._process(table!, isFacet, sources, mainTuple, skipProcessingFilters);
      if (typeof res === 'object' && res.error) {
        throw new Error(res.message);
      }
    }
  }

  /**
   * return a new sourceObjectWrapper that is created by merging the given sourceObject and existing object.
   *
   * Useful when we have an object with sourcekey and want to find the actual definition. You can then call
   * clone on the source-def and pass the object.
   *
   * const myCol = {"sourcekey": "some_key"};
   * const sd = table.sourceDefinitions.getSource(myCol.sourcekey);
   * if (sd) {
   *   const wrapper = sd.clone(myCol, table);
   * }
   *
   * - attributes in sourceObject will override the similar ones in the current object.
   * - "source" of sourceObject will be ignored. so "sourcekey" always has priority over "source".
   * - mainTuple should be passed in detailed context so we can use it for filters.
   *
   * @param sourceObject the source object
   * @param table the table that these sources belong to.
   * @param isFacet whether this is for a facet or not
   */
  clone(sourceObject: Record<string, unknown>, table: Table, isFacet?: boolean, mainTuple?: Tuple): SourceObjectWrapper {
    let key: string;

    // remove the definition attributes
    _sourceDefinitionAttributes.forEach(function (attr: string) {
      delete sourceObject[attr];
    });

    for (key in this.sourceObject) {
      if (!Object.prototype.hasOwnProperty.call(this.sourceObject, key)) continue;

      // only add the attributes that are not defined again
      if (!Object.prototype.hasOwnProperty.call(sourceObject, key)) {
        sourceObject[key] = this.sourceObject[key];
      }
    }

    return new SourceObjectWrapper(sourceObject, table, isFacet, undefined, mainTuple);
  }

  /**
   * Parse the given sourceobject and create the attributes
   * @param table
   * @param isFacet  -- validation is differrent if it's a facet
   * @param sources already generated source (only useful for source-def generation)
   * @param mainTuple the main tuple that is used for filters
   * @param skipProcessingFilters whether we should skip processing filters or not
   * @returns
   */
  private _process(
    table: Table,
    isFacet?: boolean,
    sources?: any,
    mainTuple?: Tuple,
    skipProcessingFilters?: boolean
  ): true | { error: boolean; message: string } {
    const sourceObject = this.sourceObject;
    const wm = _warningMessages;

    const returnError = (message: string) => {
      return { error: true, message: message };
    };

    if (typeof sourceObject !== 'object' || !sourceObject.source) {
      return returnError(wm.INVALID_SOURCE);
    }

    let colName: string;
    let col: Column | undefined = undefined;
    let colTable = table;
    const source = sourceObject.source;
    let sourceObjectNodes: SourceObjectNode[] = [];
    let hasPath = false;
    let hasInbound = false;
    let hasPrefix = false;
    let isAllOutboundNotNull = false;
    let isAllOutboundNotNullPerModel = false;
    let lastForeignKeyNode: SourceObjectNode | undefined = undefined;
    let firstForeignKeyNode: SourceObjectNode | undefined = undefined;
    let foreignKeyPathLength = 0;
    let isFiltered = false;
    let filterProps: FilterPropsType | undefined = undefined;

    // just the column name
    if (isStringAndNotEmpty(source) && typeof source === 'string') {
      colName = source;
    }
    // from 0 to source.length-1 we have paths
    else if (Array.isArray(source) && source.length === 1 && isStringAndNotEmpty(source[0])) {
      colName = source[0];
    } else if (Array.isArray(source) && source.length > 1) {
      const res = _sourceColumnHelpers.processDataSourcePath(
        source,
        table,
        table.name,
        table.schema.catalog.id,
        sources,
        mainTuple,
        skipProcessingFilters
      ) as any;

      if (res.error) {
        return res;
      }

      hasPath = res.foreignKeyPathLength > 0;
      hasInbound = res.hasInbound;
      hasPrefix = res.hasPrefix;
      firstForeignKeyNode = res.firstForeignKeyNode;
      lastForeignKeyNode = res.lastForeignKeyNode;
      colTable = res.column.table;
      foreignKeyPathLength = res.foreignKeyPathLength;
      sourceObjectNodes = res.sourceObjectNodes;
      colName = res.column.name;
      isFiltered = res.isFiltered;
      filterProps = res.filterProps;
      isAllOutboundNotNull = res.isAllOutboundNotNull;
      isAllOutboundNotNullPerModel = res.isAllOutboundNotNullPerModel;
    } else {
      return returnError('Invalid source definition');
    }

    // we need this check here to make sure the column is in the table
    try {
      col = colTable.columns.get(colName);
    } catch {
      return returnError(wm.INVALID_COLUMN_IN_SOURCE_PATH);
    }
    const isEntity = hasPath && sourceObject.entity !== false && col.isUniqueNotNull;

    // validate aggregate fn
    if (isFacet !== true && typeof sourceObject.aggregate === 'string' && _pseudoColAggregateFns.indexOf(sourceObject.aggregate) === -1) {
      return returnError(wm.INVALID_AGG);
    }

    this.column = col;

    this.hasPrefix = hasPrefix;
    // NOTE hasPath only means foreign key path and not filter
    this.hasPath = hasPath;
    this.foreignKeyPathLength = foreignKeyPathLength;
    this.hasInbound = hasInbound;
    this.hasAggregate = typeof sourceObject.aggregate === 'string';
    this.isFiltered = isFiltered;
    this.filterProps = filterProps;
    this.isEntityMode = isEntity;
    this.isUnique = !this.hasAggregate && !this.isFiltered && (!hasPath || !hasInbound);

    // TODO FILTER_IN_SOURCE better name...
    /**
     * these type of columns would be very similiar to aggregate columns.
     * but it requires more changes in both chaise and ermrestjs
     * (most probably a new column type or at least more api to fetch their values is needed)
     * (in chaise we would have to add a new type of secondary requests to active list)
     * (not sure if these type of pseudo-columns are even useful or not)
     * so for now we're not going to allow these type of pseudo-columns in visible-columns
     */
    this.isUniqueFiltered = !this.hasAggregate && this.isFiltered && (!hasPath || !hasInbound);

    this.isAllOutboundNotNullPerModel = isAllOutboundNotNullPerModel;
    this.isAllOutboundNotNull = isAllOutboundNotNull;

    // attach last fk
    if (lastForeignKeyNode !== undefined && lastForeignKeyNode !== null) {
      this.lastForeignKeyNode = lastForeignKeyNode;
    }

    // attach first fk
    if (firstForeignKeyNode !== undefined && firstForeignKeyNode !== null) {
      this.firstForeignKeyNode = firstForeignKeyNode;
    }

    // generate name:
    // TODO maybe we shouldn't even allow aggregate in faceting (for now we're ignoring it)
    if (
      sourceObject.self_link === true ||
      this.isFiltered ||
      this.hasPath ||
      this.isEntityMode ||
      (isFacet !== true && this.hasAggregate)
    ) {
      this.name = _sourceColumnHelpers.generateSourceObjectHashName(sourceObject, !!isFacet, sourceObjectNodes) as string;

      this.isHash = true;

      if (table.columns.has(this.name)) {
        return returnError(
          'Generated Hash `' + this.name + '` for pseudo-column exists in table `' + table.name + '`.'
        );
      }
    } else {
      this.name = col.name;
      this.isHash = false;
    }

    this.sourceObjectNodes = sourceObjectNodes;

    return true;
  }

  /**
   * Return the string representation of this foreignkey path
   * returned format:
   * if not isLeft and outAlias is not passed: ()=()/.../()=()
   * if isLeft: left()=()/.../left()=()
   * if outAlias defined: ()=()/.../outAlias:=()/()
   * used in:
   *   - export default
   *   - column.getAggregate
   *   - reference.read
   * @param reverse whether we want the reverse path
   * @param isLeft use left join
   * @param outAlias the alias that should be added to the output
   */
  toString(reverse?: boolean, isLeft?: boolean, outAlias?: string, isReverseRightJoin?: boolean): string {
    return this.sourceObjectNodes.reduce((prev: string, sn: any, i: number) => {
      if (sn.isFilter) {
        if (reverse) {
          return sn.toString() + (i > 0 ? '/' : '') + prev;
        } else {
          return prev + (i > 0 ? '/' : '') + sn.toString();
        }
      }

      // it will always be the first one
      if (sn.isPathPrefix) {
        // if we're reversing, we have to add alias to the first one,
        // otherwise we only need to add alias if this object only has a prefix and nothing else
        if (reverse) {
          return sn.toString(reverse, isLeft, outAlias, isReverseRightJoin);
        } else {
          return sn.toString(
            reverse,
            isLeft,
            this.foreignKeyPathLength === sn.nodeObject.foreignKeyPathLength ? outAlias : null,
            isReverseRightJoin
          );
        }
      }

      const fkStr = sn.toString(reverse, isLeft);
      const addAlias =
        outAlias &&
        ((reverse && sn === this.firstForeignKeyNode) || (!reverse && sn === this.lastForeignKeyNode));

      // NOTE alias on each node is ignored!
      // currently we've added alias only for the association and
      // therefore it's not really needed here anyways
      let res = '';
      if (reverse) {
        if (i > 0) {
          res += fkStr + '/';
        } else {
          if (addAlias) {
            res += outAlias + ':=';
            if (isReverseRightJoin) {
              res += 'right';
            }
          }
          res += fkStr;
        }

        res += prev;
        return res;
      } else {
        return prev + (i > 0 ? '/' : '') + (addAlias ? outAlias + ':=' : '') + fkStr;
      }
    }, '');
  }

  /**
   * Turn this into a raw source path without any path prefix
   * NOTE the returned array is not a complete path as it
   *      doesn't include the last column
   * currently used in two places:
   *   - generating hashname for a sourcedef that uses path prefix
   *   - generating the reverse path for a related entitty
   * @param reverse
   * @param outAlias alias that will be added to the last fk
   *                     regardless of reversing or not
   */
  getRawSourcePath(reverse?: boolean, outAlias?: string): any[] {
    const path: any[] = [];
    const len = this.sourceObjectNodes.length;
    const isLast = (index: number) => {
      return reverse ? index >= 0 : index < len;
    };

    let i = reverse ? len - 1 : 0;
    while (isLast(i)) {
      const sn = this.sourceObjectNodes[i];
      if (sn.isPathPrefix) {
        // if this is the last element, we have to add the alias to this
        path.push(
          ...sn.nodeObject.getRawSourcePath(
            reverse,
            this.foreignKeyPathLength == sn.nodeObject.foreignKeyPathLength ? outAlias : null
          )
        );
      } else if (sn.isFilter) {
        path.push(sn.nodeObject);
      } else {
        let obj: any;
        if ((reverse && sn.isInbound) || (!reverse && !sn.isInbound)) {
          obj = { outbound: sn.nodeObject.constraint_names[0] };
        } else {
          obj = { inbound: sn.nodeObject.constraint_names[0] };
        }

        // add alias to the last element
        if (isStringAndNotEmpty(outAlias) && sn == this.lastForeignKeyNode) {
          obj.alias = outAlias;
        }

        path.push(obj);
      }

      i = i + (reverse ? -1 : 1);
    }
    return path;
  }

  /**
   * Return the reverse path as facet with the value of shortestkey
   * currently used in two places:
   *   - column.refernece
   *   - reference.generateRelatedReference
   * both are for generating the reverse related entity path
   * @param tuple
   * @param rootTable
   * @param outAlias
   */
  getReverseAsFacet(tuple: Tuple, rootTable: Table, outAlias?: string): any {
    if (!isObjectAndNotNull(tuple)) return null;
    let i: number;
    const filters: any[] = [];
    let filterSource: any[] = [];

    // create the reverse path
    filterSource = this.getRawSourcePath(true, outAlias);

    // add the filter data
    for (i = 0; i < rootTable.shortestKey.length; i++) {
      const col: Column = rootTable.shortestKey[i];
      if (!tuple.data || !tuple.data[col.name]) {
        return null;
      }
      const filter: any = {
        source: filterSource.concat(col.name),
      };
      filter[_facetFilterTypes.CHOICE] = [tuple.data[col.name]];
      filters.push(filter);
    }

    if (filters.length == 0) {
      return null;
    }

    return { and: filters };
  }

  /**
   * if sourceObject has the required input_iframe properties, will attach `inputIframeProps` and `isInputIframe`
   * to the sourceObject.
   * The returned value of this function summarizes whether processing was successful or not.
   *
   * var res = processInputIframe(reference, tuple, usedColumnMapping);
   * if (res.error) {
   *   console.log(res.message);
   * } else {
   *  // success
   * }
   *
   * @param reference the reference object of the parent
   * @param usedIframeInputMappings an object capturing columns used in other mappings. used to avoid overlapping
   * @param tuple the tuple object
   */
  processInputIframe(reference: Reference, usedIframeInputMappings: any, tuple?: Tuple): {
    success?: boolean;
    error?: boolean;
    message?: string;
    columns?: ReferenceColumn[];
  } {
    const context = reference.context;
    const annot: any = this.sourceObject.input_iframe;
    if (!isObjectAndNotNull(annot) || !isStringAndNotEmpty(annot.url_pattern)) {
      return { error: true, message: 'url_pattern not defined.' };
    }

    if (!isObjectAndNotNull(annot.field_mapping)) {
      return { error: true, message: 'field_mapping not defined.' };
    }

    const optionalFieldNames: string[] = [];
    if (Array.isArray(annot.optional_fields)) {
      annot.optional_fields.forEach(function (f: unknown) {
        if (isStringAndNotEmpty(f) && typeof f === 'string') optionalFieldNames.push(f);
      });
    }

    let emptyFieldConfirmMessage = '';
    if (isStringAndNotEmpty(annot.empty_field_confirm_message_markdown)) {
      emptyFieldConfirmMessage = renderMarkdown(annot.empty_field_confirm_message_markdown);
    }

    const columns: ReferenceColumn[] = [];
    const fieldMapping: Record<string, ReferenceColumn> = {};
    for (const f in annot.field_mapping) {
      const colName = annot.field_mapping[f];

      // column already used in another mapping
      if (colName in usedIframeInputMappings) {
        return {
          error: true,
          message: 'column `' + colName + '` already used in another field_mapping.',
        };
      }

      try {
        const c = this.column!.table.columns.get(colName);
        const isSerial = c.type.name.indexOf('serial') === 0;

        // we cannot use getInputDisabled since we just want to do this based on ACLs
        if (
          context === _contexts.CREATE &&
          (c.isSystemColumn || c.isGeneratedPerACLs || isSerial)
        ) {
          if (colName in optionalFieldNames) continue;
          return {
            error: true,
            message: 'column `' + colName + '` cannot be modified by this user.',
          };
        }
        if (
          (context === _contexts.EDIT || context === _contexts.ENTRY) &&
          (c.isSystemColumn || c.isImmutablePerACLs || isSerial)
        ) {
          if (colName in optionalFieldNames) continue;
          return {
            error: true,
            message: 'column `' + colName + '` cannot be modified by this user.',
          };
        }

        // create a pseudo-column will make sure we're also handling assets
        const wrapper = new SourceObjectWrapper({ source: colName }, reference.table);
        const refCol = createPseudoColumn(reference, wrapper, tuple);

        fieldMapping[f] = refCol;
        columns.push(refCol);
      } catch {
        if (colName in optionalFieldNames) continue;
        return { error: true, message: 'column `' + colName + '` not found.' };
      }
    }

    this.isInputIframe = true;
    this.inputIframeProps = {
      /**
       * can be used for finding the location of iframe
       */
      urlPattern: annot.url_pattern,
      urlTemplateEngine: annot.template_engine,
      /**
       * the columns used in the mapping
       */
      columns: columns,
      /**
       * an object from field name to column.
       */
      fieldMapping: fieldMapping,
      /**
       * name of optional fields
       */
      optionalFieldNames: optionalFieldNames,
      /**
       * the message that we should show when user wants to submit empty.
       */
      emptyFieldConfirmMessage: emptyFieldConfirmMessage,
    };

    return { success: true, columns: columns };
  }

  /**
   * @param mainTuple
   * @param dontThrowError if set to true, will not throw an error if the filters are not valid
   */
  processFilterNodes(mainTuple?: Tuple, dontThrowError?: boolean): {
    success: boolean;
    error?: boolean;
    message?: string;
  } {
    if (!this.filterProps || this.filterProps.isFilterProcessed) {
      return { success: true };
    }

    try {
      for (const sn of this.sourceObjectNodes) {
        if (sn.isPathPrefix) {
          sn.nodeObject.processFilterNodes(mainTuple);
        } else if (sn.isFilter) {
          sn.processFilter(mainTuple);
        }
      }

      this.filterProps.isFilterProcessed = true;

      return { success: true };
    } catch (exp: unknown) {
      if (dontThrowError) {
        return { success: false, error: true, message: (exp as Error).message };
      } else {
        throw exp;
      }
    }
  }
}

export default SourceObjectWrapper;
