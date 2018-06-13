
    module.ParsedFilter = ParsedFilter;

    /**
     * The ERMrest service name. Internal use only.
     * @type {string}
     * @private
     */
    var _service_name = 'ermrest';

    /**
     * This function parses a URI and constructs a representation of the URI.
     * @memberof ERMrest
     * @function parse
     * @param {String} uri An ERMrest resource URI to be parsed.
     * @returns {ERMrest.Location} Location object created from the URI.
     * @throws {ERMrest.InvalidInputError} If the URI does not contain the
     * service name.
     */
    module.parse = function (uri) {
        var svc_idx = uri.indexOf(_service_name);
        if (svc_idx < 0) {
            throw new module.InvalidInputError("Invalid uri: " + uri + '. Does not contain the expected service name: ' + _service_name);
        }

        return new Location(uri);

    };

    /**
     * Given tableName, schemaName, and facets will generate a path in the following format:
     * #<catalogId>/<tableName>:<schemaName>/*::facets::<FACETSBLOB>
     * @param  {string} schemaName Name of schema, can be null
     * @param  {string} tableName  Name of table
     * @param  {object} facets     an object
     * @return {string}            a path that ermrestjs understands and can parse, can be undefined
     */
    module.createPath = function (catalogId, schemaName, tableName, facets) {
        verify(typeof catalogId === "string" && catalogId.length > 0, "catalogId must be an string.");
        verify(typeof tableName === "string" && tableName.length > 0, "tableName must be an string.");

        var compactPath = "#" + catalogId + "/";
        if (schemaName) {
            compactPath += module._fixedEncodeURIComponent(schemaName) + ":";
        }
        compactPath += module._fixedEncodeURIComponent(tableName);

        if (facets && typeof facets === "object" && Object.keys(facets).length !== 0) {
            compactPath += "/*::facets::" + module.encodeFacet(facets);
        }

        return compactPath;
    };

    /**
     * The parse handles URI in this format
     * <service>/catalog/<catalog_id>/<api>/<schema>:<table>/[/filter(s)][/facets][/join(s)][@sort(col...)][@before(...)/@after(...)][?]
     *
     * path =  <filters(s)>/<join(s)>/<facets>/<search>
     *
     * uri = <service>/catalog/<catalog>/<api>/<path><sort><paging>?<limit>
     * service: the ERMrest service endpoint such as https://www.example.com/ermrest.
     * catalog: the catalog identifier for one dataset such as 42.
     * api: the API or data resource space identifier such as entity, attribute, attributegroup, or aggregate.
     * path: the data path which identifies one filtered entity set with optional joined context.
     * sort: optional @sort
     * paging: optional @before/@after
     * query params: optional ?
     *
     * @param {String} uri full path
     * @constructor
     */
    function Location(uri) {

        // full uri
        this._uri = uri;

        var parts;

        var joinRegExp = /(?:left|right|full|^)\((.*)\)=\((.*:.*:.*)\)/;
        var facetsRegExp = /\*::facets::(.+)/;

        // extract the query params
        if (uri.indexOf("?") !== -1) {
            parts = uri.split("?");
            uri = parts[0];
            this._queryParamsString = parts[1];
            this._queryParams = _getQueryParams(parts[1]);
        } else {
            this._queryParams = {};
        }

        // compactUri is the full uri without modifiers
        if (uri.indexOf("@sort(") !== -1) {
            this._compactUri = uri.split("@sort(")[0];
        } else if (uri.indexOf("@before(") !== -1) {
            this._compactUri = uri.split("@before(")[0];
        } else if (uri.indexOf("@after(") !== -1) {
            this._compactUri = uri.split("@after(")[0];
        } else {
            this._compactUri = uri;
        }

        // service
        parts = uri.match(/(.*)\/catalog\/([^\/]*)\/(entity|attribute|aggregate|attributegroup)\/(.*)/);
        this._service = parts[1];

        // catalog id
        this._catalog = parts[2];

        // api
        this._api = parts[3];

        // path is everything after catalog id
        this._path = parts[4];

        var modifiers = uri.split(this._compactUri)[1]; // emtpy string if no modifiers

        // compactPath is path without modifiers
        this._compactPath = (modifiers === "" ? this._path : this._path.split(modifiers)[0]);

        // <sort>/<page>
        // sort and paging
        if (modifiers) {
            if (modifiers.indexOf("@sort(") !== -1) {
                this._sort = modifiers.match(/(@sort\([^\)]*\))/)[1];
            }
            // sort must specified to use @before and @after
            if (modifiers.indexOf("@before(") !== -1) {
                if (this._sort) {
                    this._before = modifiers.match(/(@before\([^\)]*\))/)[1];
                } else {
                    throw new module.InvalidPageCriteria("Invalid uri: " + this._uri + ". Sort modifier is required with paging.", this._path);
                }
            }

            if (modifiers.indexOf("@after(") !== -1) {
                if (this._sort) {
                    this._after = modifiers.match(/(@after\([^\)]*\))/)[1];
                } else {
                    throw new module.InvalidPageCriteria("Invalid uri: " + this._uri + ". Sort modifier is required with paging.", this._path);
                }
            }
        }

        // Split compact path on '/'
        // Expected format: "<schema:table>/<filter(s)>/<facets>/<joins(s)>/<facets>"
        parts = this._compactPath.split('/');


        //<schema:table>
        // first schema name and first table name
        // we can't handle complex path right now, only knows the first schema and table
        // so after doing a Reference.relate() and generate a new uri/location, we don't have schema/table information here
        if (parts[0]) {
            var params = parts[0].split(':');
            if (params.length > 1) {
                this._projectionSchemaName = decodeURIComponent(params[0]);
                this._projectionTableName = decodeURIComponent(params[1]);
            } else {
                this._projectionSchemaName = null;
                this._projectionTableName = decodeURIComponent(params[0]);
            }
        }

        // from start to end can be filter, facets, and joins
        var endIndex = parts.length - 1, startIndex = 1;
        var searchTerm = null;

        //<facets>
        if (startIndex <= endIndex) {
            match = parts[endIndex].match(facetsRegExp);
            if (match) { // this is the facets blob
                this._facets = new ParsedFacets(match[1], this._path);

                // extract the search term
                searchTerm = _getSearchTerm(this._facets.decoded);
                endIndex--;
            }
        }
        this._searchTerm = searchTerm;

        // <projectionFacets>/<join(s)>
        this._joins = [];
        // parts[startIndex] to parts[endIndex] might be joins
        var linking;
        for (var ji = startIndex; ji <= endIndex; ji++) {
            linking = parts[ji].match(joinRegExp);
            if (!linking) continue;
            this._joins.push(_createJoin(linking));
        }

        if (this._joins.length > 0) {
            match = parts[startIndex].match(facetsRegExp);
            if (match) { // this is the facets blob
                this._projectionFacets = new ParsedFacets(match[1], this._path);
                startIndex++;
            }
        }

        //<filter(s)>
        // If there are filters appended after projection table
        // modify the columns to the linked table
        this._filtersString = '';
        if (parts[1]) {
            // TODO should refactor these checks into one match statement
            var isJoin = parts[1].match(joinRegExp);
            var isFacet = parts[1].match(facetsRegExp);

            // parts[1] could be linking or search
            if (!isJoin && !isFacet) {
                this._filtersString = parts[1];

                // split by ';' and '&'
                var regExp = new RegExp('(;|&|[^;&]+)', 'g');
                var items = parts[1].match(regExp);

                // if a single filter
                if (items.length === 1) {
                    this._filter = _processSingleFilterString(items[0], this._uri, this._path);

                } else {
                    var filters = [];
                    var type = null;
                    for (var i = 0; i < items.length; i++) {
                        // process anything that's inside () first
                        if (items[i].startsWith("(")) {
                            items[i] = items[i].replace("(", "");
                            // collect all filters until reaches ")"
                            var subfilters = [];
                            while (true) {
                                if (items[i].endsWith(")")) {
                                    items[i] = items[i].replace(")", "");
                                    subfilters.push(items[i]);
                                    // get out of while loop
                                    break;
                                } else {
                                    subfilters.push(items[i]);
                                    i++;
                                }
                            }

                            filters.push(_processMultiFilterString(subfilters, this._uri, this._path));

                        } else if (type === null && items[i] === "&") {
                            // first level filter type
                            type = module.filterTypes.CONJUNCTION;
                        } else if (type === null && items[i] === ";") {
                            // first level filter type
                            type = module.filterTypes.DISJUNCTION;
                        } else if (type === module.filterTypes.CONJUNCTION && items[i] === ";") {
                            // using combination of ! and & without ()
                            throw new module.InvalidFilterOperatorError("Invalid uri: " + this._uri + ". Parser doesn't support combination of conjunction and disjunction filters.", this._path,  this._filtersString);
                        } else if (type === module.filterTypes.DISJUNCTION && items[i] === "&") {
                            // using combination of ! and & without ()
                            throw new module.InvalidFilterOperatorError("Invalid uri: " + this._uri + ". Parser doesn't support combination of conjunction and disjunction filters.", this._path, this._filtersString);
                        } else if (items[i] !== "&" && items[i] !== ";") {
                            // single filter on the first level
                            var binaryFilter = _processSingleFilterString(items[i], this._uri, this._path);
                            filters.push(binaryFilter);
                        }
                    }

                    this._filter = new ParsedFilter(type);
                    this._filter.setFilters(filters);
                }
            }

            // change filter to facet if possible
            if (this._filter) {
                var f = _filterToFacet(this._filter);
                if (f) {
                    this._filter.facet = f.facet;
                    this._filter.depth = f.depth;
                }
            }
        }

    }

    Location.prototype = {

        /**
         * Override the toString function
         * @returns {String} the string representation of the Location, which is the full URI.
         */
        toString: function(){
            return this.uri;
        },


        /**
         * <service>/catalog/<catalogId>/<api>/<projectionSchema:projectionTable>/<filters>/<joins>/<sort>/<page>?<queryParams>
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::facets::).
         *
         * @returns {String} The full URI of the location
         */
        get uri() {
            if (this._uri === undefined) {
                this._uri = this.compactUri + this._modifiers +  (this.queryParamsString ? "?" + this.queryParamsString : "");
            }
            return this._uri;
        },

        /**
         * <service>/catalog/<catalogId>/<api>/<projectionSchema:projectionTable>/<filters>/<joins>/<search>
         *
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::search::).
         * @returns {String} The URI without modifiers or queries
         */
        get compactUri() {
            if (this._compactUri === undefined) {
                var path = [this.service, "catalog", this.catalog, this.api].join("/");
                this._compactUri = path + "/" + this.compactPath;
            }
            return this._compactUri;
        },

        /**
         * <projectionSchema:projectionTable>/<filters>/<joins>/<search>/<sort>/<page>
         *  NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::search::).
         *
         * @returns {String} Path portion of the URI
         * This is everything after the catalog id
         */
        get path() {
            if (this._path === undefined) {
                this._path = this.compactPath + this._modifiers;
            }
            return this._path;
        },

        /**
         * <projectionSchema:projectionTable>/<filters>/<<projectionFacets>>/<joins>/<<facets>>
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::facets::).
         *
         * @returns {String} Path without modifiers or queries
         */
        get compactPath() {
            if (this._compactPath === undefined) {
                var uri = "";
                if (this.projectionSchemaName) {
                    uri += module._fixedEncodeURIComponent(this.projectionSchemaName) + ":";
                }
                uri += module._fixedEncodeURIComponent(this.projectionTableName);

                if (this.filtersString) {
                    uri += "/" + this.filtersString;
                }

                if (this.projectionFacets) {
                    uri += "/*::facets::" + this.projectionFacets.encoded;
                }

                if (this.joins.length > 0) {
                    uri += "/" + this.joins.reduce(function (prev, join, i) {
                        return prev + (i > 0 ? "/" : "") + join.str;
                    }, "");
                }

                if (this.facets) {
                    uri += "/*::facets::" + this.facets.encoded;
                }

                this._compactPath = uri;
            }
            return this._compactPath;
        },


        /**
         * should only be used for internal usage and sending request to ermrest
         * NOTE: returns a uri that ermrest understands
         *
         * TODO This might produce a url that is not understandable by ermrest (because of sort).
         * TODO should be removed or changed.
         *
         * <service>/catalog/<catalogId>/<api>/<projectionSchema:projectionTable>/<filters>/<projectionFacets>/<joins>/<facets>/<sort>/<page>
         * @returns {String} The full URI of the location for ermrest
         */
        get ermrestUri() {
            if (this._ermrestUri === undefined) {
                this._ermrestUri = this.ermrestCompactUri + this._modifiers;
            }
            return this._ermrestUri;
        },

        /**
         * should only be used for internal usage and sending request to ermrest
         * <projectionSchema:projectionTable>/<filters>/<joins>/<search>
         *
         * NOTE: returns a uri that ermrest understands
         * @returns {String} The URI without modifiers or queries for ermrest
         */
        get ermrestCompactUri() {
            if (this._ermrestCompactUri === undefined) {
                var path = [this.service, "catalog", this.catalog, this.api].join("/");
                this._ermrestCompactUri = path + "/" + this.ermrestCompactPath;
            }
            return this._ermrestCompactUri;
        },

        /**
         * should only be used for internal usage and sending request to ermrest
         * <projectionSchema:projectionTable>/<filters>/<projectionFacets>/<joins>/<facets>/<sort>/<page>
         *
         * NOTE: returns a path that ermrest understands
         * @returns {String} Path portion of the URI
         * This is everything after the catalog id for ermrest
         */
        get ermrestPath() {
            if (this._ermrestPath === undefined) {
                this._ermrestPath = this.ermrestCompactPath + this._modifiers;
            }
            return this._ermrestPath;
        },

        /**
         * should only be used for internal usage and sending request to ermrest
         * <projectionSchema:projectionTable>/<filters>/<projectionFacets>/<joins>/<projectionFacets>
         *
         * NOTE:
         *  1. returns a path that ermrest understands
         *  2. Adds `M` alias to the last table.
         * @returns {String} Path without modifiers or queries for ermrest
         */
        get ermrestCompactPath() {
            if (this._ermrestCompactPath === undefined) {
                var joinsLength = this.joins.length,
                    mainTableAlias = this.mainTableAlias,
                    mainTableName = this.tableName,
                    facetFilter;

                // add tableAlias
                var uri = this.projectionTableAlias + ":=";

                if (this.projectionSchemaName) {
                    uri += module._fixedEncodeURIComponent(this.projectionSchemaName) + ":";
                }
                uri += module._fixedEncodeURIComponent(this.projectionTableName);

                if (this.filtersString) {
                    uri += "/" + this.filtersString;
                }

                if (this.projectionFacets) {
                    facetFilter = _JSONToErmrestFilter(this.projectionFacets.decoded, this.projectionTableAlias, this.projectionTableName, this.catalog, module._constraintNames);
                    if (!facetFilter) throw new module.InvalidFacetOperatorError('', this.path);
                    uri += "/" + facetFilter;
                }

                if (joinsLength > 0) {
                    uri += "/" + this.joins.reduce(function (prev, join, i) {
                        return prev + (i > 0 ? "/" : "") + ((i == joinsLength - 1) ? mainTableAlias + ":=" : "") + join.str;
                    }, "");
                }

                if (this.facets) {
                    facetFilter = _JSONToErmrestFilter(this.facets.decoded, mainTableAlias, mainTableName, this.catalog, module._constraintNames);
                    if (!facetFilter)
                     throw new module.InvalidFacetOperatorError('', this.path);
                    uri += "/" + facetFilter;
                }

                this._ermrestCompactPath = uri;
            }
            return this._ermrestCompactPath;
        },

        get projectionTableAlias () {
            if (this._projectionTableAlias === undefined) {
                this._projectionTableAlias = (this.joins.length === 0) ? this.mainTableAlias : "T";
            }
            return this._projectionTableAlias;
        },

        get mainTableAlias() {
            return "M";
        },

        /**
         *
         * @returns {String} The URI of ermrest service
         */
        get service() {
            return this._service;
        },

        /**
         *
         * @returns {String} catalog id
         */
        get catalog() {
            return this._catalog;
        },

        /**
         *
         * @returns {String} API of the ermrest service.
         * API includes entity, attribute, aggregate, attributegroup
         */
        get api() {
            return this._api;
        },

        /**
         *
         * @returns {string} The schema name in the projection table, null if schema is not specified
         */
        get projectionSchemaName() {
            return this._projectionSchemaName;
        },

        /**
         * Subject to change soon
         * @returns {string} The table name in the projection table
         */
        get projectionTableName() {
            return this._projectionTableName;
        },

        /**
         *
         * @returns {string} the schema name which the uri referres to, null if schema is not specified
         */
        get schemaName() {
            if (this._schemaName === undefined) {
                var joinLen = this._joins.length;
                if (joinLen > 0) {
                    this._schemaName = this._joins[joinLen-1].toSchema;
                } else {
                    this._schemaName = this._projectionSchemaName;
                }
            }
            return this._schemaName;
        },

        /**
         *
         * @returns {string} the table name which the uri referres to
         */
        get tableName() {
            if (this._tableName === undefined) {
                var joinLen = this._joins.length;
                if (joinLen > 0) {
                    this._tableName = this._joins[joinLen-1].toTable;
                } else {
                    this._tableName = this._projectionTableName;
                }
            }
            return this._tableName;
        },

        /**
         * filter is converted to the last join table (if uri has join)
         * @returns {ParsedFilter} undefined if there is no filter
         */
        get filter() {
            return this._filter;
        },

        get filtersString() {
            return this._filtersString;
        },

        /**
         * Remove the filters from the location
         */
        removeFilters: function () {
          delete this._filter;
          delete this._filtersString;
          this._setDirty();
        },

        /**
         * A dictionary of available query parameters
         * @returns {Object}
         */
        get queryParams() {
            return this._queryParams;
        },

        /**
         * The query parameters string (key1=val1&key2=val2).
         * @returns {String}
         */
        get queryParamsString() {
            return this._queryParamsString;
        },

        /**
         * Array of joins that are in the given uri.
         * Each join has the following attributes:
         *  `fromCols`: array of column names.
         *  `fromColsStr`: complete string of left part of join
         *  `toCols`: array of column names
         *  `toColsStr`: complete string of right part of join
         *  `toSchema`: the schema names
         *  `toTable`: the table names
         *  `str`: complete string of join
         *
         * @return {object}
         */
        get joins() {
            return this._joins;
        },

        /**
        * If there's a join(linking) at the end or not.
        * @return {boolean}
        */
        get hasJoin() {
            return this._joins.length > 0;
        },

        /**
         * The last join in the uri. Take a look at `joins` for structure of join object.
         * @return {object}
         */
        get lastJoin() {
            var joinLen = this._joins.length;
            if (joinLen > 0) {
                return this._joins[joinLen-1];
            }
            return null;
        },

        /**
         * set the facets.decoded to the given JSON. will populate the .encoded too.
         * @param  {object} json the json object of facets
         */
        set facets(json) {
            delete this._facets;
            this._searchTerm = null;
            if (typeof json === 'object' && json !== null) {
                this._facets = new ParsedFacets(json);

                this._searchTerm = _getSearchTerm(this._facets.decoded);
            }
            this._setDirty();
        },

        /**
         * facets object. It has .encoded and .decoded apis.
         * @return {ParsedFacets} facets object
         */
        get facets() {
            return this._facets;
        },

        /**
         * set the facet on the projection table
         * @param  {object} json the json object of facets
         */
        set projectionFacets(json) {
            delete this._projectionFacets;
            if (typeof json === 'object' && json !== null) {
                this._projectionFacets = new ParsedFacets(json);
            }
            this._setDirty();
        },

        /**
         * facet on the projection table
         * @return {ParsedFacets} facets object
         */
        get projectionFacets() {
            return this._projectionFacets;
        },

        /**
         * modifiers that are available in the uri.
         * @return {string}
         */
        get _modifiers() {
            return (this.sort ? this.sort : "") + (this.paging ? this.paging : "");
        },

        /**
         * Apply, replace, clear filter term on the location
         * @param {string} term - optional, set or clear search
         */
        search: function(t) {
            var term = (t == null || t === "") ? null : t;

            if (term === this._searchTerm) {
                return;
            }

            var newSearchFacet = {"source": "*", "search": [term]};
            var hasSearch = this._searchTerm != null;
            var hasFacets = this._facets != null;
            var andOperator = module._FacetsLogicalOperators.AND;

            var facetObject, andFilters;
            if (term === null) {
                // hasSearch must be true, if not there's something wrong with logic.
                // if term === null, that means the searchTerm is not null, therefore has search
                facetObject = [];
                this._facets.decoded[andOperator].forEach(function (f) {
                    if (f.source !== "*") {
                        facetObject.push(f);
                    }
                });

                if (facetObject.length !== 0) {
                    facetObject = {"and": facetObject};
                }
            } else {
                if (hasFacets) {
                    facetObject = JSON.parse(JSON.stringify(this.facets.decoded));
                    if (!hasSearch) {
                        facetObject[andOperator].unshift(newSearchFacet);
                    } else {
                        andFilters  = facetObject[andOperator];
                        for (var i = 0; i < andFilters.length; i++) {
                            if (andFilters[i].source === "*") {
                                if (Array.isArray(andFilters[i].search)) {
                                    andFilters[i].search = [term];
                                }
                                break;
                            }
                        }
                    }
                } else {
                    facetObject = {"and": [newSearchFacet]};
                }
            }

            this._searchTerm = term;
            delete this._facets;
            if (facetObject && facetObject.and) {
                this._facets = new ParsedFacets(facetObject);
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * Not saved because new search
         * @returns {string} the search term
         */
        get searchTerm() {
            return this._searchTerm;
        },

        /**
         * Subject to change soon
         * @returns {String} The sort modifier in the string format of @sort(...)
         */
        get sort() {
            return this._sort;
        },

        /**
         * get the sorting object, null if no sorting
         * @returns {Object[]} in this format [{"column":colname, "descending":true},...]
         */
        get sortObject() {
            if (this._sortObject === undefined) {
                if (this._sort !== undefined) {
                    var sorts = this._sort.match(/@sort\(([^\)]*)\)/)[1].split(",");

                    this._sortObject = [];
                    for (var s = 0; s < sorts.length; s++) {
                        var sort = sorts[s];
                        var column = (sort.endsWith("::desc::") ?
                            decodeURIComponent(sort.match(/(.*)::desc::/)[1]) : decodeURIComponent(sort));
                        this._sortObject.push({"column": column, "descending": sort.endsWith("::desc::")});
                    }
                } else {
                    this._sortObject = null;
                }
            }
            return this._sortObject;
        },

        /**
         * change sort with new sort Object
         * @param {Object[]} so in this format [{"column":colname, "descending":true},...]
         */
        set sortObject(so) {
            if ((!so && !this._sort) || (so === this._sort))
                return;

            // null or undefined = remove sort
            var oldSortString = (this._sort? this._sort : "");
            if (!so || so.length === 0) {
                delete this._sort;
                this._sortObject = null;
            } else {
                this._sortObject = so;
                this._sort = _getSortModifier(so);
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * String representation of before: @before(..)
         * @type {string}
         */
        get before () {
          return this._before;
        },

        /**
         * String representation of before: @after(..)
         * @type {string}
         */
        get after () {
          return this._after;
        },

        /**
         *
         * @returns {String} The string format of the paging modifier in the form of @before(..)@after(...)
         */
        get paging() {
            if (this.after || this.before) {
                return (this.after ? this.after : "") + (this.before ? this.before : "");
            }
        },

        /**
         * array of values that is used for before
         * @return {Object[]}
         */
        get beforeObject () {
            if (this._beforeObject === undefined) {
                var row, i, value;
                if (this._before) {
                    this._beforeObject = [];
                    row = this._before.match(/@before\(([^\)]*)\)/)[1].split(",");

                    // NOTE the number of values might be different from the sort
                    // because columns can be sorted based on value of multiple columns
                    for (i = 0; i < row.length; i++) {
                        // ::null:: to null, empty string to "", otherwise decode value
                        value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                        this._beforeObject.push(value);
                    }
                } else {
                    this._beforeObject = null;
                }
            }
            return this._beforeObject;
        },

        /**
         * change the beforeObject with new values
         * @param {Object[]} Array of values that you want to page with.
         */
        set beforeObject(values) {
            // invalid argument, or empty string -> remove before
            if (!Array.isArray(values) || values.length === 0) {
                this._beforeObject = null;
                delete this._before;
            } else {
                if (this._sort) {
                    this._beforeObject = values;
                    this._before = _getPagingModifier(values, true);
                } else {
                    throw new module.InvalidPageCriteria("Error setting before: Paging not allowed without sort", this.path);
                }
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * array of values that is used for after
         * @return {Object[]}
         */
        get afterObject () {
            if (this._afterObject === undefined) {
                var row, i, value;
                if (this._after) {
                    this._afterObject = [];
                    row = this._after.match(/@after\(([^\)]*)\)/)[1].split(",");

                    // NOTE the number of values might be different from the sort
                    // because columns can be sorted based on value of multiple columns
                    for (i = 0; i < row.length; i++) {
                        // ::null:: to null, empty string to "", otherwise decode value
                        value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                        this._afterObject.push(value);
                    }
                } else {
                    this._afterObject = null;
                }
            }
            return this._afterObject;
        },

        /**
         * change the paging with new afterObject
         * @param {Object[]} Array of values that you want to page with.
         */
        set afterObject(values) {
            // invalid argument, or empty string -> remove after
            if (!Array.isArray(values) || values.length === 0) {
                this._afterObject = null;
                delete this._after;
            } else {
                if (this._sort) {
                    this._afterObject = values;
                    this._after = _getPagingModifier(values, false);
                } else {
                    throw new module.InvalidPageCriteria("Error setting after: Paging not allowed without sort", this.path);
                }
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * Makes a shallow copy of the Location object
         * @returns {ERMrest.Location} new location object
         * @private
         */
        _clone: function() {
            var copy = Object.create(Location.prototype);
            for (var key in this) {
                // only copy those properties that were set in the object, this
                // will skip properties from the source object's prototype
                if (this.hasOwnProperty(key)) {
                    copy[key] = this[key];
                }
            }
            return copy;
        },

        _setDirty: function() {
            delete this._uri;
            delete this._path;
            delete this._compactUri;
            delete this._compactPath;
            delete this._ermrestUri;
            delete this._ermrestPath;
            delete this._ermrestCompactUri;
            delete this._ermrestCompactPath;
        }
    };

    /**
     * given the string of parameters, create an object of them.
     *
     * @param {String} params the string representation of the query params
     * @returns {Object} the query params object
     * @private
     */
    _getQueryParams = function (params) {
        var queryParams = {},
            parts = params.split("&"),
            part, i;
        for (i  = 0; i < parts.length; i++) {
            part = parts[i].split("=");
            queryParams[decodeURIComponent(part[0])] = decodeURIComponent(part[1]);
        }
        return queryParams;
    };

    /**
     * for testingiven sort object, get the string modifier
     * @param {Object[]} sort [{"column":colname, "descending":boolean}, ...]
     * @return {string} string modifier @sort(...)
     * @private
     */
    _getSortModifier = function(sort) {

        // if no sorting
        if (!sort || !Array.isArray(sort) || sort.length === 0) {
            return "";
        }

        var modifier = "@sort(";
        for (var i = 0; i < sort.length; i++) {
            if (i !== 0) modifier = modifier + ",";
            if (!sort[i].column) throw new module.InvalidInputError("Invalid sort object.");
            modifier = modifier + module._fixedEncodeURIComponent(sort[i].column) + (sort[i].descending ? "::desc::" : "");
        }
        modifier = modifier + ")";
        return modifier;
    };

    /**
     * given paging object, get the paging modifier
     * @param {Object} values the values
     * @param {boolean} indicates whether its before or after
     * @return {string} string modifier @after/before(...)
     * @private
     */
    _getPagingModifier = function(values, isBefore) {

        // no paging
        if (!Array.isArray(values) || values.length === 0) {
            return "";
        }

        var modifier = (isBefore ? "@before(" : "@after(");
        for (var i = 0; i < values.length; i++) {
            if (i !== 0) modifier = modifier + ",";
            modifier = modifier + ((values[i] === null || values[i] === undefined ) ? "::null::" : module._fixedEncodeURIComponent(values[i]));
        }
        modifier = modifier + ")";
        return modifier;
    };

    /**
     * Given a term will return the filter string that ermrest understands
     * @param  {string} term Search term
     * @param {string=} column the column that search is based on (if undefined, search on table).
     * @return {string} corresponding ermrest filter
     * @private
     */
    _convertSearchTermToFilter = function (term, column) {
        var filterString = "";
        column = (typeof column !== 'string' || column === "*") ? "*": module._fixedEncodeURIComponent(column);

        if (term && term !== "") {
            // add a quote to the end if string has an odd amount
            if ( (term.split('"').length-1)%2 === 1 ) {
                term = term + '"';
            }

            // 1) parse terms in quotation
            // 2) split the rest by space
            var terms = term.match(/"[^"]*"/g); // everything that's inside quotation
            if (!terms) terms = [];
            for (var i = 0; i < terms.length; i++) {
                term = term.replace(terms[i], ""); // remove from term
                terms[i] = terms[i].replace(/"/g, ""); //remove quotes
            }

            if (term.trim().length > 0 ) terms = terms.concat(term.trim().split(/[\s]+/)); // split by white spaces

            terms.forEach(function(t, index, array) {
                var exp;
                // matches an integer, aka just a number
                if (t.match(/^[0-9]+$/)) {
                    exp = "^(.*[^0-9.])?0*" + module._encodeRegexp(t) + "([^0-9].*|$)";
                // matches a float, aka a number one decimal
                } else if (t.match(/^([0-9]+[.][0-9]*|[0-9]*[.][0-9]+)$/)) {
                    exp = "^(.*[^0-9.])?0*" + module._encodeRegexp(t);
                // matches everything else (words and anything with multiple decimals)
                } else {
                    exp = module._encodeRegexp(t);
                }

                filterString += (index === 0? "" : "&") + column + module.OPERATOR.CASE_INS_REG_EXP + module._fixedEncodeURIComponent(exp);
            });
        }

        return filterString;
    };

    /**
     * Create a join object given the linking
     * @private
     * @param  {string[]} linking the linking array
     * @return {object}
     */
    _createJoin = function (linking) {
        var fromCols = linking[1].split(",");
        var toParts = linking[2].match(/([^:]*):([^:]*):([^\)]*)/);
        var toCols = toParts[3].split(",");

        return {
            "fromCols": fromCols.map(function(colName) {return decodeURIComponent(colName);}),
            "fromColsStr": linking[1],
            "toCols": toCols.map(function(colName) {return decodeURIComponent(colName);}),
            "toColsStr": linking[2],
            "toSchema": decodeURIComponent(toParts[1]),
            "toTable": decodeURIComponent(toParts[2]),
            "str": linking[0]
        };
    };

    /**
     * Given the facetObject, find the `*` facet and extract the search term.
     * Should be called whenever we're changing the facet object
     * Will only consider the first `source`: `*`.
     * @param  {object} facetObject the facet object
     * @return {string}             search term
     */
    _getSearchTerm = function (facetObject) {
        var andFilters = facetObject[module._FacetsLogicalOperators.AND],
            searchTerm = "";

        for (var i = 0; i < andFilters.length; i++) {
            if (andFilters[i].source === "*") {
                if (Array.isArray(andFilters[i].search)) {
                    searchTerm = andFilters[i].search.join("|");
                }
                break;
            }
        }
        return searchTerm.length === 0 ? null : searchTerm;
    };

    /**
     *
     * A structure to store parsed filter
     *
     * { type: BinaryPredicate,
     *   column: col_name,
     *   operator: '=' or '::opr::'
     *   value: value
     * }
     *
     * or
     *
     * { type: Conjunction or Disjunction
     *   filters: [array of ParsedFilter]
     * }
     *
     *
     * @memberof ERMrest
     * @constructor
     * @param {String} type - type of filter
     * @desc
     * Constructor for a ParsedFilter.
     */
     function ParsedFilter (type) {
         this.type = type;
     }

     ParsedFilter.prototype = {
         constructor: ParsedFilter,

         /**
          *
          * @param {ParsedFilter[]} filters array of binary predicate
          */
         setFilters: function(filters) {
             this.filters = filters;
         },

         /**
          *
          * @param colname
          * @param operator '=', '::gt::', '::lt::', etc.
          * @param value
          */
         setBinaryPredicate: function(colname, operator, value) {
             this.column = colname;
             this.operator = operator;
             this.value = value;
         }
     };

    /**
     *
     * @param {stirng} filterString
     * @param {string} fullURI used for loggin purposes
     * @param {string} path used for redirect link generation
     * @returns {ParsedFilter} returns the parsed representation of the filter
     * @desc converts a filter string to ParsedFilter
     */
    function _processSingleFilterString(filterString, fullURI, path) {
        //check for '=' or '::' to decide what split to use
        var f, filter;
        if (filterString.indexOf("=") !== -1) {
            f = filterString.split('=');
            // NOTE: filter value (f[1]) can be empty
            if (f[0] && f.length === 2) {
                filter = new ParsedFilter(module.filterTypes.BINARYPREDICATE);
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "=", decodeURIComponent(f[1]));
                return filter;
            }
        } else {
            f = filterString.split("::");
            if (f.length === 3) {
                filter = new ParsedFilter(module.filterTypes.BINARYPREDICATE);
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                return filter;
            }
        }
        throw new module.InvalidFilterOperatorError("Invalid uri: " + fullURI + ". Couldn't parse '" + filterString + "' filter.", path, filterString);
    }

    /**
     *
     * @param {String} filterStrings array representation of conjunction and disjunction of filters
     *     without parenthesis. i.e., ['id=123', ';', 'id::gt::234', ';', 'id::le::345']
     * @param {string} fullURI used for logging purposes
     * @param {string} path used for redirect link generation
     * @return {ParsedFilter}
     *
     */
    function _processMultiFilterString(filterStrings, fullURI, path) {
        var filters = [];
        var type = null;
        for (var i = 0; i < filterStrings.length; i++) {
            if (type === null && filterStrings[i] === "&") {
                // first level filter type
                type = module.filterTypes.CONJUNCTION;
            } else if (type === null && filterStrings[i] === ";") {
                // first level filter type
                type = module.filterTypes.DISJUNCTION;
            } else if (type === module.filterTypes.CONJUNCTION && filterStrings[i] === ";") {
                // throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Invalid uri: " + fullURI + ". Couldn't parse '" + filterString + "' filter.", path, filterString);
            } else if (type === module.filterTypes.DISJUNCTION && filterStrings[i] === "&") {
                // throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Invalid uri: " + fullURI + ". Couldn't parse '" + filterString + "' filter.", path, filterString);
            } else if (filterStrings[i] !== "&" && filterStrings[i] !== ";") {
                // single filter on the first level
                var binaryFilter = _processSingleFilterString(filterStrings[i], fullURI);
                filters.push(binaryFilter);
            }
        }

        var filter = new ParsedFilter(type);
        filter.setFilters(filters);
        return filter;
    }

    /**
     * Given a parsedFilter object will return the corresponding facet.
     * If we cannot represent it with facet, it will return `null`.
     * Otherwise will return an object with
     *  - depth: showing the depth of filter.
     *  - facet: facet equivalent of the given filter
     *
     * @private
     * @param       {Object} parsedFilter the filter
     * @return      {Object}
     */
    function _filterToFacet(parsedFilter) {
        var res = _filterToFacetRec(parsedFilter, 0);

        // could not be parsed
        if (!res) return null;

        var depth = res.depth, facet = res.facet;

        // if facet didn't have any operator, then we create one with and
        if (!("or" in facet) && !("and" in facet)) {
          facet = {and: [module._simpleDeepCopy(facet)]};
          depth = 1;
        }

        return {facet: facet, depth: depth};
    }

    // does the process of changing filter to facet recursively
    function _filterToFacetRec(parsedFilter, depth) {
        var facet = {}, orSources = {}, parsed, op, i, f, nextRes, parentDepth;

        // base for binary predicate filters
        if (parsedFilter instanceof ParsedFilter && parsedFilter.type === module.filterTypes.BINARYPREDICATE){
            facet.source = parsedFilter.column;
            switch (parsedFilter.operator) {
                case module.OPERATOR.GREATER_THAN_OR_EQUAL_TO:
                    facet.ranges = [{min: parsedFilter.value}];
                    break;
                case module.OPERATOR.LESS_THAN_OR_EQUAL_TO:
                    facet.ranges = [{max: parsedFilter.value}];
                    break;
                case module.OPERATOR.GREATER_THAN:
                    facet.ranges = [{min: parsedFilter.value, min_exclusive: true}];
                    break;
                case module.OPERATOR.LESS_THAN:
                    facet.ranges = [{max: parsedFilter.value, max_exclusive: true}];
                    break;
                case module.OPERATOR.NULL:
                    facet.choices = [null];
                    break;
                case module.OPERATOR.CASE_INS_REG_EXP:
                    facet.search = [parsedFilter.value];
                    break;
                case module.OPERATOR.EQUAL:
                    facet.choices = [parsedFilter.value];
                    break;
                default:
                    // operator is not supported by facet
                    return null;
            }

            return {facet: facet, depth: depth};
        }

        if (Array.isArray(parsedFilter.filters)) {

            // we're going one level deeper (since it's an array it will be turned into object of sources)
            depth++;

            // set the filter type
            if (parsedFilter.type === module.filterTypes.DISJUNCTION) {
                op = "or";
            } else if (parsedFilter.type === module.filterTypes.CONJUNCTION) {
                op = "and";
            } else {
                return null;
            }

            // will add the facets in the parsed to facet object
            var mergeFacets = function (c) {
                if (!parsed[c]) return;
                if (!facet[op][index][c]) facet[op][index][c] = [];
                facet[op][index][c].push(parsed[c][0]);
            };

            parentDepth = depth;
            facet[op] = [];
            for (i = 0; i < parsedFilter.filters.length; i++) {
                f = parsedFilter.filters[i];

                // get the facet for this child filter
                nextRes = _filterToFacetRec(f, parentDepth);

                // couldn't parse it.
                if (!nextRes) return null;

                parsed = nextRes.facet;

                // depth of the parent will be the maximum depth of its children
                depth = Math.max(depth, nextRes.depth);


                // if operator is or and the filter is binary we can merge them
                // for example id=1;id=2 can turned into {source: "id", choices: ["1", "2"]}
                // or id=1;id::geq::2 can be {source: "id", "choices": ["1"], "ranges": [{min: 2}]}
                if (op === "or" && f.type === module.filterTypes.BINARYPREDICATE) {
                    if (orSources[parsed.source] > -1) {
                        // the source existed before, so it can be merged
                        var index = orSources[parsed.source];
                        ["ranges", "choices", "search"].forEach(mergeFacets);
                        continue;
                    } else {
                        orSources[parsed.source] = facet[op].length;
                    }
                }

                // add the facet into the list
                facet[op].push(parsed);
            }

            // if it's just one value, then we can just flatten the array and return that value.
            // the wrapper function will take care of adding the op, if it didn't exist
            if (facet[op].length === 1) {
              facet = facet[op][0];
              depth--;
            }

            return {facet: facet, depth: depth};
        }

       // invalid filter
       return null;
    }

    module.filterTypes = Object.freeze({
        BINARYPREDICATE: "BinaryPredicate",
        CONJUNCTION: "Conjunction",
        DISJUNCTION: "Disjunction",
        UNARYPREDICATE: "UnaryPredicate",
        NEGATION: "Negation"
    });

    /**
     * The complete structure of ermrest JSON filter is as follows:
     *
     * ```
     * <FILTERS>:  { <logical-operator>: <TERMSET> }
     * <TERMSET>: '[' <TERM> [, <TERM>]* ']'
     *
     * <TERM>:     { <logical-operator>: <TERMSET> }
     *             or
     *             { "source": <data-source>, <constraint(s)> }
     * ```
     *
     * But currently it only supports the following:
     *
     * {
     *  "and": [
     *      {
     *          "source": <data-source>,
     *          "choices": [v, ...],
     *          "ranges": [{"min": v1, "max": v2}, ...],
     *          "search": [v, ...],
     *          "not_null": true
     *      },
     *      ...
     *  ]
     * }
     *
     * <data-source> can be any of :
     * * -> the filter is in table level (not column)
     * string -> the filter is referring to a column (this is its name)
     * array -> the filter is referring to a column through a set of joins.
     *  - each element shoud have
     *      - An "inbound" or "outbound" key. Its value must be the constraint name array.
     *  - last element must be a string, which is the column name.
     *  for example:
     *  [{"inbound": ["s1", "fk1"]}, {"outbound": ["s2", "fk2"]}, "col"]
     *
     * For detailed explanation take a look at the following link:
     * https://github.com/informatics-isi-edu/ermrestjs/issues/447
     *
     * @param       {String|Object} str Can be blob or json (object).
     * @param       {String|Object} path to generate rediretUrl in error module.
     * @constructor
     */
    function ParsedFacets (str, path) {

        if (typeof str === 'object') {
            /**
             * encode JSON object that represents facets
             * @type {object}
             */
            this.decoded = str;

            /**
             * JSON object that represents facets
             * @type {string}
             */
            this.encoded = this._encodeJSON(str);
        } else {
            this.encoded = str;
            this.decoded = this._decodeJSON(str, path);
        }

        var andOperator = module._FacetsLogicalOperators.AND, obj = this.decoded;
        if (!obj.hasOwnProperty(andOperator) || !Array.isArray(obj[andOperator])) {
            // we cannot actually parse the facet now, because we haven't
            // introspected the whole catalog yet, and don't have access to the constraint objects.
            throw new module.InvalidFacetOperatorError('', path);
        }

    }

    ParsedFacets.prototype = {
        constructor: ParsedFacets,

        /**
         * Given a JSON return an encoded blob.
         *
         * @private
         * @param       {object} json JSON object
         * @return      {string} string blob
         */
        _encodeJSON: function (obj) {
            return module.encodeFacet(obj);
        },

        /**
         * Given a blob string return the JSON object.
         *
         * @private
         * @param       {string} blob the encoded JSON object.
         * @param       {String|Object} path to generate rediretUrl in error module.
         * @return      {object} decoded JSON object.
         */
        _decodeJSON: function (blob, path) {
            return module.decodeFacet(blob, path);
        }
    };

    /**
     * For the structure of JSON, take a look at ParsedFacets documentation.
     *
     * NOTE:
     * If any part of the facet is not as expected, it will throw emtpy string.
     * Any part of the code that is using this function should guard against the result
     * being empty, and throw error in that case.
     *
     * @param       {object} json  JSON representation of filters
     * @param       {string} alias the table alias
     * @constructor
     * @return      {string} A string representation of filters that is understanable by ermrest
     */
    _JSONToErmrestFilter = function(json, alias, tableName, catalogId, consNames) {
        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };


        var isDefinedAndNotNull = function (v) {
            return v !== undefined && v !== null;
        };

        var valueToString = function (v) {
            return (typeof v === "string") ? v :JSON.stringify(v);
        };

        // parse choices constraint
        var parseChoices = function (choices, column) {
            return choices.reduce(function (prev, curr, i) {
                var res = prev += (i !== 0 ? ";": "");
                if (isDefinedAndNotNull(curr)) {
                    res += module._fixedEncodeURIComponent(column) + "=" + module._fixedEncodeURIComponent(valueToString(curr));
                } else {
                    res += module._fixedEncodeURIComponent(column) + "::null::";
                }
                return res;
            }, "");
        };

        // parse ranges constraint
        var parseRanges = function (ranges, column) {
            var res = "", hasFilter = false, operator;
            ranges.forEach(function (range, index) {
                if (hasFilter) {
                    res += ";";
                    hasFilter = false;
                }

                if (isDefinedAndNotNull(range.min)) {
                    operator = module.OPERATOR.GREATER_THAN_OR_EQUAL_TO;
                    if (range.min_exclusive === true) {
                        operator = module.OPERATOR.GREATER_THAN;
                    }

                    res += module._fixedEncodeURIComponent(column) + operator + module._fixedEncodeURIComponent(valueToString(range.min));
                    hasFilter = true;
                }

                if (isDefinedAndNotNull(range.max)) {
                    operator = module.OPERATOR.LESS_THAN_OR_EQUAL_TO;
                    if (range.max_exclusive === true) {
                        operator = module.OPERATOR.LESS_THAN;
                    }

                    if (hasFilter) {
                        res += "&";
                    }
                    res += module._fixedEncodeURIComponent(column) + operator + module._fixedEncodeURIComponent(valueToString(range.max));
                    hasFilter = true;
                }
            });
            return res;
        };

        // parse search constraint
        var parseSearch = function (search, column) {
            var res, invalid = false;
            res = search.reduce(function (prev, curr, i) {
                if (curr == null) {
                    invalid = true;
                    return "";
                } else {
                    return prev + (i !== 0 ? ";": "") + _convertSearchTermToFilter(valueToString(curr), column);
                }
            }, "");

            return res;
        };

        // returns null if the path is invalid
        var parseDataSource = function (source, tableName, catalogId) {
            var res = [], fk, fkObj, i, table = tableName, isInbound, constraint;
            // from 0 to source.length-1 we have paths
            for (i = 0; i < source.length - 1; i++) {

                if ("inbound" in source[i]) {
                    constraint = source[i].inbound;
                    isInbound = true;
                } else if ("outbound" in source[i]) {
                    constraint = source[i].outbound;
                    isInbound = false;
                } else {
                    // given object was invalid
                    return null;
                }

                fkObj = findConsName(catalogId, constraint[0], constraint[1]);

                // constraint name was not valid
                if (fkObj == null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                    console.log("Invalid data source. fk with the following constraint is not available on catalog: " + constraint.toString());
                    return null;
                }

                fk = fkObj.object;

                // inbound
                if (isInbound && fk.key.table.name === table) {
                    res.push(fk.toString(false, true));
                    table = fk._table.name;
                }
                // outbound
                else if (!isInbound && fk._table.name === table) {
                    res.push(fk.toString(true, true));
                    table = fk.key.table.name;
                }
                else {
                    // the given object was not valid
                    return null;
                }
            }
            return res.length === 0 ? null : res.join("/");
        };

        // parse TERM (it will not do it recursively)
        // returns null if it's not valid
        var parseAnd = function (and) {
            var res = [], i, term, col, path, constraints, parsed;

            for (i = 0; i < and.length; i++) {
                path = ""; // the source path if there are some joins
                constraints = []; // the current constraints for this source
                term = and[i];

                if (typeof term !== "object") {
                    return "";
                }

                // parse the source
                if (_isFacetSourcePath(term.source)) {
                    path = parseDataSource(term.source, tableName, catalogId);
                    col = term.source[term.source.length - 1];
                } else {
                    col = _getFacetSourceColumnStr(term.source);
                    if (typeof col !== "string") {
                        return "";
                    }
                }

                // if the data-path was invalid, ignore this facet
                if (path === null) {
                    return "";
                }

                // parse the constraints
                if (Array.isArray(term.choices)) {
                    parsed = parseChoices(term.choices, col);
                    if (!parsed) {
                        return "";
                    }
                    constraints.push(parsed);
                }

                if (Array.isArray(term.ranges)) {
                    parsed = parseRanges(term.ranges, col);
                    if (!parsed) {
                        return "";
                    }
                    constraints.push(parsed);
                }

                if (Array.isArray(term.search)) {
                    parsed = parseSearch(term.search, col);
                    if (!parsed) {
                        return "";
                    }
                    constraints.push(parsed);
                }

                if (term.not_null === true) {
                    constraints.push("!(" + module._fixedEncodeURIComponent(col) + "::null::)");
                }

                if (constraints.length == 0) {
                    return "";
                }

                res.push((path.length !== 0 ? path + "/" : "") + constraints.join(";") + "/$" + alias);
            }
            return res.join("/");
        };

        var andOperator = module._FacetsLogicalOperators.AND;

        // NOTE we only support and at the moment.
        if (!json.hasOwnProperty(andOperator) || !Array.isArray(json[andOperator])) {
            return "";
        }

        var ermrestFilter = parseAnd(json[andOperator]);

        return !ermrestFilter ? "" : ermrestFilter;
    };

    _isFacetSourcePath = function (source) {
        return Array.isArray(source) && !(source.length === 1 && typeof source[0] === "string");
    };

    /**
     * Returns the last foreignkey in the source path.
     *
     * NOTE since constraint names is an object attached to ERMrest module,
     * in test environments sometimes it would return null, that's why we are
     * passing consNames to this function.
     * @param  {Object} source    the source object (path)
     * @param  {String} catalogId catalog id
     * @param  {Object} consNames constraint names defined (take a look at the note)
     * @return {Object} has `obj` (the actual fk object), and `isInbound`
     * @private
     */
    _getFacetSourceLastForeignKey = function (source, catalogId, consNames) {
        if (!_isFacetSourcePath(source)) {
            return null;
        }

        var lastJoin = source[source.length-2];
        var isInbound = false, constraint;

        if ("inbound" in lastJoin) {
            isInbound = true;
            constraint = lastJoin.inbound;
        } else {
            constraint = lastJoin.outbound;
        }

        return {
            "obj": consNames[catalogId][constraint[0]][constraint[1]].object,
            "isInbound": isInbound
        };
    };

    /**
     * Returns an array of foreignkeys that are in the given source path.
     *
     * NOTE since constraint names is an object attached to ERMrest module,
     * in test environments sometimes it would return null, that's why we are
     * passing consNames to this function.
     *
     * @param  {Object} source    the source object (path)
     * @param  {String} catalogId catalog id
     * @param  {Object} consNames constraint names defined (take a look at the note)
     * @return {Object[]} each object has `obj` (the actual fk object), and `isInbound`
     * @private
     */
    _getFacetSourceForeignKeys = function (source, catalogId, consNames) {
        var res = [];
        if (_isFacetSourcePath(source)) {
            var isInbound = false, constraint;
            for (var i = 0; i < source.length - 1; i++) {
                if ("inbound" in source[i]) {
                    isInbound = true;
                    constraint = source[i].inbound;
                } else {
                    isInbound = false;
                    constraint = source[i].outbound;
                }

                res.push({
                    "obj": consNames[catalogId][constraint[0]][constraint[1]].object,
                    "isInbound": isInbound
                });
            }
        }
        return res;
    };

    /**
     * get facet's source column string
     * @param  {Object} source source object
     * @return {string|Object}
     * @private
     */
    _getFacetSourceColumnStr = function (source) {
        return Array.isArray(source) ? source[source.length-1] : source;
    };

    /**
     * Given the source object, validates the path and returns the corresponding column object.
     * It will return `false` if the source is invalid.
     *
     * NOTE since constraint names is an object attached to ERMrest module,
     * in test environments sometimes it would return null, that's why we are
     * passing consNames to this function.
     *
     * @private
     *
     * @param  {Object} source    source object
     * @param  {ERMrest.Table} table the starting table of the path
     * @param  {object} consNames The constraint names (will be used for constraint lookup)
     * @return {ERMrest.Column|false}
     */
    _getFacetSourceColumn = function (source, table, consNames) {
        var colName, colTable = table;

        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        // from 0 to source.length-1 we have paths
        if (_isFacetSourcePath(source)) {
            var fk, i, isInbound, constraint, fkObj;
            for (i = 0; i < source.length - 1; i++) {

                if ("inbound" in source[i]) {
                    constraint = source[i].inbound;
                    isInbound = true;
                } else if ("outbound" in source[i]) {
                    constraint = source[i].outbound;
                    isInbound = false;
                } else {
                    // given object was invalid
                    return false;
                }

                fkObj = findConsName(colTable.schema.catalog.id, constraint[0], constraint[1]);

                // constraint name was not valid
                if (fkObj === null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                    return false;
                }

                fk = fkObj.object;

                // inbound
                if (isInbound && fk.key.table === colTable) {
                    colTable = fk._table;
                }
                // outbound
                else if (!isInbound && fk._table === colTable) {
                    colTable = fk.key.table;
                }
                else {
                    // the given object was not valid
                    return false;
                }
            }
            colName = source[source.length-1];
        } else {
            colName = _getFacetSourceColumnStr(source);
        }

        try {
            return colTable.columns.get(colName);
        } catch (exp) {
            return false;
        }

    };

    /**
     * If the column that the facetObject is representing is in entity mode
     * @param  {Object} facetObject the facet object
     * @param  {ERMrest.Column} column      the column objKey
     * @return {boolean} true if entity mode otherwise false.
     */
    _isFacetEntityMode = function (facetObject, column) {
        if (facetObject.entity === false) {
            return false;
        }

        // column is part of simple key
        return !column.nullok && column.memberOfKeys.filter(function (key) {
            return key.simple;
        }).length > 0;
    };

    _sourceHasInbound = function (source) {
        if (!_isFacetSourcePath(source)) return false;
        return source.some(function (n, index) {
            return (index != source.length-1) && ("inbound" in n);
        });
    };

    _sourceIsInboundForeignKey = function (sourceObject, column, consNames) {
        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        var invalid = !_isFacetSourcePath(sourceObject.source) || !_isFacetEntityMode(sourceObject, column) ||
                      sourceObject.aggregate || sourceObject.source.length > 3;

        if (invalid) {
            return false;
        }

        var source = sourceObject.source;
        var fks = _getFacetSourceForeignKeys(source, column.table.schema.catalog.id, consNames);
        if (fks.length === 2) {
            if (!fks[0].isInbound || fks[1].isInbound) {
                return false;
            }

            return fks[0].obj._table._isPureBinaryAssociation();
        }
        return fks[0].isInbound;
    };

    /**
     * List of logical operators that parser accepts in JSON facets.
     * @type {Object}
     */
    module._FacetsLogicalOperators = Object.freeze({
        AND: "and"
    });
