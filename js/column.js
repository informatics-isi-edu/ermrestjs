/**
 * @namespace ERMrest.Reference
 */

/**
 * Will create the appropriate ReferenceColumn object based on the given sourceObject.
 * It will return the follwing objects:
 * - If aggregate: PseudoColumn
 * - If self_link: KeyPseudoColumn
 * - If no path, scalar, asset annot:AssetPseudoColumn
 * - If no path, scalar (or entity in entry context): ReferenceColumn
 * - If path, entity, outbound length 1: ForeignKeyPseudoColumn
 * - If path, entity, inbound length 1: InboundForeignKeyPseudoColumn
 * - If path, entity, p&b association: InboundForeignKeyPseudoColumn
 * - Otherwise: PseudoColumn
 *
 * @private
 * @param  {ERMrest.Reference}  reference    the parent reference
 * @param  {ERMrest.Column}  column       the underlying column object
 * @param  {ERMrest.SourceObjectWrapper}  sourceObjectWrapper the column definition
 * @param  {ERMrest.Tuple=}  mainTuple    the main tuple
 * @param  {String=}  name         the name to avoid computing it again.
 * @return {ERMrest.ReferenceColumn}
 */
module._createPseudoColumn = function (reference, sourceObjectWrapper, mainTuple) {
    var sourceObject = sourceObjectWrapper.sourceObject,
    column = sourceObjectWrapper.column,
    name  = sourceObjectWrapper.name,
    context = reference._context,
    relatedRef, fk;

    var generalPseudo = function () {
        return new PseudoColumn(reference, sourceObjectWrapper.column, sourceObjectWrapper, name, mainTuple);
    };

    var getFK = function (constraint) {
        return module._getConstraintObject(reference.table.schema.catalog.id, constraint[0], constraint[1]).object;
    };



    // has aggregate
    if (sourceObjectWrapper.hasAggregate) {
        return generalPseudo();
    }

    if (!sourceObjectWrapper.hasPath) {
        // make sure the column is unique not-null
        if (sourceObject.self_link === true && column.isUniqueNotNull) {
            return new KeyPseudoColumn(reference, column.uniqueNotNullKey, sourceObjectWrapper, name);
         }

        // no path, scalar, asset
        if (column.type.name === "text" && column.annotations.contains(module._annotations.ASSET)) {
            return new AssetPseudoColumn(reference, column, sourceObjectWrapper);
        }

        // no path, scalar
        return new ReferenceColumn(reference, [column], sourceObjectWrapper, name, mainTuple);
    }

    // path, entity, outbound length 1, (cannot have any filters)
    if (sourceObjectWrapper.isEntityMode && !sourceObjectWrapper.isFiltered && sourceObjectWrapper.foreignKeyPathLength === 1 && !sourceObjectWrapper.firstForeignKeyNode.isInbound) {
        fk = sourceObjectWrapper.firstForeignKeyNode.nodeObject;
        return new ForeignKeyPseudoColumn(reference, fk, sourceObjectWrapper, name);
    }

    // path, entity, inbound length 1 (it can have filter)
    if (sourceObjectWrapper.isEntityMode && sourceObjectWrapper.foreignKeyPathLength === 1 && sourceObjectWrapper.firstForeignKeyNode.isInbound) {
        fk = sourceObjectWrapper.firstForeignKeyNode.nodeObject;
        relatedRef = reference._generateRelatedReference(fk, mainTuple, false, sourceObjectWrapper);
        return new InboundForeignKeyPseudoColumn(reference, relatedRef, sourceObjectWrapper, name);
    }

    // path, entity, inbound outbound p&b (it can have filter)
    if (sourceObjectWrapper.isEntityMode && sourceObjectWrapper.foreignKeyPathLength === 2 && sourceObjectWrapper.firstForeignKeyNode.isInbound && !sourceObjectWrapper.lastForeignKeyNode.isInbound) {
        fk = sourceObjectWrapper.firstForeignKeyNode.nodeObject;
        if (fk._table.isPureBinaryAssociation) {
            relatedRef = reference._generateRelatedReference(fk, mainTuple, true, sourceObjectWrapper);
            return new InboundForeignKeyPseudoColumn(reference, relatedRef, sourceObjectWrapper, name);
        }
    }

    return generalPseudo();
};


/**
 * @memberof ERMrest
 * @constructor
 * @param {ERMrest.Reference} reference column's reference
 * @param {ERMrest.Column[]} baseCols List of columns that this reference-column will be created based on.
 * @param {ERMrest.SourceObjectWrapper} sourceObjectWrapper the sourceObjectWrapper object (might be undefined)
 * @param {string} name        to avoid processing the name again, this might be undefined.
 * @param {ERMrest.Tuple} mainTuple   if the reference is referring to just one tuple, this is defined.
 * @desc
 * Constructor for ReferenceColumn. This class is a wrapper for {@link ERMrest.Column}.
 */
function ReferenceColumn(reference, cols, sourceObjectWrapper, name, mainTuple) {
    this._baseReference = reference;
    this._context = reference._context;
    this._baseCols = cols;

    this.sourceObjectWrapper = sourceObjectWrapper;
    this.sourceObject = {};
    if (isObjectAndNotNull(sourceObjectWrapper)) {
        this.sourceObject = sourceObjectWrapper.sourceObject;

        this.sourceObjectNodes = this.sourceObjectWrapper.sourceObjectNodes;

        this.lastForeignKeyNode = this.sourceObjectWrapper.lastForeignKeyNode;

        this.firstForeignKeyNode = this.sourceObjectWrapper.firstForeignKeyNode;

        this.foreignKeyPathLength = this.sourceObjectWrapper.foreignKeyPathLength;

        /**
         * If the pseudoColumn has filter in its path
         * @type {boolean}
         */
        this.isFiltered = this.sourceObjectWrapper.isFiltered;
        /**
         * The properties related to filter in source
         * @type {Object}
         */
        this.filterProps = this.sourceObjectWrapper.filterProps;
    } else {
        this.isFiltered = false;
        this.filterProps = {};
    }

    /**
     * @type {boolean}
     * @desc indicates that this object represents a Column.
     */
    this.isPseudo = false;

    /**
     * @type {ERMrest.Table}
     */
    this.table = this._baseCols.length > 0 ? this._baseCols[0].table : reference.table;

    this._currentTable = this._baseCols.length > 0 ? this._baseCols[0].table : reference.table;

    this._name = name;

    this._mainTuple = mainTuple;

    this.isUnique = true;
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
     * the compressed source path from the main reference to this column
     * @type{Object}
     */
    get compressedDataSource() {
        if (this._compressedDataSource === undefined) {
            var ds;
            if (this.sourceObject && this.sourceObject.source) {
                ds = this.sourceObject.source;
            } else if (this._simple) {
                ds = this._baseCols[0].name;
            } else {
                ds = null;
            }

            this._compressedDataSource = _compressSource(ds);
        }
        return this._compressedDataSource;
    },

    /**
     * @type {object}
     * @desc name of the column.
     */
    get displayname() {
        if (this._displayname === undefined) {
            if (this.sourceObject.markdown_name) {
                this._displayname = {
                    value: module.renderMarkdown(this.sourceObject.markdown_name, true),
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
            var com = _processSourceObjectColumn(this.sourceObject);
            if (typeof com === "string") {
                this._comment = com;
            } else {
                this._comment = this._simple ? this._baseCols[0].comment : null;
            }
        }
        return this._comment;
    },

    get commentDisplay() {
        if (this._commentDisplay === undefined) {
            if (this.sourceObject && _isValidModelComment(this.sourceObject.comment) && _isValidModelCommentDisplay(this.sourceObject.comment_display)) {
                // only change commentDisplay if comment and comment_display are both defined
                this._commentDisplay = this.sourceObject.comment_display;
            } else {
                this._commentDisplay = module._commentDisplayModes.tooltip;
            }
        }
        return this._commentDisplay;
    },

    /**
     * @desc Whether the UI should hide the column header or not.
     * @type {boolean}
     */
    get hideColumnHeader() {
        if (this._hideColumnHeader === undefined) {
            this._hideColumnHeader = this.display.hideColumnHeader || false;
        }
        return this._hideColumnHeader;
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
     *  - `hideColumnHeader`: true|false|null
     *
     * @type {Object}
     */
    get display() {
        if (this._display_cached === undefined) {
            var res = {}, colDisplay = {}, sourceDisplay = {};
            if (this._simple) {
                colDisplay = this._baseCols[0].getDisplay(this._context);
            }

            // attach display defined on the source
            if (this.sourceObject && this.sourceObject.display) {
                var displ = this.sourceObject.display;
                if (typeof displ.markdown_pattern === "string") {
                    sourceDisplay.sourceMarkdownPattern = displ.markdown_pattern;
                    sourceDisplay.sourceTemplateEngine = displ.template_engine;
                }
            }

            if (this.sourceObject && typeof this.sourceObject.hide_column_header === "boolean") {
                sourceDisplay.hideColumnHeader = this.sourceObject.hide_column_header;
            }

            // I'm using assign to avoid changing the original colDisplay
            // it was causing issues and some columns were using other column's display properties
            Object.assign(res, colDisplay, sourceDisplay);
            this._display_cached = res;
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
     * @param {String=} context the context of app (optional)
     * @param {Object=} options (optional)
     * @returns {string} The formatted value.
     */
    formatvalue: function(data, context, options) {
        if (this._simple) {
            if (!isStringAndNotEmpty(context)) {
                context = this._context;
            }
            return this._baseCols[0].formatvalue(data, context, options);
        }
        return data.toString();
    },

    /**
     * Formats the presentation value corresponding to this reference-column definition.
     * It will return:
     *  - rendered value of sourceMarkdownPattern if exists.
     *  - rendered value of formatPresentation of underlying columns joined by ":".
     *
     * @param {Object} data the raw data of the table.
     * @param {String=} context the app context (optional)
     * @param {Object=} templateVariables the template variables that should be used (optional)
     * @param {Object=} options (optional)
     * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
     */
    formatPresentation: function(data, context, templateVariables, options) {
        data = data || {};
        options = options || {};

        if (!isStringAndNotEmpty(context)) {
            context = this._context;
        }

        // if there's wait_for, this should return null.
        if (this.hasWaitFor && !options.skipWaitFor) {
            return {
                isHTML: false,
                value: this._getNullValue(context),
                unformatted: this._getNullValue(context)
            };
        }

        if (this.display.sourceMarkdownPattern) {
            var res, keyValues = {}, selfTemplateVariables = {}, cols = this._baseCols;

            if (cols.length > 0) {
                if (this._simple) {
                    selfTemplateVariables = {
                        "$self": cols[0].formatvalue(data[cols[0].name], context, options),
                        "$_self": data[cols[0].name]
                    };
                } else {
                    var values = {};
                    cols.forEach(function (col) {
                        values[col.name] = col.formatvalue(data[col.name], context, options);
                        values["_" + col.name] = data[col.name];
                    });
                    selfTemplateVariables = {
                        "$self": {
                            "values" : values
                        }
                    };
                }
            }

            Object.assign(keyValues, templateVariables, selfTemplateVariables);
            return module.processMarkdownPattern(
                this.display.sourceMarkdownPattern,
                keyValues,
                this.table,
                context,
                {templateEngine: this.display.sourceTemplateEngine}
            );
        }

        if (this._simple) {
            return this._baseCols[0].formatPresentation(data, context, templateVariables, options);
        }

        var isHTML = false, value = "", unformatted = "", curr;
        for (var i = 0; i < this._baseCols.length; i++) {
            curr = this._baseCols[i].formatPresentation(data, context, templateVariables, options);
            if (!isHTML && curr.isHTML) {
                isHTML = true;
            }
            value += (i>0 ? ":" : "") + curr.value;
            unformatted += (i>0 ? ":" : "") + curr.unformatted;
        }
        return {isHTML: isHTML, value: value, unformatted: unformatted};
    },

    _determineInputDisabled: function(context) {
        if (this._simple) {
            return this._baseCols[0].getInputDisabled(context);
        }

        var cols = this._baseCols, generated, i;

        // TODO does the following make sense? shouldn't it also check for ACLs and etc (column.inputDisabled)?
        if (context == module._contexts.CREATE) {
            // if one is not generated
            for (i = 0; i < cols.length; i++) {
                if (!_processACLAnnotation(cols[i].annotations, module._annotations.GENERATED, false)) {
                    return false;
                }
            }

            // if all GENERATED
            return {
                message: "Automatically generated"
            };

        } else if (context == module._contexts.EDIT) {
            // at least one is IMMUTABLE, so the whole thing is immutable
            var atLesatOneImmutable = cols.some(function (col) {
                return _processACLAnnotation(col.annotations, module._annotations.IMMUTABLE, false);
            });
            if (atLesatOneImmutable) {
                return true;
            }
            // if all are generated, the whole thing is immutable
            var allAreGenerated = cols.every(function (col) {
                var isImmutable = _processACLAnnotation(col.annotations, module._annotations.IMMUTABLE, null),
                    isGenerated = _processACLAnnotation(col.annotations, module._annotations.GENERATED, false);
                // if isImmutable===false, then that column is mutable based on annotation
                return isImmutable !== false && isGenerated;
            });
            return allAreGenerated;
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
        return this.table._getNullValue(context);
    },

    /**
     * Whether we should show the link for the foreignkey value.
     * this can be based on:
     *  - sourceObject.display.show_foreign_key_link
     *  - or, show_foreign_key_link defined on the last foreignKey display annotation
     *  - or, show_foreign_key_link defined on the table, schema, or catalog
     * TODO this function shouldn't accept context and instead should just use the current context.
     * But before that we have to refactor .formatPresentation functions to use the current context
     * @param {string} context
     * @return {boolean}
     */
    _getShowForeignKeyLink: function (context) {
        var self = this;

        // has no foreign key path: not applicable
        if (!isObjectAndNotNull(self.firstForeignKeyNode)) {
            return true;
        }

        // find it in the source syntax
        if (self.sourceObject.display && typeof self.sourceObject.display.show_foreign_key_link === "boolean") {
          return self.sourceObject.display.show_foreign_key_link;
        }


        // TODO shouldn't it be the last?
        // get it from the foreignkey (which might be derived from catalog, schema, or table)
        return self.firstForeignKeyNode.nodeObject.getDisplay(context).showForeignKeyLink;
    },

    /**
     * Whether there are aggregate or entity set columns in the wai_for list of this column.
     * @return {Boolean}
     */
    get hasWaitFor() {
        if (this._hasWaitFor === undefined) {
            // will generate the _hasWaitFor
            var waitFor = this.waitFor;
        }
        return this._hasWaitFor;
    },

    /**
     * Whether there are aggregate columns in the wait_for list of this column.
     * @return {Boolean}
     */
    get hasWaitForAggregate() {
        if (this._hasWaitForAggregate === undefined) {
            // will generate the _hasWaitFor
            var waitFor = this.waitFor;
        }
        return this._hasWaitForAggregate;
    },

    /**
     * Array of columns that the current column value depends on. It will get the list from:
     * - source display.wait_for, or
     * - column-display.wait_for or key-display.wait_for (depending on the type of column)
     * @type {ERMrest.ReferenceColumn[]}
     */
    get waitFor() {
        if (this._waitFor === undefined) {
            var self = this;
            var wfDef = [];
            if (self.sourceObject && self.sourceObject.display) {
                wfDef = self.sourceObject.display.wait_for;
            }

            var res = module._processWaitForList(wfDef, self._baseReference, self._currentTable, self, self._mainTuple, "pseudo-column=`" + self.displayname.value + "`");
            this._waitFor = res.waitForList;
            this._hasWaitFor = res.hasWaitFor;
            this._hasWaitForAggregate = res.hasWaitForAggregate;
        }
        return this._waitFor;
    },

    /**
     * This function should not be used in entry context
     * TODO looks like something that can be moved down to different column types.
     * Should be called once every value is retrieved
     * @param  {Object} templateVariables     [description]
     * @param  {Object} columnValue the value of aggregate column (if it's aggregate)
     * @param  {ERMrest.Tuple} mainTuple             [description]
     * @return {Object}                       [description]
     */
    sourceFormatPresentation: function (templateVariables, columnValue, mainTuple) {
        // go through the wait for to make sure all is done
        var context = this._context, self = this;

        var nullValue = {
            isHTML: false,
            value: this._getNullValue(context),
            unformatted: this._getNullValue(context)
        };

        if (self.display.sourceMarkdownPattern) {
            var keyValues = {}, selfTemplateVariables = {};
            var baseCol = self._baseCols[0];

            // TODO could be refactored so other places use the same piece of code
            // create the $self object
            if (self.isPathColumn && self.hasAggregate && columnValue) {
                selfTemplateVariables = columnValue.templateVariables;
            } else if (self.isForeignKey || (self.isPathColumn && self.hasPath && self.isUnique)) {
                if (!mainTuple._linkedData[self.name]) {
                    selfTemplateVariables = {};
                } else if (!self.isForeignKey && !self.isEntityMode) {
                    selfTemplateVariables = {
                        "$self": baseCol.formatvalue(mainTuple._linkedData[self.name][baseCol.name], context),
                        "$_self": mainTuple._linkedData[self.name][baseCol.name]
                    };
                } else {
                    selfTemplateVariables = {
                        "$self": module._getRowTemplateVariables(self.table, context, mainTuple._linkedData[self.name])
                    };
                }
            } else if (self.isKey) {
                selfTemplateVariables = {
                    "$self": module._getRowTemplateVariables(self.table, context, mainTuple._data)
                };
            } else if (baseCol) {
                selfTemplateVariables = {
                    "$self": baseCol.formatvalue(mainTuple.data[baseCol.name], context),
                    "$_self": mainTuple.data[baseCol.name]
                };
            }

            Object.assign(keyValues, templateVariables, selfTemplateVariables);
            return module.processMarkdownPattern(
                self.display.sourceMarkdownPattern,
                keyValues,
                self.table,
                context,
                {templateEngine: self.display.sourceTemplateEngine}
            );
        }

        // when there's waifor but no sourceMarkdownPattern
        // NOTE: why not just return the value from the templateVariables?
        //  - this column might not be part of the templateVariables

        // aggregate
        if (self.isPathColumn && self.hasAggregate) {
            return columnValue ? columnValue : nullValue;
        }

        // all outbound
        if (self.isForeignKey || (self.isPathColumn && self.hasPath && self.isUnique)) {
            return self.formatPresentation(mainTuple._linkedData[self.name], mainTuple._pageRef._context, null, {skipWaitFor: true});
        }

        // rest of the cases
        // NOTE by passing the given templateVariables instead of the one attached to the main tuple, we're supporting wait_for in column and key display.
        // (in combination with the wait_for logic that looks for the one that is defined on column/key display)
        var pres = self.formatPresentation(mainTuple._data, mainTuple._pageRef._context, templateVariables, {skipWaitFor: true});
        if (self.type.name === "gene_sequence") {
            pres.isHTML = true;
        }
        return pres;

    }
};

/**
 * A pseudo-column without any actual source definition behind it.
 * This constructor assumes that the sourceObject has markdown_name and display.markdown_pattern.
 *
 * The name is currently generated by the visible columns logic. It will use the
 * "$<markdown_name>" pattern and if a column with this name already exists in the table,
 * it will append "-<integer>" to it.
 *
 * @memberof ERMrest
 * @param {ERMrest.Reference} reference  column's reference
 * @param {ERMrest.Column} column      the column that this pseudo-column is representing
 * @param {ERMrest.SourceObjectWrapper} sourceObjectWrapper the sourceObjectWrapper object (might be undefined)
 * @param {string} name        to avoid processing the name again, this might be undefined.
 * @param {ERMrest.Tuple} mainTuple   if the reference is referring to just one tuple, this is defined.
 * @constructor
 * @class
 */
function VirtualColumn(reference, sourceObjectWrapper, name, mainTuple) {
    VirtualColumn.superClass.call(this, reference, [], sourceObjectWrapper, name, mainTuple);

    this.isPseudo = true;

    this.isVirtualColumn = true;
}

// extend the prototype
module._extends(VirtualColumn, ReferenceColumn);

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
 * @param {ERMrest.SourceObjectWrapper} sourceObjectWrapper the sourceObjectWrapper object (might be undefined)
 * @param {string} name        to avoid processing the name again, this might be undefined.
 * @param {ERMrest.Tuple} mainTuple   if the reference is referring to just one tuple, this is defined.
 * @constructor
 * @class
 */
function PseudoColumn (reference, column, sourceObjectWrapper, name, mainTuple) {
    PseudoColumn.superClass.call(this, reference, [column], sourceObjectWrapper, name, mainTuple);

    /**
     * @type {boolean}
     * @desc indicates that this object represents a PseudoColumn.
     */
    this.isPseudo = true;

    this.isPathColumn = true;

    /**
     * If the pseudo-column is connected via a path to the table or not.
     * @type {boolean}
     */
    this.hasPath = this.sourceObjectWrapper.hasPath;

    /**
     * If the pseudoColumn is in entity mode
     * @type {boolean}
     */
    this.isEntityMode = this.sourceObjectWrapper.isEntityMode;

    /**
     * If the pseudoColumn is referring to a unique row (the path is one to one)
     * @type {boolean}
     */
    this.isUnique = this.sourceObjectWrapper.isUnique;

    /**
     * If aggregate function is defined on the column.
     * @type {boolean}
     */
    this.hasAggregate = this.sourceObjectWrapper.hasAggregate;

    this.baseColumn = column;

    this._currentTable = reference.table;

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
 * @param {String=} context the app context (optional)
 * @param {Object=} templateVariables the template variables that should be used (optional)
 * @param {Object=} options (optional)
 * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
 */
PseudoColumn.prototype.formatPresentation = function(data, context, templateVariables, options) {
    data = data || {};
    options = options || {};

    if (!isStringAndNotEmpty(context)) {
        context = this._context;
    }

    var nullValue = {
        isHTML: false,
        value: this._getNullValue(context),
        unformatted: this._getNullValue(context)
    };

    if (module._isEntryContext(context)) {
        return nullValue;
    }

    if (this.hasWaitFor && !options.skipWaitFor) {
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

    // make sure templateVariables is valid
    if (!isObjectAndNotNull(templateVariables)) {
        templateVariables = module._getFormattedKeyValues(this.table, context, data);
    }

    // not in entity mode, just return the column value.
    if (!this.isEntityMode) {
        // we should not pass the same templateVariables to the parent,
        // since when it goes to the parent it will be based on the leaf table
        // while the templateVariables is based on the parent table.
        // only if we're going to use this with sourceMarkdownPattern we should pass this value
        return PseudoColumn.super.formatPresentation.call(this, data, context, this.display.sourceMarkdownPattern ? templateVariables : null);
    }

    if (this.display.sourceMarkdownPattern) {
        var keyValues = {}, selfTemplateVariables = {
            "$self": module._getRowTemplateVariables(this.table, context, data)
        };
        Object.assign(keyValues, templateVariables, selfTemplateVariables);
        return module.processMarkdownPattern(
            this.display.sourceMarkdownPattern,
            keyValues,
            this.table,
            context,
            {templateEngine: this.display.sourceTemplateEngine}
        );
    }

    // in entity mode, return the foreignkey value
    var pres = module._generateRowPresentation(this.lastForeignKeyNode.nodeObject.key, data, context, this._getShowForeignKeyLink(context));
    return pres ? pres: nullValue;
};

/**
 * Returns a promise that gets resolved with list of aggregated values in the same
 * order of tuples of the page that is passed.
 * Each returned value has the following attributes:
 *  - value
 *  - isHTML
 *  - templateVariables (TODO)
 *
 * implementation Notes:
 * 1. This function will take care of url limitation. It might generate multiple
 * ermrest requests based on the url length, and will resolve the promise when
 * all the requests have been succeeded. If we cannot fit all the requests, an
 * error will be thrown.
 * 2. Only in case of entity scalar aggregate we are going to get all the row data.
 * In other cases, the returned data will only include the scalar value.
 * 3. Regarding the returned value:
 *  3.0. Null and empty string values are treated the same way as any array column.
 *  We are going to show the special value for them.
 *  3.1. If it's an array aggregate:
 *      3.1.1. array_display will dictate how we should join the values (csv, olist, ulist, raw).
 *      3.1.2. array_options will dictate the sort and length criteria.
 *      3.1.3. Based on entity/scalar mode:
 *          3.1.3.1. In scalar mode, only pre_format will be applied to each value.
 *          3.1.3.2. In entity mode, we are going to return list of row_names derived from `row_name/compact`.
 *  3.2. Otherwise we will only apply the pre_format annotation for the column.
 *
 * @param  {ERMrest.Page} page               the page object of main (current) refernece
 * @param {Object} contextHeaderParams the object that we want to log.
 * @return {Promise}
 */
PseudoColumn.prototype.getAggregatedValue = function (page, contextHeaderParams) {
    var defer = module._q.defer(),
        self = this,
        promises = [], values = [],
        mainTable = this._currentTable,
        location = this._baseReference.location,
        http = this._baseReference._server.http,
        column = this._baseCols[0],
        keyColName, keyColNameEncoded,
        baseUri, basePath, pathToCol, tempUri, i, filterStr, projection;

    var sourceMarkdownPattern = this.display.sourceMarkdownPattern;
    var sourceTemplateEngine = this.display.sourceTemplateEngine;

    // this will dictates whether we should show rowname or not
    var isRow = self.isEntityMode && module._pseudoColEntityAggregateFns.indexOf(self.sourceObject.aggregate) != -1;

    // use `compact` context for entity array aggregates
    var context = isRow ? module._contexts.COMPACT : self._context;

    // verify the input
    try {
        verify(this.hasAggregate, "this function should only be used when `hasAggregate` is true.");
        verify(page && (page instanceof Page), "page is required.");
        verify(page.reference.table === mainTable, "given page object must be from the base table.");
    } catch (e) {
        defer.reject(e);
        return defer.promise;
    }

    // array_options
    var columnOrder, maxLength;
    if (self.sourceObject.aggregate.indexOf("array") != -1 && typeof self.sourceObject.array_options === "object") {

        // order
        if (self.sourceObject.array_options.order) {
            columnOrder = _processColumnOrderList(
                self.sourceObject.array_options.order,
                column.table
            );
        }

        // max_length
        if (Number.isInteger(self.sourceObject.array_options.max_length)) {
            maxLength = self.sourceObject.array_options.max_length;
        }
    }

    // create the header
    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
        contextHeaderParams = {"action": "read/aggregate"};
    }
    var config = {
        headers: self.reference._generateContextHeader(contextHeaderParams, page.tuples.length)
    };

    // will format a single value
    var getFormattedValue = function (val) {
        if (isRow) {
            var pres = module._generateRowPresentation(self.key, val, context, self._getShowForeignKeyLink(context));

            return pres ? pres.unformatted : null;
        }
        if (val == null || val === "") {
            return val;
        }
        return column.formatvalue(val, context);
    };

    // it will sort the array values and then format them.
    var getArrayValue = function (val) {
        // try to sort the values
        try {
            val.sort(function (a, b) {
                // order is not defined, just sort based on the column value
                if (!columnOrder || columnOrder.length === 0) {
                    // if isRow, a and b will be objects
                    if (isRow) {
                        return column.compare(a[column.name], b[column.name]);
                    }
                    return column.compare(a, b);
                }

                // sort the values based on the defined `order`
                for (var j = 0; j < columnOrder.length; j++) {
                    var col = columnOrder[j].column, comp;

                    // if it's not row, it will be just array of results
                    if (!isRow) {
                        // ignore invalid order options
                        if (col.name !== column.name) continue;
                        comp = col.compare(a, b);
                    } else {
                        comp = col.compare(a[col.name], b[col.name]);
                    }

                    // if they are equal go to the next column in `order`
                    if (comp !== 0) {
                        return (columnOrder[j].descending ? -1 : 1) * comp;
                    }
                }

                // they are equal
                return 0;
            });
        } catch(e) {
            // if sort threw any erros, we just leave it as is
        }

        // limit the values
        if (maxLength) {
            val = val.slice(0, maxLength);
        }

        // formatted array result
        var arrayRes = module._formatUtils.printArray(
            val.map(getFormattedValue),
            {
                isMarkdown: (column.type.name === "markdown") || isRow,
                returnArray: true
            }
        );

        var res = "";
        // find array display
        var array_display = self.sourceObject.array_display;
        if (self.sourceObject.display && typeof self.sourceObject.display.array_ux_mode === "string") {
            array_display = self.sourceObject.display.array_ux_mode;
        }

        // print the array in a comma seperated value (list) or bullets
        switch (array_display) {
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

        // populate templateVariables
        var templateVariables = {};
        if (!isRow) {
            templateVariables = {"$self": res, "$_self": val};
        } else {
            templateVariables = {
                "$self": val.map(function (v) {
                    return module._getRowTemplateVariables(column.table, context, v);
                })
            };
        }

        if (sourceMarkdownPattern) {
            res = module._renderTemplate(
                sourceMarkdownPattern,
                templateVariables,
                column.table.schema.catalog,
                {templateEngine: sourceTemplateEngine}
            );

            if (res === null || res.trim() === '') {
                res = column.table._getNullValue(context);
            }
        }
        return {value: module.renderMarkdown(res, false), templateVariables: templateVariables};
    };

    // return empty list if page is empty
    if (page.tuples.length === 0) {
        defer.resolve(values);
        return defer.promise;
    }

    // make sure table has shortestkey of length 1
    if (mainTable.shortestKey.length > 1) {
        module._log.warn("This function only works with tables that have at least a simple key.");
        defer.resolve(values);
        return defer.promise;
    }

    var currTable = "T";
    var baseTable = self.hasPath ? "M": currTable;

    keyColName = mainTable.shortestKey[0].name;
    keyColNameEncoded = module._fixedEncodeURIComponent(mainTable.shortestKey[0].name);
    projection = "/c:=:" + baseTable + ":" + keyColNameEncoded +
                 ";v:=" + self.sourceObject.aggregate +
                 "(" + currTable + ":" + (isRow ? "*" : module._fixedEncodeURIComponent(column.name)) + ")";

    // generate the base path in the following format:
    // <baseUri><basePath><filters><path-to-pseudo-col><projection>
    // the following shows where `/` is stored for each part:
    // <baseUri/><basePath/><filters></path-from-main-to-pseudo-col></projection>
    baseUri = [location.service, "catalog", location.catalog, "attributegroup"].join("/") + "/";
    basePath = baseTable + ":=" + module._fixedEncodeURIComponent(mainTable.schema.name) + ":" + module._fixedEncodeURIComponent(mainTable.name) + "/";
    pathToCol = self.sourceObjectWrapper.toString(false, false, currTable);
    if (pathToCol.length > 0) {
        pathToCol = "/" + pathToCol;
    }

    // make sure just projection and base uri doesn't go over limit.
    if (basePath.length + pathToCol.length + projection.length >= module.URL_PATH_LENGTH_LIMIT) {
        module._log.warn("couldn't generate the requests because of url limitation");
        defer.resolve(values);
        return defer.promise;
    }

    // get the computed filters
    var keyValueRes = module.generateKeyValueFilters(
        mainTable.shortestKey,
        page.tuples.map(function (t) { return t.data;  }),
        mainTable.schema.catalog,
        (basePath + pathToCol + projection).length,
        mainTable.displayname.value
    );

    if (!keyValueRes.successful) {
        module._log.warn(keyValueRes.message);
        defer.resolve(values);
        return defer.promise;
    }

    // turn the paths into requests
    promises = keyValueRes.filters.map(function (f) {
        return http.get(baseUri + basePath + f.path + pathToCol + projection, config);
    });

    // if adding any of the filters would go over url limit
    if (promises.length === 0) {
        module._log.warn("couldn't generate the requests because of url limitation");
        defer.resolve(values);
        return defer.promise;
    }

    module._q.all(promises).then(function (response) {
        var values = [],
            result = [],
            value, res, isHTML, arrayValues;

        response.forEach(function (r) {
            values = values.concat(r.data);
        });

        // make sure we're returning the result in the same order as input
        page.tuples.forEach(function (t, index) {
            // find the corresponding value in result
            value = values.find(function (v) {
                return v.c == t.data[keyColName];
            });

            // if given page is not valid (the key doesn't exist), or it returned empty result
            if (!value || !value.v){
                if (["cnt", "cnt_d"].indexOf(self.sourceObject.aggregate) !== -1) {
                    result.push({isHTML: false, value: "0", templateVariables: { "$self": "0", "$_self": 0 }});
                } else {
                    result.push({isHTML: false, value: "", templateVariables: {}});
                }
                return;
            }

            // array formatting is different
            if (self.sourceObject.aggregate.indexOf("array") === 0){
                var arrValue = getArrayValue(value.v);
                result.push({value: arrValue.value, isHTML: true, templateVariables: arrValue.templateVariables});
                return;
            }

            var formatted, isHTML;

            // cnt and cnt_d are special since they will generate integer always
            if (["cnt", "cnt_d"].indexOf(self.sourceObject.aggregate) !== -1) {
                isHTML = false;
                formatted = module._formatUtils.printInteger(value.v);
            } else {
                isHTML = (column.type.name === "markdown");
                formatted = getFormattedValue(value.v);
            }

            var res = formatted;
            var templateVariables = { "$self": formatted, "$_self": value.v };
            if (sourceMarkdownPattern) {
                isHTML = true;
                res = module._renderTemplate(
                    sourceMarkdownPattern,
                    templateVariables,
                    column.table.schema.catalog,
                    {templateEngine: sourceTemplateEngine}
                );

                if (res === null || res.trim() === '') {
                    res = column.table._getNullValue(context);
                    isHTML = false;
                }
            }

            if (isHTML) {
                res = module.renderMarkdown(res, false);
            }

            result.push({isHTML: isHTML, value: res, templateVariables: templateVariables});
        });

        defer.resolve(result);
    }).catch(function (err) {
        defer.reject(module.responseToError(err));
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
            var fk = this.lastForeignKeyNode.nodeObject;
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

/**
 * The tooltip that should be used for this column.
 * It will return the first applicable rule:
 * 1. comment that is defined on the sourceObject, use it.
 * 2. if aggregate and scalar use the "<function> <col_displayname>"
 * 3. if aggregate and entity use the "<function> <table_displayname>"
 * 3. In entity mode, return the table's displayname.
 * 4. In scalar return the column's displayname.
 *
 * @member {Object} comment
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "comment", {
    get: function () {
        if (this._comment === undefined) {
            var getComment = function (self) {
                var com = _processSourceObjectColumn(self.sourceObject);
                if (typeof com === "string") {
                    return com;
                }

                if (self.hasAggregate) {
                    var agIndex = module._pseudoColAggregateFns.indexOf(self.sourceObject.aggregate);
                    var dname = self._baseCols[0].displayname.unformatted;
                    if (self.isEntityMode) {
                        dname = self._baseCols[0].table.displayname.unformatted;
                    }

                    return [module._pseudoColAggregateExplicitName[agIndex], dname].join(" ");
                }

                if (!self.isEntityMode) {
                    return self._baseCols[0].comment;
                }

                // self.table should be leaf table
                return self.table.getDisplay(self._context).comment;
            };

            this._comment = getComment(this);
        }
        return this._comment;
    }
});

// NOTE: this only works for multi hop with inbound foreign key
/**
 * The mode the tooltip should be displayed in for this column.
 * It will return the first applicable rule:
 * 1. commentDisplay that is defined on the sourceObject
 * 2. commentDisplay that is defined on the table in the display annotation
 * 3. default to "tooltip"
 *
 * @member {Object} commentDisplay
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "commentDisplay", {
    get: function () {
        if (this._commentDisplay === undefined) {
            var getDisplay = function (self) {
                if (self.sourceObject && _isValidModelComment(self.sourceObject.comment) && _isValidModelCommentDisplay(self.sourceObject.comment_display)) {
                    return self.sourceObject.comment_display;
                }

                var def = module._commentDisplayModes.tooltip;
                if (!self.isEntityMode || self.hasAggregate) {
                    return def;
                }

                // self.table should be leaf table
                var display = self.table.getDisplay(self._context);
                if (_isValidModelCommentDisplay(display.tableCommentDisplay) && _isValidModelComment(display.comment)) {
                    return display.tableCommentDisplay;
                }

                return def;
            };

            this._commentDisplay = getDisplay(this);
        }
        return this._commentDisplay;
    }
});

/**
 * The tooltip that should be used for this column.
 * It will return the first applicable rule:
 * 1. comment that is defined on the sourceObject, use it.
 * 2. if aggregate and scalar use the "<function> <col_displayname>"
 * 3. if aggregate and entity use the "<function> <table_displayname>"
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
                        value: module.renderMarkdown(self.sourceObject.markdown_name, true),
                        unformatted: self.sourceObject.markdown_name,
                        isHTML: true
                    };
                    return;
                }

                if (self.hasAggregate) {
                    // actual displayname
                    Object.getOwnPropertyDescriptor(PseudoColumn.super, "displayname").get.call(self);
                    var displayname = self.isEntityMode ? self._baseCols[0].table.displayname : self._displayname;

                    // prefix
                    var agIndex = module._pseudoColAggregateFns.indexOf(self.sourceObject.aggregate);
                    var name = module._pseudoColAggregateNames[agIndex];

                    self._displayname =  {
                        value: (name ? [name, displayname.value].join(" ") : displayname.value),
                        unformatted: (name ? [name, displayname.unformatted].join(" ") : displayname.unformatted),
                        isHTML: displayname.isHTML
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
 * If the pseudoColumn is in entity mode will return the key that this column represents
 * @member {boolean} key
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "key", {
    get: function () {
        if (this._key === undefined) {
            this._key = this.isEntityMode ? this.baseColumn.uniqueNotNullKey : null;
        }
        return this._key;
    }
});

Object.defineProperty(PseudoColumn.prototype, "aggregateFn", {
    get: function () {
        if (this._aggregateFn === undefined) {
            this._aggregateFn = this.hasAggregate ? this.sourceObject.aggregate : null;
        }
        return this._aggregateFn;
    }
});

/**
 * Returns a reference to the current pseudo-column
 * This is how it behaves:
 * 1. If pseudo-column has no path, it will return the base reference.
 * 3. if mainTuple is available, create the reference based on this path:
 *      <pseudoColumnSchema:PseudoColumnTable>/<path from pseudo-column to main table>/<facets based on value of shortestkey of main table>
 * 4. Otherwise create the path by traversing the path
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


                var facet;
                if (self._mainTuple) {
                    facet = self.sourceObjectWrapper.getReverseAsFacet(self._mainTuple, self._baseReference.table);
                }

                // if data didn't exist, we should traverse the path
                var uri = self.table.uri;
                if (!isObjectAndNotNull(facet)) {
                    uri = self._baseReference.location.compactUri + "/" + self.sourceObjectWrapper.toString(false, false);
                }

                self._reference = new Reference(module.parse(uri), self.table.schema.catalog);

                // make sure data exists
                if (isObjectAndNotNull(facet)) {
                    self._reference.location.facets = facet;
                }
            }

            // attach the current pseudo-column to the reference
            self._reference.pseudoColumn = self;

            // make sure data-source is available on the reference
            // TODO this has been added to be consistent with the old related reference apis
            // other apis are not available, maybe we should add them as well? (origFKR, etc.)
            self._reference.compressedDataSource = self.compressedDataSource;

            // make sure the refernece has the correct displayname
            if (self.hasPath) {
                self._reference._displayname = self.displayname;
                self._reference._comment = self.comment;
                self._reference._commentDisplay = self.commentDisplay;
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
 * Whether we can use the raw column in the projection list or not.
 *
 * If we only need the value of scalar column and none of the other columns of the
 * all-outbound path then we can simply use the scalar projection.
 * Therefore the pseudo-column must:
 * - be all-outbound path in scalar mode
 * - the leaf column cannot have any column_display annotation
 * - the leaf column cannot be sorted or doesn’t have a sort based on other columns of the table.
 *
 *
 * @member {Object} canUseScalarProjection
 * @memberof ERMrest.PseudoColumn#
 */
Object.defineProperty(PseudoColumn.prototype, "canUseScalarProjection", {
    get: function () {
        if (this._canUseScalarProjection === undefined) {
            var populate = function (self) {
                // only in scalar mode
                if (self.isEntityMode || !self.isUnique) {
                    return false;
                }
                // if it has column_display we cannot use scalar
                if (self.baseColumn.getDisplay(self._context).isMarkdownPattern) {
                    return false;
                }
                // if it's sortable and based on other columns, we cannot use scalar
                var sortCols = self._sortColumns;
                if (self.sortable &&
                    (sortCols.length != 1 || sortCols[0].column.name != self.baseColumn.name)) {
                    return false;
                }

                return true;
            };
            this._canUseScalarProjection = populate(this);
        }
        return this._canUseScalarProjection;
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
function ForeignKeyPseudoColumn (reference, fk, sourceObjectWrapper, name) {
    // call the parent constructor
    ForeignKeyPseudoColumn.superClass.call(this, reference, fk.colset.columns, sourceObjectWrapper, name);

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

    /**
     * @type {ERMrest.ForeignKeyRef}
     * @desc The Foreign key object that this PseudoColumn is created based on
     */
    this.foreignKey = fk;

    // NOTE added for compatibility
    // I cannot simply create a sourceObjectWrapper because it needs a shortestkey of length one.
    if (!isObjectAndNotNull(sourceObjectWrapper)) {
        this.lastForeignKeyNode = new SourceObjectNode(fk, false, true);
        this.firstForeignKeyNode = this.lastForeignKeyNode;
        this.sourceObjectNodes = [this.lastForeignKeyNode];
        this.foreignKeyPathLength = 1;
    }

    this._constraintName = this.foreignKey._constraintName;

    this.table = this.foreignKey.key.table;
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
    var getFilteredRef = function (self) {
        var currURI = self.reference.uri,
            currTable = self.reference.table, // the projected table
            baseTable = self._baseReference.table, // the main (base) table
            keyValues, // formated key values used in tempating
            content, // the annotation content
            filterPattern, // the filter pattern
            filterPatternTemplate, // the template used with the pattern
            uriFilter, // the ermrest path
            displayname, // the displayname value
            displaynameMkdn, //capture the unformatted value of displayname
            location, // the output location (used for creating the output reference)
            cfacets; // custom facet created based on the filter pattern

        // if the annotaion didn't exist
        if (!self.foreignKey.annotations.contains(module._annotations.FOREIGN_KEY)) {
            return new Reference(module.parse(currURI), currTable.schema.catalog);
        }

        keyValues = module._getFormattedKeyValues(baseTable, self._context, data, linkedData);
        content = self.foreignKey.annotations.get(module._annotations.FOREIGN_KEY).content;

        // make sure the annotation is properly defined
        if (isObjectAndNotNull(content.domain_filter) && isStringAndNotEmpty(content.domain_filter.ermrest_path_pattern)) {
            filterPattern = content.domain_filter.ermrest_path_pattern;
            filterPatternTemplate = content.domain_filter.template_engine;

            // if displayname is passed, process it
            if (isStringAndNotEmpty(content.domain_filter.display_markdown_pattern)) {
                displaynameMkdn = module._renderTemplate(
                    content.domain_filter.display_markdown_pattern,
                    keyValues,
                    baseTable.schema.catalog,
                    {templateEngine: filterPatternTemplate}
                );

                if (displaynameMkdn != null && displaynameMkdn.trim() !== '') {
                    displayname = module.renderMarkdown(displaynameMkdn, true);
                }
            }
        }
        // backward compatibility
        else if (typeof content.domain_filter_pattern === "string") {
            filterPattern = content.domain_filter_pattern;
            filterPatternTemplate = content.template_engine;
        }

        // process the filter pattern
        if (filterPattern) {
            uriFilter = module._renderTemplate(
                filterPattern,
                keyValues,
                baseTable.schema.catalog,
                {templateEngine: filterPatternTemplate}
            );
        }

        // ignore the annotation if given path is empy
        if (typeof uriFilter === "string" && uriFilter.trim() !== '') {
            // create a cfacets based on the given domain filter pattern
            cfacets = {ermrest_path: uriFilter, removable: false};

            // attach the displayname if it's non empty
            if (isStringAndNotEmpty(displayname)) {
                cfacets.displayname = {
                    value: displayname,
                    unformatted: displaynameMkdn,
                    isHTML: true
                };
            }

            // see if we can parse the url, otherwise ignore the annotaiton
            try {
                location = module.parse(currURI + '/*::cfacets::' + module.encodeFacet(cfacets));
            } catch (exp) {
                module._log.error("given domain_filter throws error, ignoring it. ", exp);
            }
        }

        // if the annotation is missing or is invalid, location will be undefined
        if (!location) {
            location = module.parse(currURI);
        }

        return new Reference(location, currTable.schema.catalog);
    };

    return getFilteredRef(this);

};
ForeignKeyPseudoColumn.prototype.getDefaultDisplay = function (rowValues) {
    var fkColumns = this.foreignKey.colset.columns,
        keyColumns = this.foreignKey.key.colset.columns,
        mapping = this.foreignKey.mapping,
        table = this.table,
        keyPairs = [],
        keyValues = [],
        rowName, caption, isHTML,
        col,
        keyCol,
        isNull = false,
        i;

    var rownameValue = null, fkValues = {}, ref = null;

    //make sure we have all the values and map them to the referred table
    for (i = 0; i < fkColumns.length; i++) {
        if (rowValues[fkColumns[i].name] == null) {
            isNull = true; //return null if one of them is null;
            break;
        }
        fkValues[mapping.get(fkColumns[i]).name] = rowValues[fkColumns[i].name];
    }

    if (!isNull) {

        // get the fkValues for using in reference creation
        for (i = 0; i < keyColumns.length; i++) {
            col = keyColumns[i];
            keyValues.push(col.formatvalue(fkValues[col.name], this._context));
            keyPairs.push(
                module._fixedEncodeURIComponent(col.name) + "=" + module._fixedEncodeURIComponent(fkValues[col.name])
            );
        }

        // use row name as the caption
        rowName = module._generateRowName(this.table, this._context, fkValues);
        caption = rowName.value; isHTML = rowName.isHTML;

        // use "col_1:col_2:col_3"
        if (caption.trim() === '') {
            caption = keyValues.join(":");
            isHTML = false;
        }

        rownameValue = caption.trim() !== '' ? caption : null;

        var refURI = [
            table.schema.catalog.server.uri ,"catalog" ,
            table.schema.catalog.id, this._baseReference.location.api,
            [module._fixedEncodeURIComponent(table.schema.name),module._fixedEncodeURIComponent(table.name)].join(":"),
            keyPairs.join("&")
        ].join("/");
        ref = new Reference(module.parse(refURI), table.schema.catalog);
    }

    return {
        rowname: {value: rownameValue, isHTML: isHTML},
        values: fkValues,
        reference: ref
    };
};
ForeignKeyPseudoColumn.prototype._determineDefaultValue = function () {
    var res = {rowname: {value: null}, reference: null, values: {}};
    var defaultValues = {};

    // make sure all the foreign key columns have default
    var allSet = this.foreignKey.colset.columns.every(function (col) {
        defaultValues[col.name] = col.default;
        return col.default != null;
    });

    if (allSet) {
        res = this.getDefaultDisplay(defaultValues);
    }

    // set the attributes
    this._default = res.rowname.value;
    this._defaultValues = res.values;
    this._defaultReference = res.reference;
};
ForeignKeyPseudoColumn.prototype.formatPresentation = function(data, context, templateVariables, options) {
    data = data || {};
    options = options || {};

    if (!isStringAndNotEmpty(context)) {
        context = this._context;
    }

    var nullValue = {
        isHTML: false,
        value: this._getNullValue(context),
        unformatted: this._getNullValue(context)
    };

    // if there's wait_for, this should return null.
    if (this.hasWaitFor && !options.skipWaitFor) {
        return nullValue;
    }

    if (this.display.sourceMarkdownPattern) {
        var keyValues = {}, selfTemplateVariables = {
            "$self": module._getRowTemplateVariables(this.table, context, data)
        };
        Object.assign(keyValues, templateVariables, selfTemplateVariables);
        return module.processMarkdownPattern(
            this.display.sourceMarkdownPattern,
            keyValues,
            this.table,
            context,
            {templateEngine: this.display.sourceTemplateEngine}
        );
    }

    var pres = module._generateRowPresentation(this.foreignKey.key, data, context, this._getShowForeignKeyLink(context));
    return pres ? pres: nullValue;
};
ForeignKeyPseudoColumn.prototype._determineSortable = function () {
    var display = this.display, useColumn = false, baseCol;

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
 * Whether this column has domain-filter annotation
 * @member {Boolean} hasDomainFilter
 * @memberof ERMrest.ForeignKeyPseudoColumn#
 */
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "hasDomainFilter", {
    get: function () {
        if (this._hasDomainFilter === undefined) {
            var checkDomainFilter = function (self) {
                // the annotaion didn't exist
                if (!self.foreignKey.annotations.contains(module._annotations.FOREIGN_KEY)) {
                    return false;
                }

                var content = self.foreignKey.annotations.get(module._annotations.FOREIGN_KEY).content;

                // the annotation is properly defined
                if (isObjectAndNotNull(content.domain_filter) && isStringAndNotEmpty(content.domain_filter.ermrest_path_pattern)) {
                    return true;
                }
                // backward compatibility
                else if (typeof content.domain_filter_pattern === "string") {
                    return true;
                }

                return false;
            };

            this._hasDomainFilter = checkDomainFilter(this);
        }
        return this._hasDomainFilter;
    }
});

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

/**
 * 1. If `to_name` in `foreign key` annotation is available, use it as the displayname.
 * 2. Otherwise,
 *   2.1. If foreign key is simple, use columns' displayname.
 *     - If constituent column of foreign key is part of other foreign keys,
 *       use column's displayname disambiguated with table's displayname, i.e. `table_1 (col_1)`.
 *   2.2. Otherwise, use table's displayname.
 *     - If there are multiple composite foreign keys without `to_name` to the table,
 *       use table's displayname disambiguated with columns' displayname, i.e. `table_1 (col_1, col_2)`.
 * @member {Object} displayname
 * @memberof ERMrest.ForeignKeyPseudoColumn#
 */
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "displayname", {
    get: function () {
        if (this._displayname === undefined) {
            var foreignKey = this.foreignKey, value, isHTML, unformatted;
            if (this.sourceObject.markdown_name) {
                unformatted = this.sourceObject.markdown_name;
                value = module.renderMarkdown(unformatted, true);
                isHTML = true;
            } else if (foreignKey.to_name !== "") {
                value = unformatted = foreignKey.to_name;
                isHTML = false;
            } else if (foreignKey.simple) {
                value = this._baseCols[0].displayname.value;
                isHTML = this._baseCols[0].displayname.isHTML;
                unformatted = this._baseCols[0].displayname.unformatted;

                // disambiguate
                var otherSimpleFks = this._baseCols[0].memberOfForeignKeys.some(function (fk) {
                    return fk !== foreignKey && fk.simple;
                });
                if (otherSimpleFks) {
                    value = foreignKey.key.table.displayname.value + " ("  + value + ")";
                    unformatted = foreignKey.key.table.displayname.unformatted + " (" + unformatted + " )";
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
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "display", {
    get: function () {
        if (this._display_cached === undefined) {
            var res = {}, fkDisplay = this.foreignKey.getDisplay(this._context), sourceDisplay = {};
            // attach display defined on the source
            if (this.sourceObject && this.sourceObject.display) {
                var displ = this.sourceObject.display;
                if (typeof displ.markdown_pattern === "string") {
                    sourceDisplay.sourceMarkdownPattern = displ.markdown_pattern;
                    sourceDisplay.sourceTemplateEngine = displ.template_engine;
                }
            }

            if (this.sourceObject && typeof this.sourceObject.hide_column_header === "boolean") {
                sourceDisplay.hideColumnHeader = this.sourceObject.hide_column_header;
            }

            Object.assign(res, fkDisplay, sourceDisplay);
            this._display_cached = res;
        }
        return this._display_cached;
    }
});
Object.defineProperty(ForeignKeyPseudoColumn.prototype, "compressedDataSource", {
    get: function () {
        if (this._compressedDataSource === undefined) {
            var ds;
            if (this.sourceObject && this.sourceObject.source) {
                ds = this.sourceObject.source;
            } else if (this.table.shortestKey.length === 1){
                ds = [
                    {"outbound": this.foreignKey.constraint_names[0]},
                    this.table.shortestKey[0].name
                ];
            } else {
                ds = null;
            }
            this._compressedDataSource = _compressSource(ds);
        }
        return this._compressedDataSource;
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
function KeyPseudoColumn (reference, key, sourceObjectWrapper, name) {
    // call the parent constructor
    KeyPseudoColumn.superClass.call(this, reference, key.colset.columns, sourceObjectWrapper, name);

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
 * @param {String=} context the app context (optional)
 * @param {Object=} templateVariables the template variables that should be used (optional)
 * @param {Object=} options (optional)
 * @return {Object} A key value pair containing value and isHTML that detemrines the presentation.
 */
KeyPseudoColumn.prototype.formatPresentation = function(data, context, templateVariables, options) {
    data = data || {};
    options = options || {};

    if (!isStringAndNotEmpty(context)) {
        context = this._context;
    }

    var nullValue = {
        isHTML: false,
        value: this._getNullValue(context),
        unformatted: this._getNullValue(context)
    };

    if (this.hasWaitFor && !options.skipWaitFor) {
        return nullValue;
    }
    if (this.display.sourceMarkdownPattern) {
        var keyValues = {}, selfTemplateVariables = {
            "$self": module._getRowTemplateVariables(this.table, context, data, null, this.key)
        };
        Object.assign(keyValues, templateVariables, selfTemplateVariables);
        return module.processMarkdownPattern(
            this.display.sourceMarkdownPattern,
            keyValues,
            this.table,
            context,
            {templateEngine: this.display.sourceTemplateEngine}
        );
    }

    var pres = module._generateKeyPresentation(this.key, data, context, templateVariables, this.display.showKeyLink);
    return pres ? pres : nullValue;
 };
KeyPseudoColumn.prototype._determineSortable = function () {
    var display = this.display, useColumn = false, baseCol;

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
                    value: module.renderMarkdown(this.sourceObject.markdown_name, true),
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
Object.defineProperty(KeyPseudoColumn.prototype, "display", {
    get: function () {
        if (this._display_cached === undefined) {
            var res = {}, keyDisplay = this.key.getDisplay(this._context), sourceDisplay = {};
            // attach display defined on the source
            if (this.sourceObject && this.sourceObject.display) {
                var displ = this.sourceObject.display;
                if (typeof displ.markdown_pattern === "string") {
                    sourceDisplay.sourceMarkdownPattern = displ.markdown_pattern;
                    sourceDisplay.sourceTemplateEngine = displ.template_engine;
                }

                if (typeof this.sourceObject.display.show_key_link === "boolean") {
                    sourceDisplay.showKeyLink = displ.show_key_link;
                }
            }

            if (this.sourceObject && typeof this.sourceObject.hide_column_header === "boolean") {
                sourceDisplay.hideColumnHeader = this.sourceObject.hide_column_header;
            }

            Object.assign(res, keyDisplay, sourceDisplay);
            this._display_cached = res;
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
function AssetPseudoColumn (reference, column, sourceObjectWrapper, name) {
    // call the parent constructor
    AssetPseudoColumn.superClass.call(this, reference, [column], sourceObjectWrapper, name);

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

/**
 * Given the data, will return the appropriate metadata values. The returned object
 * will have the following attributes:
 * - filename
 * - byteCount
 * - md5
 * - sha256
 * - origin
 * - caption: the string that can be used for showing the selected file.
 * The heuristics for origin and caption:
 *   1. if filenameColumn is defined and its value is not null, use it as caption.
 *   2. otherwise, if the url is from hatrac, extract the filename and use it as caption.
 *   3. otherwise, use the last part of url as caption. in detailed context, if url is absolute find the origin.
 * @param  {Object} data    key-value pair of data
 * @param  {String} context context string
 * @param  {Object} options
 * @return {Object} metadata object with `caption`, `filename`, `byteCount`, `md5`, and `sha256` attributes.
 */
AssetPseudoColumn.prototype.getMetadata = function (data, context, options) {
    data = data || {};
    if (!context) {
        context = this._context;
    }

    var self = this;

    var result = {
        url: "", caption: "", filename: "", byteCount: "", md5: "", sha256: "", sameHost: false, hostInformation: ""
    };

    // if null, return null value
    if (typeof data[this._baseCol.name] === 'undefined' || data[this._baseCol.name] === null) {
        return result;
    }

    result.url = data[this._baseCol.name];

    // get the caption
    var col = this.filenameColumn ? this.filenameColumn : this._baseCol;
    var urlCaption = this.filenameColumn === null;
    var caption = col.formatvalue(data[col.name], context, options);

    // if we got the caption from column and it resulted in empty, return the url
    if (this.filenameColumn && (!caption || !data[this.filenameColumn.name])) {
        caption = col.formatvalue(data[this._baseCol.name], context, options);
        urlCaption = true;
    }

    // assume same origin because most paths should be relative
    var sameHost = module._isSameHost(result.url) !== false;

    result.sameHost = sameHost;

    // in detailed, we want to show the host information if not on the same origin
    if (!sameHost && typeof context === "string" && context === module._contexts.DETAILED) {
        // see if link contains absolute paths that start with https:// or http://
        var hasProtocol = new RegExp('^(?:[a-z]+:)?//', 'i').test(result.url);
        var urlParts = result.url.split("/");

        // only match absolute paths that start with https:// or http://
        if (hasProtocol && urlParts.length >= 3) {
            // so when we split by /, the third element will be the host information
            result.hostInformation = urlParts[2];
        }
    }

    // if we're using the url as caption
    if (urlCaption) {
        // if caption matches the expected format, just show the file name
        var parts = caption.match(/^\/hatrac\/([^\/]+\/)*([^\/:]+)(:[^:]+)?$/);
        if (parts && parts.length === 4) {
            caption = parts[2];
        }
        // otherwise return the last part of url
        else {
            var newCaption = caption.split("/").pop();
            if (newCaption.length !== 0) {
                caption = newCaption;
            }
        }
    }

    result.caption = caption;

    if (this.filenameColumn && data[this.filenameColumn.name] && data[this.filenameColumn.name] != null) {
        result.filename = data[this.filenameColumn.name];
    }

    if (this.byteCountColumn && data[this.byteCountColumn.name] && data[this.byteCountColumn.name] != null) {
        result.byteCount = data[this.byteCountColumn.name];
    }

    if (this.md5 && data[this.md5.name] && data[this.md5.name] != null) {
        result.md5 = data[this.md5.name];
    }

    if (this.sha256 && data[this.sha256.name] && data[this.sha256.name] != null) {
        result.sha256 = data[this.sha256.name];
    }
    return result;
};

// properties to be overriden:

/**
 * Format the presentation value corresponding to this asset definition.
 * 1. return the raw data in entry contexts.
 * 2. otherwise if it has wait-for return empty.
 * 3. otherwise if column-display is defined, use it.
 * 4. otherwise if value is null, return null.
 * 5. otherwise use getMetadata to genarate caption and origin and return a download button.
 *
 * @param {Object} data the raw data of the table
 * @param {String=} context the app context (optional)
 * @param {Object=} templateVariables the template variables that should be used (optional)
 * @param {Object=} options (optional)
 * @returns {Object} A key value pair containing value and isHTML that detemrines the presentation.
 */
AssetPseudoColumn.prototype.formatPresentation = function(data, context, templateVariables, options) {
    data = data || {};
    options = options || {};

    if (!isStringAndNotEmpty(context)) {
        context = this._context;
    }

    var nullValue = {
        isHTML: false,
        value: this._getNullValue(context),
        unformatted: this._getNullValue(context)
    };

    // in edit return the original data
    if (module._isEntryContext(context)) {
        return { isHTML: false, value: data[this._baseCol.name], unformatted: data[this._baseCol.name]};
    }

    if (this.hasWaitFor && !options.skipWaitFor) {
        return nullValue;
    }

    // if column has column-display annotation, use it
    if (this.display.sourceMarkdownPattern || this._baseCol.getDisplay(context).isMarkdownPattern) {
        return AssetPseudoColumn.super.formatPresentation.call(this, data, context, templateVariables, options);
    }

    // if null, return null value
    if (typeof data[this._baseCol.name] === 'undefined' || data[this._baseCol.name] === null) {
        return nullValue;
    }

    // var currentOrigin = server.url.origin
    var classNames = module._classNames;
    var metadata = this.getMetadata(data, context, options);
    var caption = metadata.caption,
        hostInfo = metadata.hostInformation,
        sameHost = metadata.sameHost;

    // otherwise return a download link
    var template = "[{{{caption}}}]({{{url}}}){download " + (sameHost ? "." + classNames.assetPermission : "") + "}";
    var url = data[this._baseCol.name];

    // only add query parameters if same origin
    if (sameHost) {
        // add the uinit=1 query params
        url += ( url.indexOf("?") !== -1 ? "&": "?") + "uinit=1";

        // add cid query param
        var cid = this.table.schema.catalog.server.cid;
        if (cid) url += "&cid=" + cid;
    }

    var keyValues = {
        "caption": caption,
        "url": url,
        "hostInfo": hostInfo
    };
    if (hostInfo) {
        template += ":span:(source: {{{hostInfo}}}):/span:{.asset-source-description}";
    }

    var unformatted = module._renderTemplate(template, keyValues, this.table.schema.catalog);
    return {isHTML: true, value: module.renderMarkdown(unformatted, true), unformatted: unformatted};
};

/**
 * Modify the default column_order heuristics for the asset, by using the filename
 * if
 *  - the filename_column is defined and valid
 *  - column_order is not defined on the column-display
 * This has been done to ensure the sorted column is the same as displayed value.
 * In most default cases, all the conditions will met.
 * @private
 */
AssetPseudoColumn.prototype._determineSortable = function () {
    AssetPseudoColumn.super._determineSortable.call(this);

    // if column_order is missing and it doesn't have any makrdown_pattern and
    // filename is defined, use the filename column.
    var columnOrder = this.display.columnOrder;
    if (this.filenameColumn && (columnOrder == undefined || columnOrder.length === 0)) {
        this._sortColumns_cached = [];
        this._sortColumns_cached = [{column: this.filenameColumn}];
        this._sortable = true;
    }
};

/**
 * Returns the template_engine defined in the annotation
 * @member {ERMrest.Refernece} template_engine
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "templateEngine", {
    get: function () {
        if (this._templateEngine === undefined) {
            this._templateEngine = this._annotation.template_engine || "";
        }
        return this._templateEngine;
    }
});

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
 * @member {string[]} filenameExtFilter
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
 * The regular expressions that will be used for extracting the extension
 * @member {string[]} filenameExtRegexp
 * @memberof ERMrest.AssetPseudoColumn#
 */
 Object.defineProperty(AssetPseudoColumn.prototype, "filenameExtRegexp", {
    get: function () {
        if (this._filenameExtRegexp === undefined) {
            this._filenameExtRegexp = [];

            var reg = this._annotation.filename_ext_regexp;
            if (typeof reg == 'string') {
                this._filenameExtRegexp.push(ext);
            } else if (Array.isArray(reg)) {
                this._filenameExtRegexp = reg;
            }
        }
        return this._filenameExtRegexp;
    }
});

/**
 * whether we should show the image preview or not
 * @member {string[]} displayImagePreview
 * @memberof ERMrest.AssetPseudoColumn#
 */
Object.defineProperty(AssetPseudoColumn.prototype, "displayImagePreview", {
    get: function () {
        if (this._displayImagePreview === undefined) {
            var disp = this._annotation.display;
            var currDisplay = isObjectAndNotNull(disp) ? module._getAnnotationValueByContext(this._context, disp) : null;
            this._displayImagePreview = isObjectAndNotNull(currDisplay) &&  currDisplay.image_preview === true;
        }
        return this._displayImagePreview;
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
 * Note: The sourceObjectWrapper might include filters and therefore the relatedReference
 *       might not be a simple path from main to related table and it could have filters.
 *
 * This class extends the {@link ERMrest.ReferenceColumn}
 */
function InboundForeignKeyPseudoColumn (reference, relatedReference, sourceObjectWrapper, name) {
    var fk = relatedReference.origFKR;

    // call the parent constructor
    InboundForeignKeyPseudoColumn.superClass.call(this, reference, fk.colset.columns, sourceObjectWrapper);

    /**
     * The reference that can be used to get the data for this pseudo-column
     * @type {ERMrest.Reference}
     */
    this.reference = relatedReference;

    this.reference.pseudoColumn = this;

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

    this.isUnique = false;

    this._context = reference._context;
    this._currentRef = reference;
    this._currentTable = reference.table;
    this._constraintName = fk._constraintName;

    this._name = name;
}

// extend the prototype
module._extends(InboundForeignKeyPseudoColumn, ReferenceColumn);

// properties to be overriden:
InboundForeignKeyPseudoColumn.prototype.formatPresentation = function(data, context, templateVariables, options) {
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
            this._name = _sourceColumnHelpers.generateForeignKeyName(this.foreignKey, true);
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
            var com = _processSourceObjectColumn(this.sourceObject);
            if (typeof com === "string") {
                this._comment = com;
            } else {
                this._comment = this.reference.comment;
            }
        }
        return this._comment;
    }
});

Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "commentDisplay", {
    get: function () {
        if (this._commentDisplay === undefined) {
            this._commentDisplay = this.reference.commentDisplay;
        }
        return this._commentDisplay;
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
Object.defineProperty(InboundForeignKeyPseudoColumn.prototype, "compressedDataSource", {
    get: function () {
        if (this._compressedDataSource === undefined) {
            var ds = null;
            if (this.sourceObject && this.sourceObject.source) {
                ds = _compressSource(this.sourceObject.source);
            } else if (this.reference.compressedDataSource){
                ds = this.reference.compressedDataSource;
            }
            this._compressedDataSource = ds;
        }
        return this._compressedDataSource;
    }
});

/**
 * Represent facet columns that are available.
 * NOTE:
 * Based on facets JSON structure we can have joins that result in facets
 * on columns that are not part of reference column.
 *
 *
 * If the ReferenceColumn is not provided, then the FacetColumn is for reference
 *
 * @param {ERMrest.Reference} reference the reference that this FacetColumn blongs to.
 * @param {int} index The index of this FacetColumn in the list of facetColumns
 * @param {ERMrest.SourceObjectWrapper} facetObjectWrapper The filter object that this FacetColumn will be created based on
 * @param {?ERMrest.FacetFilter[]} filters Array of filters
 * @memberof ERMrest
 * @constructor
 */
function FacetColumn (reference, index, facetObjectWrapper, filters) {

    /**
     * The column object that the filters are based on
     * @type {ERMrest.Column}
     */
    this._column = facetObjectWrapper.column;

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
    this.dataSource = facetObjectWrapper.sourceObject.source;

    /**
     * the compressed version of data source data-source path
     * @type {obj|string}
     */
    this.compressedDataSource = _compressSource(this.dataSource);

    /**
     * Filters that are applied to this facet.
     * @type{FacetFilter[]}
     */
    this.filters = [];
    if (Array.isArray(filters)) {
        this.filters = filters;
    } else {
        this._setFilters(facetObjectWrapper.sourceObject);
    }

    // the whole filter object
    // NOTE: This might not include the filters
    this._facetObject = facetObjectWrapper.sourceObject;

    this.sourceObjectWrapper = facetObjectWrapper;

    this.sourceObjectNodes = facetObjectWrapper.sourceObjectNodes;

    this.lastForeignKeyNode = facetObjectWrapper.lastForeignKeyNode;

    this.foreignKeyPathLength = facetObjectWrapper.foreignKeyPathLength;

    /**
     * Whether the source has path or not
     * @type {Boolean}
     */
    this.hasPath = facetObjectWrapper.hasPath;

    /**
     * Returns true if the source is on a key column.
     * If facetObject['entity'] is defined as false, it will return false,
     * otherwise it will true if filter is based on key.
     *
     * @type {Boolean}
     */
    this.isEntityMode = facetObjectWrapper.isEntityMode;
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

    /**
     * The Preferred ux mode.
     * Any of:
     * `choices`, `ranges`, or `check_presence`
     * This should be used if we're not in entity mode. In entity mode it will
     * always return `choices`.
     *
     * The logic is as follows,
     * 1. if facet has only choice or range filter, return that.
     * 2. use ux_mode if available
     * 3. use choices if in entity mode
     * 4. return choices if int or serial, part of key, and not null.
     * 5. return ranges or choices based on the type.
     *
     * @type {string}
     */
    get preferredMode() {
        if (this._preferredMode === undefined) {
            var modes = module._facetUXModes;

            // a facet is in range mode if it's column's type is integer, float, date, timestamp, or serial
            var isRangeMode = function (column) {
                var typename = column.type.rootName;

                //default facet for unique not null integer/serial should be choice (not range)
                if (typename.startsWith("serial") || typename.startsWith("int")) {
                    return !column.isUniqueNotNull;
                }

                return typename.startsWith("float") || typename.startsWith("date") || typename.startsWith("timestamp") || typename.startsWith("numeric");
            };

            var getPreferredMode = function (self) {
                // see if only one type of facet is preselected
                var onlyChoice = false, onlyRange = false;

                // (not-null can be applied to both choices and ranges)
                var filterLen = self.filters.length;
                if (self.hasNotNullFilter) {
                    filterLen--;
                }

                // null is acceptable for check_presence
                if (filterLen === 1 && self.hasNullFilter && self._facetObject.ux_mode === modes.PRESENCE) {
                    return modes.PRESENCE;
                }

                if (filterLen > 0) {
                    onlyChoice = self.choiceFilters.length === filterLen;
                    onlyRange = self.rangeFilters.length === filterLen;
                }
                // if only choices or ranges preselected, honor it
                if (onlyChoice || onlyRange) {
                    return onlyChoice ? modes.CHOICE : modes.RANGE;
                }

                // use the defined ux_mode
                if (module._facetUXModeNames.indexOf(self._facetObject.ux_mode) !== -1) {
                    return self._facetObject.ux_mode;
                }

                // use the column type to determien its ux_mode
                return (!self.isEntityMode && isRangeMode(self._column)) ? modes.RANGE : modes.CHOICE;
            };

            this._preferredMode = getPreferredMode(this);
        }
        return this._preferredMode;
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
     * The returned reference will be in the following format:
     * <main-table>/<facets of main table except current facet>/<path to current facet>
     *
     *
     * Consider the following scenario:
     * Table T has two foreignkeys to R1 (fk1), R2 (fk2), and R3 (fk3).
     * R1 has a fitler for term=1, and R2 has a filter for term=2
     * Then the source reference for R3 will be the following:
     * T:=S:T/(fk1)/term=1/$T/(fk2)/term2/$T/M:=(fk3)
     * As you can see it has all the filters of the main table + join to current table.
     *
     * Notes:
     * - This function used to reverse the path from the current facet to each of the
     *   other facets in the main reference. Since this was very inefficient, we decided
     *   to rewrite it to start from the main table instead.
     * - The path from the main table to facet is based on the given column directive and
     *   therefore might have filters or reused table instances (shared path). That's why
     *   we're ensuring to pass the whole facetObjectWrapper to parser, so it can properly
     *   parse it.
     *
     *
     * @type {ERMrest.Reference}
     */
    get sourceReference () {
        if (this._sourceReference === undefined) {
            var jsonFilters = [],
                self = this,
                table = this._column.table,
                loc = this.reference.location;


            // TODO might be able to improve this
            if (typeof loc.searchTerm === "string") {
                jsonFilters.push({"sourcekey": module._specialSourceDefinitions.SEARCH_BOX, "search": [loc.searchTerm]});
            }

            var newLoc = module.parse(loc.compactUri, loc.catalogObject);

            //get all the filters from other facetColumns
            if (loc.facets) {
                // create new facet filters
                // TODO might be able to imporve this. Instead of recreating the whole json file.
                this.reference.facetColumns.forEach(function (fc, index) {
                    if (index !== self.index && fc.filters.length !== 0) {
                        jsonFilters.push(fc.toJSON());
                    }
                });

                // apply the hidden filters
                loc.facets.andFilters.forEach(function (f) {
                    if (f.hidden) {
                        jsonFilters.push(f);
                    }
                });
            }

            if (jsonFilters.length > 0) {
                newLoc.facets = {"and": jsonFilters};
            } else {
                newLoc.facets = null;
            }

            // add custom facets as the facets of the parent
            var alias =  module._parserAliases.JOIN_TABLE_PREFIX + (newLoc.hasJoin ? newLoc.pathParts.length : "");
            if (loc.customFacets) {
                //NOTE this is just a hack, and since the whole feature is just a hack it's fine.
                // In the ermrest_path we're allowing them to use the M alias. In here, we are making
                // sure to change the M alias to T. Because we're going to use T to refer to the main
                // reference when the facet has a path. In other words if the following is main reference
                // M:=S:main_table/cutom-facet-that-might-have-$M-alias/facets-on-the-main-table
                //
                // Then the source reference for any of the facets will be
                //
                // T:=S:main_table/custom-facet-that-should-change-$M-to-$T/facets-on-the-main-table/join-path-to-current-facet/$M:=S:facet_table
                //
                // You can see why we are changing $M to $T.
                //
                // As I mentioned this is hacky, so we should eventually find a way around this.
                cfacet = module._simpleDeepCopy(loc.customFacets.decoded);
                if (cfacet.ermrest_path && self.sourceObjectNodes.length > 0) {
                    // switch the alias names, the cfacet is originally written with the assumption of
                    // the main table having "M" alias. So we just have to swap the aliases.
                    var mainAlias = module._parserAliases.MAIN_TABLE;
                    cfacet.ermrest_path = cfacet.ermrest_path.replaceAll("$" + mainAlias, "$" + alias);
                }
                newLoc.customFacets = cfacet;
            }

            /**
             * if it has path, we have to pass the whole facetObjectWrapper
             * as a join. this is so we can properly share path
             */
            if (self.hasPath) {
                newLoc = newLoc.addJoin(
                    self.sourceObjectWrapper,
                    table.schema.name,
                    table.name
                );
            }
            // if it only has filter (and no path, then we can just add the filter to path)
            else if (self.sourceObjectWrapper.isFiltered) {
                // TODO can this be improved?
                var filterPath = self.sourceObjectWrapper.toString(false, false);
                if (filterPath.length > 0) {
                    newLoc = module.parse(newLoc.compactUri + "/" + filterPath);
                }
            }

            this._sourceReference = new Reference(newLoc, table.schema.catalog);
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
     * Returned object has `value`, `unformatted`, and `isHTML` properties.
     * @type {Object}
     */
    get displayname() {
        if (this._displayname === undefined) {
            var getDisplayname = function (self) {
                if (self._facetObject.markdown_name) {
                    return {
                        value: module.renderMarkdown(self._facetObject.markdown_name, true),
                        unformatted: self._facetObject.markdown_name,
                        isHTML: true
                    };
                }

                var lastFK = self.lastForeignKeyNode ? self.lastForeignKeyNode.nodeObject : null;

                // if is part of the main table, just return the column's displayname
                if (lastFK === null) {
                    return self.column.displayname;
                }

                // Otherwise
                var value, unformatted, isHTML = false;
                var lastFKIsInbound = self.lastForeignKeyNode.isInbound;

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
            var com = _processSourceObjectColumn(this._facetObject);
            if (typeof com === "string") {
                this._comment = com;
            } else if (!this.isEntityMode) {
                    this._comment = this._column.comment;
            } else {
                this._comment = this._column.table.comment;
            }
        }
        return this._comment;
    },

    /**
     * Whether client should hide the null choice.
     * `null` filter could mean any of the following:
     *   - Scalar value being `null`. In terms of ermrest, a simple col::null:: query
     *   - No value exists in the given path (checking presence of a value in the path). In terms of ermrest,
     *     we have to construct an outer join. For performance we're going to use right outer join.
     *     Because of ermrest limitation, we cannot have more than two right outer joins and therefore
     *     two such null checks cannot co-exist.
     * Since we're not going to show two different options for these two meanings,
     * we have to make sure to offer `null` option when only one of these two meanings would make sense.
     * Based on this, we can categorize facets into these three groups:
     *   1. (G1) Facets without any path.
     *   2. (G2) Facets with path where the column is nullable: `null` could mean any of those.
     *   3. (G3) Facets with path where the column is not nullable. Here `null` can only mean path existence.
     *   3. (G3.1) Facets with only one hop where the column used in foreignkey is the same column for faceting.
     *      In this case, we can completely ignore the foreignkey path and just do a value check on main table.
     * Other types of facet that null won't be applicable to them and therefore
     * we shouldn't even offer the option:
     *   1. (G4) Scalar columns of main table that are not-null.
     *   2. (G5) All outbound foreignkey facets that all the columns invloved are not-null
     *   3. (G6) Facets with `filter` in their source definition. We cannot combine filter
     *           and null together.
     *
     * Based on this, the following will be the logic for this function:
     *     - If facet has `null` filter: `false`
     *     - If facet has `"hide_null_choice": true`: `true`
     *     - If G6: true
     *     - If G1: `true` if the column is not-null
     *     - If G5: `true`
     *     - If G2: `true`
     *     - If G3.1: `false`
     *     - If G3 and no other G3 has null: `false`
     *     - otherwise: `false`
     *
     * NOTE this function used to check for select access as well as versioned catalog,
     * but we decided to remove them since it's not the desired behavior:
     * https://github.com/informatics-isi-edu/ermrestjs/issues/888
     * @type {Boolean}
     */
    get hideNullChoice() {
        if (this._hideNullChoice === undefined) {
            var getHideNull = function (self) {
                // if null filter exists, we have to show it
                if (self.hasNullFilter) {
                    return false;
                }

                // if facet definition tells us to hide it
                if (self._facetObject.hide_null_choice === true) {
                    return true;
                }

                // G6
                if (self.sourceObjectWrapper.isFiltered) {
                    return true;
                }

                // G1 / G4
                if (self.foreignKeyPathLength === 0) {
                    return !self._column.nullok;
                }

                // G5
                if (self.sourceObjectWrapper.isAllOutboundNotNullPerModel) {
                    return true;
                }

                // G2
                if (self._column.nullok) {
                    return true;
                }

                // G3.1
                if (!self.hasPath) {
                    return false;
                }

                // G3
                var othersHaveNull = self.reference.facetColumns.some(function (fc, index) {
                    return index !== self.index && fc.hasNullFilter && fc.hasPath;
                });

                return othersHaveNull;

            };
            this._hideNullChoice = getHideNull(this);
        }
        return this._hideNullChoice;
    },

    /**
     * Whether client should hide the not-null choice. The logic is as follows:
     * - `false` if facet has not-null filter.
     * - `true` if facet has hide_not_null_choice in it's definition
     * - `true` if facet is from the same table and it's not-nullable.
     * - `true` if facet is all outbound not null.
     * - otherwise `false`
     *
     * @type {Boolean}
     */
    get hideNotNullChoice() {
        if (this._hideNotNullChoice === undefined) {
            var getHideNotNull = function (self) {
                // if not-null filter exists
                if (self.hasNotNullFilter) return false;

                // if hide_not_null_choice is available in facet definition
                if (self._facetObject.hide_not_null_choice === true) return true;


                //if from the same table, don't show if it's not-null
                if (self.sourceObjectWrapper.foreignKeyPathLength === 0) {
                    return !self._column.nullok;
                }

                //if all outbound not-null don't show it.
                return self.sourceObjectWrapper.isAllOutboundNotNullPerModel;
            };

            this._hideNotNullChoice = getHideNotNull(this);
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
            this._scalarValuesRef = this.column.groupAggregate.entityCounts(this.displayname, this.sortColumns, this.hideNumOccurrences, true);
        }
        return this._scalarValuesRef;
    },

    get fastFilterSourceObjectWrapper() {
        if (this._fastFilterSource === undefined) {
            var self = this;
            var res = null;
            var fastFilter = this._facetObject.fast_filter_source;
            if (fastFilter !== undefined || fastFilter !== null) {
                try {
                    res = new SourceObjectWrapper({source: fastFilter}, self.reference.table, module._constraintNames, true);
                } catch (exp) {
                    module._log.warn("given fast_filter_source for facet index=`" + self.index + "` is not valid.");
                    res = null;
                }
            }
            this._fastFilterSource = res;
        }
        return this._fastFilterSource;
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
     * NOTE the request might not return any result for a given filter (because of user access or missing data),
     *      in this case, we will return the raw value instead.
     *
     * @param {Object} contextHeaderParams object that we want to be logged with the request
     * @return {Promise} A promise resolved with list of objects that have `uniqueId`, and `displayname`.
     */
    getChoiceDisplaynames: function (contextHeaderParams) {
        var defer = module._q.defer(), filters =  [], self = this;
        var table = this._column.table, columnName = this._column.name;
        // whether the output must be displayed as markdown or not
        var isHTML = (module._HTMLColumnType.indexOf(this._column.type.name) != -1);

        var createRef = function (filterStrs) {
            var uri = [
                table.schema.catalog.server.uri ,"catalog" ,
                table.schema.catalog.id, "entity",
                module._fixedEncodeURIComponent(table.schema.name) + ":" + module._fixedEncodeURIComponent(table.name),
                filterStrs.join(";")
            ].join("/");

            var ref = new Reference(module.parse(uri), table.schema.catalog).contextualize.compactSelect;
            ref = ref.sort([{"column": columnName, "descending": false}]);
            return ref;
        };

        var convertChoiceFilter = function (f) {
            return {
                uniqueId: f.term,
                displayname: {
                    value: isHTML ? module.renderMarkdown(f.toString(), true) : f.toString(),
                    isHTML: isHTML
                },
                tuple: null
            };
        };

        // if no filter, just resolve with empty list.
        if (self.choiceFilters.length === 0) {
            defer.resolve(filters);
        }
        // in scalar mode, use the their toString as displayname.
        else if (!self.isEntityMode) {
            self.choiceFilters.forEach(function (f) {
                // don't return the null filter
                if (f.term == null) return;

                filters.push(convertChoiceFilter(f));
            });
            defer.resolve(filters);
        }
        // otherwise generate an ermrest request to get the displaynames.
        else {
            // if we already fetched the page, then just use it
            if (self.sourceObjectWrapper.entityChoiceFilterTuples) {
                self.sourceObjectWrapper.entityChoiceFilterTuples.forEach(function (t) {
                    filters.push({uniqueId: t.data[columnName], displayname: t.displayname, tuple: t});
                });
                defer.resolve(filters);
                return defer.promise;
            }

            var filterStr = [], // used for generating the request
                filterTerms = {}; // used for figuring out if there are any filter that didn't return result
                                  // key is the term, value is the index in self.choiceFilters

            // list of filters that we want their displaynames.
            self.choiceFilters.forEach(function (f, index) {
                // don't return the null filter
                if (f.term == null) {
                    return;
                }

                filterStr.push(
                    module._fixedEncodeURIComponent(columnName) + "=" + module._fixedEncodeURIComponent(f.term)
                );
                filterTerms[f.term] = index;
            });

            // the case that we have only the null value.
            if (filterStr.length === 0) {
                defer.resolve(filters);
            }

            // create a url
            createRef(filterStr).read(self.choiceFilters.length, contextHeaderParams, true).then(function (page) {
                // add the pages that we got
                page.tuples.forEach(function (t) {
                    filters.push({uniqueId: t.data[columnName], displayname: t.displayname, tuple: t});

                    // remove it from the term list
                    delete filterTerms[t.data[columnName]];
                });

                // if there are any filter terms that didn't match any rows, just return the raw value:
                // NOTE we could merge these two (page and filter) together to make the code easier to follow,
                //      but we want to keep the selected values ordered based on roworder and
                //      not based on the order of filters in the url

                // sort the keys for deterministic output (based on the original order of filters in the url)
                var filterTermKeys = Object.keys(filterTerms).sort(function (a, b) {
                    return filterTerms[a] - filterTerms[b];
                });

                // add the terms to filter list
                filterTermKeys.forEach(function (k) {
                    filters.push(convertChoiceFilter(self.choiceFilters[filterTerms[k]]));
                });

                defer.resolve(filters);
            }).catch(function (err) {
                defer.reject(module.responseToError(err));
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
        var self = this, loc = this.reference.location;
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
                newFc = new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, fc.filters.slice());
            } else {
                newFc = new FacetColumn(newReference, self.index, self.sourceObjectWrapper, filters);
            }

            newReference._facetColumns.push(newFc);

            if (newFc.filters.length !== 0) {
                jsonFilters.push(newFc.toJSON());
            }
        });

        newReference._location = this.reference._location._clone(newReference);
        newReference._location.beforeObject = null;
        newReference._location.afterObject = null;

        // TODO might be able to improve this
        if (typeof loc.searchTerm === "string") {
            jsonFilters.push({"sourcekey": module._specialSourceDefinitions.SEARCH_BOX, "search": [this.reference.location.searchTerm]});
        }

        // apply the hidden facets
        if (loc.facets) {
            loc.facets.andFilters.forEach(function (f) {
                if (f.hidden) {
                    jsonFilters.push(f);
                }
            });
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
     * @param {Object=} columnDisplayname the displayname of main column.
     * @param {Object=} sortColumns the sort column object that you want to pass
     * @param {Boolean=} hideNumOccurrences whether we should add number of Occurrences or not.
     * @param {Boolean=} dontAllowNull whether the null value should be returned for the facet or not.
     * @returns {ERMrest.AttributeGroupReference}
     */
    entityCounts: function(columnDisplayname, sortColumns, hideNumOccurrences, dontAllowNull) {
        if (this.column.isPseudo) {
            throw new Error("Cannot use this API on pseudo-column.");
        }

        if (this._ref.location.hasJoin && this._ref.facetBaseTable.shortestKey.length > 1) {
            throw new Error("Table must have a simple key for entity counts: " + this._ref.facetBaseTable.name);
        }

        var countColName = "count",
            context = module._contexts.COMPACT_SELECT,
            column = this.column,
            self = this,
            sortCounts = false,
            keyColumns = [],
            sortObj = [], i = 0, colAlias;

        // key columns will have numbers as alias, and the aggregate is `count`
        var addToKeyColumns = function (col, isVisible, displayname) {
            colAlias = (i++).toString();
            keyColumns.push(new AttributeGroupColumn(
                colAlias,
                module._fixedEncodeURIComponent(col.name),
                col, displayname, null, col.comment, true, isVisible
            ));
            return colAlias;
        };

        // the first column is always the column that we want to get the values of
        addToKeyColumns(column._baseCols[0], true, columnDisplayname);

        if (Array.isArray(sortColumns) && sortColumns.length > 0) {
            sortColumns.forEach(function (sc) {
                // if column is not sortable
                if (sc.column && typeof sc.column._getSortColumns(context) === 'undefined') {
                    module._log.info("column " + sc.column.name + " is not sortable and we're removing it from sort columns (entityCounts).");
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

        var loc = new AttributeGroupLocation(self._ref.location.service, self._ref.table.schema.catalog, path, searchObj, sortObj);

        var aggregateColumns = [];

        // if it's hidden and also not in the sort, then we don't need it.
        if (!hideNumOccurrences || sortCounts) {
            var countName = "cnt(*)";
            if (self._ref.location.hasJoin) {
                countName = "cnt_d(" + self._ref.location.facetBaseTableAlias + ":" + module._fixedEncodeURIComponent(self._ref.facetBaseTable.shortestKey[0].name) + ")";
            }

            aggregateColumns.push(
                new AttributeGroupColumn(countColName, countName, null, "Number of Occurrences", new Type({typename: "int"}), "", true, !hideNumOccurrences)
            );
        }

        return new AttributeGroupReference(keyColumns, aggregateColumns, loc, self._ref.table.schema.catalog, self._ref.table, context);
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

        if (reference.location.hasJoin && reference.facetBaseTable.shortestKey.length > 1) {
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
