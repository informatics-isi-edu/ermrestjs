/*
 * Copyright 2016 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ERMrest = (function(module) {

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
     * The parse handles URI in this format
     * <service>/catalog/<catalog_id>/<api>/<schema>:<table>/[/filter(s)][/join(s)][/facets][/search][@sort(col...)][@before(...)/@after(...)][?]
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
        
        var searchRegExp = /\*::search::[^&]+/g;
        var joinRegExp = /\((.*)\)=\((.*:.*:.*)\)/;
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
        this._catalog = decodeURIComponent(parts[2]);

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
                    this._paging = modifiers.match(/(@before\([^\)]*\))/)[1];
                } else {
                    throw new module.MalformedURIError("Invalid uri: " + this._uri + ". Sort modifier is required with paging.");
                }
            } else if (modifiers.indexOf("@after(") !== -1) {
                if (this._sort) {
                    this._paging = modifiers.match(/(@after\([^\)]*\))/)[1];
                } else {
                    throw new module.MalformedURIError("Invalid uri: " + this._uri + ". Sort modifier is required with paging.");
                }
            }
        }

        // Split compact path on '/'
        // Expected format: "<schema:table>/<filter(s)>/<joins(s)>/<search>"
        parts = this._compactPath.split('/');

        var index = parts.length - 1;
        
        //<search>
        // search should be the last part of compact path
        var match = parts[index].match(searchRegExp);
        var that = this;
        if (match) { // this is a search filter
            
            this._searchFilter = parts[index];
            this._ermrestSearchFilter = "";
            
            match.forEach(function(f, idx, array) {
                var term = decodeURIComponent(f.match(/\*::search::(.+)/)[1]);
                
                // make sure the ermrest url is correct
                var ermrestFilter = _convertSearchTermToFilter(term);
                that._ermrestSearchFilter += (idx === 0 ? "" : "&") + ermrestFilter;

                that._searchTerm = (idx === 0? term : that._searchTerm + " " + term);
            });

            index -= 1;
        }
        
        match = parts[index].match(facetsRegExp);
        if (match) { // this is the facets blob
            this._facets = new ParsedFacets(match[1]);
            index -= 1;
        }

        
        // <join(s)>
        this._joins = [];
        // parts[1] to parts[index] might be joins
        var linking;
        for (var ji = 1; ji <= index; ji++) {
            linking = parts[ji].match(joinRegExp);
            if (!linking) continue;
            this._joins.push(_createJoin(linking));
        }
        
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

        //<filter(s)>
        // If there are filters appended after projection table
        // modify the columns to the linked table
        this._filtersString = '';
        if (parts[1]) {
            // TODO should refactor these checks into one match statement
            linking = parts[1].match(searchRegExp);
            var isSearch = parts[1].match(joinRegExp);
            var isFacets = parts[1].match(facetsRegExp);
            
            // parts[1] could be linking or search
            if (!linking && !isSearch && !isFacets) {
                this._filtersString = parts[1];
                
                // split by ';' and '&'
                var regExp = new RegExp('(;|&|[^;&]+)', 'g');
                var items = parts[1].match(regExp);
                
                // if a single filter
                if (items.length === 1) {
                    this._filter = _processSingleFilterString(items[0], this._uri);
                    
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
                            
                            filters.push(_processMultiFilterString(subfilters, this._uri));
                            
                        } else if (type === null && items[i] === "&") {
                            // first level filter type
                            type = module.filterTypes.CONJUNCTION;
                        } else if (type === null && items[i] === ";") {
                            // first level filter type
                            type = module.filterTypes.DISJUNCTION;
                        } else if (type === module.filterTypes.CONJUNCTION && items[i] === ";") {
                            // using combination of ! and & without ()
                            throw new module.InvalidFilterOperatorError("Invalid uri: " + this._uri + ". Parser doesn't support combination of conjunction and disjunction filters.");
                        } else if (type === module.filterTypes.DISJUNCTION && items[i] === "&") {
                            // using combination of ! and & without ()
                            throw new module.InvalidFilterOperatorError("Invalid uri: " + this._uri + ". Parser doesn't support combination of conjunction and disjunction filters.");
                        } else if (items[i] !== "&" && items[i] !== ";") {
                            // single filter on the first level
                            var binaryFilter = _processSingleFilterString(items[i], this._uri);
                            filters.push(binaryFilter);
                        }
                    }
                    
                    this._filter = new ParsedFilter(type);
                    this._filter.setFilters(filters);
                }
                
                //NOTE: might need to replace columns based on join
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
         * <service>/catalog/<catalogId>/<api>/<projectionSchema:projectionTable>/<filters>/<joins>/<search>/<sort>/<page>?<queryParams>
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::search::).
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
         * <projectionSchema:projectionTable>/<filters>/<joins>/<search>
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::search::).
         * 
         * @returns {String} Path without modifiers or queries
         */
        get compactPath() {
            if (this._compactPath === undefined) {
                var uri = "";
                if (this.projectionSchemaName) {
                    uri += this.projectionSchemaName + ":";
                }
                uri += this.projectionTableName;
                
                if (this.filtersString) {
                    uri += "/" + this.filtersString;
                }
                
                if (this.joins.length > 0) {
                    uri += "/" + this.joins.reduce(function (prev, join, i) {
                        return prev + (i > 0 ? "/" : "") + join.str;
                    }, "");
                }
                
                if (this.facets) {
                    uri += "/*::facets::" + this.facets.encoded;
                }
                
                if (this.searchFilter) {
                    uri += "/" + this.searchFilter;
                }
                
                this._compactPath = uri;
            }
            return this._compactPath;
        },
        
        
        /**
         * should only be used for internal usage and sending request to ermrest
         * NOTE: returns a uri that ermrest understands
         * 
         * <service>/catalog/<catalogId>/<api>/<projectionSchema:projectionTable>/<filters>/<joins>/<search>/<sort>/<page>
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
         * <projectionSchema:projectionTable>/<filters>/<joins>/<search>/<sort>/<page>
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
         * <projectionSchema:projectionTable>/<filters>/<joins>/<search>
         *
         * NOTE: 
         *  1. returns a path that ermrest understands
         *  2. Adds `M` alias to the last table.
         * @returns {String} Path without modifiers or queries for ermrest
         */
        get ermrestCompactPath() {
            if (this._ermrestCompactPath === undefined) {
                var tableAlias = "M";
                var joinsLength = this.joins.length;
                
                var uri = "";
                
                // add tableAlias
                if (joinsLength == 0) {
                    uri += tableAlias + ":=";
                }

                if (this.projectionSchemaName) {
                    uri += this.projectionSchemaName + ":";
                }
                uri += this.projectionTableName;
                
                if (this.filtersString) {
                    uri += "/" + this.filtersString;
                }
                
                if (joinsLength > 0) {
                    uri += "/" + this.joins.reduce(function (prev, join, i) {
                        return prev + (i > 0 ? "/" : "") + ((i == joinsLength - 1) ? tableAlias + ":=" : "") + join.str;
                    }, "");
                }
                
                if (this.facets) {
                    uri += "/" + _JSONToErmrestFilter(this.facets.decoded, tableAlias, this.tableName, this.catalog);
                }

                if (this.ermrestSearchFilter) {
                    uri += "/" + this.ermrestSearchFilter;
                }
                
                this._ermrestCompactPath = uri;
            }
            return this._ermrestCompactPath;
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
         * string of the search filter in the URI
         * @returns {string}
         */
        get searchFilter() {
            return this._searchFilter;
        },
        
        /**
         * string that search understands for search filter
         * @return {string}
         */
        get ermrestSearchFilter() {
            return this._ermrestSearchFilter;
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
            if (typeof json === 'object' && json !== null) {
                this._facets = new ParsedFacets(json);
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
        search: function(term) {
            
            var searchFilter = ""; // will be shown in chaise
            var filterString = _convertSearchTermToFilter(term); // ermrest uses this for http request

            if (filterString !== "") {
                this._searchTerm = term;
                searchFilter = "*::search::" + module._fixedEncodeURIComponent(term);
            } else {
                this._searchTerm = null;
            }
            
            // enforce updating uri
            this._setDirty();
            
            this._searchFilter = (searchFilter? searchFilter: undefined);
            this._ermrestSearchFilter = filterString;
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
         *
         * @returns {String} The string format of the paging modifier in the form of @before(..) or @after(...)
         */
        get paging() {
            return this._paging;
        },

        /**
         * get paging object, null if no paging
         * @returns {Object} in this format {"before":boolean, "row":[v1, v2, v3...]} where v is in same column order as in sort
         */
        get pagingObject() {
            var row, i, value;
            if (this._pagingObject === undefined) {
                if (this._paging) {
                    if (this._paging.indexOf("@before") !== -1) {
                        this._pagingObject = {};
                        this._pagingObject.before = true;
                        this._pagingObject.row = [];
                        row = this._paging.match(/@before\(([^\)]*)\)/)[1].split(",");
                        for (i = 0; i < this.sortObject.length; i++) { // use getting to force sortobject to be created, it could be undefined
                            // ::null:: to null, empty string to "", otherwise decode value
                            value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                            this._pagingObject.row.push(value);
                        }
                    } else if (this._paging.indexOf("@after(") !== -1) {
                        this._pagingObject = {};
                        this._pagingObject.before = false;
                        this._pagingObject.row = [];
                        row = this._paging.match(/@after\(([^\)]*)\)/)[1].split(",");
                        for (i = 0; i < this.sortObject.length; i++) { // use getter to force sortobject to be created, it could be undefined
                            // ::null:: to null, empty string to "", otherwise decode value
                            value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                            this._pagingObject.row.push(value);
                        }
                    }
                } else {
                    this._pagingObject = null;
                }
            }
            return this._pagingObject;
        },

        /**
         * change the paging with new pagingObject
         * @param {Object} po in this format {"before":boolean, "row":[v1, v2, v3...]} where v is in same column order as in sort
         */
        set pagingObject(po) {
            if ((!po && !this._paging) || (po === this._paging))
                return;

            // null or undefined = remove paing
            if (!po || po === {}) {
                delete this._paging;
                this._sortObject = null;
            }

            var oldPagingString = (this._paging? this._paging : "");
            if (this._sort) {
                this._pagingObject = po;
                this._paging = _getPagingModifier(po);
            } else {
                throw new module.MalformedURIError("Error setPagingObject: Paging not allowed without sort");
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
        if (!sort || sort.length === 0) {
            return "";
        }

        var modifier = "@sort(";
        for (var i = 0; i < sort.length; i++) {
            if (i !== 0) modifier = modifier + ",";
            modifier = modifier + module._fixedEncodeURIComponent(sort[i].column) + (sort[i].descending ? "::desc::" : "");
        }
        modifier = modifier + ")";
        return modifier;
    };

    /**
     * given paging object, get the paging modifier
     * @param {Object} paging {"before":boolean, "row":[c1,c2,c3..]}
     * @return {string} string modifier @paging(...)
     * @private
     */
    _getPagingModifier = function(paging) {

        // no paging
        if (!paging) {
            return "";
        }

        var modifier = (paging.before ? "@before(" : "@after(");
        for (var i = 0; i < paging.row.length; i++) {
            if (i !== 0) modifier = modifier + ",";
            modifier = modifier + ((paging.row[i] === null || paging.row[i] === undefined ) ? "::null::" : module._fixedEncodeURIComponent(paging.row[i]));
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
        column = (typeof column !== 'string') ? "*": column;
        
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

                filterString += (index === 0? "" : "&") + column + "::ciregexp::" + module._fixedEncodeURIComponent(exp);
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
          * @param filters array of binary predicate
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
     * @returns {ParsedFilter} returns the parsed representation of the filter
     * @desc converts a filter string to ParsedFilter
     */
    function _processSingleFilterString(filterString, fullURI) {
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
        throw new module.InvalidFilterOperatorError("Invalid uri: " + fullURI + ". Couldn't parse '" + filterString + "' filter.");
    }

    /**
     *
     * @param {String} filterStrings array representation of conjunction and disjunction of filters
     *     without parenthesis. i.e., ['id=123', ';', 'id::gt::234', ';', 'id::le::345']
     * @param {string} fullURI used for logging purposes
     * @return {ParsedFilter}
     *
     */
    function _processMultiFilterString(filterStrings, fullURI) {
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
                throw new module.InvalidFilterOperatorError("Invalid uri: " + fullURI + ". Couldn't parse '" + filterString + "' filter.");
            } else if (type === module.filterTypes.DISJUNCTION && filterStrings[i] === "&") {
                // throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Invalid uri: " + fullURI + ". Couldn't parse '" + filterString + "' filter.");
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
     *          "search": [v, ...]
     *      },
     *      ...
     *  ]
     * }
     *
     * For detailed explanation take a look at the following link:
     * https://github.com/informatics-isi-edu/ermrestjs/issues/447
     *
     * @param       {String|Object} str Can be blob or json (object).
     * @constructor
     */
    function ParsedFacets (str) {
        
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
            this.decoded = this._decodeJSON(str);
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
            return module._LZString.compressToEncodedURIComponent(JSON.stringify(obj,null,0));
        },
        
        /**
         * Given a blob string return the JSON object.
         *
         * @private
         * @param       {string} blob the encoded JSON object.
         * @return      {object} decoded JSON object.
         */
        _decodeJSON: function (blob) {
            try {
                return JSON.parse(module._LZString.decompressFromEncodedURIComponent(blob));
            } catch (exception) {
                console.log(exception);
                throw new module.MalformedURIError("Given encoded string for facets is not valid.");
            }
        }    
    };
    
    /**
     * For the structure of JSON, take a look at ParsedFacets documentation.
     * 
     * NOTE: 
     * If the data-path or the strucure is not as expected, it will just ignore facets
     * (won't throw any errros)
     * 
     * @param       {object} json  JSON representation of filters
     * @param       {string} alias the table alias
     * @constructor
     * @return      {string} A string representation of filters that is understanable by ermrest
     */
    _JSONToErmrestFilter = function(json, alias, tableName, catalogId) {
        var isDefinedAndNotNull = function (v) {
            return v !== undefined && v !== null;
        };
        
        // parse choices constraint
        var parseChoices = function (choices, column) {
            return choices.reduce(function (prev, curr, i) {
                var res = prev += (i != 0 ? ";": "");
                if (isDefinedAndNotNull(curr)) {
                    res += column + "=" + curr;
                } else {
                    res += column + "::null::";
                }
                return res;
            }, "");
        };
        
        // parse ranges constraint
        var parseRanges = function (ranges, column) {
            var res = "", hasFilter = false;
            ranges.forEach(function (range, index) {
                if (hasFilter) {
                    res += ";";
                    hasFilter = false;
                }
                
                if (isDefinedAndNotNull(range.min)) {
                    res += column + "::gt::" + range.min;
                    hasFilter = true;
                }
                
                if (isDefinedAndNotNull(range.max)) {
                    if (hasFilter) {
                        res += "&";
                    }
                    res += column + "::lt::" + range.max;
                    hasFilter = true;
                }
            });
            return res;
        };
        
        // parse search constraint
        var parseSearch = function (search, column) {
            return search.reduce(function (prev, curr, i) {
                return prev + (i != 0 ? ";": "") + _convertSearchTermToFilter(curr, column);
            }, "");
        };
        
        // returns null if the path is invalid
        var parseDataSource = function (source, tableName, catalogId) {
            var res = [], fk, i, table = tableName;
            // from 0 to source.length-1 we have paths
            for (i = 0; i < source.length - 1; i++) {
                fk = module._getConstraintObject(catalogId, source[i].schema, source[i].constraint);
                
                // constraint name was not valid
                if (fk == null || fk.subject !== module._constraintTypes.FOREIGN_KEY) {
                    return null;
                }
                
                fk = fk.object;
                
                // inbound
                if (fk.key.table.name === table) {
                    res.push(fk.toString());
                    table = fk._table.name;
                } 
                // outbound
                else if (fk._table.name === table) {
                    res.push(fk.toString(true));
                    table = fk.key.table.name;
                }
                else {
                    // constraint name was not valid
                    return null;
                }
            }
            return res.length == 0 ? null : res.join("/");
        };
        
        // parse TERM (it will not do it recursively)
        var parseAnd = function (and) {
            var res = [], i, term, col, path, constraints;
            
            for (i = 0; i < and.length; i++) {
                path = ""; // the source path if there are some joins
                constraints = []; // the current constraints for this source
                term = and[i];
                
                // ignore the facet, if there's no source in it.
                if (!term.hasOwnProperty('source')) {
                    continue;
                }
                
                // parse the source
                if (Array.isArray(term.source)) {
                    path = parseDataSource(term.source, tableName, catalogId);
                    col = term.source[term.source.length - 1];
                } else {
                    col = term.source;
                }
                
                // if the data-path was invalid, ignore this facet
                if (path === null) {
                    continue;
                }
                
                // parse the constraints
                if (Array.isArray(term.choices)) {
                    constraints.push(parseChoices(term.choices, col));
                }
                
                if (Array.isArray(term.ranges)) {
                    constraints.push(parseRanges(term.ranges, col));
                }
                
                if (Array.isArray(term.search)) {
                    constraints.push(parseSearch(term.search, col));
                }
                
                if (constraints.length > 0) {
                    res.push((path.length != 0 ? path + "/" : "") + constraints.join(";") + "/$" + alias);
                }
            }
            return res.join("/");
        };
        
        var ermrestFilter = "";
        
        var andOperator = module._FacetsLogicalOperators.AND;
        
        // NOTE we only support and at the moment.
        if (json.hasOwnProperty(andOperator) && Array.isArray(json[andOperator])) {
            ermrestFilter += parseAnd(json[andOperator]);
        }
        
        return ermrestFilter;
    };
    
    /**
     * List of logical operators that parser accepts in JSON facets.
     * @type {Object}
     */
    module._FacetsLogicalOperators = Object.freeze({
        AND: "and"
    });

    return module;

}(ERMrest || {}));
