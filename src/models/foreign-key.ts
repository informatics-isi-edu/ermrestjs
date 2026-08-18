// models
import { Annotation, Annotations } from '@isrd-isi-edu/ermrestjs/src/models/annotation';
import { ColSet, Mapping } from '@isrd-isi-edu/ermrestjs/src/models/colset';
import type { ColumnOrder } from '@isrd-isi-edu/ermrestjs/src/models/column';
import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { AnnotationContent, ForeignKeyRefJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import type { Key } from '@isrd-isi-edu/ermrestjs/src/models/key';
import type { Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { _annotations, _constraintTypes, _contexts, _foreignKeyInputModes, _warningMessages } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isEmptyArray } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy
import {
  _getAnnotationValueByContext,
  _getHierarchicalDisplayAnnotationValue,
  _getRecursiveAnnotationValue,
  _isValidBulkCreateForeignKey,
  _isValidModelComment,
  _isValidModelCommentDisplay,
  _processColumnOrderList,
  _processModelComment,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _sourceColumnHelpers, _compressSource } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

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
const generateForeignKeyName = _sourceColumnHelpers.generateForeignKeyName as (fk: unknown, isInbound?: boolean) => string;

export interface ForeignKeyRefDisplay {
  columnOrder: ColumnOrder;
  inputDisplayMode: string;
  bulkForeignKeyCreateConstraintName: AnnotationContent;
  showForeignKeyLink: boolean;
  fromName: string | undefined;
  fromComment: CommentType;
  fromCommentDisplayMode: string | undefined;
  toName: string | undefined;
  toComment: CommentType;
  toCommentDisplayMode: string | undefined;
  commentRenderMarkdown: boolean | undefined;
  comment: CommentType;
}

/**
 * One entry of the processed visible-foreign-keys list (see InboundForeignKeys._contextualize).
 * If `isPath` is true then `sourceObjectWrapper` has value, otherwise `foreignKey`.
 */
export interface VisibleForeignKeyEntry {
  isPath?: boolean;
  foreignKey?: ForeignKeyRef;
  sourceObjectWrapper?: SourceObjectWrapper;
  name?: string;
}

/**
 * holds inbound foreignkeys of a table.
 */
export class InboundForeignKeys {
  _foreignKeys: ForeignKeyRef[] = [];
  _table: Table;
  _contextualize_cached: Record<string, VisibleForeignKeyEntry[] | -1>;

  /**
   * @param table the table that this object is for
   */
  constructor(table: Table) {
    this._table = table;
    this._contextualize_cached = {};
  }

  _push(foreignKeyRef: ForeignKeyRef): void {
    this._foreignKeys.push(foreignKeyRef);
  }

  all(): ForeignKeyRef[] {
    return this._foreignKeys;
  }

  length(): number {
    return this._foreignKeys.length;
  }

  /**
   * It will return array of objects with the following attributes:
   * - isPath: if true then source and column have values, otherwise the foreignKey
   * - foreignKey: the foreignkey object
   * - object: The facet object if it's a path.
   * - column: the column object if it's a path.
   * - name: the pseudo column name
   * @param context
   * @param mainTuple the main table data
   */
  _contextualize(context: string, mainTuple?: Tuple): VisibleForeignKeyEntry[] | -1 {
    // if(context in this._contextualize_cached) {
    //     return this._contextualize_cached[context];
    // }

    let orders: AnnotationContent = -1;
    const result: VisibleForeignKeyEntry[] = [];
    if (this._table.annotations.contains(_annotations.VISIBLE_FOREIGN_KEYS)) {
      orders = _getRecursiveAnnotationValue(context, this._table.annotations.get(_annotations.VISIBLE_FOREIGN_KEYS).content);
    }

    if (orders === -1 || !Array.isArray(orders)) {
      this._contextualize_cached[context] = -1;
      return -1;
    }

    const fkNames: Record<string, boolean> = {};
    let invalid;
    const definitions = this._table.sourceDefinitions,
      wm = _warningMessages;
    const logErr = (bool: boolean, message: string, i?: number) => {
      if (bool) {
        $log.info(`vis-fk for table '${this._table.name}' in context '${context}' at index '${i}':`);
        $log.info(message);
      }
      return bool;
    };

    const addToList = (obj: VisibleForeignKeyEntry & { name: string }) => {
      if (obj.name in fkNames) {
        return; // avoid duplicates
      }
      fkNames[obj.name] = true; // make sure we don't add twice
      result.push(obj);
    };

    for (let i = 0; i < orders.length; i++) {
      // inbound foreignkey
      if (Array.isArray(orders[i])) {
        // valid input
        if (orders[i].length !== 2) continue;

        // valid fk
        const fk = this._table.schema.catalog.constraintByNamePair(orders[i], _constraintTypes.FOREIGN_KEY);
        if (fk !== null && this._foreignKeys.indexOf(fk.object as ForeignKeyRef) !== -1) {
          const colName = generateForeignKeyName(fk.object, true);
          addToList({ foreignKey: fk.object as ForeignKeyRef, name: colName });
        } else {
          logErr(true, wm.INVALID_FK, i);
        }
      }
      // path
      else if (typeof orders[i] === 'object') {
        let wrapper: SourceObjectWrapper | undefined;
        if (orders[i].source || orders[i].sourcekey) {
          try {
            // if both source and sourcekey are defined, ignore the source and use sourcekey
            if (orders[i].sourcekey) {
              const def = definitions.getSource(orders[i].sourcekey);
              if (def) {
                wrapper = def.clone(orders[i], this._table, false, mainTuple);
              }
            } else {
              wrapper = new SourceObjectWrapper(orders[i], this._table, false, undefined, mainTuple);
            }
          } catch (exp) {
            // we might want to show a better error message later.
            logErr(true, (exp as Error).message, i);
            invalid = true;
          }

          // invalid if:
          // 1. invalid source and not a path.
          // 2. no inbound
          // 3. not entity mode
          // 4. has aggregate
          invalid =
            invalid ||
            logErr(!wrapper || !wrapper.hasPath, wm.INVALID_FK, i) ||
            logErr(!wrapper!.hasInbound, wm.INVALID_FK_NO_INBOUND, i) ||
            logErr(!wrapper!.isEntityMode, wm.SCALAR_NOT_ALLOWED) ||
            logErr(wrapper!.hasAggregate, wm.AGG_NOT_ALLOWED);
        } else {
          invalid = true;
          logErr(true, wm.INVALID_SOURCE, i);
        }

        if (!invalid) {
          addToList({ isPath: true, sourceObjectWrapper: wrapper, name: wrapper!.name });
        }
        invalid = false;
      }
    }
    // this._contextualize_cached[context] = result;
    return result;
  }
}

/**
 * holds the outbound foreignkeys of a table.
 */
export class ForeignKeys {
  _foreignKeys: ForeignKeyRef[] = []; // array of ForeignKeyRef
  _mappings: Mapping[] = []; // array of Mapping
  _table: Table;

  constructor(table: Table) {
    this._table = table;
  }

  _push(foreignKeyRef: ForeignKeyRef): void {
    this._foreignKeys.push(foreignKeyRef);
    this._mappings.push(foreignKeyRef.mapping);
  }

  /**
   * an array of all foreign key references
   */
  all(): ForeignKeyRef[] {
    return this._foreignKeys;
  }

  /**
   * an array of the foreign keys' colsets
   */
  colsets(): ColSet[] {
    const sets = [];
    for (let i = 0; i < this._foreignKeys.length; i++) {
      sets.push(this._foreignKeys[i].colset);
    }
    return sets;
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * number of foreign keys
   */
  length(): number {
    return this._foreignKeys.length;
  }

  mappings(): Mapping[] {
    return this._mappings;
  }

  /**
   * get the foreign key references of the given column set
   * @throws {NotFoundError} foreign key not found
   */
  get(colset: ColSet): ForeignKeyRef[] {
    // find ForeignKeyRef with the same colset
    const fks = [];
    for (let i = 0; i < this._foreignKeys.length; i++) {
      const fkr = this._foreignKeys[i];
      if (colset._equals(fkr.colset)) {
        fks.push(fkr);
      }
    }
    if (fks.length > 0) {
      return fks;
    }

    throw new NotFoundError('', 'Foreign Key not found for the colset.');
  }
}

/**
 * A foreign key reference (relationship between two tables).
 */
export class ForeignKeyRef {
  /*
   * @deprecated
   * TODO
   * I added `this.table` below and we should remove `this._table`. But
   * I'm leaving it in for now because I am not sure what I might break.
   */
  _table: Table;

  /**
   * The table that this foreignkey is defined on (from table)
   */
  table: Table;

  /**
   * The RID of this foreign key (might not be defined)
   */
  RID?: string;

  colset: ColSet;

  /**
   * find key from referencedCols
   * use index 0 since all refCols should be of the same schema:table
   */
  key: Key;

  rights: ForeignKeyRefJSON['rights'];

  mapping: Mapping;

  /**
   * The exact `names` array in foreign key definition
   * The constraint names for this foreign key
   */
  constraint_names: string[][];

  _constraintName: string;

  ignore: boolean;

  annotations: Annotations;

  /**
   * Documentation for this foreign key reference
   * @deprecated comment can be contextualized, so please do `this.getDisplay(context).comment` instead.
   */
  comment: CommentType;

  /**
   * whether the "on delete cascade" is set for this foreign key.
   */
  onDeleteCascade: boolean;

  _display: Record<string, ForeignKeyRefDisplay>;

  _compressedDataSource?: AnnotationContent;
  _name?: string;
  _isNotNull?: boolean;
  _isNotNullPerModel?: boolean;

  constructor(table: Table, jsonFKR: ForeignKeyRefJSON) {
    this._table = table;
    this.table = table;

    this.RID = jsonFKR.RID;

    const catalog = table.schema.catalog;

    // create ColSet for foreign key columns
    const fkCols = jsonFKR.foreign_key_columns;
    const foreignKeyCols = [];
    for (let i = 0; i < fkCols.length; i++) {
      const fkcol = table.columns.get(fkCols[i].column_name); // "Column" object
      foreignKeyCols.push(fkcol);
      fkcol.memberOfForeignKeys.push(this);
    }

    this.colset = new ColSet(foreignKeyCols);

    // find corresponding Key from referenced columns
    // ** all the tables in the catalog must have been created at this point
    const refCols = jsonFKR.referenced_columns;
    const refTable = catalog.schemas.get(refCols[0].schema_name).tables.get(refCols[0].table_name);
    const referencedCols = [];
    for (let j = 0; j < refCols.length; j++) {
      const col = refTable.columns.get(refCols[j].column_name);
      referencedCols.push(col);
    }

    this.key = refTable.keys.get(new ColSet(referencedCols));

    this.rights = jsonFKR.rights;

    this.mapping = new Mapping(foreignKeyCols, referencedCols);

    this.constraint_names = jsonFKR.names;
    this._constraintName = this.constraint_names[0].join('_');

    // add constraint names to catalog
    for (let k = 0; k < this.constraint_names.length; k++) {
      const constraint = this.constraint_names[k];
      try {
        if (Array.isArray(constraint) && constraint.length === 2) {
          catalog._addConstraintName(constraint, this, _constraintTypes.FOREIGN_KEY);
        }
      } catch {
        // ignore
      }
    }

    this.ignore = false;

    this.annotations = new Annotations();
    for (const uri in jsonFKR.annotations) {
      const jsonAnnotation = jsonFKR.annotations[uri];
      this.annotations._push(new Annotation('foreignkeyref', uri, jsonAnnotation));

      if (uri === _annotations.HIDDEN) {
        this.ignore = true;
      } else if (uri === _annotations.IGNORE && (jsonAnnotation === null || isEmptyArray(jsonAnnotation))) {
        this.ignore = true;
      }
    }

    this.comment = processModelComment(jsonFKR.comment);

    this.onDeleteCascade = jsonFKR.on_delete === 'CASCADE';

    this._display = {};
  }

  /**
   * the compressed source path from the main reference to this column
   */
  get compressedDataSource(): AnnotationContent {
    if (this._compressedDataSource === undefined) {
      let ds: AnnotationContent = null;
      if (this.table.shortestKey.length === 1) {
        ds = [{ outbound: this.constraint_names[0] }, this.table.shortestKey[0].name];
      }
      this._compressedDataSource = _compressSource(ds);
    }
    return this._compressedDataSource;
  }

  /**
   * A unique name that can be used for referring to this foreignkey.
   */
  get name(): string {
    if (this._name === undefined) {
      this._name = generateForeignKeyName(this);
    }
    return this._name;
  }

  /**
   * returns string representation of ForeignKeyRef object
   * @param reverse false: returns (keyCol1, keyCol2)=(s:t:FKCol1,FKCol2) true: returns (FKCol1, FKCol2)=(s:t:keyCol1,keyCol2)
   * @param isLeft  true: left join, other values: inner join
   */
  toString(reverse?: boolean, isLeft?: boolean): string {
    let leftString = '',
      rightString = '';
    const columnsLength = this.colset.columns.length;
    for (let i = 0; i < columnsLength; i++) {
      const fromCol = this.colset.columns[i];
      const toCol = this.mapping.get(fromCol);
      const separator = i < columnsLength - 1 ? ',' : '';

      leftString += (reverse ? fixedEncodeURIComponent(fromCol.name) : fixedEncodeURIComponent(toCol.name)) + separator;
      if (reverse) {
        rightString += i === 0 ? toCol.toString() : fixedEncodeURIComponent(toCol.name);
      } else {
        rightString += i === 0 ? fromCol.toString() : fixedEncodeURIComponent(fromCol.name);
      }
      rightString += separator;
    }

    const joinType = isLeft === true ? 'left' : '';
    return joinType + '(' + leftString + ')=(' + rightString + ')';
  }

  /** not implemented (crud stub kept from the legacy api) */
  delete(): void {}

  /**
   * Indicates if the foreign key is simple (not composite)
   */
  get simple(): boolean {
    return this.key.simple;
  }

  getDisplay(context: string): ForeignKeyRefDisplay {
    if (!(context in this._display)) {
      let fkAnnot: AnnotationContent;
      let displayAnnot: AnnotationContent = -1;
      let showFKLink: AnnotationContent;
      let inputDisplayMode = _foreignKeyInputModes[0];
      let toTableAnnotation: AnnotationContent;
      let bulkCreateConstraintName: AnnotationContent = null;

      let fromName, toName, fromCommentDisplayMode, toCommentDisplayMode, commentRenderMarkdown;
      let fromComment = null,
        toComment = null;

      if (this.annotations.contains(_annotations.FOREIGN_KEY)) {
        fkAnnot = this.annotations.get(_annotations.FOREIGN_KEY);
        displayAnnot = _getAnnotationValueByContext(context, fkAnnot.get('display'));

        fkAnnot = fkAnnot.content;
      }

      // from_name and to_name
      if (fkAnnot && fkAnnot.from_name) {
        fromName = fkAnnot.from_name;
      }
      if (fkAnnot && fkAnnot.to_name) {
        toName = fkAnnot.to_name;
      }

      // comment related props
      if (fkAnnot && _isValidModelComment(fkAnnot.from_comment)) {
        fromComment = (processModelComment(fkAnnot.from_comment) as Exclude<CommentType, null | false>).unformatted;
      }
      if (fkAnnot && _isValidModelCommentDisplay(fkAnnot.from_comment_display)) {
        fromCommentDisplayMode = fkAnnot.from_comment_display;
      }
      if (fkAnnot && _isValidModelComment(fkAnnot.to_comment)) {
        toComment = (processModelComment(fkAnnot.to_comment) as Exclude<CommentType, null | false>).unformatted;
      }
      if (fkAnnot && _isValidModelCommentDisplay(fkAnnot.to_comment_display)) {
        toCommentDisplayMode = fkAnnot.to_comment_display;
      }
      if (fkAnnot && typeof fkAnnot.comment_render_markdown === 'boolean') {
        commentRenderMarkdown = fkAnnot.comment_render_markdown;
      }

      const columnOrder = _processColumnOrderList(displayAnnot.column_order, this.key.table);
      showFKLink = displayAnnot.show_foreign_key_link;
      if (typeof showFKLink !== 'boolean') {
        showFKLink = getHierarchicalDisplayAnnotationValue(this, context, 'show_foreign_key_link');

        // default:
        //   compact/select: false
        //   *: true
        if (typeof showFKLink !== 'boolean') {
          if (context === _contexts.COMPACT_SELECT) {
            showFKLink = false;
          } else {
            showFKLink = true;
          }
        }
      }

      /*
       * inputDisplayMode is set based on the following rules:
       *   1. defined on display property in visible-columns
       *   2. foreign key annotation
       *   3. table-display annotation when defined on the leaf table of the fkey relationship
       *   4. default value of 'popup'
       *
       * supported _foreignKeyInputModes are ['facet-search-popup', 'simple-search-dropdown']
       */
      // NOTE: this property is only used when the table is used as the leaf for a foreign key
      // using index 0 ensures we only support this on single outbound foreign key relationships when table-display is on the leaf table
      const fromCol = this.colset.columns[0];
      const toCol = this.mapping.get(fromCol);
      if (toCol.table.annotations.contains(_annotations.TABLE_DISPLAY)) {
        toTableAnnotation = _getRecursiveAnnotationValue(context, toCol.table.annotations.get(_annotations.TABLE_DISPLAY).content);

        if (toTableAnnotation.selector_ux_mode && _foreignKeyInputModes.indexOf(toTableAnnotation.selector_ux_mode) !== -1) {
          inputDisplayMode = toTableAnnotation.selector_ux_mode;
        }
      }

      if (displayAnnot.selector_ux_mode && _foreignKeyInputModes.indexOf(displayAnnot.selector_ux_mode) !== -1) {
        inputDisplayMode = displayAnnot.selector_ux_mode;
      }

      /*
       * bulkForeignKeyCreate column is set based on the following rules:
       *   1. defined on display property in visible-columns
       *   2. foreign key annotation
       *   3. table-display annotation
       *   4. display annotation on table, schema, then catalog
       *   5. default heuristics used when computeBulkCreateForeignKeyObject is called
       */
      // check display annotation on table/schema/catalog
      // if true, don't set anything and let the heuristics be used
      // if false, set to false to turn off heuristics
      if (this.table._shouldUseBulkCreateForeignKey === false) bulkCreateConstraintName = false;

      if (this.table.annotations.contains(_annotations.TABLE_DISPLAY)) {
        const tableAnnotation = _getRecursiveAnnotationValue(context, this.table.annotations.get(_annotations.TABLE_DISPLAY).content);

        // check the value is an array since only `[['schema_name', 'foreignkey_name'], ... ]` is allowed for this property
        // each individual array element is validated when reading this annotation value
        if (Array.isArray(tableAnnotation.bulk_create_foreign_key_candidates)) {
          bulkCreateConstraintName = tableAnnotation.bulk_create_foreign_key_candidates;
        }
      }

      // check foreign key annotation
      if (_isValidBulkCreateForeignKey(displayAnnot.bulk_create_foreign_key)) {
        bulkCreateConstraintName = displayAnnot.bulk_create_foreign_key;
      }

      this._display[context] = {
        columnOrder: columnOrder,
        inputDisplayMode: inputDisplayMode,
        bulkForeignKeyCreateConstraintName: bulkCreateConstraintName,
        showForeignKeyLink: showFKLink,
        fromName: fromName,
        fromComment: processModelComment(fromComment, commentRenderMarkdown, fromCommentDisplayMode),
        fromCommentDisplayMode: fromCommentDisplayMode,
        toName: toName,
        toComment: processModelComment(toComment, commentRenderMarkdown, toCommentDisplayMode),
        toCommentDisplayMode: toCommentDisplayMode,
        commentRenderMarkdown: commentRenderMarkdown,
        // TODO this is left for backwards compatibility and should most probably be removed in favor of toComment and fromComment
        comment: processModelComment(this.comment ? (this.comment.unformatted ?? null) : null, commentRenderMarkdown),
      };
    }

    return this._display[context];
  }

  /**
   * Whether all the columns in the relationship are not-nullable,
   *  - nullok: false
   *  - select: true
   */
  get isNotNull(): boolean {
    if (this._isNotNull === undefined) {
      const colsetNotNull = function (colset: ColSet) {
        return colset.columns.every(function (col) {
          return !col.nullok && col.rights.select === true;
        });
      };

      this._isNotNull = colsetNotNull(this.colset) && colsetNotNull(this.key.colset);
    }
    return this._isNotNull;
  }

  /**
   * Whether all the columns in the relationship are not-nullable per model,
   *  - nullok: false
   */
  get isNotNullPerModel(): boolean {
    if (this._isNotNullPerModel === undefined) {
      const colsetNotNull = function (colset: ColSet) {
        return colset.columns.every(function (col) {
          return !col.nullok;
        });
      };

      this._isNotNullPerModel = colsetNotNull(this.colset) && colsetNotNull(this.key.colset);
    }
    return this._isNotNullPerModel;
  }
}
