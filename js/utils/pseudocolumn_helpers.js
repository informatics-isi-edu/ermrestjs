    _renderFacetHelpers = {
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
        parseSearchBox: function (search, rootTable, alias, pathPrefixAliasMapping) {
            // by default we're going to apply search to all the columns
            var searchColumns = ["*"], path = "", searchDefCols;

            // map to the search columns, if they are defined
            if (rootTable && Array.isArray(rootTable.searchSourceDefinition)) {
                searchDefCols = rootTable.searchSourceDefinition;
                searchColumns = searchDefCols.map(function (sd, i) {
                    // getting the path from the first one is enough
                    if (i === 0 && sd.hasPath) {
                        path = _sourceColumnHelpers.parseSourceNodesWithAliasMapping(
                            sd.sourceObjectNodes,
                            sd.lastForeignKeyNode,
                            sd.foreignKeyPathLength,
                            sd.sourceObject && isStringAndNotEmpty(sd.sourceObject.sourcekey) ? sd.sourceObject.sourcekey : null,
                            pathPrefixAliasMapping,
                            alias
                        ).path;

                        if (path.length > 0) {
                            path += "/";
                        }
                    }

                    return sd.column.name;
                });
            }

            return path + searchColumns.map(function (cname) {
                return _renderFacetHelpers.parseSearch(search, cname);
            }).join(";");
            // TODO alias is always added but it could be conditional:
            // (path.length > 0 ?  "/$" + alias : "")
        },

        /**
         * returns null if the path is invalid
         * @param {Object} source
         * @oaram {String=} sourcekey - the sourcekey name
         * @param {String} alias
         * @param {ERMrest.Table=} rootTable - might be undefined
         * @param {String} tableName
         * @param {String} catalogId
         * @param {Boolean} reverse - this will reverse the datasource and adds the root alias to the end
         * @param {Object} consNames
         * @ignore
         */
        parseDataSource: function (source, sourcekey, alias, rootTable, tableName, catalogId, reverse, consNames, pathPrefixAliasMapping) {
            var res = _sourceColumnHelpers.processDataSourcePath(source, rootTable, tableName, catalogId, consNames);

            if (res.error || res.sourceObjectNodes.length == 0) {
                // TODO FILTER_IN_SOURCE should we log the error?
                return null;
            }

            tableName = res.column.table.name;
            var sourceNodes = res.sourceObjectNodes,
                col = res.column,
                schemaName = res.column.table.schema.name,
                lastForeignKeyNode = res.lastForeignKeyNode,
                foreignKeyPathLength = res.foreignKeyPathLength;

            // if we eliminated all the foreignkeys, then we don't need to reverse anything
            reverse = reverse && foreignKeyPathLength > 0;

            var parsedRes = _sourceColumnHelpers.parseSourceNodesWithAliasMapping(
                sourceNodes, lastForeignKeyNode, foreignKeyPathLength, sourcekey,
                pathPrefixAliasMapping, alias, reverse
            );

            return {
                path: parsedRes.path,
                columnName: col.name, // we might optimize the path, so the column could be different
                tableName: tableName,
                schemaName: schemaName,
                reversed: reverse,
                pathPrefixAliasMapping: pathPrefixAliasMapping
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
     *      <parsed filter of all the facets>/$alias
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
     * @param       {Array} usedSourceObjects (optional) the source objects that are used in other parts (outbound)
     * @param       {Object[]} [consNames] the constraint names (could be undefined)
     * @constructor
     * @return      {object} An object that will have the following attributes:
     * - successful: Boolean (true means successful, false means cannot be parsed).
     * - parsed: String  (if the given string was parsable).
     * - message: String (if the given string was not parsable)
     */
    _renderFacet = function(json, alias, schemaName, tableName, catalogId, catalogObject, usedSourceObjects, consNames) {
        var facetErrors = module._facetingErrors;
        var rootSchemaName = schemaName, rootTableName = tableName;

        var rootTable = null;
        try {
            rootTable = catalogObject.schemas.findTable(rootTableName, rootSchemaName);
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
            encode = module._fixedEncodeURIComponent, sourcekey,
            i, term, col, path, ds, constraints, parsed, useRightJoin;

        var pathPrefixAliasMapping = {aliases: {}, usedSourceKeys: {},lastIndex: 0};

        // pre process the list of facets and find the path prefixes that are used
        _sourceColumnHelpers._populateUsedSourceKeys(
            pathPrefixAliasMapping.usedSourceKeys,
            Array.isArray(usedSourceObjects) ? and.concat(usedSourceObjects) : and,
            rootTable
        );

        // go through list of facets and parse each facet
        for (i = 0; i < and.length; i++) {
            term = and[i];
            sourcekey = "";

            // the given term must be an object
            if (typeof term !== "object") {
                return _renderFacetHelpers.getErrorOutput(facetErrors.invalidFacet, i);
            }

            //if it has sourcekey
            if (typeof term.sourcekey === "string") {
                sourcekey = term.sourcekey;

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
                    innerJoins.push(_renderFacetHelpers.parseSearchBox(term[module._facetFilterTypes.SEARCH], rootTable, alias, pathPrefixAliasMapping)+ "/$" + alias);

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
            col = _sourceColumnHelpers._getSourceColumnStr(term.source);
            if (typeof col !== "string") {
                return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSource, i);
            }

            // ---------------- parse the path ---------------- //
            path = ""; // the source path if there are some joins
            useRightJoin = false;
            if (_sourceColumnHelpers._sourceHasPath(term.source)) {

                // if there's a null filter and source has path, we have to use right join
                // parse the datasource
                ds = _renderFacetHelpers.parseDataSource(term.source, sourcekey, alias, rootTable, tableName, catalogId, _renderFacetHelpers.hasNullChoice(term), consNames, pathPrefixAliasMapping);

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
                // innerJoins.push((path.length !== 0 ? path + "/" : "") + constraints.join(";") + (path.length !== 0 ? ("/$" + alias) : ""));
            }
        }

        return {
            successful: true, // indicate that we successfully parsed the given facet object
            parsed: rightJoins.concat(innerJoins).join("/"), // the ermrest query
            rightJoin: rightJoins.length > 0, //whether we used any right outer join or not
            pathPrefixAliasMapping: pathPrefixAliasMapping
        };
    };

    /**
     * @param {Object} source the source array or string
     * @desc
     * Will compress the source that can be used for logging purposes. It will,
     *  - `inbound` to `i`
     *  - `outbound` to `o`
     *  - `sourcekey` to `key`
     *  - `alias` to `a`
     *  - `filter` to `f`
     *  - `operand_pattern` to `opd`
     *  - `operator` to `opr`
     *  - `negate` to `n`
     * @private
     */
    _compressSource = function (source) {
        if (!source) return source;

        var res = module._simpleDeepCopy(source);
        var shorter = module._shorterVersion;
        var shorten = function (node) {
            return function (k) {
                renameKey(node, k, shorter[k]);
            };
        };

        if (!_sourceColumnHelpers._sourceHasPath(source)) return res;

        for (var i = 0; i < res.length; i++) {
            ["alias", "sourcekey", "inbound", "outbound", "filter", "operand_pattern", "operator", "negate"].forEach(shorten(res[i]));
        }
        return res;
    };

    /**
     * @param {Object} facet the facet object
     * Given a facet will compress it so it can be used for logging purposes, it will,
     *  - `inbound` to `i`
     *  - `outbound` to `o`
     *  - `source` to `src`
     *  - `sourcekey` to `key`
     *  - `choices` to `ch`
     *  - `ranges` to `r`
     *  - `search` to `s`
     * NOTE: This function supports combination of conjunction and disjunction.
     * @private
     */
    _compressFacetObject = function (facet) {
        var res = module._simpleDeepCopy(facet),
            and = module._FacetsLogicalOperators.AND,
            or = module._FacetsLogicalOperators.OR,
            shorter = module._shorterVersion;

        var shorten = function (node) {
            return function (k) {
                renameKey(node, k, shorter[k]);
            };
        };

        var compressRec = function (node) {
            if ("source" in node) {
                node.src = _compressSource(node.source);
                delete node.source;

                ["choices", "ranges", "search", "sourcekey"].forEach(shorten(node));
            } else {
                [and, or].forEach(function (operator) {
                    if (!Array.isArray(node[operator])) return;

                    node[operator].forEach(compressRec);
                });
            }
        };

        compressRec(res);
        return res;
    };

    /**
     * Process the defined waitfor
     *
     * It will
     * - ignore entitysets for non-detailed contexts.
     * - will ignore normal columns.
     * will return an object with the following attributes:
     * - waitForList: an array of pseudo-columns
     * - hasWaitFor: whether any of the waitFor columns is seconadry
     * - hasWaitForAggregate: whether any of the waitfor columns are aggregate
     * @param {Array|String} waitFor - the waitfor definition
     * @param {ERMrest.Reference} baseReference - the reference that this waitfor is based on
     * @param {ERMrest.Table} currentTable - the current table.
     * @param {ERMrest.ReferenceColumn=} currentColumn - if this is defined on a column.
     * @param {ERMrest.Tuple=} mainTable - the main tuple data.
     * @param {String} message - the message that should be appended to warning messages.
     * @private
     */
    module._processWaitForList = function (waitFor, baseReference, currentTable, currentColumn, mainTuple, message) {
        var wfList = [], hasWaitFor = false, hasWaitForAggregate = false, waitFors = [];
        if (Array.isArray(waitFor)) {
            waitFors = waitFor;
        } else if (typeof waitFor === "string") {
            waitFors = [waitFor];
        }

        var consideredWaitFors = {};
        waitFors.forEach(function (wf, index) {
            var errorMessage = "wait_for defined on table=`" + currentTable.name + "`, " + message + "`, index=" + index + ": ";
            if (typeof wf !== "string") {
                module._log.warn(errorMessage + "must be an string");
                return;
            }

            // duplicate
            if (consideredWaitFors[wf]) {
                return;
            }
            consideredWaitFors[wf] = true;

            // column names
            if (wf in currentTable.sourceDefinitions.columns) {
                // there's no reason to add normal columns.
                return;
            }

            // sources
            if ((wf in currentTable.sourceDefinitions.sources)) {
                var sd = currentTable.sourceDefinitions.sources[wf];

                // entitysets are only allowed in detailed
                if (sd.hasInbound && !sd.sourceObject.aggregate && baseReference._context !== module._contexts.DETAILED) {
                    module._log.warn(errorMessage + "entity sets are not allowed in non-detailed.");
                    return;
                }

                // NOTE because it's redundant
                if (currentColumn && sd.name === currentColumn.name) {
                    // don't add itself
                    return;
                }

                // there's at least one secondary request
                if (sd.hasInbound || sd.sourceObject.aggregate) {
                    hasWaitFor = true;
                }

                // NOTE this coukd be in the table.sourceDefinitions
                // the only issue is that in there we don't have the mainTuple...
                var pc = module._createPseudoColumn(baseReference, sd, mainTuple);

                // ignore normal columns
                if (!pc.isPseudo || pc.isAsset) return;

                if (pc.isPathColumn && pc.hasAggregate) {
                    hasWaitForAggregate = true;
                }

                wfList.push(pc);

                return;
            }

        });

        return {
            hasWaitFor: hasWaitFor,
            hasWaitForAggregate: hasWaitForAggregate,
            waitForList: wfList
        };
    };

    /**
     * The functions that are used in Reference.facetColumns API
     * @ignore
     */
    _facetColumnHelpers = {

        /**
         * Given a ReferenceColumn, InboundForeignKeyPseudoColumn, or ForeignKeyPseudoColumn
         * will return the facet object that should be used.
         * The returned facet will always be entity, if we cannot show
         * entity picker (table didn't have simple key), we're ignoring it.
         * @ignore
         */
        refColToFacetObject: function (refCol) {
            var obj;

            if (refCol.isKey) {
                var baseCol = refCol._baseCols[0];
                obj = {"source": baseCol.name};

                // integer and serial key columns should show choice picker
                if (baseCol.type.name.indexOf("int") === 0 || baseCol.type.name.indexOf("serial") === 0) {
                    obj.ux_mode = module._facetFilterTypes.CHOICE;
                }
                return module._facetHeuristicIgnoredTypes.indexOf(baseCol.type.name) === -1 ? obj : null;
            }

            // if the pseudo-column table doesn't have simple key
            if (refCol.isPseudo && refCol.table.shortestKey.length > 1) {
                return null;
            }

            if (refCol.isForeignKey) {
                var constraint = refCol.foreignKey.constraint_names[0];
                return {
                    "source":[
                            {"outbound": constraint},
                            refCol.table.shortestKey[0].name
                ],
                    "markdown_name": refCol.displayname.unformatted,
                    "entity": true
                };
            }

            // TODO FILTER_IN_SOURCE
            if (refCol.isInboundForeignKey) {
                var res = [];
                var origFkR = refCol.foreignKey;
                var association = refCol.reference.derivedAssociationReference;
                var column = refCol.table.shortestKey[0];

                if (refCol.sourceObjectWrapper) {
                    res = module._simpleDeepCopy(refCol.sourceObjectWrapper.source);
                } else {
                    res.push({"inbound": origFkR.constraint_names[0]});
                    if (association) {
                        res.push({
                            "outbound": association._secondFKR.constraint_names[0]
                        });
                    }
                    res.push(column.name);
                }

                return {"source": res, "markdown_name": refCol.displayname.unformatted, "entity": true};
            }

            obj = {"source": refCol.name};

            // integer and serial key columns should show choice picker
            if (refCol._baseCols[0].isUniqueNotNull &&
               (refCol.type.name.indexOf("int") === 0 || refCol.type.name.indexOf("serial") === 0)) {
                obj.ux_mode = module._facetFilterTypes.CHOICE;
            }

            return module._facetHeuristicIgnoredTypes.indexOf(refCol._baseCols[0].type.name) === -1 ? obj : null;
        },

        /**
         * Given a source object wrapper,  do we support the facet for it or not
         * @ignore
         */
        checkFacetObjectWrapper: function (facetObjectWrapper) {
            var col = facetObjectWrapper.column;

            // aggregate is not supported
            if (facetObjectWrapper.hasAggregate) {
                return false;
            }

            // column type array is not supported
            if (col.type.isArray) {
                return false;
            }

            // check the column type
            return module._facetUnsupportedTypes.indexOf(col.type.name) === -1;
        },

        /**
         * Given a referenceColumn, do we support facet for it.
         * if we do, it will return a facetObject that can be used.
         * @ignore
         */
        checkRefColumn: function (col) {
            // virtual columns are not supported.
            if (col.isVirtualColumn) {
                return false;
            }

            // column type array is not supported
            if (col.type.isArray || col._baseCols[0].type.isArray) {
                return false;
            }

            if (col.isPathColumn) {
                if (col.hasAggregate) return false;
                return module._simpleDeepCopy(col.sourceObjectWrapper.sourceObject);
            }

            // we're not supporting facet for asset or composite keys (composite foreignKeys is supported).
            if ((col.isKey && !col._simple) || col.isAsset) {
                return false;
            }

            var fcObj = _facetColumnHelpers.refColToFacetObject(col);

            // this filters the following unsupported cases:
            //  - foreignKeys in a table that only has composite keys.
            if (!fcObj) {
                return false;
            }

            return fcObj;
        },

        /**
         * given two facet definitions, it will merge their filters.
         * only add choices, range, search, and not_null
         * @ignore
         */
        mergeFacetObjects: function (source, extra) {
            if (extra.not_null === true) {
                source.not_null = true;
            }

            ['choices', 'ranges', 'search'].forEach(function (key) {
                if (!Array.isArray(extra[key])) {
                    return;
                }

                if (!Array.isArray(source[key])) {
                    source[key] = [];
                }
                extra[key].forEach(function (ch) {
                    // in choices we can have null
                    if (key !== "choices" && ch == null) {
                        return;
                    }

                    // in range we must have one of min, or max.
                    if ( key === 'ranges' && (!isDefinedAndNotNull(ch.min) && !isDefinedAndNotNull(ch.max)) ) {
                        return;
                    }

                    // don't add duplicates
                    if (source[key].length > 0) {
                        if (key !== 'ranges') {
                            if (source[key].indexOf(ch) !== -1) return;
                        } else {
                            var exist = source[key].some(function (s) {
                                return (s.min === ch.min && s.max == ch.max && s.max_exclusive == ch.max_exclusive && s.min_exclusive == ch.min_exclusive);
                            });
                            if (exist) return;
                        }
                    }

                    source[key].push(ch);
                });
            });
        },

        /**
         * make sure that facetObject is pointing to the correct table.
         * NOTE this is only valid in entity mode.
         * NOTE: facetColumns MUST be only used in COMPACT_SELECT context
         * It doesn't feel right that I am doing contextualization in here,
         * it's something that should be in client.
         * @ignore
         */
        checkForAlternative: function (facetObjectWrapper, usedAnnotation, table, consNames) {
            var currTable = facetObjectWrapper.column.table;
            var compactSelectTable = currTable._baseTable._getAlternativeTable(module._contexts.COMPACT_SELECT);

            // there's no alternative table
            if (currTable === compactSelectTable) {
                return true;
            }

            // it's not entity mode
            if (!facetObjectWrapper.isEntityMode) {
                return true;
            }

            // filter is based on alternative for another context, but we have to move to another table
            // we're not supporting this and we should just ignore it.
            if (currTable._isAlternativeTable()) {
                return false;
            }

            // filter is based on main, but we have to move to the alternative
            // we should add the join, if the filter is based on the key
            if (!currTable._isAlternativeTable() && compactSelectTable._isAlternativeTable()) {
                var fk = compactSelectTable._altForeignKey;
                if (!fk.simple || facetObjectWrapper.column !== fk.key.colset.columns[0]) {
                    return false;
                }

                var sourceObject = facetObjectWrapper.sourceObject;
                sourceObject.source[sourceObject.source.length-1] = {"inbound": fk.constraint_names[0]};
                sourceObject.source.push(fk.colset.columns[0].name);

                // the makrdown_name came from the heuristics
                if (!usedAnnotation && sourceObject.markdown_name) {
                    delete sourceObject.markdown_name;
                }

                // update the object and all its properties.
                // TODO can this be improved?
                facetObjectWrapper = new SourceObjectWrapper(sourceObject, table, consNames, true);
            }

            return true;
        },

        /**
         * Given a facetWrapper object, will send a request to fetch the rows associated with the `choices`
         * This will return a promise that will be resolved with an object that has the following attributes:
         * - invalidChoices: The choices that were ignored.
         * - originalChoices: The original list of choices
         * - andFilterObject: the given input but with the following modifications:
         *    - a new entityChoiceFilterPage is added that stores the page result
         *    - choices are modified based on the result.
         * @param {ERMrest.SourceObjectWrapper} andFilterObject - the facet object
         * @param {Object} contextHeaderParams  - the object that should be logged with read request
         */
        getEntityChoiceRows: function (andFilterObject, contextHeaderParams) {
            var defer = module._q.defer(), sourceObject = andFilterObject.sourceObject;

            var res = {
                andFilterObject: andFilterObject,
                invalidChoices: [],
                originalChoices: []
            };

            // if there's source_domain use it
            var projectedColumnName = andFilterObject.column.name,
                filterColumnName = andFilterObject.column.name;
            if (isObjectAndNotNull(sourceObject.source_domain) && isStringAndNotEmpty(sourceObject.source_domain.column)) {
                filterColumnName = sourceObject.source_domain.column;
            }

            var filterStrs = [], filterTerms = {}, hasNullChoice = false;

            res.originalChoices = sourceObject.choices;
            sourceObject.choices.forEach(function (ch, index) {
                if (ch in filterTerms) {
                    return;
                }
                if (ch== null) {
                    hasNullChoice = true;
                    return;
                }

                filterStrs.push(
                    module._fixedEncodeURIComponent(filterColumnName) + "=" + module._fixedEncodeURIComponent(ch)
                );
                filterTerms[ch] = index;
            });

            if (filterStrs.length === 0) {
                return defer.resolve(res), defer.promise;
            }

            if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                // TODO this should be improved
                // TODO stack is missing while it should be passed form the parent
                contextHeaderParams = {
                    "action": ":set/facet,choice/preselect;preload"
                };
            }
            var table = andFilterObject.column.table;
            var uri = [
                table.schema.catalog.server.uri ,"catalog" ,
                table.schema.catalog.id, "entity",
                module._fixedEncodeURIComponent(table.schema.name) + ":" + module._fixedEncodeURIComponent(table.name),
                filterStrs.join(";")
            ].join("/");

            var ref = new Reference(module.parse(uri), table.schema.catalog).contextualize.compactSelect;

            // sorting to ensure a deterministic order of results
            ref = ref.sort([{"column": filterColumnName, "descending": false}]);
            (function (filterColumnName, projectedColumnName) {
                // TODO depending on the number of columns this should potentially be multiple requests
                //      because of the url limitation
                ref.read(sourceObject.choices.length, contextHeaderParams, true).then(function (page) {

                    // feels hacky
                    res.andFilterObject.entityChoiceFilterPage = page;

                    // find the missing choices and also fix the choices if they are based on some other columns
                    if (page.length != filterStrs.length || filterColumnName != projectedColumnName) {
                        var newChoices = [];
                        page.tuples.forEach(function (t) {
                            newChoices.push(t.data[projectedColumnName]);
                            delete filterTerms[t.data[filterColumnName]];
                        });

                        // keep track of choices that we invalidated so we
                        // can create a proper error message
                        res.invalidChoices = Object.keys(filterTerms);

                        if (hasNullChoice) {
                            newChoices.push(null);
                        }

                        // kinda hacky
                        // make sure the choices only include the valid ones (might be empty)
                        // and also make sure the values are based on the correct column
                        res.andFilterObject.sourceObject.choices = newChoices;
                    }

                    defer.resolve(res);
                }).catch(function (err) {
                    // if any of the values had issue, the whole request is failing
                    // TODO should we try to recover based on other values??
                    res.invalidChoices = Object.keys(filterTerms);
                    res.andFilterObject.sourceObject.choices = [];

                    module._log.error("Error while trying to fetch entity facet rows: ", err);

                    defer.resolve(res);
                });
            })(filterColumnName, projectedColumnName);

            return defer.promise;
        },

        /**
         * Instead of q.all() we're using this function so we have more control
         * over the requests. This will make sure we're only sending "4" requests
         * at once.
         * @param {Array} promises
         * @param {Function} resolveCB
         * @param {Function} rejectCB
         */
        runAllEntityChoicePromises: function (promises, resolveCB, rejectCB) {
            var helpers = _facetColumnHelpers,
                promiseLen = promises.length,
                donePromises = 0,
                rejected = false,
                resolved = false,
                busySlots = 0,
                response = [],
                error = null,
                maxSlots = 4; // maximum number of requests we're sending at the same time

            var addToResponse = function (res, i) {
                response[i] = res;
                donePromises++;
            };

            var _runNextPromise = function () {
                if (!Array.isArray(response)) {
                    response = [];
                }
                if (error) {
                    // make sure we're calling rejectCB only once
                    if (rejected) return;
                    rejected = true;

                    // reject the callback
                    rejectCB(error);
                    return;
                }

                if (promises.length === 0) {
                    // if all the promises are processed resolve
                    // this will make sure we're calling this once
                    // and only when all the promises are done
                    if (donePromises >= promiseLen && !resolved) {
                        resolved = true;
                        resolveCB(response);
                    }
                    return;
                }

                // don't send more than maxSlots at once
                if (busySlots >= maxSlots) {
                    return;
                }

                var obj = promises.shift();
                var i = promiseLen - promises.length - 1;

                if (obj.mapEntityChoices) {
                    busySlots++;
                    // run the promise
                    helpers.getEntityChoiceRows(obj.andFilterObject).then(function (res) {
                        addToResponse(res, i);
                        busySlots--;
                        _runNextPromise();
                        return;
                    }).catch(function (err) {
                        error = err;
                        _runNextPromise();
                        return;
                    });
                } else {
                    // if it's not a promise then just add to the response
                    addToResponse(obj, i);
                }

                _runNextPromise();
            };

            _runNextPromise(0);
        }
    };

    function SourceObjectWrapper (sourceObject, table, consNames, isFacet, sources) {
        this.sourceObject = sourceObject;

        // if the extra objects are not passed, we cannot process
        if (isObjectAndNotNull(table) && isObjectAndNotNull(consNames)) {
            var res = this._process(table, consNames, isFacet, sources);
            if (res.error) {
                throw new Error(res.message);
            }
        }
    }

    SourceObjectWrapper.prototype = {

        clone: function (sourceObject, table, consNames, isFacet) {
            var key, res, self = this;

            // remove the definition attributes
            module._sourceDefinitionAttributes.forEach(function (attr) {
                delete sourceObject[attr];
            });

            for (key in self.sourceObject) {
                if (!self.sourceObject.hasOwnProperty(key)) continue;

                // only add the attributes that are not defined again
                if (!sourceObject.hasOwnProperty(key)) {
                    sourceObject[key] = self.sourceObject[key];
                }
            }

            res = new SourceObjectWrapper(sourceObject, table, consNames, isFacet);

            return res;
        },

        /**
         * Parse the given sourceobject and create the attributes
         * @param {ERMrest.Table} table
         * @param {Object} consNames
         * @param {boolean} isFacet  -- validation is differrent if it's a facet
         * @returns  {Object}
         */
        _process: function (table, consNames, isFacet, sources) {
            var self = this, sourceObject = this.sourceObject, wm = module._warningMessages;

            var returnError = function (message) {
                return {error: true, message: message};
            };

            if (typeof sourceObject !== "object" || !sourceObject.source) {
                return returnError(wm.INVALID_SOURCE);
            }

            var colName, col, colTable = table, source = sourceObject.source, sourceObjectNodes = [];
            var hasPath = false, hasInbound = false, hasPrefix = false, isFiltered = false, foreignKeyPathLength = 0;
            var lastForeignKeyNode, firstForeignKeyNode;

            // just the column name
            if (isStringAndNotEmpty(source)){
                colName = source;
            }
            // from 0 to source.length-1 we have paths
            else if (Array.isArray(source) && source.length === 1 && isStringAndNotEmpty(source[0])) {
                colName = source[0];
            }
            else if (Array.isArray(source) && source.length > 1) {
                var res = _sourceColumnHelpers.processDataSourcePath(source, table, table.name, table.schema.catalog.id, consNames, sources);
                if (res.error) {
                    return res;
                }

                hasPath = res.foreignKeyPathLength > 0;
                hasInbound = res.hasInbound;
                hasPrefix = res.hasPrefix;
                firstForeignKeyNode = res.firstForeignKeyNode;
                lastForeignKeyNode = res.lastForeignKeyNode;
                colTable = res.column.table;
                foreignKeyPathLength = res.foreignKeyPathLength;
                sourceObjectNodes = res.sourceObjectNodes;
                colName = res.column.name;
                isFiltered = res.isFiltered;
            }  else {
                return returnError("Invalid source definition");
            }

            // we need this check here to make sure the column is in the table
            try {
                col = colTable.columns.get(colName);
            } catch (exp) {
                return returnError(wm.INVALID_COLUMN_IN_SOURCE_PATH);
            }
            var isEntity = hasPath && (sourceObject.entity !== false) && col.isUniqueNotNull;

            // validate aggregate fn
            if (isFacet !== true && sourceObject.aggregate && module._pseudoColAggregateFns.indexOf(sourceObject.aggregate) === -1) {
                return returnError(wm.INVALID_AGG);
            }

            self.column = col;

            self.hasPrefix = hasPrefix;
            self.hasPath = hasPath;
            self.foreignKeyPathLength = foreignKeyPathLength;
            self.hasInbound = hasInbound;
            self.hasAggregate = typeof sourceObject.aggregate === "string";
            self.isFiltered = isFiltered;
            self.isEntityMode = isEntity;
            self.isUnique = !self.hasAggregate && !self.isFiltered && (!hasPath || !hasInbound);
            // TODO FILTER_IN_SOURCE better name...
            self.isUniqueFiltered = !self.hasAggregate && self.isFiltered && (!hasPath || !hasInbound);

            // attach last fk
            if (lastForeignKeyNode != null) {
                self.lastForeignKeyNode = lastForeignKeyNode;
            }

            // attach first fk
            if (firstForeignKeyNode != null) {
                self.firstForeignKeyNode = firstForeignKeyNode;
            }

            // generate name:
            // TODO maybe we shouldn't even allow aggregate in faceting (for now we're ignoring it)
            if ((sourceObject.self_link === true) || self.hasPath || self.isEntityMode || (isFacet !== false && self.hasAggregate)) {
                var rawSourceObject = JSON.parse(JSON.stringify(sourceObject));

                // if the source has path, we should make sure the given sourceObject for hash is raw (not using alias)
                //  a pseudo-column using path prefix should be treated differently from one without it.
                if (self.hasPath) {
                    rawSourceObject.source = [];
                    sourceObject.source.forEach(function (sn, index) {
                        rawSourceObject.source.push(sn);

                        // remove alias property
                        if (typeof sn === "object" && "alias" in sn) {
                            delete rawSourceObject.source[rawSourceObject.source.length-1].alias;
                        }
                    });
                }
                self.name = _sourceColumnHelpers.generateSourceObjectHashName(rawSourceObject, isFacet);
                self.isHash = true;

                if (table.columns.has(self.name)) {
                    return returnError("Generated Hash `" + hashname.name + "` for pseudo-column exists in table `" + table.name +"`.");
                }
            }else {
                self.name = col.name;
                self.isHash = false;
            }

            self.sourceObjectNodes = sourceObjectNodes;

            return self;
        },

        /**
         * Return the string representation of this foreignkey path
         * returned format:
         * if not isLeft and outAlias is not passed: ()=()/.../()=()
         * if isLeft: left()=()/.../left()=()
         * if outAlias defined: ()=()/.../outAlias:=()/()
         * used in:
         *   - export default
         *   - column.getAggregate
         *   - reference.read
         * @param {Boolean} reverse whether we want the reverse path
         * @param {Boolean} isLeft use left join
         * @param {String=} outAlias the alias that should be added to the output
         */
        toString: function (reverse, isLeft, outAlias, isReverseRightJoin) {
            var self = this;
            return self.sourceObjectNodes.reduce(function (prev, sn, i) {
                if (sn.isFilter) {
                    if (reverse) {
                        return (i > 0 ? "/" : "") + sn.toString() + prev;
                    } else {
                        return prev + (i > 0 ? "/" : "") + sn.toString();
                    }
                }

                // it will always be the first one
                if (sn.isPathPrefix) {
                    // if we're reversing, we have to add alias to the first one,
                    // otherwise we only need to add alias if this object only has a prefix and nothing else
                    if (reverse) {
                        return sn.toString(reverse,isLeft, outAlias, isReverseRightJoin);
                    } else {
                        return sn.toString(reverse, isLeft, self.foreignKeyPathLength == sn.foreignKeyPathLength ? outAlias : null, isReverseRightJoin);
                    }
                }

                var fkStr = sn.toString(reverse, isLeft);
                var addAlias = outAlias &&
                               (reverse && sn === self.firstForeignKeyNode ||
                               !reverse && sn === self.lastForeignKeyNode );

                // NOTE alias on each node is ignored!
                // currently we've added alias only for the association and
                // therefore it's not really needed here anyways
                var res = "";
                if (reverse) {
                    if (i > 0) {
                        res += fkStr + "/";
                    } else {
                        if (addAlias) {
                            res += outAlias + ":=";
                            if (isReverseRightJoin) {
                                res += "right";
                            }
                        }
                        res += fkStr;
                    }

                    res += prev;
                    return res;
                } else {
                    return prev + (i > 0 ? "/" : "") + (addAlias ? outAlias + ":=" : "") + fkStr;
                }

            }, "");

        },

        /**
         * Turn this into a raw source path without any path prefix
         * NOTE the returned array is not a complete path as it
         *      doesn't include the last column
         * currently used in two places:
         *   - generating hashname for a sourcedef that uses path prefix
         *   - generating the reverse path for a related entitty
         * @param {Boolean} reverse
         * @param {String=} outAlias alias that will be added to the last fk
         *                     regardless of reversing or not
         */
        getRawSourcePath: function (reverse, outAlias) {
            var path = [], self = this, obj;
            var len = self.sourceObjectNodes.length;
            var isLast = function (index) {
                return reverse ? (index >= 0) : (index < len);
            };

            var i = reverse ? (len-1) : 0;
            while (isLast(i)) {
                sn = self.sourceObjectNodes[i];
                if (sn.isPathPrefix) {
                    // if this is the last element, we have to add the alias to this
                    path = path.concat(sn.nodeObject.getRawSourcePath(reverse, self.foreignKeyPathLength == sn.foreignKeyPathLength ? outAlias : null));
                }
                else if (sn.isFilter) {
                    path.push(sn.nodeObject);
                }  else {
                    if ((reverse && sn.isInbound) || (!reverse && !sn.isInbound)) {
                        obj = {"outbound": sn.nodeObject.constraint_names[0]};
                    } else {
                        obj = {"inbound": sn.nodeObject.constraint_names[0]};
                    }

                    // add alias to the last element
                    if (isStringAndNotEmpty(outAlias) && sn == self.lastForeignKeyNode){
                        obj.alias = outAlias;
                    }

                    path.push(obj);
                }

                i = i + (reverse ? -1 : 1);
            }
            return path;
        },

        /**
         * Return the reverse path as facet with the value of shortestkey
         * currently used in two places:
         *   - column.refernece
         *   - reference.generateRelatedReference
         * both are for generating the reverse related entity path
         * @param {ERMrest.Tuple} tuple
         * @param {ERMrest.Table} rootTable
         * @param {String=} outAlias
         */
        getReverseAsFacet: function (tuple, rootTable, outAlias) {
            if (!isObjectAndNotNull(tuple)) return null;
            var i, col, filters = [], filterSource = [];

            // create the reverse path
            filterSource = this.getRawSourcePath(true, outAlias);

            // add the filter data
            for (i = 0; i < rootTable.shortestKey.length; i++) {
                col = rootTable.shortestKey[i];
                if (!tuple.data || !tuple.data[col.name]) {
                    return null;
                }
                filter = {
                    source: filterSource.concat(col.name)
                };
                filter[module._facetFilterTypes.CHOICE] = [tuple.data[col.name]];
                filters.push(filter);
            }

            if (filters.length == 0) {
                return null;
            }

            return {"and": filters};
        },
    };

    /**
     * Helper functions related to source syntax
     * @ignore
     */
    _sourceColumnHelpers = {
        processDataSourcePath: function (source, rootTable, tableName, catalogId, consNames, sources) {
            var wm = module._warningMessages;
            var returnError = function (message) {
                return {error: true, message: message};
            };

            var findConsName = function (schemaName, constraintName) {
                var result;
                if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                    result = consNames[catalogId][schemaName][constraintName];
                }
                return (result === undefined) ? null : result;
            };

            var i, fkAlias, constraint, isInbound, fkObj, fk, colTable = rootTable, hasInbound = false, firstForeignKeyNode, lastForeignKeyNode,
                foreignKeyPathLength = 0, sourceObjectNodes = [], isFiltered = false, hasPrefix = false, hasOnlyPrefix = false, prefix;

            for (i = 0; i < source.length - 1; i++) {
                if ("sourcekey" in source[i]) {
                    if (i != 0 || hasPrefix) {
                        return returnError("`sourcekey` can only be used as prefix and only once");
                    }
                    hasPrefix = true;
                    hasOnlyPrefix = true;

                    if (isObjectAndNotNull(sources)) {
                        prefix = sources[source[i].sourcekey];
                    } else {
                        if (!isObjectAndNotNull(rootTable)) {
                            return returnError("Couldn't parse the url since Location doesn't have acccess to the catalog object or main table is invalid.");
                        }
                        prefix = rootTable.sourceDefinitions.sources[source[i].sourcekey];
                    }

                    if (!prefix) {
                        return returnError("sourcekey is invalid.");
                    }

                    if (!prefix.hasPath) {
                        return returnError("referrred `sourcekey` must be a foreign key path.");
                    }
                    sourceObjectNodes.push(new SourceObjectNode(prefix, false, false, false, true, source[i].sourcekey));

                    firstForeignKeyNode = prefix.firstForeignKeyNode;
                    lastForeignKeyNode = prefix.lastForeignKeyNode;
                    foreignKeyPathLength += prefix.foreignKeyPathLength;
                    colTable = prefix.column.table;
                    tableName = prefix.column.table.name;
                    hasInbound = hasInbound || prefix.hasInbound;
                    isFiltered = isFiltered || prefix.isFiltered;
                }
                else if ("filter" in source[i] || "and" in source[i] || "or" in source[i]) {
                    if (!isObjectAndNotNull(colTable)) {
                        return returnError("Couldn't parse the url since Location doesn't have acccess to the catalog object or main table is invalid.");
                    }

                    isFiltered = true;
                    try {
                        sourceObjectNodes.push(new SourceObjectNode(source[i], true, false, false, false, undefined, undefined, colTable));
                    } catch (exp) {
                        return returnError(exp.message);
                    }
                    continue;
                }
                else if (("inbound" in source[i]) || ("outbound" in source[i])) {
                    isInbound = ("inbound" in source[i]);
                    constraint = isInbound ? source[i].inbound : source[i].outbound;

                    fkAlias = null;
                    if ("alias" in source[i] && typeof source[i].alias === "string") {
                        fkAlias = source[i].alias;
                    }

                    fkObj = findConsName(constraint[0], constraint[1]);

                    // constraint name was not valid
                    if (fkObj === null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                        return returnError("Invalid data source. fk with the following constraint is not available on catalog: " + constraint.toString());
                    }

                    fk = fkObj.object;
                    foreignKeyPathLength++;

                    // inbound
                    if (isInbound && fk.key.table.name === tableName) {
                        hasInbound = true;
                        colTable = fk._table;
                    }
                    // outbound
                    else if (!isInbound && fk._table.name === tableName) {
                        colTable = fk.key.table;
                    }
                    else {
                        // the given object was not valid
                        return returnError("Invalid constraint name in source element index=" + i);
                    }

                    tableName = colTable.name;

                    var sn = new SourceObjectNode(fk, false, true, isInbound, false, null, fkAlias);
                    sourceObjectNodes.push(sn);

                    if (firstForeignKeyNode == null) {
                        firstForeignKeyNode = sn;
                    }
                    lastForeignKeyNode = sn;
                    hasOnlyPrefix = false;
                }  else {
                    // given object was invalid
                    return returnError("Invalid object in source element index=" + i);
                }
            }

            try {
                col = colTable.columns.get(source[source.length-1]);
            } catch (exp) {
                return returnError(wm.INVALID_COLUMN_IN_SOURCE_PATH);
            }

            return {
                sourceObjectNodes: sourceObjectNodes,
                firstForeignKeyNode: firstForeignKeyNode,
                lastForeignKeyNode: lastForeignKeyNode,
                column: col,
                foreignKeyPathLength: foreignKeyPathLength,
                isFiltered: isFiltered,
                hasInbound: hasInbound,
                hasPrefix: hasPrefix,
                hasOnlyPrefix: hasOnlyPrefix
            };
        },

        /**
         * Given a list of source nodes and lastFK, will parse it
         * - This function will modify the given pathPrefixAliasMapping by adding new aliases
         * - it's always using inner join
         * - outAlias is currently used only in recursive calls (not the initial call)
         * - since we're calling this in parseDataSource where we don't have sourceObjectWrapper,
         *   this function is using sourceNodes instead. it could be refactored to use sourceObjectWrapper instead.
         *
         * TODO could be refactored  and merged with parseAllOutBoundNodes
         * @param {*} sourceNodes - array of source nodes
         * @param {*} lastForeignKeyNode  - the last foreign key node
         * @param {*} foreignKeyPathLength - the foreignkey path length
         * @param {*} sourcekey
         * @param {*} pathPrefixAliasMapping
         * @param {*} mainTableAlias
         * @param {*} useRightJoin
         */
        parseSourceNodesWithAliasMapping: function (sourceNodes, lastForeignKeyNode, foreignKeyPathLength, sourcekey, pathPrefixAliasMapping, mainTableAlias, useRightJoin, outAlias) {
            var usedOutAlias;

            if (!useRightJoin && sourcekey && sourcekey in pathPrefixAliasMapping.aliases) {
                usedOutAlias = pathPrefixAliasMapping.aliases[sourcekey];
                return {
                    path: "$" + usedOutAlias,
                    usedOutAlias: usedOutAlias
                };
            }

            var path = sourceNodes.reduce(function (prev, sn, i) {
                var res;

                if (sn.isFilter) {
                    return prev + (i > 0 ? "/" : "") + sn.toString();
                }

                if (sn.isPathPrefix) {
                    // if we're reversing, then don't use alias for that part
                    if (useRightJoin) {
                        return sn.toString(true, false, mainTableAlias, true);
                    }

                    /* if it's just prefix, then we have to make sure if there's a
                     * outAlias we have to use it. Since this is treated more like an alias for the other one
                     */
                    var containsLastFK = sn.nodeObject.foreignKeyPathLength === foreignKeyPathLength;
                    var prefixAlias = containsLastFK ? outAlias : null;

                    // if this is true, we should make sure the used alias is added to the sourcekey
                    var addAliasToSourcekey = false;
                    if (containsLastFK && sourcekey && sourcekey in pathPrefixAliasMapping.usedSourceKeys) {
                        addAliasToSourcekey = true;
                    }

                    if (sn.pathPrefixSourcekey in pathPrefixAliasMapping.aliases) {
                        usedOutAlias = pathPrefixAliasMapping.aliases[sn.pathPrefixSourcekey];

                        // make sure this alias is mapped to the sourcekey as well
                        if (addAliasToSourcekey) {
                            pathPrefixAliasMapping.aliases[sourcekey] = usedOutAlias;
                        }

                        return "$" + usedOutAlias;
                    }

                    // if we have to use alias but it's already not defined, create one
                    if (!prefixAlias && (sn.pathPrefixSourcekey in pathPrefixAliasMapping.usedSourceKeys || addAliasToSourcekey)) {
                        prefixAlias = mainTableAlias + "_P" + (++pathPrefixAliasMapping.lastIndex);
                    }

                    res = _sourceColumnHelpers.parseSourceNodesWithAliasMapping(
                        sn.nodeObject.sourceObjectNodes,
                        sn.nodeObject.lastForeignKeyNode,
                        sn.nodeObject.foreignKeyPathLength,
                        sn.pathPrefixSourcekey,
                        pathPrefixAliasMapping,
                        mainTableAlias,
                        false,
                        prefixAlias
                    );

                    // we should first parse the existing and then add it to list
                    // we might not have added alias
                    if (prefixAlias) {
                        // if already has been added, then just use it
                        if (sn.pathPrefixSourcekey in pathPrefixAliasMapping.aliases) {
                            prefixAlias = pathPrefixAliasMapping.aliases[sn.pathPrefixSourcekey];
                        } else {
                            // we should first parse the existing and then add it to list
                            pathPrefixAliasMapping.aliases[sn.pathPrefixSourcekey] = prefixAlias;
                        }

                        usedOutAlias = prefixAlias;

                        // if this is the last one, then we should make sure the
                        // sourcekey is mapped to this alias
                        if (addAliasToSourcekey) {
                            pathPrefixAliasMapping.aliases[sourcekey] = prefixAlias;
                        }
                    }

                    return res.path;
                }

                var fkStr = sn.toString(useRightJoin, false);
                if (useRightJoin) {
                    // if we have reversed the path, we need to add the alias to the last bit
                    res = (i > 0) ? (fkStr + "/") : (mainTableAlias + ":=right" + fkStr);
                    res += prev;
                    return res;
                }

                // if this thing is used by other parts, then we should add alias to ensure sharing
                if (sn === lastForeignKeyNode && sourcekey && sourcekey in pathPrefixAliasMapping.usedSourceKeys) {
                    if (!outAlias) {
                        outAlias = mainTableAlias + "_P" + (++pathPrefixAliasMapping.lastIndex);
                    }
                    pathPrefixAliasMapping.aliases[sourcekey] = outAlias;
                }

                usedOutAlias = outAlias;

                res = prev;
                res += (i > 0) ? "/" : "";
                // TODO this is hacky! alias is only used for association table now,
                // and in that case it won't be the last one....
                res += (sn === lastForeignKeyNode && outAlias) ? (outAlias + ":=") :  (sn.alias ? (sn.alias + ":=") : "");
                res += fkStr;

                return res;
            }, "");


            return {
                path: path,
                outAlias: outAlias
            };
        },

        /**
         * Given a list of all-outbound source nodes and last fk, will parse it
         * - This function will modify the given pathPrefixAliasMapping by adding new aliases
         * - it's always using left join
         * - Returned object has `path` and `usedOutAlias`. where `usedOutAlias`
         *   can be used to findout what is the alias that is used for the projected table.
         *   (depending on the usage of prefix, we might ignore the given outAlias and use a prefix from pathPrefixAliasMapping)
         * - since we don't support composite keys in source-def, the ForeignKeyPseudoColumn cannot use
         *   sourceObjectWrapper and instead we're creating sourceNodes for it. that's why this function is using sourceNodes
         *   and not sourceObjectWrapper.
         * TODO could be refactored and merged with the previous function
         * @param {*} sourceNodes
         * @param {*} lastForeignKeyNode
         * @param {*} foreignKeyPathLength - the foreignkey path length
         * @param {*} sourcekey
         * @param {*} pathPrefixAliasMapping
         * @param {*} outAlias
         */
        parseAllOutBoundNodes: function (sourceNodes, lastForeignKeyNode, foreignKeyPathLength, sourcekey, pathPrefixAliasMapping, outAlias, mainTableAlias) {
            var usedOutAlias;

            // TODO could be improved, we don't need to return any path
            // if this the main call and not part of the recursive call
            if (sourcekey && sourcekey in pathPrefixAliasMapping.aliases) {
                usedOutAlias = pathPrefixAliasMapping.aliases[sourcekey];
                return {
                    path: "$" + usedOutAlias,
                    usedOutAlias: usedOutAlias
                };
            }

            var path = sourceNodes.reduce(function (prev, sn, i) {
                var res;

                usedOutAlias = outAlias;

                if (sn.isFilter) {
                    return prev + (i > 0 ? "/" : "") + sn.toString();
                }

                if (sn.isPathPrefix) {
                    /* if it's just prefix, then we have to make sure if there's a
                    * outAlias we have to use it. Since this is treated more like an alias for the other one
                    */
                    var containsLastFK = sn.nodeObject.foreignKeyPathLength === foreignKeyPathLength;
                    var prefixAlias = containsLastFK ? outAlias : null;

                    // if this is true, we should make sure the used alias is added to the sourcekey
                    var addAliasToSourcekey = false;
                    if (containsLastFK && sourcekey && sourcekey in pathPrefixAliasMapping.usedSourceKeys) {
                        addAliasToSourcekey = true;
                    }

                    if (sn.pathPrefixSourcekey in pathPrefixAliasMapping.aliases) {
                        usedOutAlias = pathPrefixAliasMapping.aliases[sn.pathPrefixSourcekey];

                        // make sure this alias is mapped to the sourcekey as well
                        if (addAliasToSourcekey) {
                            pathPrefixAliasMapping.aliases[sourcekey] = usedOutAlias;
                        }

                        return "$" + usedOutAlias;
                    }

                    // if we have to use alias but it's already not defined, create one
                    if (!prefixAlias && (sn.pathPrefixSourcekey in pathPrefixAliasMapping.usedSourceKeys || addAliasToSourcekey)) {
                        prefixAlias = mainTableAlias + "_P" + (++pathPrefixAliasMapping.lastIndex);
                    }

                    res = _sourceColumnHelpers.parseAllOutBoundNodes(
                        sn.nodeObject.sourceObjectNodes,
                        sn.nodeObject.lastForeignKeyNode,
                        sn.nodeObject.foreignKeyPathLength,
                        sn.pathPrefixSourcekey,
                        pathPrefixAliasMapping,
                        prefixAlias,
                        mainTableAlias
                    );

                    // we should first parse the existing and then add it to list
                    // we might not have added alias
                    if (prefixAlias) {
                        // if already has been added, then just use it
                        if (sn.pathPrefixSourcekey in pathPrefixAliasMapping.aliases) {
                            prefixAlias = pathPrefixAliasMapping.aliases[sn.pathPrefixSourcekey];
                        } else {
                            // we should first parse the existing and then add it to list
                            pathPrefixAliasMapping.aliases[sn.pathPrefixSourcekey] = prefixAlias;
                        }

                        usedOutAlias = prefixAlias;

                        // if this is the last one, then we should make sure the
                        // sourcekey is mapped to this alias
                        if (addAliasToSourcekey) {
                            pathPrefixAliasMapping.aliases[sourcekey] = prefixAlias;
                        }
                    }

                    return res.path;
                }

                var fkStr = sn.toString(false, true);

                // if this thing is used by other parts, then we should add alias to ensure sharing
                if (sn === lastForeignKeyNode && sourcekey && sourcekey in pathPrefixAliasMapping.usedSourceKeys) {
                    if (!outAlias) {
                        outAlias = mainTableAlias + "_P" + (++pathPrefixAliasMapping.lastIndex);
                    }
                    pathPrefixAliasMapping.aliases[sourcekey] = outAlias;
                }

                res = prev;
                res += (i > 0) ? "/" : "";

                // what about sn.alias??
                res += (sn == lastForeignKeyNode && outAlias) ? (outAlias + ":=") : "";
                res += fkStr;

                return res;
            }, "");

            return {
                path: path,
                usedOutAlias: usedOutAlias
            };
        },

        // TODO FILTER_IN_SOURCE test this
        parseSourceObjectNodeFilter: function (nodeObject, table) {
            var logOp, ermrestOp, i, operator, res = "", innerRes, colName, operand = "";
            var encode = module._fixedEncodeURIComponent;
            var nullOperator = module.OPERATOR.NULL;
            var returnError = function (message) {
                throw new Error(message);
            };

            if (!("filter" in nodeObject || "and" in nodeObject || "or" in nodeObject)) {
                returnError("given source node is not a filter");
            }

            // ------- termination case of the recusive filter ---------
            if ("filter" in nodeObject) {
                // ------- add the column ---------
                if (isStringAndNotEmpty(nodeObject.filter)) {
                    colName = nodeObject.filter;
                }
                else if (Array.isArray(nodeObject.filter) && nodeObject.filter.length == 1 && isStringAndNotEmpty(nodeObject.filter[0])) {
                    colName = nodeObject.filter[0];
                } else if (Array.isArray(nodeObject.filter) && nodeObject.filter.length == 2 && isStringAndNotEmpty(nodeObject.filter[1])) {
                    // TODO the context is ignored for now
                    colName = nodeObject.filter[1];
                } else {
                    return returnError("invalid `filter` property: " + nodeObject.filter);
                }

                if (table && !table.columns.has(colName)) {
                    returnError("given `filter` (`" + nodeObject.filter + "`) is not in the table.");
                }

                res += encode(colName);

                // ------- add the operator ---------
                if ("operator" in nodeObject) {
                    operator = nodeObject.operator;
                    if (Object.values(module.OPERATOR).indexOf(operator) === -1) {
                        return returnError("invalid operator used: `" + operator + "`");
                    }
                } else {
                    operator = module.OPERATOR.EQUAL;
                }
                res += operator;

                // ------- add the operand ---------
                // null cannot have any operand, the rest need operand
                if ( (("operand_pattern" in nodeObject) && (operator == nullOperator)) ||
                     (!("operand_pattern" in nodeObject) && (operator != nullOperator))) {
                    returnError(nodeObject.operand_pattern == nullOperator ? "null operator cannot have any operand_pattern" : "operand_pattern must be defined");
                }
                if ("operand_pattern" in nodeObject) {
                    operand = module._renderTemplate(
                        nodeObject.operand_pattern,
                        {}, 
                        table.schema.catalog, 
                        {templateEngine: nodeObject.template_engine}
                    );

                    if (operand == null || operand.trim() == "") {
                        returnError("operand_pattern template resutls in empty string.");
                    }
                }
                res += encode(operand);

                // ------- add negate ---------
                if (nodeObject.negate === true) {
                    res = "!(" + res + ")";
                }
            } 
            // ------- recursrive filter ---------
            else {
                if ("and" in nodeObject) {
                    logOp = "and";
                    ermrestOp = module._ERMrestLogicalOperators.AND;
                } else {
                    logOp = "or";
                    ermrestOp = module._ERMrestLogicalOperators.OR;
                }

                res = nodeObject[logOp].length > 1 ? "(" : "";
                for (i = 0; i < nodeObject[logOp].length; i++) {
                    // it might throw an error which will be propagated to the original caller
                    innerRes = _sourceColumnHelpers.parseSourceObjectNodeFilter(nodeObject[logOp][i], table);
                    res += (i > 0 ? ermrestOp : "") + innerRes;
                }
                res += nodeObject[logOp].length > 1 ? ")" : "";
            }

            return res;
        },

        _sourceHasPath: function (source) {
            return Array.isArray(source) && !(source.length === 1 && typeof source[0] === "string");
        },

        /**
         * get facet's source column string
         * @param  {Object} source source object
         * @return {string|Object}
         * @private
         */
        _getSourceColumnStr: function (source) {
            return Array.isArray(source) ? source[source.length-1] : source;
        },

        /**
         * @param {string|object} colObject if the foreignkey/key is compund, this should be the constraint name. otherwise the source syntax for pseudo-column.
         * @param {boolean} useOnlySource whether we should ignore other attributes other than source or not
         * @desc return the name that should be used for pseudoColumn. This function makes sure that the returned name is unique.
         * This function can be used to get the name that we're using for :
         *
         * - Composite key/foreignkeys:
         *   In this case, if the constraint name is [`s`, `c`], you should pass `s_c` to this function.
         * - Simple foiregnkey/key:
         *   Pass the equivalent pseudo-column definition of them. It must at least have `source` as an attribute.
         * - Pseudo-Columns:
         *   - Just pass the object that defines the pseudo-column. It must at least have `source` as an attribute.
         *   - The given source will be hashed as is, so we should remove the alias and change to raw source (instead of prefix) beforehand
         */
        generateSourceObjectHashName: function (colObject, useOnlySource) {

            //we cannot create an object and stringify it, since its order can be different
            //instead will create a string of `source + aggregate + entity`
            var str = "";

            // it should have source
            if (typeof colObject === "object") {
                if (!colObject.source) return null;

                if (_sourceColumnHelpers._sourceHasPath(colObject.source)) {
                    // since it's an array, it will preserve the order
                    str += JSON.stringify(colObject.source);
                } else {
                    str += _sourceColumnHelpers._getSourceColumnStr(colObject.source);
                }

                if (useOnlySource !== true && typeof colObject.aggregate === "string") {
                    str += colObject.aggregate;
                }

                // entity true doesn't change anything
                if (useOnlySource !== true && colObject.entity === false) {
                    str += colObject.entity;
                }

                if (useOnlySource !== true && colObject.self_link === true) {
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
        },

        generateForeignKeyName: function (fk, isInbound) {
            var eTable = isInbound ? fk._table : fk.key.table;
            if (!isInbound) {
                return _sourceColumnHelpers.generateSourceObjectHashName(
                    {
                        source: [{outbound: fk.constraint_names[0]}, eTable.shortestKey[0].name]
                    },
                    false
                );
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

            return _sourceColumnHelpers.generateSourceObjectHashName({source: source}, false);
        },

        _populateUsedSourceKeys: function (usedSourceKeys, sources, rootTable) {
            if (!rootTable) return;
            var addToSourceKey = function (key) {
                if (!(key in rootTable.sourceDefinitions.sourceDependencies)) return;

                rootTable.sourceDefinitions.sourceDependencies[key].forEach(function (dep) {
                    if (dep in usedSourceKeys) {
                        usedSourceKeys[dep]++;
                    } else {
                        usedSourceKeys[dep] = 1;
                    }
                });
            };
            sources.forEach(function (srcObj) {
                if (typeof srcObj !== "object") return;

                if (typeof srcObj.sourcekey === "string") {
                    if (srcObj.sourcekey === module._specialSourceDefinitions.SEARCH_BOX) {
                        // add the search columns as well
                        if (Array.isArray(rootTable.searchSourceDefinition)) {
                            // since all the columns must be coming from the same instance,
                            // just getting it from one is enough
                            var col = rootTable.searchSourceDefinition[0];
                            if (col.sourceObject && col.sourceObject.sourcekey) {
                                addToSourceKey(col.sourceObject.sourcekey);
                            } else if (col.sourceObjectNodes.length > 0 && col.sourceObjectNodes[0].isPathPrefix) {
                                addToSourceKey(col.sourceObjectNodes[0].pathPrefixSourcekey);
                            }
                        }
                        return;
                    }
                    addToSourceKey (srcObj.sourcekey);
                    return;
                }

                if (!Array.isArray(srcObj.source) || !isStringAndNotEmpty(srcObj.source[0].sourcekey)) {
                    return;
                }
                // if this is the case, then it's an invalid url that will throw error later
                if (srcObj.source[0].sourcekey === module._specialSourceDefinitions.SEARCH_BOX) {
                    return;
                }
                addToSourceKey(srcObj.source[0].sourcekey);
            });
            for (var k in usedSourceKeys) {
                if (usedSourceKeys[k] < 2) delete usedSourceKeys[k];
            }
            return usedSourceKeys;
        }
    };

    function SourceObjectNode (nodeObject, isFilter, isForeignKey, isInbound, isPathPrefix, pathPrefixSourcekey, alias, table) {
        this.nodeObject = nodeObject;

        this.isFilter = isFilter;
        if (isFilter && table) {
            // this will parse the filter and throw errors if it's invalid
            this.parsedFilterNode = _sourceColumnHelpers.parseSourceObjectNodeFilter(nodeObject, table);
        }

        this.isForeignKey = isForeignKey;
        this.isInbound = isInbound;

        this.isPathPrefix = isPathPrefix;
        this.pathPrefixSourcekey = pathPrefixSourcekey;

        this.alias = alias;
    }

    SourceObjectNode.prototype = {
        /**
         * Return the string representation of this node
         * @param {boolean=} reverse - whether we should reverse the order (applicable to fk)
         * @param {boolean=} isLeft  - whether we want to use left outer join (applicable to fk)
         * @returns {String}
         */
        toString: function (reverse, isLeft, outAlias, isReverseRightJoin) {
            var self = this;

            if (self.isForeignKey) {
                var rev = ( (reverse && self.isInbound) || (!reverse && !self.isInbound) );
                return self.nodeObject.toString(rev, isLeft);
            }

            if (self.isPathPrefix) {
                return self.nodeObject.toString(reverse, isLeft, outAlias, isReverseRightJoin);
            }

            return this.parsedFilterNode;
        },

        // TOOD what's the point of this???
        // TODO FILTER_IN_SOURCE better name
        get simpleConjunction () {
            if (this._simpleConjunction === undefined) {

                // TODO
                var computeValue = function (self) {
                    if (!self.isFilter) return null;

                    var no = self.nodeObject;

                    if ("or" in no) return null;

                    // if ("")

                };

                this._simpleConjunction = computeValue(this);
            }
            return this._simpleConjunction;
        }
    };
