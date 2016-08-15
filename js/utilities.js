var ERMrest = (function(module) {

    // polyfill for Array.includes
    // came from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
    if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement /*, fromIndex*/) {
            'use strict';
            if (this === null) {
                throw new TypeError('Array.prototype.includes called on null or undefined');
            }

            var O = Object(this);
            var len = parseInt(O.length, 10) || 0;
            if (len === 0) {
                return false;
            }
            var n = parseInt(arguments[1], 10) || 0;
            var k;
            if (n >= 0) {
                k = n;
            } else {
                k = len + n;
                if (k < 0) {k = 0;}
            }
            var currentElement;
            while (k < len) {
                currentElement = O[k];
                if (searchElement === currentElement ||
                    (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                    return true;
                }
                k++;
            }
            return false;
        };
    }

    /**
     * @function
     * @param {Object} copyTo the object to copy values to.
     * @param {Object} copyFrom the object to copy value from.
     * @desc
     * This private utility function does a shallow copy between objects.
     */
    module._clone = function (copyTo, copyFrom) {
        for (var key in copyFrom) {
            // only copy those properties that were set in the object, this
            // will skip properties from the source object's prototype
            if (copyFrom.hasOwnProperty(key)) {
                copyTo[key] = copyFrom[key];
            }
        }
    };

    /**
     * @function
     * @param {String} str string to be converted.
     * @desc
     * Converts a string to title case (separators are space, hyphen, and underscore)
     */
    module._toTitleCase = function (str) {
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
    module._underlineToSpace = function (str) {
      return str.replace(/_/g, ' ');
    };

    /**
     * @function
     * @param {String} str string to be encoded.
     * @desc
     * converts a string to an URI encoded string
     */
    module._fixedEncodeURIComponent = function (str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    };

    module._nextChar = function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    };

    /**
     * @function
     * @param {Object} element a model element (schema, table, or column)
     * @param {Object} parentElement the upper element (schema->null, table->schema, column->table)
     * @desc This function determines the display name for the schema, table, or
     * column elements of a model.
     */
    module._determineDisplayName = function (element, parentElement) {
        var displayname = element.name;
        var hasDisplayName = false;
        try {
            var display_annotation = element.annotations.get(module._annotations.DISPLAY);
            if (display_annotation && display_annotation.content) {

                //get the specified display name
                if(display_annotation.content.name){
                    displayname = display_annotation.content.name;
                    hasDisplayName = true;
                }

                //get the name styles
                if(display_annotation.content.name_style){
                    element._nameStyle = display_annotation.content.name_style;
                }
            }
        } catch (exception) {
            // no display annotation, don't do anything
        }

        // if name styles are undefined, get them from the parent element
        // Note: underline_space and title_case might be null.
        if(parentElement){
            if(!("underline_space" in element._nameStyle)){
               element._nameStyle.underline_space = parentElement._nameStyle.underline_space;
            }
            if(!("title_case" in element._nameStyle)){
                element._nameStyle.title_case = parentElement._nameStyle.title_case;
            }
        }

        // if name was not specified and name styles are defined, apply the heuristic functions (name styles)
        if(!hasDisplayName && element._nameStyle){
            if(element._nameStyle.underline_space){
                displayname = module._underlineToSpace(displayname);
            }
            if(element._nameStyle.title_case){
                displayname = module._toTitleCase(displayname);
            }
        }

        return displayname;
    };

    /**
     * @function
     * @param {string} context the context that we want the value of.
     * @param {ERMrest.Annotation} annotation the annotation object.
     * @desc This function returns the list that should be used for the given context.
     * Used for visible columns and visible foreign keys.
     */
    module._getAnnotationArrayValue = function (context, annotation) {
        var contextedAnnot = module._getAnnotationValueByContext(context, annotation);
        if (contextedAnnot !== -1) { // found the context
            if (Array.isArray(contextedAnnot)) {
                return contextedAnnot;
            } else {
                return module._getAnnotationArrayValue(contextedAnnot, annotation); // go to next level
            }
        }

        return -1; // there was no annotation
    };

    /**
    * @param {string} context the context that we want the value of.
    * @param {ERMrest.Annotation} annotation the annotation object.
    * @desc returns the annotation value based on the given context.
    */
    module._getAnnotationValueByContext = function (context, annotation) {
        // exact context
        if (context in annotation) {
            return annotation[context];
        }

        // partial context
        for (var key in annotation) {
            if (annotation.hasOwnProperty(key) && context.indexOf(key) != -1) {
                return annotation[key];
            }
        }

        //if context wasn't in the annotations but there is a default context
        if (module._contexts.DEFAULT in annotation) {
            return annotation[module._contexts.DEFAULT];
        }

        return -1; // there was no annotation
    }

    /**
     * @function
     * @param {Object} response http response object
     * @return {Object} error object
     * @desc create an error object from http response
     */
    module._responseToError = function (response) {
        var status = response.status || response.statusCode;
        switch(status) {
            case 0:
                return new module.TimedOutError(response.statusText, response.data);
            case 400:
                return new module.BadRequestError(response.statusText, response.data);
            case 401:
                return new module.UnauthorizedError(response.statusText, response.data);
            case 403:
                return new module.ForbiddenError(response.statusText, response.data);
            case 404:
                return new module.NotFoundError(response.statusText, response.data);
            case 409:
                return new module.ConflictError(response.statusText, response.data);
            case 500:
                return new module.InternalServerError(response.statusText, response.data);
            case 503:
                return new module.ServiceUnavailableError(response.statusText, response.data);
            default:
                return new Error(response.statusText, response.data);
        }
    };

    /**
     * @desc An object of pretty print utility functions
     * @private
     */

    module._formatUtils = {
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
         * @param {Object} [options] Configuration options
         * @return {string} A string representation of value. Default is ISO string.
         * @desc Formats a given timestamp value into a string for display.
         */
        printTimestamp: function printTimestamp(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }
            // var year, month, date, hour, minute, second, ms;
            try {
                value = value.toString();
                value = new Date(value);
                // Later when we support more formats, we'll probably need to manually
                // construct the date time with the following pieces:

                // year = value.getFullYear();
                // month = value.getMonth() + 1;
                // date = value.getDate();
                // hour = value.getHours();
                // minute = value.getMinutes();
                // second = value.getSeconds();
                // ms = value.getMilliseconds();
            } catch (exception) {
                // Is this the right error?
                throw new module.InvalidInputError("Couldn't extract timestamp from input" + exception);
            }

            if (typeof value.getTime() !== 'number') {
                // Invalid timestamp
                throw new module.InvalidInputError("Couldn't transform input to a valid timestamp");
            }

            return value.toLocaleString();
        },

        /**
         * @function
         * @param {Object} value A date value to transform
         * @param {Object} [options] Configuration options. Two accepted so far: {separator: '-', leadingZero: false}
         * @return {string} A string representation of value
         * @desc Formats a given date[time] value into a date string for display.
         * If any time information is provided, it will be left off.
         */
        printDate: function printDate(value, options) {
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }
            var year, month, date;
            try {
                value = value.toString();
                value = new Date(value);
                year = value.getFullYear();
                month = value.getMonth() + 1; // 1-12, not 0-11
                date = value.getDate();
            } catch (exception) {
                // Is this the right error?
                throw new module.InvalidInputError("Couldn't extract date info from input" + exception);
            }

            if (typeof value.getTime() !== 'number' || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(date)) {
                // Invalid date
                throw new module.InvalidInputError("Couldn't transform input to a valid date");
            }

            var separator = options.separator ? options.separator : '/';

            if (options.leadingZero === true) {
                // Attach a leading 0 to month and date
                month = (month > 0 && month < 10) ? '0' + month : month;
                date = (date > 0 && date < 10) ? '0' + date : date;
            }
            return year + separator + month + separator + date;
        },

        /**
         * @function
         * @param {Object} value A float value to transform
         * @param {Object} [options] Configuration options. One accepted so far: {numDecDigits: 5}
         * @return {string} A string representation of value
         * @desc Formats a given float value into a string for display. Removes leading 0s; adds thousands separator.
         */
        printFloat: function printFloat(value, options) {
            options = (typeof options === 'undefined') ? {} : options;

            if (value === null) {
                return '';
            }

            value = parseFloat(value);
            if (options.numDecDigits) {
                value = value.toFixed(options.numDecDigits); // toFixed() rounds the value, is ok?
            } else {
                value = value.toFixed(2);
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
            return module._markdownIt.renderInline(value);
        }
    };

    module._parsedFilterToERMrestFilter = function(filter, table) {
        if (filter.type === "BinaryPredicate") {
            return new ERMrest.BinaryPredicate(
                table.columns.get(filter.column),
                filter.operator,
                filter.value
            );
        } else {
            // convert nested filter structure to Conjunction or Disjunction filter
            var filters = [];

            if (filter.filters) {
                for (var i = 0; i < filter.filters.length; i++) {
                    var f = filter.filters[i];
                    var f1 = parsedFilterToERMrestFilter(f, table);
                    filters.push(f1);
                }
            }

            if (filter.type === "Conjunction") {
                return new ERMrest.Conjunction(filters);
            } else {
                return new ERMrest.Disjunction(filters);
            }
        }
    };

    module._isValidSortElement = function(element, index, array) {
        return (typeof element == 'object' &&
            typeof element.column == 'string' &&
            typeof element.descending == 'boolean');
    };

    /**
     * @desc List of annotations that ermrestjs supports.
     * @private
     */
    module._annotations = Object.freeze({
        DISPLAY: "tag:misd.isi.edu,2015:display",
        HIDDEN: "tag:misd.isi.edu,2015:hidden", //TODO deprecated and should be deleted.
        IGNORE: "tag:isrd.isi.edu,2016:ignore", //TODO should not be used in column and foreign key
        VISIBLE_COLUMNS: "tag:isrd.isi.edu,2016:visible-columns",
        FOREIGN_KEY: "tag:isrd.isi.edu,2016:foreign-key",
        VISIBLE_FOREIGN_KEYS: "tag:isrd.isi.edu,2016:visible-foreign-keys",
        TABLE_DISPLAY: "tag:isrd.isi.edu,2016:table-display"
    });

    /**
     * @desc List of contexts that ermrestjs supports.
     * @private
     */
    module._contexts = Object.freeze({
        COMPACT: 'compact',
        CREATE: 'entry/create',
        DETAILED: 'detailed',
        EDIT: 'entry/edit',
        ENTRY: 'entry',
        FILTER: 'filter',
        RECORD: 'record',
        DEFAULT: '*'
    });

    return module;

}(ERMrest || {}));
