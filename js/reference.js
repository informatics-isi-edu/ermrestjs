
    /**
     * set callback function that converts app tag to app URL
     * @callback appLinkFn
     * @param {appLinkFn} fn callback function
     */
    module.appLinkFn = function(fn) {
        module._appLinkFn = fn;
    };

    /**
     * set callback function that triggers when a request returns with success
     * @callback onHTTPSuccess
     * @param {onHTTPSuccess} fn callback function
     */
    module.onHTTPSuccess = function(fn) {
        module._onHTTPSuccess = fn;
    };

    /**
     * This function resolves a URI reference to a {@link ERMrest.Reference}
     * object. It validates the syntax of the URI and validates that the
     * references to model elements in it are correct. This function makes a
     * call to the ERMrest server in order to get the `schema` which it uses to
     * validate the URI path.
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
    module.resolve = function (uri, contextHeaderParams) {
        var defer = module._q.defer();
        try {
            verify(uri, "'uri' must be specified");
            var location;

            // make sure all the dependencies are loaded
            module._onload().then(function () {
            //added try block to make sure it rejects all parse() related error
            // It should have been taken care by outer try but did not work
              try{
                location = module.parse(uri);
              } catch (error){
                return defer.reject(error);
              }
                var server = module.ermrestFactory.getServer(location.service, contextHeaderParams);

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
     * @private
     * @memberof ERMrest
     * @param {ERMrest.Location} location - The location object generated from parsing the URI
     * @param {ERMrest.Catalog} catalog - The catalog object. Since location.catalog is just an id, we need the actual catalog object too.
     * @desc
     * Creates a new Reference based on the given parameters. Other parts of API can access this function and it should only be used internally.
     */
    module._createReference = function (location, catalog) {
        return new Reference(location, catalog);
    };

    // NOTE: This function is only being used in unit tests.
    module._createPage = function (reference, etag, data, hasPrevious, hasNext) {
        return new Page(reference, etag, data, hasPrevious, hasNext);
    };

    /**
     * Throws a 'not implemented' error.
     *
     * A simple helper method.
     * @memberof ERMrest
     * @private
     * @function notimplemented
     * @throws {Error} 'not implemented' error
     */
    function notimplemented() {
        throw new Error('not implemented');
    }

    /**
     * Throws an {@link ERMrest.InvalidInputError} if test is
     * not `True`.
     * @memberof ERMrest
     * @private
     * @function verify
     * @param {boolean} test The test
     * @param {string} message The message
     * @throws {ERMrest.InvalidInputError} If test is not true.
     */
    function verify(test, message) {
        if (! test) {
            throw new module.InvalidInputError(message);
        }
    }

    /**
     * Returns true if given value is defined and not null.
     * @param  {object}  v the object that we want to test
     * @return {Boolean}  true if defined and not null, otherwise false.
     */
    function isDefinedAndNotNull(v) {
        return v !== null && v !== undefined;
    }

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
     * @param {ERMrest.Catalog} catalog - The catalog object. Since location.catalog is just an id, we need the actual catalog object too.
     */
    function Reference(location, catalog) {
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

        this._location = location;

        this._server = catalog.server;

        // if schema was not provided in the URI, find the schema
        this._table = catalog.schemas.findTable(location.tableName, location.schemaName);

        this._projectionTable = catalog.schemas.findTable(location.projectionTableName, location.projectionSchemaName);

        this._shortestKey = this._table.shortestKey;

        /**
         * @type {ERMrest.ReferenceAggregateFn}
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
         * The string form of the `URI` for this reference.
         * NOTE: It is not understanable by ermrest, and it also doesn't have the modifiers (sort, page).
         * Should not be used for sending requests to ermrest, use this.location.ermrestCompactUri instead.
         * @type {string}
         */
        get uri() {
            return this._location.compactUri;
        },

        /**
         * The session object from the server
         * @param {Object} session - the session object
         */
        /* jshint ignore:start */
        set session(session) {
            this._session = session;
        },
        /* jshint ignore:end */

        /**
         * The table object for this reference
         * @type {ERMrest.Table}
         */
         get table() {
            return this._table;
         },

         /**
          * The projection table object,
          * if there's a join in path, this will return a different object from .table
          * @type {ERMrest.Table}
          */
         get projectionTable() {
             return this._projectionTable;
         },

        /**
         * The array of column definitions which represent the model of
         * the resources accessible via this reference.
         *
         * _Note_: in database jargon, technically everything returned from
         * ERMrest is a 'tuple' or a 'relation'. A tuple consists of attributes
         * and the definitions of those attributes are represented here as the
         * array of {@link ERMrest.Column}s. The column definitions may be
         * contextualized (see {@link ERMrest.Reference#contextualize}).
         *
         * Usage:
         * ```
         * for (var i=0, len=reference.columns.length; i<len; i++) {
         *   var col = reference.columns[i];
         *   console.log("Column name:", col.name, "has display name:", col.displayname);
         * }
         * ```
         * @type {ERMrest.ReferenceColumn[]}
         */
        get columns() {
            if (this._referenceColumns === undefined) {
                this.generateColumnsList();
            }
            return this._referenceColumns;
        },

        /**
         * Facets that should be represented to the user.
         * Heuristics:
         *  - All the visible columns in compact context.
         *  - All the related entities in detailed context.
         *
         * Usage:
         * ```
         *  var facets = reference.facetColumns;
         *  var newRef = reference.facetColumns[0].addChoiceFilters(['value']);
         *  var newRef2 = newRef.facetColumns[1].addSearchFilter('text 1');
         *  var newRef3 = newRef2.facetColumns[2].addRangeFilter(1, 2);
         *  var newRef4 = newRef3.facetColumns[3].removeAllFilters();
         *  for (var i=0, len=newRef4.facetColumns.length; i<len; i++) {
         *    var fc = reference.facetColumns[i];
         *    console.log("Column name:", fc.column.name, "has following facets:", fc.filters);
         *  }
         * ```
         *
         * @return {ERMrest.FacetColumn[]}
         */
        get facetColumns() {
            if (this._facetColumns === undefined) {
                this._facetColumns = [];
                var self = this;
                var andOperator = module._FacetsLogicalOperators.AND;
                var searchTerm =  this.location.searchTerm;

                /*
                 * Given a ReferenceColumn, InboundForeignKeyPseudoColumn, or ForeignKeyPseudoColumn
                 * will return {"obj": facet object, "column": Column object}
                 * The returned facet will always be entity, if we cannot show
                 * entity picker (table didn't have simple key), we're ignoring it.
                 *
                 */
                var refColToFacetObject = function (refCol) {
                    if (refCol.isKey) {
                        return {
                            "obj": {"source": refCol._baseCols[0].name},
                            "column": refCol._baseCols[0]
                        };
                    }

                    // if the pseudo-column table doesn't have simple key
                    if (refCol.isPseudo && refCol.table.shortestKey.length > 1) {
                        return null;
                    }

                    if (refCol.isForeignKey) {
                        var constraint = refCol.foreignKey.constraint_names[0];
                        return {
                            "obj": {
                                "source":[
                                    {"outbound": constraint},
                                    refCol.table.shortestKey[0].name
                                ],
                                "markdown_name": refCol.displayname.unformatted,
                                "entity": true
                            },
                            "column": refCol.table.shortestKey[0]
                        };
                    }

                    if (refCol.isInboundForeignKey) {
                        var res = [];
                        var origFkR = refCol.foreignKey;
                        var association = refCol.reference.derivedAssociationReference;
                        var column = refCol.table.shortestKey[0];

                        res.push({"inbound": origFkR.constraint_names[0]});
                        if (association) {
                            res.push({
                                "outbound": association._secondFKR.constraint_names[0]
                            });
                        }
                        res.push(column.name);

                        return {"obj": {"source": res, "markdown_name": refCol.displayname.unformatted, "entity": true}, "column": column};
                    }

                    return { "obj": {"source": refCol.name}, "column": refCol._baseCols[0]};
                };

                // will return column or false
                var checkFacetObject = function (obj) {
                    if (!obj.source) {
                        return false;
                    }

                    var col = _getFacetSourceColumn(obj.source, self.table, module._constraintNames);

                    if (col && module._facetUnsupportedTypes.indexOf(col.type.name) === -1) {
                        return col;
                    }
                };

                var checkRefColumn = function (col) {
                    if (col.isPathColumn) {
                        if (col.hasAggregate) return false;
                        return {"obj": col.sourceObject, "column": col._baseCols[0]};
                    }

                    // we're not supporting facet for asset or composite keys (composite foreignKeys is supported).
                    if ((col.isKey && !col._simple) || col.isAsset) {
                        return false;
                    }

                    var fcObj = refColToFacetObject(col);

                    // this filters the following unsupported cases:
                    //  - foreignKeys in a table that only has composite keys.
                    if (!fcObj) {
                        return false;
                    }

                    // if in scalar, and is one of unsupported types
                    if (!fcObj.obj.entity && module._facetHeuristicIgnoredTypes.indexOf(fcObj.column.type.name) !== -1) {
                        return false;
                    }

                    return fcObj;
                };

                /*
                 * Given two source objects check if they are the same.
                 * Source can be a string or array. If it's an array, the last element
                 * must be an string and the other elements must have either `inbound`
                 * or `outbound` key which its value will be the constraint name array.
                 * example:
                 * - '*'
                 * - 'col_name'
                 * - [{"inbound":['s', 'c']}, {"outbound": ['s', 'c2']}, 'col']
                 */
                var sameSource = function (source, filterSource) {
                    if (!_isFacetSourcePath(source)) {
                        return !_isFacetSourcePath(filterSource) && _getFacetSourceColumnStr(source) === _getFacetSourceColumnStr(filterSource);
                    }

                    if (source.length !== filterSource.length) {
                        return false;
                    }

                    var key;
                    for (var i = 0; i < source.length; i++) {
                        if (typeof source[i] === "string") {
                            return source[i] === filterSource[i];
                        }

                        if (typeof source[i] !== "object" || typeof filterSource[i] !== "object") {
                            return false;
                        }

                        if (typeof source[i].inbound === "object") {
                            key = "inbound";
                        } else if (typeof source[i].outbound == "object") {
                            key = "outbound";
                        } else {
                            return false;
                        }

                        if (!Array.isArray(filterSource[i][key]) || filterSource[i][key].length !== 2) {
                            return false;
                        }

                        if (source[i][key][0] !== filterSource[i][key][0] || source[i][key][1] != filterSource[i][key][1]) {
                            return false;
                        }

                    }
                    return true;
                };

                // only add choices, range, search, and not_null
                var mergeFacetObjects = function (source, extra) {
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
                };

                // this is only valid in entity mode.
                // make sure that facetObject is pointing to the correct table.
                // NOTE: facetColumns MUST be only used in COMPACT_SELECT context
                // It doesn't feel right that I am doing contextualization in here,
                // it's something that should be in client.
                var checkForAlternative = function (facetObject) {
                    var currTable = facetObject.column.table;
                    var compactSelectTable = currTable._baseTable._getAlternativeTable(module._contexts.COMPACT_SELECT);

                    // there's no alternative table
                    if (currTable === compactSelectTable) {
                        return true;
                    }

                    var basedOnKey = facetObject.column.table.keys.all().filter(function (key) {
                        return !facetObject.column.nullok && key.simple && key.colset.columns[0] === facetObject.column;
                    }).length > 0;

                    if (!basedOnKey || facetObject.obj.entity === false) {
                        // it's not entity mode
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
                        if (!fk.simple || facetObject.column !== fk.key.colset.columns[0]) {
                            return false;
                        }
                        facetObject.column = fk.colset.columns[0];
                        facetObject.obj.source[facetObject.obj.source.length-1] = {"inbound": fk.constraint_names[0]};
                        facetObject.obj.source.push(facetObject.column.name);

                        // the makrdown_name came from the heuristics
                        if (!usedAnnotation && facetObject.obj.markdown_name) {
                            delete facetObject.obj.markdown_name;
                        }
                    }

                    return true;
                };


                // extract the filters and facets from the url
                var hasFilterOrFacet =this.location.facets || this.location.filter;
                var andFilters = [];
                var jsonFilters = this.location.facets ? this.location.facets.decoded : null;
                if (jsonFilters && jsonFilters.hasOwnProperty(andOperator) && Array.isArray(jsonFilters[andOperator])) {
                    andFilters = jsonFilters[andOperator];
                }

                // change filters to facet NOTE can be optimized to actually merge instead of just appending to list
                if (this.location.filter && this.location.filter.depth === 1 && Array.isArray(this.location.filter.facet.and)) {
                    Array.prototype.push.apply(andFilters, this.location.filter.facet.and);
                    this._location.removeFilters();
                }

                var annotationCols = -1, usedAnnotation = false;
                var facetObjects = [];

                // get column orders from annotation
                if (this._table.annotations.contains(module._annotations.VISIBLE_COLUMNS)) {
                    annotationCols = module._getAnnotationValueByContext(module._contexts.FILTER, this._table.annotations.get(module._annotations.VISIBLE_COLUMNS).content);
                    if (annotationCols.hasOwnProperty(andOperator) && Array.isArray(annotationCols[andOperator])) {
                        annotationCols = annotationCols[andOperator];
                    } else {
                        annotationCols = -1;
                    }
                }

                if (annotationCols !== -1) {
                    usedAnnotation = true;
                    //NOTE We're allowing duplicates in annotation.
                    annotationCols.forEach(function (obj) {
                        // if we have filters in the url, we will get the filters only from url
                        if (obj.source === "*" && andFilters.length === 0) {
                            if (!searchTerm) {
                                searchTerm = _getSearchTerm({"and": [obj]});
                            }
                            return;
                        }

                        var col = checkFacetObject(obj);
                        if (!col) return;

                        // make sure their not referring to the annotation object.
                        obj = module._simpleDeepCopy(obj);

                        // if we have filters in the url, we will get the filters only from url
                        if (hasFilterOrFacet) {
                            delete obj.not_null;
                            delete obj.choices;
                            delete obj.search;
                            delete obj.ranges;
                        }

                        facetObjects.push({"obj": obj, "column": col});
                    });
                } else {
                    // this reference should be only used for getting the list,
                    var detailedRef = (this._context === module._contexts.DETAILED) ? this : this.contextualize.detailed;
                    var compactRef = (this._context === module._contexts.COMPACT) ? this : this.contextualize.compact;


                    // all the visible columns in compact context
                    compactRef.columns.forEach(function (col) {
                        var fcObj = checkRefColumn(col);
                        if (!fcObj) return;

                        facetObjects.push(fcObj);
                    });

                    // all the realted in detailed context
                    detailedRef.related().forEach(function (relRef) {
                        var fcObj;
                        if (relRef.pseudoColumn) {
                            fcObj = {"obj": relRef.pseudoColumn.sourceObject, "column": relRef.pseudoColumn.baseColumn};
                        } else {
                            fcObj = checkRefColumn(new InboundForeignKeyPseudoColumn(self, relRef));
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
                            fcObj.obj.source.unshift({"outbound": compactRef.table._altForeignKey.constraint_names[0]});
                        }
                        facetObjects.push(fcObj);
                    });
                }

                // we should have facetObjects untill here, now we should combine it with andFilters
                var checkedObjects = {};

                // if we have filters in the url, we should just get the structure from annotation
                var j, facetLen = facetObjects.length;
                for (var i = 0; i < andFilters.length; i++) {
                    if (!andFilters[i].source) continue;
                    if (andFilters[i].source === "*") continue;

                    found = false;

                    // find the facet corresponding to the filter
                    for (j = 0; j < facetLen; j++) {

                        // it can be merged only once, since in a facet the filter is
                        // `or` and outside it's `and`.
                        if (checkedObjects[j]) continue;

                        if (sameSource(facetObjects[j].obj.source, andFilters[i].source)) {
                            checkedObjects[j] = true;
                            found = true;
                            // merge facet objects
                            mergeFacetObjects(facetObjects[j].obj, andFilters[i]);
                        }
                    }

                    // couldn't find the facet, create a new facet object
                    if (!found) {
                        var filterCol = checkFacetObject(andFilters[i]);
                        if (filterCol) {
                            facetObjects.push({"obj": andFilters[i], "column": filterCol});
                        }
                    }
                }


                // turn facetObjects into facetColumn
                facetObjects.forEach(function(fo, index) {
                    // if the function returns false, it couldn't handle that case,
                    // and therefore we are ignoring it.
                    // It might also change fo.obj and fo.column
                    if (!checkForAlternative(fo, usedAnnotation)) return;
                    self._facetColumns.push(new FacetColumn(self, index, fo.column, fo.obj));
                });



                /*
                 * In some cases we are updating the given sources and therefore the
                 * filter will change, so we must make sure that we update the url
                 * to reflect those changes. These chagnes are
                 * 1. When annotation is used and we have preselected filters.
                 * 2. When the main table has an alternative table.
                 * 3. When facet tables have alternative table
                 * This is just to make sure the facet filters and url are in sync.
                 */
                var newFilters = [];
                self._facetColumns.forEach(function(fc) {
                    if (fc.filters.length !== 0) {
                        newFilters.push(fc.toJSON());
                    }
                });

                // add the search term
                if (typeof searchTerm === "string") {
                    newFilters.push({"source": "*", "search": [searchTerm]});
                }

                if (newFilters.length > 0) {
                    //TODO we should make sure this is being called before read.
                    this._location.facets = {"and": newFilters};
                }

            }
            return this._facetColumns;
        },

        /**
         * Remove all the fitlers from facets
         * @param {boolean} sameFacet By default we're removing facets, if this is true facets won't be changed.
         * @return {ERMrest.reference} A reference without facet filters
         */
        removeAllFacetFilters: function (sameFacet) {
            var newReference = _referenceCopy(this);

            // update the facetColumns list
            newReference._facetColumns = [];
            this.facetColumns.forEach(function (fc) {
                newReference._facetColumns.push(
                    new FacetColumn(newReference, fc.index, fc._column, fc._facetObject, sameFacet ? fc.filters.slice() : [])
                );
            });

            // update the location objectcd
            newReference._location = this._location._clone();
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;
            if (!sameFacet) {
                newReference._location.facets = null;
            }
            newReference._location.removeFilters();

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
         * A Boolean value that indicates whether this Reference is _inherently_
         * unique. Meaning, that it can only refere to a single data element,
         * like a single row. This is determined based on whether the reference
         * filters on a unique key.
         *
         * As a simple example, the following would make a unique reference:
         *
         * ```
         * https://example.org/ermrest/catalog/42/entity/s:t/key=123
         * ```
         *
         * Assuming that table `s:t` has a `UNIQUE NOT NULL` constraint on
         * column `key`. A unique reference may be used to access at most one
         * tuple.
         *
         * _Note_: we intend to support other semantic checks on references like
         * `isUnconstrained`, `isFiltered`, etc.
         *
         * Usage:
         * ```
         * console.log("This reference is unique?", (reference.isUnique ? 'yes' : 'no'));
         * ```
         * @type {boolean}
         */
        get isUnique() {
            /* This getter should determine whether the reference is unique
             * on-demand.
             */
            notimplemented();
        },

        /**
         * Indicates whether the client has the permission to _create_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canCreate() {
            if (this._canCreate === undefined) {

                // can create if all are true
                // 1) user has write permission
                // 2) table is not generated
                // 3) not all visible columns in the table are generated
                var ref = (this._context === module._contexts.CREATE) ? this : this.contextualize.entryCreate;

                this._canCreate = ref._table.kind !== module._tableKinds.VIEW && !ref._table._isGenerated && ref._checkPermissions("insert");

                if (this._canCreate) {
                    var allColumnsDisabled = ref.columns.every(function (col) {
                        return (col.getInputDisabled(module._contexts.CREATE) !== false);
                    });
                    this._canCreate = !allColumnsDisabled;
                }
            }
            return this._canCreate;
        },

        /**
         * Indicates whether the client has the permission to _read_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canRead() {
            if (this._canRead === undefined) {
                this._canRead = this._checkPermissions("select");
            }
            return this._canRead;
        },

        /**
         * Indicates whether the client has the permission to _update_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canUpdate() {

            // can update if all are true
            // 1) user has write permission
            // 2) table is not generated
            // 3) table is not immutable
            // 4) not all visible columns in the table are generated/immutable
            if (this._canUpdate === undefined) {
                var ref = (this._context === module._contexts.EDIT) ? this : this.contextualize.entryEdit;

                this._canUpdate = ref._table.kind !== module._tableKinds.VIEW && !ref._table._isGenerated && !ref._table._isImmutable && ref._checkPermissions("update");

                if (this._canUpdate) {
                    var allColumnsDisabled = ref.columns.every(function (col) {
                        return (col.getInputDisabled(module._contexts.EDIT) !== false);
                    });
                    this._canUpdate = !allColumnsDisabled;
                }
            }
            return this._canUpdate;
        },

        /**
         * Indicates whether the client has the permission to _delete_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canDelete() {

            // can delete if all are true
            // 1) table is not non-deletable
            // 2) user has write permission
            if (this._canDelete === undefined) {
                this._canDelete = this._table.kind !== module._tableKinds.VIEW && !this._table._isNonDeletable && this._checkPermissions("delete");
            }
            return this._canDelete;
        },

        /**
         * This is a private funtion that checks the user permissions for modifying the affiliated entity, record or table
         * Sets a property on the reference object used by canCreate/canUpdate/canDelete
         * @memberof ERMrest
         * @private
         */
         _checkPermissions: function (permission) {
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
         * @returns {Promise} A promise resolved with a object containing `successful` and `failure` attributes.
         * Both are {@link ERMrest.Page} of results.
         * or rejected with any of the following errors:
         * - {@link ERMrest.InvalidInputError}: If `data` is not valid, or reference is not in `entry/create` context.
         * - {@link ERMrest.InvalidInputError}: If `limit` is invalid.
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        create: function(data, contextHeaderParams) {
            var self = this;
            try {
                //  verify: data is not null, data has non empty tuple set
                verify(data, "'data' must be specified");
                verify(data.length > 0, "'data' must have at least one row to create");
                verify(self._context === module._contexts.CREATE, "reference must be in 'entry/create' context.");

                var defer = module._q.defer();

                //  get the defaults list for the referenced relation's table
                var defaults = getDefaults();

                // construct the uri
                var uri = this._location.ermrestCompactUri;
                for (var i = 0; i < defaults.length; i++) {
                    uri += (i === 0 ? "?defaults=" : ',') + module._fixedEncodeURIComponent(defaults[i]);
                }

                // create the context header params for log
                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "create"};
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams, data.length)
                };

                //  do the 'post' call
                this._server._http.post(uri, data, config).then(function(response) {
                    var etag = response.headers().etag;
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
                            uri += module._fixedEncodeURIComponent(keyName) + '=' + module._fixedEncodeURIComponent(response.data[j][keyName]);
                        } else {
                            uri += '(';
                            for (var k = 0; k < self._shortestKey.length; k++) {
                                if (k !== 0)
                                    uri += '&';
                                keyName = self._shortestKey[k].name;
                                uri += module._fixedEncodeURIComponent(keyName) + '=' + module._fixedEncodeURIComponent(response.data[j][keyName]);
                            }
                            uri += ')';
                        }
                    }

                    var ref = new Reference(module.parse(uri), self._table.schema.catalog);
                    //  make a page of tuples of the results (unless error)
                    var page = new Page(ref.contextualize.compact, etag, response.data, false, false);

                    //  resolve the promise, passing back the page
                    return defer.resolve({
                      "successful": page,
                      "failed": null
                    });
                }, function error(response) {
                    var error = module._responseToError(response);
                    return defer.reject(error);
                }).catch(function (error) {
                    return defer.reject(error);
                });

                return defer.promise;
            }
            catch (e) {
                return module._q.reject(e);
            }

            function getDefaults() {
                // any row in data is sufficient. data should include the full set of visible columns
                var visibleColumnsNames = Object.keys(data[0]);
                var tableColumnsNames = self._table.columns._columns.map(function (col) {
                    return col.name;
                });
                // This is gets the difference between the table's set of columns and the reference's set of columns
                var defaults = columnDiff(tableColumnsNames, visibleColumnsNames);

                // loop through the data and add any columns not set to the defaults
                visibleColumnsNames.forEach(function (columnName) {
                    var notSet = true;
                    /**
                     * Loop through the rows and make sure the current column is not set in any of the rows.
                     * If not set in any row, add it to defaults.
                     * If 1 row has it set and none of the others, it cannot be part of defaults
                    **/
                    for (var m = 0; m < data.length; m++) {
                        if (data[m][columnName]!== undefined && data[m][columnName] !==null) {
                            notSet = false;
                            break;
                        }
                    }

                    if (notSet) defaults.push(columnName);
                });

                return defaults;
            }

            /**
             * This gets the difference between the two column sets. This is not the _symmetric_ difference.
             * If minuend is [1,2,3,4,5]
             * and subtrahend is [4,5,6]
             * the difference is [1,2,3]
             * The 6 is ignored because we only want to know what's in the minuend that is not in the subtrahend
             */
            function columnDiff(minuend, subtrahend) {
                var difference = [];

                difference = minuend.filter(function(col) {
                    return subtrahend.indexOf(col) == -1;
                });

                return difference;
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
         *
         * @returns {Promise} A promise resolved with {@link ERMrest.Page} of results,
         * or rejected with any of these errors:
         * - {@link ERMrest.InvalidInputError}: If `limit` is invalid.
         * - {@link ERMrest.BadRequestError}: If asks for sorting based on columns that are not sortable.
         * - {@link ERMrest.NotFoundError}: If asks for sorting based on columns that are not valid.
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        read: function(limit, contextHeaderParams) {
            var defer = module._q.defer(), self = this;

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

                // the pseudo-columns that their path is all outbound and Therefore
                // creates a one-to-one relation between source and destination, hence
                // we can just add them to the projection list to get the single value.
                var oneToOnePseudos = this.columns.filter(function (c) {
                    return c.isPseudo && c.isPathColumn && c.hasPath && c.isUnique && c.foreignKeys.length > 1;
                });

                var hasSort = Array.isArray(this._location.sortObject) && (this._location.sortObject.length !== 0),
                    locationPath = this.location.path,
                    _modifiedSortObject = [], // the sort object that is used for url creation (if location has sort).
                    sortMap = {}, // maps an alias to PseudoColumn, used for sorting
                    sortObject,  // the sort that will be accessible by this._location.sortObject
                    sortColNames = {}, // to avoid adding duplciate columns
                    sortObjectNames = {}, // to avoid computing sortObject logic more than once
                    addSort,
                    sortCols,
                    col, i, j, k, l;

                // make sure the page and modified sort object have teh same length
                var checkPageObject = function (loc, sortObject) {
                    sortObject = sortObject || loc.sortObject;
                    if (loc.afterObject && loc.afterObject.length !== sortObject.length) {
                        throw new module.InvalidPageCriteria("sort and after should have the same number of columns.", locationPath);
                    }

                    if (loc.beforeObject && loc.beforeObject.length !== sortObject.length) {
                        throw new module.InvalidPageCriteria("sort and before should have the same number of columns.", locationPath);
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
                    var foreignKeys = self._table.foreignKeys,
                        colName,
                        fkIndex, fk;

                    for (i = 0, k = 1, l = 1; i < sortObject.length; i++) {
                        // find the column in ReferenceColumns
                        try {
                            col = self.getColumnByName(sortObject[i].column);
                        } catch (e) {
                            throw new module.InvalidSortCriteria("Given column name `" + sortObject[i].column + "` in sort is not valid.",  locationPath);
                        }
                        // sortObject[i].column = col.name;

                        // column is not sortable
                        if (!col.sortable) {
                            throw new module.InvalidSortCriteria("Column " + sortObject[i].column + " is not sortable.",  locationPath);
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
                            if (col.isForeignKey || (col.isPathColumn && col.isUnique && col.foreignKeys.length === 1)) {
                                fkIndex = foreignKeys.all().indexOf(col.isForeignKey ? col.foreignKey : col.foreignKeys[0].obj);
                                colName = "F" + (foreignKeys.length() + k++);
                                sortMap[colName] = ["F" + (fkIndex+1), module._fixedEncodeURIComponent(sortCols[j].name)].join(":");
                            } else if (col.isPathColumn && col.hasPath && col.isUnique && col.foreignKeys.length > 0) {
                                // we have added it to the projection list
                                fkIndex = oneToOnePseudos.indexOf(col);
                                colName = "P" + (oneToOnePseudos.length + l++);
                                sortMap[colName] = ["P" + (fkIndex+1), module._fixedEncodeURIComponent(sortCols[j].name)].join(":");
                            } else {
                                colName = sortCols[j].name;
                                if (colName in sortColNames) {
                                    addSort = false;
                                }
                                sortColNames[colName] = true;
                            }

                            if (addSort) {
                                _modifiedSortObject.push({
                                    "column": colName,
                                    "descending": sortObject[i].descending !== undefined ? sortObject[i].descending : false
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
                    sortObject = this.display._rowOrder;
                    sortColNames = {};
                    sortObject.forEach(function (so) {
                        sortColNames[so.column] = true;
                    });
                }

                // ermrest requires key columns to be in sort param for paging
                if (typeof sortObject !== 'undefined') {
                    // if any of the sortCols is a key, then we don't neede to add the shortest key
                    var hasKey = this._table.keys.all().some(function (key) {
                        return key.colset.columns.every(function(c) {
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
                        col = this._shortestKey[sk].name;
                        sortObject.push({"column":col, "descending":false});
                    }
                }

                // this will update location.sort and all the uri and path
                this._location.sortObject = sortObject;

                var uri = this._location.ermrestCompactUri; // used for the http request

                /** Change api to attributegroup for retrieving extra information
                 * These information include:
                 * - Values for the foreignkeys.
                 * - Value for one-to-one pseudo-columns. These are the columns
                 * that their defined path is all in the outbound direction.
                 *
                 * This will just affect the http request and not this._location
                 *
                 * NOTE:
                 * This piece of code is dependent on the same assumptions as the current parser, which are:
                 *   0. There is no table called `T`, `M`, `F1`, `F2`, ..., `P1`, `P2`, ...
                 *   1. There is no alias in url (more precisely `T`, `M`, `F1`, `F2`, `F3`, `P1`, `P2`, ...)
                 *   2. Filter comes before the link syntax.
                 *   3. There is no trailing `/` in uri (as it will break the ermrest too).
                 * */
                if (this._table.foreignKeys.length() > 0 || oneToOnePseudos.length > 0) {
                    var compactPath = this._location.ermrestCompactPath,
                        mainTableAlias = this._location.mainTableAlias,
                        projectionTableAlias = this._location.projectionTableAlias,
                        aggList = [],
                        sortColumn,
                        addedCols;

                    // generate the projection for given pseudo column
                    var getPseudoPath = function (l) {
                        var pseudoPath = [];
                        oneToOnePseudos[l].foreignKeys.forEach(function (f, index, arr) {
                            pseudoPath.push(((index === arr.length-1) ? ("P" + (k+1) + ":=") : "") + f.obj.toString(!f.isInbound,true));
                        });
                        return pseudoPath.join("/");
                    };

                    // create the uri with attributegroup and alias
                    uri = [this._location.service, "catalog", this._location.catalog, "attributegroup", compactPath].join("/") + "/";

                    // add joins for foreign keys
                    for (k = this._table.foreignKeys.length() - 1;k >= 0 ; k--) {
                        // /F2:=left(id)=(s:t:c)/$M/F1:=left(id2)=(s1:t1:c1)/
                        uri += "F" + (k+1) + ":=left" + this._table.foreignKeys.all()[k].toString(true) + "/$" + mainTableAlias + "/";

                        // F2:array(F2:*),F1:array(F1:*)
                        aggList.push("F" + (k+1) + ":=array(F" + (k+1) + ":*)");
                    }

                    // add pseudo paths
                    for (k = oneToOnePseudos.length - 1; k >= 0; k--) {
                        uri += getPseudoPath(k) + "/$" + mainTableAlias + "/";

                        aggList.push("P" + (k+1) + ":=array(P" + (k+1) + ":*)");
                    }

                    // add sort columns (it will include the key)
                    if (hasSort) {
                        sortCols = _modifiedSortObject.map(function(sort) {return sort.column;});
                    } else {
                        sortCols = sortObject.map(function(sort) {return sort.column;});
                    }

                    addedCols = {};
                    for(k = 0; k < sortCols.length; k++) {
                        if (sortCols[k] in sortMap) {
                            // sort column has been created via PseudoColumn, so we should use a new alias
                            sortColumn = module._fixedEncodeURIComponent(sortCols[k]) + ":=" + sortMap[sortCols[k]];
                        } else {
                            sortColumn = module._fixedEncodeURIComponent(sortCols[k]);
                        }

                        // don't add duplicate columns
                        if (!(sortColumn in addedCols)) {
                            addedCols[sortColumn] = 1;
                        }
                    }

                    uri += Object.keys(addedCols).join(",") + ";"+mainTableAlias+":=array("+mainTableAlias+":*)," + aggList.join(",");
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

                // add limit
                uri = uri + "?limit=" + (limit + 1); // read extra row, for determining whether the returned page has next/previous page

                // attach `this` (Reference) to a variable
                // `this` inside the Promise request is a Window object
                var ownReference = this;
                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "read"};
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams, limit)
                };
                this._server._http.get(uri, config).then(function (response) {
                    var etag = response.headers().etag;

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
                    if (!ownReference.location.afterObject && ownReference.location.beforeObject && (page.tuples.length < limit || !page.hasPrevious) ) {
                        var referenceWithoutPaging = _referenceCopy(ownReference);
                        referenceWithoutPaging.location.beforeObject = null;

                        referenceWithoutPaging.read(limit).then(function rereadReference(rereadPage) {
                            defer.resolve(rereadPage);
                        }, function error(response) {
                            var error = module._responseToError(response);
                            defer.reject(error);
                        });
                    } else {
                        defer.resolve(page);
                    }

                }).catch(function (e) {
                    defer.reject(module._responseToError(e));
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

            // make a Reference copy
            var newReference = _referenceCopy(this);

            if (sort) {
                verify((sort instanceof Array), "input should be an array");
                verify(sort.every(module._isValidSortElement), "invalid arguments in array");

            }

            newReference._location = this._location._clone();
            newReference._location.sortObject = sort;
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;

            return newReference;
        },

        /**
         * Updates a set of resources.
         * @param {Array} tuples array of tuple objects so that the new data nd old data can be used to determine key changes.
         * tuple.data has the new data
         * tuple._oldData has the data before changes were made
         * @param {Object} contextHeaderParams the object that we want to log.
         * @returns {Promise} A promise resolved with a object containing `successful` and `failure` attributes.
         * Both are {@link ERMrest.Page} of results.
         * or rejected with any of these errors:
         * - {@link ERMrest.InvalidInputError}: If `limit` is invalid or reference is not in `entry/edit` context.
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        update: function(tuples, contextHeaderParams) {
            try {
                verify(tuples, "'tuples' must be specified");
                verify(tuples.length > 0, "'tuples' must have at least one row to update");
                verify(this._context === module._contexts.EDIT, "reference must be in 'entry/edit' context.");

                var defer = module._q.defer();

                var self = this,
                    oldAlias = "_o",
                    newAlias = "_n",
                    uri = this._location.service + "/catalog/" + this._location.catalog + "/attributegroup/" + this._location.schemaName + ':' + this._location.tableName + '/';

                var submissionData = [],        // the list of submission data for updating
                    columnProjections = [],     // the list of column names to use in the uri projection list
                    shortestKeyNames = [],      // list of shortest key names to use in the uri key list
                    keyWasModified = false,
                    tuple, oldData, allOldData = [], newData, allNewData = [], keyName;

                // for loop variables, NOTE: maybe we should name these better
                var i, j, k, m, n, t;

                var column, keyColumns, referenceColumn;

                // add column name into list of column projections if not in column projections set and data has changed
                var addProjection = function(colName) {
                    // don't add a column name in if it's already there
                    // this can be the case for multi-edit
                    // and if the data is unchanged, no need to add the column name to the projections list
                    // NOTE: This doesn't properly verify if date/timestamp/timestamptz values were changed
                    if ( (columnProjections.indexOf(colName) === -1) && (oldData[colName] != newData[colName]) ) {
                        columnProjections.push(colName);
                    }
                };

                // add data into submission data if in column projection set
                var addSubmissionData = function(index, colName) {
                    // if the column is in the column projections list, add the data to submission data
                    if (columnProjections.indexOf(colName) > -1) {
                        submissionData[index][colName + newAlias] = newData[colName];
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

                        // If columns is a pusedo column
                        if (column.isPseudo) {
                            // If a column is an asset column then set values for
                            // dependent properties like filename, bytes_count_column, md5 and sha
                            if (column.isAsset) {
                                // If column has a filename column then add it to the projections
                                if (column.filenameColumn) {
                                    addProjection(column.filenameColumn.name);
                                }

                                // If column has a bytecount column thenadd it to the projections
                                if (column.byteCountColumn) {
                                    addProjection(column.byteCountColumn.name);
                                }

                                // If column has a md5 column then add it to the projections
                                if (column.md5 && typeof column.md5 === 'object') {
                                    addProjection(column.md5.name);
                                }

                                // If column has a sha256 column then add it to the projections
                                if (column.sha256 && typeof column.sha256 === 'object') {
                                    addProjection(column.sha256.name);
                                }

                                addProjection(column.name);

                            } else {
                                keyColumns = [];

                                if (column.isKey) {
                                    keyColumns = column.key.colset.columns;
                                } else if (column.isForeignKey) {
                                    keyColumns =  column.foreignKey.colset.columns;
                                }

                                for (n = 0; n < keyColumns.length; n++) {
                                    keyColumnName = keyColumns[n].name;

                                    addProjection(keyColumnName);
                                }
                            }
                        } else {
                            addProjection(column.name);
                        }
                    }
                }

                if (columnProjections.length < 1) {
                    throw new module.NoDataChangedError("No data was changed in the update request. Please check the form content and resubmit the data.");
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

                        // If columns is a pusedo column
                        if (column.isPseudo) {
                            // If a column is an asset column then set values for
                            // dependent properties like filename, bytes_count_column, md5 and sha
                            if (column.isAsset) {
                                var isNull = newData[column.name] === null ? true : false;
                                /* Populate all values in row depending on column from current asset */

                                // If column has a filename column then populate its value
                                if (column.filenameColumn) {
                                    // If asset url is null then set filename also null
                                    if (isNull) newData[column.filenameColumn.name] = null;
                                    addSubmissionData(i, column.filenameColumn.name);
                                }

                                // If column has a bytecount column then populate its value
                                if (column.byteCountColumn) {
                                    // If asset url is null then set filename also null
                                    if (isNull) newData[column.byteCountColumn.name] = null;
                                    addSubmissionData(i, column.byteCountColumn.name);
                                }

                                // If column has a md5 column then populate its value
                                if (column.md5 && typeof column.md5 === 'object') {
                                    // If asset url is null then set filename also null
                                    if (isNull) newData[column.md5.name] = null;
                                    addSubmissionData(i, column.md5.name);
                                }

                                // If column has a sha256 column then populate its value
                                if (column.sha256 && typeof column.sha256 === 'object') {
                                    // If asset url is null then set filename also null
                                    if (isNull) newData[column.sha256.name] = null;
                                    addSubmissionData(i, column.sha256.name);
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
                                    keyColumnName = keyColumns[n].name;

                                    addSubmissionData(i, keyColumnName);
                                }
                            }
                        } else {
                            addSubmissionData(i, column.name);
                        }
                    }
                }

                // always alias the keyset for the key data
                for (j = 0; j < shortestKeyNames.length; j++) {
                    if (j !== 0) uri += ',';
                    // alias all the columns for the key set
                    uri += module._fixedEncodeURIComponent(shortestKeyNames[j]) + oldAlias + ":=" + module._fixedEncodeURIComponent(shortestKeyNames[j]);
                }

                // the keyset is always aliased with the old alias, so make sure to include the new alias in the column projections
                for (k = 0; k < columnProjections.length; k++) {
                    // Important NOTE: separator for denoting where the keyset ends and the update column set begins. The shortest key is used as the keyset
                    uri += (k === 0 ? ';' : ',');
                    // alias all the columns for the key set
                    uri += module._fixedEncodeURIComponent(columnProjections[k]) + newAlias + ":=" + module._fixedEncodeURIComponent(columnProjections[k]);
                }

                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "update"};
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams, submissionData.length)
                };
                this._server._http.put(uri, submissionData, config).then(function updateReference(response) {
                    // Some data was not updated
                    if (response.status === 200 && response.data.length < submissionData.length) {
                        var updatedRows = response.data;
                        // no data updated
                        if (updatedRows.length === 0) {
                            throw new module.ForbiddenError(403, "Editing records for table: " + self.table.name + " is not allowed.");
                        }
                    }

                    var etag = response.headers().etag;
                    var pageData = [];

                    var uri = self._location.service + "/catalog/" + self._location.catalog + "/entity/" + self._location.schemaName + ':' + self._location.tableName + '/';
                    // loop through each returned Row and get the key value
                    for (j = 0; j < response.data.length; j++) {
                        // build the uri
                        if (j !== 0) uri += ';';

                        // shortest key is made up from one column
                        if (self._shortestKey.length == 1) {
                            keyName = self._shortestKey[0].name;
                            uri += module._fixedEncodeURIComponent(keyName) + '=' + module._fixedEncodeURIComponent( getAliasedKeyVal(response.data[j], keyName) );
                        } else {
                            uri += '(';
                            for (k = 0; k < self._shortestKey.length; k++) {
                                if (k !== 0)
                                uri += '&';
                                keyName = self._shortestKey[k].name;
                                uri += module._fixedEncodeURIComponent(keyName) + '=' + module._fixedEncodeURIComponent( getAliasedKeyVal(response.data[j], keyName) );
                            }
                            uri += ')';
                        }

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
                        for (j in tuples[i].data) {
                            if (!tuples[i].data.hasOwnProperty(j)) continue;
                            if (j in pageData[i]) continue; // pageData already has this data
                            pageData[i][j] =tuples[i].data[j]; // add the missing data
                        }
                    }

                    var ref = new Reference(module.parse(uri), self._table.schema.catalog).contextualize.compact;
                    var successfulPage = new Page(ref, etag, pageData, false, false);
                    var failedPage = null;


                    // if the returned page is smaller than the initial page,
                    // then some of the columns failed to update.
                    if (tuples.length > successfulPage.tuples.length) {
                        var unchangedPageData = [], keyMatch, rowMatch;

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
                                unchangedPageData.push(tuples[i].data);
                            }
                        }
                        failedPage = new Page(ref, etag, unchangedPageData, false, false);
                    }

                    defer.resolve({
                        "successful": successfulPage,
                        "failed": failedPage
                    });
                }, function error(response) {
                    var error = module._responseToError(response);
                    return defer.reject(error);
                }).catch(function (error) {
                    return defer.reject(error);
                });

                return defer.promise;
            }
            catch (e) {
                return module._q.reject(e);
            }
        },

        /**
         * Deletes the referenced resources.
         * NOTE This will ignore the provided sort and paging on the reference, make
         * sure you are calling this on specific set or rows (filtered).
         *
         * @param {Object} contextHeaderParams the object that we want to log.
         * @returns {Promise} A promise resolved with empty object or rejected with any of these errors:
         * - ERMrestjs corresponding http errors, if ERMrest returns http error.
         */
        delete: function(contextHeaderParams) {
            try {

                var defer = module._q.defer();

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
                var self = this, delFlag = module._operationsFlag.DELETE;
                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "delete"};
                }
                var config = {
                    headers: this._generateContextHeader(contextHeaderParams)
                };
                this._server._http.delete(this.location.ermrestCompactUri, config).then(function (deleteResponse) {
                    defer.resolve();
                }, function error(deleteError) {
                    return defer.reject(module._responseToError(deleteError, self, delFlag));
                }).catch(function (catchError) {
                    return defer.reject(module._responseToError(catchError, self, delFlag));
                });

                return defer.promise;
            }
            catch (e) {
                return module._q.reject(e);
            }
        },

        /**
         * An object which contains row display properties for this reference.
         * It is determined based on the `table-display` annotation. It has the
         * following properties:
         *
         *   - `rowOrder`: `[{ column: '`_column name_`', descending:` {`true` | `false` } `}`...`]` or `undefined`,
         *   - `type`: {`'table'` | `'markdown'` | `'module'`} (default: `'table'`)
         *
         * If type is `'markdown'`, the object will also these additional
         * properties:
         *
         *   - `markdownPattern`: markdown pattern,
         *   - `separator`: markdown pattern (default: newline character `'\n'`),
         *   - `suffix`: markdown pattern (detaul: empty string `''`),
         *   - `prefix`: markdown pattern (detaul: empty string `''`)
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

                // displaytype default valeu for compact/breif/inline should be markdown. otherwise table
                var displayType =  (this._context === module._contexts.COMPACT_BRIEF_INLINE) ? module._displayTypes.MARKDOWN :  module._displayTypes.TABLE;

                this._display = {
                     type: displayType,
                    _separator: "\n",
                    _prefix: "",
                    _suffix: ""
                };

                var annotation;
                // If table has table-display annotation then set it in annotation variable
                if (this._table.annotations.contains(module._annotations.TABLE_DISPLAY)) {
                    annotation = module._getRecursiveAnnotationValue(this._context, this._table.annotations.get(module._annotations.TABLE_DISPLAY).content);
                }

                // If annotation is defined then parse it
                if (annotation) {

                    // Set row_order value
                    // columns defined in row_order can have column_order
                    // This will take care of that and will return the actual columns that
                    // we want sort to be based on.
                    if (Array.isArray(annotation.row_order)) {
                        var rowOrder = [], col, sortObjectNames = {}, sortColNames = {};
                        annotation.row_order.forEach(function (ro) {
                            if (!ro.column || ro.column in sortObjectNames) return;
                            sortObjectNames[ro.column] = true;

                            // make sure column exists and is sortable
                            if (!self.table.columns.has(ro.column)) return;
                            col = self.getColumnByName(ro.column);
                            if (!col.sortable) return;

                            col._sortColumns.forEach(function (sc) {
                                if (sc.name in sortColNames) return;
                                sortColNames[sc.name] = true;
                                rowOrder.push({
                                    "column": sc.name,
                                    "descending": (ro.descending === true) ? true : false
                                });
                            });
                        });
                        this._display._rowOrder = rowOrder;
                    }


                    // Set default page size value
                    if (typeof annotation.page_size === 'number') {
                        this._display.defaultPageSize = annotation.page_size;
                    }

                    // If module is not empty then set its associated properties
                    // Else if row_markdown_pattern is not empty then set its associated properties
                    if (typeof annotation.module === 'string') {

                        // TODO: write code for module handling

                        this._display.type = module._displayTypes.MODULE;

                    } else if (typeof annotation.row_markdown_pattern === 'string') {

                        this._display.type = module._displayTypes.MARKDOWN;

                        // Render the row by composing a markdown representation
                        this._display._markdownPattern = annotation.row_markdown_pattern;

                        // Insert separator markdown text between each expanded rowpattern when presenting row sets. Default is new line "\n"
                        this._display._separator = (typeof annotation.separator_markdown === 'string') ? annotation.separator_markdown : "\n";

                        // Insert prefix markdown before the first rowpattern expansion when presenting row sets. (Default empty string "".)
                        this._display._prefix = (typeof annotation.prefix_markdown === 'string') ? annotation.prefix_markdown : "";

                        // Insert suffix markdown after the last rowpattern expansion when presenting row sets. (Default empty string "".)
                        this._display._suffix = (typeof annotation.suffix_markdown === 'string') ? annotation.suffix_markdown : "";

                    }
                }

            }

            return this._display;
        },

        /**
         * The "related" references. Relationships are defined by foreign key
         * references between {@link ERMrest.Table}s. Those references can be
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
         * @returns {ERMrest.Reference[]}
         *
         * @param {ERMrest.Tuple=} tuple the current tuple
         */
        related: function (tuple) {
            if (this._related === undefined) {
                /*
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
                 */
                this._related = [];

                var visibleFKs = this._table.referredBy._contextualize(this._context),
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
                    // if in the visible columns list
                    if (currentColumns[fkr.name]) {
                        continue;
                    }

                    if (fkr.isPath) {
                        // since we're sure that the pseudoColumn either going to be
                        // general pseudoColumn or InboundForeignKeyPseudoColumn then it will have reference
                        this._related.push(module._createPseudoColumn(this, fkr.column, fkr.object, fkr.name, tuple, true).reference);
                    } else {
                        fkr = fkr.foreignKey;

                        // make sure that this fkr is not from an alternative table to self
                        if (fkr._table._isAlternativeTable() && fkr._table._altForeignKey !== undefined &&
                        fkr._table._baseTable === this._table && fkr._table._altForeignKey === fkr) {
                            continue;
                        }

                        this._related.push(this._generateRelatedReference(fkr, tuple, true));
                    }
                }

                if (notSorted && this._related.length !== 0) {
                    return this._related.sort(function (a, b) {
                        // displayname
                        if (a.displayname.value != b.displayname.value) {
                            return a.displayname.value.localeCompare(b.displayname.value);
                        }

                        // columns
                        if (a._related_key_column_positions.join(",") != b._related_key_column_positions.join(",")) {
                            return a._related_key_column_positions > b._related_key_column_positions ? 1 : -1;
                        }

                        // foreignkey columns
                        return a._related_fk_column_positions >= b._related_fk_column_positions ? 1 : -1;
                    });
                }

            }
            return this._related;
        },

        /**
         * This will generate a new unfiltered reference each time.
         * Returns a reference that points to all entities of current table
         *
         * @type {ERMrest.Reference}
         */
        get unfilteredReference() {
            var table = this._table;
            var refURI = [
                table.schema.catalog.server.uri ,"catalog" ,
                table.schema.catalog.id, this.location.api,
                [module._fixedEncodeURIComponent(table.schema.name),module._fixedEncodeURIComponent(table.name)].join(":"),
            ].join("/");
            return new Reference(module.parse(refURI), table.schema.catalog);
        },

        /**
        * App-specific URL
        *
        * @type {String}
        * @throws {Error} if `_appLinkFn` is not defined.
        */
        get appLink() {
            if (typeof module._appLinkFn !== 'function') {
                throw new Error("`appLinkFn` function is not defined.");
            }
            var tag = this._context ? this._table._getAppLink(this._context) : this._table._getAppLink();
            return module._appLinkFn(tag, this._location, this._context);
        },

        /**
         * Returns a uri that will properly generate the download link for a csv document
         * NOTE It will not have the same sort and paging as the reference.
         *
         * @returns {String} A string representing the url for direct csv download
         **/
        get csvDownloadLink() {
            return this.location.ermrestCompactUri + "?limit=none&accept=csv&uinit=1&download=" + module._fixedEncodeURIComponent(this.displayname.unformatted);
        },

        /**
         * The default information that we want to be logged including catalog, schema_table, and facet (filter).
         * @type {Object}
         */
        get defaultLogInfo() {
            var obj = {};
            obj.schema_table = this.table.schema.name + ":" + this.table.name;

            if (this.location.facets) {
                obj.facet = this.location.facets.decoded;
            } else if (this.location.filter) {
                if (this.location.filter.facet) {
                    obj.facet = this.location.filter.facet;
                } else {
                    obj.filter = this.location.filtersString;
                }
            }

            return obj;
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
                    throw new module.InvalidInputError("Invalid input. Seach expects a string.");
            }


            // make a Reference copy
            var newReference = _referenceCopy(this);

            newReference._location = this._location._clone();
            newReference._location.beforeObject = null;
            newReference._location.afterObject = null;
            newReference._location.search(term);

            // update facet columns list
            // TODO can be refactored
            newReference._facetColumns = [];
            this.facetColumns.forEach(function (fc) {
                newReference._facetColumns.push(
                    new FacetColumn(newReference, fc.index, fc._column, fc._facetObject, fc.filters.slice())
                );
            });

            return newReference;
        },

        /**
         *
         * @param {ERMrest.ColumnAggregateFn[]} aggregateList - list of aggregate functions to apply to GET uri
         * @return {Promise} - Promise contains an array of the aggregate values in the same order as the supplied aggregate list
         */
        getAggregates: function(aggregateList, contextHeaderParams) {
            var defer = module._q.defer();
            var url;

            // create the context header params for log
            if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                contextHeaderParams = {"action": "aggregate"};
            }
            var config = {
                headers: this._generateContextHeader(contextHeaderParams)
            };

            var URL_LENGTH_LIMIT = 2048;

            var urlSet = [];
            var baseUri = this.location.service + "/catalog/" + this.location.catalog + "/aggregate/" + this.location.ermrestCompactPath + "/";

            for (var i = 0; i < aggregateList.length; i++) {
                var agg = aggregateList[i];

                // if this is the first aggregate, begin with the baseUri
                if (i === 0) {
                    url = baseUri;
                } else {
                    url += ",";
                }

                // if adding the next aggregate to the url will push it past url length limit, push url onto the urlSet and reset the working url
                if ((url + i + ":=" + agg).length > URL_LENGTH_LIMIT) {
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
            var http = this._server._http;
            for (var j = 0; j < urlSet.length; j++) {
                aggregatePromises.push(http.get(urlSet[j], config));
            }

            module._q.all(aggregatePromises).then(function getAggregates(response) {
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
                var error = module._responseToError(response);
                return defer.reject(error);
            }).catch(function (error) {
                return defer.reject(error);
            });

            return defer.promise;
        },


        /**
         * Given a page, will change the reference paging options (before, and after)
         * to match the page.
         * NOTE: Limitations:
         * - Current reference's table and page's table must be the same.
         * - page's reference cannot have any facets (apart from search).
         * @param  {ERMrest.Page} page
         * @return {ERMrest.Reference} reference with new page settings.
         */
        setSamePaging: function (page) {

            var pageRef = page._ref;

            /*
            * It only works when page's table and current table are the same.
            */
            if (pageRef.table !== this.table) {
                throw new module.InvalidInputError("Given page is not from the same table.");
            }


            var newRef = _referenceCopy(this);
            newRef._location = this._location._clone();

            // same search
            // TODO this should be eventually facets and not just search
            // Current requirement only needs search.
            // If we change it to facet, we have to merge the facets
            if (typeof pageRef.location.searchTerm === "string") {
                newRef._location.search(pageRef.location.searchTerm);
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
            newRef._location.sortObject =  module._simpleDeepCopy(pageRef._location.sortObject);

            // same pagination
            newRef._location.afterObject =  pageRef._location.afterObject ? module._simpleDeepCopy(pageRef._location.afterObject) : null;
            newRef._location.beforeObject =  pageRef._location.beforeObject ? module._simpleDeepCopy(pageRef._location.beforeObject) : null;

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
            this._projectionTable = table;
            this._shortestKey = table.shortestKey;
            this._displayname = table.displayname;
            delete this._referenceColumns;
            delete this._related;
            delete this._canCreate;
            delete this._canRead;
            delete this._canUpdate;
            delete this._canDelete;
        },

        /**
         * Find a column given its name. It will search in this order:
         * 1. Visible columns
         * 2. Table columns
         * 3. search by constraint name in visible foreignkey and keys (backward compatibility)
         * Will throw an error if
         * @param  {string} name name of column
         * @return {ERMrest.ReferenceColumn}
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

            throw new module.NotFoundError("", "Column " + name + " not found in table " + this.table.name + ".");
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
         *      1.2 otherwise find the corresponding column if exits and add it (avoid duplicate),
         *          apply *addColumn* heuristics explained below.
         *
         * 2.otherwise go through list of table columns
         *      2.0 create a pseudo-column for key if context is not detailed, entry, entry/create, or entry/edit and we have key that is notnull and notHTML
         *      2.1 check if column has not been processed before.
         *      2.2 hide the columns that are part of origFKR.
         *      2.3 if column is serial and part of a simple key hide it.
         *      2.4 if it's not part of any foreign keys
         *          apply *addColumn* heuristics explained below.
         *      2.5 go through all of the foreign keys that this column is part of.
         *          2.5.1 make sure it is not hidden(+).
         *          2.5.2 if it's simple fk, just create PseudoColumn
         *          2.5.3 otherwise add the column just once and append just one PseudoColumn (avoid duplicate)
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
         * @param  {ERMrest.Tuple} tuple the data for the current refe
         * @return {ERMrest.ReferenceColumn[]}  Array of {@link ERMrest.ReferenceColumn}.
         */
        generateColumnsList: function(tuple) {

            this._referenceColumns = [];

            var self = this;

            // check if we should hide some columns or not.
            // NOTE: if the reference is actually an inbound related reference, we should hide the foreign key that created this link.
            var hasOrigFKR = typeof this.origFKR != "undefined" && this.origFKR !== null && !this.origFKR._table._isPureBinaryAssociation();

            var columns = -1,
                consideredColumns = {}, // to avoid duplicate pseudo columns
                tableColumns = {}, // to make sure the hashes we genereate are not clashing with table column names
                compositeFKs = [], // to add composite keys at the end of the list
                assetColumns = [], // columns that have asset annotation
                hiddenFKR = this.origFKR,
                refTable = this._table,
                invalid,
                colAdded,
                fkName,
                sourceCol, refCol,
                pseudoNameObj, pseudoName, isHash,
                hasInbound, isEntity, hasPath, isEntityMode,
                isEntry,
                colFks,
                ignore, cols, col, fk, i, j;

            var context = this._context;
            isEntry = module._isEntryContext(context);

            // should hide the origFKR in case of inbound foreignKey (only in compact/brief)
            var hideFKR = function (fkr) {
                return context == module._contexts.COMPACT_BRIEF && hasOrigFKR && fkr == hiddenFKR;
            };
            var hideFKRByName = function (hash) {
                return context == module._contexts.COMPACT_BRIEF && hasOrigFKR && hash.name == hiddenFKR.name;
            };

            // should hide the columns that are part of origFKR. (only in compact/brief)
            var hideColumn = function (col) {
                return context == module._contexts.COMPACT_BRIEF && hasOrigFKR && hiddenFKR.colset.columns.indexOf(col) != -1;
            };

            // this function will take care of adding column and asset column
            var addColumn = function (col) {
                if (col.type.name === "text" && col.annotations.contains(module._annotations.ASSET)) {
                    var assetCol = new AssetPseudoColumn(self, col);
                    assetColumns.push(assetCol);
                    self._referenceColumns.push(assetCol);
                    return;
                }

                // if annotation is not present,
                self._referenceColumns.push(new ReferenceColumn(self, [col]));
            };

            // make sure generated hash is not the name of any columns in the table
            var nameExistsInTable = function (name, obj) {
                if (name in tableColumns) {
                    console.log("Generated Hash `" + name + "` for pseudo-column exists in table `" + self.table.name +"`.");
                    console.log("Ignoring the following in visible-columns: ", obj);
                    return true;
                }
                return false;
            };

            var pf = module._printf;
            var wm = module._warningMessages;
            var logCol = function (bool, message, i) {
                if (bool) {
                    console.log("columns list for table: " + self.table.name + ", context: " + context + ", column index:" + i);
                    console.log(message);
                }
                return bool;
            };

            // create a map of tableColumns to make it easier to find one
            this._table.columns.all().forEach(function (c) {
                tableColumns[c.name] = true;
            });

            // get column orders from annotation
            if (this._table.annotations.contains(module._annotations.VISIBLE_COLUMNS)) {
                columns = module._getRecursiveAnnotationValue(this._context, this._table.annotations.get(module._annotations.VISIBLE_COLUMNS).content);
            }

             // annotation
            if (columns !== -1) {
                for (i = 0; i < columns.length; i++) {
                    col = columns[i];
                    // foreignKey or key
                    if (Array.isArray(col)) {
                        fk = this._table.schema.catalog.constraintByNamePair(col);
                        if (fk !== null) {
                            fkName = fk.object.name;
                            switch(fk.subject) {
                                case module._constraintTypes.FOREIGN_KEY:
                                    fk = fk.object;
                                    // fk is in this table, avoid duplicate and it's not hidden.
                                    if (!hideFKR(fk)) {
                                        // outbound foreignkey
                                        if (fk._table == this._table) {
                                            // avoid duplicate and same name in database
                                            if (!logCol((fkName in consideredColumns), wm.DUPLICATE_FK, i) && !nameExistsInTable(fkName, col)) {
                                                consideredColumns[fkName] = true;
                                                this._referenceColumns.push(new ForeignKeyPseudoColumn(this, fk));
                                            }
                                        }
                                        // inbound foreignkey
                                        else if (fk.key.table == this._table && !isEntry) {
                                            var relatedRef = this._generateRelatedReference(fk, tuple, true);
                                            // this is inbound foreignkey, so the name must change.
                                            fkName = _generateForeignKeyName(fk, true);
                                            if (!(fkName in consideredColumns) && !nameExistsInTable(fkName, col)) {
                                                consideredColumns[fkName] = true;
                                                this._referenceColumns.push(new InboundForeignKeyPseudoColumn(this, relatedRef, null, fkName));
                                            }
                                        } else {
                                            console.log(wm.FK_NOT_RELATED);
                                        }
                                    }
                                    break;
                                case module._constraintTypes.KEY:
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
                                                    this._referenceColumns.push(new ReferenceColumn(this, [cols[j]]));
                                                }
                                            }
                                        } else {
                                            this._referenceColumns.push(new KeyPseudoColumn(this, fk));
                                        }
                                    }
                                    break;
                                default:
                                    // visible-columns annotation only supports key, foreignkey and columns.
                            }
                        }
                    }
                    // pseudo-column
                    else if (typeof col === "object") {
                        // invalid source
                        if (logCol(!col.source, wm.INVALID_SOURCE, i)) continue;

                        // check the path and get the column object
                        sourceCol = _getFacetSourceColumn(col.source, this._table, module._constraintNames);

                        // invalid source
                        if (logCol(!sourceCol, wm.INVALID_SOURCE)) {
                            continue;
                        }

                        // generate appropriate name for the given object
                        pseudoNameObj = _generatePseudoColumnName(col, sourceCol);
                        pseudoName = pseudoNameObj.name;
                        isHash = pseudoNameObj.isHash; // whether its the actual name of column, or generated hash
                        hasPath = _isFacetSourcePath(col.source);
                        hasInbound = _sourceHasInbound(col.source);
                        isEntity = _isFacetEntityMode(col, sourceCol);

                        // invalid/hidden pseudo-column:
                        // 1. duplicate
                        // 2. column/foreignkey that needs to be hidden.
                        // 3. The generated hash is a column for the table in database
                        // 4. invalid aggregate function
                        // 5. in entity mode with scalar aggregate functions
                        ignore = logCol((pseudoName in consideredColumns), wm.DUPLICATE_PC, i) ||
                                 hideFKRByName(pseudoName) ||
                                 (!hasPath && hideColumn(sourceCol)) ||
                                 logCol((col.aggregate && module._pseudoColAggregateFns.indexOf(col.aggregate) === -1), wm.INVALID_AGG, i) ||
                                 logCol((module._pseudoColScalarAggregateFns.indexOf(col.aggregate) !== -1 && isEntity), wm.NO_SCALAR_AGG_IN_ENT, i) ||
                                 logCol((!col.aggregate && hasInbound && !isEntity), wm.MULTI_SCALAR_NEED_AGG, i) ||
                                 logCol((!col.aggregate && hasInbound && isEntity && context !== module._contexts.DETAILED), wm.MULTI_ENT_NEED_AGG, i) ||
                                 logCol(col.aggregate && isEntry, wm.NO_AGG_IN_ENTRY, i) ||
                                 logCol(isEntry && hasPath && (col.source.length > 2 || col.source[0].inbound), wm.NO_PATH_IN_ENTRY, i) ||
                                 (isHash && nameExistsInTable(pseudoName, col));

                        // avoid duplciates and hide the column
                        if (!ignore) {
                            consideredColumns[pseudoName] = true;
                            refCol = module._createPseudoColumn(this, sourceCol, col, pseudoName, tuple, isEntity);

                            // to make sure we're removing asset related (filename, size, etc.) column in entry
                            if (refCol.isAsset) {
                                assetColumns.push(refCol);
                            }

                            // if entity and KeyPseudoColumn, we should instead add the underlying columns
                            if (isEntry && refCol.isKey) {
                                cols = refCol.key.colset.columns;
                                for (j = 0; j < cols.length; j++) {
                                    col = cols[j];
                                    if (!(col.name in consideredColumns) && !hideColumn(col)) {
                                        consideredColumns[col.name] = true;
                                        this._referenceColumns.push(new ReferenceColumn(this, [cols[j]]));
                                    }
                                }
                            }

                            // in entry mode, pseudo-column, inbound fk, and key are not allowed
                            if (!(isEntry && (refCol.isPathColumn || refCol.isInboundForeignKey || refCol.isKey) )) {
                                this._referenceColumns.push(refCol);
                            }
                        }

                    }
                    // column
                    else {
                        try {
                            col = this._table.columns.get(col);
                        } catch (exception) {}

                        // if column is not defined, processed before, or should be hidden
                        ignore = logCol(typeof col != "object" || col === null, wm.INVALID_COLUMN, i) ||
                                 logCol((col.name in consideredColumns), wm.DUPLICATE_COLUMN, i) ||
                                 hideColumn(col);

                        if (!ignore) {
                            consideredColumns[col.name] = true;
                            addColumn(col);
                        }
                    }
                }
            }
            // heuristics
            else {

                //add the key
                if (!isEntry && this._context != module._contexts.DETAILED ) {
                    var key = this._table._getRowDisplayKey(this._context);
                    if (key !== undefined && !nameExistsInTable(key.name, "display key")) {
                        consideredColumns[key.name] = true;
                        this._referenceColumns.push(new KeyPseudoColumn(this, key));

                        // make sure key columns won't be added
                        columns = key.colset.columns;
                        for (i = 0; i < columns.length; i++) {
                            consideredColumns[columns[i].name] = true;
                        }
                    }
                }

                columns = this._table.columns.all();
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
                    if (col.memberOfForeignKeys.length === 0) {
                        addColumn(col);
                    } else {
                        // sort foreign keys of a column
                        if (col.memberOfForeignKeys.length > 1) {
                            colFKs = col.memberOfForeignKeys.sort(function (a, b) {
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
                                    this._referenceColumns.push(new ForeignKeyPseudoColumn(this, fk));
                                }
                            } else { // composite FKR

                                // add the column if context is not entry and avoid duplicate
                                if (!isEntry && !(col.name in consideredColumns)) {
                                    consideredColumns[col.name] = true;
                                    this._referenceColumns.push(new ReferenceColumn(this, [col]));
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
                    this._referenceColumns.push(compositeFKs[i]);
                }
            }

            // if edit context remove filename, bytecount, md5, and sha256 from visible columns
            if (isEntry && assetColumns.length !== 0) {

                // given a column will remove it from visible columns
                // this function is used for removing filename, bytecount, md5, and sha256 from visible columns
                var removeCol = function(col) {
                    // if columns are not defined in the annotation, they will be null.
                    // so we have to check it first.
                    if (col === null) {
                        return;
                    }

                    // column is not in list of visible columns
                    if (!(col.name in consideredColumns)) {
                        return;
                    }

                    // find the column and remove it
                    for (var x = 0; x < self._referenceColumns.length; x++){
                        if (!self._referenceColumns[x].isPseudo && self._referenceColumns[x].name === col.name) {
                            self._referenceColumns.splice(x, 1);
                            return;
                        }
                    }
                };

                for(i = 0; i < assetColumns.length; i++) {
                    // hide the columns
                    removeCol(assetColumns[i].filenameColumn);
                    removeCol(assetColumns[i].byteCountColumn);
                    removeCol(assetColumns[i].md5);
                    removeCol(assetColumns[i].sha256);
                }
            }

            // If not in edit context i.e in read context remove the hidden columns which cannot be selected.
            if (!isEntry) {

                // Iterate over all reference columns
                for (i = 0; i < this._referenceColumns.length; i++) {
                    refCol = this._referenceColumns[i];
                    var isHidden = false;

                    // Iterate over the base columns. If any of them are hidden then hide the column
                    for (var k=0; k< refCol._baseCols.length; k++) {
                        if (refCol._baseCols[k].isHidden) {
                            isHidden = true;
                            break;
                        }
                    }

                    // If isHidden flag is true then remove the column at ith index
                    if (isHidden) {
                        this._referenceColumns.splice(i, 1);
                        i--;
                    }
                }
            }

            return this._referenceColumns;
        },

        /**
         * Generate a related reference given a foreign key and tuple.
         *
         * This is the logic:
         *
         * 0. keep track of the linkage and save some attributes:
         *      0.1 origFKR: the foreign key that created this related reference (used in chaise for autofill)
         *      0.2 origColumnName: the name of pseudocolumn that represents origFKR (used in chaise for autofill)
         *      0.3 parentDisplayname: the displayname of parent
         *          - logic: foriengkey's to_name or this.displayname
         *
         *
         * 1. If it's pure and binary association. (current reference: T1) <-F1-(A)-F2-> (T2)
         *      1.1 displayname: F2.to_name or T2.displayname
         *      1.2 table: T2
         *      1.3 derivedAssociationReference: points to the association table (A)
         *      1.4 location (uri):
         *          2.1.4.1 Uses the linkage to get to the T2.
         *          2.1.4.2 if tuple was given, it will use the value of shortestKey to create the facet
         * 2. Otherwise.
         *      2.1 displayname: F1.from_name or T2.displayname
         *      2.2 table: T2
         *      2.3 location (uri):
         *          2.3.1 Uses the linkage to get to the T2.
         *          2.3.2 if tuple was given, it will use the value of shortestKey to create the facet
         *
         *
         * @private
         * @param  {ERMrest.ForeignKeyRef} fkr the relationship between these two reference (this fkr must be from another table to the current table)
         * @param  {ERMrest.Tuple=} tuple the current tuple
         * @param  {boolean} checkForAlternative if it's true, checks p&b association too.
         * @param  {Object=} sourceObject The object that defines the fkr
         * @return {ERMrest.Reference}  a reference which is related to current reference with the given fkr
         */
        _generateRelatedReference: function (fkr, tuple, checkForAssociation, sourceObject) {
            var j, col, uri, source;

            var useFaceting = (typeof tuple === 'object');

            var newRef = _referenceCopy(this);
            delete newRef._context; // NOTE: related reference is not contextualized
            delete newRef._related;
            delete newRef._referenceColumns;
            delete newRef._facetColumns;
            delete newRef.derivedAssociationReference;
            delete newRef._display;

            // delete permissions
            delete newRef._canCreate;
            delete newRef._canRead;
            delete newRef._canUpdate;
            delete newRef._canDelete;

            // the foreignkey that has created this link (link from this.reference to relatedReference)
            newRef.origFKR = fkr; // it will be used to trace back the reference

            // the name of pseudocolumn that represents origFKR
            newRef.origColumnName = _generateForeignKeyName(fkr);

            // this name will be used to provide more information about the linkage
            if (fkr.to_name) {
                newRef.parentDisplayname = { "value": fkr.to_name,  "unformatted": fkr.to_name, "isHTMl" : false };
            } else {
                newRef.parentDisplayname = this.displayname;
            }

            var fkrTable = fkr.colset.columns[0].table;
            if (checkForAssociation && fkrTable._isPureBinaryAssociation()) { // Association Table

                // find the other foreignkey
                var otherFK;
                for (j = 0; j < fkrTable.foreignKeys.length(); j++) {
                    if(fkrTable.foreignKeys.all()[j] !== fkr) {
                        otherFK = fkrTable.foreignKeys.all()[j];
                        break;
                    }
                }

                newRef._table = otherFK.key.table;
                newRef._shortestKey = newRef._table.shortestKey;

                // displayname
                if (otherFK.to_name) {
                    newRef._displayname = {"isHTML": false, "value": otherFK.to_name, "unformatted": otherFK.to_name};
                } else {
                    newRef._displayname = otherFK.colset.columns[0].table.displayname;
                }

                // uri and location
                if (!useFaceting) {
                    newRef._location = module.parse(this._location.compactUri + "/" + fkr.toString() + "/" + otherFK.toString(true));
                } else {
                    // build source
                    source = [
                        {"inbound": otherFK.constraint_names[0]}
                    ];
                }

                // additional values for sorting related references
                newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                newRef._related_fk_column_positions = otherFK.colset._getColumnPositions();

                // will be used to determine whether this related reference is derived from association relation or not
                newRef.derivedAssociationReference = new Reference(module.parse(this._location.compactUri + "/" + fkr.toString()), newRef._table.schema.catalog);
                newRef.derivedAssociationReference.session = this._session;
                newRef.derivedAssociationReference.origFKR = newRef.origFKR;
                newRef.derivedAssociationReference._secondFKR = otherFK;

                var domainUri = [
                    fkrTable.schema.catalog.server.uri ,"catalog" ,
                    fkrTable.schema.catalog.id, this.location.api,
                    [module._fixedEncodeURIComponent(fkrTable.schema.name),module._fixedEncodeURIComponent(fkrTable.name)].join(":"),
                    "right" + otherFK.toString(true)
                ].join("/");

            } else { // Simple inbound Table
                newRef._table = fkrTable;
                newRef._shortestKey = newRef._table.shortestKey;

                // displayname
                if (fkr.from_name) {
                    newRef._displayname = {"isHTML": false, "value": fkr.from_name, "unformatted": fkr.from_name};
                } else {
                    newRef._displayname = newRef._table.displayname;
                }

                // uri and location
                if (!useFaceting) {
                    newRef._location = module.parse(this._location.compactUri + "/" + fkr.toString());
                } else {
                    source = [];
                }

                // additional values for sorting related references
                newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                newRef._related_fk_column_positions = fkr.colset._getColumnPositions();
            }

            // if markdown_name in source object is defined
            if (sourceObject && sourceObject.markdown_name) {
                newRef._displayname = {
                    "value": module._formatUtils.printMarkdown(sourceObject.markdown_name, {inline:true}),
                    "unformatted": sourceObject.markdown_name,
                    "isHTML": true
                };
            }

            if (useFaceting) {
                var table = newRef._table;
                newRef._location = module.parse([
                    table.schema.catalog.server.uri ,"catalog" ,
                    table.schema.catalog.id, "entity",
                    module._fixedEncodeURIComponent(table.schema.name) + ":" + module._fixedEncodeURIComponent(table.name)
                ].join("/"));

                //filters
                var filters = [];
                source.push({"outbound": fkr.constraint_names[0]});
                fkr.key.table.shortestKey.forEach(function (col) {
                    filters.push({
                        "source": source.concat(col.name),
                        "choices": [tuple.data[col.name]]
                    });
                });

                // the facets are basd on the value of shortest key of current table
                newRef._location.facets = {"and": filters};
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

            if (isInteger(page_size)) {
                contextHeaderParams.page_size = page_size;
            }

            var headers = {};
            headers[module._contextHeaderName] = contextHeaderParams;
            return headers;
        }
    };

    /**
     * This is a private function that makes a copy of a reference object.
     * @memberof ERMrest
     * @private
     * @param {!ERMrest.Reference} source The source reference to be copied.
     * @returns {ERMrest.Reference} The copy of the reference object.
     */
    function _referenceCopy(source) {
        var referenceCopy = Object.create(Reference.prototype);
        // referenceCopy must be defined before _clone can copy values from source to referenceCopy
        module._shallowCopy(referenceCopy, source);

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
         * @type {ERMrest.Reference}
         */
        get detailed() {
            return this._contextualize(module._contexts.DETAILED);
        },

        /**
         * The _compact_ context of this reference.
         * @type {ERMrest.Reference}
         */
        get compact() {
            return this._contextualize(module._contexts.COMPACT);
        },

        /**
         * The _compact/brief_ context of this reference.
         * @type {ERMrest.Reference}
         */
        get compactBrief() {
            return this._contextualize(module._contexts.COMPACT_BRIEF);
        },

        /**
         * The _compact/select_ context of this reference.
         * @type {ERMrest.Reference}
         */
        get compactSelect() {
            return this._contextualize(module._contexts.COMPACT_SELECT);
        },

        /**
         * The _entry_ context of this reference.
         * @type {ERMrest.Reference}
         */
        get entry() {
            return this._contextualize(module._contexts.ENTRY);
        },

        /**
         * The _entry/create_ context of this reference.
         * @type {ERMrest.Reference}
         */
        get entryCreate() {
            return this._contextualize(module._contexts.CREATE);
        },

        /**
         * The _entry/edit_ context of this reference.
         * @type {ERMrest.Reference}
         */
        get entryEdit() {
            return this._contextualize(module._contexts.EDIT);
        },

        /**
         * get compactBriefInline - The compact brief inline context of the reference
         * @return {ERMrest.Reference}
         */
        get compactBriefInline() {
            return this._contextualize(module._contexts.COMPACT_BRIEF_INLINE);
        },

        _contextualize: function(context) {
            var source = this._reference;

            var newRef = _referenceCopy(source);
            delete newRef._related;
            delete newRef._referenceColumns;
            delete newRef._facetColumns;

            newRef._context = context;

            // use the base table to get the alternative table of that context.
            // a base table's .baseTable is itself
            var newTable = source._table._baseTable._getAlternativeTable(context);


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
                            newRightCols.push((i === 0) ? col.toString() : module._fixedEncodeURIComponent(col.name));
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
                    var currentFacets = JSON.parse(JSON.stringify(source._location.facets.decoded[module._FacetsLogicalOperators.AND]));

                    // facetColumns is applying extra logic for alternative, and it only
                    // makes sense in the context of facetColumns list. not here.
                    // Therefore we should go based on the facets on the location object, not facetColumns.
                    var modifyFacetFilters = function (funct) {
                        currentFacets.forEach(function (f) {
                            if (!f.source) return;

                            var fk = null;

                            if (_isFacetSourcePath(f.source)) {
                                var cons, isInbound = false, fkObj;

                                if ("inbound" in f.source[0]) {
                                    cons = f.source[0].inbound;
                                    isInbound = true;
                                } else if ("outbound" in f.source[0]) {
                                    cons = f.source[0].outbound;
                                } else {
                                    return;
                                }

                                fkObj = module._getConstraintObject(source._location.catalog, cons[0], cons[1]);
                                if (fkObj == null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                                    return;
                                }

                                fk = {"obj": fkObj.object, "isInbound": isInbound};
                            }

                            newFacetFilters.push(funct(f, fk));
                        });
                    };

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

                    newLocationString = source._location.service + "/catalog/" + source._location.catalog + "/" +
                                        source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name);
                }
                else {
                    if (source._location.filter === undefined) {
                        // 4.1 no filter
                        newLocationString = source._location.service + "/catalog/" + source._location.catalog + "/" +
                                            source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name);
                    } else {
                        // 4.2.1 single entity key filter (without any join), swap table and switch to mapping key
                        // filter is single entity if it is binary filters using the shared key of the alternative tables
                        // or a conjunction of binary predicate that is a key of the alternative tables

                        // use base table's alt shared key
                        var sharedKey = source._table._baseTable._altSharedKey;
                        var filter = source._location.filter;
                        var filterString, j;

                        // binary filters using shared key
                        if (filter.type === module.filterTypes.BINARYPREDICATE && filter.operator === "=" && sharedKey.colset.length() === 1) {

                            // filter using shared key
                            if ((source._table._isAlternativeTable() && filter.column === source._table._altForeignKey.colset.columns[0].name) ||
                                (!source._table._isAlternativeTable() && filter.column === sharedKey.colset.columns[0].name)) {

                                if (newTable._isAlternativeTable()) { // to alternative table
                                    filterString = module._fixedEncodeURIComponent(newTable._altForeignKey.colset.columns[0].name) +
                                        "=" + filter.value;
                                } else { // to base table
                                    filterString = module._fixedEncodeURIComponent(sharedKey.colset.columns[0].name) + "=" + filter.value;
                                }

                                newLocationString = source._location.service + "/catalog/" + source._location.catalog + "/" +
                                                    source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name) + "/" +
                                                    filterString;
                            }

                        } else if (filter.type === module.filterTypes.CONJUNCTION && filter.filters.length === sharedKey.colset.length()) {

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
                                        return (f.type === module.filterTypes.BINARYPREDICATE &&
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
                                        filterString += (j === 0? "" : "&") + module._fixedEncodeURIComponent(mapping[f.column]) + "=" + module._fixedEncodeURIComponent(f.value);
                                    }

                                    newLocationString = source._location.service + "/catalog/" + source._location.catalog + "/" +
                                        source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name) + "/" +
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

                newRef._location = module.parse(newLocationString);

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
     * @param {!Object} extraData if
     *
     */
    function Page(reference, etag, data, hasPrevious, hasNext, extraData) {

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
        this._data = [];

        var oneToOnePseudos = reference.columns.filter(function (c) {
            return c.isPseudo && c.isPathColumn && c.hasPath && c.isUnique  && c.foreignKeys.length > 1;
        });

        var singleFKPaths = reference.columns.filter(function (c) {
            return c.isPathColumn && c.isUnique && c.foreignKeys.length === 1;
        });

        var attachSingleFKs = function (selfPage, fk, data, i) {
            singleFKPaths.filter(function (c) {
                return c.foreignKeys[0].obj === fk;
            }).forEach(function (c) {
                selfPage._linkedData[i][c.name] = data;
            });
        };

        // linkedData will include foreign key data
        if (this._ref._table.foreignKeys.length() > 0 || oneToOnePseudos.length > 0) {

            var fks = reference._table.foreignKeys.all(), i, j, colFKs;
            var mTableAlias = this._ref.location.mainTableAlias,
                pTabeAlias = this._ref.location.projectionTableAlias;

            try {
                // the attributegroup output
                for (i = 0; i < data.length; i++) {
                    this._data.push(data[i][mTableAlias][0]);

                    this._linkedData.push({});
                    for (j = fks.length - 1; j >= 0 ; j--) {
                        this._linkedData[i][fks[j].name] = data[i]["F"+(j+1)][0];

                        // we're not adding these to projection list, so we have to map them.
                        attachSingleFKs(this, fks[j], data[i]["F"+(j+1)][0], i);
                    }

                    for (j = oneToOnePseudos.length - 1; j >= 0; j--) {
                        this._linkedData[i][oneToOnePseudos[j].name] = data[i]["P"+ (j+1)][0];
                    }
                }

                //extra data
                if (hasExtraData) {
                    this._extraData = extraData[mTableAlias][0];
                    this._extraLinkedData = {};
                    for (j = fks.length - 1; j >= 0 ; j--) {
                        this._extraLinkedData[fks[j].name] = extraData["F"+(j+1)][0];
                    }

                    for (j = oneToOnePseudos.length - 1; j >= 0; j--) {
                        this._extraLinkedData[oneToOnePseudos[j].name] = extraData["P"+ (j+1)][0];
                    }
                }

            }
            // could not find the expected aliases
            catch(exception) {
                var fkName, col, tempData, k;

                this._data = data;

                // add the main table data to linkedData
                this._linkedData = [];
                for (i = 0; i < data.length; i++) {
                    tempData = {};
                    for (j = 0; j < fks.length; j++) {
                        fkName = fks[j].name;
                        tempData[fkName] = {};

                        for (k = 0; k < fks[j].colset.columns.length; k++) {
                            col = fks[j].colset.columns[k];
                            tempData[fkName][fks[j].mapping.get(col).name] = data[i][col.name];
                        }
                    }
                    this._linkedData.push(tempData);
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
         * @type {ERMrest.Reference}
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
         * @type {ERMrest.Tuple[]}
         */
        get tuples() {
            if (this._tuples === undefined) {
                this._tuples = [];
                for (var i = 0; i < this._data.length; i++) {
                    this._tuples.push(new Tuple(this._ref, this, this._data[i], this._linkedData[i]));
                }
            }
            return this._tuples;
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
         * @type {ERMrest.Reference|undefined}
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
         * @type {ERMrest.Reference|undefined}
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
         * @private
         * @param  {Boolean} next whether we want the next page or previous
         * @return {ERMrest.Reference}
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
            newReference._location = this._ref._location._clone();


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
         * @type {string|null}
         */
        get content() {
                if (this._content === undefined) {
                    if (!this._data || !this._data.length) {
                    this._content = null;
                }else {
                    var i, value, pattern, values = [];
                    if (typeof this._ref.display._markdownPattern === 'string') {
                       // Iterate over all data rows to compute the row values depending on the row_markdown_pattern.
                       for (i = 0; i < this._data.length; i++) {
                           // render template
                           value = module._renderTemplate(this._ref.display._markdownPattern, this._data[i], this._ref._table, this._ref._context);

                           // If value is null or empty, return value on basis of `show_nulls`
                           if (value === null || value.trim() === '') {
                               value = module._getNullValue(this._ref._table, this._ref._context, [this._ref._table, this._ref._table.schema]);
                           }
                           // If final value is not null then push it in values array
                           if (value !== null) {
                               values.push(value);
                           }
                       }

                       // Join the values array using the separator and prepend it with the prefix and append suffix to it.
                       pattern = this._ref.display._prefix + values.join(this._ref.display._separator) + this._ref.display._suffix;

                   }else{

                      for ( i = 0; i < this.tuples.length; i++) {
                         var tuple = this.tuples[i];
                         var url = tuple.reference.contextualize.detailed.appLink;

                         values.push("* ["+ tuple.displayname.value +"](" + url + ") " + this._ref.display._separator);
                      }
                      pattern = this._ref.display._prefix + values.join(" \n") + this._ref.display._suffix;
                   }
                   this._content =  module._formatUtils.printMarkdown(pattern);
              }
           }
           return this._content;
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
     */
    function Tuple(pageReference, page, data, linkedData) {
        this._pageRef = pageReference;
        this._page = page;
        this._data = data || {};
        this._linkedData = (typeof linkedData === "object") ? linkedData : {};
    }

    Tuple.prototype = {
        constructor: Tuple,

        /**
         * This is the reference of the Tuple
         * @returns {ERMrest.Reference|*} reference of the Tuple
         */
        get reference() {

            if (this._ref === undefined) {
                this._ref = _referenceCopy(this._pageRef);

                var uri = this._pageRef._location.service + "/catalog/" + this._pageRef._location.catalog + "/" +
                    this._pageRef._location.api + "/";

                // if this is an alternative table, use base table
                if (this._pageRef._table._isAlternativeTable()) {
                    var baseTable = this._pageRef._table._baseTable;
                    this._ref.setNewTable(baseTable);
                    uri = uri + module._fixedEncodeURIComponent(baseTable.schema.name) + ":" + module._fixedEncodeURIComponent(baseTable.name) + "/";

                    // convert filter columns to base table columns using shared key
                    var fkey = this._pageRef._table._altForeignKey;
                    var self = this;
                    fkey.mapping.domain().forEach(function(altColumn, index, array) {
                        var baseCol = fkey.mapping.get(altColumn);
                        if (index === 0) {
                            uri = uri + module._fixedEncodeURIComponent(baseCol.name) + "=" + module._fixedEncodeURIComponent(self._data[altColumn.name]);
                        } else {
                            uri = uri + "&" + module._fixedEncodeURIComponent(baseCol.name) + "=" + module._fixedEncodeURIComponent(self._data[altColumn.name]);
                        }
                    });
                } else {
                    // update its location by adding the tuple’s key filter to the URI
                    // don't keep any modifiers
                    uri = uri + module._fixedEncodeURIComponent(this._ref._table.schema.name) + ":" + module._fixedEncodeURIComponent(this._ref._table.name) + "/";
                    for (var k = 0; k < this._ref._shortestKey.length; k++) {
                        var col = this._pageRef._shortestKey[k].name;
                        if (k === 0) {
                            uri = uri + module._fixedEncodeURIComponent(col) + "=" + module._fixedEncodeURIComponent(this._data[col]);
                        } else {
                            uri = uri + "&" + module._fixedEncodeURIComponent(col) + "=" + module._fixedEncodeURIComponent(this._data[col]);
                        }
                    }
                }

                this._ref._location = module.parse(uri);

                // add the tuple to reference so that when calling read() we don't need to fetch the data again.
                this._ref._tuple = this._tuple;

            }
            return this._ref;
        },

        /**
         * This is the page of the Tuple
         * @returns {ERMrest.Page|*} page of the Tuple
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
         * @type {Object}
         */
        get data() {
            if (this._oldData === undefined) {
                // interesting trick to deep copy an array of data without functions
                this._oldData = JSON.parse(JSON.stringify(this._data));
            }
            return this._data;
        },

        /**
         *
         * @param {Object} data - the data to be updated
         */
        set data(data) {
            // TODO needs to be implemented rather than modifying the values directly from UI
            notimplemented();
        },

        /**
         * Indicates whether the client can update this tuple. Because
         * some policies may be undecidable until query execution, this
         * property may also be `undefined`.
         *
         * Usage:
         * ```
         * if (tuple.canUpdate == true) {
         *   console.log(tuple.displayname, "can be updated by this client");
         * }
         * else if (tuple.canUpdate == false) {
         *   console.log(tuple.displayname, "cannot be updated by this client");
         * }
         * else {
         *   console.log(tuple.displayname, "update permission cannot be determied");
         * }
         * ```
         * @type {(boolean|undefined)}
         */
        get canUpdate() {
            // catalog/ + id + /meta/content_read_user
            // content_write_user
            notimplemented();
        },

        /**
         * Indicates whether the client can delete this tuple. Because
         * some policies may be undecidable until query execution, this
         * property may also be `undefined`.
         *
         * See {@link ERMrest.Tuple#canUpdate} for a usage example.
         * @type {(boolean|undefined)}
         */
        get canDelete() {
            notimplemented();
        },

        /**
         * Attempts to update this tuple. This is a server side transaction,
         * and therefore an asynchronous operation that returns a promise.
         * @returns {Promise} a promise (TBD the result object)
         */
        update: function() {
            try {
                // TODO
                // - since we only support updates on "simple paths" that are just
                //   entity references with no joins, we can first validate that
                //   this tuple represents a row from a single table, and then
                //   we may need to create a reference to that table
                // - then, we can go back and call that reference
                //   `return reference.update(...);`
                notimplemented();
            }
            catch (e) {
                return module._q.reject(e);
            }
        },

        /**
         * Attempts to delete this tuple. This is a server side transaction,
         * and therefore an asynchronous operation that returns a promise.
         * @returns {Promise} a promise (TBD the result object)
         */
        delete: function() {
            try {
                // TODO
                // - create a new reference by taking this._ref and adding filters
                //   based on keys for this tuple
                // - then call the delete on that reference
                //   `return tuple_ref.delete();`
                notimplemented();
            }
            catch (e) {
                return module._q.reject(e);
            }
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

                this._values = [];
                this._isHTML = [];

                var column, presentation;

                // key value pair of formmated values, to be used in formatPresentation
                var keyValues = module._getFormattedKeyValues(this._pageRef._table, this._pageRef._context, this._data, this._linkedData);

                // If context is entry
                if (module._isEntryContext(this._pageRef._context)) {

                    // Return raw values according to the visibility and sequence of columns
                    for (i = 0; i < this._pageRef.columns.length; i++) {
                        column = this._pageRef.columns[i];
                        if (column.isPseudo) {
                            if (column.isForeignKey) {
                                presentation = column.formatPresentation(this._linkedData[column.name], this._pageRef._context);
                            } else {
                                presentation = column.formatPresentation(this._data, this._pageRef._context, { formattedValues: keyValues});
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
                    for (i = 0; i < this._pageRef.columns.length; i++) {
                        column = this._pageRef.columns[i];
                        if (column.isPseudo) {
                            if (column.isForeignKey || (column.isPathColumn && column.hasPath)) {
                                values[i] = column.formatPresentation(this._linkedData[column.name], this._pageRef._context);
                            } else {
                                values[i] = column.formatPresentation(this._data, this._pageRef._context, { formattedValues: keyValues});
                            }
                        } else {
                            values[i] = column.formatPresentation(keyValues[column.name], this._pageRef._context, { formattedValues: keyValues});

                            if (column.type.name === "gene_sequence") {
                                values[i].isHTML = true;
                            }
                        }
                    }

                    var self = this;

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
         * The _display name_ of this tuple. For example, if this tuple is a
         * row from a table, then the display name is defined by the
         * row_markdown_pattern annotation for the _row name_ context
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
                this._displayname = module._generateRowName(this._pageRef._table, this._pageRef._context, this._data, this._linkedData, true);
            }
            return this._displayname;
        },

        /**
         * The unique identifier for this tuple composed of the values for each
         * of the shortest key columns concatenated together by an '_'
         *
         * @type {string}
         */
        get uniqueId() {
            if (this._uniqueId === undefined) {
                var key, hasNull = false;
                this._uniqueId = "";
                for (var i = 0; i < this._pageRef.table.shortestKey.length; i++) {
                    keyName = this._pageRef.table.shortestKey[i].name;
                    if (this.data[keyName] == null) {
                        hasNull = true;
                        break;
                    }
                    if (i !== 0) this._uniqueId += "_";
                    this._uniqueId += this.data[keyName];
                }

                if (hasNull) {
                    this._uniqueId = null;
                }
            }
            return this._uniqueId;
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
         * @type {ERMrest.Reference}
         */
        getAssociationRef: function(origTableData){
            if (!this._pageRef.derivedAssociationReference) {
                return null;
            }

            var associationRef = this._pageRef.derivedAssociationReference,
                encoder = module._fixedEncodeURIComponent,
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
            missingData = missingData || !addFilter(associationRef._secondFKR, this._data);

            if (missingData) {
                return null;
            }
            var loc = associationRef._location;
            var uri = [
                loc.service, "catalog", loc.catalog, loc.api,
                encoder(associationRef._table.schema.name) + ":" + encoder(associationRef._table.name),
                newFilter.join("&")
            ].join("/");

            var reference = new Reference(module.parse(uri), this._pageRef._table.schema.catalog);
            reference.session = associationRef._session;
            return reference;

        },

        /**
         * @desc
         * This function takes the current Tuple (this) and creates a shallow copy of it while de-referencing
         * the _data attribute. This way _data can be modified in chaise without changing the originating Tuple
         * @returns {ERMrest.Tuple} a shallow copy of _this_ tuple with it's _data de-referenced
         */
         copy: function() {
             var newTuple = Object.create(Tuple.prototype);
             module._shallowCopy(newTuple, this);
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

            return "cnt_d(" + module._fixedEncodeURIComponent(this._ref.table.shortestKey[0].name) + ")";
        }
    };
