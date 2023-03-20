    module._ERMrestFeatures = Object.freeze({
        TABLE_RIGHTS_SUMMARY: "trs",
        TABLE_COL_RIGHTS_SUMMARY: "tcrs",
        QUANTIFIED_VALUE_LISTS: "quantified_value_lists",
        QUANTIFIED_RID_LISTS : "quantified_rid_lists"
    });

    module._ERMrestACLs = Object.freeze({
        SELECT: "select",
        INSERT: "insert",
        DELETE: "delete",
        UPDATE: "update",
        COLUMN_UPDATE: "column_update"
    });

    module._parserAliases = Object.freeze({
        MAIN_TABLE: "M",
        JOIN_TABLE_PREFIX: "T",
        FOREIGN_KEY_PREFIX: "F",
        ASSOCIATION_TABLE: "A"
    });

    // for more information on url length limit refer to the following issue:
    // https://github.com/informatics-isi-edu/chaise/issues/1669
    module.URL_PATH_LENGTH_LIMIT = 4000;
    var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
    if (!isNode) {
        var isIE = /*@cc_on!@*/ false || !!document.documentMode, // Internet Explorer 6-11
            isEdge = !isIE && !!window.StyleMedia; // Edge
        if (isIE || isEdge) {
            module.URL_PATH_LENGTH_LIMIT = 2000;
        }
    }

    /**
     * @desc Maximum allowed length of the context header that ermrestjs sends with each request.
     * If the length of a context heeader goes over the limit, we will try to truncate it.
     */
    module.CONTEXT_HEADER_LENGTH_LIMIT = 6500;

    module._constraintTypes = Object.freeze({
        KEY: "k",
        FOREIGN_KEY: "fk"
    });

    /**
     * @desc List of annotations that ERMrestJS supports.
     * @private
     */
    module._annotations = Object.freeze({
        APP_LINKS: "tag:isrd.isi.edu,2016:app-links",
        ASSET: "tag:isrd.isi.edu,2017:asset",
        CHAISE_CONFIG: "tag:isrd.isi.edu,2019:chaise-config",
        CITATION: "tag:isrd.isi.edu,2018:citation",
        COLUMN_DEFAULTS: "tag:isrd.isi.edu,2023:column-defaults",
        COLUMN_DISPLAY: "tag:isrd.isi.edu,2016:column-display",
        DISPLAY: "tag:misd.isi.edu,2015:display",
        EXPORT: "tag:isrd.isi.edu,2016:export",
        EXPORT_CONTEXTED: "tag:isrd.isi.edu,2019:export",
        EXPORT_FRAGMENT_DEFINITIONS: "tag:isrd.isi.edu,2021:export-fragment-definitions",
        FOREIGN_KEY: "tag:isrd.isi.edu,2016:foreign-key",
        GENERATED: "tag:isrd.isi.edu,2016:generated",
        GOOGLE_DATASET_METADATA: "tag:isrd.isi.edu,2021:google-dataset",
        HIDDEN: "tag:misd.isi.edu,2015:hidden", //TODO deprecated and should be deleted.
        HISTORY_CAPTURE: "tag:isrd.isi.edu:2020,history-capture",
        IGNORE: "tag:isrd.isi.edu,2016:ignore", //TODO should not be used in column and foreign key
        IMMUTABLE: "tag:isrd.isi.edu,2016:immutable",
        KEY_DISPLAY: "tag:isrd.isi.edu,2017:key-display",
        NON_DELETABLE: "tag:isrd.isi.edu,2016:non-deletable",
        REQUIRED: "tag:isrd.isi.edu,2018:required",
        SOURCE_DEFINITIONS: "tag:isrd.isi.edu,2019:source-definitions",
        TABLE_ALTERNATIVES: "tag:isrd.isi.edu,2016:table-alternatives",
        TABLE_CONFIG: "tag:isrd.isi.edu,2021:table-config",
        TABLE_DISPLAY: "tag:isrd.isi.edu,2016:table-display",
        VISIBLE_COLUMNS: "tag:isrd.isi.edu,2016:visible-columns",
        VISIBLE_FOREIGN_KEYS: "tag:isrd.isi.edu,2016:visible-foreign-keys"
    });

    /**
     * @desc List of contexts that ERMrestJS supports.
     * @private
     */
    module._contexts = Object.freeze({
        COMPACT: 'compact',
        COMPACT_BRIEF: 'compact/brief',
        COMPACT_BRIEF_INLINE: 'compact/brief/inline',
        COMPACT_ENTRY: 'compact/entry', // post create/edit for multiple rows
        COMPACT_SELECT: 'compact/select',
        COMPACT_SELECT_ASSOCIATION: 'compact/select/association',
        COMPACT_SELECT_ASSOCIATION_LINK: 'compact/select/association/link',
        COMPACT_SELECT_ASSOCIATION_UNLINK: 'compact/select/association/unlink',
        COMPACT_SELECT_FOREIGN_KEY: 'compact/select/foreign_key',
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
        ROWNAME: 'row_name'
    });

    module._dataFormats = Object.freeze({
        DATE: "YYYY-MM-DD",
        TIME: "HH:mm:ss",
        DATETIME: {
            display: "YYYY-MM-DD HH:mm:ss",
            return: "YYYY-MM-DDTHH:mm:ssZ", // the format that the database returns when there are no fractional seconds to show
            submission: "YYYY-MM-DDTHH:mm:ss.SSSZ"
        }
    });

    module._contextArray = ["compact", "compact/brief", "compact/entry", "compact/select", "compact/select/association",
        "compact/select/association/link", "compact/select/association/unlink", "compact/select/foreign_key", "compact/select/saved_queries",
        "compact/select/show_more", "entry/create", "detailed", "entry/edit", "entry", "filter", "*", "row_name", "compact/brief/inline"];

    module._entryContexts = [module._contexts.CREATE, module._contexts.EDIT, module._contexts.ENTRY];
    module._compactContexts = [module._contexts.COMPACT, module._contexts.COMPACT_BRIEF, module._contexts.COMPACT_BRIEF_INLINE, module._contexts.COMPACT_SELECT,
        module._contexts.COMPACT_SELECT_ASSOCIATION, module._contexts.COMPACT_SELECT_ASSOCIATION_LINK, module._contexts.COMPACT_SELECT_ASSOCIATION_UNLINK,
        module._contexts.COMPACT_SELECT_FOREIGN_KEY, module._contexts.COMPACT_SELECT_SAVED_QUERIES, module._contexts.COMPACT_SELECT_SHOW_MORE, module._contexts.COMPACT_ENTRY];

    // NOTE: array is in order from parent context to more specific sub contexts for purposes of inheritence checking
    module._compactFacetingContexts = [module._contexts.COMPACT, module._contexts.COMPACT_SELECT, module._contexts.COMPACT_SELECT_ASSOCIATION,
        module._contexts.COMPACT_SELECT_ASSOCIATION_LINK, module._contexts.COMPACT_SELECT_ASSOCIATION_UNLINK,
        module._contexts.COMPACT_SELECT_FOREIGN_KEY, module._contexts.COMPACT_SELECT_SAVED_QUERIES, module._contexts.COMPACT_SELECT_SHOW_MORE];

    module._tableKinds = Object.freeze({
        TABLE: "table",
        VIEW: "view"
    });

    /*
     * @desc List of display type for table-display annotation
     * @private
     */
    module._displayTypes = Object.freeze({
        TABLE: 'table',
        MARKDOWN: 'markdown',
        MODULE: 'module'
    });

    module._nonSortableTypes = [
        "json", "jsonb"
    ];

    // column types that their value should be considered as HTML
    module._HTMLColumnType = ["markdown", "color_rgb_hex"];

    // types we support for our plotly histogram graphs
    module._histogramSupportedTypes = [
        'int2', 'int4', 'int8', 'float', 'float4', 'float8', 'numeric',
        'serial2', 'serial4', 'serial8', 'timestamptz', 'timestamp', 'date'
    ];

    // these types should be ignored for usage in heuristic for facet
    module._facetHeuristicIgnoredTypes = [
        'markdown', 'longtext', 'serial2', 'serial4', 'serial8', 'jsonb', 'json'
    ];

    module._serialTypes = ["serial", "serial2", "serial4", "serial8"];

    // these types are not allowed for faceting (heuristic or annotation)
    module._facetUnsupportedTypes = [
        "json"
    ];

    module._facetUXModes = Object.freeze({
        CHOICE: "choices",
        RANGE: "ranges",
        PRESENCE: "check_presence"
    });

    module._facetUXModeNames = Object.keys(module._facetUXModes).map(function(k) {
        return module._facetUXModes[k];
    });

    module._facetFilterTypes = Object.freeze({
        CHOICE: "choices",
        RANGE: "ranges",
        SEARCH: "search"
    });

    module._facetFilterTypeNames = Object.keys(module._facetFilterTypes).map(function(k) {
        return module._facetFilterTypes[k];
    });

    module._pseudoColAggregateFns = ["min", "max", "cnt", "cnt_d", "array", "array_d"];
    module._pseudoColEntityAggregateFns = ["array", "array_d"];
    module._pseudoColAggregateNames = ["Min", "Max", "#", "#", "", ""];
    module._pseudoColAggregateExplicitName = ["Minimum", "Maximum", "Number of", "Number of distinct", "List of", "List of distinct"];

    module._systemColumns = ['RID', 'RCB', 'RMB', 'RCT', 'RMT'];
    module._systemColumnNames = Object.freeze({
        RID: 'RID',
        RCB: 'RCB',
        RMB: 'RMB',
        RCT: 'RCT',
        RMT: 'RMT'
    });

    // NOTE: currently we only ignore the system columns
    module._ignoreDefaultsNames = module._systemColumns;

    module.contextHeaderName = 'Deriva-Client-Context';

    module.HANDLEBARS = "handlebars";

    module.TEMPLATE_ENGINES =  Object.freeze({
        HANDLEBARS: 'handlebars',
        MUSTACHE: 'mustache'
    });

    module._handlebarsHelpersList = [
        // default helpers - NOTE: 'log' and 'lookup' not included
        "blockHelperMissing", "each", "if", "helperMissing", "unless", "with", "lookup",
        // ermrestJS helpers
        "eq", "ne", "lt", "gt", "lte", "gte", "and", "or", "not", "ifCond",
        "escape", "encode", "formatDate", "encodeFacet",
        "regexMatch", "regexFindFirst", "regexFindAll",
        "jsonStringify", "toTitleCase", "replace",
        // math helpers
        "add", "subtract"
    ];

    module._operationsFlag = Object.freeze({
        DELETE: "DEL", //delete
        CREATE: "CRT", //create
        UPDATE: "UPDT", //update
        READ: "READ" //read
    });

    module._specialPresentation = Object.freeze({
        NULL: "*No value*",
        EMPTY_STR: "*Empty*"
    });

    module._errorStatus = Object.freeze({
        TIME_OUT: "Request Timeout",
        BAD_REQUEST: "Bad Request",
        UNAUTHORIZED: "Unauthorized",
        FORBIDDEN: "Forbidden",
        NOT_FOUND: "Item Not Found",
        CONFLICT: "Conflict",
        PRECONDITION_FAILED: "Precondition Failed",
        INTERNAL_SERVER_ERROR: "Internal Server Error",
        BAD_GATEWAY: "Bad Gateway",
        SERVIVE_UNAVAILABLE: "Service Unavailable",
        INVALID_FACET: "Invalid Facet Filters",
        INVALID_CUSTOM_FACET: "Invalid Custom Facet Filteres",
        INVALID_FILTER: "Invalid Filter",
        INVALID_INPUT: "Invalid Input",
        INVALID_URI: "Invalid URI",
        BATCH_UNLINK: "Batch Unlink Summary",
        BATCH_DELETE: 'Batch Delete Summary',
        NO_DATA_CHANGED: "No Data Changed",
        NO_CONNECTION_ERROR: "No Connection Error",
        INVALID_SORT: "Invalid Sort Criteria",
        INVALID_PAGE: "Invalid Page Criteria",
        INVALID_SERVER_RESPONSE: "Invalid Server Response",
        UNSUPPORTED_FILTERS: "Unsupported Filters"
    });

    module._errorMessage = Object.freeze({
        UNSUPPORTED_FILTERS: "Some (or all) externally supplied filter criteria cannot be implemented with the current catalog content. " +
                                       "This may be due to lack of permissions or changes made to the content since the criteria were initially saved.",
        INVALID_FACET: "Given encoded string for facets is not valid.",
        INVALID_CUSTOM_FACET: "Given encoded string for cfacets is not valid.",
        INVALID_FACET_OR_FILTER: "Given filter or facet is not valid.",
        INTERNAL_SERVER_ERROR: "An unexpected error has occurred. Please report this problem to your system administrators.",
        NO_CONNECTION_ERROR: "Unable to connect to the server."
    });

    module._facetingErrors = Object.freeze({
        invalidString: "Given encoded string cannot be decoded.",
        invalidFacet: "Facet description is invalid.",
        invalidBooleanOperator: "Only conjunction of facets is supported currently.",
        invalidSource: "Missing or invalid `source` attribute.",
        invalidChoice: "invalid choices value.",
        invalidRange: "invalid ranges value.",
        invalidSearch: "invalid search value.",
        missingConstraints: "No constraints are defined for the facet.",
        onlyOneNullFilter: "Only one null filter is allowed in the facets",
        duplicateFacets: "Cannot define two different sets of facets",
        invalidSourcekey: "Given sourcekey string is not valid"
    });

    module._HTTPErrorCodes = Object.freeze({
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TIMEOUT_ERROR: 408,
        CONFLICT: 409,
        PRECONDITION_FAILED: 412,
        INTERNAL_SERVER_ERROR: 500,
        BAD_GATEWAY: 502,
        SERVIVE_UNAVAILABLE: 503
    });

    module._warningMessages = Object.freeze({
        NO_PSEUDO_IN_ENTRY: "pseudo-columns are not allowed in entry contexts.",
        INVALID_SOURCE: "given object is invalid. `source` is required and it must be valid",
        INVALID_SOURCEKEY: "given object is invalid. The defined `sourcekey` is invalid.",
        INVALID_VIRTUAL_NO_NAME: "`markdown_name` is required when `source` and `sourcekey` are undefiend.",
        INVALID_VIRTUAL_NO_VALUE: "`display.markdown_pattern` is required when `source` and `sourcekey` are undefiend.",
        DUPLICATE_COLUMN: "ignoring duplicate column definition.",
        DUPLICATE_KEY: "ignoring duplicate key definition.",
        DUPLICATE_FK: "ignoring duplicate foreign key definition.",
        DUPLICATE_PC: "ignoring duplicate pseudo-column definition.",
        INVALID_COLUMN: "column name must be a string.",
        INVALID_AGG: "given aggregate function is invalid.",
        NO_SCALAR_AGG_IN_ENT: "scalar aggreagte functions are not allowed in entity mode",
        FK_NOT_RELATED: "given foreignkey is not inbound or outbound related to the table.",
        INVALID_FK: "given foreignkey definition is invalid.",
        INVALID_FK_NO_INBOUND: "given foreignkey path definiton cannot be all-outbound.",
        AGG_NOT_ALLOWED: "aggregate functions are not allowed here.",
        MULTI_SCALAR_NEED_AGG: "aggregate functions are required for scalar inbound-included paths.",
        MULTI_ENT_NEED_AGG: "aggregate functions are required for entity inbound-included paths in non-detailed contexts.",
        NO_AGG_IN_ENTRY: "aggregate functions are not allowed in entry contexts.",
        NO_PATH_IN_ENTRY: "pseudo columns with path are not allowed in entry contexts (only single outbound path is allowed).",
        INVALID_SELF_LINK: "given source is not a valid self-link (must be unique not-null).",
        INVALID_COLUMN_DEF: "column definiton must be an array, object, or string.",
        INVALID_COLUMN_IN_SOURCE_PATH: "end column in the path is not valid (not available in the end table)",
        NO_INBOUND_IN_NON_DETAILED: "inline table is not valid in this context.",
        FILTER_NOT_ALLOWED: "filter in source is only supported in `filter` context of visible-columns",
        FILTER_NO_PATH_NOT_ALLOWED: "filter in source is not supported with local columns or all-outbound paths."
    });

    module._permissionMessages = Object.freeze({
        TABLE_VIEW: "Table is a view.",
        TABLE_GENERATED: "Table is generated.",
        TABLE_IMMUTABLE: "Table is immutable.",
        NO_CREATE: "No permissions to create.",
        NO_UPDATE: "No permissions to update.",
        DISABLED_COLUMNS: "All columns are disabled.",
        NO_UPDATE_ROW: "No row-level permission to update.",
        NO_UPDATE_COLUMN: "No visible column can be updated"
    });

    module._defaultColumnComment = Object.freeze({
        RID: "Persistent, citable resource identifier",
        RCB: "Record creator",
        RMB: "Record last modifier",
        RCT: "Record creation timestamp",
        RMT: "Record last modified timestamp"
    });

    module._commentDisplayModes = Object.freeze({
        inline: "inline",
        tooltip: "tooltip"
    });

    /**
     * List of logical operators that parser accepts in JSON facets.
     * @type {Object}
     */
    module._FacetsLogicalOperators = Object.freeze({
        AND: "and",
        OR: "or"
    });

    module._ERMrestLogicalOperators = Object.freeze({
        AND: "&",
        OR: ";"
    });

    module._ERMrestFilterPredicates = Object.freeze({
        NULL: "::null::",
        EQUAL: "=",
        LESS_THAN: "::lt::",
        LESS_THAN_OR_EQUAL_TO: "::leq::",
        GREATER_THAN: "::gt::",
        GREATER_THAN_OR_EQUAL_TO: "::geq::",
        REG_EXP: "::regexp::",
        CASE_INS_REG_EXP: "::ciregexp::",
        TEXT_SEARCH: "::ts::"
    });

    module._sourceDefinitionAttributes = ["source", "aggregate", "entity", "self_link"];

    module._classNames = Object.freeze({
        externalLink: "external-link",
        externalLinkIcon: "external-link-icon",
        noExternalLinkIcon: "no-external-link-icon",
        assetPermission: "asset-permission",
        postLoad: "-chaise-post-load",
        hideInPrintMode: "hide-in-print",
        showInPrintMode: "video-info-in-print",
        colorPreview: "chaise-color-preview",
        imagePreview: "chaise-image-preview"
    });

    module._specialSourceDefinitions = Object.freeze({
        SEARCH_BOX: "search-box"
    });

    module._shorterVersion = Object.freeze({
        "alias": "a",
        "inbound": "i",
        "outbound": "o",
        "source": "src",
        "sourcekey": "key",
        "choices": "ch",
        "ranges": "r",
        "search": "s",
        "filter": "f",
        "and": "and",
        "or": "or",
        "operand_pattern": "opd",
        "operator": "opr",
        "negate": "n"
    });

    module._sourceProperties = Object.freeze({
        SOURCEKEY: "sourcekey",
        INBOUND: "inbound",
        OUTBOUND: "outbound",
        FILTER: "filter",
        AND: "and",
        OR: "or",
        OPERATOR: "operator",
        OPERAND_PATTERN: "operand_pattern",
        NEGATE: "negate"
    });
