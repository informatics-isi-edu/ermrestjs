module.AttributeGroupReference = AttributeGroupReference;
module.AttributeGroupLocation = AttributeGroupLocation;
module.AttributeGroupColumn = AttributeGroupColumn;

/**
 * @namespace ERMrest.AttributeGroupReference
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
    
    this.isAttributeGroup = true;
    
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
    
    this.location = location;
    
    this._server = catalog.server;
    
    this._catalog = catalog;
    
    /**
     * @type {ERMrest.ReferenceAggregateFn}
     */
    this.aggregate = new AttributeGroupReferenceAggregateFn(this);
}
AttributeGroupReference.prototype = {
    
    constructor: AttributeGroupReference,

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
        if (sort) {
            verify((sort instanceof Array), "input should be an array");
            verify(sort.every(module._isValidSortElement), "invalid arguments in array");
        }
        
        // TODO doesn't support sort based on other columns.
        var newLocation = this.location.changeSort(sort);
        return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation, this._catalog);
    },
    
    search: function (term) {
        if (term) {
            verify(typeof term === "string", "Invalid argument");
            term = term.trim();
        }
        
        verify(typeof this.location.searchColumn === "string" && this.location.searchColumn.length > 0, "Location object doesnt have search column.");
        
        var newLocation = this.location.changeSearchTerm(term);
        return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation, this._catalog);
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
            
            if (typeof loc.searchFilter === "string" && loc.searchFilter.length > 0) {
                uri.push(loc.searchFilter);
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
            if (loc.sort && loc.sort.length > 0) {
                uri += loc.sort;
            }
            
            // add page
            if (loc.paging && loc.paging.length > 0) {
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
                    } else if (currRef.location.pagingObject.before) { // has @before()
                        hasPrevious = (response.data.length > limit);
                        hasNext = true;
                    } else { // has @after()
                        hasPrevious = true;
                        hasNext = (response.data.length > limit);
                    }
                }
                
                // Because read() reads one extra row to determine whether the new page has previous or next
                // We need to remove those extra row of data from the result
                if (response.data.length > limit) {
                    // if no paging or @after, remove last row
                    if (!currRef.location.pagingObject || !currRef.location.pagingObject.before)
                        response.data.splice(response.data.length-1);
                   else // @before, remove first row
                        response.data.splice(0, 1);

                }
                
                // create a page using the data
                var page = new AttributeGroupPage(currRef, response.data, hasPrevious, hasNext);
                
                // We are paging based on @before (user navigated backwards in the set of data)
                // AND there is less data than limit implies (beginning of set) 
                // OR we got the right set of data (tuples.length == pageLimit) but there's no previous set (beginning of set)
                if ( (currRef.location.pagingObject && currRef.location.pagingObject.before) && (response.data.length < limit || !hasPrevious) ) {
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
                defer.reject(error);
            });
            
            return defer.promise;
            
        } catch (e) {
            return module._q.reject(e);
        }
        
    },
    
    getAggregates: function (aggregateList) {
        var defer = module._q.defer();
        var url;

        var URL_LENGTH_LIMIT = 2048;

        var urlSet = [];
        var loc = this.location;
        var baseUri = [
            loc.service, "catalog", loc.catalogId, "aggregate", loc.path
        ];
        
        if (typeof loc.searchFilter === "string" && loc.searchFilter.length > 0) {
            baseUri.push(loc.searchFilter);
        }
        
        baseUri = baseUri.join("/") + "/";

        for (var i = 0; i < aggregateList.length; i++) {
            var agg = aggregateList[i];

            // if this is the first aggregate, begin with the baseUri
            if (i === 0) {
                url = baseUri;
            } else {
                url += ",";
            }

            // if adding the next aggregate to the url will push it past url length limit, push url onto the urlSet and reset the working url
            if ((url + i + ":=" + agg).length > URL_LENGTH_LIMIT) {
                // strip off an extra ','
                if (url.charAt(url.length-1) === ',') {
                    url = url.substring(0, url.length-1);
                }

                urlSet.push(url);
                url = baseUri;
            }

            // use i as the alias
            url += i + ":=" + agg;

            // We are at the end of the aggregate list
            if (i+1 === aggregateList.length) {
                urlSet.push(url);
            }
        }

        var aggregatePromises = [];
        var http = this._server._http;
        for (var j = 0; j < urlSet.length; j++) {
            aggregatePromises.push(http.get(urlSet[j]));
        }

        module._q.all(aggregatePromises).then(function getAggregates(response) {
            // all response rows merged into one object
            var singleResponse = {};

            // collect all the data in one object so we can map it to an array
            for (var k = 0; k < response.length; k++) {
                Object.assign(singleResponse, response[k].data[0]);
            }

            var responseArray = [];
            for (var m = 0; m < aggregateList.length; m++) {
                responseArray.push(singleResponse[m]);
            }

            defer.resolve(responseArray);
        }, function error(response) {
            var error = module._responseToError(response);
            return defer.reject(error);
        }).catch(function (error) {
            return defer.reject(error);
        });

        return defer.promise;
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
        
        currRef.location.sortObject.forEach(function (so) {
            // assumes that sortObject columns are valid
            rows.push(self._data[self._data.length-1][so.column]);
        });
        
        var newLocation = currRef.location.changePage({
            before: false,
            row: rows
        });
        return new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation, self.reference._catalog);
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
        
        currRef.location.sortObject.forEach(function (so) {
            // assumes that sortObject columns are valid
            rows.push(self._data[0][so.column]);
        });
        
        var newLocation = currRef.location.changePage({
            before: true,
            row: rows
        });
        return new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation, self.reference._catalog);
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
    
    get data() {
        return this._data;
    },
    
    /**
     * The unique identifier for this tuple composed of the values for each
     * of the shortest key columns concatenated together by an '_'
     *
     * @type {string}
     */
    get uniqueId() {
        if (this._uniqueId === undefined) {
            var data = this._data;
            this._uniqueId = this._page.reference.shortestKey.reduce(function (res, c, index) {
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
            var keyColumns = this._page.reference.shortestKey,
                data = this._data,
                hasNull = false,
                hasMarkdown = false,
                values = [],
                value;
                
            keyColumns.forEach(function (c) {
                hasNull = hasNull || data[c.name] == null;
                if (hasNull) return;
                
                hasMarkdown = hasMarkdown || c.type.name === "markdown";
                values.push(c.formatvalue(data[c.name]));
            });
            
            value = values.join(":");
            
            this._displayname = { 
                "value": hasMarkdown ? module._formatUtils.printMarkdown(value, { inline: true }) : value, 
                "unformatted": value, 
                "isHTML": hasMarkdown 
            };
        }
        return this._displayname;
    }
};

function AttributeGroupColumn(alias, term, displayname, colType, comment, sortable, visible) {
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
     * NOTE: This MUST be url encoded
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
    
    if (typeof colType === 'string') {
        this.type = new Type({typename: colType});
    } else {
        
        /**
         * Type object
         * @type {ERMrest.Type}
         */
        this.type = colType;
    }
    
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
            res += module._fixedEncodeURIComponent(this._alias) + ":=";
        }
        res += this.term;
        return res;
    },
    
    // TODO or alias is required?
    get name() {
        if (typeof this._alias === "string" && this._alias.length !== 0) {
            return this._alias;
        }
        return this.term;
    },
    
    get displayname() {
        return this._displayname;
    },
    
    formatvalue: function (data, options) {
        //TODO should be the same as Column.formatvalue, we should extract the logic of formatvalue and here will just call that
        if (data === null || data === undefined) {
            return "";
        }
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
            return {isHTML: true, value: module._formatUtils.printMarkdown(data, { inline: true })};
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
     * @type {object}
     */
    this.searchObject = searchObject;
    
    if (isObjectAndNotNull(this.searchObject)) {
        /**
         * The search term
         * @type {?string}
         */
        this.searchTerm = this.searchObject.term;
        
        /**
         * The colum name that has been used for searching.
         * NOTE: 
         * - Currently only search on one column, what about other columns?
         * - Maybe this should be private
         * @type {?string}
         */
        this.searchColumn = this.searchObject.column;
        
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
    this.sortObject = sortObject;

    if (isObjectAndNotNull(this.sortObject)) {
        /**
         * The sort midifer string for creating the uri.
         * @type {?string}
         */
        this.sort = _getSortModifier(this.sortObject);
    }
    
    /**
     * Represents the paging. It will be in the following format:
     * {"before":boolean, "row":[v1, v2, v3...]}
     * v1, v2, v3.. are in the same order of columns in the sortObject
     * @private
     * @type {?Object}
     */
    this.pagingObject = pagingObject;
    
    if (isObjectAndNotNull(this.pagingObject)) {
        /**
         * The paging midifer string for creating the uri.
         * @type {?string}
         */
        this.paging = _getPagingModifier(this.pagingObject);
    }
}
AttributeGroupLocation.prototype = {
    constructor: AttributeGroupLocation,
    
    /**
     * Given a searchObject, return a new location object.
     * @param  {string} term
     * @return {ERMRest.AttributeGroupLocation}
     */
    changeSearchTerm: function (term) {
        var searchObject = {"term": term, "column": this.searchColumn};
        return new AttributeGroupLocation(this.service, this.catalogId, this.path, searchObject, this.sortObject, this.pagingObject);
    },
    
    /**
     * Given a sortObject, return a new location object.
     * @param  {object} searchObject 
     * @return {ERMRest.AttributeGroupLocation}
     */
    changeSort: function (sort) {
        return new AttributeGroupLocation(this.service, this.catalogId, this.path, this.searchObject, sort, this.pagingObject);
    },
    
    /**
     * Given a pagingObject, return a new location object.
     * @param  {object} searchObject 
     * @return {ERMRest.AttributeGroupLocation}
     */
    changePage: function (paging) {
        return new AttributeGroupLocation(this.service, this.catalogId, this.path, this.searchObject, this.sortObject, paging);
    }
};


function AttributeGroupReferenceAggregateFn (reference) {
    this._ref = reference;
}

AttributeGroupReferenceAggregateFn.prototype = {
    /**
     * @type {Object}
     * @desc count aggregate representation
     */
    get countAgg() {
        if (this._ref.shortestKey.length > 1) {
            throw new Error("Cannot use count function, attribute group has more than one key column.");
        }
        
        return "cnt_d(" + module._fixedEncodeURIComponent(this._ref.shortestKey[0].term) + ")";
    }
};
