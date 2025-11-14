import moment from 'moment-timezone';

// models
import {
  BatchDeleteResponse,
  ForbiddenError,
  InvalidInputError,
  InvalidServerResponse,
  NoDataChangedError,
  NotFoundError,
  UnsupportedFilters,
} from '@isrd-isi-edu/ermrestjs/src/models/errors';
import {
  ReferenceColumn,
  FacetColumn,
  VirtualColumn,
  ForeignKeyPseudoColumn,
  KeyPseudoColumn,
  AssetPseudoColumn,
  InboundForeignKeyPseudoColumn,
  type PseudoColumn,
  type ColumnAggregateFn,
} from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import {
  Citation,
  Page,
  Tuple,
  Contextualize,
  ReferenceAggregateFn,
  GoogleDatasetMetadata,
  generateRelatedReference,
  RelatedReference,
  BulkCreateForeignKeyObject,
} from '@isrd-isi-edu/ermrestjs/src/models/reference';

// services
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';
import HTTPService from '@isrd-isi-edu/ermrestjs/src/services/http';
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { createPseudoColumn, isAllOutboundColumn, isRelatedColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';
import {
  computeReadPath,
  generateFacetColumns,
  computeReferenceDisplay,
  type ReferenceDisplay,
  generateColumnsList,
} from '@isrd-isi-edu/ermrestjs/src/utils/reference-utils';
import { isObject, isObjectAndNotNull, isStringAndNotEmpty, verify } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent, simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import {
  _annotations,
  _contexts,
  _ERMrestACLs,
  _ERMrestFeatures,
  _operationsFlag,
  _permissionMessages,
  _systemColumns,
  _tableKinds,
  contextHeaderName,
  URL_PATH_LENGTH_LIMIT,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy imports (these will need to be properly typed later)
import { parse, Location } from '@isrd-isi-edu/ermrestjs/js/parser';
import { type Server, ermrestFactory, type Catalog, type Table, type Column, type ForeignKeyRef, Type } from '@isrd-isi-edu/ermrestjs/js/core';
import { onload } from '@isrd-isi-edu/ermrestjs/js/setup/node';
import {
  _getPagingValues,
  _getRecursiveAnnotationValue,
  _isEntryContext,
  _isValidForeignKeyName,
  _isValidSortElement,
  compareColumnPositions,
  generateKeyValueFilters,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _compressFacetObject, _sourceColumnHelpers } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import { _exportHelpers, _getDefaultExportTemplate, _referenceExportOutput, validateExportTemplate } from '@isrd-isi-edu/ermrestjs/js/export';

/**
 * This function resolves a URI reference to a {@link Reference}
 * object. It validates the syntax of the URI and validates that the
 * references to model elements in it are correct. This function makes a
 * call to the ERMrest server in order to get the `schema` which it uses to
 * validate the URI path.
 *
 * For a consistent behavior, always contextualize the resolved `Reference` object.
 * See {@link Reference#contextualize} for more information.
 *
 * Usage:
 * ```
 * // This example assumes that the client has access to the module
 * resolve('https://example.org/catalog/42/entity/s:t/k=123').then(
 *   function(reference) {
 *     // the uri was successfully resolved to a `Reference` object
 *     console.log("The reference has URI", reference.uri);
 *     console.log("It has", reference.columns.length, "columns");
 *     console.log("Is it unique?", (reference.isUnique ? 'yes' : 'no'));
 *     ...
 *   },
 *   function(error) {
 *     // there was an error returned here
 *     ...
 *   });
 * ```
 * @param uri -  An ERMrest resource URI, such as
 * `https://example.org/ermrest/catalog/1/entity/s:t/k=123`.
 * @param contextHeaderParams - An optional context header parameters object. The (key, value)
 * pairs from the object are converted to URL `key=value` query parameters
 * and appended to every request to the ERMrest service.
 * @return Promise when resolved passes the
 * {@link Reference} object. If rejected, passes one of the ermrest errors
 */
export const resolve = async (uri: string, contextHeaderParams?: any): Promise<Reference> => {
  verify(uri, "'uri' must be specified");
  // make sure all the dependencies are loaded
  await onload();
  //added try block to make sure it rejects all parse() related error
  // It should have been taken care by outer try but did not work
  const loc = parse(uri);

  console.log(loc.catalog);

  const server = ermrestFactory.getServer(loc.service, contextHeaderParams);

  const catalog = await server.catalogs.get(loc.catalog);

  return new Reference(loc, catalog);
};

/**
 * @param location - The location object generated from parsing the URI
 * @param catalog - The catalog object. Since location.catalog is just an id, we need the actual catalog object too.
 * @desc
 * Creates a new Reference based on the given parameters. Other parts of API can access this function and it should only be used internally.
 * @private
 */
export const _createReference = (location: Location, catalog: Catalog): Reference => {
  return new Reference(location, catalog);
};

// NOTE: This function is only being used in unit tests.
export const _createPage = (reference: Reference, etag: string, data: any, hasPrevious: boolean, hasNext: boolean): Page => {
  return new Page(reference, etag, data, hasPrevious, hasNext);
};

type ActiveList = {
  // TODO
  // requests: {
  //   column: ReferenceColumn;
  //   objects: Array<{ index: number; column?: boolean; related?: boolean; inline?: boolean; citation?: boolean }>;
  //   type: 'column' | 'related' | 'inline' | 'citation';
  //   // TODO backwards compatibility:
  //   inline?: boolean;
  //   related?: boolean;
  //   citation?: boolean;
  // };
  requests: any[];
  allOutBounds: Array<ForeignKeyPseudoColumn | PseudoColumn>;
  selfLinks: Array<KeyPseudoColumn>;
};

export type VisibleColumn =
  | ReferenceColumn
  | PseudoColumn
  | VirtualColumn
  | ForeignKeyPseudoColumn
  | InboundForeignKeyPseudoColumn
  | ForeignKeyPseudoColumn
  | AssetPseudoColumn;

/**
 * Constructs a Reference object.
 *
 * For most uses, maybe all, of the library, the Reference
 * will be the main object that the client will interact with. References
 * are immutable objects and therefore can be safely passed around and
 * used between multiple client components without risk that the underlying
 * reference to server-side resources could change.
 *
 * Usage:
 *  Clients _do not_ directly access this constructor.
 *  See {@link resolve}.
 * @param location - The location object generated from parsing the URI
 * @param catalog - The catalog object. Since location.catalog is just an id, we need the actual catalog object too.
 */
export class Reference {
  /**
   * The members of this object are _contextualized references_.
   *
   * These references will behave and reflect state according to the mode.
   * For instance, in a `record` mode on a table some columns may be
   * hidden.
   *
   * Usage:
   * ```
   * // assumes we have an uncontextualized `Reference` object
   * var recordref = reference.contextualize.detailed;
   * ```
   * The `reference` is unchanged, while `recordref` now represents a
   * reconfigured reference. For instance, `recordref.columns` may be
   * different compared to `reference.columns`.
   */
  public contextualize: Contextualize;

  /**
   * The function that can be used to perform aggregation operations on columns in this reference.
   */
  public aggregate: ReferenceAggregateFn;

  // private members that the public API can access through getters/setters
  private _context: string;
  private _location: Location;
  private _server: Server;
  private _table: Table;
  private _facetBaseTable: Table;
  private _shortestKey: Column[];
  private _bulkCreateForeignKeyObject?: BulkCreateForeignKeyObject | null;
  private _canCreate?: boolean;
  private _canCreateReason?: string;
  private _canRead?: boolean;
  private _canUpdate?: boolean;
  private _canUpdateReason?: string;
  private _canDelete?: boolean;
  private _canUseTRS?: boolean;
  private _canUseTCRS?: boolean;
  private _readPath?: string;
  private _readAttributeGroupPathProps_cached?: any;
  private _display?: ReferenceDisplay;
  private _defaultExportTemplate?: any;
  private _csvDownloadLink?: string | null;
  private _searchColumns?: Array<VisibleColumn> | false;
  private _cascadingDeletedItems?: Array<Table | RelatedReference | Reference>;
  private _referenceColumns?: Array<VisibleColumn>;
  private _related?: Array<RelatedReference>;
  private _facetColumns?: Array<FacetColumn>;
  private _activeList?: any;
  private _citation?: Citation | null;
  private _googleDatasetMetadata?: GoogleDatasetMetadata | null;

  // props that the children can access
  protected _displayname?: DisplayName;
  protected _comment?: CommentType | null;
  protected _pseudoColumn?: VisibleColumn;

  constructor(location: Location, catalog: Catalog, displayname?: DisplayName, comment?: CommentType, pseudoColumn?: VisibleColumn) {
    /**
     * The members of this object are _contextualized references_.
     *
     * These references will behave and reflect state according to the mode.
     * For instance, in a `record` mode on a table some columns may be
     * hidden.
     *
     * Usage:
     * ```
     * // assumes we have an uncontextualized `Reference` object
     * var recordref = reference.contextualize.detailed;
     * ```
     * The `reference` is unchanged, while `recordref` now represents a
     * reconfigured reference. For instance, `recordref.columns` may be
     * different compared to `reference.columns`.
     */
    this.contextualize = new Contextualize(this);

    // make sure context is string to avoid breaking some code paths
    this._context = '';

    // make sure location object has the catalog
    // TODO could be improved
    location.catalogObject = catalog;

    // make sure location object has the current reference
    location.referenceObject = this;

    this._location = location;

    this._server = catalog.server;

    // if schema was not provided in the URI, find the schema
    this._table = catalog.schemas.findTable(location.tableName, location.schemaName);

    this._facetBaseTable = catalog.schemas.findTable(location.facetBaseTableName, location.facetBaseSchemaName);

    this._shortestKey = this._table.shortestKey;

    this.aggregate = new ReferenceAggregateFn(this);

    this._pseudoColumn = pseudoColumn;

    this._displayname = displayname;

    this._comment = comment;
  }

  get server() {
    return this._server;
  }

  /**
   * The table object for this reference
   */
  get table(): Table {
    return this._table;
  }

  /**
   * The base table object that is used for faceting,
   * if there's a join in path, this will return a different object from .table
   */
  get facetBaseTable(): Table {
    return this._facetBaseTable;
  }

  get shortestKey(): Column[] {
    return this._shortestKey;
  }

  /**
   * the pseudo column that this reference is based on
   *
   */
  get pseudoColumn(): VisibleColumn | undefined {
    return this._pseudoColumn;
  }

  setPseudoColumn(value: VisibleColumn) {
    this._pseudoColumn = value;
  }

  /**
   * the reference's context
   */
  get context(): string {
    return this._context;
  }

  /**
   * used by Contextualize to set the context of the reference
   */
  setContext(value: string) {
    this._context = value;
  }

  /**
   * The display name for this reference.
   * displayname.isHTML will return true/false
   * displayname.value has the value
   */
  get displayname(): DisplayName {
    /* Note that displayname is context dependent. For instance,
     * a reference to an entity set will use the table displayname
     * as the reference displayname. However, a 'related' reference
     * will use the FKR's displayname (actually its "to name" or
     * "from name"). Like a Person table might have a FKR to its parent.
     * In one direction, the FKR is named "parent" in the other
     * direction it is named "child".
     */
    if (this._displayname === undefined) {
      this._displayname = this._table.displayname;
    }
    return this._displayname;
  }

  /**
   * The comment for this reference.
   */
  get comment(): CommentType | null {
    /* Note that comment is context dependent. For instance,
     * a reference to an entity set will use the table comment
     * as the reference comment. However, a 'related' reference
     * will use the FKR's comment (actually its "to comment" or
     * "from comment"). Like a Person table might have a FKR to its parent.
     * In one direction, the FKR is named "parent" in the other
     * direction it is named "child".
     */
    if (this._comment === undefined) {
      this._comment = this._table.getDisplay(this._context).comment as CommentType | null;
    }
    return this._comment;
  }

  /**
   * The display mode configuration for this reference.
   * This returns an object with properties for configuring how the reference should be displayed:
   *
   * - `type`: The display type ('table', 'markdown', or 'module')
   * - `hideRowCount`: Whether to hide the row count
   * - `showFaceting`: Whether faceting is enabled
   * - `maxFacetDepth`: Maximum facet depth allowed
   * - `facetPanelOpen`: Whether the facet panel should be open by default
   * - `showSavedQuery`: Whether saved query UI should be shown
   *
   * For markdown type displays, it also includes:
   * - `_rowMarkdownPattern`: The markdown pattern for rows
   * - `_pageMarkdownPattern`: The markdown pattern for pages
   * - `_separator`, `_prefix`, `_suffix`: Markdown formatting options
   *
   * @returns The display configuration object
   */
  get display(): ReferenceDisplay {
    if (this._display === undefined) {
      this._display = computeReferenceDisplay(this);
    }
    return this._display;
  }

  /**
   * The string form of the `URI` for this reference.
   * NOTE: It is not understandable by ermrest, and it also doesn't have the modifiers (sort, page).
   * Should not be used for sending requests to ermrest, use this.location.ermrestCompactUri instead.
   */
  get uri(): string {
    return this._location.compactUri;
  }

  /**
   * Location object that has uri of current reference
   */
  get location(): Location {
    return this._location;
  }

  /**
   * this is used when we want to change the location of a reference without creating a new one.
   * it will also attach the current reference to the location object.
   */
  setLocation(loc: Location) {
    this._location = loc;
    this._location.referenceObject = this;
  }

  get readPath(): string {
    if (this._readPath === undefined) {
      this._readPath = computeReadPath(this, false).value;
    }
    return this._readPath;
  }

  /**
   * This will generate a new unfiltered reference each time.
   * Returns a reference that points to all entities of current table
   *
   * NOTE: This will not have any context, and always returns a Reference object (not RelatedReference or other special reference types).
   */
  get unfilteredReference(): Reference {
    const table = this.table;
    const cat = table.schema.catalog;
    const uri = `${cat.server.uri}/catalog/${cat.id}/${this.location.api}/${fixedEncodeURIComponent(table.schema.name)}:${fixedEncodeURIComponent(table.name)}`;
    return new Reference(parse(uri), table.schema.catalog);
  }

  /**
   * App-specific URL
   *
   * @throws {Error} if `_appLinkFn` is not defined.
   */
  get appLink() {
    if (typeof ConfigService.appLinkFn !== 'function') {
      throw new Error('`appLinkFn` function is not defined.');
    }
    const tag = this._context ? this._table._getAppLink(this._context) : this.table._getAppLink();
    return ConfigService.appLinkFn(tag, this._location, this._context);
  }

  /**
   * Returns a uri that will properly generate the download link for a csv document
   * NOTE It will honor the visible columns in `export` context
   *
   **/
  get csvDownloadLink(): string | null {
    if (this._csvDownloadLink === undefined) {
      const cid = this.table.schema.catalog.server.cid;
      let qParam = '?limit=none&accept=csv&uinit=1';
      qParam += cid ? '&cid=' + cid : '';
      if (this.displayname && this.displayname.unformatted) {
        qParam += '&download=' + fixedEncodeURIComponent(this.displayname.unformatted);
      }

      const isCompact = this._context === _contexts.COMPACT;
      const defaultExportOutput = _referenceExportOutput(this, this.location.mainTableAlias, undefined, false, null, isCompact);

      if (defaultExportOutput === null || defaultExportOutput === undefined) {
        this._csvDownloadLink = null;
      } else {
        let uri;
        if (['attributegroup', 'entity'].indexOf(defaultExportOutput.source.api) !== -1) {
          // example.com/ermrest/catalog/<id>/<api>/<current-path>/<vis-col-projection-and-needed-joins>
          uri = [
            this.location.service,
            'catalog',
            this._location.catalog,
            defaultExportOutput.source.api,
            this.location.ermrestCompactPath,
            defaultExportOutput.source.path,
          ].join('/');
        } else {
          // won't happen with the current code, but to make this future proof
          uri = this.location.ermrestCompactUri;
        }

        this._csvDownloadLink = uri + qParam;
      }
    }
    return this._csvDownloadLink;
  }

  /**
   * The default information that we want to be logged. This includes:
   *  - catalog, schema_table
   * TODO Evaluate whether we even need this function
   */
  get defaultLogInfo() {
    return {
      catalog: this.table.schema.catalog.id,
      schema_table: this.table.schema.name + ':' + this.table.name,
    };
  }

  /**
   * The object that can be logged to capture the filter state of the reference.
   * The return object can have:
   *  - filters: the facet object.
   *  - custom_filters:
   *      - the filter strings that parser couldn't turn to facet.
   *      - if we could turn the custom filter to facet, this will return `true`
   *  - cfacet: if there's a cfacet it will be 1
   *    - cfacet_str: if cfacet=1, it will be displayname of cfacet.
   *    - cfacet_path: if cfacet=1, it will be ermrest path of cfacet.
   * This function creates a new object everytime that it's called, so it
   * can be manipulated further.
   */
  get filterLogInfo() {
    const obj: { cfacet?: 1; cfacet_str?: unknown; cfacet_path?: string; filters?: unknown; custom_filters?: string | boolean } = {};

    // custom facet
    if (this.location.customFacets) {
      const cf = this.location.customFacets;
      obj.cfacet = 1;
      if (cf.displayname) {
        obj.cfacet_str = cf.displayname;
      } else if (cf.ermrestPath) {
        obj.cfacet_path = cf.ermrestPath;
      }
    }

    if (this.location.facets) {
      obj.filters = _compressFacetObject(this.location.facets.decoded);
    } else if (this.location.filter) {
      if (this.location.filter.facet) {
        obj.filters = _compressFacetObject(this.location.filter.facet);
        obj.custom_filters = true;
      } else {
        obj.custom_filters = this.location.filtersString;
      }
    }
    return obj;
  }

  /**
   * This will ensure the ermrestCompactPath is also
   * using the same aliases that we are going to use for allOutbounds
   * I'm attaching this to Reference so it's cached and we don't have to
   * compute it multiple times
   * @private
   */
  get _readAttributeGroupPathProps(): any {
    if (this._readAttributeGroupPathProps_cached === undefined) {
      const allOutBounds = this.activeList.allOutBounds;
      this._readAttributeGroupPathProps_cached = this._location.computeERMrestCompactPath(allOutBounds.map((ao) => ao.sourceObject));
    }
    return this._readAttributeGroupPathProps_cached;
  }

  /**
   * The array of column definitions which represent the model of
   * the resources accessible via this reference.
   *
   * _Note_: in database jargon, technically everything returned from
   * ERMrest is a 'tuple' or a 'relation'. A tuple consists of attributes
   * and the definitions of those attributes are represented here as the
   * array of {@link Column}s. The column definitions may be
   * contextualized (see {@link Reference#contextualize}).
   *
   * Usage:
   * ```
   * for (var i=0, len=reference.columns.length; i<len; i++) {
   *   var col = reference.columns[i];
   *   console.log("Column name:", col.name, "has display name:", col.displayname);
   * }
   * ```
   */
  get columns(): VisibleColumn[] {
    if (this._referenceColumns === undefined) {
      this.generateColumnsList();
    }
    return this._referenceColumns!;
  }

  /**
   * Generate the list of columns for this reference based on context and annotations
   */
  generateColumnsList(tuple?: Tuple, columnsList?: any[], dontChangeReference?: boolean, skipLog?: boolean): ReferenceColumn[] {
    const resultColumns = generateColumnsList(this, tuple, columnsList, skipLog);

    if (!dontChangeReference) {
      this._referenceColumns = resultColumns;
    }
    return resultColumns;
  }

  /**
   * NOTE this will not map the entity choice pickers, use "generateFacetColumns" instead.
   * so directly using this is not recommended.
   */
  get facetColumns(): FacetColumn[] {
    if (this._facetColumns === undefined) {
      const res = generateFacetColumns(this, true);
      if (!(res instanceof Promise)) {
        this._facetColumns = res.facetColumns;
      }
    }
    return this._facetColumns!;
  }

  /**
   * Returns the facets that should be represented to the user.
   * It will return a promise resolved with the following object:
   * {
   *   facetColumns: <an array of FacetColumn objects>
   *   issues: <if null it means that there wasn't any issues, otherwise will be a UnsupportedFilters object>
   * }
   *
   * - If `filter` context is not defined for the table, following heuristics will be used:
   *    - All the visible columns in compact context.
   *    - All the related entities in detailed context.
   * - This function will modify the Reference.location to reflect the preselected filters
   *   per annotation as well as validation.
   * - This function will validate the facets in the url, by doing the following (any invalid filter will be ignored):
   *   - Making sure given `source` or `sourcekey` are valid
   *   - If `source_domain` is passed,
   *       - Making sure `source_domain.table` and `source_domain.schema` are valid
   *       - Using `source_domain.column` instead of end column in case of scalars
   *   - Sending request to fetch the rows associated with the entity choices,
   *     and ignoring the ones that don't return any result.
   * - The valid filters in the url will either be matched with an existing facet,
   *   or result in a new facet column.
   * Usage:
   * ```
   *  reference.generateFacetColumns().then((result) => {
   *      var newRef = result.facetColumns[0].addChoiceFilters(['value']);
   *      var newRef2 = newRef.facetColumns[1].addSearchFilter('text 1');
   *      var newRef3 = newRef2.facetColumns[2].addRangeFilter(1, 2);
   *      var newRef4 = newRef3.facetColumns[3].removeAllFilters();
   *      for (var i=0, len=newRef4.facetColumns.length; i<len; i++) {
   *          var fc = reference.facetColumns[i];
   *          console.log("Column name:", fc.column.name, "has following facets:", fc.filters);
   *      }
   * });
   * ```
   */
  generateFacetColumns(): Promise<{ facetColumns: FacetColumn[]; issues: UnsupportedFilters | null }> {
    return new Promise((resolve, reject) => {
      const p = generateFacetColumns(this, false) as Promise<{ facetColumns: FacetColumn[]; issues: UnsupportedFilters | null }>;
      p.then((res) => {
        this._facetColumns = res.facetColumns;
        resolve(res);
      }).catch((err) => {
        this._facetColumns = [];
        reject(err);
      });
    });
  }

  /**
   * This is only added so _applyFilters in facet-column can use it.
   * SHOULD NOT be used outside of this library.
   */
  manuallySetFacetColumns(facetCols: FacetColumn[]) {
    this._facetColumns = facetCols;
  }

  /**
   * The "related" references. Relationships are defined by foreign key
   * references between {@link Table}s. Those references can be
   * considered "outbound" where the table has FKRs to other entities or
   * "inbound" where other entities have FKRs to this entity. Finally,
   * entities can be "associated" by means of associative entities. Those
   * are entities in another table that establish _many-to-many_
   * relationships between entities. If this help `A <- B -> C` where
   * entities in `B` establish relationships between entities in `A` and
   * `C`. Thus entities in `A` and `C` may be associated and we may
   * ignore `B` and think of this relationship as `A <-> C`, unless `B`
   * has other moderating attributes, for instance that indicate the
   * `type` of relationship, but this is a model-depenent detail.
   *
   * NOTE: This API should not be used for generating related references
   *       since we need the main tuple data for generating related references.
   *       Please use `generateRelatedList` or `generateActiveList` before
   *       calling this API.
   */
  get related(): Array<RelatedReference> {
    if (this._related === undefined) {
      this.generateRelatedList();
    }
    return this._related!;
  }

  /**
   * The function that can be used to generate .related API.
   * The logic is as follows:
   *
   * 1. Get the list of visible inbound foreign keys (if annotation is not defined,
   * it will consider all the inbound foreign keys).
   *
   * 2. Go through the list of visible inbound foreign keys
   *  2.1 if it's not part of InboundForeignKeyPseudoColumn apply the generateRelatedRef logic.
   * The logic for are sorted based on following attributes:
   *  1. displayname
   *  2. position of key columns that are involved in the foreignkey
   *  3. position of columns that are involved in the foreignkey
   *
   * NOTE: Passing "tuple" to this function is highly recommended.
   *       Without tuple related references will be generated by appending the compactPath with
   *       join statements. Because of this we cannot optimize the URL and other
   *       parts of the code cannot behave properly (e.g. getUnlinkTRS in read cannot be used).
   *       By passing "tuple", we can create the related references by creaing a facet blob
   *       which can be integrated with other parts of the code.
   *
   */
  generateRelatedList(tuple?: Tuple): Array<RelatedReference> {
    this._related = [];

    let visibleFKs = this.table.referredBy._contextualize(this._context, tuple);
    let notSorted;

    if (visibleFKs === -1) {
      notSorted = true;
      visibleFKs = this.table.referredBy.all().map((fkr) => ({ foreignKey: fkr }));
    }

    // if visible columns list is empty, make it.
    if (this._referenceColumns === undefined) {
      // will generate the this._inboundFKColumns
      this.generateColumnsList(tuple);
    }

    const currentColumns: Record<string, boolean> = {};
    if (Array.isArray(this._referenceColumns)) {
      this._referenceColumns.forEach((col) => {
        if (isRelatedColumn(col)) {
          currentColumns[col.name] = true;
        }
      });
    }

    for (let i = 0; i < visibleFKs.length; i++) {
      let fkr = visibleFKs[i];
      let relatedRef: RelatedReference, fkName: string;
      if (fkr.isPath) {
        // since we're sure that the pseudoColumn either going to be
        // general pseudoColumn or InboundForeignKeyPseudoColumn then it will have reference
        const pseudoCol = createPseudoColumn(this, fkr.sourceObjectWrapper, tuple) as PseudoColumn | InboundForeignKeyPseudoColumn;
        relatedRef = pseudoCol.reference as RelatedReference;
        fkName = relatedRef.pseudoColumn!.name;
      } else {
        fkr = fkr.foreignKey;

        // make sure that this fkr is not from an alternative table to self
        if (
          fkr._table._isAlternativeTable() &&
          fkr._table._altForeignKey !== undefined &&
          fkr._table._baseTable === this._table &&
          fkr._table._altForeignKey === fkr
        ) {
          continue;
        }
        relatedRef = generateRelatedReference(this, fkr, tuple, true);
        fkName = _sourceColumnHelpers.generateForeignKeyName(fkr, true) as string;
      }

      // if it's already added to the visible-columns (inline related) don't add it again.
      if (currentColumns[fkName]) {
        continue;
      }
      this._related.push(relatedRef);
    }

    if (notSorted && this._related.length !== 0) {
      return this._related.sort((a, b) => {
        // displayname
        if (a.displayname.value !== b.displayname.value) {
          return (a.displayname.value as string).localeCompare(b.displayname.value as string);
        }

        // columns
        const keyColPositions = compareColumnPositions(a._relatedKeyColumnPositions, b._relatedKeyColumnPositions);
        if (keyColPositions !== 0) {
          return keyColPositions;
        }

        // foreignkey columns
        const fkeyColPositions = compareColumnPositions(a._relatedFkColumnPositions, b._relatedFkColumnPositions);
        return fkeyColPositions === -1 ? -1 : 1;
      });
    }

    return this._related;
  }

  /**
   * Refer to Reference.generateActiveList
   */
  get activeList(): ActiveList {
    if (this._activeList === undefined) {
      this.generateActiveList();
    }
    return this._activeList;
  }

  /**
   * Generates the list of extra elements that the page might need,
   * this should include
   * - requests: An array of the secondary request objects which includes aggregates, entitysets, inline tables, and related tables.
   *   Depending on the type of request it can have different attributes.
   *   - for aggregate, entitysets, uniquefiltered, and outboundFirst (in entry):
   *     {column: ERMrest.ReferenceColumn, <type>: true, objects: [{index: integer, column: boolean, related: boolean, inline: boolean, citation: boolean}]
   *     where the type is aggregate`, `entity`, `entityset`, or `firstOutbound`. Each object is capturing where in the page needs this pseudo-column.
   *   - for related and inline tables:
   *     {<type>: true, index: integer}
   *     where the type is `inline` or `related`.
   * - allOutBounds: the all-outbound foreign keys (added so we can later append to the url).
   *   ERMrest.ReferenceColumn[]
   * - selfLinks: the self-links (so it can be added to the template variables)
   *   ERMrest.KeyPseudoColumn[]
   *
   * TODO we might want to detect duplicates in allOutBounds better?
   * currently it's done based on name, but based on the path should be enough..
   * as long as it's entity the last column is useless...
   * the old code was kinda handling this by just adding the multi ones,
   * so if the fk definition is based on fkcolumn and not the RID, it would handle it.
   *
   * @param tuple - optional tuple parameter
   * @private
   */
  generateActiveList(tuple?: Tuple): ActiveList {
    // VARIABLES:
    const allOutBounds: Array<PseudoColumn | ForeignKeyPseudoColumn> = [];
    const requests: any[] = [];
    const selfLinks: Array<KeyPseudoColumn> = [];
    const consideredUniqueFiltered: { [key: string]: number } = {};
    const consideredSets: { [key: string]: number } = {};
    const consideredOutbounds: { [key: string]: boolean } = {};
    const consideredAggregates: { [key: string]: number } = {};
    const consideredSelfLinks: { [key: string]: boolean } = {};
    const consideredEntryWaitFors: { [key: string]: number } = {};

    const sds = this.table.sourceDefinitions;

    // in detailed, we want related and citation
    const isDetailed = this._context === _contexts.DETAILED;
    // in entry, don't include waitfors in the activelist used for loading the page.
    // the waitfors will be used in chaise instead prior to submission.
    const isEntry = _isEntryContext(this._context);

    const COLUMN_TYPE = 'column';
    const RELATED_TYPE = 'related';
    const CITATION_TYPE = 'citation';
    const INLINE_TYPE = 'inline';

    // FUNCTIONS:
    const hasAggregate = (col: VisibleColumn) => {
      return col.hasWaitForAggregate || ((col as PseudoColumn).isPathColumn && (col as PseudoColumn).hasAggregate);
    };

    // col: the column that we need its data
    // isWaitFor: whether it was part of waitFor or just visible
    // type: where in the page it belongs to
    // index: the container index (column index, or related index) (optional)
    const addColToActiveList = (col: VisibleColumn, isWaitFor: boolean, type: string, index?: number) => {
      const obj: any = { isWaitFor: isWaitFor };

      // add the type
      obj[type] = true;

      // add index if available (not available in citation)
      if (Number.isInteger(index)) {
        obj.index = index;
      }

      if (isWaitFor && isEntry) {
        if (col.name in consideredEntryWaitFors) {
          requests[consideredEntryWaitFors[col.name]].objects.push(obj);
          return;
        }
        consideredEntryWaitFors[col.name] = requests.length;
        requests.push({ firstOutbound: true, column: col, objects: [obj] });
        return;
      }

      // unique filtered
      // TODO FILTER_IN_SOURCE chaise should use this type of column as well?
      // TODO FILTER_IN_SOURCE should be added to documentation as well
      if ((col as PseudoColumn).sourceObjectWrapper?.isUniqueFiltered) {
        // duplicate
        if (col.name in consideredUniqueFiltered) {
          requests[consideredUniqueFiltered[col.name]].objects.push(obj);
          return;
        }

        // new
        consideredUniqueFiltered[col.name] = requests.length;
        requests.push({ entity: true, column: col, objects: [obj] });
        return;
      }

      // aggregates
      if ((col as PseudoColumn).isPathColumn && (col as PseudoColumn).hasAggregate) {
        // duplicate
        if (col.name in consideredAggregates) {
          requests[consideredAggregates[col.name]].objects.push(obj);
          return;
        }

        // new
        consideredAggregates[col.name] = requests.length;
        requests.push({ aggregate: true, column: col, objects: [obj] });
        return;
      }

      //entitysets
      if (isRelatedColumn(col)) {
        if (!isDetailed) {
          return; // only acceptable in detailed
        }

        if (col.name in consideredSets) {
          requests[consideredSets[col.name]].objects.push(obj);
          return;
        }

        consideredSets[col.name] = requests.length;
        requests.push({ entityset: true, column: col, objects: [obj] });
      }

      // all outbounds
      if (isAllOutboundColumn(col)) {
        if (col.name in consideredOutbounds) return;
        consideredOutbounds[col.name] = true;
        allOutBounds.push(col as PseudoColumn | ForeignKeyPseudoColumn);
      }

      // self-links
      if ((col as KeyPseudoColumn).isKey) {
        if (col.name in consideredSelfLinks) return;
        consideredSelfLinks[col.name] = true;
        selfLinks.push(col as KeyPseudoColumn);
      }
    };

    const addInlineColumn = (col: VisibleColumn, i: number) => {
      if (isRelatedColumn(col)) {
        requests.push({ inline: true, index: i });
      } else {
        addColToActiveList(col, false, COLUMN_TYPE, i);
      }

      col.waitFor.forEach((wf: any) => {
        addColToActiveList(wf, true, isRelatedColumn(col) ? INLINE_TYPE : COLUMN_TYPE, i);
      });
    };

    // THE CODE STARTS HERE:
    const columns = this.generateColumnsList(tuple);

    // citation
    if (isDetailed && this.citation) {
      this.citation.waitFor.forEach((col) => {
        addColToActiveList(col, true, CITATION_TYPE);
      });
    }

    // columns without aggregate
    columns.forEach((col, i: number) => {
      if (!hasAggregate(col)) {
        addInlineColumn(col, i);
      }
    });

    // columns with aggregate
    columns.forEach((col, i: number) => {
      if (hasAggregate(col)) {
        addInlineColumn(col, i);
      }
    });

    // related tables
    if (isDetailed) {
      this.generateRelatedList(tuple).forEach((rel, i) => {
        requests.push({ related: true, index: i });

        if (rel.pseudoColumn) {
          rel.pseudoColumn.waitFor.forEach((wf) => {
            addColToActiveList(wf, true, RELATED_TYPE, i);
          });
        }
      });
    }

    //fkeys
    sds.fkeys.forEach((fk) => {
      if (fk.name in consideredOutbounds) return;
      consideredOutbounds[fk.name] = true;
      allOutBounds.push(new ForeignKeyPseudoColumn(this, fk));
    });

    this._activeList = {
      requests: requests,
      allOutBounds: allOutBounds,
      selfLinks: selfLinks,
    };

    return this._activeList;
  }

  /**
   * List of columns that are used for search
   * if it's false, then we're using all the columns for search
   */
  get searchColumns(): Array<VisibleColumn> | false {
    if (this._searchColumns === undefined) {
      this._searchColumns = false;
      if (this.table.searchSourceDefinition && Array.isArray(this.table.searchSourceDefinition.columns)) {
        this._searchColumns = this.table.searchSourceDefinition.columns.map((sd) => {
          return createPseudoColumn(this, sd);
        });
      }
    }
    return this._searchColumns;
  }

  /**
   * Will return the expor templates that are available for this reference.
   * It will validate the templates that are defined in annotations.
   * If its `detailed` context and annotation was missing,
   * it will return the default export template.
   * @param useDefault whether we should use default template or not
   */
  getExportTemplates(useDefault?: boolean) {
    const helpers = _exportHelpers;

    // either null or array
    const templates = helpers.getExportAnnotTemplates(this.table, this.context);

    // annotation is missing
    if (!Array.isArray(templates)) {
      const canUseDefault = useDefault && this.context === _contexts.DETAILED && this.defaultExportTemplate != null;

      return canUseDefault ? [this.defaultExportTemplate] : [];
    }

    const finalRes = helpers.replaceFragments(templates, helpers.getExportFragmentObject(this.table, this.defaultExportTemplate));

    // validate the templates
    return finalRes.filter(validateExportTemplate);
  }

  /**
   * Returns a object, that can be used as a default export template.
   * NOTE SHOULD ONLY BE USED IN DETAILED CONTEXT
   * It will include:
   * - csv of the main table.
   * - csv of all the related entities
   * - fetch all the assets. For fetch, we need to provide url, length, and md5 (or other checksum types).
   *   if these columns are missing from the asset annotation, they won't be added.
   * - fetch all the assetes of related tables.
   * @type {string}
   */
  get defaultExportTemplate() {
    if (this._defaultExportTemplate === undefined) {
      this._defaultExportTemplate = _getDefaultExportTemplate(this);
    }
    return this._defaultExportTemplate;
  }

  /**
   * Find a column given its name. It will search in this order:
   * 1. Visible columns
   * 2. Table columns
   * 3. search by constraint name in visible foreignkey and keys (backward compatibility)
   * Will throw an error if column is not found
   * @param name name of column
   * @returns ReferenceColumn
   */
  getColumnByName(name: string): VisibleColumn {
    // given an array of columns, find column by name
    const findCol = (list: any[]): any => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].name === name) {
          return list[i];
        }
      }
      return false;
    };

    // search in visible columns
    let c = findCol(this.columns);
    if (c) {
      return c;
    }

    // search in table columns
    c = findCol(this.table.columns.all());
    if (c) {
      return new ReferenceColumn(this, [c]);
    }

    // backward compatibility, look at fks and keys using constraint name
    for (const c of this.columns) {
      if (
        c.isPseudo &&
        (((c as KeyPseudoColumn).isKey && (c as KeyPseudoColumn).key._constraintName === name) ||
          ((c as ForeignKeyPseudoColumn).isForeignKey && (c as ForeignKeyPseudoColumn).foreignKey._constraintName === name))
      ) {
        return c;
      }
    }

    throw new NotFoundError('', 'Column ' + name + ' not found in table ' + this.table.name + '.');
  }

  /**
   * Given a page, will return a reference that has
   * - the sorting and paging of the given page.
   * - the merged facets of the based reference and given page's facet.
   * to match the page.
   * NOTE: The given page must be based on the same table that this current table is based on.
   */
  setSamePaging(page: Page) {
    const pageRef = page.reference;

    /*
     * It only works when page's table and current table are the same.
     */
    if (pageRef.table !== this.table) {
      throw new InvalidInputError('Given page is not from the same table.');
    }

    const newRef = this.copy();
    newRef._location = this._location._clone(newRef);

    // same facets
    if (pageRef.location.facets) {
      const andFilters = newRef.location.facets ? newRef.location.facets.andFilters : [];
      Array.prototype.push.apply(andFilters, pageRef.location.facets.andFilters);
      newRef._location.facets = { and: andFilters };
    }

    /*
     * This case is not possible in the current implementation,
     * page object is being created from read, and therefore always the
     * attached reference will have sortObject.
     * But if it didn't have any sort, we should just return the reference.
     */
    if (!pageRef._location.sortObject) {
      return newRef;
    }

    // same sort
    newRef._location.sortObject = simpleDeepCopy(pageRef._location.sortObject);

    // same pagination
    newRef._location.afterObject = pageRef._location.afterObject ? simpleDeepCopy(pageRef._location.afterObject) : null;
    newRef._location.beforeObject = pageRef._location.beforeObject ? simpleDeepCopy(pageRef._location.beforeObject) : null;

    // if we have extra data, and one of before/after is not available
    if (page.extraData && (!pageRef._location.beforeObject || !pageRef._location.afterObject)) {
      const pageValues = _getPagingValues(newRef, page.extraData, page.extraLinkedData);

      // add before based on extra data
      if (!pageRef._location.beforeObject) {
        newRef._location.beforeObject = pageValues;
      }
      // add after based on extra data
      else {
        newRef._location.afterObject = pageValues;
      }
    }
    return newRef;
  }

  /**
   * Remove all the filters, facets, and custom-facets from the reference
   * @param {boolean} sameFilter By default we're removing filters, if this is true filters won't be changed.
   * @param {boolean} sameCustomFacet By default we're removing custom-facets, if this is true custom-facets won't be changed.
   * @param {boolean} sameFacet By default we're removing facets, if this is true facets won't be changed.
   *
   * @return {reference} A reference without facet filters
   */
  removeAllFacetFilters(sameFilter?: boolean, sameCustomFacet?: boolean, sameFacet?: boolean) {
    verify(!(sameFilter && sameCustomFacet && sameFacet), 'at least one of the options must be false.');

    const newReference = this.copy();

    // update the facetColumns list
    // NOTE there are two reasons for this:
    // 1. avoid computing the facet columns logic each time that we are removing facets.
    // 2. we don't want the list of facetColumns to be changed because of a change in the facets.
    //    Some facetColumns are only in the list because they had an initial filter, and if we
    //    compute that logic again, those facets will disappear.
    newReference._facetColumns = [];
    this.facetColumns.forEach((fc) => {
      newReference._facetColumns!.push(new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, sameFacet ? fc.filters.slice() : []));
    });

    // update the location objectcd
    newReference._location = this._location._clone(newReference);
    newReference._location.beforeObject = null;
    newReference._location.afterObject = null;

    if (!sameFacet) {
      // the hidden filters should still remain
      const andFilters = this.location.facets ? this.location.facets.andFilters : [];
      const newFilters: unknown[] = [];
      andFilters.forEach((f) => {
        if (f.hidden) {
          newFilters.push(f);
        }
      });
      newReference._location.facets = newFilters.length > 0 ? { and: newFilters } : null;
    }

    if (!sameCustomFacet) {
      newReference._location.customFacets = null;
    }

    if (!sameFilter) {
      newReference._location.removeFilters();
    }

    return newReference;
  }

  /**
   * Given a list of facet and filters, will add them to the existing conjunctive facet filters.
   *
   * @param facetAndFilters - an array of facets that will be added
   * @param customFacets - the custom facets object
   */
  addFacets(facetAndFilters: unknown[], customFacets: unknown) {
    verify(Array.isArray(facetAndFilters) && facetAndFilters.length > 0, 'given input must be an array');

    const loc = this.location;

    // keep a copy of existing facets
    const existingFilters = loc.facets ? simpleDeepCopy(loc.facets.andFilters) : [];

    // create a new copy
    const newReference = this.copy();

    // clone the location object
    newReference._location = loc._clone(newReference);
    newReference._location.beforeObject = null;
    newReference._location.afterObject = null;

    // merge the existing facets with the input
    newReference._location.facets = { and: facetAndFilters.concat(existingFilters) };

    if (isObjectAndNotNull(customFacets)) {
      newReference._location.customFacets = customFacets;
    }

    return newReference;
  }

  /**
   * Will return a reference with the same facets but hidden.
   */
  hideFacets() {
    const andFilters = this.location.facets ? this.location.facets.andFilters : [];

    verify(andFilters.length > 0, "Reference doesn't have any facets.");

    const newReference = this.copy();

    const newFilters: unknown[] = [];
    // update the location object
    newReference._location = this._location._clone(newReference);
    newReference._location.beforeObject = null;
    newReference._location.afterObject = null;

    // make all the facets as hidden
    andFilters.forEach((f) => {
      const newFilter = simpleDeepCopy(f);
      newFilter.hidden = true;
      newFilters.push(newFilter);
    });

    newReference._location.facets = { and: newFilters };

    return newReference;
  }

  /**
   *
   * @param table
   */
  setNewTable(table: Table) {
    this._table = table;
    this._shortestKey = table.shortestKey;
    this._displayname = table.displayname;
    delete this._referenceColumns;
    delete this._activeList;
    delete this._related;
    delete this._canCreate;
    delete this._canRead;
    delete this._canUpdate;
    delete this._canDelete;
    delete this._canUseTRS;
    delete this._canUseTCRS;
    delete this._display;
    delete this._csvDownloadLink;
    delete this._readAttributeGroupPathProps_cached;
  }

  /**
   * If annotation is defined and has the required attributes, will return
   * a Citation object that can be used to generate citation.
   */
  get citation(): Citation | null {
    if (this._citation === undefined) {
      const table = this.table;
      if (!table.annotations.contains(_annotations.CITATION)) {
        this._citation = null;
      } else {
        const citationAnno = table.annotations.get(_annotations.CITATION).content;
        if (!citationAnno.journal_pattern || !citationAnno.year_pattern || !citationAnno.url_pattern) {
          this._citation = null;
        } else {
          this._citation = new Citation(this, citationAnno);
        }
      }
    }
    return this._citation;
  }

  /**
   * If annotation is defined and has the required attributes, will return
   * a Metadata object
   */
  get googleDatasetMetadata(): GoogleDatasetMetadata | null {
    if (this._googleDatasetMetadata === undefined) {
      const table = this.table;
      if (!table.annotations.contains(_annotations.GOOGLE_DATASET_METADATA)) {
        this._googleDatasetMetadata = null;
      } else {
        const metadataAnnotation = _getRecursiveAnnotationValue(
          this.context,
          this.table.annotations.get(_annotations.GOOGLE_DATASET_METADATA).content,
        );
        if (!isObjectAndNotNull(metadataAnnotation) || !isObjectAndNotNull(metadataAnnotation.dataset)) {
          this._googleDatasetMetadata = null;
        } else {
          this._googleDatasetMetadata = new GoogleDatasetMetadata(this, metadataAnnotation);
        }
      }
    }
    return this._googleDatasetMetadata;
  }

  /**
   * The related reference or tables that might be deleted as a result of deleting the current table.
   */
  get cascadingDeletedItems(): Array<Table | RelatedReference | Reference> {
    if (this._cascadingDeletedItems === undefined) {
      const res: Array<Table | RelatedReference | Reference> = [];
      const consideredFKs: Record<string, number> = {};
      const detailedRef = this._context === _contexts.DETAILED ? this : this.contextualize.detailed;

      // inline tables
      detailedRef.columns.forEach((col) => {
        if (isRelatedColumn(col)) {
          const typedCol = col as PseudoColumn | InboundForeignKeyPseudoColumn;

          // col.foreignKey is available for non-source syntax, while the other one is used for source syntax
          let fk: ForeignKeyRef | undefined;
          if ((typedCol as InboundForeignKeyPseudoColumn).foreignKey) {
            fk = (typedCol as InboundForeignKeyPseudoColumn).foreignKey;
          } else if (typedCol.firstForeignKeyNode) {
            fk = typedCol.firstForeignKeyNode.nodeObject;
          }
          // this check is not needed and only added for sanity check
          if (!fk) return;
          consideredFKs[fk.name] = 1;
          if (fk.onDeleteCascade) {
            res.push(typedCol.reference);
          }
        }
      });

      // related tables
      detailedRef.related.forEach((ref) => {
        // col.origFKR is available for non-source syntax, while the other one is used for source syntax
        let fk;

        // TODO kept this check for backwards compatibility, but it shouldn't be needed.
        if (ref.origFKR) {
          fk = ref.origFKR;
        } else if (ref.pseudoColumn && ref.pseudoColumn.firstForeignKeyNode) {
          fk = ref.pseudoColumn.firstForeignKeyNode.nodeObject;
        }
        // this check is not needed and only added for sanity check
        if (!fk) return;
        consideredFKs[fk.name] = 1;
        if (fk.onDeleteCascade) {
          res.push(ref);
        }
      });

      // list the tables that are not added yet
      this.table.referredBy.all().forEach((fk) => {
        if (fk.name in consideredFKs || !fk.onDeleteCascade) return;

        res.push(fk.table);
      });

      this._cascadingDeletedItems = res;
    }

    return this._cascadingDeletedItems;
  }

  /**
   * If prefill object is defined and has the required attributes, will return
   * a BulkCreateForeignKeyObject object with the necessary objects used for a association modal picker
   */
  get bulkCreateForeignKeyObject(): BulkCreateForeignKeyObject | null {
    if (this._bulkCreateForeignKeyObject === undefined) {
      this._bulkCreateForeignKeyObject = null;
    }
    return this._bulkCreateForeignKeyObject;
  }

  /**
   * Will compute and return a BulkCreateForeignKeyObject if:
   *   - the prefillObject is defined
   *   - there are only 2 foreign key columns for this table that are not system columns
   *   - using the prefill object, we can determine the main column for prefilling and leaf column for bulk selection
   *
   * @param  prefillObject computed prefill object from chaise
   */
  computeBulkCreateForeignKeyObject(prefillObject: any) {
    if (this._bulkCreateForeignKeyObject === undefined) {
      if (!prefillObject) {
        this._bulkCreateForeignKeyObject = null;
      } else {
        // ignore the fks that are simple and their constituent column is system col
        const nonSystemColumnFks = this.table.foreignKeys.all().filter((fk) => {
          return !(fk.simple && _systemColumns.indexOf(fk.colset.columns[0].name) !== -1);
        });

        // set of foreignkey columns (they might be overlapping so we're not using array)
        const fkCols: Record<string, boolean> = {};
        nonSystemColumnFks.forEach((fk) => {
          fk.colset.columns.forEach((col) => {
            fkCols[col.name] = true;
          });
        });

        let mainColumn: ForeignKeyPseudoColumn | null = null;
        // find main column in the visible columns list
        for (let k = 0; k < this.columns.length; k++) {
          const column = this.columns[k];
          // column should be a foreignkey pseudo column
          if (!(column as ForeignKeyPseudoColumn).isForeignKey) continue;
          if (prefillObject.fkColumnNames.indexOf(column.name) !== -1) {
            // mainColumn is the column being prefilled, this should ALWAYS be in the visible columns list
            mainColumn = column as ForeignKeyPseudoColumn;
            break;
          }
        }

        if (!mainColumn) {
          this._bulkCreateForeignKeyObject = null;
          return;
        }

        /**
         * Using the given constraintName, determines the leaf column to be used for bulk foreign key create from the annotation value.
         * If no constraintName is provided, uses the other foreign key found on the table as the leaf
         *   NOTE: when no constraintName, this is only called if there are 2 foreign keys and we know the main column
         *
         * @param constraintNameProp constraint name of the foreingkey from annotation or array of constraint names
         * @returns BulkCreateForeignKeyObject if leaf column can be found, null otherwise
         */
        const findLeafColumnAndSetBulkCreate = (constraintNameProp?: string[][] | string[]) => {
          /**
           *
           * @param col foreign key column to check if it's in the list of visible columns and matches the constraint name
           * @returns the foreign key column that represents the leaf table
           */
          const findLeafColumn = (col: ForeignKeyPseudoColumn, constraintName?: string) => {
            let foundColumn = null;

            for (let k = 0; k < nonSystemColumnFks.length; k++) {
              const fk = nonSystemColumnFks[k];
              // make sure column is in visible columns and is in foreign key list
              // column and foreign key `.name` property is a hash value
              if (col.name === fk.name) {
                if (constraintName && constraintName === col._constraintName) {
                  // use the constraint name to check each column and ensure it's the one we want from annotation
                  foundColumn = col;
                } else if (!constraintName && col.name !== mainColumn.name) {
                  // make sure the current column is the NOT the main column
                  // assume there are only 2 foreign keys and we know mainColumn already
                  foundColumn = col;
                }

                if (foundColumn) break;
              }
            }

            return foundColumn;
          };

          let leafCol = null;
          // use for loop so we can break if we find the leaf column
          for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i] as ForeignKeyPseudoColumn;

            // column should be a simple foreignkey pseudo column
            // return if it's not a foreign key or the column is a foreign key but it's not simple
            if (!column.isForeignKey || !column.foreignKey.simple) continue;

            // if constraintNameProp is string[][], it's from bulk_create_foreign_key_candidates
            // we need to iterate over the set to find the first matching column
            if (Array.isArray(constraintNameProp) && Array.isArray(constraintNameProp[0])) {
              for (let j = 0; j < constraintNameProp.length; j++) {
                const name = constraintNameProp[j];
                if (_isValidForeignKeyName(name) && Array.isArray(name)) leafCol = findLeafColumn(column, name.join('_'));

                if (leafCol) break;
              }
            } else if (Array.isArray(constraintNameProp)) {
              // constraintNameProp should be a string[]
              leafCol = findLeafColumn(column, constraintNameProp.join('_'));
            } else {
              // no constraintName
              leafCol = findLeafColumn(column);
            }

            if (leafCol) break;
          }

          if (!leafCol) return null;
          return new BulkCreateForeignKeyObject(this, prefillObject, fkCols, mainColumn, leafCol);
        };

        if (!mainColumn) {
          // if no mainColumn, this API can't be used
          this._bulkCreateForeignKeyObject = null;
        } else if (mainColumn.display.bulkForeignKeyCreateConstraintName === false) {
          // don't use heuristics
          this._bulkCreateForeignKeyObject = null;
        } else if (mainColumn.display.bulkForeignKeyCreateConstraintName) {
          // see if the leaf column to use is determined by an annotation by setting `true`
          // if a leaf column is determined, call BulkCreateForeignKeyObject constructor and set the generated value
          this._bulkCreateForeignKeyObject = findLeafColumnAndSetBulkCreate(mainColumn.display.bulkForeignKeyCreateConstraintName);
        } else {
          // use heuristics instead
          // There have to be 2 foreign key columns
          if (nonSystemColumnFks.length !== 2) {
            this._bulkCreateForeignKeyObject = null;
          } else {
            // both foreign keys have to be simple
            if (!nonSystemColumnFks[0].simple || !nonSystemColumnFks[1].simple) {
              this._bulkCreateForeignKeyObject = null;
            } else {
              // leafColumn will be set no matter what since the check above ensures there are 2 FK columns
              this._bulkCreateForeignKeyObject = findLeafColumnAndSetBulkCreate();
            }
          }
        }
      }
    }
    return this._bulkCreateForeignKeyObject;
  }

  /**
   * Indicates whether the client has the permission to _create_
   * the referenced resource(s). Reporting a `true` value DOES NOT
   * guarantee the user right since some policies may be undecidable until
   * query execution.
   */
  get canCreate(): boolean {
    if (this._canCreate === undefined) {
      // can create if all are true
      // 1) user has write permission
      // 2) table is not generated
      // 3) not all visible columns in the table are generated
      const pm = _permissionMessages;
      const ref = this._context === _contexts.CREATE ? this : this.contextualize.entryCreate;

      if (ref._table.kind === _tableKinds.VIEW) {
        this._canCreate = false;
        this._canCreateReason = pm.TABLE_VIEW;
      } else if (ref._table.isGenerated) {
        this._canCreate = false;
        this._canCreateReason = pm.TABLE_GENERATED;
      } else if (!ref.checkPermissions(_ERMrestACLs.INSERT)) {
        this._canCreate = false;
        this._canCreateReason = pm.NO_CREATE;
      } else {
        this._canCreate = true;
      }

      if (this._canCreate === true) {
        const allColumnsDisabled = ref.columns.every((col) => col.inputDisabled !== false);

        if (allColumnsDisabled) {
          this._canCreate = false;
          this._canCreateReason = pm.DISABLED_COLUMNS;
        }
      }
    }
    return this._canCreate;
  }

  /**
   * Indicates the reason as to why a user cannot create the
   * referenced resource(s).
   */
  get canCreateReason(): string {
    if (this._canCreateReason === undefined) {
      // will set the _canCreateReason property
      void this.canCreate;
    }
    return this._canCreateReason!;
  }

  /**
   * Indicates whether the client has the permission to _read_
   * the referenced resource(s). Reporting a `true` value DOES NOT
   * guarantee the user right since some policies may be undecidable until
   * query execution.
   */
  get canRead(): boolean {
    if (this._canRead === undefined) {
      this._canRead = this.checkPermissions(_ERMrestACLs.SELECT);
    }
    return this._canRead;
  }

  /**
   * Indicates whether the client has the permission to _update_
   * the referenced resource(s). Reporting a `true` value DOES NOT
   * guarantee the user right since some policies may be undecidable until
   * query execution.
   */
  get canUpdate(): boolean {
    // can update if all are true
    // 1) user has write permission
    // 2) table is not generated
    // 3) table is not immutable
    // 4) not all visible columns in the table are generated/immutable
    if (this._canUpdate === undefined) {
      const pm = _permissionMessages;
      const ref = this._context === _contexts.EDIT ? this : this.contextualize.entryEdit;

      if (ref._table.kind === _tableKinds.VIEW) {
        this._canUpdate = false;
        this._canUpdateReason = pm.TABLE_VIEW;
        // if table specifically says that it's not immutable, then it's not!
      } else if (ref._table.isGenerated && ref._table.isImmutable !== false) {
        this._canUpdate = false;
        this._canUpdateReason = pm.TABLE_GENERATED;
      } else if (ref._table.isImmutable) {
        this._canUpdate = false;
        this._canUpdateReason = pm.TABLE_IMMUTABLE;
      } else if (!ref.checkPermissions(_ERMrestACLs.UPDATE)) {
        this._canUpdate = false;
        this._canUpdateReason = pm.NO_UPDATE;
      } else {
        this._canUpdate = true;
      }

      if (this._canUpdate) {
        const allColumnsDisabled = ref.columns.every((col) => col.inputDisabled !== false);

        if (allColumnsDisabled) {
          this._canUpdate = false;
          this._canUpdateReason = pm.DISABLED_COLUMNS;
        }
      }
    }
    return this._canUpdate;
  }

  /**
   * Indicates the reason as to why a user cannot update the
   * referenced resource(s).
   */
  get canUpdateReason(): string {
    if (this._canUpdateReason === undefined) {
      // will set the _canUpdateReason property
      void this.canUpdate;
    }
    return this._canUpdateReason!;
  }

  /**
   * Indicates whether the client has the permission to _delete_
   * the referenced resource(s). Reporting a `true` value DOES NOT
   * guarantee the user right since some policies may be undecidable until
   * query execution.
   */
  get canDelete(): boolean {
    // can delete if all are true
    // 1) table is not non-deletable
    // 2) user has write permission
    if (this._canDelete === undefined) {
      this._canDelete = this._table.kind !== _tableKinds.VIEW && !this._table.isNonDeletable && this.checkPermissions(_ERMrestACLs.DELETE);
    }
    return this._canDelete;
  }

  /**
   * Returns true if
   *  - ermrest supports trs, and
   *  - table has dynamic acls, and
   *  - table has RID column, and
   *  - table is not marked non-deletable non-updatable by annotation
   */
  get canUseTRS(): boolean {
    if (this._canUseTRS === undefined) {
      const rightKey = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
      this._canUseTRS =
        this.table.schema.catalog.features[rightKey] === true &&
        // eslint-disable-next-line eqeqeq
        (this.table.rights[_ERMrestACLs.UPDATE] == null || this.table.rights[_ERMrestACLs.DELETE] == null) &&
        this.table.columns.has('RID') &&
        (this.canUpdate || this.canDelete);
    }
    return this._canUseTRS;
  }

  /**
   * Returns true if
   *  - ermrest supports tcrs, and
   *  - table has dynamic acls, and
   *  - table has RID column, and
   *  - table is not marked non-updatable by annotation
   */
  get canUseTCRS(): boolean {
    if (this._canUseTCRS === undefined) {
      const rightKey = _ERMrestFeatures.TABLE_COL_RIGHTS_SUMMARY;
      this._canUseTCRS =
        this.table.schema.catalog.features[rightKey] === true &&
        // eslint-disable-next-line eqeqeq
        this.table.rights[_ERMrestACLs.UPDATE] == null &&
        this.table.columns.has('RID') &&
        this.canUpdate;
    }
    return this._canUseTCRS;
  }

  /**
   * This is a private function that checks the user permissions for modifying the affiliated entity, record or table
   * Sets a property on the reference object used by canCreate/canUpdate/canDelete
   */
  checkPermissions(permission: string): boolean {
    // Return true if permission is null
    if (this._table.rights[permission] === null) return true;
    return this._table.rights[permission];
  }

  _generateContextHeader(contextHeaderParams: Record<string, unknown>): Record<string, unknown> {
    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = {};
    }

    for (const key in this.defaultLogInfo) {
      // only add the values that are not defined.
      if (key in contextHeaderParams) continue;
      contextHeaderParams[key] = this.defaultLogInfo[key as keyof typeof this.defaultLogInfo];
    }

    const headers: Record<string, unknown> = {};
    headers[contextHeaderName] = contextHeaderParams;
    return headers;
  }

  /**
   * create a new reference with the new search
   * by copying this reference and clears previous search filters
   * search term can be:
   * a) A string with no space: single term or regular expression
   * b) A single term with space using ""
   * c) use space for conjunction of terms
   */
  search(term: string) {
    if (term) {
      if (typeof term === 'string') term = term.trim();
      else throw new InvalidInputError('Invalid input. Seach expects a string.');
    }

    // make a Reference copy
    const newReference = this.copy();

    newReference._location = this._location._clone(newReference);
    newReference._location.beforeObject = null;
    newReference._location.afterObject = null;
    newReference._location.search(term);

    // if facet columns are already computed, just update them.
    // if we don't do this here, then facet columns will recomputed after each search
    // TODO can be refactored
    if (this._facetColumns !== undefined) {
      newReference._facetColumns = [];
      this.facetColumns.forEach((fc) => {
        newReference._facetColumns!.push(new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, fc.filters.slice()));
      });
    }

    return newReference;
  }

  /**
   * Return a new Reference with the new sorting
   * TODO this should validate the given sort objects,
   * but I'm not sure how much adding that validation will affect other apis and client
   *
   * @param sort an array of objects in the format
   * {"column":columname, "descending":true|false}
   * in order of priority. Undfined, null or Empty array to use default sorting.
   *
   */
  sort(sort: Array<{ column: string; descending?: boolean }> | null) {
    if (sort) {
      verify(sort instanceof Array, 'input should be an array');
      verify(sort.every(_isValidSortElement), 'invalid arguments in array');
    }

    // make a Reference copy
    const newReference = this.copy();

    newReference._location = this._location._clone(newReference);
    newReference._location.sortObject = sort;
    newReference._location.beforeObject = null;
    newReference._location.afterObject = null;

    // if facet columns are already computed, just update them.
    // if we don't do this here, then facet columns will recomputed after each sort
    // TODO can be refactored
    if (this._facetColumns !== undefined) {
      newReference._facetColumns = [];
      this.facetColumns.forEach((fc) => {
        newReference._facetColumns!.push(new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, fc.filters.slice()));
      });
    }

    return newReference;
  }

  /**
   *
   * @param {ColumnAggregateFn[]} aggregateList - list of aggregate functions to apply to GET uri
   * @return Promise contains an array of the aggregate values in the same order as the supplied aggregate list
   */
  getAggregates(aggregateList: ColumnAggregateFn[], contextHeaderParams?: Record<string, unknown>): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      let url = '';

      // create the context header params for logging
      if (!contextHeaderParams || !isObject(contextHeaderParams)) {
        contextHeaderParams = { action: 'aggregate' };
      }
      const config = {
        headers: this._generateContextHeader(contextHeaderParams),
      };

      const urlSet = [];
      const baseUri = this.location.ermrestCompactPath + '/';
      // create a url: ../aggregate/../0:=fn(),1:=fn()..
      // TODO could be re-written
      for (let i = 0; i < aggregateList.length; i++) {
        const agg = aggregateList[i];

        // if this is the first aggregate, begin with the baseUri
        if (i === 0) {
          url = baseUri;
        } else {
          url += ',';
        }

        // if adding the next aggregate to the url will push it past url length limit, push url onto the urlSet and reset the working url
        if ((url + i + ':=' + agg).length > URL_PATH_LENGTH_LIMIT) {
          // if cannot even add the first one
          if (i === 0) {
            reject(new InvalidInputError('Cannot send the request because of URL length limit.'));
            return;
          }

          // strip off an extra ','
          if (url.charAt(url.length - 1) === ',') {
            url = url.substring(0, url.length - 1);
          }

          urlSet.push(url);
          url = baseUri;
        }

        // use i as the alias
        url += i + ':=' + agg;

        // We are at the end of the aggregate list
        if (i + 1 === aggregateList.length) {
          urlSet.push(url);
        }
      }

      const aggregatePromises = [];
      const http = this._server.http;
      for (let j = 0; j < urlSet.length; j++) {
        aggregatePromises.push(http.get(this.location.service + '/catalog/' + this.location.catalog + '/aggregate/' + urlSet[j], config));
      }

      Promise.all(aggregatePromises)
        .then((response) => {
          // all response rows merged into one object
          const singleResponse: Record<string, unknown> = {};

          // collect all the data in one object so we can map it to an array
          for (let k = 0; k < response.length; k++) {
            Object.assign(singleResponse, response[k].data[0]);
          }

          const responseArray: unknown[] = [];
          for (let m = 0; m < aggregateList.length; m++) {
            responseArray.push(singleResponse[m]);
          }

          resolve(responseArray);
          return;
        })
        .catch((err) => {
          reject(ErrorService.responseToError(err));
        });
    });
  }

  /**
   * Reads the referenced resources and returns a promise for a page of
   * tuples. The `limit` parameter is required and must be a positive
   * integer. The page of tuples returned will be described by the
   * {@link ERMrest.Reference#columns} array of column definitions.
   *
   * Usage:
   * ```
   * // assumes the client holds a reference
   * reference.read(10).then(
   *   function(page) {
   *     // we now have a page of tuples
   *     ...
   *   },
   *   function(error) {
   *     // an error occurred
   *     ...
   *   });
   * ```
   *
   * @param {!number} limit The limit of results to be returned by the
   * read request. __required__
   * @param {Object} contextHeaderParams the object that we want to log.
   * @param {Boolean=} useEntity whether we should use entity api or not (if true, we won't get foreignkey data)
   * @param {Boolean=} dontCorrectPage whether we should modify the page.
   * If there's a @before in url and the number of results is less than the
   * given limit, we will remove the @before and run the read again. Setting
   * dontCorrectPage to true, will not do this extra check.
   * @param {Boolean=} getTRS whether we should fetch the table-level row acls (if table supports it)
   * @param {Boolean=} getTCRS whether we should fetch the table-level and column-level row acls (if table supports it)
   * @param {Boolean=} getUnlinkTRS whether we should fetch the acls of association
   *                  table. Use this only if the association is based on facet syntax
   *
   * NOTE setting useEntity to true, will ignore any sort that is based on
   * pseduo-columns.
   * TODO we might want to chagne the above statement, so useEntity can
   * be used more generally.
   *
   * NOTE getUnlinkTRS can only be used on related references that are generated
   * after calling `generateRelatedReference` or `generateActiveList` with the main
   * tuple data. As part of generating related references, if the main tuple is available
   * we will use a facet filter and the alias is added in there. Without the main tuple,
   * the alias is not added to the path and therefore `getUnlinkTRS` cannot be used.
   * TODO this is a bit hacky and should be refactored
   *
   * @returns A promise resolved with {@link Page} of results,
   * or rejected with any of these errors:
   * - {@link InvalidInputError}: If `limit` is invalid.
   * - {@link BadRequestError}: If asks for sorting based on columns that are not sortable.
   * - {@link NotFoundError}: If asks for sorting based on columns that are not valid.
   * - ERMrestjs corresponding http errors, if ERMrest returns http error.
   */
  async read(
    limit: number,
    contextHeaderParams?: Record<string, unknown>,
    useEntity?: boolean,
    dontCorrectPage?: boolean,
    getTRS?: boolean,
    getTCRS?: boolean,
    getUnlinkTRS?: boolean,
  ): Promise<Page> {
    verify(limit, "'limit' must be specified");
    verify(typeof limit === 'number', "'limit' must be a number");
    verify(limit > 0, "'limit' must be greater than 0");

    if (!isStringAndNotEmpty(this._context)) {
      $log.warn('Uncontextualized Reference usage detected. For more consistent behavior always contextualize Reference objects.');
    }

    let uri = [this._location.service, 'catalog', this._location.catalog].join('/');
    const readPath = computeReadPath(this, useEntity, getTRS, getTCRS, getUnlinkTRS);
    if (readPath.isAttributeGroup) {
      uri += '/attributegroup/' + readPath.value;
    } else {
      uri += '/entity/' + readPath.value;
    }
    // add limit
    uri = uri + '?limit=' + (limit + 1); // read extra row, for determining whether the returned page has next/previous page

    // attach `this` (Reference) to a variable
    // `this` inside the Promise request is a Window object
    let action = 'read';
    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = { action: action };
    } else if (typeof contextHeaderParams.action === 'string') {
      action = contextHeaderParams.action;
    }
    const config = {
      headers: this._generateContextHeader(contextHeaderParams),
    };

    let response;
    try {
      response = await this._server.http.get(uri, config);
    } catch (e) {
      throw ErrorService.responseToError(e);
    }
    if (!Array.isArray(response.data)) {
      throw new InvalidServerResponse(uri, response.data, action);
    }

    const etag = HTTPService.getResponseHeader(response).etag;

    let hasPrevious,
      hasNext = false;
    if (!this._location.paging) {
      // first page
      hasPrevious = false;
      hasNext = response.data.length > limit;
    } else if (this._location.beforeObject) {
      // has @before()
      hasPrevious = response.data.length > limit;
      hasNext = true;
    } else {
      // has @after()
      hasPrevious = true;
      hasNext = response.data.length > limit;
    }

    // Because read() reads one extra row to determine whether the new page has previous or next
    // We need to remove those extra row of data from the result
    let extraData = {};
    if (response.data.length > limit) {
      // if no paging or @after, remove last row
      if (!this._location.beforeObject) {
        extraData = response.data[response.data.length - 1];
        response.data.splice(response.data.length - 1);
      } else {
        // @before, remove first row
        extraData = response.data[0];
        response.data.splice(0, 1);
      }
    }
    const page = new Page(this, etag, response.data, hasPrevious, hasNext, extraData);

    // we are paging based on @before (user navigated backwards in the set of data)
    // AND there is less data than limit implies (beginning of set) OR we got the right set of data (tuples.length == pageLimit) but there's no previous set (beginning of set)
    if (dontCorrectPage !== true && !this._location.afterObject && this._location.beforeObject && (page.tuples.length < limit || !page.hasPrevious)) {
      const referenceWithoutPaging = this.copy();
      referenceWithoutPaging._location.beforeObject = null;

      // remove the function and replace it with auto-reload
      const actionVerb = action.substring(action.lastIndexOf(';') + 1);
      let newActionVerb = 'auto-reload';
      // TODO (could be optimized)
      if (['load-domain', 'reload-domain'].indexOf(actionVerb) !== -1) {
        newActionVerb = 'auto-reload-domain';
      }
      contextHeaderParams.action = action.substring(0, action.lastIndexOf(';') + 1) + newActionVerb;
      return referenceWithoutPaging.read(limit, contextHeaderParams, useEntity, true);
    } else {
      return page;
    }
  }

  /**
   * Creates a set of tuples in the references relation. Note, this
   * operation sets the `defaults` list according to the table
   * specification, and not according to the contents of in the input
   * tuple.
   * @param data The array of data to be created as new tuples.
   * @param contextHeaderParams the object that we want to log.
   * @param skipOnConflict if true, it will not complain about conflict
   * @returns A promise resolved with a object containing `successful` and `failure` attributes.
   * Both are {@link Page} of results.
   * or rejected with any of the following errors:
   * - {@link InvalidInputError}: If `data` is not valid, or reference is not in `entry/create` context.
   * - {@link InvalidInputError}: If `limit` is invalid.
   * - ERMrestjs corresponding http errors, if ERMrest returns http error.
   */
  create(
    data: Record<string, unknown>[],
    contextHeaderParams?: any,
    skipOnConflict?: boolean,
  ): Promise<{ successful: Page; failed: Page | null; disabled: Page | null }> {
    try {
      // verify: data is not null, data has non empty tuple set
      verify(data, "'data' must be specified");
      verify(data.length > 0, "'data' must have at least one row to create");
      verify(this._context === _contexts.CREATE, "reference must be in 'entry/create' context.");

      return new Promise((resolve, reject) => {
        // get the defaults list for the referenced relation's table
        const defaults = this.getDefaults(data);

        // construct the uri
        let uri = this._location.ermrestCompactUri;
        for (let i = 0; i < defaults.length; i++) {
          uri += (i === 0 ? '?defaults=' : ',') + fixedEncodeURIComponent(defaults[i]);
        }
        if (skipOnConflict) {
          const qCharacter = defaults.length > 0 ? '&' : '?';
          uri += qCharacter + 'onconflict=skip';
        }

        if (isObject(contextHeaderParams) && Array.isArray(contextHeaderParams.stack)) {
          const stack = contextHeaderParams.stack;
          stack[stack.length - 1].num_created = data.length;
        }
        // create the context header params for log
        else if (!contextHeaderParams || !isObject(contextHeaderParams)) {
          contextHeaderParams = { action: 'create' };
        }
        const config = {
          headers: this._generateContextHeader(contextHeaderParams),
        };

        // do the 'post' call
        this._server.http
          .post(uri, data, config)
          .then((response: any) => {
            const etag = HTTPService.getResponseHeader(response).etag;
            // new page will have a new reference (uri that filters on a disjunction of ids of these tuples)
            let uri = this._location.compactUri + '/';
            let keyName: string;

            // loop through each returned Row and get the key value
            for (let j = 0; j < response.data.length; j++) {
              if (j !== 0) uri += ';';
              // shortest key is made up from one column
              if (this._shortestKey.length == 1) {
                keyName = this._shortestKey[0].name;
                uri += fixedEncodeURIComponent(keyName) + '=' + fixedEncodeURIComponent(response.data[j][keyName]);
              } else {
                uri += '(';
                for (let k = 0; k < this._shortestKey.length; k++) {
                  if (k !== 0) uri += '&';
                  keyName = this._shortestKey[k].name;
                  uri += fixedEncodeURIComponent(keyName) + '=' + fixedEncodeURIComponent(response.data[j][keyName]);
                }
                uri += ')';
              }
            }

            const ref = new Reference(parse(uri), this._table.schema.catalog);
            const contextualizedRef = response.data.length > 1 ? ref.contextualize.compactEntry : ref.contextualize.compact;
            // make a page of tuples of the results (unless error)
            const page = new Page(contextualizedRef, etag, response.data, false, false);

            // resolve the promise, passing back the page
            resolve({
              successful: page,
              failed: null,
              disabled: null,
            });
          })
          .catch((error: unknown) => {
            reject(ErrorService.responseToError(error, this));
          });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Updates a set of resources.
   * @param tuples array of tuple objects so that the new data nd old data can be used to determine key changes.
   * tuple.data has the new data
   * tuple._oldData has the data before changes were made
   * @param contextHeaderParams the object that we want to log.
   * @returns A promise resolved with a object containing:
   *  -  `successful`: Page of results that were stored.
   *  -  `failed`: Page of results that failed to be stored.
   *  -  `disabled`: Page of results that were not sent to ermrest (because of acl)
   * or rejected with any of these errors:
   * - {@link InvalidInputError}: If `limit` is invalid or reference is not in `entry/edit` context.
   * - ERMrestjs corresponding http errors, if ERMrest returns http error.
   */
  async update(tuples: Tuple[], contextHeaderParams?: any): Promise<{ successful: Page; failed: Page | null; disabled: Page | null }> {
    verify(Array.isArray(tuples), "'tuples' must be specified");

    // store the ones that cannot be updated and filter them out
    // from the tuples list that we use to generate the update request
    const disabledPageData: any[] = [];
    tuples = tuples.filter((t) => {
      if (!t.canUpdate) {
        disabledPageData.push(t.data);
      }
      return t.canUpdate;
    });

    verify(tuples.length > 0, "'tuples' must have at least one row to update");
    verify(this._context === _contexts.EDIT, "reference must be in 'entry/edit' context.");

    const urlEncode = fixedEncodeURIComponent;
    const oldAlias = '_o';
    const newAlias = '_n';

    const shortestKeyNames = this._shortestKey.map((column) => column.name);
    const encodedSchemaTableName = `${urlEncode(this.table.schema.name)}:${urlEncode(this.table.name)}`;

    let updateRequestURL = `${this.location.service}/catalog/${this.table.schema.catalog.id}/attributegroup/${encodedSchemaTableName}/`;

    const submissionData: any[] = []; // the list of submission data for updating
    const columnProjections: string[] = []; // the list of column names to use in the uri projection list
    let oldData: any;
    const allOldData: any[] = [];
    let newData: any;
    const allNewData: any[] = [];
    let keyName: string;

    // add column name into list of column projections if not in column projections set and data has changed
    const addProjection = (colName: string, colType: Type) => {
      // don't add a column name in if it's already there
      // this can be the case for multi-edit
      // and if the data is unchanged, no need to add the column name to the projections list
      if (columnProjections.indexOf(colName) !== -1) return;

      const oldVal = oldData[colName];
      const newVal = newData[colName];

      const typename = colType.rootName;
      const compareWithMoment = typename === 'date' || typename === 'timestamp' || typename === 'timestamptz';
      // test with moment if datetime column type and one of the 2 values are defined
      // NOTE: moment will test 2 null values as different even though they are both null
      if (compareWithMoment && (oldVal || newVal)) {
        const oldMoment = moment(oldData[colName]);
        const newMoment = moment(newData[colName]);

        if (!oldMoment.isSame(newMoment)) {
          columnProjections.push(colName);
        }
      } else if (oldData[colName] != newData[colName]) {
        columnProjections.push(colName);
      }
    };

    const addProjectionForColumnObject = (column: VisibleColumn) => {
      // If columns is a pusedo column
      if (column.isPseudo) {
        // If a column is an asset column then set values for
        // dependent properties like filename, bytes_count_column, md5 and sha
        if ((column as AssetPseudoColumn).isAsset) {
          const asset = column as AssetPseudoColumn;
          const isNull = newData[column.name] === null ? true : false;

          /* Populate all values in row depending on column from current asset */
          [asset.filenameColumn, asset.byteCountColumn, asset.md5, asset.sha256].forEach((assetColumn) => {
            // some metadata columns might not be defined.
            if (assetColumn && typeof assetColumn === 'object') {
              // If asset url is null then set the metadata also null
              if (isNull) newData[assetColumn.name] = null;
              addProjection(assetColumn.name, assetColumn.type);
            }
          });
          addProjection(column.name, column.type);
        } else if ((column as KeyPseudoColumn).isKey) {
          (column as KeyPseudoColumn).key.colset.columns.forEach((keyColumn) => {
            addProjection(keyColumn.name, keyColumn.type);
          });
        } else if ((column as ForeignKeyPseudoColumn).isForeignKey) {
          (column as ForeignKeyPseudoColumn).foreignKey.colset.columns.forEach((foreignKeyColumn) => {
            addProjection(foreignKeyColumn.name, foreignKeyColumn.type);
          });
        }
      } else {
        addProjection(column.name, column.type);
      }
    };

    // add data into submission data if in column projection set
    const addSubmissionData = (index: number, colName: string) => {
      // if the column is in the column projections list, add the data to submission data
      if (columnProjections.indexOf(colName) > -1) {
        submissionData[index][colName + newAlias] = newData[colName];
      }
    };

    const addSubmissionDataForColumnObject = (index: number, column: VisibleColumn) => {
      // If columns is a pusedo column
      if (column.isPseudo) {
        // If a column is an asset column then set values for
        // dependent properties like filename, bytes_count_column, md5 and sha
        if ((column as AssetPseudoColumn).isAsset) {
          const asset = column as AssetPseudoColumn;
          /* Populate all values in row depending on column from current asset */
          [asset.filenameColumn, asset.byteCountColumn, asset.md5, asset.sha256].forEach((assetColumn) => {
            // some metadata columns might not be defined.
            if (assetColumn && typeof assetColumn === 'object') addSubmissionData(index, assetColumn.name);
          });

          addSubmissionData(index, column.name);
        } else if ((column as KeyPseudoColumn).isKey) {
          (column as KeyPseudoColumn).key.colset.columns.forEach((keyColumn) => {
            addSubmissionData(index, keyColumn.name);
          });
        } else if ((column as ForeignKeyPseudoColumn).isForeignKey) {
          (column as ForeignKeyPseudoColumn).foreignKey.colset.columns.forEach((foreignKeyColumn) => {
            addSubmissionData(index, foreignKeyColumn.name);
          });
        }
      } else {
        addSubmissionData(index, column.name);
      }
    };

    // gets the key value based on which way the key was aliased.
    // use the new alias value for the shortest key first meaning the key was changed
    // if the new alias value is null, key wasn't changed so we can use the old alias
    const getAliasedKeyVal = (responseRowData: any, keyName: string) => {
      const isNotDefined = responseRowData[keyName + newAlias] === null || responseRowData[keyName + newAlias] === undefined;
      return isNotDefined ? responseRowData[keyName + oldAlias] : responseRowData[keyName + newAlias];
    };

    // loop through each tuple and the visible columns list for each to determine what columns to add to the projection set
    // If a column is changed in one tuple but not another, that column's value for every tuple needs to be present in the submission data
    tuples.forEach((t, tupleIndex) => {
      newData = t.data;
      oldData = t._oldData;

      // Collect all old and new data from all tuples to use in the event of a 412 error later
      allOldData.push(oldData);
      allNewData.push(newData);

      // Loop throught the visible columns list and see what data the user changed
      // if we saw changes to data, add the constituent columns to the projections list
      this.columns.forEach((column, colIndex) => {
        // if the column is disabled (generated or immutable), no need to add the column name to the projections list
        if (column.inputDisabled) {
          return;
        }

        // if column cannot be updated, no need to add the column to the projection list
        if (!tuples[tupleIndex].canUpdateValues[colIndex]) {
          return;
        }

        if (column.isInputIframe) {
          addProjectionForColumnObject(column);
          // make sure the columns in the input_iframe column mapping are also added to the projection list
          column.inputIframeProps?.columns.forEach((iframeColumn) => {
            addProjectionForColumnObject(iframeColumn);
          });
        } else {
          addProjectionForColumnObject(column);
        }
      });
    });

    if (columnProjections.length < 1) {
      throw new NoDataChangedError('No data was changed in the update request. Please check the form content and resubmit the data.');
    }

    /* This loop manages adding the values based on the columnProjections set and setting columns associated with asset columns properly */
    // loop through each tuple again and set the data value from the tuple in submission data for each column projection
    tuples.forEach((t, tupleIndex) => {
      newData = t.data;
      oldData = t._oldData;

      submissionData[tupleIndex] = {};

      shortestKeyNames.forEach((shortestKey) => {
        // shortest key should always be aliased in case that key value was changed
        // use a suffix of '_o' to represent the old value for the shortest key everything else gets '_n'
        submissionData[tupleIndex][shortestKey + oldAlias] = oldData[shortestKey];
      });

      // Loop through the columns, check if it's in columnProjections, and collect the necessary data for submission
      this.columns.forEach((column, colIndex) => {
        // if the column is disabled (generated or immutable), skip it
        if (column.inputDisabled) {
          return;
        }

        // if column cannot be updated for this tuple, skip it
        if (!tuples[tupleIndex].canUpdateValues[colIndex]) {
          return;
        }

        if (column.isInputIframe) {
          addSubmissionDataForColumnObject(tupleIndex, column);
          // make sure the values for columns in the input_iframe column mapping are also added
          column.inputIframeProps?.columns.forEach((iframeColumn) => {
            addSubmissionDataForColumnObject(tupleIndex, iframeColumn);
          });
        } else {
          addSubmissionDataForColumnObject(tupleIndex, column);
        }
      });
    });

    // always alias the keyset for the key data
    shortestKeyNames.forEach((shortestKey, j) => {
      if (j !== 0) updateRequestURL += ',';
      // alias all the columns for the key set
      updateRequestURL += fixedEncodeURIComponent(shortestKey) + oldAlias + ':=' + fixedEncodeURIComponent(shortestKey);
    });

    // the keyset is always aliased with the old alias, so make sure to include the new alias in the column projections
    columnProjections.forEach((colP, k) => {
      // Important NOTE: separator for denoting where the keyset ends and the update column set begins. The shortest key is used as the keyset
      updateRequestURL += k === 0 ? ';' : ',';
      // alias all the columns for the key set
      updateRequestURL += fixedEncodeURIComponent(colP) + newAlias + ':=' + fixedEncodeURIComponent(colP);
    });

    /**
     * We are going to add the following to the last element of stack in the logs:
     * {
     *   "num_updated": "number of updated rows"
     *   "updated_keys": "the summary of what's updated"
     * }
     */
    if (isObject(contextHeaderParams) && Array.isArray(contextHeaderParams.stack)) {
      const stack = contextHeaderParams.stack,
        numUpdated = submissionData.length;
      stack[stack.length - 1].num_updated = numUpdated;

      stack[stack.length - 1].updated_keys = {
        cols: shortestKeyNames,
        vals: allNewData.map((d) => shortestKeyNames.map((kname) => d[kname])),
      };
    } else if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = { action: 'update' };
    }

    const config = {
      headers: this._generateContextHeader(contextHeaderParams),
    };

    let response;
    try {
      response = await this._server.http.put(updateRequestURL, submissionData, config);
    } catch (error) {
      throw ErrorService.responseToError(error, this);
    }

    // Some data was not updated
    if (response.status === 200 && response.data.length < submissionData.length) {
      const updatedRows = response.data;
      // no data updated
      if (updatedRows.length === 0) {
        throw new ForbiddenError('403', 'Editing records for table: ' + this.table.name + ' is not allowed.');
      }
    }

    const etag = HTTPService.getResponseHeader(response).etag;
    const pageData: any[] = [];

    // loop through each returned Row and get the key value
    for (let j = 0; j < response.data.length; j++) {
      // response.data is sometimes in a different order
      // so collecting the data could be incorrect if we don't make sure the response data and tuple data are in the same order
      // the entity is updated properly just the data returned from this request is in a different order sometimes
      let rowIndexInSubData = -1;

      for (let t = 0; t < tuples.length && rowIndexInSubData === -1; t++) {
        // used to verify the number of matches for each shortest key value
        let matchCt = 0;
        for (let n = 0; n < shortestKeyNames.length; n++) {
          const shortKey = shortestKeyNames[n];
          const responseVal = getAliasedKeyVal(response.data[j], shortKey);

          // if the value is the same, use this t index for the pageData object
          if (tuples[t].data[shortKey] == responseVal) {
            // this comes into play when the shortest key is a set of column names
            // if the values match increase te counter
            matchCt++;
          }
        }
        // if our counter is the same length as the list of shortest key names, it's an exact match to the t tuple
        if (matchCt === shortestKeyNames.length) {
          rowIndexInSubData = t;
        }
      }

      pageData[rowIndexInSubData] = {};

      // unalias the keys for the page data
      Object.keys(response.data[j]).forEach((columnAlias) => {
        if (columnAlias.endsWith(newAlias)) {
          // alias is always at end and length 2
          const columnName = columnAlias.slice(0, columnAlias.length - newAlias.length);
          pageData[rowIndexInSubData][columnName] = response.data[j][columnAlias];
        }
      });
    }

    // NOTE: ermrest returns only some of the column data.
    // make sure that pageData has all the submitted and updated data
    for (let i = 0; i < tuples.length; i++) {
      for (const j in tuples[i]._oldData) {
        if (!Object.prototype.hasOwnProperty.call(tuples[i]._oldData, j)) continue;
        if (j in pageData[i]) continue; // pageData already has this data
        pageData[i][j] = tuples[i]._oldData![j]; // add the missing data
      }
    }

    // build the url using the helper function
    const keyValueRes = generateKeyValueFilters(
      this.table.shortestKey,
      pageData,
      this.table.schema.catalog,
      -1, // we don't want to check the url length here, chaise will check it
      this.table.displayname.value,
    );
    // NOTE this will not happen since ermrest only accepts not-null keys,
    // but added here for completeness
    if (!keyValueRes.successful) {
      throw new InvalidInputError(keyValueRes.message as string);
    }

    let refUri = `${this._location.service}/catalog/${this.table.schema.catalog.id}/entity/${encodedSchemaTableName}`;
    refUri += '/' + keyValueRes.filters!.map((f) => f.path).join('/');
    let ref = new Reference(parse(refUri), this._table.schema.catalog).contextualize.compactEntry;
    ref = response.data.length > 1 ? ref.contextualize.compactEntry : ref.contextualize.compact;
    const successfulPage = new Page(ref, etag, pageData, false, false);
    let failedPage = null,
      disabledPage = null;

    // if the returned page is smaller than the initial page,
    // then some of the columns failed to update.
    if (tuples.length > successfulPage.tuples.length) {
      const failedPageData = [];
      for (let i = 0; i < tuples.length; i++) {
        let rowMatch = false;

        for (let j = 0; j < successfulPage.tuples.length; j++) {
          let keyMatch = true;

          for (let k = 0; k < shortestKeyNames.length; k++) {
            keyName = shortestKeyNames[k];
            if (tuples[i].data[keyName] === successfulPage.tuples[j].data[keyName]) {
              // these keys don't match, go for the next tuple
              keyMatch = false;
              break;
            }
          }

          if (keyMatch) {
            // all the key columns match, then rows match.
            rowMatch = true;
            break;
          }
        }

        if (!rowMatch) {
          // didn't find a match, so add as failed
          failedPageData.push(tuples[i].data);
        }
      }
      failedPage = new Page(ref, etag, failedPageData, false, false);
    }

    if (disabledPageData.length > 0) {
      disabledPage = new Page(ref, etag, disabledPageData, false, false);
    }

    return {
      successful: successfulPage,
      failed: failedPage,
      disabled: disabledPage,
    };
  }

  /**
   * Deletes the referenced resources or the given tuples.
   * NOTE This will ignore the provided sort and paging on the reference, make
   * sure you are calling this on specific set or rows (filtered).
   *
   * @param tuples (optional) the tuples that should be deleted
   * @param contextHeaderParams (optional) the object that we want to log.
   * @returns A promise resolved with empty object or rejected with any of these errors:
   * - ERMrestjs corresponding http errors, if ERMrest returns http error.
   */
  delete(tuples?: Tuple[], contextHeaderParams?: any): Promise<void | BatchDeleteResponse> {
    const delFlag = _operationsFlag.DELETE;
    const useTuples = Array.isArray(tuples) && tuples.length > 0;

    /**
     * NOTE: previous implemenation of delete with 412 logic is here:
     * https://github.com/informatics-isi-edu/ermrestjs/commit/5fe854118337e0a63c6f91b4f3e139e7eadc42ac
     *
     * We decided to drop the support for 412, because the etag that we get from the read function
     * is different than the one delete expects. The reason for that is because we are getting etag
     * in read with joins in the request, which affects the etag. etag is in response to any change
     * to the returned data and since join introduces extra data it is different than a request
     * without any joins.
     *
     * github issue: #425
     */

    return new Promise((resolve, reject) => {
      /**
       * We are going to add the following to the last element of stack in the logs:
       * {
       *   "num_deleted": "number of deleted rows"
       *   "deleted_keys": "the summary of what's deleted"
       * }
       */
      if (isObject(contextHeaderParams) && Array.isArray(contextHeaderParams.stack) && useTuples) {
        const stack = contextHeaderParams.stack;
        const shortestKeyNames = this._shortestKey.map((column) => column.name);
        stack[stack.length - 1].num_deleted = tuples.length;
        stack[stack.length - 1].deleted_keys = {
          cols: shortestKeyNames,
          vals: tuples.map((t) => shortestKeyNames.map((kname) => t.data[kname])),
        };
      } else if (!contextHeaderParams || !isObject(contextHeaderParams)) {
        contextHeaderParams = { action: 'delete' };
      }
      const config = {
        headers: this._generateContextHeader(contextHeaderParams),
      };

      if (!useTuples) {
        // delete the reference
        this._server.http
          .delete(this.location.ermrestCompactUri, config)
          .then(() => {
            resolve();
          })
          .catch((catchError: unknown) => {
            reject(ErrorService.responseToError(catchError, this, delFlag));
          });

        return;
      } else {
        // construct the url based on the given tuples
        let successTupleData: any[] = [];
        let failedTupleData: any[] = [];
        const deleteSubmessage: string[] = [];

        const encode = fixedEncodeURIComponent;
        const schemaTable = encode(this.table.schema.name) + ':' + encode(this.table.name);
        const deletableData: any[] = [];
        const nonDeletableTuples: string[] = [];

        tuples.forEach((t, index) => {
          if (t.canDelete) {
            deletableData.push(t.data);
          } else {
            failedTupleData.push(t.data);
            nonDeletableTuples.push('- Record number ' + (index + 1) + ': ' + t.displayname.value);
          }
        });

        if (nonDeletableTuples.length > 0) {
          deleteSubmessage.push('The following records could not be deleted based on your permissions:\n' + nonDeletableTuples.join('\n'));
        }

        // if none of the rows could be deleted, just return now.
        if (deletableData.length === 0) {
          resolve(new BatchDeleteResponse(successTupleData, failedTupleData, deleteSubmessage.join('\n')));
          return;
        }

        // might throw an error
        const keyValueRes = generateKeyValueFilters(
          this.table.shortestKey,
          deletableData,
          this.table.schema.catalog,
          schemaTable.length + 1,
          this.displayname.value as string,
        );
        if (!keyValueRes.successful) {
          return reject(new InvalidInputError(keyValueRes.message ? keyValueRes.message : ''));
        }

        const recursiveDelete = (index: number) => {
          const currFilter = keyValueRes.filters![index];
          const url = [this.location.service, 'catalog', this.location.catalog, 'entity', schemaTable, currFilter.path].join('/');

          this._server.http
            .delete(url, config)
            .then(() => {
              successTupleData = successTupleData.concat(currFilter.keyData);
            })
            .catch((err: unknown) => {
              failedTupleData = failedTupleData.concat(currFilter.keyData);
              deleteSubmessage.push(ErrorService.responseToError(err, this, delFlag).message);
            })
            .finally(() => {
              if (index < keyValueRes.filters!.length - 1) {
                recursiveDelete(index + 1);
              } else {
                resolve(new BatchDeleteResponse(successTupleData, failedTupleData, deleteSubmessage.join('\n')));
                return;
              }
            });
        };

        recursiveDelete(0);
      }
    });
  }

  /**
   * create a new instance with the same properties.
   *
   * you can customized the properties of the new instance by passing new ones to this function.
   * You must pass undefined for other props that you don't want to change.
   */
  copy(displayname?: DisplayName, comment?: CommentType, pseudoColumn?: VisibleColumn): Reference {
    const ref = new Reference(
      this.location,
      this.location.catalogObject,
      typeof displayname !== 'undefined' ? displayname : this._displayname,
      typeof comment !== 'undefined' ? comment : this._comment,
      typeof pseudoColumn !== 'undefined' ? pseudoColumn : this._pseudoColumn,
    );

    ref.setContext(this.context);
    return ref;
  }

  /**
   * return the columns that we should add to the defaults list during creation
   * @private
   */
  private getDefaults(data: Record<string, unknown>[]): string[] {
    const defaults: string[] = [];
    this.table.columns.all().forEach((col) => {
      // ignore the columns that user doesn't have insert access for.
      // This is to avoid ermrest from throwing any errors.
      //
      // NOTE At first we were ignoring any disabled inputs.
      // While ignoring value for disabled inputs might sound logical,
      // there are some disabled inputs that chaise is actually going to generate
      // value for and we need to store them. At the time of writing this comment,
      // this is only true for the asset's filename, md5, etc. columns.
      // In most deployments they are marked as generated and the expectation
      // would be that chaise/ermrestjs should generate the value.
      // The misconception here is the generated definition in the annotation.
      // by generated we mean chaise/ERMrestjs generated not necessarily database generated.
      // the issue: https://github.com/informatics-isi-edu/ermrestjs/issues/722
      if (col.rights.insert === false) {
        defaults.push(col.name);
        return;
      }

      // if default is null, don't add it.
      // this is just to reduce the size of defaults. adding them
      // is harmless but it's not necessary. so we're just not going
      // to add them to make the default list shorter
      // NOTE we added nullok check because of a special case that we found.
      // In this case the column was not-null, no default value, and the value
      // was being populated by trigger. So we have to add the column to the default
      // list so ermrest doesn't throw the error.
      // if a column is not-null, we need to actually check for the value. if the value
      // is null, not adding it to the default list will always result in ermrest error.
      // But adding it to the default list might succeed (if the column has trigger for value)
      if (col.ermrestDefault == null && col.nullok) return;

      // add columns that their value is missing in all the rows
      let missing = true;
      for (let i = 0; i < data.length; i++) {
        // at least one of the rows has value for it
        if (data[i][col.name] !== undefined && data[i][col.name] !== null) {
          missing = false;
          break;
        }
      }
      if (missing) defaults.push(col.name);
    });

    return defaults;
  }
}
