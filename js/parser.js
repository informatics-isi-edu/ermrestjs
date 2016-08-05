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

        var context = {
            uri: uri,
            compactUri: uri,
            baseUri: uri.slice(0,svc_idx+_service_name_len)
        };
        var path = context.path = uri.slice(svc_idx+_service_name_len); // string after service

        // Parse out @sort(...) parameter and assign to context
        // Expected format:
        //  ".../catalog/catalog_id/entity/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
        if (uri.indexOf("@sort(") !== -1) {

            var sorts = path.match(/@sort\((.*)\)/)[1].split(",");
            path = path.split("@sort(")[0];  // anything before @sort(..)
            context.compactUri = uri.split("@sort(")[0]; // remove @sort from uri

            // TODO jchen multiple columns
            context.sort = [];
            for (var i = 0; i < sorts.length; i++) {
                var sort = sorts[i];
                var column = (sort.endsWith("::desc::") ?
                    decodeURIComponent(sort.match(/(.*)::desc::/)[1]) : sort);
                context.sort.push({"column": column, "descending": sort.endsWith("::desc::")});
            }
        }

        // Split the URI on '/'
        // Expected format:
        //  ".../catalog/catalog_id/entity/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*]"
        var parts = path.split('/');

        if (parts.length < 3) {
            throw new module.MalformedURIError("Uri does not have enough qualifying information");
        }

        // parts[5] should be the catalog id only
        context.catalogId = parts[2];

        // parts[7] should be <schema-name>:<table-name>
        if (parts[4]) {
            var params = parts[4].split(':');
            if (params.length > 1) {
                context.schemaName = decodeURIComponent(params[0]);
                context.tableName = decodeURIComponent(params[1]);
            } else {
                context.schemaName = '';
                context.tableName = decodeURIComponent(params[0]);
            }
        }

        // If there are filters appended to the URL, add them to context.js
        if (parts[5]) {
            // split by ';' and '&'
            var regExp = new RegExp('(;|&|[^;&]+)', 'g');
            var items = parts[5].match(regExp);

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

                context.filter = new ParsedFilter(type);
                context.filter.setFilters(filters);
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
