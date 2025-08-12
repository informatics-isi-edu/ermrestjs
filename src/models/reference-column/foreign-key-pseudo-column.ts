// models
import { ReferenceColumn, ReferenceColumnTypes } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import SourceObjectNode from '@isrd-isi-edu/ermrestjs/src/models/source-object-node';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { isObjectAndNotNull, isStringAndNotEmpty, isObjectAndKeyExists } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { _annotations, _foreignKeyInputModes } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { Reference, Tuple } from '@isrd-isi-edu/ermrestjs/js/reference';
import { Column, ForeignKeyRef, Table } from '@isrd-isi-edu/ermrestjs/js/core';
import {
  _generateTupleUniqueId,
  _getFormattedKeyValues,
  _renderTemplate,
  _generateRowPresentation,
  _getRowTemplateVariables,
  processMarkdownPattern,
  _isValidBulkCreateForeignKey,
  encodeFacet,
  _generateRowName,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { Location, parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import { _compressSource } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

/**
 * @class
 * @param {Reference} reference column's reference
 * @param {ForeignKeyRef} fk the foreignkey
 * @desc
 * Constructor for ForeignKeyPseudoColumn. This class is a wrapper for {@link ForeignKeyRef}.
 * This class extends the {@link ReferenceColumn}
 */
export class ForeignKeyPseudoColumn extends ReferenceColumn {
  /**
   * @type {boolean}
   * @desc indicates that this object represents a PseudoColumn.
   */
  public isPseudo: boolean = true;

  /**
   * @type {boolean}
   * @desc Indicates that this ReferenceColumn is a Foreign key.
   */
  public isForeignKey: boolean = true;

  /**
   * @type {Reference}
   * @desc The reference object that represents the table of this PseudoColumn
   */
  public reference: Reference;

  /**
   * @type {ForeignKeyRef}
   * @desc The Foreign key object that this PseudoColumn is created based on
   */
  public foreignKey: ForeignKeyRef;

  /**
   * the table that this fk refers to
   */
  public table: Table;

  /**
   * the concatenate version of names
   * TODO should we rename this? or change it to private?
   */
  public _constraintName: string;

  // cached properties
  private _hasDomainFilter?: boolean;
  private _domainFilterUsedColumns?: any[];
  private _domainFilterRawString?: string;
  private _defaultValues?: any;
  private _defaultReference?: Reference | null;

  constructor(reference: Reference, fk: ForeignKeyRef, sourceObjectWrapper?: SourceObjectWrapper, name?: string) {
    // call the parent constructor
    super(reference, fk.colset.columns, sourceObjectWrapper, name);

    this.referenceColumnType = ReferenceColumnTypes.FOREIGN_KEY;

    // create ermrest url using the location
    const table = fk.key.table;
    const ermrestURI = [
      table.schema.catalog.server.uri,
      'catalog',
      table.schema.catalog.id,
      'entity',
      [fixedEncodeURIComponent(table.schema.name), fixedEncodeURIComponent(table.name)].join(':'),
    ].join('/');

    this.reference = new Reference(parse(ermrestURI), table.schema.catalog);
    this.foreignKey = fk;

    // NOTE added for compatibility
    // I cannot simply create a sourceObjectWrapper because it needs a shortestkey of length one.
    if (!isObjectAndNotNull(sourceObjectWrapper)) {
      this.lastForeignKeyNode = new SourceObjectNode(fk, fk.table, false, true, false, false, undefined, undefined, false);
      this.firstForeignKeyNode = this.lastForeignKeyNode;
      this.sourceObjectNodes = [this.lastForeignKeyNode];
      this.foreignKeyPathLength = 1;
    }

    this._constraintName = this.foreignKey._constraintName;
    this.table = this.foreignKey.key.table;
  }

  /**
   * Given the available tuple data, generate the uniqueId for the selected row from the table this pseudo column points to
   *
   * @param {Object} linkedData key-value pairs of column values of the table this pseudocolumn points to
   */
  generateUniqueId(linkedData: any): string {
    return _generateTupleUniqueId(this.reference.table.shortestKey, linkedData);
  }

  /**
   * This function takes in a tuple and generates a reference that is
   * constrained based on the domain_filter_pattern annotation. If this
   * annotation doesn't exist, it returns this (reference)
   * `this` is the same as column.reference
   * @param {ReferenceColumn} column - column that `this` is based on
   * @param {Object} data - tuple data with potential constraints
   * @returns {Reference} the constrained reference
   */
  filteredRef(data: any, linkedData: any): Reference {
    const getFilteredRef = (self: this) => {
      const currURI = self.reference.uri;
      const currTable = self.reference.table; // the projected table
      const baseTable = self._baseReference.table; // the main (base) table
      let filterPattern: string | undefined; // the filter pattern
      let filterPatternTemplate: string | undefined; // the template used with the pattern
      let uriFilter: string | undefined; // the ermrest path
      let displayname: string | undefined; // the displayname value
      let displaynameMkdn: string | undefined; // capture the unformatted value of displayname
      let location: Location | null = null; // the output location (used for creating the output reference)
      let cfacets: any; // custom facet created based on the filter pattern

      // if the annotation didn't exist
      if (!self.foreignKey.annotations.contains(_annotations.FOREIGN_KEY)) {
        return new Reference(parse(currURI), currTable.schema.catalog);
      }

      // formatted key values used in templating
      const keyValues = _getFormattedKeyValues(baseTable, self._context, data, linkedData);
      // the annotation content
      const content = self.foreignKey.annotations.get(_annotations.FOREIGN_KEY).content;

      // make sure the annotation is properly defined
      if (isObjectAndNotNull(content.domain_filter) && isStringAndNotEmpty(content.domain_filter.ermrest_path_pattern)) {
        filterPattern = content.domain_filter.ermrest_path_pattern;
        filterPatternTemplate = content.domain_filter.template_engine;

        // if displayname is passed, process it
        if (isStringAndNotEmpty(content.domain_filter.display_markdown_pattern)) {
          displaynameMkdn = _renderTemplate(content.domain_filter.display_markdown_pattern, keyValues, baseTable.schema.catalog, {
            templateEngine: filterPatternTemplate,
          });

          if (displaynameMkdn !== undefined && displaynameMkdn !== null && displaynameMkdn.trim() !== '') {
            displayname = renderMarkdown(displaynameMkdn, true);
          }
        }
      }
      // backward compatibility
      else if (typeof content.domain_filter_pattern === 'string') {
        filterPattern = content.domain_filter_pattern;
        filterPatternTemplate = content.template_engine;
      }

      // process the filter pattern
      if (filterPattern) {
        uriFilter = _renderTemplate(filterPattern, keyValues, baseTable.schema.catalog, { templateEngine: filterPatternTemplate });
      }

      // ignore the annotation if given path is empty
      if (typeof uriFilter === 'string' && uriFilter.trim() !== '') {
        // create a cfacets based on the given domain filter pattern
        cfacets = { ermrest_path: uriFilter, removable: false };

        // attach the displayname if it's non empty
        if (isStringAndNotEmpty(displayname)) {
          cfacets.displayname = {
            value: displayname,
            unformatted: displaynameMkdn,
            isHTML: true,
          };
        }

        // see if we can parse the url, otherwise ignore the annotation
        try {
          location = parse(currURI + '/*::cfacets::' + encodeFacet(cfacets));
        } catch (exp) {
          $log.error('given domain_filter throws error, ignoring it. ', exp);
        }
      }

      // if the annotation is missing or is invalid, location will be undefined
      if (!location) {
        location = parse(currURI);
      }

      return new Reference(location, currTable.schema.catalog);
    };

    return getFilteredRef(this);
  }

  getDefaultDisplay(rowValues: any): any {
    const fkColumns = this.foreignKey.colset.columns;
    const keyColumns = this.foreignKey.key.colset.columns;
    const mapping = this.foreignKey.mapping;
    const table = this.table;
    const keyPairs: string[] = [];
    const keyValues: string[] = [];
    let caption: string;
    let isHTML: boolean;
    let col: Column;
    let isNull = false;
    let i: number;

    const fkValues: any = {};
    let ref = null;

    // make sure we have all the values and map them to the referred table
    for (i = 0; i < fkColumns.length; i++) {
      if (rowValues[fkColumns[i].name] === null || rowValues[fkColumns[i].name] === undefined) {
        isNull = true; // return null if one of them is null;
        break;
      }
      fkValues[mapping.get(fkColumns[i]).name] = rowValues[fkColumns[i].name];
    }

    if (!isNull) {
      // get the fkValues for using in reference creation
      for (i = 0; i < keyColumns.length; i++) {
        col = keyColumns[i];
        keyValues.push(col.formatvalue(fkValues[col.name], this._context) as string);
        keyPairs.push(fixedEncodeURIComponent(col.name) + '=' + fixedEncodeURIComponent(fkValues[col.name]));
      }

      // use row name as the caption
      const rowName = _generateRowName(this.table, this._context, fkValues, {}, false);
      caption = rowName.value;
      isHTML = rowName.isHTML;

      // use "col_1:col_2:col_3"
      if (caption.trim() === '') {
        caption = keyValues.join(':');
        isHTML = false;
      }

      const finalRownameValue = caption.trim() !== '' ? caption : null;

      const refURI = [
        table.schema.catalog.server.uri,
        'catalog',
        table.schema.catalog.id,
        this._baseReference.location.api,
        [fixedEncodeURIComponent(table.schema.name), fixedEncodeURIComponent(table.name)].join(':'),
        keyPairs.join('&'),
      ].join('/');
      ref = new Reference(parse(refURI), table.schema.catalog);

      return {
        rowname: { value: finalRownameValue, isHTML: isHTML },
        values: fkValues,
        reference: ref,
      };
    }

    return {
      rowname: { value: null, isHTML: false },
      values: {},
      reference: null,
    };
  }

  _determineDefaultValue(): void {
    const res = { rowname: { value: null }, reference: null, values: {} };
    const defaultValues: any = {};

    // make sure all the foreign key columns have default
    const allSet = this.foreignKey.colset.columns.every((col: Column) => {
      defaultValues[col.name] = col.default;
      return col.default !== null && col.default !== undefined;
    });

    if (allSet) {
      const result = this.getDefaultDisplay(defaultValues);
      res.rowname = result.rowname;
      res.values = result.values;
      res.reference = result.reference;
    }

    // set the attributes
    this._default = res.rowname.value;
    this._defaultValues = res.values;
    this._defaultReference = res.reference;
  }

  formatPresentation(data: any, context?: string, templateVariables?: any, options?: any): any {
    data = data || {};
    options = options || {};

    if (!isStringAndNotEmpty(context)) {
      context = this._context;
    }

    const nullValue = {
      isHTML: false,
      value: this._getNullValue(context!),
      unformatted: this._getNullValue(context!),
    };

    // if there's wait_for, this should return null.
    if (this.hasWaitFor && !options.skipWaitFor) {
      return nullValue;
    }

    if (this.display.sourceMarkdownPattern) {
      const keyValues: any = {};
      const selfTemplateVariables = {
        $self: _getRowTemplateVariables(this.table, context!, data),
      };
      Object.assign(keyValues, templateVariables, selfTemplateVariables);
      return processMarkdownPattern(this.display.sourceMarkdownPattern, keyValues, this.table, context!, {
        templateEngine: this.display.sourceTemplateEngine,
      });
    }

    const pres = _generateRowPresentation(this.foreignKey.key, data, context!, this._getShowForeignKeyLink(context!));
    return pres ? pres : nullValue;
  }

  sourceFormatPresentation(templateVariables: any, columnValue: any, mainTuple: Tuple) {
    const context = this._context;

    if (this.display.sourceMarkdownPattern) {
      let selfTemplateVariables = {};
      if (mainTuple._linkedData[this.name]) {
        selfTemplateVariables = {
          $self: _getRowTemplateVariables(this.table, context, mainTuple._linkedData[this.name]),
        };
      }

      const keyValues = {};
      Object.assign(keyValues, templateVariables, selfTemplateVariables);
      return processMarkdownPattern(this.display.sourceMarkdownPattern, keyValues, this.table, context, {
        templateEngine: this.display.sourceTemplateEngine,
      });
    }

    return this.formatPresentation(mainTuple._linkedData[this.name], mainTuple._pageRef._context, null, { skipWaitFor: true });
  }

  _determineSortable(): void {
    const display = this.display;

    this._sortColumns_cached = [];
    this._sortable = false;

    // disable the sort
    if (display !== undefined && display.columnOrder === false) return;

    // use the column_order
    if (display !== undefined && display.columnOrder !== undefined && display.columnOrder.length !== 0) {
      this._sortColumns_cached = display.columnOrder;
      this._sortable = true;
      return;
    }

    // use row-order of the table
    if (this.reference.display._rowOrder !== undefined) {
      this._sortColumns_cached = this.reference.display._rowOrder;
      this._sortable = true;
      return;
    }

    // if simple, use column
    if (this.foreignKey.simple) {
      const baseCol = this.foreignKey.mapping.get(this.baseColumns[0]);

      this._sortColumns_cached = baseCol._getSortColumns(this._context); // might return undefined

      if (typeof this._sortColumns_cached === 'undefined') {
        this._sortColumns_cached = [];
      } else {
        this._sortable = true;
      }
    }
  }

  // Getters for various properties
  get hasDomainFilter(): boolean {
    if (this._hasDomainFilter === undefined) {
      const populateDomainFilterProps = (self: this) => {
        // the annotation didn't exist
        if (!self.foreignKey.annotations.contains(_annotations.FOREIGN_KEY)) {
          self._domainFilterRawString = '';
          self._domainFilterUsedColumns = [];
          return false;
        }

        const content = self.foreignKey.annotations.get(_annotations.FOREIGN_KEY).content;

        // the annotation is properly defined
        if (isObjectAndNotNull(content.domain_filter) && isStringAndNotEmpty(content.domain_filter.ermrest_path_pattern)) {
          self._domainFilterRawString = content.domain_filter.ermrest_path_pattern;

          let usedColumns: ReferenceColumn[] = [];
          if (Array.isArray(content.domain_filter.pattern_sources)) {
            usedColumns = self._baseReference.generateColumnsList(undefined, content.domain_filter.pattern_sources, true, true);
          }
          self._domainFilterUsedColumns = usedColumns;

          return true;
        }
        // backward compatibility
        else if (typeof content.domain_filter_pattern === 'string') {
          self._domainFilterRawString = content.domain_filter_pattern;
          self._domainFilterUsedColumns = [];
          return true;
        }

        self._domainFilterRawString = '';
        self._domainFilterUsedColumns = [];
        return false;
      };

      this._hasDomainFilter = populateDomainFilterProps(this);
    }
    return this._hasDomainFilter;
  }

  get domainFilterUsedColumns(): any[] {
    if (this._domainFilterUsedColumns === undefined) {
      // this will populate _domainFilterUsedColumns too
    }
    return this._domainFilterUsedColumns!;
  }

  get domainFilterRawString(): string {
    if (this._domainFilterRawString === undefined) {
      // this will populate _domainFilterRawString too
    }
    return this._domainFilterRawString!;
  }

  get defaultValues(): any {
    if (this._defaultValues === undefined) {
      this._determineDefaultValue();
    }
    return this._defaultValues;
  }

  get defaultReference(): Reference | null {
    if (this._defaultReference === undefined) {
      this._determineDefaultValue();
    }
    return this._defaultReference ? this._defaultReference : null;
  }

  get name(): string {
    if (this._name === undefined) {
      this._name = this.foreignKey.name;
    }
    return this._name!;
  }

  get RID(): string | undefined {
    if (this._RID === undefined) {
      this._RID = this.foreignKey.RID;
    }
    return this._RID;
  }

  get displayname(): DisplayName {
    if (this._displayname === undefined) {
      const context = this._context;
      const foreignKey = this.foreignKey;
      const toName = foreignKey.getDisplay(context).toName;
      let value: string, isHTML: boolean, unformatted: string;

      if (this.sourceObject && this.sourceObject.markdown_name) {
        unformatted = this.sourceObject.markdown_name;
        value = renderMarkdown(unformatted, true);
        isHTML = true;
      } else if (toName) {
        value = unformatted = toName;
        isHTML = false;
      } else if (foreignKey.simple) {
        value = this.baseColumns[0].displayname.value;
        isHTML = this.baseColumns[0].displayname.isHTML;
        unformatted = this.baseColumns[0].displayname.unformatted;

        // disambiguate
        const otherSimpleFks = this.baseColumns[0].memberOfForeignKeys.some((fk: ForeignKeyRef) => {
          return fk.RID !== foreignKey.RID && fk.simple;
        });
        if (otherSimpleFks) {
          const tableName = foreignKey.key.table.displayname;
          value = `${tableName.value} (${value})`;
          unformatted = `${tableName.unformatted} (${unformatted})`;
          isHTML = tableName.isHTML || isHTML;
        }
      } else {
        value = foreignKey.key.table.displayname.value;
        isHTML = foreignKey.key.table.displayname.isHTML;
        unformatted = foreignKey.key.table.displayname.unformatted;

        // disambiguate
        const tableCount = foreignKey._table.foreignKeys.all().filter((fk: ForeignKeyRef) => {
          return fk.key.table.name === foreignKey.key.table.name && !fk.getDisplay(context).toName;
        }).length;

        if (tableCount > 1) {
          const colNames = foreignKey.colset.columns.map((c: Column) => c.displayname.unformatted).join(', ');
          value = `${value} (${colNames})`;
          unformatted = `${unformatted} (${colNames})`;
        }
      }
      this._displayname = { value, isHTML, unformatted };
    }
    return this._displayname;
  }

  get default(): any {
    if (this._default === undefined) {
      this._determineDefaultValue();
    }
    return this._default;
  }

  /**
   * use the underlying column comment if available, otherwise get it from the foreign key
   * (similar to displayname logic)
   */
  get comment(): CommentType {
    if (this._comment === undefined) {
      // calling the parent
      const parentComment = super.comment;
      this._comment = parentComment !== null ? parentComment : this.foreignKey.getDisplay(this._context).comment;
    }
    return this._comment!;
  }

  get display(): any {
    if (this._display_cached === undefined) {
      const res: any = {};
      const fkDisplay = this.foreignKey.getDisplay(this._context);
      const sourceDisplay: any = {};

      // attach display defined on the source
      if (this.sourceObject && this.sourceObject.display) {
        const displ = this.sourceObject.display;
        if (typeof displ.markdown_pattern === 'string') {
          sourceDisplay.sourceMarkdownPattern = displ.markdown_pattern;
          sourceDisplay.sourceTemplateEngine = displ.template_engine;
        }

        if (_foreignKeyInputModes.indexOf(displ.selector_ux_mode) !== -1) {
          sourceDisplay.inputDisplayMode = displ.selector_ux_mode;
        }

        // check visible-columns annotation display property and set to override property from fk annotation or display annotation
        // make sure `false` and `null` are not ignored since that turns this feature off
        if (_isValidBulkCreateForeignKey(displ.bulk_create_foreign_key)) {
          sourceDisplay.bulkForeignKeyCreateConstraintName = displ.bulk_create_foreign_key;
        }
      }

      if (this.sourceObject && typeof this.sourceObject.hide_column_header === 'boolean') {
        sourceDisplay.hideColumnHeader = this.sourceObject.hide_column_header;
      }

      Object.assign(res, fkDisplay, sourceDisplay);
      this._display_cached = res;
    }
    return this._display_cached;
  }

  get compressedDataSource(): any {
    if (this._compressedDataSource === undefined) {
      let ds: any;
      if (this.sourceObject && this.sourceObject.source) {
        ds = this.sourceObject.source;
      } else if (this.table.shortestKey.length === 1) {
        ds = [{ outbound: this.foreignKey.constraint_names[0] }, this.table.shortestKey[0].name];
      } else {
        ds = null;
      }
      this._compressedDataSource = _compressSource(ds);
    }
    return this._compressedDataSource;
  }

  get nullok(): boolean {
    if (this._nullok === undefined) {
      const hasReq = this.sourceObject && isObjectAndKeyExists(this.sourceObject.display, 'required');
      if (hasReq && typeof this.sourceObject.display.required === 'boolean') {
        this._nullok = !this.sourceObject.display.required;
      } else {
        // if there's required annotation on the foreignkey, then it's not nullok
        const hasAnnot = this.foreignKey.annotations.contains(_annotations.REQUIRED);
        if (hasAnnot) {
          this._nullok = false;
        } else {
          // will populate the this._nullok
          void super.nullok;
        }
      }
    }
    return this._nullok!;
  }
}
