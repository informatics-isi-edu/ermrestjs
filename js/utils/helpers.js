/* eslint-disable no-control-regex */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-escape */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import moment from 'moment-timezone';
import { default as mustache } from 'mustache';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';
import { InvalidFacetOperatorError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// legacy
import { isObject, isObjectAndNotNull, isValidColorRGBHex, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import {
  _systemColumns,
  _dataFormats,
  _contextArray,
  _contexts,
  _annotations,
  _nonSortableTypes,
  _commentDisplayModes,
  _facetingErrors,
  URL_PATH_LENGTH_LIMIT,
  _ERMrestFeatures,
  _systemColumnNames,
  _specialPresentation,
  _classNames,
  TEMPLATE_ENGINES,
  _entryContexts,
  _compactContexts,
  ENV_IS_NODE,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import { Column, Key } from '@isrd-isi-edu/ermrestjs/js/core';
import HandlebarsService from '@isrd-isi-edu/ermrestjs/src/services/handlebars';
import AuthnService from '@isrd-isi-edu/ermrestjs/src/services/authn';

    /**
     * Given a string represting a JSON document returns the compressed version of it.
     * It will return null if the given string is not a valid JSON.
     * @param  {String} str
     * @return {String}
     */
    export function encodeFacetString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return "";
        }
        return compressToEncodedURIComponent(str);
    };

    /**
     * Given an object, returns the string comrpessed version of it
     * @param  {Object} obj
     * @return {String}
     * @memberof ERMrest
     * @function encodeFacet
     */
    export function encodeFacet(obj) {
        return compressToEncodedURIComponent(JSON.stringify(obj,null,0));
    };

    /**
     * Turn a given encoded facet blob into a facet object
     * @param {string} blob the encoded facet blob
     * @param {string?} path (optional) used for better error message
     * @returns {Object}
     * @memberof ERMrest
     * @function decodeFacet
     */
    export function decodeFacet(blob, path) {
        var err = new InvalidFacetOperatorError(
            typeof path === "string" ? path : "",
            _facetingErrors.invalidString
        );

        try {
            var str = decompressFromEncodedURIComponent(blob);
            if (str === null) {
                throw err;
            }
            return JSON.parse(str);
        } catch (exception) {
            $log.error(exception);
            throw err;
        }
    };

    /**
     * can be used to compare the "position columns" of colsets.
     *
     * @private
     * @param {Array} a an array of sorted integer values
     * @param {Array} b an array of sorted integer values
     * @param {boolean=} greater - whether we should do greater check instead of greater equal
     *
     * return,
     *  -  1 if the position in the first argument are before the second one.
     *  - -1 if the other way around.
     *  - 0 if identical
     * Notes:
     * - both arguments are array and sorted ascendingly
     * - if greater argument is true, we're doing a greater check so
     *   in the identical case this function will return -1.
     */
    export function compareColumnPositions(a, b, greater) {
        for (var i = 0; i < a.length && i < b.length ; i++) {
            if (a[i] !== b[i]) {
                return a[i] > b[i] ? 1 : -1;
            }
        }
        // all the columns were identical and only one has extra
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1;
        }
        return greater ? -1 : 0;
    };

    /**
     * Given an object and two string (k1, k2), if object has k1 key, will
     * rename that key to k2 instead (values that were accessible through k1
     * key name will be moved to k2 instead)
     * @param {Object} obj
     * @param {String} oldKey
     * @param {String} newKey
     */
    export function renameKey(obj, oldKey, newKey) {
        if (!isObjectAndNotNull(obj)) return;
        if (oldKey === newKey) return;
        if (!Object.prototype.hasOwnProperty.call(obj, oldKey)) return;

        Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, oldKey));
        delete obj[oldKey];
    };

    /**
     * Replaces characters in strings that are illegal/unsafe for filenames.
     * Unsafe characters are either removed or replaced by a substitute set
     * in the optional `options` object.
     *
     * Illegal Characters on Various Operating Systems
     * / ? < > \ : * | "
     * https://kb.acronis.com/content/39790
     *
     * Unicode Control codes
     * C0 0x00-0x1f & C1 (0x80-0x9f)
     * http://en.wikipedia.org/wiki/C0_and_C1_control_codes
     *
     * Reserved filenames on Unix-based systems (".", "..")
     * Reserved filenames in Windows ("CON", "PRN", "AUX", "NUL", "COM1",
     * "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
     * "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", and
     * "LPT9") case-insesitively and with or without filename extensions.
     *
     * source: https://github.com/parshap/node-sanitize-filename/blob/master/index.js
     *
     * @param {String} str original filename
     * @param {String=} replacement the string that the invalid characters should be replaced with
     * @return {String} sanitized filename
     */
    export function _sanitizeFilename(str, replacement) {
        replacement = (typeof replacement == "string") ? replacement : '_';

        var illegalRe = /[\/\?<>\\:\*\|":]/g;
        var controlRe = /[\x00-\x1f\x80-\x9f]/g;
        var reservedRe = /^\.+$/;
        var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
        var windowsTrailingRe = /[\. ]+$/;
        return str.replace(illegalRe, replacement)
            .replace(controlRe, replacement)
            .replace(reservedRe, replacement)
            .replace(windowsReservedRe, replacement)
            .replace(windowsTrailingRe, replacement);
    };

    /**
     * @private
     * @param {Object} child child class
     * @param {Object} parent parent class
     * @desc
     * This function should be called to extend a prototype with another one.
     * Make sure to attach the right constructor to the prototypes after,
     * and also call `child.superClass.call(this, arguments*)` in frist line of
     * the child constructor with appropriate arguments.
     * You can define the extra or overriden functions of child before calling _extends.
     * This function will take care of copying those functions.
     * *Must be called after defining parent prototype and child constructor*
     */
    export function _extends(child, parent) {
        var childFns = child.prototype;
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.superClass = parent;
        child.super = parent.prototype;
    };

    /**
     * Given a string, will return the existing value in the object.
     * It will return undefined if the key doesn't exist or invalid input.
     * @param  {Object} obj  The object that we want the value from
     * @param  {String} path the string path (`a.b.c`)
     * @return {Object}      value
     */
    export function _getPath(obj, path) {
        var pathNodes;

        if (typeof path === "string") {
            if (path.length === 0) {
                return this[""];
            }
            pathNodes = path.split(".");
        } else if (Array.isArray(path)) {
            pathNodes = path;
        } else {
            return undefined;
        }

        for (var i = 0; i < pathNodes.length; i++) {
            if (!Object.prototype.hasOwnProperty.call(obj, pathNodes[i])) {
                return undefined;
            }
            obj = obj[pathNodes[i]];
        }
        return obj;
    };

    /**
     * @function
     * @param {String} str string to be converted.
     * @desc
     * Converts a string to title case (separators are space, hyphen, and underscore)
     */
    export function _toTitleCase(str) {
        return str.replace(/([^\x00-\x7F]|([^\W_]))[^\-\s_]*/g, function(txt){
            return txt.charAt(0).toLocaleUpperCase() + txt.substr(1).toLocaleLowerCase();
        });
    };

    /**
    * @function
    * @param {String} str string to be manipulated.
    * @private
    * @desc
    * Replaces underline with space.
    */
    export function _underlineToSpace(str) {
      return str.replace(/_/g, ' ');
    };

    /**
     * Given an object recursively replace all the dots in the keys with underscore.
     * This will also remove any custom JavaScript objects.
     * NOTE: This function will ignore any objects that has been created from a custom constructor.
     * NOTE: This function does not detect loop, make sure that your object does not have circular references.
     *
     * @param  {Object} obj A simple javascript object. It should not include anything that is not in JSON syntax (functions, etc.).
     * @return {Object} A new object created by:
     *  1. Replacing the dots in keys to underscore.
     *  2. Ignoring any custom-type objects. The given object should be JSON not JavaScript object.
     */
    export function _replaceDotWithUnderscore(obj) {
        var res = {}, val, k, newK;
        for (k in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
            val = obj[k];

            // we don't accept custom type objects (we're not detecting circular reference)
            if (isObject(val) && (val.constructor && val.constructor != Object)) continue;

            newK = k;
            if (k.includes(".")) {
                // replace dot with underscore
                newK = k.replace(/\./g,"_");
            }

            if (isObject(val)) {
                res[newK] = _replaceDotWithUnderscore(val);
            } else {
                res[newK] = val;
            }
        }
        return res;
    };

    /**
     * @function
     * @param {String} regExp string to be regular expression encoded
     * @desc converts the string into a regular expression with properly encoded characters
     */
    export function _encodeRegexp(str) {
        var stringReplaceExp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$]/g;
        // the first '\' escapes the second '\' which is used to escape the matched character in the returned string
        // $& represents the matched character
        var escapedRegexString = str.replace(stringReplaceExp, '\\$&');

        return escapedRegexString;
    };

    export function _nextChar(c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    };

    /**
     * @function
     * @param {Object} element a model element (schema, table, or column)
     * @param {boolean} useName determines whether we can use name and name_style or not
     * @param {Object=} parentElement the upper element (schema->null, table->schema, column->table)
     * @desc This function determines the display name for the schema, table, or
     * column elements of a model.
     */
    export function _determineDisplayName(element, useName, parentElement) {
        var value = useName ? element.name : undefined,
            unformatted = useName ? element.name : undefined,
            hasDisplayName = false,
            isHTML = false;
        try {
            var display_annotation = element.annotations.get(_annotations.DISPLAY);
            if (display_annotation && display_annotation.content) {

                //get the markdown display name
                if(display_annotation.content.markdown_name) {
                    value = renderMarkdown(display_annotation.content.markdown_name, true);
                    unformatted = display_annotation.content.name ? display_annotation.content.name : display_annotation.content.markdown_name;
                    hasDisplayName = true;
                    isHTML = true;
                }
                //get the specified display name
                else if (display_annotation.content.name){
                    value = display_annotation.content.name;
                    unformatted = display_annotation.content.name;
                    hasDisplayName = true;
                    isHTML = false;
                }

                //get the name styles
                if(useName && display_annotation.content.name_style){
                    element._nameStyle = display_annotation.content.name_style;
                }
            }
        } catch (exception) {
            // no display annotation, don't do anything
        }

        // if name styles are undefined, get them from the parent element
        // if it's a system column, don't use the name_styles that are defined on the parent.
        // NOTE: underline_space, title_case, markdown might be null.
        if(parentElement && !(element instanceof Column && _systemColumns.indexOf(element.name) !== -1)){
            if(!("underline_space" in element._nameStyle)){
               element._nameStyle.underline_space = parentElement._nameStyle.underline_space;
            }
            if(!("title_case" in element._nameStyle)){
                element._nameStyle.title_case = parentElement._nameStyle.title_case;
            }
            if(!("markdown" in element._nameStyle)){
                element._nameStyle.markdown = parentElement._nameStyle.markdown;
            }
        }

        // if name was not specified and name styles are defined, apply the heuristic functions (name styles)
        if(useName && !hasDisplayName && element._nameStyle){
            if(element._nameStyle.markdown){
                value = renderMarkdown(element.name, true);
                isHTML = true;
            } else {
                if(element._nameStyle.underline_space){
                    value = _underlineToSpace(value);
                    unformatted = _underlineToSpace(unformatted);
                }
                if(element._nameStyle.title_case){
                    value = _toTitleCase(value);
                    unformatted = _toTitleCase(unformatted);
                }
            }
        }

        return {"isHTML": isHTML, "value": value, "unformatted": unformatted};
    };

    /**
     * @function
     * @param {string} context the context that we want the value of.
     * @param {Annotation} annotation the annotation object.
     * @param {Boolean=} dontUseDefaultContext Whether we should use the default (*) context
     * @desc This function returns the list that should be used for the given context.
     * Used for visible columns and visible foreign keys.
     */
    export function _getRecursiveAnnotationValue(context, annotation, dontUseDefaultContext) {
        var contextedAnnot = _getAnnotationValueByContext(context, annotation, dontUseDefaultContext);
        if (contextedAnnot !== -1) { // found the context
            if (typeof contextedAnnot == "object" || (_contextArray.indexOf(contextedAnnot) === -1) ) {
                return contextedAnnot;
            } else {
                return _getRecursiveAnnotationValue(contextedAnnot, annotation, dontUseDefaultContext); // go to next level
            }
        }

        return -1; // there was no annotation
    };

    /**
    * @param {string} context the context that we want the value of.
    * @param {any} annotation the annotation object.
    * @param {Boolean=} dontUseDefaultContext Whether we should use the default (*) context
    * @desc returns the annotation value based on the given context.
    */
    export function _getAnnotationValueByContext(context, annotation, dontUseDefaultContext) {

        // check annotation is an object
        if (typeof annotation !== "object" || annotation == null) {
            return -1;
        }

        if (typeof context === "string") {
            // NOTE: We assume that context names are seperated with `/`
            var partial = context,
                parts = context.split("/");
            while (partial !== "") {
              if (partial in annotation) { // found the context
                return annotation[partial];
              }
              parts.splice(-1,1); // remove the last part
              partial = parts.join("/");
            }
        }

        // if context wasn't in the annotations but there is a default context
        if (dontUseDefaultContext !== true && _contexts.DEFAULT in annotation) {
            return annotation[_contexts.DEFAULT];
        }

        return -1; // there was no annotation
    };

    /**
     * retun the value that should be used for the display setting. If missing, it will return "-1".
     *
    * @param {Table|ERMrest.Column|ERMrest.ForeignKeyRef} obj either table object, or an object that has `.table`
    * @param {String} context the context string
    * @param {String} annotKey the annotation key that you want the annotation value for
    * @param {Boolean} isTable if the first parameter is table, you should pass `true` for this parameter
    */
    export function _getHierarchicalDisplayAnnotationValue(obj, context, annotKey, isTable) {
        var hierarichy = [obj], table, annot, value = -1;
        var displayAnnot = _annotations.DISPLAY;

        if (!isTable) {
            table = obj.table;
            hierarichy.push(obj.table);
        } else {
            table = obj;
        }
        hierarichy.push(table.schema, table.schema.catalog);

        for (var i = 0; i < hierarichy.length; i++) {
            if (!hierarichy[i].annotations.contains(displayAnnot)) continue;

            annot = hierarichy[i].annotations.get(displayAnnot);
            if (annot && annot.content && annot.content[annotKey]) {
                value = _getAnnotationValueByContext(context, annot.content[annotKey]);
                if (value !== -1) break;
            }
        }

        return value;
    };

    /**
    * @param {object} ref The object that we want the null value for.
    * @param {string} context The context that we want the value of.
    * @param {Array} elements All the possible levels of heirarchy (column, table, schema).
    * @desc returns the null value for the column based on context and annotation and sets in the ref object too.
    */
    export function _getNullValue(ref, context, isTable) {
        if (context in ref._nullValue) { // use the cached value
            return ref._nullValue[context];
        }

        var value = _getHierarchicalDisplayAnnotationValue(ref, context, "show_null", isTable);

        // backward compatibility: try show_nulls too
        // TODO eventually should be removed
        if (value === -1) {
            value = _getHierarchicalDisplayAnnotationValue(ref, context, "show_nulls", isTable);
        }

        if (value === false) { //eliminate the field
            value = null;
        } else if (value === true) { //empty field
            value = "";
        } else if (typeof value !== "string") { // default
            if (context === _contexts.DETAILED) {
                value = null; // default null value for DETAILED context
            } else {
                value = ""; //default null value
            }
        }

        ref._nullValue[context] = value; // cache the value
        return value;
    };

    /**
     * @param {Annotations} annotations - the defined annotation on the model
     * @param {String} key - the annotation key
     * @param {Boolean|null} defaultValue - the value that should be used if annotation is missing.
     *                                      (parent value or null)
     * Returns:
     *  - true: if annotation is defined and it's not `false`.
     *  - false: if annotation is defined and it's `false`
     *  - defaultValue: if annotation is not defined
     * @private
     */
    export function _processACLAnnotation(annotations, key, defaultValue) {
        if (annotations.contains(key)) {
            var ndAnnot = annotations.get(key).content;
            if (ndAnnot !== false) {
                return true;
            }
            return false;
        }
        return defaultValue;
    };

    // given a reference and associated data to it, will return a list of Values
    // corresponding to its sort object
    export function _getPagingValues(ref, rowData, rowLinkedData) {
        if (!rowData) {
            return null;
        }
        var loc = ref.location,
            values = [], addedCols = {}, sortObjectNames = {},
            col, i, j, sortCol, colName, data, fkData;

        for (i = 0; i < loc.sortObject.length; i++) {
            colName = loc.sortObject[i].column;

            try {
                col = ref.getColumnByName(colName);
            } catch (e) {
                return null; // column doesn't exist return null.
            }

            // avoid duplicate sort columns
            if (col.name in sortObjectNames) continue;
            sortObjectNames[col.name] = true;

            if (!col.sortable) {
                return null;
            }

            for (j = 0; j < col._sortColumns.length; j++) {
                sortCol = col._sortColumns[j].column;

                // avoid duplciate columns
                if (sortCol in addedCols) continue;
                addedCols[sortCol] = true;

                if (col.isForeignKey || (col.isPathColumn && col.isUnique && col.hasPath)) {
                    fkData = rowLinkedData[col.name];
                    data = null;
                    if (isObjectAndNotNull(fkData)) {
                        data =  fkData[sortCol.name];
                    }
                } else {
                    data = rowData[sortCol.name];
                }
                values.push(data);
            }
        }
        return values;
    };

    /**
     * Process the given list of column order, and return the appropriate list
     * of objects that have:
     * - `column`: The {@link ERMrest.Column} object.
     * - `descending`: The boolean that Indicates whether we should reverse sort order or not.
     *
     * @param  {string} columnOrder The object that defines the column/row order
     * @param  {Table} table
     * @param  {Object=} options the extra options:
     *                  - allowNumOccurrences: to allow the specific frequency column_order
     * @return {Array=} If it's undefined, the column_order that is defined is not valid
     * @private
     */
    export function _processColumnOrderList(columnOrder, table, options) {
        options = options || {};

        if (columnOrder === false) {
            return false;
        }

        var res, colName, descending, colNames = {}, numOccurr = false;
        if (Array.isArray(columnOrder)) {
            res = [];
            for (var i = 0 ; i < columnOrder.length; i++) {
                try {
                    if (typeof columnOrder[i] === "string") {
                        colName = columnOrder[i];
                    } else if (columnOrder[i] && columnOrder[i].column) {
                        colName = columnOrder[i].column;
                    } else if (options.allowNumOccurrences && !numOccurr && columnOrder[i] && columnOrder[i].num_occurrences) {
                        numOccurr = true;
                        // add the frequency sort
                        res.push({num_occurrences: true, descending:  (columnOrder[i] && columnOrder[i].descending === true)});

                        continue;
                    } else {
                        continue; // invalid syntax
                    }

                    const col = table.columns.get(colName);

                    // make sure it's sortable
                    if (_nonSortableTypes.indexOf(col.type.name) !== -1) {
                        continue;
                    }

                    // avoid duplicates
                    if (colName in colNames) {
                        continue;
                    }
                    colNames[colName] = true;

                    descending = (columnOrder[i] && columnOrder[i].descending === true);
                    res.push({
                        column: col,
                        descending: descending,
                    });
                } catch(exception) {
                    // ignore
                }
            }
        }
        return res; // it might be undefined
    };

    /**
     * Given the source object and default comment props, will return the comment that should be used.
     * @param {any} sourceObject the object that might have comment props
     * @param {string=} defaultComment the default comment that should be used if sourceObject doesn't have comment
     * @param {boolean=} defaultCommentRenderMd the default comment_render_markdown that should be used if sourceObject doesn't have comment_render_markdown
     * @param {string=} defaultDisplayMode the default comment_display that should be used if sourceObject doesn't have comment_display
     * @returns {CommentType}
     * @private
     */
    export function _processSourceObjectComment(sourceObject, defaultComment, defaultCommentRenderMd, defaultDisplayMode) {
        if (sourceObject && _isValidModelComment(sourceObject.comment)) {
            defaultComment = sourceObject.comment;
        }
        if (sourceObject && _isValidModelCommentDisplay(sourceObject.comment_display)) {
            defaultDisplayMode = sourceObject.comment_display;
        }
        if (sourceObject && typeof sourceObject.comment_render_markdown === 'boolean') {
            defaultCommentRenderMd = sourceObject.comment_render_markdown;
        }
        return _processModelComment(defaultComment, defaultCommentRenderMd, defaultDisplayMode);
    };

    /**
     * Turn a comment annotaiton/string value into a proper comment object.
     * @param {string|null|false} comment
     * @param {boolean=} isMarkdown whether the given comment should be rendered as markdown (default: true).
     * @param {string=} displayMode the display mode of the comment (inline, tooltip)
     * @private
     */
    export function _processModelComment(comment, isMarkdown, displayMode) {
        if (comment !== false && typeof comment !== 'string') {
            return null;
        }

        var usedDisplayMode = _isValidModelCommentDisplay(displayMode) ? displayMode : _commentDisplayModes.tooltip;
        if (comment === false) {
            return { isHTML: false, unformatted: '', value: '', displayMode: usedDisplayMode };
        }

        return {
            isHTML: isMarkdown !== false,
            unformatted: comment,
            value: (isMarkdown !== false && comment.length > 0) ? renderMarkdown(comment) : comment,
            displayMode: usedDisplayMode
        };
    };

    /**
     * Given an input string for the comment, will return true or false depending if the comment is of a valid type and value
     *   - if =string : returns true.
     *   - if =false: returns true.
     *   - otherwise returns false
     * @private
     */
    export function _isValidModelComment(comment) {
        return typeof comment === "string" || comment === false;
    };

    /**
     * Given an input string for the comment display, will return true or false depending if the display value is of a valid type and value
     *   - if =string && (="tooltip" || ="inline") : returns true.
     *   - otherwise returns false
     * @private
     */
    export function _isValidModelCommentDisplay(display) {
        return typeof display === "string" && _commentDisplayModes[display] !== -1;
    };

    /**
     * Given a foreign key name, will return true or false depending if the name value is of a valid type and value
     *    - if =['', ''] : returns true
     *    - otherwise returns false
     *
     * @private
     */
    export function _isValidForeignKeyName(fkName) {
        return Array.isArray(fkName) && fkName.length === 2 && typeof fkName[0] === 'string' && typeof fkName[1] === 'string';
    };

    /**
     * Given input value for bulk_create_foreign_key, will return true or false depending if the value is of a valid type and value for the bulk_create_foreign_key
     *   - if =false | =null | =['', ''] : returns true
     *   - otherwise returns false
     *
     * @private
     */
    export function _isValidBulkCreateForeignKey(bulkCreateProp) {
        return bulkCreateProp === false || bulkCreateProp === null || _isValidForeignKeyName(bulkCreateProp);
    };

    /**
     * @function
     * @param {Table} table The object that we want the formatted values for.
     * @param {String} context the context that we want the formatted values for.
     * @param {object} data The object which contains key value pairs of data to be transformed
     * @param {object=} linkedData The object which contains key value paris of foreign key data.
     * @return {any} A formatted keyvalue pair of object
     * @desc Returns a formatted keyvalue pairs of object as a result of using `col.formatvalue`.
     * If you want the formatted value of a single column, you should call formatvalue,
     * this function is written for the purpose of being used in markdown.
     * @private
     */
    export function _getFormattedKeyValues(table, context, data, linkedData) {
        var keyValues, k, fkData, col, cons, rowname, v;

        var getTableValues = function (d, currTable) {
            var res = {};
            currTable.sourceDefinitions.columns.forEach(function (col) {
                if (!(col.name in d)) return;

                try {
                    k = col.name;
                    v = col.formatvalue(d[k], context);
                    if (col.type.isArray) {
                        v = _formatUtils.printArray(v, {isMarkdown: true});
                    }

                    res[k] = v;
                    res["_" + k] = d[k];

                    // alternative names
                    // TODO this should change to allow usage of table column names.
                    if (Array.isArray(currTable.sourceDefinitions.sourceMapping[k]) ){
                        currTable.sourceDefinitions.sourceMapping[k].forEach(function (altKey) {
                            res[altKey] = v;
                            res["_" + altKey] = d[k];
                        });
                    }
                } catch (e) {
                    // if the value is invalid (for example hatrac TODO can be imporved)
                    res[k] = d[k];
                    res["_" + k] = d[k];
                }
            });
            return res;
        };

        // get the data from current table
        keyValues = getTableValues(data, table);

        //get foreignkey data if available
        if (linkedData && typeof linkedData === "object" && table.sourceDefinitions.fkeys.length > 0) {
            // use a prototype-less object to avoid prototype pollution via constraint names
            keyValues.$fkeys = Object.create(null);
            table.sourceDefinitions.fkeys.forEach(function (fk) {
                var p = _generateRowLinkProperties(fk.key, linkedData[fk.name], context);
                if (!p) return;

                cons = fk.constraint_names[0];
                if (!keyValues.$fkeys[cons[0]]) {
                    // per-schema map should also be prototype-less
                    keyValues.$fkeys[cons[0]] = Object.create(null);
                }

                var fkTempVal = {
                    "values": getTableValues(linkedData[fk.name], fk.key.table),
                    "rowName": p.unformatted,
                    "uri": {
                        "detailed": p.reference.contextualize.detailed.appLink
                    }
                };

                // the new format
                keyValues["$fkey_" + cons[0] + "_" + cons[1]] = fkTempVal;

                // the old format
                keyValues.$fkeys[cons[0]][cons[1]] = fkTempVal;
            });
        }

        return keyValues;
    };

    /**
     * @param  {string[]} columnNames Array of column names
     * @return {string|false} the column name. if couldn't find any columns will return false.
     * @private
     */
    export function _getCandidateRowNameColumn(columnNames) {
        var candidates = [
            'title', 'name', 'term', 'label', 'accessionid', 'accessionnumber'
        ];

        var removeExtra = function (str) { // remove `.`, `-`, `_`, and space
            return str.replace(/[\.\s\_-]+/g, "").toLocaleLowerCase();
        };

        for (var i = 0; i < candidates.length; i++) {
            for (var j = 0; j < columnNames.length; j++) {
                if (candidates[i] === removeExtra(columnNames[j])) {
                    return columnNames[j];
                }
            }
        }

        // no candidate columns found
        return false;
    };

    /**
     * returns an object with the following attributes:
     *  - values: the formatted and unformatted values
     *  - rowName: a rowname object.
     *  - uri.detailed: applink to detailed for the row
     * @private
     * @param  {Table} table  the table object
     * @param  {string} context    current context
     * @param  {Object} data       the raw data
     * @param  {any=} linkedData the raw data of foreignkeys
     * @param  {Key=} key the alternate key to use
     * @return {{values: Record<string, any>, rowName: {value: string, isHTML: boolean, unformatted: string}, uri: {detailed: string}}}
     */
    export function _getRowTemplateVariables(table, context, data, linkedData, key) {
        var uri = _generateRowURI(table, data, key);
        if (uri == null) return {};
        var ref = new Reference(parse(uri), table.schema.catalog);
        return {
            values: _getFormattedKeyValues(table, context, data, linkedData),
            rowName: _generateRowName(table, context, data, linkedData).unformatted,
            uri: {
                detailed: ref.contextualize.detailed.appLink
            }
        };
    };

    /**
     * Given the available linked data, generate the uniqueId for the row this data represents given the shortest key of the table
     *
     * @param {Column[]} tableShortestKey shortest key from the table the linkedData is for
     * @param {Object} data data to use to generate the unique id
     * @returns string | null - unique id for the row the linkedData represents
     */
    export function _generateTupleUniqueId(tableShortestKey, data) {
        let hasNull = false, _uniqueId = "";

        for (var i = 0; i < tableShortestKey.length; i++) {
            const col = tableShortestKey[i];
            const keyName = col.name;
            if (data[keyName] == null) {
                hasNull = true;
                break;
            }
            if (i !== 0) _uniqueId += "_";
            const isJSON = col.type.name === 'json' || col.type.name === 'jsonb';
            // if the column is JSON, we need to stringify it otherwise it will print [object Object]
            _uniqueId += isJSON ? JSON.stringify(data[keyName], undefined, 0) : data[keyName];
        }

        if (hasNull) {
            _uniqueId = null;
        }

        return _uniqueId;
    };

    /**
     * @function
     * @param {Table} table The table that we want the row name for.
     * @param {String} context Current context.
     * @param {object} data The object which contains key value pairs of data.
     * @param {Object} linkedData The object which contains key value pairs of foreign key data.
     * @param {boolean} isTitle determines Whether we want rowname for title or not
     * @returns {{value: string, isHTML: boolean, unformatted: string}} The displayname object for the row. It includes has value, isHTML, and unformatted.
     * @desc Returns the row name (html) using annotation or heuristics.
     * @private
     */
    export function _generateRowName(table, context, data, linkedData, isTitle) {
        var annotation, col, template, keyValues, pattern, actualContext;

        var templateVariables = _getFormattedKeyValues(table, context, data, linkedData);

        // If table has table-display annotation then set it in annotation variable
        if (table.annotations && table.annotations.contains(_annotations.TABLE_DISPLAY)) {
            actualContext = isTitle ? "title" : (typeof context === "string" && context !== "*" ? context : "");
            annotation = _getRecursiveAnnotationValue(
                [_contexts.ROWNAME, actualContext].join("/"),
                table.annotations.get(_annotations.TABLE_DISPLAY).content
            );
        }

        // if annotation is populated and annotation has display.rowName property
        if (annotation && typeof annotation.row_markdown_pattern === 'string') {
            template = annotation.row_markdown_pattern;

            pattern = _renderTemplate(template, templateVariables, table.schema.catalog, {templateEngine: annotation.template_engine});

        }

        // annotation was not defined, or it's producing empty string.
        if (pattern == null || pattern.trim() === '') {

            // no row_name annotation, use column with title, name, term
            var candidate = _getCandidateRowNameColumn(Object.keys(data)), result;
            if (candidate !== false) {
                result = templateVariables[candidate];
            }

            if (!result) {

                // no title, name, term, label column: use id:text type
                // Check for id column whose type should not be integer or serial
                var idCol = table.columns.all().filter(function (c) {
                    return ((c.name.toLowerCase() === "id") && (c.type.name.indexOf('serial') === -1) && (c.type.name.indexOf('int') === -1));
                });


                // no id:text, use the unique key
                // If id column exists
                if (idCol.length && typeof data[idCol[0].name] === 'string') {

                    result = templateVariables[idCol[0].name];

                } else {

                    // Get the columns for displaykey
                    var keyColumns = table.displayKey;

                    // TODO this check needs to change. it is supposed to check if the table has a key or not
                    // if (keyColumns.length >= table.columns.length) {
                    //     return null;
                    // }

                    var values = [];

                    // Iterate over the keycolumns to get their formatted values for `row_name` context
                    keyColumns.forEach(function (c) {
                        var value = templateVariables[c.name];
                        values.push(value);
                    });

                    /*
                     * join all values by ':' to get the display_name
                     * Eg: displayName for values=["12", "DNA results for human specimen"] would be
                     * "12:DNA results for human specimen"
                     */
                    result = values.join(':');
                }
            }

            template = "{{{name}}}";
            keyValues = {"name": result};

            // get templated patten after replacing the values using Mustache
            pattern = _renderTemplate(template, keyValues, table.schema.catalog);
        }

        // Render markdown content for the pattern
        if (pattern == null || pattern.trim() === '') {
            return {"value": "", "unformatted": ""};
        }

        return {
            "value": renderMarkdown(pattern, true),
            "unformatted": pattern,
            "isHTML": true
        };

    };

    /**
     * @function
     * @desc Given a key object, will return the presentation object that can bse used for it
     * @param  {Key} key    the key object
     * @param  {object} data        the data for the table that key is from
     * @param  {string} context     the context string
     * @param  {object=} templateVariables
     * @return {object} the presentation object that can be used for the key
     * (it has `isHTML`, `value`, and `unformatted`).
     * NOTE the function might return `null`.
     * @private
     */
    export function _generateKeyPresentation(key, data, context, templateVariables, addLink) {
        // if data is empty
        if (typeof data === "undefined" || data === null || Object.keys(data).length === 0) {
            return null;
        }

        var value, caption, unformatted, i;
        var cols = key.colset.columns,
            rowURI = _generateRowURI(key.table, data, key);

        // if any of key columns don't have data, this link is not valid.
        if (rowURI == null) {
            return null;
        }

        // make sure that templateVariables is defined
        if (!isObjectAndNotNull(templateVariables)) {
           templateVariables = _getFormattedKeyValues(key.table, context, data);
        }

        // use the markdown_pattern that is defiend in key-display annotation
        var display = key.getDisplay(context);
        if (display.isMarkdownPattern) {
            unformatted = _renderTemplate(
                display.markdownPattern,
                templateVariables,
                key.table.schema.catalog,
                {templateEngine: display.templateEngine}
            );
            unformatted = (unformatted === null || unformatted.trim() === '') ? "" : unformatted;
            caption = renderMarkdown(unformatted, true);
        } else {
            var values = [], unformattedValues = [];

            // create the caption
            var presentation;
            for (i = 0; i < cols.length; i++) {
                try {
                    presentation = cols[i].formatPresentation(data, context, templateVariables);
                    values.push(presentation.value);
                    unformattedValues.push(presentation.unformatted);
                } catch (exception) {
                    // the value doesn't exist
                    return null;
                }
            }
            caption = values.join(":");
            unformatted = unformattedValues.join(":");

            // if the caption is empty we cannot add any link to that.
            if (caption.trim() === '') {
                return null;
            }
        }

        if (!addLink || caption.match(/<a\b.+href=/)) {
            value = caption;
        } else {
            var keyRef = new Reference(parse(rowURI), key.table.schema.catalog);
            var appLink = keyRef.contextualize.detailed.appLink;

            value = '<a href="' + appLink +'">' + caption + '</a>';
            unformatted = "[" + unformatted + "](" + appLink + ")";
        }

        return {isHTML: true, value: value, unformatted: unformatted};
    };

    /**
     * @function
     * @private
     * @desc Given the key of a table, and data for one row will return the
     * presentation object for the row.
     * @param  {Key} key   the key of the table
     * @param  {String} context    Current context
     * @param  {object} data       Data for the table that this key is referring to.
     * @param  {boolean} addLink   whether the function should attach link or just the rowname.
     * @return an object with `caption`, and `reference` object which can be used for getting uri.
     */
    export function _generateRowPresentation(key, data, context, addLink) {
        var presentation = _generateRowLinkProperties(key, data, context);

        if (!presentation) {
            return null;
        }

        var value, unformatted, appLink;

        // if we don't want link, or caption has a link, or  or context is EDIT: don't add the link.
        // create the link using reference.
        if (!addLink || presentation.caption.match(/<a\b.+href=/) || _isEntryContext(context)) {
            value = presentation.caption;
            unformatted = presentation.unformatted;
        } else {
            appLink = presentation.reference.contextualize.detailed.appLink;
            value = '<a href="' + appLink + '">' + presentation.caption + '</a>';
            unformatted = "[" + presentation.unformatted + "](" + appLink + ")";
        }

        return {isHTML: true, value: value, unformatted: unformatted};
    };

    /**
     * Given a table object and raw data for a row, return a uri to that row with fitlers.
     * @param  {Table} table the table object
     * @param  {Object} raw data for the row
     * @param  {Key=} key if we want the link based on a specific key
     * @return {String|null} filter that represents the current row. If row data
     * is missing, it will return null.
     */
    export function _generateRowURI(table, data, key) {
        if (data == null) return null;

        var cols = (isObjectAndNotNull(key) && key.colset) ? key.colset.columns : table.shortestKey;
        var keyPair = "", col, i;
        for (i = 0; i < cols.length; i++) {
            col = cols[i].name;
            if (data[col] == null) return null;
            keyPair +=  fixedEncodeURIComponent(col) + "=" + fixedEncodeURIComponent(data[col]);
            if (i != cols.length - 1) {
                keyPair += "&";
            }
        }
        return table.uri + "/" + keyPair;
    };

    /**
     * @function
     * @private
     * @param  {Key} key     key of the table
     * @param  {string} context current context
     * @param  {object} data    data for the table that this key is referring to
     * @return {object} an object with the following attributes:
     * - `caption`: The caption that can be used to refer to this row in a link
     * - `unformatted`: The unformatted version of caption.
     * - `refernece`: The reference object that can be used for generating link to the row
     * @desc
     * Creates the properies for generating a link to the given row of data.
     * It might return `null`.
     */
    export function _generateRowLinkProperties(key, data, context) {

        // if data is empty
        if (typeof data === "undefined" || data === null || Object.keys(data).length === 0) {
            return null;
        }

        var value, rowname, i, caption, unformatted;
        var table = key.table;
        var rowURI = _generateRowURI(table, data, key);

        // if any of key columns don't have data, this link is not valid.
        if (rowURI == null) {
            return null;
        }

        // use row name as the caption
        rowname = _generateRowName(table, context, data);
        caption = rowname.value;
        unformatted = rowname.unformatted;

        // use key for displayname: "col_1:col_2:col_3"
        if (caption.trim() === '') {
            var templateVariables = _getFormattedKeyValues(table, context, data),
                formattedKeyCols = [],
                unformattedKeyCols = [],
                pres, col;

            for (i = 0; i < key.colset.columns.length; i++) {
                col = key.colset.columns[i];
                pres = col.formatPresentation(data, context, {templateVariables: templateVariables});
                formattedKeyCols.push(pres.value);
                unformattedKeyCols.push(pres.unformatted);
            }
            caption = formattedKeyCols.join(":");
            unformatted = unformattedKeyCols.join(":");

            if (caption.trim() === '') {
                return null;
            }
        }

        // use the shortest key if it has data (for shorter url).
        var shortestKeyURI = _generateRowURI(table, data);
        if (shortestKeyURI != null) {
            rowURI = shortestKeyURI;
        }

        return {
            unformatted: unformatted,
            caption: caption,
            reference:  new Reference(parse(rowURI), table.schema.catalog)
        };
    };

    /**
     * Generate the filter based on the given key and data.
     * The return object has the following properties:
     *  - successful: whether we encounter any issues or not
     *  - filters: If successful, it will be an array of {path, keyData}
     *  - hasNull: If failed, it will signal that the issue was related to null value
     *             for a column. `column` property will return the column name that had null value.
     * @param {Column[]} keyColumns
     * @param {Object} data
     * @param {Catalog} catalogObject
     * @param {number} pathOffsetLength the length of offset that should be considered for length limitation logic.
     *                                  if the given value is negative, we will not check the url length limitation.
     * @param {string} displayname the displayname of reference, used for error message
     */
    export function generateKeyValueFilters(keyColumns, data, catalogObject, pathOffsetLength, displayname) {
        var encode = fixedEncodeURIComponent, pathLimit = URL_PATH_LENGTH_LIMIT;

        // see if the quantified syntax can be used
        var canUseQuantified = false;
        if (keyColumns.length > 1 || data.length === 1) {
            canUseQuantified = false;
        }
        else if (catalogObject && keyColumns.length === 1 && keyColumns[0].name === _systemColumnNames.RID) {
            canUseQuantified = catalogObject.features[_ERMrestFeatures.QUANTIFIED_RID_LISTS];
        } else if (catalogObject) {
            canUseQuantified = catalogObject.features[_ERMrestFeatures.QUANTIFIED_VALUE_LISTS];
        }

        var result = []; // computed, keyData

        var keyData = [], filter = '', currentPath = '', keyColName, keyColVal, keyColumnsData;
        for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
            var rowData = data[rowIndex];
            if (canUseQuantified) {
                keyColName = keyColumns[0].name;
                keyColVal = rowData[keyColName];
                keyColumnsData = {};

                if (keyColVal === undefined || keyColVal === null) {
                    return {
                        successful: false,
                        message: "One or more " + displayname + " records have a null value for " + keyColName + ".",
                        hasNull: true,
                        column: keyColName
                    };
                }

                filter = encode(keyColVal);
                keyColumnsData[keyColName] = keyColVal;

                // 6: for `=any()`
                // +1 is for the `,` that we're going to add
                // <pathOffset/><col>=any(<filter>,)
                if (rowIndex !== 0 && pathOffsetLength >= 0 &&
                    (pathOffsetLength + encode(keyColName).length + 6 + currentPath.length + (rowIndex != 0 ? 1 : 0) + filter.length) > pathLimit) {
                    result.push({
                        path: encode(keyColName)  + '=any(' + currentPath + ')',
                        keyData: keyData
                    });
                    currentPath = '';
                    keyData = [];
                } else if (rowIndex != 0) {
                    filter = ',' + filter;
                }

                currentPath += filter;
                keyData.push(keyColumnsData);
            } else {
                keyColumnsData = {};
                filter = keyColumns.length > 1 ? '(' : '';
                // add the values for the current row
                for (var keyIndex = 0; keyIndex < keyColumns.length; keyIndex++) {
                    keyColName = keyColumns[keyIndex].name;
                    keyColVal = rowData[keyColName];

                    if (keyColVal === undefined || keyColVal === null) {
                        return {successful: false, message: "One or more records have a null value for " + keyColName, hasNull: true, column: keyColName};
                    }
                    if (keyIndex != 0) filter += '&';
                    filter += encode(keyColName) + '=' + encode(keyColVal);
                    keyColumnsData[keyColName] = keyColVal;
                }
                filter += keyColumns.length > 1 ? ')' : '';

                // check url length limit if not first one;
                if (rowIndex != 0 && pathOffsetLength >= 0 &&
                    (pathOffsetLength + currentPath.length + (rowIndex != 0 ? ';' : '') + filter).length > pathLimit) {
                    // any more filters will go over the url length limit so save the current path and count
                    // then clear both to start creating a new path
                    result.push({
                        path: currentPath,
                        keyData: keyData
                    });
                    currentPath = '';
                    keyData = [];
                } else if (rowIndex != 0) {
                    // prepend the conjunction operator when it isn't the first filter to create and we aren't dealing with a url length limit
                    filter = ";" + filter;
                }

                // append the filter either on the previous path after adding ";", or on the new path started from compactPath
                currentPath += filter;
                keyData.push(keyColumnsData);
            }
        }

        // After last iteration of loop, push the current path
        if (canUseQuantified) {
            result.push({
                path: encode(keyColName)  + '=any(' + currentPath + ')',
                keyData: keyData
            });
        } else {
            result.push({
                path: currentPath,
                keyData: keyData
            });
        }

        return {successful: true, filters: result};
    };

    export function _stringToDate(_date, _format, _delimiter) {
        var formatLowerCase=_format.toLowerCase();
        var formatItems=formatLowerCase.split(_delimiter);
        var dateItems=_date.split(_delimiter);
        var monthIndex=formatItems.indexOf("mm");
        var dayIndex=formatItems.indexOf("dd");
        var yearIndex=formatItems.indexOf("yyyy");
        var month=parseInt(dateItems[monthIndex]);
        month-=1;
        var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex].split(" ")[0]);
        return formatedDate;
    };

    /**
     * Given a number and precision, it will truncate it to show the given number
     * of digits.
     *
     *
     * @param {number} num
     * @param {number} precision
     * @param {number} minAllowedPrecision
     */
    export function _toPrecision(num, precision, minAllowedPrecision) {
        precision = parseInt(precision);
        precision = isNaN(precision) || precision < minAllowedPrecision ? minAllowedPrecision : precision;

        var isNegative = num < 0;
        if (isNegative) num = num * -1;

        // this truncation logic only works because of the minimum precision that
        // we're allowing. if we want to allow less than that, then we should change this.
        var displayedNum = num.toString();
        var f = displayedNum.indexOf('.');
        if (f !== -1) {
          // find the number of digits after decimal point
          var decimalPlaces = Math.pow(10, precision - f);

          // truncate the value
          displayedNum = Math.floor(num * decimalPlaces) / decimalPlaces;
        }

        // if precision is too large, the calculation might return NaN.
        if (isNaN(displayedNum)) {
          return (isNegative ? '-' : '') + num;
        }

        return (isNegative ? '-' : '') + displayedNum;
    };

    /**
     * @desc An object of pretty print utility functions
     * @private
     */
    export const _formatUtils = {
        /**
         * @function
         * @param {Object} value A boolean value to transform
         * @param {Object} [options] Configuration options
         * @return {string} A string representation of a boolean value
         * @desc Formats a given boolean value into a string for display
         */
        printBoolean: function printBoolean(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }
            return Boolean(value).toString();
        },

        /**
         * @function
         * @param {Object} value An integer value to transform
         * @param {Object} [options] Configuration options
         * @return {string} A string representation of value
         * @desc Formats a given integer value into a whole number (with a thousands
         * separator if necessary), which is transformed into a string for display.
         */
        printInteger: function printInteger(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }

            // Remove fractional digits
            value = Math.round(value);

            // Add comma separators
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

        /**
         * @function
         * @param {Object} value An timestamp value to transform
         * @param {Object} [options] Configuration options. No options implemented so far.
         * @return {string} A string representation of value. Default is ISO 8601-ish like 2017-01-08 15:06:02.
         * @desc Formats a given timestamp value into a string for display.
         */
        printTimestamp: function printTimestamp(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }

            try {
                value = value.toString();
            } catch (exception) {
                $log.error("Couldn't extract timestamp from input: " + value);
                $log.error(exception);
                return '';
            }

            if (!moment(value).isValid()) {
                $log.error("Couldn't transform input to a valid timestamp: " + value);
                return '';
            }

            return moment(value).format(_dataFormats.DATETIME.display);
        },

        /**
         * @function
         * @param {Object} value A date value to transform
         * @param {Object} [options] Configuration options. No options implemented so far.
         * @return {string} A string representation of value
         * @desc Formats a given date[time] value into a date string for display.
         * If any time information is provided, it will be left off.
         */
        printDate: function printDate(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }
            // var year, month, date;
            try {
                value = value.toString();
            } catch (exception) {
                $log.error("Couldn't extract date info from input: " + value);
                $log.error(exception);
                return '';
            }

            if (!moment(value).isValid()) {
                $log.error("Couldn't transform input to a valid date: " + value);
                return '';
            }

            return moment(value).format(_dataFormats.DATE);
        },

        /**
         * @function
         * @param {Object} value A float value to transform
         * @param {Object} [options] Configuration options.
         * - "numFracDigits" is the number of fractional digits to appear after the decimal point
         * @return {string} A string representation of value
         * @desc Formats a given float value into a string for display. Removes leading 0s; adds thousands separator.
         */
        printFloat: function printFloat(value, options) {
            options = (typeof options === 'undefined') ? {} : options;

            if (value === null) {
                return '';
            }

            value = parseFloat(value);
            if (options.numFracDigits) {
                value = value.toFixed(options.numFracDigits); // toFixed() rounds the value, is ok?
            } else {
                // if the float has 13 digits or more (1 trillion or greater)
                // or the float has 7 decimals or more, use scientific notation
                //    NOTE: javascript in browser uses 22 as the threshold for large numbers
                //          If there are 22 digits or more, then scientific notation is used
                //          ecmascript language spec: https://262.ecma-international.org/5.1/#sec-9.8.1
                if (Math.abs(value) >= 1000000000000 || Math.abs(value) < 0.000001) {
                    // this also ensures there are more digits than the precision used
                    // so the number will be converted to scientific notation instead of
                    // being padded with zeroes with no conversion
                    // for example: 0.000001.toPrecision(4) ==> '0.000001000'
                    value = value.toPrecision(5);
                } else {
                    value = value.toFixed(4);
                }

            }

            // Remove leading zeroes
            value = value.toString().replace(/^0+(?!\.|$)/, '');

            // Add comma separators
            var parts = value.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        },

        /**
         * @function
         * @param {Object} value A text value to transform
         * @param {Object} [options] Configuration options.
         * @return {string} A string representation of value
         * @desc Formats a given text value into a string for display.
         */
        printText: function printText(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return value.toString();
        },

        /**
         * @function
         * @param {Object} value The Markdown to transform
         * @param {Object} [options] Configuration options.
         * @return {string} A string representation of value
         * @desc Formats Markdown syntax into an HTML string for display.
         */
        printMarkdown: function printMarkdown(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }

            return renderMarkdown(value, options.inline);
        },

        /**
        * @function
        * @param {Object} value A json value to transform
        * @return {string} A string representation of value based on different context
        *                  The beautified version of JSON in other cases
            *              A special case to show null if the value is blank string
        * @desc Formats a given json value into a string for display.
        */
        printJSON: function printJSON(value, options) {
            return value === "" ? JSON.stringify(null) : JSON.stringify(value, undefined, 2);
       },

        /**
         * @function
         * @param {string} value The gene sequence to transform
         * @param {Object} [options] Configuration options. Accepted parameters
         * are "increment" (desired number of characters in each segment) and
         * "separator" (desired separator between segments).
         * @return {string} A string representation of value
         * @desc Formats a gene sequence into a string for display. By default,
         * it will split gene sequence into an increment of 10 characters and
         * insert an empty space in between each increment.
         */

        printGeneSeq: function printGeneSeq(value, options) {
            options = (typeof options === 'undefined') ? {} : options;

            if (value === null) {
                return '';
            }

            try {
                // Default separator is a space.
                if (!options.separator) {
                    options.separator = ' ';
                }
                // Default increment is 10
                if (!options.increment) {
                    options.increment = 10;
                }
                var inc = parseInt(options.increment, 10);

                if (inc === 0) {
                    return value.toString();
                }

                // Reset the increment if it's negative
                if (inc <= -1) {
                    inc = 1;
                }

                var formattedSeq = '`';
                var separator = options.separator;
                while (value.length >= inc) {
                    // Get the first inc number of chars
                    var chunk = value.slice(0, inc);
                    // Append the chunk and separator
                    formattedSeq += chunk + separator;
                    // Remove this chunk from value
                    value = value.slice(inc);
                }

                // Append any remaining chars from value that was too small to form an increment
                formattedSeq += value;

                // Slice off separator at the end
                if (formattedSeq.slice(-1) == separator) {
                    formattedSeq = formattedSeq.slice(0, -1);
                }

                // Add the ending backtick at the end
                formattedSeq += '`';

                // Run it through renderMarkdown to get the sequence in a fixed-width font
                return renderMarkdown(formattedSeq, true);
            } catch (e) {
                $log.error("Couldn't parse the given markdown value: " + value);
                $log.error(e);
                return value;
            }

        },

        /**
         * @function
         * @param  {Array} value the array of values
         * @param  {Object} options Configuration options. Accepted parameters:
         * - `isMarkdown`: if this is true, we will not esacpe markdown characters
         * - `returnArray`: if this is true, it will return an array of strings.
         * @return {string|string[]} A string represntation of array.
         * @desc
         * Will generate a comma seperated value for an array. It will also change `null` and `""`
         * to their special presentation.
         * The returned value might return markdown, which then should call printMarkdown on it.
         */
        printArray: function (value, options) {
            options = (typeof options === 'undefined') ? {} : options;

            if (!value || !Array.isArray(value) || value.length === 0) {
                return '';
            }

            var arr = value.map(function (v) {
                var isMarkdown = (options.isMarkdown === true);
                var pv = v;
                if (v === "") {
                    pv = _specialPresentation.EMPTY_STR;
                    isMarkdown = true;
                }
                else if (v == null) {
                    pv = _specialPresentation.NULL;
                    isMarkdown = true;
                }

                if (!isMarkdown) pv = _escapeMarkdownCharacters(pv);
                return pv;
            });

            if (options.returnArray) return arr;
            return arr.join(", ");
        },

        printColor: function (value, options) {
            options = (typeof options === 'undefined') ? {} : options;

            if (!isValidColorRGBHex(value)) {
                return '';
            }

            value = value.toUpperCase();
            return ':span: :/span:{.' + _classNames.colorPreview + ' style=background-color:' + value +'} ' + value;
        },

        /**
         * Return the humanize value of byte count
         *
         * This function will not round up and will only truncate the number
         * to honor the given precision. In 'si', precision below 3 is not allowed.
         * Similarly, precision below 4 is not allowed in 'binary'.
         * 'raw' will return the "formatted" value.
         *
         * @param {*} value
         * @param {?string} mode either `raw`, `si`, or `binary` (if invalid or missing, 'si' will be used)
         * @param {?number} precision An integer specifying the number of digits to be displayed
         *                           (if invalid or missing, `3` will be used by default.)
         * @param {?boolean} withTooltip whether we should return it with tooltip or just the value.
         */
        humanizeBytes: function (value, mode, precision, withTooltip) {
            // we cannot use parseInt here since it won't allow larger numbers.
            var v = parseFloat(value);
             mode = ['raw', 'si', 'binary'].indexOf(mode) === -1 ? 'si' : mode;

            if (isNaN(v)) return '';
            if (v === 0 || mode === 'raw') {
                return _formatUtils.printInteger(value);
            }

            var divisor = 1000, units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            if (mode === 'binary') {
                divisor = 1024;
                units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
            }

            // find the closest power of the divisor to the given number ('u').
            // in the end, 'v' will be the number that we should display.
            var u = 0;
            while (v >= divisor || -v >= divisor) {
                v /= divisor;
                u++;
            }

            // our units don't support this, so just return the "raw" mode value.
            if (u >= units.length) {
                return _formatUtils.printInteger(value);
            }

            // we don't want to truncate the value, so we should set a minimum
            var minP = mode === "si" ? 3 : 4;

            var res = (u ? _toPrecision(v, precision, minP) : v) + ' ' + units[u];
            if (typeof withTooltip === 'boolean' && withTooltip && u > 0) {
                var numBytes = _formatUtils.printInteger(Math.pow(divisor, u));
                var tooltip = _formatUtils.printInteger(value);
                tooltip += ' bytes (1 ' + units[u] + ' = ' + numBytes + ' bytes)';
                res = ':span:' + res + ':/span:{data-chaise-tooltip="' + tooltip + '"}';
            }
            return res;
        }
    };

    /**
     * format the raw value based on the column definition type, heuristics, annotations, etc.
     * @param {Type} type - the type object of the column
     * @param {Object} data - the 'raw' data value.
     * @returns {string} The formatted value.
     */
    export function _formatValueByType(type, data, options) {
        var utils = _formatUtils;
        switch(type.name) {
            case 'timestamp':
            case 'timestamptz':
                data = utils.printTimestamp(data, options);
                break;
            case 'date':
                data = utils.printDate(data, options);
                break;
            case 'numeric':
            case 'float4':
            case 'float8':
                data = utils.printFloat(data, options);
                break;
            case 'int2':
            case 'int4':
            case 'int8':
                data = utils.printInteger(data, options);
                break;
            case 'boolean':
                data = utils.printBoolean(data, options);
                break;
            case 'markdown':
                // Do nothing as we will format markdown at the end of format
                data = data.toString();
                break;
            case 'gene_sequence':
                data = utils.printGeneSeq(data, options);
                break;
            //Cases to support json and jsonb columns
            case 'json':
            case 'jsonb':
                data = utils.printJSON(data, options);
                break;
            case 'color_rgb_hex':
                data = utils.printColor(data, options);
                break;
            default: // includes 'text' and 'longtext' cases
                data = type.baseType ? _formatValueByType(type.baseType, data, options) : utils.printText(data, options);
                break;
        }
        return data;
    };

    export function _isValidSortElement(element, index, array) {
        return (typeof element == 'object' &&
            typeof element.column == 'string' &&
            typeof element.descending == 'boolean');
    };

    /**
     * @desc
     * Given a url and origin, test whether the url has the host.
     * Returns `null` if we cannot determine the origin.
     *
     * @function
     * @private
     * @param  {string} url    url string
     * @return {boolean|null}
     */
    export function _isSameHost(url) {
        // chaise-config internalHosts are not defined, so we cannot determine
        const _clientConfig = ConfigService.clientConfig;
        if (!isObjectAndNotNull(_clientConfig) || _clientConfig.internalHosts.length == 0) return null;

        var hasProtocol = new RegExp('^(?:[a-z]+:)?//', 'i').test(url);

        // if the url doesn't have origin (relative)
        if (!hasProtocol) return true;

        var urlParts = url.split("/");

        // invalid url format: cannot determine the origin
        if (urlParts.length < 3) return null;

        // actual comparission of the origin
        return _clientConfig.internalHosts.some(function (host) {
            return typeof host === "string" && host.length > 0 && urlParts[2].indexOf(host) === 0;
        });
    };

    // Characters to replace Markdown special characters
    const _escapeReplacementsForMarkdown = [
      [ /\*/g, '\\*' ],
      [ /#/g, '\\#' ],
      [ /\//g, '\\/' ],
      [ /\(/g, '\\(' ],
      [ /\)/g, '\\)' ],
      [ /\[/g, '\\[' ],
      [ /\]/g, '\\]' ],
      [ /\{/g, '\\{' ],
      [ /\}/g, '\\}' ],
      [ new RegExp("\<","g"), '&lt;' ],
      [ new RegExp("\>","g"), '&gt;' ],
      [ /_/g, '\\_'  ],
      [ /\!/g, '\\!' ],
      [ /\./g, '\\.' ],
      [ /\+/g, '\\+' ],
      [ /\-/g, '\\-' ],
      [ /\`/g, '\\`' ]];

    /**
     * @function
     * @param {String} text The text in which escaping needs to happen.
     * @desc
     * This private utility function escapes markdown special characters
     * It is used with Mustache to escape value of variables that have markdown characters in them
     * @returns {String} String after escaping
     */
    export function _escapeMarkdownCharacters(text) {
      return _escapeReplacementsForMarkdown.reduce(
        function(text, replacement) {
          return text.replace(replacement[0], replacement[1]);
        }, text);
    };

    /**
     * @function
     * @desc
     * A function used by Mustache to encode strings in a template
     * @return {Function} A function that is called by Mustache when it stumbles across
     * {{#encode}} string while parsing the template.
     */
    export function _encodeForMustacheTemplate() {
        return function(text, render) {
            return fixedEncodeURIComponent(render(text));
        };
    };

    /**
     * @function
     * @desc
     * A function used by Mustache to escape Markdown characters in a string
     * @return {Function} A function that is called by Mustache when it stumbles across
     * {{#escape}} string while parsing the template.
     */
    export function _escapeForMustacheTemplate() {
        return function(text, render) {
            return _escapeMarkdownCharacters(render(text));
        };
    };

    /**
     * @function
     * @desc
     * Gets currDate object once the page loads for future access in templates
     * @return {Object} A date object that contains all properties
     */
    const getCurrDate = function() {
        var date = new Date();

        var dateObj = {};

        // Set date properties
        dateObj.day = date.getDay();
        dateObj.date = date.getDate();
        dateObj.month = date.getMonth() + 1;
        dateObj.year = date.getFullYear();
        dateObj.dateString = date.toDateString();

        // Set Time porperties
        dateObj.hours = date.getHours();
        dateObj.minutes = date.getMinutes();
        dateObj.seconds = date.getSeconds();
        dateObj.milliseconds = date.getMilliseconds();
        dateObj.timestamp = date.getTime();
        dateObj.timeString = date.toTimeString();

        dateObj.ISOString = date.toISOString();
        dateObj.GMTString = date.toGMTString();
        dateObj.UTCString = date.toUTCString();

        dateObj.localeDateString = date.toLocaleDateString();
        dateObj.localeTimeString = date.toLocaleTimeString();
        dateObj.localeString = date.toLocaleString();

        return dateObj;
    };
    export const _currDate = getCurrDate();

    /**
     * @function
     * @desc
     * Add utility objects such as date (Computed value) to mustache data obj
     * so that they can be accessed in the template
     */
    export function _addErmrestVarsToTemplate(obj, catalog) {

        // date object
        obj.$moment = _currDate;

        // if there is a window object, we are in the browser
        if (!ENV_IS_NODE && typeof window === 'object' && window.location) {
            var chaiseBasePath = '/chaise/';
            if (isObjectAndNotNull(window.chaiseBuildVariables)) {
                // new version
                if (isStringAndNotEmpty(window.chaiseBuildVariables.CHAISE_BASE_PATH)) {
                    chaiseBasePath = window.chaiseBuildVariables.CHAISE_BASE_PATH;
                }
                // angularj version
                else if (isStringAndNotEmpty(window.chaiseBuildVariables.chaiseBasePath)) {
                    chaiseBasePath = window.chaiseBuildVariables.chaiseBasePath;
                }
            }

            obj.$location = {
                origin: window.location.origin,
                host: window.location.host,
                hostname: window.location.hostname,
                chaise_path: chaiseBasePath
            };
        }

        if (catalog) {

            if (catalog.server) {
                // deriva-client-context
                obj.$dcctx = {
                    cid: catalog.server.cid,
                    pid: catalog.server.pid
                };
            }

            var catalogSnapshot = catalog.id.split('@');
            obj.$catalog = {
                snapshot: catalog.id,
                id: catalogSnapshot[0]
            };

            if (catalogSnapshot.length === 2) obj.$catalog.version = catalogSnapshot[1];
        }

        if (AuthnService.session) {
            var session = AuthnService.session;

            obj.$session = {};
            Object.keys(session).forEach(function (key) {
                obj.$session[key] = session[key];
            });

            // If extensions is present, put all dbgap permissions into a map
            // NOTE: not sure if we want to check for `has_ras_permissions` too or not since if that is true, it means ras_dbgap_permissions is also defined
            //       if it's false, the array won't be defined
            if (session.client.extensions && session.client.extensions.ras_dbgap_permissions && Array.isArray(session.client.extensions.ras_dbgap_permissions)) {
                var map = {};
                session.client.extensions.ras_dbgap_permissions.forEach(function (perm) {
                    if (typeof perm === "object" && perm.phs_id) map[perm.phs_id] = true;
                });

                obj.$session.client.extensions.ras_dbgap_phs_ids = map;
            }
        }

        /**
         * TODO if we want ot add dynamic variables to the template,
         * we could add "site_var_queries" or "site_var_sources" (we have to decide which one to use).
         * We didn't completely fleshed out what this property looks like, but it should be similar to "source object"
         * where you can define a path and project list.
         */
        const cc = ConfigService.clientConfig;
        if (isObjectAndNotNull(cc) && isObjectAndNotNull(cc.templating) && isObjectAndNotNull(cc.templating.site_var)) {
            obj.$site_var = cc.templating.site_var;
        }
    };

    /**
     * @function
     * @desc
     * Replace variables having  dot with underscore so that they can be accessed in the template
     * @param {Object} keyValues The key-value pair of object.
     * @param {Object} options An object of options which might contain additional functions to be injected
     *
     * @return {Object} obj
     */
    export function _addTemplateVars(keyValues, catalog, options) {

        var obj = {};
        if (keyValues && isObject(keyValues)) {
            try {
                // recursively replace dot with underscore in column names.
                obj = _replaceDotWithUnderscore(keyValues);
            } catch (err) {
                // This should not happen since we're guarding against custom type objects.
                obj = keyValues;
                $log.error("Could not process the given keyValues in _renderTemplate. Ignoring the _replaceDotWithUnderscore logic.");
                $log.error(err);
            }
        }

        // Inject ermrest internal utility objects such as date
        _addErmrestVarsToTemplate(obj, catalog);

        // Inject other functions provided in the options.functions array if needed
        if (options.functions && options.functions.length) {
            options.functions.forEach(function(f) {
                obj[f.name] = function() {
                    return f.fn;
                };
            });
        }

        return obj;
    };

    /*
     * @function
     * @private
     * @param {String} template The template string to transform
     * @param {Object} obj The key-value pair of object to be used for template tags replacement.
     * @param {Object} [options] Configuration options.
     * @return {string} A string produced after templating
     * @desc Returns a string produced as a result of templating using `Mustache`.
     */
    export function renderMustacheTemplate(template, keyValues, catalog, options) {

        options = options || {};

        var obj = _addTemplateVars(keyValues, catalog, options), content;

        // Inject the encode function in the obj object
        obj.encode = _encodeForMustacheTemplate;

        // Inject the escape function in the obj object
        obj.escape = _escapeForMustacheTemplate;

        // If we should validate, validate the template and if returns false, return null.
        if (!options.avoidValidation && !_validateMustacheTemplate(template, obj, catalog)) {
            return null;
        }

        try {
            content = mustache.render(template, obj);
        } catch(e) {
            $log.error(e);
            content = null;
        }

        return content;
    };

    /**
     * Returns true if all the used keys have values.
     *
     * NOTE:
     * This implementation is very limited and if conditional Mustache statements
     * of the form {{#var}}{{/var}} or {{^var}}{{/var}} found then it won't check
     * for null values and will return true.
     *
     * @param  {string}   template       mustache template
     * @param  {object}   keyValues      key-value pairs
     * @param  {Array.<string>=} ignoredColumns the columns that should be ignored (optional)
     * @return {boolean} true if all the used keys have values
     */
    export function _validateMustacheTemplate(template, keyValues, catalog, ignoredColumns) {

        // Inject ermrest internal utility objects such as date
        // needs to be done in the case _validateTemplate is called without first calling _renderTemplate
        _addErmrestVarsToTemplate(keyValues, catalog);

        var conditionalRegex = /\{\{(#|\^)([^\{\}]+)\}\}/, i, key, value;

        // If no conditional Mustache statements of the form {{#var}}{{/var}} or {{^var}}{{/var}} not found then do direct null check
        if (!conditionalRegex.exec(template)) {

            // Grab all placeholders ({{PROP_NAME}}) in the template
            var placeholders = template.match(/\{\{([^\{\}]+)\}\}/ig);

            // If there are any placeholders
            if (placeholders && placeholders.length) {

                // Get unique placeholders
                placeholders = placeholders.filter(function(item, i, ar) { return ar.indexOf(item) === i; });

                /*
                 * Iterate over all placeholders to set pattern as null if any of the
                 * values turn out to be null or undefined
                 */
                for (i=0; i<placeholders.length;i++) {

                    // Grab actual key from the placeholder {{name}} = name, remove "{{" and "}}" from the string for key
                    key = placeholders[i].substring(2, placeholders[i].length - 2);

                    if (key[0] == "{") key = key.substring(1, key.length -1);

                    // find the value.
                    value = _getPath(keyValues, key.trim());

                    // TODO since we're not going inside the object this logic of ignoredColumns is not needed anymore,
                    // it was a hack that was added for asset columns.
                    // If key is not in ingored columns value for the key is null or undefined then return null
                    if ((!Array.isArray(ignoredColumns) || ignoredColumns.indexOf(key) == -1) && (value === null || value === undefined)) {
                       return false;
                    }
                }
            }
        }
        return true;
    };

    /**
     * given a string, if it's a valid template_engine use it,
     * otherwise get it from the client config.
     * @param {string} engine
     */
    export function _getTemplateEngine(engine) {
        var isValid = function (val) {
            return isStringAndNotEmpty(val) && Object.values(TEMPLATE_ENGINES).indexOf(val) !== -1;
        };
        if (isValid(engine)) {
            return engine;
        }
        const _clientConfig = ConfigService.clientConfig;
        if (isObjectAndNotNull(_clientConfig) && isObjectAndNotNull(_clientConfig.templating) &&
            isValid(_clientConfig.templating.engine)) {
            return _clientConfig.templating.engine;
        }
        return TEMPLATE_ENGINES.MUSTACHE;
    };

    /**
     * A wrapper for {renderMustacheTemplate}
     * acceptable options:
     * - templateEngine: "mustache" or "handlbars"
     * - avoidValidation: to avoid validation of the template
     * - allowObject: if the returned string is a parsable object, return it as object
     *                instead of string.
     *
     * @param  {string} template - template to be rendered
     * @param  {object} keyValues - formatted key value pairs needed for the template
     * @param  {Catalog} catalog - the catalog that this value is for
     * @param  {any=} options optioanl parameters
     * @return {string} Returns a string produced as a result of templating using options.templateEngine or `Mustache` by default.
     */
    export function _renderTemplate(template, keyValues, catalog, options) {

        if (typeof template !== 'string') return null;

        options = options || {};

        var res, objRes;
        if (_getTemplateEngine(options.templateEngine) === TEMPLATE_ENGINES.HANDLEBARS) {
            // render the template using Handlebars
            res = HandlebarsService.render(template, keyValues, catalog, options);
        } else {
            // render the template using Mustache
            res = renderMustacheTemplate(template, keyValues, catalog, options);
        }

        if (options.allowObject) {
            try {
                // if it can be parsed and is an object, return the object
                objRes = JSON.parse(res);
                if (typeof objRes === "object") {
                    return objRes;
                }
            } catch {
                // ignore
            }
        }

        return res;
    };

    /**
     * A wrapper for {_validateMustacheTemplate}
     * it will take care of adding formmatted and unformatted values.
     * options.ignoredColumns: list of columns that you want validator to ignore
     * options.templateEngine: "mustache" or "handlbars"
     *
     * @param  {Table} table
     * @param  {object} data
     * @param  {string} template
     * @param  {Catalog} catalog
     * @param  {Array.<string>=} ignoredColumns the columns that should be ignored (optional)
     * @return {boolean} True if the template is valid.
     */
    export function _validateTemplate(template, data, catalog, options) {

        var ignoredColumns;
        if (options !== undefined && Array.isArray(options.ignoredColumns)) {
            ignoredColumns = options.ignoredColumns;
        }

        if (_getTemplateEngine(options ? options.templateEngine : '') === TEMPLATE_ENGINES.HANDLEBARS) {
            // call the actual Handlebar validator
            return HandlebarsService.validate(template, data, catalog, ignoredColumns)
        }

        // call the actual mustache validator
        return _validateMustacheTemplate(template, data, catalog, ignoredColumns);
    };

    /**
     * Given a markdown_pattern template and data, will return the appropriate
     * presentation value.
     *
     * @param  {String} template the handlebars/mustache template
     * @param  {Object} data     the key-value pair of data
     * @param  {Table} table    the table object
     * @param  {String} context  context string
     * @param  {Object} options
     * @return {{isHTML: boolean, value: string, unformatted: string}}          An object with `isHTML` and `value` attributes.
     * @memberof ERMrest
     * @function processMarkdownPattern
     */
    export function processMarkdownPattern(template, data, table, context, options) {
        var res = _renderTemplate(template, data, table ? table.schema.catalog : null, options);

        if (res === null || res.trim() === '') {
            res = table ? table._getNullValue(context) : "";
            return {isHTML: false, value: res, unformatted: res};
        }
        var isInline = options && options.isInline ? true : false;
        return {isHTML: true, value: renderMarkdown(res, isInline), unformatted: res};
    };

    /**
     * Return an object containing window.location properties ('host', 'hostname', 'hash', 'href', 'port', 'protocol', 'search').
     *
     * @private
     * @param  {string} url     URL to be parsed
     * @return {object}         The location object
     */
    export function _parseUrl(url) {
        var m = url.match(/^(([^:\/?#]+:)?(?:\/\/(([^\/?#:]*)(?::([^\/?#:]*))?)))?([^?#]*)(\?[^#]*)?(#.*)?$/),
            r = {
                hash: m[8] || "",                    // #asd
                host: m[3] || "",                    // localhost:257
                hostname: m[4] || "",                // localhost
                href: m[0] || "",                    // http://localhost:257/deploy/?asd=asd#asd
                origin: m[1] || "",                  // http://localhost:257
                pathname: m[6] || (m[1] ? "/" : ""), // /deploy/
                port: m[5] || "",                    // 257
                protocol: m[2] || "",                // http:
                search: m[7] || ""                   // ?asd=asd
            };
        if (r.protocol.length == 2) {
            r.protocol = "file:///" + r.protocol.toUpperCase();
            r.origin = r.protocol + "//" + r.host;
        }
        r.href = r.origin + r.pathname + r.search + r.hash;
        return m && r;
    };

    export function _isEntryContext(context) {
        return _entryContexts.indexOf(context) !== -1;
    };

    export function _isCompactContext(context) {
        return _compactContexts.indexOf(context) !== -1;
    };
