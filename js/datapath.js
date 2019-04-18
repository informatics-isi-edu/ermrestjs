/**
 * @namespace ERMrest.Datapath
 */

    module.DataPath = DataPath;

    /**
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Table} table
     * @constructor
     */
    function DataPath(table) {

        this._nextAlias = "a"; // TODO better way to doing alias?

        /**
         *
         * @type {ERMrest.Catalog}
         */
        this.catalog = table.schema.catalog;

        /**
         *
         * @type {ERMrest.Datapath.PathTable}
         */
        this.context = new PathTable(table, this, this._nextAlias);

        this._nextAlias = module._nextChar(this._nextAlias);

        this.attribute = null;

        this.attributegroup = null;

        this.aggregate = null;

        this.entity._bind(this);

        this._pathtables = [this.context]; // in order

        this._filter = null;

        this.server = this.catalog.server;

    }

    DataPath.prototype = {
        constructor: module.DataPath,

        _copy: function() { // shallow copy
            var dp = Object.create(DataPath.prototype);
            module._shallowCopy(dp, this);
            dp.entity._bind(dp);
            return dp;
        },

        /**
         *
         * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} filter
         * @returns {ERMrest.Datapath.DataPath} a shallow copy of this datapath with filter
         * @desc
         * this datapath is not modified
         */
        filter: function (filter) {
            var dp = this._copy();
            dp._filter = filter;
            return dp;
        },

        /**
         *
         * @param {ERMrest.Table} table
         * @param context
         * @param link
         * @returns {ERMrest.Datapath.PathTable}
         * @desc extend the Datapath with table
         */
        extend: function (table, context, link) { // TODO context? link?
            this.context = new PathTable(table, this, this._nextAlias);
            this._nextAlias = module._nextChar(this._nextAlias);
            this._pathtables.push(this.context);
            return this.context;
        },

        _getUri: function() {
            var uri = "";
            for (var i = 0; i < this._pathtables.length; i++) {
                if (i === 0)
                    uri = this._pathtables[i].toString();
                else
                    uri = uri + "/" + this._pathtables[i].toString();
            }

            // filter strings
            if (this._filter !== null) {
                uri = uri + "/" + this._filter.toUri();
            }

            return uri;

        },

        /**
         * @desc
         * entity container
         */
        entity: {
            scope: null,

            _bind: function(scope) {
                this.scope = scope;
            },

            /**
             * @returns {Promise} promise that returns a row data if resolved or
             *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
             *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
             */
            get: function (contextHeaderParams) {
                var baseUri = this.scope.server.uri;
                var catId = this.scope.catalog.id;
                var uri = baseUri +            // base
                    "/catalog/" + catId +      // catalog
                    "/entity/" +               // interface
                    this.scope._getUri();      // datapath

                if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                    contextHeaderParams = {"action": "get"};
                }
                var headers = {};
                headers[module.contextHeaderName] = contextHeaderParams;
                return this.scope.server.http.get(uri, {headers: headers}).then(function(response){
                    return response.data; // TODO rowset?
                }, function(response){
                    var error = module.responseToError(response);
                    return module._q.reject(error);
                });
            },

            /**
             *
             * @param {ERMrest.Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} filter
             * @desc delete entities
             * @returns {Promise} promise that returns deleted entities if resolved or
             *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
             *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
             */
            delete: function (filter) {
                var baseUri = this.scope.server.uri;
                var catId = this.scope.catalog.id;
                var uri = baseUri +
                    "/catalog/" + catId +
                    "/entity/" +
                    this.scope._getUri();

                uri = uri + "/" + filter.toUri();

                return this.scope.server.http.delete(uri).then(function(response) {
                    return response.data;
                }, function(response) {
                    var error = module.responseToError(response);
                    return module._q.reject(error);
                });
            }
        }

    };


    /**
     *
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Table} table
     * @param {ERMrest.Datapath.DataPath} datapath
     * @param {string} alias
     * @constructor
     */
    function PathTable(table, datapath, alias) {

        /**
         *
         * @type {ERMrest.Datapath.DataPath}
         */
        this.datapath = datapath;

        /**
         *
         * @type {ERMrest.Table}
         */
        this.table = table;

        /**
         *
         * @type {string}
         */
        this.alias = alias;

        /**
         *
         * @type {ERMrest.Datapath.PathColumns}
         */
        this.columns = new PathColumns(table, this); // pathcolumns
    }

    PathTable.prototype = {
        constructor: PathTable,

        /**
         *
         * @returns {string} uri of the PathTable
         */
        toString: function () {
            return this.alias + ":=" + module._fixedEncodeURIComponent(this.table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this.table.name);
        }

    };

    /**
     *
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Table} table
     * @param {ERMrest.Datapath.PathTable} pathtable
     */
    function PathColumns(table, pathtable) {
        this._table = table;
        this._pathtable = pathtable;
        this._pathcolumns = {};
    }

    PathColumns.prototype = {
        constructor: PathColumns,

        _push: function(pathcolumn) {
            this._pathcolumns[pathcolumn.column.name] = pathcolumn;
        },

        /**
         *
         * @returns {Number} number of path columns
         */
        length: function () {
            return Object.keys(this._pathcolumns).length;
        },

        /**
         *
         * @returns {String[]} a list of pathcolumn names
         */
        names: function () { // TODO order by position
            return Object.keys(this._pathcolumns);
        },

        /**
         *
         * @param {string} colName column name
         * @returns {ERMrest.Datapath.PathColumn} returns the PathColumn
         * @throws {ERMrest.Errors.NotFoundError} column not found
         * @desc get PathColumn object by column name
         */
        get: function (colName) {
            if (colName in this._pathcolumns)
                return this._pathcolumns[colName];
            else {
                if (this._table.columns.get(colName)) {
                    // create new PathColumn
                    var pc = new PathColumn(this._table.columns.get(colName), this._pathtable);
                    this._pathcolumns[colName] = pc;
                    return pc;
                } else {
                    throw new module.NotFoundError("", "Column not found in table");
                }
            }
        },

        getByPosition: function (pos) {

        }
    };


    /**
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Column} column
     * @param {ERMrest.Datapath.PathTable} pathtable
     * @constructor
     */
    function PathColumn(column, pathtable) {

        /**
         *
         * @type {ERMrest.Datapath.PathTable}
         */
        this.pathtable = pathtable;

        /**
         *
         * @type {ERMrest.Column}
         */
        this.column = column;

        this.operators = new Operators(); // TODO

        this.pathtable.columns._push(this);
    }

    /**
     *
     * @memberof ERMrest.Datapath
     */
    function Operators() {
        this._operators = {};
    }

    Operators.prototype = {
        constructor: Operators,

        length: function () {
            return Object.keys(this._operators).length;
        },

        names: function () {
            return Object.keys(this._operators);
        },

        get: function (name) {
            return this._operators[name];
        }
    };
