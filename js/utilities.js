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
        // NOTE: underline_space and title_case might be null.
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
    module._getRecursiveAnnotationValue = function (context, annotation) {
        var contextedAnnot = module._getAnnotationValueByContext(context, annotation);
        if (contextedAnnot !== -1) { // found the context
            if (typeof contextedAnnot == "object") {
                return contextedAnnot;
            } else {
                return module._getRecursiveAnnotationValue(contextedAnnot, annotation); // go to next level
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
        if (module._contexts.DEFAULT in annotation) {
            return annotation[module._contexts.DEFAULT];
        }

        return -1; // there was no annotation
    };

    /**
    * @param {object} ref The object that we want the null value for.
    * @param {string} context The context that we want the value of.
    * @param {Array} elements All the possible levels of heirarchy (column, table, schema).
    * @desc returns the null value for the column based on context and annotation and sets in the ref object too.
    */
    module._getNullValue = function (ref, context, elements) {
        if (context in ref._nullValue) { // use the cached value
            return ref._nullValue[context];
        }

        var value = -1,
            displayAnnot = module._annotations.DISPLAY;

        // first look at the column, then table, and at last schema for annotation.
        for (var i=0; i < elements.length; i++) {
            if (elements[i].annotations.contains(displayAnnot)) {
                var annotation = elements[i].annotations.get(displayAnnot);
                if(annotation.content.show_nulls){
                    value = module._getAnnotationValueByContext(context, annotation.content.show_nulls);
                    if (value !== -1) break; //found the value
                }
            }
        }

        if (value === false) { //eliminate the field
            value = null;
        } else if (value === true) { //empty field
            value = "";
        } else if (typeof value !== "string") { // default
            if (context === module._contexts.DETAILED) {
                value = null; // default null value for DETAILED context
            } else {
                value = ""; //default null value
            }
        }

        ref._nullValue[context] = value; // cache the value
        return value;
    };

    /*
     * @function
     * @private
     * @param {object} ref The object that we want the formatted values for.
     * @param {object} data The object which contains key value pairs of data to be transformed
     * @return {object} A formatted keyvalue pair of object
     * @desc Returns a formatted keyvalue pairs of object as a result of using `col.formatValue`.
     */
    module._getFormattedKeyValues = function(ref, data) {
        var keyValues = {};

        for (var i = 0; i < ref.columns.length; i++) {
            var col = ref.columns[i];
            keyValues[col.name] = col.formatvalue(data[col.name], { context: ref._context });

            // Inject raw data in the keyvalues object prefixed with an '_'
            keyValues["_" + col.name] = data[col.name];
        }

        return keyValues;
    };

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

            if (options.inline) return module._markdownIt.renderInline(value);

            return module._markdownIt.render(value);
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

            // Run it through printMarkdown to get the sequence in a fixed-width font
            return module._markdownIt.renderInline(formattedSeq);
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

    /*
     * @function
     * @private
     * @param {Object} md The markdown-it object
     * @param {Object} md The markdown-it-container object.
     * @desc Sets functionality for custom markdown tags like `iframe` and `dropdown` using `markdown-it-container` plugin.
     */
    module._bindCustomMarkdownTags = function(md, mdContainer) {

        // Set typography to enable breaks on "\n"
        md.set({ typographer: true });

        // Dependent on 'markdown-it-container' and 'markdown-it-attrs' plugins
        // Injects `iframe` tag
        md.use(mdContainer, 'iframe', {
            /*
             * Checks whether string matches format "::: iframe [CAPTION](LINK){ATTR=VALUE .CLASSNAME}"
             * String inside '{}' is Optional, specifies attributes to be applied to prev element
             */
            validate: function(params) {
                return params.trim().match(/iframe\s+(.*)$/i);
            },

            render: function (tokens, idx) {
                // Get token string after regexp matching to determine actual internal markdown
                var m = tokens[idx].info.trim().match(/iframe\s+(.*)$/i);

                // If this is the opening tag i.e. starts with "::: iframe "
                if (tokens[idx].nesting === 1 && m.length > 0) {

                    // Extract remaining string before closing tag and get its parsed markdown attributes
                    var attrs = md.parseInline(m[1]), html = "";

                    if (attrs && attrs.length == 1 && attrs[0].children) {

                        // Check If the markdown is a link
                        if (attrs[0].children[0].type == "link_open") {
                            var iframeHTML = "<iframe ", openingLink = attrs[0].children[0];

                            // Add all attributes to the iframe
                            openingLink.attrs.forEach(function(attr) {
                                if (attr[0] == "href") {
                                    iframeHTML += 'src="' + attr[1] + '"';
                                } else {
                                    iframeHTML +=  attr[0] + '="' + attr[1] + '"';
                                }
                               iframeHTML += " ";
                            });
                            html += iframeHTML + "></iframe>";

                            // If there is a caption then add it as a "div" with "caption" class
                            if (attrs[0].children[1].type == "text") {
                               html = '<div class="embed-caption">' + md.renderInline(attrs[0].children[1].content)  + "</div>" + html;
                            }

                            // Encapsulate the iframe inside a div
                            html = '<div class="embed-block">' + html + "</div>";
                        }
                    }
                    // if attrs was empty or it didn't find any link simply render the internal markdown
                    if (html === "") {
                        html = md.render(m[1]);
                    }

                    return html;
                } else {
                  // closing tag
                  return '';
                }
            }
        });

        // Dependent on 'markdown-it-container' and 'markdown-it-attrs' plugins
        // Injects `dropdwown` tag
        md.use(mdContainer, 'dropdown', {
            /*
             * Checks whether string matches format "::: dropdown DROPDOWN_TITLE{.btn-success} [CAPTION](LINK){ATTR=VALUE .CLASSNAME}"
             * String inside '{}' is Optional, specifies attributes to be applied to prev element
             */ 
            validate: function(params) {
                return params.trim().match(/dropdown\s+(.*)$/i);
            },

            render: function (tokens, idx) {

                var html = "";
                // Get token string after regeexp matching to determine caption and other links
                var m = tokens[idx].info.trim().match(/dropdown\s+(.*)$/i);

                if (tokens[idx].nesting === 1 && m && m.length > 0) {

                    // If content found after dropdown string 
                    if (m && m.length > 0) {

                        var linkTokens = md.parseInline(m[1]);

                        // If the linkTokens contains an inline tag
                        // with children, and type is text for the first child
                        if (linkTokens.length === 1 && linkTokens[0].type === 'inline' &&
                            linkTokens[0].children.length && linkTokens[0].children[0].type === 'text') {

                            var caption = linkTokens[0].children[0].content;
                            var cTokens = md.parse(caption);

                            // If caption is set for the dropdown button between
                            if (cTokens.length === 3 && cTokens[0].type === 'paragraph_open' && cTokens[1].type === 'inline' && cTokens[2].type === 'paragraph_close') {

                                // Build button html and button dropdown html
                                var classes = [];
                                var buttonHtml = '<button type="button" ';
                                var buttonDDHtml = '<button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" ';

                                // If the caption has any attrs add them to the button
                                if (cTokens[0].attrs) {
                                    cTokens[0].attrs.forEach(function(a) {
                                        if(a[0] === 'class') {
                                            classes.push(a[1]);
                                        } else {
                                            buttonHtml += attr[0] + '="' + attr[1] + '" ';
                                        }
                                    });
                                }

                                buttonHtml += ' class="btn btn-primary ' + classes.join(' ') + '">' +  cTokens[1].content + '</button>';
                                buttonDDHtml += ' class="btn btn-primary dropdown-toggle ' + classes.join(' ') + '"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button>';

                                // Build unordered list
                                var lists = [], isValid = true;
                                for (var i=1 ;i < linkTokens[0].children.length;i=i+3) {
                                    if (linkTokens[0].children[i].type === 'link_open' &&
                                        linkTokens[0].children[i+1].type === 'text' &&
                                        linkTokens[0].children[i+2].type === 'link_close') {

                                        var link = linkTokens[0].children[i], listHTML = '<li><a ';
                                        for (var j=0; j< link.attrs.length; j++) {
                                            listHTML +=  link.attrs[j][0] + '="' + link.attrs[j][1] + '" ';
                                        }

                                        listHTML += ">" + linkTokens[0].children[i+1].content + "</a></li>";       
                                        lists.push(listHTML);
                                        // If the next element in the list is of type text skip it
                                        if (linkTokens[0].children[i+3] &&      linkTokens[0].children[i+3].type === 'text') {
                                          i++;
                                        }
                                    } else {
                                        isValid = false;
                                        break;
                                    }
                                }

                                if (isValid) {
                                    var ullistHTML = '<ul class="dropdown-menu">' + lists.join('<br>') + '</ul>';
                                    html = '<div class="btn-group markdown-dropdown">' + buttonHtml + buttonDDHtml + ullistHTML + "</div>";
                                }
                            }
                        }
                    }
                }
                return html;
            }
        });
    };

    /*
     * @function
     * @private
     * @param {String} template The template string to transform
     * @param {Object} keyValues The key-value pair of object to be used for template tags replacement.
     * @param {Object} [options] Configuration options.
     * @return {string} A string produced after templating
     * @desc Returns a string produced as a result of templating using `Mustache`.
     */
    module._renderTemplate = function(template, keyValues, options) {
        options = options || {};

        var obj = {};
        module._clone(obj, keyValues);

        // Inject the encode function in the keyValues object
        obj.encode = function() {
            return function(text, render) {
                return encodeURIComponent(render(text));
            };
        };

        // Inject other functions provided in the options.functions array if needed
        if (options.functions && options.functions.length) {
            options.functions.forEach(function(f) {
                obj[f.name] = function() {
                    return f.fn;
                };
            });
        }

        return module._mustache.render(template, obj);
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
        TABLE_DISPLAY: "tag:isrd.isi.edu,2016:table-display",
        COLUMN_DISPLAY: "tag:isrd.isi.edu,2016:column-display"
    });

    /**
     * @desc List of contexts that ermrestjs supports.
     * @private
     */
    module._contexts = Object.freeze({
        COMPACT: 'compact',
        COMPACT_BRIEF: 'compact/brief',
        CREATE: 'entry/create',
        DETAILED: 'detailed',
        EDIT: 'entry/edit',
        ENTRY: 'entry',
        FILTER: 'filter',
        DEFAULT: '*',
        ROWNAME :'row_name'
    });

    /*
     * @desc List of display type for table-display annotation
     * @private
     */
    module._displayTypes = Object.freeze({
        TABLE: 'table',
        MARKDOWN: 'markdown',
        MODULE: 'module'
    });

    return module;

}(ERMrest || {}));
