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
     * @desc
     * ERMrest server factory creates or reuses ERMrest.Server instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getServer(uri) {
        var server = _servers[uri];
        if (!server) {
            server = new Server(uri);
            return server.session.get().then(function() {

                server.catalogs = new Catalogs(server);
                _servers[uri] = server;
                return server;

            }, function(error) {
                return module._q.reject(error);
            });
        }
    }


    /**
     * @memberof ERMrest
     * @param {String} uri URI of the ERMrest service.
     * @constructor
     */
    function Server(uri) {

        if (uri === undefined || uri === null)
            throw new Error("URI undefined or null");

        /**
         *
         * @type {String}
         */
        this.uri = uri;

        /**
         *
         * @type {ERMrest.Session}
         */
        this.session = new Session(this);

        /**
         *
         * @type {ERMrest.Catalogs}
         */
        this.catalogs = null;
    }

    Server.prototype = {
        constructor: Server,

        getUser: function() {
            return this.session._user;
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     */
    function Session(server) {
        this._server = server;
        this._user = null;
        this._attributes = null;
        this._expires = null;
    }


    Session.prototype = {
        constructor: Session,

        /**
         *
         * @returns {Promise} Returns a promise.
         * @desc
         * An asynchronous method that returns a promise. If fulfilled (and a user
         * is logged in), it gets the current session information.
         */
        get: function() {
            var self = this;
            return module._http.get(this._server.uri + "/authn/session").then(function(response) {
                self._user = response.data.client;
                return response;
            }, function(response) {
                if (response.status === 404)
                    return module._q.reject(new Errors.SessionNotFoundError(response.data));
                else
                    return module._q.reject(responseToError(response));
            });

            // Faking successful authen
            //var defer = module._q.defer();
            //defer.resolve();
            //return defer.promise;
        },

        login: function (referrer) {
            getGoauth(encodeSafeURIComponent(referrer));
        },

        logout: function (location) {
            var url = this._server.uri + "/authn/session"
            ERMREST.DELETE(url, successDeleteSession, errorDeleteSession, location);
        },

        extend: function () {

        }


    };


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
         * @returns {Promise} Promise with the catalog object
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

        _introspect: function () {
            // load all schemas
            var self = this;
            return module._http.get(this._uri + "/schema").then(function (response) {
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
                var error = responseToError(response);
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
         * @returns {Array} Array of all schemas
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
         */
        get: function (name) {
            if (!(name in this._schemas)) {
                throw new Errors.SchemaNotFoundError("Schema " + name + " not found in catalog.");
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
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonSchema.annotations) {
            var jsonAnnotation = jsonSchema.annotations[uri];
            this.annotations._push(new Annotation("schema", uri, jsonAnnotation));
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
         */
        get: function (name) {
            if (!(name in this._tables)) {
                throw new Errors.TableNotFoundError("Table " + name + " not found in schema.");
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
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonTable.annotations) {
            var jsonAnnotation = jsonTable.annotations[uri];
            this.annotations._push(new Annotation("table", uri, jsonAnnotation));
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
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @returns {Promise}
         * @desc get the number of rows
         *
         */
        count: function(filter) {

            var uri = this._getBaseURI("aggregate");

            if (filter !== undefined && filter !== null) {
                uri = uri + "/" + filter.toUri();
            }

            uri = uri + "/row_count:=cnt(*)";

            return module._http.get(uri).then(function(response) {
                return response.data[0].row_count;
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit Optional. Number of rows or null
         * @param {Array} columns Optional. Array of column names or Column objects output
         * @param {Array} sortby Option. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
         * @returns {Promise}
         * @desc
         * get table rows with option filter, row limit and selected columns (in this order).
         *
         * In order to use before & after on a rowset, limit must be speficied,
         * output columns and sortby needs to have columns of a key
         */
        get: function(filter, limit, columns, sortby) {

            var uri = this._toURI(filter, columns, sortby, null, null, limit);

            var self = this;
            return module._http.get(uri).then(function(response) {
                return new RowSet(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit Required. Number of rows
         * @param {Array} columns Optional. Array of column names or Column objects output
         * @param {Array} sortby Option. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
         * @param {Object} row json row data used to getBefore
         *
         * @returns {Promise}
         * @desc
         * get a page of rows before a specific row
         *
         */
        getBefore: function(filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "before", row, limit);

            var self = this;
            return module._http.get(uri).then(function(response) {
                return new RowSet(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit Required. Number of rows
         * @param {Array} columns Optional. Array of column names or Column objects output
         * @param {Array} sortby Option. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
         * @param {Object} row json row data used to getAfter
         *
         * @returns {Promise}
         * @desc
         * get a page of rows after a specific row
         *
         */
        getAfter: function(filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "after", row, limit);

            var self = this;
            return module._http.get(uri).then(function(response) {
                return new RowSet(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} filter Negation, Conjunction, Disjunction, UnaryPredicate, or BinaryPredicate
         * @returns {Promise} Promise
         * @desc
         * Delete rows from table based on the filter
         */
        delete: function (filter) {
            var uri = this._toURI(filter);

            return module._http.delete(uri).then(function(response) {
                return response.data;
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} rows jSON representation of the updated rows
         * @returns {Promise} Promise
         * Update rows in the table
         */
        put: function (rows) {

            var uri = this._toURI();

            return module._http.put(uri, rows).then(function(response) {
                return response.data;
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @param {Object} rows Array of jSON representation of rows
         * @param {Array} defaults Array of string column names to be defaults
         * @returns {Promise} Promise
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

            return module._http.post(uri, rows).then(function(response) {
               return response.data;
            }, function(response) {
                var error = responseToError(response);
                return module._q.reject(error);
            });
        }

    };


    /**
     *
     * @memberof ERMrest
     * @param {ERMrest.Table} table Required.
     * @param {Object} jsonRows Required.
     * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
     * @param {Number} limit Required. Number of rows
     * @param {Array} columns Optional. Array of column names or Column objects output
     * @param {Array} sortby Optional. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
     * @constructor
     */
    function RowSet(table, jsonRows, filter, limit, columns, sortby) {
        this._table = table;
        this.data = jsonRows;
        this._filter = filter;
        this._limit = limit;
        this._columns = columns;
        this._sortby = sortby;
    }

    RowSet.prototype = {
        constructor: RowSet,

        /**
         *
         * @returns {number}
         */
        length: function() {
            return this.data.length;
        },

        /**
         *
         * @returns {Promise}
         * @desc get the rowset of the next page
         *
         */
        after: function() {

            return this._table.entity.getAfter(this._filter, this._limit, this._output, this._sortby, this.data[this.data.length - 1]);
        },

        /**
         *
         * @returns {Promise}
         * @desc get the rowset of the previous page
         *
         */
        before: function() {

            return this._table.entity.getBefore(this._filter, this._limit, this._output, this._sortby, this.data[0]);
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
                throw new Errors.ColumnNotFoundError("Column " + name + " not found in table.");
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
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonColumn.annotations) {
            var jsonAnnotation = jsonColumn.annotations[uri];
            this.annotations._push(new Annotation("column", uri, jsonAnnotation));
        }

        /**
         * @type {String}
         * @desc Preferred display name for user presentation only.
         */
        this.displayname = module._determineDisplayName(this);

        /**
         * Member of Keys
         * @type {Array}
         */
        this.memberOfKeys = [];

        /**
         * Member of ForeignKeys
         * @type {Array}
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
         * @returns {Array} list of all annotations
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
         */
        get: function (uri) {
            if (!(uri in this._annotations)) {
                throw new Errors.AnnotationNotFoundError("Annotation " + uri + " not found.");
            }

            return this._annotations[uri];
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
         * @returns {Array} a list of all Keys
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
         * @returns {Array} array of colsets
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
         */
        get: function (colset) {
            // find Key with the same colset
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (colset._equals(key.colset)) {
                    return key;
                }
            }

            throw new Errors.KeyNotFoundError("Key not found for colset");
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

        this._table = table;

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
         * Indicates if the key is simple (not composite)
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
     * @param {Array} from array of from Columns
     * @param {Array} to array of to Columns
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
         * @returns {Array} the from columns
         */
        domain: function () {
            return this._from;
        },

        /**
         *
         * @param {ERMrest.Column} fromCol
         * @returns {ERMrest.Column} mapping column
         */
        get: function (fromCol) {
            for (var i = 0; i < this._from.length; i++) {
                if (fromCol._equals(this._from[i])) {
                    return this._to[i];
                }
            }

            throw new Errors.MappingNotFoundError("Mapping not found for column " + fromCol.name);
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
         * @returns {Array} an array of all foreign key references
         */
        all: function() {
            return this._foreignKeys;
        },

        /**
         *
         * @returns {Array} an array of the foreign keys' colsets
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
         * @returns {Array} mappings
         */
        mappings: function () {
            return this._mappings;
        },

        //get: function (mapping) { // TODO?
        //},

        /**
         *
         * @param {ERMrest.ColSet} colset
         * @returns {ERMrest.ForeignKeyRef} foreign key reference of the colset
         */
        get: function (colset) {
            // find ForeignKeyRef with the same colset
            for (var i = 0; i < this._foreignKeys.length; i++) {
                var fkr = this._foreignKeys[i];
                if (colset._equals(fkr.colset)) {
                    return fkr;
                }
            }

            throw new Errors.ForeignKeyNotFoundError("Foreign Key not found for the colset.");
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
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonFKR.annotations) {
            var jsonAnnotation = jsonFKR.annotations[uri];
            this.annotations._push(new Annotation("foreignkeyref", uri, jsonAnnotation));
        }

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        delete: function () {

        },

        // returns rows of the referenced key's table
        /**
         *
         * @param {Number} limit
         * @returns {Promise} promise with rows of the referenced key's table
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

    /**
     * @constructor
     * @param {String} message error message
     * @desc
     * Creates a undefined error object
     */
    function UndefinedError(message) {
        /**
         *
         * @type {string} error name
         */
        this.name = "UndefinedError";

        /**
         *
         * @type {String} error message
         */
        this.message = (message || "");
    }

    UndefinedError.prototype = Error.prototype;


    function responseToError(response) {
        var status = response.status;
        switch(status) {
            case 0:
                return new Errors.TimedOutError(response.statusText, response.data);
            case 400:
                return new Errors.BadRequestError(response.statusText, response.data);
            case 401:
                return new Errors.UnauthorizedError(response.statusText, response.data);
            case 403:
                return new Errors.ForbiddenError(response.statusText, response.data);
            case 404:
                return new Errors.NotFoundError(response.statusText, response.data);
            case 409:
                return new Errors.ConflictError(response.statusText, response.data);
            case 500:
                return new Errors.InternalServerError(response.statusText, response.data);
            default:
                return new Error(response.statusText, response.data);
        }
    }

    return module;
})(ERMrest || {});
