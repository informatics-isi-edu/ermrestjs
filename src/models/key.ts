// models
import { Annotation, Annotations } from '@isrd-isi-edu/ermrestjs/src/models/annotation';
import { ColSet } from '@isrd-isi-edu/ermrestjs/src/models/colset';
import type { Column, ColumnOrder } from '@isrd-isi-edu/ermrestjs/src/models/column';
import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { AnnotationContent, KeyJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

// utils
import { _annotations, _commentDisplayModes, _constraintTypes, _contexts } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isObjectAndNotNull, isValidVisibleCellHeight } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

// legacy
import {
  _getAnnotationValueByContext,
  _getHierarchicalDisplayAnnotationValue,
  _isValidModelComment,
  _isValidModelCommentDisplay,
  _processColumnOrderList,
  _processModelComment,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _sourceColumnHelpers } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

/*
 * typed views of the untyped legacy helpers; remove once js/utils/helpers.js
 * and js/utils/pseudocolumn_helpers.js are migrated to typescript.
 */
const processModelComment = _processModelComment as (comment?: string | null | false, isMarkdown?: boolean, displayMode?: string) => CommentType;
const getHierarchicalDisplayAnnotationValue = _getHierarchicalDisplayAnnotationValue as (
  obj: unknown,
  context: string,
  annotKey: string,
  isTable?: boolean,
) => AnnotationContent;
const generateSourceObjectHashName = _sourceColumnHelpers.generateSourceObjectHashName as (obj: unknown, useOnlySource?: boolean) => string;

export interface KeyDisplay {
  columnOrder: ColumnOrder;
  isMarkdownPattern: boolean;
  templateEngine: string | undefined;
  markdownPattern: string | undefined;
  showKeyLink: boolean;
  comment: CommentType;
  visibleCellHeight: number | undefined;
}

/**
 * Container of the Key objects defined on a table.
 */
export class Keys {
  _keys: Key[] = [];

  _push(key: Key): void {
    this._keys.push(key);
  }

  /**
   * a list of all Keys
   */
  all(): Key[] {
    return this._keys;
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * number of keys
   */
  length(): number {
    return this._keys.length;
  }

  /**
   * array of colsets
   */
  colsets(): ColSet[] {
    const sets = [];
    for (let i = 0; i < this._keys.length; i++) {
      sets.push(this._keys[i].colset);
    }
    return sets;
  }

  /**
   * get the key by the column set
   * @throws {NotFoundError} Key not found
   */
  get(colset: ColSet): Key {
    // find Key with the same colset
    for (let i = 0; i < this._keys.length; i++) {
      const key = this._keys[i];
      if (colset._equals(key.colset)) {
        return key;
      }
    }

    throw new NotFoundError('', 'Key not found for colset');
  }
}

/**
 * A key (uniqueness constraint) defined on a table.
 */
export class Key {
  /*
   * @deprecated
   * TODO
   * I added `this.table` below and we should remove `this._table`. But
   * I'm leaving it in for now because I am not sure what I might break.
   */
  _table: Table;

  /**
   * Reference to the table that this Key belongs to.
   */
  table: Table;

  colset: ColSet;

  annotations: Annotations;

  /**
   * Documentation for this key
   * @deprecated comment can be contextualized, so please do `this.getDisplay(context).comment` instead.
   */
  comment: CommentType;

  /**
   * The RID of this key (might not be defined)
   */
  RID?: string;

  /**
   * The exact `names` array in key definition
   */
  constraint_names: string[][];

  _constraintName: string;

  _wellFormed: Record<string, boolean>;
  _display: Record<string, KeyDisplay>;

  _name?: string;
  _nullok_cache?: boolean;

  /**
   * @param table the table object.
   * @param jsonKey json key.
   */
  constructor(table: Table, jsonKey: KeyJSON) {
    this._table = table;
    this.table = table;

    const uniqueColumns: Column[] = [];
    for (let i = 0; i < jsonKey.unique_columns.length; i++) {
      // find corresponding column objects
      const col = table.columns.get(jsonKey.unique_columns[i]);
      uniqueColumns.push(col);
      col.memberOfKeys.push(this);
    }
    // sort columns by name
    uniqueColumns.sort(function (c1, c2) {
      if (c1.name < c2.name) return -1;
      if (c1.name > c2.name) return 1;
      return 0;
    });

    this.colset = new ColSet(uniqueColumns);

    this.annotations = new Annotations();
    for (const uri in jsonKey.annotations) {
      const jsonAnnotation = jsonKey.annotations[uri];
      this.annotations._push(new Annotation('key', uri, jsonAnnotation));
    }

    this.comment = processModelComment(jsonKey.comment);
    if (this.annotations.contains(_annotations.DISPLAY)) {
      const cm = processModelComment(this.annotations.get(_annotations.DISPLAY).content.comment);
      if (cm) {
        this.comment = cm;
      }
    }

    this.RID = jsonKey.RID;

    this.constraint_names = jsonKey.names;
    this._constraintName = this.constraint_names[0].join('_');

    // add constraint names to catalog
    for (let k = 0; k < this.constraint_names.length; k++) {
      const constraint = this.constraint_names[k];
      try {
        if (Array.isArray(constraint) && constraint.length === 2) {
          table.schema.catalog._addConstraintName(constraint, this, _constraintTypes.KEY);
        }
      } catch {
        // ignore
      }
    }

    this._wellFormed = {};
    this._display = {};
  }

  /**
   * Unique name that can be used for referring to this key.
   */
  get name(): string {
    if (this._name === undefined) {
      let obj: string | { source: string; self_link: boolean } = this._constraintName;
      if (this.simple) {
        obj = { source: this.colset.columns[0].name, self_link: true };
      }
      this._name = generateSourceObjectHashName(obj, false);
    }
    return this._name;
  }

  /**
   * Indicates if the key is simple (not composite)
   */
  get simple(): boolean {
    return this.colset.length() === 1;
  }

  /**
   * Indicates if all of the constituent columns have nullok=false or not.
   * If any of them have nullok=true, it will return false.
   */
  get _notNull(): boolean {
    if (this._nullok_cache === undefined) {
      const cols = this.colset.columns;
      let result = true;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c].nullok) {
          result = false;
          break;
        }
      }
      this._nullok_cache = result;
    }
    return this._nullok_cache;
  }

  /**
   * whether key has a column
   */
  containsColumn(column: Column): boolean {
    return this.colset.columns.indexOf(column) !== -1;
  }

  /**
   * Will return true if all the columns are not null, not html, and not array.
   * @param context the context (used for checking the markdown_pattern)
   */
  _isWellFormed(context: string): boolean {
    if (!(context in this._wellFormed)) {
      const cols = this.colset.columns;
      let result = true;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c].nullok || cols[c].type.isArray || cols[c].getDisplay(context).isHTML) {
          result = false;
          break;
        }
      }
      this._wellFormed[context] = result;
    }
    return this._wellFormed[context];
  }

  getDisplay(context: string): KeyDisplay {
    if (!(context in this._display)) {
      let annotation: AnnotationContent = -1;
      let showKeyLink: AnnotationContent;
      if (this.annotations.contains(_annotations.KEY_DISPLAY)) {
        annotation = _getAnnotationValueByContext(context, this.annotations.get(_annotations.KEY_DISPLAY).content);
      }

      const columnOrder = _processColumnOrderList(annotation.column_order, this.table);
      showKeyLink = annotation.show_key_link;
      if (typeof showKeyLink !== 'boolean') {
        showKeyLink = getHierarchicalDisplayAnnotationValue(this, context, 'show_key_link', false);

        // default:
        //   compact/select: false
        //   *: true
        if (typeof showKeyLink !== 'boolean') {
          if (context === _contexts.COMPACT_SELECT) {
            showKeyLink = false;
          } else {
            showKeyLink = true;
          }
        }
      }

      let annotComment = null;
      if (this.annotations.contains(_annotations.DISPLAY)) {
        annotComment = this.annotations.get(_annotations.DISPLAY).get('comment');
        if (typeof annotComment === 'object') {
          annotComment = _getAnnotationValueByContext(context, annotComment);
        }
      }

      let comment: string | null | false = this.comment ? (this.comment.unformatted ?? null) : null;
      if (_isValidModelComment(annotComment)) {
        comment = annotComment;
      }

      const commentProps = getHierarchicalDisplayAnnotationValue(this, context, 'comment_display', false);
      let commentDisplay = _commentDisplayModes.tooltip,
        commentRenderMarkdown;
      if (isObjectAndNotNull(commentProps)) {
        if (_isValidModelCommentDisplay(commentProps.column_comment_display)) {
          commentDisplay = commentProps.column_comment_display;
        }
        if (typeof commentProps.comment_render_markdown === 'boolean') {
          commentRenderMarkdown = commentProps.comment_render_markdown;
        }
      }

      const visibleCellHeight = getHierarchicalDisplayAnnotationValue(this, context, 'visible_cell_height', false);

      this._display[context] = {
        columnOrder: columnOrder,
        isMarkdownPattern: typeof annotation.markdown_pattern === 'string',
        templateEngine: annotation.template_engine,
        markdownPattern: annotation.markdown_pattern,
        showKeyLink: showKeyLink,
        comment: processModelComment(comment, commentRenderMarkdown, commentDisplay),
        visibleCellHeight: isValidVisibleCellHeight(visibleCellHeight) ? visibleCellHeight : undefined,
      };
    }

    return this._display[context];
  }
}
