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
     * @return {Server} Returns a server instance.
     * @desc
     * ERMrest server factory creates or reuses ERMrest.Server instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getServer(uri) {
        var server = _servers[uri];
        if (!server) {
            server = new Server(uri);
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

        if (uri === undefined || uri === null)
            throw "URI undefined or null";

        /**
         *
         * @type {String}
         */
        this.uri = uri;

        /**
         *
         * @type {ERMrest.Session}
         */
        this.session = new Session();
        this.session.get().then(function(data) { // TODO

        }, function(response) {

        });

        /**
         *
         * @type {ERMrest.Catalogs}
         */
        this.catalogs = new Catalogs(this);
    }


    /**
     * @memberof ERMrest
     * @constructor
     */
    function Session() {
        this._client = null;
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
            return module._http.get(this.uri + "/authn/session").then(function(response) {
                return response.data;
            }, function(response) {
                return module._q.reject(response);
            });
        },

        login: function () {

        },

        logout: function () {

        },

        extend: function () {

        }


    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Server} server the server object.
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
                catalog._introspect().then(function (schemas) {
                    self._catalogs[id] = catalog;
                    defer.resolve(catalog);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            }
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Server} server the server object.
     * @param {String} id the catalog id.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog(server, id) {

        /**
         *
         * @type {Server}
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
                for (var s = 0; s < schemaNames.length; s++) {
                    var schema = self.schemas.get(schemaNames[s]);
                    var tables = schema.tables.names();
                    for (var t = 0; t < tables.length; t++) {
                        var table = schema.tables.get(tables[t]);
                        table._buildForeignKeys();
                    }
                }

                return self.schemas;
            }, function (response) {
                // this is not a valid catalog
                return module._q.reject(response);
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
         * @returns {Schema} schema object
         */
        get: function (name) {
            if (!name in this._schemas) {
                // TODO schema not found, throw error
            }

            return this._schemas[name];
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog the catalog object.
     * @param {String} jsonSchema json of the schema.
     * @desc
     * Constructor for the Catalog.
     */
    function Schema(catalog, jsonSchema) {

        /**
         *
         * @type {Catalog}
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
         * @returns {Table} table
         */
        get: function (name) {
            if (!name in this._tables) {
                // TODO table not found, throw error
            }

            return this._tables[name];
        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema the schema object.
     * @param {String} jsonTable the json of the table.
     * @desc
     * Constructor for Table.
     */
    function Table(schema, jsonTable) {

        /**
         *
         * @type {Schema}
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
         * @type {ERMrest.Entity}
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
        for (var i = 0; i < jsonTable.keys.length; i++) {
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
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Entity.
     */
    function Entity(table) {
        this._table = table;
    }

    Entity.prototype = {
        constructor: Entity,

        /**
         *
         * @param {Object} filter Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit number of rows or null
         * @param {Array} columns array of Column to limit returned rows with selected columns only.
         * @returns promise
         * @desc add
         */
        get: function(filter, limit, columns) {

            var interf = (columns === undefined) ? "entity" : "attribute";

            var uri = this._table.schema.catalog._uri + "/" + interf + "/" +
                    module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                    module._fixedEncodeURIComponent(this._table.name);

            if (filter !== undefined && filter !== null) {
                uri = uri + "/" + filter.toUri();
            }

            // selected columns only
            if (columns !== undefined) {
                for (var c = 0; c < columns.length; c++) {
                    var col = columns[c].name;
                    if (c === 0)
                        uri = uri + "/" + col;
                    else
                        uri = uri + "," + col;
                }
            }

            if (limit !== undefined && limit !== null) {
                uri = uri + "?limit=" + limit;
            }


            return module._http.get(uri).then(function(response) {
                return response.data;
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        delete: function (filter) {

        },

        put: function (rowset) {

        },

        /**
         *
         * @param {Object} rowsets Array of jSON representation of rows
         * @param {Array} defaults Array of string column names to be defaults
         * @returns {Promise} promise
         * @desc
         * Create new entities
         */
        post: function (rowsets, defaults) { // create new entities
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

            return module._http.post(uri, rowsets).then(function(response) {
               return response.data;
            }, function(response) {
                return module._q.reject(response);
            });
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
         * @returns {Column} column
         */
        get: function (name) {
            if (!name in this._columns) {
                // TODO not found, throw error
            }
            return this._columns[name];
        },

        getByPosition: function (pos) {

        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table the table object.
     * @param {String} jsonColumn the json column.
     * @desc
     * Constructor for Column.
     */
    function Column(table, jsonColumn) {

        /**
         *
         * @type {Table}
         */
        this.table = table;

        /**
         *
         */
        this.name = jsonColumn.name;

        /**
         *
         * @type {Type}
         */
        this.type = new Type(jsonColumn.type.typename);

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonColumn.annotations) {
            var jsonAnnotation = jsonColumn.annotations[uri];
            this.annotations._push(new Annotation("column", uri, jsonAnnotation));
        }
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
         * @returns {Annotation} annotation
         */
        get: function (uri) {
            if (!uri in this._annotations) {
                // TODO table not found, throw error
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
         * @param {ColSet} colset
         * @returns {Key} key of the colset
         */
        get: function (colset) {
            // find Key with the same colset
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (colset._equals(key.colset)) {
                    return key;
                }
            }
            return null;
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table the table object.
     * @param {String} jsonKey json key.
     * @desc
     * Constructor for Key.
     */
    function Key(table, jsonKey) {

        this._table = table;

        var uniqueColumns = [];
        for (var i = 0; i < jsonKey.unique_columns.length; i++) {
            // find corresponding column objects
            uniqueColumns.push(table.columns.get(jsonKey.unique_columns[i]));
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



    /**
     * @memberof ERMrest
     * @constructor
     * @param {Array} columns an array of Column objects.
     * @desc
     * Constructor for ColSet, a set of Column objects.
     */
    function ColSet(columns) {

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
         * @param {Column} fromCol
         * @returns {Column} mapping column
         */
        get: function (fromCol) {
            for (var i = 0; i < this._from.length; i++) {
                if (fromCol._equals(this._from[i])) {
                    return this._to[i];
                }
            }
            return null; // no mapping found
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
         * @param {ColSet} colset
         * @returns {ForeignKeyRef} foreign key reference of the colset
         */
        get: function (colset) {
            // find ForeignKeyRef with the same colset
            for (var i = 0; i < this._foreignKeys.length; i++) {
                var fkr = this._foreignKeys[i];
                if (colset._equals(fkr.colset)) {
                    return fkr;
                }
            }
            return null;
        }
    };


    /**
     *
     * @param table
     * @param jsonFKR
     * @constructor
     */
    function ForeignKeyRef(table, jsonFKR) {

        var catalog = table.schema.catalog;

        // create ColSet for foreign key columns
        var fkCols = jsonFKR.foreign_key_columns;
        var foreignKeyCols = [];
        for (var i = 0; i < fkCols.length; i++) {
            foreignKeyCols.push(table.columns.get(fkCols[i].column_name)); // "Column" object
        }

        /**
         *
         * @type {ERMrest.ColSet}
         */
        this.colset = new ColSet(foreignKeyCols);

        // find corresponding Key from referenced columns
        // ** all the tables in the catalog must have been created at this point
        var refCols = jsonFKR.referenced_columns;
        var referencedCols = [];
        for (var j = 0; j < refCols.length; j++) {
            var col = catalog.schemas.get(refCols[j].schema_name).tables.get(refCols[j].table_name).columns.get(refCols[j].column_name);
            referencedCols.push(col);
        }

        /**
         *
         * find key from referencedCols
         * use index 0 since all refCols should be of the same schema:table
         * @type {ERMrest.Key}
         */
        this.key = catalog.schemas.get(refCols[0].schema_name).tables.get(refCols[0].table_name).keys.get(new ColSet(referencedCols));

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

        // returns rowset of the referenced key's table
        /**
         *
         * @param {Number} limit
         * @returns {Promise} promise with rowset of the referenced key's table
         */
        getDomainValues: function (limit) {
            if (limit === undefined)
                limit = null;
            return this.key._table.entity.get(null, limit, this.key.colset.columns);
        }

    };


    /**
     *
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

    return module;
})(ERMrest || {});



