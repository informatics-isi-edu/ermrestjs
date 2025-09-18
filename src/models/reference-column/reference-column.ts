// models
import SourceObjectWrapper, { FilterPropsType, InputIframePropsType } from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import SourceObjectNode from '@isrd-isi-edu/ermrestjs/src/models/source-object-node';
import { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import { ColumnAggregateFn, ColumnGroupAggregateFn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { Tuple, Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// services

// utils
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isObjectAndKeyExists, isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _annotations, _contexts } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { Column, Table, Type } from '@isrd-isi-edu/ermrestjs/js/core';
import {
  _getFormattedKeyValues,
  _isEntryContext,
  _renderTemplate,
  processMarkdownPattern,
  _processACLAnnotation,
  _processSourceObjectComment,
  // _getRowTemplateVariables,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _compressSource, _processWaitForList } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

export enum ReferenceColumnTypes {
  PSEUDO = 'pseudo',
  KEY = 'key',
  ASSET = 'asset',
  FOREIGN_KEY = 'foreign_key',
  VIRTUAL = 'virtual',
  INBOUND_FOREIGN_KEY = 'inbound_foreign_key',
  GENERAL = 'general',
}

// function isForeignKeyPseudoColumn(column: ReferenceColumn): column is ForeignKeyPseudoColumn {
//   return column.referenceColumnType === ReferenceColumnTypes.FOREIGN_KEY;
// }

// function isAggregatePseudoColumn(column: unknown): column is PseudoColumn {
//   return (column as PseudoColumn).referenceColumnType === ReferenceColumnTypes.PSEUDO && (column as PseudoColumn).hasAggregate;
// }

/**
 * Constructor for ReferenceColumn. This class is a wrapper for Column.
 */
export class ReferenceColumn {
  // Public properties
  public referenceColumnType: ReferenceColumnTypes = ReferenceColumnTypes.GENERAL;
  public baseColumns: Column[];

  /**
   * the source object wrapper that this column is based on
   */
  public sourceObjectWrapper?: SourceObjectWrapper;
  /**
   * the column-directive object
   */
  public sourceObject: any = {};
  /**
   * The source object nodes
   */
  public sourceObjectNodes?: SourceObjectNode[];
  /**
   * the last fk node
   */
  public lastForeignKeyNode?: SourceObjectNode;
  /**
   * the first fk node
   */
  public firstForeignKeyNode?: SourceObjectNode;
  /**
   * how many fks node are in the path
   */
  public foreignKeyPathLength?: number;
  /**
   * whether the path is filtered
   */
  public isFiltered: boolean = false;
  /**
   * the filter props
   */
  public filterProps?: FilterPropsType;
  /**
   * whether input iframe is defined
   */
  public isInputIframe?: boolean;
  /**
   * input iframe props
   */
  public inputIframeProps?: InputIframePropsType;

  /**
   * whether the column is a pseudo column (differentiate between this base type and other more specific ones)
   */
  public isPseudo: boolean = false;
  public isUnique: boolean = true;

  /**
   * the table that this column belongs to
   */
  public table: Table;

  // Cached properties (some are protected instead of private so children can call)
  protected _displayname?: DisplayName;
  protected _RID?: string;
  private _type?: Type;
  protected _nullok?: boolean;
  protected _default?: any;
  private _aggregate?: ColumnAggregateFn | null;
  private _groupAggregate?: ColumnGroupAggregateFn | null;
  protected _comment?: CommentType;
  private _hideColumnHeader?: boolean;
  private _inputDisabled?: boolean | { message: string };
  protected _sortable?: boolean;
  protected _sortColumns_cached?: any[];
  protected _display_cached?: any;
  protected _compressedDataSource?: any;
  protected _hasWaitFor?: boolean;
  protected _hasWaitForAggregate?: boolean;
  protected _waitFor?: ReferenceColumn[];
  /**
   * the reference that this column is defined on
   */
  protected _baseReference: Reference;
  protected _context: string;
  protected _name?: string;
  protected _mainTuple?: Tuple;
  protected _currentTable: Table;

  constructor(reference: Reference, cols: Column[], sourceObjectWrapper?: SourceObjectWrapper, name?: string, mainTuple?: Tuple) {
    this._baseReference = reference;
    this._context = reference.context;
    this.baseColumns = cols;

    this.sourceObjectWrapper = sourceObjectWrapper;

    if (isObjectAndNotNull(sourceObjectWrapper)) {
      this.sourceObject = sourceObjectWrapper!.sourceObject;
      this.sourceObjectNodes = sourceObjectWrapper!.sourceObjectNodes;
      this.lastForeignKeyNode = sourceObjectWrapper!.lastForeignKeyNode;
      this.firstForeignKeyNode = sourceObjectWrapper!.firstForeignKeyNode;
      this.foreignKeyPathLength = sourceObjectWrapper!.foreignKeyPathLength;
      this.isFiltered = sourceObjectWrapper!.isFiltered;
      this.filterProps = sourceObjectWrapper!.filterProps;

      if (sourceObjectWrapper!.isInputIframe) {
        this.isInputIframe = true;
        this.inputIframeProps = sourceObjectWrapper!.inputIframeProps;
      }
    } else {
      this.isFiltered = false;
    }

    this.table = this.baseColumns.length > 0 ? this.baseColumns[0].table : reference.table;
    this._currentTable = this.baseColumns.length > 0 ? this.baseColumns[0].table : reference.table;
    if (typeof name === 'string') {
      this._name = name;
    }
    this._mainTuple = mainTuple;
  }

  /**
   * Name of the column.
   */
  get name(): string {
    if (this._name === undefined) {
      this._name = this.baseColumns.reduce((res, col, index) => {
        return res + (index > 0 ? ', ' : '') + col.name;
      }, '');
    }
    return this._name;
  }

  /**
   * The compressed source path from the main reference to this column
   */
  get compressedDataSource(): any {
    if (this._compressedDataSource === undefined) {
      let ds: any;
      if (this.sourceObject && this.sourceObject.source) {
        ds = this.sourceObject.source;
      } else if (this._simple) {
        ds = this.baseColumns[0].name;
      } else {
        ds = null;
      }

      this._compressedDataSource = _compressSource(ds);
    }
    return this._compressedDataSource;
  }

  /**
   * Display name of the column.
   */
  get displayname(): DisplayName {
    if (this._displayname === undefined) {
      if (this.sourceObject.markdown_name) {
        this._displayname = {
          value: renderMarkdown(this.sourceObject.markdown_name, true),
          unformatted: this.sourceObject.markdown_name,
          isHTML: true,
        };
      } else {
        this._displayname = {
          value: this.baseColumns.reduce((prev, curr, index) => {
            return prev + (index > 0 ? ':' : '') + curr.displayname.value;
          }, ''),
          isHTML: this.baseColumns.some((col) => col.displayname.isHTML),
          unformatted: this.baseColumns.reduce((prev, curr, index) => {
            return prev + (index > 0 ? ':' : '') + curr.displayname.unformatted;
          }, ''),
        };
      }
    }
    return this._displayname;
  }

  /**
   * ERMrest generated RID for this column
   */
  get RID(): string | undefined {
    if (this._RID === undefined) {
      this._RID = this.baseColumns[0].RID;
    }
    return this._RID;
  }

  /**
   * Type of the column
   */
  get type(): Type {
    if (this._type === undefined) {
      this._type = !this._simple || this.isPseudo ? new Type({ typename: 'markdown' }) : this.baseColumns[0].type;
    }
    return this._type;
  }

  /**
   * As long as any of the base columns are nullok, the ReferenceColumn is nullok.
   */
  get nullok(): boolean {
    if (this._nullok === undefined) {
      const hasReq = this.sourceObject && isObjectAndKeyExists(this.sourceObject.display, 'required');
      if (hasReq && typeof this.sourceObject.display.required === 'boolean') {
        this._nullok = !this.sourceObject.display.required;
      } else {
        this._nullok = this.baseColumns.some((col) => col.nullok);
      }
    }
    return this._nullok;
  }

  /**
   * Returns the default value
   */
  get default(): any {
    if (this._default === undefined) {
      this._default = this._simple ? this.baseColumns[0].default : null;
    }
    return this._default;
  }

  /**
   * Returns the aggregate function object
   */
  get aggregate(): ColumnAggregateFn | null {
    if (this._aggregate === undefined) {
      this._aggregate = !this.isPseudo ? new ColumnAggregateFn(this) : null;
    }
    return this._aggregate;
  }

  /**
   * Returns the aggregate group object
   */
  get groupAggregate(): ColumnGroupAggregateFn | null {
    if (this._groupAggregate === undefined) {
      this._groupAggregate = !this.isPseudo ? new ColumnGroupAggregateFn(this, this._baseReference) : null;
    }
    return this._groupAggregate;
  }

  /**
   * Documentation for this reference-column
   */
  get comment(): CommentType {
    if (this._comment === undefined) {
      let comment = null,
        commentDisplayMode: any,
        commentRenderMarkdown: any;
      if (this._simple) {
        const display = this.baseColumns[0].getDisplay(this._context);
        comment = display.comment;
        commentDisplayMode = display.commentDisplayMode;
        commentRenderMarkdown = display.commentRenderMarkdown;
      }

      if (!this.sourceObject) {
        this._comment = comment;
      } else {
        this._comment = _processSourceObjectComment(
          this.sourceObject,
          comment ? comment.unformatted : null,
          commentRenderMarkdown,
          commentDisplayMode,
        );
      }
    }
    return this._comment!;
  }

  /**
   * Whether the UI should hide the column header or not.
   */
  get hideColumnHeader(): boolean {
    if (this._hideColumnHeader === undefined) {
      this._hideColumnHeader = this.display.hideColumnHeader || false;
    }
    return this._hideColumnHeader!;
  }

  /**
   * Indicates if the input should be disabled
   */
  get inputDisabled(): boolean | { message: string } {
    if (this._inputDisabled === undefined) {
      this._inputDisabled = this._determineInputDisabled(this._context);
    }
    return this._inputDisabled;
  }

  /**
   * Whether the column is sortable
   */
  get sortable(): boolean {
    if (this._sortable === undefined) {
      this._determineSortable();
    }
    return this._sortable!;
  }

  /**
   * An array of objects that have `column` which is a Column object, and `descending` which is true/false
   */
  get _sortColumns(): any[] {
    if (this._sortColumns_cached === undefined) {
      this._determineSortable();
    }
    return this._sortColumns_cached!;
  }

  /**
   * An object which contains column display properties
   */
  get display(): any {
    if (this._display_cached === undefined) {
      const res: any = {};
      let colDisplay: any = {};
      const sourceDisplay: any = {};
      if (this._simple) {
        colDisplay = this.baseColumns[0].getDisplay(this._context);
      }

      // attach display defined on the source
      if (this.sourceObject && this.sourceObject.display) {
        const displ = this.sourceObject.display;
        if (typeof displ.markdown_pattern === 'string') {
          sourceDisplay.sourceMarkdownPattern = displ.markdown_pattern;
          sourceDisplay.sourceTemplateEngine = displ.template_engine;
        }
      }

      if (this.sourceObject && typeof this.sourceObject.hide_column_header === 'boolean') {
        sourceDisplay.hideColumnHeader = this.sourceObject.hide_column_header;
      }

      // Using assign to avoid changing the original colDisplay
      Object.assign(res, colDisplay, sourceDisplay);
      this._display_cached = res;
    }
    return this._display_cached;
  }

  /**
   * Indicates if this object is wrapping just one column or not
   */
  protected get _simple(): boolean {
    return this.baseColumns.length === 1;
  }

  /**
   * Whether there are aggregate or entity set columns in the wait_for list of this column.
   */
  get hasWaitFor(): boolean {
    if (this._hasWaitFor === undefined) {
      // will generate the _hasWaitFor
      this.waitFor; // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    return this._hasWaitFor!;
  }

  /**
   * Whether there are aggregate columns in the wait_for list of this column.
   */
  get hasWaitForAggregate(): boolean {
    if (this._hasWaitForAggregate === undefined) {
      // will generate the _hasWaitFor
      this.waitFor; // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    return this._hasWaitForAggregate!;
  }

  /**
   * Array of columns that the current column value depends on.
   */
  get waitFor(): ReferenceColumn[] {
    if (this._waitFor === undefined) {
      let wfDef: any[] = [];
      // in entry context, wait_for is not honored for non-asset columns.
      if (!_isEntryContext(this._context) && this.sourceObject && this.sourceObject.display) {
        wfDef = this.sourceObject.display.wait_for;
      }

      const res = _processWaitForList(
        wfDef,
        this._baseReference,
        this._currentTable,
        this,
        this._mainTuple,
        'pseudo-column=`' + this.displayname.value + '`',
      );
      this._waitFor = res.waitForList;
      this._hasWaitFor = res.hasWaitFor;
      this._hasWaitForAggregate = res.hasWaitForAggregate;
    }
    return this._waitFor!;
  }

  /**
   * Formats a value corresponding to this reference-column definition.
   */
  formatvalue(data: any, context?: string, options?: any): string | string[] {
    if (this._simple) {
      if (!isStringAndNotEmpty(context)) {
        context = this._context;
      }
      return this.baseColumns[0].formatvalue(data, context!, options);
    }
    return data.toString();
  }

  /**
   * Formats the presentation value corresponding to this reference-column definition.
   */
  formatPresentation(data: any, context?: string, templateVariables?: any, options?: any): DisplayName {
    data = data || {};
    options = options || {};

    if (!isStringAndNotEmpty(context)) {
      context = this._context;
    }

    // if there's wait_for, this should return null.
    if (this.hasWaitFor && !options.skipWaitFor) {
      return {
        isHTML: false,
        value: this._getNullValue(context!),
        unformatted: this._getNullValue(context!),
      };
    }

    if (this.display.sourceMarkdownPattern) {
      const keyValues: any = {};
      let selfTemplateVariables: any = {};
      const cols = this.baseColumns;

      if (cols.length > 0) {
        if (this._simple) {
          selfTemplateVariables = {
            $self: cols[0].formatvalue(data[cols[0].name], context!, options),
            $_self: data[cols[0].name],
          };
        } else {
          const values: any = {};
          cols.forEach((col) => {
            values[col.name] = col.formatvalue(data[col.name], context!, options);
            values['_' + col.name] = data[col.name];
          });
          selfTemplateVariables = {
            $self: {
              values: values,
            },
          };
        }
      }

      Object.assign(keyValues, templateVariables, selfTemplateVariables);
      return processMarkdownPattern(this.display.sourceMarkdownPattern, keyValues, this.table, context!, {
        templateEngine: this.display.sourceTemplateEngine,
      });
    }

    if (this._simple) {
      return this.baseColumns[0].formatPresentation(data, context!, templateVariables, options);
    }

    let isHTML = false,
      value = '',
      unformatted = '';
    for (let i = 0; i < this.baseColumns.length; i++) {
      const curr = this.baseColumns[i].formatPresentation(data, context!, templateVariables, options);
      if (!isHTML && curr.isHTML) {
        isHTML = true;
      }
      value += (i > 0 ? ':' : '') + curr.value;
      unformatted += (i > 0 ? ':' : '') + curr.unformatted;
    }
    return { isHTML: isHTML, value: value, unformatted: unformatted };
  }

  protected _determineInputDisabled(context: string): boolean | { message: string } {
    if (this._simple) {
      return this.baseColumns[0].getInputDisabled(context);
    }

    const cols = this.baseColumns;

    if (context === _contexts.CREATE) {
      // if one is not generated
      for (let i = 0; i < cols.length; i++) {
        if (!_processACLAnnotation(cols[i].annotations, _annotations.GENERATED, false)) {
          return false;
        }
      }

      // if all GENERATED
      return {
        message: 'Automatically generated',
      };
    } else if (context === _contexts.EDIT) {
      // at least one is IMMUTABLE, so the whole thing is immutable
      const atLeastOneImmutable = cols.some((col) => {
        return _processACLAnnotation(col.annotations, _annotations.IMMUTABLE, false);
      });
      if (atLeastOneImmutable) {
        return true;
      }
      // if all are generated, the whole thing is immutable
      const allAreGenerated = cols.every((col) => {
        const isImmutable = _processACLAnnotation(col.annotations, _annotations.IMMUTABLE, null);
        const isGenerated = _processACLAnnotation(col.annotations, _annotations.GENERATED, false);
        // if isImmutable===false, then that column is mutable based on annotation
        return isImmutable !== false && isGenerated;
      });
      return allAreGenerated;
    }

    // other contexts
    return true;
  }

  protected _determineSortable(): void {
    this._sortColumns_cached = [];
    this._sortable = false;

    // disable if multiple columns
    if (!this._simple) return;

    // use the column column_order
    this._sortColumns_cached = this.baseColumns[0]._getSortColumns(this._context); // might return undefined

    if (typeof this._sortColumns_cached === 'undefined') {
      // disable the sort
      this._sortColumns_cached = [];
    } else {
      this._sortable = true;
    }
  }

  protected _getNullValue(context: string): string | null {
    if (this._simple) {
      return this.baseColumns[0]._getNullValue(context);
    }
    return this.table._getNullValue(context);
  }

  /**
   * Whether we should show the link for the foreignkey value.
   */
  protected _getShowForeignKeyLink(context: string): boolean {
    // has no foreign key path: not applicable
    if (!isObjectAndNotNull(this.firstForeignKeyNode)) {
      return true;
    }

    // find it in the source syntax
    if (this.sourceObject.display && typeof this.sourceObject.display.show_foreign_key_link === 'boolean') {
      return this.sourceObject.display.show_foreign_key_link;
    }

    // get it from the foreignkey (which might be derived from catalog, schema, or table)
    return this.firstForeignKeyNode!.nodeObject.getDisplay(context).showForeignKeyLink;
  }

  sourceFormatPresentation(templateVariables: any, columnValue: any, mainTuple: Tuple): any {
    const baseCol = this.baseColumns[0];
    const context = this._context;

    if (this.display.sourceMarkdownPattern) {
      let selfTemplateVariables = {};
      // children pseudo-column have already set the $self and $_self
      if (!this.isPseudo && baseCol) {
        selfTemplateVariables = {
          $self: baseCol.formatvalue(mainTuple.data[baseCol.name], context),
          $_self: mainTuple.data[baseCol.name],
        };
      }

      const keyValues = {};
      Object.assign(keyValues, templateVariables, selfTemplateVariables);
      return processMarkdownPattern(this.display.sourceMarkdownPattern, keyValues, this.table, context, {
        templateEngine: this.display.sourceTemplateEngine,
      });
    }

    // when there's waifor but no sourceMarkdownPattern
    // NOTE: why not just return the value from the templateVariables?
    //  - this column might not be part of the templateVariables

    // rest of the cases
    // NOTE by passing the given templateVariables instead of the one attached to the main tuple, we're supporting wait_for in column and key display.
    // (in combination with the wait_for logic that looks for the one that is defined on column/key display)
    const pres = this.formatPresentation(mainTuple.data, mainTuple.page.reference.context, templateVariables, { skipWaitFor: true });
    if (this.type.name === 'gene_sequence') {
      pres.isHTML = true;
    }
    return pres;
  }

  /**
   * This function should not be used in entry context
   */
  // sourceFormatPresentation(templateVariables: any, columnValue: any, mainTuple: Tuple): any {
  //   // go through the wait for to make sure all is done
  //   const context = this._context;
  //   const isPseudo = this instanceof PseudoColumn && this.isPathColumn;
  //   const isFkPseudo = this instanceof ForeignKeyPseudoColumn && this.isForeignKey;
  //   const name = this.name as string;

  //   const nullValue = {
  //     isHTML: false,
  //     value: this._getNullValue(context),
  //     unformatted: this._getNullValue(context),
  //   };

  //   if (this.display.sourceMarkdownPattern) {
  //     const keyValues: Record<string, any> = {};
  //     let selfTemplateVariables: Record<string, any> = {};
  //     const baseCol = this.baseColumns[0];

  //     // create the $self object
  //     if (isPseudo && this.hasAggregate && columnValue) {
  //       selfTemplateVariables = columnValue.templateVariables;
  //     } else if (isFkPseudo || (isPseudo && this.hasPath && this.isUnique)) {
  //       if (!mainTuple._linkedData[this.name as string]) {
  //         selfTemplateVariables = {};
  //       } else if (isPseudo && !this.isEntityMode) {
  //         selfTemplateVariables = {
  //           $self: baseCol.formatvalue(mainTuple._linkedData[name][baseCol.name], context),
  //           $_self: mainTuple._linkedData[name][baseCol.name],
  //         };
  //       } else {
  //         selfTemplateVariables = {
  //           $self: _getRowTemplateVariables(this.table, context, mainTuple._linkedData[name]),
  //         };
  //       }
  //     } else if (this.referenceColumnType === ReferenceColumnTypes.KEY) {
  //       selfTemplateVariables = {
  //         $self: _getRowTemplateVariables(this.table, context, mainTuple._data),
  //       };
  //     } else if (baseCol) {
  //       selfTemplateVariables = {
  //         $self: baseCol.formatvalue(mainTuple.data[baseCol.name], context),
  //         $_self: mainTuple.data[baseCol.name],
  //       };
  //     }

  //     Object.assign(keyValues, templateVariables, selfTemplateVariables);
  //     return processMarkdownPattern(this.display.sourceMarkdownPattern, keyValues, this.table, context, {
  //       templateEngine: this.display.sourceTemplateEngine,
  //     });
  //   }

  //   // when there's waitfor but no sourceMarkdownPattern
  //   // aggregate
  //   if (isPseudo && this.hasAggregate) {
  //     return columnValue ? columnValue : nullValue;
  //   }

  //   // all outbound
  //   if (isFkPseudo || (isPseudo && this.hasPath && this.isUnique)) {
  //     return this.formatPresentation(mainTuple._linkedData[name], mainTuple._pageRef._context, null, { skipWaitFor: true });
  //   }

  //   // rest of the cases
  //   const pres = this.formatPresentation(mainTuple._data, mainTuple._pageRef._context, templateVariables, { skipWaitFor: true });
  //   if (this.type.name === 'gene_sequence') {
  //     pres.isHTML = true;
  //   }
  //   return pres;
  // }

  /**
   * Render the location of iframe. will return empty string if invalid or missing.
   */
  renderInputIframeUrl(data: any, linkedData: any): string {
    const baseTable = this._baseReference.table;

    const keyValues = _getFormattedKeyValues(baseTable, this._context, data, linkedData);

    if (!this.isInputIframe) {
      return '';
    }

    const url = _renderTemplate(this.inputIframeProps!.urlPattern, keyValues, baseTable.schema.catalog, {
      templateEngine: this.inputIframeProps!.urlTemplateEngine,
    });

    if (typeof url !== 'string') {
      return '';
    }

    return url;
  }
}
