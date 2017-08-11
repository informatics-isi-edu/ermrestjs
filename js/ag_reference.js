/**
 * @namespace ERMrest.AttributeGroupReference
 */

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
 * - read is going to create the uri, it should use the location, keyColumns and aggregateColumns to do so.
 *   It's better if location could have functions to create the uri, like Location prototype in Reference.
 *   but how?
 *   
 */

/**
 * Constructs a Reference object.
 *
 * This object will be the main object that client will interact with, when we want
 * to use ermrset `attributegroup` api. Referencse are immutable and therefore can be
 * safely passed around and used between multiple client components without risk that the
 * underlying reference to server-side resources could change.
 *
 * Usage:
 *  - Clients _do not_ directly access this constructor.
 *  - This will currently be used by the aggregateGroup functions to return a 
 *    AttributeGroupReference rather than a {@link ERMrest.Reference}
 * 
 * @param       {ERMRest.AttributeGroupColumn[]} keyColumns List of columns that will be used as keys for the attributegroup request.
 * @param       {?ERMRest.AttributeGroupColumn[]} aggregateColumns List of columns that will create the aggreagte columns list in the request.
 * @param       {ERMRest.AttributeGroupLocation} location  The location object.
 * @param       {ERMRest.Catalog} catalog  The catalog object.
 * @constructor
 */
function AttributeGroupReference(keyColumns, aggregateColumns, location, catalog) {
    
    /**
     * Array of AttributeGroupColumn that will be used as the key columns
     * @type {ERMrest.AttributeGroupColumn[]}
     */
    this._keyColumns = keyColumns;
    
    /**
     * Array of AttributeGroupColumn that will be used for the aggregate results
     * @type {?ERMrest.AttributeGroupColumn[]}
     */
    this._aggregateColumns = aggregateColumns;
    
    this._location = location;
    
    this._server = catalog.server;
    
    this._catalog = catalog;
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
    
    get shortestKey() {
        return this._keyColumns;
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
    
    /**
     * The attributegroup uri.
     * <service>/catalog/<_catalogId>/attributegroup/<path>/<search>/<_keyColumns>;<_aggregateColumns><sort><page>
     * 
     * NOTE: 
     * - Since this is the object that has knowledge of columns, this should be here.
     *   (we might want to relocate it to the AttributeGroupLocation object.)
     * - ermrest can processs this uri.
     * 
     * @type {string}
     */
    get uri () {
        if (this._uri === undefined) {
            var loc = this.location;
            
            // generate the url
            var uri = [
                loc.service, "catalog", loc.catalogId, "attributegroup", loc.path
            ];
            
            if (typeof loc.searchTerm === "string") {
                uri.push(_convertSearchTermToFilter(loc.searchTerm, loc.searchColumn));
            }
            
            uri = uri.join("/") + "/";
            
            // given an array of columns, return col1,col2,col3
            var colString = function (colArray) {
                return colArray.map(function (col) {
                    return col.toString();
                }).join(",");
            };
            
            // add group columns
            uri += colString(this._keyColumns);
            

            // add aggregate columns
            if (this._aggregateColumns.length !== 0) {
                uri += ";" + colString(this._aggregateColumns);
            }
            
            // add sort
            if (loc.sort) {
                uri += loc.sort;
            }
            
            // add page
            if  (loc.paging) {
                uri += loc.paging;
            }
            
            this._uri = uri;
        }
        return this._uri;
    },
    
    /**
     * 
     * @param  {int=} limit
     * @return {ERMRest.AttributeGroupPage}
     */
    read: function (limit) {
        try {
            var defer = module._q.defer();
            var hasPaging = (typeof limit === "number" && limit > 0);
                
            var uri = this.uri;
            if (hasPaging) {
                uri += "?limit=" + (limit+1);
            }
            
            var currRef = this;
            this._server._http.get(uri).then(function (response) {
                
                //determine hasNext and hasPrevious
                var hasPrevious, hasNext = false;
                if (hasPaging) {
                    if (!currRef.location.paging) { // first page
                        hasPrevious = false;
                        hasNext = (response.data.length > limit);
                    } else if (currRef.location._pagingObject.before) { // has @before()
                        hasPrevious = (response.data.length > limit);
                        hasNext = true;
                    } else { // has @after()
                        hasPrevious = true;
                        hasNext = (response.data.length > limit);
                    }
                }
                
                // create a page using the data
                var page = new AttributeGroupPage(currRef, response.data, hasPrevious, hasNext);
                
                // We are paging based on @before (user navigated backwards in the set of data)
                // AND there is less data than limit implies (beginning of set) 
                // OR we got the right set of data (tuples.length == pageLimit) but there's no previous set (beginning of set)
                if ( (currRef.location._pagingObject && currRef.location._pagingObject.before) && (response.data.length < limit || !hasPrevious) ) {
                    // a new location without paging 
                    var newLocation = currRef.location.changePage();
                    var referenceWithoutPaging = new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation, currRef._catalog);
                    referenceWithoutPaging.read(limit).then(function rereadReference(rereadPage) {
                        defer.resolve(rereadPage);
                    }, function error(err) {
                        throw err;
                    });
                } else {
                    defer.resolve(page);
                }
                
            }).catch(function (response) {
                var error = module._responseToError(response);
                return defer.reject(error);
            });
            
        } catch (e) {
            return module._q.reject(e);
        }
        
    }
};

function AttributeGroupPage(reference, data, hasPrevious, hasNext) {
    /**
     * The page's associated reference.
     * @type {ERMrest.AttributeGroupReference}
     */
    this.reference = reference;
    
    /**
     * Whether there is more entities before this page
     * @returns {boolean}
     */
    this.hasPrevious = hasPrevious;
    
    /**
     * Whether there is more entities after this page
     * @returns {boolean}
     */
    this.hasNext = hasNext;
    
    this._data = data;
}
AttributeGroupPage.prototype = {
    constructor: AttributeGroupPage,
    
    /**
     * An array of processed tuples.
     *
     * Usage:
     * ```
     * for (var i=0, len=page.tuples.length; i<len; i++) {
     *   var tuple = page.tuples[i];
     *   console.log("Tuple:", tuple.displayname.value, "has values:", tuple.values);
     * }
     * ```
     * @type {ERMrest.Tuple[]}
     */
    get tuples () {
        if (this._tuples === undefined) {
            var self = this;
            self._tuples = [];
            this._data.forEach(function (data) {
                self._tuples.push(new AttributeGroupTuple(self, data));
            });
        }
        return this._tuples;
    },
    
    /**
     * A reference to the next set of results.
     *
     * Usage:
     * ```
     * if (reference.next) {
     *   // more tuples in the 'next' direction are available
     *   reference.next.read(10).then(
     *     ...
     *   );
     * }
     * ```
     * @type {ERMrest.AttributeGroupReference|null}
     */
    get next() {
        if (!this.hasNext) {
            return null;
        }
        
        var self = this;
        var currRef = this.reference;
        var rows = [];
        
        currRef.location._sortObject.forEach(function (so) {
            // assumes that sortObject columns are valid
            rows.push(self._data[self._data.length-1][so.column]);
        });
        
        var newLocation = currRef.location.changePage({
            before: false,
            row: rows
        });
        return new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation);
    },
    
    /**
     * A reference to the previous set of results.
     *
     * Usage:
     * ```
     * if (reference.previous) {
     *   // more tuples in the 'previous' direction are available
     *   reference.previous.read(10).then(
     *     ...
     *   );
     * }
     * ```
     * @type {ERMrest.AttributeGroupReference|null}
     */
    get previous() {
        if (!this.hasPrevious) {
            return null;
        }
        
        var self = this;
        var currRef = this.reference;
        var rows = [];
        
        currRef.location._sortObject.forEach(function (so) {
            // assumes that sortObject columns are valid
            rows.push(self._data[0][so.column]);
        });
        
        var newLocation = currRef.location.changePage({
            before: false,
            row: rows
        });
        return new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation);
    }
};

function AttributeGroupTuple(page, data) {
    this._page = page;
    this._data = data;
}
AttributeGroupTuple.prototype = {
    constructor: AttributeGroupTuple,
    
    /**
     * The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
     * values in the array matches the ordering of the columns in the
     * reference (see {@link ERMrest.Reference#columns}).
     * TODO Eventually should be refactored (https://github.com/informatics-isi-edu/ermrestjs/issues/189).
     * 
     * @type {boolean[]}
     */
    get isHTML() {
        if (this._isHTML === undefined) {
            // will populate the this._isHTML
            var value = this.values;
        }
        return this._isHTML;
    },

    get values() {
        if (this._values === undefined) {
            this._values = [];
            this._isHTML = [];
            
            var columns = this._page.reference.columns, self = this;
            var formattedValues = module._getFormattedKeyValues(columns, undefined, this._data);
            var presentation;
            
            columns.forEach(function (col) {
                presentation = col.formatPresentation(formattedValues[col.name], {formattedValues: formattedValues});
                self._values.push(presentation.value);
                self._isHTML.push(presentation.isHTML);
            });
            
        }
        return this._values;
    },
    
    /**
     * The unique identifier for this tuple composed of the values for each
     * of the shortest key columns concatenated together by an '_'
     *
     * @type {string}
     */
    get uniqueId() {
        if (this._uniqueId === undefined) {
            this._uniqueId = this.reference.shortestKey.reduce(function (res, c, index) {
                return res + (index > 0 ? "_" : "") + c.formatvalue(data[c.name]);
            }, "");
        }
        return this._uniqueId;
    },
    
    
    /**
     * The _display name_ of this tuple. currently it will be values of 
     * key columns concatenated together by `_`.
     * 
     * Usage:
     * ```
     * console.log("This tuple has a displayable name of ", tuple.displayname.value);
     * ```
     * @type {string}
     */
    get displayname() {
        if (this._displayname === undefined) {
            var value = this.reference.shortestKey.reduce(function (res, c, index) {
                return res + (index > 0 ? ":" : "") + c.formatvalue(data[c.name]);
            }, "");
            
            this._displayname = { "value": value, "unformatted": value, "isHTML": false };
        }
        return this._displayname;
    }
};

function AttributeGroupColumn(alias, term, displayname, type, comment, sortable, visible) {
    /**
     * The alias for the column.
     * The alias might be undefined. If it's aggregate column and it has an aggregate function
     * then this will be required by ermrest, but we're not checking anything here...
     * 
     * @private
     * @type {string}
     */
    this._alias = alias;
    
    /**
     * This might include the aggregate functions. This is the right side of alias (alias:=term)
     * NOTE: We might want to seperate those, but right now this will only be used for 
     * creating the url.
     * @type {string}
     */
    this.term = term;
    
    if (typeof displayname === 'string') {
        this._displayname = {"value": displayname, "unformatted": displayname, "isHTML": false};
    } else if (isObjectAndNotNull(displayname)){
        this._displayname = displayname;
    }
    
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
    
    toString: function () {
        var res = "";
        if (typeof this._alias === "string" && this._alias.length !== 0) {
            res += this._alias += ":=";
        }
        res += this._term;
        return res;
    },
    
    // TODO or alias is required?
    get name() {
        if (typeof this._alias === "string" && this._alias.length !== 0) {
            return this._alias;
        }
        return this._name;
    },
    
    get displayname() {
        return this._displayname;
    },
    
    formatvalue: function (data, options) {
        //TODO should be the same as Column.formatvalue, we should extract the logic of formatvalue and here will just call that
        return _formatValueByType(this.type, data, options);
    },
    
    formatPresentation: function (data, options) {
        /*
         * NOTE: currently will only return the given data. This function exist 
         * so it will be the same pattern as Reference and Column apis.
         * Eventually this also will be used for a case that we want to return rowName,
         * Although in that case we need to have the Table object. We can pass the Table object
         * to this, but the next problem will be the name of columns. The keys in the data object
         * are aliases and not the actual column names in the table.
         * 
         */
        if (this.type.name === "markdown") {
            return {isHTML: true, value: module._formatUtils.printMarkdown(value)};
        }
        return {isHTML: false, value: data};
    }
};

function AttributeGroupLocation(service, catalog, path, searchObject, sortObject, pagingObject) {
    /**
     * The uri to ermrest service
     * @type {string}
     */
    this.service = service;
    
    /**
     * id of the catalog
     *
     * @type {stirng}
     */
    this.catalogId = catalog;
    
    /**
     * The path that will be used for generating the uri in read.
     * @type {string}
     */
    this.path = path;
    
    /**
     * The search object with "column" and "term".
     * @private
     * @type {?object}
     */
    this._searchObject = searchObject;
    
    if (isObjectAndNotNull(this._searchObject)) {
        /**
         * The search term
         * @type {?string}
         */
        this.searchTerm = this._searchObject.term;
        
        /**
         * The colum name that has been used for searching.
         * NOTE: currently only search on the same column, what about other columns?
         * @type {?string}
         */
        this.searchColumn = this._searchObject.column;
        
        /**
         * The search filter string which can be used for creating the uri
         * @type {?string}
         */
        this.searchFilter = _convertSearchTermToFilter(this.searchTerm, this.searchColumn);
    }
    
    /**
     * The sort object. It will be an array of object with the following format:
     * {"column": columnname, "descending": true|false}
     * @private
     * @type {?Object[]}
     */
    this._sortObject = sortObject;
    
    if (isObjectAndNotNull(this._sortObject)) {
        /**
         * The sort midifer string for creating the uri.
         * @type {?string}
         */
        this.sort = _getSortModifier(this._sortObject);
    }
    
    /**
     * Represents the paging. It will be in the following format:
     * {"before":boolean, "row":[v1, v2, v3...]}
     * v1, v2, v3.. are in the same order of columns in the sortObject
     * @private
     * @type {?Object}
     */
    this._pagingObject = pagingObject;
    
    if (isObjectAndNotNull(this._pagingObject)) {
        /**
         * The paging midifer string for creating the uri.
         * @type {?string}
         */
        this.paging = _getPagingModifier(this._pagingObject);
    }
}
AttributeGroupLocation.prototype = {
    constructor: AttributeGroupLocation,
    
    changeSearch: function (searchObject) {
        return new AttributeGroupLocation(this._service, this._catalogId, this._path, searchObject, this._sortObject, this._pagingObject);
    },
    
    changeSort: function (sort) {
        return new AttributeGroupLocation(this._service, this._catalogId, this._path, this._searchObject, sort, this._pagingObject);
    },
    
    changePage: function (paging) {
        return new AttributeGroupLocation(this._service, this._catalogId, this._path, this._searchObject, this._sortObject, paging);
    }
};
