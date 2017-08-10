/*
 * - Column and Refernce have a lot of arguments, I don't know how to fix that.
 *   The same way we have the location object, we can have something like that here,
 *   which has the service, catalog, path, sort, paging, and search in it. but should we?
 *
 * - Search is currently based on just one column. It's now a object of `column` and `term`,
 *   to make it easier to pass and also be able to pass default search value.
 *
 * - chaise recordset is using the reference.location.searchTerm to get the search term. That's why
 *   I added the location object.
 *   
 */

function AttributeGroupReference(keyColumns, aggregateColumns, location) {
    
    /**
     * Array of AttributeGroupColumn that will be used as the key columns
     * @type {ERMrest.AttributeGroupColumn[]}
     */
    this._keyColumns = keyColumns;
    
    /**
     * Array of AttributeGroupColumn that will be used for the aggregate results
     * @type {ERMrest.AttributeGroupColumn[]}
     */
    this._aggregateColumns = aggregateColumns;
    
    this._location = location;
}
AttributeGroupReference.prototype = {
    
    constructor: AttributeGroupReference,
    
    get location () {
        return this._location;
    },
    
    /**
     * the displayname of the reference
     * TODO not sure if this sis needed
     * @type {object}
     */
    get displayname() {
        //TODO
        notimplemented();
    },
    
    /**
     * Visible columns
     * @type {AttributeGroupColumn[]}
     */
    get columns () {
        if (this._columns === undefined) {
            var self = this;
            this._columns = [];
            
            var addCol = function (col) {
                if (col._visible) {
                    self._columns.push(col);
                }
            };
            
            this._keyColumns.forEach(addCol);
            this._aggregateColumns.forEach(addCol);
            
        }
        return this._columns;
    },
    
    /**
     * The session object from the server
     * @param {Object} session - the session object
     */
    /* jshint ignore:start */
    set session(session) {
        this._session = session;
    },
    /* jshint ignore:end */
    
    sort: function (sort) {
        // TODO verify sort
        var newLocation = this._location.sort(sort);
        return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation);
    },
    
    search: function (term) {
        // TODO verify term
        var newLocation = this._location.search(term);
        return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation);
    },
    
    read: function (limit) {
        //TODO
        /*
        This is how we should create the attributegroup url:
        <service>/catalog/<_catalogId>/attributegroup/<path>/<search>/<_keyColumns>;<_aggregateColumns><sort><page>
         */
        notimplemented();
    }
};

function AttributeGroupPage(reference, data, hasPrevious, hasNext) {
    this.reference = reference;
    this.hasPrevious = hasPrevious;
    this.hasNext = hasNext;
    
    //TODO use the data somehow
}
AttributeGroupPage.prototype = {
    constructor: AttributeGroupPage,
    
    get tuples () {
        //TODO
        notimplemented();
    },
    
    get next() {
        //TODO same reference with the new after
        notimplemented();
    },
    
    get previous() {
        //TODO same reference with the new before
        notimplemented();
    }
};

function AttributeGroupTuple(page, data) {
    this.page = page;
    
    //TODO use the data
}
AttributeGroupTuple.prototype = {
    constructor: AttributeGroupTuple,
    
    // TODO take a look at values comment.
    get isHTML() {
        if (this._isHTML === undefined) {
            var value = this.values;
        }
        return this._isHTML;
    },

    get values() {
        //TODO 
        // returned value should be the same as current tuple.values 
        // or we should make this (https://github.com/informatics-isi-edu/ermrestjs/issues/189) change now?
        // chaise is either way changing it a object with isHTMl and 
        notimplemented();
    },
    
    get uniqueId() {
        //TODO
        notimplemented();
    },
    
    get displayname() {
        //TODO this is the rowname
        notimplemented();
    }
};

function AttributeGroupColumn(alias, name, displayname, type, comment, sortable, visible) {
    /**
     * @private
     * @type {string}
     */
    this._alias = alias;
    
    /**
     * This might include the aggregate functions,
     * should we seperate those?
     * @type {string}
     */
    this._name = name;
    
    /**
     * TODO not sure if it's needed or not
     * @type {object}
     */
    this.displayname = displayname;
    
    /**
     * Type object
     * @type {ERMrest.Type}
     */
    this.type = type;
    
    /**
     * tooltip
     * @type {string}
     */
    this.comment = comment;
    
    /**
     * [sortable description]
     * @type {boolean}
     */
    this.sortable = sortable; // sort only based on current column, what about sort basesd on other columns?
    
    /**
     * We should have a concept of visible columns, this was the easiest way of implementing it to me.
     * @type {boolean}
     */
    this._visible = visible;
}
AttributeGroupColumn.prototype = {
    constructor: AttributeGroupColumn,
    
    // TODO or alias is required? 
    get name() {
        if (typeof this._alias === "string" && this._alias.length !== 0) {
            return this._alias;
        }
        return this._name;
    },
    
    formatvalue: function (data, options) {
        //TODO should be the same as Column.formatvalue
        notimplemented();
    },
    
    formatPresentation: function (data, options) {
        //TODO take cares of markdown_pattern and all, is it needed?
        notimplemented();
    }
};

function AttributeGroupLocation(service, catalog, path, search, sort, paging) {
    /**
     * The uri to ermrest service
     * @type {string}
     */
    this._service = service;
    
    /**
     * id of the catalog
     * @private
     * @type {stirng}
     */
    this._catalogId = catalog;
    
    /**
     * The path that will be used for generating the uri in read.
     * @type {string}
     */
    this._path = path;
    
    /**
     * The search object with "column" and "term".
     * @type {object}
     */
    this._searchObject = search;
    
    /**
     * The sort object. It will be an array of object with the following format:
     * {"column": columnname, "descending": true|false}
     * 
     * @type {?Object[]}
     */
    this._sortObject = sort;
    
    /**
     * Represents the paging. It will be in the following format:
     * {"before":boolean, "row":[v1, v2, v3...]}
     * v1, v2, v3.. are in the same order of columns in the sortObject
     * 
     * @type {Object}
     */
    this._pagingObject = paging;
}
AttributeGroupLocation.prototype = {
    constructor: AttributeGroupLocation,
    
    get searchTerm () {
        return this._searchObject.term;
    },
    
    get searchColumn () {
        return this._searchObject.column;
    },
    
    search: function (term) {
        var newSearch = {"column": this._searchObject.column, "term": term};
        return new AttributeGroupLocation(this._service, this._catalogId, this._path, newSearch, this._sortObject, this._pagingObject);
    },
    
    sort: function (sort) {
        return new AttributeGroupLocation(this._service, this._catalogId, this._path, this._searchObject, sort, this._pagingObject);
    },
    
    changePage: function (paging) {
        return new AttributeGroupLocation(this._service, this._catalogId, this._path, this._searchObject, this._sortObject, paging);
    }
};
