
    module.configure = configure;

    module.ermrestFactory = {
        getServer: getServer
    };


    var _servers = {};

    /**
     * Angular $http service object
     * @type {Object}
     * @private
     * NOTE: This should not be used. This is the base _http module without our wrapper from http.js
     * When making requests using http, use server._http
     */
    module._http = null;

    /**
     * Angular $q service object
     * @type {Object}
     * @private
     */
    module._q = null;

    /**
     * function that converts app tag to app URL
     * @callback appLinkFn
     * @type {appLinkFn}
     * @private
     */
    module._appLinkFn = null;

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
     * @param {Object} [contextHeaderParams={cid:'null'}] An optional server header parameters for context logging
     * appended to the end of any request to the server.
     * @return {ERMrest.Server} Returns a server instance.
     * @throws {ERMrest.InvalidInputError} URI is missing
     * @desc
     * ERMrest server factory creates or reuses ERMrest.Server instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getServer(uri, contextHeaderParams) {

        if (uri === undefined || uri === null)
            throw new module.InvalidInputError("URI undefined or null");

        if (typeof contextHeaderParams === 'undefined' || contextHeaderParams === null) {
            // Set default cid to a truthy string because a true null will not
            // appear as a query parameter but we want to track cid even when cid
            // isn't provided
            contextHeaderParams = {'cid': 'null'};
        }

        var server = _servers[uri];
        if (!server) {
            server = new Server(uri, contextHeaderParams);

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
    function Server(uri, contextHeaderParams) {

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
        this._http.contextHeaderParams = contextHeaderParams || {};
        this._http.contextHeaderParams.cid = this._http.contextHeaderParams.cid || null;

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
                    return catalog._meta();
                }).then(function getMeta() {
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

        /*
         * Value that holds the meta resource object returned from the server for the catalog
         * @type null
         */
        this.meta = null;
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

                self.rights = jsonSchemas.rights;

                for (var s in jsonSchemas.schemas) {
                    self.schemas._push(new Schema(self, jsonSchemas.schemas[s]));
                }

                // all schemas created
                // build foreign keys for each table in each schema
                var schemaNames = self.schemas.names();
                var schema, tables, t, table;
                for (s = 0; s < schemaNames.length; s++) {
                    schema = self.schemas.get(schemaNames[s]);
                    tables = schema.tables.names();
                    for (t = 0; t < tables.length; t++) {
                        table = schema.tables.get(tables[t]);
                        table._buildForeignKeys();
                    }
                }

                // find alternative tables
                // requires foreign keys built
                for (s = 0; s < schemaNames.length; s++) {
                    schema = self.schemas.get(schemaNames[s]);
                    tables = schema.tables.names();
                    for (t = 0; t < tables.length; t++) {
                        table = schema.tables.get(tables[t]);
                        table._findAlternatives();
                    }
                }

                return self.schemas;
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         *
         * @private
         * @return {Promise} a promise that returns the meta object if resolved or
         *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
         *     {@link ERMrest.NotFoundError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
         */
        _meta: function () {
            // load all meta data
            var self = this;
            return this.server._http.get(this._uri + "/meta").then(function (response) {
                self.meta = response.data;

                return self.meta;
            }, function (response) {
                var error = module._responseToError(response);
                return module._q.reject(error);
            });
        },

        /**
         * @desc returns the constraint object for the pair.
         * @param {Array.<string>} pair constraint name array. Its length must be two.
         * @param {?string} subject the retuned must have the same object, otherwise return null.
         * @throws {ERMrest.NotFoundError} constraint not found
         * @returns {Object|null} the constraint object. Null means the constraint name is not valid.
         */
        constraintByNamePair: function (pair, subject) {
            return module._getConstraintObject(this.id, pair[0], pair[1], subject);
        },

        // used in ForeignKeyRef to add the defined constraintNames.
        // subject can be one of module._constraintTypes
        _addConstraintName: function (pair, obj, subject) {
            module._addConstraintName(this.id, pair[0], pair[1], obj, subject);
        },

        /**
         * Given tableName, and schemaName find the table
         * @param  {string} tableName  name of the table
         * @param  {string} schemaName name of the schema. Can be undefined.
         * @return {ERMrest.Table}
         */
        getTable: function (tableName, schemaName) {
            var schema;

            if (!schemaName) {
                var schemas = this.schemas.all();
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
            } else {
                schema = this.schemas.get(schemaName);
            }

            return schema.tables.get(tableName);
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
            if (!this._all) {
                this._all = [];
                for (var key in this._schemas) {
                    this._all.push(this._schemas[key]);
                }
            }
            return this._all;
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

        /**
         *
         * @type {Object}
         */
        this.rights = jsonSchema.rights;

        /**
         * whether schema is generated.
         * This should be done before initializing tables because tables require this field.
         * @type {boolean}
         * @private
         */
        this._isGenerated = this.annotations.contains(module._annotations.GENERATED);

        /**
         * whether schema is immutable.
         * This should be done before initializing tables because tables require this field.
         * @type {boolean}
         * @private
         */
        this._isImmutable = this.annotations.contains(module._annotations.IMMUTABLE);

        this._nameStyle = {}; // Used in the displayname to store the name styles.

        /**
         * @type {object}
         * @desc
         * Preferred display name for user presentation only.
         * this.displayname.isHTML will return true/false
         * this.displayname.value has the value
         */
        this.displayname = module._determineDisplayName(this, true);

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

        if (this.annotations.contains(module._annotations.APP_LINKS)) {
            this._appLinksAnnotation = this.annotations.get(module._annotations.APP_LINKS).content;
        }

    }

    Schema.prototype = {
        constructor: Schema,

        delete: function () {

        },

        /**
         * whether schema is non-deletable
         * @type {boolean}
         * @private
         */
        get _isNonDeletable() {
            return (this.annotations.contains(module._annotations.NON_DELETABLE));
        },

        _getAppLink: function (context) {

            var app = -1;
            if (this._appLinksAnnotation) {
                if (!context)
                    app = module._getRecursiveAnnotationValue(module._contexts.DEFAULT, this._appLinksAnnotation);
                else
                    app = module._getRecursiveAnnotationValue(context, this._appLinksAnnotation);
            }

            // no app link found
            if (app === -1)
                return null;
            else
                return app;
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
            if (!this._all) {
                this._all = [];
                for (var key in this._tables) {
                    this._all.push(this._tables[key]);
                }
            }

            return this._all;
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


        this._nullValue = {}; // used to avoid recomputation of null value for different contexts.

        this._uri = schema.catalog._uri + "/entity/" + module._fixedEncodeURIComponent(schema.name) + ":" + module._fixedEncodeURIComponent(jsonTable.table_name);

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
         * this defaults to itself on the first pass of introspection
         * then might be changed on the second pass if this is an alternative table
         * @type {ERMrest.Table}
         */
        this._baseTable = this;

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

        /**
         * whether table is generated
         * inherits from schema
         * @type {boolean}
         * @private
         */
        this._isGenerated = (this.annotations.contains(module._annotations.GENERATED) || this.schema._isGenerated);

        /**
         * whether table is immutable
         * inherits from schema
         * @type {boolean}
         * @private
         */
        this._isImmutable = (this.annotations.contains(module._annotations.IMMUTABLE) || this.schema._isImmutable);

        this._nameStyle = {}; // Used in the displayname to store the name styles.
        this._rowDisplayKeys = {}; // Used for display key

        /**
         * @type {object}
         * @desc
         * Preferred display name for user presentation only.
         * this.displayname.isHTML will return true/false
         * this.displayname.value has the value
         */
        this.displayname = module._determineDisplayName(this, true, this.schema);

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
         * @type {Object}
         */
        this.rights = jsonTable.rights;

        /**
         *
         * @type {ERMrest.ForeignKeys}
         */
        this.foreignKeys = new ForeignKeys(this);

        /**
         * All the FKRs to this table.
         * @type {ERMrest.ForeignKeys}
         */
        this.referredBy = new InboundForeignKeys(this);

        /**
         * @desc Documentation for this table
         * @type {string}
         */
        this.comment = jsonTable.comment;

        /**
         * @desc The type of this table
         * @type {string}
         */
        this.kind = jsonTable.kind;

        if (this.annotations.contains(module._annotations.APP_LINKS)) {
            this._appLinksAnnotation = this.annotations.get(module._annotations.APP_LINKS).content;
        }

    }

    Table.prototype = {
        constructor: Table,

        delete: function () {

        },

        /**
         * whether table is non-deletable
         * @type {boolean}
         * @private
         */
        get _isNonDeletable() {
            return (this.annotations.contains(module._annotations.NON_DELETABLE) || this.schema._isNonDeletable);
        },

        /**
         * The columns that create the shortest key
         *
         * @type{Column[]}
         */
        get shortestKey() {
            if (!this._shortestKey) {

                if (this.keys.length() !== 0) {
                    // find the keys with not-null columns
                    var keys = this.keys.all().filter(function (key) {
                        return key._notNull;
                    });

                    // return error if there's no not-null key
                    if (keys.length === 0) {
                        keys = this.keys.all();
                    }

                    var ridKey = keys.filter(function (key) {
                        return key.colset.columns.length == 1 && key.colset.columns[0].name.toUpperCase() == "RID";
                    })[0];

                    if (ridKey) {
                        this._shortestKey = ridKey.colset.columns;
                    } else {
                        // returns 1 if all the columns are serial/int, 0 otherwise
                        var allSerialInt = function (key) {
                            return (key.colset.columns.map(function (column) {
                                return column.type.name;
                            }).every(function (current, index, array) {
                                return (current.toUpperCase().startsWith("INT") || current.toUpperCase().startsWith("SERIAL"));
                            }) ? 1 : 0);
                        };

                        // pick the first key that is shorter or is all serial/integer.
                        this._shortestKey = keys.sort(function (a, b) {
                            var compare;

                            // choose the shorter
                            compare = a.colset.length() - b.colset.length();
                            if (compare !== 0) {
                                return compare;
                            }

                            // if key length equal, choose the one that all of its keys are serial or int
                            compare = allSerialInt(b) - allSerialInt(a);
                            if (compare !== 0) {
                                return compare;
                            }

                            // the one that has lower column position
                            return a.colset._getColumnPositions() > b.colset._getColumnPositions();
                        })[0].colset.columns;
                    }

                } else {
                    this._shortestKey = this.columns.all();
                }
            }
            return this._shortestKey;
        },

        /**
         * The columns that create the shortest key that can be used for display purposes.
         *
         * @type {ERMrest.Column[]}
         */
        get displayKey () {
            if (this._displayKey === undefined) {
                if (this.keys.length() !== 0) {
                    var countTextColumns = function(key) {
                        for (var i = 0, res = 0; i < key.colset.columns.length; i++) {
                            if (key.colset.columns[i].type.name == "text") res++;
                        }
                        return res;
                    };

                    this._displayKey = this.keys.all().sort(function (keyA, keyB) {

                        // shorter
                        if (keyA.colset.columns.length != keyB.colset.columns.length) {
                            return keyA.colset.columns.length > keyB.colset.columns.length;
                        }

                        // has more text
                        var aTextCount = countTextColumns(keyA);
                        var bTextCount = countTextColumns(keyB);
                        if (aTextCount != bTextCount) {
                            return aTextCount < bTextCount;
                        }

                        // the one that has lower column position
                        return keyA.colset._getColumnPositions() > keyB.colset._getColumnPositions();
                    })[0].colset.columns;
                } else {
                    this._displayKey = this.columns.all();
                }
            }
            return this._displayKey;
        },

        /**
         * @param {string} context used to figure out if the column has markdown_pattern annoation or not.
         * @returns{Column[]|undefined} list of columns. If couldn't find a suitable columns will return undefined.
         * @desc
         * This key will be used for referring to a row of data. Therefore it shouldn't be foreignkey and markdown type.
         * It's the same as displaykey but with extra restrictions. It might return undefined.
         */
        _getRowDisplayKey: function (context) {
            if (!(context in this._rowDisplayKeys)) {
                var displayKey;
                if (this.keys.length() !== 0) {
                    var candidateKeys = [], key, fkeys, isPartOfSimpleFk, i, j;
                    for (i = 0; i < this.keys.length(); i++) {
                        key = this.keys.all()[i];
                        isPartOfSimpleFk = false;

                        // shouldn't select simple keys that their constituent column is part of any simple foreign key.
                        if (key.simple && key.colset.columns[0].memberOfForeignKeys.length > 0) {
                            fkeys = key.colset.columns[0].memberOfForeignKeys;
                            for (j = 0; j < fkeys.length; j++) {
                                if (fkeys[j].simple) {
                                    isPartOfSimpleFk = true;
                                    break;
                                }
                            }
                        }

                        // select keys that none of their columns isHTMl and nullok.
                        if (!isPartOfSimpleFk && key._isWellFormed(context)) {
                            candidateKeys.push(key);
                        }
                    }

                    // sort the keys and pick the first one.
                    if (candidateKeys.length !== 0) {
                        var countTextColumns = function(key) {
                            for (var i = 0, res = 0; i < key.colset.columns.length; i++) {
                                if (key.colset.columns[i].type.name == "text") res++;
                            }
                            return res;
                        };

                        displayKey = candidateKeys.sort(function (keyA, keyB) {

                            // shorter
                            if (keyA.colset.columns.length != keyB.colset.columns.length) {
                                return keyA.colset.columns.length > keyB.colset.columns.length;
                            }

                            // has more text
                            var aTextCount = countTextColumns(keyA);
                            var bTextCount = countTextColumns(keyB);
                            if (aTextCount != bTextCount) {
                                return aTextCount < bTextCount;
                            }

                            // the one that has lower column position
                            return keyA.colset._getColumnPositions() > keyB.colset._getColumnPositions();
                        })[0];
                    }
                }
                this._rowDisplayKeys[context] = displayKey; // might be undefined
            }
            return this._rowDisplayKeys[context];
        },

        get reference() {
            if (!this._reference) {
                this._reference = module._createReference(module.parse(this._uri), this.schema.catalog);
            }

            return this._reference;
        },

        // build foreignKeys of this table and referredBy of corresponding tables.
        _buildForeignKeys: function () {
            // this should be built on the second pass after introspection
            // so we already have all the keys and columns for all tables
            this.foreignKeys = new ForeignKeys(this);
            for (var i = 0; i < this._jsonTable.foreign_keys.length; i++) {
                var jsonFKs = this._jsonTable.foreign_keys[i];
                var foreignKeyRef = new ForeignKeyRef(this, jsonFKs);
                // build foreignKeys of current table
                this.foreignKeys._push(foreignKeyRef);
                // add to referredBy of the key table
                foreignKeyRef.key.table.referredBy._push(foreignKeyRef);
            }
        },

        /**
         * Find alternative tables for each table. This should only be called during the 3rd pass of introspection,
         * after foreign keys have been built
         *
         * Constraints:
         *
         * 1. There is no in-bound foreign keys to the alternative tables.
         * 2. a base table cannot be an alternative table for other base tables (i.e. flat 2-level forest)
         * 3. alternative table has exactly one base-table.
         * 4. alternative table must have exactly one not-null unique key that is a foreign key to the base table.
         * 5. All alternative tables associated with the base table have not-null unique keys that are foreign keys to the SAME primary keys of the base table.
         *
         *
         * @private
         */
        _findAlternatives: function () {
            this._alternatives = {}; // in the form {context: table, ...}
            this._altSharedKey = null; // base table's shared key with its alternative tables
            if (this.annotations.contains(module._annotations.TABLE_ALTERNATIVES)){
                var alternatives = this.annotations.get(module._annotations.TABLE_ALTERNATIVES).content;
                for(var context in alternatives) {
                    var schema = alternatives[context][0];
                    var table = alternatives[context][1];
                    var altTable;

                    try {
                        altTable = this.schema.catalog.schemas.get(schema).tables.get(table);
                    } catch (error) {
                        // schema or table not found
                        console.log(error.message);
                        continue;
                    }

                    if (altTable === this) {
                        // alternative table points to itself, this is a base table
                        // this is the case for 'update' context
                        this._alternatives[context] = altTable;
                        continue;
                    }

                    // if altTable already has been processed (with a different context)
                    // no need to check constraints
                    if (altTable._baseTable === this) {
                        this._alternatives[context] = altTable;
                        continue;
                    }

                    // check constraints

                    // 1. alt should have no incoming foreign keys
                    if (altTable.referredBy.length() > 0) {
                        console.log("Invalid schema: " + altTable.name + " is an alternative table with incoming reference");
                        console.log("Ignoring " + altTable.name);
                        continue;
                    }

                    // 2. two level only
                    if (altTable.annotations.contains(module._annotations.TABLE_ALTERNATIVES)) {
                        console.log("Invalid schema: " + altTable.name + " is an alternative table and a base table");
                        console.log("Ignoring " + altTable.name);
                        continue;
                    }

                    // 3. alt table has exactly one base table
                    if (altTable._baseTable !== altTable) {
                        // base table has previously been set
                        // more than one base table
                        console.log("Invalid schema: " + altTable.name + " has more than one base table");
                        continue;
                    }

                    // 4.1 must have a (1) not-null (2) key which is a (3) foreign key to the base table.
                    var fkeys, j, fkey;
                    if (!this._altSharedKey) { // _altSharedKey is the Key used by all its alternative tables
                        var bkeys = this.keys.all();
                        for (var i = 0; i < bkeys.length; i++) {
                            var key = bkeys[i];
                            try {
                                // (1) check columns are not null
                                var columns = key.colset.columns;
                                var nullok = columns.map(function(column){
                                    return column.nullok;
                                }).includes(true);
                                if (nullok) {
                                    // key allows null, go to next key
                                    continue;
                                }

                                // (3) is a foreign key to the base table
                                fkeys = altTable.foreignKeys.all();
                                for (j = 0; j < fkeys.length; j++) {
                                    fkey = fkeys[j];
                                    if (fkey.key === key) {
                                        // found a foreign key matching the base table key
                                        // (2) check it is also alternative table's key
                                        altTable.keys.get(fkey.colset); // throws exception if not found
                                        this._altSharedKey = key;
                                        altTable._altForeignKey = fkey; // _altForeignKey is the FK and key in alt table and key of the _altSharedKey base table
                                        break;
                                    }
                                }

                                if (this._altSharedKey)
                                    break;
                            } catch (error) {
                                // key not found in alt table, go to next key
                            }
                        }

                        if (!this._altSharedKey) {
                            console.log("Invalid schema: alternative table " + altTable.name + " should have a key that is a foreign key to the base table");
                            console.log(altTable.name + " ignored");
                            continue;
                        }
                    } else {
                        // 4.2 key must be the shared key among all alternative tables
                        try {

                            // (1) find base table shared key in alternative's foreign keys
                            fkeys = altTable.foreignKeys.all();
                            for (j = 0; j < fkeys.length; j++) {
                                fkey = fkeys[j];
                                if (fkey.key === this._altSharedKey) {
                                    // found a foreign key matching the base table key
                                    // (2) check it is also alternative table's key
                                    altTable.keys.get(fkey.colset); // throws exception if not found
                                    altTable._altForeignKey = fkey;
                                    break;
                                }
                            }

                        } catch (error) {
                            console.log("Invalid schema: base table " + this.name);
                            console.log("alternative tables should have a key that is a foreign key to the base table, and it shoud be shared among all alternative tables");
                            console.log("All alternative tables of base table " + this.name + " are ignored");

                            // since alt tables don't share the same key, ignore all the alt tables
                            this._alternatives = {};
                            return;
                        }
                    }

                    // passed all contraints
                    altTable._baseTable = this;
                    this._alternatives[context] = altTable;
                }
            }
        },

        /**
         * get the table's alternative table of a given context
         * If no alternative table found, return itself
         * @private
         * @param {String} context
         *
         */
        _getAlternativeTable: function (context) {
            var altTable = module._getRecursiveAnnotationValue(context, this._alternatives);
            return altTable !== -1 ? altTable : this;
        },

        /**
         * Whether this table is an alternative table
         * @returns {boolean}
         * @private
         */
        _isAlternativeTable: function () {
            return (this._baseTable !== this);
        },


        /**
         *
         * @param {Object} context optional
         * @private
         * @returns {String} app tag
         */
        _getAppLink: function (context) {

            // alternative tables should use base's table's app links
            if (this._isAlternativeTable())
                return this._baseTable._getAppLink(context);

            // use table level
            var app = -1;
            if (this._appLinksAnnotation) {
                if (!context)
                    app = module._getRecursiveAnnotationValue(module._contexts.DEFAULT, this._appLinksAnnotation);
                else
                    app = module._getRecursiveAnnotationValue(context, this._appLinksAnnotation);
            }

            // use schema level
            if (app === -1)
                return this.schema._getAppLink(context);
            else
                return app;

        },

        // figure out if Table is pure and binary association table.
        // binary: Has 2 outbound foreign keys. there is only a composite key constraint. This key includes all the columns from both foreign keys.
        // pure: There is no extra column that is not part of any keys.
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

            var serialTypes = ["serial", "serial2", "serial4", "serial8"];
            var fkColset = new ColSet(this.foreignKeys.colsets().reduce(function(res, colset){
                return res.concat(colset.columns);
            }, [])); // set of foreignkey columns

            var tempKeys = this.keys.all().filter(function(key) {
                var keyCols = key.colset.columns;
                return !(keyCols.length == 1 && (serialTypes.indexOf(keyCols[0].type.name) != -1 ||  module._systemColumns.indexOf(keyCols[0].name) != -1) && !(keyCols[0] in fkColset.columns));
            }); // the key that should contain foreign key columns.

            if (tempKeys.length != 1 || !fkColset._equals(tempKeys[0].colset)) {
                return false; // not binary
            }

            var nonKeyCols = this.columns.all().filter(function(col) {
            	return col.memberOfKeys.length === 0 && module._systemColumns.indexOf(col.name) === -1;
            }); // columns that are not part of any keys.

            return nonKeyCols.length === 0; // check for purity
        }
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
            throw new module.NotFoundError("", "Column " + name + " not found in table " + this._table.name + ".");
        },

        /**
         *
         * @param {int} pos
         * @returns {ERMrest.Column}
         */
        getByPosition: function (pos) {
            return this._columns[pos];
        },
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

        this._jsonColumn = jsonColumn;

        /**
         * The ordinal number or position of this column relative to other
         * columns within the same scope.
         * TODO: to be implemented
         * @type {number}
         */
        this.position = undefined;

        /**
         * Formats a value corresponding to this column definition.
         * If a column display annotation with preformat property is available then use prvided format string
         * else use the default formatValue function
         *
         * @param {Object} data The 'raw' data value.
         * @param {String} context the app context
         * @returns {string} The formatted value.
         */
        this.formatvalue = function (data, context, options) {

            //This check has been added to show "null" in all the rows if the user inputs blank string
            //We are opting json out here because we want null in the UI instead of "", so we do not call _getNullValue for json
            if (data === undefined || (data === null && this.type.name.indexOf('json') === -1)) {
                return this._getNullValue(context);
            } else if (data === null && this.type.name.indexOf('json') !== 0) {
                return data;
            }

            var display = this.getDisplay(context);

            if (display.isPreformat) {
                try {
                    return module._printf(display.preformatConfig, data);
                } catch(e) {
                    console.log(e);
                }
            }

            return _formatValueByType(this.type, data, options);
        };

        /**
         * Formats the presentation value corresponding to this column definition.
         * @param {String} data The 'formatted' data value.
         * @param {String} context the app context
         * @param {Object} options The key value pair of possible options with all formatted values in '.formattedValues' key
         * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
         */
        this.formatPresentation = function(data, context, options) {

            var utils = module._formatUtils;

            var display = this.getDisplay(context);

            /*
             * If column doesn't has column-display annotation and is not of type markdown
             * but the column type is json then append <pre> tag and return the value
             */

            if (!display.isHTML && this.type.name.indexOf('json') !== -1) {
                return { isHTML: true, value: '<pre>' + data + '</pre>', unformatted: data};
            }

            /*
             * If column doesn't has column-display annotation and is not of type markdown
             * then return data as it is
             */
            if (!display.isHTML) {
                return { isHTML: false, value: data, unformatted: data };
            }

            var unformatted = data;

            // If there is any markdown pattern then evaluate it
            if (display.isMarkdownPattern) {
                // Get markdown pattern from the annotation value

                var template = display.markdownPattern; // pattern

                // Code to do template/string replacement using keyValues
                if (options === undefined || options !== Object(options)) {
                    options = {};
                }
                if (options.formattedValues === undefined) {
                    options.formattedValues = module._getFormattedKeyValues(this.table, context, data);
                }

                options.formatted = true; // to avoid creating formattedValues again
                unformatted = module._renderTemplate(template, options.formattedValues, this.table, context, options);
            }


            // If value is null or empty, return value on basis of `show_nulls`

            if (unformatted === null || unformatted.trim() === '') {
                return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
            }

            /*
             * Call printmarkdown to generate HTML from the final generated string after templating and return it
             */
             value = utils.printMarkdown(unformatted, options);

             return { isHTML: true, value: value, unformatted: unformatted };

        };

        /**
         *
         * @type {ERMrest.Table}
         */
        this.table = table;

        /**
         *
         * @type {Object}
         */
        this.rights = jsonColumn.rights;

        /**
         * Mentions whether we should hide the value for this column
         * @type {Boolean}
         */
        this.isHidden = this.rights.select === false;

        /**
         * Mentions whether this column is generated depending on insert rights
         * or if column is system generated then return true so that it is disabled.
         * @type {Boolean}
         */
        this.isGenerated = this.rights.insert === false;

        /**
         * If column is system generated then this should true so that it is disabled during create and update.
         * @type {Boolean}
         */
        this.isSystemColumn = module._systemColumns.find(function(c) { return c === jsonColumn.name; }) !== undefined;

        /**
         * Mentions whether this column is immutable depending on update rights
         * @type {Boolean}
         */
        this.isImmutable = this.rights.update === false;

        /**
         * @type {string}
         */
        this.name = jsonColumn.name;

        /**
         *
         * @type {ERMrest.Type}
         */
        this.type = new Type(jsonColumn.type);

        /**
         * @type {Boolean}
         */
        this.nullok = jsonColumn.nullok;

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

        this._nullValue = {}; // Used to avoid recomputation of null value for different contexts.
        this._display = {};  // Used for column.display annotation.

        /**
         * @type {object}
         * @desc
         * Preferred display name for user presentation only.
         * this.displayname.isHTML will return true/false
         * this.displayname.value has the value
         */
        this.displayname = module._determineDisplayName(this, true, this.table);

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
         * @return {string} string representation of Column
         */
        toString: function() {
            return [module._fixedEncodeURIComponent(this.table.schema.name),
                    module._fixedEncodeURIComponent(this.table.name),
                    module._fixedEncodeURIComponent(this.name)].join(":");
        },

        /**
         * return the default value for a column after checking whether it's a primitive that can be displayed properly
         * @return {string}
         */
        get default () {
            if (this._default === undefined) {
                var defaultVal = this._jsonColumn.default;
                try {
                    // If the column typename is in the list of types to ignore setting the default for, throw an error to the catch clause
                    if (module._ignoreDefaultsNames.includes(this.name)) {
                        throw new Error("" + this.type.name + " is in the list of ignored default types");
                    }
                    switch (this.type.rootName) {
                        case "boolean":
                            if (typeof(defaultVal) !== "boolean") {
                                throw new Error("Val: " + defaultVal + " is not of type boolean.");
                            }
                            break;
                        case "int2":
                        case "int4":
                        case "int8":
                            var intVal = parseInt(defaultVal, 10);
                            if (isNaN(intVal)) {
                                throw new Error("Val: " + intVal + " is not of type integer.");
                            }
                            break;
                        case "float4":
                        case "float8":
                        case "numeric":
                            var floatVal = parseFloat(defaultVal);
                            if (isNaN(floatVal)) {
                                throw new Error("Val: " + floatVal + " is not of type float.");
                            }
                            break;
                        case "date":
                        case "timestamp":
                        case "timestamptz":
                            // convert using moment, if it doesn't error out, set the value.
                            // try/catch catches this if it does error out and sets it to null
                            if (!module._moment(defaultVal).isValid()) {
                                throw new Error("Val: " + defaultVal + " is not a valid DateTime value.");
                            }
                            break;
                        case "json":
                        case "jsonb":
                            JSON.parse(defaultVal);
                            break;
                        default:
                            break;

                    }
                    this._default = defaultVal;
                } catch(e) {
                    console.dir(e.message);
                    this._default = null;
                }
            }
            return this._default;
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
            return module._getNullValue(this, context, [this, this.table, this.table.schema]);
        },

        getInputDisabled: function(context) {
            var isGenerated = this.annotations.contains(module._annotations.GENERATED);
            var isImmutable = this.annotations.contains(module._annotations.IMMUTABLE);
            var isSerial = (this.type.name.indexOf('serial') === 0);

            if (context == module._contexts.CREATE) {
                if (this.isSystemColumn || this.isGenerated || isGenerated || isSerial) {
                    return {
                        message: "Automatically generated"
                    };
                }
            } else if (context == module._contexts.EDIT) {
                if (this.isSystemColumn || this.isImmutable || isGenerated || isImmutable || isSerial) {
                    return true;
                }
            } else {
                // other contexts are not in entry/create/edit modes, which means any "input" is disabled anyway
                return true;
            }
            return false;
        },

        /**
         * @param {String} context the context that we want the display for.
         * @desc
         * display object for the column
         */
        getDisplay: function (context) {
            if (!(context in this._display)) {
                var annotation = -1, columnOrder = [], hasPreformat;
                if (this.annotations.contains(module._annotations.COLUMN_DISPLAY)) {
                    annotation = module._getRecursiveAnnotationValue(context, this.annotations.get(module._annotations.COLUMN_DISPLAY).content);
                }

                if (Array.isArray(annotation.column_order)) {
                    var col;
                    for (var i = 0 ; i < annotation.column_order.length; i++) {
                        try {
                            col = this.table.columns.get(annotation.column_order[i]);

                            // json and jsonb are not sortable.
                            if (["json", "jsonb"].indexOf(col.type.name) !== -1) {
                                continue;
                            }

                            columnOrder.push(col);
                        } catch(exception) {}
                    }
                } else {
                    columnOrder = annotation.column_order;
                }

                if (typeof annotation.pre_format === 'object') {
                    if (typeof annotation.pre_format.format !== 'string') {
                        console.log(" pre_format annotation provided for column " + this.name + " doesn't has format string property");
                    } else {
                        hasPreformat = true;
                    }
                }

                this._display[context] = {
                    "isPreformat": hasPreformat,
                    "preformatConfig": hasPreformat ? annotation.pre_format : null,
                    "isMarkdownPattern": (typeof annotation.markdown_pattern === 'string'),
                    "isMarkdownType" : this.type.name === 'markdown',
                    "isHTML": (typeof annotation.markdown_pattern === 'string') || this.type.name === 'markdown',
                    "markdownPattern": annotation.markdown_pattern,
                    "columnOrder": columnOrder
                };
            }
            return this._display[context];
        },

        // get the sort columns using the context
        _getSortColumns: function (context) {
            var display = this.getDisplay(context);

            if (display.columnOrder === false) {
                return undefined;
            }

            if (display.columnOrder !== undefined && display.columnOrder.length !== 0) {
                return display.columnOrder;
            }

            if (["json", "jsonb"].indexOf(this.type.name) !== -1) {
                return undefined;
            }

            return [this];
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
            if (!this._all) {
                this._all = [];
                for (var key in this._annotations) {
                    this._all.push(this._annotations[key]);
                }
            }
            return this._all;
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
         * @deprecated
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
        // sort columns by name
        uniqueColumns.sort(function(c1, c2) {
            if (c1.name < c2.name)
                return -1;
            if (c1.name > c2.name)
                return 1;
            return 0;
        });

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

        /**
         * The exact `names` array in key definition
         * @type {Array}
         */
        this.constraint_names = jsonKey.names;

        // add constraint names to catalog
        for (var k = 0, constraint; k < this.constraint_names.length; k++) {
            constraint = this.constraint_names[k];
            try {
                if (Array.isArray(constraint) && constraint.length == 2){
                    table.schema.catalog._addConstraintName(constraint, this, module._constraintTypes.KEY);
                }
            } catch (exception){}
        }

        // this name is going to be used to refere to this reference
        // since constraint names are supposed to be unique in databse,
        // we can assume that this can be used as a unique identifier for key.
        // NOTE: currently ermrest only returns the first constraint name,
        // so using the first one is sufficient
        this.name = this.constraint_names[0].join("_");

        this._wellFormed = {};
        this._display = {};
    }

    Key.prototype = {
        constructor: Key,

        /**
         * Indicates if the key is simple (not composite)
         * @type {boolean}
         */
        get simple() {
            return this.colset.length() == 1;
        },

        /**
         * Indicates if all of the constituent columns have nullok=false or not.
         * If any of them have nullok=true, it will return false.
         *
         * @type{boolean}
         * @private
         */
        get _notNull() {
            if (this._nullok_cache === undefined) {
                var cols = this.colset.columns, result = true;
                for (var c = 0; c < cols.length; c++) {
                    if (cols[c].nullok) {
                        result = false;
                        break;
                    }
                }
                this._nullok_cache = result;
            }
            return this._nullok_cache;
        },

        /**
         * whether key has a column
         * @param {ERMrest.Column} column
         * @returns {boolean}
         */
        containsColumn: function (column) {
            return (this.colset.columns.indexOf(column) !== -1);
        },

        // will return true if all the columns are not null and not html.
        _isWellFormed: function(context) {
            if (!(context in this._wellFormed)) {
                var cols = this.colset.columns, result = true;
                for (var c = 0; c < cols.length; c++) {
                    if (cols[c].nullok || cols[c].getDisplay(context).isHTML) {
                        result = false;
                        break;
                    }
                }
                this._wellFormed[context] = result;
            }
            return this._wellFormed[context];
        },

        getDisplay: function(context) {
            if (!(context in this._display)) {
                var annotation = -1, columnOrder = [];
                if (this.annotations.contains(module._annotations.KEY_DISPLAY)) {
                    annotation = module._getAnnotationValueByContext(context, this.annotations.get(module._annotations.KEY_DISPLAY).content);
                }

                if (Array.isArray(annotation.column_order)) {
                    columnOrder = [];
                    for (var i = 0 ; i < annotation.column_order.length; i++) {
                        try {
                            // column-order is just a list of column names
                            columnOrder.push(this.table.columns.get(annotation.column_order[i]));
                        } catch(exception) {}
                    }
                } else {
                    columnOrder = annotation.column_order;
                }

                this._display[context] = {
                    "columnOrder": columnOrder,
                    "isMarkdownPattern": (typeof annotation.markdown_pattern === 'string'),
                    "markdownPattern": annotation.markdown_pattern
                };
            }

            return this._display[context];
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
         * It won't preserve the order of given columns.
         * Returns set of columns sorted by their names.
         *
         * @type {Array}
         */
        this.columns = columns.slice().sort(function(a, b) {
           return a.name.localeCompare(b.name);
       });
    }

    ColSet.prototype = {
        constructor: ColSet,

        /**
         * returns string representation of colset object: (s:t:c1,s:t:c2)
         * @return {string} string representation of colset object
         */
        toString: function(){
            return "(" + this.columns.map(function(col){
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
         * @return {string} string representation of Mapping object
         */
        toString: function() {
            // changing from and to to Colset, makes this easier.
            return [this._from, this._to].map(function(columns){
                // create toString for from and to
                return columns.slice().sort(function(a, b){
                    return module._fixedEncodeURIComponent(a.name.localeCompare(b.name));
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
        },

        /**
         *
         * @param {ERMrest.Column} toCol
         * @returns {ERMrest.Column} mapping column
         * @throws {ERMrest.NotFoundError} no mapping column found
         * @desc get the mapping column given the to column
         */
        getFromColumn: function (toCol) {
            for (var i = 0; i < this._to.length; i++) {
                if (toCol._equals(this._to[i])) {
                    return this._from[i];
                }
            }

            throw new module.NotFoundError("", "Mapping not found for column " + toCol.name);
        }
    };

    /**
     * @desc holds inbound foreignkeys of a table.
     * @param {ERMrest.Table} table the table that this object is for
     * @memberof ERMrest
     * @constructor
     */
    function InboundForeignKeys(table) {
        this._foreignKeys = [];
        this._table = table;
        this._contextualize_cached = {};

    }

    InboundForeignKeys.prototype = {
        constructor: InboundForeignKeys,

        _push: function (foreignKeyRef) {
            this._foreignKeys.push(foreignKeyRef);
        },

        all: function () {
            return this._foreignKeys;
        },

        length: function() {
            return this._foreignKeys.length;
        },

        _contextualize: function (context) {
            if(context in this._contextualize_cached) {
                return this._contextualize_cached[context];
            }

            var orders = -1;
            if (this._table.annotations.contains(module._annotations.VISIBLE_FOREIGN_KEYS)) {
                orders = module._getRecursiveAnnotationValue(context, this._table.annotations.get(module._annotations.VISIBLE_FOREIGN_KEYS).content);
            }

            if (orders == -1) {
                this._contextualize_cached[context] = -1;
                return -1; // no annoation
            }

            for (var i = 0, result = [], fk; i < orders.length; i++) {
                if(!Array.isArray(orders[i]) || orders[i].length != 2) {
                    continue; // the annotation value is not correct.
                }
                fk = this._table.schema.catalog.constraintByNamePair(orders[i], module._constraintTypes.FOREIGN_KEY);
                if (fk !== null && result.indexOf(fk.object) == -1 && this._foreignKeys.indexOf(fk.object) != -1) {
                    // avoid duplicate and if it's a valid inbound fk of this table.
                    result.push(fk.object);
                }
            }

            this._contextualize_cached[context] = result;
            return result;
        }
    };


    /**
     *
     * @memberof ERMrest
     * @constructor
     */
    function ForeignKeys(table) {
        this._foreignKeys = []; // array of ForeignKeyRef
        this._mappings = []; // array of Mapping
        this._table = table;
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

        this._table = table;

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
         *
         * @type {Object}
         */
        this.rights = jsonFKR.rights;

        /**
         * @type {ERMrest.Mapping}
         */
        this.mapping = new Mapping(foreignKeyCols, referencedCols);

        /**
         * The exact `names` array in foreign key definition
         * The constraint names for this foreign key
         *
         * @type {Array}
         */
        this.constraint_names = jsonFKR.names;

        // add constraint names to catalog
        for (var k = 0, constraint; k < this.constraint_names.length; k++) {
            constraint = this.constraint_names[k];
            try {
                if (Array.isArray(constraint) && constraint.length == 2){
                    catalog._addConstraintName(constraint, this, module._constraintTypes.FOREIGN_KEY);
                }
            } catch (exception){}
        }

        // this name is going to be used to refere to this reference
        // since constraint names are supposed to be unique in databse,
        // we can assume that this can be used as a unique identifier for fk.
        // NOTE: currently ermrest only returns the first constraint name,
        // so using the first one is sufficient
        // NOTE: This can cause problem, consider ['s', '_t'] and ['s_', 't'].
        // They will produce the same name. Is there any better way to generate this?
        this.name = this.constraint_names[0].join("_");


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

        this._display = {};

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        /**
         * returns string representation of ForeignKeyRef object
         * @param {boolean} [reverse] false: returns (keyCol1, keyCol2)=(s:t:FKCol1,FKCol2) true: returns (FKCol1, FKCol2)=(s:t:keyCol1,keyCol2)
         * @return {string} string representation of ForeignKeyRef object
         */
        toString: function (reverse){
            var leftString = "", rightString = "";
            var columnsLength = this.colset.columns.length;
            for (var i = 0; i < columnsLength; i++) {
                var fromCol = this.colset.columns[i];
                var toCol = this.mapping.get(fromCol);
                var separator = (i < columnsLength -1 ?",": "");

                leftString += (reverse ? module._fixedEncodeURIComponent(fromCol.name) : module._fixedEncodeURIComponent(toCol.name)) + separator;
                if (reverse) {
                    rightString += (i === 0 ? toCol.toString() : module._fixedEncodeURIComponent(toCol.name));
                } else {
                    rightString += (i === 0 ? fromCol.toString() : module._fixedEncodeURIComponent(fromCol.name));
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
        },

        getDisplay: function(context) {
            if (!(context in this._display)) {
                var annotation = -1, columnOrder = [];
                if (this.annotations.contains(module._annotations.FOREIGN_KEY)) {
                    annotation = module._getAnnotationValueByContext(context, this.annotations.get(module._annotations.FOREIGN_KEY).get("display"));

                }

                if (Array.isArray(annotation.column_order)) {
                    columnOrder = [];
                    for (var i = 0 ; i < annotation.column_order.length; i++) {
                        try {
                            // column-order is just a list of column names
                            columnOrder.push(this.key.table.columns.get(annotation.column_order[i]));
                        } catch(exception) {}
                    }
                } else {
                    columnOrder = annotation.column_order;
                }

                this._display[context] = {
                    "columnOrder": columnOrder,
                };
            }

            return this._display[context];
        }
    };


    /**
     *
     * @memberof ERMrest
     * @param name
     * @constructor
     */
    function Type(jsonType) {
        /**
         * @type {string}
         */
        this.name = jsonType.typename;

        /**
         * Currently used to signal whether there is a base type for this column
         * @type {boolean}
         */
        this._isArray = jsonType.is_array;

        /**
         * Currently used to signal whether there is a base type for this column
         * @type {boolean}
         */
        this._isDomain = jsonType.is_domain;

        if (jsonType.base_type !== undefined) {
            /**
             * @type {ERMrest.Type}
             */
            this.baseType = new Type(jsonType.base_type);
        }
    }

    Type.prototype = {
        constructor: Type,

        /**
         * The column name of the base. This goes to the first level which
         * will be a type understandable by database.
         * @type {string} type name
         */
        get rootName() {
            if (this._rootName === undefined) {
                var getName = function (type) {
                    return (type.baseType) ? getName(type.baseType) : type.name;
                };
                this._rootName = getName(this);
            }
            return this._rootName;
        }
    };
