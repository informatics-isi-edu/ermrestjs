import moment from 'moment-timezone';

// models
import { Annotation, Annotations } from '@isrd-isi-edu/ermrestjs/src/models/annotation';
import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import type { AnnotationContent, ColumnJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import type { ForeignKeyRef } from '@isrd-isi-edu/ermrestjs/src/models/foreign-key';
import type { Key } from '@isrd-isi-edu/ermrestjs/src/models/key';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';
import { Type } from '@isrd-isi-edu/ermrestjs/src/models/type';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import {
  _annotations,
  _commentDisplayModes,
  _contexts,
  _defaultColumnComment,
  HANDLEBARS,
  _HTMLColumnType,
  _ignoreDefaultsNames,
  _nonSortableTypes,
  _systemColumns,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { _formatUtils, _formatValueByType } from '@isrd-isi-edu/ermrestjs/src/utils/format-utils';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import {
  isDefinedAndNotNull,
  isObjectAndNotNull,
  isEmptyArray,
  isStringAndNotEmpty,
  isValidColorRGBHex,
  isValidVisibleCellHeight,
} from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent, escapeHTML, updateObject } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy
import printf from '@isrd-isi-edu/ermrestjs/js/format';
import {
  _determineDisplayName,
  _getAnnotationValueByContext,
  _getFormattedKeyValues,
  _getHierarchicalDisplayAnnotationValue,
  _getNullValue,
  _getRecursiveAnnotationValue,
  _isValidModelComment,
  _isValidModelCommentDisplay,
  _processACLAnnotation,
  _processColumnOrderList,
  _processModelComment,
  processMarkdownPattern,
  _renderTemplate,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/*
 * typed views of the untyped legacy helpers; remove once js/utils/helpers.js is migrated to typescript.
 */
const processModelComment = _processModelComment as (comment?: string | null | false, isMarkdown?: boolean, displayMode?: string) => CommentType;
const getHierarchicalDisplayAnnotationValue = _getHierarchicalDisplayAnnotationValue as (
  obj: unknown,
  context: string,
  annotKey: string,
  isTable?: boolean,
) => AnnotationContent;

/**
 * One entry of a processed `column_order` list (see helpers._processColumnOrderList).
 */
export interface ColumnOrderEntry {
  column?: Column;
  num_occurrences?: boolean;
  descending?: boolean;
}

/**
 * The processed `column_order` value: `false` means sorting is disabled,
 * `undefined` means the definition was missing or invalid.
 */
export type ColumnOrder = ColumnOrderEntry[] | false | undefined;

export interface ColumnDisplay {
  hideColumnHeader: boolean;
  isPreformat: boolean | undefined;
  preformatConfig: AnnotationContent;
  isMarkdownPattern: boolean;
  isMarkdownType: boolean;
  isHTML: boolean;
  markdownPattern: string | undefined;
  templateEngine: string | undefined;
  columnOrder: ColumnOrder;
  comment: CommentType;
  commentRenderMarkdown: boolean | undefined;
  commentDisplayMode: string;
  visibleCellHeight: number | undefined;
}

export interface FormattedValue {
  isHTML: boolean;
  value: string | null;
  unformatted: string | null;
}

/**
 * Container of the Column objects defined on a table.
 */
export class Columns {
  _columns: Column[] = [];
  _table: Table;

  constructor(table: Table) {
    this._table = table;
  }

  _push(column: Column): void {
    this._columns.push(column);
  }

  /**
   * array of all columns
   */
  all(): Column[] {
    return this._columns;
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * number of columns
   */
  length(): number {
    return this._columns.length;
  }

  /**
   * names of columns
   */
  names(): string[] {
    return this._columns.map(function (column) {
      return column.name;
    });
  }

  /**
   * whether Columns has this column or not
   * @param name name of the column
   */
  has(name: string): boolean {
    return this._columns.some(function (column) {
      return column.name === name;
    });
  }

  /**
   * get column by name
   * @param name name of column
   * @throws {NotFoundError} column not found
   */
  get(name: string): Column {
    const result = this._columns.filter(function (column) {
      return column.name === name;
    });

    if (result.length) {
      return result[0];
    }
    throw new NotFoundError('', 'Column ' + name + ' not found in table ' + this._table.name + '.');
  }

  getByPosition(pos: number): Column {
    return this._columns[pos];
  }
}

/**
 * A column of a table in the ermrest model.
 */
export class Column {
  _jsonColumn: ColumnJSON;

  /**
   * The ordinal number or position of this column relative to other
   * columns within the same scope.
   * TODO: to be implemented
   */
  position: number | undefined;

  table: Table;

  rights: ColumnJSON['rights'];

  /**
   * Mentions whether we should hide the value for this column
   */
  isHiddenPerACLs: boolean;

  /**
   * Mentions whether this column is generated depending on insert rights
   * or if column is system generated then return true so that it is disabled.
   */
  isGeneratedPerACLs: boolean;

  /**
   * If column is system generated then this should true so that it is disabled during create and update.
   */
  isSystemColumn: boolean;

  /**
   * Mentions whether this column is immutable depending on update rights
   */
  isImmutablePerACLs: boolean;

  /**
   * The database name of this column
   */
  name: string;

  /**
   * The RID of this column (might not be defined)
   */
  RID?: string;

  type: Type;

  ignore: boolean;

  /**
   * if it's used in an asset annotation, will return its category. available values:
   * 'url', 'filename', 'byte_count', 'md5', 'sha256'
   */
  assetCategory?: string;

  /**
   * if the column is storing of the extra asset metadata, this will return the actual url column
   */
  assetURLColumnName?: string;

  /**
   * if this column has a valid asset annotation
   */
  isAssetURL?: boolean;

  /**
   * if this column is a filename for an asset column
   */
  isAssetFilename?: boolean;

  /**
   * if this column is a byte count for an asset column
   */
  isAssetByteCount?: boolean;

  /**
   * if this column is a md5 for an asset column
   */
  isAssetMd5?: boolean;

  /**
   * if this column is a sha256 for an asset column
   */
  isAssetSha256?: boolean;

  annotations: Annotations;

  /**
   * Documentation for this column
   * @deprecated comment can be contextualized, so please do `this.getDisplay(context).comment` instead.
   */
  comment: CommentType;

  nullok: boolean;

  /**
   * Preferred display name for user presentation only.
   * this.displayname.isHTML will return true/false
   * this.displayname.value has the value
   */
  displayname: DisplayName;

  /**
   * keys that this column is a member of
   */
  memberOfKeys: Key[];

  /**
   * foreign keys that this column is a member of
   */
  memberOfForeignKeys: ForeignKeyRef[];

  /**
   * This is the actual default that is defined on schema document.
   * To get the default value that is suitable for client-side, please use .default
   */
  ermrestDefault: ColumnJSON['default'];

  _nameStyle: Record<string, unknown>; // Used in the displayname to store the name styles.
  _nullValue: Record<string, unknown>; // Used to avoid recomputation of null value for different contexts.
  _display: Record<string, ColumnDisplay>; // Used for column.display annotation.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _default?: any;
  _isUniqueNotNull?: boolean;
  _uniqueNotNullKey?: Key | null;
  _isPartOfSimpleForeignKey?: boolean;

  /**
   * @param table the table object.
   * @param jsonColumn the json column.
   * @param assetCategoryInfo if the column is an asset, this must be an object with category and URLColumnName properties
   */
  constructor(table: Table, jsonColumn: ColumnJSON, assetCategoryInfo?: { category: string; URLColumnName?: string }) {
    this._jsonColumn = jsonColumn;

    this.position = undefined;

    this.table = table;

    this.rights = jsonColumn.rights;

    this.isHiddenPerACLs = this.rights.select === false;

    this.isGeneratedPerACLs = this.rights.insert === false;

    this.isSystemColumn =
      _systemColumns.find(function (c: string) {
        return c === jsonColumn.name;
      }) !== undefined;

    this.isImmutablePerACLs = this.rights.update === false;

    this.name = jsonColumn.name;

    this.RID = jsonColumn.RID;

    this.type = new Type(jsonColumn.type);

    this.ignore = false;

    if (isObjectAndNotNull(assetCategoryInfo) && isStringAndNotEmpty(assetCategoryInfo!.category)) {
      this.assetCategory = assetCategoryInfo!.category;

      if (isStringAndNotEmpty(assetCategoryInfo!.URLColumnName)) {
        this.assetURLColumnName = assetCategoryInfo!.URLColumnName;
      }

      switch (assetCategoryInfo!.category) {
        case 'url':
          this.isAssetURL = true;
          break;
        case 'filename':
          this.isAssetFilename = true;
          break;
        case 'byte_count':
          this.isAssetByteCount = true;
          break;
        case 'md5':
          this.isAssetMd5 = true;
          break;
        case 'sha256':
          this.isAssetSha256 = true;
          break;
      }
    }

    this.annotations = new Annotations();

    const annots: Record<string, AnnotationContent> = {};

    /*
     * go over the catalog, schema, and table and copy the relative column defaults annotations:
     * first the by_type annots, then by_name, then asset (asset is the most specific one),
     * and finally the existing annots on the column itself.
     */
    const defaultAnnotKey = _annotations.COLUMN_DEFAULTS;
    const ancestors = [this.table.schema.catalog, this.table.schema, this.table];
    ancestors.forEach(function (el) {
      if (el.annotations.contains(defaultAnnotKey)) {
        const tempAnnot = el.annotations.get(defaultAnnotKey).content;
        if (
          isObjectAndNotNull(tempAnnot) &&
          isObjectAndNotNull(tempAnnot.by_type) &&
          isObjectAndNotNull(tempAnnot.by_type[jsonColumn.type.typename])
        ) {
          updateObject(annots, tempAnnot.by_type[jsonColumn.type.typename]);
        }
      }
    });
    ancestors.forEach(function (el) {
      if (el.annotations.contains(defaultAnnotKey)) {
        const tempAnnot = el.annotations.get(defaultAnnotKey).content;
        if (isObjectAndNotNull(tempAnnot) && isObjectAndNotNull(tempAnnot.by_name) && isObjectAndNotNull(tempAnnot.by_name[jsonColumn.name])) {
          updateObject(annots, tempAnnot.by_name[jsonColumn.name]);
        }
      }
    });
    const assetCategory = this.assetCategory;
    if (isStringAndNotEmpty(assetCategory)) {
      ancestors.forEach(function (el) {
        if (el.annotations.contains(defaultAnnotKey)) {
          const tempAnnot = el.annotations.get(defaultAnnotKey).content;
          if (isObjectAndNotNull(tempAnnot) && isObjectAndNotNull(tempAnnot.asset) && isObjectAndNotNull(tempAnnot.asset[assetCategory!])) {
            updateObject(annots, tempAnnot.asset[assetCategory!]);
          }
        }
      });
    }

    updateObject(annots, jsonColumn.annotations);
    for (const uri in annots) {
      const jsonAnnotation = annots[uri];
      this.annotations._push(new Annotation('column', uri, jsonAnnotation));

      if (uri === _annotations.HIDDEN) {
        this.ignore = true;
      } else if (uri === _annotations.IGNORE && (jsonAnnotation === null || isEmptyArray(jsonAnnotation))) {
        this.ignore = true;
      }
    }

    this.comment = processModelComment(jsonColumn.comment);
    if (this.annotations.contains(_annotations.DISPLAY)) {
      const cm = processModelComment(this.annotations.get(_annotations.DISPLAY).content.comment);
      if (cm) {
        this.comment = cm;
      }
    }

    // If the comment is not defined for a system column, then it is assigned a default comment
    if (!isDefinedAndNotNull(this.comment) && this.isSystemColumn) {
      this.comment = processModelComment(_defaultColumnComment[this.name as keyof typeof _defaultColumnComment], false);
    }

    this.nullok = jsonColumn.nullok;
    // if false we don't even need to check for the presence of the annotation
    if (this.nullok) {
      this.nullok = !this.annotations.contains(_annotations.REQUIRED);
    }

    this._nameStyle = {};
    this._nullValue = {};
    this._display = {};

    this.displayname = _determineDisplayName(this, true, this.table);

    this.memberOfKeys = [];

    this.memberOfForeignKeys = [];

    this.ermrestDefault = jsonColumn.default;
  }

  /**
   * Formats a value corresponding to this column definition.
   * It will take care of pre-formatting and any default formatting based on column type.
   * If column is array, the returned value will be array of values. The value is either
   * a string or `null`. We're not returning string because we need to distinguish between
   * null and value. `null` for arrays is a valid value. [`null`] is different from `null`.
   *
   * @param data The 'raw' data value.
   * @param context the app context
   * @returns The formatted value. If column is array, it will be an array of values.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatvalue(data: any, context: string, options?: any): string | null | (string | null)[] {
    // this used to treat json differently but we don't want that anymore.
    // since we cannot distinguish between json null and database null, we decided to show it as database null anyways.
    if (!isDefinedAndNotNull(data)) {
      return this._getNullValue(context);
    }

    const display = this.getDisplay(context);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getFormattedValue = (v: any) => {
      // in case of array, null and empty strings are valid values and we
      // need to distinguish them.
      if (this.type.isArray && (!isDefinedAndNotNull(v) || v === '')) {
        return v;
      }

      if (display.isPreformat) {
        try {
          return printf(display.preformatConfig, v, this.type.rootName);
        } catch (e) {
          $log.error(e);
        }
      }

      // if int/serial and part of simple key or simple fk we don't want to format the value
      if (
        (this.type.name.indexOf('int') === 0 || this.type.name.indexOf('serial') === 0) &&
        (this.isUniqueNotNull || this.isPartOfSimpleForeignKey)
      ) {
        return v.toString();
      }

      return _formatValueByType(this.type, v, options);
    };

    if (this.type.isArray) {
      return data.map(getFormattedValue);
    }
    return getFormattedValue(data);
  }

  /**
   * Formats the presentation value corresponding to this column definition.
   * For getting the value of a column we should use this function and not formatvalue directly.
   * This will call `formatvalue` for the current column and other columns if necessary.
   *
   * @param data The `raw` data for the table.
   * @param context the app context
   * @param templateVariables template variables
   * @returns A key value pair containing value and isHTML that determines the presentation.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatPresentation(data: any, context: string, templateVariables?: any, options?: any): FormattedValue {
    data = data || {};

    if (options === undefined || options !== Object(options)) {
      options = {};
    }

    const rawValue = data[this.name];
    const display = this.getDisplay(context);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let formattedValue: any = this.formatvalue(rawValue, context, options);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let unformatted: any;

    /*
     * If column doesn't has column-display annotation and is not of type markdown
     * but the column type is json then append <pre> tag and return the value
     */
    if (!display.isHTML && this.type.name.indexOf('json') === 0) {
      // jsonb column should be treated similar to other columns, so
      // If value is null or empty, return value on based on `show_null` instead of adding the code block.
      if (!isDefinedAndNotNull(rawValue)) {
        return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
      }

      // <pre> will render the html tags, so we have to make sure the tags are escaped.
      formattedValue = escapeHTML(formattedValue);
      return { isHTML: true, value: '<pre>' + formattedValue + '</pre>', unformatted: formattedValue };
    }

    // in this case data must be an array
    if (!display.isMarkdownPattern && this.type.isArray) {
      unformatted = _formatUtils.printArray(formattedValue, { isMarkdown: display.isHTML });

      // If value is null or empty, return value on basis of `show_null`
      if (unformatted === null || unformatted.trim() === '') {
        return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
      }

      return {
        isHTML: true,
        unformatted: unformatted,
        value: renderMarkdown(unformatted, options.inline),
      };
    }

    // bytesize default display
    if (!display.isMarkdownPattern && this.isAssetByteCount) {
      return processMarkdownPattern('{{humanizeBytes _value tooltip=true}}', { _value: rawValue }, this.table, context, {
        templateEngine: HANDLEBARS,
      });
    }

    /*
     * If column doesn't has column-display annotation and is not of type markdown
     * then return formattedValue as it is
     */
    if (!display.isHTML) {
      return { isHTML: false, value: formattedValue, unformatted: formattedValue };
    }

    // the string with markdown syntax in it and not HTML
    unformatted = formattedValue;

    // If there is any markdown pattern then evaluate it
    if (display.isMarkdownPattern) {
      // Get markdown pattern from the annotation value
      const template = display.markdownPattern as string; // pattern

      // Code to do template/string replacement using keyValues
      if (!isObjectAndNotNull(templateVariables)) {
        templateVariables = _getFormattedKeyValues(this.table, context, data);
      }

      const keyValues = {};
      Object.assign(keyValues, templateVariables, {
        $self: formattedValue,
        $_self: rawValue,
      });

      unformatted = _renderTemplate(template, keyValues, this.table.schema.catalog, { templateEngine: display.templateEngine });
    }

    // If value is null or empty, return value on basis of `show_null`
    if (unformatted === null || unformatted.trim() === '') {
      return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
    }

    /*
     * Call printmarkdown to generate HTML from the final generated string after templating and return it
     */
    const value = renderMarkdown(unformatted, options.inline);

    return { isHTML: true, value: value, unformatted: unformatted };
  }

  /**
   * returns string representation of Column
   */
  toString(): string {
    return [fixedEncodeURIComponent(this.table.schema.name), fixedEncodeURIComponent(this.table.name), fixedEncodeURIComponent(this.name)].join(':');
  }

  /**
   * return the default value for a column after checking whether it's a primitive that can be displayed properly
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get default(): any {
    if (this._default === undefined) {
      const defaultVal = this._jsonColumn.default;

      // If the column typename is in the list of types to ignore setting the default for, just use null
      if (_ignoreDefaultsNames.includes(this.name)) {
        this._default = null;
        return this._default;
      }

      try {
        // validate default value based on type name
        if (this.type.name === 'color_rgb_hex') {
          if (!isValidColorRGBHex(defaultVal)) {
            throw new Error('column `' + this.name + '` default: ' + defaultVal + ' is not a valid color rgb hex value.');
          }
          // the root type of color is text, so the next switch won't do anything
        }

        // validate default value based on the root type name
        switch (this.type.rootName) {
          case 'boolean':
            if (typeof defaultVal !== 'boolean') {
              throw new Error('column `' + this.name + '` default: ' + defaultVal + ' is not of type boolean.');
            }
            break;
          case 'int2':
          case 'int4':
          case 'int8': {
            const intVal = parseInt(defaultVal, 10);
            if (isNaN(intVal)) {
              throw new Error('column `' + this.name + '` default: ' + intVal + ' is not of type integer.');
            }
            break;
          }
          case 'float4':
          case 'float8':
          case 'numeric': {
            const floatVal = parseFloat(defaultVal);
            if (isNaN(floatVal)) {
              throw new Error('column `' + this.name + '` default: ' + floatVal + ' is not of type float.');
            }
            break;
          }
          case 'date':
          case 'timestamp':
          case 'timestamptz':
            // convert using moment, if it doesn't error out, set the value.
            // try/catch catches this if it does error out and sets it to null
            if (!moment(defaultVal).isValid()) {
              throw new Error('column ' + this.name + ' default: ' + defaultVal + ' is not a valid DateTime value.');
            }
            break;
          case 'json':
          case 'jsonb':
            JSON.parse(defaultVal);
            break;
          default:
            break;
        }
        this._default = defaultVal;
      } catch (e) {
        $log.info((e as Error).message);
        this._default = null;
      }
    }
    return this._default;
  }

  /** not implemented (crud stub kept from the legacy api) */
  delete(): void {}

  _equals(column: Column): boolean {
    return column.table.schema.name === this.table.schema.name && column.table.name === this.table.name && column.name === this.name;
  }

  /**
   * return the null value for the column based on context and annotation
   */
  _getNullValue(context: string): string | null {
    return _getNullValue(this, context, false);
  }

  getInputDisabled(context: string): boolean | { message: string } {
    // TODO we might want to add inheritence here
    const isGenerated = _processACLAnnotation(this.annotations, _annotations.GENERATED, false);
    const isImmutable = _processACLAnnotation(this.annotations, _annotations.IMMUTABLE, null);
    const isSerial = this.type.name.indexOf('serial') === 0;

    if (context === _contexts.CREATE) {
      // only if insert: false in the ACLs
      // (system columns also have insert:false but we want a better message for them)
      if (this.isGeneratedPerACLs && !this.isSystemColumn) {
        return {
          message: 'Not allowed',
        };
      }

      // if system column, serial type, or generated based on annotation
      if (this.isSystemColumn || isGenerated || isSerial) {
        return {
          message: 'Automatically generated',
        };
      }
    } else if (context === _contexts.EDIT || context === _contexts.ENTRY) {
      if (this.isSystemColumn || this.isImmutablePerACLs || isSerial) {
        return true;
      }
      // if specifically immutable is set to false, then honor it
      if (isImmutable === false) {
        return false;
      }
      if (isGenerated || isImmutable) {
        return true;
      }
    } else {
      // other contexts are not in entry/create/edit modes, which means any "input" is disabled anyway
      return true;
    }
    return false;
  }

  /**
   * display object for the column
   * @param context the context that we want the display for.
   */
  getDisplay(context: string): ColumnDisplay {
    if (!(context in this._display)) {
      let annotation: AnnotationContent = -1;
      let hasPreformat;
      if (this.annotations.contains(_annotations.COLUMN_DISPLAY)) {
        annotation = _getRecursiveAnnotationValue(context, this.annotations.get(_annotations.COLUMN_DISPLAY).content);
      }

      const columnOrder = _processColumnOrderList(annotation.column_order, this.table);

      if (typeof annotation.pre_format === 'object') {
        if (typeof annotation.pre_format.format !== 'string') {
          $log.info(' pre_format annotation provided for column ' + this.name + " doesn't has format string property");
        } else {
          hasPreformat = true;
        }
      }

      let comment: string | null | false = this.comment ? (this.comment.unformatted ?? null) : null;
      if (this.annotations.contains(_annotations.DISPLAY)) {
        // comment can be a string or an object
        let commentAnnot = this.annotations.get(_annotations.DISPLAY).get('comment');
        // point to comment since that is what is contextualized in this annotation
        // if it's an object, that means it's contextualized
        if (typeof commentAnnot === 'object') {
          commentAnnot = _getAnnotationValueByContext(context, commentAnnot);
        }
        if (_isValidModelComment(commentAnnot)) {
          comment = commentAnnot;
        }
      }

      const displayProps = getHierarchicalDisplayAnnotationValue(this, context, 'comment_display', false);
      let columnCommentDisplayMode = _commentDisplayModes.tooltip,
        commentRenderMarkdown;
      if (isObjectAndNotNull(displayProps)) {
        if (_isValidModelCommentDisplay(displayProps.column_comment_display)) {
          columnCommentDisplayMode = displayProps.column_comment_display;
        }
        if (typeof displayProps.comment_render_markdown === 'boolean') {
          commentRenderMarkdown = displayProps.comment_render_markdown;
        }
      }

      const visibleCellHeight = getHierarchicalDisplayAnnotationValue(this, context, 'visible_cell_height', false);

      this._display[context] = {
        hideColumnHeader: annotation.hide_column_header || false, // only hide if the annotation value is true
        isPreformat: hasPreformat,
        preformatConfig: hasPreformat ? annotation.pre_format : null,
        isMarkdownPattern: typeof annotation.markdown_pattern === 'string',
        isMarkdownType: this.type.name === 'markdown',
        isHTML: typeof annotation.markdown_pattern === 'string' || _HTMLColumnType.indexOf(this.type.name) !== -1,
        markdownPattern: annotation.markdown_pattern,
        templateEngine: annotation.template_engine,
        columnOrder: columnOrder,
        comment: processModelComment(comment, commentRenderMarkdown, columnCommentDisplayMode),
        commentRenderMarkdown: commentRenderMarkdown,
        commentDisplayMode: columnCommentDisplayMode,
        visibleCellHeight: isValidVisibleCellHeight(visibleCellHeight) ? visibleCellHeight : undefined,
      };
    }
    return this._display[context];
  }

  /**
   * can be used for comparing two values of the column.
   * Will return
   *   - 1: if a is greater than b
   *   - -1: if b is greater than a
   *   - 0: if a is equal to b, or cannot compare the values
   * NOTE: null is greater than any not-null values.
   * @param a raw value
   * @param b raw value
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compare(a: any, b: any): number {
    // not comparabale
    if (_nonSortableTypes.indexOf(this.type.name) !== -1) {
      return 0;
    }

    // null is considered "greater" than any other value
    if (!isDefinedAndNotNull(a) || !isDefinedAndNotNull(b)) {
      if (!isDefinedAndNotNull(a) && !isDefinedAndNotNull(b)) return 0;
      if (!isDefinedAndNotNull(a)) return 1;
      return -1;
    }

    try {
      switch (this.type.rootName) {
        case 'date':
        case 'timestamp':
        case 'timestamptz': {
          const ma = moment(a),
            mb = moment(b);
          if (ma.isAfter(mb)) {
            return 1;
          }
          if (ma.isBefore(mb)) {
            return -1;
          }
          return 0;
        }
        case 'text':
        case 'longtext':
        case 'markdown':
          return a.localeCompare(b);
        default:
          if (a > b) return 1;
          if (a < b) return -1;
          return 0;
      }
    } catch {
      // invalid data, couldn't compare
      return 0;
    }
  }

  /**
   * Returns the columns that this column should be sorted based on and its direction.
   * It will return an array of objects that has:
   * - `column`: The Column object.
   * - `descending`: Whether we should change the order of sort or not.
   * @param context the context that we want the sort columns for
   */
  _getSortColumns(context: string): ColumnOrderEntry[] | undefined {
    const display = this.getDisplay(context);

    if (display.columnOrder === false) {
      return undefined;
    }

    if (display.columnOrder !== undefined && display.columnOrder.length !== 0) {
      return display.columnOrder;
    }

    if (_nonSortableTypes.indexOf(this.type.name) !== -1) {
      return undefined;
    }

    return [{ column: this }];
  }

  /**
   * Whether this column is unique (part of a simple key) and not-null
   */
  get isUniqueNotNull(): boolean {
    if (this._isUniqueNotNull === undefined) {
      const key = this.memberOfKeys.filter(function (key) {
        return key.simple;
      })[0];
      this._isUniqueNotNull = !this.nullok && key !== undefined;
      this._uniqueNotNullKey = key ? key : null;
    }
    return this._isUniqueNotNull;
  }

  /**
   * If the column is unique and not-null, will return the simple key
   * that is made of this column. Otherwise it will return `null`
   */
  get uniqueNotNullKey(): Key | null {
    if (this._uniqueNotNullKey === undefined) {
      // accessing isUniqueNotNull will populate the _uniqueNotNullKey
      void this.isUniqueNotNull;
    }
    return this._uniqueNotNullKey as Key | null;
  }

  /**
   * whether there's a simple fk based on this column
   */
  get isPartOfSimpleForeignKey(): boolean {
    if (this._isPartOfSimpleForeignKey === undefined) {
      this._isPartOfSimpleForeignKey = this.memberOfForeignKeys.some(function (fk) {
        return fk.simple;
      });
    }
    return this._isPartOfSimpleForeignKey;
  }
}
