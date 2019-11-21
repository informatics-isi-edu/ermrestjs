    _renderFacetHelpers = {
        findConsName: function (catalogId, schemaName, constraintName, consNames) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        },

        hasNullChoice: function (term) {
            var choice = module._facetFilterTypes.CHOICE;
            return Array.isArray(term[choice]) && term[choice].some(function (v) {
                return !isDefinedAndNotNull(v);
            });
        },

        valueToString: function (v) {
            return (typeof v === "string") ? v :JSON.stringify(v);
        },

        // parse choices constraint
        parseChoices: function (choices, column) {
            var encode = module._fixedEncodeURIComponent;
            return choices.reduce(function (prev, curr, i) {
                var res = prev += (i !== 0 ? ";": "");
                if (isDefinedAndNotNull(curr)) {
                    res += encode(column) + "=" + encode(_renderFacetHelpers.valueToString(curr));
                } else {
                    res += encode(column) + "::null::";
                }
                return res;
            }, "");
        },

        // parse ranges constraint
        parseRanges: function (ranges, column) {
            var encode = module._fixedEncodeURIComponent;
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

                    res += encode(column) + operator + encode(_renderFacetHelpers.valueToString(range.min));
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
                    res += encode(column) + operator + encode(_renderFacetHelpers.valueToString(range.max));
                    hasFilter = true;
                }
            });
            return res;
        },

        // parse search constraint
        parseSearch: function (search, column) {
            var res, invalid = false;
            res = search.reduce(function (prev, curr, i) {
                if (curr == null) {
                    invalid = true;
                    return "";
                } else {
                    return prev + (i !== 0 ? ";": "") + _convertSearchTermToFilter(_renderFacetHelpers.valueToString(curr), column);
                }
            }, "");

            return invalid ? "" : res;
        },

        // parse the facet part related to main search-box
        parseSearchBox: function (search, rootTable) {
            // by default we're going to apply search to all the columns
            var searchColumns = ["*"];

            // map to the search columns, if they are defined
            if (Array.isArray(rootTable.searchSourceDefinition)) {
                searchColumns = rootTable.searchSourceDefinition.map(function (sd) {
                    return sd.column.name;
                });
            }

            return searchColumns.map(function (cname) {
                return _renderFacetHelpers.parseSearch(search, cname);
            }).join(";");
        },

        // returns null if the path is invalid
        // reverse: this will reverse the datasource and adds the root alias to the end
        parseDataSource: function (source, alias, tableName, catalogId, reverse, consNames) {
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

                fkObj = _renderFacetHelpers.findConsName(catalogId, constraint[0], constraint[1], consNames);

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
        },

        getErrorOutput: function (message, index) {
           return {successful: false, message: message + "(index=" + index +")"};
       }

    };

    /**
     * Given a facet and extra needed attributes, return the equivalent ermrest query
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
     * @param       {string} schemaName the starting schema name
     * @param       {string} tableName the starting table name
     * @param       {string} catalogId the catalog id
     * @param       {ERMrest.catalog} [catalogObject] the catalog object (could be undefined)
     * @param       {Object[]} [consNames] the constraint names (could be undefined)
     * @constructor
     * @return      {object} An object that will have the following attributes:
     * - successful: Boolean (true means successful, false means cannot be parsed).
     * - parsed: String  (if the given string was parsable).
     * - message: String (if the given string was not parsable)
     */
    _renderFacet = function(json, alias, schemaName, tableName, catalogId, catalogObject, consNames) {
        var facetErrors = module._facetingErrors;
        var rootSchemaName = schemaName, rootTableName = tableName;

        var rootTable = null;
        try {
            rootTable = catalogObject.schemas.get(rootSchemaName).tables.get(tableName);
        } catch(exp) {
            // fail silently
        }

        var andOperator = module._FacetsLogicalOperators.AND;

        // NOTE we only support and at the moment.
        if (!json.hasOwnProperty(andOperator) || !Array.isArray(json[andOperator])) {
            return {successful: false, message: "Only conjunction of facets are supported."};
        }

        var and = json[andOperator],
            rightJoins = [], // if we have null in the filter, we have to use join
            innerJoins = [], // all the other facets that have been parsed
            encode = module._fixedEncodeURIComponent,
            res, i, term, col, path, ds, constraints, parsed, useRightJoin;

        // go through list of facets and parse each facet
        for (i = 0; i < and.length; i++) {
            term = and[i];

            // the given term must be an object
            if (typeof term !== "object") {
                return _renderFacetHelpers.getErrorOutput(facetErrors.invalidFacet, i);
            }

            //if it has sourcekey
            if (typeof term.sourcekey === "string") {
                // uses annotation therefore rootTable is required for it
                if (!rootTable) {
                    return _renderFacetHelpers.getErrorOutput("Couldn't parse the url since Location doesn't have acccess to the catalog object or main table is invalid.", i);
                }

                // parse the main search
                if (term.sourcekey === module._specialSourceDefinitions.SEARCH_BOX) {

                    // this sourcekey is reserved for search and search constraint is required
                    if (!Array.isArray(term[module._facetFilterTypes.SEARCH])) {
                        _renderFacetHelpers.getErrorOutput(facetErrors.missingConstraints, i);
                    }

                    // add the main search filter
                    innerJoins.push(_renderFacetHelpers.parseSearchBox(term[module._facetFilterTypes.SEARCH], rootTable)+ "/$" + alias);

                    // we can go to the next source in the and filter
                    continue;
                }
                // support sourcekey in the facets
                else {
                    var sd = rootTable.sourceDefinitions.sources[term.sourcekey];

                    // the sourcekey is invalid
                    if (!sd) {
                        return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSourcekey, i);
                    }

                    // copy the elements that are defined in the source def but not the one already defined
                    module._shallowCopyExtras(term, sd.sourceObject, module._sourceDefinitionAttributes);
                }
            }

            // get the column name
            col = _getSourceColumnStr(term.source);
            if (typeof col !== "string") {
                return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSource, i);
            }

            // ---------------- parse the path ---------------- //
            path = ""; // the source path if there are some joins
            useRightJoin = false;
            if (_sourceHasPath(term.source)) {

                // if there's a null filter and source has path, we have to use right join
                // parse the datasource
                ds = _renderFacetHelpers.parseDataSource(term.source, alias, tableName, catalogId, _renderFacetHelpers.hasNullChoice(term), consNames);

                // if the data-path was invalid, ignore this facet
                if (ds === null) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSource, i);
                }

                // the parsed path
                path = ds.path;

                // whether we are using right join or not.
                useRightJoin = ds.reversed;

                // if we already have used a right join, we should throw error.
                if (rightJoins.length > 0 && useRightJoin) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.onlyOneNullFilter, i);
                }

                col = ds.columnName;
            }

            // ---------------- parse the constraints ---------------- //
            constraints = []; // the current constraints for this source

            if (Array.isArray(term[module._facetFilterTypes.CHOICE])) {
                parsed = _renderFacetHelpers.parseChoices(term[module._facetFilterTypes.CHOICE], col);
                if (!parsed) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidChoice, i);
                }
                constraints.push(parsed);
            }
            if (Array.isArray(term[module._facetFilterTypes.RANGE])) {
                parsed = _renderFacetHelpers.parseRanges(term[module._facetFilterTypes.RANGE], col);
                if (!parsed) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidRange, i);
                }
                constraints.push(parsed);
            }
            if (Array.isArray(term[module._facetFilterTypes.SEARCH])) {
                parsed = _renderFacetHelpers.parseSearch(term[module._facetFilterTypes.SEARCH], col);
                if (!parsed) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSearch, i);
                }
                constraints.push(parsed);
            }
            if (term.not_null === true) {
                constraints.push("!(" + encode(col) + "::null::)");
            }

            if (constraints.length == 0) {
                return _renderFacetHelpers.getErrorOutput(facetErrors.missingConstraints, i);
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

        return {
            successful: true, // indicate that we successfully parsed the given facet object
            parsed: rightJoins.concat(innerJoins).join("/"), // the ermrest query
            rightJoin: rightJoins.length > 0 //whether we used any right outer join or not
        };
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
     * It will return true if entity is not set to false,
     * source is part of a not-null unique key, and has a path.
     *
     * @param  {Object} sourceObject the facet object
     * @param  {ERMrest.Column} column      the column objKey
     * @return {boolean} true if entity mode otherwise false.
     */
    _isSourceObjectEntityMode = function (sourceObject, column) {
        if (sourceObject.entity === false) {
            return false;
        }

        if (!_sourceHasPath(sourceObject.source)) {
            return false;
        }

        // column is part of simple key
        var hasKey = !column.nullok && column.memberOfKeys.filter(function (key) {
            return key.simple;
        }).length > 0;

        return hasKey;
    };

    /**
     * If a column is unique and not null
     * @param  {ERMrest.Column} column
     * @return {boolean}
     */
    _isColumnUniqueNotNull = function (column) {
        return !column.nullok && column.memberOfKeys.some(function (key) {
            return key.simple;
        });
    };

    _sourceHasInbound = function (source) {
        if (!_sourceHasPath(source)) return false;
        return source.some(function (n, index) {
            return (index != source.length-1) && ("inbound" in n);
        });
    };

    /**
     * @param {string|object} colObject if the foreignkey/key is compund, this should be the constraint name. otherwise the source syntax for pseudo-column.
     * @desc return the name that should be used for pseudoColumn. This function makes sure that the returned name is unique.
     * This function can be used to get the name that we're using for :
     *
     * - Composite key/foreignkeys:
     *   In this case, if the constraint name is [`s`, `c`], you should pass `s_c` to this function.
     * - Simple foiregnkey/key:
     *   Pass the equivalent pseudo-column definition of them. It must at least have `source` as an attribute.
     * - Pseudo-Columns:
     *   Just pass the object that defines the pseudo-column. It must at least have `source` as an attribute.
     *
     */
    module.generatePseudoColumnHashName = function (colObject) {

        //we cannot create an object and stringify it, since its order can be different
        //instead will create a string of `source + aggregate + entity`
        var str = "";

        // it should have source
        if (typeof colObject === "object") {
            if (!colObject.source) return null;

            if (_sourceHasPath(colObject.source)) {
                // since it's an array, it will preserve the order
                str += JSON.stringify(colObject.source);
            } else {
                str += _getSourceColumnStr(colObject.source);
            }

            if (typeof colObject.aggregate === "string") {
                str += colObject.aggregate;
            }

            // entity true doesn't change anything
            if (colObject.entity === false) {
                str += colObject.entity;
            }

            if (colObject.self_link === true) {
                str += colObject.self_link;
            }
        } else if (typeof colObject === "string"){
            str = colObject;
        } else {
            return null;
        }

        // md5
        str = ERMrest._SparkMD5.hash(str);

        // base64
        str = _hexToBase64(str);

        // url safe
        return _urlEncodeBase64(str);
    };


    /**
     * @private
     * @param  {Object} colObject the column definition
     * @param  {ERMrest.Column} column
     * @return {Object} the returned object has `name` and `isHash` attributes.
     * @desc generates a name for the given pseudo-column
     */
    _generatePseudoColumnName = function (colObject, column) {
        if (colObject && (colObject.self_link === true || (typeof colObject.aggregate === "string") || _sourceHasPath(colObject.source) || _isSourceObjectEntityMode(colObject, column))) {
            return {name: module.generatePseudoColumnHashName(colObject), isHash: true};
        }

        return {name: column.name, isHash: false};
    };

    _generateForeignKeyName = function (fk, isInbound) {
        var eTable = isInbound ? fk._table : fk.key.table;

        if (!isInbound) {
            return module.generatePseudoColumnHashName({
                source: [{outbound: fk.constraint_names[0]}, eTable.shortestKey[0].name]
            });
        }

        var source = [{inbound: fk.constraint_names[0]}];
        if (eTable.isPureBinaryAssociation) {
            var otherFK, pureBinaryFKs = eTable.pureBinaryForeignKeys;
            for (j = 0; j < pureBinaryFKs.length; j++) {
                if(pureBinaryFKs[j] !== fk) {
                    otherFK = pureBinaryFKs[j];
                    break;
                }
            }

            source.push({outbound: otherFK.constraint_names[0]});
            source.push(otherFK.key.table.shortestKey[0].name);
        } else {
            source.push(eTable.shortestKey[0].name);
        }

        return module.generatePseudoColumnHashName({source: source});
    };

    // TODO not used, could be removed
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

            return fks[0].obj._table.isPureBinaryAssociation;
        }
        return fks[0].isInbound;
    };

    // TODO could be used in other places too (generateColumnsList)
    _processSourceObject = function (sourceObject, table, consNames, prePendMessage) {
        var wm = module._warningMessages;
        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        var returnError = function (message) {
            return {error: true, message: prePendMessage + ": " + message};
        };

        if (typeof sourceObject !== "object" || !sourceObject.source) {
            return returnError(wm.INVALID_SOURCE);
        }

        var colName, colTable = table, source = sourceObject.source;
        var hasPath = false, hasInbound = false;


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
                    return returnError("Invalid object in source element index=" + i);
                }

                fkObj = findConsName(colTable.schema.catalog.id, constraint[0], constraint[1]);

                // constraint name was not valid
                if (fkObj === null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                    return returnError("Invalid constraint name in source element index=" + i);
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
                    return returnError("Invalid constraint name in source element index=" + i);
                }
            }
            colName = source[source.length-1];
        } else {
            colName = _getSourceColumnStr(source);
        }

        try {
            var col = colTable.columns.get(colName);
            var isEntity = _isSourceObjectEntityMode(sourceObject, col);

            // validate aggregate fn
            if (sourceObject.aggregate && module._pseudoColAggregateFns.indexOf(sourceObject.aggregate) === -1) {
                return returnError(wm.INVALID_AGG);
            }

            // has inbound and not aggregate, must be entity
            if (!sourceObject.aggregate && hasInbound && !isEntity) {
                return returnError(wm.MULTI_SCALAR_NEED_AGG);
            }

            var hashname = _generatePseudoColumnName(sourceObject, col);
            if (hashname.isHash && table.columns.has(hashname.name)) {
                var m = "Generated Hash `" + hashname.name + "` for pseudo-column exists in table `" + table.name +"`.";
                return returnError(m);
            }

            //TODO this could be a prototype
            return {
                name: hashname.name,
                isHash: hashname.isHash,
                sourceObject: sourceObject,
                column: col,
                hasPath: hasPath,
                hasInbound: hasInbound,
                isEntity: isEntity
            };
        } catch (exp) {
            return returnError("Invalid column name in source");
        }
    };
