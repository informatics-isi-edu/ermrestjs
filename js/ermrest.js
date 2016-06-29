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
 * @namespace ERMrest
 * @desc
 * The ERMrest module is a JavaScript client library for the ERMrest
 * service.
 *
 * IMPORTANT NOTE: This module is a work in progress.
 * It is likely to change several times before we have an interface we wish
 * to use for ERMrest JavaScript agents.
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
     * @param {String} uri URI of the ERMrest service.
     * @return {ERMrest.Server} Returns a server instance.
     * @throws {ERMrest.Errors.InvalidInputError} URI is missing
     * @desc
     * ERMrest server factory creates or reuses ERMrest.Server instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getServer(uri) {

        if (uri === undefined || uri === null)
            throw new module.InvalidInputError("URI undefined or null");

        var server = _servers[uri];
        if (!server) {
            server = new Server(uri);

            server.catalogs = new Catalogs(server);
            _servers[uri] = server;
        }

        return server;
    }


    /**
     * @memberof ERMrest
     * @param {String} uri URI of the ERMrest service.
     * @constructor
     */
    function Server(uri) {

        /**
         *
         * @type {String}
         */
        this.uri = uri;


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
         * @param {String} id Catalog ID.
         *
         *
         * @return {Promise} a promise that returns the {@link ERMrest.Catalog} if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.NotFoundError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
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
     * @param {String} id the catalog id.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog(server, id) {

        /**
         *
         * @type {ERMrest.Server}
         */
        this.server = server;

        /**
         *
         * @type {String}
         */
        this.id = id;

        this._uri = server.uri + "/catalog/" + id;

        /**
         *
         * @type {ERMrest.Schemas}
         */
        this.schemas = new Schemas();
    }

    Catalog.prototype = {
        constructor: Catalog,

        delete: function () {

        },

        /**
         *
         * @private
         * @return {Promise} a promise that returns json object of catalog schema if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.NotFoundError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         */
        _introspect: function () {
            // load all schemas
            var self = this;
            return module._makeRequest(module._http, module._q, "get", this._uri + "/schema", {}).then(function (response) {
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

        _push: function(schema) {
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
        all: function() {
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
         * @param {String} name schema name
         * @returns {ERMrest.Schema} schema object
         * @throws {ERMrest.Errors.NotFoundError} schema not found
         * @desc get schema by schema name
         */
        get: function (name) {
            if (!(name in this._schemas)) {
                throw new module.NotFoundError("", "Schema " + name + " not found in catalog.");
            }

            return this._schemas[name];
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Catalog} catalog the catalog object.
     * @param {String} jsonSchema json of the schema.
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
         * @type {ERMrest.Tables}
         */
        this.tables = new Tables();
        for (var key in jsonSchema.tables) {
            var jsonTable = jsonSchema.tables[key];
            this.tables._push(new Table(this, jsonTable));
        }

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

            if (uri === "tag:misd.isi.edu,2015:hidden") {
                this.ignore = true;
            } else if (uri === "tag:isrd.isi.edu,2016:ignore" &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

        /**
         * @type {String}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this);

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

        _push: function(table) {
            this._tables[table.name] = table;
        },

        /**
         *
         * @returns {Array} array of tables
         */
        all: function() {
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
         * @param {String} name name of table
         * @returns {ERMrest.Table} table
         * @throws {ERMrest.Errors.NotFoundError} table not found
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
     * @param {String} jsonTable the json of the table.
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
        this.entity = new Entity(this);

        /**
         *
         * @type {ERMrest.Columns}
         */
        this.columns = new Columns();
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

            if (uri === "tag:misd.isi.edu,2015:hidden") {
                this.ignore = true;
            } else if (uri === "tag:isrd.isi.edu,2016:ignore" &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

        /**
         * @type {String}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this);
    }

    Table.prototype = {
        constructor: Table,

        delete: function () {

        },

        _buildForeignKeys: function() {
            // this should be built on the second pass after introspection
            // so we already have all the keys and columns for all tables
            this.foreignKeys = new ForeignKeys();
            for (var i = 0; i < this._jsonTable.foreign_keys.length; i++) {
                var jsonFKs = this._jsonTable.foreign_keys[i];
                this.foreignKeys._push(new ForeignKeyRef(this, jsonFKs));
            }
        }

    };


    /**
     * @memberof ERMrest.Table
     * @constructor
     * @param {ERMrest.Table} table
     * @desc
     * Constructor for Entity. This is a container in Table
     */
    function Entity(table) {
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
        _getBaseURI: function(api) {
            return this._table.schema.catalog._uri + "/" + api + "/" +
                module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} [filter]
         * @param {ERMrest.Column[] | String[]} [output] selected columns
         * @param {ERMrest.Column[] | String[]} [sortby] columns to sort in order, required is paging is specified
         * @param {"before" | "after"} [paging]
         * @param {Object} [row] json row object used for paging only
         * @param {Number} [limit] limit number of rows to return
         * @returns {string}
         * @private
         * @desc get ermrest URI
         */
        _toURI: function(filter, output, sortby, paging, row, limit) {

            var api = (output === null || output === undefined) ? "entity" : "attribute";

            var uri = this._getBaseURI(api);

            if (filter !== undefined && filter !== null) {
                uri = uri + "/" + filter.toUri();
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
                    if (sortby[d] instanceof Column) { // if Column object
                        sortCol = sortby[d].name;
                    }
                    var order = (sortby[d].order === 'desc' ? "::desc::" : "");
                    if (d === 0)
                        uri = uri + "@sort(" + module._fixedEncodeURIComponent(sortCol) + order;
                    else
                        uri = uri + "," + module._fixedEncodeURIComponent(sortCol) + order;
                }
                uri = uri + ")";

                // paging requires sortby
                if (paging  !== undefined && paging !== null && row !== undefined && row !== null) {
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
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         * @desc get the number of rows
         *
         */
        count: function(filter) {

            var uri = this._getBaseURI("aggregate");

            if (filter !== undefined && filter !== null) {
                uri = uri + "/" + filter.toUri();
            }

            uri = uri + "/row_count:=cnt(*)";

            return module._makeRequest(module._http, module._q, "get", uri, {}).then(function (response) {
                return response.data[0].row_count;
            }, function(response) {
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
         * @returns {Promise} promise returning {@link ERMrest.Rows} if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     ERMrest.Errors.Conflict, ERMrest.Errors.ForbiddenError or ERMrest.Errors.Unauthorized if rejected
         * @desc
         * get table rows with option filter, row limit and selected columns (in this order).
         * In order to use before & after on a Rows, limit must be speficied,
         * output columns and sortby needs to have columns of a key
         */
        get: function(filter, limit, columns, sortby) {

            var uri = this._toURI(filter, columns, sortby, null, null, limit);

            var self = this;
            return module._makeRequest(module._http, module._q, "get", uri, {}).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
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
         * @returns {Promise} promise returning {@link ERMrest.Rows} if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     ERMrest.Errors.Conflict, ERMrest.Errors.ForbiddenError or ERMrest.Errors.Unauthorized if rejected
         * @desc
         * get a page of rows before a specific row
         * In order to use before & after on a Rows, limit must be speficied,
         * output columns and sortby needs to have columns of a key
         *
         */
        getBefore: function(filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "before", row, limit);

            var self = this;
            return module._makeRequest(module._http, module._q, "get", uri, {}).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
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
         * @returns {Promise} promise returning {@link ERMrest.Rows} if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     ERMrest.Errors.Conflict, ERMrest.Errors.ForbiddenError or ERMrest.Errors.Unauthorized if rejected
         * @desc
         * get a page of rows after a specific row
         *
         */
        getAfter: function(filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "after", row, limit);

            var self = this;
            return module._makeRequest(module._http, module._q, "get", uri, {}).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} filter
         * @returns {Promise} Promise that returns the json row data deleted if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         * @desc
         * Delete rows from table based on the filter
         */
        delete: function (filter) {
            var uri = this._toURI(filter);

            return module._makeRequest(module._http, module._q, "delete", uri, {}).then(function (response) {
                return response.data;
            }, function(response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} rows jSON representation of the updated rows
         * @returns {Promise} Promise that returns the rows updated if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         * Update rows in the table
         */
        put: function (rows) {

            var uri = this._toURI();

            return module._makeRequest(module._http, module._q, "put", uri, rows).then(function (response) {
                return response.data;
            }, function(response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} rows Array of jSON representation of rows
         * @param {String[]} defaults Array of string column names to be defaults
         * @returns {Promise} Promise that returns the rows created if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.BadRequestError}, {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
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

            return module._makeRequest(module._http, module._q, "post", uri, rows).then(function (response) {
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
        length: function() {
            return this.data.length;
        },

        /**
         *
         * @returns {Row}
         */
        get: function(index) {
            return new Row(this.data[index]);
        },

        /**
         * @returns {Promise} promise that returns next {@link ERMrest.Rows} if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         * @desc get the {@link ERMrest.Rows} of the next page
         *
         */
        after: function() {

            return this._table.entity.getAfter(this._filter, this._limit, this._output, this._sortby, this.data[this.data.length - 1]);
        },

        /**
         *
         * @returns {Promise} promise that returns a {@link ERMrest.Rows} if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         * @desc get the {@link ERMrest.Rows} of the previous page
         *
         */
        before: function() {

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
        names: function() {
            return Object.keys(this.data);
        },

        /**
         *
         * @param {String} name name of column
         * @returns {Object} column value
         */
        get: function(name) {
            if (!(name in this.data)) {
                throw new module.NotFoundError("", "Column " + name + " not found in row.");
            }
            return this.data[name];
        }
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Columns.
     */
    function Columns() {
        this._columns = {};
    }

    Columns.prototype = {
        constructor: Columns,

        _push: function(column) {
            this._columns[column.name] = column;
        },

        /**
         *
         * @returns {Array} array of all columns
         */
        all: function() {
            var array = [];
            for (var key in this._columns) {
                array.push(this._columns[key]);
            }
            return array;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of columns
         */
        length: function () {
            return Object.keys(this._columns).length;
        },

        /**
         *
         * @returns {Array} names of columns
         */
        names: function () {
            return Object.keys(this._columns);
        },

        /**
         *
         * @param {String} name name of column
         * @returns {ERMrest.Column} column
         */
        get: function (name) {
            if (!(name in this._columns)) {
                throw new module.NotFoundError("", "Column " + name + " not found in table.");
            }
            return this._columns[name];
        },

        getByPosition: function (pos) {

        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Table} table the table object.
     * @param {String} jsonColumn the json column.
     * @desc
     * Constructor for Column.
     */
    function Column(table, jsonColumn) {

        /**
         *
         * @type {ERMrest.Table}
         */
        this.table = table;

        /**
         * @type {String}
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
         * @type {String}
         */
        this.default = jsonColumn.default;

        /**
         * @type {String}
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

            if (uri === "tag:misd.isi.edu,2015:hidden") {
                this.ignore = true;
            } else if (uri === "tag:isrd.isi.edu,2016:ignore" &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

        /**
         * @type {String}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this);

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

        delete: function () {

        },

        _equals: function(column) {
            return (column.table.schema.name === this.table.schema.name &&
                column.table.name === this.table.name &&
                column.name === this.name);
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

        _push: function(annotation) {
            this._annotations[annotation._uri] = annotation;
        },

        /**
         *
         * @returns {ERMrest.Annotation[]} list of all annotations
         */
        all: function() {
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
         * @param {String} uri uri of annotation
         * @returns {ERMrest.Annotation} annotation
         * @throws {ERMrest.Errors.NotFoundError} annotation not found
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
         * @param {String} uri uri of annotation
         * @returns {boolean} whether or not annotation exists
         */
         contains: function (uri) {
             return (uri in this._annotations);
         }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} subject subject of the annotation: schema,table,column,key,foreignkeyref.
     * @param {String} uri uri id of the annotation.
     * @param {String} jsonAnnotation json of annotation.
     * @desc
     * Constructor for Annotation.
     */
    function Annotation(subject, uri, jsonAnnotation) {

        /**
         *
         * @type {String}  schema,table,column,key,foreignkeyref
         */
        this.subject = subject;
        this._uri = uri;

        /**
         *
         * @type {String} json content
         */
        this.content = jsonAnnotation;
    }

    Annotation.prototype = {
        constructor: Annotation,

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

        _push: function(key) {
            this._keys.push(key);
        },

        /**
         *
         * @returns {Key[]} a list of all Keys
         */
        all: function() {
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
         * @throws {ERMrest.Errors.NotFoundError} Key not found
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
     * @param {String} jsonKey json key.
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
         * @type {Table}
         * @desc Reference to the table that this Key belongs to.
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
         *
         * @type {ERMrest.ColSet}
         */
        this.colset = new ColSet(uniqueColumns);

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonKey.annotations) {
            var jsonAnnotation = jsonKey.annotations[uri];
            this.annotations._push(new Annotation("key", uri, jsonAnnotation));
        }
    }

    Key.prototype = {
        constructor: Key,

        /**
         * @desc Indicates if the key is simple (not composite)
         * @type {Boolean}
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
                        if (colA._equals(colB)){
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
         * @throws {ERMrest.Errors.NotFoundError} no mapping column found
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

        _push: function(foreignKeyRef) {
            this._foreignKeys.push(foreignKeyRef);
            this._mappings.push(foreignKeyRef.mapping);
        },

        /**
         *
         * @returns {ERMrest.ForeignKeyRef[]} an array of all foreign key references
         */
        all: function() {
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
         * @throws {ERMrest.Errors.NotFoundError} foreign key not found
         * @returns {ERMrest.ForeignKeyRef} foreign key reference of the colset
         * @desc get the foreign key of the given column set
         */
        get: function (colset) {
            // find ForeignKeyRef with the same colset
            for (var i = 0; i < this._foreignKeys.length; i++) {
                var fkr = this._foreignKeys[i];
                if (colset._equals(fkr.colset)) {
                    return fkr;
                }
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
         *
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
         *
         * find key from referencedCols
         * use index 0 since all refCols should be of the same schema:table
         * @type {ERMrest.Key}
         */
        this.key = refTable.keys.get(new ColSet(referencedCols));

        /**
         *
         * @type {ERMrest.Mapping}
         */
        this.mapping = new Mapping(foreignKeyCols, referencedCols);

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
        for (var uri in jsonFKR.annotations) {
            var jsonAnnotation = jsonFKR.annotations[uri];
            this.annotations._push(new Annotation("foreignkeyref", uri, jsonAnnotation));

            if (uri === "tag:misd.isi.edu,2015:hidden") {
                this.ignore = true;
            } else if (uri === "tag:isrd.isi.edu,2016:ignore" &&
                (jsonAnnotation === null || jsonAnnotation === [])) {
                this.ignore = true;
            }
        }

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        delete: function () {

        },

        /**
         *
         * @param {Number} limit
         * @returns {Promise} promise that returns a {@link ERMrest.Rows} of the referenced key's table if resolved or
         *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
         *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
         */
        getDomainValues: function (limit) {
            if (limit === undefined)
                limit = null;
            return this.key._table.entity.get(null, limit, this.key.colset.columns);
        },

        /**
         * @desc Indicates if the foreign key is simple (not composite)
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
