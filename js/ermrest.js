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

var ERMrest = (function () {

    /**
     * @var
     * @private
     * @desc This is the state of the module.
     */
    var module = {
        configure: configure,

        ermrestFactory: {
            getServer: getServer
        }
    };

    /**
     * @private
     * @var _servers
     * @desc
     * Internal collection of ERMrest servers.
     */
    var _servers = {};

    /**
     * @private
     * @var _http
     * @desc
     * The http service used by this module. This is private and not
     * visible to users of the module.
     */
    var _http = null;

    /**
     * @private
     * @var _q
     * @desc
     * Angular $q service
     */
    var _q = null;

    /**
     * @memberof ERMrest
     * @function
     * @param {Object} http Angular $http service object
     * @param {Object} q Angular $q service object
     * @desc
     * This function is used to configure the module.
     */
    function configure(http, q) {
        _http = http;
        _q = q;
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


    /******************************************************/
    /* Server                                             */
    /******************************************************/

    function Server(uri) {

        if (uri === undefined || uri === null)
            throw "URI undefined or null";
        this.uri = uri;
        this.session = new Session();
        this.catalogs = new Catalogs(this);
    }

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled (and a user
     * is logged in), it gets the current session information.
     */
    Server.prototype.getSession = function() {
        return _http.get(this.uri + "/authn/session").then(function(response) {
            return response.data;
        }, function(response) {
            return _q.reject(response);
        });
    };

    /******************************************************/
    /* Session                                            */
    /******************************************************/

    function Session() {
        this._client = null;
        this._attributes = null;
        this._expires = null;
    }

    Session.prototype = {
        constructor: Session,

        login: function () {

        },

        logout: function () {

        },

        extend: function () {

        }
    };

    /******************************************************/
    /* Catalogs                                           */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Server} server the server object.
     * @desc
     * Constructor for the Catalogs.
     */
    function Catalogs(server) {
        this.server = server;
        this._catalogs = {};
    }


    Catalogs.prototype = {
        constructor: Catalogs,

        create: function () {

        },

        length: function () {
            return Object.keys(this._catalogs).length;
        },

        names: function () {
            return Object.keys(this._catalogs);
        },

        get: function (id) {
            // do introspection here and return a promise

            var self = this;
            var defer = _q.defer();

            // load catalog only when requested
            if (id in this._catalogs) {

                defer.resolve(self._catalogs[id]);
                return defer.promise;

            } else {

                var catalog = new Catalog(self.server, id);
                catalog.introspect().then(function (schemas) {
                    self._catalogs[id] = catalog;
                    defer.resolve(catalog);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            }
        }
    };

    /******************************************************/
    /* Catalog                                            */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Server} server the server object.
     * @param {String} id the catalog id.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog(server, id) {

        this.server = server;
        this.id = id;
        this.uri = server.uri + "/catalog/" + id;
        this.schemas = new _Schemas();
    }

    Catalog.prototype = {
        constructor: Catalog,

        delete: function () {

        },

        introspect: function () {
            // load all schemas
            var self = this;
            return _http.get(this.uri + "/schema").then(function (response) {
                var jsonSchemas = response.data;
                for (var s in jsonSchemas.schemas) {
                    self.schemas.push(new Schema(self, jsonSchemas.schemas[s]));
                }

                // all schemas created, TODO load foreign key references
                return self.schemas;
            }, function (response) {
                // this is not a valid catalog
                return _q.reject(response);
            });
        }

    };

    /******************************************************/
    /* Schemas                                            */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Schemas.
     */
    function _Schemas() {
        this._schemas = {};
    }

    _Schemas.prototype = {
        constructor: _Schemas,

        push: function(schema) {
            this._schemas[schema.name] = schema;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._schemas).length;
        },

        names: function () {
            return Object.keys(this._schemas);
        },

        get: function (name) {
            if (!name in this._schemas) {
                // TODO schema not found, throw error
            }

            return this._schemas[name];
        }
    };


    /******************************************************/
    /* Schema                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog the catalog object.
     * @param {String} jsonSchema json of the schema.
     * @desc
     * Constructor for the Catalog.
     */
    function Schema(catalog, jsonSchema) {

        this.catalog = catalog;
        this.name = jsonSchema.schema_name;
        this.uri = catalog.uri + "/schema/" + _fixedEncodeURIComponent(this.name); // TODO needed?

        // build tables
        this.tables = new _Tables();
        for (var key in jsonSchema.tables) {
            var jsonTable = jsonSchema.tables[key];
            this.tables.push(new Table(this, jsonTable));
        }

        // build annotations
        this.annotations = new _Annotations();
        for (var uri in jsonSchema.annotations) {
            var jsonAnnotation = jsonSchema.annotations[uri];
            this.annotations.push(new Annotation("schema", uri, jsonAnnotation));
        }

    }

    Schema.prototype = {
        constructor: Schema,

        delete: function () {

        }

    };

    /******************************************************/
    /* Tables                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Tables.
     */
    function _Tables() {
        this._tables = {};
    }

    _Tables.prototype = {
        constructor: _Tables,

        push: function(table) {
            this._tables[table.name] = table;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._tables).length;
        },

        name: function () {
            return Object.keys(this._tables);
        },

        get: function (name) {
            if (!name in this._tables) {
                // TODO table not found, throw error
            }

            return this._tables[name];
        }

    };

    /******************************************************/
    /* Table                                              */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema the schema object.
     * @param {String} jsonTable the json of the table.
     * @desc
     * Constructor for Table.
     */
    function Table(schema, jsonTable) {

        this.schema = schema;
        this.name = jsonTable.table_name;
        //this.uri = schema.catalog.uri + "/entity/" + _fixedEncodeURIComponent(schema.name) + ":" + _fixedEncodeURIComponent(jsonTable.table_name);

        this.entity = new _Entity(this);

        this.columns = new _Columns();
        for (var i = 0; i < jsonTable.column_definitions.length; i++) {
            var jsonColumn = jsonTable.column_definitions[i];
            this.columns.push(new Column(this, i, jsonColumn));
        }

        this.keys = new _Keys();
        for (var i = 0; i < jsonTable.keys.length; i++) {
            var jsonKey = jsonTable.keys[i];
            this.keys.push(new Key(this, jsonKey));
        }

        this.foreignKeys = [];

        this.annotations = new _Annotations();
        for (var uri in jsonTable.annotations) {
            var jsonAnnotation = jsonTable.annotations[uri];
            this.annotations.push(new Annotation("table", uri, jsonAnnotation));
        }
    }

    Table.prototype = {
        constructor: Table,

        delete: function () {

        },

        buildForeignKeys: function() {
            // TODO this should be built on the second pass so we already have all the keys and columns for all tables
            this.foreignKeys = new _ForeignKeys();
            for (var i = 0; i < jsonTable.foreign_keys.length; i++) {
                var jsonFKs = jsonTable.foreign_keys[i];
                this.foreignKeys[i] = new ForeignKeyRef(this, jsonFKs);
            }
        }

    };


    /******************************************************/
    /* Entity                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Entity.
     */
    function _Entity(table) {
        this._table = table;
    }

    _Entity.prototype = {
        constructor: _Entity,

        // filter: Negation|Conjunction|Disjunction|UnaryPredicate|BinaryPredicate
        get: function(filter) {
            var uri = this._table.schema.catalog.uri + "/entity/" +
                _fixedEncodeURIComponent(this._table.schema.name) + ":" +
                _fixedEncodeURIComponent(this._table.name);

            if (filter !== undefined) {


                // Extend the URI with the filters.js
                var filters = [];

                // multiple filters.js
                if (filter instanceof Conjunction || filter instanceof Disjunction) {
                    filters = filters.concat(filter.filters); // only one filter
                } else if (filter instanceof Negation) {
                    filters.push(filter.filter);
                } else {
                    filters.push(filter);
                }

                // loop through individual filters.js to create filter strings
                var filterStrings = [];
                for (var i = 0; i < filters.length; i++) {
                    var f = filters[i];

                    var filterString = "";
                    var negate = false;
                    if (f instanceof Negation) {
                        f = f.filter;
                        negate = true;
                    }
                    if (f instanceof BinaryPredicate) {
                        filterString = f.column + f.operator + f.rvalue;
                    } else if (f instanceof UnaryPredicate) {
                        filterString = f.column + f.operator;
                    }


                    if (filter instanceof Negation || negate) {

                        filterString = "!(" + filterString + ")";
                    }

                    filterStrings[i] = filterString;
                }

                if (filter instanceof Conjunction) {
                    for (var j = 0; j < filterStrings.length; j++) {
                        if (j === 0)
                            uri = uri + "/" + filterStrings[j];
                        else
                            uri = uri + "&" + filterStrings[j];
                    }
                } else if (filter instanceof Disjunction) {
                    for (var j = 0; j < filterStrings.length; j++) {
                        if (j === 0)
                            uri = uri + "/" + filterStrings[j];
                        else
                            uri = uri + ";" + filterStrings[j];
                    }
                } else { // single filter
                    uri = uri + "/" + filterStrings[0];
                }
            }

            return _http.get(uri).then(function(response) {
                return response.data; // TODO convert to rowset
            }, function(response) {
                return _q.reject(response.data);
            });
        },

        delete: function (filter) {

        },

        put: function (rowset) {

        },

        post: function (rowset, defaults) { // create new entities
            //var uri = this._table.schema.catalog.uri + "/entity/" +
            //    _fixedEncodeURIComponent(this._table.schema.name) + ":" +
            //    _fixedEncodeURIComponent(this._table.name);
            //
            //if (typeof defaults !== 'undefined') {
            //    for (var i = 0; i < defaults.length; i++) {
            //        if (i === 0) {
            //            path = path + "?defaults=" + _fixedEncodeURIComponent(defaults[i]);
            //        } else {
            //            path = path + "," + _fixedEncodeURIComponent(defaults[i]);
            //        }
            //    }
            //}
            //var promises_c = [];
            //for (var i = 0; i < rowset.length; i++) {
            //    promises_c.push(_http.post(uri, rowset[i]));
            //}
            //
            //return _q.all(promises_c).then(function(results) {
            //    return rowset;
            //});
        }
    };


    /******************************************************/
    /* Columns                                            */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Columns.
     */
    function _Columns() {
        this._columns = {};
    }

    _Columns.prototype = {
        constructor: _Columns,

        push: function(column) {
            this._columns[column.name] = column;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._columns).length;
        },

        names: function () {
            return Object.keys(this._columns);
        },

        get: function (name) {
            if (!name in this._columns) {
                // TODO not found, throw error
            }
            return this._columns[name];
        },

        getByPosition: function (pos) {

        }
    };

    /******************************************************/
    /* Column                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table the table object.
     * @param {int} index column position in the table.
     * @param {String} jsonColumn the json column.
     * @desc
     * Constructor for Column.
     */
    function Column(table, index, jsonColumn) {

        this.table = table;
        this.name = jsonColumn.name;
        this.index = index;
        this.type = new Type(jsonColumn.type.typename);
        this.annotations = new _Annotations();
        for (var uri in jsonColumn.annotations) {
            var jsonAnnotation = jsonColumn.annotations[uri];
            this.annotations.push(new Annotation("column", uri, jsonAnnotation));
        }
    }

    Column.prototype = {
        constructor: Column,

        delete: function () {

        }

    };

    /******************************************************/
    /* Annotations                                        */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Annotations.
     */
    function _Annotations() {
        this._annotations = {};
    }

    _Annotations.prototype = {
        constructor: _Annotations,

        push: function(annotation) {
            this._annotations[annotation.uri] = annotation;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._annotations).length;
        },

        names: function () {
            return Object.keys(this._annotations);
        },

        get: function (uri) {
            if (!uri in this._annotations) {
                // TODO table not found, throw error
            }

            return this._annotations[uri];
        }
    };

    /******************************************************/
    /* Annotation                                         */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} subject subject of the annotation: schema|table|column|key|foreignkeyref.
     * @param {String} uri uri id of the annotation.
     * @param {String} jsonAnnotation json of annotation.
     * @desc
     * Constructor for Annotation.
     */
    function Annotation(subject, uri, jsonAnnotation) {

        this.subject = subject;
        this.uri = uri;
        this.content = jsonAnnotation; // TODO keep json content?
    }

    Annotation.prototype = {
        constructor: Annotation,

        delete: function () {

        }
    };

    /******************************************************/
    /* Key                                                */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Keys.
     */
    function _Keys() {
        this._keys = [];
    }

    _Keys.prototype = {
        constructor: _Keys,

        push: function(key) {
            this._keys.push(key);
        },

        create: function () {

        },

        length: function () {
        },

        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._keys.length; i++) {
                sets.push(this._keys[i].colset);
            }
            return sets;
        },

        get: function (colset) {
        }
    };

    /******************************************************/
    /* Key                                                */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table the table object.
     * @param {String} jsonKey json key.
     * @desc
     * Constructor for Key.
     */
    function Key(table, jsonKey) {

        this.table = table;

        var uniqueColumns = [];
        for (var i = 0; i < jsonKey.unique_columns.length; i++) {
            // find corresponding column objects
            uniqueColumns.push(table.columns.get(jsonKey.unique_columns[i]));
        }
        this.colset = new ColSet(uniqueColumns);

        this.annotations = new _Annotations();
        for (var uri in jsonKey.annotations) {
            var jsonAnnotation = jsonKey.annotations[uri];
            this.annotations.push(new Annotation("key", uri, jsonAnnotation));
        }
    }


    /******************************************************/
    /* ColSet                                             */
    /******************************************************/

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

        length: function () {
            return this.columns.length;
        },

        columns: function () {
            return this.columns;
        }

    };

    /******************************************************/
    /* Mapping                                            */
    /* mathematical functional map,                       */
    /* i.e. a mathematical set of (from -> to)            */
    /* column pairings                                    */
    /******************************************************/

    function Mapping() {
        this.mapping = {};

    }

    Mapping.prototype = {
        constructor: Mapping,

        length: function () {

        },

        domain: function () {

        },

        get: function () {

        }
    };


    function _ForeignKeys() {
        this._foreignKeys = []; // array of ForeignKeyRef
    }

    _ForeignKeys.prototype = {
        constructor: _ForeignKeys,

        create: function () {

        },

        length: function () {
            return this._foreignKeys.length;
        },

        mappings: function () {
        },

        get: function (mapping) {
        }
    };


    /******************************************************/
    /* ForeignKeyRef                                      */
    /******************************************************/

    function ForeignKeyRef(table, jsonFKR) {
        //.columns : colset of referencing columns (foreign_key_columns, self table)
        // TODO reference to a key in another table, but table needs to be created already
        // TODO create all the tables and keys first, then process foreign keys.
        //.key : key being referenced (referenced_columns, another table)
        //.mapping
        //.delete()
        //.annotations.create( annotationParams ) -> annotation
        //.annotations.length() -> count
        //.annotations.names() -> sequence of uri
        //.annotation.get( uri ) -> annotation

        var catalog = table.schema.catalog;

        // get Column reference
        var fkeys = jsonFKR.foreign_key_columns;
        var refcols = jsonFKR.referenced_columns;
        this._columns  = []; // self columns
        this._keys = []; // referenced columns
        for (var i = 0; i < fkeys.length; i++) {
            var fkey = fkeys[i];
            var refcol = refcols[i];
            this._columns[i] = catalog.schemas.get(fkey.schema_name).tables.get(fkey.table_name).columns.get(fkey.column_name); // TODO colset
            this._keys[i] = catalogs.schemas.get(refcol.schema_name).tables.get(refcol.table_name).columns.get(refcol.column_name); // TODO colset
        }

        this._mapping = new Mapping(); // TODO

        this.annotations = new _Annotations();
        for (var uri in jsonFKR.annotations) {
            var jsonAnnotation = jsonFKR.annotations[uri];
            this.annotations.push(new Annotation("foreignkeyref", uri, jsonAnnotation));
        }

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        delete: function () {

        }

    };


    /******************************************************/
    /* Type                                               */
    /******************************************************/

    function Type(name) {
        //.name
        //.is_array : boolean
        //.base_type
        this.name = name;
    }

    Type.prototype = {
        constructor: Type,

        is_array: function () {

        }
    };






    /******************************************************/
    /* Utilities                                          */
    /******************************************************/


    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} message error message
     * @desc
     * Creates a undefined error object
     */
    function UndefinedError(message) {
        this.name = "UndefinedError";
        this.message = (message || "");
    }

    UndefinedError.prototype = Error.prototype;

    /**
     * @private
     * @function
     * @param {Object} copyTo the object to copy values to.
     * @param {Object} copy the object to copy value from.
     * @desc
     * This private utility function does a shallow copy between objects.
     */
    function _clone(copyTo, copyFrom) {
        for (var key in copyFrom) {
            // only copy those properties that were set in the object, this
            // will skip properties from the source object's prototype
            if (copyFrom.hasOwnProperty(key)) {
                copyTo[key] = copyFrom[key];
            }
        }
    }

    /**
     * @private
     * @function
     * @param {String} str string to be converted.
     * @desc
     * converts a string to title case
     */
    function _toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    /**
     * @private
     * @function
     * @param {String} str string to be encoded.
     * @desc
     * converts a string to an URI encoded string
     */
    function _fixedEncodeURIComponent(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    }

    return module;
})();



