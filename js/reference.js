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
            var location = module._parse(uri);
            var reference = new Reference(location);

            var server = module.ermrestFactory.getServer(reference._location.service, params);
            server.catalogs.get(reference._location.catalog).then(function (catalog) {
                reference._meta = catalog.meta;

                // if schema was not provided in the URI
                // find the schema
                if (!reference._location.schemaName) {
                    var schemas = catalog.schemas.all();
                    for (var i = 0; i < schemas.length; i++) {
                        if (schemas[i].tables.names().indexOf(reference._location.tableName) !== -1) {
                            reference._table = schemas[i].tables.get(reference._location.tableName);
                        }
                    }
                } else
                    reference._table = catalog.schemas.get(reference._location.schemaName).tables.get(reference._location.tableName);

                reference._columns = reference._table.columns.all();
                reference._shortestKey = reference._table.shortestKey;

                defer.resolve(reference);

            }, function (error) {
                defer.reject(error);
            }).catch(function(exception) {
                defer.reject(exception);
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
     * @param {ERMrest.Location} location - The location object generated from parsing the URI
     */
    function Reference(location) {
        this._location   = location;

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
            return undefined; // TODO
        },

        /**
         * Indicates whether the client has the permission to _create_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canCreate() {
            if (this._canCreate === undefined) {
                this._canCreate = this._checkPermissions('content_write_user');
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
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _update_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canUpdate() {
            if (this._canUpdate === undefined) {
                this._canUpdate = this._checkPermissions('content_write_user');
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
            return undefined;
        },

        /**

        /**
         * This is a private funtion that checks the user permissions for modifying the affiliated entity, record or table
         * Sets a property on the reference object used by canCreate/canUpdate/canDelete
         * @memberof ERMrest
         * @private
         */
         _checkPermissions: function (permission) {
            var editCatalog = false,
                acl = this._meta[permission],
                users = [];

            for (var i = 0; i < acl.length; i++) {
                if (acl[i] === '*') {
                    editCatalog = true;
                } else {
                    users.push(acl[i]);
                }
            }

            if (users.length > 0) {
                if(this._session) {
                    var sessionAttributes = this._session.attributes.map(function(a) {
                        return a.id;
                    });

                    for (var j = 0; j < users.length; j++) {
                        if (sessionAttributes.indexOf(users[j]) != -1) editCatalog = true;
                    }
                } else {
                    editCatalog = undefined;
                }
            }

            return editCatalog;
         },

        /**
         * Creates a set of tuples in the references relation. Note, this
         * operation sets the `defaults` list according to the table
         * specification, and not according to the contents of in the input
         * tuple.
         * @param {!Array} data The array of data to be created as new tuples.
         * @returns {Promise} A promise for a {@link ERMrest.Page} of results,
         * or errors (TBD).
         */
        create: function(data) {
            try {
                // TODO
                //  verify: data is not null, data has non empty tuple set
                //  get the defaults list for the referenced relation's table
                //  get the data
                //  do the 'post' call
                //  get the results from post (of course in a promise func)
                //  make a page of tuples of the results (unless error)
                //  new page will have a new reference (uri that filters on a disjunction of ids of these tuples)
                //  resolve the promise, passing back the page
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

                var uri = this._location.compactUri;

                var sortObject, col;

                // if no sorting provided, use schema defined sort if that's present
                // If neither one present, use shortestkey
                var addkey = true;
                if (!this._location.sortObject || (this._location.sortObject.length === 0)) {
                    if (this.display._rowOrder) {
                        this._location.sortObject = this.display._rowOrder;
                        addkey = true;
                    } else {
                        // use shortest key as sort
                        sortObject = [];
                        for (var sk = 0; sk < this._shortestKey.length; sk++) {
                            col = this._shortestKey[sk].name;
                            sortObject.push({"column":col, "descending":false});
                        }
                        this._location.sortObject = sortObject; // this will update location.sort and all the uri and path
                        addkey = false;
                    }

                }

                // ermrest requires key columns to be in sort param
                // add them if they are missing
                if (addkey) {
                    var sortCols = this._location.sortObject.map(function(sort) {
                        return sort.column;});
                    sortObject = this._location.sortObject;
                    for (var i = 0; i < this._shortestKey.length; i++) { // all the key columns
                        col = this._shortestKey[i].name;
                        // add if key col is not in the sortby list
                        if (!sortCols.includes(col)) {
                            sortObject.push({"column":module._fixedEncodeURIComponent(col), "descending":false}); // add key to sort
                        }
                    }
                    this._location.sortObject = sortObject;
                }

                // insert @sort()
                if (this._location.sort)
                    uri = uri + this._location.sort;

                // insert paging
                if (this._location.paging)
                    uri = uri + this._location.paging;


                // add limit
                uri = uri + "?limit=" + (limit + 1); // read extra row, for determining whether the returned page has next/previous page

                // attach `this` (Reference) to a variable
                // `this` inside the Promise request is a Window object
                var ownReference = this;
                module._http.get(uri).then(function readReference(response) {

                    var hasPrevious, hasNext = false;
                    if (!ownReference._location.paging) { // first page
                        hasPrevious = false;
                        hasNext = (response.data.length > limit);
                    } else if (ownReference._location.pagingObject.before) { // has @before()
                        hasPrevious = (response.data.length > limit);
                        hasNext = true;
                    } else { // has @after()
                        hasPrevious = true;
                        hasNext = (response.data.length > limit);
                    }

                    // Because read() reads one extra row to determine whether the new page has previous or next
                    // We need to remove those extra row of data from the result
                    if (response.data.length > limit) {
                        // if no paging or @after, remove last row
                        if (!ownReference._location.pagingObject || !ownReference._location.pagingObject.before)
                            response.data.splice(response.data.length-1);
                       else // @before, remove first row
                            response.data.splice(0, 1);

                    }
                    var page = new Page(ownReference, response.data, hasPrevious, hasNext);

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

            if (sort) {
                verify((sort instanceof Array), "input should be an array");
                verify(sort.every(module._isValidSortElement), "invalid arguments in array");

            }

            newReference._location = this._location._clone();
            newReference._location.pagingObject = null;
            newReference._location.sortObject = sort;

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
            if (!this._display) {
                this._display = { type: module._displayTypes.TABLE };
                var annotation;
                // If table has table-display annotation then set it in annotation variable
                if (this._table.annotations.contains(module._annotations.TABLE_DISPLAY)) {
                    annotation = module._getRecursiveAnnotationValue(this._context, this._table.annotations.get(module._annotations.TABLE_DISPLAY).content);
                }

                // If annotation is defined then parse it
                if (annotation) {

                    // Set row_order value
                    this._display._rowOrder = annotation.row_order;

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
         * @type {ERMrest.Reference[]}
         */
        get related() {
            if (this._related === undefined) {
                this._related = [];

                var visibleFKs = this._table._visibleInboundForeignKeys(this._context),
                    notSorted;
                if (visibleFKs === -1) {
                    notSorted = true;
                    visibleFKs = this._table.referredBy.all();
                }

                var i, j, col, fkr, newRef;
                for(i = 0; i < visibleFKs.length; i++) {
                    fkr = visibleFKs[i];

                    newRef = _referenceCopy(this);
                    delete newRef._context; // NOTE: related reference is not contextualized
                    delete newRef._related;

                    var fkrTable = fkr.colset.columns[0].table;
                    if (fkrTable._isPureBinaryAssociation()) { // Association Table
                        var otherFK;
                        for (j = 0; j < fkrTable.foreignKeys.length(); j++) {
                            if(fkrTable.foreignKeys.all()[j] !== fkr) {
                                otherFK = fkrTable.foreignKeys.all()[j];
                                break;
                            }
                        }

                        newRef._table = otherFK.key.table;
                        newRef._shortestKey = newRef._table.shortestKey;

                        newRef._columns = otherFK.key.table.columns.all();

                        newRef._displayname = otherFK.to_name ? otherFK.to_name : otherFK.key.table.displayname;
                        newRef._location = module._parse(this._location.compactUri + "/" + fkr.toString() + "/" + otherFK.toString(true));

                        // additional values for sorting related references
                        newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                        newRef._related_fk_column_positions = otherFK.colset._getColumnPositions();

                    } else { // Simple inbound Table
                        newRef._table = fkrTable;
                        newRef._shortestKey = newRef._table.shortestKey;

                        newRef._columns = [];
                        for (j = 0; j < newRef._table.columns.all().length; j++) {
                            // remove the columns that are involved in the FKR
                            col = newRef._table.columns.getByPosition(j);
                            if (fkr.colset.columns.indexOf(col) == -1) {
                                newRef._columns.push(col);
                            }
                        }

                        newRef._displayname = fkr.from_name ? fkr.from_name : newRef._table.displayname;
                        newRef._location = module._parse(this._location.compactUri + "/" + fkr.toString());

                        // additional values for sorting related references
                        newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                        newRef._related_fk_column_positions = fkr.colset._getColumnPositions();
                    }

                    this._related.push(newRef);
                }

                if (notSorted && this._related.length !== 0) {
                    return this._related.sort(function (a, b) {
                        // displayname
                        if (a._displayname != b._displayname) {
                            return a._displayname.localeCompare(b._displayname);
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

        referenceCopy.contextualize = new Contextualize(referenceCopy);
        return referenceCopy;
    }

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

        _contextualize: function(context) {
            var source = this._reference;
            var newRef = _referenceCopy(source);
            delete newRef._related;

            newRef._context = context;
            var columnOrders = source._table.columns._contextualize(context).all();
            newRef._columns = [];
            for (var i = 0; i < columnOrders.length; i++) {
                var column = columnOrders[i];
                if (source._columns.indexOf(column) != -1) {
                    newRef._columns.push(column);
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
     * @param {!Object[]} data The data returned from ERMrest.
     * @param {boolean} hasNext Whether there is more data before this Page
     * @param {boolean} hasPrevious Whether there is more data after this Page
     *
     */
    function Page(reference, data, hasPrevious, hasNext) {
        this._ref = reference;
        this._data = data;
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
         * Whether there is more entities before this page
         * @returns {boolean}
         */
        get hasPrevious() {
            return this._hasPrevious;
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
            if (this._hasPrevious) {
                var newReference = _referenceCopy(this._ref);

                // update paging by creating a new location
                var paging = {};
                paging.before = true;
                paging.row = [];
                for (var i = 0; i < newReference._location.sortObject.length; i++) {
                    var col = newReference._location.sortObject[i].column;
                    paging.row.push(this._data[0][col]); // first row
                }

                newReference._location = this._ref._location._clone();
                newReference._location.pagingObject = paging;
                return newReference;
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
                var newReference = _referenceCopy(this._ref);

                // update paging by creating a new location
                var paging = {};
                paging.before = false;
                paging.row = [];
                for (var i = 0; i < newReference._location.sortObject.length; i++) {
                    var col = newReference._location.sortObject[i].column;
                    paging.row.push(this._data[this._data.length-1][col]); // last row
                }

                newReference._location = this._ref._location._clone();
                newReference._location.pagingObject = paging;
                return newReference;
            }
            return null;
        },

        /**
         * HTML representation of the whole page which uses table-display annotation.
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
            if (this._content !== null) {
                // If display type is markdown which means row_markdown_pattern is set in table-display
                if (this._ref.display.type === module._displayTypes.MARKDOWN) {

                    // If the number of records are zero then simply return null
                    if (!this._data || !this._data.length) {
                        return null;
                    }

                    var values = [];

                    // Iterate over all data rows to compute the row values depending on the row_markdown_pattern.
                    for (var i = 0; i < this._data.length; i++) {

                        // Compute formatted value for each column
                        var keyValues = module._getFormattedKeyValues(this._ref, this._data[i]);

                        // Code to do template/string replacement using keyValues
                        var value = module._renderTemplate(this._ref.display._markdownPattern, keyValues);

                        // If value is null or empty, return value on basis of `show_nulls`
                        if (value === null || value === '') {
                            value = module._getNullValue(this, this._ref.context, [this._ref.table, this._ref.table.schema]);
                        }

                        // If final value is not null then push it in values array
                        if (value !== null) {
                            values.push(value);
                        }
                    }

                    // Join the values array using the separator and prepend it with the prefix and append suffix to it.
                    var pattern = this._ref.display._prefix + values.join(this._ref.display._separator) + this._ref.display._suffix;

                    // Get the HTML generated using the markdown pattern generated above
                    this._content =  module._formatUtils.printMarkdown(pattern);
                } else {
                    this._content = null;
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
     * @param {!Object} data The unprocessed tuple of data returned from ERMrest.
     */
    function Tuple(pageReference, data) {
        this._pageRef = pageReference;
        this._data = data;
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

                // update its location by adding the tuple’s key filter to the URI
                // don't keep any modifiers
                var uri = this._pageRef._location.service + "/catalog/" + this._pageRef._location.catalog + "/" +
                    this._pageRef._location.api + "/" + this._pageRef._table.schema.name + ":" + this._pageRef._table.name + "/";
                for (var k = 0; k < this._pageRef._shortestKey.length; k++) {
                    var col = this._pageRef._shortestKey[k].name;
                    if (k === 0) {
                        uri = uri + module._fixedEncodeURIComponent(col) + "=" + module._fixedEncodeURIComponent(this._data[col]);
                    } else {
                        uri = uri + "&" + module._fixedEncodeURIComponent(col) + "=" + module._fixedEncodeURIComponent(this._data[col]);
                    }
                }
                this._ref._location = module._parse(uri);
            }
            return this._ref;
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
                this._isHTML = [];
                var keyValues = module._getFormattedKeyValues(this._pageRef, this._data);

                /*
                 * use this variable to avoid using computed formatted values in other columns while templating
                 */
                var formattedValues = [];

                // format values according to column display annotation
                for (i = 0; i < this._pageRef.columns.length; i++) {
                    var tempCol = this._pageRef.columns[i];
                    formattedValues[i] = tempCol.formatPresentation(keyValues[tempCol.name], { keyValues : keyValues , columns: this._pageRef.columns, context: this._pageRef._context });

                    if (tempCol.type.name === "gene_sequence") {
                        formattedValues[i].isHTML = true;
                    }

                }

                var self = this;

                formattedValues.forEach(function(fv) {
                    self._values.push(fv.value);
                    self._isHTML.push(fv.isHTML);
                });

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
         * @type {string[]}
         */
        get isHTML() {
            // this._isHTML has not been populated then call this.values getter to populate values and isHTML array
            if (!this._isHTML) {
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
         * console.log("This tuple has a displayable name of", tuple.displayname);
         * ```
         * @type {string}
         */
        get displayname() {
            var self = this, table = this._pageRef._table, col;
            if (!this._displayname) {
                var annotation;
                // If table has table-display annotation then set it in annotation variable
                if (table.annotations.contains(module._annotations.TABLE_DISPLAY)) {
                    annotation = module._getRecursiveAnnotationValue(module._contexts.ROWNAME, table.annotations.get(module._annotations.TABLE_DISPLAY).content);
                }

                // if annotation is populated and annotation has display.rowName property
                if (annotation && typeof annotation.row_markdown_pattern === 'string') {
                    var template = annotation.row_markdown_pattern;

                    // Get formatted keyValues for a table for the data
                    var keyValues = module._getFormattedKeyValues(this._pageRef, this._data);

                    // get templated patten after replacing the values using Mustache
                    var pattern = module._renderTemplate(template, keyValues);

                    // Render markdown content for the pattern
                    this._displayname = module._formatUtils.printMarkdown(pattern, { inline: true });
                }
                // no row_name annotation, use column with title, name, term, label or id:text type
                // or use the unique key
                else {

                    var setDisplaynameForACol = function(name) {
                        if (typeof self._data[name] === 'string') {
                            col = table.columns.get(name);
                            self._displayname = col.formatvalue(self._data[name], { context: self._pageRef.context });
                            return true;
                        }
                        return false;
                    };

                    var columns = ['title', 'Title', 'TITLE', 'name', 'Name', 'NAME', 'term', 'Term', 'TERM', 'label', 'Label', 'LABEL'];

                    for (var i = 0; i < columns.length; i++) {
                        if (setDisplaynameForACol(columns[i])) {
                            return this._displayname;
                        }
                    }

                    // Check for id column whose type should not be integer or serial
                    var idCol = table.columns.all().filter(function (c) {
                        return ((c.name.toLowerCase() === "id") && (c.type.name.indexOf('serial') === -1) && (c.type.name.indexOf('int') === -1));
                    });

                    // If id column exists
                    if (idCol.length && typeof this._data[idCol[0].name] === 'string') {
                        this._displayname = idCol[0].formatvalue(this._data[idCol[0].name], { context: self._pageRef.context });
                    } else {
                        // Get the columns for shortestKey
                        var keyColumns = table.shortestKey;

                        if (keyColumns.length >= table.columns.length) {
                            this._displayname = null;
                        } else {

                            var values = [];

                            // Iterate over the keycolumns to get their formatted values for `row_name` context
                            keyColumns.forEach(function(c) {
                                var value = c.formatvalue(self._data[c.name], { context: self._pageRef.context });
                                values.push(value);
                            });

                            /*
                             * join all values by ':' to get the display_name
                             * Eg: displayName for values=["12", "DNA results for human specimen"] would be
                             * "12:DNA results for human specimen"
                             */
                            this._displayname = values.join(':');
                        }
                    }
                }
            }

            return this._displayname;
        }

    };


    return module;

}(ERMrest || {}));
