var ERMrest = (function(module) {

    module.DataPath = function (http, q, table) {
        //.catalog
        //.context : pathtable
        //.copy() -> datapath shallow copy
        //.filter( filter ) -> datapath shallow copy with filter
        //.extend(table, context=null, link=null) -> pathtable

        //.entity.get( filter=null ) -> rowSet
        //.entity.delete( filter=null ) : void

        //.attribute.get( projection, filter=null ) -> rowSet
        //.attribute.delete( projection, filter=null ) : void
        //.attributegroup.get( grouping, projection, filter=null ) -> rowSet
        //.aggregate.get( projection, filter=null ) -> rowSet

        this.catalog = table.schema.catalog;
        this.context = new PathTable(table, this);
        this.entity = new _Entity(http, q, this);

        this.attribute = null;
        this.attributegroup = null;
        this.aggregate = null;

        this.pathtables = [this.context]; // in order

        // example
        // ermrest/catalog/1/<interface>/<datapath>
        // ermrest/catalog/1/entity/slide/scan/id=123
        // interface: entity, attribute, attrgroup, schema, meta ...
        // this.entity = {
        //      get = function(...){}
        //      post = function(..){}
        // };


    };

    module.DataPath.prototype = {
        constructor: module.DataPath,

        copy: function() {

        },

        filter: function (filter) { //

        },

        extend: function (table, context, link) { // TODO context? link?
            if (context !== undefined) {
            }
            this.context = new PathTable(table);
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

            // TODO pathcolumns

            return uri;

        }

    };

    function _Entity(http, q, datapath) {
        this._http = http;
        this._q = q;
        this._datapath = datapath;
    }

    _Entity.prototype = {

        constructor: _Entity,

        get: function (filter) {
            var baseUri = this._datapath.catalog.server.uri;
            var catId = this._datapath.catalog.id;
            var uri = baseUri                // base
                + "/catalog/" + catId        // catalog
                + "/entity/"                 // interface
                + this._datapath.getUri();   // datapath

            if (filter !== undefined)
                uri = uri + "/" + filter.toUri();

            return this._http.get(uri).then(function(response){
                return response.data;
            }, function(response){
                return this._q.reject(response);
            });

        },

        post: function (rowset) {

        },

        put: function (rowset) {

        }

    };

    /******************************************************/
    /* PathTable                                          */
    /******************************************************/

    function PathTable(table, datapath) {
        //.datapath
        //.table
        //.columns.length() -> count
        //.columns.names() -> sequence of names ordered by position
        //.columns.get( columnName ) -> pathcolumn
        //.columns.getByPosition( index ) -> pathcolumn

        this._datapath = datapath;
        this._table = table;
        this.columns = new _Columns(); // pathcolumns
        this.alias
    }

    PathTable.prototype = {
        constructor: PathTable,

        toString: function () {
            return module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);
        }

    };

    function _Columns() {
        this._pathcolumns = {};
    }

    _Columns.prototype = {
        constructor: _Columns,

        push: function(pathcolumn) {
            this._pathcolumns[pathcolumn.column] = pathcolumn; // TODO use col name
        },

        length: function () {
            return Object.keys(this._pathcolumns).length;
        },

        names: function () {
            return Object.keys(this._pathcolumns);
        },

        get: function (colName) {
            // TODO pathtable.columns.get (on demand)
            if (colName in this._pathcolumns)
                return this._pathcolumns[colName];
            else {

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
        this.column = column; // TODO column instance of string name?
        this.operators = new _Operators(); // TODO what is it for?

        pathtable.columns.push(this);
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

