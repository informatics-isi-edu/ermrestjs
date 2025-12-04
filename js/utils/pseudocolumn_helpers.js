/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
import { hash as sparkMD5Hash } from 'spark-md5';

// models
// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';
import SourceObjectNode from '@isrd-isi-edu/ermrestjs/src/models/source-object-node';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import PathPrefixAliasMapping from '@isrd-isi-edu/ermrestjs/src/models/path-prefix-alias-mapping';
import { Tuple, Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// services
import CatalogService from '@isrd-isi-edu/ermrestjs/src/services/catalog';
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

// utils
import { createPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';
import { isObjectAndNotNull, isObject, isDefinedAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import {
  fixedEncodeURIComponent,
  hexToBase64,
  simpleDeepCopy,
  shallowCopyExtras,
  urlEncodeBase64,
} from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import {
  _constraintTypes,
  _contexts,
  _ERMrestFeatures,
  _ERMrestFilterPredicates,
  _ERMrestLogicalOperators,
  _facetingErrors,
  _facetFilterTypes,
  _facetHeuristicIgnoredTypes,
  _FacetsLogicalOperators,
  _facetUnsupportedTypes,
  _pseudoColAggregateFns,
  _shorterVersion,
  _sourceDefinitionAttributes,
  _sourceProperties,
  _specialSourceDefinitions,
  _systemColumnNames,
  _warningMessages,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { generateKeyValueFilters, renameKey, _renderTemplate, _isEntryContext, _getFormattedKeyValues } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { Table, Catalog } from '@isrd-isi-edu/ermrestjs/js/core';
import { parse, _convertSearchTermToFilter } from '@isrd-isi-edu/ermrestjs/js/parser';

/**
     * The functions that are used by _renderFacet
     * @ignore
     */
    export const _renderFacetHelpers = {
        hasNullChoice: function (term) {
            var choice = _facetFilterTypes.CHOICE;
            return Array.isArray(term[choice]) && term[choice].some(function (v) {
                return !isDefinedAndNotNull(v);
            });
        },

        valueToString: function (v) {
            return (typeof v === "string") ? v :JSON.stringify(v);
        },

        /**
         * Given a list of values and column name, return the appropriate
         * disjunctive quantified values filter.
         *
         * @param {any[]} choices an array of values (value could be null)
         * @param {string} column  the name of the column
         * @param {any} catalogObject the catalog object (to check if alternative syntax is available)
         */
        parseChoices: function (choices, column, catalogObject) {
            if (!Array.isArray(choices) || choices.length === 0) {
                return '';
            }

            var encode = fixedEncodeURIComponent, nullFilter = _ERMrestFilterPredicates.NULL;
            var canUseQuantified = false, hasNull = false, colsString ='', notFirst = false;

            // returns a simple key=value
            var eqSyntax = function (val) {
                if (isDefinedAndNotNull(val)) {
                    return encode(column) + "=" + encode(_renderFacetHelpers.valueToString(val));
                } else {
                    return encode(column) + nullFilter;
                }
            };

            // return a simple key=value if the length is one
            if (choices.length === 1) {
                return eqSyntax(choices[0]);
            }

            // see if the quantified syntax can be used
            if (catalogObject) {
                if (column === _systemColumnNames.RID) {
                    canUseQuantified = catalogObject.features[_ERMrestFeatures.QUANTIFIED_RID_LISTS];
                } else {
                    canUseQuantified = catalogObject.features[_ERMrestFeatures.QUANTIFIED_VALUE_LISTS];
                }
            }

            if (canUseQuantified) {
                var notNulls = [];
                choices.forEach(function (ch) {
                    if (!isDefinedAndNotNull(ch)) {
                        hasNull = true;
                        return;
                    }
                    notNulls.push(encode(_renderFacetHelpers.valueToString(ch)));
                });

                if (notNulls.length === 0) {
                    colsString = '';
                }
                else if (notNulls.length === 1) {
                    colsString = encode(column) + "=" + notNulls[0];
                }
                else {
                    colsString = encode(column) + '=any(' + notNulls.join(',') + ')';
                }

                if (hasNull) {
                    colsString += ';' + encode(column) + nullFilter;
                }
            } else {
                colsString += choices.reduce(function (prev, curr, i) {
                    return prev + (i !== 0 ? ";": "") + eqSyntax(curr);
                }, "");
            }

            return colsString;
        },

        // parse ranges constraint
        parseRanges: function (ranges, column) {
            var encode = fixedEncodeURIComponent;
            var res = "", hasFilter = false, operator;
            ranges.forEach(function (range, index) {
                if (hasFilter) {
                    res += ";";
                    hasFilter = false;
                }

                if (isDefinedAndNotNull(range.min)) {
                    operator = _ERMrestFilterPredicates.GREATER_THAN_OR_EQUAL_TO;
                    if (range.min_exclusive === true) {
                        operator = _ERMrestFilterPredicates.GREATER_THAN;
                    }

                    res += encode(column) + operator + encode(_renderFacetHelpers.valueToString(range.min));
                    hasFilter = true;
                }

                if (isDefinedAndNotNull(range.max)) {
                    operator = _ERMrestFilterPredicates.LESS_THAN_OR_EQUAL_TO;
                    if (range.max_exclusive === true) {
                        operator = _ERMrestFilterPredicates.LESS_THAN;
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

        /**
         * parse search constraint
         * @param {string} search the search term
         * @param {string} column the column name
         * @param {string} [alias] the alias name (could be undefined)
         * @param {Catalog} catalogObject the catalog object (to check if alternative syntax is available)
         */
        parseSearch: function (search, column, alias, catalogObject) {
            var res, invalid = false;
            res = search.reduce(function (prev, curr, i) {
                if (curr == null) {
                    invalid = true;
                    return "";
                } else {
                    return prev + (i !== 0 ? ";": "") + _convertSearchTermToFilter(_renderFacetHelpers.valueToString(curr), column, alias, catalogObject);
                }
            }, "");

            return invalid ? "" : res;
        },

        /**
         * parse the search box
         * Depending on the definition of `search-box`, the returned path might
         * include additional join statment for the column directives needed defined
         * in the `search-box`.
         *
         * Implementaion notes:
         * - Related to additional aliases added by this function:
         *   - If all the column directives are sharing the same prefix or
         *     the `search-box` is consist of just one column,
         *     this will not add any additional alias to the added join statment.
         *   - Otherwise it will add aliases in the `<root-alias>_S<number>` format
         * - There's no need to reset the path after this string as it will properly
         *   handle it.
         *
         * @param {string} search  the search term
         * @param {Table} rootTable the root table
         * @param {string} alias the alias for the root table
         * @param {Object} pathPrefixAliasMapping the path prefix alias mapping object (used for sharing prefix)
         * @param {Catalog} catalogObject the catalog object (to check if alternative syntax is available)
         * @returns the path that represents the search and join statments needed for search
         */
        parseSearchBox: function (search, rootTable, alias, pathPrefixAliasMapping, catalogObject) {
            // by default we're going to apply search to all the columns
            var searchColumns = [{name: "*"}], path = "", searchDef,
                usedAlias = "", proposedAlias = "", addAliasPerPath = false, addedAliasIndex = 1;

            // map to the search columns, if they are defined
            if (rootTable && rootTable.searchSourceDefinition) {
                searchDef = rootTable.searchSourceDefinition;

                /**
                * alias:
                * - length=1 -> no alias is needed, $M should be added after the whole thing
                * - all same path prefix -> same as above
                * - mix/match -> we need alias, $M should be added after each path to reset
                */
                addAliasPerPath = searchDef.columns.length > 1 && !searchDef.allSamePathPrefix;
                searchColumns = searchDef.columns.map(function (sd, i) {
                    usedAlias = "";

                    // getting the path from the first one is enough
                    if (sd.hasPath && (!searchDef.allSamePathPrefix || (searchDef.allSamePathPrefix && i == 0))) {
                        // TODO the alias could be improved
                        // currently this is not following the same alias as other shared prefixes
                        // and instead doing a new convention for search which could later be merged with each other.
                        proposedAlias = addAliasPerPath ? alias + "_S" + (addedAliasIndex++) : null;

                        var pathRes = _sourceColumnHelpers.parseSourceNodesWithAliasMapping(
                            sd.sourceObjectNodes,
                            sd.lastForeignKeyNode,
                            sd.foreignKeyPathLength,
                            sd.sourceObject && isStringAndNotEmpty(sd.sourceObject.sourcekey) ? sd.sourceObject.sourcekey : null,
                            pathPrefixAliasMapping,
                            alias,
                            false,
                            proposedAlias
                        );

                        // if it didn't produce a join path and only alias reset, ignore it
                        if (pathRes.path.length > 0 && pathRes.path != ("$" + pathRes.usedOutAlias)) {
                            path += pathRes.path + (addAliasPerPath ? ("/$" + alias) : "") + "/";
                        }

                        // if we wanted to add alias then use it
                        usedAlias = addAliasPerPath ? pathRes.usedOutAlias : "";
                        if (proposedAlias && usedAlias != proposedAlias) {
                            addedAliasIndex--;
                        }
                    }

                    return {name: sd.column.name, alias: usedAlias};
                });
            }

            return path + searchColumns.map(function (col) {
                return _renderFacetHelpers.parseSearch(search, col.name, col.alias, catalogObject);
            }).join(";") + ((!addAliasPerPath && path.length > 0) ? ("/$" + alias) : "");
        },

        /**
         * returns null if the path is invalid
         * @param {Object} source
         * @oaram {String=} sourcekey - the sourcekey name
         * @param {String} alias
         * @param {Table=} rootTable - might be undefined
         * @param {String} tableName
         * @param {String} catalogId
         * @param {Boolean} reverse - this will reverse the datasource and adds the root alias to the end
         * @ignore
         */
        parseDataSource: function (source, sourcekey, alias, rootTable, tableName, catalogId, reverse, pathPrefixAliasMapping) {
            var res = _sourceColumnHelpers.processDataSourcePath(source, rootTable, tableName, catalogId);

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
                column: col, // we might optimize the path, so the column could be different
                tableName: tableName,
                schemaName: schemaName,
                reversed: reverse,
                pathPrefixAliasMapping: pathPrefixAliasMapping
            };
        },

        getErrorOutput: function (message, index) {
           return {successful: false, message: message + "(index=" + index +")"};
        },

        /**
         * Given a facet filter, find the mapping facet object
         * NOTE will return an error if the given filter is invalid
         * @param {Object} filter the facet filter
         * @param {Reference} referenceObject  the reference object
         */
        findMappingFacet: function (filter, referenceObject) {
            // turn this facet into a proper object so we can find its "name"
            var currObj = new SourceObjectWrapper(filter, referenceObject.table, true);

            // find the facet based on name
            return referenceObject.facetColumns.find(function (fc) {
                return fc.sourceObjectWrapper.name === currObj.name;
            });
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
     * @param       {Catalog} [catalogObject] the catalog object (could be undefined)
     * @param       {Reference} [referenceObject] the reference object (could be undefined)
     * @param       {Array} usedSourceObjects (optional) the source objects that are used in other parts (outbound)
     * @constructor
     * @return      {object} An object that will have the following attributes:
     * - successful: Boolean (true means successful, false means cannot be parsed).
     * - parsed: String  (if the given string was parsable).
     * - message: String (if the given string was not parsable)
     *
     * @ignore
     */
    export const _renderFacet = function(json, alias, schemaName, tableName, catalogId, catalogObject, referenceObject, usedSourceObjects, forcedAliases) {
        var facetErrors = _facetingErrors;
        var rootSchemaName = schemaName, rootTableName = tableName;

        let rootTable = null;
        try {
            rootTable = catalogObject.schemas.findTable(rootTableName, rootSchemaName);
            /**
             * when this function is called for the facets defined prior to join,
             * we don't have access to the reference object. that's why we're
             * attempting to create it using the table
             */
            if (!isObjectAndNotNull(referenceObject)) {
                referenceObject = rootTable.reference;
            }
        } catch(exp) {
            // fail silently
        }

        var andOperator = _FacetsLogicalOperators.AND;

        // NOTE we only support and at the moment.
        if (!Object.prototype.hasOwnProperty.call(json, andOperator) || !Array.isArray(json[andOperator])) {
            return {successful: false, message: "Only conjunction of facets are supported."};
        }

        var and = json[andOperator],
            rightJoins = [], // if we have null in the filter, we have to use join
            innerJoins = [], // all the other facets that have been parsed
            encode = fixedEncodeURIComponent, sourcekey,
            i, term, colName, colObject, path, constraints, parsed, hasNullChoice,
            useRightJoin, rightJoinSchemaTable,
            mappedFacet, currObj, temp;

        var pathPrefixAliasMapping = new PathPrefixAliasMapping(
            forcedAliases,
            // pre process the list of facets and find the path prefixes that are used
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
                if (term.sourcekey === _specialSourceDefinitions.SEARCH_BOX) {

                    // this sourcekey is reserved for search and search constraint is required
                    if (!Array.isArray(term[_facetFilterTypes.SEARCH])) {
                        _renderFacetHelpers.getErrorOutput(facetErrors.missingConstraints, i);
                    }

                    // add the main search filter
                    innerJoins.push(_renderFacetHelpers.parseSearchBox(term[_facetFilterTypes.SEARCH], rootTable, alias, pathPrefixAliasMapping, catalogObject));

                    // we can go to the next source in the and filter
                    continue;
                }
                // support sourcekey in the facets
                else {
                    var sd = rootTable.sourceDefinitions.getSource(term.sourcekey);

                    // the sourcekey is invalid
                    if (!sd) {
                        return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSourcekey, i);
                    }

                    // copy the elements that are defined in the source def but not the one already defined
                    shallowCopyExtras(term, sd.sourceObject, _sourceDefinitionAttributes);
                }
            }

            // get the column name
            colName = _sourceColumnHelpers._getSourceColumnStr(term.source);
            if (typeof colName !== "string") {
                return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSource, i);
            }

            // ---------------- parse the path ---------------- //
            // TODO check for the facets and use the fast filter
            path = ""; // the source path if there are some joins
            useRightJoin = false;
            hasNullChoice = _renderFacetHelpers.hasNullChoice(term);

            // find the facetColumn that maps to this facet
            mappedFacet = null;
            if (!hasNullChoice && isObjectAndNotNull(referenceObject) && referenceObject.table.aggressiveFacetLookup && referenceObject.facetColumns.length > 0) {
                try {
                    mappedFacet = _renderFacetHelpers.findMappingFacet(term, referenceObject);
                } catch (exp) {
                    return _renderFacetHelpers.getErrorOutput(exp.message, i);
                }
            }

            // if the mapped facet had a fastFilterSource use that one instead
            if (isObjectAndNotNull(mappedFacet) && isObjectAndNotNull(mappedFacet.fastFilterSourceObjectWrapper)) {
                currObj = mappedFacet.fastFilterSourceObjectWrapper;
                temp = _sourceColumnHelpers.parseSourceNodesWithAliasMapping(
                    currObj.sourceObjectNodes,
                    currObj.lastForeignKeyNode,
                    currObj.foreignKeyPathLength,
                    currObj.sourceObject && isStringAndNotEmpty(currObj.sourceObject.sourcekey) ? currObj.sourceObject.sourcekey : null,
                    pathPrefixAliasMapping,
                    alias,
                    false
                );
                path = temp.path;
                colName = currObj.column.name;
                colObject = currObj.column;
            }
            else if (_sourceColumnHelpers._sourceHasNodes(term.source)) {

                // if there's a null filter and source has path, we have to use right join
                // parse the datasource
                temp = _renderFacetHelpers.parseDataSource(term.source, sourcekey, alias, rootTable, tableName, catalogId, hasNullChoice, pathPrefixAliasMapping);

                // if the data-path was invalid, ignore this facet
                if (temp === null) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSource, i);
                }

                // the parsed path
                path = temp.path;

                // whether we are using right join or not.
                useRightJoin = temp.reversed;
                rightJoinSchemaTable = encode(temp.schemaName) + ":" + encode(temp.tableName);

                // if we already have used a right join, we should throw error.
                if (rightJoins.length > 0 && useRightJoin) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.onlyOneNullFilter, i);
                }

                colName = temp.column.name;
                colObject = temp.column;
            }
            else {
                try {
                    colObject = rootTable.columns.get(colName);
                } catch (exp) {
                    /* empty */
                }
            }

            // ---------------- parse the constraints ---------------- //
            constraints = []; // the current constraints for this source

            if (Array.isArray(term[_facetFilterTypes.CHOICE])) {
                parsed = _renderFacetHelpers.parseChoices(term[_facetFilterTypes.CHOICE], colName, catalogObject);
                if (!parsed) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidChoice, i);
                }
                constraints.push(parsed);
            }
            if (Array.isArray(term[_facetFilterTypes.RANGE])) {
                parsed = _renderFacetHelpers.parseRanges(term[_facetFilterTypes.RANGE], colName);
                if (!parsed) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidRange, i);
                }
                constraints.push(parsed);
            }
            if (Array.isArray(term[_facetFilterTypes.SEARCH])) {
                parsed = _renderFacetHelpers.parseSearch(term[_facetFilterTypes.SEARCH], colName, null, catalogObject);
                if (!parsed) {
                    return _renderFacetHelpers.getErrorOutput(facetErrors.invalidSearch, i);
                }
                constraints.push(parsed);
            }
            if (term.not_null === true) {
                let notNull = [`${encode(colName)}::null::`];
                /**
                 * We cannot distinguish between json `null` in sql and actual `null`,
                 * so we should add both of them.
                 */
                if (colObject && (colObject.type.name === 'json' || colObject.type.name === 'jsonb')) {
                    notNull.push(`${encode(colName)}=null`);
                }
                constraints.push(`!(${notNull.join(';')})`);
            }

            if (constraints.length == 0) {
                return _renderFacetHelpers.getErrorOutput(facetErrors.missingConstraints, i);
            }

            // ---------------- create the url with path and constraints ---------------- //
            if (useRightJoin) {
                rightJoins.push([
                    rightJoinSchemaTable,
                    constraints.join(";"),
                    path
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
     * Will compress the source that can be used for logging purposes. Take a look at ERMrest._shorterVersion
     * for full list of values that are compressed
     * @private
     */
    export const _compressSource = function (source) {
        if (!source) return source;

        var res = simpleDeepCopy(source);
        var shorter = _shorterVersion;
        var shorten = function (node) {
            return function (k) {
                renameKey(node, k, shorter[k]);
            };
        };

        var shortenAndOr = function (node) {
            return function (k) {
                if (!Array.isArray(node[k])) return;

                node[k].forEach(function (el) {
                    ["and", "or"].forEach(shortenAndOr(el));
                    ["filter", "operand_pattern", 'operand_pattern_processed', "operator", "negate"].forEach(shorten(el));
                });
            };
        };

        if (!_sourceColumnHelpers._sourceHasNodes(source)) return res;

        for (var i = 0; i < res.length; i++) {
            ["and", "or"].forEach(shortenAndOr(res[i]));

            [
                "alias", "sourcekey", "inbound", "outbound",
                "filter", "operand_pattern", "operand_pattern_processed", "operator", "negate"
            ].forEach(shorten(res[i]));
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
    export const _compressFacetObject = function (facet) {
        var res = simpleDeepCopy(facet),
            and = _FacetsLogicalOperators.AND,
            or = _FacetsLogicalOperators.OR,
            shorter = _shorterVersion;

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
     * @param {Reference} baseReference - the reference that this waitfor is based on
     * @param {Table} currentTable - the current table.
     * @param {ReferenceColumn=} currentColumn - if this is defined on a column.
     * @param {Tuple=} mainTable - the main tuple data.
     * @param {String} message - the message that should be appended to warning messages.
     * @private
     */
    export const _processWaitForList = function (waitFor, baseReference, currentTable, currentColumn, mainTuple, message) {
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
                $log.warn(errorMessage + "must be a string");
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
                const sd = currentTable.sourceDefinitions.getSource(wf);

                // entitysets are only allowed in detailed
                if (sd.hasInbound && !sd.sourceObject.aggregate && baseReference.context !== _contexts.DETAILED) {
                    $log.warn(errorMessage + "entity sets are not allowed in non-detailed.");
                    return;
                }

                // NOTE because it's redundant
                if (currentColumn && sd.name === currentColumn.name) {
                    // don't add itself
                    return;
                }

                // there's at least one secondary request
                if (sd.hasInbound || sd.sourceObject.aggregate || sd.isUniqueFiltered) {
                    hasWaitFor = true;
                }

                // NOTE this could be in the table.sourceDefinitions
                // the only issue is that in there we don't have the mainTuple...
                const pc = createPseudoColumn(
                    baseReference,
                    /**
                     * cloning so,
                     * - we're not referring to the same sd
                     * - make sure the sourcekey is also part of the definition
                     *   so the mapping of sourcekey to definition is not lost.
                     *   this mapping is needed for the path prefix logic
                     * - pass the mainTuple for filters
                     */
                    sd.clone(
                        {"sourcekey": wf},
                        currentTable,
                        false,
                        mainTuple
                    ),
                    mainTuple
                );

                // ignore normal columns
                if (!pc.isPseudo || pc.isAsset) return;

                if (pc.isPathColumn && pc.hasAggregate) {
                    hasWaitForAggregate = true;
                }

                // in entry context, only paths that start with outbound are allowed
                if (_isEntryContext(baseReference._context)) {
                    // TODO I'm assuming that this is called for the assets
                    if (sd.foreignKeyPathLength < 2) {
                        // there's no need for warning in this case.
                        return;
                    }

                    if (sd.hasPrefix) {
                        $log.warn(errorMessage + 'path prefix is not allowed in entry context');
                        return;
                    }
                    if (sd.isFiltered && sd.filterProps && sd.filterProps.hasRootFilter) {
                        $log.warn(errorMessage + 'filter on root is not allowed in entry context');
                        return;
                    }
                    if (sd.firstForeignKeyNode.isInbound) {
                        $log.warn(errorMessage + 'first hop must be outbound in entry context');
                        return;
                    }
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
    export const _facetColumnHelpers = {

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
                var baseCol = refCol.baseColumns[0];
                obj = {"source": baseCol.name};

                // integer and serial key columns should show choice picker
                if (baseCol.type.name.indexOf("int") === 0 || baseCol.type.name.indexOf("serial") === 0) {
                    obj.ux_mode = _facetFilterTypes.CHOICE;
                }
                return _facetHeuristicIgnoredTypes.indexOf(baseCol.type.name) === -1 ? obj : null;
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
                    res = simpleDeepCopy(refCol.sourceObjectWrapper.source);
                } else {
                    res.push({"inbound": origFkR.constraint_names[0]});
                    if (association) {
                        res.push({
                            "outbound": association.associationToRelatedFKR.constraint_names[0]
                        });
                    }
                    res.push(column.name);
                }

                return {"source": res, "markdown_name": refCol.displayname.unformatted, "entity": true};
            }

            obj = {"source": refCol.name};

            // integer and serial key columns should show choice picker
            if (refCol.baseColumns[0].isUniqueNotNull &&
               (refCol.type.name.indexOf("int") === 0 || refCol.type.name.indexOf("serial") === 0)) {
                obj.ux_mode = _facetFilterTypes.CHOICE;
            }

            return _facetHeuristicIgnoredTypes.indexOf(refCol.baseColumns[0].type.name) === -1 ? obj : null;
        },

        /**
         * Given a source definition object, it will return a SourceObjectWrapper that can be used as a facet object.
         * It will return null if the source definition is not supported as a facet.
         * NOTE: this function will remove any filter defined in the source definition if hasFilterOrFacet is true.
         *
         * TODO should this throw errors instead of just returning null?
         * @param {any} obj the source definition object
         * @param {Table} table the table that this source definition is based on
         * @param {boolean} hasFilterOrFacet whether the url has any filter or facet defined. If this is true, we will remove any filter defined in the source definition.
         * @returns
         */
        sourceDefToFacetObjectWrapper: function (obj, table, hasFilterOrFacet) {
            let wrapper;
            try {
                // if both source and sourcekey are defined, ignore the source and use sourcekey
                if (obj.sourcekey) {
                    const sd = table.sourceDefinitions.getSource(obj.sourcekey);
                    if (!sd || !sd.processFilterNodes(undefined).success) return null;
                    wrapper = sd.clone(obj, table, true);
                } else {
                    wrapper = new SourceObjectWrapper(obj, table, true);
                }
            } catch (exp) {
                // TODO better error message
                $log.info(`error parsing facet source definition: ${exp.message}`);
                // $log.info('facet: ', obj);
                // $log.info(exp);
                return null;
            }

            const col = wrapper.column;

            // aggregate is not supported
            if (wrapper.hasAggregate) {
                return null;
            }

            // column type array is not supported
            if (col.type.isArray) {
                $log.info('Facet is not supported for array column types.');
                return null;
            }

            // check the column type
            if (_facetUnsupportedTypes.indexOf(col.type.name) !== -1) {
                $log.info('Facet is not supported for column type: ' + col.type.name);
                return null;
            }

            // if we have filters in the url, we will get the filters only from url
            if (hasFilterOrFacet) {
                delete wrapper.sourceObject.not_null;
                delete wrapper.sourceObject.choices;
                delete wrapper.sourceObject.search;
                delete wrapper.sourceObject.ranges;
            }
            return wrapper;
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
            if (col.type.isArray || col.baseColumns[0].type.isArray) {
                return false;
            }

            if (col.isPathColumn) {
                if (col.hasAggregate) return false;
                return simpleDeepCopy(col.sourceObjectWrapper.sourceObject);
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
         * @param {SourceObjectWrapper} facetObjectWrapper the facet object
         * @param {boolean} usedAnnotation the annotation that was used to create this facet (if any)
         * @param {Table} table the current table that we want to make sure the facetObject is valid for.
         * @returns {boolean} whether the facetObjectWrapper is valid for this table.
         */
        checkForAlternative: function (facetObjectWrapper, usedAnnotation, table) {
            var currTable = facetObjectWrapper.column.table;
            var compactSelectTable = currTable._baseTable._getAlternativeTable(_contexts.COMPACT_SELECT);

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
                facetObjectWrapper = new SourceObjectWrapper(sourceObject, table, true);
            }

            return true;
        },

        /**
         * Given a facetWrapper object, will send a request to fetch the rows associated with the `choices`
         * This will return a promise that will be resolved with an object that has the following attributes:
         * - invalidChoices: The choices that were ignored.
         * - originalChoices: The original list of choices
         * - andFilterObject: the given input but with the following modifications:
         *    - a new entityChoiceFilterTuples is added that stores the result tuples
         *    - choices are modified based on the result.
         * @param {SourceObjectWrapper} andFilterObject - the facet object
         * @param {Object} contextHeaderParams  - the object that should be logged with read request
         */
        getEntityChoiceRows: function (andFilterObject, contextHeaderParams) {
            var defer = ConfigService.q.defer(), sourceObject = andFilterObject.sourceObject;

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

            var filterValues = [], filterTerms = {}, hasNullChoice = false;

            res.originalChoices = sourceObject.choices;
            sourceObject.choices.forEach(function (ch, index) {
                if (ch in filterTerms) {
                    return;
                }
                if (ch== null) {
                    hasNullChoice = true;
                    return;
                }
                var val = {};
                val[filterColumnName] = ch;
                filterValues.push(val);

                filterTerms[ch] = index;
            });

            if (filterValues.length === 0) {
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
            var basePath = fixedEncodeURIComponent(table.schema.name) + ":" + fixedEncodeURIComponent(table.name);

            var keyValueRes = generateKeyValueFilters(
                [{name: filterColumnName}],
                filterValues,
                table.schema.catalog,
                basePath.length,
                table.displayname.value
            );

            if (!keyValueRes.successful) {
                res.invalidChoices = Object.keys(filterTerms);
                res.andFilterObject.sourceObject.choices = [];

                $log.error("Error while trying to fetch entity facet rows: ", keyValueRes.message);
                defer.resolve(res);
                return defer.promise;
            }

            var requests = keyValueRes.filters; // function below iterates over this
            var validatedTuples = []; // will be populated by function below

            /**
             * go one by one based on the url length and send the choices requests
             */
            var sendRequest = function () {
                var req = requests.shift();
                // there aren't any requests, so resolve the promise
                if (!req) {
                    // feels hacky
                    res.andFilterObject.entityChoiceFilterTuples = validatedTuples;

                    // see if we need to make any correction:
                    // find the missing choices and also fix the choices if they are based on some other columns
                    if (validatedTuples.length != filterValues.length || filterColumnName != projectedColumnName) {
                        var newChoices = [];
                        validatedTuples.forEach(function (t) {
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

                    return defer.resolve(res), defer.promise;
                }

                var uri = [
                    table.schema.catalog.server.uri ,"catalog" , table.schema.catalog.id,
                    "entity", basePath, req.path
                ].join("/");

                var ref = new Reference(parse(uri), table.schema.catalog).contextualize.compactSelect;

                // sorting to ensure a deterministic order of results
                ref = ref.sort([{"column": filterColumnName, "descending": false}]);
                (function (filterColumnName, projectedColumnName) {
                    ref.read(req.keyData.length, contextHeaderParams, true).then(function (page) {

                        // keep track of tuples that have been validated
                        validatedTuples = validatedTuples.concat(page.tuples);

                        // see if there are any other requests
                        sendRequest();
                    }).catch(function (err) {
                        // if any of the values had issue, the whole request is failing
                        // TODO should we try to recover based on other values??
                        res.invalidChoices = Object.keys(filterTerms);
                        res.andFilterObject.sourceObject.choices = [];

                        $log.error("Error while trying to fetch entity facet rows: ", err);

                        defer.resolve(res);
                    });
                })(filterColumnName, projectedColumnName);
            };

            sendRequest();

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



    /**
     * Helper functions related to source syntax
     * @ignore
     */
    export const _sourceColumnHelpers = {
        /**
         *
         * @param {Objec} source the source object
         * @param {Table} rootTable the table that this source is defined in
         * @param {string} tableName the name of the table
         * @param {string} catalogId the catalog id
         * @param {Object=} sources the sources (useful when we're processsing source-definitions so we can use the already generated sources)
         * @param {Tuple=} mainTuple the main tuple
         * @param {boolean=} skipProcessingFilters whether to skip processing filters
         * @returns {Object} the result of processing the data source path
         */
        processDataSourcePath: function (source, rootTable, tableName, catalogId, sources, mainTuple, skipProcessingFilters) {
            var wm = _warningMessages, srcProps = _sourceProperties;
            var returnError = function (message) {
                return {error: true, message: message};
            };

            // if it has any of the fk related properties
            var hasAnyOfFKProps = function (obj) {
                return [
                    srcProps.INBOUND, srcProps.OUTBOUND,
                    srcProps.REMOTE_SCHEMA, srcProps.REMOTE_TABLE,
                    srcProps.REMOTE_COLUMNS, srcProps.LOCAL_TO_REMOTE_COLUMNS, srcProps.LOCAL_COLUMNS,
                ].some(function (p) {return p in obj; });
            };

            var i, fkAlias, constraint, isInbound, fkObj, fk, colTable = rootTable, hasInbound = false, firstForeignKeyNode, lastForeignKeyNode,
                foreignKeyPathLength = 0, sourceObjectNodes = [], hasPrefix = false, hasOnlyPrefix = false, prefix, isAlternativeJoin = false,
                isAllOutboundNotNull = true, isAllOutboundNotNullPerModel = true;
            let isFiltered = false, filterProps = {
                isFilterProcessed: true, hasRootFilter: false, hasFilterInBetween: false, leafFilterString: ''
            };

            for (i = 0; i < source.length - 1; i++) {
                if ("sourcekey" in source[i]) {
                    if (i !== 0 || hasPrefix) {
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
                        prefix = rootTable.sourceDefinitions.getSource(source[i].sourcekey);
                    }

                    if (!prefix) {
                        return returnError("sourcekey is invalid.");
                    }

                    if (!skipProcessingFilters) {
                        try {
                            // might throw an error if the filters are not valid
                            prefix.processFilterNodes(mainTuple);
                        } catch (exp) {
                            return returnError(`Couldn't process filters for sourcekey: ${source[i].sourcekey}.\n${exp.message}`);
                        }

                    }

                    if (!prefix.hasPath) {
                        return returnError("referrred `sourcekey` must be a foreign key path.");
                    }
                    sourceObjectNodes.push(new SourceObjectNode(prefix, colTable, false, false, false, true, source[i].sourcekey, undefined, false));

                    firstForeignKeyNode = prefix.firstForeignKeyNode;
                    lastForeignKeyNode = prefix.lastForeignKeyNode;
                    foreignKeyPathLength += prefix.foreignKeyPathLength;
                    colTable = prefix.column.table;
                    tableName = prefix.column.table.name;
                    hasInbound = hasInbound || prefix.hasInbound;
                    isFiltered = isFiltered || prefix.isFiltered;
                    filterProps.hasRootFilter = prefix.hasRootFilter;
                    filterProps.hasFilterInBetween = prefix.hasFilterInBetween;
                    filterProps.leafFilterString = prefix.leafFilterString;
                    filterProps.isFilterProcessed = prefix.filterProps.isFilterProcessed;
                    isAllOutboundNotNull = prefix.isAllOutboundNotNull;
                    isAllOutboundNotNullPerModel = prefix.isAllOutboundNotNullPerModel;
                }
                else if ("filter" in source[i] || "and" in source[i] || "or" in source[i]) {
                    if (!isObjectAndNotNull(colTable)) {
                        return returnError("Couldn't parse the url since Location doesn't have acccess to the catalog object or main table is invalid.");
                    }

                    var snf;
                    try {
                        snf = new SourceObjectNode(source[i], colTable, true, false, false, false, undefined, undefined, false, skipProcessingFilters, mainTuple);
                    } catch (exp) {
                        return returnError(exp.message);
                    }

                    isFiltered = true;
                    filterProps.isFilterProcessed = filterProps.isFilterProcessed && snf.isFilterProcessed;

                    // if this is the first element, then we have a root filter
                    if (i === 0) filterProps.hasRootFilter = true;

                    // create the string filter string, if this is not the last, then it will be emptied out
                    // for now we just want the string, later we could improve this implementation
                    // (for recordedit the whole object would be needed and not just string)
                    // NOTE filter-in-source toString is problematic here
                    filterProps.leafFilterString = filterProps.leafFilterString ?  [filterProps.leafFilterString, snf.toString()].join('/') : snf.toString();

                    // add the node to the list
                    sourceObjectNodes.push(snf);
                    continue;
                }
                else if (hasAnyOfFKProps(source[i])) {
                    fkAlias = null;
                    if ("alias" in source[i] && typeof source[i].alias === "string") {
                        fkAlias = source[i].alias;
                    }

                    if (srcProps.INBOUND in source[i] || srcProps.OUTBOUND in source[i]) {
                        isAlternativeJoin = false;
                        isInbound = ("inbound" in source[i]);
                        constraint = isInbound ? source[i].inbound : source[i].outbound;

                        fkObj = CatalogService.getConstraintObject(catalogId, constraint[0], constraint[1]);

                        // constraint name was not valid
                        if (fkObj === null || fkObj.subject !== _constraintTypes.FOREIGN_KEY) {
                            return returnError("Invalid data source. fk with the following constraint is not available on catalog: " + constraint.toString());
                        }

                        fk = fkObj.object;
                    } else {
                        isAlternativeJoin = true;
                        if (!isObjectAndNotNull(colTable)) {
                            return returnError("Couldn't parse the url since Location doesn't have acccess to the catalog object or main table is invalid.");
                        }

                        fkObj = colTable.findForeignKey(source[i]);

                        if (fkObj.successful) {
                            isInbound = fkObj.isInbound;
                            fk = fkObj.foreignKey;
                        } else {
                            return returnError('Invalid fk object in source element index=' + i + ': ' + fkObj.message);
                        }
                    }


                    // if there are foreignkey paths before this, then this is a filter in between
                    if (filterProps.leafFilterString && foreignKeyPathLength > 0) {
                        filterProps.hasFilterInBetween = true;
                    }
                    // since we just saw a fk path, the filters that we have are not the leaf ones
                    filterProps.leafFilterString = '';

                    // add one to the length
                    foreignKeyPathLength++;

                    // inbound
                    if (isInbound && fk.key.table.name === tableName) {
                        isAllOutboundNotNull = isAllOutboundNotNullPerModel = false;
                        hasInbound = true;
                        colTable = fk.table;
                    }
                    // outbound
                    else if (!isInbound && fk.table.name === tableName) {
                        colTable = fk.key.table;

                        isAllOutboundNotNull = isAllOutboundNotNull && fk.isNotNull;
                        isAllOutboundNotNullPerModel = isAllOutboundNotNullPerModel && fk.isNotNullPerModel;
                    }
                    else {
                        // the given object was not valid
                        return returnError("Invalid constraint name in source element index=" + i);
                    }

                    tableName = colTable.name;

                    var sn = new SourceObjectNode(fk, colTable, false, true, isInbound, false, null, fkAlias, isAlternativeJoin);
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

            let col;
            try {
                col = colTable.columns.get(source[source.length-1]);
            } catch {
                return returnError(wm.INVALID_COLUMN_IN_SOURCE_PATH);
            }

            return {
                sourceObjectNodes: sourceObjectNodes,
                firstForeignKeyNode: firstForeignKeyNode,
                lastForeignKeyNode: lastForeignKeyNode,
                column: col,
                foreignKeyPathLength: foreignKeyPathLength,
                isFiltered: isFiltered,
                filterProps: filterProps,
                hasInbound: hasInbound,
                hasPrefix: hasPrefix,
                hasOnlyPrefix: hasOnlyPrefix,
                isAllOutboundNotNull: foreignKeyPathLength > 0 && isAllOutboundNotNull,
                isAllOutboundNotNullPerModel: foreignKeyPathLength > 0 && isAllOutboundNotNullPerModel
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
         * @param {SourceObjectNode[]} sourceNodes - array of source nodes
         * @param {Object} lastForeignKeyNode  - the last foreign key node
         * @param {number} foreignKeyPathLength - the foreignkey path length
         * @param {string} [sourcekey] the sourcekey of current object
         * @param {Object} pathPrefixAliasMapping the path prefix alias mapping object
         * @param {string} mainTableAlias the alias of the root table
         * @param {boolean} useRightJoin whether we need to reverse and use right outer join
         * @param {string} [outAlias] the alias that will be attached to the output
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
                        prefixAlias = _sourceColumnHelpers._generateAliasName(
                            // get the sourcekey that the prefix is going to be associated with
                            addAliasToSourcekey ? sourcekey : sn.pathPrefixSourcekey,
                            mainTableAlias,
                            pathPrefixAliasMapping
                        );
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
                        outAlias = _sourceColumnHelpers._generateAliasName(sourcekey, mainTableAlias, pathPrefixAliasMapping);
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
                usedOutAlias: usedOutAlias
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
         * @param {string} mainTableAlias
         * @param {*} outAlias
         */
        parseAllOutBoundNodes: function (sourceNodes, lastForeignKeyNode, foreignKeyPathLength, sourcekey, pathPrefixAliasMapping, mainTableAlias, outAlias) {
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
                        prefixAlias = _sourceColumnHelpers._generateAliasName(
                            // get the sourcekey that the prefix is going to be associated with
                            addAliasToSourcekey ? sourcekey : sn.pathPrefixSourcekey,
                            mainTableAlias,
                            pathPrefixAliasMapping
                        );
                    }

                    res = _sourceColumnHelpers.parseAllOutBoundNodes(
                        sn.nodeObject.sourceObjectNodes,
                        sn.nodeObject.lastForeignKeyNode,
                        sn.nodeObject.foreignKeyPathLength,
                        sn.pathPrefixSourcekey,
                        pathPrefixAliasMapping,
                        mainTableAlias,
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

                var fkStr = sn.toString(false, true);

                // if this thing is used by other parts, then we should add alias to ensure sharing
                if (sn === lastForeignKeyNode && sourcekey && sourcekey in pathPrefixAliasMapping.usedSourceKeys) {
                    if (!outAlias) {
                        outAlias = _sourceColumnHelpers._generateAliasName(sourcekey, mainTableAlias, pathPrefixAliasMapping);
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

        /**
         * parse the given source object node.
         * - this will mutate the given nodeObject and replaces the `operand_pattern` with the processed value
         *   and also set `operand_pattern_processed` to true
         * @param {Object} nodeObject the source object node that should be parsed
         * @param {Object} keyValues the key values that should be used for rendering the template
         * @param {Table} table the table that this node refers to (the leaf table)
         * @returns
         */
        parseSourceObjectNodeFilter: function (nodeObject, keyValues, table) {
            let logOp, ermrestOp, i, operator, res = "", innerRes, colName, operand = "";
            const encode = fixedEncodeURIComponent;
            const nullOperator = _ERMrestFilterPredicates.NULL;
            const EMPTY_OPERAND = 'operand_pattern template resutls in empty string.';
            const returnError = function (message) {
                throw new Error(message);
            };

            if (!("filter" in nodeObject || "and" in nodeObject || "or" in nodeObject)) {
                returnError("given source node is not a filter");
            }

            // ------- termination case of the recusive filter ---------
            if ("filter" in nodeObject) {
                // ------- add the column ---------
                // just a string
                if (isStringAndNotEmpty(nodeObject.filter)) {
                    colName = nodeObject.filter;
                }
                // an array of length one where the element is a string
                else if (Array.isArray(nodeObject.filter) && nodeObject.filter.length == 1 && isStringAndNotEmpty(nodeObject.filter[0])) {
                    colName = nodeObject.filter[0];
                }
                // an array of length two where both are string and second one
                // is used as the column name
                else if (Array.isArray(nodeObject.filter) && nodeObject.filter.length == 2 && isStringAndNotEmpty(nodeObject.filter[1])) {
                    // if there's a context, just throw error
                    if (isStringAndNotEmpty(nodeObject.filter[0])) {
                        return returnError("context change in filter is not currently supported.");
                    }
                    colName = nodeObject.filter[1];
                }
                // if none of the cases above matched
                if (!colName){
                    return returnError("invalid `filter` property: " + nodeObject.filter);
                }
                // make sure the column is in the table
                if (table && !table.columns.has(colName)) {
                    returnError("given `filter` (`" + nodeObject.filter + "`) is not in the table.");
                }
                res += encode(colName);

                // ------- add the operator ---------
                if ("operator" in nodeObject) {
                    operator = nodeObject.operator;
                    if (Object.values(_ERMrestFilterPredicates).indexOf(operator) === -1) {
                        return returnError("invalid operator used: `" + operator + "`");
                    }
                } else {
                    operator = _ERMrestFilterPredicates.EQUAL;
                }
                res += operator;

                // ------- add the operand ---------
                // null cannot have any operand, the rest need operand
                if ( (("operand_pattern" in nodeObject) && (operator === nullOperator)) ||
                     (!("operand_pattern" in nodeObject) && (operator !== nullOperator))) {
                    returnError(nodeObject.operand_pattern === nullOperator ? "null operator cannot have any operand_pattern" : "operand_pattern must be defined");
                }
                if ("operand_pattern" in nodeObject) {
                    if (nodeObject.operand_pattern_processed === true) {
                        operand = nodeObject.operand_pattern;
                    } else {
                        operand = _renderTemplate(
                            nodeObject.operand_pattern,
                            keyValues,
                            table.schema.catalog,
                            {templateEngine: nodeObject.template_engine}
                        );

                        if (operand === null || operand === undefined || operand.trim() === "") {
                            returnError(EMPTY_OPERAND);
                        }
                        nodeObject.operand_pattern_processed = true;
                        nodeObject.operand_pattern = operand;
                    }
                }
                res += encode(operand);
            }
            // ------- recursive filter ---------
            else {
                if ("and" in nodeObject) {
                    logOp = "and";
                    ermrestOp = _ERMrestLogicalOperators.AND;
                } else {
                    logOp = "or";
                    ermrestOp = _ERMrestLogicalOperators.OR;
                }

                if (!Array.isArray(nodeObject[logOp]) || nodeObject[logOp].length === 0) {
                    returnError("given source not is not a valid faild (and/or must be an array)");
                }

                res = (nodeObject[logOp].length > 1 && !nodeObject.negate) ? "(" : "";
                for (i = 0; i < nodeObject[logOp].length; i++) {
                    // it might throw an error which will be propagated to the original caller
                    innerRes = _sourceColumnHelpers.parseSourceObjectNodeFilter(nodeObject[logOp][i], keyValues, table);
                    res += (i > 0 ? ermrestOp : "") + innerRes;
                }
                res += (nodeObject[logOp].length > 1  && !nodeObject.negate) ? ")" : "";
            }

            // ------- add negate ---------
            if (nodeObject.negate === true) {
                res = "!(" + res + ")";
            }

            return res;
        },

        /**
         * generate an alias that should be used for a sourcekey
         * This function is added mainly to properly check the forced aliases.
         * As part of `computeERMrestCompactPath`, some aliases are supposed to
         * have a specific meaning and cannot be changed. So the forcedAliases
         * will ensure we're using those aliases instead of creating a new one.
         *
         * @param {string} sourcekey
         * @param {string} mainTableAlias
         * @param {Object} pathPrefixAliasMapping
         * @returns string
         */
        _generateAliasName: function (sourcekey, mainTableAlias, pathPrefixAliasMapping) {
            if (sourcekey in pathPrefixAliasMapping.forcedAliases) {
                return pathPrefixAliasMapping.forcedAliases[sourcekey];
            }
            return mainTableAlias + "_P" + (++pathPrefixAliasMapping.lastIndex);
        },

        _sourceHasNodes: function (source) {
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
         * Given two source nodes representing filter, sort them. This is mainly
         * done to ensure the hash string for a source ignores the given order
         * of "and"/"or" filters and sorts them based on the following:
         *   - if only one has `negate`, the one without `negate` comes first.
         *   - if only one has `filter` (the other has `and`/`or`), it comes first.
         *   - if only one has `and`, it comes first.
         *   - if both have `and`,
         *      - shorter one comes first.
         *      - if same size, sort based on string representation.
         *   - otherwise (both have `or`):
         *      - shorter one comes first
         *      - if same size, sort based on string representation.
         * @param {*} a
         * @param {*} b
         */
        _sortFilterInSource: function (a, b) {
            var srcProps = _sourceProperties,
                helpers = _sourceColumnHelpers;

            var aHasNegate = srcProps.NEGATE in a,
                aHasFilter = srcProps.FILTER in a,
                aHasAnd = srcProps.AND in a,
                bHasNegate = srcProps.NEGATE in b,
                bHasFilter = srcProps.FILTER in b,
                bHasAnd = srcProps.AND in b;

            var sortBasedOnStr = function () {
                var tempA = helpers._stringifyFilterInSource(a),
                    tempB = helpers._stringifyFilterInSource(b);
                if (tempA == tempB) {
                    return 0;
                }
                return tempA > tempB ? 1 : -1;
            };

            // ------- only one has negate (the one with negative comes second) -------- //
            if (aHasNegate && !bHasNegate) {
                return 1;
            }
            if (!aHasNegate && bHasNegate) {
                return -1;
            }

            // ------- only one has filter (the one with filter comes first) -------- //
            if (aHasFilter && !bHasFilter) {
                return -1;
            }
            if (!aHasFilter && bHasFilter) {
                return 1;
            }

            // ------- both have filter (sort based on str) -------- //
            if (aHasFilter && bHasFilter) {
                return sortBasedOnStr();
            }

            // ------- only one has and (the one with `and` comes first) -------- //
            if (aHasAnd && !bHasAnd) {
                return -1;
            }
            if (!aHasAnd && bHasAnd) {
                return 1;
            }

            // ------- both have and -------- //
            if (aHasAnd && bHasAnd) {
                // the shorter comes first
                if (a[srcProps.AND].length != b[srcProps.AND].length) {
                    return a[srcProps.AND].length - b[srcProps.AND].length;
                }
                // sort based on str
                return sortBasedOnStr();
            }

            // ------- both have or -------- //
            // the shorter comes first
            if (a[srcProps.OR].length != b[srcProps.OR].length) {
                return a[srcProps.OR].length - b[srcProps.OR].length;
            }

            // sort based on str
            return sortBasedOnStr();
        },

        _stringifyFilterInSource: function (node) {
            var srcProps = _sourceProperties,
                helpers = _sourceColumnHelpers;

            var stringifyAndOr = function (arr) {
                // TODO we might want to sort this to make sure the order
                // of elements doesn't matter
                return "[" + arr.slice().sort(helpers._sortFilterInSource).map(helpers._stringifyFilterInSource).join(",") + "]";
            };

            var res = [];
            if (srcProps.NEGATE in node) {
                res.push('"negate":' + node[srcProps.NEGATE]);
            }

            if (srcProps.FILTER in node) {
                // make sure attributes are added in the same order all the times
                // NOTE technically could use the Object.keys and sort
                [srcProps.FILTER, srcProps.OPERATOR, srcProps.OPERAND_PATTERN].forEach(function (attr) {
                    if (attr in node) {
                        res.push('"' + attr + '":' + JSON.stringify(node[attr]));
                    }
                });
                return '{' + res.join(",") + '}';
            }

            if (srcProps.AND in node) {
                res.push('"and":' + stringifyAndOr(node[srcProps.AND]));
            }
            else if (srcProps.OR in node){
                res.push('"or":' + stringifyAndOr(node[srcProps.OR]));
            }

            return '{' + res.join(",") + '}';
        },

        /**
         * Some elements of source have multiple properties and we cannot just
         * use JSON.stringify since it will not preserve the order.
         * NOTE this function will not check the structure and assume it's already valid
         * @param {*} source
         * @param {SourceObjectNode[]?} sourceObjectNodes
         * @returns stringify the given source while ensuring proper order of properties
         * @private
         */
        _stringifySource: function (source, sourceObjectNodes) {
            var srcProps = _sourceProperties,
                helpers = _sourceColumnHelpers;

            if (helpers._sourceHasNodes(source)) {
                // do the same thing as JSON.stringify but
                // make sure the attributes are added in the same order
                var attrs = [];
                source.forEach(function (node, i) {
                    if (typeof node === "string") {
                        attrs.push('"' + node + '"');
                        return;
                    }

                    if (sourceObjectNodes && sourceObjectNodes[i].isAlternativeJoin) {
                        var dr = sourceObjectNodes[i].isInbound ? 'inbound': 'outbound';
                        attrs.push('{"' + dr + '":' + JSON.stringify(sourceObjectNodes[i].nodeObject.constraint_names[0]) + '}');
                        return;
                    }

                    // this will ensure any extra attributes are just ignored (e.g. alias)
                    [srcProps.SOURCEKEY, srcProps.INBOUND, srcProps.OUTBOUND].forEach(function (attr) {
                        if (attr in node) {
                            attrs.push('{"' + attr + '":' + JSON.stringify(node[attr]) + '}');
                            return;
                        }
                    });

                    [srcProps.FILTER, srcProps.AND, srcProps.OR].forEach(function (attr) {
                        if (attr in node) {
                            attrs.push(helpers._stringifyFilterInSource(node));
                            return;
                        }
                    });
                });

                return '[' + attrs.join(',') + ']';
            } else {
                return _sourceColumnHelpers._getSourceColumnStr(source);
            }
        },

        /**
         * @param {string|object} colObject if the foreignkey/key is compund, this should be the constraint name. otherwise the source syntax for pseudo-column.
         * @param {boolean} useOnlySource whether we should ignore other attributes other than source or not
         * @param {SourceObjectNode[]?} sourceObjectNodes the array of node objects that represent the given object
         * @desc return the name that should be used for pseudoColumn. This function makes sure that the returned name is unique.
         * This function can be used to get the name that we're using for :
         *
         * - Composite key/foreignkeys:
         *   In this case, if the constraint name is [`s`, `c`], you should pass `s_c` to this function.
         * - Simple foiregnkey/key:
         *   Pass the equivalent pseudo-column definition of them. It must at least have `source` as an attribute.
         * - Pseudo-Columns:
         *   - Just pass the object that defines the pseudo-column. It must at least have `source` as an attribute.
         *   - This function will go through the source array and ensure the attributes are properly sorted.
         *     This is mainly done for the nodes with multiple properties where JSON.stringify will not
         *     preserve the order of proprties. So instead we're going over the known attributes and create
         *     the string manually ourselves (this will also ensure additional properties are ignored).
         */
        generateSourceObjectHashName: function (colObject, useOnlySource, sourceObjectNodes) {

            //we cannot create an object and stringify it, since its order can be different
            //instead will create a string of `source + aggregate + entity`
            var str = "";

            // it should have source
            if (typeof colObject === "object") {
                if (!colObject.source) return null;

                str += _sourceColumnHelpers._stringifySource(colObject.source, sourceObjectNodes);

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
            str = sparkMD5Hash(str);

            // base64
            str = hexToBase64(str);

            // url safe
            return urlEncodeBase64(str);
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
                for (let j = 0; j < pureBinaryFKs.length; j++) {
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
        }
    };
