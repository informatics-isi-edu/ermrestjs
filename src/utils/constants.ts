export enum _ERMrestFeatures {
  TABLE_RIGHTS_SUMMARY = 'trs',
  TABLE_COL_RIGHTS_SUMMARY = 'tcrs',
  QUANTIFIED_VALUE_LISTS = 'quantified_value_lists',
  QUANTIFIED_RID_LISTS = 'quantified_rid_lists',
}
export enum _ERMrestACLs {
  SELECT = 'select',
  INSERT = 'insert',
  DELETE = 'delete',
  UPDATE = 'update',
  COLUMN_UPDATE = 'column_update',
}

export enum _parserAliases {
  MAIN_TABLE = 'M',
  JOIN_TABLE_PREFIX = 'T',
  FOREIGN_KEY_PREFIX = 'F',
  ASSOCIATION_TABLE = 'A',
}

export const URL_PATH_LENGTH_LIMIT = 4000;

/**
 * @desc Maximum allowed length of the context header that ermrestjs sends with each request.
 * If the length of a context heeader goes over the limit, we will try to truncate it.
 */
export const CONTEXT_HEADER_LENGTH_LIMIT = 6500;

export const FILE_PREVIEW = {
  PREFETCH_BYTES: 0.5 * 1024 * 1024,
  MAX_FILE_SIZE: 1 * 1024 * 1024,
};

export enum _constraintTypes {
  KEY = 'k',
  FOREIGN_KEY = 'fk',
}

/**
 * list of annotations that ERMrestJS supports
 */
export const _annotations = {
  APP_LINKS: 'tag:isrd.isi.edu,2016:app-links',
  ASSET: 'tag:isrd.isi.edu,2017:asset',
  CHAISE_CONFIG: 'tag:isrd.isi.edu,2019:chaise-config',
  CITATION: 'tag:isrd.isi.edu,2018:citation',
  COLUMN_DEFAULTS: 'tag:isrd.isi.edu,2023:column-defaults',
  COLUMN_DISPLAY: 'tag:isrd.isi.edu,2016:column-display',
  DISPLAY: 'tag:misd.isi.edu,2015:display',
  EXPORT: 'tag:isrd.isi.edu,2016:export',
  EXPORT_CONTEXTED: 'tag:isrd.isi.edu,2019:export',
  EXPORT_FRAGMENT_DEFINITIONS: 'tag:isrd.isi.edu,2021:export-fragment-definitions',
  FOREIGN_KEY: 'tag:isrd.isi.edu,2016:foreign-key',
  GENERATED: 'tag:isrd.isi.edu,2016:generated',
  GOOGLE_DATASET_METADATA: 'tag:isrd.isi.edu,2021:google-dataset',
  HIDDEN: 'tag:misd.isi.edu,2015:hidden', //TODO deprecated and should be deleted.
  HISTORY_CAPTURE: 'tag:isrd.isi.edu:2020,history-capture',
  IGNORE: 'tag:isrd.isi.edu,2016:ignore', //TODO should not be used in column and foreign key
  IMMUTABLE: 'tag:isrd.isi.edu,2016:immutable',
  KEY_DISPLAY: 'tag:isrd.isi.edu,2017:key-display',
  NON_DELETABLE: 'tag:isrd.isi.edu,2016:non-deletable',
  REQUIRED: 'tag:isrd.isi.edu,2018:required',
  SOURCE_DEFINITIONS: 'tag:isrd.isi.edu,2019:source-definitions',
  TABLE_ALTERNATIVES: 'tag:isrd.isi.edu,2016:table-alternatives',
  TABLE_CONFIG: 'tag:isrd.isi.edu,2021:table-config',
  TABLE_DISPLAY: 'tag:isrd.isi.edu,2016:table-display',
  VISIBLE_COLUMNS: 'tag:isrd.isi.edu,2016:visible-columns',
  VISIBLE_FOREIGN_KEYS: 'tag:isrd.isi.edu,2016:visible-foreign-keys',
};

/**
 * List of contexts that ERMrestJS supports.
 */
export const _contexts = {
  COMPACT: 'compact',
  COMPACT_BRIEF: 'compact/brief',
  COMPACT_BRIEF_INLINE: 'compact/brief/inline',
  COMPACT_ENTRY: 'compact/entry', // post create/edit for multiple rows
  COMPACT_SELECT: 'compact/select',
  COMPACT_SELECT_ASSOCIATION: 'compact/select/association',
  COMPACT_SELECT_ASSOCIATION_LINK: 'compact/select/association/link',
  COMPACT_SELECT_ASSOCIATION_UNLINK: 'compact/select/association/unlink',
  COMPACT_SELECT_FOREIGN_KEY: 'compact/select/foreign_key',
  COMPACT_SELECT_BULK_FOREIGN_KEY: 'compact/select/foreign_key/bulk',
  COMPACT_SELECT_SAVED_QUERIES: 'compact/select/saved_queries',
  COMPACT_SELECT_SHOW_MORE: 'compact/select/show_more',
  CREATE: 'entry/create',
  DETAILED: 'detailed',
  EDIT: 'entry/edit',
  ENTRY: 'entry',
  EXPORT: 'export',
  EXPORT_COMPACT: 'export/compact',
  EXPORT_DETAILED: 'export/detailed',
  FILTER: 'filter',
  DEFAULT: '*',
  ROWNAME: 'row_name',
};

export const _dataFormats = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: {
    display: 'YYYY-MM-DD HH:mm:ss',
    return: 'YYYY-MM-DDTHH:mm:ssZ', // the format that the database returns when there are no fractional seco`nds to show
    submission: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  },
};

export const _contextArray = [
  'compact',
  'compact/brief',
  'compact/entry',
  'compact/select',
  'compact/select/association',
  'compact/select/association/link',
  'compact/select/association/unlink',
  'compact/select/foreign_key',
  'compact/select/saved_queries',
  'compact/select/show_more',
  'entry/create',
  'detailed',
  'entry/edit',
  'entry',
  'filter',
  '*',
  'row_name',
  'compact/brief/inline',
];

export const _entryContexts = [_contexts.CREATE, _contexts.EDIT, _contexts.ENTRY];
export const _compactContexts = [
  _contexts.COMPACT,
  _contexts.COMPACT_BRIEF,
  _contexts.COMPACT_BRIEF_INLINE,
  _contexts.COMPACT_SELECT,
  _contexts.COMPACT_SELECT_ASSOCIATION,
  _contexts.COMPACT_SELECT_ASSOCIATION_LINK,
  _contexts.COMPACT_SELECT_ASSOCIATION_UNLINK,
  _contexts.COMPACT_SELECT_FOREIGN_KEY,
  _contexts.COMPACT_SELECT_SAVED_QUERIES,
  _contexts.COMPACT_SELECT_SHOW_MORE,
  _contexts.COMPACT_ENTRY,
];

// NOTE: array is in order from parent context to more specific sub contexts for purposes of inheritence checking
export const _compactFacetingContexts = [
  _contexts.COMPACT,
  _contexts.COMPACT_SELECT,
  _contexts.COMPACT_SELECT_ASSOCIATION,
  _contexts.COMPACT_SELECT_ASSOCIATION_LINK,
  _contexts.COMPACT_SELECT_ASSOCIATION_UNLINK,
  _contexts.COMPACT_SELECT_FOREIGN_KEY,
  _contexts.COMPACT_SELECT_SAVED_QUERIES,
  _contexts.COMPACT_SELECT_SHOW_MORE,
];

export const _tableKinds = {
  TABLE: 'table',
  VIEW: 'view',
};

/**
 * List of display type for table-display annotation
 */
export const _displayTypes = Object.freeze({
  TABLE: 'table',
  MARKDOWN: 'markdown',
  MODULE: 'module',
});

export const _nonSortableTypes = [
  /**
   * sorting json and jsonb columns is expensive and doesn't produce a meaningful sort. that's why we're marking
   * these columns as non-sortable
   */
  'json',
  'jsonb',
];

// column types that their value should be considered as HTML
export const _HTMLColumnType = ['markdown', 'color_rgb_hex'];

// types we support for our plotly histogram graphs
export const _histogramSupportedTypes = [
  'int2',
  'int4',
  'int8',
  'float',
  'float4',
  'float8',
  'numeric',
  'serial2',
  'serial4',
  'serial8',
  'timestamptz',
  'timestamp',
  'date',
];

// these types should be ignored for usage in heuristic for facet
export const _facetHeuristicIgnoredTypes = ['markdown', 'longtext', 'serial2', 'serial4', 'serial8', 'jsonb', 'json'];

export const _serialTypes = ['serial', 'serial2', 'serial4', 'serial8'];

// these types are not allowed for faceting (heuristic or annotation)
export const _facetUnsupportedTypes = ['json'];

export const _foreignKeyInputModes = ['facet-search-popup', 'simple-search-dropdown'];

export const _facetUXModes: Record<string, string> = {
  CHOICE: 'choices',
  RANGE: 'ranges',
  PRESENCE: 'check_presence',
};

export const _facetUXModeNames: string[] = Object.keys(_facetUXModes).map(function (k) {
  return _facetUXModes[k];
});

export const _facetFilterTypes: Record<string, string> = Object.freeze({
  CHOICE: 'choices',
  RANGE: 'ranges',
  SEARCH: 'search',
});

export const _facetFilterTypeNames = Object.keys(_facetFilterTypes).map(function (k) {
  return _facetFilterTypes[k];
});

export const _pseudoColAggregateFns = ['min', 'max', 'cnt', 'cnt_d', 'array', 'array_d'];
export const _pseudoColEntityAggregateFns = ['array', 'array_d'];
export const _pseudoColAggregateNames = ['Min', 'Max', '#', '#', '', ''];
export const _pseudoColAggregateExplicitName = ['Minimum', 'Maximum', 'Number of', 'Number of distinct', 'List of', 'List of distinct'];

export const _systemColumns = ['RID', 'RCB', 'RMB', 'RCT', 'RMT'];
export const _systemColumnNames = Object.freeze({
  RID: 'RID',
  RCB: 'RCB',
  RMB: 'RMB',
  RCT: 'RCT',
  RMT: 'RMT',
});

// NOTE: currently we only ignore the system columns
export const _ignoreDefaultsNames = _systemColumns;

export const contextHeaderName = 'Deriva-Client-Context';

export const HANDLEBARS = 'handlebars';

export const TEMPLATE_ENGINES = Object.freeze({
  HANDLEBARS: 'handlebars',
  MUSTACHE: 'mustache',
});

export const _handlebarsHelpersList = [
  // default helpers - NOTE: 'log' and 'lookup' not included
  'blockHelperMissing',
  'each',
  'if',
  'helperMissing',
  'unless',
  'with',
  'lookup',
  // ermrestJS helpers
  'eq',
  'ne',
  'lt',
  'gt',
  'lte',
  'gte',
  'and',
  'or',
  'not',
  'ifCond',
  'escape',
  'encode',
  'formatDatetime',
  'formatDate',
  'encodeFacet',
  'regexMatch',
  'regexFindFirst',
  'regexFindAll',
  'jsonStringify',
  'toTitleCase',
  'replace',
  'humanizeBytes',
  'printf',
  'stringLength',
  'isUserInAcl',
  'snapshotToDatetime',
  'datetimeToSnapshot',
  // math helpers
  'add',
  'subtract',
];

export const _operationsFlag = Object.freeze({
  DELETE: 'DEL', //delete
  CREATE: 'CRT', //create
  UPDATE: 'UPDT', //update
  READ: 'READ', //read
});

export const _specialPresentation = Object.freeze({
  NULL: '*No value*',
  EMPTY_STR: '*Empty*',
});

export const _errorStatus = Object.freeze({
  TIME_OUT: 'Request Timeout',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Item Not Found',
  CONFLICT: 'Conflict',
  PRECONDITION_FAILED: 'Precondition Failed',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  BAD_GATEWAY: 'Bad Gateway',
  SERVIVE_UNAVAILABLE: 'Service Unavailable',
  INVALID_FACET: 'Invalid Facet Filters',
  INVALID_CUSTOM_FACET: 'Invalid Custom Facet Filteres',
  INVALID_FILTER: 'Invalid Filter',
  INVALID_INPUT: 'Invalid Input',
  INVALID_URI: 'Invalid URI',
  BATCH_UNLINK: 'Batch Unlink Summary',
  BATCH_DELETE: 'Batch Delete Summary',
  NO_DATA_CHANGED: 'No Data Changed',
  NO_CONNECTION_ERROR: 'No Connection Error',
  INVALID_SORT: 'Invalid Sort Criteria',
  INVALID_PAGE: 'Invalid Page Criteria',
  INVALID_SERVER_RESPONSE: 'Invalid Server Response',
  UNSUPPORTED_FILTERS: 'Unsupported Filters',
  SNAPSHOT_NOT_FOUND: 'Snapshot Not Found',
});

export const _errorMessage = Object.freeze({
  UNSUPPORTED_FILTERS:
    'Some (or all) externally supplied filter criteria cannot be implemented with the current catalog content. ' +
    'This may be due to lack of permissions or changes made to the content since the criteria were initially saved.',
  INVALID_FACET: 'Given encoded string for facets is not valid.',
  INVALID_CUSTOM_FACET: 'Given encoded string for cfacets is not valid.',
  INVALID_FACET_OR_FILTER: 'Given filter or facet is not valid.',
  INTERNAL_SERVER_ERROR: 'An unexpected error has occurred. Please report this problem to your system administrators.',
  NO_CONNECTION_ERROR: 'Unable to connect to the server.',
});

export const _facetingErrors = Object.freeze({
  invalidString: 'Given encoded string cannot be decoded.',
  invalidFacet: 'Facet description is invalid.',
  invalidBooleanOperator: 'Only conjunction of facets is supported currently.',
  invalidSource: 'Missing or invalid `source` attribute.',
  invalidChoice: 'invalid choices value.',
  invalidRange: 'invalid ranges value.',
  invalidSearch: 'invalid search value.',
  missingConstraints: 'No constraints are defined for the facet.',
  onlyOneNullFilter: 'Only one null filter is allowed in the facets',
  duplicateFacets: 'Cannot define two different sets of facets',
  invalidSourcekey: 'Given sourcekey string is not valid',
  aggregateFnNowtAllowed: 'Aggregate functions are not allowed in facet source definition.',
  arrayColumnTypeNotSupported: 'Facet of array column types are not supported.',
});

export const _HTTPErrorCodes = Object.freeze({
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT_ERROR: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVIVE_UNAVAILABLE: 503,
});

export const _warningMessages = Object.freeze({
  NO_PSEUDO_IN_ENTRY: 'pseudo-columns are not allowed in entry contexts.',
  INVALID_FACET_ENTRY: 'given value must be an object with either `source` or `sourcekey` defined.',
  INVALID_SOURCE: 'given object is invalid. `source` is required and it must be valid',
  INVALID_SOURCEKEY: 'given object is invalid. The defined `sourcekey` is invalid.',
  INVALID_VIRTUAL_NO_NAME: '`markdown_name` is required when `source` and `sourcekey` are undefiend.',
  INVALID_VIRTUAL_NO_VALUE: '`display.markdown_pattern` is required when `source` and `sourcekey` are undefiend.',
  INVALID_BOTH_SOURCE: 'given object is invalid. only one of `source` or `sourcekey` are allowed not both.',
  DUPLICATE_COLUMN: 'ignoring duplicate column definition.',
  DUPLICATE_KEY: 'ignoring duplicate key definition.',
  DUPLICATE_FK: 'ignoring duplicate foreign key definition.',
  DUPLICATE_PC: 'ignoring duplicate pseudo-column definition.',
  INVALID_COLUMN: 'column name must be a string.',
  INVALID_AGG: 'given aggregate function is invalid.',
  NO_SCALAR_AGG_IN_ENT: 'scalar aggreagte functions are not allowed in entity mode',
  FK_NOT_RELATED: 'given foreignkey is not inbound or outbound related to the table.',
  INVALID_FK: 'given foreignkey definition is invalid.',
  INVALID_FK_NO_INBOUND: 'given foreignkey path definiton cannot be all-outbound.',
  AGG_NOT_ALLOWED: 'aggregate functions are not allowed here.',
  MULTI_SCALAR_NEED_AGG: 'aggregate functions are required for scalar inbound-included paths.',
  MULTI_ENT_NEED_AGG: 'aggregate functions are required for entity inbound-included paths in non-detailed contexts.',
  NO_AGG_IN_ENTRY: 'aggregate functions are not allowed in entry contexts.',
  NO_PATH_IN_ENTRY: 'pseudo columns with path are not allowed in entry contexts (only single outbound path is allowed).',
  INVALID_SELF_LINK: 'given source is not a valid self-link (must be unique not-null).',
  INVALID_COLUMN_DEF: 'column definiton must be an array, object, or string.',
  INVALID_COLUMN_IN_SOURCE_PATH: 'end column in the path is not valid (not available in the end table)',
  NO_INBOUND_IN_NON_DETAILED: 'inline table is not valid in this context.',
  FILTER_NOT_ALLOWED: 'filter in source is only supported in `filter` context of visible-columns',
  FILTER_NO_PATH_NOT_ALLOWED: 'filter in source is not supported with local columns or all-outbound paths.',
  USED_IN_IFRAME_INPUT: 'the column already used in another column mapping.',
});

export const _permissionMessages = Object.freeze({
  TABLE_VIEW: 'Table is a view.',
  TABLE_GENERATED: 'Table is generated.',
  TABLE_IMMUTABLE: 'Table is immutable.',
  NO_CREATE: 'No permissions to create.',
  NO_UPDATE: 'No permissions to update.',
  DISABLED_COLUMNS: 'All columns are disabled.',
  NO_UPDATE_ROW: 'No row-level permission to update.',
  NO_UPDATE_COLUMN: 'No visible column can be updated',
});

export const _defaultColumnComment = Object.freeze({
  RID: 'Persistent, citable resource identifier',
  RCB: 'Record creator',
  RMB: 'Record last modifier',
  RCT: 'Record creation timestamp',
  RMT: 'Record last modified timestamp',
});

export const _commentDisplayModes = Object.freeze({
  inline: 'inline',
  tooltip: 'tooltip',
});

/**
 * List of logical operators that parser accepts in JSON facets.
 * @type {Object}
 */
export const _FacetsLogicalOperators = Object.freeze({
  AND: 'and',
  OR: 'or',
});

export const _ERMrestLogicalOperators = Object.freeze({
  AND: '&',
  OR: ';',
});

export const _ERMrestFilterPredicates = Object.freeze({
  NULL: '::null::',
  EQUAL: '=',
  LESS_THAN: '::lt::',
  LESS_THAN_OR_EQUAL_TO: '::leq::',
  GREATER_THAN: '::gt::',
  GREATER_THAN_OR_EQUAL_TO: '::geq::',
  REG_EXP: '::regexp::',
  CASE_INS_REG_EXP: '::ciregexp::',
  TEXT_SEARCH: '::ts::',
});

// the attributes that cannot be changed when using sourcekey
export const _sourceDefinitionAttributes = ['source'];

export const _classNames = Object.freeze({
  externalLink: 'external-link',
  externalLinkIcon: 'external-link-icon',
  noExternalLinkIcon: 'no-external-link-icon',
  assetPermission: 'asset-permission',
  postLoad: '-chaise-post-load',
  hideInPrintMode: 'hide-in-print',
  showInPrintMode: 'video-info-in-print',
  colorPreview: 'chaise-color-preview',
  imagePreview: 'chaise-image-preview',
});

export const _specialSourceDefinitions = Object.freeze({
  SEARCH_BOX: 'search-box',
});

export const _shorterVersion = Object.freeze({
  alias: 'a',
  inbound: 'i',
  outbound: 'o',
  remote_schema: 'r_s',
  remote_table: 'r_t',
  remote_columns: 'r_c',
  local_columns: 'l_c',
  local_to_remote_columns: 'n_to_f_c',
  source: 'src',
  sourcekey: 'key',
  choices: 'ch',
  ranges: 'r',
  search: 's',
  filter: 'f',
  and: 'and',
  or: 'or',
  operand_pattern: 'opd',
  operand_pattern_processed: 'opd_p',
  operator: 'opr',
  negate: 'n',
});

export const _sourceProperties = Object.freeze({
  SOURCEKEY: 'sourcekey',
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  FILTER: 'filter',
  AND: 'and',
  OR: 'or',
  OPERATOR: 'operator',
  OPERAND_PATTERN: 'operand_pattern',
  NEGATE: 'negate',
  LOCAL_SCHEMA: 'local_schema',
  LOCAL_TABLE: 'local_table',
  REMOTE_SCHEMA: 'remote_schema',
  REMOTE_TABLE: 'remote_table',
  LOCAL_COLUMNS: 'local_columns',
  REMOTE_COLUMNS: 'remote_columns',
  LOCAL_TO_REMOTE_COLUMNS: 'local_to_remote_columns',
});

export const _exportKnownAPIs = ['entity', 'attribute', 'attributegroup', 'aggregate'];

export const FILTER_TYPES = Object.freeze({
  BINARYPREDICATE: 'BinaryPredicate',
  CONJUNCTION: 'Conjunction',
  DISJUNCTION: 'Disjunction',
  UNARYPREDICATE: 'UnaryPredicate',
  NEGATION: 'Negation',
});

const isDefinedAndNotNull = (value: unknown) => typeof value !== 'undefined' && value !== null;

export const ENV_IS_NODE = typeof process !== 'undefined' && isDefinedAndNotNull(process.versions) && isDefinedAndNotNull(process.versions.node);

export const ENV_IS_DEV_MODE = process.env.NODE_ENV === 'development';
