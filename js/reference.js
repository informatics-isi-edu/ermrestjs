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
     * set callback function that converts app tag to app URL
     * @callback appLinkFn
     * @param {appLinkFn} fn callback function
     */
    module.appLinkFn = function(fn) {
        module._appLinkFn = fn;
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

            var location = module._parse(uri);

            var server = module.ermrestFactory.getServer(location.service, params);
            server.catalogs.get(location.catalog).then(function (catalog) {
                defer.resolve(new Reference(location, catalog));

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
    module._createPage = function (reference, data, hasPrevious, hasNext) {
        return new Page(reference, data, hasPrevious, hasNext);
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

        this._meta = catalog.meta;

        this._server = catalog.server;

        // if schema was not provided in the URI, find the schema
        var schema;
        if (!location.schemaName) {
            var schemas = catalog.schemas.all();
            for (var i = 0; i < schemas.length; i++) {
                if (schemas[i].tables.names().indexOf(location.tableName) !== -1) {
                    if (!schema){
                        schema = schemas[i];
                    } else{
                        throw new module.MalformedURIError("Ambiguous table name " + location.tableName + ". Schema name is required.");
                    }
                }
            }
            if (!schema) {
                throw new module.MalformedURIError("Table " + location.tableName + " not found");
            }

            this._table = schema.tables.get(location.tableName);

        } else{
            this._table = catalog.schemas.get(location.schemaName).tables.get(location.tableName);
        }

        this._shortestKey = this._table.shortestKey;
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
            if (this._referenceColumns === undefined) {
                /**
                 * The logic is as follows:
                 *
                 * 1. check if visible-column annotation is present for this context, go through the list,
                 *      1.1 if it's an array,
                 *          1.1.1 find the corresponding foreign key
                 *          1.1.2 check if it's part of this table.
                 *          1.1.3 avoid duplicate foreign keys.
                 *          1.1.4 make sure it is not hidden(+).
                 *      1.2 otherwise find the corresponding column if exits and add it (avoid duplicate),
                 *
                 * 2.otherwise go through list of table columns
                 *      2.1 check if column has not been processed before.
                 *      2.2 if it's not part of any foreign keys add the column.
                 *      2.3 go through all of the foreign keys that this column is part of.
                 *          2.3.1 make sure it is not hidden(+).
                 *          2.3.2 if it's simple fk, just create PseudoColumn
                 *          2.3.3 otherwise add the column just once and append just one PseudoColumn (avoid duplicate)
                 *
                 * NOTE:
                 *  + If this reference is actually an inbound related reference, we should hide the foreign key (and all of its columns) that created the link.
                 * */

                this._referenceColumns = [];

                // check if we should hide some columns or not.
                // NOTE: if the reference is actually an inbound related reference, we should hide the foreign key that created this link.
                var hasOrigFKR = typeof this.origFKR != "undefined" && this.origFKR !== null && !this.origFKR._table._isPureBinaryAssociation();

                var columns = -1,
                    addedFKs = {}, // to avoid duplicate foreign keys
                    addedKeys = {}, // to avoid duplicate keys
                    compositeFKs = [], // to add composite keys at the end of the list
                    consideredColumns = {},  // to avoid unnecessary process and duplicate columns
                    hiddenFKR = this.origFKR,
                    colAdded,
                    fkName,
                    colFks,
                    cols, col, fk, i, j;

                // should hide the origFKR in case of inbound foreignKey
                var hideFKR = function (fkr) {
                    return hasOrigFKR && fkr == hiddenFKR;
                };

                // should hide the columns that are part of origFKR.
                var hideColumn = function (col) {
                    return hasOrigFKR && hiddenFKR.colset.columns.indexOf(col) != -1;
                };

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
                                fkName = fk.object.constraint_names[0].join(":");
                                switch(fk.subject) {
                                    case module._constraintTypes.FOREIGN_KEY:
                                        fk = fk.object;
                                        // fk is in this table, avoid duplicate and it's not hidden.
                                        if (!(fkName in addedFKs) && fk._table == this._table && !hideFKR(fk)) {
                                            addedFKs[fkName] = true;
                                            this._referenceColumns.push(new ReferenceColumn(this, (fk.simple ? fk.colset.columns[0] : null), {"foreignKey":fk}));
                                        }
                                        break;
                                    case module._constraintTypes.KEY:
                                        fk = fk.object;
                                        // key is in this table, and avoid duplicate
                                        if (!(fkName in addedKeys) && fk.table == this._table) {
                                            addedKeys[fkName] = true;
                                            // if key is not well formed (has notnull or isHTML), or we're in edit context: add its constituent columns
                                            if (module._isEntryContext(this._context) || !fk._isWellFormed(this._context)) {
                                                cols = fk.colset.columns;
                                                for (j = 0; j < cols.length; j++) {
                                                    col = cols[j];
                                                    if (!(col.name in consideredColumns) && !hideColumn(col)) {
                                                        consideredColumns[col.name] = true;
                                                        this._referenceColumns.push(new ReferenceColumn(this, cols[j]));
                                                    }
                                                }
                                            } else {
                                                this._referenceColumns.push(new ReferenceColumn(this, (fk.simple ? fk.colset.columns[0] : null), {"key":fk}));
                                            }
                                        }
                                        break;
                                    default:
                                        // visible-columns annotation only supports key, foreignkey and columns.
                                }
                            }
                        }
                        // column
                        else {
                            try {
                                col = this._table.columns.get(col);
                            } catch (exception) {}

                            // if column is not defined, processed before, or should be hidden
                            if (typeof col != "object" || col === null || (col.name in consideredColumns) || hideColumn(col)) {
                                    continue;
                            }
                            consideredColumns[col.name] = true;
                            this._referenceColumns.push(new ReferenceColumn(this, col));
                        }
                    }
                }
                // heuristics
                else {

                    //add the key
                    if (!module._isEntryContext(this._context)) {
                        var key = this._table._getDisplayKey(this._context);
                        if (key !== undefined) {
                            this._referenceColumns.push(new ReferenceColumn(this, (key.simple ? key.colset.columns[0] : null), {"key": key}));

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
                        consideredColumns[col.name] = true;

                        // add the column if it's not part of any foreign keys
                        if (col.memberOfForeignKeys.length === 0) {
                            this._referenceColumns.push(new ReferenceColumn(this, col));
                        } else {
                            // sort foreign keys of a column
                            if (col.memberOfForeignKeys.length > 1) {
                                colFKs = col.memberOfForeignKeys.sort(function (a, b) {
                                    return a.constraint_names[0].join(":").localeCompare(b.constraint_names[0].join(":"));
                                });
                            } else {
                                colFKs = col.memberOfForeignKeys;
                            }

                            colAdded = false;
                            for (j = 0; j < colFKs.length; j++) {
                                fk = colFKs[j];
                                fkName = fk.constraint_names[0].join(":");
                                // hide the origFKR
                                if(hideFKR(fk)) continue;

                                if (fk.simple) { // simple FKR
                                    if (!(fkName in addedFKs)) { // if not duplicate add the foreign key
                                        addedFKs[fkName] = true;
                                        this._referenceColumns.push(new ReferenceColumn(this, col, {"foreignKey":fk}));
                                    }
                                } else { // composite FKR
                                    // add the column if context is not entry and avoid duplicate
                                    if (!colAdded && !module._isEntryContext(this._context)) {
                                        colAdded = true;
                                        this._referenceColumns.push(new ReferenceColumn(this, col));
                                    }
                                    // hold composite FKR
                                    if (!(fkName in addedFKs)) {
                                        addedFKs[fkName] = true;
                                        compositeFKs.push(new ReferenceColumn(this, null, {"foreignKey":fk}));
                                    }
                                }
                            }
                        }
                    }

                    // append composite FKRs
                    for (i = 0; i < compositeFKs.length; i++) {
                        this._referenceColumns.push(compositeFKs[i]);
                    }
                }
            }
            return this._referenceColumns;
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

                // can create if all are true
                // 1) user has write permission
                // 2) table is not generated
                // 3) not all visible columns in the table are generated
                this._canCreate = !this._table._isGenerated && this._checkPermissions("content_write_user");

                if (this._canCreate) {
                    var allColumnsDisabled = this.columns.every(function (col) {
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
                this._canRead = this._checkPermissions("content_read_user");
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
                this._canUpdate = !this._table._isGenerated && !this._table._isImmutable && this._checkPermissions("content_write_user");

                if (this._canUpdate) {
                    var allColumnsDisabled = this.columns.every(function (col) {
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
            // 3) table is not generated
            // 4) table is not immutable
            // 5) not all visible columns in the table are generated/immutable
            if (this._canDelete === undefined) {
                this._canDelete = !this._table._isNonDeletable && !this._table._isGenerated && !this._table._isImmutable && this._checkPermissions("content_write_user");

                if (this._canDelete) {
                    var allColumnsDisabled = this.columns.every(function (col) {
                        return (col.getInputDisabled(module._contexts.EDIT) !== false);
                    });
                    this._canDelete = !allColumnsDisabled;
                }
            }
            return this._canDelete;
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
            var self = this;
            try {
                //  verify: data is not null, data has non empty tuple set
                verify(data, "'data' must be specified");
                verify(data.length > 0, "'data' must have at least one row to create");

                var defer = module._q.defer();

                //  get the defaults list for the referenced relation's table
                var defaults = getDefaults();

                // construct the uri
                var uri = this._location.compactUri;
                for (var i = 0; i < defaults.length; i++) {
                    uri += (i === 0 ? "?defaults=" : ',') + module._fixedEncodeURIComponent(defaults[i]);
                }

                //  do the 'post' call
                this._server._http.post(uri, data).then(function(response) {
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

                    var ref = new Reference(module._parse(uri), self._table.schema.catalog);
                    //  make a page of tuples of the results (unless error)
                    var page = new Page(ref, response.data, false, false);

                    //  resolve the promise, passing back the page
                    return defer.resolve(page);
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
                        if (data[m][columnName]) {
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
         *
         * @returns {Promise} A promise for a {@link ERMrest.Page} of results,
         * or {@link ERMrest.InvalidInputError} if `limit` is invalid, or
         * other errors TBD (TODO document other errors here).
         */
        read: function(limit) {
            try {

                var defer = module._q.defer();

                // if this reference came from a tuple, use tuple object's data
                if (this._tuple) {
                    var page = new Page(this, this._tuple.data, false, false);
                    defer.resolve(page);
                    return defer.promise;
                }

                verify(limit, "'limit' must be specified");
                verify(typeof(limit) == 'number', "'limit' must be a number");
                verify(limit > 0, "'limit' must be greater than 0");

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
                            sortObject.push({"column": col, "descending":false}); // add key to sort
                        }
                    }
                    this._location.sortObject = sortObject;
                }

                /*
                * Change api to attributegroup for retrieving the foreign key data
                * This will just affect the http request and not this._location
                *
                * NOTE:
                * This piece of code is dependent on the same assumptions as the current parser, which are:
                *   1. There is no alias in url (more precisely `M`, `F1`, `F2`, `F3`, ...)
                *   2. Filter comes before the link syntax.
                *   3. There is no trailing `/` in uri (as it will break the ermrest too).
                */
                if (this._table.foreignKeys.length() > 0) {
                    var compactPath = this._location.compactPath,
                        parts,
                        tableIndex = 0,
                        fkList = "",
                        linking,
                        sortColumn,
                        keys,
                        k;

                    // add M alias to current table
                    if (this._location.searchFilter) { // remove search filter
                        compactPath = compactPath.replace("/" + this._location.searchFilter, "");
                    }
                    parts = compactPath.split('/');
                    linking = parts[parts.length-1].match(/(\(.*\)=\(.*:.*:.*\))/);
                    if (linking && linking[1]) { // the same logic as parser for finding the link syntax
                        tableIndex = compactPath.lastIndexOf("/") + 1;
                    }
                    compactPath = compactPath.substring(0, tableIndex) + "M:=" + compactPath.substring(tableIndex);

                    // add search filter back
                    if (this._location.searchFilter) {
                        compactPath = compactPath + "/" + this._location.searchFilter;
                    }

                    // create the uri with attributegroup and alias
                    uri = [this._location.service, "catalog", this._location.catalog, "attributegroup", compactPath].join("/");

                    // add joins for foreign keys
                    for (k = this._table.foreignKeys.length() - 1;k >= 0 ; k--) {
                        // /F2:=left(id)=(s:t:c)/$M/F1:=left(id2)=(s1:t1:c1)/
                        uri += "/F" + (k+1) + ":=left" + this._table.foreignKeys.all()[k].toString(true) + "/$M" + (k === 0 ? "/" : "");

                        // F2:array(F2:*),F1:array(F1:*)
                        fkList += "F" + (k+1) + ":=array(F" + (k+1) + ":*)" + (k !== 0 ? "," : "");
                    }


                    // add keys
                    keys = this._shortestKey.map(function(col){
                        return col.name;
                    });

                    // add sort columns
                    for(k = 0; k < this._location.sortObject.length; k++) {
                        sortColumn = this._location.sortObject[k];
                        if ("column" in sortColumn && keys.indexOf(sortColumn.column) === -1) {
                            keys.push(sortColumn.column);
                        }
                    }

                    uri += keys.join(",") + ";M:=array(M:*)," + fkList;
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
                this._server._http.get(uri).then(function readReference(response) {
                    ownReference._etag = response.headers().etag;

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
         * @param {Array} tuples array of tuple objects so that the new data nd old data can be used to determine key changes.
         * tuple.data has the new data
         * tuple._oldData has the data before changes were made
         * @returns {Promise} page A promise for a page result or errors.
         */
        update: function(tuples) {
            try {
                verify(tuples, "'tuples' must be specified");
                verify(tuples.length > 0, "'tuples' must have at least one row to create");

                var defer = module._q.defer();

                var self = this,
                    oldAlias = "_o",
                    newAlias = "_n",
                    uri = this._location.service + "/catalog/" + this._location.catalog + "/attributegroup/" + this._location.schemaName + ':' + this._location.tableName + '/';

                var submissionData = [],
                    columnProjections = [],
                    shortestKeyNames = [],
                    keyWasModified = false,
                    tuple, oldData, newData, keyName;


                shortestKeyNames = this._shortestKey.map(function (column) {
                    return column.name;
                });

                for(var i = 0; i < tuples.length; i++) {
                    newData = tuples[i].data;
                    oldData = tuples[i]._oldData;
                    submissionData[i] = {};
                    for (var key in newData) {
                        // if the key is part of the shortest key for the entity, the data needs to be aliased
                        // use a suffix of '_o' to represent changes to a value that's in the shortest key that was changed, everything else gets '_n'
                        if (shortestKeyNames.indexOf(key) !== -1) submissionData[i][key + oldAlias] = oldData[key];
                        submissionData[i][key + newAlias] = newData[key];
                    }
                }

                // The list of column names to use in the uri
                columnProjections = Object.keys(tuples[0].data);

                // always alias the shortest key in the uri
                for (var j = 0; j < shortestKeyNames.length; j++) {
                    if (j !== 0) uri += ',';
                    keyName = shortestKeyNames[j];

                    // need to alias the key in the uri
                    uri += module._fixedEncodeURIComponent(keyName) + oldAlias + ":=" + module._fixedEncodeURIComponent(keyName);
                }

                // separator for denoting where the keyset ends and the update column set begins
                uri += ';';

                for (var k = 0; k < columnProjections.length; k++) {
                    if (k !== 0) uri += ',';
                    // check if this column is part of the shortest key, alias the column name if it is
                    uri += module._fixedEncodeURIComponent(columnProjections[k]) + newAlias + ":=" + module._fixedEncodeURIComponent(columnProjections[k]);
                }

                var config = {
                    headers: {
                        "If-Match": this._etag
                    }
                };

                this._server._http.put(uri, submissionData, config).then(function updateReference(response) {
                    var pageData = [],
                        page;

                    var uri = self._location.service + "/catalog/" + self._location.catalog + "/entity/" + self._location.schemaName + ':' + self._location.tableName + '/';
                    // loop through each returned Row and get the key value
                    for (var j = 0; j < response.data.length; j++) {
                        // build the uri
                        if (j !== 0)
                        uri += ';';
                        // shortest key is made up from one column
                        if (self._shortestKey.length == 1) {
                            keyName = self._shortestKey[0].name;
                            uri += module._fixedEncodeURIComponent(keyName) + '=' + module._fixedEncodeURIComponent(response.data[j][keyName + newAlias]);
                        } else {
                            uri += '(';
                            for (var k = 0; k < self._shortestKey.length; k++) {
                                if (k !== 0)
                                uri += '&';
                                keyName = self._shortestKey[k].name;
                                uri += module._fixedEncodeURIComponent(keyName) + '=' + module._fixedEncodeURIComponent(response.data[j][keyName + newAlias]);
                            }
                            uri += ')';
                        }

                        // unalias the keys for the page data
                        pageData[j] = {};
                        var responseColumns = Object.keys(response.data[j]);

                        for (var m = 0; m < responseColumns.length; m++) {
                            var columnAlias = responseColumns[m];
                            if (columnAlias.endsWith(newAlias)) {
                                // alias is always at end and length 2
                                var columnName = columnAlias.slice(0, columnAlias.length-newAlias.length);
                                pageData[j][columnName] = response.data[j][columnAlias];
                            }
                        }
                    }
                    var ref = new Reference(module._parse(uri), self._table.schema.catalog);
                    page = new Page(ref, pageData, false, false);

                    defer.resolve(page);
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
         * @returns {Promise} A promise for a TBD result or errors.
         */
        delete: function() {
            try {
                var defer = module._q.defer();

                var config = {
                    headers: {
                        "If-Match": this._etag
                    }
                };

                this._server._http.delete(this.uri, config).then(function deleteReference(response) {

                    defer.resolve();
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

                var visibleFKs = this._table.referredBy._contextualize(this._context),
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
                    delete newRef._referenceColumns;
                    delete newRef._derivedAssociationRef;

                    // delete permissions
                    delete newRef._canCreate;
                    delete newRef._canRead;
                    delete newRef._canUpdate;
                    delete newRef._canDelete;

                    newRef.origFKR = fkr; // it will be used to trace back the reference

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

                        if (otherFK.to_name) {
                            newRef._displayname = {"isHTML": false, "value": otherFK.to_name};
                        } else {
                            newRef._displayname = otherFK.colset.columns[0].table.displayname;
                        }
                        newRef._location = module._parse(this._location.compactUri + "/" + fkr.toString() + "/" + otherFK.toString(true));

                        // additional values for sorting related references
                        newRef._related_key_column_positions = fkr.key.colset._getColumnPositions();
                        newRef._related_fk_column_positions = otherFK.colset._getColumnPositions();

                        // will be used in entry contexts
                        newRef._derivedAssociationRef = new Reference(module._parse(this._location.compactUri + "/" + fkr.toString()), newRef._table.schema.catalog);
                        newRef._derivedAssociationRef.session = this._session;
                        newRef._derivedAssociationRef.origFKR = newRef.origFKR;
                        newRef._derivedAssociationRef._secondFKR = otherFK;

                    } else { // Simple inbound Table
                        newRef._table = fkrTable;
                        newRef._shortestKey = newRef._table.shortestKey;

                        if (fkr.from_name) {
                            newRef._displayname = {"isHTML": false, "value": fkr.from_name};
                        } else {
                            newRef._displayname = newRef._table.displayname;
                        }

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
                        if (a._displayname.value != b._displayname.value) {
                            return a._displayname.value.localeCompare(b._displayname.value);
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

        get appLink() {

            var tag = (this._context? this._table._getAppLink(this._context): this._table._getAppLink());
            if (tag && module._appLinkFn) {
                return module._appLinkFn(tag, this._location);
            } else if (!tag && this._context)
                return module._appLinkFn(null, this._location, this._context); // app link not specified by annotation
            else {
                return undefined;
            }
        },

        /**
         * create a new reference with the new search
         * by copying this reference and clears previous search filters
         * search term can be:
         * a) A string with no space: single term or regular expression
         * b) A single term with space using ""
         * c) use space for conjunction of terms
         * @param {string} term - search term, undefined to clear search
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
            newReference._location.pagingObject = null;
            newReference._location.search(term);

            return newReference;
        },

        setNewTable: function(table) {
            this._table = table;
            this._shortestKey = table.shortestKey;
            this._displayname = table.displayname;
            delete this._referenceColumns;
            delete this._related;
            delete this._derivedAssociationRef;
            delete this._canCreate;
            delete this._canRead;
            delete this._canUpdate;
            delete this._canDelete;
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

        _contextualize: function(context) {
            var source;

            // if this is a related association table and context is edit, contextualize based on the association table.
            if (this._reference._derivedAssociationRef && module._isEntryContext(context)) {
                source = this._reference._derivedAssociationRef;
            } else {
                source = this._reference;
            }

            var newRef = _referenceCopy(source);
            delete newRef._related;
            delete newRef._referenceColumns;

            newRef._context = context;

            // use the base table to get the alternative table of that context.
            // a base table's .baseTable is itself
            var newTable = source._table._baseTable._getAlternativeTable(context);


            // cases:
            // 1. same table: do nothing more
            // 2. no filter: swap table and update location only
            // 3. single entity filter using shared key: swap table and convert filter to mapped columns (TODO alt to alt)
            // 4. others: if from an alternative table to an alternative table, join base than join alternative table 2

            // if switched to a new table (could be a base table or alternative table)
            // need to update reference's table, key, displayname, location
            // modifiers are not kept because columns are not guarenteed to exist when we switch to another table
            if (newTable !== source._table) {

                // swap to new table
                newRef.setNewTable(newTable);

                // case 2: no filter
                if (source._location.filter === undefined) {
                    // case 1: no filter
                    newRef._location = module._parse(source._location.service + "/catalog/" + module._fixedEncodeURIComponent(source._location.catalog) + "/" +
                            source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name));
                } else {

                    var newLocationString;

                    // case 3: single entity key filter (without any join), swap table and switch to mapping key
                    // filter is single entity if it is binary filters using the shared key of the alternative tables
                    // or a conjunction of binary predicate that is a key of the alternative tables
                    if ((!source._location.projectionSchemaName || source._location.projectionSchemaName === source._location.schemaName) &&
                        source._location.projectionTableName === source._location.tableName) { // no join

                        // use base table's alt shared key
                        var sharedKey = source._table._baseTable._altSharedKey;
                        var filter = source._location.filter;
                        var filterString, j;

                        // binary filters using shared key
                        if (filter.type === module.filterTypes.BINARYPREDICATE && filter.operator === "=" && sharedKey.colset.length() === 1) {

                            // filter using shared key
                            if ((source._table._isAlternativeTable() && filter.column === source._table._altForeignKey.colset.columns[0].name) ||
                                (!source._table._isAlternativeTable() && filter.column === sharedKey.colset.columns[0].name)) {

                                if (newTable._isAlternativeTable()) // to alternative table
                                    filterString = module._fixedEncodeURIComponent(newTable._altForeignKey.colset.columns[0].name) +
                                        "=" + filter.value;
                                else // to base table
                                    filterString = module._fixedEncodeURIComponent(sharedKey.colset.columns[0].name) + "=" + filter.value;
                            }

                            newLocationString = source._location.service + "/catalog/" + module._fixedEncodeURIComponent(source._location.catalog) + "/" +
                                                source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name) + "/" +
                                                filterString;

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

                                    newLocationString = source._location.service + "/catalog/" + module._fixedEncodeURIComponent(source._location.catalog) + "/" +
                                        source._location.api + "/" + module._fixedEncodeURIComponent(newTable.schema.name) + ":" + module._fixedEncodeURIComponent(newTable.name) + "/" +
                                        filterString;
                                }
                            }
                        }
                    }

                    if (newLocationString) {
                        newRef._location = module._parse(newLocationString);
                    } else {
                         // all other cases, use join
                        var join;
                        if (source._table._isAlternativeTable() && newTable._isAlternativeTable()) {
                            join = source._table._altForeignKey.toString(true) + "/" +
                                   newTable._altForeignKey.toString();
                        } else if (!source._table._isAlternativeTable()) { // base to alternative
                            join = newTable._altForeignKey.toString();
                        } else { // alternative to base
                            join = source._table._altForeignKey.toString(true);
                        }

                        newRef._location = module._parse(source._location.compactUri + "/" + join);
                        // NOTE: if there is a filter that's not the same key used in linking, parser is not able to convert filter
                        //       not able to convert filter to the join table
                    }

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

        /*
         * This is the structure of this._linkedData
         * this._linkedData[i] = {`s:constraintName`: data}
         * That is for retrieving data for a foreign key, you should do the following:
         *
         * var fkData = this._linkedData[i][foreignKey.constraint_names[0].join(":")];
         */
        this._linkedData = [];

        // linkedData will include foreign key data
        if (this._ref._table.foreignKeys.length() > 0) {

            var fks = reference._table.foreignKeys.all(), i, j;

            try {
                // the attributegroup output
                this._data = [];
                for (i = 0; i < data.length; i++) {
                    this._data.push(data[i].M[0]);

                    this._linkedData.push({});
                    for (j = fks.length - 1; j >= 0 ; j--) {
                        this._linkedData[i][fks[j].constraint_names[0].join(":")] = data[i]["F"+(j+1)][0];
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
                        fkName = fks[j].constraint_names[0].join(":");
                        tempData[fkName] = {};

                        for (k = 0; k < fks[j].colset.columns.length; k++) {
                            col = fks[j].colset.columns[k];
                            tempData[fkName][fks[j].mapping.get(col).name] = data[i][col.name];
                        }
                    }
                    this._linkedData.push(tempData);
                }
            }
        }
        // entity output (linkedData is empty)
        else {
            this._data = data;
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
         *   console.log("Tuple:", tuple.displayname, "has values:", tuple.values);
         * }
         * ```
         * @type {ERMrest.Tuple[]}
         */
        get tuples() {
            if (this._tuples === undefined) {
                this._tuples = [];
                for (var i = 0; i < this._data.length; i++) {
                    this._tuples.push(new Tuple(this._ref, this._data[i], this._linkedData[i]));
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
                        var keyValues = module._getFormattedKeyValues(this._ref._table.columns, this._ref._context, this._data[i]);

                        // Code to do template/string replacement using keyValues
                        var value = module._renderTemplate(this._ref.display._markdownPattern, keyValues);

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
    function Tuple(pageReference, data, linkedData) {
        this._pageRef = pageReference;
        this._data = data;
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

                var uri = this._pageRef._location.service + "/catalog/" + module._fixedEncodeURIComponent(this._pageRef._location.catalog) + "/" +
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

                this._ref._location = module._parse(uri);

                // add the tuple to reference so that when calling read() we don't need to fetch the data again.
                this._ref._tuple = this._tuple;

            }
            return this._ref;
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

                // If context is entry
                if (module._isEntryContext(this._pageRef._context)) {

                    // Return raw values according to the visibility and sequence of columns
                    for (i = 0; i < this._pageRef.columns.length; i++) {
                        column = this._pageRef.columns[i];
                        if (column.isPseudo) {
                            if (column._isKey) {
                                presentation = column.formatPresentation(this._data, {context: this._pageRef._context});
                            } else {
                                presentation = column.formatPresentation(this._linkedData[column._constraintName], {context: this._pageRef._context});
                            }
                            this._values[i] = presentation.value;
                            this._isHTML[i] = presentation.isHTML;
                        } else {
                            this._values[i] = this._data[column.name];
                            this._isHTML[i] = false;
                        }
                    }
                } else {

                    var keyValues = module._getFormattedKeyValues(this._pageRef._table.columns, this._pageRef._context, this._data);

                    /*
                     * use this variable to avoid using computed formatted values in other columns while templating
                     */
                    var formattedValues = [];

                    // format values according to column display annotation
                    for (i = 0; i < this._pageRef.columns.length; i++) {
                        column = this._pageRef.columns[i];
                        if (column.isPseudo) {
                            if (column._isKey) {
                                formattedValues[i] = column.formatPresentation(this._data, {context: this._pageRef._context});
                            } else {
                                formattedValues[i] = column.formatPresentation(this._linkedData[column._constraintName], {context: this._pageRef._context});
                            }
                        } else {
                            formattedValues[i] = column.formatPresentation(keyValues[column.name], { keyValues : keyValues , columns: this._pageRef.columns, context: this._pageRef._context });

                            if (column.type.name === "gene_sequence") {
                                formattedValues[i].isHTML = true;
                            }
                        }
                    }

                    var self = this;

                    formattedValues.forEach(function(fv) {
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
            if (!this._displayname) {
                this._displayname = module._generateRowName(this._pageRef._table, this._pageRef._context, this._data);
            }
            return this._displayname;
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
            if (this._pageRef._derivedAssociationRef) {
                var associationRef = this._pageRef._derivedAssociationRef,
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
                } else {
                    var loc = associationRef._location;
                    var uri = [
                        loc.service, "catalog", encoder(loc.catalog), loc.api,
                        encoder(associationRef._table.schema.name) + ":" + encoder(associationRef._table.name),
                        newFilter.join("&")
                    ].join("/");

                    var reference = new Reference(module._parse(uri), this._pageRef._table.schema.catalog);
                    reference.session = associationRef._session;
                    return reference;
                }

            } else {
                return null;
            }

        }


    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Reference} reference column's reference
     * @param {?ERMrest.Column} base The column that this reference-column will be created based on.
     * @param {?Object} kwargs if it's not empty then the column is being created based on foreignkey or key.
     * @desc
     * Constructor for ReferenceColumn. This class is a wrapper for {@link ERMrest.Column}.
     */
    function ReferenceColumn(reference, base, kwargs) {

        this._baseReference = reference;

        this._context = reference._context;

        this._base = base;

        /**
         * @type {boolean}
         * @desc indicates this represents is a PseudoColumn or a Column.
         */
        this.isPseudo = false;

        if (typeof kwargs != 'undefined') {
            if (kwargs.foreignKey !== undefined) {

                this.isPseudo = true;

                // create ermrest url using the location
                var table = kwargs.foreignKey.key.table;
                var ermrestURI = [
                    table.schema.catalog.server.uri ,"catalog" ,
                    module._fixedEncodeURIComponent(table.schema.catalog.id), "entity",
                    [module._fixedEncodeURIComponent(table.schema.name),module._fixedEncodeURIComponent(table.name)].join(":")
                ].join("/");

                /**
                 * @type {ERMrest.Reference}
                 * @desc The reference object that represents the table of this PseudoColumn
                 */
                this.reference =  new Reference(module._parse(ermrestURI), table.schema.catalog);
                this.reference.session = reference._session;

                /**
                 * @type {ERMrest.ForeignKeyRef}
                 * @desc The Foreign key object that this PseudoColumn is created based on
                 */
                this.foreignKey = kwargs.foreignKey;

                this._constraintName = this.foreignKey.constraint_names[0].join(":");

                /**
                 * @private
                 * @type {boolean}
                 * @desc Indicates that this ReferenceColumn is a Foreign key.
                 */
                this._isForeignKey = true;
            } else if (kwargs.key !== undefined) {

                this.isPseudo = true;

                /**
                 * @type {ERMrest.ForeignKeyRef}
                 * @desc The Foreign key object that this PseudoColumn is created based on
                 */
                this.key = kwargs.key;

                this._constraintName = kwargs.key.constraint_names[0].join(":");

                /**
                 * @private
                 * @type {boolean}
                 * @desc Indicates that this ReferenceColumn is a key.
                 */
                this._isKey = true;
            }
        }
    }
    ReferenceColumn.prototype = {

        /**
         * @type {ERMrest.Table}
         */
        get table () {
            if (this._table === undefined) {
                if (!this.isPseudo && this._hasBase) {
                    this._table = this._base.table;
                } else if (this._isForeignKey) {
                    this._table = this.foreignKey.key.table;
                } else if (this._isKey) {
                    this._table = this.key.table;
                }
            }
            return this._table;
        },

        /**
         * @type {string}
         * @desc name of the column.
         */
        get name () {
            if (this._name === undefined) {
                if (!this.isPseudo) {
                    this._name = this._base.name;
                } else {
                    // make sure that this name is unique.
                    var table = this._isForeignKey ? this.foreignKey._table : this.table,
                        i = 0;
                    while(table.columns.has(this._constraintName + ((i!==0) ? i: ""))) {
                        i++;
                    }
                    this._name = this._constraintName + ((i!==0) ? i: "");
                }
            }
            return this._name;
        },

        /**
         * @type {string}
         * @desc Preferred display name for user presentation only.
         */
        get displayname() {
            if (this._displayname === undefined) {
                if (!this.isPseudo) {
                    this._displayname = this._base.displayname;
                } else if (this._isForeignKey){
                    var foreignKey = this.foreignKey, value, isHTML;
                    if (foreignKey.to_name !== "") {
                        value = foreignKey.to_name;
                        isHTML = false;
                    } else if (foreignKey.simple) {
                        value = this._base.displayname.value;
                        isHTML = this._base.displayname.isHTML;

                        if (this._base.memberOfForeignKeys.length > 1) { // disambiguate
                            value += " ("  + foreignKey.key.table.displayname.value + ")";
                            if (!isHTML) {
                                isHTML = foreignKey.key.table.displayname.isHTML;
                            }
                        }

                    } else {
                        value = foreignKey.key.table.displayname.value;
                        isHTML = foreignKey.key.table.displayname.isHTML;

                        // disambiguate
                        var tableCount = foreignKey._table.foreignKeys.all().filter(function (fk) {
                            return !fk.simple && fk.to_name === "" && fk.key.table == foreignKey.key.table;
                        }).length;

                        if (tableCount > 1) {
                             value += " (" + foreignKey.colset.columns.slice().sort(function(a,b) {
                                return a.name.localeCompare(b.name);
                            }).map(function(col) {
                                return col.displayname.value;
                            }).join(", ")  + ")";

                            if (!isHTML) {
                                isHTML = foreignKey.colset.columns.some(function (col) {
                                    return col.displayname.isHTML;
                                });
                            }
                        }
                    }
                    this._displayname = {"value": value, "isHTML": isHTML};

                } else if (this._isKey) {
                    this._displayname = {
                        "value": this.key.colset.columns.reduce(function(prev, curr, index) {
                            return prev + (index>0 ? " " : "") + curr.displayname.value;
                        }, ""),
                        "isHTML": this.key.colset.columns.some(function (col) {
                            return col.displayname.isHTML;
                        })
                    };
                }
            }
            return this._displayname;
        },

        /**
         *
         * @type {ERMrest.Type}
         */
        get type() {
            if (this._type === undefined) {
                this._type = this.isPseudo ? module._createType("markdown") : this._base.type;
            }
            return this._type;
        },

        /**
         * @type {Boolean}
         */
        get nullok() {
            if (this._nullok === undefined) {
                if (!this.isPseudo) {
                    this._nullok = this._base.nullok;
                } else {
                    var colset = this._isForeignKey ? this.foreignKey.colset : this.key.colset;
                    this._nullok = !colset.columns.some(function (col) {
                        return !col.nullok;
                    });
                }
            }
            return this._nullok;
        },

        /**
         * @desc Returns the default value
         * @type {string}
         */
         get default() {
             if (this._default === undefined) {
                if (!this.isPseudo) {
                    this._default = this._base.default;
                } else if (this._isForeignKey) {
                    var fkColumns = this.foreignKey.colset.columns,
                        keyColumns = this.foreignKey.key.colset.columns,
                        mapping = this.foreignKey.mapping,
                        data = {},
                        caption,
                        isNull = false,
                        i;

                    for (i = 0; i < fkColumns.length; i++) {
                        if (fkColumns[i].default === null || fkColumns[i].default === undefined) {
                            isNull = true; //return null if one of them is null;
                            break;
                        }
                        data[mapping.get(fkColumns[i]).name] = fkColumns[i].default;
                    }

                    if (isNull) {
                        this._default = null;
                    } else {
                        // use row name as the caption
                        caption = module._generateRowName(this.table, this._context, data);

                        // use "col_1:col_2:col_3"
                        if (caption.trim() === '') {
                            var keyValues = [];
                            for (i = 0; i < keyColumns.length; i++) {
                                keyValues.push(keyColumns[i].formatvalue(data[keyColumns[i].name], {context: this._context}));
                            }
                            caption = keyValues.join(":");
                        }

                        this._default = caption.trim() !== '' ? caption : null;
                    }
                }
             }
             return this._default;
         },

        /**
         * @desc Documentation for this reference-column
         * @type {string}
         */
        get comment() {
            if (this._comment === undefined) {
                if (this._hasBase) {
                    this._comment = this._base.comment;
                } else if (this._isForeignKey) {
                    this._comment = this.foreignKey.comment;
                } else if (this._isKey) {
                    this._comment = this.key.comment;
                }
            }
            return this._comment;

        },

        /**
         * @desc Indicates if the input should be disabled
         * true: input must be disabled
         * false:  input can be enabled
         * object: input msut be disabled (show .message to user)
         *
         * @type {boolean|object}
         */
        get inputDisabled() {
            if (this._inputDisabled === undefined) {
                this._inputDisabled = this._determineInputDisabled(this._context);
            }
            return this._inputDisabled;
        },

        /**
         * Formats a value corresponding to this reference-column definition.
         * @param {Object} data The 'raw' data value.
         * @returns {string} The formatted value.
         */
        formatvalue: function(data, options) {
            if (this._hasBase) {
                return this._base.formatvalue(data, options);
            }
            return data.toString();
        },

        /**
         * Formats the presentation value corresponding to this reference-column definition.
         * @param {String} data The 'formatted' data value.
         * @param {Object} options The key value pair of possible options with all formatted values in '.values' key
         * @returns {Object} A key value pair containing value and isHTML that detemrines the presenation.
         */
        formatPresentation: function(data, options) {
            if (!this.isPseudo) {
                return this._base.formatPresentation(data, options);
            }

            var nullValue = {isHTML: false, value: this._getNullValue(options ? options.context : undefined)};

            // if data is empty
            if (typeof data === "undefined" || data === null || Object.keys(data).length === 0) {
                return nullValue;
            }

            // used to create key pairs in uri
            var createKeyPair = function (cols) {
                 var keyPair = "", col;
                for (i = 0; i < cols.length; i++) {
                    col = cols[i].name;
                    keyPair +=  module._fixedEncodeURIComponent(col) + "=" + module._fixedEncodeURIComponent(data[col]);
                    if (i != cols.length - 1) {
                        keyPair +="&";
                    }
                }
                return keyPair;
            };

            var caption, i;

            if (this._isKey) {
                if (!this.key._isWellFormed(this._context)) {
                    // this should not happen
                    return nullValue;
                }

                var cols = this.key.colset.columns,
                    table = this.key.table,
                    values = [];

                // crete the caption
                for (i = 0; i < cols.length; i++) {
                    if (data[cols[i].name] === undefined ||  data[cols[i].name] === null) {
                        return nullValue;
                    }
                    values.push(cols[i].formatvalue(data[cols[i].name], {context: options ? options.context : undefined}));
                }
                caption = values.join(" ");

                // if the caption is empty we cannot add any link to that.
                if (caption.trim() === '') {
                    return nullValue;
                }

                var refURI = [
                    table.schema.catalog.server.uri ,"catalog" ,
                    module._fixedEncodeURIComponent(table.schema.catalog.id), this._baseReference.location.api,
                    [module._fixedEncodeURIComponent(table.schema.name),module._fixedEncodeURIComponent(table.name)].join(":"),
                    createKeyPair(cols)
                ].join("/");
                var keyRef = new Reference(module._parse(refURI), this.table.schema.catalog);

                return {isHTML: true, value: '<a href="' + keyRef.contextualize.detailed.appLink +'">' + caption + '</a>'};
            }

            // find value for foreign key:

            var fKey = this.foreignKey.key; // the key that creates this PseudoColumn

            // check if we have data for the given columns
            var hasData = function (kCols) {
                for (var i = 0; i < kCols.length; i++) {
                    if (data[kCols[i].name] === undefined ||  data[kCols[i].name] === null) {
                        return false;
                    }
                }
                return true;
            };

            // if any of key columns don't have data, this link is not valid.
            if (!hasData(fKey.colset.columns)) {
                return nullValue;
            }

            // use row name as the caption
            caption = module._generateRowName(this.table, options ? options.context : undefined, data);

            // use key for displayname: "col_1:col_2:col_3"
            if (caption.trim() === '') {
                var keyValues = [];
                for (i = 0; i < fKey.colset.columns.length; i++) {
                    keyValues.push(fKey.colset.columns[i].formatvalue(data[fKey.colset.columns[i].name], {context: options ? options.context : undefined}));
                }
                caption = keyValues.join(":");
            }

            var value;

            // if caption has a link, or context is EDIT: don't add the link.
            if (caption.match(/<a/) || (options && module._isEntryContext(options.context)) ) {
                value = caption;
            }
            // create the link using reference.
            else {

                // use the shortest key if it has data (for shorter url).
                var uriKey = hasData(this.table.shortestKey) ? this.table.shortestKey: fKey.colset.columns;

                // create a url that points to the current ReferenceColumn
                var uri = [this.reference.location.compactUri, createKeyPair(uriKey)].join("/");

                // create a reference to just this PseudoColumn to use for url
                var ref = new Reference(module._parse(uri), this.table.schema.catalog);

                value = '<a href="' + ref.contextualize.detailed.appLink +'">' + caption + '</a>';
            }

            return {isHTML: true, value: value};
        },

        /**
         * @desc Indicates if the input should be disabled, in different contexts
         * true: input must be disabled
         * false:  input can be enabled
         * object: input msut be disabled (show .message to user)
         *
         * @type {boolean|object}
         */
        getInputDisabled: function (context) {
            return this._determineInputDisabled(context);
        },

        _determineInputDisabled: function(context) {
            if (this._hasBase) {
                return this._base.getInputDisabled(context);
            }

            var cols, generated, i;

            if (this._isKey) {
                cols = this.key.colset.columns;
            } else {
                cols = this.foreignKey.colset.columns;
            }

            if (context == module._contexts.CREATE) {
                // if one is not generated
                for (i = 0; i < cols.length; i++) {
                    if (!cols[i].annotations.contains(module._annotations.GENERATED)) {
                        return false;
                    }
                }

                // if all GENERATED
                return {
                    message: "Automatically generated"
                };

            } else if (context == module._contexts.EDIT) {
                for (i = 0; i < cols.length; i++) {

                    // if one is IMMUTABLE
                    if (cols[i].annotations.contains(module._annotations.IMMUTABLE)) {
                        return true;
                    }

                    // if one is not GENERATED
                    if (!cols[i].annotations.contains(module._annotations.GENERATED)) {
                        return false;
                    }
                }
                // if all GENERATED
                return true;
            }

            // other contexts
            return true;
        },

        _getNullValue: function (context) {
            if (this._hasBase) {
                return this._base._getNullValue(context);
            }
            return module._getNullValue(this.table, context, [this.table, this.table.schema]);
        },

        get _hasBase() {
            return this._base !== null && this._base !== undefined;
        }

    };

    return module;

}(ERMrest || {}));
