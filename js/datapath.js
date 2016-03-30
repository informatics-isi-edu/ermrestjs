/**
 * @namespace ERMrest.Datapath
 */
var ERMrest = (function(module) {

    module.DataPath = DataPath;

    /**
     * @memberof ERMrest.Datapath
     * @param {Table} table
     * @constructor
     */
    function DataPath(table) {

        this._nextAlias = "a"; // TODO better way to doing alias?
        this.catalog = table.schema.catalog;
        this.context = new PathTable(table, this, this._nextAlias);
        this._nextAlias = module._nextChar(this._nextAlias);
        //this.entity = new _Entity(this);

        this.attribute = null;
        this.attributegroup = null;
        this.aggregate = null;
        this.entity._bind(this);

        this._pathtables = [this.context]; // in order
        this._filter = null;

    }

    DataPath.prototype = {
        constructor: module.DataPath,

        _copy: function() { // shallow copy
            var dp = Object.create(DataPath.prototype);
            module._clone(dp, this);
            dp.entity._bind(dp);
            return dp;
        },

        /**
         *
         * @param {Object} filter
         * @returns {DataPath} a shallow copy of this datapath with filter
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
         * @param {Table} table
         * @param context
         * @param link
         * @returns {PathTable}
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

        }

    };

    /**
     * @memberof ERMrest.Datapath.DataPath
     */
    DataPath.prototype.entity = {
        scope: null,

        _bind: function(scope) {
            this.scope = scope;
        },

        /**
         * @returns {Promise} promise with rowset data
         */
        get: function () {
            var baseUri = this.scope.catalog.server.uri;
            var catId = this.scope.catalog.id;
            var uri = baseUri                // base
                + "/catalog/" + catId        // catalog
                + "/entity/"                 // interface
                + this.scope._getUri();   // datapath

            return module._http.get(uri).then(function(response){
                return response.data;
            }, function(response){
                return module._q.reject(response);
            });
        }
    };


    /**
     *
     * @memberof ERMrest.Datapath
     * @param {Table} table
     * @param {DataPath} datapath
     * @param {string} alias
     * @constructor
     */
    function PathTable(table, datapath, alias) {
        this.datapath = datapath;
        this.table = table;
        this.alias = alias;
        this.columns = new _Columns(table, this); // pathcolumns
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
     * @param {Table} table
     * @param {PathTable} pathtable
     * @private
     */
    function _Columns(table, pathtable) {
        this._table = table;
        this._pathtable = pathtable;
        this._pathcolumns = {};
    }

    _Columns.prototype = {
        constructor: _Columns,

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
         * @returns {Array} a list of pathcolumn names
         */
        names: function () { // TODO order by position
            return Object.keys(this._pathcolumns);
        },

        /**
         *
         * @param {string} colName column name
         * @returns {PathColumn} returns the PathColumn
         */
        get: function (colName) {
            if (colName in this._pathcolumns)
                return this._pathcolumns[colName];
            else {
                // create new PathColumn
                var pc = new PathColumn(this._table.columns.get(colName), this._pathtable);
                this._pathcolumns[colName] = pc;
                return pc;
            }
        },

        getByPosition: function (pos) {

        }
    };


    /**
     * @memberof ERMrest.Datapath
     * @param {Column} column
     * @param {PathTable} pathtable
     * @constructor
     */
    function PathColumn(column, pathtable) {

        this.pathtable = pathtable;
        this.column = column;
        this.operators = new _Operators(); // TODO

        this.pathtable.columns._push(this);
    }


    function _Operators() {
        this._operators = {};
    }

    _Operators.prototype = {
        constructor: _Operators,

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

    return module;

}(ERMrest || {}));

