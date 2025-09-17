// models
import { ReferenceColumn, ReferenceColumnTypes } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import { Reference, Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// utils
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

// legacy
import { Key, Table } from '@isrd-isi-edu/ermrestjs/js/core';
import {
  _determineDisplayName,
  _generateKeyPresentation,
  _getRowTemplateVariables,
  processMarkdownPattern,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/**
 * @class
 * @param {Reference} reference column's reference
 * @param {Key} key the key
 * @desc
 * Constructor for KeyPseudoColumn. This class is a wrapper for {@link Key}.
 * This class extends the {@link ReferenceColumn}
 */
export class KeyPseudoColumn extends ReferenceColumn {
  /**
   * @type {boolean}
   * @desc indicates that this object represents a PseudoColumn.
   */
  public isPseudo: boolean = true;

  /**
   * @type {boolean}
   * @desc Indicates that this ReferenceColumn is a key.
   */
  public isKey: boolean = true;

  /**
   * @type {Key}
   * @desc The Key object that this PseudoColumn is created based on
   */
  public key: Key;

  /**
   * the table that the key belongs to
   */
  public table: Table;

  /**
   * the constraint name for the key
   * TODO should we rename this? or change it to private?
   */
  public _constraintName: string;

  constructor(reference: Reference, key: Key, sourceObjectWrapper?: SourceObjectWrapper, name?: string) {
    // call the parent constructor
    super(reference, key.colset.columns, sourceObjectWrapper, name);

    this.referenceColumnType = ReferenceColumnTypes.KEY;
    this.key = key;
    this.table = this.key.table;
    this._constraintName = key._constraintName;
  }

  /**
   * Return the value that should be presented for this column.
   * It usually is a self-link to the given row of data.
   *
   * The following is the logic:
   * 1. if the key data is not present, return null.
   * 2. Otherwise if key has markdown pattern, return it.
   * 3. Otherwise try to generate the value in `col1:col2` format. if it resulted in empty string return null.
   *    - If any of the constituent columnhas markdown don't add self-link, otherwise add the self-link.
   * @param  {Object} data    given raw data for the table columns
   * @param {String=} context the app context (optional)
   * @param {Object=} templateVariables the template variables that should be used (optional)
   * @param {Object=} options (optional)
   * @return {Object} A key value pair containing value and isHTML that detemrines the presentation.
   */
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

    if (this.hasWaitFor && !options.skipWaitFor) {
      return nullValue;
    }

    if (this.display.sourceMarkdownPattern) {
      const keyValues: Record<string, unknown> = {};
      const selfTemplateVariables = {
        $self: _getRowTemplateVariables(this.table, context!, data, null, this.key),
      };
      Object.assign(keyValues, templateVariables, selfTemplateVariables);
      return processMarkdownPattern(this.display.sourceMarkdownPattern as string, keyValues, this.table, context!, {
        templateEngine: this.display.sourceTemplateEngine,
      });
    }

    const pres = _generateKeyPresentation(this.key, data, context!, templateVariables, this.display.showKeyLink);
    return pres ? pres : nullValue;
  }

  sourceFormatPresentation(templateVariables: any, columnValue: any, mainTuple: Tuple) {
    const context = this._context;

    if (this.display.sourceMarkdownPattern) {
      const selfTemplateVariables = {
        $self: _getRowTemplateVariables(this.table, context, mainTuple.data),
      };

      const keyValues = {};
      Object.assign(keyValues, templateVariables, selfTemplateVariables);
      return processMarkdownPattern(this.display.sourceMarkdownPattern, keyValues, this.table, context, {
        templateEngine: this.display.sourceTemplateEngine,
      });
    }

    return super.sourceFormatPresentation(templateVariables, columnValue, mainTuple);
  }

  _determineSortable(): void {
    const display = this.display;

    this._sortColumns_cached = [];
    this._sortable = false;

    // disable the sort
    if (display !== undefined && display.columnOrder === false) return;

    // use the column_order
    if (display !== undefined && display.columnOrder !== undefined && Array.isArray(display.columnOrder) && display.columnOrder.length !== 0) {
      this._sortColumns_cached = display.columnOrder;
      this._sortable = true;
      return;
    }

    // if simple, use column
    if (this.key.simple) {
      const baseCol = this.baseColumns[0];

      this._sortColumns_cached = baseCol._getSortColumns(this._context); // might return undefined

      if (typeof this._sortColumns_cached === 'undefined') {
        this._sortColumns_cached = [];
      } else {
        this._sortable = true;
      }
    }
  }

  get name(): string {
    return this.key.name;
  }

  get displayname(): DisplayName {
    if (this._displayname === undefined) {
      if (this.sourceObject.markdown_name) {
        this._displayname = {
          value: renderMarkdown(this.sourceObject.markdown_name, true),
          unformatted: this.sourceObject.markdown_name,
          isHTML: true,
        };
      } else {
        this._displayname = _determineDisplayName(this.key, false);

        // if was undefined, fall back to default
        if (this._displayname && (this._displayname.value === undefined || this._displayname.value?.trim() === '')) {
          this._displayname = undefined;
          return super.displayname;
        }
      }
    }
    return this._displayname;
  }

  /**
   * use the underlying column comment if available, otherwise get it from the key
   * (similar to displayname logic)
   */
  get comment(): CommentType {
    if (this._comment === undefined) {
      // calling the parent
      const parentComment = super.comment;
      this._comment = parentComment !== null ? parentComment : this.key.getDisplay(this._context).comment;
    }
    return this._comment!;
  }

  get default(): undefined {
    // default should be undefined in key
    return undefined;
  }

  get display(): any {
    if (this._display_cached === undefined) {
      const res: any = {};
      const keyDisplay = this.key.getDisplay(this._context);
      const sourceDisplay: any = {};

      // attach display defined on the source
      if (this.sourceObject && this.sourceObject.display) {
        const displ = this.sourceObject.display;
        if (typeof displ.markdown_pattern === 'string') {
          sourceDisplay.sourceMarkdownPattern = displ.markdown_pattern;
          sourceDisplay.sourceTemplateEngine = displ.template_engine;
        }

        if (typeof this.sourceObject.display.show_key_link === 'boolean') {
          sourceDisplay.showKeyLink = displ.show_key_link;
        }
      }

      if (this.sourceObject && typeof this.sourceObject.hide_column_header === 'boolean') {
        sourceDisplay.hideColumnHeader = this.sourceObject.hide_column_header;
      }

      Object.assign(res, keyDisplay, sourceDisplay);
      this._display_cached = res;
    }
    return this._display_cached;
  }
}
