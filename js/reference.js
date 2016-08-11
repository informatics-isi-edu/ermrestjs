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
     * @param {Object} [params] - An optional parameters object. The (key, value)
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
     */
    module.resolve = function (uri, params) {
        try {
            verify(uri, "'uri' must be specified");
            var defer = module._q.defer();

            // build reference
            var context = module._parse(uri);
            var reference = new Reference(context);

            var server = module.ermrestFactory.getServer(reference._serviceUrl, params);
            server.catalogs.get(reference._catalogId).then(function (catalog) {

                reference._catalog = catalog;
                reference._schema  = catalog.schemas.get(reference._schemaName);
                reference._table   = reference._schema.tables.get(reference._tableName);
                reference._columns = reference._table.columns.all();

                defer.resolve(reference);

            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        }
        catch (e) {
            return module._q.reject(e);
        }
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
     * @param {Object} context - The context object generated from parsing the URI
     */
    function Reference(context) {
        this._uri        = context.uri;
        this._serviceUrl = context.baseUri;
        this._catalogId  = context.catalogId;
        this._schemaName = context.schemaName;
        this._tableName  = context.tableName;
        this._sort       = context.sort;

        this.contextualize._reference = this;
    }

    Reference.prototype = {
        constructor: Reference,

        /**
         * The display name for this reference.
         * @type {string}
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
         * @type {string}
         */
        get uri() {
            return this._uri;
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
         * @type {ERMrest.Column[]}
         */
         get columns() {
             return this._columns;
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
            return undefined; // TODO
        },

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
         * var recordref = reference.contextualize.record;
         * ```
         * The `reference` is unchanged, while `recordref` now represents a
         * reconfigured reference. For instance, `recordref.columns` may be
         * different compared to `reference.columns`.
         */
        contextualize: {
            /* TODO: you'll need to figure out how to allow the following
             * getters to have access to `this` with respect to the Refernece
             * object not the nested contextualize object. A simple test can be
             * done. The brute force way would be to introduce a `Contextualize`
             * class that gets instantiated. Or a better less brute force way
             * would be to have another lazy getter for the contextualize
             * property.
             */

            /**
             * The _record_ context of this reference.
             * @type {ERMrest.Reference}
             */
            get record() {
                var source = this._reference;
                var newRef = _referenceCopy(source);
                var columnOrders = source._table.columns._contextualize(module._contexts.RECORD).all();

                newRef._context = module._contexts.RECORD;
                newRef._columns = [];
                for (var i = 0; i < columnOrders.length; i++) {
                    var column = columnOrders[i];
                    if (source._columns.indexOf(column) != -1) {
                        newRef._columns.push(column);
                    }
                }
                return newRef;
            },

            /**
             * The _entry_ context of this reference.
             * @type {ERMrest.Reference}
             */
            get entry() {
                // TODO: remember these are copies of this reference.
                return undefined;
            }
        },

        /**
         * Indicates whether the client has the permission to _create_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canCreate() {
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _read_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canRead() {
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _update_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canUpdate() {
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _delete_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canDelete() {
            return undefined;
        },

        /**
         * Creates a set of resources.
         * @param {!Array} tbd TBD parameters. Probably an array of tuples
         * [ {tuple},... ] for all entities to be created.
         * @returns {Promise} A promise for a TBD result.
         */
        create: function(tbd) {
            try {
                // TODO
                notimplemented();
            }
            catch (e) {
                return module._q.reject(e);
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
         *
         * @returns {Promise} A promise for a {@link ERMrest.Page} of results,
         * or {@link ERMrest.InvalidInputError} if `limit` is invalid, or
         * other errors TBD (TODO document other errors here).
         */
        read: function(limit) {
            try {
                verify(limit, "'limit' must be specified");
                verify(typeof(limit) == 'number', "'limit' must be a number");
                verify(limit > 0, "'limit' must be greater than 0");

                var defer = module._q.defer();

                var uri = this._uri;

                // add sorting
                // get a list of columns in key
                var keys = this._table.keys.all().sort( function(a, b) {
                    return a.colset.length() - b.colset.length();
                });
                var keycols = keys[0].colset.columns;

                // append @sort(..) to uri
                var sortby;
                if (this._sort && this._sort.length > 0){
                    sortby = this._sort;
                } else if (this._table.annotations.contains(module._annotations.TABLE_DISPLAY) &&
                        this._table.annotations.get(module._annotations.TABLE_DISPLAY).contains("row_order")) {
                    sortby = this._table.annotations.get(module._annotations.TABLE_DISPLAY).get("row_order");
                }

                if (sortby) {

                    // get a list of columns in sortby
                    var sortCols = sortby.map(function(sort) {
                        return sort.column;});

                    for (var d = 0; d < sortby.length; d++) {
                        // column name
                        var sortCol = sortby[d].column;
                        var order = (sortby[d].descending ? "::desc::" : "");
                        if (d === 0)
                            uri = uri + "@sort(" + module._fixedEncodeURIComponent(sortCol) + order;
                        else
                            uri = uri + "," + module._fixedEncodeURIComponent(sortCol) + order;
                    }

                    // ermrest requires key columns to in sort param
                    for (var i = 0; i < keycols.length; i++) { // all the key columns
                        var col = keycols[i].name;
                        // add if key col is not in the sortby list
                        if (!sortCols.includes(col)) {
                            uri = uri + "," + module._fixedEncodeURIComponent(col);
                        }
                    }
                    uri = uri + ")";
                }


                // add limit
                uri = uri + "?limit=" + limit;

                // attach `this` (Reference) to a variable
                // `this` inside the Promise request is a Window object
                var ownReference = this;
                module._http.get(uri).then(function readReference(response) {

                    var page = new Page(ownReference, response.data);

                    defer.resolve(page);

                }, function error(response) {
                    var error = module._responseToError(response);
                    return defer.reject(error);
                });

                return defer.promise;
            }
            catch (e) {
                return module._q.reject(e);
            }
        },

        /**
         * Return a new Reference with the new sorting
         *
         * @param {Object[]} sort an array of objects in the format
         * {"column":columname, "descending":true|false}
         * in order of priority. Undfined, null or Empty array to use default sorting.
         */
        sort: function(sort) {

            // make a Reference copy
            var newReference = _referenceCopy(this);
            // change ._sort
            if (!sort || sort.length === 0) {
                delete newReference._sort;
            }
            else {
                verify((sort instanceof Array), "input should be an array");
                verify(sort.every(module._isValidSortElement), "invalid arguments in array");
                newReference._sort = sort;
            }

            return newReference;
        },

        /**
         * Updates a set of resources.
         * @param {!Array} tbd TBD parameters. Probably an array of pairs of
         * [ (keys+values, allvalues)]+ ] for all entities to be updated.
         * @returns {Promise} A promise for a TBD result or errors.
         */
        update: function(tbd) {
            try {
                // TODO
                notimplemented();
            }
            catch (e) {
                return module._q.reject(e);
            }
        },

        /**
         * Deletes the referenced resources.
         * @returns {Promise} A promise for a TBD result or errors.
         */
        delete: function() {
            try {
                // TODO
                notimplemented();
            }
            catch (e) {
                return module._q.reject(e);
            }
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
         * @type {ERMrest.Reference[]}
         */
        get related() {
            if (this._related === undefined) {
                this._related = [];

                var visibleFKs = this._table._visibleForeignKeys(this._context);
                for(var i = 0, fkr; i < visibleFKs.length; i++) {
                    fkr = visibleFKs[i];

                    // inbound FKRs
                    if (this._table.referredBy.all().indexOf(fkr) != -1) {
                        var newRef = _referenceCopy(this);
                        newRef.contextualize._reference = newRef;
                        delete newRef._context; // NOTE: related reference is not contextualized
                        delete newRef._sort;

                        var fkrTable = fkr.colset.columns[0].table;
                        if (fkrTable._isPureBinaryAssociation()) { // Association Table
                            var otherFK;
                            for (var k = 0; k < fkrTable.foreignKeys.length(); k++) {
                                if(fkrTable.foreignKeys.all()[k] !== fkr) {
                                    otherFK = fkrTable.foreignKeys.all()[k];
                                    break;
                                }
                            }

                            newRef._schema = otherFK.key.table.schema;
                            newRef._schemaName = otherFK.key.table.schema.name;
                            newRef._table = otherFK.key.table;
                            newRef._tableName = otherFK.key.table.name;
                            newRef._columns = otherFK.key.table.columns.all();
                            newRef._displayname = otherFK.to_name ? otherFK.to_name : otherFK.key.table.displayname;
                            newRef._uri = this._uri + "/" + fkr.toString() + "/" + otherFK.toString(true);

                        } else { // Simple inbound Table
                            newRef._schema = fkrTable.schema;
                            newRef._schemaName = fkrTable.schema.name;
                            newRef._table = fkrTable;
                            newRef._tableName = fkrTable.name;

                            newRef._columns = [];
                            for (var l = 0, col; l < newRef._table.columns.all().length; l++) {
                                // remove the columns that are involved in the FKR
                                col = newRef._table.columns.all()[l];
                                if (fkr.colset.columns.indexOf(col) == -1) {
                                    newRef._columns.push(col);
                                }
                            }

                            newRef._displayname = fkr.from_name ? fkr.from_name : newRef._table.displayname;
                            newRef._uri = this._uri + "/" + fkr.toString();
                        }

                        this._related.push(newRef);
                    }

                }
            }
            return this._related;
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
        module._clone(referenceCopy, source);
        return referenceCopy;
    }


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
     * @param {!Object[]} data The data returned from ERMrest.
     */
    function Page(reference, data) {
        this._ref = reference;
        this._data = data;
    }

    Page.prototype = {
        constructor: Page,

        /**
         * An array of processed tuples. The results will be processed
         * according to the contextualized scheme (model) of this reference.
         *
         * Usage:
         * ```
         * for (var i=0, len=page.tuples.length; i<len; i++) {
         *   var tuple = page.tuples[i];
         *   console.log("Tuple:", tuple.displayname, "has values:", tuple.values);
         * }
         * ```
         * @type {ERMrest.Tuple[]}
         */
        get tuples() {
            if (this._tuples === undefined) {
                this._tuples = [];
                for (var i = 0; i < this._data.length; i++) {
                    this._tuples.push(new Tuple(this._ref, this._data[i]));
                }
            }
            return this._tuples;
        },

        /**
         * A reference to the previous set of results.
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
            // TODO: a reference to previous entity set
            return undefined;
        },

        /**
         * A reference to the next set of results.
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
            // TODO: a reference to next entity set
            return undefined;
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
     * @param {!Object} data The unprocessed tuple of data returned from ERMrest.
     */
    function Tuple(reference, data) {
        this._ref = reference;
        this._data = data;
    }

    Tuple.prototype = {
        constructor: Tuple,

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
            return undefined;
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
            return undefined;
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
                //   `return entity_reference.update(...);`
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
         * The array of formatted values of this tuple. The ordering of the
         * values in the array matches the ordering of the columns in the
         * reference (see {@link ERMrest.Reference#columns}).
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
                for (var i = 0; i < this._ref.columns.length; i++) {
                    var col = this._ref.columns[i];
                    this._values[i] = col.formatvalue(this._data[col.name]);
                }
            }
            return this._values;
        },

        /**
         * The _disaply name_ of this tuple. For example, if this tuple is a
         * row from a table, then the display name is defined by the heuristic
         * or the annotation for the _row name_.
         *
         * TODO: add a @link to the ermrest row name annotation
         *
         * Usage:
         * ```
         * console.log("This tuple has a displayable name of", tuple.displayname);
         * ```
         * @type {string}
         */
        get displayname() {
            if (!this._displayname) {
                var table = this._ref._table;
                // if table has display row_name annotation
                if (table.annotations.contains(module._annotations.TABLE_DISPLAY) &&
                    table.annotations.get(module._annotations.TABLE_DISPLAY).contains("row_name")) {
                    this._displayname = table.annotations.get(module._annotations.TABLE_DISPLAY).get("row_name"); // pattern

                    // replace patterns with values
                    var colnames = table.columns.names();
                    for (var c = 0; c < colnames.length; c++) {
                        var cname = colnames[c];
                        var search = "{" + cname + "}";
                        this._displayname = this._displayname.replace(new RegExp(search, 'g'), this._data[cname]);
                    }

                }
                // no row_name annotation, use column with title, name, or label
                else if (this._data.name) // TODO case insensitive
                    this._displayname = this._data.name;
                else if (this._data.title)
                    this._displayname = this._data.title;
                else if (this._data.label)
                    this._displayname = this._data.label;
                else
                    this._displayname = "";
            }

            return this._displayname;
        }

    };


    return module;

}(ERMrest || {}));
