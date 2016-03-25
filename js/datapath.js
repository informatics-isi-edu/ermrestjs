var ERMrest = (function(module) {

    module.DataPath = DataPath;

    function DataPath(table) {

        this.nextAlias = "a"; // TODO better way to doing alias?
        this.catalog = table.schema.catalog;
        this.context = new PathTable(table, this, this.nextAlias);
        this.nextAlias = module._nextChar(this.nextAlias);
        //this.entity = new _Entity(this);

        this.attribute = null;
        this.attributegroup = null;
        this.aggregate = null;
        this.entity._bind(this);

        this.pathtables = [this.context]; // in order
        this._filter = null;

    }

    DataPath.prototype = {
        constructor: module.DataPath,

        copy: function() { // shallow copy
            var dp = Object.create(DataPath.prototype);
            module._clone(dp, this);
            dp.entity._bind(dp);
            return dp;
        },

        // returns a shallow copy of this datapath with filter
        // this datapath is not modified
        getFilter: function (filter) {
            var dp = this.copy();
            dp._filter = filter;
            return dp;
        },

        extend: function (table, context, link) { // TODO context? link?
            if (context !== undefined) {
            }
            this.context = new PathTable(table, this, this.nextAlias);
            this.nextAlias = module._nextChar(this.nextAlias);
            this.pathtables.push(this.context);
            return this.context;
        },

        getUri: function() {
            var uri = "";
            for (var i = 0; i < this.pathtables.length; i++) {
                if (i === 0)
                    uri = this.pathtables[i].toString();
                else
                    uri = uri + "/" + this.pathtables[i].toString();
            }

            // filter strings
            if (this._filter !== null) {
                uri = uri + "/" + this._filter.toUri();
            }

            return uri;

        }

    };

    DataPath.prototype.entity = {
        scope: null,

        _bind: function(scope) {
            this.scope = scope;
        },

        get: function () {
            var baseUri = this.scope.catalog.server.uri;
            var catId = this.scope.catalog.id;
            var uri = baseUri                // base
                + "/catalog/" + catId        // catalog
                + "/entity/"                 // interface
                + this.scope.getUri();   // datapath

            return module._http.get(uri).then(function(response){
                return response.data;
            }, function(response){
                return module._q.reject(response);
            });
        }
    };


    /******************************************************/
    /* PathTable                                          */
    /******************************************************/

    function PathTable(table, datapath, alias) {
        //.datapath
        //.table
        //.columns.length() -> count
        //.columns.names() -> sequence of names ordered by position
        //.columns.get( columnName ) -> pathcolumn
        //.columns.getByPosition( index ) -> pathcolumn

        this._datapath = datapath;
        this._table = table;
        this.alias = alias;
        this.columns = new _Columns(table, this); // pathcolumns
    }

    PathTable.prototype = {
        constructor: PathTable,

        toString: function () {
            return this.alias + ":=" + module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);
        }

    };

    function _Columns(table, pathtable) {
        this._table = table;
        this._pathtable = pathtable;
        this._pathcolumns = {};
    }

    _Columns.prototype = {
        constructor: _Columns,

        push: function(pathcolumn) {
            this._pathcolumns[pathcolumn.column.name] = pathcolumn;
        },

        length: function () {
            return Object.keys(this._pathcolumns).length;
        },

        names: function () { // TODO order by position
            return Object.keys(this._pathcolumns);
        },

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


    /******************************************************/
    /* PathColumn                                         */
    /******************************************************/

    function PathColumn(column, pathtable) {
        //.pathtable
        //.column
        //.operators.length() -> count
        //.operators.names() -> sequence of operatorName
        //.operators.get( operatorName )( rvalue=null ) -> predicate

        this.pathtable = pathtable;
        this.column = column;
        this.operators = new _Operators(); // TODO what is it for?

        this.pathtable.columns.push(this);
    }


    PathColumn.prototype = {
        constructor: PathColumn,

        push: function(operator) {
        }

    };

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

