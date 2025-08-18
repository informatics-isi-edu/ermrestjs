// models
import { ReferenceColumn, ReferenceColumnTypes } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';

// utils
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isDefinedAndNotNull, isObjectAndKeyExists, isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _annotations, _contexts, _classNames } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { _getAnnotationValueByContext, _isEntryContext, _renderTemplate, _isSameHost } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _processWaitForList } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';
import { Column } from '@isrd-isi-edu/ermrestjs/js/core';
import { Reference } from '@isrd-isi-edu/ermrestjs/js/reference';

type AssetMetadata = {
  url: string;
  caption: string;
  filename: string;
  byteCount: string;
  md5: string;
  sha256: string;
  sameHost: boolean;
  hostInformation: string;
};

/**
 * @class
 * @param {Reference} reference column's reference
 * @param {Column} column the asset column
 * @param {SourceObjectWrapper} sourceObjectWrapper the source object wrapper
 * @param {string=} name the name of this column
 *
 * @property {string} urlPattern  A desired upload location can be derived by Pattern Expansion on pattern.
 * @property {(Column|null)} filenameColumn if it's string, then it is the name of column we want to store filename inside of it.
 * @property {(Column|null)} byteCountColumn if it's string, then it is the name of column we want to store byte count inside of it.
 * @property {(Column|boolean|null)} md5 if it's string, then it is the name of column we want to store md5 inside of it. If it's true, that means we must use md5.
 * @property {(Column|boolean|null)} sha256 if it's string, then it is the name of column we want to store sha256 inside of it. If it's true, that means we must use sha256.
 * @property {(string[]|null)} filenameExtFilter set of filename extension filters for use by upload agents to indicate to the user the acceptable filename patterns.
 *
 * @desc
 * Constructor for AssetPseudoColumn.
 * This class is a wrapper for {@link Column} objects that have asset annotation.
 * This class extends the {@link ReferenceColumn}
 */
export class AssetPseudoColumn extends ReferenceColumn {
  /**
   * @type {boolean}
   * @desc indicates that this object represents a PseudoColumn.
   */
  public isPseudo: boolean = true;

  /**
   * @type {boolean}
   * @desc Indicates that this ReferenceColumn is an asset.
   */
  public isAsset: boolean = true;

  private _baseCol: Column;
  private _annotation: any;

  // Cached properties
  private _templateEngine?: string;
  private _urlPattern?: string;
  private _filenameColumn?: Column | null;
  private _byteCountColumn?: Column | null;
  private _md5?: Column | boolean | null;
  private _sha256?: Column | boolean | null;
  private _filenamePattern?: string;
  private _filenameExtFilter?: string[];
  private _filenameExtRegexp?: string[];
  private _displayImagePreview?: boolean;
  private _filePreview?: null | { showCsvHeader: boolean };

  constructor(reference: Reference, column: Column, sourceObjectWrapper?: SourceObjectWrapper, name?: string) {
    // call the parent constructor
    super(reference, [column], sourceObjectWrapper, name);

    this._baseCol = column;
    this.referenceColumnType = ReferenceColumnTypes.ASSET;
    this._annotation = column.annotations.get(_annotations.ASSET).content || {};
  }

  /**
   * If url_pattern is invalid or browser_upload=false the input will be disabled.
   * @param  {string} context the context
   * @return {boolean|object}
   */
  protected _determineInputDisabled(context: string): boolean | { message: string } {
    const pat = this._annotation.url_pattern;
    if (typeof pat !== 'string' || pat.length === 0 || this._annotation.browser_upload === false) {
      return true;
    }

    return super._determineInputDisabled(context);
  }

  /**
   * Given the data, will return the appropriate metadata values. The returned object
   * will have the following attributes:
   * - filename
   * - byteCount
   * - md5
   * - sha256
   * - origin
   * - caption: the string that can be used for showing the selected file.
   * The heuristics for origin and caption:
   *   1. if filenameColumn is defined and its value is not null, use it as caption.
   *   2. otherwise, if the url is from hatrac, extract the filename and use it as caption.
   *   3. otherwise, use the last part of url as caption. in detailed context, if url is absolute find the origin.
   * @param  {Object} data    key-value pair of data
   * @param  {String} context context string
   * @param  {Object} options
   * @return {Object} metadata object with `caption`, `filename`, `byteCount`, `md5`, and `sha256` attributes.
   */
  getMetadata(data: any, context?: string, options?: any): AssetMetadata {
    data = data || {};
    if (!context) {
      context = this._context;
    }

    const result = {
      url: '',
      caption: '',
      filename: '',
      byteCount: '',
      md5: '',
      sha256: '',
      sameHost: false,
      hostInformation: '',
    };

    // if null, return null value
    if (typeof data[this._baseCol.name] === 'undefined' || data[this._baseCol.name] === null) {
      return result;
    }

    result.url = data[this._baseCol.name];

    // get the caption
    const col = this.filenameColumn ? this.filenameColumn : this._baseCol;
    let urlCaption = this.filenameColumn === null;
    let caption = col.formatvalue(data[col.name], context, options) as string;

    // if we got the caption from column and it resulted in empty, return the url
    if (this.filenameColumn && (!caption || !data[this.filenameColumn.name])) {
      caption = col.formatvalue(data[this._baseCol.name], context, options) as string;
      urlCaption = true;
    }

    // assume same origin because most paths should be relative
    const sameHost = _isSameHost(result.url) !== false;

    result.sameHost = sameHost;

    // in detailed, we want to show the host information if not on the same origin
    if (!sameHost && typeof context === 'string' && context === _contexts.DETAILED) {
      // see if link contains absolute paths that start with https:// or http://
      const hasProtocol = new RegExp('^(?:[a-z]+:)?//', 'i').test(result.url);
      const urlParts = result.url.split('/');

      // only match absolute paths that start with https:// or http://
      if (hasProtocol && urlParts.length >= 3) {
        // so when we split by /, the third element will be the host information
        result.hostInformation = urlParts[2];
      }
    }

    // if we're using the url as caption
    if (urlCaption) {
      // if caption matches the expected format, just show the file name
      // eslint-disable-next-line no-useless-escape
      const parts = caption.match(/^\/hatrac\/([^\/]+\/)*([^\/:]+)(:[^:]+)?$/);
      if (parts && parts.length === 4) {
        caption = parts[2];
      } else {
        // otherwise return the last part of url
        const newCaption = caption.split('/').pop();
        if (newCaption && newCaption.length !== 0) {
          caption = newCaption;
        }
      }
    }

    result.caption = caption;

    if (this.filenameColumn && isDefinedAndNotNull(data[this.filenameColumn.name])) {
      result.filename = data[this.filenameColumn.name];
    }

    if (this.byteCountColumn && isDefinedAndNotNull(data[this.byteCountColumn.name])) {
      result.byteCount = data[this.byteCountColumn.name];
    }

    if (this.md5 && typeof this.md5 === 'object' && isDefinedAndNotNull(data[this.md5.name])) {
      result.md5 = data[this.md5.name];
    }

    if (this.sha256 && typeof this.sha256 === 'object' && isDefinedAndNotNull(data[this.sha256.name])) {
      result.sha256 = data[this.sha256.name];
    }

    return result;
  }

  /**
   * Format the presentation value corresponding to this asset definition.
   * 1. return the raw data in entry contexts.
   * 2. otherwise if it has wait-for return empty.
   * 3. otherwise if column-display is defined, use it.
   * 4. otherwise if value is null, return null.
   * 5. otherwise use getMetadata to genarate caption and origin and return a download button.
   *
   * @param {Object} data the raw data of the table
   * @param {String=} context the app context (optional)
   * @param {Object=} templateVariables the template variables that should be used (optional)
   * @param {Object=} options (optional)
   * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
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

    // in edit return the original data
    if (_isEntryContext(context!)) {
      return { isHTML: false, value: data[this._baseCol.name], unformatted: data[this._baseCol.name] };
    }

    if (this.hasWaitFor && !options.skipWaitFor) {
      return nullValue;
    }

    // if column has column-display annotation, use it
    if (this.display.sourceMarkdownPattern || this._baseCol.getDisplay(context!).isMarkdownPattern) {
      return super.formatPresentation(data, context, templateVariables, options);
    }

    // if null, return null value
    if (typeof data[this._baseCol.name] === 'undefined' || data[this._baseCol.name] === null) {
      return nullValue;
    }

    // var currentOrigin = server.url.origin
    const classNames = _classNames;
    const metadata = this.getMetadata(data, context, options);
    const caption = metadata.caption;
    const hostInfo = metadata.hostInformation;
    const sameHost = metadata.sameHost;

    // otherwise return a download link
    let template = '[{{{caption}}}]({{{url}}}){download ' + (sameHost ? '.' + classNames.assetPermission : '') + '}';
    let url = data[this._baseCol.name];

    // only add query parameters if same origin
    if (sameHost) {
      // add the uinit=1 query params
      url += (url.indexOf('?') !== -1 ? '&' : '?') + 'uinit=1';

      // add cid query param
      const cid = this.table.schema.catalog.server.cid;
      if (cid) url += '&cid=' + cid;
    }

    const keyValues = {
      caption: caption,
      url: url,
      hostInfo: hostInfo,
    };
    if (hostInfo) {
      template += ':span:(source: {{{hostInfo}}}):/span:{.asset-source-description}';
    }

    const unformatted = _renderTemplate(template, keyValues, this.table.schema.catalog);
    return { isHTML: true, value: renderMarkdown(unformatted, true), unformatted: unformatted };
  }

  /**
   * Modify the default column_order heuristics for the asset, by using the filename
   * if
   *  - the filename_column is defined and valid
   *  - column_order is not defined on the column-display
   * This has been done to ensure the sorted column is the same as displayed value.
   * In most default cases, all the conditions will met.
   * @private
   */
  protected _determineSortable(): void {
    super._determineSortable();

    // if column_order is missing and it doesn't have any makrdown_pattern and
    // filename is defined, use the filename column.
    const columnOrder = this.display.columnOrder;
    if (this.filenameColumn && (columnOrder === undefined || columnOrder.length === 0)) {
      this._sortColumns_cached = [];
      this._sortColumns_cached = [{ column: this.filenameColumn }];
      this._sortable = true;
    }
  }

  // Getters for various properties
  /**
   * Returns the template_engine defined in the annotation
   */
  get templateEngine(): string {
    if (this._templateEngine === undefined) {
      this._templateEngine = this._annotation.template_engine || '';
    }
    return this._templateEngine!;
  }

  /**
   * Returns the url_pattern defined in the annotation (the raw value and not computed).
   */
  get urlPattern(): string {
    if (this._urlPattern === undefined) {
      this._urlPattern = this._annotation.url_pattern;
    }
    return this._urlPattern || '';
  }

  /**
   * The column object that filename is stored in.
   */
  get filenameColumn(): Column | null {
    if (this._filenameColumn === undefined) {
      try {
        // make sure the column exist
        this._filenameColumn = this.table.columns.get(this._annotation.filename_column);
      } catch {
        // column doesn't exist
        this._filenameColumn = null;
      }
    }
    return this._filenameColumn;
  }

  /**
   * The column object that byte count is stored in.
   */
  get byteCountColumn(): Column | null {
    if (this._byteCountColumn === undefined) {
      try {
        // make sure the column exist
        this._byteCountColumn = this.table.columns.get(this._annotation.byte_count_column);
      } catch {
        this._byteCountColumn = null;
      }
    }
    return this._byteCountColumn;
  }

  /**
   * The column object that md5 hash is stored in.
   */
  get md5(): Column | boolean | null {
    if (this._md5 === undefined) {
      const md5 = this._annotation.md5;
      if (md5 === true) {
        this._md5 = true;
      } else {
        try {
          // make sure the column exist
          this._md5 = this.table.columns.get(md5);
        } catch {
          this._md5 = null;
        }
      }
    }
    return this._md5;
  }

  /**
   * The column object that sha256 hash is stored in.
   */
  get sha256(): Column | boolean | null {
    if (this._sha256 === undefined) {
      const sha256 = this._annotation.sha256;
      if (sha256 === true) {
        this._sha256 = true;
      } else {
        try {
          // make sure the column exist
          this._sha256 = this.table.columns.get(sha256);
        } catch {
          this._sha256 = null;
        }
      }
    }
    return this._sha256;
  }

  /**
   * Returns the stored filename pattern.
   */
  get filenamePattern(): string {
    if (this._filenamePattern === undefined) {
      this._filenamePattern = this._annotation.stored_filename_pattern;
    }
    return this._filenamePattern || '';
  }

  /**
   * The column object that file extension is stored in.
   */
  get filenameExtFilter(): string[] {
    if (this._filenameExtFilter === undefined) {
      this._filenameExtFilter = [];

      const ext = this._annotation.filename_ext_filter;
      if (typeof ext === 'string') {
        this._filenameExtFilter.push(ext);
      } else if (Array.isArray(ext)) {
        this._filenameExtFilter = ext;
      }
    }
    return this._filenameExtFilter;
  }

  /**
   * The regular expressions that will be used for extracting the extension
   */
  get filenameExtRegexp(): string[] {
    if (this._filenameExtRegexp === undefined) {
      this._filenameExtRegexp = [];

      const reg = this._annotation.filename_ext_regexp;
      if (typeof reg === 'string') {
        this._filenameExtRegexp.push(reg);
      } else if (Array.isArray(reg)) {
        this._filenameExtRegexp = reg;
      }
    }
    return this._filenameExtRegexp;
  }

  /**
   * whether we should show the image preview or not
   */
  get displayImagePreview(): boolean {
    if (this._displayImagePreview === undefined) {
      const disp = this._annotation.display;
      const currDisplay = isObjectAndNotNull(disp) ? _getAnnotationValueByContext(this._context, disp) : null;
      this._displayImagePreview = isObjectAndNotNull(currDisplay) && currDisplay.image_preview === true;
    }
    return this._displayImagePreview;
  }

  /**
   * whether we should show the file preview or not
   */
  get filePreview(): null | { showCsvHeader: boolean } {
    if (this._filePreview === undefined) {
      const disp = this._annotation.display;
      const currDisplay = isObjectAndNotNull(disp) ? _getAnnotationValueByContext(this._context, disp) : null;
      const settings = isObjectAndKeyExists(currDisplay, 'file_preview') ? currDisplay.file_preview : {};
      if (settings === false) {
        this._filePreview = null;
      } else {
        // by default we're hiding the CSV header.
        let showCsvHeader = false;
        if (isObjectAndKeyExists(settings, 'show_csv_header') && typeof settings.show_csv_header === 'boolean') {
          showCsvHeader = settings.show_csv_header;
        }
        this._filePreview = { showCsvHeader };
      }
    }
    return this._filePreview;
  }

  /**
   * Returns the wait for list for this column.
   */
  get waitFor(): any {
    if (this._waitFor === undefined) {
      if (!_isEntryContext(this._context)) {
        // calling the parent logic, which will get it from the source object
        return super.waitFor;
      } else {
        // in entry context, get it from the asset annotation.
        const wfDef = this._annotation.wait_for;
        const res = _processWaitForList(wfDef, this._baseReference, this._currentTable, this, this._mainTuple, `asset=\`${this.displayname.value}\``);
        this._waitFor = res.waitForList;
        this._hasWaitFor = res.hasWaitFor;
        this._hasWaitForAggregate = res.hasWaitForAggregate;
      }
    }
    return this._waitFor;
  }
}
