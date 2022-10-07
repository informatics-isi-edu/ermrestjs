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
 *  - Clients can use this constructor to create attribute group references if needed.
 *  - This will currently be used by the aggregateGroup functions to return a
 *    AttributeGroupReference rather than a {@link ERMrest.Reference}
 *
 * @param       {ERMRest.AttributeGroupColumn[]} keyColumns List of columns that will be used as keys for the attributegroup request.
 * @param       {?ERMRest.AttributeGroupColumn[]} aggregateColumns List of columns that will create the aggreagte columns list in the request.
 * @param       {ERMRest.AttributeGroupLocation} location  The location object.
 * @param       {ERMRest.Catalog} catalog  The catalog object.
 * @param       {ERMRest.Table} sourceTable The table object that represents this AG reference
 * @param       {String} context The context that this reference is used in
 * @constructor
 * @memberof ERMrest
 */
function AttributeGroupReference(keyColumns, aggregateColumns, location, catalog, sourceTable, context) {

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

    this._allColumns = keyColumns.concat(aggregateColumns);

    this.location = location;

    this._server = catalog.server;

    this._catalog = catalog;

    this.table = sourceTable;

    /**
     * @type {ERMrest.ReferenceAggregateFn}
     */
    this.aggregate = new AttributeGroupReferenceAggregateFn(this);

    // column objects are created before the refernece.
    // This makes sure that the columns are used in the context that reference is
    // NOTE this is mutating the columns that are passed to it. Columns should not
    // be shared between references with different contexts
    if (typeof context === "string") {
        this._context = context;
        this._allColumns.forEach(function (c) {
            c._setContext(context);
        });
    }

    // this will force calling the uri api and therefore verifies the modifiers and location.
    var uri = this.uri;
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
                if (col.visible) {
                    self._columns.push(col);
                }
            };

            this._keyColumns.forEach(addCol);
            this._aggregateColumns.forEach(addCol);

        }
        return this._columns;
    },

    /**
     * Returns the visible key columns
     * @type {ERMrest.AttributeGroupColumn[]}
     */
    get shortestKey() {
        return this._keyColumns.filter(function (kc) {
            return kc.visible;
        });
    },

    sort: function (sort) {
        if (sort) {
            verify((sort instanceof Array), "input should be an array");
            verify(sort.every(module._isValidSortElement), "invalid arguments in array");
        }

        // TODO doesn't support sort based on other columns.
        var newLocation = this.location.changeSort(sort);
        return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation, this._catalog, this.table, this._context);
    },

    search: function (term) {
        if (term) {
            verify(typeof term === "string", "Invalid argument");
            term = term.trim();
        }

        verify(typeof this.location.searchColumn === "string" && this.location.searchColumn.length > 0, "Location object doesnt have search column.");

        var newLocation = this.location.changeSearchTerm(term);
        return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation, this._catalog, this.table, this._context);
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

             this._uri = [
                 loc.service, "catalog", loc.catalog.id, "attributegroup", this.ermrestPath
             ].join("/");
         }
         return this._uri;
     },

     /**
      * This will generate a new unfiltered reference each time.
      * Returns a reference that points to all entities of current table
      *
      * @type {ERMrest.Reference}
      */
     get unfilteredReference() {
         verify(this.table, "table is not defined for current reference");
         var newLocation = new AttributeGroupLocation(this.location.service, this.location.catalog, [module._fixedEncodeURIComponent(this.table.schema.name),module._fixedEncodeURIComponent(this.table.name)].join(":"));
         return new AttributeGroupReference(this._keyColumns, this._aggregateColumns, newLocation, this._catalog, this.table, this._context);
     },

     /**
      * The second part of Attributegroup uri.
      * <path>/<search>/<_keyColumns>;<_aggregateColumns><sort><page>
      *
      * NOTE:
      * - Since this is the object that has knowledge of columns, this should be here.
      *   (we might want to relocate it to the AttributeGroupLocation object.)
      * - ermrest can processs this uri.
      *
      * @type {string}
      */
     get ermrestPath () {
         if (this._ermrestPath === undefined) {
             var loc = this.location, self = this;

             // given an array of columns, return col1,col2,col3
             var colString = function (colArray) {
                 return colArray.map(function (col) {
                     return col.toString();
                 }).join(",");
             };

             var keyColumns = self._keyColumns.map(function (col) {
                 return col.toString();
             });

             // generate the url
             var uri = loc.path;

             if (typeof loc.searchFilter === "string" && loc.searchFilter.length > 0) {
                 uri += "/" + loc.searchFilter;
             }

             uri += "/";

             // make sure page object and sort are compatible
             if ((loc.afterObject && loc.afterObject.length !== self.ermrestSortObject.length) ||
                (loc.beforeObject && loc.beforeObject.length !== self.ermrestSortObject.length)) {
                 throw new module.MalformedURIError("The given page options are not compatible with sort criteria (Attributegroup Reference).");
             }

             // add extra sort columns to the key
             self.ermrestSortObject.forEach(function (so) {
                 // if the column doesn't exist, add it
                 var k = self._allColumns.filter(function (col) {
                     return col.name == so.column;
                 })[0];

                 if (k) return;

                 keyColumns.push(
                     module._fixedEncodeURIComponent(so.column) + ":=" + module._fixedEncodeURIComponent(so.term)
                 );
             });

             uri += keyColumns.join(",");

             // add aggregate columns
             if (self._aggregateColumns.length !== 0) {
                 uri += ";" + colString(self._aggregateColumns);
             }

             // add sort
             if (self.ermrestSortObject.length > 0) {
                 uri += _getSortModifier(self.ermrestSortObject);
             }

             // add page
             if (loc.paging && loc.paging.length > 0) {
                 uri += loc.paging;
             }

             self._ermrestPath = uri;
         }
         return this._ermrestPath;
     },

     get ermrestSortObject() {
         if (this._ermrestSortObject === undefined) {
             var self = this, loc = this.location;

             self._ermrestSortObject = [];
             if (Array.isArray(loc.sortObject)) {
                 // given a column name, tries to find it in the list of column (by term),
                 // if not found, it will add it by appending a alias to it.
                 // It will also return the used alias.
                 var alias = 0;
                 var allColumnNames = self._allColumns.map(function (col) {
                     return col.name;
                 });
                 var getAlias = function (colName) {
                     var col = self._allColumns.filter(function (c) {
                         return decodeURIComponent(c.term) === colName;
                     })[0];

                     // column is not in the list of defined columns, we should add it
                     if (col === undefined) {
                        while (allColumnNames.indexOf(alias.toString()) !== -1) {
                            ++alias;
                        }
                        return (alias++).toString();
                     }
                     return col.name;
                 };

                 var col, sortColNames = {}, addedCols = {}, desc, name;
                 loc.sortObject.forEach(function (so) {

                     // find the oclumn
                     try {
                         col = self.getColumnByName(so.column);
                     } catch(e) {
                         throw new module.MalformedURIError("The sort criteria is invalid. Column `" + so.column +"` was not found (Attributegroup Reference).");
                     }

                     // don't add duplciates
                     if (col.name in sortColNames) return;
                     sortColNames[col.name] = true;

                     // make sure column is sortable
                     if(!col.sortable) {
                         throw new module.MalformedURIError("column '" + col.name + "' is not sortable (Attributegroup)");
                     }

                     // go through list of sort columns and add them to the key
                     col._sortColumns.forEach(function (sc) {
                         if (sc.column in addedCols) return;
                         addedCols[sc.column] = true;

                         // add to key columns if needed (won't add duplicates)
                         name = getAlias(sc.column);

                         desc = (so.descending === true);
                         if (sc.descending) desc = !desc;

                         // add to sort criteria
                         self._ermrestSortObject.push({
                             column: name,
                             descending: desc,
                             term: sc.column
                         });
                     });
                 });
             }
         }
         return this._ermrestSortObject;
     },

    /**
     *
     * @param  {int=} limit
     * @param {Object=} contextHeaderParams the object that we want to log.
     * @param {Boolean=} dontCorrectPage whether we should modify the page.
     * If there's a @before in url and the number of results is less than the
     * given limit, we will remove the @before and run the read again. Setting
     * dontCorrectPage to true, will not do this extra check.
     * @return {ERMRest.AttributeGroupPage}
     */
    read: function (limit, contextHeaderParams, dontCorrectPage) {
        try {
            var defer = module._q.defer();
            var hasPaging = (typeof limit === "number" && limit > 0);

            var uri = this.uri;
            if (hasPaging) {
                uri += "?limit=" + (limit+1);
            }

            var currRef = this, action = "read";
            if (!contextHeaderParams || !isObject(contextHeaderParams)) {
                contextHeaderParams = {"action": action};
            } else if (typeof contextHeaderParams.action === "string") {
                action = contextHeaderParams.action;
            }
            var config = {
                headers: this._generateContextHeader(contextHeaderParams, limit)
            };
            this._server.http.get(uri, config).then(function (response) {

                //determine hasNext and hasPrevious
                var hasPrevious, hasNext = false;
                if (hasPaging) {
                    if (!currRef.location.paging) { // first page
                        hasPrevious = false;
                        hasNext = (response.data.length > limit);
                    } else if (currRef.location.beforeObject) { // has @before()
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
                    if (!currRef.location.beforeObject)
                        response.data.splice(response.data.length-1);
                   else // @before, remove first row
                        response.data.splice(0, 1);

                }

                // create a page using the data
                var page = new AttributeGroupPage(currRef, response.data, hasPrevious, hasNext);

                // We are paging based on @before (user navigated backwards in the set of data)
                // AND there is less data than limit implies (beginning of set)
                // OR we got the right set of data (tuples.length == pageLimit) but there's no previous set (beginning of set)
                if (dontCorrectPage !== true && currRef.location.beforeObject && (response.data.length < limit || !hasPrevious) ) {
                    // a new location without paging
                    var newLocation = currRef.location.changePage();
                    var referenceWithoutPaging = new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation, currRef._catalog, currRef.table, currRef._context);

                    // remove the function and replace it with auto-reload
                    contextHeaderParams.action = action.substring(0,action.lastIndexOf(";")+1) + "auto-reload";
                    referenceWithoutPaging.read(limit, contextHeaderParams).then(function rereadReference(rereadPage) {
                        defer.resolve(rereadPage);
                    }, function error(err) {
                        throw err;
                    });
                } else {
                    defer.resolve(page);
                }

            }).catch(function (response) {
                var error = module.responseToError(response);
                defer.reject(error);
            });

            return defer.promise;

        } catch (e) {
            return module._q.reject(e);
        }

    },

    getAggregates: function (aggregateList, contextHeaderParams) {
        var defer = module._q.defer();
        var url;
        var urlSet = [];
        var loc = this.location;

        // create the context header params for log
        if (!contextHeaderParams || !isObject(contextHeaderParams)) {
            contextHeaderParams = {"action": "aggregate"};
        }
        var config = {
            headers: this._generateContextHeader(contextHeaderParams)
        };
        var baseUri = loc.path;
        if (typeof loc.searchFilter === "string" && loc.searchFilter.length > 0) {
            baseUri += "/" + loc.searchFilter;
        }
        baseUri += "/";

        for (var i = 0; i < aggregateList.length; i++) {
            var agg = aggregateList[i];

            // if this is the first aggregate, begin with the baseUri
            if (i === 0) {
                url = baseUri;
            } else {
                url += ",";
            }

            // if adding the next aggregate to the url will push it past url length limit, push url onto the urlSet and reset the working url
            if ((url + i + ":=" + agg).length > module.URL_PATH_LENGTH_LIMIT) {
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
        var http = this._server.http;
        for (var j = 0; j < urlSet.length; j++) {
            aggregatePromises.push(http.get(loc.service + "/catalog/" + loc.catalog.id + "/aggregate/" + urlSet[j], config));
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
            var error = module.responseToError(response);
            return defer.reject(error);
        }).catch(function (error) {
            return defer.reject(error);
        });

        return defer.promise;
    },

    /**
     * Find a column in list of key and aggregate columns.
     * @param  {string} name the column name
     * @return {ERMrest.AttributeGroupColumn}
     */
    getColumnByName: function (name) {

        var findCol = function (list) {
            for (i = 0; i < list.length; i++) {
                if (list[i].name === name) {
                    return list[i];
                }
            }
            return false;
        };

        var c = findCol(this._allColumns);
        if (c) {
            return c;
        }
        throw new module.NotFoundError("", "Column " + name + " not found.");
    },

    /**
     * The default information that we want to be logged including catalog, schema_table, and facet (filter).
     * @type {Object}
     */
    get defaultLogInfo() {
        var obj = {};
        obj.catalog = this._catalog.id;
        if (this.table) {
            obj.schema_table = this.table.schema.name + ":" + this.table.name;
        }
        return obj;
    },

    /**
     * The filter information that should be logged
     * Currently only includes the search term.
     * @type {Object}
     */
    get filterLogInfo() {
        var obj = {};
        if (isObjectAndNotNull(this.location.searchObject) && typeof this.location.searchTerm === "string" && this.location.searchTerm) {
            obj.filters = _compressFacetObject({"and": [{"source": "search-box", "search": [this.location.searchTerm]}]});
        }
        return obj;
    },

    _generateContextHeader: function (contextHeaderParams, page_size) {
        if (!contextHeaderParams || !isObject(contextHeaderParams)) {
            contextHeaderParams = {};
        }

        for (var key in this.defaultLogInfo) {
            // only add the values that are not defined.
            if (key in contextHeaderParams) continue;
            contextHeaderParams[key] = this.defaultLogInfo[key];
        }

        if (Number.isInteger(page_size)) {
            contextHeaderParams.page_size = page_size;
        }

        var headers = {};
        headers[module.contextHeaderName] = contextHeaderParams;
        return headers;
    },
};


/**
 * @namespace ERMrest.AttributeGroupPage
 */

/**
 * Constructs a AttributeGroupPage object. A _page_ represents a set of results returned from
 * ERMrest. It may not represent the complete set of results. There is an
 * iterator pattern used here, where its {@link ERMrest.AttributeGroupPage#previous} and
 * {@link ERMrest.AttributeGroupPage#next} properties will give the client a
 * {@link ERMrest.AttributeGroupReference} to the previous and next set of results,
 * respectively.
 *
 * Usage:
 *  - Clients _do not_ directly access this constructor.
 *  - This will currently be used by the AggregateGroupReference to return a
 *    AttributeGroupPage rather than a {@link ERMrest.Page}
 *  See {@link ERMrest.AttributeGroupReference#read}.
 *
 * @param       {ERMRest.AttributeGroupReference} reference aggregate reference representing the data for this page
 * @param       {!Object[]} data The data returned from ERMrest
 * @param       {Boolean} hasPrevious Whether database has some data before current page
 * @param       {Boolean} hasNext     Whether database has some data after current page
 * @constructor
 * @memberof ERMrest
 */
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
     * @type {ERMrest.AttributeGroupTuple[]}
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
     * the page length (number of rows in the page)
     * @type {integer}
     */
     get length() {
        if (this._length === undefined) {
            this._length = this._data.length;
        }
        return this._length;
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
        if (this.hasNext) {
            return this._getSiblingReference(true);
        }
        return null;
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
        if (this.hasPrevious) {
            return this._getSiblingReference(false);
        }
        return null;
    },

    // return a reference to the next or previous page.
    _getSiblingReference: function (next) {
        var self = this;
        var currRef = this.reference;
        var rows = [];

        if (!Array.isArray(currRef.ermrestSortObject) || currRef.ermrestSortObject === 0) {
            return null;
        }

        if (!self._data || self._data.length === 0) {
            return null;
        }

        var rowIndex = next ? self._data.length-1 : 0;

        var pageValues = [], data = self._data[rowIndex], name;
        for (var i = 0; i < currRef.ermrestSortObject.length; i++) {
            name = currRef.ermrestSortObject[i].column;
            pageValues.push(data[name]);
        }

        if (pageValues === null) {
            return null;
        }

        var newLocation;
        if (next) {
            newLocation = currRef.location.changePage(pageValues, null);
        } else {
            newLocation = currRef.location.changePage(null, pageValues);
        }
        return new AttributeGroupReference(currRef._keyColumns, currRef._aggregateColumns, newLocation, currRef._catalog, currRef.table, currRef._context);
    }
};


/**
 * @namespace ERMrest.AttributeGroupTuple
 */

/**
 * Constructs a new Tuple. In database jargon, a tuple is a row in a
 * relation. This object represents a row returned by a query to ERMrest.
 *
 * Usage:
 *  Clients _do not_ directly access this constructor.
 *  See {@link ERMrest.AttributeGroupPage#tuples}.
 *
 * @param        {!ERMrest.AttributeGroupPage} page The Page object from which this data was acquired.
 * @param        {!Object} data The unprocessed tuple of data returned from ERMrest.
 * @constructor
 * @memberof ERMrest
 */
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

            var columns = this._page.reference.columns,
                context = this._page.reference._context,
                self = this, templateVariables = {}, k, v;
            columns.forEach(function (col) {
                if (!(col.name in self._data)) return;
                k = col.name;
                v = col.formatvalue(self._data[k], context);
                templateVariables[k] = v;
                templateVariables["_" + k] = self._data[k];
            });

            var presentation;

            columns.forEach(function (col) {
                presentation = col.formatPresentation(self._data, context, templateVariables);
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
            var data = this._data, hasNull, self = this;
            this._uniqueId = self._page.reference.shortestKey.reduce(function (res, c, index) {
                hasNull = hasNull || data[c.name] == null;
                return res + (index > 0 ? "_" : "") + data[c.name];
            }, "");

            //TODO should be evaluated for composite keys
            // might need to change, but for the current usecase it's fine.
            if (hasNull) {
                this._uniqueId = null;
            }
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
                self = this,
                hasNull = false,
                hasMarkdown = false,
                values = [],
                value;

            keyColumns.forEach(function (c) {
                hasNull = hasNull || data[c.name] == null;
                if (hasNull) return;

                hasMarkdown = hasMarkdown || (module._HTMLColumnType.indexOf(c.type.name) != -1);
                values.push(c.formatvalue(data[c.name], self._page.reference._context));
            });

            value = hasNull ? null: values.join(":");

            this._displayname = {
                "value": hasMarkdown ? module.renderMarkdown(value, true) : value,
                "unformatted": value,
                "isHTML": hasMarkdown
            };
        }
        return this._displayname;
    }
};

/**
 * Constructor for creating a column for creating a {@link ERMrest.AttributeGroupReference}
 *
 * NOTE If you're passing baseColumn, we're assuming that the location path is ending
 * in the table that this column belongs too. This assumption exists for sort logic.
 * This because we're looking at the column_order of the baseColumn and we're appending
 * them to the key columns. Now if that column is not in the table, this will not work.
 * If that is not the case, you need to disable the sort.
 *
 * @param       {string} alias the alias that we want to use. If alias exist we will use the alias=term for creating url.
 * @param       {string} term  the term string, e.g., cnt(*) or col1.
 * @param       {ERMrest.Column} baseColumn the database column that this is based on
 * @param       {Object|string} displayname displayname of column, if it's an object it will have `value`, `unformatted`, and `isHTML`
 * @param       {ERMrset.Type} colType    type of column
 * @param       {string} comment     The string for comment (tooltip)
 * @param       {Boolean} sortable   Whether the column is sortable
 * @param       {Boolean} visible    Whether we want this column be returned in the tuples
 * @constructor
 */
function AttributeGroupColumn(alias, term, baseColumn, displayname, colType, comment, sortable, visible) {
    /**
     * The alias for the column.
     * The alias might be undefined. If it's aggregate column and it has an aggregate function
     * then this will be required by ermrest, but we're not checking anything here...
     *
     * @type {string}
     * @private
     */
    this._alias = alias;

    /**
     * This might include the aggregate functions. This is the right side of alias (alias:=term)
     * NOTE:
     * - This MUST be url encoded. We're not going to encode this.
     * - We might want to seperate the aggreagte function and column, but right now this will only be used for
     * creating the url.
     * - Since it can include characters like `*`, we cannot encode this. We assume that
     * this has been encoded before and we're just passing it to the ermrest.
     *   We might want to apply the same rule to every other places that we're passing the column names.
     *
     * @type {string}
     */
    this.term = term;

    /**
     * The database column that this is based on. It might not be defined.
     * @type {ERMrest.Column}
     */
    this.baseColumn = baseColumn;


    if (typeof displayname === 'string') {
        this._displayname = {"value": displayname, "unformatted": displayname, "isHTML": false};
    } else if (isObjectAndNotNull(displayname)){
        this._displayname = displayname;
    } else if (baseColumn) {
        this._displayname = baseColumn.displayname;
    }


    if (typeof colType === 'string') {
        this.type = new Type({typename: colType});
    } else if (baseColumn){
        this.type = baseColumn.type;
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

    if (sortable === false) {
        this._sortable = false;
        this._sortColumns_cached = [];
    }

    /**
     * We should have a concept of visible columns, this was the easiest way of implementing it to me.
     * @type {boolean}
     */
    this.visible = visible;
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

    /**
     * name of the column that is being used in projection list.
     * If alias exists, it will return alias, otherwise the decoded version of term.
     * @type {string}
     */
    get name() {
        if (this._name === undefined) {
            if (typeof this._alias === "string" && this._alias.length !== 0) {
                this._name = this._alias;
            } else {
                this._name = decodeURIComponent(this.term);
            }
        }
        return this._name;
    },

    get displayname() {
        return this._displayname;
    },

    formatvalue: function (data, context, options) {
        if (data === null || data === undefined) {
            return null;
        }

        if (this.baseColumn) {
            return this.baseColumn.formatvalue(data, context, options);
        }
        return _formatValueByType(this.type, data, options);
    },

    formatPresentation: function (data, context, templateVariables, options) {
        data = data || {};

        var formattedValue = this.formatvalue(data[this.name], context, options);

        /*
         * NOTE: currently will only return the given data. This function exist
         * so it will be the same pattern as Reference and Column apis.
         * Eventually this also will be used for a case that we want to return rowName,
         * Although in that case we need to have the Table object. We can pass the Table object
         * to this, but the next problem will be the name of columns. The keys in the data object
         * are aliases and not the actual column names in the table.
         *
         */
        if (module._HTMLColumnType.indexOf(this.type.name) != -1) {
            return {isHTML: true, value: module.renderMarkdown(formattedValue, true), unformatted: formattedValue};
        }
        return {isHTML: false, value: formattedValue, unformatted: formattedValue};
    },

    /**
     * @desc An array of objects that have `column` which is column name (this is different from other sortColumns),
     * and `descending` which is true/fals. The `descending` boolean indicates whether we should change the direction of sort or not.
     * The column name is going to be database column names (equivalent to this.term)
     *
     * - if sortable passed as false, it will be empty.
     * - if baseColumn exists, it will return the column order of baseColumn
     * - otherwise the current column
     * @type {Object[]}
     */
    get _sortColumns() {
        if (this._sortColumns_cached === undefined) {
            this._determineSortable();
        }
        return this._sortColumns_cached;
    },

    /**
     * whether the column can be sorted or not
     * - if sortable passed as false, it will be false
     * - if baseColumn exists, it will return the column order of baseColumn
     * - otherwise it will be true
     * @type {boolean}
     */
    get sortable() {
        if (this._sortable === undefined) {
            this._determineSortable();
        }
        return this._sortable;
    },

    _determineSortable: function () {
        this._sortColumns_cached = [{column: decodeURIComponent(this.term), descending: false}];
        this._sortable = true;

        if (!this.baseColumn) return;

        var baseSortCols = this.baseColumn._getSortColumns(this._context);
        if (typeof baseSortCols === 'undefined') {
            this._sortColumns_cached = [];
            this._sortable = false;
            return;
        }

        this._sortColumns_cached = baseSortCols.map(function (ro) {
            return {"column": ro.column.name, "descending": ro.descending};
        });
    },

    /**
     * sets the context of column
     * @private
     */
    _setContext: function (context) {
        this._context = context;
    }
};

/**
 * Constructor for creating location object for creating a {@link ERMrest.AttributeGroupReference}

 * @param       {string} service      the service part of url
 * @param       {ERMrest.catalog} catalog      the catalog object
 * @param       {String} path         the whole path string
 * @param       {Object} searchObject search obect, it should have `term`, and `column`.
 * @param       {Object[]} sortObject sort object, An array of objects with `column`, and `descending` as attribute.
 * @param       {Object[]} afterObject  the object that will be used for paging to define after. It's an array of data
 * @param       {Object[]} beforeObject the object that will be used for paging to define before. It's an array of data
 * @constructor
 */
function AttributeGroupLocation(service, catalog, path, searchObject, sortObject, afterObject, beforeObject) {
    /**
     * The uri to ermrest service
     * @type {string}
     */
    this.service = service;

    /**
     * catalog object
     *
     * @type {ERMrest.Catalog}
     */
    this.catalog = catalog;

    /**
     * The path that will be used for generating the uri in read.
     * @type {string}
     */
    this.path = path;

    /**
     * The search object with "column" and "term".
     * @type {object}
     * @private
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
         * - we're going to encode this name. You don't have to encode it.
         * - Currently only search on one column, what about other columns?
         * - Maybe this should be private
         * @type {?string}
         */
        this.searchColumn = this.searchObject.column;

        /**
         * The search filter string which can be used for creating the uri
         * @type {?string}
         */
        this.searchFilter = _convertSearchTermToFilter(this.searchTerm, this.searchColumn, this.catalog);
    }

    /**
    * The sort object. It will be an array of object with the following format:
    * {"column": columnname, "descending": true|false}
    * @type {?Object[]}
    * @private
    */
    this.sortObject = sortObject;

    /**
     * Represents the paging. It will be an array of values.
     * v1, v2, v3.. are in the same order of columns in the sortObject
     * @type {?Object[]}
     * @private
     */
    this.beforeObject = beforeObject;

    if (isObjectAndNotNull(this.beforeObject)) {
        /**
         * The paging midifer string for creating the uri.
         * @type {?string}
         */
        this.before = _getPagingModifier(this.beforeObject, true);
    }

    /**
     * Represents the paging. It will be an array of values.
     * v1, v2, v3.. are in the same order of columns in the sortObject
     * @type {?Object[]}
     * @private
     */
    this.afterObject = afterObject;

    if (isObjectAndNotNull(this.afterObject)) {
        /**
         * The paging midifer string for creating the uri.
         * @type {?string}
         */
        this.after = _getPagingModifier(this.afterObject, false);
    }

    if (this.after || this.before) {
        this.paging = (this.after ? this.after : "") + (this.before ? this.before : "");
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
        return new AttributeGroupLocation(this.service, this.catalog, this.path, searchObject, this.sortObject, this.afterObject, this.beforeObject);
    },

    /**
     * Given a sortObject, return a new location object.
     * This is removing the before and after (paging).
     * @param  {object} searchObject
     * @return {ERMRest.AttributeGroupLocation}
     */
    changeSort: function (sort) {
        return new AttributeGroupLocation(this.service, this.catalog, this.path, this.searchObject, sort);
    },

    /**
     * Given afterObject and beforeObject, return a new location object.
     * @param  {object} afterObject
     * @param  {object} beforeObject
     * @return {ERMRest.AttributeGroupLocation}
     */
    changePage: function (afterObject, beforeObject) {
        return new AttributeGroupLocation(this.service, this.catalog, this.path, this.searchObject, this.sortObject, afterObject, beforeObject);
    }
};

/**
 * Can be used to access group aggregate functions.
 * Usage:
 *  Clients _do not_ directly access this constructor. {@link ERMrest.AttributeGroupReference}
 *  will access this constructor for purposes of fetching grouped aggregate data
 *  for a specific column
 *
 * @param {ERMrest.AttributeGroupReference} reference The reference that this aggregate function belongs to
 * @memberof ERMrest
 * @constructor
 */
function AttributeGroupReferenceAggregateFn (reference) {
    this._ref = reference;
}

AttributeGroupReferenceAggregateFn.prototype = {
    /**
     * @type {Object}
     * @desc count aggregate representation
     * This does not count null values for the key since we're using `count distinct`.
     * Therefore the returned count might not be exactly the same as number of returned values.
     */
    get countAgg() {
        if (this._ref.shortestKey.length > 1) {
            throw new Error("Cannot use count function, attribute group has more than one key column.");
        }

        return "cnt_d(" + this._ref.shortestKey[0].term + ")";
    }
};


module.BucketAttributeGroupReference = BucketAttributeGroupReference;
/**
 * @namespace ERMrest.BucketAttributeGroupReference
 */

/**
 * Constructs a Reference object based on {@link ERMrest.AttributeGroupReference}.
 *
 * This object will be the main object that client will interact with, when we want
 * to use ermrset `attributegroup` api with the bin aggregate. References are immutable
 * and therefore can be safely passed around and used between multiple client components
 * without risk that the underlying reference to server-side resources could change.
 *
 * Usage:
 *  - Clients _do not_ directly access this constructor.
 *  - This will currently be used by the aggregateGroup histogram function to return a
 *    BucketAttributeGroupReference rather than a {@link ERMrest.Reference}
 *
 * @param       {ERMrest.ReferenceColumn} baseColumn The column that is used for creating grouped aggregate
 * @param       {ERMrest.Reference} baseRef The reference representing the column
 * @param       {String} min The min value for the key column request
 * @param       {String} max The max value for the key column request
 * @param       {Integer} numberOfBuckets  The number of buckets for the request
 * @param       {String} bucketWidth the width of each bucket
 * @constructor
 */
function BucketAttributeGroupReference(baseColumn, baseRef, min, max, numberOfBuckets, bucketWidth) {
    var location = new AttributeGroupLocation(baseRef.location.service, baseRef.table.schema.catalog, baseRef.location.ermrestCompactPath);
    var binTerm = "bin(" + module._fixedEncodeURIComponent(baseColumn.name) + ";" + numberOfBuckets + ";" + module._fixedEncodeURIComponent(min) + ";" + module._fixedEncodeURIComponent(max) + ")";

    var keyColumns = [
        new AttributeGroupColumn("c1", binTerm, baseColumn, baseColumn.displayname, baseColumn.type, baseColumn.comment, true, true)
    ];

    var countName = "cnt(*)";

    // if there's a join, we cannot use cnt(*) and we should count the shortestkeys of facet base table (not the projected table)
    if (baseRef.location.hasJoin) {
        countName = "cnt_d(" + baseRef.location.facetBaseTableAlias + ":" + module._fixedEncodeURIComponent(baseRef.facetBaseTable.shortestKey[0].name) + ")";
    }

    var aggregateColumns = [
        new AttributeGroupColumn("c2", countName, null, "Number of Occurrences", new Type({typename: "int"}), "", true, true)
    ];

    // call the parent constructor
    BucketAttributeGroupReference.superClass.call(this, keyColumns, aggregateColumns, location, baseRef.table.schema.catalog);

    this._baseColumn = baseColumn;
    this._min = min;
    this._max = max;
    this._numberOfBuckets = numberOfBuckets;
    this._bucketWidth = bucketWidth;
}

// extend the prototype
module._extends(BucketAttributeGroupReference, AttributeGroupReference);

// properties to be overriden:
BucketAttributeGroupReference.prototype.sort = function (sort) {
    verify(true == false, "Invalid function");
};

BucketAttributeGroupReference.prototype.search = function (term) {
    verify(true == false, "Invalid function");
};

/**
 * Makes a request to the server to fetch the corresponding data for the given key
 * column and aggregate column. The returned data is then formatted for direct use
 * in the plotly APIs.
 *
 * The return object includes an array of x axis labels and another array of y axis
 * values used to represent the bars in the histogram. A third object is returned called
 * labels that includes an array of the min values for each bucket and another array
 * for the max values of each bucket. Together, labels.min[x] and labels.min[y],
 * represent the range for each bucket (bar in the histogram) at that particular index.
 *
 * @param {Object} contextHeaderParams the object that we want to log.
 * @return {Object} data object that contains 2 arrays and another object with 2 arrays
 */
BucketAttributeGroupReference.prototype.read = function (contextHeaderParams) {
    var moment = module._moment;

    // uses the current known min value and adds the binWidth to it to generate the max label
    // which is then used as the next min label (because we didn't have a next min)
    function calculateWidthLabel(min, binWidth) {
        var nextLabel;
        if (currRef._keyColumns[0].type.rootName.indexOf("date") > -1)  {
            nextLabel = moment(min).add(binWidth, 'd').format(module._dataFormats.DATE);
        } else if (currRef._keyColumns[0].type.rootName.indexOf("timestamp") > -1) {
            nextLabel = moment(min).add(binWidth, 's').format(module._dataFormats.DATETIME.return);
        } else {
            nextLabel = (min + binWidth);
        }
        return nextLabel;
    }

    try {
        var defer = module._q.defer();

        var uri = this.uri;

        var currRef = this;
        if (!contextHeaderParams || !isObject(contextHeaderParams)) {
            contextHeaderParams = {"action": "read"};
        }
        var config = {
            headers: this._generateContextHeader(contextHeaderParams)
        };
        this._server.http.get(uri, config).then(function (response) {
            var data = {
                x: [],
                y: []
            };

            var labels = {
                min: [],
                max: []
            };

            var min, max;

            /**
             * Loops through the returned response data and defines the values in x, y, labels.min, and labels.max
             * this only considers rows that are returned with values. Each row returned has a `c1` and `c2` value
             *   - c1: an array with 3 values, [bucketIndex, min, max]
             *   - c2: an integer representing the number of rows with a value between the min and max for that bucket index
             **/
            for (var i=0; i<response.data.length; i++) {
                var index = response.data[i].c1[0];
                if (index !== null) {
                    min = response.data[i].c1[1];
                    max = response.data[i].c1[2];

                    if (currRef._keyColumns[0].type.rootName.indexOf("date") > -1) {
                        min = min !== null ? moment(min).format(module._dataFormats.DATE) : null;
                        max = max !== null ? moment(max).format(module._dataFormats.DATE) : null;
                    } else if (currRef._keyColumns[0].type.rootName.indexOf("timestamp") > -1) {
                        min = min !== null ? moment(min).format(module._dataFormats.DATETIME.return) : null;
                        max = max !== null ? moment(max).format(module._dataFormats.DATETIME.return) : null;
                    }

                    labels.min[index] = min;
                    labels.max[index] = max;

                    data.x[index] = min;
                    data.y[index] = response.data[i].c2;
                }
                // else if null (this is the null bin)
                // we currently don't want to do anything with the null values
            }

            // This should be set to the number of buckets to include the # of bins we want to display + the above max and below min bucket
            // loops through the data and generates the labels for rows that did not return with a value from the bin API
            for (var j=0; j<currRef._numberOfBuckets+2; j++) {
                // if no value is present (null is a value), we didn't get a bucket back for this index
                if (data.x[j] === undefined) {
                    // determine x axis label

                    // figure out min first
                    // no label for index 0
                    if (j==0) {
                        min = null;
                    } else {
                        min = labels.max[j-1];
                    }

                    // use min to determine max
                    // if there was a response row for next index, get min of next value
                    if (labels.min[j+1]) {
                        max = labels.min[j+1];
                    } else {
                        if (j == 0) {
                            max = currRef._min;

                            if (currRef._keyColumns[0].type.rootName.indexOf("date") > -1) {
                                max = moment(max).format(module._dataFormats.DATE);
                            } else if (currRef._keyColumns[0].type.rootName.indexOf("timestamp") > -1) {
                                max = moment.utc(max).format(module._dataFormats.DATETIME.return);
                            }
                        } else {
                            max = calculateWidthLabel(min, currRef._bucketWidth);
                        }
                    }

                    labels.min[j] = min;
                    labels.max[j] = max;

                    data.x[j] = min;
                    data.y[j] = 0;
                }
            }

            // remove the first bin (null-min)
            data.x.splice(0, 1);
            data.y.splice(0, 1);
            labels.min.splice(0, 1);
            labels.max.splice(0, 1);

            data.labels = labels;

            defer.resolve(data);

        }).catch(function (response) {
            var error = module.responseToError(response);
            defer.reject(error);
        });

        return defer.promise;

    } catch (e) {
        return module._q.reject(e);
    }
};
