
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
     * When making requests using http, use server.http
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
     * @type {appLinkFn}
     * @private
     */
    module._appLinkFn = null;

    /**
     * Given an app tag, location object and context will return the full url.
     * @callback appLinkFn
     * @param {string} tag the tag that is defined in the annotation. If null, should use context.
     * @param {ERMrest.Location} location the location object that ERMrest will return.
     * @param {string} context - optional, used to determine default app if tag is null/undefined
     */

    /**
     * function that resets the storage expiration time
     * initialized to empty function so function runs properly when not defined in `chaise`
     * @type {onHTTPSuccess}
     * @private
     */
    module._onHTTPSuccess = function () {};

    /**
     * This function will be called on success of http calls.
     * @callback onHTTPSuccess
     */

     module._systemColumnsHeuristicsMode = function () {};

     /**
      * the client configs. this includes the following attributes:
      * - originAliases
      * - disableExternalLinkModal
      * @type {Object}
      */
     module._clientConfig = null;

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

        if (contextHeaderParams == null || typeof contextHeaderParams !== 'object') {
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
     * @param {Object} contextHeaderParams an object with at least `cid`
     * @constructor
     */
    function Server(uri, contextHeaderParams) {

        /**
         * The URI of the ERMrest service
         * @type {string}
         */
        this.uri = uri;

        /**
         * The host of the uri
         * @type {String}
         */
        this.host = "";
        var hasProtocol = new RegExp('^(?:[a-z]+:)?//', 'i').test(uri);
        if (hasProtocol) {
            var urlParts = uri.split("/");
            if (urlParts.length >= 3) {
                this.host = urlParts[2];
            }
        }

        /**
         * The wrapped http service for this server instance.
         * @private
         * @type {Object}
         */
        this.http = module._wrap_http(module._http);
        this.http.contextHeaderParams = contextHeaderParams;

        /**
         * context-id: shows the id of app that this server is being used for
         * @type {string}
         */
        this.cid = this.http.contextHeaderParams.cid;

        /**
         * page-id: shows the id of the page that this server is being used for
         * @type {string=}
         */
        this.pid = this.http.contextHeaderParams.pid;

        /**
         *
         * @type {ERMrest.Catalogs}
         */
        this.catalogs = null;

        /**
         * should be used to log client action information on the server
         * @param {Object} headers - the headers to be logged, should include action
         **/
        this.logClientAction = function (contextHeaderParams) {
            var defer = module._q.defer();

            // make sure contextHeaderParams is an object and NOT an array
            if (!contextHeaderParams || (contextHeaderParams === Object(contextHeaderParams) && Array.isArray(contextHeaderParams))) {
                var error = new module.InvalidInputError("Context header params were not passed");
                // Errors for client action logging should not force a terminal error
                return defer.reject(error), defer.promise;
            }

            var headers = {};
            headers[module.contextHeaderName] = contextHeaderParams;

            var config = {
                headers: headers
            };

            this.http.head(this.uri + "/client_action", config).then(function () {
                defer.resolve();
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        };
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

        var catalogSnapshot = id.split("@");
        if (catalogSnapshot.length === 2) {
            this.version = catalogSnapshot[1];
        }

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
         * This will return the snapshot from the catalog request instead of schema,
         * because it will return the snapshot based on the model changes.
         * @param {Object} contextHeaderParams - properties to log under the dcctx header
         * @return {Promise} a promise that returns json object or snaptime if resolved or
         *      {@link ERMrest.ERMrestError} if rejected
         */
        currentSnaptime: function (contextHeaderParams) {
            var self = this, defer = module._q.defer(), headers = {};

            if (contextHeaderParams) {
                headers[module.contextHeaderName] = contextHeaderParams;
            } else {
                headers[module.contextHeaderName] = {
                    action: "model/snaptime",
                    catalog: self.id
                };
            }

            var config = {
                headers: headers
            };

            this.server.http.get(this._uri, config).then(function (response) {
                defer.resolve(response.data.snaptime);
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
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
            return this.currentSnaptime().then(function(snaptime) {
                self.snaptime = snaptime;
                var headers = {};
                headers[module.contextHeaderName] = {
                    action: "model/schema",
                    catalog: self.id
                };
                return self.server.http.get(self._uri + "/schema", {headers: headers});
            }).then(function (response) {
                var jsonSchemas = response.data;

                self.rights = jsonSchemas.rights;

                self.annotations = new Annotations();
                for (var uri in jsonSchemas.annotations) {
                    var jsonAnnotation = jsonSchemas.annotations[uri];
                    self.annotations._push(new Annotation("catalog", uri, jsonAnnotation));
                }

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
                var error = module.responseToError(response);
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
        },

        /**
         * @return {Object} the chaise config object from the catalog annotation
         */
        get chaiseConfig () {
            if (!this._chaiseConfig) {
                if (this.annotations.contains(module._annotations.CHAISE_CONFIG)) {
                    this._chaiseConfig = this.annotations.get(module._annotations.CHAISE_CONFIG).content;
                }
            }
            return this._chaiseConfig;
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
        },

        /**
         * @param  {string} tableName  the name of table
         * @param  {string=} schemaName the name of schema (optional)
         * @return {ERMrest.Table}
         * @throws {ERMrest.MalformedURIError}
         * @throws  {ERMrest.NotFoundError}
         * Given table name and schema will find the table object.
         * If schema name is not given, it will still try to find the table.
         * If the table name exists in multiple schemas or it doesn't exist,
         * it will throw an error
         */
        findTable: function (tableName, schemaName) {
            if (schemaName) {
                return this.get(schemaName).tables.get(tableName);
            }

            var schemas = this.all(), schema;
            for (var i = 0; i < schemas.length; i++) {
                if (schemas[i].tables.names().indexOf(tableName) !== -1) {
                    if (!schema){
                        schema = schemas[i];
                    } else{
                        throw new module.MalformedURIError("Ambiguous table name " + tableName + ". Schema name is required.");
                    }
                }
            }
            if (!schema) {
                throw new module.MalformedURIError("Table " + tableName + " not found");
            }

            return schema.tables.get(tableName);
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
        if (this.annotations.contains(module._annotations.DISPLAY)) {
            var cm = _processModelComment(this.annotations.get(module._annotations.DISPLAY).content.comment);
            if (typeof cm === "string") {
                this.comment = cm;
            }
        }

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
        if (this.annotations.contains(module._annotations.DISPLAY)) {
            var cm = _processModelComment(this.annotations.get(module._annotations.DISPLAY).content.comment);
            if (typeof cm === "string") {
                this.comment = cm;
            }
        }

        /**
         * @desc The type of this table
         * @type {string}
         */
        this.kind = jsonTable.kind;

        if (this.annotations.contains(module._annotations.APP_LINKS)) {
            this._appLinksAnnotation = this.annotations.get(module._annotations.APP_LINKS).content;
        }

        this._exportTemplates = {};
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
                            return (a.colset._getColumnPositions() > b.colset._getColumnPositions()) ? 1 : -1;
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
                            return keyA.colset.columns.length - keyB.colset.columns.length;
                        }

                        // has more text
                        var aTextCount = countTextColumns(keyA);
                        var bTextCount = countTextColumns(keyB);
                        if (aTextCount != bTextCount) {
                            return bTextCount - aTextCount;
                        }

                        // the one that has lower column position
                        return (keyA.colset._getColumnPositions() > keyB.colset._getColumnPositions()) ? 1 : -1;
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
                                return keyA.colset.columns.length - keyB.colset.columns.length;
                            }

                            // has more text
                            var aTextCount = countTextColumns(keyA);
                            var bTextCount = countTextColumns(keyB);
                            if (aTextCount != bTextCount) {
                                return bTextCount - aTextCount;
                            }

                            // the one that has lower column position
                            return (keyA.colset._getColumnPositions() > keyB.colset._getColumnPositions()) ? 1 : -1;
                        })[0];
                    }
                }
                this._rowDisplayKeys[context] = displayKey; // might be undefined
            }
            return this._rowDisplayKeys[context];
        },

        /**
         * uri to the table in ermrest with entity api
         * @type {string}
         */
        get uri () {
            return this._uri;
        },

        //TODO should be removed but chaise is using this
        get reference() {
            if (!this._reference) {
                this._reference = module._createReference(module.parse(this._uri), this.schema.catalog);
            }

            return this._reference;
        },

        /**
         * Returns an object with
         * - fkeys: array of ForeignKeyRef objects
         * - columns: Array of columns
         * - sources: hash-map of name to an object that has
         *   - sourceObject
         *   - column
         *   - hasPath
         *   - hasInbound
         *   - isEntity
         * - sourceMapping: hashname to all the names
         * @type {Object}
         */
        get sourceDefinitions() {
            if (this._sourceDefinitions === undefined) {
                this._sourceDefinitions = this._getSourceDefinitions();
            }
            return this._sourceDefinitions;
         },

         _getSourceDefinitions: function () {
             var self = this;
             var sd = module._annotations.SOURCE_DEFINITIONS;
             var hasAnnot = self.annotations.contains(sd);
             var res = {columns: [], fkeys: [], sources: {}, sourceMapping: {}};
             var addedCols = {}, addedFks = {};
             var allColumns = self.columns.all(),
                 allForeignKeys = self.foreignKeys.all();
             var consNames = module._constraintNames;

             var findConsName = function (catalogId, schemaName, constraintName) {
                 var result;
                 if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                     result = consNames[catalogId][schemaName][constraintName];
                 }
                 return (result === undefined) ? null : result;
             };

             // TODO this is way too ugly, rewrite this!
             var processSourceDefinitionList = function (val, isFkey) {
                 if (val === true) {
                     return isFkey ? allForeignKeys : allColumns;
                 }

                 var resultList = [], mapName = function (item) {return item.name;};
                 var allListNames = isFkey ? allForeignKeys.map(mapName) : allColumns.map(mapName);
                 if (Array.isArray(val)) {
                     val.forEach(function (cname, index) {
                         if (isFkey) {
                             if (!Array.isArray(cname) || cname.length !== 2) {
                                 // TODO log the error
                                 return;
                             }
                             var fkObj = findConsName(self.schema.catalog.id, cname[0], cname[1]);
                             if (fkObj === null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                                 return;
                             }
                             cname = fkObj.object.name;
                         }

                         var elIndex = allListNames.indexOf(cname);
                         if (isFkey) {
                             if (addedFks[elIndex]) return;
                             addedFks[elIndex] = true;
                         } else {
                             if (addedCols[elIndex]) return;
                             addedCols[elIndex] = true;
                         }
                         if (elIndex === -1) {
                             console.log("invalid source definition, ", (isFkey ? "fkeys" : "columns"), ", index=" + index);
                             return;
                         }
                         resultList.push(isFkey ? allForeignKeys[elIndex] : allColumns[elIndex]);
                     });
                 }
                 return resultList;
             };

             if (!hasAnnot) {
                 res.columns = allColumns;
                 res.fkeys = allForeignKeys;
                 return res;
             }

             var annot = self.annotations.get(sd).content;

             // columns
             if (annot.columns) {
                 res.columns = processSourceDefinitionList(annot.columns, false);
             }

             // fkeys
             if (annot.fkeys) {
                 res.fkeys = processSourceDefinitionList(annot.fkeys, true);
             }

             // sources
             if (annot.sources && typeof annot.sources === "object") {
                 for (var key in annot.sources) {
                     if (!annot.sources.hasOwnProperty(key)) continue;

                     // if the key is special
                     if (Object.keys(module._specialSourceDefinitions).indexOf(key) !== -1) continue;

                     var message = "source definition, table =" + self.name + ", name=" + key;

                     // TODO why? make sure key is not the same as table columns
                     if (self.columns.has(key)) {
                         console.log(message +  ": cannot use the table column names.");
                         continue;
                     }

                     // TODO why? make sure key doesn't start with $
                     if (key.startsWith("$")) {
                         console.log(message + ": key name cannot start with $");
                         continue;
                     }

                     var pSource = _processSourceObject(annot.sources[key], self, consNames, message);
                     if (pSource.error) {
                         console.log(pSource.message);
                         continue;
                     }

                     // attach to sources
                     res.sources[key] = pSource;

                     // attach to sourceMapping
                     if (!(pSource.name in res.sourceMapping)) {
                         res.sourceMapping[pSource.name] = [];
                     }
                     res.sourceMapping[pSource.name].push(key);
                 }
             }

             return res;
         },

         /**
          * Returns an array of objects with the followin attributes:
          *   - sourceObject
          *   - column
          *   - hasPath
          *   - hasInbound
          *   - isEntity
          * @type {Object[]|false}
          */
         get searchSourceDefinition() {
             if (this._searchSourceDefinition === undefined) {
                 var _getSearchSourceDefinition = function (self) {
                     var consNames = module._constraintNames,
                         sd = module._annotations.SOURCE_DEFINITIONS,
                         sb = module._specialSourceDefinitions.SEARCH_BOX,
                         orOperator = module._FacetsLogicalOperators.OR,
                         sbDef;
                     var hasAnnot = self.annotations.contains(sd);

                     // annotation is missing
                     if (!hasAnnot) return false;


                     var annot = self.annotations.get(sd).content;

                     // annotation is not well defined
                     if (typeof annot.sources !== "object" || !annot.sources || typeof annot.sources[sb] !== "object" || !annot.sources[sb]) return false;

                     /*
                      * accepted format:
                      * "or": [
                      *    // source def
                      * ]
                      */
                     sbDef = annot.sources[sb];

                     var message = "search column definition, table =" + self.name;

                     // make sure it's properly defined as `or` of sources
                     if (!sbDef.hasOwnProperty(orOperator) || !Array.isArray(sbDef[orOperator])) {
                         console.log(message + ": search-box must be defined as `or` of sources.");
                         return false;
                     }

                     var res = [];
                     sbDef[orOperator].forEach(function (src, index) {
                         // process each individual object
                         var pSource = _processSourceObject(src, self, consNames, message + ", index=" + index);
                         if (pSource.error) {
                             console.log(pSource.message);
                             return;
                         }
                         if (pSource.hasPath) {
                             console.log(message + ": only table columns are accepted.");
                             return;
                         }

                         res.push(pSource);
                     });

                     if (res.length === 0) {
                         console.log(message + ": none of the defined sources were valid, using all the columns.");
                         return false;
                     }
                     return res;
                 };

                 this._searchSourceDefinition = _getSearchSourceDefinition(this);
             }
             return this._searchSourceDefinition;
         },

        /**
         * Returns the export templates that are defined on this table.
         * NOTE If this returns `null`, then the exportTemplates is not defined on the table or schema
         * NOTE The returned template might not have `outputs` attribute.
         * @type {Array|null}
         */
        getExportTemplates: function (context) {
            context = context || "*";
            if (!(context in this._exportTemplates)) {
                this._exportTemplates[context] = this._getExportTemplates(context);
            }
            return this._exportTemplates[context];
        },

        // the logic for getExportTemplates function
        _getExportTemplates: function (context) {
            var self = this,
                exp = module._annotations.EXPORT,
                expCtx = module._annotations.EXPORT_CONTEXTED,
                annotDefinition = {}, hasAnnot = false,
                chosenAnnot, annotTemplates;

            var getValidTemplates = function (templates) {
                // make sure it's an array
                if (!Array.isArray(templates) || templates.length === 0) {
                    return [];
                }

                // filter only templates that are valid
                return templates.filter(function (temp) {
                    return module.validateExportTemplate(temp);
                });
            };

            // get from table annotation
            if (self.annotations.contains(exp)) {
                annotDefinition = {"*": self.annotations.get(exp).content};
                hasAnnot = true;
            }

            // get from table contextualized annotation
            if (self.annotations.contains(expCtx)) {
                annotDefinition = Object.assign({}, annotDefinition, self.annotations.get(expCtx).content);
                hasAnnot = true;
            }

            // annotation was defined on table
            if (hasAnnot) {
                // find the annotation defined for the context
                chosenAnnot = module._getAnnotationValueByContext(context, annotDefinition);
                if (chosenAnnot !== -1 && typeof chosenAnnot === "object") {
                    return getValidTemplates(chosenAnnot.templates);
                }
            }

            //get from schema annoation
            if (self.schema.annotations.contains(exp)) {
                annotDefinition = {"*": self.schema.annotations.get(exp).content};
                hasAnnot = true;
            }

            // get from schema contextualized annotation
            if (self.schema.annotations.contains(expCtx)) {
                annotDefinition = Object.assign({}, annotDefinition, self.schema.annotations.get(expCtx).content);
                hasAnnot = true;
            }

            // annotation was defined on the table
            if (hasAnnot) {
                // find the annotation defined for the context
                chosenAnnot = module._getAnnotationValueByContext(context, annotDefinition);
                if (chosenAnnot !== -1 && typeof chosenAnnot === "object") {
                    return getValidTemplates(chosenAnnot.templates);
                }
            }

            // annotation is not defined for the given context
            return null;
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

        /**
         * @private
         * @desc
         * figure out if Table is pure and binary association table.
         * binary: Has 2 outbound foreign keys. there is only a composite key constraint. This key includes all the columns from both foreign keys.
         * pure: There is no extra column that is not part of any keys.
         * Execptions
         *  - the table can have an extra key that is made of one serial type column.
         *  - system columns are ignored completely (even if they are part of a simple fk)
         * @type {boolean}
         */
        get isPureBinaryAssociation () {
            if(this._isPureBinaryAssociation === undefined) {
                this._isPureBinaryAssociation = this._computePureBinaryAssociation();
            }
            return this._isPureBinaryAssociation;
        },

        /**
         * if the table is pure and binary, will return the two foreignkeys that create it
         * @type {ERMrest.ForeignKeyRef[]}
         */
        get pureBinaryForeignKeys () {
            if(this._pureBinaryForeignKeys_cached === undefined) {
                // will attach the value of _pureBinaryForeignKeys_cached
                this._computePureBinaryAssociation();
            }
            return this._pureBinaryForeignKeys_cached;
        },

        _computePureBinaryAssociation: function () {
            var isSystemCol = function (col) {
                return module._systemColumns.indexOf(col.name) !== -1;
            };


            if (this.referredBy.length() > 0) {
                return false; // not binary
            }

            // ignore the fks that are simple and their constituent column is system col
            var nonSystemColumnFks = this.foreignKeys.all().filter(function (fk) {
                return !(fk.simple && isSystemCol(fk.colset.columns[0]));
            });

            if (nonSystemColumnFks.length != 2) {
                return false; //not binary
            }


            // set of foreignkey columns
            var fkColset = new ColSet(nonSystemColumnFks.reduce(function(res, fk){
                return res.concat(fk.colset.columns);
            }, []));

            // the key that should contain foreign key columns
            var tempKeys = this.keys.all().filter(function(key) {
                var keyCols = key.colset.columns;
                return !(keyCols.length == 1 && (module._serialTypes.indexOf(keyCols[0].type.name) != -1 ||  module._systemColumns.indexOf(keyCols[0].name) != -1) && !(keyCols[0] in fkColset.columns));
            });

            if (tempKeys.length != 1 || !fkColset._equals(tempKeys[0].colset)) {
                return false; // not binary
            }

            // columns that are not part of any keys (excluding system columns).
            var nonKeyCols = this.columns.all().filter(function(col) {
            	return col.memberOfKeys.length === 0 && !isSystemCol(col);
            });

            // check for purity
            if (nonKeyCols.length === 0) {
                // attach the value of _pureBinaryForeignKeys
                this._pureBinaryForeignKeys_cached = nonSystemColumnFks;

                return true;
            }

            this._pureBinaryForeignKeys_cached = null;
            return false;
        },

        /**
         * return the null value that should be shown for the columns under
         * this table for the given context.
         * @type {object}
         */
        _getNullValue: function (context) {
            return module._getNullValue(this, context, true);
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

            return this._server.http.get(uri).then(function(response) {
                return response.data[0].row_count;
            }, function (response) {
                var error = module.responseToError(response);
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
            return this._server.http.get(uri).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function (response) {
                var error = module.responseToError(response);
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
            return this._server.http.get(uri).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function (response) {
                var error = module.responseToError(response);
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
            return this._server.http.get(uri).then(function(response) {
                return new Rows(self._table, response.data, filter, limit, columns, sortby);
            }, function (response) {
                var error = module.responseToError(response);
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

            return this._server.http.delete(uri).then(function(response) {
                return response.data;
            }, function (response) {
                var error = module.responseToError(response);
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

            return this._server.http.put(uri, rows).then(function(response) {
                return response.data;
            }, function (response) {
                var error = module.responseToError(response);
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

            return this._server.http.post(uri, rows).then(function(response) {
               return response.data;
            }, function(response) {
                var error = module.responseToError(response);
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
         * It will take care of pre-formatting and any default formatting based on column type.
         * If column is array, the returned value will be array of values. The value is either
         * a string or `null`. We're not returning string because we need to distinguish between
         * null and value. `null` for arrays is a valid value. [`null`] is different from `null`.
         *
         * @param {Object} data The 'raw' data value.
         * @param {String} context the app context
         * @returns {string|string[]} The formatted value. If column is array, it will be an array of values.
         */
        this.formatvalue = function (data, context, options) {

            var self = this;

            //This check has been added to show "null" in all the rows if the user inputs blank string
            //We are opting json out here because we want null in the UI instead of "", so we do not call _getNullValue for json
            if (data === undefined || (data === null && this.type.name.indexOf('json') === -1)) {
                return this._getNullValue(context);
            } else if (data === null && this.type.name.indexOf('json') !== 0) {
                return data;
            }

            var display = this.getDisplay(context);
            var isPartOfSimpleKey = !self.nullok && self.memberOfKeys.filter(function (key) {
                return key.simple;
            }).length > 0;
            var isPartOfSimpleFk = self.memberOfForeignKeys.filter(function (fk) {
                return fk.simple;
            }).length > 0;

            var getFormattedValue = function (v) {
                // in case of array, null and empty strings are valid values and we
                // need to distinguish them.
                if (self.type.isArray && (v == null || v === "")) {
                    return v;
                }

                if (display.isPreformat) {
                    try {
                        return module._printf(display.preformatConfig, v, self.type.rootName);
                    } catch(e) {
                        console.log(e);
                    }
                }

                // if int/serial and part of simple key or simple fk we don't want to format the value
                if ((self.type.name.indexOf("int") === 0 || self.type.name.indexOf("serial") === 0) &&
                    (isPartOfSimpleKey || isPartOfSimpleFk)) {
                    return v.toString();
                }

                return _formatValueByType(self.type, v, options);
            };

            if (this.type.isArray) {
                return data.map(getFormattedValue);
            }
            return getFormattedValue(data);
        };

        /**
         * Formats the presentation value corresponding to this column definition.
         * For getting the value of a column we should use this function and not formatvalue directly.
         * This will call `formatvalue` for the current column and other columns if necessary.
         *
         * @param {Object} data The `raw` data for the table.
         * @param {String} context the app context
         * @param {Object} options The key value pair of possible options with all formatted values in '.formattedValues' key
         * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
         */
        this.formatPresentation = function(data, context, options) {
            data = data || {};

            if (options === undefined || options !== Object(options)) {
                options = {};
            }

            var display = this.getDisplay(context);

            var formattedValue, unformatted;
            formattedValue = this.formatvalue(data[this.name], context, options);

            /*
             * If column doesn't has column-display annotation and is not of type markdown
             * but the column type is json then append <pre> tag and return the value
             */
            if (!display.isHTML && this.type.name.indexOf('json') !== -1) {
                return { isHTML: true, value: '<pre>' + formattedValue + '</pre>', unformatted: formattedValue};
            }

            // in this case data must be an array
            if (!display.isMarkdownPattern && this.type.isArray) {
                unformatted = module._formatUtils.printArray(formattedValue, {isMarkdown: display.isHTML});

                // If value is null or empty, return value on basis of `show_null`
                if (unformatted === null || unformatted.trim() === '') {
                    return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
                }

                return {
                    isHTML: true,
                    unformatted: unformatted,
                    value: module.renderMarkdown(unformatted, options.inline)
                };
            }

            /*
             * If column doesn't has column-display annotation and is not of type markdown
             * then return formattedValue as it is
             */
            if (!display.isHTML) {
                return { isHTML: false, value: formattedValue, unformatted: formattedValue };
            }

            // the string with markdown syntax in it and not HTML
            unformatted = formattedValue;

            // If there is any markdown pattern then evaluate it
            if (display.isMarkdownPattern) {
                // Get markdown pattern from the annotation value

                var template = display.markdownPattern; // pattern

                // Code to do template/string replacement using keyValues
                if (options.formattedValues === undefined) {
                    options.formattedValues = module._getFormattedKeyValues(this.table, context, data);
                }

                options.templateEngine = display.templateEngine;
                unformatted = module._renderTemplate(template, options.formattedValues, this.table.schema.catalog, options);
            }


            // If value is null or empty, return value on basis of `show_null`
            if (unformatted === null || unformatted.trim() === '') {
                return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
            }

            /*
             * Call printmarkdown to generate HTML from the final generated string after templating and return it
             */
             value = module.renderMarkdown(unformatted, options.inline);

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

        /**
         * @desc Documentation for this column
         * @type {string}
         */
        this.comment = jsonColumn.comment;
        if (this.annotations.contains(module._annotations.DISPLAY)) {
            var cm = _processModelComment(this.annotations.get(module._annotations.DISPLAY).content.comment);
            if (typeof cm === "string") {
                this.comment = cm;
            }
        }

        // If the comment is not defined for a system column, then it is assigned a default comment
        if((this.comment == null || this.comment == undefined) && this.isSystemColumn){
            this.comment = module._defaultColumnComment[this.name];
        }

        /**
        * @type {Boolean}
        */
        this.nullok = jsonColumn.nullok;
        // if false we don't even need to check for the presence of the annotation
        if (this.nullok) {
            this.nullok = !this.annotations.contains(module._annotations.REQUIRED);
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


        /**
         * This is the actual default that is defined on schema document.
         * To get the default value that is suitable for client-side, please use .default
         * @type {object}
         */
        this.ermrestDefault = jsonColumn.default;

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

        /**
         * return the null value for the column based on context and annotation
         * @type {object}
         */
        _getNullValue: function (context) {
            return module._getNullValue(this, context);
        },

        getInputDisabled: function(context) {
            var isGenerated = this.annotations.contains(module._annotations.GENERATED);
            var isImmutable = this.annotations.contains(module._annotations.IMMUTABLE);
            var isSerial = (this.type.name.indexOf('serial') === 0);

            if (context == module._contexts.CREATE) {
                // only if insert: false in the ACLs
                // (system columns also have insert:false but we want a better message for them)
                if (this.isGenerated && !this.isSystemColumn) {
                    return {
                        message: "Not allowed"
                    };
                }

                // if system column, serial type, or generated based on annotation
                if (this.isSystemColumn || isGenerated || isSerial) {
                    return {
                        message: "Automatically generated"
                    };
                }
            } else if (context == module._contexts.EDIT || context == module._contexts.ENTRY) {
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
                var annotation = -1, columnOrder, hasPreformat;
                if (this.annotations.contains(module._annotations.COLUMN_DISPLAY)) {
                    annotation = module._getRecursiveAnnotationValue(context, this.annotations.get(module._annotations.COLUMN_DISPLAY).content);
                }

                columnOrder = _processColumnOrderList(annotation.column_order, this.table);

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
                    "templateEngine": annotation.template_engine,
                    "columnOrder": columnOrder
                };
            }
            return this._display[context];
        },

        /**
         * can be used for comparing two values of the column.
         * Will return
         *   - 1: if a is greater than b
         *   - -1: if b is greater than a
         *   - 0: if a is equal to b, or cannot compare the values
         * NOTE: null is greater than any not-null values.
         * @param  {*} a raw value
         * @param  {*} b raw value
         * @return {integer} 1: a > b, -1: b > a, 0: a = b
         */
        compare: function (a, b) {
            // not comparabale
            if (module._nonSortableTypes.indexOf(this.type.name) !== -1) {
                return 0;
            }

            // null is considered "greater" than any other value
            if (a == null || b == null) {
                if (a == null && b == null) return 0;
                if (a == null) return 1;
                return -1;
            }

            try {
                switch (this.type.rootName) {
                    case "date":
                    case "timestamp":
                    case "timestamptz":
                        var ma = module._moment(a), mb = module._moment(b);
                        if (ma.isAfter(mb)) {
                            return 1;
                        }
                        if (ma.isBefore(mb)) {
                            return -1;
                        }
                        return 0;
                    case "text":
                    case "longtext":
                    case "markdown":
                        return a.localeCompare(b);
                    default:
                        if (a > b) return 1;
                        if (a < b) return -1;
                        return 0;
                }
            } catch(e) {
                // invalid data, couldn't compare
                return 0;
            }
        },

        /**
         * Returns the columns that this column should be sorted based on and its direction.
         * It will return an array of objects that has:
         * - `column`: The {@link ERMrest.Column} object.
         * - `descending`: Whether we should change the order of sort or not.
         * @private
         * @param  {string} context the context that we want the sort columns for
         * @return {Array}
         */
        _getSortColumns: function (context) {
            var display = this.getDisplay(context);

            if (display.columnOrder === false) {
                return undefined;
            }

            if (display.columnOrder !== undefined && display.columnOrder.length !== 0) {
                return display.columnOrder;
            }

            if (module._nonSortableTypes.indexOf(this.type.name) !== -1) {
                return undefined;
            }

            return [{column: this}];
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
        if (this.annotations.contains(module._annotations.DISPLAY)) {
            var cm = _processModelComment(this.annotations.get(module._annotations.DISPLAY).content.comment);
            if (typeof cm === "string") {
                this.comment = cm;
            }
        }

        /**
         * The exact `names` array in key definition
         * @type {Array}
         */
        this.constraint_names = jsonKey.names;
        this._constraintName = this.constraint_names[0].join("_");

        // add constraint names to catalog
        for (var k = 0, constraint; k < this.constraint_names.length; k++) {
            constraint = this.constraint_names[k];
            try {
                if (Array.isArray(constraint) && constraint.length == 2){
                    table.schema.catalog._addConstraintName(constraint, this, module._constraintTypes.KEY);
                }
            } catch (exception){}
        }

        this._wellFormed = {};
        this._display = {};
    }

    Key.prototype = {
        constructor: Key,

        /**
         * Unique name that can be used for referring to this key.
         * @type {string}
         */
        get name () {
            if (this._name === undefined) {
                var obj = this._constraintName;
                if (this.simple) {
                    obj = {source: this.colset.columns[0].name, self_link: true};
                }
                this._name = module.generatePseudoColumnHashName(obj);
            }
            return this._name;
        },

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

        /**
         * Will return true if all the columns are not not, not html, and not array.
         * @private
         * @param  {string} context the context (used for checking the markdown_pattern)
         * @return {boolean} whether it's well formed or not
         */
        _isWellFormed: function(context) {
            if (!(context in this._wellFormed)) {
                var cols = this.colset.columns, result = true;
                for (var c = 0; c < cols.length; c++) {
                    if (cols[c].nullok || cols[c].type.isArray || cols[c].getDisplay(context).isHTML) {
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
                var annotation = -1, columnOrder;
                if (this.annotations.contains(module._annotations.KEY_DISPLAY)) {
                    annotation = module._getAnnotationValueByContext(context, this.annotations.get(module._annotations.KEY_DISPLAY).content);
                }

                columnOrder = _processColumnOrderList(annotation.column_order, this.table);

                this._display[context] = {
                    "columnOrder": columnOrder,
                    "isMarkdownPattern": (typeof annotation.markdown_pattern === 'string'),
                    "templateEngine": annotation.template_engine,
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

        /**
         * It will return array of objects with the following attributes:
         * - isPath: if true then source and column have values, otherwise the foreignKey
         * - foreignKey: the foreignkey object
         * - object: The facet object if it's a path.
         * - column: the column object if it's a path.
         * - name: the pseudo column name
         * @private
         * @param  {String} context
         * @return {Object}
         */
        _contextualize: function (context) {
            if(context in this._contextualize_cached) {
                return this._contextualize_cached[context];
            }

            var orders = -1, result = [];
            if (this._table.annotations.contains(module._annotations.VISIBLE_FOREIGN_KEYS)) {
                orders = module._getRecursiveAnnotationValue(context, this._table.annotations.get(module._annotations.VISIBLE_FOREIGN_KEYS).content);
            }

            if (orders == -1 || !Array.isArray(orders)) {
                this._contextualize_cached[context] = -1;
                return -1;
            }

            var self = this, fkNames = {}, col, colName, invalid, fk, i;
            var definitions = this._table.sourceDefinitions, wm = module._warningMessages;
            var logErr = function (bool, message, i) {
                if (bool) {
                    console.log("inbound foreignkeys list for table: " + self._table.name + ", context: " + context + ", fk index:" + i);
                    console.log(message);
                }
                return bool;
            };

            var addToList = function (obj) {
                if (obj.name in fkNames) {
                    return; // avoid duplicates
                }
                fkNames[obj.name] = true; // make sure we don't add twice
                result.push(obj);
            };

            for (i = 0; i < orders.length; i++) {
                // inbound foreignkey
                if(Array.isArray(orders[i])) {
                    // valid input
                    if (orders[i].length !== 2) continue;

                    // valid fk
                    fk = this._table.schema.catalog.constraintByNamePair(orders[i], module._constraintTypes.FOREIGN_KEY);
                    if (fk !== null && this._foreignKeys.indexOf(fk.object) !== -1) {
                        colName = _generateForeignKeyName(fk.object, true);
                        addToList({foreignKey: fk.object, name: colName});
                    } else {
                        logErr(true, wm.INVALID_FK, i);
                    }
                }
                // path
                else if (typeof orders[i] === "object") {
                    if (orders[i].source || orders[i].sourcekey) {
                        if (orders[i].source) {
                            col = _getSourceColumn(orders[i].source, this._table, module._constraintNames);
                        } else {
                            def = definitions.sources[orders[i].sourcekey];
                            col = null;
                            if (def) {
                                col = def.column;
                                // copy the elements that are defined in the source def but not the one already defined
                                module._shallowCopyExtras(orders[i], def.sourceObject, module._sourceDefinitionAttributes);
                            }
                        }

                        // invalid if:
                        // 1. invalid source and not a path.
                        // 2. not entity mode
                        // 3. has aggregate
                        invalid = logErr(!col || !_sourceHasPath(orders[i].source), wm.INVALID_FK, i) ||
                                  logErr(!_isSourceObjectEntityMode(orders[i], col), wm.SCALAR_NOT_ALLOWED) ||
                                  logErr(orders[i].aggregate, wm.AGG_NOT_ALLOWED);

                    } else {
                        invalid = true;
                        logErr(true, wm.INVALID_SOURCE, i);
                    }

                    if (!invalid) {
                        colName = _generatePseudoColumnName(orders[i], col).name;
                        addToList({isPath: true, object: orders[i], column: col, name: colName});
                    }
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

        /*
         * @deprecated
         * TODO
         * I added `this.table` below and we should remove `this._table`. But
         * I'm leaving it in for now because I am not sure what I might break.
         */
        this._table = table;

        this.table = table;

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
        this._constraintName = this.constraint_names[0].join("_");

        // add constraint names to catalog
        for (var k = 0, constraint; k < this.constraint_names.length; k++) {
            constraint = this.constraint_names[k];
            try {
                if (Array.isArray(constraint) && constraint.length == 2){
                    catalog._addConstraintName(constraint, this, module._constraintTypes.FOREIGN_KEY);
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

        this._display = {};

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        /**
         * A unique nam that can be used for referring to this foreignkey.
         * @type {string}
         */
        get name () {
            if (this._name === undefined) {
                this._name = _generateForeignKeyName(this);
            }
            return this._name;
        },

        /**
         * returns string representation of ForeignKeyRef object
         * @param {boolean} reverse false: returns (keyCol1, keyCol2)=(s:t:FKCol1,FKCol2) true: returns (FKCol1, FKCol2)=(s:t:keyCol1,keyCol2)
         * @param {boolean} isLeft  true: left join, other values: inner join
         * @return {string} string representation of ForeignKeyRef object
         */
        toString: function (reverse, isLeft){
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

            var joinType = (isLeft === true ? "left": "");
            return joinType + "(" + leftString + ")=(" + rightString + ")";
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
                var self = this, annotation = -1, columnOrder = [], showFKLink = true;
                if (this.annotations.contains(module._annotations.FOREIGN_KEY)) {
                    annotation = module._getAnnotationValueByContext(context, this.annotations.get(module._annotations.FOREIGN_KEY).get("display"));
                }

                columnOrder = _processColumnOrderList(annotation.column_order, this.key.table);
                showFKLink = annotation.show_foreign_key_link;
                if (typeof showFKLink !== "boolean") {
                    showFKLink = module._getHierarchicalDisplayAnnotationValue(
                        self, context, "show_foreign_key_link"
                    );

                    // default true for all the contexts
                    if (typeof showFKLink !== "boolean") {
                        showFKLink = true;
                    }
                }

                this._display[context] = {
                    "columnOrder": columnOrder,
                    "showForeignKeyLinks": showFKLink
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
        this.isArray = jsonType.is_array;

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

    function SourceDefinition(key, obj) {
        this.key = key;
        this.sourceObject = obj;
    }
