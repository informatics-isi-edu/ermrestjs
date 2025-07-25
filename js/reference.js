/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
import moment from 'moment-timezone';

// models
// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';
import {
  ForbiddenError,
  NotFoundError,
  InvalidSortCriteria,
  InvalidPageCriteria,
  InvalidInputError,
  InvalidServerResponse,
  NoDataChangedError,
  BatchUnlinkResponse,
  BatchDeleteResponse,
  UnsupportedFilters,
} from '@isrd-isi-edu/ermrestjs/src/models/errors';

// services
import CatalogSerivce from '@isrd-isi-edu/ermrestjs/src/services/catalog';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';
import HTTPService from '@isrd-isi-edu/ermrestjs/src/services/http';
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isInteger, isObject, isObjectAndNotNull, isStringAndNotEmpty, verify } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent, simpleDeepCopy, shallowCopy, shallowCopyExtras } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import {
  _annotations,
  _compactFacetingContexts,
  contextHeaderName,
  _constraintTypes,
  _contexts,
  _displayTypes,
  _ERMrestACLs,
  _ERMrestFeatures,
  _facetFilterTypes,
  _FacetsLogicalOperators,
  FILTER_TYPES,
  _nonSortableTypes,
  _operationsFlag,
  _parserAliases,
  _permissionMessages,
  _serialTypes,
  _specialSourceDefinitions,
  _sourceDefinitionAttributes,
  _systemColumns,
  _tableKinds,
  URL_PATH_LENGTH_LIMIT,
  _warningMessages,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import validateJSONLD from '@isrd-isi-edu/ermrestjs/js/json_ld_validator.js';
import { parse, _getSearchTerm } from '@isrd-isi-edu/ermrestjs/js/parser';
import {
  AssetPseudoColumn,
  _createPseudoColumn,
  FacetColumn,
  ForeignKeyPseudoColumn,
  InboundForeignKeyPseudoColumn,
  ReferenceColumn,
  KeyPseudoColumn,
  VirtualColumn,
} from '@isrd-isi-edu/ermrestjs/js/column';
import { ermrestFactory, Column, Table } from '@isrd-isi-edu/ermrestjs/js/core';
import {
  _exportHelpers,
  validateExportTemplate,
  _referenceExportOutput,
  _getAssetExportOutput,
  _getExportReference,
} from '@isrd-isi-edu/ermrestjs/js/export';
import { onload } from '@isrd-isi-edu/ermrestjs/js/setup/node';
import {
  compareColumnPositions,
  _getAnnotationValueByContext,
  _getHierarchicalDisplayAnnotationValue,
  _getRecursiveAnnotationValue,
  _generateRowName,
  _generateTupleUniqueId,
  _getRowTemplateVariables,
  generateKeyValueFilters,
  _getFormattedKeyValues,
  _getPagingValues,
  _isEntryContext,
  _isValidSortElement,
  _isValidForeignKeyName,
  _isValidModelCommentDisplay,
  _renderTemplate,
  _processColumnOrderList,
  _processSourceObjectComment,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import {
  _facetColumnHelpers,
  _compressFacetObject,
  _compressSource,
  _sourceColumnHelpers,
  _processWaitForList,
} from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';

    /**
     * This function resolves a URI reference to a {@link ERMrest.Reference}
     * object. It validates the syntax of the URI and validates that the
     * references to model elements in it are correct. This function makes a
     * call to the ERMrest server in order to get the `schema` which it uses to
     * validate the URI path.
     *
     * For a consistent behavior, always contextualize the resolved `Reference` object.
     * See {@link ERMrest.Reference#contextualize} for more information.
     *
     * Usage:
     * ```
     * // This example assume that the client has access to the `ERMrest` module
     * ERMrest.resolve('https://example.org/catalog/42/entity/s:t/k=123').then(
     *   function(reference) {
     *     // the uri was successfully resolve to a `Reference` object
     *     console.log("The reference has URI", reference.uri);
     *     console.log("It has", reference.columns.length, "columns");
     *     console.log("Is it unique?", (reference.isUnique ? 'yes' : 'no'));
     *     ...
     *   },
     *   function(error) {
     *     // there was an error returned here
     *     ...
     *   });
     * ```
     * @memberof ERMrest
     * @function resolve
     * @param {string} uri -  An ERMrest resource URI, such as
     * `https://example.org/ermrest/catalog/1/entity/s:t/k=123`.
     * @param {Object} [contextHeaderParams] - An optional context header parameters object. The (key, value)
     * pairs from the object are converted to URL `key=value` query parameters
     * and appended to every request to the ERMrest service.
     * @return {Promise} Promise when resolved passes the
     * {@link ERMrest.Reference} object. If rejected, passes one of:
     * {@link ERMrest.MalformedURIError}
     * {@link ERMrest.TimedOutError},
     * {@link ERMrest.InternalServerError},
     * {@link ERMrest.ConflictError},
     * {@link ERMrest.ForbiddenError},
     * {@link ERMrest.UnauthorizedError},
     * {@link ERMrest.NotFoundError},
     * {@link ERMrest.InvalidSortCriteria},
     */
    export const resolve = function (uri, contextHeaderParams) {
        var defer = ConfigService.q.defer();
        try {
            verify(uri, "'uri' must be specified");
            var location;
            // make sure all the dependencies are loaded
            onload().then(function () {
                //added try block to make sure it rejects all parse() related error
                // It should have been taken care by outer try but did not work
                try{
                    location = parse(uri);
                } catch (error){
                    return defer.reject(error);
                }

                var server = ermrestFactory.getServer(location.service, contextHeaderParams);

                // find the catalog
                return server.catalogs.get(location.catalog);
            }).then(function (catalog) {

                //create Reference
                defer.resolve(new Reference(location, catalog));
            }).catch(function(exception) {
                defer.reject(exception);
            });
        } catch (e) {
            defer.reject(e);
        }

        return defer.promise;
    };

    /**
     * @function
     * @memberof ERMrest
     * @param {ERMrest.Location} location - The location object generated from parsing the URI
     * @param {ERMrest.Catalog} catalog - The catalog object. Since location.catalog is just an id, we need the actual catalog object too.
     * @desc
     * Creates a new Reference based on the given parameters. Other parts of API can access this function and it should only be used internally.
     * @private
     */
    export const _createReference = function (location, catalog) {
        return new Reference(location, catalog);
    };

    // NOTE: This function is only being used in unit tests.
    export const _createPage = function (reference, etag, data, hasPrevious, hasNext) {
        return new Page(reference, etag, data, hasPrevious, hasNext);
    };

    /**
     * Constructs a Reference object.
     *
     * For most uses, maybe all, of the `ermrestjs` library, the Reference
     * will be the main object that the client will interact with. References
     * are immutable objects and therefore can be safely passed around and
     * used between multiple client components without risk that the underlying
     * reference to server-side resources could change.
     *
     * Usage:
     *  Clients _do not_ directly access this constructor.
     *  See {@link ERMrest.resolve}.
     * @memberof ERMrest
     * @class
     * @param {ERMrest.Location} location - The location object generated from parsing the URI
     * @param {Catalog} catalog - The catalog object. Since location.catalog is just an id, we need the actual catalog object too.
     */
    export function Reference(location, catalog) {
        /**
         * The members of this object are _contextualized references_.
         *
         * These references will behave and reflect state according to the mode.
         * For instance, in a `record` mode on a table some columns may be
         * hidden.
         *
         * Usage:
         * ```
         * // assumes we have an uncontextualized `Reference` object
         * var recordref = reference.contextualize.detailed;
         * ```
         * The `reference` is unchanged, while `recordref` now represents a
         * reconfigured reference. For instance, `recordref.columns` may be
         * different compared to `reference.columns`.
         */
        this.contextualize = new Contextualize(this);

        // make sure context is string to avoid breaking some code paths
        this._context = '';

        // make sure location object has the catalog
        // TODO could be improved
        location.catalogObject = catalog;

        // make sure location object has the current reference
        location.referenceObject = this;

        this._location = location;

        this._server = catalog.server;

        // if schema was not provided in the URI, find the schema
        this._table = catalog.schemas.findTable(location.tableName, location.schemaName);

        this._facetBaseTable = catalog.schemas.findTable(location.facetBaseTableName, location.facetBaseSchemaName);

        this._shortestKey = this._table.shortestKey;

        /**
         * @type {ReferenceAggregateFn}
         */
        this.aggregate = new ReferenceAggregateFn(this);
    }

    Reference.prototype = {
        constructor: Reference,

        /**
         * The display name for this reference.
         * displayname.isHTML will return true/false
         * displayname.value has the value
         *
         * @type {object}
         */
        get displayname () {
            /* Note that displayname is context dependent. For instance,
             * a reference to an entity set will use the table displayname
             * as the reference displayname. However, a 'related' reference
             * will use the FKR's displayname (actually its "to name" or
             * "from name"). Like a Person table might have a FKR to its parent.
             * In one directoin, the FKR is named "parent" in the other
             * direction it is named "child".
             */
            // TODO related reference displayname
            if (!this._displayname)
                this._displayname = this._table.displayname;
            return this._displayname;
        },

        /**
         * The comment for this reference.
         *
         * @type {Object}
         */
        get comment () {
            /* Note that comment is context dependent. For instance,
             * a reference to an entity set will use the table comment
             * as the reference comment. However, a 'related' reference
             * will use the FKR's comment (actually its "to comment" or
             * "from comment"). Like a Person table might have a FKR to its parent.
             * In one directoin, the FKR is named "parent" in the other
             * direction it is named "child".
             */
            if (this._comment === undefined) {
                this._comment = this._table.getDisplay(this._context).comment;
            }
            return this._comment;
        },

        /**
         * The string form of the `URI` for this reference.
         * NOTE: It is not understanable by ermrest, and it also doesn't have the modifiers (sort, page).
         * Should not be used for sending requests to ermrest, use this.location.ermrestCompactUri instead.
         * @type {string}
         */
        get uri() {
            return this._location.compactUri;
        },

        get readPath() {
            if (this._readPath === undefined) {
                this._readPath = this._getReadPath(false).value;
            }
            return this._readPath;
        },

        /**
         * This will ensure the ermrestCompactPath is also
         * using the same aliases that we are going to use for allOutbounds
         * I'm attaching this to Reference so it's cached and we don't have to
         * compute it multiple times
         * @private
         */
        get _readAttributeGroupPathProps() {
            if (this._readAttributeGroupPathProps_cached === undefined) {
                var allOutBounds = this.activeList.allOutBounds;
                this._readAttributeGroupPathProps_cached =  this._location.computeERMrestCompactPath(allOutBounds.map(function (ao) {
                    return ao.sourceObject;
                }));
            }
            return this._readAttributeGroupPathProps_cached;
        },

        /**
         * The table object for this reference
         * @type {Table}
         */
         get table() {
            return this._table;
         },

         /**
          * The base table object that is used for faceting,
          * if there's a join in path, this will return a different object from .table
          * @type {Table}
          */
         get facetBaseTable() {
             return this._facetBaseTable;
         },

        /**
         * The array of column definitions which represent the model of
         * the resources accessible via this reference.
         *
         * _Note_: in database jargon, technically everything returned from
         * ERMrest is a 'tuple' or a 'relation'. A tuple consists of attributes
         * and the definitions of those attributes are represented here as the
         * array of {@link Column}s. The column definitions may be
         * contextualized (see {@link Reference#contextualize}).
         *
         * Usage:
         * ```
         * for (var i=0, len=reference.columns.length; i<len; i++) {
         *   var col = reference.columns[i];
         *   console.log("Column name:", col.name, "has display name:", col.displayname);
         * }
         * ```
         * @type {ReferenceColumn[]}
         */
        get columns() {
            if (this._referenceColumns === undefined) {
                this.generateColumnsList();
            }
            return this._referenceColumns;
        },

        /**
         * NOTE this will not map the entity choice pickers, use "generateFacetColumns" instead.
         * so directly using this is not recommended.
         * @return {FacetColumn[]}
         */
        get facetColumns() {
            if (this._facetColumns === undefined) {
                this._generateFacetColumns(true);
            }
            return this._facetColumns;
        },

        /**
         * Returns the facets that should be represented to the user.
         * It will return a promise resolved with the following object:
         * {
         *   facetColumns: <an array of FacetColumn objects>
         *   issues: <if null it means that there wasn't any issues, otherwise will be a UnsupportedFilters object>
         * }
         *
         * - If `filter` context is not defined for the table, following heuristics will be used:
         *    - All the visible columns in compact context.
         *    - All the related entities in detailed context.
         * - This function will modify the Reference.location to reflect the preselected filters
         *   per annotation as well as validation.
         * - This function will validate the facets in the url, by doing the following (any invalid filter will be ignored):
         *   - Making sure given `source` or `sourcekey` are valid
         *   - If `source_domain` is passed,
         *       - Making sure `source_domain.table` and `source_domain.schema` are valid
         *       - Using `source_domain.column` instead of end column in case of scalars
         *   - Sending request to fetch the rows associated with the entity choices,
         *     and ignoring the ones that don't return any result.
         * - The valid filters in the url will either be matched with an existing facet,
         *   or result in a new facet column.
         * Usage:
         * ```
         *  reference.generateFacetColumns.then(function (result) {
         *      var newRef = result.facetColumns[0].addChoiceFilters(['value']);
         *      var newRef2 = newRef.facetColumns[1].addSearchFilter('text 1');
         *      var newRef3 = newRef2.facetColumns[2].addRangeFilter(1, 2);
         *      var newRef4 = newRef3.facetColumns[3].removeAllFilters();
         *      for (var i=0, len=newRef4.facetColumns.length; i<len; i++) {
         *          var fc = reference.facetColumns[i];
         *          console.log("Column name:", fc.column.name, "has following facets:", fc.filters);
         *      }
         * });
         * ```
         */
        generateFacetColumns: function () {
            return this._generateFacetColumns(false);
        },

        /**
         * Generate a list of facetColumns that should be used for the given reference.
         * will also attach _facetColumns to the reference.
         * If skipMappingEntityChoices=true, it will return the result synchronously
         * otherwise will return a promise resolved with the following object:
         * {
         *   facetColumns: <an array of FacetColumn objects>
         *   issues: <if null it means that there wasn't any issues, otherwise will be a UnsupportedFilters object>
         * }
         *
         * @param {reference} self
         * @param {Boolean} skipMappingEntityChoices - whether we should map entity choices or not
         * @private
         */
        _generateFacetColumns: function (skipMappingEntityChoices) {
            var self = this;

            var defer = ConfigService.q.defer();

            var andOperator = _FacetsLogicalOperators.AND;
            var searchTerm =  self.location.searchTerm;
            var helpers = _facetColumnHelpers;

            // if location has facet or filter, we should honor it and we should not add preselected facets in annotation
            var hasFilterOrFacet = self.location.facets || self.location.filter || self.location.customFacets;

            var andFilters = self.location.facets ? self.location.facets.andFilters : [];
            // change filters to facet NOTE can be optimized to actually merge instead of just appending to list
            if (self.location.filter && self.location.filter.depth === 1 && Array.isArray(self.location.filter.facet.and)) {
                Array.prototype.push.apply(andFilters, self.location.filter.facet.and);
                self._location.removeFilters();
            }

            var annotationCols = -1, usedAnnotation = false;
            var facetObjectWrappers = [];

            // get column orders from annotation
            if (self._table.annotations.contains(_annotations.VISIBLE_COLUMNS)) {
                annotationCols = _getAnnotationValueByContext(_contexts.FILTER, self._table.annotations.get(_annotations.VISIBLE_COLUMNS).content);
                if (Object.prototype.hasOwnProperty.call(annotationCols, andOperator) && Array.isArray(annotationCols[andOperator])) {
                    annotationCols = annotationCols[andOperator];
                } else {
                    annotationCols = -1;
                }
            }

            if (annotationCols !== -1) {
                usedAnnotation = true;
                //NOTE We're allowing duplicates in annotation.
                annotationCols.forEach(function (obj, objIndex) {
                    // if we have filters in the url, we will get the filters only from url
                    if (obj.sourcekey === _specialSourceDefinitions.SEARCH_BOX && andFilters.length === 0) {
                        if (!searchTerm) {
                            searchTerm = _getSearchTerm({"and": [obj]});
                        }
                        return;
                    }

                    // make sure it's not referring to the annotation object.
                    obj = simpleDeepCopy(obj);

                    let sd, wrapper;
                    try {
                        // if both source and sourcekey are defined, ignore the source and use sourcekey
                        if (obj.sourcekey) {
                            sd = self.table.sourceDefinitions.getSource(obj.sourcekey);
                            if (!sd || !sd.processFilterNodes(undefined).success) return;

                            wrapper = sd.clone(obj, self._table, true);
                        } else {
                            wrapper = new SourceObjectWrapper(obj, self._table, true);
                        }
                    } catch(exp) {
                        $log.info(`facet definition index=${objIndex}: ` + exp);
                        // invalid definition or not unsupported
                        // TODO could show the error message
                        return;
                    }

                    var supported = helpers.checkFacetObjectWrapper(wrapper);
                    if (!supported) return;

                    // if we have filters in the url, we will get the filters only from url
                    if (hasFilterOrFacet) {
                        delete wrapper.sourceObject.not_null;
                        delete wrapper.sourceObject.choices;
                        delete wrapper.sourceObject.search;
                        delete wrapper.sourceObject.ranges;
                    }

                    facetObjectWrappers.push(wrapper);
                });
            }
            // annotation didn't exist, so we are going to use the
            // visible columns in detailed and related entities in detailed
            else {
                // this reference should be only used for getting the list,
                var detailedRef = (self._context === _contexts.DETAILED) ? self : self.contextualize.detailed;
                var compactRef = (self._context === _contexts.COMPACT) ? self : self.contextualize.compact;


                // all the visible columns in compact context
                compactRef.columns.forEach(function (col) {
                    var fcObj = helpers.checkRefColumn(col);
                    if (!fcObj) return;

                    facetObjectWrappers.push(new SourceObjectWrapper(fcObj, self._table, true));
                });

                // all the realted in detailed context
                detailedRef.related.forEach(function (relRef) {
                    var fcObj;
                    if (relRef.pseudoColumn && !relRef.pseudoColumn.isInboundForeignKey) {
                        fcObj = simpleDeepCopy(relRef.pseudoColumn.sourceObject);
                    } else {
                        fcObj = helpers.checkRefColumn(new InboundForeignKeyPseudoColumn(self, relRef));
                    }
                    if (!fcObj) return;

                    /*
                        * Because of alternative logic, the table that detailed is referring to
                        * might be different than compact.
                        * Since we're using the detailed just for its related entities api,
                        * if detailed is actually an alternative table, it won't have any
                        * related entities. Therefore we don't need to handle that case.
                        * The only case we need to cover are:
                        * deatiled is main, compact is alternative
                        *    - Add the linkage from main to alternative to all the detailed related entities.
                        * NOTE: If we change the related logic, to return the
                        * related entities to the main table instead of alternative, this should be changed.
                        */
                    if (detailedRef.table !== compactRef.table &&
                        !detailedRef.table._isAlternativeTable() && compactRef.table._isAlternativeTable()) {
                        fcObj.source.unshift({"outbound": compactRef.table._altForeignKey.constraint_names[0]});
                    }
                    facetObjectWrappers.push(new SourceObjectWrapper(fcObj, self._table, true));
                });
            }


            // if we have filters in the url, we should just get the structure from annotation
            var finalize = function (res) {
                var facetColumns = [];

                // turn facetObjectWrappers into facetColumn
                res.facetObjectWrappers.forEach(function(fo, index) {
                    // if the function returns false, it couldn't handle that case,
                    // and therefore we are ignoring it.
                    // it might change the fo
                    if (!helpers.checkForAlternative(fo, usedAnnotation, self._table)) return;
                    facetColumns.push(new FacetColumn(self, index, fo));
                });

                // get the existing facets on the columns (coming from annotation)
                facetColumns.forEach(function(fc) {
                    if (fc.filters.length !== 0) {
                        res.newFilters.push(fc.toJSON());
                    }
                });

                //NOTE we should make sure this is being called before read.
                if (res.newFilters.length > 0) {
                    self._location.facets = {"and": res.newFilters};
                } else {
                    self._location.facets = null;
                }

                return facetColumns;
            };


            // if we don't want to map entity choices, then function will work in sync mode
            if (skipMappingEntityChoices) {
                var res = self.validateFacetsFilters(andFilters ,facetObjectWrappers, searchTerm, skipMappingEntityChoices);
                self._facetColumns = finalize(res);
                return {
                    facetColumns: self._facetColumns,
                    issues: res.issues
                };
            } else {
                self.validateFacetsFilters(andFilters ,facetObjectWrappers, searchTerm, skipMappingEntityChoices).then(function (res) {
                    self._facetColumns = finalize(res);
                    // make sure we're generating the facetColumns from scratch
                    defer.resolve({
                        facetColumns: self._facetColumns,
                        issues: res.issues
                    });
                }).catch(function (err) {
                    self._facetColumns = [];
                    defer.reject(err);
                });
            }

            return defer.promise;
        },

        /**
         * This will go over all the facets and make sure they are fine
         * if not, will try to transform or remove them and
         * in the end will update the list
         *
         * NOTE this should be called before doing read or as part of it
         * @param {Array?} facetAndFilters - (optional) the filters in the url
         * @param {SourceObjectWrapper[]?} facetObjectWrappers - (optional) the generated facet objects
         * @param {String?} searchTerm - (optional) the search term that is used
         * @param {Boolean?} skipMappingEntityChoices  - (optional) if true, it will return a sync result
         * @param {Boolean?} changeLocation - (optional) whether we should change reference.location or not
         */
        validateFacetsFilters: function (facetAndFilters, facetObjectWrappers, searchTerm, skipMappingEntityChoices, changeLocation) {
            var defer = ConfigService.q.defer(),
                self = this,
                helpers = _facetColumnHelpers,
                promises = [],
                checkedObjects = {},
                j, facetLen = facetObjectWrappers.length, andFilterObject;
            /*
            * In some cases we are updating the given sources and therefore the
            * filter will change, so we must make sure that we update the url
            * to reflect those changes. These chagnes are
            * 1. When annotation is used and we have preselected filters.
            * 2. When the main table has an alternative table.
            * 3. When facet tables have alternative table
            * This is just to make sure the facet filters and url are in sync.
            */
            var res = {
                facetObjectWrappers: facetObjectWrappers,
                newFilters: [],
                issues: null
            };

            var discardedFacets = [], partialyDiscardedFacets = [];
            var addToIssues = function (obj, message, discardedChoices) {
                // TODO https://github.com/informatics-isi-edu/ermrestjs/issues/940
                var name = obj.markdown_name;
                if (!name && obj.sourcekey) {
                    name = obj.sourcekey;
                }
                $log.warn("invalid facet " + (name ? name : "") + ": " + message);
                if (Array.isArray(discardedChoices) && discardedChoices.length > 0) {
                    partialyDiscardedFacets.push({
                        markdown_name: name,
                        choices: discardedChoices,
                        total_choice_count: obj.choices.length + discardedChoices.length
                    });
                } else {
                    discardedFacets.push({
                        markdown_name: name,
                        choices: obj.choices,
                        ranges: obj.ranges,
                        not_null: obj.not_null
                    });
                }
            };

            searchTerm =  searchTerm || self.location.searchTerm;
            // add the search term
            if (typeof searchTerm === "string") {
                res.newFilters.push({"sourcekey": _specialSourceDefinitions.SEARCH_BOX, "search": [searchTerm]});
            }

            if (facetAndFilters == null || !Array.isArray(facetAndFilters)) {
                facetAndFilters = self.location.facets ? self.location.facets.andFilters : [];
            }

            // if there wasn't any facets in the url, just return
            if (facetAndFilters.length == 0) {
                if (skipMappingEntityChoices) {
                    return res;
                } else {
                    return defer.resolve(res), defer.promise;
                }
            }

            // go over the list of facets in the url and process them if needed
            facetAndFilters.forEach(function (facetAndFilter, i) {
                if (facetAndFilter.sourcekey === _specialSourceDefinitions.SEARCH_BOX) {
                    return;
                }

                if (typeof facetAndFilter.sourcekey === "string") {
                    const urlSourceDef = self.table.sourceDefinitions.getSource(facetAndFilter.sourcekey);

                    // invalid sourcekey
                    if (!urlSourceDef) {
                        addToIssues(facetAndFilter, "`" + facetAndFilter.sourcekey + "` is not a valid sourcekey.");
                        return;
                    }

                    // TODO depending on what we want to do when
                    //      just source is passed, we would have to move this
                    // validate entity mode if it's defined
                    if (typeof facetAndFilter.entity === "boolean") {
                        if (urlSourceDef.isEntityMode != facetAndFilter.entity) {
                            addToIssues(facetAndFilter, "`" + facetAndFilter.sourcekey + "` entity mode has changed.");
                        }
                    }

                    // copy the elements that are defined in the source def but not the one already defined
                    shallowCopyExtras(facetAndFilter, urlSourceDef.sourceObject, _sourceDefinitionAttributes);
                }

                if (facetAndFilter.hidden) {
                    // NOTE does this make sense?
                    res.newFilters.push(facetAndFilter);
                    return;
                }

                // validate the source definition
                try {
                    andFilterObject = new SourceObjectWrapper(facetAndFilter, self.table, true);
                } catch (exp) {
                    addToIssues(facetAndFilter, exp.message);
                    return;
                }

                // validate source_domain
                if (isObjectAndNotNull(facetAndFilter.source_domain)) {
                    var col = andFilterObject.column;
                    if (isStringAndNotEmpty(facetAndFilter.source_domain.schema) && col.table.schema.name !== facetAndFilter.source_domain.schema) {
                        // make sure the schema name is valid
                        if (col.table.schema.catalog.schemas.has(facetAndFilter.source_domain.schema)) {
                            addToIssues(facetAndFilter, "The state of facet has changed (schema missmatch).");
                            return;
                        }
                    }

                    if (isStringAndNotEmpty(facetAndFilter.source_domain.table) && col.table.name !== facetAndFilter.source_domain.table) {
                        // make sure the table name is valid
                        if (col.table.schema.tables.has(facetAndFilter.source_domain.table)) {
                            addToIssues(facetAndFilter, "The state of facet has changed (table missmatch).");
                            return;
                        }
                    }

                    // validate the given column name
                    if (isStringAndNotEmpty(facetAndFilter.source_domain.column) && !col.table.columns.has(facetAndFilter.source_domain.column)) {
                        delete facetAndFilter.source_domain.column;
                    }

                    // modify the last column name to be the one in source_domain in scalar mode
                    if (!andFilterObject.isEntityMode && isStringAndNotEmpty(facetAndFilter.source_domain.column) && col.name !== facetAndFilter.source_domain.column) {
                        if (Array.isArray(facetAndFilter.source)) {
                            facetAndFilter.source[facetAndFilter.source.length-1] = facetAndFilter.source_domain.column;
                        } else {
                            facetAndFilter.source = facetAndFilter.source_domain.column;
                        }
                        facetAndFilter.entity = false;
                        andFilterObject = new SourceObjectWrapper(facetAndFilter, self.table, true);
                    }
                }

                // in case of entity choice picker we have to translate the given choices
                if (!skipMappingEntityChoices && andFilterObject.isEntityMode && Array.isArray(facetAndFilter.choices)) {
                    promises.push({andFilterObject: andFilterObject, mapEntityChoices: true});
                } else {
                    promises.push({
                        andFilterObject: andFilterObject
                    });
                }
            });

            var finalize = function (response) {
                response.forEach(function (resp) {
                    // if in entity mode some choices were invalid
                    if (Array.isArray(resp.invalidChoices) && resp.invalidChoices.length > 0) {
                        // if no choices was left, then we don't need to merge it with anything and we should ignore it
                        if (resp.andFilterObject.sourceObject.choices.length === 0 || resp.andFilterObject.entityChoiceFilterTuples.length === 0) {
                            // adding the choices back so we can produce proper error message
                            resp.andFilterObject.sourceObject.choices = resp.originalChoices;
                            addToIssues(resp.andFilterObject.sourceObject, "None of the encoded choices were available");
                            return;
                        } else {
                            addToIssues(resp.andFilterObject.sourceObject, "The following encoded choices were not available: " + resp.invalidChoices.join(", "), resp.invalidChoices);
                        }
                    }

                    // if facetObjectWrappers is passed, we have to create a facet or merge with existing
                    if (res.facetObjectWrappers) {
                        // find the facet corresponding to the filter
                        var found = false;
                        for (j = 0; j < facetLen; j++) {

                            // it can be merged only once, since in a facet the filter is
                            // `or` and outside it's `and`.
                            if (checkedObjects[j]) continue;

                            // we want to make sure these two sources are exactly the same
                            // so we can compare their hashnames
                            if (res.facetObjectWrappers[j].name === resp.andFilterObject.name) {
                                checkedObjects[j] = true;
                                found = true;
                                // merge facet objects
                                helpers.mergeFacetObjects(res.facetObjectWrappers[j].sourceObject, resp.andFilterObject.sourceObject);

                                // make sure the page object is stored
                                if (resp.andFilterObject.entityChoiceFilterTuples) {
                                    res.facetObjectWrappers[j].entityChoiceFilterTuples = resp.andFilterObject.entityChoiceFilterTuples;
                                }
                            }
                        }

                        // couldn't find the facet, create a new facet object
                        if (!found) {
                            res.facetObjectWrappers.push(resp.andFilterObject);
                        }
                    }
                    // otherwise just capture the filters in url
                    else {
                        res.newFilters.push(res.andFilterObject);
                    }
                });

                if (changeLocation) {
                    if (res.newFilters.length > 0) {
                        self._location.facets = {"and": res.newFilters};
                    } else {
                        self._location.facets = null;
                    }
                }

                if (discardedFacets.length > 0 || partialyDiscardedFacets.length > 0) {
                    res.issues = new UnsupportedFilters(discardedFacets, partialyDiscardedFacets);
                }
            };

            if (skipMappingEntityChoices) {
                finalize(promises);
                return res;
            } else {
                helpers.runAllEntityChoicePromises(
                    promises,
                    function (response) {
                        finalize(response);
                        defer.resolve(res);
                    },
                    function (error) {
                        defer.reject(error);
                    }
                );
            }

            return defer.promise;
        },

        /**
         * List of columns that are used for search
         * if it's false, then we're using all the columns for search
         * @type {ERMRest.ReferenceColumn[]|false}
         */
        get searchColumns() {
            if (this._searchColumns === undefined) {
                var self = this;
                this._searchColumns = false;
                if (this.table.searchSourceDefinition && Array.isArray(this.table.searchSourceDefinition.columns)) {
                    this._searchColumns = this.table.searchSourceDefinition.columns.map(function (sd) {
                        return _createPseudoColumn(self, sd, null);
                    });
                }
            }
            return this._searchColumns;
        },

        /**
         * Remove all the filters, facets, and custom-facets from the reference
         * @param {boolean} sameFilter By default we're removing filters, if this is true filters won't be changed.
         * @param {boolean} sameCustomFacet By default we're removing custom-facets, if this is true custom-facets won't be changed.
         * @param {boolean} sameFacet By default we're removing facets, if this is true facets won't be changed.
         *
         * @return {reference} A reference without facet filters
         */
        removeAllFacetFilters: function (sameFilter, sameCustomFacet, sameFacet) {
            verify(!(sameFilter && sameCustomFacet && sameFacet), "at least one of the options must be false.");

            var newReference = _referenceCopy(this);

            // update the facetColumns list
            // NOTE there are two reasons for this:
            // 1. avoid computing the facet columns logic each time that we are removing facets.
            // 2. we don't want the list of facetColumns to be changed because of a change in the facets.
            //    Some facetColumns are only in the list because they had an initial filter, and if we
            //    compute that logic again, those facets will disappear.
            newReference._facetColumns = [];
            this.facetColumns.forEach(function (fc) {
                newReference._facetColumns.push(
                    new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, sameFacet ? fc.filters.slice() : [])
                );
            });

            // update the location objectcd
            newReference._location = this._location._clone(newReference);
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;

            if (!sameFacet) {

                // the hidden filters should still remain
                var andFilters = this.location.facets ? this.location.facets.andFilters : [];
                var newFilters = [];
                andFilters.forEach(function (f) {
                    if (f.hidden) {
                        newFilters.push(f);
                    }
                });
                newReference._location.facets = newFilters.length > 0 ? {"and": newFilters} : null;
            }

            if (!sameCustomFacet) {
                newReference._location.customFacets = null;
            }

            if (!sameFilter) {
                newReference._location.removeFilters();
            }

            return newReference;
        },

        /**
         * Given a list of facet and filters, will add them to the existing conjunctive facet filters.
         *
         * @param {Object[]} facetAndFilters - an array of facets that will be added
         * @param {Object} customFacets - the custom facets object
         * @return {Reference}
         */
        addFacets: function (facetAndFilters, customFacets) {
            verify(Array.isArray(facetAndFilters) && facetAndFilters.length > 0, "given input must be an array");

            var loc = this.location;

            // keep a copy of existing facets
            var existingFilters = loc.facets ? simpleDeepCopy(loc.facets.andFilters) : [];

            // create a new copy
            var newReference = _referenceCopy(this);

            // clone the location object
            newReference._location = loc._clone(newReference);
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;

            // merge the existing facets with the input
            newReference._location.facets = {"and": facetAndFilters.concat(existingFilters)};

            if (isObjectAndNotNull(customFacets)) {
                newReference._location.customFacets = customFacets;
            }

            return newReference;
        },

        /**
         * Will return a reference with the same facets but hidden.
         *
         * @return {Reference}
         */
        hideFacets: function () {
            var andFilters = this.location.facets ? this.location.facets.andFilters : [];

            verify(andFilters.length > 0, "Reference doesn't have any facets.");

            var newReference = _referenceCopy(this), newFilters = [], newFilter;
            delete newReference._facetColumns;

            // update the location object
            newReference._location = this._location._clone(newReference);
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;

            // make all the facets as hidden
            andFilters.forEach(function (f) {
                newFilter = simpleDeepCopy(f);
                newFilter.hidden = true;
                newFilters.push(newFilter);
            });

            newReference._location.facets = {"and": newFilters};

            return newReference;
        },

        /**
         * Location object that has uri of current reference
         * @return {ERMrest.Location}
         */
        get location() {
            return this._location;
        },

        /**
         * Indicates whether the client has the permission to _create_
         * the referenced resource(s). Reporting a `true` value DOES NOT
         * guarantee the user right since some policies may be undecidable until
         * query execution.
         * @type {boolean}
         */
        get canCreate() {
            if (this._canCreate === undefined) {

                // can create if all are true
                // 1) user has write permission
                // 2) table is not generated
                // 3) not all visible columns in the table are generated
                var pm = _permissionMessages;
                var ref = (this._context === _contexts.CREATE) ? this : this.contextualize.entryCreate;

                if (ref._table.kind === _tableKinds.VIEW) {
                    this._canCreate = false;
                    this._canCreateReason = pm.TABLE_VIEW;
                } else if (ref._table._isGenerated) {
                    this._canCreate = false;
                    this._canCreateReason = pm.TABLE_GENERATED;
                } else if (!ref.checkPermissions(_ERMrestACLs.INSERT)) {
                    this._canCreate = false;
                    this._canCreateReason = pm.NO_CREATE;
                } else {
                    this._canCreate = true;
                }

                if (this._canCreate === true) {
                    var allColumnsDisabled = ref.columns.every(function (col) {
                        return col.inputDisabled !== false;
                    });

                    if (allColumnsDisabled) {
                        this._canCreate = false;
                        this._canCreateReason = pm.DISABLED_COLUMNS;
                    }
                }
            }
            return this._canCreate;
        },

        /**
         * Indicates the reason as to why a user cannot create the
         * referenced resource(s).
         * @type {String}
         */
        get canCreateReason() {
            if (this._canCreateReason === undefined) {
                // will set the _canCreateReason property
                var bool = this.canCreate;
            }
            return this._canCreateReason;
        },

        /**
         * Indicates whether the client has the permission to _read_
         * the referenced resource(s). Reporting a `true` value DOES NOT
         * guarantee the user right since some policies may be undecidable until
         * query execution.
         * @type {boolean}
         */
        get canRead() {
            if (this._canRead === undefined) {
                this._canRead = this.checkPermissions(_ERMrestACLs.SELECT);
            }
            return this._canRead;
        },

        /**
         * Indicates whether the client has the permission to _update_
         * the referenced resource(s). Reporting a `true` value DOES NOT
         * guarantee the user right since some policies may be undecidable until
         * query execution.
         * @type {boolean}
         */
        get canUpdate() {

            // can update if all are true
            // 1) user has write permission
            // 2) table is not generated
            // 3) table is not immutable
            // 4) not all visible columns in the table are generated/immutable
            if (this._canUpdate === undefined) {
                var pm = _permissionMessages;
                var ref = (this._context === _contexts.EDIT) ? this : this.contextualize.entryEdit;

                if (ref._table.kind === _tableKinds.VIEW) {
                    this._canUpdate = false;
                    this._canUpdateReason = pm.TABLE_VIEW;

                // if table specifically says that it's not immutable, then it's not!
                } else if (ref._table._isGenerated && ref._table._isImmutable !== false) {
                    this._canUpdate = false;
                    this._canUpdateReason = pm.TABLE_GENERATED;
                } else if (ref._table._isImmutable) {
                    this._canUpdate = false;
                    this._canUpdateReason = pm.TABLE_IMMUTABLE;
                } else if (!ref.checkPermissions(_ERMrestACLs.UPDATE)) {
                    this._canUpdate = false;
                    this._canUpdateReason = pm.NO_UPDATE;
                } else {
                    this._canUpdate = true;
                }

                if (this._canUpdate) {
                    var allColumnsDisabled = ref.columns.every(function (col) {
                        return col.inputDisabled !== false;
                    });

                    if (allColumnsDisabled) {
                        this._canUpdate = false;
                        this._canUpdateReason = pm.DISABLED_COLUMNS;
                    }
                }
            }
            return this._canUpdate;
        },

        /**
         * Indicates the reason as to why a user cannot update the
         * referenced resource(s).
         * @type {String}
         */
        get canUpdateReason() {
            if (this._canUpdateReason === undefined) {
                // will set the _canUpdateReason property
                var bool = this.canUpdate;
            }
            return this._canUpdateReason;
        },

        /**
         * Indicates whether the client has the permission to _delete_
         * the referenced resource(s). Reporting a `true` value DOES NOT
         * guarantee the user right since some policies may be undecidable until
         * query execution.
         * @type {boolean}
         */
        get canDelete() {

            // can delete if all are true
            // 1) table is not non-deletable
            // 2) user has write permission
            if (this._canDelete === undefined) {
                this._canDelete = this._table.kind !== _tableKinds.VIEW && !this._table._isNonDeletable && this.checkPermissions(_ERMrestACLs.DELETE);
            }
            return this._canDelete;
        },


        /**
         *  Returns true if
         *   - ermrest supports trs, and
         *   - table has dynamic acls, and
         *   - table has RID column, and
         *   - table is not marked non-deletable non-updatable by annotation
         * @type {Boolean}
         */
        get canUseTRS() {
            if (this._canUseTRS === undefined) {
                var rightKey = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
                this._canUseTRS = (this.table.schema.catalog.features[rightKey] === true) &&
                                  (this.table.rights[_ERMrestACLs.UPDATE] == null || this.table.rights[_ERMrestACLs.DELETE] == null) &&
                                  this.table.columns.has("RID") &&
                                  (this.canUpdate || this.canDelete);
            }
            return this._canUseTRS;
        },

        /**
         *  Returns true if
         *   - ermrest supports tcrs, and
         *   - table has dynamic acls, and
         *   - table has RID column, and
         *   - table is not marked non-updatable by annotation
         * @type {Boolean}
         */
        get canUseTCRS() {
            if (this._canUseTCRS === undefined) {
                var rightKey = _ERMrestFeatures.TABLE_COL_RIGHTS_SUMMARY;
                this._canUseTCRS = (this.table.schema.catalog.features[rightKey] === true) &&
                                  this.table.rights[_ERMrestACLs.UPDATE] == null &&
                                  this.table.columns.has("RID") &&
                                  this.canUpdate;
            }
            return this._canUseTCRS;
        },

        /**
         * This is a private funtion that checks the user permissions for modifying the affiliated entity, record or table
         * Sets a property on the reference object used by canCreate/canUpdate/canDelete
         * @memberof ERMrest
         * @private
         */
        checkPermissions: function (permission) {
            // Return true if permission is null
            if (this._table.rights[permission] === null) return true;
            return this._table.rights[permission];
         },

        /**
         * Creates a set of tuples in the references relation. Note, this
         * operation sets the `defaults` list according to the table
         * specification, and not according to the contents of in the input
         * tuple.
         * @param {!Array} data The array of data to be created as new tuples.
         * @param {Object} contextHeaderParams the object that we want to log.
         * @param {Boolean} skipOnConflict if true, it will not complain about conflict
         * @returns {Promise} A promise resolved with a object containing `successful` and `failure` attributes.
         * Both are {@link ERMrest.Page} of results.
         * or rejected with any of the following errors:
         * - {@link ERMrest.InvalidInputError}: If `data` is not valid, or reference is not in `entry/create` context.
         * - {@link ERMrest.InvalidInputError}: If `limit` is invalid.
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        create: function(data, contextHeaderParams, skipOnConflict) {
            var self = this;
            try {
                //  verify: data is not null, data has non empty tuple set
                verify(data, "'data' must be specified");
                verify(data.length > 0, "'data' must have at least one row to create");
                verify(self._context === _contexts.CREATE, "reference must be in 'entry/create' context.");

                var defer = ConfigService.q.defer();

                //  get the defaults list for the referenced relation's table
                var defaults = getDefaults();

                // construct the uri
                var uri = this._location.ermrestCompactUri;
                for (var i = 0; i < defaults.length; i++) {
                    uri += (i === 0 ? "?defaults=" : ',') + fixedEncodeURIComponent(defaults[i]);
                }
                if (skipOnConflict) {
                    var qCharaceter = defaults.length > 0 ? "&" : "?";
                    uri += qCharaceter + "onconflict=skip";
                }

                if (isObject(contextHeaderParams) && Array.isArray(contextHeaderParams.stack)) {
                    var stack = contextHeaderParams.stack;
                    stack[stack.length-1].num_created = data.length;
                }
                // create the context header params for log
                else if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "create"};
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams, data.length)
                };

                //  do the 'post' call
                this._server.http.post(uri, data, config).then(function(response) {
                    var etag = HTTPService.getResponseHeader(response).etag;
                    //  new page will have a new reference (uri that filters on a disjunction of ids of these tuples)
                    var uri = self._location.compactUri + '/',
                        keyName;

                    // loop through each returned Row and get the key value
                    for (var j = 0; j < response.data.length; j++) {
                        if (j !== 0)
                            uri += ';';
                        // shortest key is made up from one column
                        if (self._shortestKey.length == 1) {
                            keyName = self._shortestKey[0].name;
                            uri += fixedEncodeURIComponent(keyName) + '=' + fixedEncodeURIComponent(response.data[j][keyName]);
                        } else {
                            uri += '(';
                            for (var k = 0; k < self._shortestKey.length; k++) {
                                if (k !== 0)
                                    uri += '&';
                                keyName = self._shortestKey[k].name;
                                uri += fixedEncodeURIComponent(keyName) + '=' + fixedEncodeURIComponent(response.data[j][keyName]);
                            }
                            uri += ')';
                        }
                    }

                    var ref = new Reference(parse(uri), self._table.schema.catalog);
                    ref = (response.data.length > 1 ? ref.contextualize.compactEntry : ref.contextualize.compact);
                    //  make a page of tuples of the results (unless error)
                    var page = new Page(ref, etag, response.data, false, false);

                    //  resolve the promise, passing back the page
                    return defer.resolve({
                      "successful": page,
                      "failed": null,
                      "disabled": null
                    });
                }).catch(function (error) {
                    return defer.reject(ErrorService.responseToError(error, self));
                });

                return defer.promise;
            }
            catch (e) {
                return ConfigService.q.reject(e);
            }

            // return the columns that we should add to the defaults list
            function getDefaults() {
                var defaults = [];
                self.table.columns.all().forEach(function (col) {

                    // ignore the columns that user doesn't have insert access for.
                    // This is to avoid ermrest from throwing any errors.
                    //
                    // NOTE At first we were ignoring any disabled inputs.
                    // While ignoring value for disabeld inputs might sound logical,
                    // there are some disabled inputs that chaise is actually going to generate
                    // value for and we need to store them. At the time of writing this comment,
                    // this is only true for the asset's filename, md5, etc. columns.
                    // In most deployments they are marked as generated and the expectation
                    // would be that chaise/ermrestjs should generate the value.
                    // The misconception here is the generated definition in the annotation.
                    // by generated we mean chaise/ERMrestjs generated not necessarily database generated.
                    // the issue: https://github.com/informatics-isi-edu/ermrestjs/issues/722
                    if (col.rights.insert === false) {
                        defaults.push(col.name);
                        return;
                    }

                    // if default is null, don't add it.
                    // this is just to reduce the size of defaults. adding them
                    // is harmless but it's not necessary. so we're just not going
                    // to add them to make the default list shorter
                    // NOTE we added nullok check because of a special case that we found.
                    // In this case the column was not-null, no default value, and the value
                    // was being populated by trigger. So we have to add the column to the default
                    // list so ermrest doesn't throw the error.
                    // if a column is not-null, we need to actually check for the value. if the value
                    // is null, not adding it to the default list will always result in ermrest error.
                    // But adding it to the default list might succeed (if the column has trigger for value)
                    if (col.ermrestDefault == null && col.nullok) return;

                    // add columns that their value is missing in all the rows
                    var missing = true;
                    for (var i = 0; i < data.length; i++) {
                        // at least one of the rows has value for it
                        if (data[i][col.name] !== undefined && data[i][col.name] !== null) {
                            missing = false;
                            break;
                        }
                    }
                    if (missing) defaults.push(col.name);
                });

                return defaults;
            }
        },

        /**
         * Reads the referenced resources and returns a promise for a page of
         * tuples. The `limit` parameter is required and must be a positive
         * integer. The page of tuples returned will be described by the
         * {@link ERMrest.Reference#columns} array of column definitions.
         *
         * Usage:
         * ```
         * // assumes the client holds a reference
         * reference.read(10).then(
         *   function(page) {
         *     // we now have a page of tuples
         *     ...
         *   },
         *   function(error) {
         *     // an error occurred
         *     ...
         *   });
         * ```
         *
         * @param {!number} limit The limit of results to be returned by the
         * read request. __required__
         * @param {Object} contextHeaderParams the object that we want to log.
         * @param {Boolean} useEntity whether we should use entity api or not (if true, we won't get foreignkey data)
         * @param {Boolean} dontCorrectPage whether we should modify the page.
         * If there's a @before in url and the number of results is less than the
         * given limit, we will remove the @before and run the read again. Setting
         * dontCorrectPage to true, will not do this extra check.
         * @param {Boolean} getTRS whether we should fetch the table-level row acls (if table supports it)
         * @param {Boolean} getTCRS whether we should fetch the table-level and column-level row acls (if table supports it)
         * @param {Boolean} getUnlinkTRS whether we should fetch the acls of association
         *                  table. Use this only if the association is based on facet syntax
         *
         * NOTE setting useEntity to true, will ignore any sort that is based on
         * pseduo-columns.
         * TODO we might want to chagne the above statement, so useEntity can
         * be used more generally.
         *
         * NOTE getUnlinkTRS can only be used on related references that are generated
         * after calling `generateRelatedReference` or `generateActiveList` with the main
         * tuple data. As part of generating related references, if the main tuple is available
         * we will use a facet filter and the alias is added in there. Without the main tuple,
         * the alias is not added to the path and therefore `getUnlinkTRS` cannot be used.
         * TODO this is a bit hacky and should be refactored
         *
         * @returns {Promise} A promise resolved with {@link ERMrest.Page} of results,
         * or rejected with any of these errors:
         * - {@link ERMrest.InvalidInputError}: If `limit` is invalid.
         * - {@link ERMrest.BadRequestError}: If asks for sorting based on columns that are not sortable.
         * - {@link ERMrest.NotFoundError}: If asks for sorting based on columns that are not valid.
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        read: function(limit, contextHeaderParams, useEntity, dontCorrectPage, getTRS, getTCRS, getUnlinkTRS) {
            var defer = ConfigService.q.defer(), self = this;

            try {

                // if this reference came from a tuple, use tuple object's data
                if (this._tuple) {
                    var page = new Page(this, this._tuple.page._etag, this._tuple.data, false, false);
                    defer.resolve(page);
                    return defer.promise;
                }

                verify(limit, "'limit' must be specified");
                verify(typeof(limit) == 'number', "'limit' must be a number");
                verify(limit > 0, "'limit' must be greater than 0");

                if (!isStringAndNotEmpty(self._context)) {
                    $log.warn('Uncontextualized Reference usage detected. For more consistent behavior always contextualize Reference objects.');
                }

                var uri = [this._location.service, "catalog", this._location.catalog].join("/");
                var readPath = this._getReadPath(useEntity, getTRS, getTCRS, getUnlinkTRS);
                if (readPath.isAttributeGroup) {
                    uri += "/attributegroup/" + readPath.value;
                } else {
                    uri += "/entity/" + readPath.value;
                }
                // add limit
                uri = uri + "?limit=" + (limit + 1); // read extra row, for determining whether the returned page has next/previous page

                // attach `this` (Reference) to a variable
                // `this` inside the Promise request is a Window object
                var ownReference = this, action = "read";
                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {action: action};
                } else if (typeof contextHeaderParams.action === "string") {
                    action = contextHeaderParams.action;
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams, limit)
                };
                this._server.http.get(uri, config).then(function (response) {
                    if (!Array.isArray(response.data)) {
                        throw new InvalidServerResponse(uri, response.data, action);
                    }

                    var etag = HTTPService.getResponseHeader(response).etag;

                    var hasPrevious, hasNext = false;
                    if (!ownReference._location.paging) { // first page
                        hasPrevious = false;
                        hasNext = (response.data.length > limit);
                    } else if (ownReference._location.beforeObject) { // has @before()
                        hasPrevious = (response.data.length > limit);
                        hasNext = true;
                    } else { // has @after()
                        hasPrevious = true;
                        hasNext = (response.data.length > limit);
                    }

                    // Because read() reads one extra row to determine whether the new page has previous or next
                    // We need to remove those extra row of data from the result
                    var extraData = {};
                    if (response.data.length > limit) {
                        // if no paging or @after, remove last row
                        if (!ownReference._location.beforeObject) {
                            extraData = response.data[response.data.length-1];
                            response.data.splice(response.data.length-1);
                        } else { // @before, remove first row
                            extraData = response.data[0];
                            response.data.splice(0, 1);
                        }
                    }
                    var page = new Page(ownReference, etag, response.data, hasPrevious, hasNext, extraData);

                    // we are paging based on @before (user navigated backwards in the set of data)
                    // AND there is less data than limit implies (beginning of set) OR we got the right set of data (tuples.length == pageLimit) but there's no previous set (beginning of set)
                    if (dontCorrectPage !== true && !ownReference.location.afterObject && ownReference.location.beforeObject && (page.tuples.length < limit || !page.hasPrevious) ) {
                        var referenceWithoutPaging = _referenceCopy(ownReference);
                        referenceWithoutPaging.location.beforeObject = null;

                        // remove the function and replace it with auto-reload
                        var actionVerb = action.substring(action.lastIndexOf(";")+1),
                            newActionVerb = "auto-reload";

                        // TODO (could be optimized)
                        if (["load-domain", "reload-domain"].indexOf(actionVerb) !== -1) {
                            newActionVerb = "auto-reload-domain";
                        }
                        contextHeaderParams.action = action.substring(0,action.lastIndexOf(";")+1) + newActionVerb;
                        return referenceWithoutPaging.read(limit, contextHeaderParams, useEntity, true);
                    } else {
                        return page;
                    }
                }).then(function (resPage) {
                    defer.resolve(resPage);
                }).catch(function (e) {
                    defer.reject(ErrorService.responseToError(e));
                });
            } catch (e) {
                defer.reject(e);
            }

            return defer.promise;
        },

        /**
         * Return a new Reference with the new sorting
         * TODO this should validate the given sort objects,
         * but I'm not sure how much adding that validation will affect other apis and client
         *
         * @param {Object[]} sort an array of objects in the format
         * {"column":columname, "descending":true|false}
         * in order of priority. Undfined, null or Empty array to use default sorting.
         *
         * @returns {Reference} A new reference with the new sorting
         *
         * @throws {@link ERMrest.InvalidInputError} if `sort` is invalid.
         */
        sort: function(sort) {
            if (sort) {
                verify((sort instanceof Array), "input should be an array");
                verify(sort.every(_isValidSortElement), "invalid arguments in array");

            }

            // make a Reference copy
            var newReference = _referenceCopy(this);


            newReference._location = this._location._clone(newReference);
            newReference._location.sortObject = sort;
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;

            // if facet columns are already computed, just update them.
            // if we don't do this here, then facet columns will recomputed after each sort
            // TODO can be refactored
            if (this._facetColumns !== undefined) {
                newReference._facetColumns = [];
                this.facetColumns.forEach(function (fc) {
                    newReference._facetColumns.push(
                        new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, fc.filters.slice())
                    );
                });
            }

            return newReference;
        },

        /**
         * Updates a set of resources.
         * @param {Array} tuples array of tuple objects so that the new data nd old data can be used to determine key changes.
         * tuple.data has the new data
         * tuple._oldData has the data before changes were made
         * @param {Object} contextHeaderParams the object that we want to log.
         * @returns {Promise} A promise resolved with a object containing:
         *  -  `successful`: {@link ERMrest.Page} of results that were stored.
         *  -  `failed`: {@link ERMrest.Page} of results that failed to be stored.
         *  -  `disabled`: {@link ERMrest.Page} of results that were not sent to ermrest (because of acl)
         * or rejected with any of these errors:
         * - {@link ERMrest.InvalidInputError}: If `limit` is invalid or reference is not in `entry/edit` context.
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        update: function(tuples, contextHeaderParams) {
            try {
                verify(Array.isArray(tuples), "'tuples' must be specified");

                // store the ones that cannot be updated and filter them out
                // from the tuples list that we use to generate the update request
                var disabledPageData = [];
                tuples = tuples.filter(function (t) {
                    if (!t.canUpdate) {
                        disabledPageData.push(t.data);
                    }
                    return t.canUpdate;
                });

                verify(tuples.length > 0, "'tuples' must have at least one row to update");
                verify(this._context === _contexts.EDIT, "reference must be in 'entry/edit' context.");

                var defer = ConfigService.q.defer();

                var urlEncode = fixedEncodeURIComponent;

                var self = this,
                    oldAlias = "_o",
                    newAlias = "_n",
                    uri = this._location.service + "/catalog/" + this.table.schema.catalog.id + "/attributegroup/" + urlEncode(this.table.schema.name) + ':' + urlEncode(this.table.name) + '/';

                var submissionData = [],        // the list of submission data for updating
                    columnProjections = [],     // the list of column names to use in the uri projection list
                    shortestKeyNames = [],      // list of shortest key names to use in the uri key list
                    keyWasModified = false,
                    assetColumns,
                    tuple, oldData, allOldData = [], newData, allNewData = [], keyName;

                // for loop variables, NOTE: maybe we should name these better
                var i, j, k, m, n, t;

                var column, keyColumns, referenceColumn;

                // add column name into list of column projections if not in column projections set and data has changed
                var addProjection = function(colName, colType) {
                    // don't add a column name in if it's already there
                    // this can be the case for multi-edit
                    // and if the data is unchanged, no need to add the column name to the projections list
                    if (columnProjections.indexOf(colName) !== -1) return;

                    var oldVal = oldData[colName];
                    var newVal = newData[colName];

                    var typename = colType.rootName;
                    var compareWithMoment = typename === 'date' || typename === 'timestamp' || typename === 'timestamptz';
                    // test with moment if datetime column type and one of the 2 values are defined
                    // NOTE: moment will test 2 null values as different even though they are both null
                    if (compareWithMoment && (oldVal || newVal)) {

                        var oldMoment = moment(oldData[colName]);
                        var newMoment = moment(newData[colName]);

                        if (!oldMoment.isSame(newMoment)) {
                            columnProjections.push(colName);
                        }
                    } else if (oldData[colName] != newData[colName]) {
                        columnProjections.push(colName);
                    }
                };

                var addProjectionForColumnObject = function (column) {
                    // If columns is a pusedo column
                    if (column.isPseudo) {
                        // If a column is an asset column then set values for
                        // dependent properties like filename, bytes_count_column, md5 and sha
                        if (column.isAsset) {
                            var isNull = newData[column.name] === null ? true : false;

                            /* Populate all values in row depending on column from current asset */
                            assetColumns = [column.filenameColumn, column.byteCountColumn, column.md5, column.sha256];
                            for (var colIndex = 0; colIndex < assetColumns.length; colIndex++) {
                                // some metadata columns might not be defined.
                                if (assetColumns[colIndex]) {
                                    // If asset url is null then set the metadata also null
                                    if (isNull) newData[assetColumns[colIndex].name] = null;
                                    addProjection(assetColumns[colIndex].name, assetColumns[colIndex].type);
                                }
                            }

                            addProjection(column.name, column.type);

                        } else {
                            keyColumns = [];

                            if (column.isKey) {
                                keyColumns = column.key.colset.columns;
                            } else if (column.isForeignKey) {
                                keyColumns =  column.foreignKey.colset.columns;
                            }

                            for (n = 0; n < keyColumns.length; n++) {
                                addProjection(keyColumns[n].name, keyColumns[n].type);
                            }
                        }
                    } else {
                        addProjection(column.name, column.type);
                    }
                };

                // add data into submission data if in column projection set
                var addSubmissionData = function(index, colName) {
                    // if the column is in the column projections list, add the data to submission data
                    if (columnProjections.indexOf(colName) > -1) {
                        submissionData[index][colName + newAlias] = newData[colName];
                    }
                };

                var addSubmissionDataForColumnObject = function (index, column) {
                    // If columns is a pusedo column
                    if (column.isPseudo) {
                        // If a column is an asset column then set values for
                        // dependent properties like filename, bytes_count_column, md5 and sha
                        if (column.isAsset) {
                            /* Populate all values in row depending on column from current asset */
                            assetColumns = [column.filenameColumn, column.byteCountColumn, column.md5, column.sha256];
                            for (var colIndex2 = 0; colIndex2 < assetColumns.length; colIndex2++) {
                                // some metadata columns might not be defined.
                                if (assetColumns[colIndex2]) addSubmissionData(i, assetColumns[colIndex2].name);
                            }

                            addSubmissionData(i, column.name);

                        } else {
                            keyColumns = [];

                            if (column.isKey) {
                                keyColumns = column.key.colset.columns;
                            } else if (column.isForeignKey) {
                                keyColumns =  column.foreignKey.colset.columns;
                            }

                            for (n = 0; n < keyColumns.length; n++) {
                                addSubmissionData(i, keyColumns[n].name);
                            }
                        }
                    } else {
                        addSubmissionData(i, column.name);
                    }
                };

                // gets the key value based on which way the key was aliased.
                // use the new alias value for the shortest key first meaning the key was changed
                // if the new alias value is null, key wasn't changed so we can use the old alias
                var getAliasedKeyVal = function(responseRowData, keyName) {
                    var isNotDefined = responseRowData[keyName + newAlias] === null || responseRowData[keyName + newAlias] === undefined;
                    return (isNotDefined ? responseRowData[keyName + oldAlias] : responseRowData[keyName + newAlias] );
                };

                shortestKeyNames = this._shortestKey.map(function (column) {
                    return column.name;
                });

                // loop through each tuple and the visible columns list for each to determine what columns to add to the projection set
                // If a column is changed in one tuple but not another, that column's value for every tuple needs to be present in the submission data
                for (i = 0; i < tuples.length; i++) {

                    newData = tuples[i].data;
                    oldData = tuples[i]._oldData;

                    // Collect all old and new data from all tuples to use in the event of a 412 error later
                    allOldData.push(oldData);
                    allNewData.push(newData);

                    // Loop throught the visible columns list and see what data the user changed
                    // if we saw changes to data, add the constituent columns to the projections list
                    for (m = 0; m < this.columns.length; m++) {
                        column = this.columns[m];

                        // if the column is disabled (generated or immutable), no need to add the column name to the projections list
                        if (column.inputDisabled) {
                            continue;
                        }

                        // if column cannot be updated, no need to add the column to the projection list
                        if (!tuples[i].canUpdateValues[m]) {
                            continue;
                        }

                        if (column.isInputIframe) {
                            addProjectionForColumnObject(column);
                            // make sure the columns in the input_iframe column mapping are also added to the projection list
                            for (var colIndex3 = 0; colIndex3 < column.inputIframeProps.columns.length; colIndex3++) {
                                addProjectionForColumnObject(column.inputIframeProps.columns[colIndex3]);
                            }
                        } else {
                            addProjectionForColumnObject(column);
                        }
                    }
                }

                if (columnProjections.length < 1) {
                    throw new NoDataChangedError("No data was changed in the update request. Please check the form content and resubmit the data.");
                }

                /* This loop manages adding the values based on the columnProjections set and setting columns associated with asset columns properly */
                // loop through each tuple again and set the data value from the tuple in submission data for each column projection
                for (i = 0; i < tuples.length; i++) {
                    newData = tuples[i].data;
                    oldData = tuples[i]._oldData;

                    submissionData[i] = {};

                    for (var keyIndex = 0; keyIndex < shortestKeyNames.length; keyIndex++) {
                        var shortestKey = shortestKeyNames[keyIndex];

                        // shortest key should always be aliased in case that key value was changed
                        // use a suffix of '_o' to represent the old value for the shortest key everything else gets '_n'
                        submissionData[i][shortestKey + oldAlias] = oldData[shortestKey];
                    }

                    // Loop through the columns, check if it;s in columnProjections, and collect the necessary data for submission
                    for (m = 0; m < this.columns.length; m++) {
                        column = this.columns[m];

                        // if the column is disabled (generated or immutable), skip it
                        if (column.inputDisabled) {
                            continue;
                        }

                        // if column cannot be updated for this tuple, skip it
                        if (!tuples[i].canUpdateValues[m]) {
                            continue;
                        }

                        if (column.isInputIframe) {
                            addSubmissionDataForColumnObject(i, column);
                            // make sure the values for columns in the input_iframe column mapping are also added
                            for (var colIndex = 0; colIndex < column.inputIframeProps.columns.length; colIndex++) {
                                addSubmissionDataForColumnObject(i, column.inputIframeProps.columns[colIndex]);
                            }
                        } else {
                            addSubmissionDataForColumnObject(i, column);
                        }

                    }
                }

                // always alias the keyset for the key data
                for (j = 0; j < shortestKeyNames.length; j++) {
                    if (j !== 0) uri += ',';
                    // alias all the columns for the key set
                    uri += fixedEncodeURIComponent(shortestKeyNames[j]) + oldAlias + ":=" + fixedEncodeURIComponent(shortestKeyNames[j]);
                }

                // the keyset is always aliased with the old alias, so make sure to include the new alias in the column projections
                for (k = 0; k < columnProjections.length; k++) {
                    // Important NOTE: separator for denoting where the keyset ends and the update column set begins. The shortest key is used as the keyset
                    uri += (k === 0 ? ';' : ',');
                    // alias all the columns for the key set
                    uri += fixedEncodeURIComponent(columnProjections[k]) + newAlias + ":=" + fixedEncodeURIComponent(columnProjections[k]);
                }

                /**
                 * We are going to add the following to the last element of stack in the logs:
                 * {
                 *   "num_updated": "number of updated rows"
                 *   "updated_keys": "the summary of what's updated"
                 * }
                 */
                if (isObject(contextHeaderParams) && Array.isArray(contextHeaderParams.stack)) {
                    var stack = contextHeaderParams.stack, numUpdated = submissionData.length;
                    stack[stack.length-1].num_updated = numUpdated;

                    stack[stack.length-1].updated_keys = {
                        cols: shortestKeyNames,
                        vals: allNewData.map(function (d) {
                            return shortestKeyNames.map(function (kname) {
                                return d[kname];
                            });
                        })
                    };
                } else if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "update"};
                }

                var config = {
                    headers: this._generateContextHeader(contextHeaderParams, submissionData.length)
                };
                this._server.http.put(uri, submissionData, config).then(function updateReference(response) {
                    // Some data was not updated
                    if (response.status === 200 && response.data.length < submissionData.length) {
                        var updatedRows = response.data;
                        // no data updated
                        if (updatedRows.length === 0) {
                            throw new ForbiddenError(403, "Editing records for table: " + self.table.name + " is not allowed.");
                        }
                    }

                    var etag = HTTPService.getResponseHeader(response).etag;
                    var pageData = [];

                    // loop through each returned Row and get the key value
                    for (j = 0; j < response.data.length; j++) {
                        // response.data is sometimes in a different order
                        // so collecting the data could be incorrect if we don't make sure the response data and tuple data are in the same order
                        // the entity is updated properly just the data returned from this request is in a different order sometimes
                        var shortKey,
                            rowIndexInSubData = -1;

                        for (t = 0; t < tuples.length && rowIndexInSubData === -1; t++) {
                            // used to verify the number of matches for each shortest key value
                            var matchCt = 0;
                            for (n = 0; n < shortestKeyNames.length; n++) {
                                shortKey = shortestKeyNames[n];
                                var responseVal = getAliasedKeyVal(response.data[j], shortKey);

                                // if the value is the same, use this t index for the pageData object
                                if (tuples[t].data[shortKey] == responseVal) {
                                    // this comes into play when the shortest key is a set of column names
                                    // if the values match increase te counter
                                    matchCt++;
                                }
                            }
                            // if our counter is the same length as the list of shortest key names, it's an exact match to the t tuple
                            if (matchCt == shortestKeyNames.length) {
                                rowIndexInSubData = t;
                            }
                        }


                        pageData[rowIndexInSubData] = {};

                        // unalias the keys for the page data
                        var responseColumns = Object.keys(response.data[j]);

                        for (var m = 0; m < responseColumns.length; m++) {
                            var columnAlias = responseColumns[m];
                            if (columnAlias.endsWith(newAlias)) {
                                // alias is always at end and length 2
                                var columnName = columnAlias.slice(0, columnAlias.length-newAlias.length);
                                pageData[rowIndexInSubData][columnName] = response.data[j][columnAlias];
                            }
                        }
                    }

                    // NOTE: ermrest returns only some of the column data.
                    // make sure that pageData has all the submitted and updated data
                    for (i = 0; i < tuples.length; i++) {
                        for (j in tuples[i]._oldData) {
                            if (!Object.prototype.hasOwnProperty.call(tuples[i]._oldData, j)) continue;
                            if (j in pageData[i]) continue; // pageData already has this data
                            pageData[i][j] =tuples[i]._oldData[j]; // add the missing data
                        }
                    }

                    // build the url using the helper function
                    var schemaTable = urlEncode(self.table.schema.name) + ':' + urlEncode(self.table.name);
                    var uri = self._location.service + "/catalog/" + self.table.schema.catalog.id + "/entity/" + schemaTable;
                    var keyValueRes = generateKeyValueFilters(
                        self.table.shortestKey,
                        pageData,
                        self.table.schema.catalog,
                        -1 // we don't want to check the url length here, chaise will check it
                    );
                    // NOTE this will not happen since ermrest only accepts not-null keys,
                    // but added here for completeness
                    if (!keyValueRes.successful) {
                        var err = new InvalidInputError(keyValueRes.message);
                        return defer.reject(err), defer.promise;
                    }
                    uri += '/' + keyValueRes.filters.map(function (f) { return f.path; }).join('/');

                    var ref = new Reference(parse(uri), self._table.schema.catalog).contextualize.compactEntry;
                    ref = (response.data.length > 1 ? ref.contextualize.compactEntry : ref.contextualize.compact);
                    var successfulPage = new Page(ref, etag, pageData, false, false);
                    var failedPage = null, disabledPage = null;


                    // if the returned page is smaller than the initial page,
                    // then some of the columns failed to update.
                    if (tuples.length > successfulPage.tuples.length) {
                        var failedPageData = [], keyMatch, rowMatch;

                        for (i = 0; i < tuples.length; i++) {
                            rowMatch = false;

                            for (j = 0; j < successfulPage.tuples.length; j++) {
                                keyMatch = true;

                                for (k = 0; k < shortestKeyNames.length; k++) {
                                    keyName = shortestKeyNames[k];
                                    if (tuples[i].data[keyName] === successfulPage.tuples[j].data[keyName]) {
                                        // these keys don't match, go for the next tuple
                                        keyMatch = false;
                                        break;
                                    }
                                }

                                if (keyMatch) {
                                    // all the key columns match, then rows match.
                                    rowMatch = true;
                                    break;
                                }
                            }

                            if (!rowMatch) {
                                // didn't find a match, so add as failed
                                failedPageData.push(tuples[i].data);
                            }
                        }
                        failedPage = new Page(ref, etag, failedPageData, false, false);
                    }

                    if (disabledPageData.length > 0) {
                        disabledPage = new Page(ref, etag, disabledPageData, false, false);
                    }

                    defer.resolve({
                        "successful": successfulPage,
                        "failed": failedPage,
                        "disabled": disabledPage
                    });
                }).catch(function (error) {
                    return defer.reject(ErrorService.responseToError(error, self));
                });

                return defer.promise;
            }
            catch (e) {
                return ConfigService.q.reject(e);
            }
        },

        /**
         * Deletes the referenced resources or the given tuples.
         * NOTE This will ignore the provided sort and paging on the reference, make
         * sure you are calling this on specific set or rows (filtered).
         *
         * @param {Tuple[]?} tuples (optional) the tuples that should be deleted
         * @param {Object?} contextHeaderParams (optional) the object that we want to log.
         * @returns {Promise} A promise resolved with empty object or rejected with any of these errors:
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        delete: function(tuples, contextHeaderParams) {
            var defer = ConfigService.q.defer(), self = this, delFlag = _operationsFlag.DELETE;

            /**
             * NOTE: previous implemenation of delete with 412 logic is here:
             * https://github.com/informatics-isi-edu/ermrestjs/commit/5fe854118337e0a63c6f91b4f3e139e7eadc42ac
             *
             * We decided to drop the support for 412, because the etag that we get from the read function
             * is different than the one delete expects. The reason for that is because we are getting etag
             * in read with joins in the request, which affects the etag. etag is in response to any change
             * to the returned data and since join introduces extra data it is different than a request
             * without any joins.
             *
             * github issue: #425
             */
            try {
                var useTuples = Array.isArray(tuples) && tuples.length > 0;
                /**
                 * We are going to add the following to the last element of stack in the logs:
                 * {
                 *   "num_deleted": "number of deleted rows"
                 *   "deleted_keys": "the summary of what's deleted"
                 * }
                 */
                 if (isObject(contextHeaderParams) && Array.isArray(contextHeaderParams.stack) && useTuples) {
                    var stack = contextHeaderParams.stack;
                    var shortestKeyNames = self._shortestKey.map(function (column) {
                        return column.name;
                    });
                    stack[stack.length-1].num_deleted = tuples.length;
                    stack[stack.length-1].deleted_keys = {
                        cols: shortestKeyNames,
                        vals: tuples.map(function (t) {
                            return shortestKeyNames.map(function (kname) {
                                return t.data[kname];
                            });
                        })
                    };
                } else if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "delete"};
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams)
                };

                if (!useTuples) {
                    // delete the reference
                    this._server.http.delete(self.location.ermrestCompactUri, config).then(function () {
                        defer.resolve();
                    }).catch(function (catchError) {
                        defer.reject(ErrorService.responseToError(catchError, self, delFlag));
                    });
                } else {
                    // construct the url based on the given tuples
                    var successTupleData = [], failedTupleData = [], deleteSubmessage = [];

                    var encode = fixedEncodeURIComponent;
                    var schemaTable = encode(self.table.schema.name) + ':' + encode(self.table.name);

                    var deletableData = [], nonDeletableTuples = [];
                    tuples.forEach(function (t, index) {
                        if (t.canDelete) {
                            deletableData.push(t.data);
                        } else {
                            failedTupleData.push(t.data);
                            nonDeletableTuples.push('- Record number ' + (index + 1) + ": " + t.displayname.value);
                        }
                    });

                    if (nonDeletableTuples.length > 0) {
                        deleteSubmessage.push('The following records could not be deleted based on your permissions:\n' + nonDeletableTuples.join('\n'));
                    }

                    // if none of the rows could be deleted, just return now.
                    if (deletableData.length === 0) {
                        defer.resolve(new BatchDeleteResponse(successTupleData, failedTupleData, deleteSubmessage.join("\n")));
                        return defer.promise;
                    }

                    // might throw an error
                    var keyValueRes = generateKeyValueFilters(
                        self.table.shortestKey,
                        deletableData,
                        self.table.schema.catalog,
                        schemaTable.length + 1,
                        self.displayname.value
                    );
                    if (!keyValueRes.successful) {
                        var err = new InvalidInputError(keyValueRes.message);
                        return defer.reject(err), defer.promise;
                    }

                    var recursiveDelete = function (index) {
                        var currFilter = keyValueRes.filters[index];
                        var url = [self.location.service, "catalog", self.location.catalog, "entity", schemaTable, currFilter.path].join("/");

                        self._server.http.delete(url, config).then(function () {
                            successTupleData =  successTupleData.concat(currFilter.keyData);
                        }).catch(function (err) {
                            failedTupleData = failedTupleData.concat(currFilter.keyData);
                            deleteSubmessage.push(ErrorService.responseToError(err, self, delFlag).message);
                        }).finally(function () {
                            if (index < keyValueRes.filters.length-1) {
                                recursiveDelete(index+1);
                            } else {
                                defer.resolve(new BatchDeleteResponse(successTupleData, failedTupleData, deleteSubmessage.join("\n")));
                            }
                        });
                    };

                    recursiveDelete(0);
                }
            }
            catch (e) {
                defer.reject(e);
            }

            return defer.promise;
        },

        /**
         * If the current reference is derived from an association related table and filtered, this
         * function will delete the set of tuples included and return a set of success responses and
         * a set of errors for the corresponding delete actions for the provided entity set from the
         * corresponding association table denoted by the list of tuples.
         *
         * For example, assume
         * Table1(K1,C1) <- AssociationTable(FK1, FK2) -> Table2(K2,C2)
         * and the current tuples are from Table2 with k2 = "2" and k2 = "3".
         * With origFKRData = {"k1": "1"} this function will return a set of success and error responses for
         * delete requests to AssociationTable with FK1 = "1" as a part of the path and FK2 = "2" and FK2 = "3"
         * as the filters that define the set and how they are related to Table1.
         *
         * To make sure a deletion occurs only for the tuples specified, we need to verify each reference path that
         * is created includes a parent constraint and has one or more filters based on the other side of the association
         * table's uniqueness constraint. Some more information about the validations that need to occur based on the above example:
         *  - parent value has to be not null
         *    - FK1 has to have a not null constraint
         *  - child values have to have at least 1 value and all not null
         *    - for FK2, all selected values are not null
         *
         * @param {Array} mainTuple - an ERMrest.Tuple from Table1 (from example above)
         * @param {Array} tuples - an array of ERMrest.Tuple objects from Table2 (same as self) (from example above)
         * @param {Object} contextHeaderParams the object that we want to log.
         *
         * @returns {Object} an ERMrest.BatchUnlinkResponse "error" object
         **/
        deleteBatchAssociationTuples: function (parentTuple, tuples, contextHeaderParams) {
            var self = this, defer = ConfigService.q.defer();
            try {
                verify(parentTuple, "'parentTuple' must be specified");
                verify(tuples, "'tuples' must be specified");
                verify(tuples.length > 0, "'tuples' must have at least one row to delete");
                // Can occur using an unfiltered reference
                verify(self.derivedAssociationReference, "The current reference ('self') must have a derived association reference defined");

                var encode = fixedEncodeURIComponent;
                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "delete"};
                }
                var config = {
                    headers: self._generateContextHeader(contextHeaderParams)
                };

                var successTupleData = [], failedTupleData = [], deleteSubmessage = [];
                var associationRef = self.derivedAssociationReference;
                var mainKeyCol = associationRef.origFKR.colset.columns[0];

                // the path starting from association table, with filters based on the fk to the main table
                var compactPath = encode(associationRef.table.schema.name) + ':' + encode(associationRef.table.name) + '/';
                compactPath += encode(mainKeyCol.name) + '=' + encode(parentTuple.data[associationRef.origFKR.mapping.get(mainKeyCol).name]) + '&';

                // keyColumns should be a set of columns that are unique and not-null
                // columns tells us what the key column names are in the fkr "_to" relationship
                var keyColumns = associationRef.associationToRelatedFKR.colset.columns;
                // mapping tells us what the column name is on the leaf tuple, so we know what data to fetch from each tuple for identifying
                var mapping = associationRef.associationToRelatedFKR.mapping;

                // add the filters based on the fk to the related table
                var keyFromAssocToRelatedData = tuples.map(function (t) {
                    var res = {};
                    keyColumns.forEach(function (col) {
                        res[col.name] = t.data[mapping.get(col).name];
                    });
                    return res;
                });
                var keyValueRes = generateKeyValueFilters(
                    keyColumns,
                    keyFromAssocToRelatedData,
                    associationRef.table.schema.catalog,
                    compactPath.length + 1, // 1 is for added `/` between filter and compactPath
                    associationRef.displayname.value
                );
                if (!keyValueRes.successful) {
                    var err = new InvalidInputError(keyValueRes.message);
                    return defer.reject(err), defer.promise;
                }

                // send the requests one at a time
                var recursiveDelete = function (index) {
                    var currFilter = keyValueRes.filters[index];
                    var url = [
                        associationRef.location.service, "catalog", associationRef.location.catalog, "entity",
                        compactPath + currFilter.path
                    ].join("/");

                    self._server.http.delete(url, config).then(function () {
                        successTupleData =  successTupleData.concat(currFilter.keyData);
                    }).catch(function (err) {
                        failedTupleData = failedTupleData.concat(currFilter.keyData);
                        deleteSubmessage.push(err.data);
                    }).finally(function () {
                        if (index < keyValueRes.filters.length-1) {
                            recursiveDelete(index+1);
                        } else {
                            defer.resolve(new BatchUnlinkResponse(successTupleData, failedTupleData, deleteSubmessage.join("\n")));
                        }
                    });
                };

                recursiveDelete(0);
            } catch (e) {
                defer.reject(e);
            }

            return defer.promise;
        },

        /**
         * An object which contains row display properties for this reference.
         * It is determined based on the `table-display`, `display`, and 'chaise-config' annotations. It has the
         * following properties:
         *
         *   - `rowOrder`: `[{ column: '`_column object_`', descending:` {`true` | `false` } `}`...`]` or `undefined`,
         *   - `type`: {`'table'` | `'markdown'` | `'module'`} (default: `'table'`)
         *   - `showFaceting`: A boolean indicating whether we should show the faceting feature or not.
         *   - `maxFacetDepth`: A number indicating the facet depth.
         *   - `facetPanelOpen`: Whether the facet panel should be opened by default or not.
         *
         * If type is `'markdown'`, the object will also these additional
         * properties:
         *
         *   - `markdownPattern`: markdown pattern,
         *   - `templateEngine`: the template engine to be used for the pattern
         *   - `separator`: markdown pattern (default: newline character `'\n'`),
         *   - `suffix`: markdown pattern (detaul: empty string `''`),
         *   - `prefix`: markdown pattern (detaul: empty string `''`)
         *
         * Extra optional attributes:
         *  - `sourceMarkdownPattern`: the markdown pattern defined on the source definition
         *  - `sourceTemplateEngine`: the template engine to be used for the pattern
         *  - `sourceHasWaitFor`: if there's waitfor defiend for the source markdown pattern.
         *  - `sourceWaitFor`: the waitfor definition in the source
         *
         * If type is `'module'`, the object will have these additional
         * properties:
         *
         *   - `modulePath`: `'pathsuffix'` (TODO: what is this!?)
         *
         * Usage :
         * ```
         * var displayType = reference.display.type; // the displayType
         * if ( displayType === 'table') {
         *    // go for default rendering of rows using tuple.values
         * } else if (displayType === 'markdown') {
         *    // Use the separator, suffix and prefix values while rendering tuples
         *    // Tuple will have a "tuple.content" property that will have the actual markdown value
         *    // derived from row_markdown_pattern after templating and rendering markdown
         * } else if (displayType ===  'module') {
         *   // Use modulePath to render the rows
         * }
         * ```
         * @type {Object}
         *
         **/
        get display() {
            if (this._display === undefined) {
                var self = this;

                // displaytype default value for compact/breif/inline should be markdown. otherwise table
                var displayType =  (this._context === _contexts.COMPACT_BRIEF_INLINE) ? _displayTypes.MARKDOWN :  _displayTypes.TABLE;

                this._display = {
                     type: displayType,
                    _separator: "\n",
                    _prefix: "",
                    _suffix: ""
                };

                var annotation;
                // If table has table-display annotation then set it in annotation variable
                if (this._table.annotations.contains(_annotations.TABLE_DISPLAY)) {
                    annotation = _getRecursiveAnnotationValue(this._context, this._table.annotations.get(_annotations.TABLE_DISPLAY).content);
                }

                // get the hide_row_count from display annotation
                var hideRowCount = _getHierarchicalDisplayAnnotationValue(this._table, this._context, "hide_row_count", true);
                this._display.hideRowCount = (typeof hideRowCount == "boolean") ? hideRowCount : false;

                // If annotation is defined then parse it
                if (annotation) {

                    // Set row_order value
                    // this will just whatever is defined in row_order, it will not
                    // take care of columns that have column_order. The caller should do that.
                    if (Array.isArray(annotation.row_order)) {
                        this._display._rowOrder = _processColumnOrderList(annotation.row_order, this._table);
                    }

                    // Set default page size value
                    if (typeof annotation.page_size === 'number') {
                        this._display.defaultPageSize = annotation.page_size;
                    }

                    // set whether the column headers should be hidden (applies to record app currently)
                    // backwards compatibility: the old name was hide_column_headers
                    if (annotation.hide_column_header || annotation.hide_column_headers) {
                        this._display.hideColumnHeaders = annotation.hide_column_header || annotation.hide_column_headers;
                    }

                    // set whether the table of contents should be collapsed by default (applies to record app currently)
                    if (annotation.collapse_toc_panel) {
                        this._display.collapseToc = annotation.collapse_toc_panel;
                    }

                    // If module is not empty then set its associated properties
                    // Else if row_markdown_pattern is not empty then set its associated properties
                    if (typeof annotation.module === 'string') {

                        // TODO: write code for module handling

                        this._display.type = _displayTypes.MODULE;

                    } else if (typeof annotation.row_markdown_pattern === 'string' || typeof annotation.page_markdown_pattern === 'string') {

                        this._display.type = _displayTypes.MARKDOWN;

                        this._display.templateEngine = annotation.template_engine;

                        if (typeof annotation.page_markdown_pattern === 'string') {
                            this._display._pageMarkdownPattern = annotation.page_markdown_pattern;
                        } else {
                            // Render the row by composing a markdown representation
                            this._display._rowMarkdownPattern = annotation.row_markdown_pattern;

                            // Insert separator markdown text between each expanded rowpattern when presenting row sets. Default is new line "\n"
                            this._display._separator = (typeof annotation.separator_markdown === 'string') ? annotation.separator_markdown : "\n";

                            // Insert prefix markdown before the first rowpattern expansion when presenting row sets. (Default empty string "".)
                            this._display._prefix = (typeof annotation.prefix_markdown === 'string') ? annotation.prefix_markdown : "";

                            // Insert suffix markdown after the last rowpattern expansion when presenting row sets. (Default empty string "".)
                            this._display._suffix = (typeof annotation.suffix_markdown === 'string') ? annotation.suffix_markdown : "";
                        }

                    }
                }

                // attach the display settings defined on the source definition
                if (this.pseudoColumn && this.pseudoColumn.display) {
                    var displ = this.pseudoColumn.display;
                    this._display.sourceWaitFor = this.pseudoColumn.waitFor;
                    this._display.sourceHasWaitFor = this.pseudoColumn.hasWaitFor;

                    if (displ.sourceMarkdownPattern) {
                        this._display.type = _displayTypes.MARKDOWN;
                        this._display.sourceMarkdownPattern = displ.sourceMarkdownPattern;
                        this._display.sourceTemplateEngine = displ.sourceTemplateEngine;
                    }
                } else {
                    this._display.sourceWaitFor = [];
                    this._display.sourceHasWaitFor = false;
                }

                // if facetpanel won't be used or the ConfigService.clientConfig.facetPanelDisplay doesn't include the current context or a parent context, set to null
                var fpo = null, maxFacetDepth = null;
                // NOTE: clientConfig should always be defined if used by a client, some ermrestJS tests don't always set it, so don't calculate this for those tests
                if (this._context && ConfigService.verifyClientConfig(true)) {
                    // ConfigService.clientConfig.facetPanelDisplay will be defined from configuration or based on chaise defaults
                    var ccFacetDisplay = ConfigService.clientConfig.facetPanelDisplay,
                        context = this._context;

                    // facet panel is not available in COMPACT_BRIEF and it's subcontexts, and other non-compact contexts
                    if (context.startsWith(_contexts.COMPACT) && !context.startsWith(_contexts.COMPACT_BRIEF)) {

                        // get it from the display annotation
                        maxFacetDepth = _getHierarchicalDisplayAnnotationValue(this.table, context, "max_facet_depth", true);
                        // missing from the annotation, so get it from the chaise-config
                        if (maxFacetDepth === -1 && typeof ccFacetDisplay.maxFacetDepth === 'number') {
                            maxFacetDepth = ccFacetDisplay.maxFacetDepth;
                        }
                        // validate the value
                        if (!isInteger(maxFacetDepth) || maxFacetDepth < 0) {
                            maxFacetDepth = 1;
                        } else if (maxFacetDepth > 2) {
                            maxFacetDepth = 2;
                        }

                        if (ccFacetDisplay.closed && ccFacetDisplay.closed.includes("*")) fpo = false;
                        if (ccFacetDisplay.open && ccFacetDisplay.open.includes("*")) fpo = true;
                        // check inheritence
                        // array is in order from parent context to more specific sub contexts
                        for (var i=0; i < _compactFacetingContexts.length; i++) {
                            var ctx = _compactFacetingContexts[i];
                            // only check contexts that match
                            // "compact/select/*"" where * can be association (or subcontexts), foreign_key, saved_queries, or show_more
                            if (context.startsWith(ctx)) {
                                if (ccFacetDisplay.closed && ccFacetDisplay.closed.includes(ctx)) fpo = false;
                                if (ccFacetDisplay.open && ccFacetDisplay.open.includes(ctx)) fpo = true;

                                // stop checking if we found the current context in the array, inheritence checks should be complete
                                if (context === ctx) break;
                            }
                        }
                    }
                }
                // for other contexts that don't allow facet
                maxFacetDepth = maxFacetDepth === null ? 0 : maxFacetDepth;

                this._display.maxFacetDepth = maxFacetDepth;
                this._display.showFaceting = maxFacetDepth > 0;

                this._display.facetPanelOpen = fpo;

                /**
                 * Check the catalog, schema, and table to see if the saved query UI should show
                 *  1. check the table to see if the value is a boolean
                 *    a. if true or false, we are done and use that value
                 *    b. if undefined, display annotation defined but show_saved_query property was undefined
                 *    c. if null, display annotation was not defined (initial value)
                 *  2. check the schema to see if the value is a boolean
                 *    a. if true or false, we are done and use that value
                 *    b. if undefined, display annotation defined but show_saved_query property was undefined
                 *    c. if null, display annotation was not defined (initial value)
                 *  3. check the catalog to see if the value is a boolean
                 *    a. if true or false, we are done and use that value
                 *    b. if undefined, display annotation defined but show_saved_query property was undefined
                 *    c. if null, display annotation was not defined (initial value)
                 *  4. default to false if not defined on any of the above
                 */
                this._display.showSavedQuery = this.table._showSavedQuery;
            }

            return this._display;
        },

        /**
         * The "related" references. Relationships are defined by foreign key
         * references between {@link Table}s. Those references can be
         * considered "outbound" where the table has FKRs to other entities or
         * "inbound" where other entities have FKRs to this entity. Finally,
         * entities can be "associated" by means of associative entities. Those
         * are entities in another table that establish _many-to-many_
         * relationships between entities. If this help `A <- B -> C` where
         * entities in `B` establish relationships between entities in `A` and
         * `C`. Thus entities in `A` and `C` may be associated and we may
         * ignore `B` and think of this relationship as `A <-> C`, unless `B`
         * has other moderating attributes, for instance that indicate the
         * `type` of relationship, but this is a model-depenent detail.
         *
         * NOTE: This API should not be used for generating related references
         *       since we need the main tuple data for generating related references.
         *       Please use `generateRelatedList` or `generateActiveList` before
         *       calling this API.
         * @type {Reference[]}
         */
        get related() {
            if (this._related === undefined) {
                this.generateRelatedList();
            }
            return this._related;
        },

        /**
         * The function that can be used to generate .related API.
         * The logic is as follows:
         *
         * 1. Get the list of visible inbound foreign keys (if annotation is not defined,
         * it will consider all the inbound foreign keys).
         *
         * 2. Go through the list of visible inbound foreign keys
         *  2.1 if it's not part of InboundForeignKeyPseudoColumn apply the generateRelatedRef logic.
         * The logic for are sorted based on following attributes:
         *  1. displayname
         *  2. position of key columns that are involved in the foreignkey
         *  3. position of columns that are involved in the foreignkey
         *
         * NOTE: Passing "tuple" to this function is highly recommended.
         *       Without tuple related references will be generated by appending the compactPath with
         *       join statements. Because of this we cannot optimize the URL and other
         *       parts of the code cannot behave properly (e.g. getUnlinkTRS in read cannot be used).
         *       By passing "tuple", we can create the related references by creaing a facet blob
         *       which can be integrated with other parts of the code.
         *
         * @returns {Reference[]}
         * @param {Tuple=} tuple the current tuple
         */
        generateRelatedList: function (tuple) {

            this._related = [];

            var visibleFKs = this._table.referredBy._contextualize(this._context, tuple),
                notSorted,
                fkr, fkrName;
            if (visibleFKs === -1) {
                notSorted = true;
                visibleFKs = this._table.referredBy.all().map(function (fkr) {
                    return {foreignKey: fkr};
                });
            }

            // if visible columns list is empty, make it.
            if (this._referenceColumns === undefined) {
                // will generate the this._inboundFKColumns
                this.generateColumnsList(tuple);
            }

            var currentColumns = {};
            this._referenceColumns.forEach(function (col) {
                if (col.isPathColumn || col.isInboundForeignKey) {
                    currentColumns[col.name] = true;
                }
            });

            for(var i = 0; i < visibleFKs.length; i++) {
                fkr = visibleFKs[i];
                var relatedRef, fkName;
                if (fkr.isPath) {
                    // since we're sure that the pseudoColumn either going to be
                    // general pseudoColumn or InboundForeignKeyPseudoColumn then it will have reference
                    relatedRef = _createPseudoColumn(this, fkr.sourceObjectWrapper, tuple).reference;
                    fkName = relatedRef.pseudoColumn.name;
                } else {
                    fkr = fkr.foreignKey;

                    // make sure that this fkr is not from an alternative table to self
                    if (fkr._table._isAlternativeTable() && fkr._table._altForeignKey !== undefined &&
                    fkr._table._baseTable === this._table && fkr._table._altForeignKey === fkr) {
                        continue;
                    }
                    relatedRef = this._generateRelatedReference(fkr, tuple, true);
                    fkName = _sourceColumnHelpers.generateForeignKeyName(fkr, true);
                }

                // it it's already added to the visible-columns (inline related) don't add it again.
                if (currentColumns[fkName]) {
                    continue;
                }
                this._related.push(relatedRef);
            }

            if (notSorted && this._related.length !== 0) {
                return this._related.sort(function (a, b) {
                    // displayname
                    if (a.displayname.value != b.displayname.value) {
                        return a.displayname.value.localeCompare(b.displayname.value);
                    }

                    // columns
                    var keyColPositions = compareColumnPositions(a._related_key_column_positions, b._related_key_column_positions);
                    if (keyColPositions !== 0) {
                        return keyColPositions;
                    }

                    // foreignkey columns
                    var fkeyColPositions = compareColumnPositions(a._related_fk_column_positions, b._related_fk_column_positions);
                    return fkeyColPositions === -1 ? -1 : 1;
                });
            }

            return this._related;
        },

        /**
         * This will generate a new unfiltered reference each time.
         * Returns a reference that points to all entities of current table
         *
         * @type {Reference}
         */
        get unfilteredReference() {
            var table = this._table;
            var refURI = [
                table.schema.catalog.server.uri ,"catalog" ,
                table.schema.catalog.id, this.location.api,
                [fixedEncodeURIComponent(table.schema.name),fixedEncodeURIComponent(table.name)].join(":"),
            ].join("/");
            return new Reference(parse(refURI), table.schema.catalog);
        },

        /**
        * App-specific URL
        *
        * @type {String}
        * @throws {Error} if `_appLinkFn` is not defined.
        */
        get appLink() {
            if (typeof ConfigService.appLinkFn !== 'function') {
                throw new Error("`appLinkFn` function is not defined.");
            }
            var tag = this._context ? this._table._getAppLink(this._context) : this._table._getAppLink();
            return ConfigService.appLinkFn(tag, this._location, this._context);
        },

        /**
         * Returns a uri that will properly generate the download link for a csv document
         * NOTE It will honor the visible columns in `export` context
         *
         * @returns {String} A string representing the url for direct csv download
         **/
        get csvDownloadLink() {
            if (this._csvDownloadLink === undefined) {
                var cid = this.table.schema.catalog.server.cid;
                var qParam = "?limit=none&accept=csv&uinit=1";
                qParam += cid ? ("&cid=" + cid) : "";
                qParam += "&download=" + fixedEncodeURIComponent(this.displayname.unformatted);

                var isCompact = this._context === _contexts.COMPACT;
                var defaultExportOutput = _referenceExportOutput(this, this.location.mainTableAlias, null, false, null, isCompact);

                if (defaultExportOutput == null) {
                    this._csvDownloadLink = null;
                } else {
                    var uri;
                    if (["attributegroup", "entity"].indexOf(defaultExportOutput.source.api) != -1) {
                        // example.com/ermrest/catalog/<id>/<api>/<current-path>/<vis-col-projection-and-needed-joins>
                        uri = [
                            this.location.service, "catalog", this._location.catalog, defaultExportOutput.source.api,
                            this.location.ermrestCompactPath, defaultExportOutput.source.path
                        ].join("/");
                    } else {
                        // won't happen with the current code, but to make this future proof
                        uri = this.location.ermrestCompactUri;
                    }

                    this._csvDownloadLink =  uri + qParam;
                }
            }
            return this._csvDownloadLink;
        },

        /**
         * The default information that we want to be logged. This includes:
         *  - catalog, schema_table
         * TODO Evaluate whether we even need this function
         * @type {Object}
         */
        get defaultLogInfo() {
            var obj = {};
            obj.catalog = this.table.schema.catalog.id;
            obj.schema_table = this.table.schema.name + ":" + this.table.name;
            return obj;
        },

        /**
         * The object that can be logged to capture the filter state of the reference.
         * The return object can have:
         *  - filters: the facet object.
         *  - custom_filters:
         *      - the filter strings that parser couldn't turn to facet.
         *      - if we could turn the custom filter to facet, this will return `true`
         *  - cfacet: if there's a cfacet it will be 1
         *    - cfacet_str: if cfacet=1, it will be displayname of cfacet.
         *    - cfacet_path: if cfacet=1, it will be ermrest path of cfacet.
         * This function creates a new object everytime that it's called, so it
         * can be manipulated further.
         * @type {Object}
         */
        get filterLogInfo() {
            var obj = {};

            // custom facet
            if (this.location.customFacets) {
                var cf = this.location.customFacets;
                obj.cfacet = 1;
                if (cf.displayname) {
                    obj.cfacet_str = cf.displayname;
                } else if (cf.ermrestPath){
                    obj.cfacet_path = cf.ermrestPath;
                }
            }

            if (this.location.facets) {
                obj.filters = _compressFacetObject(this.location.facets.decoded);
            } else if (this.location.filter) {
                if (this.location.filter.facet) {
                    obj.filters = _compressFacetObject(this.location.filter.facet);
                    obj.custom_filters = true;
                } else {
                    obj.custom_filters = this.location.filtersString;
                }
            }
            return obj;
        },

        /**
         * Will return the expor templates that are available for this reference.
         * It will validate the templates that are defined in annotations.
         * If its `detailed` context and annotation was missing,
         * it will return the default export template.
         * @param {Boolean} useDefault whether we should use default template or not
         * @return {Array}
         */
        getExportTemplates: function (useDefault) {
            const self = this, helpers = _exportHelpers;

            // either null or array
            const templates = helpers.getExportAnnotTemplates(self.table, self._context);

            // annotation is missing
            if (!Array.isArray(templates)) {
                const canUseDefault = useDefault &&
                                    self._context === _contexts.DETAILED &&
                                    self.defaultExportTemplate != null;

                return canUseDefault ? [self.defaultExportTemplate]: [];
            }

            const finalRes = helpers.replaceFragments(
                templates,
                helpers.getExportFragmentObject(self.table, self.defaultExportTemplate)
            );

            // validate the templates
            return finalRes.filter(function (temp) {
                return validateExportTemplate(temp);
            });
        },

        /**
         * Returns a object, that can be used as a default export template.
         * NOTE SHOULD ONLY BE USED IN DETAILED CONTEXT
         * It will include:
         * - csv of the main table.
         * - csv of all the related entities
         * - fetch all the assets. For fetch, we need to provide url, length, and md5 (or other checksum types).
         *   if these columns are missing from the asset annotation, they won't be added.
         * - fetch all the assetes of related tables.
         * @type {string}
         */
         get defaultExportTemplate() {
             if (this._defaultExportTemplate === undefined) {
                 var self = this,
                     outputs = [],
                     relatedTableAlias = "R";

                 var getTableOutput = _referenceExportOutput,
                     getAssetOutput = _getAssetExportOutput;

                 var addOutput = function (output) {
                    if (output != null) {
                        outputs.push(output);
                    }
                 };

                 // create a csv + fetch all the assets
                 var processRelatedReference = function(rel) {
                     // the path that will be used for assets of related entities
                     var destinationPath = rel.displayname.unformatted;
                     // this will be used for source path
                     var sourcePath;
                     if (rel.pseudoColumn && !rel.pseudoColumn.isInboundForeignKey) {
                         var lastFk = rel.pseudoColumn.sourceObjectWrapper.lastForeignKeyNode;
                         // path from main to the related reference
                        sourcePath = rel.pseudoColumn.sourceObjectWrapper.toString(false, false, relatedTableAlias);

                         // path more than length one, we need to add the main table fkey
                        addOutput(getTableOutput(rel, relatedTableAlias, sourcePath, rel.pseudoColumn.foreignKeyPathLength >= 2, self));
                     }
                     // association table
                     else if (rel.derivedAssociationReference) {
                         var assoc = rel.derivedAssociationReference;
                         sourcePath = assoc.origFKR.toString() + "/" + relatedTableAlias + ":=" + assoc.associationToRelatedFKR.toString(true);
                         addOutput(getTableOutput(rel, relatedTableAlias, sourcePath, true, self));
                     }
                     // single inbound related
                     else {
                         sourcePath = relatedTableAlias + ":=" + rel.origFKR.toString(false, false);
                         addOutput(getTableOutput(rel, relatedTableAlias, sourcePath));
                     }

                     // add asset of the related table
                     var expRef = _getExportReference(rel);

                     // alternative table, don't add asset
                     if (expRef.table !== rel.table) return;

                     expRef.columns.forEach(function(col) {
                         var output = getAssetOutput(col, destinationPath, sourcePath);
                         addOutput(output);
                     });
                 };

                 // main entity
                 addOutput(getTableOutput(self, self.location.mainTableAlias));

                 var exportRef = _getExportReference(self);

                 // we're not supporting alternative tables
                 if (exportRef.table.name === self.table.name) {
                     // main assets
                     exportRef.columns.forEach(function(col) {
                         var output = getAssetOutput(col, "", "");
                         addOutput(output);
                     });

                     // inline entities
                     exportRef.columns.forEach(function (col) {
                         if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
                             return processRelatedReference(col.reference);
                         }
                     });
                 }

                 // related entities (use the export context otherwise detailed)
                 var hasRelatedExport = false;
                 if (self.table.annotations.contains(_annotations.VISIBLE_FOREIGN_KEYS)) {
                     var exportRelated = _getRecursiveAnnotationValue(_contexts.EXPORT, self.table.annotations.get(_annotations.VISIBLE_FOREIGN_KEYS).content, true);
                     hasRelatedExport = exportRelated !== -1 && Array.isArray(exportRelated);
                 }

                 // if export context is defined in visible-foreign-keys, use it, otherwise fallback to detailed
                 var exportRefForRelated = hasRelatedExport ? self.contextualize.export : (self._context === _contexts.DETAILED ? self : self.contextualize.detailed);
                 if (exportRefForRelated.table.name === self.table.name) {
                     exportRefForRelated.related.forEach(processRelatedReference);
                 }

                 if (outputs.length === 0) {
                     return null;
                 }

                 self._defaultExportTemplate = {
                     displayname: "BDBag",
                     type: "BAG",
                     outputs: outputs
                 };
             }
             return this._defaultExportTemplate;
         },

        /**
         * create a new reference with the new search
         * by copying this reference and clears previous search filters
         * search term can be:
         * a) A string with no space: single term or regular expression
         * b) A single term with space using ""
         * c) use space for conjunction of terms
         * @param {string} term - search term, undefined to clear search
         * @returns {Reference} A new reference with the new search
         *
         * @throws {@link ERMrest.InvalidInputError} if `term` is invalid.
         */
        search: function(term) {

            if (term) {
                if (typeof term === "string")
                    term = term.trim();
                else
                    throw new InvalidInputError("Invalid input. Seach expects a string.");
            }


            // make a Reference copy
            var newReference = _referenceCopy(this);

            newReference._location = this._location._clone(newReference);
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;
            newReference._location.search(term);

            // if facet columns are already computed, just update them.
            // if we don't do this here, then facet columns will recomputed after each search
            // TODO can be refactored
            if (this._facetColumns !== undefined) {
                newReference._facetColumns = [];
                this.facetColumns.forEach(function (fc) {
                    newReference._facetColumns.push(
                        new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, fc.filters.slice())
                    );
                });
            }

            return newReference;
        },

        /**
         *
         * @param {ColumnAggregateFn[]} aggregateList - list of aggregate functions to apply to GET uri
         * @return {Promise} - Promise contains an array of the aggregate values in the same order as the supplied aggregate list
         */
        getAggregates: function(aggregateList, contextHeaderParams) {
            var defer = ConfigService.q.defer();
            var url;

            // create the context header params for log
            if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                contextHeaderParams = {"action": "aggregate"};
            }
            var config = {
                headers: this._generateContextHeader(contextHeaderParams)
            };

            var urlSet = [];
            var baseUri = this.location.ermrestCompactPath + "/";
            // create a url: ../aggregate/../0:=fn(),1:=fn()..
            // TODO could be re-written
            for (var i = 0; i < aggregateList.length; i++) {
                var agg = aggregateList[i];

                // if this is the first aggregate, begin with the baseUri
                if (i === 0) {
                    url = baseUri;
                } else {
                    url += ",";
                }

                // if adding the next aggregate to the url will push it past url length limit, push url onto the urlSet and reset the working url
                if ((url + i + ":=" + agg).length > URL_PATH_LENGTH_LIMIT) {
                    // if cannot even add the first one
                    if (i === 0) {
                        defer.reject(new InvalidInputError("Cannot send the request because of URL length limit."));
                        return defer.promise;
                    }

                    // strip off an extra ','
                    if (url.charAt(url.length-1) === ',') {
                        url = url.substring(0, url.length-1);
                    }

                    urlSet.push(url);
                    url = baseUri;
                }

                // use i as the alias
                url += i + ":=" + agg;

                // We are at the end of the aggregate list
                if (i+1 === aggregateList.length) {
                    urlSet.push(url);
                }
            }

            var aggregatePromises = [];
            var http = this._server.http;
            for (var j = 0; j < urlSet.length; j++) {
                aggregatePromises.push(
                    http.get(this.location.service + "/catalog/" + this.location.catalog + "/aggregate/" + urlSet[j], config)
                );
            }

            ConfigService.q.all(aggregatePromises).then(function getAggregates(response) {
                // all response rows merged into one object
                var singleResponse = {};

                // collect all the data in one object so we can map it to an array
                for (var k = 0; k < response.length; k++) {
                    Object.assign(singleResponse, response[k].data[0]);
                }

                var responseArray = [];
                for (var m = 0; m < aggregateList.length; m++) {
                    responseArray.push(singleResponse[m]);
                }

                defer.resolve(responseArray);
            }, function error(response) {
                var error = ErrorService.responseToError(response);
                return defer.reject(error);
            }).catch(function (error) {
                return defer.reject(error);
            });

            return defer.promise;
        },


        /**
         * Given a page, will return a reference that has
         * - the sorting and paging of the given page.
         * - the merged facets of the based reference and given page's facet.
         * to match the page.
         * NOTE: The given page must be based on the same table that this current table is based on.
         * @param  {Page} page
         * @return {Reference} reference with new page settings.
         */
        setSamePaging: function (page) {

            var pageRef = page._ref;

            /*
            * It only works when page's table and current table are the same.
            */
            if (pageRef.table !== this.table) {
                throw new InvalidInputError("Given page is not from the same table.");
            }


            var newRef = _referenceCopy(this);
            newRef._location = this._location._clone(newRef);

            // same facets
            if (pageRef.location.facets) {
                var andFilters = newRef.location.facets ? newRef.location.facets.andFilters : [];
                Array.prototype.push.apply(andFilters, pageRef.location.facets.andFilters);
                newRef._location.facets = {"and": andFilters};
            }

            /*
             * This case is not possible in the current implementation,
             * page object is being created from read, and therefore always the
             * attached reference will have sortObject.
             * But if it didn't have any sort, we should just return the reference.
             */
            if (!pageRef._location.sortObject) {
                return newRef;
            }

            // same sort
            newRef._location.sortObject =  simpleDeepCopy(pageRef._location.sortObject);

            // same pagination
            newRef._location.afterObject =  pageRef._location.afterObject ? simpleDeepCopy(pageRef._location.afterObject) : null;
            newRef._location.beforeObject =  pageRef._location.beforeObject ? simpleDeepCopy(pageRef._location.beforeObject) : null;

            // if we have extra data, and one of before/after is not available
            if (page._extraData && (!pageRef._location.beforeObject || !pageRef._location.afterObject)) {
                var pageValues = _getPagingValues(newRef, page._extraData, page._extraLinkedData);

                // add before based on extra data
                if (!pageRef._location.beforeObject) {
                    newRef._location.beforeObject = pageValues;
                }
                // add after based on extra data
                else {
                    newRef._location.afterObject = pageValues;
                }
            }
            return newRef;
        },

        setNewTable: function(table) {
            this._table = table;
            this._rootTable = table;
            this._shortestKey = table.shortestKey;
            this._displayname = table.displayname;
            delete this._referenceColumns;
            delete this._activeList;
            delete this._related;
            delete this._canCreate;
            delete this._canRead;
            delete this._canUpdate;
            delete this._canDelete;
            delete this._canUseTRS;
            delete this._canUseTCRS;
            delete this._display;
            delete this._csvDownloadLink;
            delete this._readAttributeGroupPathProps_cached;
        },

        /**
         * Find a column given its name. It will search in this order:
         * 1. Visible columns
         * 2. Table columns
         * 3. search by constraint name in visible foreignkey and keys (backward compatibility)
         * Will throw an error if
         * @param  {string} name name of column
         * @return {ReferenceColumn}
         */
        getColumnByName: function (name) {
            var i;

            // given an array of columns, find column by name
            var findCol = function (list) {
                for (i = 0; i < list.length; i++) {
                    if (list[i].name === name) {
                        return list[i];
                    }
                }
                return false;
            };

            // search in visible columns
            var c = findCol(this.columns);
            if (c) {
                return c;
            }

            // search in table columns
            c = findCol(this.table.columns.all());
            if (c) {
                return new ReferenceColumn(this, [c]);
            }

            // backward compatibility, look at fks and keys using constraint name
            for (i = 0; i < this.columns.length; i++) {
                c = this.columns[i];
                if (c.isPseudo && ((c.isKey && c.key._constraintName === name) || (c.isForeignKey && c.foreignKey._constraintName ===  name))) {
                    return c;
                }
            }

            throw new NotFoundError("", "Column " + name + " not found in table " + this.table.name + ".");
        },

        /**
         * Generates the list of visible columns
         * The logic is as follows:
         *
         * 1. check if visible-column annotation is present for this context, go through the list,
         *      1.1 if it's an array,
         *          1.1.1 find the corresponding foreign key
         *          1.1.2 avoid duplicate foreign keys.
         *          1.1.3 make sure it is not hidden(+).
         *          1.1.4 if it's outbound foreign key, create a pseudo-column for that.
         *          1.1.5 if it's inbound foreign key, create the related reference and a pseudo-column based on that.
         *      1.2 if it's an object.
         *          1.2.1 if it doesn't have any source or sourcekey, if it's non-entry and has markdown_name and markdown_pattern create a VirtualColumn.
         *          1.2.2 create a pseudo-column if it's properly defined.
         *      1.3 otherwise find the corresponding column if exits and add it (avoid duplicate),
         *          apply *addColumn* heuristics explained below.
         *
         * 2.otherwise go through list of table columns
         *      2.0 fetch config option for system columns heuristics (true|false|Array)
         *          2.0.1 add RID to the beginning of the list if true or Array.includes("RID")
         *      2.1 create a pseudo-column for key if context is not detailed, entry, entry/create, or entry/edit and we have key that is notnull and notHTML
         *      2.2 check if column has not been processed before.
         *      2.3 hide the columns that are part of origFKR.
         *      2.4 if column is serial and part of a simple key hide it.
         *      2.5 if it's not part of any foreign keys
         *          apply *addColumn* heuristics explained below.
         *      2.6 go through all of the foreign keys that this column is part of.
         *          2.6.1 make sure it is not hidden(+).
         *          2.6.2 if it's simple fk, just create PseudoColumn
         *          2.6.3 otherwise add the column just once and append just one PseudoColumn (avoid duplicate)
         *      2.7 based on config option for ssytem columns heuristics, add other 4 system columns
         *          2.7.1 add ('RCB', 'RMB', 'RCT', 'RMT') if true, or only those present in Array. Will always be added in this order
         *
         * *addColumn* heuristics:
         *  + If column doesn't have asset annotation or its type is not `text`, add a normal ReferenceColumn.
         *  + Otherwise:
         *      + If it has `url_pattern`: add AssetPseudoColumn.
         *      + Otherwise:
         *          - in entry context: remove it from the visible columns list.
         *          - in other contexts: ignore the asset annotation, treat it as normal column.
         *
         * NOTE:
         *  + If asset annotation was used and context is entry,
         *      we should remove the columns that are used as filename, byte, sha256, or md5.
         *  + If this reference is actually an inbound related reference,
         *      we should hide the foreign key (and all of its columns) that created the link.
         *
         * @param  {Tuple} tuple the data for the current refe
         * @param  {Object[]} columnsList if passed, we will skip the annotation and heuristics and use this list instead.
         * @param  {boolean?} dontChangeReference whether we should mutate the reference or just return the generated list.
         * @param  {boolean?} skipLog whether we should skip logging the warning messages
         * @return {ReferenceColumn[]}  Array of {@link ERMrest.ReferenceColumn}.
         */
        generateColumnsList: function(tuple, columnsList, dontChangeReference, skipLog) {
            var resultColumns = [];

            var self = this;
            var columns = -1,
                consideredColumns = {}, // to avoid duplicate pseudo columns
                tableColumns = {}, // to make sure the hashes we genereate are not clashing with table column names
                virtualColumnNames = {}, // to make sure the names generated for virtual names are not the same
                compositeFKs = [], // to add composite keys at the end of the list
                assetColumns = [], // columns that have asset annotation
                usedIframeInputMappings = {}, // column names that are used in iframe column mappings.
                hiddenFKR = this.origFKR,
                hasOrigFKR,
                colFKs,
                refTable = this._table,
                fkName, refCol, pseudoName,
                ignore, cols, col, fk, i, j;

            var context = this._context;
            var isEntry = _isEntryContext(context),
                isCompact = (typeof context === "string" && context.startsWith(_contexts.COMPACT)),
                isCompactEntry = (typeof context === "string" && context.startsWith(_contexts.COMPACT_ENTRY));

            // check if we should hide some columns or not.
            // NOTE: if the reference is actually an inbound related reference, we should hide the foreign key that created this link.
            hasOrigFKR = typeof context === "string" && context.startsWith(_contexts.COMPACT_BRIEF) && isObjectAndNotNull(hiddenFKR);

            // should hide the origFKR in case of inbound foreignKey (only in compact/brief)
            var hideFKR = function (fkr) {
                return hasOrigFKR && fkr == hiddenFKR;
            };

            // should hide the columns that are part of origFKR. (only in compact/brief)
            var hideColumn = function (col) {
                return hasOrigFKR && hiddenFKR.colset.columns.indexOf(col) != -1;
            };

            var _addAssetColumn = function (col, sourceObjectWrapper, name, heuristics) {
                var assetCol = new AssetPseudoColumn(self, col, sourceObjectWrapper, name, tuple);
                assetColumns.push(assetCol);
                resultColumns.push(assetCol);

                // as part of heuristics we only want the asset be added and not the column,
                // so adding it to considered ones to avoid adding it again.
                if (heuristics && assetCol.filenameColumn) {
                    consideredColumns[assetCol.filenameColumn.name] = true;
                }
            };

            // this function will take care of adding column and asset column
            var addColumn = function (col, sourceObjectWrapper, name, heuristics) {
                if (col.isAssetURL) {
                    _addAssetColumn(col, sourceObjectWrapper, name, heuristics);
                    return;
                }

                // in entry context we don't want to show any of the asset metadata columns as chaise cannot handle it.
                if (isEntry && (col.isAssetFilename || col.isAssetByteCount || col.isAssetMd5 || col.isAssetSha256)) {
                    return;
                }

                // for heuristics we should take care of  the asset metadata columns differently
                if (heuristics) {
                    // as part of heuristics, treat the asset filename the same as the asset itself.
                    // and only add one of them.
                    if (col.isAssetFilename) {
                        if (col.assetURLColumnName in consideredColumns) {
                            return;
                        }
                        consideredColumns[col.assetURLColumnName] = true;
                        _addAssetColumn(self.table.columns.get(col.assetURLColumnName), sourceObjectWrapper, name, heuristics);
                        return;
                    }

                    // in compact context we should hide md5 and sha256
                    if (isCompact && (col.isAssetMd5 || col.isAssetSha256)) {
                        return;
                    }
                }

                // add it as a reference column
                resultColumns.push(new ReferenceColumn(self, [col], sourceObjectWrapper, name, tuple));
            };

            // make sure generated hash is not the name of any columns in the table
            var nameExistsInTable = function (name, obj) {
                if (name in tableColumns) {
                    if (!skipLog) {
                        $log.info("Generated Hash `" + name + "` for pseudo-column exists in table `" + self.table.name +"`.");
                        $log.info("Ignoring the following in visible-columns: ", obj);
                    }
                    return true;
                }
                return false;
            };

            var wm = _warningMessages;
            var logCol = function (bool, message, i) {
                if (bool && !skipLog) {
                    $log.info("columns list for table: " + self.table.name + ", context: " + context + ", column index:" + i);
                    $log.info(message);
                }
                return bool;
            };

            // create a map of tableColumns to make it easier to find one
            this._table.columns.all().forEach(function (c) {
                tableColumns[c.name] = true;
            });

            // get columns from the input (used when we just want to process the given list of columns)
            if (Array.isArray(columnsList)) {
                columns = columnsList;
            }
            // get column orders from annotation
            else if (this._table.annotations.contains(_annotations.VISIBLE_COLUMNS)) {
                columns = _getRecursiveAnnotationValue(this._context, this._table.annotations.get(_annotations.VISIBLE_COLUMNS).content);
            }

             // annotation
            if (columns !== -1 && Array.isArray(columns)) {
                for (i = 0; i < columns.length; i++) {
                    col = columns[i];
                    // foreignKey or key
                    if (Array.isArray(col)) {
                        fk = this._table.schema.catalog.constraintByNamePair(col);
                        if (fk !== null) {
                            fkName = fk.object.name;
                            switch(fk.subject) {
                                case _constraintTypes.FOREIGN_KEY:
                                    fk = fk.object;
                                    // fk is in this table, avoid duplicate and it's not hidden.
                                    if (!hideFKR(fk)) {
                                        // outbound foreignkey
                                        if (fk._table == this._table) {
                                            // avoid duplicate and same name in database
                                            if (!logCol((fkName in consideredColumns), wm.DUPLICATE_FK, i) && !nameExistsInTable(fkName, col)) {
                                                consideredColumns[fkName] = true;
                                                resultColumns.push(new ForeignKeyPseudoColumn(this, fk));
                                            }
                                        }
                                        // inbound foreignkey
                                        else if (fk.key.table == this._table && !isEntry) {
                                            // this is inbound foreignkey, so the name must change.
                                            fkName = _sourceColumnHelpers.generateForeignKeyName(fk, true);
                                            if (!logCol(fkName in consideredColumns, wm.DUPLICATE_FK, i) && !logCol(context !== _contexts.DETAILED && context.indexOf(_contexts.EXPORT) == -1, wm.NO_INBOUND_IN_NON_DETAILED, i) && !nameExistsInTable(fkName, col)) {
                                                consideredColumns[fkName] = true;
                                                resultColumns.push(new InboundForeignKeyPseudoColumn(this, this._generateRelatedReference(fk, tuple, true), null, fkName));
                                            }
                                        } else {
                                            logCol(true, wm.FK_NOT_RELATED, i);
                                        }
                                    }
                                    break;
                                case _constraintTypes.KEY:
                                    fk = fk.object;
                                    // key is in this table, and avoid duplicate
                                    if (!logCol((fkName in consideredColumns), wm.DUPLICATE_KEY, i) && !nameExistsInTable(fkName, col) && fk.table == this._table) {
                                        consideredColumns[fkName] = true;
                                        // if in edit context: add its constituent columns
                                        if (isEntry) {
                                            cols = fk.colset.columns;
                                            for (j = 0; j < cols.length; j++) {
                                                col = cols[j];
                                                if (!(col.name in consideredColumns) && !hideColumn(col)) {
                                                    consideredColumns[col.name] = true;
                                                    addColumn(col);
                                                }
                                            }
                                        } else {
                                            resultColumns.push(new KeyPseudoColumn(this, fk));
                                        }
                                    }
                                    break;
                                default:
                                    // visible-columns annotation only supports key, foreignkey and columns.
                            }
                        }
                    }
                    // pseudo-column
                    else if (isObjectAndNotNull(col)) {

                        // virtual column
                        if (!col.source && !col.sourcekey) {
                            ignore = logCol(!isStringAndNotEmpty(col.markdown_name), wm.INVALID_VIRTUAL_NO_NAME, i) ||
                                     logCol(!isObjectAndNotNull(col.display) || !isStringAndNotEmpty(col.display.markdown_pattern), wm.INVALID_VIRTUAL_NO_VALUE, i) ||
                                     isEntry;

                            if (!ignore) {
                                // generate name for virtual-column
                                var extra = 0;
                                pseudoName = "$" + col.markdown_name;
                                while ((pseudoName in tableColumns) || (pseudoName in virtualColumnNames)) {
                                    extra++;
                                    pseudoName += "-" + extra;
                                }
                                virtualColumnNames[pseudoName] = true;
                                resultColumns.push(new VirtualColumn(this, new SourceObjectWrapper(col), pseudoName, tuple));
                            }
                            continue;
                        }

                        // pseudo-column
                        var sd, wrapper;
                        try {
                            // if both source and sourcekey are defined, ignore the source and use sourcekey
                            if (col.sourcekey) {
                                sd = self.table.sourceDefinitions.getSource(col.sourcekey);
                                if (logCol(!sd, wm.INVALID_SOURCEKEY, i)) {
                                    continue;
                                }
                                // merge the two together
                                // might throw an error if the filter in source operand_pattern returns empty
                                wrapper = sd.clone(col, this._table, false, tuple);
                            } else {
                                wrapper = new SourceObjectWrapper(col, this._table, false, undefined, tuple);
                            }
                        } catch(exp) {
                            logCol(true, wm.INVALID_SOURCE + ": " + exp.message, i);
                            continue;
                        }

                        // definitions that will be ignored:
                        // - duplicate
                        // - used in another iframe_input mapping.
                        // - column/foreignkey that needs to be hidden.
                        // - invalid self_link (must be not-null and part of a simple key)
                        // - invalid aggregate function
                        // - invalid filter path usage
                        // - used path in entry
                        // - (the if statement after this) input_iframe with invalid or missing properties
                        ignore = logCol((wrapper.name in consideredColumns), wm.DUPLICATE_PC, i) ||
                                 logCol((wrapper.name in usedIframeInputMappings), wm.USED_IN_IFRAME_INPUT, i) ||
                                 (wrapper.hasPath && !wrapper.hasInbound && wrapper.foreignKeyPathLength == 1 && hideFKR(wrapper.firstForeignKeyNode.nodeObject)) ||
                                 (!wrapper.hasPath && hideColumn(wrapper.column)) ||
                                 logCol(wrapper.sourceObject.self_link === true && !wrapper.column.isUniqueNotNull, wm.INVALID_SELF_LINK, i) ||
                                 logCol((!wrapper.hasAggregate && wrapper.hasInbound && !wrapper.isEntityMode), wm.MULTI_SCALAR_NEED_AGG, i) ||
                                 logCol((!wrapper.hasAggregate && wrapper.hasInbound && wrapper.isEntityMode && context !== _contexts.DETAILED && context.indexOf(_contexts.EXPORT) == -1), wm.MULTI_ENT_NEED_AGG, i) ||
                                 logCol(wrapper.hasAggregate && wrapper.isEntryMode, wm.NO_AGG_IN_ENTRY, i) ||
                                 logCol(wrapper.isUniqueFiltered, wm.FILTER_NO_PATH_NOT_ALLOWED) ||
                                 logCol(isEntry && wrapper.hasPath && (wrapper.hasInbound || wrapper.isFiltered || wrapper.foreignKeyPathLength > 1), wm.NO_PATH_IN_ENTRY, i);

                        if (!ignore && isEntry && isObjectAndNotNull(wrapper.sourceObject.input_iframe)) {
                            var inputIframeRes = wrapper.processInputIframe(this, tuple, usedIframeInputMappings);
                            ignore = true;
                            if (inputIframeRes.error) {
                                logCol(true, 'processing iframe_input: ' + inputIframeRes.message, i);
                            } else if (inputIframeRes.success) {
                                ignore = false;
                                // keep track of the columns used in the mapping
                                var usedColumns = {}, iframeColIndex = 0;
                                for (iframeColIndex = 0; iframeColIndex < inputIframeRes.columns.length; iframeColIndex++) {
                                    usedColumns[inputIframeRes.columns[iframeColIndex].name] = true;
                                }
                                Object.assign(usedIframeInputMappings, usedColumns);
                            }
                        }

                        // avoid duplciates and hide the column
                        if (!ignore) {
                            consideredColumns[wrapper.name] = true;
                            refCol = _createPseudoColumn(this, wrapper, tuple);

                            // we want yo call the addColumn for asset and local columns since it will take care of other things as well.
                            if (refCol.isAsset || !refCol.isPseudo) {
                                addColumn(wrapper.column, wrapper, wrapper.name, false);
                            }
                            else {

                                // if entity and KeyPseudoColumn, we should instead add the underlying columns
                                if (isEntry && refCol.isKey) {
                                    cols = refCol.key.colset.columns;
                                    for (j = 0; j < cols.length; j++) {
                                        col = cols[j];
                                        if (!(col.name in consideredColumns) && !hideColumn(col)) {
                                            consideredColumns[col.name] = true;
                                            addColumn(col);
                                        }
                                    }
                                }

                                // 2 conditions:
                                // isEntry && (refCol.isPathColumn || refCol.isInboundForeignKey || refCol.isKey)
                                // OR
                                // isCompactEntry && (refCol.hasWaitFor || refCol.hasAggregate || (refCol.isPathColumn && refCol.foreignKeyPathLength > 1)
                                var removePseudo = (isEntry && (refCol.isPathColumn || refCol.isInboundForeignKey || refCol.isKey) ) ||
                                        (isCompactEntry && (refCol.hasWaitFor || refCol.hasAggregate || (refCol.isPathColumn && refCol.foreignKeyPathLength > 1)) );

                                // in entry mode, pseudo-column, inbound fk, and key are not allowed
                                if (!removePseudo) {
                                    resultColumns.push(refCol);
                                }
                            }
                        }

                    }
                    // column
                    else if (typeof col === "string") {
                        try {
                            col = this._table.columns.get(col);
                        } catch {
                            // fail silently (this means that the table doesn't have the column)
                        }

                        // if column is not defined, processed before, or should be hidden
                        ignore = logCol(typeof col != "object" || col === null, wm.INVALID_COLUMN, i) ||
                                 logCol((col.name in consideredColumns), wm.DUPLICATE_COLUMN, i) ||
                                 hideColumn(col);

                        if (!ignore) {
                            consideredColumns[col.name] = true;
                            addColumn(col);
                        }
                    } else {
                        logCol(true, wm.INVALID_COLUMN_DEF,i);
                    }
                }
            }
            // heuristics
            else {

                // fetch config option for system columns heuristics (true|false|Array)
                // if true, add all system columns
                // if false, don't move system columns definitions within the list
                // if array, add the ones defined
                //
                // order of system columns will always be the same
                // RID will always be first in the visible columns list
                // the rest will always be at the end in this order ('RCB', 'RMB', 'RCT', 'RMT')
                //
                // if compact or detailed, check for system column config option
                let systemColumnsMode;
                if (ConfigService.systemColumnsHeuristicsMode) {
                    systemColumnsMode = ConfigService.systemColumnsHeuristicsMode(this._context);
                }


                // if (array and RID exists) or true, add RID to the list of columns
                if ((Array.isArray(systemColumnsMode) && systemColumnsMode.indexOf("RID") != -1) || systemColumnsMode == true) {
                    var ridKey = this._table.keys.all().find(function (key) {
                        // should only ever be 1 column for RID key colset
                        return key.simple && key.colset.columns[0].name === "RID";
                    });

                    if (ridKey) {
                        resultColumns.push(new KeyPseudoColumn(this, ridKey));
                        consideredColumns[ridKey.colset.columns[0].name] = true;
                    }
                }

                //add the key
                if (!isEntry && this._context != _contexts.DETAILED ) {
                    var key = this._table._getRowDisplayKey(this._context);
                    if (key !== undefined && !nameExistsInTable(key.name, "display key")) {

                        columns = key.colset.columns;

                        // make sure key columns won't be added twice
                        var addedKey = false;
                        columns.forEach(function (col) {
                            if (col.name in consideredColumns) addedKey = true;
                        });

                        if (!addedKey) {
                            for (i = 0; i < columns.length; i++) {
                                consideredColumns[columns[i].name] = true;
                            }

                            // if the key is asset or asset filename, add the asset
                            if (key.simple && (columns[0].isAssetURL || columns[0].isAssetFilename)) {
                                addColumn(columns[0], undefined, undefined, true);
                            }
                            // otherwise just add the key pseudo-column
                            else {
                                resultColumns.push(new KeyPseudoColumn(this, key));
                            }
                        }
                    }
                }


                columns = this._table.columns.all();

                // if systemColumnsMode is defined, we have to change the order of system columns
                if (systemColumnsMode == true || Array.isArray(systemColumnsMode)) {

                    // if it's true: add all the system columns
                    var addedSystemColumnNames = _systemColumns, addedSystemColumns = [];

                    // if array: add the ones defined in array of config property (preserves order defined in `_systemColumns`)
                    if (Array.isArray(systemColumnsMode)) {
                        addedSystemColumnNames = _systemColumns.filter(function (col) {
                            return systemColumnsMode.indexOf(col) !== -1;
                        });
                    }

                    // turn column names to column objects
                    addedSystemColumns = [];
                    addedSystemColumnNames.forEach(function (cname) {
                        try {
                            col = refTable.columns.get(cname);
                            addedSystemColumns.push(col);
                        } catch (err) {
                            // fail silently (this means that the table doesn't have the system column)
                        }
                    });

                    // add system columns to the end of the list
                    columns = this._table.columns.all().filter(function (col) {
                        return _systemColumns.indexOf(col.name) === -1;
                    }).concat(addedSystemColumns);

                }


                for (i = 0; i < columns.length; i++) {
                    col = columns[i];

                    // avoid duplicate, or should be hidden
                    if (col.name in consideredColumns  || hideColumn(col)) {
                        continue;
                    }

                    // if column is serial and part of a simple key
                    if (col.type.name.toUpperCase().startsWith("SERIAL") &&
                        col.memberOfKeys.length === 1 && col.memberOfKeys[0].simple) {
                        continue;
                    }

                    // add the column if it's not part of any foreign keys
                    // or if the column type is array (currently ermrest doesn't suppor this either)
                    if (col.memberOfForeignKeys.length === 0) {
                        addColumn(col, undefined, undefined, true);
                    } else {
                        // sort foreign keys of a column
                        if (col.memberOfForeignKeys.length > 1) {
                            colFKs = col.memberOfForeignKeys.sort(function (a, b) {
                                // sort by constraint name to ensure we're getting a deterministic result
                                return a._constraintName.localeCompare(b._constraintName);
                            });
                        } else {
                            colFKs = col.memberOfForeignKeys;
                        }

                        for (j = 0; j < colFKs.length; j++) {
                            fk = colFKs[j];
                            fkName = fk.name;

                            // hide the origFKR or exists
                            if(hideFKR(fk)) continue;

                            if (fk.simple) { // simple FKR
                                if (!(fkName in consideredColumns) && !nameExistsInTable(fkName, fk._constraintName)) {
                                    consideredColumns[fkName] = true;
                                    resultColumns.push(new ForeignKeyPseudoColumn(this, fk));
                                }
                            } else { // composite FKR

                                // add the column if context is not entry and avoid duplicate
                                // don't add the column if it's also part of a simple fk
                                if (!isEntry && !col.isPartOfSimpleForeignKey && !(col.name in consideredColumns)) {
                                    consideredColumns[col.name] = true;
                                    addColumn(col, undefined, undefined, true);
                                }

                                if (!(fkName in consideredColumns) && !nameExistsInTable(fkName, fk._constraintName)) {
                                    consideredColumns[fkName] = true;
                                    // hold composite FKR
                                    compositeFKs.push(new ForeignKeyPseudoColumn(this, fk));
                                }
                            }
                        }
                    }

                    consideredColumns[col.name] = true;
                }

                // append composite FKRs
                for (i = 0; i < compositeFKs.length; i++) {
                    resultColumns.push(compositeFKs[i]);
                }

            }

            // If not in edit context i.e in read context remove the hidden columns which cannot be selected.
            if (!isEntry) {

                // Iterate over all reference columns
                for (i = 0; i < resultColumns.length; i++) {
                    refCol = resultColumns[i];
                    var isHidden = false;

                    // Iterate over the base columns. If any of them are hidden then hide the column
                    for (var k=0; k< refCol._baseCols.length; k++) {
                        if (refCol._baseCols[k].isHiddenPerACLs) {
                            isHidden = true;
                            break;
                        }
                    }

                    // If isHidden flag is true then remove the column at ith index
                    if (isHidden) {
                        resultColumns.splice(i, 1);
                        i--;
                    }
                }
            }

            if (!dontChangeReference) {
                this._referenceColumns = resultColumns;
            }
            return resultColumns;
        },

        /**
         * Generates the list of extra elements that hte page might need,
         * this should include
         * - requests: An array of the secondary request objects which inlcudes aggregates, entitysets, inline tables, and related tables.
         *   Depending on the type of request it can have different attibutes.
         *   - for aggregate, entitysets, uniquefilterd, and outboundFirst (in entry):
         *     {column: ERMrest.ReferenceColumn, <type>: true, objects: [{index: integer, column: boolean, related: boolean, inline: boolean, citation: boolean}]
         *     where the type is aggregate`, `entity`, `entityset`, or `firstOutbound`. Each object is capturing where in the page needs this pseudo-column.
         *   - for related and inline tables:
         *     {<type>: true, index: integer}
         *     where the type is `inline` or `related`.
         * - allOutBounds: the all-outbound foreign keys (added so we can later append to the url).
         *   ERMrest.ReferenceColumn[]
         * - selfLinks: the self-links (so it can be added to the template variables)
         *   ERMrest.KeyPseudoColumn[]
         *
         * TODO we might want to detect duplciates in allOutBounds better?
         * currently it's done based on name, but based on the path should be enough..
         * as long as it's entity the last column is useless...
         * the old code was kinda handling this by just adding the multi ones,
         * so if the fk definition is based on fkcolum and and not the RID, it would handle it.
         *
         * @param  {Tuple=} tuple
         * @return {Object}
         */
        generateActiveList: function (tuple) {

            // VARIABLES:
            var columns = [], allOutBounds = [], requests = [], selfLinks = [];
            const consideredUniqueFiltered = {}, consideredSets = {}, consideredOutbounds = {}, consideredAggregates = {}, consideredSelfLinks = {};
            const consideredEntryWaitFors = {};

            const sds = this.table.sourceDefinitions;

            // in detailed, we want related and citation
            const isDetailed = this._context === _contexts.DETAILED;
            // in entry, don't include waitfors in the activelist used for loading the page.
            // the waitfors will be used in chaise instead prior to submission.
            const isEntry = _isEntryContext(this._context);

            const COLUMN_TYPE = "column", RELATED_TYPE = "related",  CITATION_TYPE = "citation", INLINE_TYPE = "inline";

            // FUNCTIONS:
            var isInline = function (col) {
                return col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate);
            };

            var hasAggregate = function (col) {
                return col.hasWaitForAggregate || (col.isPathColumn && col.hasAggregate);
            };

            // col: the column that we need its data
            // isWaitFor: whether it was part of waitFor or just visible
            // type: where in the page it belongs to
            // index: the container index (column index, or related index) (optional)
            var addColToActiveList = function (col, isWaitFor, type, index) {
                var obj = {isWaitFor: isWaitFor};

                // add the type
                obj[type] = true;

                // add index if available (not available in citation)
                if (Number.isInteger(index)) {
                    obj.index = index;
                }

                if (isWaitFor && isEntry) {
                    if (col.name in consideredEntryWaitFors) {
                        requests[consideredEntryWaitFors[col.name]].objects.push(obj);
                        return;
                    }
                    consideredEntryWaitFors[col.name] = requests.length;
                    requests.push({firstOutbound: true, column: col, objects: [obj]});
                    return;
                }

                // unique filtered
                // TODO FILTER_IN_SOURCE chaise should use this type of column as well?
                // TODO FILTER_IN_SOURCE should be added to documentation as well
                if (col.isUniqueFiltered) {
                    // duplicate
                    if (col.name in consideredUniqueFiltered) {
                        requests[consideredUniqueFiltered[col.name]].objects.push(obj);
                        return;
                    }

                    // new
                    consideredUniqueFiltered[col.name] = requests.length;
                    requests.push({entity: true, column: col, objects: [obj]});
                    return;
                }

                // aggregates
                if (col.isPathColumn && col.hasAggregate) {
                    // duplicate
                    if (col.name in consideredAggregates) {
                        requests[consideredAggregates[col.name]].objects.push(obj);
                        return;
                    }

                    // new
                    consideredAggregates[col.name] = requests.length;
                    requests.push({aggregate: true, column: col, objects: [obj]});
                    return;
                }

                //entitysets
                if (isInline(col)) {
                    if (!isDetailed) {
                        return; // only acceptable in detailed
                    }

                    if (col.name in consideredSets) {
                        requests[consideredSets[col.name]].objects.push(obj);
                        return;
                    }

                    consideredSets[col.name] = requests.length;
                    requests.push({entityset: true, column: col, objects: [obj]});
                }

                // all outbounds
                if (col.isForeignKey || (col.isPathColumn && col.hasPath && col.isUnique && !col.hasAggregate)) {
                    if (col.name in consideredOutbounds) return;
                    consideredOutbounds[col.name] = true;
                    allOutBounds.push(col);
                }

                // self-links
                if (col.isKey) {
                    if (col.name in consideredSelfLinks) return;
                    consideredSelfLinks[col.name] = true;
                    selfLinks.push(col);
                }
            };

            var addInlineColumn = function (col, i) {
                if (isInline(col)) {
                    requests.push({inline: true, index: i});
                } else {
                    addColToActiveList(col, false, COLUMN_TYPE, i);
                }

                col.waitFor.forEach(function (wf) {
                    addColToActiveList(wf, true, (isInline(col) ? INLINE_TYPE : COLUMN_TYPE), i);
                });
            };

            // THE CODE STARTS HERE:
            columns = this.generateColumnsList(tuple);

            // citation
            if (isDetailed && this.citation) {
                this.citation.waitFor.forEach((col) => {
                    addColToActiveList(col, true, CITATION_TYPE);
                });
            }

            // columns without aggregate
            columns.forEach((col, i) => {
                if (!hasAggregate(col)) {
                    addInlineColumn(col, i);
                }
            });

            // columns with aggregate
            columns.forEach((col, i) => {
                if (hasAggregate(col)) {
                    addInlineColumn(col, i);
                }
            });

            // related tables
            if (isDetailed) {
                this.generateRelatedList(tuple).forEach((rel, i) => {
                    requests.push({related: true, index: i});

                    if (rel.pseudoColumn) {
                        rel.pseudoColumn.waitFor.forEach((wf) => {
                            addColToActiveList(wf, true, RELATED_TYPE, i);
                        });
                    }
                });
            }

            //fkeys
            sds.fkeys.forEach((fk) => {
                if (fk.name in consideredOutbounds) return;
                consideredOutbounds[fk.name] = true;
                allOutBounds.push(new ForeignKeyPseudoColumn(this, fk));
            });

            this._activeList = {
                requests: requests,
                allOutBounds: allOutBounds,
                selfLinks: selfLinks
            };

            return this._activeList;
        },

        get activeList() {
            if (this._activeList === undefined) {
                this.generateActiveList();
            }
            return this._activeList;
        },

        /**
         * If annotation is defined and has the required attributes, will return
         * a Citation object that can be used to generate citation.
         * NOTE I had to move this here because activeList is using this before read,
         * to get the all-outbound foreignkeys which might be in the waitfor of citation annotation
         * In the future we might also want to generate citation based on page and not necessarily tuple.
         * @type {Citation}
         */
        get citation() {
            if (this._citation === undefined) {
                var table = this.table;
                if (!table.annotations.contains(_annotations.CITATION)) {
                    this._citation = null;
                } else {
                    var citationAnno = table.annotations.get(_annotations.CITATION).content;
                    if (!citationAnno.journal_pattern || !citationAnno.year_pattern || !citationAnno.url_pattern) {
                        this._citation = null;
                    } else {
                        this._citation = new Citation(this, citationAnno);
                    }
                }
            }
            return this._citation;
        },

        /**
         * If annotation is defined and has the required attributes, will return
         * a Metadata object
         * @type {GoogleDatasetMetadata}
         */
        get googleDatasetMetadata() {
            if (this._googleDatasetMetadata === undefined) {
                var table = this.table;
                if (!table.annotations.contains(_annotations.GOOGLE_DATASET_METADATA)) {
                    this._googleDatasetMetadata = null;
                } else {
                    var metadataAnnotation = _getRecursiveAnnotationValue(this._context, this._table.annotations.get(_annotations.GOOGLE_DATASET_METADATA).content);
                    if (!isObjectAndNotNull(metadataAnnotation) || !isObjectAndNotNull(metadataAnnotation.dataset)) {
                        this._googleDatasetMetadata = null;
                    } else {
                        this._googleDatasetMetadata = new GoogleDatasetMetadata(this, metadataAnnotation);
                    }
                }
            }
            return this._googleDatasetMetadata;
        },

        /**
         * The related reference or tables that might be deleted as a result of deleting the current table.
         * @type {Object[]}
         */
        get cascadingDeletedItems () {
            if (this._cascadingDeletedItems === undefined) {
                var self = this, res = [], consideredFKs = {};
                var detailedRef = (self._context === _contexts.DETAILED) ? self : self.contextualize.detailed;

                // inline tables
                detailedRef.columns.forEach(function (col) {
                    if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
                        // col.foreignKey is available for non-source syntax, while the other one is used for source syntax
                        var fk;
                        if (col.foreignKey) {
                            fk = col.foreignKey;
                        } else if (col.firstForeignKeyNode) {
                            fk = col.firstForeignKeyNode.nodeObject;
                        }
                        // this check is not needed and only added for sanity check
                        if (!fk) return;
                        consideredFKs[fk.name] = 1;
                        if (fk.onDeleteCascade) {
                            res.push(col.reference);
                        }
                    }
                });

                // related tables
                detailedRef.related.forEach(function (ref) {
                    // col.origFKR is available for non-source syntax, while the other one is used for source syntax
                    var fk;
                    if (ref.origFKR) {
                        fk = ref.origFKR;
                    } else if (ref.pseudoColumn && ref.pseudoColumn.firstForeignKeyNode) {
                        fk = ref.pseudoColumn.firstForeignKeyNode.nodeObject;
                    }
                    // this check is not needed and only added for sanity check
                    if (!fk) return;
                    consideredFKs[fk.name] = 1;
                    if (fk.onDeleteCascade) {
                        res.push(ref);
                    }
                });

                // list the tables that are not added yet
                self.table.referredBy.all().forEach(function (fk) {
                    if ((fk.name in consideredFKs) || !fk.onDeleteCascade) return;

                    res.push(fk.table);
                });

                self._cascadingDeletedItems = res;
            }

            return this._cascadingDeletedItems;
        },

        /**
         * If prefill object is defined and has the required attributes, will return
         * a BulkCreateForeignKeyObject object with the necessary objects used for a association modal picker
         *
         * @type {BulkCreateForeignKeyObject}
         */
        get bulkCreateForeignKeyObject() {
            if (this._bulkCreateForeignKeyObject === undefined) {
                this._bulkCreateForeignKeyObject = null;
            }
            return this._bulkCreateForeignKeyObject;
        },

        /**
         * Will compute and return a BulkCreateForeignKeyObject if:
         *   - the prefillObject is defined
         *   - there are only 2 foreign key columns for this table that are not system columns
         *   - using the prefill object, we can determine the main column for prefilling and leaf column for bulk selection
         *
         * @param {Object} prefillObject computed prefill object from chaise
         * @returns {BulkCreateForeignKeyObject}
         */
        computeBulkCreateForeignKeyObject: function (prefillObject) {
            if (this._bulkCreateForeignKeyObject === undefined) {
                var self = this;

                if (!prefillObject) {
                    this._bulkCreateForeignKeyObject = null;
                } else {
                    // ignore the fks that are simple and their constituent column is system col
                    var nonSystemColumnFks = this.table.foreignKeys.all().filter(function(fk) {
                        return !(fk.simple && _systemColumns.indexOf(fk.colset.columns[0]) !== -1);
                    });

                    // set of foreignkey columns (they might be overlapping so we're not using array)
                    var fkCols = {};
                    nonSystemColumnFks.forEach(function(fk) {
                        fk.colset.columns.forEach(function(col) {
                            fkCols[col] = true;
                        });
                    });

                    var mainColumn = null;
                    // find main column in the visible columns list
                    for (var k = 0; k < self.columns.length; k++) {
                        var column = self.columns[k];
                        // column should be a foreignkey pseudo column
                        if (!column.isForeignKey) continue;
                        if (prefillObject.fkColumnNames.indexOf(column.name) !== -1) {
                            // mainColumn is the column being prefilled, this should ALWAYS be in the visible columns list
                            mainColumn = column;
                            break;
                        }
                    }

                    /**
                     * Using the given constraintName, determines the leaf column to be used for bulk foreign key create from the annotation value.
                     * If no constraintName is provided, uses the other foreign key found on the table as the leaf
                     *   NOTE: when no constraintName, this is only called if there are 2 foreign keys and we know the main column
                     *
                     * @param {string[][] | string[]} constraintNameProp constraint name of the foreingkey from annotation or array of constraint names
                     * @returns BulkCreateForeignKeyObject if leaf column can be found, null otherwise
                     */
                    var findLeafColumnAndSetBulkCreate = function(constraintNameProp) {
                        /**
                         *
                         * @param {ERMRest.Column} col foreign key column to check if it's in the list of visible columns and matches the constraint name
                         * @param {string[]} constraintName
                         * @returns the foreign key column that represents the leaf table
                         */
                        var findLeafColumn = function(col, constraintName) {
                            var foundColumn = null;

                            for (k = 0; k < nonSystemColumnFks.length; k++) {
                                var fk = nonSystemColumnFks[k];
                                // make sure column is in visible columns and is in foreign key list
                                // column and foreign key `.name` property is a hash value
                                if (col.name === fk.name) {
                                    if (constraintName && constraintName === col._constraintName) {
                                        // use the constraint name to check each column and ensure it's the one we want from annotation
                                        foundColumn = col;
                                    } else if (!constraintName && col.name !== mainColumn.name) {
                                        // make sure the current column is the NOT the main column
                                        // assume there are only 2 foreign keys and we know mainColumn already
                                        foundColumn = col;
                                    }

                                    if (foundColumn) break;
                                }
                            }

                            return foundColumn;
                        };

                        var leafCol = null;
                        // use for loop so we can break if we find the leaf column
                        for (let i = 0; i < self.columns.length; i++) {
                            var column = self.columns[i];

                            // column should be a simple foreignkey pseudo column
                            // return if it's not a foreign key or the column is a foreign key but it's not simple
                            if (!column.isForeignKey || !column.foreignKey.simple) continue;

                            // if constraintNameProp is string[][], it's from bulk_create_foreign_key_candidates
                            // we need to iterate over the set to find the first matching column
                            if (Array.isArray(constraintNameProp) && Array.isArray(constraintNameProp[0])) {
                                for (let j = 0; j < constraintNameProp.length; j++) {
                                    var name = constraintNameProp[j];
                                    if (_isValidForeignKeyName(name)) leafCol = findLeafColumn(column, name.join("_"));

                                    if (leafCol) break;
                                }
                            } else if (Array.isArray(constraintNameProp)) {
                                // constraintNameProp should be a string[]
                                leafCol = findLeafColumn(column, constraintNameProp.join("_"));
                            } else {
                                // no constraintName
                                leafCol = findLeafColumn(column);
                            }

                            if (leafCol) break;
                        }

                        if (!leafCol) return null;
                        return new BulkCreateForeignKeyObject(self, prefillObject, fkCols, mainColumn, leafCol);
                    };

                    if (!mainColumn) {
                        // if no mainColumn, this API can't be used
                        this._bulkCreateForeignKeyObject = null;
                    } else if (mainColumn.display.bulkForeignKeyCreateConstraintName === false) {
                        // don't use heuristics
                        this._bulkCreateForeignKeyObject = null;
                    } else if (mainColumn.display.bulkForeignKeyCreateConstraintName) {
                        // see if the leaf column to use is determined by an annotation by setting `true`
                        // if a leaf column is determined, call BulkCreateForeignKeyObject constructor and set the generated value
                        this._bulkCreateForeignKeyObject = findLeafColumnAndSetBulkCreate(mainColumn.display.bulkForeignKeyCreateConstraintName);
                    } else {
                        // use heuristics instead
                        // There have to be 2 foreign key columns
                        if (nonSystemColumnFks.length !== 2 ) {
                            this._bulkCreateForeignKeyObject = null;
                        } else {
                            // both foreign keys have to be simple
                            if (!nonSystemColumnFks[0].simple || !nonSystemColumnFks[1].simple) {
                                this._bulkCreateForeignKeyObject = null;
                            } else {
                                // leafColumn will be set no matter what since the check above ensures there are 2 FK columns
                                this._bulkCreateForeignKeyObject = findLeafColumnAndSetBulkCreate();
                            }
                        }
                    }
                }
            }
            return this._bulkCreateForeignKeyObject;
        },

        /**
         * Generate a related reference given a foreign key and tuple.
         * TODO SHOULD BE REFACTORED AS A TYPE OF REFERENCE
         *
         * This is the logic:
         *
         * 0. keep track of the linkage and save some attributes:
         *      0.1 origFKR: the foreign key that created this related reference (used in chaise for autofill)
         *      0.3 mainTuple: the tuple used to generate the related references (might be undefined)
         *      0.4 compressedDataSource: the compressed source path from the main to the related table (might be undefined)
         *
         * 1. If it's pure and binary association. (current reference: T1) <-F1-(A)-F2-> (T2)
         *      1.1 displayname: F2.to_name or A.displayname
         *      1.2 comment and comment_display: F2.to_comment or A.comment
         *      1.3 table: T2
         *      1.4 derivedAssociationReference: points to the association table (A)
         *      1.5 location (uri):
         *          2.1.4.1 Uses the linkage to get to the T2.
         *          2.1.4.2 if tuple was given, it will use the value of shortestKey to create the facet
         * 2. Otherwise.
         *      2.1 displayname: F1.from_name or T2.displayname
         *      2.2 comment: F1.from_comment or T2.comment
         *      2.3 table: T2
         *      2.4 location (uri):
         *          2.3.1 Uses the linkage to get to the T2.
         *          2.3.2 if tuple was given, it will use the value of shortestKey to create the facet
         *
         *
         * @param  {ForeignKeyRef} fkr the relationship between these two reference (this fkr must be from another table to the current table)
         * @param  {Tuple=} tuple the current tuple
         * @param  {boolean} checkForAlternative if it's true, checks p&b association too.
         * @param  {Object=} sourceObject The object that defines the fkr
         * @return {Reference}  a reference which is related to current reference with the given fkr
         * @private
         */
        _generateRelatedReference: function (fkr, tuple, checkForAssociation, sourceObjectWrapper) {
            var i, j, sn, col, uri, filterSource = [], dataSource = [], obj;

            var useFaceting = isObjectAndNotNull(tuple);

            var sourceObject;
            if (sourceObjectWrapper) {
                sourceObject = sourceObjectWrapper.sourceObject;
            }

            var catalog = this.table.schema.catalog;

            var newRef = _referenceCopy(this);
            delete newRef._context; // NOTE: related reference is not contextualized
            delete newRef._related;
            delete newRef._referenceColumns;
            delete newRef._activeList;
            delete newRef._facetColumns;
            delete newRef.derivedAssociationReference;
            delete newRef._display;
            // if we call .related on a related reference, then this might already be populated and we should just remove it
            // TODO this feels very hacky. if we rewrite the logic to use proper classes, then this wouldn't be needed.
            delete newRef.pseudoColumn;

            // delete permissions
            delete newRef._canCreate;
            delete newRef._canRead;
            delete newRef._canUpdate;
            delete newRef._canDelete;

            // the foreignkey that has created this link (link from this.reference to relatedReference)
            newRef.origFKR = fkr; // it will be used to trace back the reference

            // TODO should be removed (not needed anymore)
            newRef.origColumnName = _sourceColumnHelpers.generateForeignKeyName(fkr);

            // the tuple of the main table
            newRef.mainTuple = (typeof tuple === 'object') ? tuple : undefined;

            // the main table
            newRef.mainTable = this.table;

            var comment, commentDisplayMode, commentRenderMarkdown, tableDisplay, fkDisplay;

            dataSource.push({"inbound": fkr.constraint_names[0]});

            var fkrTable = fkr.colset.columns[0].table;

            var display;
            if (checkForAssociation && fkrTable.isPureBinaryAssociation) { // Association Table

                // find the other foreignkey
                var otherFK, pureBinaryFKs = fkrTable.pureBinaryForeignKeys, assocTable;
                for (j = 0; j < pureBinaryFKs.length; j++) {
                    if(pureBinaryFKs[j] !== fkr) {
                        otherFK = pureBinaryFKs[j];
                        break;
                    }
                }

                newRef._table = otherFK.key.table;
                newRef._shortestKey = newRef._table.shortestKey;

                assocTable = otherFK.colset.columns[0].table;

                // all the display settings must come from the same table (assoc table)
                // so if we get the comment from assoc table, displayname must also be from assoc table
                fkDisplay = otherFK.getDisplay(this._context);
                tableDisplay = assocTable.getDisplay(this._context);

                // displayname
                if (fkDisplay.toName) {
                    newRef._displayname = {"isHTML": false, "value": fkDisplay.toName, "unformatted": fkDisplay.toName};
                } else {
                    newRef._displayname = assocTable.displayname;
                }

                // comment
                if (fkDisplay.toComment) {
                    comment = fkDisplay.toComment.unformatted;
                } else {
                    comment = tableDisplay.comment ? tableDisplay.comment.unformatted : null;
                }
                if (_isValidModelCommentDisplay(fkDisplay.toCommentDisplayMode)) {
                    commentDisplayMode = fkDisplay.toCommentDisplayMode;
                } else {
                    commentDisplayMode = tableDisplay.tableCommentDisplayMode;
                }
                if (typeof fkDisplay.commentRenderMarkdown === 'boolean') {
                    commentRenderMarkdown = fkDisplay.commentRenderMarkdown;
                } else {
                    commentRenderMarkdown = tableDisplay.commentRenderMarkdown;
                }

                // uri and location
                if (!useFaceting) {
                    newRef._location = parse(this._location.compactUri + "/" + fkr.toString() + "/" + otherFK.toString(true), catalog);
                    newRef._location.referenceObject = newRef;
                }


                // additional values for sorting related references
                newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                newRef._related_fk_column_positions = otherFK.colset._getColumnPositions();

                // will be used to determine whether this related reference is derived from association relation or not
                newRef.derivedAssociationReference = new Reference(parse(this._location.compactUri + "/" + fkr.toString()), catalog);
                newRef.derivedAssociationReference.origFKR = newRef.origFKR;
                newRef.derivedAssociationReference.associationToRelatedFKR = otherFK;

                // build the filter source (the alias is used in the read function to get the proper acls)
                filterSource.push({"inbound": otherFK.constraint_names[0], "alias": _parserAliases.ASSOCIATION_TABLE});

                // buld the data source
                dataSource.push({"outbound": otherFK.constraint_names[0]});
            } else { // Simple inbound Table
                newRef._table = fkrTable;
                newRef._shortestKey = newRef._table.shortestKey;

                fkDisplay = fkr.getDisplay(this._context);
                tableDisplay = newRef._table.getDisplay(this._context);

                // displayname
                if (fkDisplay.fromName) {
                    newRef._displayname = {"isHTML": false, "value": fkDisplay.fromName, "unformatted": fkDisplay.fromName};
                } else {
                    newRef._displayname = newRef._table.displayname;
                }

                // comment
                if (fkDisplay.fromComment) {
                    comment = fkDisplay.fromComment.unformatted;
                } else {
                    comment = tableDisplay.comment ? tableDisplay.comment.unformatted : null;
                }
                if (_isValidModelCommentDisplay(fkDisplay.fromCommentDisplayMode)) {
                    commentDisplayMode = fkDisplay.fromCommentDisplayMode;
                } else {
                    commentDisplayMode = tableDisplay.tableCommentDisplayMode;
                }
                if (typeof fkDisplay.commentRenderMarkdown === 'boolean') {
                    commentRenderMarkdown = fkDisplay.commentRenderMarkdown;
                } else {
                    commentRenderMarkdown = tableDisplay.commentRenderMarkdown;
                }

                // uri and location
                if (!useFaceting) {
                    newRef._location = parse(this._location.compactUri + "/" + fkr.toString(), catalog);
                    newRef._location.referenceObject = newRef;
                }

                // additional values for sorting related references
                newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                newRef._related_fk_column_positions = fkr.colset._getColumnPositions();
            }

            // if markdown_name in source object is defined
            if (sourceObject && sourceObject.markdown_name) {
                newRef._displayname = {
                    "value": renderMarkdown(sourceObject.markdown_name, true),
                    "unformatted": sourceObject.markdown_name,
                    "isHTML": true
                };
            }

            if (sourceObject && sourceObject.source) {
                dataSource = sourceObject.source;
            } else if (newRef._table.shortestKey.length === 1) {
                dataSource = dataSource.concat(newRef._table.shortestKey[0].name);
            }

            newRef._comment = _processSourceObjectComment(sourceObject, comment, commentRenderMarkdown, commentDisplayMode);

            // attach the compressedDataSource
            newRef.compressedDataSource = _compressSource(dataSource);

            // complete the path
            filterSource.push({"outbound": fkr.constraint_names[0]});

            if (useFaceting) {
                var table = newRef._table, facets;
                newRef._location = parse([
                    catalog.server.uri ,"catalog" ,
                    catalog.id, "entity",
                    fixedEncodeURIComponent(table.schema.name) + ":" + fixedEncodeURIComponent(table.name)
                ].join("/"), catalog);
                newRef._location.referenceObject = newRef;

                // if the sourceObjectWrapper is passed, filter source is reverse of that.
                // NOTE the related table might have filters, that's why we have to do this and cannot
                // just rely on the structure
                if (isObjectAndNotNull(sourceObjectWrapper)) {
                    var addAlias = checkForAssociation && fkrTable.isPureBinaryAssociation;
                    facets = sourceObjectWrapper.getReverseAsFacet(tuple, fkr.key.table, addAlias ? _parserAliases.ASSOCIATION_TABLE : "");
                } else {
                    //filters
                    var filters = [], filter;
                    fkr.key.table.shortestKey.forEach(function (col) {
                        filter = {
                            source: filterSource.concat(col.name)
                        };
                        filter[_facetFilterTypes.CHOICE] = [tuple.data[col.name]];
                        filters.push(filter);
                    });

                    facets = {"and": filters};
                }

                // the facets are basd on the value of shortest key of current table
                newRef._location.facets = facets;

            }

            return newRef;
        },

        _generateContextHeader: function (contextHeaderParams, page_size) {
            if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                contextHeaderParams = {};
            }

            for (var key in this.defaultLogInfo) {
                // only add the values that are not defined.
                if (key in contextHeaderParams) continue;
                contextHeaderParams[key] = this.defaultLogInfo[key];
            }

            var headers = {};
            headers[contextHeaderName] = contextHeaderParams;
            return headers;
        },

        /**
         * The actual path that will be used for read request.
         *  It will return an object that will have:
         *   - value: the string value of the path
         *   - isAttributeGroup: whether we should use attributegroup api or not.
         *                       (if the reference doesn't have any fks, we don't need to use attributegroup)
         * NOTE Might throw an error if modifiers are not valid
         * @param {Boolean} useEntity whether we should use entity api or not (if true, we won't get foreignkey data)
         * @param {Boolean} getTRS whether we should fetch the table-level row acls (if table supports it)
         * @param {Boolean} getTCRS whether we should fetch the table-level and column-level row acls (if table supports it)
         * @param {Boolean} getUnlinkTRS whether we should fetch the acls of association
         *                  table. Use this only if the association is based on facet syntax
         *
         * TODO we might want to add an option to only do TCRS or TRS without the foreignkeys for later
         * @type {Object}
         */
         _getReadPath: function(useEntity, getTRS, getTCRS, getUnlinkTRS) {
            var allOutBounds = this.activeList.allOutBounds;
            var findAllOutBoundIndex = function (name) {
                return allOutBounds.findIndex(function (aob) {
                    return aob.name === name;
                });
            };
            var hasSort = Array.isArray(this._location.sortObject) && (this._location.sortObject.length !== 0),
                locationPath = this.location.path,
                fkAliasPreix = _parserAliases.FOREIGN_KEY_PREFIX,
                allOutBoundUsedAliases = [],
                _modifiedSortObject = [], // the sort object that is used for url creation (if location has sort).
                allOutBoundSortMap = {}, // maps an alias to PseudoColumn, used for sorting
                sortObject,  // the sort that will be accessible by this._location.sortObject
                sortColNames = {}, // to avoid adding duplciate columns
                sortObjectNames = {}, // to avoid computing sortObject logic more than once
                addSort,
                hasFKSort = false,
                sortCols,
                col, i, j, k, l;

            // make sure the page and modified sort object have teh same length
            var checkPageObject = function (loc, sortObject) {
                sortObject = sortObject || loc.sortObject;
                if (loc.afterObject && loc.afterObject.length !== sortObject.length) {
                    throw new InvalidPageCriteria("sort and after should have the same number of columns.", locationPath);
                }

                if (loc.beforeObject && loc.beforeObject.length !== sortObject.length) {
                    throw new InvalidPageCriteria("sort and before should have the same number of columns.", locationPath);
                }

                return true;
            };

            /** Check the sort object. Does not change the `this._location` object.
             *   - Throws an error if the column doesn't exist or is not sortable.
             *   - maps the sorting to its sort columns.
             *       - for columns it's straighforward and uses the actual column name.
             *       - for PseudoColumns we need
             *           - A new alias: F# where the # is a positive integer.
             *           - The sort column name must be the "foreignkey_alias:column_name".
             * */
            var processSortObject= function (self) {
                var colName, desc;

                for (i = 0, k = 1; i < sortObject.length; i++) {
                    // find the column in ReferenceColumns
                    try {
                        col = self.getColumnByName(sortObject[i].column);
                    } catch (e) {
                        throw new InvalidSortCriteria("Given column name `" + sortObject[i].column + "` in sort is not valid.",  locationPath);
                    }
                    // sortObject[i].column = col.name;

                    // column is not sortable
                    if (!col.sortable) {
                        throw new InvalidSortCriteria("Column " + sortObject[i].column + " is not sortable.",  locationPath);
                    }

                    // avoid computing columns twice
                    if (sortObject[i].column in sortObjectNames) {
                        continue;
                    }
                    sortObjectNames[sortObject[i].column] = true;
                    addSort = true;

                    sortCols = col._sortColumns;

                    // use the sort columns instead of the actual column.
                    for (j = 0; j < sortCols.length; j++) {
                        if (col.isForeignKey || (col.isPathColumn && col.isUnique)) {
                            // TODO if the code asks for entity read,
                            // we should make sure only include the ones that are needed
                            // for sort, but currently we're just switching to attributegroup
                            hasFKSort = true;

                            // the column must be part of outbounds, so we don't need to check for it
                            // NOTE what about the backward compatibility code?
                            const fkIndex = findAllOutBoundIndex(col.name);
                            // create a new projection alias to be used for this sort column
                            colName = fkAliasPreix + (allOutBounds.length + k++);
                            // store the actual column name and foreignkey info for later
                            // the alias used for the fk might be different from what we expect now
                            // (because of the shared prefix code)
                            allOutBoundSortMap[colName] = {
                                fkIndex: fkIndex,
                                colName: fixedEncodeURIComponent(sortCols[j].column.name)
                            };
                        } else {
                            colName = sortCols[j].column.name;
                            if (colName in sortColNames) {
                                addSort = false;
                            }
                            sortColNames[colName] = true;
                        }

                        desc = sortObject[i].descending !== undefined ? sortObject[i].descending : false;
                        // if descending is true on the column_order, then the sort should be reverted
                        if (sortCols[j].descending) {
                            desc = !desc;
                        }

                        if (addSort) {
                            _modifiedSortObject.push({
                                "column": colName,
                                "descending": desc
                            });
                        }
                     }
                }
            };

            if (hasSort) {
                sortObject = this._location.sortObject;
                processSortObject(this);
            }
            // use row-order if sort was not provided
            else if (this.display._rowOrder){
                sortObject = this.display._rowOrder.map(function (ro) {
                    return {"column": ro.column.name, "descending": ro.descending};
                });
                processSortObject(this);
            }

            // ermrest requires key columns to be in sort param for paging
            if (typeof sortObject !== 'undefined') {
                // if any of the sortCols is a key, then we don't neede to add the shortest key
                var hasKey = this._table.keys.all().some(function (key) {
                    // all the columns in the key must be not-null
                    return key._notNull && key.colset.columns.every(function(c) {
                        return (c.name in sortColNames);
                    });
                });

                if (!hasKey) {
                    for (i = 0; i < this._shortestKey.length; i++) { // all the key columns
                        col = this._shortestKey[i].name;
                        // add if key col is not in the sortby list
                        if (!(col in sortColNames)) {
                            sortObject.push({"column": col, "descending":false}); // add key to sort
                            _modifiedSortObject.push({"column": col, "descending":false});
                        }
                    }
                }
            } else { // no sort provieded: use shortest key for sort
                sortObject = [];
                for (var sk = 0; sk < this._shortestKey.length; sk++) {
                    col = this._shortestKey[sk];
                    // make sure the column is sortable based on model
                    if (_nonSortableTypes.indexOf(col.type.name) === -1) {
                        sortObject.push({"column":col.name, "descending":false});
                    }
                }
            }

            // this will update location.sort and all the uri and path
            this._location.sortObject = sortObject;

            var uri = this._location.ermrestCompactPath; // used for the http request

            var associatonRef = this.derivedAssociationReference;
            var associationTableAlias = _parserAliases.ASSOCIATION_TABLE;

            var isAttributeGroup = hasFKSort || !useEntity;
            if (isAttributeGroup) {
                isAttributeGroup = allOutBounds.length > 0 ||
                                   (getTCRS && this.canUseTCRS) ||
                                   ((getTCRS || getTRS) && this.canUseTRS) ||
                                   (getUnlinkTRS && associatonRef && associatonRef.canUseTRS);
            }

            /** Change api to attributegroup for retrieving extra information
             * These information include:
             * - Values for the foreignkeys.
             * - Value for one-to-one pseudo-columns. These are the columns
             * that their defined path is all in the outbound direction.
             * - trs or tcrs of main table (if asked for, supported, and needed)
             * - trs of the associaton table for unlink feature (if asked for, supported, and needed)
             *
             * This will just affect the http request and not this._location
             *
             * NOTE:
             * This piece of code is dependent on the same assumptions as the current parser, which are:
             *   0. There is no table called `A`, `T`, `M`, `F1`, `F2`, ...
             *   1. There is no alias in url (more precisely `tcrs`, `trs`, `A_trs`, `A`, `T`, `M`, `F1`, `F2`, `F3`, ...)
             *   2. Filter comes before the link syntax.
             *   3. There is no trailing `/` in uri (as it will break the ermrest too).
             * */
            if (isAttributeGroup) {
                var attrGroupPros = this._readAttributeGroupPathProps;
                var compactPath = attrGroupPros.path,
                    // to ensure we're not modifying the original object, I'm creating a deep copy
                    pathPrefixAliasMapping = JSON.parse(JSON.stringify(attrGroupPros.pathPrefixAliasMapping)),
                    mainTableAlias = this._location.mainTableAlias,
                    aggList = [],
                    sortColumn,
                    addedCols,
                    aggFn = "array_d",
                    allOutBound,
                    pseudoPathRes,
                    rightSummFn;

                // generate the projection for given pseudo column
                var getPseudoPath = function (l, outAlias) {
                    var sourcekey = "";

                    if (isObjectAndNotNull(allOutBounds[l].sourceObject) && isStringAndNotEmpty(allOutBounds[l].sourceObject.sourcekey)) {
                        sourcekey = allOutBounds[l].sourceObject.sourcekey;
                    }

                    return _sourceColumnHelpers.parseAllOutBoundNodes(
                        allOutBounds[l].sourceObjectNodes,
                        allOutBounds[l].lastForeignKeyNode,
                        allOutBounds[l].foreignKeyPathLength,
                        sourcekey,
                        pathPrefixAliasMapping,
                        mainTableAlias,
                        outAlias
                    );
                };

                // see if any of the fks are using prefix

                // create the uri with attributegroup and alias
                uri = compactPath + "/";

                // add all the allOutBounds
                for (k = allOutBounds.length - 1; k >= 0; k--) {
                    allOutBound = allOutBounds[k];
                    pseudoPathRes = getPseudoPath(k, fkAliasPreix + (k+1));
                    // capture the used aliases (used in sorting)
                    allOutBoundUsedAliases[k] = pseudoPathRes.usedOutAlias;

                    // TODO could be improved by adding $M to the begining?
                    // if the result is just the alias, we don't need to add it at all
                    if (pseudoPathRes.path != ("$" + pseudoPathRes.usedOutAlias)) {
                        //F2:=left(id)=(s:t:c)/$M/F1:=left(id2)=(s1:t1:c1)/$M/
                        uri += pseudoPathRes.path + "/$" + mainTableAlias + "/";
                    }

                    // entity mode: F2:array_d(F2:*),F1:array_d(F1:*)
                    // scalar mode: F2:=F2:col,F1:=F1:col
                    if (allOutBound.isPathColumn && allOutBound.canUseScalarProjection) {
                        aggList.push(fkAliasPreix + (k+1) + ":=" + pseudoPathRes.usedOutAlias + ":" + fixedEncodeURIComponent(allOutBound.baseColumn.name));
                    } else {
                        aggList.push(fkAliasPreix + (k+1) + ":=" + aggFn + "(" + pseudoPathRes.usedOutAlias + ":*)");
                    }
                }

                // add trs or tcrs for main table
                if (getTCRS && this.canUseTCRS) {
                    rightSummFn = _ERMrestFeatures.TABLE_COL_RIGHTS_SUMMARY;
                    aggList.push(rightSummFn + ":=" + rightSummFn + "(" + mainTableAlias + ":RID" + ")");
                }
                else if ((getTCRS || getTRS) && this.canUseTRS) {
                    rightSummFn = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
                    aggList.push(rightSummFn + ":=" + rightSummFn + "(" + mainTableAlias + ":RID" + ")");
                }

                // add trs for the association table
                // TODO feels hacky! this is assuming that the alias exists
                if (getUnlinkTRS && associatonRef && associatonRef.canUseTRS) {
                    rightSummFn = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY;
                    aggList.push(associationTableAlias + "_" + rightSummFn + ":=" + rightSummFn + "(" + associationTableAlias + ":RID" + ")");
                }

                // add sort columns (it will include the key)
                if (hasSort) {
                    sortCols = _modifiedSortObject.map(function(sort) {return sort.column;});
                } else {
                    sortCols = sortObject.map(function(sort) {return sort.column;});
                }

                addedCols = {};
                for(k = 0; k < sortCols.length; k++) {
                    if (sortCols[k] in allOutBoundSortMap) {
                        var allOutBoundSortMapInfo = allOutBoundSortMap[sortCols[k]];
                        // the sortCols[k] is an alias that we assigned before
                        // this will be in format of: <new-alias>:=<fk-alias>:<col-name>
                        // so for example: F10:=F1:name
                        sortColumn = sortCols[k] + ":=" +
                                     allOutBoundUsedAliases[allOutBoundSortMapInfo.fkIndex] + ":" + allOutBoundSortMapInfo.colName;
                    } else {
                        sortColumn = fixedEncodeURIComponent(sortCols[k]);
                    }

                    // don't add duplicate columns
                    if (!(sortColumn in addedCols)) {
                        addedCols[sortColumn] = 1;
                    }
                }

                uri += Object.keys(addedCols).join(",") + ";" + mainTableAlias + ":=" + aggFn + "(" + mainTableAlias + ":*)," + aggList.join(",");
            }

            // insert @sort()
            if (hasSort) { // then we have modified the sort
                // if sort is modified, we should use the modified sort Object for uri,
                // and the actual sort object for this._location.sortObject
                this._location.sortObject = _modifiedSortObject; // this will change the this._location.sort
                uri = uri + this._location.sort;

                this._location.sortObject = sortObject;
            } else if (this._location.sort) { // still there will be sort (shortestkey)
                uri = uri + this._location.sort;
            }

            // check that page object is valid
            checkPageObject(this._location, hasSort ? _modifiedSortObject : null);


            // insert paging
            if (this._location.paging) {
                uri = uri + this._location.paging;
            }

            return {value: uri, isAttributeGroup: isAttributeGroup};
        }
    };

    /**
     * This is a private function that makes a copy of a reference object.
     * @memberof ERMrest
     * @param {!ERMrest.Reference} source The source reference to be copied.
     * @returns {Reference} The copy of the reference object.
     * @private
     */
    export function _referenceCopy(source) {
        var referenceCopy = Object.create(Reference.prototype);
        // referenceCopy must be defined before _clone can copy values from source to referenceCopy
        shallowCopy(referenceCopy, source);

        /*
         * NOTE In the following whenever I say "reference" I mean ERMrest.Reference. other references
         * just mean actual reference to the memory.
         * the "reference" copy is doing a shallow copy, so all the references in
         * the object is going to stay in tact and still refer to the original object. Therefore, we should
         * delete any property that can be generated later (has a getter), just to make sure it's not
         * going to refer to the old "reference" attributes and has is it's own references.
         *
         *  TODO technically _referenceColumns should be deleted too, but deleting that caused chaise
         *  to throw "Maximum call stack size exceeded". This is happening because in most cases
         *  we're blindly using _referenceCopy, while the better approach would be creating a new "reference" by passing url and catalog.
         */
        delete referenceCopy._facetColumns;
        delete referenceCopy._display;
        delete referenceCopy._canCreate;
        delete referenceCopy._canRead;
        delete referenceCopy._canUpdate;
        delete referenceCopy._canDelete;
        delete referenceCopy._canUseTRS;
        delete referenceCopy._canUseTCRS;
        delete referenceCopy._defaultExportTemplate;
        delete referenceCopy._exportTemplates;
        delete referenceCopy._readPath;
        delete referenceCopy._csvDownloadLink;
        delete referenceCopy._readAttributeGroupPathProps_cached;

        referenceCopy.contextualize = new Contextualize(referenceCopy);
        return referenceCopy;
    }

    /**
     * Contructs the Contextualize object.
     *
     * Usage:
     * Clients _do not_ directly access this constructor.
     * See {@link ERMrest.Reference#contextualize}
     *
     * It will be used for creating contextualized references.
     *
     * @param {Reference} reference the reference that we want to contextualize
     */
    function Contextualize(reference) {
        this._reference = reference;
    }

    Contextualize.prototype = {

        /**
         * The _record_ context of this reference.
         * @type {Reference}
         */
        get detailed() {
            return this._contextualize(_contexts.DETAILED);
        },

        /**
         * The _compact_ context of this reference.
         * @type {Reference}
         */
        get compact() {
            return this._contextualize(_contexts.COMPACT);
        },

        /**
         * The _compact/brief_ context of this reference.
         * @type {Reference}
         */
        get compactBrief() {
            return this._contextualize(_contexts.COMPACT_BRIEF);
        },

        /**
         * The _compact/select_ context of this reference.
         * @type {Reference}
         */
        get compactSelect() {
            return this._contextualize(_contexts.COMPACT_SELECT);
        },

        /**
         * The _compact/select/association_ context of this reference.
         * @type {Reference}
         */
        get compactSelectAssociation() {
            return this._contextualize(_contexts.COMPACT_SELECT_ASSOCIATION);
        },

        /**
         * The _compact/select/association/link_ context of this reference.
         * @type {Reference}
         */
        get compactSelectAssociationLink() {
            return this._contextualize(_contexts.COMPACT_SELECT_ASSOCIATION_LINK);
        },

        /**
         * The _compact/select/association/unlink_ context of this reference.
         * @type {Reference}
         */
        get compactSelectAssociationUnlink() {
            return this._contextualize(_contexts.COMPACT_SELECT_ASSOCIATION_UNLINK);
        },

        /**
         * The _compact/select/foreign_key_ context of this reference.
         * @type {Reference}
         */
        get compactSelectForeignKey() {
            return this._contextualize(_contexts.COMPACT_SELECT_FOREIGN_KEY);
        },

        /**
         * The _compact/select/foreign_key/bulk_ context of this reference.
         * @type {Reference}
         */
        get compactSelectBulkForeignKey() {
            return this._contextualize(_contexts.COMPACT_SELECT_BULK_FOREIGN_KEY);
        },

        /**
         * The _compact/select/saved_queries_ context of this reference.
         * @type {Reference}
         */
        get compactSelectSavedQueries() {
            return this._contextualize(_contexts.COMPACT_SELECT_SAVED_QUERIES);
        },

        /**
         * The _compact/select/show_more_ context of this reference.
         * @type {Reference}
         */
        get compactSelectShowMore() {
            return this._contextualize(_contexts.COMPACT_SELECT_SHOW_MORE);
        },

        /**
         * The _entry_ context of this reference.
         * @type {Reference}
         */
        get entry() {
            return this._contextualize(_contexts.ENTRY);
        },

        /**
         * The _entry/create_ context of this reference.
         * @type {Reference}
         */
        get entryCreate() {
            return this._contextualize(_contexts.CREATE);
        },

        /**
         * The _entry/edit_ context of this reference.
         * @type {Reference}
         */
        get entryEdit() {
            return this._contextualize(_contexts.EDIT);
        },

        /**
         * The _entry/compact_ context of this reference.
         * @type {Reference}
         */
        get compactEntry() {
            return this._contextualize(_contexts.COMPACT_ENTRY);
        },

        /**
         * get compactBriefInline - The compact brief inline context of the reference
         * @return {Reference}
         */
        get compactBriefInline() {
            return this._contextualize(_contexts.COMPACT_BRIEF_INLINE);
        },

        /**
         * get Export - export context
         * @return {Reference}
         */
        get export() {
            return this._contextualize(_contexts.EXPORT);
        },

        /**
         * get exportCompact - export context for compact view
         * @return {Reference}
         */
         get exportCompact() {
            return this._contextualize(_contexts.EXPORT_COMPACT);
        },

        /**
         * get exportDetailed - export context for detailed view
         * @return {Reference}
         */
         get exportDetailed() {
            return this._contextualize(_contexts.EXPORT_DETAILED);
        },

        _contextualize: function(context) {
            var source = this._reference;

            var newRef = _referenceCopy(source);
            delete newRef._related;
            delete newRef._referenceColumns;
            delete newRef._facetColumns;
            delete newRef._display;

            newRef._context = isStringAndNotEmpty(context) ? context : '';

            // use the base table to get the alternative table of that context.
            // a base table's .baseTable is itself
            var newTable = source._table._baseTable._getAlternativeTable(context);
            var catalog = newTable.schema.catalog;


            /**
            * cases:
            *   1. same table: do nothing
            *   2. has join
            *       2.1. source is base, newTable is alternative:
            *           - If the join is on the alternative shared key, swap the joins.
            *       2.2. otherwise: use join
            *   3. has facets
            *       3.1. source is base, newTable is alternative, go through filters
            *           3.1.1. If first foreign is from base to alternative, remove it.
            *           3.1.2. otherwise add a fk from alternative to base.
            *       3.2. source is alternative, newTable is base, go through filters
            *           3.1.1. If first foreign is from alternative to base, remove it.
            *           3.1.2. otherwise add a fk from base to alternative.
            *       3.3. source is alternative, newTable is alternative, go through filters
            *           3.1.1. If first foreign is to base, change the first foreignkey to be from the newTable to main.
            *           3.1.2. otherwise add fk from newTable to main table, and from main table to source.
            *   4. doesn't have join
            *       4.1. no filter: swap table and update location only
            *       4.2. has filter
            *           4.2.1. single entity filter using shared key: swap table and convert filter to mapped columns (TODO alt to alt)
            *           4.2.2. otherwise: use join
            *
            * NOTE:
            * If switched to a new table (could be a base table or alternative table)
            * need to update reference's table, key, displayname, location
            * modifiers are not kept because columns are not guarenteed to exist when we switch to another table
            */
            if (newTable !== source._table) {

                // swap to new table
                newRef.setNewTable(newTable);

                var newLocationString, newFacetFilters = [];

                if (source._location.hasJoin) {
                    // returns true if join is on alternative shared key
                    var joinOnAlternativeKey = function () {
                        // NOTE in some cases the join must be based on
                        // aliases and we don't have the column data (share path logic)
                        if (!source._location.lastJoin.hasColumnMapping) return;

                        var joinCols = source._location.lastJoin.toCols,
                            keyCols = source._table._baseTable._altSharedKey.colset.columns;

                        if (joinCols.length != keyCols.length) {
                            return false;
                        }

                        return keyCols.every(function(keyCol) {
                            return joinCols.indexOf(keyCol.name) != -1;
                        });
                    };

                    // creates the new join
                    var generateJoin = function () {
                        /*
                        * let's assume we have T1, T1_alt, and T2
                        * last join is from T2 to T1-> T2/(id)=(T1:id)
                        * now we want to change this to point to T1_alt, to do this we can
                        * T2/(id)=(T1:id)/(id)=(T1_alt:id) but the better way is
                        * T2/(id)=(T1_alt:id)
                        * so we need to map the T1 key that is used in the join to T1_alt key.
                        * we can do this only if we know the mapping between foreignkey and key (which is true in this case).
                        */

                        var currJoin = source._location.lastJoin,
                            newRightCols = [],
                            col;

                        for (var i = 0; i < currJoin.toCols.length; i++) {
                            // find the column object
                            col = source._table.columns.get(currJoin.toCols[i]);

                            // map the column from source table to alternative table
                            col = newTable._altForeignKey.mapping.getFromColumn(col);

                            // the first column must have schema and table name
                            newRightCols.push((i === 0) ? col.toString() : fixedEncodeURIComponent(col.name));
                        }

                        return "(" + currJoin.fromColsStr + ")=(" + newRightCols.join(",") + ")";
                    };

                    // 2.1. if _altSharedKey is the same as the join
                    if (!source._table._isAlternativeTable() && newTable._isAlternativeTable() && joinOnAlternativeKey(source)) {
                        // change to-columns of the join
                        newLocationString =  source._location.compactUri;

                        // remove the last join
                        newLocationString = newLocationString.substring(0, newLocationString.lastIndexOf("/") + 1);

                        // add the new join
                        newLocationString += generateJoin();
                    }

                }
                else if (source._location.facets) {
                    //TODO needs refactoring
                    var currentFacets = JSON.parse(JSON.stringify(source._location.facets.decoded[_FacetsLogicalOperators.AND]));

                    // facetColumns is applying extra logic for alternative, and it only
                    // makes sense in the context of facetColumns list. not here.
                    // Therefore we should go based on the facets on the location object, not facetColumns.
                    // TODO should be modified to support the alternative syntaxes
                    var modifyFacetFilters = function (funct) {
                        currentFacets.forEach(function (f) {
                            if (!f.source) return;

                            var fk = null;

                            //‌ُ TODO this should not be called here, we should refactor this part later
                            if (_sourceColumnHelpers._sourceHasNodes(f.source)) {
                                var cons, isInbound = false, fkObj;

                                if ("inbound" in f.source[0]) {
                                    cons = f.source[0].inbound;
                                    isInbound = true;
                                } else if ("outbound" in f.source[0]) {
                                    cons = f.source[0].outbound;
                                } else {
                                    return;
                                }

                                fkObj = CatalogSerivce.getConstraintObject(catalog.id, cons[0], cons[1]);
                                if (fkObj == null || fkObj.subject !== _constraintTypes.FOREIGN_KEY) {
                                    return;
                                }

                                fk = {"obj": fkObj.object, "isInbound": isInbound};
                            }

                            newFacetFilters.push(funct(f, fk));
                        });
                    };

                    // TODO FILTER_IN_SOURCE
                    // source: main table newTable: alternative
                    if (!source._table._isAlternativeTable() && newTable._isAlternativeTable()) {
                        modifyFacetFilters(function (facetFilter, firstFk) {
                            if (firstFk && firstFk.isInbound && firstFk.obj._table === newTable) {
                                facetFilter.source.shift();
                                if (facetFilter.source.length === 1) {
                                    facetFilter.source = facetFilter.source[0];
                                }
                            } else {
                                if (!Array.isArray(facetFilter.source)) {
                                    facetFilter.source = [facetFilter.source];
                                }
                                facetFilter.source.unshift({"outbound": newTable._altForeignKey.constraint_names[0]});
                            }
                            return facetFilter;
                        });
                    }
                    // source: alternative newTable: main table
                    else if (source._table._isAlternativeTable() && !newTable._isAlternativeTable()) {
                        modifyFacetFilters(function (facetFilter, firstFk) {
                            if (firstFk && !firstFk.isInbound && firstFk.obj.key.table === newTable) {
                                facetFilter.source.shift();
                                if (facetFilter.source.length == 1) {
                                    facetFilter.source = facetFilter.source[0];
                                }
                            } else {
                                if (!Array.isArray(facetFilter.source)) {
                                    facetFilter.source = [facetFilter.source];
                                }
                                facetFilter.source.unshift({"inbound": source._table._altForeignKey.constraint_names[0]});
                            }
                            return facetFilter;
                        });
                    }
                    // source: alternative newTable: alternative
                    else {
                        modifyFacetFilters(function (facetFilter, firstFk) {
                            if (firstFk && !firstFk.isInbound && firstFk.obj.key.table === newTable._baseTable) {
                                facetFilter.source[0] = {"outbound": newTable._altForeignKey.constraint_names[0]};
                            } else {
                                if (!Array.isArray(facetFilter.source)) {
                                    facetFilter.source = [facetFilter.source];
                                }
                                facetFilter.source.unshift({"outbound": newTable._altForeignKey.constraint_names[0]}, {"inbound": source.table._altForeignKey.constraint_names[0]});
                            }
                            return facetFilter;
                        });
                    }

                    newLocationString = source._location.service + "/catalog/" + catalog.id + "/" +
                                        source._location.api + "/" + fixedEncodeURIComponent(newTable.schema.name) + ":" + fixedEncodeURIComponent(newTable.name);
                }
                else {
                    if (source._location.filter === undefined) {
                        // 4.1 no filter
                        newLocationString = source._location.service + "/catalog/" + catalog.id + "/" +
                                            source._location.api + "/" + fixedEncodeURIComponent(newTable.schema.name) + ":" + fixedEncodeURIComponent(newTable.name);
                    } else {
                        // 4.2.1 single entity key filter (without any join), swap table and switch to mapping key
                        // filter is single entity if it is binary filters using the shared key of the alternative tables
                        // or a conjunction of binary predicate that is a key of the alternative tables

                        // use base table's alt shared key
                        var sharedKey = source._table._baseTable._altSharedKey;
                        var filter = source._location.filter;
                        var filterString, j;

                        // binary filters using shared key
                        if (filter.type === FILTER_TYPES.BINARYPREDICATE && filter.operator === "=" && sharedKey.colset.length() === 1) {

                            // filter using shared key
                            if ((source._table._isAlternativeTable() && filter.column === source._table._altForeignKey.colset.columns[0].name) ||
                                (!source._table._isAlternativeTable() && filter.column === sharedKey.colset.columns[0].name)) {

                                if (newTable._isAlternativeTable()) { // to alternative table
                                    filterString = fixedEncodeURIComponent(newTable._altForeignKey.colset.columns[0].name) +
                                        "=" + filter.value;
                                } else { // to base table
                                    filterString = fixedEncodeURIComponent(sharedKey.colset.columns[0].name) + "=" + filter.value;
                                }

                                newLocationString = source._location.service + "/catalog/" + catalog.id + "/" +
                                                    source._location.api + "/" + fixedEncodeURIComponent(newTable.schema.name) + ":" + fixedEncodeURIComponent(newTable.name) + "/" +
                                                    filterString;
                            }

                        } else if (filter.type === FILTER_TYPES.CONJUNCTION && filter.filters.length === sharedKey.colset.length()) {

                            // check that filter is shared key
                            var keyColNames;
                            if (source._table._isAlternativeTable()) {
                                keyColNames = source._table._altForeignKey.colset.columns.map(function (column) {
                                    return column.name;
                                });
                            } else {
                                keyColNames = sharedKey.colset.columns.map(function (column) {
                                    return column.name;
                                });
                            }

                            var filterColNames = filter.filters.map(function (f) {
                                return f.column;
                            });

                            // all shared key columns must be used in the filters
                            if (keyColNames.every(function (keyColName) {
                                    return (filterColNames.indexOf(keyColName) !== -1);
                                })
                            ) {
                                // every filter is binary predicate of "="
                                if (filter.filters.every(function (f) {
                                        return (f.type === FILTER_TYPES.BINARYPREDICATE &&
                                                f.operator === "=");
                                    })
                                ) {

                                    // find column mapping from source to newRef
                                    var mapping = {};
                                    var newCol;
                                    if (!source._table._isAlternativeTable() && newTable._isAlternativeTable()) {
                                        // base to alternative
                                        sharedKey.colset.columns.forEach(function (column) {
                                            newCol = newTable._altForeignKey.mapping.getFromColumn(column);
                                            mapping[column.name] = newCol.name;
                                        });

                                    } else if (source._table._isAlternativeTable() && !newTable._isAlternativeTable()) {
                                        // alternative to base
                                        source._table._altForeignKey.colset.columns.forEach(function (column) {
                                            newCol = source._table._altForeignKey.mapping.get(column);
                                            mapping[column.name] = newCol.name;
                                        });
                                    } else {
                                        // alternative to alternative
                                        source._table._altForeignKey.colset.columns.forEach(function (column) {
                                            var baseCol = source._table._altForeignKey.mapping.get(column); // alt 1 col -> base col
                                            newCol = newTable._altForeignKey.mapping.getFromColumn(baseCol); // base col -> alt 2
                                            mapping[column.name] = newCol.name;
                                        });
                                    }

                                    filterString = "";

                                    for (j = 0; j < filter.filters.length; j++) {
                                        var f = filter.filters[j];
                                        // map column
                                        filterString += (j === 0? "" : "&") + fixedEncodeURIComponent(mapping[f.column]) + "=" + fixedEncodeURIComponent(f.value);
                                    }

                                    newLocationString = source._location.service + "/catalog/" + catalog.id + "/" +
                                        source._location.api + "/" + fixedEncodeURIComponent(newTable.schema.name) + ":" + fixedEncodeURIComponent(newTable.name) + "/" +
                                        filterString;
                                }
                            }
                        }

                    }
                }

                if (!newLocationString) {
                     // all other cases (2.2., 3.2.2), use join
                    var join;
                    if (source._table._isAlternativeTable() && newTable._isAlternativeTable()) {
                        join = source._table._altForeignKey.toString(true) + "/" +
                               newTable._altForeignKey.toString();
                    } else if (!source._table._isAlternativeTable()) { // base to alternative
                        join = newTable._altForeignKey.toString();
                    } else { // alternative to base
                        join = source._table._altForeignKey.toString(true);
                    }
                    newLocationString = source._location.compactUri + "/" + join;
                }

                //add the query parameters
                if (source._location.queryParamsString) {
                    newLocationString += "?" + source._location.queryParamsString;
                }

                newRef._location = parse(newLocationString, catalog);
                newRef._location.referenceObject = newRef;

                // change the face filters
                if (newFacetFilters.length > 0) {
                    newRef._location.facets = {"and": newFacetFilters};
                }
            }

            return newRef;
        }
    };

    /**
     * Constructs a new Page. A _page_ represents a set of results returned from
     * ERMrest. It may not represent the complete set of results. There is an
     * iterator pattern used here, where its {@link ERMrest.Page#previous} and
     * {@link ERMrest.Page#next} properties will give the client a
     * {@link ERMrest.Reference} to the previous and next set of results,
     * respectively.
     *
     * Usage:
     *  Clients _do not_ directly access this constructor.
     *  See {@link ERMrest.Reference#read}.
     * @memberof ERMrest
     * @class
     * @param {!ERMrest.Reference} reference The reference object from which
     * this data was acquired.
     * @param {String} etag The etag from the reference object that produced this page
     * @param {!Object[]} data The data returned from ERMrest.
     * @param {boolean} hasPrevious Whether there is more data before this Page
     * @param {boolean} hasNext Whether there is more data after this Page
     * @param {!Object} extraData based on pagination, the extra data after/before current page
     *
     */
    export function Page(reference, etag, data, hasPrevious, hasNext, extraData) {

        var hasExtraData = typeof extraData === "object" && Object.keys(extraData).length !== 0;

        this._ref = reference;
        this._etag = etag;

        /*
         * This is the structure of this._linkedData
         * this._linkedData[i] = {`pseudo-column-name`: data}
         * That is for retrieving data for a foreign key, you should do the following:
         *
         * var fkData = this._linkedData[i][column.name];
         */
        this._linkedData = [];
        this._linkedDataRIDs = [];
        this._data = [];
        this._rightsSummary = [];
        this._associationRightsSummary = [];

        var self = this,
            allOutBounds = reference.activeList.allOutBounds;

        var trs = _ERMrestFeatures.TABLE_RIGHTS_SUMMARY,
            tcrs = _ERMrestFeatures.TABLE_COL_RIGHTS_SUMMARY,
            associationTableAlias = _parserAliases.ASSOCIATION_TABLE,
            fkAliasPreix = _parserAliases.FOREIGN_KEY_PREFIX;

        // for the association rights summary
        var associatonRef = reference.derivedAssociationReference;

        // same logic as _readPath to see if it's attributegroup output
        var hasLinkedData = allOutBounds.length > 0 ||
                        reference.canUseTCRS ||
                        reference.canUseTRS ||
                        (associatonRef && associatonRef.canUseTRS);

        if (hasLinkedData) {
            var fks = reference._table.foreignKeys.all(), i, j, colFKs, d, key, fkData;
            var mTableAlias = this._ref.location.mainTableAlias;

            try {
                // the attributegroup output
                for (i = 0; i < data.length; i++) {
                    // main data
                    this._data.push(data[i][mTableAlias][0]);

                    // fk data
                    this._linkedData.push({});
                    this._linkedDataRIDs.push({});
                    for (j = allOutBounds.length - 1; j >= 0; j--) {
                        /**
                         * if we've used scalar value in the projection list,
                         * then we have to create an object to mimic values of the table
                         * other parts of the code (formatpresentation) relies on an object
                         * where values of each column is encoded. In this case the object
                         * will have the value of only one column
                         */
                        if (allOutBounds[j].isPathColumn && allOutBounds[j].canUseScalarProjection) {
                            // the value will not be an array
                            d = {};
                            fkData = data[i][fkAliasPreix + (j+1)];
                            if (fkData === undefined || fkData === null) {
                                this._linkedData[i][allOutBounds[j].name] = null;
                            } else {
                                d[allOutBounds[j].baseColumn.name] = fkData;
                                this._linkedData[i][allOutBounds[j].name] = d;
                            }
                        } else {
                            this._linkedData[i][allOutBounds[j].name] = data[i][fkAliasPreix + (j+1)][0];
                        }
                        this._linkedDataRIDs[i][allOutBounds[j].name] = allOutBounds[j].RID;
                    }

                    // table rights
                    if (reference.canUseTCRS || reference.canUseTRS) {
                        if (tcrs in data[i]) {
                            this._rightsSummary.push(data[i][tcrs]);
                        }
                        else if (trs in data[i]) {
                            this._rightsSummary.push(data[i][trs]);
                        }
                    }

                    // association table rights
                    if (associatonRef && associatonRef.canUseTRS) {
                        key = associationTableAlias + "_" + trs;
                        if (key in data[i]) {
                            this._associationRightsSummary.push(data[i][key]);
                        }
                    }
                }

                //extra data
                if (hasExtraData) {
                    // main data
                    this._extraData = extraData[mTableAlias][0];

                    // fk data
                    this._extraLinkedData = {};
                    for (j = allOutBounds.length - 1; j >= 0; j--) {
                        /**
                         * if we've used scalar value in the projection list,
                         * then we have to create an object to mimic values of the table
                         * other parts of the code (sort logic) relies on an object
                         * where values of each column is encoded. In this case the object
                         * will have the value of only one column
                         */
                        if (allOutBounds[j].isPathColumn && allOutBounds[j].canUseScalarProjection) {
                            // the value will not be an array
                            d = {};
                            fkData = extraData[fkAliasPreix + (j+1)];
                            if (fkData === undefined || fkData === null) {
                                this._extraLinkedData[allOutBounds[j].name] = null;
                            } else {
                                d[allOutBounds[j].baseColumn.name] = fkData;
                                this._extraLinkedData[allOutBounds[j].name] = d;
                            }
                        } else {
                            this._extraLinkedData[allOutBounds[j].name] = extraData[fkAliasPreix + (j+1)][0];
                        }
                    }
                }

            }
            // could not find the expected aliases
            catch(exception) {
                var fkName, col, tempData, linkedDataMap, k;

                this._data = data;

                // add the main table data to linkedData
                this._linkedData = [];
                this._linkedDataRIDs = [];
                for (i = 0; i < data.length; i++) {
                    tempData = {};
                    linkedDataMap = {};
                    for (j = 0; j < fks.length; j++) {
                        fkName = fks[j].name;
                        tempData[fkName] = {};
                        linkedDataMap[fkName] = fks[j].RID;

                        for (k = 0; k < fks[j].colset.columns.length; k++) {
                            col = fks[j].colset.columns[k];
                            tempData[fkName][fks[j].mapping.get(col).name] = data[i][col.name];
                        }
                    }
                    this._linkedData.push(tempData);
                    this._linkedDataRIDs.push(linkedDataMap);
                }

                // extra data
                if (hasExtraData) {
                    this._extraData = extraData;
                    tempData = {};
                    for (j = 0; j < fks.length; j++) {
                        fkName = fks[j].name;
                        tempData[fkName] = {};

                        for (k = 0; k < fks[j].colset.columns.length; k++) {
                            col = fks[j].colset.columns[k];
                            tempData[fkName][fks[j].mapping.get(col).name] = extraData[col.name];
                        }
                    }
                    this._extraLinkedData = tempData;
                }

                this._rightsSummary = [];
                this._associationRightsSummary = [];
            }
        }
        // entity output (linkedData is empty)
        else {
            this._data = data;
            this._extraData = hasExtraData ? extraData : undefined;
        }


        this._hasNext = hasNext;
        this._hasPrevious = hasPrevious;
    }

    Page.prototype = {
        constructor: Page,

        /**
         * The page's associated reference.
         * @type {Reference}
         */
        get reference() {
            return this._ref;
        },

        /**
         * An array of processed tuples. The results will be processed
         * according to the contextualized scheme (model) of this reference.
         *
         * Usage:
         * ```
         * for (var i=0, len=page.tuples.length; i<len; i++) {
         *   var tuple = page.tuples[i];
         *   console.log("Tuple:", tuple.displayname.value, "has values:", tuple.values);
         * }
         * ```
         * @type {Tuple[]}
         */
        get tuples() {
            if (this._tuples === undefined) {
                this._tuples = [];
                for (var i = 0; i < this._data.length; i++) {
                    this._tuples.push(new Tuple(this._ref, this, this._data[i], this._linkedData[i], this._linkedDataRIDs[i], this._rightsSummary[i], this._associationRightsSummary[i]));
                }
            }
            return this._tuples;
        },

        /**
         * the page length (number of rows in the page)
         * @type {integer}
         */
        get length() {
            if (this._length === undefined) {
                this._length = this._data.length;
            }
            return this._length;
        },

        /**
         * Whether there is more entities before this page
         * @returns {boolean}
         */
        get hasPrevious() {
            return this._hasPrevious;
        },

        /**
         * A reference to the previous set of results.
         * Will return null if the sortObject of reference is missing or is invalid
         *
         * Usage:
         * ```
         * if (reference.previous) {
         *   // more tuples in the 'previous' direction are available
         *   reference.previous.read(10).then(
         *     ...
         *   );
         * }
         * ```
         * @type {Reference|undefined}
         */
        get previous() {
            if (this._hasPrevious) {
                return this._getSiblingReference(false);
            }
            return null;
        },

        /**
         * Whether there is more entities after this page
         * @returns {boolean}
         */
        get hasNext() {
            return this._hasNext;
        },

        /**
         * A reference to the next set of results.
         * Will return null if the sortObject of reference is missing or is invalid
         *
         * Usage:
         * ```
         * if (reference.next) {
         *   // more tuples in the 'next' direction are available
         *   reference.next.read(10).then(
         *     ...
         *   );
         * }
         * ```
         * @type {Reference|undefined}
         */
        get next() {
            if (this._hasNext) {
                return this._getSiblingReference(true);
            }
            return null;
        },

        /**
         * Returns previous or next page
         * Clients should not directly use this. This is used in next and previous getters.
         * @param  {Boolean} next whether we want the next page or previous
         * @return {Reference}
         * @private
         */
        _getSiblingReference: function(next) {
            var loc = this._ref.location;

            // there's no sort, so no paging is possible
            if (!Array.isArray(loc.sortObject) || (loc.sortObject.length === 0)) {
                return null;
            }

            // data is not available
            if (!this._data || this._data.length === 0) {
                return null;
            }

            var newReference = _referenceCopy(this._ref);

            // update paging by creating a new location
            newReference._location = this._ref._location._clone(newReference);


            /* This will return the values that should be used for after/before
             * Let's assume the current page of data for the sort column is  [v1, v2, v3],
             * - the next page will be anything after v3
             * - the previous page will be anything before v1
             * Based on this, the function will return the first/last value of
             * the sort columns. So that it will be used for after/before in location object.
             * It is also taking care of duplicate columns, so it will be aligned with the read logic.
             */
            var rowIndex = next ? (this._data.length - 1) : 0;
            var pageValues = _getPagingValues(this._ref, this._data[rowIndex], this._linkedData[rowIndex]);
            if (pageValues === null) {
                return null;
            }

            newReference._location.afterObject = next ? pageValues : null;
            newReference._location.beforeObject = next ? null : pageValues;
            return newReference;
        },

        getContent: function (templateVariables) {
            var self = this, ref = this._ref;

            if (!self._data || !self._data.length) return null;

            var i, value, pattern, values = [], keyValues, tuple;
            var display = ref.display;

            // markdown_pattern in the source object
            if (typeof display.sourceMarkdownPattern === "string") {
                var $self = self.tuples.map(function (t) {
                    return t.templateVariables;
                });
                keyValues = Object.assign({$self: $self}, templateVariables);

                pattern = _renderTemplate(
                    display.sourceMarkdownPattern,
                    keyValues, ref.table.schema.catalog,
                    { templateEngine: display.sourceTemplateEngine}
                );

                if (pattern === null || pattern.trim() === '') {
                    pattern = ref.table._getNullValue(ref._context);
                }

                return renderMarkdown(pattern, false);
            }

            // page_markdown_pattern
            /*
             the object structure that is available on the annotation:
               $page = {
                    rows: [
                        {values, rowName, uri}
                    ],
                    parent: {
                        values: [],
                        table: "",
                        schema: ""
                    }
                    // deprecated
                    values: [],
                }
             */
            if (typeof display._pageMarkdownPattern === 'string') {
                var $page = {
                    rows: self.tuples.map(function (t, i) {
                        return t.templateVariables;
                    }),
                    // (deprecated) should eventually be removed
                    values: self.tuples.map(function (t, i) {
                        return t.templateVariables.values;
                    }),
                };

                if (ref.mainTable) {
                    const parent = {
                        schema: ref.mainTable.schema.name,
                        table: ref.mainTable.name,
                    };

                    if (ref.mainTuple) {
                        parent.values = _getFormattedKeyValues(ref.mainTable, ref._context, ref.mainTuple._data, ref.mainTuple._linkedData);
                    }

                    $page.parent = parent;
                }

                pattern = _renderTemplate(ref.display._pageMarkdownPattern, {$page: $page}, ref.table.schema.catalog, { templateEngine: ref.display.templateEngine});

                if (pattern === null || pattern.trim() === '') {
                    pattern = ref.table._getNullValue(ref._context);
                }

                return renderMarkdown(pattern, false);
            }

            // row_markdown_pattern
            if (typeof display._rowMarkdownPattern === 'string') {
                // Iterate over all data rows to compute the row values depending on the row_markdown_pattern.
                for (i = 0; i < self.tuples.length; i++) {

                    tuple = self.tuples[i];

                    // make sure we have the formatted key values
                    keyValues = Object.assign({$self: tuple.selfTemplateVariable}, tuple.templateVariables.values);

                    // render template
                    value = _renderTemplate(ref.display._rowMarkdownPattern, keyValues, ref.table.schema.catalog, { templateEngine: ref.display.templateEngine});

                    // If value is null or empty, return value on basis of `show_null`
                    if (value === null || value.trim() === '') {
                        value = ref.table._getNullValue(ref._context);
                    }
                    // If final value is not null then push it in values array
                    if (value !== null) {
                        values.push(value);
                    }
                }
                // Join the values array using the separator and prepend it with the prefix and append suffix to it.
                pattern = ref.display._prefix + values.join(ref.display._separator) + ref.display._suffix;
                return renderMarkdown(pattern, false);
            }

            // no markdown_pattern, just return the list of row-names in this context (row_name/<context>)
            for ( i = 0; i < self.tuples.length; i++) {
                tuple = self.tuples[i];
                var url = tuple.reference.contextualize.detailed.appLink;
                var rowName = _generateRowName(ref.table, ref._context, tuple._data, tuple._linkedData);

                // don't add link if the rowname already has link
                if (rowName.value.match(/<a\b.+href=/)) {
                    values.push("* " + rowName.unformatted + " " + ref.display._separator);
                } else {
                    values.push("* ["+ rowName.unformatted +"](" + url + ") " + ref.display._separator);
                }
            }
            pattern = ref.display._prefix + values.join(" ") + ref.display._suffix;
            return renderMarkdown(pattern, false);
        },

        /**
         * HTML representation of the whole page which uses table-display annotation.
         * If markdownPattern is defined then renderTemplate is called to get the correct display.
         * In case of no such markdownPattern is defined output is displayed in form of
         * unordered list with displayname as text content of the list.
         * For more info you can refer {ERM.reference.display}
         *
         * Usage:
         *```
         * var content = page.content;
         * if (content) {
         *    console.log(content);
         * }
         *```
         *
         * It will return:
         * 1. the rendered page_markdown_pattern if it's defined.
         * 2. the rendered row_markdown_pattern if it's defined.
         * 3. list of links that point to the row. Caption is going to be the row-name.
         * @type {string|null}
         */
        get content() {
            if (this._content === undefined) {
                this._content = this.getContent();
            }
            return this._content;
       },

        get templateVariables() {
            if (this._templateVariables === undefined) {
                var res = [];
                this.tuples.forEach(function (t) {
                    res.push(t.templateVariables);
                });
                this._templateVariables = res;
            }
            return this._templateVariables;
        }
    };


    /**
     * Constructs a new Tuple. In database jargon, a tuple is a row in a
     * relation. This object represents a row returned by a query to ERMrest.
     *
     * Usage:
     *  Clients _do not_ directly access this constructor.
     *  See {@link ERMrest.Page#tuples}.
     * @memberof ERMrest
     * @class
     * @param {!ERMrest.Reference} reference The reference object from which
     * this data was acquired.
     * @param {!ERMrest.Page} page The Page object from which
     * this data was acquired.
     * @param {!Object} data The unprocessed tuple of data returned from ERMrest.
     * @param {!Object} linkedData extra foreign key data that is fetched during read
     * @param {!Object} linkedDataRIDs map of column name keys with column RID as values
     */
    export function Tuple(pageReference, page, data, linkedData, linkedDataRIDs, rightsSummary, associationRightsSummary) {
        this._pageRef = pageReference;
        this._page = page;
        this._data = data || {};
        this._linkedData = (typeof linkedData === "object") ? linkedData : {};
        this._linkedDataRIDs = (typeof linkedDataRIDs === "object") ? linkedDataRIDs : {};
        this._rightsSummary = (typeof rightsSummary === "object") ? rightsSummary : {};
        this._associationRightsSummary = (typeof associationRightsSummary === "object") ? associationRightsSummary : {};
    }

    Tuple.prototype = {
        constructor: Tuple,

        /**
         * This is the reference of the Tuple
         * @returns {Reference|*} reference of the Tuple
         */
        get reference() {

            if (this._ref === undefined) {
                // TODO this should be changed to create a new reference using its constructor
                this._ref = _referenceCopy(this._pageRef);

                var uri = this._pageRef._location.service + "/catalog/" + this._pageRef._location.catalog + "/" +
                    this._pageRef._location.api + "/";

                // if this is an alternative table, use base table
                if (this._pageRef._table._isAlternativeTable()) {
                    var baseTable = this._pageRef._table._baseTable;
                    this._ref.setNewTable(baseTable);
                    uri = uri + fixedEncodeURIComponent(baseTable.schema.name) + ":" + fixedEncodeURIComponent(baseTable.name) + "/";

                    // convert filter columns to base table columns using shared key
                    var fkey = this._pageRef._table._altForeignKey;
                    var self = this;
                    fkey.mapping.domain().forEach(function(altColumn, index, array) {
                        var baseCol = fkey.mapping.get(altColumn);
                        if (index === 0) {
                            uri = uri + fixedEncodeURIComponent(baseCol.name) + "=" + fixedEncodeURIComponent(self._data[altColumn.name]);
                        } else {
                            uri = uri + "&" + fixedEncodeURIComponent(baseCol.name) + "=" + fixedEncodeURIComponent(self._data[altColumn.name]);
                        }
                    });
                } else {
                    // update its location by adding the tuple’s key filter to the URI
                    // don't keep any modifiers
                    uri = uri + fixedEncodeURIComponent(this._ref._table.schema.name) + ":" + fixedEncodeURIComponent(this._ref._table.name) + "/";
                    for (var k = 0; k < this._ref._shortestKey.length; k++) {
                        var col = this._pageRef._shortestKey[k].name;
                        if (k === 0) {
                            uri = uri + fixedEncodeURIComponent(col) + "=" + fixedEncodeURIComponent(this._data[col]);
                        } else {
                            uri = uri + "&" + fixedEncodeURIComponent(col) + "=" + fixedEncodeURIComponent(this._data[col]);
                        }
                    }
                }

                this._ref._location = parse(uri, this._ref.table.schema.catalog);
                this._ref._location.referenceObject = this._ref;

                // add the tuple to reference so that when calling read() we don't need to fetch the data again.
                this._ref._tuple = this._tuple;

            }
            return this._ref;
        },

        /**
         * This is the page of the Tuple
         * @returns {Page|*} page of the Tuple
         */
         get page() {
            if (this._page === undefined) {
                // TODO: What happens here?
                return undefined;
            }
            return this._page;
         },

         /**
          * Foreign key data.
          * During the read we get extra information about the foreign keys,
          * client could use these extra information for different purposes.
          * One of these usecases is domain_filter_pattern which they can
          * include foreignkey data in the pattern language.
          *
          * @type {Object}
          */
         get linkedData() {
             return this._linkedData;
         },

          /**
          * Foreign key data RID names.
          * Map of `column.name` keys with the `column.RID` as the value so RIDs
          * can be used in cases that require safe strings
          *
          * @type {Object}
          */
          get linkedDataRIDs() {
            return this._linkedDataRIDs;
        },

        /**
         * Used for getting the current set of data for the reference.
         * This stores the original data in the _oldData object to preserve
         * it before any changes are made and those values can be properly
         * used in update requests.
         *
         * Notably, if a key value is changed, the old value needs to be kept
         * track of so that the column projections for the uri can be properly created
         * and both the old and new value for the modified key are submitted together
         * for proper updating.
         *
         * @type {any}
         */
        get data() {
            if (this._oldData === undefined) {
                // interesting trick to deep copy an array of data without functions
                this._oldData = JSON.parse(JSON.stringify(this._data));
            }
            return this._data;
        },

        checkPermissions: function (permission, colName, isAssoc) {
            var sum = this._rightsSummary[permission];
            if (isAssoc) {
                sum = this._associationRightsSummary[permission];
            }

            if (permission === _ERMrestACLs.COLUMN_UPDATE) {
                if (!isObjectAndNotNull(sum) || typeof sum[colName] !== 'boolean') return true;
                return sum[colName];
            }

            if (typeof sum !== 'boolean') return true;
            return sum;
        },

        /**
         * Indicates whether the client can update this tuple. Reporting a `true`
         * value DOES NOT guarantee the user right since some policies may be
         * undecidable until query execution.
         *
         * Usage:
         * ```
         * if (tuple.canUpdate) {
         *   console.log(tuple.displayname, "may be updated by this client");
         * }
         * else {
         *   console.log(tuple.displayname, "cannot be updated by this client");
         * }
         * ```
         * @type {boolean}
         */
        get canUpdate() {
            if (this._canUpdate === undefined) {
                var pm = _permissionMessages, self = this, canUpdateOneCol;

                this._canUpdate = true;

                // make sure table can be updated
                if (!this._pageRef.canUpdate) {
                    this._canUpdate = false;
                    this._canUpdateReason = this._pageRef.canUpdateReason;
                }
                // check row level permission
                else if (!this.checkPermissions(_ERMrestACLs.UPDATE)) {
                    this._canUpdate = false;
                    this._canUpdateReason = pm.NO_UPDATE_ROW;
                } else {
                    // make sure at least one column can be updated
                    // (dynamic acl allows it and also it's not disabled)
                    canUpdateOneCol = true;
                    if (this._pageRef._context === _contexts.EDIT) {
                        canUpdateOneCol = this.canUpdateValues.some(function (canUpdateValue, i) {
                            return canUpdateValue && !self._pageRef.columns[i].inputDisabled;
                        });
                    } else {
                        // see if at least one visible column in edit context can be updated
                        var ref = self._pageRef.contextualize.entryEdit;
                        if (ref.table == self._pageRef.table) { // make sure not alternative
                            canUpdateOneCol = ref.columns.some(function (col) {
                                return !col.inputDisabled && !col._baseCols.some(function (bcol) {
                                    return !self.checkPermissions(
                                        _ERMrestACLs.COLUMN_UPDATE,
                                        bcol.name
                                    );
                                });
                            });
                        }
                    }

                    if (!canUpdateOneCol) {
                        this._canUpdate = false;
                        this._canUpdateReason = pm.NO_UPDATE_COLUMN;
                    }
                }
            }
            return this._canUpdate;
         },

         /**
          * Indicates the reason as to why a user cannot update this tuple.
          * @type {String}
          */
         get canUpdateReason () {
             if (this._canUpdateReason === undefined) {
                 // will generate the reason
                 var bool = this._canUpdate;
             }
             return this._canUpdateReason;

         },

        /**
         * Indicates whether the client can delete this tuple. Reporting a `true`
         * value DOES NOT guarantee the user right since some policies may be
         * undecidable until query execution.
         *
         * Usage:
         * ```
         * if (tuple.canDelete) {
         *   console.log(tuple.displayname, "may be deleted by this client");
         * }
         * else {
         *   console.log(tuple.displayname, "cannot be deleted by this client");
         * }
         * ```
         * @type {boolean}
         */
        get canDelete() {
            if (this._canDelete === undefined) {
                // make sure table and row can be deleted
                this._canDelete = this._pageRef.canDelete && this.checkPermissions(_ERMrestACLs.DELETE);
            }
            return this._canDelete;
        },

        get canUnlink() {
            if (this._canUnlink === undefined) {
                if (!this._pageRef.derivedAssociationReference) {
                    this._canUnlink = false;
                } else {
                    var ref = this._pageRef.derivedAssociationReference;
                    // make sure association table and row can be deleted
                    this._canUnlink = ref.canDelete && this.checkPermissions("delete", null, true);
                }
            }
            return this._canUnlink;
        },

        /**
         * The array of formatted/raw values of this tuple on basis of context "edit".
         * The ordering of the values in the array matches the ordering of the columns
         * in the reference (see {@link ERMrest.Reference#columns}).
         *
         * Usage (iterating over all values in the tuple):
         * ```
         * for (var i=0; len=reference.columns.length; i<len; i++) {
         *   console.log(tuple.displayname, "has a", ref.columns[i].displayname,
         *       "with value", tuple.values[i]);
         * }
         * ```
         *
         * Usage (getting a specific value by column position):
         * ```
         * var column = reference.columns[8]; // the 8th column in this refernece
         * console.log(tuple.displayname, "has a", column.displayname,
         *     "with value", tuple.values[column.position]);
         * ```
         * @type {string[]}
         */
        get values() {
            if (this._values === undefined) {

                /*
                 * There are multiple annotations involved in getting the value of column,
                 * one of these annotations is markdown_pattern that can be defined on columns.
                 * For that annotation, we need the templateVariables of all the columns.
                 * Therefore at first we're calling `_getFormattedKeyValues` which internally
                 * will call `formatvalue` for all the columns and also adds the extra attributes.
                 * We're passing the raw value to the formatPresentation, because that function
                 * will call the `formatvalue` iself which its value might be different from what
                 * `_getFormattedKeyValues` is returning for the column. For example, in case of
                 * array of texts, we should not treat the values as markdown and we should
                 * escpae markdown characters. This special case exists only for array, because we're
                 * manipulating some special cases (null and empty string) and we want those to be treated as markdown.
                 * Then to make it easier for us, we are escaping other markdown characters. For instance
                 * assume the value of array column is ["", "*Empty*"]. We expect the final returned
                 * value for the column to be "<p><em>Empty</em>, *Empty*</p>". But if another column
                 * is using this column in its markdown pattern (assume column name is col therefore
                 * a markdown_pattern of {{{col}}}) the expected value is "<p><em>Empty</em>, <em>Empty</em>".
                 * And that's because we're allowing injection of markdown in markdown_pattern even if the
                 * column type is text.
                 *
                 * tl;dr
                 * - call `_getFormattedKeyValues` to get formmated values of all columns for the usage of markdown_pattern.
                 * - call formatPresentation for each column.
                 *   - calls formatvalue for the column to get the formatted value (might be different from `_getFormattedKeyValues` for the column).
                 *   - if markdown_pattern exists:
                 *     - use the template with result of `_getFormattedKeyValues` to get the value.
                 *   - otherwise:
                 *     - if json, attach <pre> tag to the formatted value.
                 *     - if array, call printArray which will return a string.
                 *     - otherwise return the formatted value.
                 */

                this._values = [];
                this._isHTML = [];
                this._canUpdateValues = [];

                var self = this, column, presentation;

                var checkUpdateColPermission = function (col) {
                    return !self.checkPermissions(
                        _ERMrestACLs.COLUMN_UPDATE,
                        col.name
                    );
                };

                // key value pair of formmated values, to be used in formatPresentation
                var keyValues = this.templateVariables.values;

                // If context is entry
                if (_isEntryContext(this._pageRef._context)) {

                    // Return raw values according to the visibility and sequence of columns
                    for (let i = 0; i < this._pageRef.columns.length; i++) {
                        column = this._pageRef.columns[i];

                        // if user cannot update any of the base_columns then the column should be disabled
                        this._canUpdateValues[i] = !column._baseCols.some(checkUpdateColPermission);

                        if (column.isPseudo) {
                            if (column.isForeignKey) {
                                presentation = column.formatPresentation(this._linkedData[column.name], this._pageRef._context, keyValues);
                            } else {
                                presentation = column.formatPresentation(this._data, this._pageRef._context, keyValues);
                            }
                            this._values[i] = presentation.value;
                            this._isHTML[i] = presentation.isHTML;
                        }
                        //Added this if conditon explicitly for json/jsonb because we need to pass the
                        //formatted string representation of JSON and JSONBvalues
                        else if (column.type.name === "json" || column.type.name === "jsonb") {
                            this._values[i] = keyValues[column.name];
                            this._isHTML[i] = false;
                        }
                        else {
                            this._values[i] = this._data[column.name];
                            this._isHTML[i] = false;
                        }
                    }
                } else {
                    /*
                     * use this variable to avoid using computed formatted values in other columns while templating
                     */
                    var values = [];

                    // format values according to column display annotation
                    for (let i = 0; i < this._pageRef.columns.length; i++) {
                        column = this._pageRef.columns[i];
                        if (column.isPseudo) {
                            if (column.isForeignKey || (column.isPathColumn && column.hasPath)) {
                                values[i] = column.formatPresentation(this._linkedData[column.name], this._pageRef._context, keyValues);
                            } else {
                                values[i] = column.formatPresentation(this._data, this._pageRef._context, keyValues);
                            }
                        } else {
                            values[i] = column.formatPresentation(this._data, this._pageRef._context, keyValues);

                            if (column.type.name === "gene_sequence") {
                                values[i].isHTML = true;
                            }
                        }
                    }

                    values.forEach(function(fv) {
                        self._values.push(fv.value);
                        self._isHTML.push(fv.isHTML);
                    });
                }

            }
            return this._values;
        },

        /**
         * The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
         * values in the array matches the ordering of the columns in the
         * reference (see {@link ERMrest.Reference#columns}).
         *
         * Usage (iterating over all values in the tuple):
         * ```
         * for (var i=0; len=reference.columns.length; i<len; i++) {
         *   console.log(tuple.displayname, tuple.isHTML[i] ? " has an HTML value" : " does not has an HTML value");
         * }
         * ```
         * @type {boolean[]}
         */
        get isHTML() {
            // this._isHTML has not been populated then call this.values getter to populate values and isHTML array
            if (this._isHTML === undefined) {
                var value = this.values;
            }

            return this._isHTML;
        },

        /**
         * currently only populated in entry context
         */
        get canUpdateValues () {
            if (this._canUpdateValues === undefined) {
                var value = this.values;
            }

            return this._canUpdateValues;
        },

        /**
         * The _display name_ of this tuple. For example, if this tuple is a
         * row from a table, then the display name is defined by the
         * row_markdown_pattern annotation for the _row_name/title_ context
         * or by the heuristics (title, name, id(text), SHORTESTKEY Concatenation using ':')
         *
         * Usage:
         * ```
         * console.log("This tuple has a displayable name of ", tuple.displayname.value);
         * ```
         * @type {string}
         */
        get displayname() {
            if (this._displayname === undefined) {
                this._displayname = _generateRowName(this._pageRef._table, this._pageRef._context, this._data, this._linkedData, true);
            }
            return this._displayname;
        },

        /**
         * The row name_ of this tuple. For example, if this tuple is a
         * row from a table, then the display name is defined by the
         * row_markdown_pattern annotation for the _row_name_ context
         * or by the heuristics (title, name, id(text), SHORTESTKEY Concatenation using ':')
         *
         * Usage:
         * ```
         * console.log("This tuple has a displayable name of ", tuple.displayname.value);
         * ```
         * @type {string}
         */
        get rowName() {
            if (this._rowName === undefined) {
                this._rowName = _generateRowName(this._pageRef._table, this._pageRef._context, this._data, this._linkedData);
            }
            return this._rowName;
        },

        /**
         * The unique identifier for this tuple composed of the values for each
         * of the shortest key columns concatenated together by an '_'
         *
         * @type {string}
         */
        get uniqueId() {
            if (this._uniqueId === undefined) {
                this._uniqueId = _generateTupleUniqueId(this._pageRef.table.shortestKey, this.data);
            }
            return this._uniqueId;
        },

        /**
         * If annotation is defined and has the required attributes, will return
         * a Citation object that can be used to generate the citation for this tuple.
         * @type {Citation}
         */
        get citation() {
            if (this._citation === undefined) {
                var table = this._pageRef.table;
                if (!table.annotations.contains(_annotations.CITATION)) {
                    this._citation = null;
                } else {
                    var citationAnno = table.annotations.get(_annotations.CITATION).content;
                    if (!citationAnno.journal_pattern || !citationAnno.year_pattern || !citationAnno.url_pattern) {
                        this._citation = null;
                    } else {
                        this._citation = new Citation(this, citationAnno);
                    }
                }
            }
            return this._citation;
        },

        /**
         * An object of what is available in templating environment for this tuple
         * it has the following attributes:
         * - values
         * - rowName
         * - uri
         * @type {Object}
         */
        get templateVariables() {
            if (this._templateVariables === undefined) {
                var self = this;
                var context = self._pageRef._context;
                var keyValues = _getRowTemplateVariables(
                    self._pageRef._table,
                    context,
                    self._data,
                    self._linkedData
                );

                // TODO should we move these to the _getFormattedKeyValues?
                // the multi-fk all-outbounds
                var sm = this._pageRef.table.sourceDefinitions.sourceMapping;

                self._pageRef.activeList.allOutBounds.forEach(function (col) {
                    // data is null, so we don't need to add it
                    if (!self._linkedData[col.name]) return;

                    // see if it exists in the mapping
                    if (Array.isArray(sm[col.name])) {
                        if (col.isForeignKey || col.isEntityMode) {
                            // alloutbound entity
                            var fkTempVal = _getRowTemplateVariables(col.table, context, self._linkedData[col.name]);

                            sm[col.name].forEach(function (key) {
                                keyValues.values[key] = fkTempVal;
                            });
                        } else {
                            // alloutbound scalar
                            sm[col.name].forEach(function (key) {
                                var rawVal = self._linkedData[col.name][col.baseColumn.name];
                                keyValues.values[key] = col.baseColumn.formatvalue(rawVal, context);
                                keyValues.values["_" + key] = rawVal;
                            });
                        }
                    }
                });

                // the self_links
                var selfLinkValue;
                self._pageRef.activeList.selfLinks.forEach(function (col) {
                    if (Array.isArray(sm[col.name])) {
                        // compute it once and use it for all the self-links.
                        if (!selfLinkValue) {
                            selfLinkValue = _getRowTemplateVariables(col.table, context, self._data, null, col.key);
                        }

                        sm[col.name].forEach(function (key) {
                            keyValues.values[key] = selfLinkValue;
                        });
                    }
                });

                this._templateVariables = keyValues;
            }
            return this._templateVariables;
        },

        /**
         * Should be used for populating $self for this tuple in templating environments
         * It will have,
         * - rowName
         * - uri
         * @type {Object}
         */
        get selfTemplateVariable() {
            if (this._selfTemplateVariable === undefined) {
                var $self = {};
                for (var j in this.templateVariables) {
                    if (Object.prototype.hasOwnProperty.call(this.templateVariables, j) && j != "values") {
                        $self[j] = this.templateVariables[j];
                    }
                }
                this._selfTemplateVariable = $self;
            }
            return this._selfTemplateVariable;
        },

        /**
         * If the Tuple is derived from an association related table,
         * this function will return a reference to the corresponding
         * entity of this tuple's association table.
         *
         * For example, assume
         * Table1(K1,C1) <- AssocitaitonTable(FK1, FK2) -> Table2(K2,C2)
         * and current tuple is from Table2 with k2 = "2".
         * With origFKRData = {"k1": "1"} this function will return a reference
         * to AssocitaitonTable with FK1 = "1"" and FK2 = "2".
         *
         * @type {Reference}
         */
        getAssociationRef: function(origTableData){
            if (!this._pageRef.derivedAssociationReference) {
                return null;
            }

            var associationRef = this._pageRef.derivedAssociationReference,
                encoder = fixedEncodeURIComponent,
                newFilter = [],
                missingData = false;

            var addFilter = function(fkr, data) {
                var keyCols = fkr.colset.columns,
                    mapping = fkr.mapping, d, i;

                for (i = 0; i < keyCols.length; i++) {
                    try {
                        d = data[mapping.get(keyCols[i]).name];
                        if (d === undefined || d === null) return false;

                        newFilter.push(encoder(keyCols[i].name) + "=" + encoder(d));
                    } catch(exception) {
                        return false;
                    }
                }
                return true;
            };
            // filter based on the first key
            missingData = !addFilter(associationRef.origFKR, origTableData);
            //filter based on the second key
            missingData = missingData || !addFilter(associationRef.associationToRelatedFKR, this._data);

            if (missingData) {
                return null;
            }
            var loc = associationRef._location;
            var uri = [
                loc.service, "catalog", loc.catalog, loc.api,
                encoder(associationRef._table.schema.name) + ":" + encoder(associationRef._table.name),
                newFilter.join("&")
            ].join("/");

            var reference = new Reference(parse(uri), this._pageRef._table.schema.catalog);
            return reference;

        },

        /**
         * @desc
         * This function takes the current Tuple (this) and creates a shallow copy of it while de-referencing
         * the _data attribute. This way _data can be modified in chaise without changing the originating Tuple
         * @returns {Tuple} a shallow copy of _this_ tuple with it's _data de-referenced
         */
         copy: function() {
             var newTuple = Object.create(Tuple.prototype);
             shallowCopy(newTuple, this);
             newTuple._data = {};

             //change _data though
             var keys = Object.keys(this._data);
             for (var i = 0; i < keys.length; i++) {
                 newTuple._data[keys[i]] = this._data[keys[i]];
             }

             return newTuple;
         }


    };

    /**
     * Constructs an Aggregate Funciton object
     *
     * Reference Aggregate Functions is a collection of available aggregates for the
     * particular Reference (count for the table). Each aggregate should return the string
     * representation for querying that information.
     *
     * Usage:
     *  Clients _do not_ directly access this constructor. ERMrest.Reference will
     *  access this constructor for purposes of fetching aggregate data about the table.
     * @memberof ERMrest
     * @class
     */
    function ReferenceAggregateFn (reference) {
        this._ref = reference;
    }

    ReferenceAggregateFn.prototype = {
        /**
         * @type {Object}
         * @desc count aggregate representation
         */
        get countAgg() {
            if (this._ref.table.shortestKey.length > 1) {
                throw new Error("Table `" + this._ref.table.name + "`" + "doesn't have any simple keys. For getting count simple key is required.");
            }

            return "cnt_d(" + fixedEncodeURIComponent(this._ref.table.shortestKey[0].name) + ")";
        }
    };

    /**
     * Constructs a citation for the given tuple.
     * The given citationAnnotation must be valid and have the appropriate variables.
     */
    function Citation (reference, citationAnnotation) {
        this._reference = reference;

        this._table = reference.table;

        /**
         * citation specific properties include:
         *   - journal*
         *   - author
         *   - title
         *   - year*
         *   - url*
         *   - id
         * other properties:
         *   - template_engine
         *   - wait_for
         */
        this._citationAnnotation = citationAnnotation;

        var waitForRes = _processWaitForList(citationAnnotation.wait_for, reference, reference.table, null, null, "citation");

        this.waitFor = waitForRes.waitForList;
        this.hasWaitFor = waitForRes.hasWaitFor;
        this.hasWaitForAggregate = waitForRes.hasWaitForAggregate;
    }

    Citation.prototype = {
        /**
         * Given the templateVariables variables, will generate the citaiton.
         * @param {Tuple} tuple - the tuple object that this citaiton is based on
         * @param {Object=} templateVariables - if it's not an obect, we will use the tuple templateVariables
         * @return {String|null} if the returned template for required attributes are empty, it will return null.
         */
        compute: function (tuple, templateVariables) {
            var table = this._table, citationAnno = this._citationAnnotation;

            // make sure required parameters are present
            if (!citationAnno.journal_pattern || !citationAnno.year_pattern || !citationAnno.url_pattern) {
                return null;
            }

            if (!templateVariables) {
                templateVariables = tuple.templateVariables.values;
            }

            var keyValues = Object.assign({$self: tuple.selfTemplateVariable}, templateVariables);

            var citation = {};
            // author, title, id set to null if not defined
            ["author", "title", "journal", "year", "url", "id"].forEach(function (key) {
                citation[key] = _renderTemplate(
                    citationAnno[key+"_pattern"],
                    keyValues,
                    table.schema.catalog,
                    {templateEngine: citationAnno.template_engine}
                );
            });

            // if after processing the templates, any of the required fields are null, template is invalid
            if (!citation.journal || !citation.year || !citation.url) {
                return null;
            }

            return citation;
        }
    };

    /**
     * Constructs the Google Dataset metadata for the given tuple.
     * The given metadata must be valid and have the appropriate variables.
     */
    function GoogleDatasetMetadata(reference, gdsMetadataAnnotation) {
        this._reference = reference;
        this._table = reference.table;
        this._gdsMetadataAnnotation = gdsMetadataAnnotation;
    }

    GoogleDatasetMetadata.prototype = {
        /**
         * Given the templateVariables variables, will generate the metadata.
         * @param {Tuple} tuple - the tuple object that this metadata is based on
         * @param {Object=} templateVariables - if it's not an object, we will use the tuple templateVariables
         * @return {Json-ld|null} if the returned template for required attributes are empty or invalid, it will return null.
         */
        compute: function (tuple, templateVariables) {
            var table = this._table,
                metadataAnnotation = this._gdsMetadataAnnotation;

            if (!templateVariables) {
                templateVariables = tuple.templateVariables.values;
            }

            var keyValues = Object.assign({$self: tuple.selfTemplateVariable}, templateVariables);
            var metadata = {};
            setMetadataFromTemplate(metadata, metadataAnnotation.dataset, metadataAnnotation.template_engine, keyValues, table);

            var result = validateJSONLD(metadata);

            if (!result.isValid) {
                $log.error("JSON-LD not appended to <head> as validation errors found.");
                return null;
            }

            return result.modifiedJsonLd;
        },
    };

    function setMetadataFromTemplate(metadata, metadataAnnotation, templateEngine, templateVariables, table) {
        Object.keys(metadataAnnotation).forEach(function (key) {
            if (typeof metadataAnnotation[key] == "object" && metadataAnnotation[key] != null && !Array.isArray(metadataAnnotation[key])) {
                metadata[key] = {};
                setMetadataFromTemplate(metadata[key], metadataAnnotation[key], templateEngine, templateVariables, table);
            }
            else if (Array.isArray(metadataAnnotation[key])) {
                metadata[key] = [];
                metadataAnnotation[key].forEach(function (element) {
                    metadata[key].push(_renderTemplate(
                        element,
                        templateVariables,
                        table.schema.catalog,
                        { templateEngine: templateEngine, allowObject: true }
                    ));
                });
            }
            else {
                metadata[key] = _renderTemplate(
                    metadataAnnotation[key],
                    templateVariables,
                    table.schema.catalog,
                    { templateEngine: templateEngine, allowObject: true }
                );
            }
        });
    }

    /**
     * Constructor to create a BulkCreateForeignKeyObject object
     *
     * NOTE: Potential improvement to the heuristics when there is no annotation defined
     *   if we have:
     *     - >2 FK columns
     *     - there is a key with 2 foreign key columns in it
     *     - that key includes the _mainColumn mentioned in prefillObject
     *   should we assume that's the main/leaf columns for the association?
     *
     * @param {Reference} reference reference for the association table
     * @param {Object} prefillObject generated prefill object from chaise after extracting the query param and fetching the data from cookie storage
     * @param {Object} fkCols set of foreignkey columns that are not system columns (they might be overlapping so we're not using array)
     * @param {ForeignKeyPseudoColumn} mainColumn the column from the assocation table that points to the main table in the association
     * @param {ForeignKeyPseudoColumn} leafColumn the column from the assocation table that points to the leaf table in the association we are selecting rows from to associate to main
     */
    function BulkCreateForeignKeyObject (reference, prefillObject, fkCols, mainColumn, leafColumn) {
        var self = this;
        this._reference = reference;
        this._prefillObject = prefillObject;
        this._mainColumn = mainColumn;
        this._leafColumn = leafColumn;

        this._isUnique = false;

        var tempKeys = reference.table.keys.all().filter(function(key) {
            var keyCols = key.colset.columns;
            return !(keyCols.length == 1 && (_serialTypes.indexOf(keyCols[0].type.name) != -1 ||  _systemColumns.indexOf(keyCols[0].name) != -1) && !(keyCols[0] in fkCols));
        });

        // to calculate isUnique
        //   - One of the keys should contain the main and leaf foreign key columns
        tempKeys.forEach(function(key) {
            var mainMatch = false,
                leafMatch = false;

            key.colset.columns.forEach(function(col) {
                if (col.name === self._leafColumn._baseCols[0].name) {
                    leafMatch = true;
                } else if (col.name === self._mainColumn._baseCols[0].name) {
                    mainMatch = true;
                }
            });

            if (leafMatch && mainMatch) self._isUnique = true;
        });
    }

    BulkCreateForeignKeyObject.prototype = {
        /**
         * the column that points to the table that rows are being selected from
         * @returns ERMrest.ForeignKeyPseudoColumn
         */
        get leafColumn () {
            return this._leafColumn;
        },

        /**
         * if the 2 foreign key columns are part of a unqiue key
         * @returns boolean
         */
        get isUnique () {
            return this._isUnique;
        },

        /**
         * @returns {Object[]} filters array for getting the rows that should be disabled
         */
        disabledRowsFilter: function() {
            if (this._disabledRowsFilters === undefined) {
                var self = this;

                var filters = [];
                Object.keys(this._prefillObject.keys).forEach(function(key) {
                    filters.push({
                        source: [
                            { 'inbound': self._leafColumn.foreignKey.constraint_names[0] },
                            { 'outbound': self._mainColumn.foreignKey.constraint_names[0] },
                            self._mainColumn.foreignKey.mapping._to[0].name
                        ],
                        choices: [self._prefillObject.keys[key]]
                    });
                });

                this._disabledRowsFilters = filters;
            }

            return this._disabledRowsFilters;
        },

        /**
         * @returns {Object[]} filters array to use on leafColumn.reference for ensuring rows from the table are only able to be added if their key information is not null
         */
        andFiltersForLeaf: function() {
            if (this._andFilters === undefined) {
                var filters = [];
                // loop through all of key columns of the leaf foreign key pseudo column that make up the key information for the tablerows are selected from and create non-null filters
                this._leafColumn.foreignKey.key.colset.columns.forEach(function(col) {
                    filters.push({
                        source: col.name,
                        hidden: true,
                        not_null: true
                    });
                });

                this._andFilters = filters;
            }

            return this._andFilters;
        }
    };
