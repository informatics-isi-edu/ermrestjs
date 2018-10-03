/**
 * @namespace ERMrest.Reference
 */

/**
 * Will create the appropriate ReferenceColumn object based on the given sourceObject.
 * It will return the follwing objects:
 * - If aggregate: PseudoColumn
 * - If no path, scalar, asset annot:AssetPseudoColumn
 * - If no path, scalar (or entity in entry context): ReferenceColumn
 * - If no path, entity, non-entry context: KeyPseudoColumn
 * - If path, entity, outbound length 1: ForeignKeyPseudoColumn
 * - If path, entity, inbound length 1: InboundForeignKeyPseudoColumn
 * - If path, entity, p&b association: InboundForeignKeyPseudoColumn
 * - Otherwise: PseudoColumn
 *
 * @private
 * @param  {ERMrest.Reference}  reference    [description]
 * @param  {ERMrest.Column}  column       [description]
 * @param  {Object}  sourceObject the column definition
 * @param  {String}  name         the name to avoid computing it again.
 * @param  {ERMrest.Tuple}  mainTuple    the main tuple
 * @param  {Boolean} isEntity     whether it's entity mode or not (to avoid computing it again)
 * @return {ERMrest.ReferenceColumn}
 */
module._createPseudoColumn = function (reference, column, sourceObject, name, mainTuple, isEntity) {
    var generalPseudo = function () {
        return new PseudoColumn(reference, column, sourceObject, name, mainTuple);
    };

    var getFK = function (constraint) {
        return module._getConstraintObject(reference.table.schema.catalog.id, constraint[0], constraint[1]).object;
    };

    var source = sourceObject.source,
        context = reference._context,
        relatedRef, fk;

    // has aggregate
    if (sourceObject.aggregate) {
        return generalPseudo();
    }

    if (!_isFacetSourcePath(source)) {
        if (!isEntity) {
            // no path, scalar, asset
            if (column.type.name === "text" && column.annotations.contains(module._annotations.ASSET)) {
                return new AssetPseudoColumn(reference, column, sourceObject);
            }

            // no path, scalar
            return new ReferenceColumn(reference, [column], sourceObject);
        }

        // no path, entity
        var key = column.memberOfKeys.filter(function (key) {
            return key.simple;
        })[0];
        return new KeyPseudoColumn(reference, key, sourceObject, name);
    }

    // path, entity, outbound length 1,
    if (isEntity && source.length === 2 && source[0].outbound) {
        fk = getFK(source[0].outbound);
        return new ForeignKeyPseudoColumn(reference, fk, sourceObject, name);
    }

    // path, entity, inbound length 1
    if (isEntity&& source.length === 2 && source[0].inbound) {
        fk = getFK(source[0].inbound);
        relatedRef = reference._generateRelatedReference(fk, mainTuple, false, sourceObject);
        return new InboundForeignKeyPseudoColumn(reference, relatedRef, sourceObject, name);
    }

    // path, entity, inbound outbound p&b
    if (isEntity && source.length === 3 && source[0].inbound && source[1].outbound) {
        fk = getFK(source[0].inbound);
        relatedRef = reference._generateRelatedReference(fk, mainTuple, true, sourceObject);
        if (fk._table._isPureBinaryAssociation()) {
            return new InboundForeignKeyPseudoColumn(reference, relatedRef, sourceObject, name);
        }
    }

    return generalPseudo();
};


/**
 * @memberof ERMrest
 * @constructor
 * @param {ERMrest.Reference} reference column's reference
 * @param {ERMrest.Column[]} baseCols List of columns that this reference-column will be created based on.
 * @desc
 * Constructor for ReferenceColumn. This class is a wrapper for {@link ERMrest.Column}.
 */
function ReferenceColumn(reference, cols, sourceObject, name) {
    this._baseReference = reference;
    this._context = reference._context;
    this._baseCols = cols;
    this.sourceObject =  isObjectAndNotNull(sourceObject) ? sourceObject : {};

    /**
     * @type {boolean}
     * @desc indicates that this object represents a Column.
     */
    this.isPseudo = false;

    /**
     * @type {ERMrest.Table}
     */
    this.table = this._baseCols[0].table;

    this._name = name;
}

ReferenceColumn.prototype = {

    /**
     * @type {string}
     * @desc name of the column.
     */
    get name () {
        if (this._name === undefined) {
            this._name = this._baseCols.reduce(function (res, col, index) {
                return res + (index>0 ? ", " : "") + col.name;
            }, "");
        }
        return this._name;
    },

    /**
     * @type {object}
     * @desc name of the column.
     */
    get displayname() {
        if (this._displayname === undefined) {
            if (this.sourceObject.markdown_name) {
                this._displayname = {
                    value: module._formatUtils.printMarkdown(this.sourceObject.markdown_name, {inline:true}),
                    unformatted: this.sourceObject.markdown_name,
                    isHTML: true
                };
            } else {
                this._displayname = {
                    "value": this._baseCols.reduce(function(prev, curr, index) {
                        return prev + (index>0 ? ":" : "") + curr.displayname.value;
                    }, ""),
                    "isHTML": this._baseCols.some(function (col) {
                        return col.displayname.isHTML;
                    }),
                    "unformatted": this._baseCols.reduce(function(prev, curr, index) {
                        return prev + (index>0 ? ":" : "") + curr.displayname.unformatted;
                    }, ""),
                };
            }
        }
        return this._displayname;
    },

    /**
     *
     * @type {ERMrest.Type}
     */
    get type() {
        if (this._type === undefined) {
            this._type = (!this._simple || this.isPseudo) ? new Type({typename: "markdown"}) : this._baseCols[0].type;
        }
        return this._type;
    },

    /**
     * @type {Boolean}
     */
    get nullok() {
        if (this._nullok === undefined) {
            this._nullok = !this._baseCols.some(function (col) {
                return !col.nullok;
            });
        }
        return this._nullok;
    },

    /**
     * @desc Returns the default value
     * @type {string}
     */
    get default() {
        if (this._default === undefined) {
            this._default = this._simple ? this._baseCols[0].default : null;
        }
        return this._default;
    },

    /**
     * @desc Returns the aggregate function object
     * @type {ERMrest.ColumnAggregateFn}
     */
    get aggregate() {
        if (this._aggregate === undefined) {
            this._aggregate = !this.isPseudo ? new ColumnAggregateFn(this) : null;
        }
        return this._aggregate;
    },

    /**
     * @desc Returns the aggregate group object
     * @type {ERMrest.ColumnGroupAggregateFn}
     */
    get groupAggregate() {
        if (this._groupAggregate === undefined) {
            this._groupAggregate = !this.isPseudo ? new ColumnGroupAggregateFn(this) : null;
        }
        return this._groupAggregate;
    },

    /**
     * @desc Documentation for this reference-column
     * @type {string}
     */
    get comment() {
        if (this._comment === undefined) {
            if (this.sourceObject.comment) {
                this._comment = this.sourceObject.comment;
            } else {
                this._comment = this._simple ? this._baseCols[0].comment : null;
            }
        }
        return this._comment;
    },

    /**
     * @desc Indicates if the input should be disabled
     * true: input must be disabled
     * false:  input can be enabled
     * object: input msut be disabled (show .message to user)
     *
     * @type {boolean|object}
     */
    get inputDisabled() {
        if (this._inputDisabled === undefined) {
            this._inputDisabled = this._determineInputDisabled(this._context);
        }
        return this._inputDisabled;
    },

    /**
     * Heuristics are as follows:
     *
     * (first applicable rule from top to bottom)
     * - multiple columns -> disable sort.
     * - single column:
     *  - column_order defined -> use it.
     *  - use column actual value.
     *
     * @type {boolean}
     */
    get sortable() {
        if (this._sortable === undefined) {
            this._determineSortable();
        }
        return this._sortable;
    },

    /**
     * @private
     * @desc An array of objects that have `column` which is a Column object, and `descending` which is true/false
     * The `descending` boolean indicates whether we should change the direction of sort or not.
     * @type {Array}
     */
    get _sortColumns() {
        if (this._sortColumns_cached === undefined) {
            this._determineSortable();
        }
        return this._sortColumns_cached;
    },

    /**
     * @private
     * @desc
     * An object which contains column display properties
     * The properties are:
     *
     *  - `columnOrder`: list of columns that this column should be sorted based on
     *  - `isMarkdownPattern`: true|false|undefined Whether it has a markdownPattern or not
     *  - `markdownPattern`: string|undefined
     *
     * @type {Object}
     */
    get _display() {
        if (this._display_cached === undefined) {
            this._display_cached = this._simple ? this._baseCols[0].getDisplay(this._context) : null;
        }
        return this._display_cached;
    },

    /**
     * @private
     * @desc
     * Indicates if this object is wrapping just one column or not
     * @type {boolean}
     */
    get _simple() {
        return this._baseCols.length == 1;
    },

    /**
     * Formats a value corresponding to this reference-column definition.
     * @param {Object} data The 'raw' data value.
     * @param {String} context the context of app
     * @returns {string} The formatted value.
     */
    formatvalue: function(data, context, options) {
        if (this._simple) {
            return this._baseCols[0].formatvalue(data, context, options);
        }
        return data.toString();
    },

    /**
     * Formats the presentation value corresponding to this reference-column definition.
     * @param {Object} data the raw data of the table.
     * @param {String} context the app context
     * @param {Object} options includes `context` and `formattedValues`
     * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
     */
    formatPresentation: function(data, context, options) {
        if (this._simple) {
            return this._baseCols[0].formatPresentation(data, context, options);
        }

        var isHTML = false, value = "", unformatted = "", curr;
        for (var i = 0; i < this._baseCols.length; i++) {
            curr = this._baseCols[i].formatPresentation(data, context, options);
            if (!isHTML && curr.isHTML) {
                isHTML = true;
            }
            value += (i>0 ? ":" : "") + curr.value;
            unformatted += (i>0 ? ":" : "") + curr.unformatted;
        }
        return {isHTML: isHTML, value: value, unformatted: unformatted};
    },

    /**
     * @desc Indicates if the input should be disabled, in different contexts
     * true: input must be disabled
     * false:  input can be enabled
     * object: input msut be disabled (show .message to user)
     * TODO should be removed in favor of inputDisabled
     *
     * @type {boolean|object}
     */
    getInputDisabled: function (context) {
        return this._determineInputDisabled(context);
    },

    _determineInputDisabled: function(context) {
        if (this._simple) {
            return this._baseCols[0].getInputDisabled(context);
        }

        var cols = this._baseCols, generated, i;

        if (context == module._contexts.CREATE) {
            // if one is not generated
            for (i = 0; i < cols.length; i++) {
                if (!cols[i].annotations.contains(module._annotations.GENERATED)) {
                    return false;
                }
            }

            // if all GENERATED
            return {
                message: "Automatically generated"
            };

        } else if (context == module._contexts.EDIT) {
            for (i = 0; i < cols.length; i++) {

                // if one is IMMUTABLE
                if (cols[i].annotations.contains(module._annotations.IMMUTABLE)) {
                    return true;
                }

                // if one is not GENERATED
                if (!cols[i].annotations.contains(module._annotations.GENERATED)) {
                    return false;
                }
            }
            // if all GENERATED
            return true;
        }

        // other contexts
        return true;
    },

    _determineSortable: function () {
        this._sortColumns_cached = [];
        this._sortable = false;

        // disable if mutliple columns
        if (!this._simple) return;

        // use the column column_order
        this._sortColumns_cached = this._baseCols[0]._getSortColumns(this._context); //might return undefined

        if (typeof this._sortColumns_cached === 'undefined') {
            // disable the sort
            this._sortColumns_cached = [];
        } else {
            this._sortable = true;
        }

    },

    _getNullValue: function (context) {
        if (this._simple) {
            return this._baseCols[0]._getNullValue(context);
        }
        return module._getNullValue(this.table, context, [this.table, this.table.schema]);
    }
};

/**
 * If you want to create an object of this type, use the `module._createPseudoColumn` method.
 * This will only be used for general purpose pseudo-columns, using that method ensures That
 * we're creating the more specific object instead. Therefore only these cases should
 * be using this type of object:
 * 1. When sourceObject has aggregate
 * 2. When sourceObject has a path that is not just an outbound fk, or it doesn't define a related
 * entity (inbound or p&b association)
 *
 * @memberof ERMrest
 * @param {ERMrest.Reference} reference  column's reference
 * @param {ERMrest.Column} column      the column that this pseudo-column is representing
 * @param {object} facetObject the whole column object
 * @param {string} name        to avoid processing the name again, this might be undefined.
 * @param {ERMrest.Tuple} mainTuple   if the reference is referring to just one tuple, this is defined.
 * @constructor
 * @class
 */
function PseudoColumn (reference, column, sourceObject, name, mainTuple) {
    PseudoColumn.superClass.call(this, reference, [column], sourceObject);

    /**
     * @type {boolean}
     * @desc indicates that this object represents a PseudoColumn.
     */
    this.isPseudo = true;

    this.isPathColumn = true;

    this.baseColumn = column;

    this._name = name;

    this._currentTable = reference.table;

    this._mainTuple = mainTuple;

    this.table = column.table;
}
// extend the prototype
module._extends(PseudoColumn, ReferenceColumn);

/**
 * Format the presentation value corresponding to this pseudo-column definition.
 * 1. If source is not in entity mode: use the column's heuristic
 * 2. Otherwise if it's not a path, apply the same logic as KeyPseudoColumn presentation based on the key.
 * 2. Otherwise if path is one to one (all outbound), use the same logic as ForeignKeyPseudoColumn based on last fk.
 * 3. Otherwise return null value.
 *
 * @param {Object} data the raw data of the table
 * @param {String} context the app context
 * @param {Object} options include `formattedValues`
 * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
 */
PseudoColumn.prototype.formatPresentation = function(data, context, options) {
    var nullValue = {
        isHTML: false,
        value: this._getNullValue(context),
        unformatted: this._getNullValue(context)
    };

    if (module._isEntryContext(context)) {
        return nullValue;
    }

    // has aggregate, we should get the value by calling aggregate function
    if (this.hasAggregate) {
        return nullValue;
    }

    // not representing a row
    if (!this.isUnique) {
        return nullValue;
    }

    // make sure formattedValues is valid
    if (!options) options = {};
    if (options.formattedValues === undefined) {
        options.formattedValues = module._getFormattedKeyValues(this.table, context, data);
    }

    // not in entity mode, just return the column value.
    if (!this.isEntityMode) {
        return PseudoColumn.super.formatPresentation.call(this, data, context, options);
    }

    // in entity mode, return the foreignkey value
    var pres = module._generateRowPresentation(this._lastForeignKey.obj.key, data, context);
    return pres ? pres: {isHTML: false, value: nullValue, unformatted: nullValue};
};

/**
 * Returns a promise that gets resolved with list of aggregated values in the same
 * order of tuples of the page that is passed.
 * @param  {ERMrest.Page} page               the page object of main (current) refernece
 * @param {Object} contextHeaderParams the object that we want to log.
 * @return {Promise}
 */
PseudoColumn.prototype.getAggregatedValue = function (page, contextHeaderParams) {
    var URL_LENGTH_LIMIT = 2048;

    var defer = module._q.defer(),
        self = this,
        promises = [], values = [],
        mainTable = this._currentTable,
        location = this._baseReference.location,
        http = this._baseReference._server._http,
        column = this._baseCols[0],
        printUtils = module._formatUtils,
        keyColName, keyColNameEncoded,
        baseUri, uri, i, fk, str, projection;

    // verify the input
    try {
        verify(this.hasAggregate, "this function should only be used when `hasAggregate` is true.");
        verify(page && (page instanceof Page), "page is required.");
        verify(page.reference.table === mainTable, "given page object must be from the base table.");
    } catch (e) {
        defer.reject(e);
        return defer.promise;
    }

    // create the header
    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
        contextHeaderParams = {"action": "read/aggregate"};
    }
    var config = {
        headers: self.reference._generateContextHeader(contextHeaderParams, page.tuples.length)
    };

    var currTable = "T";
    var baseTable = self.hasPath ? "M": currTable;

    // this will dictates whether we should show rowname or not
    var isRow = self.isEntityMode && module._pseudoColEntityAggregateFns.indexOf(self.sourceObject.aggregate) != -1;

    // creates http request with the current uri
    var addPromise = function () {
        if (uri.charAt(uri.length-1) === ";") {
            uri = uri.slice(0, -1);
        }
        promises.push(http.get(uri + projection, config));
    };

    // will format a single value
    var getFormattedValue = function (val) {
        if (isRow) {
            var pres = module._generateRowPresentation(self._key, val, self._context);
            return pres ? pres.unformatted : null;
        }
        if (val == null || val === "") {
            return val;
        }
        return column.formatvalue(val, self._context);
    };

    // it will sort the array values and then format them.
    var getArrayValue = function (val) {

        // try to sort the values
        try {
            val.sort(function (a, b) {
                // if isRow, a and b will be objects
                if (isRow) {
                    return a[column.name].localeCompare(b[column.name]);
                }
                return a.localeCompare(b);
            });
        } catch(e) {
            // if sort threw any erros, we just leave it as is
        }


        // get the formatted values as an array
        var arrayRes = printUtils.printArray(
            val.map(getFormattedValue),
            {
                isMarkdown: (column.type.name === "markdown") || isRow,
                returnArray: true
            }
        );

        // print the array in a comma seperated value (list) or bullets
        var res = "";
        switch (self.sourceObject.array_display) {
            case "ulist":
                arrayRes.forEach(function (arrayVal) {
                    res += "* " + arrayVal + " \n";
                });
                break;
            case "olist":
                arrayRes.forEach(function (arrayVal, i) {
                    res += (i+1) + ". " + arrayVal + " \n";
                });
                break;
            case "raw":
                res = arrayRes.join(" ");
                break;
            default: //csv
                res = arrayRes.join(", ");
        }
        return printUtils.printMarkdown(res);
    };


    // return empty list if page is empty
    if (page.tuples.length === 0) {
        defer.resolve(values);
        return defer.promise;
    }

    // make sure table has shortestkey of length 1
    if (mainTable.shortestKey.length > 1) {
        console.log("This function only works with tables that have at least a simple key.");
        defer.resolve(values);
        return defer.promise;
    }

    keyColName = mainTable.shortestKey[0].name;
    keyColNameEncoded = module._fixedEncodeURIComponent(mainTable.shortestKey[0].name);
    projection = "/c:=:" + baseTable + ":" + keyColNameEncoded +
                 ";v:=" + self.sourceObject.aggregate +
                 "(" + currTable + ":" + (isRow ? "*" : module._fixedEncodeURIComponent(column.name)) + ")";

     // generate the base url in the following format:
     // service/T:=pseudoColTable/path-from-pseudo-col-to-current/filters/project
    baseUri =  [
        location.service, "catalog", location.catalog, "attributegroup",
        currTable + ":=" + module._fixedEncodeURIComponent(self.table.schema.name) + ":" +module._fixedEncodeURIComponent(self.table.name)
    ].join("/") + "/";

    // add the join (path from pseudoColumn's table to current table)
    for (i = self.foreignKeys.length - 1; i >= 0; i--) {
        fk = self.foreignKeys[i];
        if (i === 0) baseUri += baseTable + ":=";
        baseUri += fk.obj.toString(fk.isInbound, true) + "/";
    }

    // make sure just projection and base uri doesn't go over limit.
    if (baseUri.length + projection.length >= URL_LENGTH_LIMIT) {
        console.log("couldn't generate the requests because of url limitation");
        defer.resolve(values);
        return defer.promise;
    }

    // create the request urls
    uri = baseUri;
    for (i = 0; i < page.tuples.length; i++) {
        str = keyColNameEncoded + "=" + page.tuples[i].data[keyColName] + ";";

        // adding this will go over limit, create a request with the previous uri
        if ((uri.length + str.length + projection.length > URL_LENGTH_LIMIT)) {
            if (uri.length !== baseUri.length) {
                addPromise();
                uri = baseUri + str;
            }
        } else {
            uri += str;

            // if this was the last one, create a promise with it
            if (i === page.tuples.length-1) {
                addPromise();
            }
        }
    }

    // if adding any of the filters would go over url limit
    if (promises.length === 0) {
        console.log("couldn't generate the requests because of url limitation");
        defer.resolve(values);
        return defer.promise;
    }

    module._q.all(promises).then(function (response) {
        var values = [],
            result = [],
            value, res, isHTML;

        response.forEach(function (r) {
            values = values.concat(r.data);
        });

        // make sure we're returning the result in the same order as input
        page.tuples.forEach(function (t) {
            // find the corresponding value in result
            value = values.find(function (v) {
                return v.c == t.data[keyColName];
            });

            // if given page is not valid (the key doesn't exist), or it returned empty result
            if (!value || !value.v){
                result.push({isHTML: false, value: ""});
                return;
            }

            // cnt and cnt_d are special since they will generate integer always
            if (["cnt", "cnt_d"].indexOf(self.sourceObject.aggregate) !== -1) {
                result.push({value: module._formatUtils.printInteger(value.v), isHTML: false});
                return;
            }

            // array formatting is different
            if (self.sourceObject.aggregate.indexOf("array") === 0){
                result.push({value: getArrayValue(value.v), isHTML: true});
                return;
            }

            var isHTML = (column.type.name === "markdown");
            var res = getFormattedValue(value.v);
            if (isHTML) {
                res = printUtils.printMarkdown(res);
            }
            result.push({isHTML: isHTML, value: res});
        });

        defer.resolve(result);
    }).catch(function (err) {
        defer.reject(module._responseToError(err));
    });

    return defer.promise;
};

PseudoColumn.prototype._determineSortable = function () {
    this._sortColumns_cached = [];
    this._sortable = false;

    // disable sort if it has aggregate
    if (this.hasAggregate) {
        return;
    }

    if (this.isUnique) {

        if (this.isEntityMode) {
            var fk = this._lastForeignKey.obj;
            var display = fk.getDisplay(this._context), useColumn = false, baseCol;

            // disable the sort
            if (display !== undefined && display.columnOrder === false) return;

            // use the column_order
            if (display !== undefined && display.columnOrder !== undefined && display.columnOrder.length !== 0) {
                this._sortColumns_cached = display.columnOrder;
                this._sortable = true;
                return;
            }

            if (this.reference.display._rowOrder !== undefined) {
                this._sortColumns_cached = this.reference.display._rowOrder;
                this._sortable = true;
                return;
            }
        }

        // use the column's
        this._sortColumns_cached = this._baseCols[0]._getSortColumns(this._context); //might return undefined

        if (typeof this._sortColumns_cached === 'undefined') {
            this._sortColumns_cached = [];
        } else {
            this._sortable = true;
        }
    }
};
PseudoColumn.prototype._determineInputDisabled = function () {
    throw new Error("can not use this type of column in entry mode.");
};

Object.defineProperty(PseudoColumn.prototype, "name", {
    get: function () {
        if (this._name === undefined) {
            this._name = _generatePseudoColumnName(this.sourceObject, this._baseCols[0]).name;
        }
        return this._name;
    }
});

Object.defineProperty(PseudoColumn.prototype, "comment", {
    get: function () {
        if (this._comment === undefined) {
            var getComment = function (self) {
                if (self.sourceObject.comment) {
                    return self.sourceObject.comment;
                }

                if (self.hasAggregate) {
                    var agIndex = module._pseudoColAggregateFns.indexOf(self.sourceObject.aggregate);
                    return [module._pseudoColAggregateExplicitName[agIndex], self._baseCols[0].displayname.value].join(" ");
                }

                if (!self.isEntityMode) {
                    return self._baseCols[0].comment;
                }

                 return self._baseCols[0].table.comment;
            };

            this._comment = getComment(this);
        }
        return this._comment;
    }
});

/**
 * The displayname that should be used for this column.
 * It will return the first applicable rule:
 * 1. markdown_name that is defined on the sourceObject.
 * 2. if aggregate use the {function} col_displayname.
 * 3. In entity mode, return the table's displayname.
 * 4. In scalar return the column's displayname.
 *
 * @member {Object} displayname
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "displayname", {
    get: function () {
        if (this._displayname === undefined) {
            var attachDisplayname = function (self) {
                if (self.sourceObject.markdown_name) {
                    self._displayname = {
                        value: module._formatUtils.printMarkdown(self.sourceObject.markdown_name, {inline:true}),
                        unformatted: self.sourceObject.markdown_name,
                        isHTML: true
                    };
                    return;
                }

                if (self.hasAggregate) {
                    Object.getOwnPropertyDescriptor(PseudoColumn.super, "displayname").get.call(self);
                    var agIndex = module._pseudoColAggregateFns.indexOf(self.sourceObject.aggregate);
                    var name = module._pseudoColAggregateNames[agIndex];

                    self._displayname =  {
                        value: (name ? [name, self._displayname.value].join(" ") : self._displayname.value),
                        unformatted: (name ? [name, self._displayname.unformatted].join(" ") : self._displayname.unformatted),
                        isHTML: self._displayname.isHTML
                    };
                    return;
                }

                if (!self.isEntityMode) {
                    Object.getOwnPropertyDescriptor(PseudoColumn.super,"displayname").get.call(self);
                    return;
                }

                // displayname of the table.
                 self._displayname = self._baseCols[0].table.displayname;
                 return;
            };

            attachDisplayname(this);
        }
        return this._displayname;
    }
});

/**
 * If the pseudoColumn is referring to a unique row (the path is one to one)
 * @member {boolean} isUnique
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "isUnique", {
    get: function () {
        if (this._isUnique === undefined) {
            this._isUnique = !this.hasAggregate && (!this.hasPath || this.sourceObject.source.every(function (s, index, arr) {
                return (index === arr.length - 1) || (("outbound" in s) && !("inbound" in s));
            }));
        }
        return this._isUnique;
    }
});

/**
 * If the pseudoColumn is in entity mode
 * This includes columns without path too.
 * @member {boolean} isEntityMode
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "isEntityMode", {
    get: function () {
        if (this._isEntityMode === undefined) {
            this._isEntityMode = false;

            var currCol = this._baseCols[0], key;
            if (this.sourceObject.entity !== false && !currCol.nullok) {
                key = currCol.memberOfKeys.filter(function (key) {
                    return key.simple;
                })[0];
                this._isEntityMode = (key !== undefined);
            }

            this._key = this._isEntityMode ? key : null;
        }
        return this._isEntityMode;
    }
});

/**
 * If the pseudoColumn is in entity mode will return the key that this column represents
 * @member {boolean} key
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "key", {
    get: function () {
        if (this._key === undefined) {
            // will populate the this._key
            var isEntityMode = this.isEntityMode;
        }
        return this._key;
    }
});

/**
 * If the pseudo-column is connected via a path to the table or not.
 * @member {boolean} hasPath
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "hasPath", {
    get: function () {
        if (this._hasPath === undefined) {
            this._hasPath =_isFacetSourcePath(this.sourceObject.source);
        }
        return this._hasPath;
    }
});

/**
 * List of foreignkeys on the path
 * @member {ERMrest.ForeignKeyRef[]} foreignKeys
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "foreignKeys", {
    get: function () {
        if (this._foreignKeys === undefined) {
            this._foreignKeys = _getFacetSourceForeignKeys(this.sourceObject.source, this._baseReference.table.schema.catalog.id, module._constraintNames);
        }
        return this._foreignKeys;
    }
});

/**
 * The last foreignkey on the path
 * @private
 * @member {ERMrest.ForeignKeyRef} _lastForeignKey
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "_lastForeignKey", {
    get: function () {
        if (this._lastForeignKey_cached === undefined) {
            this._lastForeignKey_cached = _getFacetSourceLastForeignKey(this.sourceObject.source, this._baseReference.table.schema.catalog.id, module._constraintNames);
        }
        return this._lastForeignKey_cached;
    }
});

/**
 * If aggregate function is defined on the column.
 * @member {boolean} hasAggregate
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "hasAggregate", {
    get: function () {
        if (this._hasAggregate === undefined) {
            this._hasAggregate = module._pseudoColAggregateFns.indexOf(this.sourceObject.aggregate) !== -1;
        }
        return this._hasAggregate;
    }
});

/**
 * Returns a reference to the current pseudo-column
 * TODO needs to be changed when we get to use it. Currently this is how it behaves:
 * 1. If pseudo-column has no path, it will return the base reference.
 * 2. If pseudo-column has path, and is inbound fk, or p&bA, apply the same logic as _generateRelatedReference
 * 3. Otherwise if mainTuple is available, use that to generate list of facets.
 * 4. Otherwise return the reference without any facet or filters (TODO needs to change eventually)
 * @member {ERMrest.Reference} reference
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "reference", {
    get: function () {
        if (this._reference === undefined) {
            var self = this;
            if (!self.hasPath) {
                self._reference = _referenceCopy(self._baseReference);
            } else {

                // attach the parent displayname
                var firstFk = self.foreignKeys[0], parentDisplayname;
                if (firstFk.isInbound && firstFk.obj.to_name) {
                    parentDisplayname = {value: firstFk.obj.to_name, unformatted: firstFk.obj.to_name, isHTML: false};
                } else if (!firstFk.isInbound && firstFk.obj.from_name) {
                    parentDisplayname = {value: firstFk.obj.from_name, unformatted: firstFk.obj.from_name, isHTML: false};
                } else {
                    parentDisplayname = this._baseReference.table.displayname;
                }

                var source = [], i, fk, columns, noData = false;

                // create the reverse path
                for (i = self.foreignKeys.length -1; i >= 0; i--) {
                    fk = self.foreignKeys[i];
                    if (fk.isInbound) {
                        source.push({"outbound": fk.obj.constraint_names[0]});
                        if (i === 0) {
                            columns = fk.obj.key.colset.columns;
                        }
                    } else {
                        source.push({"inbound": fk.obj.constraint_names[0]});
                        if (i === 0) {
                            columns = fk.obj.colset.columns;
                        }
                    }
                }


                var filters = [], uri = self.table.uri;
                if (self._mainTuple) {
                    // create the filters based on the given tuple
                    columns.forEach(function (col) {
                        if (noData || (!self._mainTuple.data && !self._mainTuple.data[col.name])) {
                            noData = true;
                            return;
                        }

                        var filter = {
                            "source": source.concat(col.name)
                        };
                        filter[module._facetFilterTypes.CHOICE] = [self._mainTuple.data[col.name]];
                        filters.push(filter);
                    });
                }

                // if data didn't exist, we should traverse the path
                if ((noData || filters.length == 0) && !self._baseReference.hasJoin) {
                    uri = self._baseReference.location.compactUri + "/" + this.foreignKeys.map(function (fk) {
                        return fk.obj.toString(!fk.isInbound, false);
                    }).join("/");
                }

                self._reference = new Reference(module.parse(uri), self.table.schema.catalog);
                self._reference.parentDisplayname = parentDisplayname;

                // make sure data exists
                if (!noData && filters.length > 0) {
                    self._reference.location.facets = {"and": filters};
                }
            }

            // attach the current pseudo-column to the reference
            self._reference.pseudoColumn = self;

            // make sure the refernece has the correct displayname
            if (self.hasPath) {
                self._reference._displayname = self.displayname;
            }
        }
        return this._reference;
    },
    set: function (ref) {
        //TODO this should be revisited, chaise is mutating the reference!
        this._reference = ref;
    }
});
Object.defineProperty(PseudoColumn.prototype, "default", {
    get: function () {
        throw new Error("can not use this type of column in entry mode.");
    }
});
Object.defineProperty(PseudoColumn.prototype, "nullok", {
    get: function () {
        throw new Error("can not use this type of column in entry mode.");
    }
});


/**
 * @memberof ERMrest
 * @constructor
 * @class
 * @param {ERMrest.Reference} reference column's reference
 * @param {ERMrest.ForeignKeyRef} fk the foreignkey
 * @desc
 * Constructor for ForeignKeyPseudoColumn. This class is a wrapper for {@link ERMrest.ForeignKeyRef}.
 * This class extends the {@link ERMrest.ReferenceColumn}
 */
function ForeignKeyPseudoColumn (reference, fk, sourceObject, name) {
    // call the parent constructor
    ForeignKeyPseudoColumn.superClass.call(this, reference, fk.colset.columns, sourceObject);

    /**
     * @type {boolean}
     * @desc indicates that this object represents a PseudoColumn.
     */
    this.isPseudo = true;

    /**
     * @type {boolean}
     * @desc Indicates that this ReferenceColumn is a Foreign key.
     */
    this.isForeignKey = true;

    // create ermrest url using the location
    var table = fk.key.table;
    var ermrestURI = [
        table.schema.catalog.server.uri ,"catalog" ,
        table.schema.catalog.id, "entity",
        [module._fixedEncodeURIComponent(table.schema.name),module._fixedEncodeURIComponent(table.name)].join(":")
    ].join("/");

    /**
     * @type {ERMrest.Reference}
     * @desc The reference object that represents the table of this PseudoColumn
     */
    this.reference =  new Reference(module.parse(ermrestURI), table.schema.catalog);
    this.reference.session = reference._session;

    /**
     * @type {ERMrest.ForeignKeyRef}
     * @desc The Foreign key object that this PseudoColumn is created based on
     */
    this.foreignKey = fk;

    this._constraintName = this.foreignKey._constraintName;

    this.table = this.foreignKey.key.table;

    this._name = name;
}
// extend the prototype
module._extends(ForeignKeyPseudoColumn, ReferenceColumn);

// properties to be overriden:
/**
 * This function takes in a tuple and generates a reference that is
 * constrained based on the domain_filter_pattern annotation. If thisx
 * annotation doesn't exist, it returns this (reference)
 * `this` is the same as column.reference
 * @param {ERMrest.ReferenceColumn} column - column that `this` is based on
 * @param {Object} data - tuple data with potential constraints
 * @returns {ERMrest.Reference} the constrained reference
 */
ForeignKeyPseudoColumn.prototype.filteredRef = function(data, linkedData) {
    var uri = this.reference.uri,
        location;

    if (this.foreignKey.annotations.contains(module._annotations.FOREIGN_KEY)){

        var keyValues = module._getFormattedKeyValues(this._baseReference.table, this._context, data, linkedData);
        var template = this.foreignKey.annotations.get(module._annotations.FOREIGN_KEY).content.domain_filter_pattern;
        var uriFilter = module._renderTemplate(template, keyValues, this._baseReference.table);

        // should ignore the annotation if it's invalid
        if (typeof uriFilter === "string" && uriFilter.trim() !== '') {
            try {
                location = module.parse(uri + '/' + uriFilter.trim());
            } catch (exp) {}
        }
    }

    if (!location) {
        location = module.parse(uri);
    }

    // TODO we might need to check the table of location, so it is indeed this.table
    return new Reference(location, this.table.schema.catalog);
};
ForeignKeyPseudoColumn.prototype._determineDefaultValue = function () {
    var fkColumns = this.foreignKey.colset.columns,
        keyColumns = this.foreignKey.key.colset.columns,
        mapping = this.foreignKey.mapping,
        table = this.table,
        keyPairs = [],
        keyValues = [],
        caption,
        col,
        keyCol,
        isNull = false,
        i;

    var defaultStr = null, defaultValues = {}, defaultRef = null;

    for (i = 0; i < fkColumns.length; i++) {
        if (fkColumns[i].default === null || fkColumns[i].default === undefined) {
            isNull = true; //return null if one of them is null;
            break;
        }
        defaultValues[mapping.get(fkColumns[i]).name] = fkColumns[i].default;
    }

    if (!isNull) {

        // get the values for using in reference creation
        for (i = 0; i < keyColumns.length; i++) {
            col = keyColumns[i];
            keyValues.push(col.formatvalue(defaultValues[col.name], this._context));
            keyPairs.push(
                module._fixedEncodeURIComponent(col.name) + "=" + module._fixedEncodeURIComponent(defaultValues[col.name])
            );
        }

        // use row name as the caption
        caption = module._generateRowName(this.table, this._context, defaultValues).value;

        // use "col_1:col_2:col_3"
        if (caption.trim() === '') {
            caption = keyValues.join(":");
        }

        defaultStr = caption.trim() !== '' ? caption : null;

        var refURI = [
            table.schema.catalog.server.uri ,"catalog" ,
            table.schema.catalog.id, this._baseReference.location.api,
            [module._fixedEncodeURIComponent(table.schema.name),module._fixedEncodeURIComponent(table.name)].join(":"),
            keyPairs.join("&")
        ].join("/");
        defaultRef = new Reference(module.parse(refURI), table.schema.catalog);
    }

    this._default = defaultStr;
    this._defaultValues = defaultValues;
    this._defaultReference = defaultRef;
};
ForeignKeyPseudoColumn.prototype.formatPresentation = function(data, context, options) {
    var nullValue = this._getNullValue(context);
    var pres = module._generateRowPresentation(this.foreignKey.key, data, context);
    return pres ? pres: {isHTML: false, value: nullValue, unformatted: nullValue};
};
ForeignKeyPseudoColumn.prototype._determineSortable = function () {
    var display = this._display, useColumn = false, baseCol;

    this._sortColumns_cached = [];
    this._sortable = false;

    // disable the sort
    if (display !== undefined && display.columnOrder === false) return;

    // use the column_order
    if (display !== undefined && display.columnOrder !== undefined && display.columnOrder.length !== 0) {
        this._sortColumns_cached = display.columnOrder;
        this._sortable = true;
        return;
    }

    // use row-order of the table
    if (this.reference.display._rowOrder !== undefined) {
        this._sortColumns_cached = this.reference.display._rowOrder;
        this._sortable = true;
        return;
    }

    // if simple, use column
    if (this.foreignKey.simple) {
        baseCol = this.foreignKey.mapping.get(this._baseCols[0]);

        this._sortColumns_cached = baseCol._getSortColumns(this._context); //might return undefined

        if (typeof this._sortColumns_cached === 'undefined') {
            this._sortColumns_cached = [];
        } else {
            this._sortable = true;
        }
    }
};

/**
 * returns the raw default values of the constituent columns.
 * @member {Object} defaultValues
 * @memberof ERMrest.ForeignKeyPseudoColumn#
 */
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "defaultValues", {
    get: function () {
        if (this._defaultValues === undefined) {
            this._determineDefaultValue();
        }
        return this._defaultValues;
    }
});

/**
 * returns a reference using raw default values of the constituent columns.
 * @member {ERMrest.Refernece} defaultReference
 * @memberof ERMrest.ForeignKeyPseudoColumn#
 */
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "defaultReference", {
    get: function () {
        if (this._defaultReference === undefined) {
            this._determineDefaultValue();
        }
        return this._defaultReference;
    }
});
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "name", {
    get: function () {
        if (this._name === undefined) {
            this._name = this.foreignKey.name;
        }
        return this._name;
    }
});
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "displayname", {
    get: function () {
        if (this._displayname === undefined) {
            var foreignKey = this.foreignKey, value, isHTML, unformatted;
            if (this.sourceObject.markdown_name) {
                unformatted = this.sourceObject.markdown_name;
                value = module._formatUtils.printMarkdown(unformatted, {inline:true});
                isHTML = true;
            } else if (foreignKey.to_name !== "") {
                value = unformatted = foreignKey.to_name;
                isHTML = false;
            } else if (foreignKey.simple) {
                value = this._baseCols[0].displayname.value;
                isHTML = this._baseCols[0].displayname.isHTML;
                unformatted = this._baseCols[0].displayname.unformatted;

                if (this._baseCols[0].memberOfForeignKeys.length > 1) { // disambiguate
                    value += " ("  + foreignKey.key.table.displayname.value + ")";
                    unformatted += " (" + foreignKey.key.table.displayname.unformatted + " )";
                    if (!isHTML) {
                        isHTML = foreignKey.key.table.displayname.isHTML;
                    }
                }

            } else {
                value = foreignKey.key.table.displayname.value;
                isHTML = foreignKey.key.table.displayname.isHTML;
                unformatted = foreignKey.key.table.displayname.unformatted;

                // disambiguate
                var tableCount = foreignKey._table.foreignKeys.all().filter(function (fk) {
                    return !fk.simple && fk.to_name === "" && fk.key.table == foreignKey.key.table;
                }).length;

                if (tableCount > 1) {
                    var cols = foreignKey.colset.columns.slice().sort(function(a,b) {
                        return a.name.localeCompare(b.name);
                    });

                     value += " (" + cols.map(function(col) {
                        return col.displayname.value;
                    }).join(", ")  + ")";

                    unformatted += " (" + cols.map(function(col) {
                        return col.displayname.unformatted;
                    }).join(", ")  + ")";

                    if (!isHTML) {
                        isHTML = foreignKey.colset.columns.some(function (col) {
                            return col.displayname.isHTML;
                        });
                    }
                }
            }
            this._displayname = {"value": value, "isHTML": isHTML, "unformatted": unformatted};
        }
        return this._displayname;
    }
});
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "default", {
    get: function () {
        if (this._default === undefined) {
            this._determineDefaultValue();
        }
        return this._default;
    }
});
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "comment", {
    get: function () {
        if (this._comment === undefined) {
            // calling the parent
            Object.getOwnPropertyDescriptor(ForeignKeyPseudoColumn.super,"comment").get.call(this);
            this._comment = (this._comment !== null) ? this._comment : this.foreignKey.comment;
        }
        return this._comment;
    }
});
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "_display", {
    get: function () {
        if (this._display_cached === undefined) {
            this._display_cached = this.foreignKey.getDisplay(this._context);
        }
        return this._display_cached;
    }
});

/**
 * @memberof ERMrest
 * @constructor
 * @class
 * @param {ERMrest.Reference} reference column's reference
 * @param {ERMrest.Key} key the key
 * @desc
 * Constructor for KeyPseudoColumn. This class is a wrapper for {@link ERMrest.Key}.
 * This class extends the {@link ERMrest.ReferenceColumn}
 */
function KeyPseudoColumn (reference, key, sourceObject, name) {
    // call the parent constructor
    KeyPseudoColumn.superClass.call(this, reference, key.colset.columns, sourceObject);

    /**
     * @type {boolean}
     * @desc indicates that this object represents a PseudoColumn.
     */
    this.isPseudo = true;

    /**
     * @type {boolean}
     * @desc Indicates that this ReferenceColumn is a key.
     */
    this.isKey = true;

    /**
     * @type {ERMrest.ForeignKeyRef}
     * @desc The Foreign key object that this PseudoColumn is created based on
     */
    this.key = key;

    this.table = this.key.table;

    this._constraintName = key._constraintName;

    this._name = name;
}
// extend the prototype
module._extends(KeyPseudoColumn, ReferenceColumn);

// properties to be overriden:

/**
 * Return the value that should be presented for this column.
 * It usually is a self-link to the given row of data.
 *
 * The following is the logic:
 * 1. if the key data is not present, return null.
 * 2. Otherwise if key has markdown pattern, return it.
 * 3. Otherwise try to generate the value in `col1:col2` format. if it resulted in empty string return null.
 *    - If any of the constituent columnhas markdown don't add self-link, otherwise add the self-link.
 * @param  {Object} data    given raw data for the table columns
 * @param  {String} context the app context
 * @param  {Object} options might include `formattedValues`
 * @return {Object} A key value pair containing value and isHTML that detemrines the presentation.
 */
KeyPseudoColumn.prototype.formatPresentation = function(data, context, options) {
    var nullValue = this._getNullValue(context);
    var pres = module._generateKeyPresentation(this.key, data, context, options);
    return pres ? pres : {isHTML: false, value: nullValue, unformatted: nullValue};
 };
KeyPseudoColumn.prototype._determineSortable = function () {
    var display = this._display, useColumn = false, baseCol;

    this._sortColumns_cached = [];
    this._sortable = false;

    // disable the sort
    if (display !== undefined && display.columnOrder === false) return;

    // use the column_order
    if (display !== undefined && display.columnOrder !== undefined && display.columnOrder.length !== 0) {
        this._sortColumns_cached = display.columnOrder;
        this._sortable = true;
        return;
    }

    // if simple, use column
    if (this.key.simple) {
        baseCol = this._baseCols[0];

        this._sortColumns_cached = baseCol._getSortColumns(this._context); //might return undefined

        if (typeof this._sortColumns_cached === 'undefined') {
            this._sortColumns_cached = [];
        } else {
            this._sortable = true;
        }
    }
};
Object.defineProperty(KeyPseudoColumn.prototype, "name", {
    get: function () {
        return this.key.name;
    }
});
Object.defineProperty(KeyPseudoColumn.prototype, "displayname", {
    get: function () {
        if (this._displayname === undefined) {
            if (this.sourceObject.markdown_name) {
                this._displayname = {
                    value: module._formatUtils.printMarkdown(this.sourceObject.markdown_name, {inline:true}),
                    unformatted: this.sourceObject.markdown_name,
                    isHTML: true
                };
            } else {
                this._displayname = module._determineDisplayName(this.key, false);

                // if was undefined, fall back to default
                if (this._displayname.value === undefined || this._displayname.value.trim() === "") {
                    this._displayname = undefined;
                    Object.getOwnPropertyDescriptor(KeyPseudoColumn.super,"displayname").get.call(this);
                }
            }
        }
        return this._displayname;
    }
});
Object.defineProperty(KeyPseudoColumn.prototype, "comment", {
    get: function () {
        if (this._comment === undefined) {
            // calling the parent
            Object.getOwnPropertyDescriptor(KeyPseudoColumn.super,"comment").get.call(this);
            this._comment = (this._comment !== null) ? this._comment : this.key.comment;
        }
        return this._comment;
    }
});
Object.defineProperty(KeyPseudoColumn.prototype, "default", {
    get: function () {
        // default should be undefined in key
        return undefined;
    }
});
Object.defineProperty(KeyPseudoColumn.prototype, "_display", {
    get: function () {
        if (this._display_cached === undefined) {
            this._display_cached = this.key.getDisplay(this._context);
        }
        return this._display_cached;
    }
});

/**
 * @memberof ERMrest
 * @constructor
 * @class
 * @param {ERMrest.Reference} reference column's reference
 * @param {ERMrest.Column} column the asset column
 *
 * @property {string} urlPattern  A desired upload location can be derived by Pattern Expansion on pattern.
 * @property {(ERMrest.Column|null)} filenameColumn if it's string, then it is the name of column we want to store filename inside of it.
 * @property {(ERMrest.Column|null)} byteCountColumn if it's string, then it is the name of column we want to store byte count inside of it.
 * @property {(ERMrest.Column|boolean|null)} md5 if it's string, then it is the name of column we want to store md5 inside of it. If it's true, that means we must use md5.
 * @property {(ERMrest.Column|boolean|null)} sha256 if it's string, then it is the name of column we want to store sha256 inside of it. If it's true, that means we must use sha256.
 * @property {(string[]|null)} filenameExtFilter set of filename extension filters for use by upload agents to indicate to the user the acceptable filename patterns.
 *
 * @desc
 * Constructor for AssetPseudoColumn.
 * This class is a wrapper for {@link ERMrest.Column} objects that have asset annotation.
 * This class extends the {@link ERMrest.ReferenceColumn}
 */
function AssetPseudoColumn (reference, column, sourceObject) {
    // call the parent constructor
    AssetPseudoColumn.superClass.call(this, reference, [column], sourceObject);

    this._baseCol = column;

    this._annotation = column.annotations.get(module._annotations.ASSET).content || {};

    /**
     * @type {boolean}
     * @desc indicates that this object represents a PseudoColumn.
     */
    this.isPseudo = true;

    /**
     * @type {boolean}
     * @desc Indicates that this ReferenceColumn is an asset.
     */
    this.isAsset = true;
}
// extend the prototype
module._extends(AssetPseudoColumn, ReferenceColumn);

/**
 * If url_pattern is invalid or browser_upload=false the input will be disabled.
 * @param  {string} context the context
 * @return {boolean|object}
 */
AssetPseudoColumn.prototype._determineInputDisabled = function (context) {
    var pat = this._annotation.url_pattern;
    if (typeof pat !== "string" || pat.length === 0 || this._annotation.browser_upload === false) {
        return true;
    }

    return AssetPseudoColumn.super._determineInputDisabled.call(this, context);
};

// properties to be overriden:
AssetPseudoColumn.prototype.formatPresentation = function(data, context, options) {
    // in edit return the original data
    if (module._isEntryContext(context)) {
        return { isHTML: false, value: data[this._baseCol.name], unformatted: data[this._baseCol.name]};
    }

    // if has column-display annotation, use it
    if (this._baseCol.getDisplay(context).isMarkdownPattern) {
        return this._baseCol.formatPresentation(data, context, options);
    }

    // if null, return null value
    if (typeof data !== 'object' || typeof data[this._baseCol.name] === 'undefined' || data[this._baseCol.name] === null) {
        return { isHTML: false, value: this._getNullValue(context), unformatted: this._getNullValue(context) };
    }

    // otherwise return a download link
    var template = "[{{{caption}}}]({{{url}}}){download .download}";
    var col = this.filenameColumn ? this.filenameColumn : this._baseCol;
    var url = data[this._baseCol.name];
    var caption = col.formatvalue(data[col.name], context, options);

    // if we got the caption from filename and it resulted in empty, try with the data
    if (this.filenameColumn && (!caption || !data[this.filenameColumn.name])) {
        caption = col.formatvalue(data[this._baseCol.name], context, options);
    }

    // if filenameColumn exists, then we want to show that value
    if (!this.filenameColumn) {
        // if value matches the expected format, just show the file name
        var parts = caption.match(/^\/hatrac\/([^\/]+\/)*([^\/:]+)(:[^:]+)?$/);
        if (parts && parts.length === 4) {
            caption = parts[2];
        }
        // in compact contexts, just return the last part of url (filename)
        else if (typeof context === "string" && context.indexOf("compact") === 0) {
            var newCaption = caption.split("/").pop();
            if (newCaption.length !== 0) {
                caption = newCaption;
            }
        }
    }

    // add the uinit=1 query params
    url += ( url.indexOf("?") !== -1 ? "&": "?") + "uinit=1";
    var keyValues = {
        "caption": caption,
        "url": url
    };
    var unformatted = module._renderTemplate(template, keyValues, this.table, this._context, {formatted: true});
    return {isHTML: true, value: module._formatUtils.printMarkdown(unformatted, {inline:true}), unformatted: unformatted};
};

/**
 * Returns the url_pattern defined in the annotation (the raw value and not computed).
 * @member {ERMrest.Refernece} urlPattern
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "urlPattern", {
    get: function () {
        if (this._urlPattern === undefined) {
            this._urlPattern = this._annotation.url_pattern;
        }
        return this._urlPattern;
    }
});

/**
 * The column object that filename is stored in.
 * @member {ERMrest.Column} filenameColumn
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "filenameColumn", {
    get: function () {
        if (this._filenameColumn === undefined) {
            try {
                // make sure the column exist
                this._filenameColumn = this.table.columns.get(this._annotation.filename_column);
            } catch (exception) {
                this._filenameColumn = null;
            }
        }
        return this._filenameColumn;
    }
});

/**
 * The column object that filename is stored in.
 * @member {ERMrest.Column} filenameColumn
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "byteCountColumn", {
    get: function () {
        if (this._byteCountColumn === undefined) {
            try {
                // make sure the column exist
                this._byteCountColumn = this.table.columns.get(this._annotation.byte_count_column);
            } catch (exception) {
                this._byteCountColumn = null;
            }
        }
        return this._byteCountColumn;
    }
});

/**
 * The column object that md5 hash is stored in.
 * @member {ERMrest.Column} md5
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "md5", {
    get: function () {
        if (this._md5 === undefined) {
            var md5 = this._annotation.md5;
            if (md5 === true) {
                this._md5 = true;
            } else {
                try {
                    // make sure the column exist
                    this._md5 = this.table.columns.get(md5);
                } catch (exception) {
                    this._md5 = null;
                }
            }
        }
        return this._md5;
    }
});

/**
 * The column object that sha256 hash is stored in.
 * @member {ERMrest.Column} sha256
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "sha256", {
    get: function () {
        if (this._sha256 === undefined) {
            var sha256 = this._annotation.sha256;
            if (sha256 === true) {
                this._sha256 = true;
            } else {
                try {
                    // make sure the column exist
                    this._sha256 = this.table.columns.get(sha256);
                } catch (exception) {
                    this._sha256 = null;
                }
            }
        }
        return this._sha256;
    }
});

/**
 * The column object that file extension is stored in.
 * @member {ERMrest.Column} filenameExtFilter
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "filenameExtFilter", {
    get: function () {
        if (this._filenameExtFilter === undefined) {
            this._filenameExtFilter = [];

            var ext = this._annotation.filename_ext_filter;
            if (typeof ext == 'string') {
                this._filenameExtFilter.push(ext);
            } else if (Array.isArray(ext)) {
                this._filenameExtFilter = ext;
            }
        }
        return this._filenameExtFilter;
    }
});

/**
 * @memberof ERMrest
 * @constructor
 * @class
 * @param {ERMrest.Reference} reference column's reference
 * @param {ERMrest.Reference} fk the foreignkey
 * @desc
 * Constructor for InboundForeignKeyPseudoColumn. This class is a wrapper for {@link ERMrest.ForeignKeyRef}.
 * This is a bit different than the {@link ERMrest.ForeignKeyPseudoColumn}, as that was for foreign keys
 * of current table. This wrapper is for inbound foreignkeys. It is actually warpping the whole reference (table).
 *
 * This class extends the {@link ERMrest.ReferenceColumn}
 */
function InboundForeignKeyPseudoColumn (reference, relatedReference, sourceObject, name) {
    var fk = relatedReference.origFKR;

    // call the parent constructor
    InboundForeignKeyPseudoColumn.superClass.call(this, relatedReference, fk.colset.columns, sourceObject);

    /**
     * The reference that can be used to get the data for this pseudo-column
     * @type {ERMrest.Reference}
     */
    this.reference = relatedReference;
    this.reference.session = reference._session;

    /**
     * The table that this pseudo-column represents
     * @type {ERMrest.Table}
     */
    this.table = relatedReference.table;

    /**
     * The {@link ERMrest.ForeignKeyRef} that this pseudo-column is based on.
     * @type {ERMrest.ForeignKeyRef}
     */
    this.foreignKey = fk;

    /**
     * @type {boolean}
     * @desc indicates that this object represents a PseudoColumn.
     */
    this.isPseudo = true;

    /**
     * @type {boolean}
     * @desc Indicates that this ReferenceColumn is an inbound foreign key.
     */
    this.isInboundForeignKey = true;

    this._context = reference._context;
    this._currentRef = reference;
    this._currentTable = reference.table;
    this._constraintName = fk._constraintName;

    this._name = name;
}

// extend the prototype
module._extends(InboundForeignKeyPseudoColumn, ReferenceColumn);

// properties to be overriden:
InboundForeignKeyPseudoColumn.prototype.formatPresentation = function(data, context, options) {
    // NOTE this property should not be used.
    return {isHTML: true, value: "", unformatted: ""};
 };
InboundForeignKeyPseudoColumn.prototype._determineSortable = function () {
    this._sortColumns_cached = [];
    this._sortable = false;
};
InboundForeignKeyPseudoColumn.prototype._determineInputDisabled = function () {
    throw new Error("can not use this type of column in entry mode.");
};
Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "name", {
    get: function () {
        if (this._name === undefined) {
            this._name = _generateForeignKeyName(this.foreignKey, true);
        }
        return this._name;
    }
});
Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "displayname", {
    get: function () {
        if (this._displayname === undefined) {
            this._displayname = this.reference.displayname;
        }
        return this._displayname;
    }
});
Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "comment", {
    get: function () {
        if (this._comment === undefined) {
            if (this.sourceObject.comment) {
                this._comment = this.sourceObject.comment;
            } else {
                this._comment = this.table.comment;
            }
        }
        return this._comment;
    }
});
Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "default", {
    get: function () {
        throw new Error("can not use this type of column in entry mode.");
    }
});
Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "nullok", {
    get: function () {
        throw new Error("can not use this type of column in entry mode.");
    }
});

/**
 * Represent facet columns that are available.
 * NOTE:
 * Based on facets JSON structure we can have joins that result in facets
 * on columns that are not part of reference column.
 *
 * TODO This is just experimental, the arguments might change eventually.
 *
 * If the ReferenceColumn is not provided, then the FacetColumn is for reference
 *
 * @param {ERMrest.Reference} reference the reference that this FacetColumn blongs to.
 * @param {int} index The index of this FacetColumn in the list of facetColumns
 * @param {ERMrest.Column} column the column that filters will be based on.
 * @param {?object} facetObject The filter object that this FacetColumn will be created based on
 * @param {?ERMrest.FacetFilter[]} filters Array of filters
 * @memberof ERMrest
 * @constructor
 */
function FacetColumn (reference, index, column, facetObject, filters) {

    /**
     * The column object that the filters are based on
     * @type {ERMrest.Column}
     */
    this._column = column;

    /**
     * The reference that this facet blongs to
     * @type {ERMrest.Reference}
     */
    this.reference = reference;

    /**
     * The index of facetColumn in the list of facetColumns
     * NOTE: Might not be needed
     * @type {int}
     */
    this.index = index;

    /**
     * A valid data-source path
     * NOTE: we're not validating this data-source, we assume that this is valid.
     * @type {obj|string}
     */
    this.dataSource = facetObject.source;

    /**
     * Filters that are applied to this facet.
     * @type{FacetFilter[]}
     */
    this.filters = [];
    if (Array.isArray(filters)) {
        this.filters = filters;
    } else {
        this._setFilters(facetObject);
    }

    // the whole filter object
    // NOTE: This might not include the filters
    this._facetObject = facetObject;
}
FacetColumn.prototype = {
    constructor: FacetColumn,

    /**
     * If has filters it will return true,
     * otherwise returns facetObject['open']
     * @type {Boolean}
     */
    get isOpen() {
        if (this._isOpen === undefined) {
            var open = this._facetObject.open;
            this._isOpen = (this.filters.length > 0) ? true : (open === true);
        }
        return this._isOpen;
    },

    get foreignKeys() {
        if (this._foreignKeys === undefined) {
            this._foreignKeys = _getFacetSourceForeignKeys(this.dataSource, this._column.table.schema.catalog.id, module._constraintNames);
        }
        return this._foreignKeys;
    },

    // returns the last foreignkey object in the path
    get _lastForeignKey() {
        if (this._lastForeignKey_cached === undefined) {
            this._lastForeignKey_cached = _getFacetSourceLastForeignKey(this.dataSource, this._column.table.schema.catalog.id, module._constraintNames);
        }
        return this._lastForeignKey_cached;
    },

    /**
     * The Preferred ux mode.
     * Any of:
     * `choices`, `ranges`, or `check_presence`
     * This should be used if we're not in entity mode.
     *
     * 1. use ux_mode if available
     * 2. use choices if in entity mode
     * 3. use range or chocies based on type.
     *
     * @type {string}
     */
    get preferredMode() {
        // a facet is in range mode if it's column's type is integer, float, date, timestamp, or serial
        function isRangeMode(column) {
            var typename = column.type.rootName;

            // returns true is the typename includes the given string
            function includesType(type) {
                return typename.indexOf(type) > -1;
            }

            return (includesType("serial") || includesType("int") || includesType("float") || includesType("date") || includesType("timestamp")) || (includesType("numeric"));
        }

        if (this._preferredMode === undefined) {
            var modes = module._facetUXModes;
            if (module._facetUXModeNames.indexOf(this._facetObject.ux_mode) !== -1) {
                this._preferredMode = this._facetObject.ux_mode;
            } else {
                this._preferredMode = (this.isEntityMode ? modes.CHOICE : (isRangeMode(this._column) ? modes.RANGE : modes.CHOICE) );
            }
        }
        return this._preferredMode;
    },

    /**
     * Returns true if the source is on a key column.
     * If facetObject['entity'] is defined as false, it will return false,
     * otherwise it will true if filter is based on key.
     *
     * @type {Boolean}
     */
    get isEntityMode() {
        if (this._isEntityMode === undefined) {
            var currCol = this._column;
            if (this._lastForeignKey === null) {
                // if from the same table, don't use entity picker
                this._isEntityMode = false;
            } else {
                var basedOnKey = !currCol.nullok && currCol.memberOfKeys.filter(function (key) {
                    return key.simple;
                }).length > 0;

                this._isEntityMode = (this._facetObject.entity === false) ? false : basedOnKey;
            }
        }
        return this._isEntityMode;
    },

    /**
     * Returns true if the plotly histogram graph should be shown in the UI
     * If _facetObject.barPlot is not defined, the value is true. By default
     * the histogram should be shown unless specified otherwise
     *
     * @type {Boolean}
     */
    get barPlot() {
        if (this._barPlot === undefined) {
            this._barPlot = (this._facetObject.bar_plot === false) ? false : true;

            // if it's not in the list of spported types we won't show it even if the user defined it in the annotation
            if (module._histogramSupportedTypes.indexOf(this.column.type.rootName) === -1) {
                this._barPlot = false;
            }

        }
        return this._barPlot;
    },

    /**
     * Returns the value of `barPlot.nBins` if it was defined as part of the
     * `facetObject` in the annotation. If undefined, the default # of buckets is 30
     *
     * @type {Integer}
     */
    get histogramBucketCount() {
        if (this._numBuckets === undefined) {
            this._numBuckets = 30;
            var barPlot = this._facetObject.bar_plot;
            if (barPlot && barPlot.n_bins) {
                this._numBuckets = barPlot.n_bins;
            }
        }
        return this._numBuckets;
    },

    /**
     * ReferenceColumn that this facetColumn is based on
     * @type {ERMrest.ReferenceColumn}
     */
    get column () {
        if (this._referenceColumn === undefined) {
            this._referenceColumn = new ReferenceColumn(this.sourceReference, [this._column]);
        }
        return this._referenceColumn;
    },

    /**
     * uncontextualized {@link ERMrest.Reference} that has all the joins specified
     * in the source with all the filters of other FacetColumns in the reference.
     *
     * NOTE needs refactoring,
     * This should return a reference that referes to the current column's table
     * having filters from other facetcolumns.
     * We should not use the absolute path for the table and it must be a path
     * from main to this table. Because if we use the absolute path we're completely
     * ignoring the constraints that the main table will add to this reference.
     * (For example if maximum possible value for this column is 100 but there's
     * no data from the main that will leads to this maximum.)
     *
     * Consider the following scenario:
     * Table T has two foreignkeys to R1 (fk1), R2 (fk2), and R3 (fk3).
     * R1 has a fitler for term=1, and R2 has a filter for term=2
     * Then the source reference for R3 will be the following:
     * T:=S:T/(fk1)/term=1/$T/(fk2)/term2/$T/M:=(fk3)
     * As you can see it has all the filters of the main table + join to current table.
     *
     * NOTE: assumptions:
     *  - The main reference has no join.
     *  - The returned reference has problem with faceting (cannot show faceting).
     *
     * @type {ERMrest.Reference}
     */
    get sourceReference () {
        if (this._sourceReference === undefined) {
            var jsonFilters = [],
                pathFromSource = [], // the path from source reference to this facetColumn
                self = this,
                table = this.reference.table;

            pathFromSource.push(module._fixedEncodeURIComponent(table.schema.name) + ":" + module._fixedEncodeURIComponent(table.name));

            if (this.reference.location.filtersString) {
                pathFromSource.push(this.reference.location.filtersString);
            }

            // create a path from reference to this facetColumn
            this.foreignKeys.forEach(function (fkObj) {
                pathFromSource.push(fkObj.obj.toString(!fkObj.isInbound, false));
            });

            // TODO might be able to improve this
            if (typeof this.reference.location.searchTerm === "string") {
                jsonFilters.push({"source": "*", "search": [this.reference.location.searchTerm]});
            }

            //get all the filters from other facetColumns
            if (this.reference.location.facets !== null) {
                // create new facet filters
                // TODO might be able to imporve this. Instead of recreating the whole json file.
                this.reference.facetColumns.forEach(function (fc, index) {
                    if (index !== self.index && fc.filters.length !== 0) {
                        jsonFilters.push(fc.toJSON());
                    }
                });
            }

            var uri = [
                table.schema.catalog.server.uri ,"catalog" ,
                table.schema.catalog.id, "entity",
                pathFromSource.join("/")
            ].join("/");

            this._sourceReference = new Reference(module.parse(uri), table.schema.catalog);

            if (jsonFilters.length > 0) {
                this._sourceReference._location.projectionFacets = {"and": jsonFilters};
            } else {
                this._sourceReference._location.projectionFacets = null;
            }
        }
        return this._sourceReference;
    },

    /**
     * Returns the displayname object that should be used for this facetColumn.
     * TODO the heuristics should be changed to be aligned with PseudoColumn
     * Heuristics are as follows (first applicable rule):
     *  0. If markdown_name is defined, use it.
     *  1. If column is part of the main table (there's no join), use the column's displayname.
     *  2. If last foreignkey is outbound and has to_name, use it.
     *  3. If last foreignkey is inbound and has from_name, use it.
     *  4. Otherwise use the table name.
     *    - If it's in `scalar` mode, append the column name. `table_name (column_name)`.
     *
     * @type {object} Object with `value`, `unformatted`, and `isHTML` as its attributes.
     */
    get displayname() {
        if (this._displayname === undefined) {
            var getDisplayname = function (self) {
                if (self._facetObject.markdown_name) {
                    return {
                        value: module._formatUtils.printMarkdown(self._facetObject.markdown_name, {inline:true}),
                        unformatted: self._facetObject.markdown_name,
                        isHTML: true
                    };
                }

                var lastFK = self._lastForeignKey ? self._lastForeignKey.obj : null;
                var lastFKIsInbound = self._lastForeignKey ? self._lastForeignKey.isInbound : null;

                // if is part of the main table, just return the column's displayname
                if (lastFK === null) {
                    return self.column.displayname;
                }

                // Otherwise
                var value, unformatted, isHTML = false;

                // use from_name of the last fk if it's inbound
                if (lastFKIsInbound && lastFK.from_name !== "") {
                    value = unformatted = lastFK.from_name;
                }
                // use to_name of the last fk if it's outbound
                else if (!lastFKIsInbound && lastFK.to_name !== "") {
                    value = unformatted = lastFK.to_name;
                }
                // use the table name if it was not defined
                else {
                    value = self.column.table.displayname.value;
                    unformatted = self.column.table.displayname.unformatted;
                    isHTML = self.column.table.displayname.isHTML;

                    if (!self.isEntityMode) {
                        value += " (" + self.column.displayname.value + ")";
                        unformatted += " (" + self.column.displayname.unformatted + ")";
                        if (!isHTML) {
                            isHTML = self.column.displayname.isHTML;
                        }
                    }
                }

                return {"value": value, "isHTML": isHTML, "unformatted": unformatted};
            };

            this._displayname = getDisplayname(this);
        }
        return this._displayname;
    },

    /**
     * Could be used as tooltip to provide more information about the facetColumn
     * @type {string}
     */
    get comment () {
        if (this._comment === undefined) {
            if (this._facetObject.comment) {
                this._comment = this._facetObject.comment;
            } else if (!this.isEntityMode) {
                    this._comment = this._column.comment;
            } else {
                this._comment = this._column.table.comment;
            }
        }
        return this._comment;
    },

    /**
     * Whether client should hide the null choice
     * @type {Boolean}
     */
    get hideNullChoice() {
        if (this._hideNullChoice === undefined) {
            // this._hideNullChoice = (this._facetObject.hide_null_choice === true);
            this._hideNullChoice = true;
        }
        return this._hideNullChoice;
    },

    /**
     * Whether client should hide the not-null choice
     * @type {Boolean}
     */
    get hideNotNullChoice() {
        if (this._hideNotNullChoice === undefined) {
            this._hideNotNullChoice = (this._facetObject.hide_not_null_choice === true);
        }
        return this._hideNotNullChoice;
    },

    /**
     * Whether we should hide the number of Occurrences column
     * @type {Boolean}
     */
    get hideNumOccurrences() {
        if (this._hideNumOccurrences === undefined) {
            this._hideNumOccurrences = (this._facetObject.hide_num_occurrences === true);
        }
        return this._hideNumOccurrences;
    },

    /**
     * Returns the sortColumns when we're sorting this facet in scalar mode
     * - uses row_order if defined.
     * - otherwise it will be descending of num_occurrences and column order of base column.
     * @type {Array}
     */
    get sortColumns() {
        verify(!this.isEntityMode, "sortColumns cannot be used in entity mode.");

        if (this._sortColumns === undefined) {
            this._determineSortable();
        }
        return this._sortColumns;
    },

    _determineSortable: function () {
        var self = this;

        var rowOrder = _processColumnOrderList(
            self._facetObject.order,
            self._column.table,
            {allowNumOccurrences: true}
        );

        // default sorting:
        // - descending frequency + ascending the column sort columns
        if (!Array.isArray(rowOrder) || rowOrder.length === 0) {
            self._sortColumns = [
                {num_occurrences: true, descending: true},
                {column: self._column, descending: false}
            ];
            return;
        }

        self._sortColumns = rowOrder;
        return;
    },

    /**
     * An {@link ERMrest.AttributeGroupReference} object that can be used to get
     * the available scalar values of this facet. This will use the sortColumns, and hideNumOccurrences APIs.
     * It will throw an error if it's used in entity-mode.
     * @type {ERMrest.AttributeGroupReference}
     */
    get scalarValuesReference() {
        verify(!this.isEntityMode, "this API cannot be used in entity-mode");

        if (this._scalarValuesRef === undefined) {
            this._scalarValuesRef = this.column.groupAggregate.entityCounts(this.sortColumns, this.hideNumOccurrences, true);
        }
        return this._scalarValuesRef;
    },

    /**
     * When presenting the applied choice filters, the displayname might be differnt from the value.
     * This only happens in case of entity-picker. Othercases we can just return the list of fitleres as is.
     * In case of entity-picker, we should get the displayname of the choices.
     * Therefore heuristic is as follows:
     *  - If no fitler -> resolve with empty list.
     *  - If in scalar mode -> resolve with list of filters (don't change their displaynames.)
     *  - Otherwise (entity-mode) -> generate an ermrest request to get the displaynames.
     *
     * NOTE This function will not return the null filter.
     *
     * @return {Promise} A promise resolved with list of objects that have `uniqueId`, and `displayname`.
     */
    getChoiceDisplaynames: function () {
        var defer = module._q.defer();
        var filters =  [];

        // if no filter, just resolve with empty list.
        if (this.choiceFilters.length === 0) {
            defer.resolve(filters);
        }
        // in scalar mode, use the their toString as displayname.
        else if (!this.isEntityMode) {
            this.choiceFilters.forEach(function (f) {
                // don't return the null filter
                if (f.term == null) return;

                // we don't have access to the tuple, so we cannot send it.
                filters.push({uniqueId: f.term, displayname: {value: f.toString(), isHTML:false}, tuple: null});
            });
            defer.resolve(filters);
        }
        // otherwise generate an ermrest request to get the displaynames.
        else {

            var table = this._column.table, columnName = this._column.name;
            var filterStr = [];

            // list of filters that we want their displaynames.
            this.choiceFilters.forEach(function (f) {
                // don't return the null filter
                if (f.term == null) {
                    return;
                }

                filterStr.push(
                    module._fixedEncodeURIComponent(columnName) + "=" + module._fixedEncodeURIComponent(f.term)
                );
            });

            // the case that we have only the null value.
            if (filterStr.length === 0) {
                defer.resolve(filters);
            }

            // create a url
            var uri = [
                table.schema.catalog.server.uri ,"catalog" ,
                table.schema.catalog.id, "entity",
                module._fixedEncodeURIComponent(table.schema.name) + ":" + module._fixedEncodeURIComponent(table.name),
                filterStr.join(";")
            ].join("/");

            var ref = new Reference(module.parse(uri), table.schema.catalog);

            ref = ref.sort([{"column": columnName, "descending": false}]);

            ref.read(this.choiceFilters.length).then(function (page) {
                page.tuples.forEach(function (t) {

                    // create the response
                    filters.push({uniqueId: t.data[columnName], displayname: t.displayname, tuple: t});
                });
                defer.resolve(filters);
            }).catch(function (err) {
                defer.reject(module._responseToError(err));
            });

        }
        return defer.promise;
    },

    /**
     * Return JSON presentation of the filters. This will be used in the location.
     * Anything that we want to leak to the url should be here.
     * It will be in the following format:
     *
     * ```
     * {
     *    "source": <data-source>,
     *    "choices": [v, ...],
     *    "ranges": [{"min": v1, "max": v2}, ...],
     *    "search": [v, ...],
     *    "not_null": true
     * }
     * ```
     *
     * @return {Object}
     */
    toJSON: function () {
        var res = { "source": Array.isArray(this.dataSource) ? this.dataSource.slice() : this.dataSource};

        // to avoid adding more than one null for json.
        var hasJSONNull = {};
        for (var i = 0, f; i < this.filters.length; i++) {
            f = this.filters[i];

            if (f.facetFilterKey === "not_null") {
                res.not_null = true;
                continue;
            }

            if (!(f.facetFilterKey in res)) {
                res[f.facetFilterKey] = [];
            }

            if ((this._column.type.name === "json" || this._column.type.name === "jsonb") &&
                f.facetFilterKey === "choices") {

                /*
                 * We cannot distinguish between json `null` in sql and actual `null`,
                 * therefore in other parts of code we're treating them the same.
                 * But to generate the filters, we have to add these two cases,
                 * that's why we're adding two values for null.
                 */
                if ((f.term === null || f.term === "null")) {
                    if (!hasJSONNull[f.facetFilterKey]) {
                        res[f.facetFilterKey].push(null, "null");
                    }
                    hasJSONNull[f.facetFilterKey] = true;
                } else {

                    /*
                     * We should make sure the JSON value that we are passing
                     * is valid, if we cannot parse it therefore it should be
                     * treated as string literal. For example if the term is
                     * just "test" then the JSON.parse will throw an error and
                     * stringifying it will turn it into "\"test\"" which is
                     * the valid JSON value.
                     */
                     if (typeof f.term === "string") {
                         value = JSON.stringify(f.term);
                     } else {
                         try {
                             var json = JSON.parse(f.term);
                             value = f.term;
                         } catch(exp) {
                             // if throws an error, then it should be treated as
                             // string and not JSON object.
                             value = JSON.stringify(f.term);
                         }
                     }

                    res[f.facetFilterKey].push(value);
                }
            } else {
                res[f.facetFilterKey].push(f.toJSON());
            }
        }

        return res;
    },

    /**
     * Given an object will create list of filters.
     *
     * NOTE: if we have not_null, other filters except =null are not relevant.
     * That means if we saw not_null:
     * 1. If =null exist, then set the filters to empty array.
     * 2. otherwise set the filter to just the not_null
     *
     * Expected object format format:
     * ```
     * {
     *    "source": <data-source>,
     *    "choices": [v, ...],
     *    "ranges": [{"min": v1, "max": v2}, ...],
     *    "search": [v, ...],
     *    "not_null": true
     * }
     * ```
     *
     * @param  {Object} json JSON representation of filters
     */
    _setFilters: function (json) {
        var self = this, current, hasNotNull = false;
        self.filters = [];

        if (!isDefinedAndNotNull(json)) {
            return;
        }

        // if there's a not_null other filters are not applicable.
        if (json.not_null === true) {
            self.filters.push(new NotNullFacetFilter());
            hasNotNull = true;
        }

        // create choice filters
        if (Array.isArray(json[module._facetFilterTypes.CHOICE])) {
            json[module._facetFilterTypes.CHOICE].forEach(function (ch) {

                /*
                 * We cannot distinguish between json `null` in sql and actual `null`,
                 * therefore we should treat them the same.
                 */
                if (self._column.type.name === "json" || self._column.type.name === "jsonb") {
                    if (ch === null || ch === "null") {
                        ch = null;
                    }
                }

                if (hasNotNull) {
                    // if not-null filter exists, the only relevant filter is =null.
                    // Other filters will be ignored.
                    // If =null exist, we are removing all the filters.
                    if (ch === null) {
                        self.filters = [];
                    }
                    return;
                }


                current = self.filters.filter(function (f) {
                    return (f instanceof ChoiceFacetFilter) && f.term === ch;
                })[0];

                if (current !== undefined) {
                    return; // don't add duplicate
                }

                self.filters.push(new ChoiceFacetFilter(ch, self._column));
            });
        }

        // create range filters
        if (!hasNotNull && Array.isArray(json[module._facetFilterTypes.RANGE])) {
            json[module._facetFilterTypes.RANGE].forEach(function (ch) {
                current = self.filters.filter(function (f) {
                    return (f instanceof RangeFacetFilter) && f.min === ch.min && f.max === ch.max;
                })[0];

                if (current !== undefined) {
                    return; // don't add duplicate
                }

                self.filters.push(new RangeFacetFilter(ch.min, ch.min_exclusive, ch.max, ch.max_exclusive, self._column));
            });
        }

        // create search filters
        if (!hasNotNull && Array.isArray(json[module._facetFilterTypes.SEARCH])) {
            json[module._facetFilterTypes.SEARCH].forEach(function (ch) {
                current = self.filters.filter(function (f) {
                    return (f instanceof SearchFacetFilter) && f.term === ch;
                })[0];

                if (current !== undefined) {
                    return; // don't add duplicate
                }

                self.filters.push(new SearchFacetFilter(ch, self._column));
            });
        }
    },

    /**
     * Returns true if the not-null filter exists.
     * @type {Boolean}
     */
    get hasNotNullFilter() {
        if (this._hasNotNullFilter === undefined) {
            this._hasNotNullFilter = this.filters.filter(function (f) {
                return (f instanceof NotNullFacetFilter);
            })[0] !== undefined;
        }
        return this._hasNotNullFilter;
    },

    /**
     * Returns true if choice null filter exists.
     * @type {Boolean}
     */
    get hasNullFilter() {
        if (this._hasNullFilter === undefined) {
            this._hasNullFilter = this.filters.filter(function (f) {
                return (f instanceof ChoiceFacetFilter) && f.term == null;
            })[0] !== undefined;
        }
        return this._hasNullFilter;
    },

    /**
     * search filters
     * NOTE ASSUMES that filters is immutable
     * @type {ERMREst.SearchFacetFilter[]}
     */
    get searchFilters() {
        if (this._searchFilters === undefined) {
            this._searchFilters = this.filters.filter(function (f) {
                return f instanceof SearchFacetFilter;
            });
        }
        return this._searchFilters;
    },

    /**
     * choce filters
     * NOTE ASSUMES that filters is immutable
     * @type {ERMREst.ChoiceFacetFilter[]}
     */
    get choiceFilters() {
        if (this._choiceFilters === undefined) {
            this._choiceFilters = this.filters.filter(function (f) {
                return f instanceof ChoiceFacetFilter;
            });
        }
        return this._choiceFilters;
    },

    /**
     * range filters
     * NOTE ASSUMES that filters is immutable
     * @type {ERMREst.RangeFacetFilter[]}
     */
    get rangeFilters() {
        if (this._rangeFilters === undefined) {
            this._rangeFilters = this.filters.filter(function (f) {
                return f instanceof RangeFacetFilter;
            });
        }
        return this._rangeFilters;
    },

    /**
     * Create a new Reference with appending a new Search filter to current FacetColumn
     * @param  {String} term the term for search
     * @return {ERMrest.Reference} the Reference with the new filter
     */
    addSearchFilter: function (term) {
        verify (isDefinedAndNotNull(term), "`term` is required.");

        var filters = this.filters.slice();
        filters.push(new SearchFacetFilter(term, this._column));

        return this._applyFilters(filters);
    },

    /**
     * Create a new Reference with appending a list of choice filters to current FacetColumn
     * @return {ERMrest.Reference} the reference with the new filter
     */
    addChoiceFilters: function (values) {
        verify(Array.isArray(values), "given argument must be an array");

        var filters = this.filters.slice(), self = this;
        values.forEach(function (v) {
            filters.push(new ChoiceFacetFilter(v, self._column));
        });

        return this._applyFilters(filters);
    },

    /**
     * Create a new Reference with replacing choice facet filters by the given input
     * This will also remove NotNullFacetFilter
     * @return {ERMrest.Reference} the reference with the new filter
     */
    replaceAllChoiceFilters: function (values) {
        verify(Array.isArray(values), "given argument must be an array");
        var self = this;
        var filters = this.filters.slice().filter(function (f) {
            return !(f instanceof ChoiceFacetFilter) && !(f instanceof NotNullFacetFilter);
        });
        values.forEach(function (v) {
            filters.push(new ChoiceFacetFilter(v, self._column));
        });

        return this._applyFilters(filters);
    },

    /**
     * Given a term, it will remove any choice filter with that term (if any).
     * @param  {String[]|int[]} terms array of terms
     * @return {ERMrest.Reference} the reference with the new filter
     */
    removeChoiceFilters: function (terms) {
        verify(Array.isArray(terms), "given argument must be an array");
        var filters = this.filters.slice().filter(function (f) {
            return !(f instanceof ChoiceFacetFilter) || (terms.indexOf(f.term) === -1);
        });
        return this._applyFilters(filters);
    },

    /**
     * Create a new Reference with appending a new range filter to current FacetColumn
     * @param  {String|int=} min minimum value. Can be null or undefined.
     * @param  {boolean=} minExclusive whether the minimum boundary is exclusive or not.
     * @param  {String|int=} max maximum value. Can be null or undefined.
     * @param  {boolean=} maxExclusive whether the maximum boundary is exclusive or not.
     * @return {ERMrest.Reference} the reference with the new filter
     */
    addRangeFilter: function (min, minExclusive, max, maxExclusive) {
        verify (isDefinedAndNotNull(min) || isDefinedAndNotNull(max), "One of min and max must be defined.");

        var current = this.filters.filter(function (f) {
            return (f instanceof RangeFacetFilter) && f.min === min && f.max === max && f.minExclusive == minExclusive && f.maxExclusive == maxExclusive;
        })[0];

        if (current !== undefined) {
            return false;
        }

        var filters = this.filters.slice();
        var newFilter = new RangeFacetFilter(min, minExclusive, max, maxExclusive, this._column);
        filters.push(newFilter);

        return {
            reference: this._applyFilters(filters),
            filter: newFilter
        };
    },

    /**
     * Create a new Reference with removing any range filter that has the given min and max combination.
     * @param  {String|int=} min minimum value. Can be null or undefined.
     * @param  {boolean=} minExclusive whether the minimum boundary is exclusive or not.
     * @param  {String|int=} max maximum value. Can be null or undefined.
     * @param  {boolean=} maxExclusive whether the maximum boundary is exclusive or not.
     * @return {ERMrest.Reference} the reference with the new filter
     */
    removeRangeFilter: function (min, minExclusive, max, maxExclusive) {
        //TODO needs refactoring
        verify (isDefinedAndNotNull(min) || isDefinedAndNotNull(max), "One of min and max must be defined.");
        var filters = this.filters.filter(function (f) {
            return !(f instanceof RangeFacetFilter) || !(f.min === min && f.max === max && f.minExclusive == minExclusive && f.maxExclusive == maxExclusive);
        });
        return {
            reference: this._applyFilters(filters)
        };
    },

    /**
     * Create a new Reference with removing all the filters and adding a not-null filter.
     * NOTE based on current usecases this is currently removing all the previous filters.
     * We might need to change this behavior in the future. I could change the behavior of
     * this function to only add the filter, and then in the client first remove all and thenadd
     * addNotNullFilter, but since the code is not very optimized that would result on a heavy
     * operation.
     * @return {ERMrest.Reference}
     */
    addNotNullFilter: function () {
        return this._applyFilters([new NotNullFacetFilter()]);
    },

    /**
     * Create a new Reference without any filters.
     * @return {ERMrest.Reference}
     */
    removeNotNullFilter: function () {
        var filters = this.filters.filter(function (f) {
            return !(f instanceof NotNullFacetFilter);
        });
        return this._applyFilters(filters);
    },

    /**
     * Create a new Reference by removing all the filters from current facet.
     * @return {ERMrest.Reference} the reference with the new filter
     */
    removeAllFilters: function() {
        return this._applyFilters([]);
    },

    /**
     * Create a new Reference by removing a filter from current facet.
     * @param  {int} index index of element that we want to remove from list
     * @return {ERMrest.Reference} the reference with the new filter
     */
    removeFilter: function (index) {
        var filters = this.filters.slice();
        filters.splice(index, 1);

        return this._applyFilters(filters);
    },


    /**
     * Given an array of {@link ERMrest.FacetFilter}, will return a new
     * {@link ERMrest.Reference} with the applied filters to the current FacetColumn
     * @private
     * @param  {ERMrest.FacetFilter[]} filters array of filters
     * @return {ERMrest.Reference} the reference with the new filter
     */
    _applyFilters: function (filters) {
        var self = this;
        var newReference = _referenceCopy(this.reference);
        newReference._facetColumns = [];

        // create a new FacetColumn so it doesn't reference to the current FacetColum
        // TODO can be refactored
        var jsonFilters = [];

        // TODO might be able to imporve this. Instead of recreating the whole json file.
        // gather all the filters from the facetColumns
        // NOTE: this part can be improved so we just change one JSON element.
        var newFc;
        this.reference.facetColumns.forEach(function (fc) {
            if (fc.index !== self.index) {
                newFc = new FacetColumn(newReference, fc.index, fc._column, fc._facetObject, fc.filters.slice());
            } else {
                newFc = new FacetColumn(newReference, self.index, self._column, self._facetObject, filters);
            }

            newReference._facetColumns.push(newFc);

            if (newFc.filters.length !== 0) {
                jsonFilters.push(newFc.toJSON());
            }
        });

        newReference._location = this.reference._location._clone();
        newReference._location.beforeObject = null;
        newReference._location.afterObject = null;

        // TODO might be able to improve this
        if (typeof this.reference.location.searchTerm === "string") {
            jsonFilters.push({"source": "*", "search": [this.reference.location.searchTerm]});
        }

        // change the facets in location object
        if (jsonFilters.length > 0) {
            newReference._location.facets = {"and": jsonFilters};
        } else {
            newReference._location.facets = null;
        }

        return newReference;
    }
};

/**
 * Represent filters that can be applied to facet
 *
 * @param       {String|int} term the valeu of filter
 * @constructor
 * @memberof ERMrest
 */
function FacetFilter(term, column) {
    this._column = column;
    this.term = term;
    this.uniqueId = term;
}
FacetFilter.prototype = {
    constructor: FacetFilter,

    /**
     * String representation of filter
     * @return {string}
     */
    toString: function () {
        if (this.term == null) {
            return null;
        }
        return this._column.formatvalue(this.term, module._contexts.COMPACT_SELECT);
    },

    /**
     * JSON representation of filter
     * @return {string}
     */
    toJSON: function () {
        return this.term;
    }
};
/**
 * Represent search filters that can be applied to facet.
 * JSON representation of this filter:
 * "search": [v1, ...]
 *
 * Extends {@link ERMrest.FacetFilter}.
 * @param       {String|int} term the valeu of filter
 * @constructor
 * @memberof ERMrest
 */
function SearchFacetFilter(term, column) {
    SearchFacetFilter.superClass.call(this, term, column);
    this.facetFilterKey = module._facetFilterTypes.SEARCH;
}
module._extends(SearchFacetFilter, FacetFilter);

/**
 * Represent choice filters that can be applied to facet.
 * JSON representation of this filter:
 * "choices": [v1, ...]
 *
 * Extends {@link ERMrest.FacetFilter}.
 * @param       {String|int} term the valeu of filter
 * @constructor
 * @memberof ERMrest
 */
function ChoiceFacetFilter(value, column) {
    ChoiceFacetFilter.superClass.call(this, value, column);
    this.facetFilterKey = module._facetFilterTypes.CHOICE;
}
module._extends(ChoiceFacetFilter, FacetFilter);

/**
 * Represent range filters that can be applied to facet.
 * JSON representation of this filter:
 * "ranges": [{min: v1, max: v2}]
 *
 * Extends {@link ERMrest.FacetFilter}.
 * @param       {String|int=} min
 * @param       {boolean=} minExclusive whether the min filter is exclusive or not
 * @param       {String|int=} max
 * @param       {boolean=} maxExclusive whether the max filter is exclusive or not
 * @param       {ERMrest.Type}
 * @constructor
 * @memberof ERMrest
 */
function RangeFacetFilter(min, minExclusive, max, maxExclusive, column) {
    this._column = column;
    this.min = !isDefinedAndNotNull(min) ? null : min;
    this.minExclusive = (minExclusive === true) ? true: false;
    this.max = !isDefinedAndNotNull(max) ? null : max;
    this.maxExclusive = (maxExclusive === true) ? true: false;
    this.facetFilterKey = module._facetFilterTypes.RANGE;
    this.uniqueId = this.toString();
}
module._extends(RangeFacetFilter, FacetFilter);

/**
 * String representation of range filter. With the format of:
 *
 * - both min and max defined: `{{min}}-{{max}}`
 * - only min defined: `> {{min}}`
 * - only max defined: `< {{max}}`
 *
 * @return {string}
 */
RangeFacetFilter.prototype.toString = function () {
    var opt, self = this;
    var getValue = function (isMin) {
        return self._column.formatvalue((isMin ? self.min : self.max), module._contexts.COMPACT_SELECT);
    };

    // assumption: at least one of them is defined
    if (!isDefinedAndNotNull(this.max)) {
        return (this.minExclusive ? "> " : "≥ ") + getValue(true);
    }
    if (!isDefinedAndNotNull(this.min)) {
        return (this.maxExclusive ? "< " : "≤ ") + getValue();
    }
    return getValue(true) + " to " + getValue();
};

/**
 * JSON representation of range filter.
 * @return {Object}
 */
RangeFacetFilter.prototype.toJSON = function () {
    var res = {};
    if (isDefinedAndNotNull(this.max)) {
        res.max = this.max;
    }
    if (this.maxExclusive === true) {
        res.max_exclusive = true;
    }

    if (isDefinedAndNotNull(this.min)) {
        res.min = this.min;
    }
    if (this.minExclusive === true) {
        res.min_exclusive = true;
    }

    return res;
};

/**
 * Represents not_null filter.
 * It doesn't have the same toJSON and toString functions, since
 * the only thing that client would need is question of existence of this type of filter.
 * @constructor
 * @memberof ERMrest
 */
function NotNullFacetFilter () {
    this.facetFilterKey = "not_null";
}

/**
 * Constructs an Aggregate Function object
 *
 * Column Aggregate Functions is a collection of available aggregates for the
 * particular ReferenceColumn (min, max, count not null, and count distinct for it's column).
 * Each aggregate should return the string representation for querying for that information.
 *
 * Usage:
 *  Clients _do not_ directly access this constructor. ERMrest.ReferenceColumn
 *  will access this constructor for purposes of fetching aggregate data
 *  for a specific column
 * @memberof ERMrest
 * @class
 * @param {ERMrest.ReferenceColumn} column - the column that is used for creating column aggregates
 */
function ColumnAggregateFn (column) {
    this.column = column;
}

ColumnAggregateFn.prototype = {
    /**
     * @type {Object}
     * @desc minimum aggregate representation
     */
    get minAgg() {
        return "min(" + module._fixedEncodeURIComponent(this.column.name) + ")";
    },

    /**
     * @type {Object}
     * @desc maximum aggregate representation
     */
    get maxAgg() {
        return "max(" + module._fixedEncodeURIComponent(this.column.name) + ")";
    },

    /**
     * @type {Object}
     * @desc not null count aggregate representation
     */
    get countNotNullAgg() {
        return "cnt(" + module._fixedEncodeURIComponent(this.column.name) + ")";
    },

    /**
     * @type {Object}
     * @desc distinct count aggregate representation
     */
    get countDistinctAgg() {
        return "cnt_d(" + module._fixedEncodeURIComponent(this.column.name) + ")";
    }
};

/**
 * Can be used to access group aggregate functions.
 * Usage:
 *  Clients _do not_ directly access this constructor. ERMrest.ReferenceColumn
 *  will access this constructor for purposes of fetching grouped aggregate data
 *  for a specific column
 *
 * @param {ERMrest.ReferenceColumn} column The column that is used for creating grouped aggregate
 * @memberof ERMrest
 * @constructor
 */
function ColumnGroupAggregateFn (column) {
    this.column = column;

    this._ref = this.column._baseReference;
}

ColumnGroupAggregateFn.prototype = {
    /**
     * Will return a compact/select attribute group reference which can be used to show distinct values and their counts
     * The result is based on shortest key of the parent table. If we have join
     * in the path, we are counting the shortest key of the parent table (not the end table).
     * NOTE: Will create a new reference by each call.
     * @type {Object=} sortColumns the sort column object that you want to pass
     * @type {Boolean=} hideNumOccurrences whether we should add number of Occurrences or not.
     * @type {Boolean=} dontAllowNull whether the null value should be returned for the facet or not.
     * @returns {ERMrest.AttributeGroupReference}
     */
    entityCounts: function(sortColumns, hideNumOccurrences, dontAllowNull) {
        if (this.column.isPseudo) {
            throw new Error("Cannot use this API on pseudo-column.");
        }

        if (this._ref.location.hasJoin && this._ref.projectionTable.shortestKey.length > 1) {
            throw new Error("Table must have a simple key for entity counts: " + this._ref.projectionTable.name);
        }

        var countColName = "count",
            context = module._contexts.COMPACT_SELECT,
            column = this.column,
            self = this,
            sortCounts = false,
            keyColumns = [],
            sortObj = [], i = 0, colAlias;

        // key columns will have numbers as alias, and the aggregate is `count`
        var addToKeyColumns = function (col, isVisible) {
            colAlias = (i++).toString();
            keyColumns.push(new AttributeGroupColumn(
                colAlias,
                module._fixedEncodeURIComponent(col.name),
                col, null, null, col.comment, true, isVisible
            ));
            return colAlias;
        };

        // the first column is always the column that we want to get the values of
        addToKeyColumns(column._baseCols[0], true);

        if (Array.isArray(sortColumns) && sortColumns.length > 0) {
            sortColumns.forEach(function (sc) {
                // if column is not sortable
                if (sc.column && typeof sc.column._getSortColumns(context) === 'undefined') {
                    console.log("column " + sc.column.name + " is not sortable and we're removing it from sort columns (entityCounts).");
                    return;
                }

                if (sc.num_occurrences && !sortCounts) {
                    sortCounts = true;
                    sortObj.push({column: countColName, descending: sc.descending});
                } else if (sc.column.name === column.name) {
                    sortObj.push({column: "0", descending: sc.descending});
                } else {
                    // add to key columns
                    var keyAlias = addToKeyColumns(sc.column);

                    // add to sortObj
                    sortObj.push({column: keyAlias, descending: sc.descending});
                }
            });
        } else {
            // by default we're sorting based on descending count and ascending raw value.
            sortObj = [{column: countColName, descending: true}, {column: "0", descending: false}];
            showFrequency = true;
        }

        // search will be on the table not the aggregated results, so the column name must be the column name in the database
        var searchObj = {"column": self.column.name, "term": null};

        var path = self._ref.location.ermrestCompactPath;
        if (dontAllowNull) {
            var encodedColName = module._fixedEncodeURIComponent(self.column.name);
            path += "/!(" + encodedColName + "::null::";
            // when it's json, we cannot possibly know the difference between database null and
            // json null, so we need to filter both.
            if (self.column.type.name.indexOf('json') === 0) {
                path += ";" + encodedColName + "=null";
            }
            path +=")";
        }

        var loc = new AttributeGroupLocation(self._ref.location.service, self._ref.table.schema.catalog.id, path, searchObj, sortObj);

        var aggregateColumns = [];

        // if it's hidden and also not in the sort, then we don't need it.
        if (!hideNumOccurrences || sortCounts) {
            var countName = "cnt(*)";
            if (self._ref.location.hasJoin) {
                countName = "cnt_d(" + self._ref.location.projectionTableAlias + ":" + module._fixedEncodeURIComponent(self._ref.projectionTable.shortestKey[0].name) + ")";
            }

            aggregateColumns.push(
                new AttributeGroupColumn(countColName, countName, null, "Number of Occurrences", new Type({typename: "int"}), "", true, !hideNumOccurrences)
            );
        }

        return new AttributeGroupReference(keyColumns, aggregateColumns, loc, self._ref.table.schema.catalog, context);
    },

    /**
     * Given number of buckets, min and max will return bin of results.
     * The result is based on shortest key of the parent table. If we have join
     * in the path, we are creating the histogram based on shortest key of the
     * parent table (not the end table).
     * @param  {int} bucketCount number of buckets
     * @param  {int} min         minimum value
     * @param  {int} max         maximum value
     * @return {ERMrest.BucketAttributeGroupReference}
     */
    histogram: function (bucketCount, min, max) {
        verify(typeof bucketCount === "number", "Invalid bucket count type.");
        verify(min !== undefined && max !== undefined, "Minimum and maximum are required.");
        verify(max >= min, "Maximum must be greater than the minimum");
        var column = this.column;
        var reference = this._ref;

        if (column.isPseudo) {
            throw new Error("Cannot use this API on pseudo-column.");
        }

        if (module._histogramSupportedTypes.indexOf(column.type.rootName) === -1) {
            throw new Error("Binning is not supported on column type " + column.type.name);
        }

        if (reference.location.hasJoin && reference.projectionTable.shortestKey.length > 1) {
            throw new Error("Table must have a simple key.");
        }

        var width, range, minMoment, maxMoment;

        var absMax = max,
            moment = module._moment;

        if (column.type.rootName.indexOf("date") > -1) {
            // we don't want to make a request for date aggregates that split in the middle of a day, so the max
            // value used is adjusted so that the range between min and max divided by number of buckets is a whole
            // integer after converted back to days ( (max-min)/width )
            minMoment = moment(min);
            maxMoment = moment(max);

            // bin API does not support using an equivalent min and max
            if (maxMoment.diff(minMoment) === 0) {
                maxMoment.add(1, 'd');
            }

            // moment.diff() returns the number of milliseconds between the 2 moments in time.
            // moment.duration(milliseconds).asDays() creates a duration from the milliseconds value and converts
            //   that to the number of days that milliseconds value reprsents
            // We don't want a bucket to represent a portion of a day, so define our width as the next largest number of days
            width = Math.ceil( moment.duration( (maxMoment.diff(minMoment))/bucketCount ).asDays() );
            // This is adjusted so that if we have 30 buckets and a range of 2 days, one day isn't split into multiple buckets (dates represent a whole day)
            absMax = minMoment.add(width*bucketCount, 'd').format(module._dataFormats.DATE);
        } else if (column.type.rootName.indexOf("timestamp") > -1) {
            minMoment = moment(min);
            maxMoment = moment(max);

            // bin API does not support using an equivalent min and max
            if (maxMoment.diff(minMoment) === 0) {
                // generate a new max value so each bucket represents a 10 second period of time
                maxMoment.add(10*bucketCount, 's');
                absMax = maxMoment.format(module._dataFormats.DATETIME.submission);
            }

            width = Math.round( moment.duration( (maxMoment.diff(minMoment))/bucketCount ).asSeconds() );

            // increase width to be minimum of 1 second
            if (width < 1) {
                width = 1;
            }
        } else {
            // bin API does not support using an equivalent min and max
            if (max-min === 0) {
                max++;
                absMax = max;
            }

            width = (max-min)/bucketCount;
            if (column.type.rootName.indexOf("int") > -1) {
                // we don't want to make a request for int aggregates that create float values for bucket min/max values, so the max
                // value used is adjusted so that the range between min and max divided by number of buckets is a whole integer
                width = Math.ceil(width);
                absMax = (min + (width*bucketCount));
            }
        }

        return new BucketAttributeGroupReference(column, reference, min, absMax, bucketCount, width);
    }
};
