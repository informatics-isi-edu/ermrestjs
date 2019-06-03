    /**
     * For the structure of JSON, take a look at ParsedFacets documentation.
     *
     * NOTE:
     * - If any part of the facet is not as expected, it will throw an object
     *   with ``"successful": false` and an appropriate `message`.
     *   Any part of the code that is using this function should guard against the result
     *   being empty, and throw error in that case.
     *
     * - We are not handling multiple `null` in the facet and it will restult in an error.
     *
     * - If we encounter a `null` filter, we are going to change the structure of url.
     *   Assume that this facet is for table `A` and table `B` has null filter. Therefore
     *   the url will be:
     *      S:B/<filters of B>/<path from B to A where the last join is right join>/<parsed filter of all the other facets>/$alias
     *   Compare this with the following which will be the result if none of the facets have `null`:
     *      <parsed fitler of all the facets>/$alias
     *   In this case, we are returning a `"rightJoin": true`. In this case, we
     *   have to make sure that the returned value must be the start of url and
     *   cannot be simply appended to the rest of url.
     *
     * @param       {object} json  JSON representation of filters
     * @param       {string} alias the table alias
     * @constructor
     * @return      {object} An object that will have the following attributes:
     * - successful: Boolean (true means successful, false means cannot be parsed).
     * - parsed: String  (if the given string was parsable).
     * - message: String (if the given string was not parsable)
     */
    _JSONToErmrestFilter = function(json, alias, tableName, catalogId, consNames) {
        var facetErrors = module._facetingErrors;

        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        var encode = module._fixedEncodeURIComponent;

        var isDefinedAndNotNull = function (v) {
            return v !== undefined && v !== null;
        };

        var valueToString = function (v) {
            return (typeof v === "string") ? v :JSON.stringify(v);
        };

        // whether the facet has null or not
        var hasNull = function (term) {
            var choice = module._facetFilterTypes.CHOICE;
            return Array.isArray(term[choice]) && term[choice].some(function (v) {
                return !isDefinedAndNotNull(v);
            });
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

            return invalid ? "" : res;
        };

        // returns null if the path is invalid
        // reverse: this will reverse the datasource and adds the root alias to the end
        var parseDataSource = function (source, alias, tableName, catalogId, reverse) {
            var fks = [], fk, fkObj, i, col, table, isInbound, constraint, schemaName, ignoreFk;

            var start = 0, end = source.length - 1;
            for (i = start; i < end; i++) {

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
                if (isInbound && fk.key.table.name === tableName) {
                    table = fk._table;
                }
                // outbound
                else if (!isInbound && fk._table.name === tableName) {
                    table = fk.key.table;
                }
                else {
                    // the given object was not valid
                    return null;
                }

                tableName = table.name;
                schemaName = table.schema.name;
                // fk.toString((reverse && !isInbound) || (!reverse && isInbound), false)
                fks.push({obj: fk, isInbound: isInbound});
            }

            // if the given facetSource doesn't have any path
            if (fks.length === 0) {
                return null;
            }

            // make sure column exists
            try {
                col = table.columns.get(source[source.length-1]);
            } catch (exp) {
                return null;
            }

            // if the last fk is using the same column that is used in facet,
            // and the column is not-null, we can just ignore that join.
            var fkCol = isInbound ? fk.colset.columns[0] : fk.key.colset.columns[0];
            if (!col.nullok && fk.simple && fkCol === col) {
                // change the column
                col = fk.isInbound ? fk.key.colset.columns[0] : fk.colset.columns[0];

                // change the table and schema names
                tableName = col.table.name;
                schemaName = col.table.schema.name;

                // remove the last foreginkey
                fks.pop();
            }

            // if we eliminated all the foreignkeys, then we don't need to reverse anything
            reverse = reverse && fks.length > 0;

            var path = fks.reduce(function (prev, fk, i) {
                var rev = ( (reverse && fk.isInbound) || (!reverse && !fk.isInbound) );
                var fkStr = fk.obj.toString(rev, false);
                if (reverse) {
                    // if we have reversed the path, we need to add the alias to the last bit
                    return ((i > 0) ? (fkStr + "/") : (alias + ":=right" + fkStr) ) + prev;
                } else {
                    return prev + (i > 0 ? "/" : "") + fkStr;
                }
            }, "");

            return {
                path: path,
                columnName: col.name, // we might optimize the path, so the column could be different
                tableName: tableName,
                schemaName: schemaName,
                reversed: reverse
            };
        };

        var getErrorOutput = function (message, index) {
            return {successful: false, message: message + "(index=" + index +")"};
        };

        // parse TERM (it will not do it recursively)
        // returns null if it's not valid
        var parseAnd = function (and) {
            var rightJoins = [],
                innerJoins = [],
                res, i, term, col, path, ds, constraints, parsed, useRightJoin;

            // go through list of facets
            for (i = 0; i < and.length; i++) {
                term = and[i];

                if (typeof term !== "object") {
                    return getErrorOutput(facetErrors.invalidFacet, i);
                }

                // get the column name
                col = _getSourceColumnStr(term.source);
                if (typeof col !== "string") {
                    return getErrorOutput(facetErrors.invalidSource, i);
                }

                // ---------------- parse the path ---------------- //
                path = ""; // the source path if there are some joins
                useRightJoin = false;
                if (_sourceHasPath(term.source)) {

                    // if there's a null filter and source has path, we have to use right join
                    // parse the datasource
                    ds = parseDataSource(term.source, alias, tableName, catalogId, hasNull(term));

                    // if the data-path was invalid, ignore this facet
                    if (ds === null) {
                        return getErrorOutput(facetErrors.invalidSource, i);
                    }

                    // the parsed path
                    path = ds.path;

                    // whether we are using right join or not.
                    useRightJoin = ds.reversed;

                    // if we already have used a right join, we should throw error.
                    if (rightJoins.length > 0 && useRightJoin) {
                        return getErrorOutput(facetErrors.onlyOneNullFilter, i);
                    }

                    col = ds.columnName;
                }

                // ---------------- parse the constraints ---------------- //
                constraints = []; // the current constraints for this source

                if (Array.isArray(term[module._facetFilterTypes.CHOICE])) {
                    parsed = parseChoices(term[module._facetFilterTypes.CHOICE], col);
                    if (!parsed) {
                        return getErrorOutput(facetErrors.invalidChoice, i);
                    }
                    constraints.push(parsed);
                }
                if (Array.isArray(term[module._facetFilterTypes.RANGE])) {
                    parsed = parseRanges(term[module._facetFilterTypes.RANGE], col);
                    if (!parsed) {
                        return getErrorOutput(facetErrors.invalidRange, i);
                    }
                    constraints.push(parsed);
                }
                if (Array.isArray(term[module._facetFilterTypes.SEARCH])) {
                    parsed = parseSearch(term[[module._facetFilterTypes.SEARCH]], col);
                    if (!parsed) {
                        return getErrorOutput(facetErrors.invalidSearch, i);
                    }
                    constraints.push(parsed);
                }
                if (term.not_null === true) {
                    constraints.push("!(" + module._fixedEncodeURIComponent(col) + "::null::)");
                }

                if (constraints.length == 0) {
                    return getErrorOutput(facetErrors.missingConstraints, i);
                }

                // ---------------- create the url with path and constraints ---------------- //
                if (useRightJoin) {
                    rightJoins.push([
                        encode(ds.schemaName) + ":" + encode(ds.tableName),
                        constraints.join(";"),
                        ds.path
                    ].join("/"));
                } else {
                    innerJoins.push((path.length !== 0 ? path + "/" : "") + constraints.join(";") + "/$" + alias);
                }
            }

            return {successful: true, parsed: rightJoins.concat(innerJoins).join("/"), rightJoin: rightJoins.length > 0};
        };

        var andOperator = module._FacetsLogicalOperators.AND;

        // NOTE we only support and at the moment.
        if (!json.hasOwnProperty(andOperator) || !Array.isArray(json[andOperator])) {
            return {successful: false, message: "Only conjunction of facets are supported."};
        }

        return parseAnd(json[andOperator]);
    };

    _sourceHasPath = function (source) {
        return Array.isArray(source) && !(source.length === 1 && typeof source[0] === "string");
    };

    _getFacetSourcePathLength = function (source) {
        if (!_sourceHasPath(source)) {
            return 0;
        }
        return source.length - 1;
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
        if (!_sourceHasPath(source)) {
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
        if (_sourceHasPath(source)) {
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
    _getSourceColumnStr = function (source) {
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
    _getSourceColumn = function (source, table, consNames) {
        var colName, colTable = table;

        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        // from 0 to source.length-1 we have paths
        if (_sourceHasPath(source)) {
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
            colName = _getSourceColumnStr(source);
        }

        try {
            return colTable.columns.get(colName);
        } catch (exp) {
            return false;
        }

    };

    /**
     * If the column that the sourceObject is representing is in entity mode
     * It will return true if:
     *  - entity is not set to false.
     *  - source is part of a not-null unique key, and has a path.
     *  - source is part of a not-null unique key, doesn't have path, and has self_link = true.
     *
     * @param  {Object} sourceObject the facet object
     * @param  {ERMrest.Column} column      the column objKey
     * @return {boolean} true if entity mode otherwise false.
     */
    _isSourceObjectEntityMode = function (sourceObject, column) {
        if (sourceObject.entity === false) {
            return false;
        }

        // column is part of simple key
        var hasKey = !column.nullok && column.memberOfKeys.filter(function (key) {
            return key.simple;
        }).length > 0;

        if (!_sourceHasPath(sourceObject.source)){
            return hasKey && sourceObject.self_link === true;
        }
        return hasKey ;
    };

    _sourceHasInbound = function (source) {
        if (!_sourceHasPath(source)) return false;
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

        var invalid = !_sourceHasPath(sourceObject.source) || !_isSourceObjectEntityMode(sourceObject, column) ||
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

    _processSourceObject = function (sourceObject, table, consNames) {
        var wm = module._warningMessages;

        if (typeof sourceObject !== "object" || !sourceObject.source) {
            return {error: true, message: wm.INVALID_SOURCE};
        }

        var colName, colTable = table, source = sourceObject.source;
        var hasPath = false, hasInbound = false;

        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        // from 0 to source.length-1 we have paths
        if (_sourceHasPath(source)) {
            hasPath = true;
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
                    return {error: true, message: "Invalid object in source element index=" + i};
                }

                fkObj = findConsName(colTable.schema.catalog.id, constraint[0], constraint[1]);

                // constraint name was not valid
                if (fkObj === null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                    return {errror: true, message: "Invalid constraint name in source element index=" + i};
                }

                fk = fkObj.object;

                // inbound
                if (isInbound && fk.key.table === colTable) {
                    hasInbound = true;
                    colTable = fk._table;
                }
                // outbound
                else if (!isInbound && fk._table === colTable) {
                    colTable = fk.key.table;
                }
                else {
                    // the given object was not valid
                    return {errror: true, message: "Invalid constraint name in source element index=" + i};
                }
            }
            colName = source[source.length-1];
        } else {
            colName = _getSourceColumnStr(source);
        }

        try {
            var col = colTable.columns.get(colName);

            //TODO this could be a prototype
            return {
                sourceObject: sourceObject,
                column: col,
                hasPath: hasPath,
                hasInbound: hasInbound
            };
        } catch (exp) {
            return {error: false, messsage: "Invalid column name in source"};
        }
    };
