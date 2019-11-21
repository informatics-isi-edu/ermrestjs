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
        COLUMN_DISPLAY: "tag:isrd.isi.edu,2016:column-display",
        DISPLAY: "tag:misd.isi.edu,2015:display",
        EXPORT: "tag:isrd.isi.edu,2016:export",
        EXPORT_CONTEXTED: "tag:isrd.isi.edu,2019:export",
        FOREIGN_KEY: "tag:isrd.isi.edu,2016:foreign-key",
        GENERATED: "tag:isrd.isi.edu,2016:generated",
        HIDDEN: "tag:misd.isi.edu,2015:hidden", //TODO deprecated and should be deleted.
        IGNORE: "tag:isrd.isi.edu,2016:ignore", //TODO should not be used in column and foreign key
        IMMUTABLE: "tag:isrd.isi.edu,2016:immutable",
        KEY_DISPLAY: "tag:isrd.isi.edu,2017:key-display",
        NON_DELETABLE: "tag:isrd.isi.edu,2016:non-deletable",
        REQUIRED: "tag:isrd.isi.edu,2018:required",
        SOURCE_DEFINITIONS: "tag:isrd.isi.edu,2019:source-definitions",
        TABLE_ALTERNATIVES: "tag:isrd.isi.edu,2016:table-alternatives",
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
        COMPACT_SELECT: 'compact/select',
        CREATE: 'entry/create',
        DETAILED: 'detailed',
        EDIT: 'entry/edit',
        ENTRY: 'entry',
        EXPORT: 'export',
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

    module._contextArray = ["compact", "compact/brief", "compact/select", "entry/create", "detailed", "entry/edit", "entry", "filter", "*", "row_name", "compact/brief/inline"];

    module._entryContexts = [module._contexts.CREATE, module._contexts.EDIT, module._contexts.ENTRY];
    module._compactContexts = [module._contexts.COMPACT, module._contexts.COMPACT_BRIEF, module._contexts.COMPACT_BRIEF_INLINE, module._contexts.COMPACT_SELECT];

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

    // NOTE: currently we only ignore the system columns
    module._ignoreDefaultsNames = module._systemColumns;

    module.contextHeaderName = 'Deriva-Client-Context';

    module.HANDLEBARS = "handlebars";

    module._handlebarsHelpersList = [
        // default helpers - NOTE: 'log' and 'lookup' not included
        "blockHelperMissing", "each", "if", "helperMissing", "unless", "with",
        // ermrestJS helpers
        "eq", "ne", "lt", "gt", "lte", "gte", "and", "or", "ifCond",
        "escape", "encode", "formatDate", "encodeFacet", 'regexMatch',
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
        forbidden: "Forbidden",
        itemNotFound: "Item Not Found",
        facetingError: "Invalid Facet Filters",
        customFacetngError: "Invalid Custom Facet Filteres",
        invalidFilter: "Invalid Filter",
        invalidInput: "Invalid Input",
        invalidURI: "Invalid URI",
        noDataChanged: "No Data Changed",
        noConnectionError: "No Connection Error",
        InvalidSortCriteria: "Invalid Sort Criteria",
        invalidPageCriteria: "Invalid Page Criteria"
    });

    module._errorMessage = Object.freeze({
        facetingError: "Given encoded string for facets is not valid.",
        customFacetingError: "Given encoded string for cfacets is not valid.",
        facetOrFilterError: "Given filter or facet is not valid."
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
        DUPLICATE_COLUMN: "ignoring duplicate column definition.",
        DUPLICATE_KEY: "ignoring duplicate key definition.",
        DUPLICATE_FK: "ignoring duplicate foreign key definition.",
        DUPLICATE_PC: "ignoring duplicate pseudo-column definition.",
        INVALID_COLUMN: "column name must be a string.",
        INVALID_AGG: "given aggregate function is invalid.",
        NO_SCALAR_AGG_IN_ENT: "scalar aggreagte functions are not allowed in entity mode",
        FK_NOT_RELATED: "given foreignkey is not inbound or outbound related to the table.",
        INVALID_FK: "given foreignkey definition is invalid.",
        AGG_NOT_ALLOWED: "aggregate functions are not allowed here.",
        MULTI_SCALAR_NEED_AGG: "aggregate functions are required for scalar inbound-included paths.",
        MULTI_ENT_NEED_AGG: "aggregate functions are required for entity inbound-included paths in non-detailed contexts.",
        NO_AGG_IN_ENTRY: "aggregate functions are not allowed in entry contexts.",
        NO_PATH_IN_ENTRY: "pseudo columns with path are not allowed in entry contexts (only single outbound path is allowed).",
        INVALID_SELF_LINK: "given source is not a valid self-link (must be unique not-null).",
        INVALID_COLUMN_DEF: "column definiton must be an array, object, or string."
    });

    module._permissionMessages = Object.freeze({
        TABLE_VIEW: "Table is a view.",
        TABLE_GENERATED: "Table is generated.",
        TABLE_IMMUTABLE: "Table is immutable.",
        NO_CREATE: "No permissions to create.",
        NO_UPDATE: "No permissions to update.",
        DISABLED_COLUMNS: "All columns are disabled."
    });

    module._defaultColumnComment = Object.freeze({
        RID: "Persistent, citable resource identifier",
        RCB: "Record creator",
        RMB: "Record last modifier",
        RCT: "Record creation timestamp",
        RMT: "Record last modified timestamp"
    });

    /**
     * List of logical operators that parser accepts in JSON facets.
     * @type {Object}
     */
    module._FacetsLogicalOperators = Object.freeze({
        AND: "and",
        OR: "or"
    });

    module._sourceDefinitionAttributes = ["source", "aggregate", "entity", "self_link"];

    module._classNames = Object.freeze({
        externalLink: "external-link",
        externalLinkIcon: "external-link-icon",
        noExternalLinkIcon: "no-external-link-icon",
        assetPermission: "asset-permission",
        download: "download-alt"
    });

    module._specialSourceDefinitions = Object.freeze({
        SEARCH_BOX: "search-box"
    });
