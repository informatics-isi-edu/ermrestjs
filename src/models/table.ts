// models
import { Annotation, Annotations } from '@isrd-isi-edu/ermrestjs/src/models/annotation';
import { Column, Columns } from '@isrd-isi-edu/ermrestjs/src/models/column';
import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import type { AnnotationContent, TableJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { ForeignKeyRef, ForeignKeys, InboundForeignKeys } from '@isrd-isi-edu/ermrestjs/src/models/foreign-key';
import { Key, Keys } from '@isrd-isi-edu/ermrestjs/src/models/key';
import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { Schema } from '@isrd-isi-edu/ermrestjs/src/models/schema';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import TableSourceDefinitions from '@isrd-isi-edu/ermrestjs/src/models/table-source-definitions';

// services
import CatalogService from '@isrd-isi-edu/ermrestjs/src/services/catalog';
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import {
  _annotations,
  _commentDisplayModes,
  _constraintTypes,
  _contexts,
  _FacetsLogicalOperators,
  _serialTypes,
  _specialSourceDefinitions,
  _systemColumns,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isDefinedAndNotNull, isObjectAndNotNull, isEmptyArray, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy
import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import {
  compareColumnPositions,
  _determineDisplayName,
  _getAnnotationValueByContext,
  _getHierarchicalDisplayAnnotationValue,
  _getNullValue,
  _getRecursiveAnnotationValue,
  _isValidModelComment,
  _isValidModelCommentDisplay,
  _processACLAnnotation,
  _processModelComment,
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

export interface TableDisplay {
  columnCommentDisplayMode: string;
  tableCommentDisplayMode: string;
  comment: CommentType;
  commentRenderMarkdown: boolean | undefined;
}

/**
 * The result of the findForeignKey lookups. If `successful` is false,
 * `message` explains why; otherwise `foreignKey` and `isInbound` have values.
 */
export interface FindForeignKeyResult {
  successful: boolean;
  message?: string;
  foreignKey?: ForeignKeyRef;
  isInbound?: boolean;
}

export interface AssetCategoryInfo {
  category: string;
  URLColumnName?: string;
}

/*
 * Search the display annotation of the given table, its schema, and catalog (in
 * that order) for a boolean-valued property. Returns -1 when none define it.
 * NOTE this is not the same as helpers' 4-arg _getHierarchicalDisplayAnnotationValue
 * (which this function used to shadow inside the Table constructor).
 */
const _getTableHierarchicalAnnotationValue = function (table: Table, annotKey: string): boolean | -1 {
  const displayAnnot = _annotations.DISPLAY;
  let value: boolean | -1 = -1;

  // hierarchy should be an array of [table, schema, catalog]
  const hierarchy = [table, table.schema, table.schema.catalog];

  for (let i = 0; i < hierarchy.length; i++) {
    // if the display annotation is not defined, skip this model element
    if (!hierarchy[i].annotations.contains(displayAnnot)) continue;

    const annot = hierarchy[i].annotations.get(displayAnnot);
    if (annot && annot.content && typeof annot.content[annotKey] === 'boolean') {
      value = annot.content[annotKey];
      break;
    }
  }

  return value;
};

/**
 * Container of the Table objects of a schema, keyed by table name.
 */
export class Tables {
  _tables: Record<string, Table> = {};

  _all?: Table[];

  _push(table: Table): void {
    this._tables[table.name] = table;
  }

  /**
   * array of tables
   */
  all(): Table[] {
    if (!this._all) {
      this._all = [];
      for (const key in this._tables) {
        this._all.push(this._tables[key]);
      }
    }

    return this._all;
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * number of tables
   */
  length(): number {
    return Object.keys(this._tables).length;
  }

  /**
   * Array of table names
   */
  names(): string[] {
    return Object.keys(this._tables);
  }

  /**
   * get table by table name
   * @param name name of table
   * @throws {NotFoundError} table not found
   */
  get(name: string): Table {
    if (!(name in this._tables)) {
      throw new NotFoundError('', 'Table ' + name + ' not found in schema.');
    }

    return this._tables[name];
  }

  /**
   * check for table name existence
   * @param name table name
   */
  has(name: string): boolean {
    return name in this._tables;
  }
}

/**
 * A table in the ermrest model.
 */
export class Table {
  schema: Schema;

  /**
   * the database name of the table
   */
  name: string;

  _jsonTable: TableJSON;

  /**
   * The RID of this table (might not be defined)
   */
  RID?: string;

  _nullValue: Record<string, unknown>; // used to avoid recomputation of null value for different contexts.

  _uri: string;

  ignore: boolean;

  /**
   * this defaults to itself on the first pass of introspection
   * then might be changed on the second pass if this is an alternative table
   */
  _baseTable: Table;

  annotations: Annotations;

  /**
   * whether table is generated
   * inherits from schema
   */
  isGenerated: boolean | null;

  /**
   * whether table is immutable
   * inherits from schema
   * true: table is immutable (per annotation)
   * false: table is mutable (per annotation)
   * null: annotation is not defined on table nor schema
   */
  isImmutable: boolean | null;

  /**
   * whether table is non-deletable
   */
  isNonDeletable: boolean | null;

  _nameStyle: Record<string, unknown>; // Used in the displayname to store the name styles.
  _rowDisplayKeys: Record<string, Key | undefined>; // Used for display key

  /**
   * Preferred display name for user presentation only.
   * this.displayname.isHTML will return true/false
   * this.displayname.value has the value
   */
  displayname: DisplayName;

  columns: Columns;

  keys: Keys;

  rights: TableJSON['rights'];

  foreignKeys: ForeignKeys;

  /**
   * All the FKRs to this table.
   */
  referredBy: InboundForeignKeys;

  /**
   * Documentation for this table
   * @deprecated comment can be contextualized, so please do `this.getDisplay(context).comment` instead.
   */
  comment: CommentType;

  /**
   * if the annotation value is -1 (not defined anywhere), the feature is turned off
   */
  _showSavedQuery: boolean;

  // if false, turn off the feature. if null or not defined, allow the heuristics to be used
  _shouldUseBulkCreateForeignKey: boolean;

  /**
   * The path to the table where the favorite terms are stored
   */
  favoritesPath: string | null;

  /**
   * The type of this table
   */
  kind: string | undefined;

  /**
   * Whether the table supports history features:
   *  - it's a table (not view)
   *  - it doesn't have the history-capture annotation, or has it with any value other than false
   */
  supportHistory: boolean;

  _appLinksAnnotation?: AnnotationContent;

  /**
   * Whether we should lookup the facets in the url in the list of facets.
   */
  aggressiveFacetLookup: boolean;

  _exportTemplates: Record<string, unknown>;

  _display: Record<string, TableDisplay>;

  _altForeignKey: ForeignKeyRef | undefined;
  _altSharedKey: Key | null | undefined;
  _alternatives?: Record<string, Table>; // in the form {context: table, ...}, populated by _findAlternatives

  // lazily-computed caches
  _shortestKey?: Column[];
  _displayKey?: Column[];
  _stableKey?: Column[];
  _reference?: Reference;
  _sourceDefinitions?: TableSourceDefinitions;
  _searchSourceDefinition?: false | { columns: SourceObjectWrapper[]; allSamePathPrefix: boolean };
  _isPureBinaryAssociation?: boolean;
  _pureBinaryForeignKeys_cached?: ForeignKeyRef[] | null;

  /**
   * @param schema the schema object.
   * @param jsonTable the json of the table.
   */
  constructor(schema: Schema, jsonTable: TableJSON) {
    this.schema = schema;

    this.name = jsonTable.table_name;
    this._jsonTable = jsonTable;

    this.RID = jsonTable.RID;

    this._nullValue = {};

    this._uri = schema.catalog._uri + '/entity/' + fixedEncodeURIComponent(schema.name) + ':' + fixedEncodeURIComponent(jsonTable.table_name);

    this.ignore = false;

    this._baseTable = this;

    this.annotations = new Annotations();
    for (const uri in jsonTable.annotations) {
      const jsonAnnotation = jsonTable.annotations[uri];
      this.annotations._push(new Annotation('table', uri, jsonAnnotation));

      if (uri === _annotations.HIDDEN) {
        this.ignore = true;
      } else if (uri === _annotations.IGNORE && (jsonAnnotation === null || isEmptyArray(jsonAnnotation))) {
        this.ignore = true;
      }
    }

    this.isGenerated = _processACLAnnotation(this.annotations, _annotations.GENERATED, this.schema.isGenerated);

    this.isImmutable = _processACLAnnotation(this.annotations, _annotations.IMMUTABLE, this.schema.isImmutable);

    this.isNonDeletable = _processACLAnnotation(this.annotations, _annotations.NON_DELETABLE, this.schema.isNonDeletable);

    this._nameStyle = {};
    this._rowDisplayKeys = {};

    this.displayname = _determineDisplayName(this, true, this.schema);

    this.columns = new Columns(this);

    const assetCategories = this._assignAssetCategories();
    for (let i = 0; i < jsonTable.column_definitions.length; i++) {
      const jsonColumn = jsonTable.column_definitions[i];
      this.columns._push(new Column(this, jsonColumn, assetCategories[jsonColumn.name]));
    }

    this.keys = new Keys();
    for (let i = 0; i < jsonTable.keys.length; i++) {
      const jsonKey = jsonTable.keys[i];
      this.keys._push(new Key(this, jsonKey));
    }

    this.rights = jsonTable.rights;

    this.foreignKeys = new ForeignKeys(this);

    this.referredBy = new InboundForeignKeys(this);

    this.comment = processModelComment(jsonTable.comment);
    if (this.annotations.contains(_annotations.DISPLAY)) {
      const cm = processModelComment(this.annotations.get(_annotations.DISPLAY).content.comment);
      if (cm) {
        this.comment = cm;
      }
    }

    const showSavedQueryAnnoVal = _getTableHierarchicalAnnotationValue(this, 'show_saved_query');
    // if showSavedQueryAnnoVal is -1, turn off the feature
    this._showSavedQuery = showSavedQueryAnnoVal === -1 ? false : showSavedQueryAnnoVal;

    // if false, turn off the feature
    // if null or not defined, allow the heuristics to be used
    const bulkCreateAnnoVal = _getTableHierarchicalAnnotationValue(this, 'bulk_create_foreign_key');
    this._shouldUseBulkCreateForeignKey = bulkCreateAnnoVal === false ? false : true;

    this.favoritesPath = null;
    if (this.annotations.contains(_annotations.TABLE_CONFIG)) {
      const userFavorites = this.annotations.get(_annotations.TABLE_CONFIG).content.user_favorites;
      // make sure user_favorites is defined
      // make sure storage table is an object
      if (userFavorites && typeof userFavorites.storage_table === 'object') {
        const favoritesTable = userFavorites.storage_table;
        // make sure each key is present and the value is a non empty string
        if (isStringAndNotEmpty(favoritesTable.catalog) && isStringAndNotEmpty(favoritesTable.schema) && isStringAndNotEmpty(favoritesTable.table)) {
          this.favoritesPath = '/ermrest/catalog/' + favoritesTable.catalog + '/entity/' + favoritesTable.schema + ':' + favoritesTable.table;
        }
      }
    }

    this.kind = jsonTable.kind;

    this.supportHistory = this.kind === 'table';
    if (this.supportHistory && this.annotations.contains(_annotations.HISTORY_CAPTURE)) {
      this.supportHistory = this.annotations.get(_annotations.HISTORY_CAPTURE).content !== false;
    }

    if (this.annotations.contains(_annotations.APP_LINKS)) {
      this._appLinksAnnotation = this.annotations.get(_annotations.APP_LINKS).content;
    }

    this.aggressiveFacetLookup = false;
    if (this.annotations.contains(_annotations.TABLE_CONFIG)) {
      this.aggressiveFacetLookup = this.annotations.get(_annotations.TABLE_CONFIG).content.aggressive_facet_lookup === true;
    }

    this._exportTemplates = {};

    this._display = {};

    this._altForeignKey = undefined;
    this._altSharedKey = undefined;
  }

  /** not implemented (crud stub kept from the legacy api) */
  delete(): void {}

  getDisplay(context: string): TableDisplay {
    // check _display for information about current context
    if (!(context in this._display)) {
      let annotComment = null;
      if (this.annotations.contains(_annotations.DISPLAY)) {
        // comment can be a string or an object
        annotComment = this.annotations.get(_annotations.DISPLAY).get('comment');
        // point to comment since that is what is contextualized in this annotation
        // if it's an object, that means it's contextualized
        if (typeof annotComment === 'object') {
          annotComment = _getAnnotationValueByContext(context, annotComment);
        }
      }

      let comment: string | null | false = this.comment ? (this.comment.unformatted ?? null) : null;
      if (_isValidModelComment(annotComment)) {
        comment = annotComment;
      }

      const displayProps = getHierarchicalDisplayAnnotationValue(this, context, 'comment_display', true);
      let tableCommentDisplayMode = _commentDisplayModes.tooltip,
        columnCommentDisplayMode = _commentDisplayModes.tooltip,
        commentRenderMarkdown;
      if (isObjectAndNotNull(displayProps)) {
        if (_isValidModelCommentDisplay(displayProps.table_comment_display)) {
          tableCommentDisplayMode = displayProps.table_comment_display;
        }

        if (_isValidModelCommentDisplay(displayProps.column_comment_display)) {
          columnCommentDisplayMode = displayProps.column_comment_display;
        }

        if (typeof displayProps.comment_render_markdown === 'boolean') {
          commentRenderMarkdown = displayProps.comment_render_markdown;
        }
      }

      this._display[context] = {
        columnCommentDisplayMode: columnCommentDisplayMode,
        tableCommentDisplayMode: tableCommentDisplayMode,
        comment: processModelComment(comment, commentRenderMarkdown, tableCommentDisplayMode),
        commentRenderMarkdown: commentRenderMarkdown,
      };
    }
    return this._display[context];
  }

  /**
   * The columns that create the shortest key
   */
  get shortestKey(): Column[] {
    if (!this._shortestKey) {
      if (this.keys.length() !== 0) {
        // find the keys with not-null columns
        let keys = this.keys.all().filter(function (key) {
          return key._notNull;
        });

        // return error if there's no not-null key
        if (keys.length === 0) {
          keys = this.keys.all();
        }

        const ridKey = keys.filter(function (key) {
          return key.colset.columns.length === 1 && key.colset.columns[0].name.toUpperCase() === 'RID';
        })[0];

        if (ridKey) {
          this._shortestKey = ridKey.colset.columns;
        } else {
          // pick the first key that is shorter or is all serial/integer.
          this._shortestKey = keys.sort(function (a, b) {
            let compare;

            // choose the shorter
            compare = a.colset.length() - b.colset.length();
            if (compare !== 0) {
              return compare;
            }

            // if key length equal, choose the one that all of its keys are serial or int
            compare = (b.colset.allSerialOrInt ? 1 : 0) - (a.colset.allSerialOrInt ? 1 : 0);
            if (compare !== 0) {
              return compare;
            }

            // the one that has lower column position
            return compareColumnPositions(a.colset._getColumnPositions(), b.colset._getColumnPositions(), true);
          })[0].colset.columns;
        }
      } else {
        this._shortestKey = this.columns.all();
      }
    }
    return this._shortestKey;
  }

  /**
   * The columns that create the shortest key that can be used for display purposes (rowname).
   *
   * sort the not-null keys based on the following and return the first one:
   * 1. not simple fk to somewhere
   * 2. not simple and made of any asset metadata (url, filename, bytecount, md5, sha256)
   * 3. is shorter
   * 4. has more text
   * 5. made of columns defined earlier (column position)
   */
  get displayKey(): Column[] {
    if (this._displayKey === undefined) {
      if (this.keys.length() !== 0) {
        // find the keys with not-null columns
        let keys = this.keys.all().filter(function (key) {
          return key._notNull;
        });

        // NOTE we're doing the same thing for shortestkey,
        //      if we decided to throw an error instead,
        //      we should be consistent
        if (keys.length === 0) {
          keys = this.keys.all();
        }

        this._displayKey = keys.sort(function (keyA, keyB) {
          const keyACol = keyA.colset.columns[0],
            keyBCol = keyB.colset.columns[0];

          // not fk to somewhere
          const isPartOfSimpleFkA = keyA.simple && keyACol.isPartOfSimpleForeignKey;
          const isPartOfSimpleFkB = keyB.simple && keyBCol.isPartOfSimpleForeignKey;
          if (isPartOfSimpleFkA !== isPartOfSimpleFkB) {
            return isPartOfSimpleFkA ? 1 : -1;
          }

          // not simple and made of any asset metadata columns
          // !! is used to turn it into boolean
          const isAssetA = !!(
            keyA.simple &&
            (keyACol.isAssetMd5 || keyACol.isAssetSha256 || keyACol.isAssetURL || keyACol.isAssetFilename || keyACol.isAssetByteCount)
          );
          const isAssetB = !!(
            keyB.simple &&
            (keyBCol.isAssetMd5 || keyBCol.isAssetSha256 || keyBCol.isAssetURL || keyBCol.isAssetFilename || keyBCol.isAssetByteCount)
          );
          if (isAssetA !== isAssetB) {
            return isAssetA ? 1 : -1;
          }

          // shorter
          if (keyA.colset.columns.length !== keyB.colset.columns.length) {
            return keyA.colset.columns.length - keyB.colset.columns.length;
          }

          // has more text
          const aTextCount = keyA.colset.textColumnsCount;
          const bTextCount = keyB.colset.textColumnsCount;
          if (aTextCount !== bTextCount) {
            return bTextCount - aTextCount;
          }

          // the one that has lower column position
          return compareColumnPositions(keyA.colset._getColumnPositions(), keyB.colset._getColumnPositions(), true);
        })[0].colset.columns;
      } else {
        this._displayKey = this.columns.all();
      }
    }
    return this._displayKey;
  }

  /**
   * The columns that create the stable key
   * NOTE doesn't support composite keys for now
   */
  get stableKey(): Column[] {
    if (this._stableKey === undefined) {
      const getStableKey = function (self: Table): Column[] | null {
        // find the table config annot
        if (!self.annotations.contains(_annotations.TABLE_CONFIG)) {
          return null;
        }
        const annot = self.annotations.get(_annotations.TABLE_CONFIG).content;

        // make sure it's defined and is an object
        if (!isObjectAndNotNull(annot)) {
          return null;
        }

        // get it from the stable_key_columns attribute (all the columns must be nullok=false)
        if (Array.isArray(annot.stable_key_columns) && annot.stable_key_columns.length > 0) {
          const keyCols: Column[] = [];

          // make sure all the columns are valid
          const allValid = annot.stable_key_columns.every(function (colName: string) {
            try {
              // all the columns must be valid
              const col = self.columns.get(colName);

              // all the columns must be not-null
              if (col.nullok) {
                return false;
              }
              keyCols.push(col);
              return true;
            } catch {
              return false;
            }
          });

          if (allValid) {
            return keyCols;
          }
        }

        // get it from the stable_key attribute (all the columns must be nullok=false)
        if (Array.isArray(annot.stable_key) && annot.stable_key.length === 2) {
          const obj = self.schema.catalog.constraintByNamePair(annot.stable_key, _constraintTypes.KEY);
          if (obj && obj.object && (obj.object as Key)._notNull) {
            return (obj.object as Key).colset.columns;
          }
        }

        return null;
      };

      let stableKey = getStableKey(this);

      // NOTE we're not supporting composite keys now
      if (!isDefinedAndNotNull(stableKey) || stableKey.length > 1) {
        stableKey = this.shortestKey;
      }

      this._stableKey = stableKey;
    }
    return this._stableKey;
  }

  /**
   * This key will be used for referring to a row of data. Therefore it shouldn't be foreignkey and markdown type.
   * It's the same as displaykey but with extra restrictions. It might return undefined.
   *
   * sort the "well formed" keys that are not simple fk based on the following and return the first one:
   * 2. not simple and made of hash asset metadata (md5, sha256)
   * 3. is shorter
   * 4. has more text
   * 5. made of columns defined earlier (column position)
   *
   * @param context used to figure out if the column has markdown_pattern annoation or not.
   */
  _getRowDisplayKey(context: string): Key | undefined {
    if (!(context in this._rowDisplayKeys)) {
      let displayKey;
      if (this.keys.length() !== 0) {
        const candidateKeys = [];
        for (let i = 0; i < this.keys.length(); i++) {
          const key = this.keys.all()[i];

          // shouldn't select simple keys that their constituent column is part of a simple foreign key.
          const isPartOfSimpleFk = key.simple && key.colset.columns[0].isPartOfSimpleForeignKey;

          // select keys that none of their columns isHTMl and nullok.
          if (!isPartOfSimpleFk && key._isWellFormed(context)) {
            candidateKeys.push(key);
          }
        }

        // sort the keys and pick the first one.
        if (candidateKeys.length !== 0) {
          displayKey = candidateKeys.sort(function (keyA, keyB) {
            // is not simple and made of md5, sha256
            // !! is used to turn it into boolean
            const isAssetA = !!(keyA.simple && (keyA.colset.columns[0].isAssetMd5 || keyA.colset.columns[0].isAssetSha256));
            const isAssetB = !!(keyB.simple && (keyB.colset.columns[0].isAssetMd5 || keyB.colset.columns[0].isAssetSha256));
            if (isAssetA !== isAssetB) {
              return isAssetA ? 1 : -1;
            }

            // shorter
            if (keyA.colset.columns.length !== keyB.colset.columns.length) {
              return keyA.colset.columns.length - keyB.colset.columns.length;
            }

            // has more text
            const aTextCount = keyA.colset.textColumnsCount;
            const bTextCount = keyB.colset.textColumnsCount;
            if (aTextCount !== bTextCount) {
              return bTextCount - aTextCount;
            }

            // the one that has lower column position
            return compareColumnPositions(keyA.colset._getColumnPositions(), keyB.colset._getColumnPositions(), true);
          })[0];
        }
      }
      this._rowDisplayKeys[context] = displayKey; // might be undefined
    }
    return this._rowDisplayKeys[context];
  }

  /**
   * uri to the table in ermrest with entity api
   */
  get uri(): string {
    return this._uri;
  }

  get reference(): Reference {
    if (!this._reference) {
      this._reference = new Reference(parse(this._uri), this.schema.catalog);
    }

    return this._reference;
  }

  /**
   * Returns an object with
   * - fkeys: array of ForeignKeyRef objects
   * - columns: Array of columns
   * - conditions: hash-map of sourcekey to the condition's unprocessed column-directive.
   * - sources: hash-map of name to the SourceObjectWrapper object.
   * - sourceMapping: hashname to all the names
   * - sourceDependencies: for each sourcekey, what are the other sourcekeys that it depends on (includes self as well)
   *                       this has been added because of path prefix where a sourcekey might rely on other sourcekeys
   */
  get sourceDefinitions(): TableSourceDefinitions {
    if (this._sourceDefinitions === undefined) {
      this._populateSourceDefinitions();
    }
    return this._sourceDefinitions!;
  }

  _populateSourceDefinitions(): void {
    const sd = _annotations.SOURCE_DEFINITIONS;
    const hasAnnot = this.annotations.contains(sd);
    const res: {
      columns: Column[];
      fkeys: ForeignKeyRef[];
      sources: Record<string, SourceObjectWrapper>;
      sourceMapping: Record<string, string[]>;
      sourceDependencies: Record<string, string[]>;
      conditions: Record<string, AnnotationContent>;
    } = { columns: [], fkeys: [], sources: {}, sourceMapping: {}, sourceDependencies: {}, conditions: {} };
    const addedCols: Record<number, boolean> = {},
      addedFks: Record<number, boolean> = {},
      processedSources: Record<string, boolean> = {};
    const allColumns = this.columns.all(),
      allForeignKeys = this.foreignKeys.all();

    if (!hasAnnot) {
      res.columns = allColumns;
      res.fkeys = allForeignKeys;
      this._sourceDefinitions = new TableSourceDefinitions(
        this,
        res.columns,
        res.fkeys,
        res.sources,
        res.sourceMapping,
        res.sourceDependencies,
        res.conditions,
      );
      return;
    }

    const annot: AnnotationContent = this.annotations.get(sd).content;

    // TODO this is way too ugly, rewrite this!
    const processSourceDefinitionList = (val: AnnotationContent, isFkey: boolean): (Column | ForeignKeyRef)[] => {
      if (val === true) {
        return isFkey ? allForeignKeys : allColumns;
      }

      const resultList: (Column | ForeignKeyRef)[] = [],
        mapName = function (item: Column | ForeignKeyRef) {
          return item.name;
        };
      const allListNames = isFkey ? allForeignKeys.map(mapName) : allColumns.map(mapName);
      if (Array.isArray(val)) {
        val.forEach((cname: AnnotationContent, index: number) => {
          if (isFkey) {
            if (!Array.isArray(cname) || cname.length !== 2) {
              // TODO log the error
              return;
            }
            const fkObj = CatalogService.getConstraintObject(this.schema.catalog.id, cname[0], cname[1]);
            if (fkObj === null || fkObj.subject !== _constraintTypes.FOREIGN_KEY) {
              return;
            }
            cname = fkObj.object.name;
          }

          const elIndex = allListNames.indexOf(cname);
          if (isFkey) {
            if (addedFks[elIndex]) return;
            addedFks[elIndex] = true;
          } else {
            if (addedCols[elIndex]) return;
            addedCols[elIndex] = true;
          }
          if (elIndex === -1) {
            $log.warn('invalid source definition, ', isFkey ? 'fkeys' : 'columns', ', index=' + index);
            return;
          }
          resultList.push(isFkey ? allForeignKeys[elIndex] : allColumns[elIndex]);
        });
      }
      return resultList;
    };

    const addSourceDef = (key: string, keysThatDependOnThis?: string[]): boolean => {
      const message = 'source definition, table =' + this.name + ', name=' + key;

      // detec circular dependency
      keysThatDependOnThis = Array.isArray(keysThatDependOnThis) ? keysThatDependOnThis : [];
      if (keysThatDependOnThis.indexOf(key) !== -1) {
        $log.info(message + ': ' + ' circular dependency detected.');
        return false;
      }

      // key must be non empty and string
      if (!isStringAndNotEmpty(key)) {
        $log.info(message + ': ' + ' `sourcekey` must be string and non-empty.');
        return false;
      }

      // already processed
      if (key in processedSources) {
        return processedSources[key];
      }

      // key is not in the list of definitions
      if (!(key in annot.sources)) {
        $log.info(message + ': ' + " `sourcekey` didn't exist.");
        return false;
      }

      // if the key is special
      if ((Object.values(_specialSourceDefinitions) as string[]).indexOf(key) !== -1) {
        // removed the message because it was misleading
        // this makes sure special source keys are not used for path prefix
        return false;
      }

      // why? make sure key is not the same as table columns
      if (this.columns.has(key)) {
        $log.info(message + ': `sourcekey` cannot be any of the table column names.');
        return false;
      }

      // why? make sure key doesn't start with $
      if (key.startsWith('$')) {
        $log.info(message + ': `sourcekey` cannot start with $');
        return false;
      }

      const sourceDef = annot.sources[key];
      let pSource, valid;
      try {
        // if it has prefix, we have to make sure the prefix is processed beforehand
        const hasPrefix =
          typeof sourceDef === 'object' && Array.isArray(sourceDef.source) && sourceDef.source.length > 1 && 'sourcekey' in sourceDef.source[0];

        if (hasPrefix) {
          // keep track of dependencies for cycle detection
          keysThatDependOnThis.push(key);

          // make sure we've processed the prefix
          valid = addSourceDef(sourceDef.source[0].sourcekey, keysThatDependOnThis);
          processedSources[key] = valid;
          if (!valid) {
            $log.info(message + ': ' + 'given sourcekey (path prefix) is invalid.');
            return false;
          }
        }
        // NOTE
        // - we're passing the list of processed sources
        //   because some of them might have prefix and need that
        // - skipping processing filters since they might be used in detailed context
        //   and have access to data. so we have to skip now and process later.
        pSource = new SourceObjectWrapper(sourceDef, this, false, res.sources, undefined, true);
      } catch (exp) {
        $log.info(message + ': ' + (exp as Error).message);
        return false;
      }

      // attach to sources
      res.sources[key] = pSource;

      // attach to sourceMapping
      if (!(pSource.name in res.sourceMapping)) {
        res.sourceMapping[pSource.name] = [];
      }
      res.sourceMapping[pSource.name].push(key);

      processedSources[key] = true;
      return true;
    };

    const processSourceDependencies = (key: string): string[] => {
      if (!res.sources[key].hasPrefix) {
        return [key];
      }
      return processSourceDependencies(res.sources[key].sourceObjectNodes[0].pathPrefixSourcekey as string).concat(key);
    };

    // columns
    if (annot.columns) {
      res.columns = processSourceDefinitionList(annot.columns, false) as Column[];
    }

    // fkeys
    if (annot.fkeys) {
      res.fkeys = processSourceDefinitionList(annot.fkeys, true) as ForeignKeyRef[];
    }

    // sources
    if (annot.sources && typeof annot.sources === 'object') {
      let sKey;
      for (sKey in annot.sources) {
        if (!Object.prototype.hasOwnProperty.call(annot.sources, sKey)) continue;

        // process once
        if (sKey in processedSources) continue;

        // ignore special definitions
        if ((Object.values(_specialSourceDefinitions) as string[]).indexOf(sKey) !== -1) continue;

        processedSources[sKey] = addSourceDef(sKey);
      }

      // populate sourceDependencies (might be able to do it with previous one)
      for (sKey in res.sources) {
        if (!Object.prototype.hasOwnProperty.call(res.sources, sKey)) continue;
        res.sourceDependencies[sKey] = processSourceDependencies(sKey);
      }
    }

    // conditions
    if (annot.conditions && typeof annot.conditions === 'object') {
      for (const cKey in annot.conditions) {
        if (!Object.prototype.hasOwnProperty.call(annot.conditions, cKey)) continue;
        const condDef = annot.conditions[cKey];
        if (typeof condDef !== 'object' || condDef === null) {
          $log.info('condition definition, table =' + this.name + ', condition=' + cKey + ': must be an object.');
          continue;
        }
        const hasSource = !!condDef.source || isStringAndNotEmpty(condDef.sourcekey);
        const hasPattern = isStringAndNotEmpty(condDef.condition_pattern);
        // must have source/sourcekey OR a no-source condition_pattern
        if (!hasSource && !hasPattern) {
          $log.info('condition definition, table =' + this.name + ', condition=' + cKey + ': must have `source`/`sourcekey` or `condition_pattern`.');
          continue;
        }
        // wait_for requires source/sourcekey (no-source conditions cannot coordinate secondary fetches)
        if (!hasSource && condDef.wait_for !== undefined) {
          $log.info('condition definition, table =' + this.name + ', condition=' + cKey + ': `wait_for` requires `source` or `sourcekey`.');
          continue;
        }
        // if sourcekey, it must exist in the sources map
        if (isStringAndNotEmpty(condDef.sourcekey) && !(condDef.sourcekey in res.sources)) {
          $log.info(
            'condition definition, table =' + this.name + ', condition=' + cKey + ': sourcekey `' + condDef.sourcekey + '` not found in sources.',
          );
          continue;
        }
        // just capture and don't process
        // we have to reprocess these again anyways because they might rely on tuple.
        res.conditions[cKey] = condDef;
      }
    }

    this._sourceDefinitions = new TableSourceDefinitions(
      this,
      res.columns,
      res.fkeys,
      res.sources,
      res.sourceMapping,
      res.sourceDependencies,
      res.conditions,
    );
  }

  /**
   * Returns an array of SourceObjectWrapper objects.
   * The returned object will have the following properties:
   * - columns: the search columns
   * - allSamePathPrefix: if all using the same path prefix
   */
  get searchSourceDefinition(): false | { columns: SourceObjectWrapper[]; allSamePathPrefix: boolean } {
    if (this._searchSourceDefinition === undefined) {
      /**
       * search-box is either on the first level below the annotation,
       * or parts of sources.
       */
      const _getSearchSourceDefinition = function (self: Table): false | { columns: SourceObjectWrapper[]; allSamePathPrefix: boolean } {
        const sdAnnotName = _annotations.SOURCE_DEFINITIONS,
          sbAnnotProp = _specialSourceDefinitions.SEARCH_BOX,
          orOperator = _FacetsLogicalOperators.OR;
        let sbDef;
        const hasAnnot = self.annotations.contains(sdAnnotName);

        // source-def annotation is missing
        if (!hasAnnot) return false;

        const annot = self.annotations.get(sdAnnotName).content;

        // source-def annotation is defined but doesn't have a valid value
        if (!annot) return false;

        // search-box directly under source-def annot
        if (isObjectAndNotNull(annot[sbAnnotProp])) {
          sbDef = annot[sbAnnotProp];
        }
        // backwards compatiblaity (search-box defined as part of sources)
        else if (isObjectAndNotNull(annot.sources) && isObjectAndNotNull(annot.sources[sbAnnotProp])) {
          $log.warn('usage of `search-box` in `sources` has been deprecated and eventually will be removed.');
          sbDef = annot.sources[sbAnnotProp];
        }
        // invalid format
        else {
          return false;
        }

        const message = 'search column definition, table=' + self.name;

        /*
         * accepted format:
         * "or": [
         *    // source def
         * ]
         */
        // make sure it's properly defined as `or` of sources
        if (!Object.prototype.hasOwnProperty.call(sbDef, orOperator) || !Array.isArray(sbDef[orOperator])) {
          $log.info(message + ': search-box must be defined as `or` of sources.');
          return false;
        }

        let res: SourceObjectWrapper[] = [];
        const indices: number[] = [],
          processedCols: Record<string, boolean> = {};
        let allSamePrefix = true,
          sharedPrefix = '';
        for (let index = 0; index < sbDef[orOperator].length; index++) {
          const src = sbDef[orOperator][index];
          let pSource, sd;

          // sourcekey has priority over source. if both used, ignore source and only honor source.
          if (src.sourcekey) {
            sd = self.sourceDefinitions.getSource(src.sourcekey);
            if (!sd) {
              $log.info(message + ', index=' + index + ': given sourcekey `' + src.sourcekey + '` is not valid.');
              continue; // ignore the faulty ones
            }

            pSource = sd.clone(src, self);
          } else {
            try {
              pSource = new SourceObjectWrapper(src, self);
            } catch (exp) {
              $log.info(message + ', index=' + index + ':' + (exp as Error).message);
              continue; // ignore the faulty ones
            }
          }

          if (pSource.name in processedCols) {
            continue; // duplicate
          }
          processedCols[pSource.name] = true;

          // check if all the sources are using the same prefix or not
          if (pSource.hasPath) {
            // check for the same prefix
            if (allSamePrefix) {
              // get the prefix of the current column directive
              let currPrefix: AnnotationContent = null;
              if (pSource.sourceObject && isStringAndNotEmpty(pSource.sourceObject.sourcekey)) {
                currPrefix = pSource.sourceObject.sourcekey;
              } else {
                const firstNode = pSource.sourceObjectNodes[0];
                if (firstNode.isPathPrefix && pSource.foreignKeyPathLength === firstNode.nodeObject.foreignKeyPathLength) {
                  currPrefix = firstNode.pathPrefixSourcekey;
                }
              }

              // if it wasn't using prefix, then set it to false
              if (!currPrefix) {
                allSamePrefix = false;
              }
              // make sure this prefix is the same as the other ones.
              else {
                if (index === 0) {
                  sharedPrefix = currPrefix;
                } else {
                  allSamePrefix = sharedPrefix === currPrefix;
                }
              }
            }
          } else {
            allSamePrefix = false;
          }

          res.push(pSource);
          indices.push(index);
        }

        // if there are multiple and they are not using the same prefix,
        // then only allow the inner join safe ones.
        if (res.length > 1 && !allSamePrefix) {
          // ignore the ones that are not inner join safe
          res = res.filter(function (ps, i) {
            const innerSafe = !ps.hasPath || ps.isAllOutboundNotNull;
            if (!innerSafe) {
              $log.info(message + ', index=' + indices[i] + ': column directive is not inner join safe and will be ignored.');
            }
            return innerSafe;
          });
        }

        if (res.length === 0) {
          $log.info(message + ': none of the defined column directives can be supported, using search(*).');
          return false;
        }

        return {
          columns: res,
          allSamePathPrefix: allSamePrefix,
        };
      };

      this._searchSourceDefinition = _getSearchSourceDefinition(this);
    }
    return this._searchSourceDefinition;
  }

  // build foreignKeys of this table and referredBy of corresponding tables.
  _buildForeignKeys(): void {
    // this should be built on the second pass after introspection
    // so we already have all the keys and columns for all tables
    this.foreignKeys = new ForeignKeys(this);
    for (let i = 0; i < this._jsonTable.foreign_keys.length; i++) {
      const jsonFKs = this._jsonTable.foreign_keys[i];
      const foreignKeyRef = new ForeignKeyRef(this, jsonFKs);
      // build foreignKeys of current table
      this.foreignKeys._push(foreignKeyRef);
      // add to referredBy of the key table
      foreignKeyRef.key.table.referredBy._push(foreignKeyRef);
    }
  }

  /**
   * Find alternative tables for each table. This should only be called during the 3rd pass of introspection,
   * after foreign keys have been built
   *
   * Constraints:
   *
   * 1. There is no in-bound foreign keys to the alternative tables.
   * 2. a base table cannot be an alternative table for other base tables (i.e. flat 2-level forest)
   * 3. alternative table has exactly one base-table.
   * 4. alternative table must have exactly one not-null unique key that is a foreign key to the base table.
   * 5. All alternative tables associated with the base table have not-null unique keys that are foreign keys to the SAME primary keys of the base table.
   */
  _findAlternatives(): void {
    this._alternatives = {}; // in the form {context: table, ...}
    this._altSharedKey = null; // base table's shared key with its alternative tables
    if (this.annotations.contains(_annotations.TABLE_ALTERNATIVES)) {
      const alternatives = this.annotations.get(_annotations.TABLE_ALTERNATIVES).content;
      for (const context in alternatives) {
        const schema = alternatives[context][0];
        const table = alternatives[context][1];
        let altTable;

        try {
          altTable = this.schema.catalog.schemas.get(schema).tables.get(table);
        } catch (error) {
          // schema or table not found
          $log.info((error as Error).message);
          continue;
        }

        if (altTable === this) {
          // alternative table points to itself, this is a base table
          // this is the case for 'update' context
          this._alternatives[context] = altTable;
          continue;
        }

        // if altTable already has been processed (with a different context)
        // no need to check constraints
        if (altTable._baseTable === this) {
          this._alternatives[context] = altTable;
          continue;
        }

        // check constraints

        // 1. alt should have no incoming foreign keys
        if (altTable.referredBy.length() > 0) {
          $log.info('Invalid schema: ' + altTable.name + ' is an alternative table with incoming reference');
          $log.info('Ignoring ' + altTable.name);
          continue;
        }

        // 2. two level only
        if (altTable.annotations.contains(_annotations.TABLE_ALTERNATIVES)) {
          $log.info('Invalid schema: ' + altTable.name + ' is an alternative table and a base table');
          $log.info('Ignoring ' + altTable.name);
          continue;
        }

        // 3. alt table has exactly one base table
        if (altTable._baseTable !== altTable) {
          // base table has previously been set
          // more than one base table
          $log.info('Invalid schema: ' + altTable.name + ' has more than one base table');
          continue;
        }

        // 4.1 must have a (1) not-null (2) key which is a (3) foreign key to the base table.
        let fkeys, j, fkey;
        if (!this._altSharedKey) {
          // _altSharedKey is the Key used by all its alternative tables
          const bkeys = this.keys.all();
          for (let i = 0; i < bkeys.length; i++) {
            const key = bkeys[i];
            try {
              // (1) check columns are not null
              const columns = key.colset.columns;
              const nullok = columns
                .map(function (column) {
                  return column.nullok;
                })
                .includes(true);
              if (nullok) {
                // key allows null, go to next key
                continue;
              }

              // (3) is a foreign key to the base table
              fkeys = altTable.foreignKeys.all();
              for (j = 0; j < fkeys.length; j++) {
                fkey = fkeys[j];
                if (fkey.key === key) {
                  // found a foreign key matching the base table key
                  // (2) check it is also alternative table's key
                  altTable.keys.get(fkey.colset); // throws exception if not found
                  this._altSharedKey = key;
                  altTable._altForeignKey = fkey; // _altForeignKey is the FK and key in alt table and key of the _altSharedKey base table
                  break;
                }
              }

              if (this._altSharedKey) break;
            } catch {
              // key not found in alt table, go to next key
            }
          }

          if (!this._altSharedKey) {
            $log.info('Invalid schema: alternative table ' + altTable.name + ' should have a key that is a foreign key to the base table');
            $log.info(altTable.name + ' ignored');
            continue;
          }
        } else {
          // 4.2 key must be the shared key among all alternative tables
          try {
            // (1) find base table shared key in alternative's foreign keys
            fkeys = altTable.foreignKeys.all();
            for (j = 0; j < fkeys.length; j++) {
              fkey = fkeys[j];
              if (fkey.key === this._altSharedKey) {
                // found a foreign key matching the base table key
                // (2) check it is also alternative table's key
                altTable.keys.get(fkey.colset); // throws exception if not found
                altTable._altForeignKey = fkey;
                break;
              }
            }
          } catch {
            $log.error('Invalid schema: base table ' + this.name);
            $log.error(
              'alternative tables should have a key that is a foreign key to the base table, and it shoud be shared among all alternative tables',
            );
            $log.error('All alternative tables of base table ' + this.name + ' are ignored');

            // since alt tables don't share the same key, ignore all the alt tables
            this._alternatives = {};
            return;
          }
        }

        // passed all contraints
        altTable._baseTable = this;
        this._alternatives[context] = altTable;
      }
    }
  }

  /**
   * get the table's alternative table of a given context
   * If no alternative table found, return itself
   */
  _getAlternativeTable(context: string): Table {
    const altTable = _getRecursiveAnnotationValue(context, this._alternatives);
    return altTable !== -1 ? altTable : this;
  }

  /**
   * Whether this table is an alternative table
   */
  _isAlternativeTable(): boolean {
    return this._baseTable !== this;
  }

  /**
   * app tag of this table (or its base table if this is an alternative table)
   * @param context optional
   */
  _getAppLink(context?: string): string | null {
    // alternative tables should use base's table's app links
    if (this._isAlternativeTable()) return this._baseTable._getAppLink(context);

    // use table level
    let app: AnnotationContent = -1;
    if (this._appLinksAnnotation) {
      if (!context) app = _getRecursiveAnnotationValue(_contexts.DEFAULT, this._appLinksAnnotation);
      else app = _getRecursiveAnnotationValue(context, this._appLinksAnnotation);
    }

    // use schema level
    if (app === -1) return this.schema._getAppLink(context);
    else return app;
  }

  /**
   * figure out if Table is pure and binary association table.
   * binary: Has 2 outbound foreign keys. there is only a composite key constraint. This key includes all the columns from both foreign keys.
   * pure: There is no extra column that is not part of any keys.
   * Execptions
   *  - the table can have an extra key that is made of one serial type column.
   *  - system columns are ignored completely (even if they are part of a simple fk)
   */
  get isPureBinaryAssociation(): boolean {
    if (this._isPureBinaryAssociation === undefined) {
      this._isPureBinaryAssociation = this._computePureBinaryAssociation();
    }
    return this._isPureBinaryAssociation;
  }

  /**
   * if the table is pure and binary, will return the two foreignkeys that create it
   */
  get pureBinaryForeignKeys(): ForeignKeyRef[] | null {
    if (this._pureBinaryForeignKeys_cached === undefined) {
      // will attach the value of _pureBinaryForeignKeys_cached
      this._computePureBinaryAssociation();
    }
    return this._pureBinaryForeignKeys_cached!;
  }

  _computePureBinaryAssociation(): boolean {
    const isSystemCol = function (col: Column) {
      return _systemColumns.indexOf(col.name) !== -1;
    };

    if (this.referredBy.length() > 0) {
      return false; // not binary
    }

    // ignore the fks that are simple and their constituent column is system col
    const nonSystemColumnFks = this.foreignKeys.all().filter(function (fk) {
      return !(fk.simple && isSystemCol(fk.colset.columns[0]));
    });

    if (nonSystemColumnFks.length !== 2) {
      return false; //not binary
    }

    // set of foreignkey columns, keyed by Column.toString() (they might be overlapping so we're not using array)
    const fkCols: Record<string, boolean> = {};
    nonSystemColumnFks.forEach(function (fk) {
      fk.colset.columns.forEach(function (col) {
        fkCols[col.toString()] = true;
      });
    });

    // the key that should contain foreign key columns
    const tempKeys = this.keys.all().filter(function (key) {
      const keyCols = key.colset.columns;
      return !(
        keyCols.length === 1 &&
        (_serialTypes.indexOf(keyCols[0].type.name) !== -1 || _systemColumns.indexOf(keyCols[0].name) !== -1) &&
        !(keyCols[0].toString() in fkCols)
      );
    });

    if (tempKeys.length !== 1) {
      return false; // not binary
    }

    //make sure the key has all the foreign key columns
    const keyHasAllCols = tempKeys[0].colset.columns.every(function (col) {
      return col.toString() in fkCols;
    });
    if (!keyHasAllCols) {
      return false; // not pure
    }

    // columns that are not part of any keys (excluding system columns).
    const nonKeyCols = this.columns.all().filter(function (col) {
      return col.memberOfKeys.length === 0 && !isSystemCol(col);
    });

    // check for purity
    if (nonKeyCols.length === 0) {
      // attach the value of _pureBinaryForeignKeys
      this._pureBinaryForeignKeys_cached = nonSystemColumnFks;

      return true;
    }

    this._pureBinaryForeignKeys_cached = null;
    return false;
  }

  /**
   * return the null value that should be shown for the columns under
   * this table for the given context.
   */
  _getNullValue(context: string): string | null {
    return _getNullValue(this, context, true);
  }

  /**
   * return the fk that is based on the given column names (it could be inbound or outbound)
   */
  _findForeignKeyByLocalColumns(localColumnNames: string[]): FindForeignKeyResult {
    if (!Array.isArray(localColumnNames) || localColumnNames.length === 0) {
      return { successful: false, message: 'local_columns must be a non-empty array.' };
    }
    const matchFk = function (isInbound: boolean) {
      return function (fk: ForeignKeyRef) {
        // same length
        if (fk.colset.length() !== localColumnNames.length) return false;

        /**
         * find the fks with the given local columns
         *
         * inbound: local=to, remote=from
         * outbound: local=from, remote=to
         */
        const fkCols = isInbound ? fk.key.colset.columns : fk.colset.columns;
        return fkCols.every(function (col) {
          return localColumnNames.indexOf(col.name) !== -1;
        });
      };
    };

    const fks = this.foreignKeys.all().filter(matchFk(false));
    if (fks.length > 1) {
      return { successful: false, message: 'more than one foreign key matches.' };
    }
    const ifks = this.referredBy.all().filter(matchFk(true));
    if (ifks.length > 1 || (fks.length > 0 && ifks.length > 0)) {
      return { successful: false, message: 'more than one foreign key matches.' };
    }
    if (fks.length === 0 && ifks.length === 0) {
      return { successful: false, message: "couldn't find any matching foreign key." };
    }
    return {
      successful: true,
      foreignKey: fks.length > 0 ? fks[0] : ifks[0],
      isInbound: ifks.length > 0,
    };
  }

  /**
   * return the fk that is related to the remote table and column names (it could be inbound or outbound)
   */
  _findForeignKeyByRemoteColumns(remoteTable: Table, remoteColumnNames: string[], nameMapping?: Record<string, string>): FindForeignKeyResult {
    if (!Array.isArray(remoteColumnNames) || remoteColumnNames.length === 0) {
      return { successful: false, message: 'remote_columns or local_to_remote_columns must be defined properly.' };
    }

    /**
     * inbound: from = remote, to = local
     * outbound: from = local, to = remote
     */
    const matchFk = function (isInbound: boolean) {
      return function (fk: ForeignKeyRef) {
        // same length
        if (fk.colset.length() !== remoteColumnNames.length) return false;

        // end up in the same table
        if ((!isInbound && fk.key.table !== remoteTable) || (isInbound && fk.table !== remoteTable)) {
          return false;
        }

        let fkCols;
        if (isObjectAndNotNull(nameMapping)) {
          // making sure the column mapping is correct
          // we want the loop to always be based on "local". so in inbound, we get the "to" and in outbound "from".
          fkCols = isInbound ? fk.key.colset.columns : fk.colset.columns;
          return fkCols.every(function (localCol) {
            if (!(localCol.name in nameMapping!)) return false;

            const remoteCol = isInbound ? fk.mapping.getFromColumn(localCol) : fk.mapping.get(localCol);
            return nameMapping![localCol.name] === remoteCol.name;
          });
        } else {
          // making sure remote column names are valid
          fkCols = isInbound ? fk.colset.columns : fk.key.colset.columns;
          return fkCols.every(function (col) {
            return remoteColumnNames.indexOf(col.name) !== -1;
          });
        }
      };
    };

    const fks = this.foreignKeys.all().filter(matchFk(false));
    if (fks.length > 1) {
      return { successful: false, message: 'more than one foreign key matches.' };
    }
    const ifks = this.referredBy.all().filter(matchFk(true));
    if (ifks.length > 1 || (fks.length > 0 && ifks.length > 0)) {
      return { successful: false, message: 'more than one foreign key matches.' };
    }
    if (fks.length === 0 && ifks.length === 0) {
      return { successful: false, message: "couldn't find any matching foreign key." };
    }
    return {
      successful: true,
      foreignKey: fks.length > 0 ? fks[0] : ifks[0],
      isInbound: ifks.length > 0,
    };
  }

  /**
   * find the foreignkey that is part of this table, or has a path to it.
   *
   * { "remote_schema": "s2", "remote_table": "t2", "local_to_remote_columns": { "x": "a", "y": "b", ... }
   * { "remote_schema": "s2", "remote_table": "t2", "remote_columns": [ "a", "b" ]}
   *
   * {"local_columns": ["x", "y", ...]}
   */
  findForeignKey(obj: AnnotationContent): FindForeignKeyResult {
    if (!isObjectAndNotNull(obj)) {
      return { successful: false, message: 'invalid object.' };
    }

    if (this.foreignKeys.length() === 0 && this.referredBy.length() === 0) {
      return { successful: false, message: "the local table doesn't have any inbound or outbound fks." };
    }

    if (isStringAndNotEmpty(obj.remote_schema) && isStringAndNotEmpty(obj.remote_table)) {
      let remoteTable;
      try {
        remoteTable = this.schema.catalog.schemas.findTable(obj.remote_table, obj.remote_schema);
      } catch {
        return { successful: false, message: 'remote table not found.' };
      }

      if (Array.isArray(obj.remote_columns)) {
        return this._findForeignKeyByRemoteColumns(remoteTable, obj.remote_columns);
      } else if (isObjectAndNotNull(obj.local_to_remote_columns)) {
        return this._findForeignKeyByRemoteColumns(remoteTable, Object.values(obj.local_to_remote_columns), obj.local_to_remote_columns);
      } else {
        return { successful: false, message: 'remote_columns or local_to_remote_columns must be defined properly.' };
      }
    } else if (Array.isArray(obj.local_columns)) {
      return this._findForeignKeyByLocalColumns(obj.local_columns);
    }

    return { successful: false, message: 'none of the acceptable combination was used.' };
  }

  /**
   * returns an object that captures the asset category of columns.
   * - the key of the returned object is the column name and value and the value is an object. The object has the following:
   *  - category: the assigned category name
   *  - URLColumnName: the url column.
   * - if a column is used in multiple asset annotations, only the first usage is used and other asset annotations
   *   are discarded.
   */
  _assignAssetCategories(): Record<string, AssetCategoryInfo> {
    const mapAssetAnnotPropToCategory: Record<string, string> = {
      filename_column: 'filename',
      byte_count_column: 'byte_count',
      md5: 'md5',
      sha256: 'sha256',
    };

    const jsonTable = this._jsonTable;
    const assignedColumns: Record<string, AssetCategoryInfo> = {};
    for (let i = 0; i < jsonTable.column_definitions.length; i++) {
      const col = jsonTable.column_definitions[i];
      const message = 'asset annotation on column ' + col.name + ' will be ignored. reason: ';

      // column must be text type and have asset annotation to be treated as asset.
      if (col.type.typename === 'text' && _annotations.ASSET in col.annotations) {
        // if the column already used, discard the asset annot
        if (col.name in assignedColumns) {
          $log.warn(message + "it's already used in an asset column mapping.");
        } else {
          // go over the props and see if they are already mapped or not
          const annot = col.annotations[_annotations.ASSET],
            temp: Record<string, AssetCategoryInfo> = {};
          let valid = true;
          const keys = Object.keys(mapAssetAnnotPropToCategory);
          for (let j = 0; valid && j < keys.length; j++) {
            const prop = keys[j];
            if (isObjectAndNotNull(annot) && isStringAndNotEmpty(annot[prop])) {
              if (annot[prop] in assignedColumns) {
                valid = false;
                $log.warn(message + '`' + annot[prop] + '` already used in another asset column mapping.');
              } else {
                temp[annot[prop]] = { category: mapAssetAnnotPropToCategory[prop], URLColumnName: col.name };
              }
            }
          }

          if (valid) {
            assignedColumns[col.name] = { category: 'url' };
            Object.assign(assignedColumns, temp);
          }
        }
      }
    }
    return assignedColumns;
  }
}
