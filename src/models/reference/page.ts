// models
import { Tuple, type Reference, type RelatedReference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import { type PseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';

// utils
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { _ERMrestFeatures, _parserAliases } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { _generateRowName, _getFormattedKeyValues, _getPagingValues, _renderTemplate } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
/**
 * Constructs a Page. A Page is a collection of Tuples. A page can contain no
 * data, but the reference is still valid. This is useful if you want to use
 * the reference later and need to represent a page, but you haven't read any
 * data yet.
 */
export class Page {
  private _ref: Reference | RelatedReference;
  private _etag: string | null;
  private _linkedData: any[];
  private _linkedDataRIDs: any[];
  private _data: any[];
  private _rightsSummary: any[];
  private _associationRightsSummary: any[];
  private _extraData?: any;
  private _extraLinkedData?: any;
  private _hasNext: boolean;
  private _hasPrevious: boolean;
  private _tuples?: Tuple[];
  private _length?: number;
  private _content?: string | null;
  private _templateVariables?: any[];

  constructor(reference: Reference, etag: string | null, data: any[], hasPrevious: boolean, hasNext: boolean, extraData?: any) {
    const hasExtraData = typeof extraData === 'object' && Object.keys(extraData).length !== 0;

    this._ref = reference;
    this._etag = etag;

    /*
     * This is the structure of this._linkedData
     * this._linkedData[i] = {`pseudo-column-name`: data}
     * That is for retrieving data for a foreign key, you should do the following:
     *
     * var fkData = this._linkedData[i][column.name];
     */
    this._linkedData = [];
    this._linkedDataRIDs = [];
    this._data = [];
    this._rightsSummary = [];
    this._associationRightsSummary = [];

    const allOutBounds = reference.activeList.allOutBounds;

    const trs = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
    const tcrs = _ERMrestFeatures.TABLE_COL_RIGHTS_SUMMARY;
    const associationTableAlias = _parserAliases.ASSOCIATION_TABLE;
    const fkAliasPreix = _parserAliases.FOREIGN_KEY_PREFIX;

    // for the association rights summary
    const associatonRef = (reference as RelatedReference).derivedAssociationReference;

    // same logic as _readPath to see if it's attributegroup output
    const hasLinkedData = allOutBounds.length > 0 || reference.canUseTCRS || reference.canUseTRS || (associatonRef && associatonRef.canUseTRS);

    if (hasLinkedData) {
      const fks = reference.table.foreignKeys.all();
      const mTableAlias = this._ref.location.mainTableAlias;

      try {
        // the attributegroup output
        for (let i = 0; i < data.length; i++) {
          // main data
          this._data.push(data[i][mTableAlias][0]);

          // fk data
          this._linkedData.push({});
          this._linkedDataRIDs.push({});
          for (let j = allOutBounds.length - 1; j >= 0; j--) {
            const pseudoCol = allOutBounds[j] as PseudoColumn;

            /**
             * if we've used scalar value in the projection list,
             * then we have to create an object to mimic values of the table
             * other parts of the code (formatpresentation) relies on an object
             * where values of each column is encoded. In this case the object
             * will have the value of only one column
             */
            if (pseudoCol.isPathColumn && pseudoCol.canUseScalarProjection) {
              // the value will not be an array
              const d: any = {};
              const fkData = data[i][fkAliasPreix + (j + 1)];
              if (fkData === undefined || fkData === null) {
                this._linkedData[i][pseudoCol.name] = null;
              } else {
                d[pseudoCol.baseColumn.name] = fkData;
                this._linkedData[i][pseudoCol.name] = d;
              }
            } else {
              this._linkedData[i][allOutBounds[j].name] = data[i][fkAliasPreix + (j + 1)][0];
            }
            this._linkedDataRIDs[i][allOutBounds[j].name] = allOutBounds[j].RID;
          }

          // table rights
          if (reference.canUseTCRS || reference.canUseTRS) {
            if (tcrs in data[i]) {
              this._rightsSummary.push(data[i][tcrs]);
            } else if (trs in data[i]) {
              this._rightsSummary.push(data[i][trs]);
            }
          }

          // association table rights
          if (associatonRef && associatonRef.canUseTRS) {
            const key = associationTableAlias + '_' + trs;
            if (key in data[i]) {
              this._associationRightsSummary.push(data[i][key]);
            }
          }
        }

        //extra data
        if (hasExtraData) {
          // main data
          this._extraData = extraData[mTableAlias][0];

          // fk data
          this._extraLinkedData = {};
          for (let j = allOutBounds.length - 1; j >= 0; j--) {
            const pseudoCol = allOutBounds[j] as PseudoColumn;
            /**
             * if we've used scalar value in the projection list,
             * then we have to create an object to mimic values of the table
             * other parts of the code (sort logic) relies on an object
             * where values of each column is encoded. In this case the object
             * will have the value of only one column
             */
            if (pseudoCol.isPathColumn && pseudoCol.canUseScalarProjection) {
              // the value will not be an array
              const d: any = {};
              const fkData = extraData[fkAliasPreix + (j + 1)];
              if (fkData === undefined || fkData === null) {
                this._extraLinkedData[pseudoCol.name] = null;
              } else {
                d[pseudoCol.baseColumn.name] = fkData;
                this._extraLinkedData[pseudoCol.name] = d;
              }
            } else {
              this._extraLinkedData[allOutBounds[j].name] = extraData[fkAliasPreix + (j + 1)][0];
            }
          }
        }
      } catch {
        // could not find the expected aliases
        let fkName: string, col: any, tempData: any, linkedDataMap: any, k: number;

        this._data = data;

        // add the main table data to linkedData
        this._linkedData = [];
        this._linkedDataRIDs = [];
        for (let i = 0; i < data.length; i++) {
          tempData = {};
          linkedDataMap = {};
          for (let j = 0; j < fks.length; j++) {
            fkName = fks[j].name;
            tempData[fkName] = {};
            linkedDataMap[fkName] = fks[j].RID;

            for (k = 0; k < fks[j].colset.columns.length; k++) {
              col = fks[j].colset.columns[k];
              tempData[fkName][fks[j].mapping.get(col).name] = data[i][col.name];
            }
          }
          this._linkedData.push(tempData);
          this._linkedDataRIDs.push(linkedDataMap);
        }

        // extra data
        if (hasExtraData) {
          this._extraData = extraData;
          tempData = {};
          for (let j = 0; j < fks.length; j++) {
            fkName = fks[j].name;
            tempData[fkName] = {};

            for (k = 0; k < fks[j].colset.columns.length; k++) {
              col = fks[j].colset.columns[k];
              tempData[fkName][fks[j].mapping.get(col).name] = extraData[col.name];
            }
          }
          this._extraLinkedData = tempData;
        }

        this._rightsSummary = [];
        this._associationRightsSummary = [];
      }
    }
    // entity output (linkedData is empty)
    else {
      this._data = data;
      this._extraData = hasExtraData ? extraData : undefined;
    }

    this._hasNext = hasNext;
    this._hasPrevious = hasPrevious;
  }

  get extraData(): any {
    return this._extraData;
  }

  get extraLinkedData(): any {
    return this._extraLinkedData;
  }

  /**
   * The page's associated reference.
   */
  get reference(): Reference | RelatedReference {
    return this._ref;
  }

  /**
   * An array of processed tuples. The results will be processed
   * according to the contextualized scheme (model) of this reference.
   *
   * Usage:
   * ```
   * for (var i=0, len=page.tuples.length; i<len; i++) {
   *   var tuple = page.tuples[i];
   *   console.log("Tuple:", tuple.displayname.value, "has values:", tuple.values);
   * }
   * ```
   */
  get tuples(): Tuple[] {
    if (this._tuples === undefined) {
      this._tuples = [];
      for (let i = 0; i < this._data.length; i++) {
        this._tuples.push(
          new Tuple(
            this._ref,
            this,
            this._data[i],
            this._linkedData[i],
            this._linkedDataRIDs[i],
            this._rightsSummary[i],
            this._associationRightsSummary[i],
          ),
        );
      }
    }
    return this._tuples;
  }

  /**
   * the page length (number of rows in the page)
   */
  get length(): number {
    if (this._length === undefined) {
      this._length = this._data.length;
    }
    return this._length;
  }

  /**
   * Whether there is more entities before this page
   */
  get hasPrevious(): boolean {
    return this._hasPrevious;
  }

  /**
   * A reference to the previous set of results.
   * Will return null if the sortObject of reference is missing or is invalid
   *
   * Usage:
   * ```
   * if (reference.previous) {
   *   // more tuples in the 'previous' direction are available
   *   reference.previous.read(10).then(
   *     ...
   *   );
   * }
   * ```
   */
  get previous(): Reference | null {
    if (this._hasPrevious) {
      return this._getSiblingReference(false);
    }
    return null;
  }

  /**
   * Whether there is more entities after this page
   */
  get hasNext(): boolean {
    return this._hasNext;
  }

  /**
   * A reference to the next set of results.
   * Will return null if the sortObject of reference is missing or is invalid
   *
   * Usage:
   * ```
   * if (reference.next) {
   *   // more tuples in the 'next' direction are available
   *   reference.next.read(10).then(
   *     ...
   *   );
   * }
   * ```
   */
  get next(): Reference | null {
    if (this._hasNext) {
      return this._getSiblingReference(true);
    }
    return null;
  }

  /**
   * Returns previous or next page
   * Clients should not directly use this. This is used in next and previous getters.
   * @param  next whether we want the next page or previous
   * @private
   */
  private _getSiblingReference(next: boolean): Reference | null {
    const loc = this._ref.location;

    // there's no sort, so no paging is possible
    if (!Array.isArray(loc.sortObject) || loc.sortObject.length === 0) {
      return null;
    }

    // data is not available
    if (!this._data || this._data.length === 0) {
      return null;
    }

    const newReference = this._ref.copy();

    // update paging by creating a new location
    newReference.setLocation(this._ref.location._clone(newReference));

    /* This will return the values that should be used for after/before
     * Let's assume the current page of data for the sort column is  [v1, v2, v3],
     * - the next page will be anything after v3
     * - the previous page will be anything before v1
     * Based on this, the function will return the first/last value of
     * the sort columns. So that it will be used for after/before in location object.
     * It is also taking care of duplicate columns, so it will be aligned with the read logic.
     */
    const rowIndex = next ? this._data.length - 1 : 0;
    const pageValues = _getPagingValues(this._ref, this._data[rowIndex], this._linkedData[rowIndex]);
    if (pageValues === null) {
      return null;
    }

    newReference.location.afterObject = next ? pageValues : null;
    newReference.location.beforeObject = next ? null : pageValues;
    return newReference;
  }

  getContent(templateVariables?: any): string | null {
    const ref = this._ref;

    if (!this._data || !this._data.length) return null;

    const display = ref.display;
    const values = [];

    // markdown_pattern in the source object
    if (typeof display.sourceMarkdownPattern === 'string') {
      const $self = this.tuples.map((t) => {
        return t.templateVariables;
      });
      const keyValues = Object.assign({ $self: $self }, templateVariables);

      let pattern = _renderTemplate(display.sourceMarkdownPattern, keyValues, ref.table.schema.catalog, {
        templateEngine: display.sourceTemplateEngine,
      });

      if (pattern === null || pattern.trim() === '') {
        pattern = ref.table._getNullValue(ref.context);
      }

      return renderMarkdown(pattern, false);
    }

    // page_markdown_pattern
    /*
     the object structure that is available on the annotation:
       $page = {
          rows: [
              {values, rowName, uri}
          ],
          parent: {
              values: [],
              table: "",
              schema: ""
          }
          // deprecated
          values: [],
      }
     */
    if (typeof display._pageMarkdownPattern === 'string') {
      const $page: any = {
        rows: this.tuples.map((t) => t.templateVariables),
        // (deprecated) should eventually be removed
        values: this.tuples.map((t) => t.templateVariables.values),
      };

      const relRef = ref as RelatedReference;
      if (relRef.mainTable) {
        const parent: { schema: string; table: string; values?: Record<string, unknown>[] } = {
          schema: relRef.mainTable.schema.name,
          table: relRef.mainTable.name,
        };

        if (relRef.mainTuple) {
          parent.values = _getFormattedKeyValues(relRef.mainTable, relRef.context, relRef.mainTuple.data, relRef.mainTuple.linkedData);
        }

        $page.parent = parent;
      }

      let pattern = _renderTemplate(display._pageMarkdownPattern, { $page: $page }, ref.table.schema.catalog, {
        templateEngine: display.templateEngine,
      });

      if (pattern === null || pattern.trim() === '') {
        pattern = ref.table._getNullValue(ref.context);
      }

      return renderMarkdown(pattern, false);
    }

    // row_markdown_pattern
    if (typeof display._rowMarkdownPattern === 'string') {
      // Iterate over all data rows to compute the row values depending on the row_markdown_pattern.
      for (let i = 0; i < this.tuples.length; i++) {
        const tuple = this.tuples[i];

        // make sure we have the formatted key values
        const keyValues = Object.assign({ $self: tuple.selfTemplateVariable }, tuple.templateVariables.values);

        // render template
        let value = _renderTemplate(display._rowMarkdownPattern, keyValues, ref.table.schema.catalog, {
          templateEngine: display.templateEngine,
        });

        // If value is null or empty, return value on basis of `show_null`
        if (value === null || value.trim() === '') {
          value = ref.table._getNullValue(ref.context);
        }
        // If final value is not null then push it in values array
        if (value !== null) {
          values.push(value);
        }
      }
      // Join the values array using the separator and prepend it with the prefix and append suffix to it.
      const pattern = ref.display._prefix + values.join(ref.display._separator) + ref.display._suffix;
      return renderMarkdown(pattern, false);
    }

    // no markdown_pattern, just return the list of row-names in this context (row_name/<context>)
    for (let i = 0; i < this.tuples.length; i++) {
      const tuple = this.tuples[i];
      const url = tuple.reference.contextualize.detailed.appLink;
      const rowName = _generateRowName(ref.table, ref.context, tuple.data, tuple.linkedData, false);

      // don't add link if the rowname already has link
      if (rowName.value.match(/<a\b.+href=/)) {
        values.push('* ' + rowName.unformatted + ' ' + ref.display._separator);
      } else {
        values.push('* [' + rowName.unformatted + '](' + url + ') ' + ref.display._separator);
      }
    }
    const pattern = ref.display._prefix + values.join(' ') + ref.display._suffix;
    return renderMarkdown(pattern, false);
  }

  /**
   * HTML representation of the whole page which uses table-display annotation.
   * If markdownPattern is defined then renderTemplate is called to get the correct display.
   * In case of no such markdownPattern is defined output is displayed in form of
   * unordered list with displayname as text content of the list.
   * For more info you can refer {ERM.reference.display}
   *
   * Usage:
   *```
   * var content = page.content;
   * if (content) {
   *    console.log(content);
   * }
   *```
   *
   * It will return:
   * 1. the rendered page_markdown_pattern if it's defined.
   * 2. the rendered row_markdown_pattern if it's defined.
   * 3. list of links that point to the row. Caption is going to be the row-name.
   */
  get content(): string | null {
    if (this._content === undefined) {
      this._content = this.getContent();
    }
    return this._content;
  }

  get templateVariables(): any[] {
    if (this._templateVariables === undefined) {
      const res: any[] = [];
      this.tuples.forEach((t) => {
        res.push(t.templateVariables);
      });
      this._templateVariables = res;
    }
    return this._templateVariables;
  }
}
