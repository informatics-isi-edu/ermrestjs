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
    module.Location = Location;

    /**
     * The ERMrest service name. Internal use only.
     * @type {string}
     * @private
     */
    var _service_name = 'ermrest';

    /**
     * The length of the ERMrest service name. Internal use only.
     * @type {Number}
     * @private
     */
    var _service_name_len = _service_name.length;

    /**
     * This is an internal function that parses a URI and constructs an
     * internal representation of the URI.
     * @memberof ERMrest
     * @function _parse
     * @param {String} uri An ERMrest resource URI to be parsed.
     * @returns {Object} An object containing the parsed components of the URI.
     * @throws {ERMrest.InvalidInputError} If the URI does not contain the
     * service name.
     * @private
     */
    module._parse = function (uri) {
        var svc_idx = uri.indexOf(_service_name);
        if (svc_idx < 0) {
            throw new module.InvalidInputError('The URI does not contain the expected service name: ' + _service_name);
        }

        return new Location(uri);

    };

    /**
     *
     * uri = <service>/catalog/<catalog>/<api>/<path><sort><paging>?<limit>
     * service: the ERMrest service endpoint such as https://www.example.com/ermrest.
     * catalog: the catalog identifier for one dataset such as 42.
     * api: the API or data resource space identifier such as entity, attribute, attributegroup, or aggregate.
     * path: the data path which identifies one filtered entity set with optional joined context.
     * sort: optional @sort
     * paging: optional @before/@after
     * limit: optional ?limit
     *
     * @param {String} uri full path
     * @constructor
     */
    function Location(uri) {

        // full uri
        this._uri = uri;

        // compactUri is the full uri without modifiers
        if (uri.indexOf("@sort(") !== -1) {
            this._compactUri = uri.split("@sort(")[0];
        } else if (uri.indexOf("@before(") !== -1) {
            this._compactUri = uri.split("@before(")[0];
        } else if (uri.indexOf("@after(") !== -1) {
            this._compactUri = uri.split("@after(")[0];
        } else if (uri.indexOf("?limit=") !== -1) {
            this._compactUri = uri.split("?limit=")[0];
        } else {
            this._compactUri = uri;
        }

        // service
        var parts = uri.match(/(.*)\/catalog\/([^\/]*)\/(entity|attribute|aggregate|attributegroup)\/(.*)/);
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
                    throw new Error("Invalid uri: " + this._uri + ". Sort modifier required with paging");
                }
            } else if (modifiers.indexOf("@after(") !== -1) {
                if (this._sort) {
                    this._paging = modifiers.match(/(@after\([^\)]*\))/)[1];
                } else {
                    throw new Error("Invalid uri: " + this._uri + ". Sort modifier required with paging");
                }
            }
        }

        // Split compact path on '/'
        // Expected format: "[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*]"
        parts = this._compactPath.split('/');

        // first schema name and first table name
        // we can't handle complex path right now, only knows the first schema and table
        // so after doing a Reference.relate() and generate a new uri/location, we don't have schema/table information here
        if (parts[0]) {
            var params = parts[0].split(':');
            if (params.length > 1) {
                this._firstSchemaName = decodeURIComponent(params[0]);
                this._firstTableName = decodeURIComponent(params[1]);
            } else {
                this._firstSchemaName = '';
                this._firstTableName = decodeURIComponent(params[0]);
            }
        }

        // If there are filters appended to the URL
        // this is not used right now, but keep it in parsing
        if (parts[1]) {
            // split by ';' and '&'
            var regExp = new RegExp('(;|&|[^;&]+)', 'g');
            var items = parts[1].match(regExp);

            // if a single filter
            if (items.length === 1) {
                this._firstFilter = _processSingleFilterString(items[0]);

            } else {
                var filters = [];
                var type = null;
                for (var i = 0; i < items.length; i++) {
                    // process anything that's inside () first
                    if (items[i].startsWith("(")) {
                        items[i] = items[i].replace("(", "");
                        // collect all filters until reaches ")"
                        var subfilters = [];
                        while(true) {
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

                        filters.push(_processMultiFilterString(subfilters));

                    } else if (type === null && items[i] === "&") {
                        // first level filter type
                        type = "Conjunction";
                    } else if (type === null && items[i] === ";") {
                        // first level filter type
                        type = "Disjunction";
                    } else if (type === "Conjunction" && items[i] === ";") {
                        // using combination of ! and & without ()
                        throw new module.InvalidFilterOperatorError("Invalid filter " + parts[8]);
                    } else if (type === "Disjunction" && items[i] === "&") {
                        // using combination of ! and & without ()
                        throw new module.InvalidFilterOperatorError("Invalid filter " + parts[8]);
                    } else if (items[i] !== "&" && items[i] !== ";") {
                        // single filter on the first level
                        var binaryFilter = _processSingleFilterString(items[i]);
                        filters.push(binaryFilter);
                    }
                }

                this._firstFilter = new ParsedFilter(type);
                this._firstFilter.setFilters(filters);
            }
        }

    }

    Location.prototype = {

        get uri() {
            return this._uri;
        },

        get compactUri() {
            return this._compactUri;
        },

        get service() {
            return this._service;
        },

        get catalog() {
            return this._catalog;
        },

        get api() {
            return this._api;
        },

        get path() {
            return this._path;
        },

        get compactPath() {
            return this._compactPath;
        },

        get firstSchemaName() {
            return this._firstSchemaName;
        },

        get firstTableName() {
            return this._firstTableName;
        },

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
                this._sort = module._getSortModifier(so);
            }

            // update uri/path
            var newSortString = (this._sort? this._sort : "");
            if (oldSortString !== "") {
                this._uri = this._uri.replace(oldSortString, newSortString);
                this._path = this._path.replace(oldSortString, newSortString);
            } else { // add sort
                // since there was no sort, there isn't paging, and we are totally ignoring ?limit in the uri
                this._uri = this._compactUri + newSortString;
                this._path = this._compactPath + newSortString;
            }
        },

        get paging() {
            return this._paging;
        },

        /**
         * get paging object, null if no paging
         * @returns {Object} in this format {"before":boolean, "row":[v1, v2, v3...]} where v is in same column order as in sort
         */
        get pagingObject() {
            if (this._pagingObject === undefined) {
                if (this._paging) {
                    this.sortObject; // create this._sortObject if it hasn't
                    if (this._paging.indexOf("@before") !== -1) {
                        this._pagingObject = {};
                        this._pagingObject.before = true;
                        this._pagingObject.row = [];
                        var row = this._paging.match(/@before\(([^\)]*)\)/)[1].split(",");
                        for (var i = 0; i < this._sortObject.length; i++) {
                            // ::null:: to null, empty string to "", otherwise decode value
                            var value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                            this._pagingObject.row.push(value);
                        }
                    } else if (this._paging.indexOf("@after(") !== -1) {
                        this._pagingObject = {};
                        this._pagingObject.before = false;
                        this._pagingObject.row = [];
                        var row = this._paging.match(/@after\(([^\)]*)\)/)[1].split(",");
                        for (var i = 0; i < this._sortObject.length; i++) {
                            // ::null:: to null, empty string to "", otherwise decode value
                            var value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
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
                this._paging = module._getPagingModifier(po);
            } else {
                throw Error("Error setPagingObject: Paging not allowed without sort");
            }

            //  update uri/path
            var newPagingString = (this._paging? this._paging : "");
            if (oldPagingString !== "") {
                this._uri = this._uri.replace(oldPagingString, newPagingString);
                this._path = this._path.replace(oldPagingString, newPagingString);
            } else { // add paging
                // append to the end, we are totally ignoring ?limit in the uri
                this._uri = this._compactUri + this._sort + newPagingString;
                this._path = this._compactPath + this._sort + newPagingString;
            }
        }
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
     * @param filterString
     * @returns {ParsedFilter} returns the parsed representation of the filter
     * @desc converts a filter string to ParsedFilter
     */
    function _processSingleFilterString(filterString) {
        //check for '=' or '::' to decide what split to use
        var f, filter;
        if (filterString.indexOf("=") !== -1) {
            f = filterString.split('=');
            if (f[0] && f[1]) {
                filter = new ParsedFilter("BinaryPredicate");
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "=", decodeURIComponent(f[1]));
                return filter;
            } else {
                // invalid filter
                throw new module.InvalidFilterOperatorError("Invalid filter " + filterString);
            }
        } else {
            f = filterString.split("::");
            if (f.length === 3) {
                filter = new ParsedFilter("BinaryPredicate");
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                return filter;
            } else {
                // invalid filter error
                throw new module.InvalidFilterOperatorError("Invalid filter " + filterString);
            }
        }
    }

    /**
     *
     * @param {String} filterStrings array representation of conjunction and disjunction of filters
     *     without parenthesis. i.e., ['id=123', ';', 'id::gt::234', ';', 'id::le::345']
     * @return {ParsedFilter}
     *
     */
    function _processMultiFilterString(filterStrings) {
        var filters = [];
        var type = null;
        for (var i = 0; i < filterStrings.length; i++) {
            if (type === null && filterStrings[i] === "&") {
                // first level filter type
                type = "Conjunction";
            } else if (type === null && filterStrings[i] === ";") {
                // first level filter type
                type = "Disjunction";
            } else if (type === "Conjunction" && filterStrings[i] === ";") {
                // TODO throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Invalid filter " + filterStrings);
            } else if (type === "Disjunction" && filterStrings[i] === "&") {
                // TODO throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Invalid filter " + filterStrings);
            } else if (filterStrings[i] !== "&" && filterStrings[i] !== ";") {
                // single filter on the first level
                var binaryFilter = _processSingleFilterString(filterStrings[i]);
                filters.push(binaryFilter);
            }
        }

        var filter = new ParsedFilter(type);
        filter.setFilters(filters);
        return filter;
        //return {type: type, filters: filters};
    }

    return module;

}(ERMrest || {}));
