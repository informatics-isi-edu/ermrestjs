/*
 * Copyright 2015 University of Southern California
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

/**
 * The ERMrest module is a JavaScript client library for the ERMrest
 * service. Most clients should begin with {@link ERMrest.resolve}.
 *
 * IMPORTANT NOTE: This module is a work in progress.
 * It is likely to change several times before we have an interface we wish
 * to use for ERMrest JavaScript agents.
 * @namespace ERMrest
 */
var ERMrest = (function (module) {

    module.configure = configure;

    module.ermrestFactory = {
        getServer: getServer
    };


    var _servers = {};

    module._http = null;

    module._q = null;

    /**
     * @memberof ERMrest
     * @function
     * @param {Object} http Angular $http service object
     * @param {Object} q Angular $q service object
     * @desc This function is used to configure the module
     */
    function configure(http, q) {
        module._http = http;
        module._q = q;
    }

    /**
     * @memberof ERMrest
     * @function
     * @param {string} uri URI of the ERMrest service.
     * @param {Object} [params={cid:'null'}] An optional server query parameter
     * appended to the end of any request to the server.
     * @return {ERMrest.Server} Returns a server instance.
     * @throws {ERMrest.InvalidInputError} URI is missing
     * @desc
     * ERMrest server factory creates or reuses ERMrest.Server instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getServer(uri, params) {

        if (uri === undefined || uri === null)
            throw new module.InvalidInputError("URI undefined or null");

        if (typeof params === 'undefined' || params === null) {
            // Set default cid to a truthy string because a true null will not
            // appear as a query parameter but we want to track cid even when cid
            // isn't provided
            params = {'cid': 'null'};
        }

        var server = _servers[uri]; // TODO this lookup should factor in params
        if (!server) {
            server = new Server(uri, params);

            server.catalogs = new Catalogs(server);
            _servers[uri] = server;
        }

        return server;
    }


    /**
     * @memberof ERMrest
     * @param {string} uri URI of the ERMrest service.
     * @constructor
     */
    function Server(uri, params) {

        /**
         * The URI of the ERMrest service
         * @type {string}
         */
        this.uri = uri;

        /**
         * The wrapped http service for this server instance.
         * @private
         * @type {Object}
         */
        this._http = module._wrap_http(module._http);
        this._http.params = params || {};
        this._http.params.cid = this._http.params.cid || null;

        /**
         *
         * @type {ERMrest.Catalogs}
         */
        this.catalogs = null;
    }


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Server} server the server object.
     * @desc
     * Constructor for the Catalogs.
     */
    function Catalogs(server) {
        this._server = server;
        this._catalogs = {};
    }


    Catalogs.prototype = {
        constructor: Catalogs,

        create: function () {

        },

        /**
         *
         * @returns {Number} Returns the length of the catalogs.
         */
        length: function () {
            return Object.keys(this._catalogs).length;
        },

        /**
         *
         * @returns {Array} Returns an array of names of catalogs.
         */
        names: function () {
            return Object.keys(this._catalogs);
        },

        /**
         * @param {string} id Catalog ID.
         * @return {Promise} a promise that returns the catalog  if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.NotFoundError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * @desc Get a catalog by id. This call does catalog introspection.
         */
        get: function (id) {
            // do introspection here and return a promise

            var self = this;
            var defer = module._q.defer();

            // load catalog only when requested
            if (id in this._catalogs) {

                defer.resolve(self._catalogs[id]);
                return defer.promise;

            } else {

                var catalog = new Catalog(self._server, id);
                catalog._introspect().then(function () {
                    self._catalogs[id] = catalog;
                    defer.resolve(catalog);
                }, function (error) {
                    defer.reject(error);
                });

                return defer.promise;
            }
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Server} server the server object.
     * @param {string} id the catalog id.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog(server, id) {

        /**
         * For internal use only. A reference to the server instance.
         * @private
         * @type {ERMrest.Server}
         */
        this.server = server;

        /**
         * The catalog identifier.
         * @type {string}
         */
        this.id = id;

        this._uri = server.uri + "/catalog/" + id;

        /**
         *
         * @type {ERMrest.Schemas}
         */
        this.schemas = new Schemas();


         // A map from schema name to constraint names to the actual object.
         // this._constraintNames[schemaName][constraintName] will return an object.
        this._constraintNames = {};
    }

    Catalog.prototype = {
        constructor: Catalog,

        delete: function () {

        },

        /**
         *
         * @private
         * @return {Promise} a promise that returns json object or catalog schema if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.NotFoundError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         */
        _introspect: function () {
            // load all schemas
            var self = this;
            return this.server._http.get(this._uri + "/schema").then(function (response) {
                var jsonSchemas = response.data;
                for (var s in jsonSchemas.schemas) {
                    self.schemas._push(new Schema(self, jsonSchemas.schemas[s]));
                }

                // all schemas created
                // build foreign keys for each table in each schema
                var schemaNames = self.schemas.names();
                for (s = 0; s < schemaNames.length; s++) {
                    var schema = self.schemas.get(schemaNames[s]);
                    var tables = schema.tables.names();
                    for (var t = 0; t < tables.length; t++) {
                        var table = schema.tables.get(tables[t]);
                        table._buildForeignKeys();
                    }
                }

                return self.schemas;
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         * @desc returns the constraint object for the pair.
         * @param {Array.<string>} pair constraint name array. Its length must be two.
         * @throws {ERMrest.NotFoundError} constraint not found
         * @returns {Object} the constrant object
         */
        constraintByNamePair: function (pair) {
            if ((pair[0] in this._constraintNames) && (pair[1] in this._constraintNames[pair[0]]) ){
                return this._constraintNames[pair[0]][pair[1]];
            }
            throw new module.NotFoundError("", "constraint [ " + pair.join(" ,") + " ] not found.");
        },

        // used in ForeignKeyRef to add the defined constraintNames.
        _addConstraintName: function (pair, obj){
            if (pair[0] === "" || this.schemas.has(pair[0])) { //only empty schema and defined schema names are allowed
                if (!(pair[0] in this._constraintNames)) {
                    this._constraintNames[pair[0]] = {};
                }
                this._constraintNames[pair[0]][pair[1]] = obj;
            }
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Schemas.
     */
    function Schemas() {
        this._schemas = {};
    }

    Schemas.prototype = {
        constructor: Schemas,

        _push: function (schema) {
            this._schemas[schema.name] = schema;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of schemas
         */
        length: function () {
            return Object.keys(this._schemas).length;
        },

        /**
         *
         * @returns {Array} Array of all schemas in the catalog
         */
        all: function () {
            var array = [];
            for (var key in this._schemas) {
                array.push(this._schemas[key]);
            }
            return array;
        },

        /**
         *
         * @returns {Array} Array of schema names
         */
        names: function () {
            return Object.keys(this._schemas);
        },

        /**
         * @param {string} name schema name
         * @returns {ERMrest.Schema} schema object
         * @throws {ERMrest.NotFoundError} schema not found
         * @desc get schema by schema name
         */
        get: function (name) {
            if (!(name in this._schemas)) {
                throw new module.NotFoundError("", "Schema " + name + " not found in catalog.");
            }

            return this._schemas[name];
        },

        /**
         * @param {string} name schmea name
         * @returns {boolean} if the schema exists or not
         * @desc check for schema name existence
         */
        has: function (name) {
            return name in this._schemas;
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Catalog} catalog the catalog object.
     * @param {string} jsonSchema json of the schema.
     * @desc
     * Constructor for the Catalog.
     */
    function Schema(catalog, jsonSchema) {

        /**
         *
         * @type {ERMrest.Catalog}
         */
        this.catalog = catalog;

        /**
         *
         */
        this.name = jsonSchema.schema_name;

        //this._uri = catalog._uri + "/schema/" + module._fixedEncodeURIComponent(this.name);

        /**
         *
         * @type {boolean}
         */
        this.ignore = false;

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonSchema.annotations) {
            var jsonAnnotation = jsonSchema.annotations[uri];
            this.annotations._push(new Annotation("schema", uri, jsonAnnotation));

            if (uri === module._annotations.HIDDEN) {
                this.ignore = true;
            } else if (uri === module._annotations.IGNORE &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

        this._nameStyle = {}; // Used in the displayname to store the name styles.

        /**
         * @type {string}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this, null);

        /**
         *
         * @type {ERMrest.Tables}
         */
        this.tables = new Tables();
        for (var key in jsonSchema.tables) {
            var jsonTable = jsonSchema.tables[key];
            this.tables._push(new Table(this, jsonTable));
        }

        /**
         * @desc Documentation for this schema
         * @type {string}
         */
        this.comment = jsonSchema.comment;

    }

    Schema.prototype = {
        constructor: Schema,

        delete: function () {

        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Tables.
     */
    function Tables() {
        this._tables = {};
    }

    Tables.prototype = {
        constructor: Tables,

        _push: function (table) {
            this._tables[table.name] = table;
        },

        /**
         *
         * @returns {Array} array of tables
         */
        all: function () {
            var array = [];
            for (var key in this._tables) {
                array.push(this._tables[key]);
            }
            return array;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of tables
         */
        length: function () {
            return Object.keys(this._tables).length;
        },

        /**
         *
         * @returns {Array} Array of table names
         */
        names: function () {
            return Object.keys(this._tables);
        },

        /**
         *
         * @param {string} name name of table
         * @returns {ERMrest.Table} table
         * @throws {ERMrest.NotFoundError} table not found
         * @desc get table by table name
         */
        get: function (name) {
            if (!(name in this._tables)) {
                throw new module.NotFoundError("", "Table " + name + " not found in schema.");
            }

            return this._tables[name];
        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Schema} schema the schema object.
     * @param {string} jsonTable the json of the table.
     * @desc
     * Constructor for Table.
     */
    function Table(schema, jsonTable) {

        /**
         *
         * @type {ERMrest.Schema}
         */
        this.schema = schema;

        /**
         *
         */
        this.name = jsonTable.table_name;
        this._jsonTable = jsonTable;

        //this.uri = schema.catalog._uri + "/entity/" + module._fixedEncodeURIComponent(schema.name) + ":" + module._fixedEncodeURIComponent(jsonTable.table_name);

        /**
         *
         * @type {ERMrest.Table.Entity}
         */
        this.entity = new Entity(this.schema.catalog.server, this);

        /**
         *
         * @type {boolean}
         */
        this.ignore = false;

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonTable.annotations) {
            var jsonAnnotation = jsonTable.annotations[uri];
            this.annotations._push(new Annotation("table", uri, jsonAnnotation));

            if (uri === module._annotations.HIDDEN) {
                this.ignore = true;
            } else if (uri === module._annotations.IGNORE &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

        this._nameStyle = {}; // Used in the displayname to store the name styles.
        this._visibleInboundForeignKeys_cached = {}; // Used in _visibleInboundForeignKeys

        /**
         * @type {string}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this, this.schema);

        /**
         *
         * @type {ERMrest.Columns}
         */
        this.columns = new Columns(this);
        for (var i = 0; i < jsonTable.column_definitions.length; i++) {
            var jsonColumn = jsonTable.column_definitions[i];
            this.columns._push(new Column(this, jsonColumn));
        }

        /**
         *
         * @type {ERMrest.Keys}
         */
        this.keys = new Keys();
        for (i = 0; i < jsonTable.keys.length; i++) {
            var jsonKey = jsonTable.keys[i];
            this.keys._push(new Key(this, jsonKey));
        }

        /**
         *
         * @type {ERMrest.ForeignKeys}
         */
        this.foreignKeys = new ForeignKeys();

        /**
         * All the FKRs to this table.
         * @type {ERMrest.ForeignKeys}
         */
        this.referredBy = new ForeignKeys();

        /**
         * @desc Documentation for this table
         * @type {string}
         */
        this.comment = jsonTable.comment;

    }

    Table.prototype = {
        constructor: Table,

        delete: function () {

        },

        get shortestKey() {
            if (!this._shortestKey) {

                if (this.keys.length() === 0) { // no key, use all columns
                    this._shortestKey = this.columns.all();
                } else {
                    var keys = this.keys.all();

                    // sort keys by length
                    var sortedKeys = keys.sort(function (a, b) {
                        var val = a.colset.length() - b.colset.length();

                        // if key length equal, choose the one with integer/serial key over text
                        if (val === 0) {

                            // get a list of column types, and check if every type is int/serial
                            // return 1 if true, 0 for false
                            var aSerial = (a.colset.columns.map(function (column) {
                                return column.type.name;
                            }).every(function (current, index, array) {
                                return (current.toUpperCase().startsWith("INT") || current.toUpperCase().startsWith("SERIAL"));
                            }) ? 1 : 0);

                            var bSerial = (b.colset.columns.map(function (column) {
                                return column.type.name;
                            }).every(function (current, index, array) {
                                return (current.toUpperCase().startsWith("INT") || current.toUpperCase().startsWith("SERIAL"));
                            }) ? 1 : 0);

                            return bSerial - aSerial; // will make a before b if negative, b before a if positive
                        } else
                            return val;
                    });

                    this._shortestKey = sortedKeys[0].colset.columns;
                }
            }

            return this._shortestKey;
        },

        // build foreignKeys of this table and referredBy of corresponding tables.
        _buildForeignKeys: function () {
            // this should be built on the second pass after introspection
            // so we already have all the keys and columns for all tables
            this.foreignKeys = new ForeignKeys();
            for (var i = 0; i < this._jsonTable.foreign_keys.length; i++) {
                var jsonFKs = this._jsonTable.foreign_keys[i];
                var foreignKeyRef = new ForeignKeyRef(this, jsonFKs);
                // build foreignKeys of current table
                this.foreignKeys._push(foreignKeyRef);
                // add to referredBy of the key table
                foreignKeyRef.key.table.referredBy._push(foreignKeyRef);
            }
        },

        // returns visible inbound foreignkeys.
        _visibleInboundForeignKeys: function (context) {
            if(context in this._visibleInboundForeignKeys_cached) {
                return this._visibleInboundForeignKeys_cached[context];
            }

            var orders = -1;
            if (this.annotations.contains(module._annotations.VISIBLE_FOREIGN_KEYS)) {
                orders = module._getAnnotationArrayValue(context, this.annotations.get(module._annotations.VISIBLE_FOREIGN_KEYS).content);
            }

            if (orders == -1) {
                this._visibleInboundForeignKeys_cached[context] = -1;
                return -1; // no annoation
            }

            for (var i = 0, result = [], fk; i < orders.length; i++) {
                if(!Array.isArray(orders[i]) || orders[i].length != 2) {
                    continue; // the annotation value is not correct.
                }
                try {
                    fk = this.schema.catalog.constraintByNamePair(orders[i]);
                    if (result.indexOf(fk) == -1 && this.referredBy.all().indexOf(fk) != -1) {
                        // avoid duplicate and if it's a valid inbound fk of this table.
                        result.push(fk);
                    }
                } catch (exception){
                    // if the constraint name is not valid, this will catch the error
                }
            }

            this._visibleInboundForeignKeys_cached[context] = result;
            return result;
        },

        // figure out if Table is pure and binary association table.
        // binary: Has 2 outbound foreign keys.
        // pure: there is only a composite key constraint. This key includes all the columns from both foreign keys.
        // NOTE: (As an exception, the table can have an extra key that is made of one serial type column.)
        _isPureBinaryAssociation: function () {
            if(this._isPureBinaryAssociation_cached === undefined) {
                this._isPureBinaryAssociation_cached = this._computePureBinaryAssociation();
            }
            return this._isPureBinaryAssociation_cached;
        },

        _computePureBinaryAssociation: function () {
            if (this.referredBy.length() > 0 || this.foreignKeys.length() != 2) {
                return false; // not binary
            }

            var serialTypes = ["serial2", "serial4", "serial8"];
            var fkColset = new ColSet(this.foreignKeys.colsets().reduce(function(res, colset){
                return res.concat(colset.columns);
            }, [])); // set of foreignkey columns

            var tempKeys = this.keys.all().filter(function(key) {
                var keyCols = key.colset.columns;
                return !(keyCols.length == 1 && serialTypes.indexOf(keyCols[0].type.name) != -1  && !(keyCols[0] in fkColset.columns));
            }); // the key that should contain foreign key columns.

            if (tempKeys.length != 1) {
                return false; // not pure
            }

            return fkColset._equals(tempKeys[0].colset); // check for purity
        },

    };


    /**
     * @memberof ERMrest.Table
     * @constructor
     * @param {ERMrest.Server} server
     * @param {ERMrest.Table} table
     * @desc
     * Constructor for Entity. This is a container in Table
     */
    function Entity(server, table) {
        this._server = server;
        this._table = table;
    }

    Entity.prototype = {
        constructor: Entity,

        /**
         *
         * @param {string} api entity, attribute or attributegroup
         * @returns {string} the base URI for doing http calls
         * @private
         * @desc <service>/catalog/<cid>/<api>/<schema>:<table>
         */
        _getBaseURI: function (api) {
            return this._table.schema.catalog._uri + "/" + api + "/" +
                module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} [filter]
         * @param {ERMrest.Column[] | String[]} [output] selected columns
         * @param {Object[]} [sortby] columns to sort in order, required is paging is specified.
         * The format of object is {"column": ERMREST.Column | String, "order": asc | desc}
         * This should be a list of columns in order of sort, followed by all the key columns
         * @param {"before" | "after"} [paging]
         * @param {Object} [row] json row object used for paging only
         * @param {Number} [limit] limit number of rows to return
         * @returns {string}
         * @private
         * @desc get ermrest URI
         */
        _toURI: function (filter, output, sortby, paging, row, limit) {

            var api = (output === null || output === undefined) ? "entity" : "attribute";

            var uri = this._getBaseURI(api);

            if (filter !== undefined && filter !== null) {
                var filterUri = filter.toUri();
                // Set filter in url only if the filterURI is not empty
                if (filterUri.trim().length) uri = uri + "/" + filterUri;
            }

            // selected columns only
            if (output !== undefined && output !== null) {
                for (var c = 0; c < output.length; c++) {
                    var col = output[c]; // if string
                    if (output[c] instanceof Column) {
                        col = output[c].name;
                    }
                    if (c === 0)
                        uri = uri + "/" + module._fixedEncodeURIComponent(col);
                    else
                        uri = uri + "," + module._fixedEncodeURIComponent(col);
                }
            }

            if (sortby !== undefined && sortby !== null) {
                for (var d = 0; d < sortby.length; d++) {
                    var sortCol = sortby[d].column; // if string
                    if (sortby[d].column instanceof Column) { // if Column object
                        sortCol = sortby[d].column.name;
                    }
                    var order = (sortby[d].order === 'desc' ? "::desc::" : "");
                    if (d === 0)
                        uri = uri + "@sort(" + module._fixedEncodeURIComponent(sortCol) + order;
                    else
                        uri = uri + "," + module._fixedEncodeURIComponent(sortCol) + order;
                }
                uri = uri + ")";

                // paging requires sortby
                if (paging !== undefined && paging !== null && row !== undefined && row !== null) {
                    if (paging === "before") {
                        uri = uri + "@before(";
                    } else {
                        uri = uri + "@after(";
                    }

                    for (d = 0; d < sortby.length; d++) {
                        var pageCol = sortby[d].column; // if string
                        if (sortby[d] instanceof Column) { // if Column object
                            pageCol = sortby[d].name;
                        }
                        var value = row[pageCol];
                        if (value === null)
                            value = "::null::";
                        else
                            value = module._fixedEncodeURIComponent(value);
                        if (d === 0)
                            uri = uri + value;
                        else
                            uri = uri + "," + value;
                    }

                    uri = uri + ")";
                }

            }


            if (limit !== undefined && limit !== null) {
                uri = uri + "?limit=" + limit;
            }

            return uri;
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} [filter]
         * @returns {Promise} promise returning number of count if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * @desc get the number of rows
         *
         */
        count: function (filter) {

            var uri = this._getBaseURI("aggregate");

            if (filter !== undefined && filter !== null) {
                var filterUri = filter.toUri();
                // Set filter in url only if the filterURI is not empty
                if (filterUri.trim().length) uri = uri + "/" + filterUri;
            }

            uri = uri + "/row_count:=cnt(*)";

            return this._server._http.get(uri).then(function(response) {
                return response.data[0].row_count;
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} [filter]
         * @param {Number} [limit] Number of rows
         * @param {ERMrest.Column[] | string[]} [columns] Array of column names or Column objects output
         * @param {Object[]} [sortby] An ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc'
         * @returns {Promise} promise returning rowset if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected
         * @desc
         * get table rows with option filter, row limit and selected columns (in this order).
         * In order to use before & after on a Rows, limit must be speficied,
         * output columns and sortby needs to have columns of a key
         */
        get: function (filter, limit, columns, sortby) {

            var uri = this._toURI(filter, columns, sortby, null, null, limit);

            var self = this;
            return this._server._http.get(uri).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate | null} filter null if not being used
         * @param {Number} limit Required. Number of rows
         * @param {ERMrest.Column[] | String[]} [columns] Array of column names or Column objects output
         * @param {Object[]} [sortby]An ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc'
         * @param {Object} row json row data used to getBefore
         * @returns {Promise} promise returning rowset if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected
         * @desc
         * get a page of rows before a specific row
         * In order to use before & after on a Rows, limit must be speficied,
         * output columns and sortby needs to have columns of a key
         *
         */
        getBefore: function (filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "before", row, limit);

            var self = this;
            return this._server._http.get(uri).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate | null} filter null is not being used
         * @param {Number} limit Required. Number of rows
         * @param {ERMrest.Column[] | String[]} [columns] Array of column names or Column objects output
         * @param {Object[]} [sortby]An ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc'
         * @param {Object} row json row data used to getAfter
         * @returns {Promise} promise returning rowset if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected
         * @desc
         * get a page of rows after a specific row
         *
         */
        getAfter: function (filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "after", row, limit);

            var self = this;
            return this._server._http.get(uri).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} filter
         * @returns {Promise} Promise that returns the json row data deleted if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * @desc
         * Delete rows from table based on the filter
         */
        delete: function (filter) {
            var uri = this._toURI(filter);

            return this._server._http.delete(uri).then(function(response) {
                return response.data;
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} rows jSON representation of the updated rows
         * @returns {Promise} Promise that returns the rows updated if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * Update rows in the table
         */
        put: function (rows) {

            var uri = this._toURI();

            return this._server._http.put(uri, rows).then(function(response) {
                return response.data;
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} rows Array of jSON representation of rows
         * @param {String[]} defaults Array of string column names to be defaults
         * @returns {Promise} Promise that returns the rows created if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.BadRequestError}, {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * @desc
         * Create new entities
         */
        post: function (rows, defaults) { // create new entities
            var uri = this._table.schema.catalog._uri + "/entity/" +
                module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);

            if (typeof defaults !== 'undefined') {
                for (var i = 0; i < defaults.length; i++) {
                    if (i === 0) {
                        uri = uri + "?defaults=" + module._fixedEncodeURIComponent(defaults[i]);
                    } else {
                        uri = uri + "," + module._fixedEncodeURIComponent(defaults[i]);
                    }
                }
            }

            return this._server._http.post(uri, rows).then(function(response) {
               return response.data;
            }, function(response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        }

    };


    /**
     *
     * @memberof ERMrest
     * @param {ERMrest.Table} table
     * @param {Object} jsonRows
     * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate | null} filter null if not being used
     * @param {Number} limit Number of rows
     * @param {ERMrest.Column[] | String[]} columns Array of column names or Column objects output
     * @param {Object[]} [sortby] An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
     * @constructor
     */
    function Rows(table, jsonRows, filter, limit, columns, sortby) {
        this._table = table;
        this._filter = filter;
        this._limit = limit;
        this._columns = columns;
        this._sortby = sortby;

        /**
         * @type {Array}
         * @desc The set of rows returns from the server. It is an Array of
         * Objects that has keys and values based on the query that produced
         * the Rows.
         */
        this.data = jsonRows;
    }

    Rows.prototype = {
        constructor: Rows,

        /**
         *
         * @returns {number}
         */
        length: function () {
            return this.data.length;
        },

        /**
         *
         * @returns {Row}
         */
        get: function (index) {
            return new Row(this.data[index]);
        },

        /**
         * @returns {Promise} promise that returns the rows if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * @desc get the rows of the next page
         *
         */
        after: function () {

            return this._table.entity.getAfter(this._filter, this._limit, this._output, this._sortby, this.data[this.data.length - 1]);
        },

        /**
         *
         * @returns {Promise} promise that returns a rowset if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         * @desc get the rowset of the previous page
         *
         */
        before: function () {

            return this._table.entity.getBefore(this._filter, this._limit, this._output, this._sortby, this.data[0]);
        }
    };

    /**
     *
     * @memberof ERMrest
     * @param {Object} jsonRow Required.
     * @constructor
     */
    function Row(jsonRow) {
        /**
         * @type {Object}
         * @desc The row returned from the ith result in the Rows.data.
         */
        this.data = jsonRow;
    }

    Row.prototype = {
        constructor: Row,

        /**
         *
         * @returns {Array} Array of column names
         */
        names: function () {
            return Object.keys(this.data);
        },

        /**
         *
         * @param {string} name name of column
         * @returns {Object} column value
         */
        get: function (name) {
            if (!(name in this.data)) {
                throw new module.NotFoundError("", "Column " + name + " not found in row.");
            }
            return this.data[name];
        }
    };

    /**
     * @memberof ERMrest
     * @param {Table} table Required
     * @constructor
     * @desc
     * Constructor for Columns.
     */
    function Columns(table) {
        this._columns = [];

        this._table = table;
    }

    Columns.prototype = {
        constructor: Columns,

        _push: function (column) {
            this._columns.push(column);
        },

        /**
         *
         * @returns {Array} array of all columns
         */
        all: function () {
            return this._columns;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of columns
         */
        length: function () {
            return this._columns.length;
        },

        /**
         *
         * @returns {Array} names of columns
         */
        names: function () {
            return Array.prototype.map.call(this._columns, function (column) {
                return column.name;
            });
        },

        /**
         *
         * @param {string} name name of the column
         * @returns {boolean} whether Columns has this column or not
         */
        has: function (name) {
            return this._columns.filter(function (column) {
                    return column.name == name;
                }).length > 0;
        },

        /**
         *
         * @param {string} name name of column
         * @returns {ERMrest.Column} column
         */
        get: function (name) {
            var result = this._columns.filter(function (column) {
                return column.name == name;
            });

            if (result.length) {
                return result[0];
            }
            throw new module.NotFoundError("", "Column " + name + " not found in table.");
        },

        /**
         *
         * @param {int} pos
         * @returns {ERMrest.Column}
         */
        getByPosition: function (pos) {
            return this._columns[pos];
        },

        // Get columns based on the context.
        _contextualize: function (context) {

            // get column orders from annotation
            var orders = -1;
            if (this._table.annotations.contains(module._annotations.VISIBLE_COLUMNS)) {
                orders = module._getAnnotationArrayValue(context, this._table.annotations.get(module._annotations.VISIBLE_COLUMNS).content);
            }

            // no annotation
            if (orders == -1) {
                return this;
            }

            // build the columns
            var columns = new Columns(this._table);
            for (var i = 0; i < orders.length; i++) {
                try {
                    var c = this.get(orders[i]);

                    if (!columns.has(c.name)) { // not already in the columns.
                        columns._push(c);
                    }
                } catch (exception) {
                    //do nothing, go to the next column
                }
            }
            return columns;
        }

    };


    /**
     * Constructs a Column.
     *
     * TODO: The Column will need to change. We need to be able to use the
     * column in the context the new {@link ERMrest.Reference+columns} where
     * a Column _may not_ be a part of a Table.
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Table} table the table object.
     * @param {string} jsonColumn the json column.
     */
    function Column(table, jsonColumn) {

        /**
         * The ordinal number or position of this column relative to other
         * columns within the same scope.
         * TODO: to be implemented
         * @type {number}
         */
        this.position = undefined;

        /**
         * Formats a value corresponding to this column definition.
         * @param {Object} data The 'raw' data value.
         * @returns {string} The formatted value.
         */
        this.formatvalue = function (data, options) {
            if (data === undefined || data === null) {
                return this._getNullValue(options ? options.context : undefined);
            }
            /* TODO format the raw value based on the column definition
             * type, heuristics, annotations, etc.
             */
            var type = this.type.name;
            var utils = module._formatUtils;
            switch(type) {
                case 'timestamptz':
                    data = utils.printTimestamp(data, options);
                    break;
                case 'date':
                    data = utils.printDate(data, options);
                    break;
                case 'float4':
                case 'float8':
                    data = utils.printFloat(data, options);
                    break;
                case 'numeric':
                case 'int2':
                case 'int4':
                case 'int8':
                    data = utils.printInteger(data, options);
                    break;
                case 'boolean':
                    data = utils.printBoolean(data, options);
                    break;
                case 'markdown':
                    // Do nothing as we will format markdown at the end of format
                    break;
                case 'gene_sequence':
                    data = utils.printGeneSeq(data, options);
                    break;
                default: // includes 'text' and 'longtext' cases
                    data = utils.printText(data, options);
                    break;
            }
            return data.toString();
        };

        /**
         * Formats the presentation value corresponding to this column definition.
         * @param {String} data The 'formatted' data value.
         * @param {Object} options The key value pair of possible options with all formatted values in '.values' key
         * @returns {Object} A key value pair containing value and isHTML that detemrines the presenation.
         */
        this.formatPresentation = function(data, options) {
            
            var utils = module._formatUtils, keyValues = options.keyValues, columns = options.columns;

            /*
             * TODO: Add code to handle `pre_format` in the annotation
             */

            var isMarkdownPattern = false, isMarkdownType = false;

            if (this.annotations.contains(module._annotations.COLUMN_DISPLAY) && this.annotations.get(module._annotations.COLUMN_DISPLAY).contains("markdown_pattern")) {
                isMarkdownPattern = true;
            }

            if (this.type.name === 'markdown') {
                isMarkdownType = true;
            }

            if (!isMarkdownPattern && !isMarkdownType) {
                return { isHTML: false, value: data };
            }

            var value = data;

            // If there is any markdown pattern then evaluate it
            if (isMarkdownPattern) {
                // Get markdown pattern from the annotation value
                var template = this.annotations.get(module._annotations.COLUMN_DISPLAY).get("markdown_pattern"); // pattern

                // If template is of type string 
                if (typeof template === 'string') {
                   
                    /* 
                     * Code to do template/string replacement using values and set template as null if any of the
                     * values turn out to be null or undefined
                     */
                    value = module._renderTemplate(template, keyValues, options);

                }
            }

            // If value is null or empty, return value on basis of `show_nulls`
            if (value === null || value === '') {
                return { isHTML: false, value: this._getNullValue(options ? options.context : undefined) };
            }

            /*
             * Call printmarkdown to generate HTML from the final generated string after templating and return it
             */
            value = utils.printMarkdown(value, options);
            return { isHTML: true, value: value };
        };

        /**
         *
         * @type {ERMrest.Table}
         */
        this.table = table;

        /**
         * @type {string}
         */
        this.name = jsonColumn.name;

        /**
         *
         * @type {ERMrest.Type}
         */
        this.type = new Type(jsonColumn.type.typename);

        /**
         * @type {Boolean}
         */
        this.nullok = jsonColumn.nullok;

        /**
         * @type {string}
         */
        this.default = jsonColumn.default;

        /**
         * @desc Documentation for this column
         * @type {string}
         */
        this.comment = jsonColumn.comment;

        /**
         *
         * @type {boolean}
         */
        this.ignore = false;

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonColumn.annotations) {
            var jsonAnnotation = jsonColumn.annotations[uri];
            this.annotations._push(new Annotation("column", uri, jsonAnnotation));

            if (uri === module._annotations.HIDDEN) {
                this.ignore = true;
            } else if (uri === module._annotations.IGNORE &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

        this._nameStyle = {}; // Used in the displayname to store the name styles.
        this._nullValue = {}; // used to avoid recomputation of null value for different contexts.

        /**
         * @type {string}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this, this.table);

        /**
         * Member of Keys
         * @type {ERMrest.Key[]}
         * @desc keys that this column is a member of
         */
        this.memberOfKeys = [];

        /**
         * Member of ForeignKeys
         * @type {ERMrest.ForeignKeyRef[]}
         * @desc foreign key that this column is a member of
         */
        this.memberOfForeignKeys = [];
    }

    Column.prototype = {
        constructor: Column,

        /**
         * returns string representation of Column
         * @retuns {string} string representation of Column
         */
        toString: function() {
            return [this.table.schema.name, this.table.name, this.name].join(":");
        },

        delete: function () {

        },

        _equals: function (column) {
            return (column.table.schema.name === this.table.schema.name &&
            column.table.name === this.table.name &&
            column.name === this.name);
        },

        // find the null value for the column based on context and annotation
        _getNullValue: function (context) {
            if (context in this._nullValue) { // use the cached value
                return this._nullValue[context];
            }

            var value = -1,
                displayAnnot = module._annotations.DISPLAY,
                elements = [this, this.table, this.table.schema];

            // first look at the column, then table, and at last schema for annotation.
            for (var i=0; i < elements.length; i++) {
                if (elements[i].annotations.contains(displayAnnot)) {
                    var annotation = elements[i].annotations.get(displayAnnot);
                    if(annotation.content.show_nulls){
                        value = module._getAnnotationValueByContext(context, annotation.content.show_nulls);
                        if (value !== -1) break; //found the value
                    }
                }
            }

            if (value === false) { //eliminate the field
                value = null;
            } else if (value === true) { //empty field
                value = "";
            } else if (typeof value !== "string") { // default
                if (context === module._contexts.DETAILED) {
                    value = null; // default null value for DETAILED context
                } else {
                    value = ""; //default null value
                }
            }

            this._nullValue[context] = value; // cache the value
            return value;
        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Annotations.
     */
    function Annotations() {
        this._annotations = {};
    }

    Annotations.prototype = {
        constructor: Annotations,

        _push: function (annotation) {
            this._annotations[annotation._uri] = annotation;
        },

        /**
         *
         * @returns {ERMrest.Annotation[]} list of all annotations
         */
        all: function () {
            var array = [];
            for (var key in this._annotations) {
                array.push(this._annotations[key]);
            }
            return array;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of annotations
         */
        length: function () {
            return Object.keys(this._annotations).length;
        },

        /**
         *
         * @returns {Array} array of annotation names
         */
        names: function () {
            return Object.keys(this._annotations);
        },

        /**
         *
         * @param {string} uri uri of annotation
         * @returns {ERMrest.Annotation} annotation
         * @throws {ERMrest.NotFoundError} annotation not found
         * @desc get annotation by URI
         */
        get: function (uri) {
            if (!(uri in this._annotations)) {
                throw new module.NotFoundError("", "Annotation " + uri + " not found.");
            }

            return this._annotations[uri];
        },

        /**
         *
         * @param {string} uri uri of annotation
         * @returns {boolean} whether or not annotation exists
         */
        contains: function (uri) {
            return (uri in this._annotations);
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {string} subject subject of the annotation: schema,table,column,key,foreignkeyref.
     * @param {string} uri uri id of the annotation.
     * @param {string} jsonAnnotation json of annotation.
     * @desc
     * Constructor for Annotation.
     */
    function Annotation(subject, uri, jsonAnnotation) {

        /**
         * One of schema,table,column,key,foreignkeyref
         * @type {string}
         */
        this.subject = subject;
        this._uri = uri;

        /**
         * json content
         * @type {string}
         */
        this.content = jsonAnnotation;
    }

    Annotation.prototype = {
        constructor: Annotation,

        contains: function(name) {
            return (name in this.content);
        },

        get: function(name) {
            return this.content[name];
        },

        _delete: function () {

        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Keys.
     */
    function Keys() {
        this._keys = [];
    }

    Keys.prototype = {
        constructor: Keys,

        _push: function (key) {
            this._keys.push(key);
        },

        /**
         *
         * @returns {Key[]} a list of all Keys
         */
        all: function () {
            return this._keys;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of keys
         */
        length: function () {
            return this._keys.length;
        },

        /**
         *
         * @returns {ERMrest.ColSet[]} array of colsets
         */
        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._keys.length; i++) {
                sets.push(this._keys[i].colset);
            }
            return sets;
        },

        /**
         *
         * @param {ERMrest.ColSet} colset
         * @returns {ERMrest.Key} key of the colset
         * @throws {ERMrest.NotFoundError} Key not found
         * @desc get the key by the column set
         */
        get: function (colset) {
            // find Key with the same colset
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (colset._equals(key.colset)) {
                    return key;
                }
            }

            throw new module.NotFoundError("", "Key not found for colset");
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Table} table the table object.
     * @param {string} jsonKey json key.
     * @desc
     * Constructor for Key.
     */
    function Key(table, jsonKey) {

        /*
         * TODO
         * I added `this.table` below and we should remove `this._table`. But
         * I'm leaving it in for now because I am not sure what I might break.
         */
        this._table = table;

        /**
         * Reference to the table that this Key belongs to.
         * @type {Table}
         */
        this.table = table;

        var uniqueColumns = [];
        for (var i = 0; i < jsonKey.unique_columns.length; i++) {
            // find corresponding column objects
            var col = table.columns.get(jsonKey.unique_columns[i]);
            uniqueColumns.push(col);
            col.memberOfKeys.push(this);
        }

        /**
         * @type {ERMrest.ColSet}
         */
        this.colset = new ColSet(uniqueColumns);

        /**
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonKey.annotations) {
            var jsonAnnotation = jsonKey.annotations[uri];
            this.annotations._push(new Annotation("key", uri, jsonAnnotation));
        }

        /**
         * @desc Documentation for this key
         * @type {string}
         */
        this.comment = jsonKey.comment;
    }

    Key.prototype = {
        constructor: Key,

        /**
         * Indicates if the key is simple (not composite)
         * @type {boolean}
         */
        get simple() {
            return this.colset.length() == 1;
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Array} columns an array of Column objects.
     * @desc
     * Constructor for ColSet, a set of Column objects.
     */
    function ColSet(columns) {

        /**
         *
         * @type {Array}
         */
        this.columns = columns;

    }

    ColSet.prototype = {
        constructor: ColSet,

        /**
         * returns string representation of colset object: (s:t:c1,s:t:c2)
         * @retuns {string} string representation of colset object
         */
        toString: function(){
            return "(" + this.columns.slice().sort(function(a,b){
                return a.name.localeCompare(b.name);
            }).map(function(col){
                return col.toString();
            }).join(",") + ")";
        },

        /**
         *
         * @returns {Number} number of columns
         */
        length: function () {
            return this.columns.length;
        },

        _equals: function (colset) {
            var colsA = colset.columns;
            var colsB = this.columns;

            // for each col in colsetA, find equiv. col in colsetB
            if (colsA.length === colsB.length) {
                for (var a = 0; a < colsA.length; a++) {
                    var colA = colsA[a];

                    // find equiv col in colsetB
                    // if not found, return false
                    var foundMatchingCol = false;
                    for (var b = 0; b < colsB.length; b++) {
                        var colB = colsB[b];
                        if (colA._equals(colB)) {
                            foundMatchingCol = true;
                            break;
                        }
                    }
                    if (!foundMatchingCol) {
                        return false;
                    }
                }
            } else return false;

            return true;
        },

        // the index of columns in the actual table
        _getColumnPositions: function() {
            if(this._columnPositions === undefined) {
                this._columnPositions = this.columns.map(function(col){
                    return col.table.columns.all().indexOf(col);
                }).sort();
            }
            return this._columnPositions;
        }
    };


    /**
     *
     * @memberof ERMrest
     * @param {ERMrest.Column[]} from array of from Columns
     * @param {ERMrest.Column[]} to array of to Columns
     * @constructor
     */
    function Mapping(from, to) { // both array of 'Column' objects
        this._from = from;
        this._to = to;
    }

    Mapping.prototype = {
        constructor: Mapping,

        /**
         * returns string representation of Mapping object
         * @retuns {string} string representation of Mapping object
         */
        toString: function() {
            // changing from and to to Colset, makes this easier.
            return [this._from, this._to].map(function(columns){
                // create toString for from and to
                return columns.slice().sort(function(a, b){
                    return a.name.localeCompare(b.name);
                }).map(function(col){
                    return col.toString();
                }).join(",");
            }).join(">");
        },

        /**
         *
         * @returns {Number} number of mapping columns
         */
        length: function () {
            return this._from.length;
        },

        /**
         *
         * @returns {ERMrest.Column[]} the from columns
         */
        domain: function () {
            return this._from;
        },

        /**
         *
         * @param {ERMrest.Column} fromCol
         * @returns {ERMrest.Column} mapping column
         * @throws {ERMrest.NotFoundError} no mapping column found
         * @desc get the mapping column given the from column
         */
        get: function (fromCol) {
            for (var i = 0; i < this._from.length; i++) {
                if (fromCol._equals(this._from[i])) {
                    return this._to[i];
                }
            }

            throw new module.NotFoundError("", "Mapping not found for column " + fromCol.name);
        }
    };


    /**
     *
     * @memberof ERMrest
     * @constructor
     */
    function ForeignKeys() {
        this._foreignKeys = []; // array of ForeignKeyRef
        this._mappings = []; // array of Mapping
    }

    ForeignKeys.prototype = {
        constructor: ForeignKeys,

        _push: function (foreignKeyRef) {
            this._foreignKeys.push(foreignKeyRef);
            this._mappings.push(foreignKeyRef.mapping);
        },

        /**
         *
         * @returns {ERMrest.ForeignKeyRef[]} an array of all foreign key references
         */
        all: function () {
            return this._foreignKeys;
        },

        /**
         *
         * @returns {ERMrest.ColSet[]} an array of the foreign keys' colsets
         */
        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._foreignKeys.length; i++) {
                sets.push(this._foreignKeys[i].colset);
            }
            return sets;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of foreign keys
         */
        length: function () {
            return this._foreignKeys.length;
        },

        /**
         *
         * @returns {ERMrest.Mapping[]} mappings
         */
        mappings: function () {
            return this._mappings;
        },

        /**
         *
         * @param {ERMrest.ColSet} colset
         * @throws {ERMrest.NotFoundError} foreign key not found
         * @returns {ERMrest.ForeignKeyRef[]} foreign key reference of the colset
         * @desc get the foreign key of the given column set
         */
        get: function (colset) {
            // find ForeignKeyRef with the same colset
            var fks = [];
            for (var i = 0; i < this._foreignKeys.length; i++) {
                var fkr = this._foreignKeys[i];
                if (colset._equals(fkr.colset)) {
                    fks.push(fkr);
                }
            }
            if(fks.length > 0){
                return fks;
            }

            throw new module.NotFoundError("", "Foreign Key not found for the colset.");
        }
    };


    /**
     *
     * @memberof ERMrest
     * @param {ERMrest.Table} table
     * @param {Object} jsonFKR
     * @constructor
     */
    function ForeignKeyRef(table, jsonFKR) {

        var catalog = table.schema.catalog;

        // create ColSet for foreign key columns
        var fkCols = jsonFKR.foreign_key_columns;
        var foreignKeyCols = [];
        for (var i = 0; i < fkCols.length; i++) {
            var fkcol = table.columns.get(fkCols[i].column_name); // "Column" object
            foreignKeyCols.push(fkcol);
            fkcol.memberOfForeignKeys.push(this);
        }

        /**
         * @type {ERMrest.ColSet}
         */
        this.colset = new ColSet(foreignKeyCols);

        // find corresponding Key from referenced columns
        // ** all the tables in the catalog must have been created at this point
        var refCols = jsonFKR.referenced_columns;
        var refTable = catalog.schemas.get(refCols[0].schema_name).tables.get(refCols[0].table_name);
        var referencedCols = [];
        for (var j = 0; j < refCols.length; j++) {
            var col = refTable.columns.get(refCols[j].column_name);
            referencedCols.push(col);
        }

        /**
         * find key from referencedCols
         * use index 0 since all refCols should be of the same schema:table
         * @type {ERMrest.Key}
         */
        this.key = refTable.keys.get(new ColSet(referencedCols));

        /**
         * @type {ERMrest.Mapping}
         */
        this.mapping = new Mapping(foreignKeyCols, referencedCols);

        /**
         * The exact `names` array in foreign key definition
         * TODO: it may need to change based on its usage
         * @type {Array}
         */
        this.constraint_names = Array.isArray(jsonFKR.names) ? jsonFKR.names : [];

        // add constraint names to catalog
        for (var k = 0, constraint; k < this.constraint_names.length; k++) {
            constraint = this.constraint_names[k];
            try {
                if (Array.isArray(constraint) && constraint.length == 2){
                    catalog._addConstraintName(constraint, this);
                }
            } catch (exception){}
        }

        /**
         * @type {string}
         */
        this.from_name = "";

        /**
         * @type {string}
         */
        this.to_name = "";

        /**
         * @type {boolean}
         */
        this.ignore = false;

        /**
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonFKR.annotations) {
            var jsonAnnotation = jsonFKR.annotations[uri];
            this.annotations._push(new Annotation("foreignkeyref", uri, jsonAnnotation));

            if (uri === module._annotations.HIDDEN) {
                this.ignore = true;
            } else if (uri === module._annotations.IGNORE &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }

            // determine the from_name and to_name using the annotation
            if (uri == module._annotations.FOREIGN_KEY && jsonAnnotation) {
                if(jsonAnnotation.from_name){
                    this.from_name = jsonAnnotation.from_name;
                }
                if(jsonAnnotation.to_name){
                    this.to_name = jsonAnnotation.to_name;
                }
            }
        }

        /**
         * @desc Documentation for this foreign key reference
         * @type {string}
         */
        this.comment = jsonFKR.comment;

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        /**
         * returns string representation of ForeignKeyRef object
         * @param {boolean} [reverse] false: returns (keyCol1, keyCol2)=(s:t:FKCol1,FKCol2) true: returns (FKCol1, FKCol2)=(s:t:keyCol1,keyCol2)
         * @retuns {string} string representation of ForeignKeyRef object
         */
        toString: function (reverse){
            var leftString = "", rightString = "";
            var columnsLength = this.colset.columns.length;
            for (var i = 0; i < columnsLength; i++) {
                var fromCol = this.colset.columns[i];
                var toCol = this.mapping.get(fromCol);
                var separator = (i < columnsLength -1 ?",": "");

                leftString += (reverse ? fromCol.name : toCol.name) + separator;
                if (reverse) {
                    rightString += (i === 0 ? toCol.toString() : toCol.name);
                } else {
                    rightString += (i === 0 ? fromCol.toString() : fromCol.name);
                }
                rightString += separator;

            }

            return "(" + leftString + ")=(" + rightString + ")";
        },

        delete: function () {

        },

        /**
         * @param {Number} limit
         * @returns {Promise} promise that returns a rowset of the referenced key's table if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.ConflictError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         */
        getDomainValues: function (limit) {
            if (limit === undefined)
                limit = null;
            return this.key._table.entity.get(null, limit, this.key.colset.columns);
        },

        /**
         * Indicates if the foreign key is simple (not composite)
         * @type {Boolean}
         */
        get simple() {
            return this.key.simple;
        }
    };


    /**
     *
     * @memberof ERMrest
     * @param name
     * @constructor
     */
    function Type(name) {
        //.name
        //.is_array : boolean
        //.base_type

        /**
         *
         */
        this.name = name;
    }

    Type.prototype = {
        constructor: Type,

        is_array: function () {

        }
    };


    return module;
})(ERMrest || {});
