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

    /**
    * This is an internal function that parses a URI and constructs an
    * internal representation of the URI.
    * @memberof ERMrest
    * @function _parse
    * @param {String} uri - uri to be parsed
    * @private
    */
    module._parse = function(uri, location) {

        var context = {};

        context.uri = uri;

        if (location) {
            context.serviceUrl = location.origin + '/ermrest';
        } else {
            // parse to the end of the FQDN terminating in .edu, .org etc
        }

        // Then, parse the URL fragment id (aka, hash). Expected format:
        //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
        var hash = uri.substring(uri.indexOf('#'));
        if (hash === undefined || hash === '' || hash.length === 1) {
            return;
        }

        // parse out @sort(...)
        if (hash.indexOf("@sort(") !== -1) {
            context.sort = hash.match(/@sort\((.*)\)/)[1];
            hash = hash.split("@sort(")[0];
        }

        // start extracting values after '#' symbol
        var parts = hash.substring(1).split('/');

        // parts[0] should be the catalog id only
        context.catalogId = parts[0];

        // parts[1] should be <schema-name>:<table-name>
        if (parts[1]) {
            var params = parts[1].split(':');
            if (params.length > 1) {
                context.schemaName = decodeURIComponent(params[0]);
                context.tableName = decodeURIComponent(params[1]);
            } else {
                context.schemaName = '';
                context.tableName = decodeURIComponent(params[0]);
            }
        }

        // If there are filters appended to the URL, add them to context.js
        if (parts[2]) {
            // split by ';' and '&'
            var regExp = new RegExp('(;|&|[^;&]+)', 'g');
            var items = parts[2].match(regExp);

            // if a single filter
            if (items.length === 1) {
                context.filter = _processSingleFilterString(items[0]);

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
                        throw new Error("Invalid filter " + parts[2]);
                    } else if (type === "Disjunction" && items[i] === "&") {
                        // using combination of ! and & without ()
                        throw new Error("Invalid filter " + parts[2]);
                    } else if (items[i] !== "&" && items[i] !== ";") {
                        // single filter on the first level
                        var binaryFilter = _processSingleFilterString(items[i]);
                        filters.push(binaryFilter);
                    }
                }

                context.filter = {type: type, filters: filters};
            }
        }
        return context;
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
                throw new Error("Invalid filter " + filterString);
            }
        } else {
            f = filterString.split("::");
            if (f.length === 3) {
                filter = new ParsedFilter("BinaryPredicate");
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                return filter;
            } else {
                // invalid filter error
                throw new Error("Invalid filter " + filterString);
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
                throw new Error("Invalid filter " + filterStrings);
            } else if (type === "Disjunction" && filterStrings[i] === "&") {
                // TODO throw invalid filter error (using combination of ! and &)
                throw new Error("Invalid filter " + filterStrings);
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
