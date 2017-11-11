
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

    // polyfill for Array.findIndex
    if (!Array.prototype.findIndex) {
        Object.defineProperty(Array.prototype, 'findIndex', {
            value: function(predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this === null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                    // d. If testResult is true, return k.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return k;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return -1.
                return -1;
            }
        });
    }

    //Polyfill for Array.find
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {

            // 1. Let O be ? ToObject(this value).
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }

            var O = Object(this);

            // 2. Find index of value
            var index = O.findIndex(predicate);

            // 3. If index is not -1 then value  at that index
            if (index !== -1) {
                return O[index];
            }

            // 7. Return undefined.
            return undefined;
        };
    }

    // Polyfill for string.endswith
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }

    // Polyfill for string.startswith
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position){
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

    // Utility function to replace all occurances of a search with its replacement in a string
    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
    };

    // utility function to clear out an array
    // 3 options to do this:
    //  1. this.length = 0
    //  2. this.splice(0, this.length)
    //  3. while (this.length) this.pop()
    // options 1 and 2 are fastest. Option 1 sets
    // the internal data to be removed by the garbage collector
    Array.prototype.clear = function() {
        this.length = 0;
    };


    module.encodeFacet = function (obj) {
        return module._LZString.compressToEncodedURIComponent(JSON.stringify(obj,null,0));
    };

    module.decodeFacet = function (blob) {
        var err = new module.InvalidFacetOperatorError();

        try {
            var str = module._LZString.decompressFromEncodedURIComponent(blob);
            if (str === null) {
                throw err;
            }
            return JSON.parse(str);
        } catch (exception) {
            console.log(exception);
            throw err;
        }
    };

    /**
     * Returns true if given parameter is object and not null
     * @param  {*} obj
     * @return {boolean}
     */
    var isObjectAndNotNull = function (obj) {
        return typeof obj === "object" && obj !== null;
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
    module._extends = function (child, parent) {
        var childFns = child.prototype;
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.superClass = parent;
        child.super = parent.prototype;
    };

    /**
     * @function
     * @param {Object} copyTo the object to copy values to.
     * @param {Object} copyFrom the object to copy value from.
     * @desc
     * This private utility function does a shallow copy between objects.
     */
    module._shallowCopy = function (copyTo, copyFrom) {
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
     * @private
     * @param {Object} obj the object
     * @param {String} key the key that we want from the object
     * @desc
     * matches the keys by removing `.`, `-`, `_`, and space.
     */
    module._getClosest = function(obj, key) {
        if (key in obj) { // return the exact
            return {"data": obj[key], "key": key};
        }

        var removeExtra = function (str) { // remove `.`, `-`, `_`, and space
            return str.replace(/[\.\s\_-]+/g, "").toLocaleLowerCase();
        };

        var newKey = removeExtra(key);
        for (var objKey in obj) { // find the closest
            if (obj.hasOwnProperty(objKey) && removeExtra(objKey) == newKey) {
                return {"data": obj[objKey], "key": objKey};
            }
        }
        return undefined;
    };


    /**
     * @function
     * @param {String} str string to be encoded.
     * @desc
     * converts a string to an URI encoded string
     */
    module._fixedEncodeURIComponent = function (str) {
        var result = encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
        return result;
    };

    /**
     * @function
     * @param {String} regExp string to be regular expression encoded
     * @desc converts the string into a regular expression with properly encoded characters
     */
    module._encodeRegexp = function (str) {
        var stringReplaceExp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$]/g;
        // the first '\' escapes the second '\' which is used to escape the matched character in the returned string
        // $& represents the matched character
        var escapedRegexString = str.replace(stringReplaceExp, '\\$&');

        return escapedRegexString;
    };

    module._nextChar = function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    };

    /**
     * @function
     * @param {Object} element a model element (schema, table, or column)
     * @param {boolean} useName determines whether we can use name and name_style or not
     * @param {Object} parentElement the upper element (schema->null, table->schema, column->table)
     * @desc This function determines the display name for the schema, table, or
     * column elements of a model.
     */
    module._determineDisplayName = function (element, useName, parentElement) {
        var value = useName ? element.name : undefined,
            unformatted = useName ? element.name : undefined,
            hasDisplayName = false,
            isHTML = false;
        try {
            var display_annotation = element.annotations.get(module._annotations.DISPLAY);
            if (display_annotation && display_annotation.content) {

                //get the markdown display name
                if(display_annotation.content.markdown_name) {
                    value = module._formatUtils.printMarkdown(display_annotation.content.markdown_name, { inline: true });
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
        // NOTE: underline_space, title_case, markdown might be null.
        if(parentElement){
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
                value = module._formatUtils.printMarkdown(element.name, { inline: true });
                isHTML = true;
            } else {
                if(element._nameStyle.underline_space){
                    value = module._underlineToSpace(value);
                    unformatted = module._underlineToSpace(unformatted);
                }
                if(element._nameStyle.title_case){
                    value = module._toTitleCase(value);
                    unformatted = module._toTitleCase(unformatted);
                }
            }
        }

        return {"isHTML": isHTML, "value": value, "unformatted": unformatted};
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
            if (typeof contextedAnnot == "object" || (module._contextArray.indexOf(contextedAnnot) === -1) ) {
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
                if(annotation && annotation.content && annotation.content.show_nulls){
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

    /**
     * @param {string} name the base name. It usually is the constraintName of that object.
     * @param {ERMrest.Table} table Used to make sure that name is not available already in the table.
     * @desc return the name that should be used for pseudoColumn. This function makes sure that the returned name is unique.
     */
    module._generatePseudoColumnName = function (name, table) {
        /**
         * make sure that this name is unique:
         * 1. table doesn't have any columns with that name.
         * 2. there's no constraint with that name.
         **/
        var i = 0;
        while(table.columns.has(name) || (i!==0 && table.schema.catalog.constraintByNamePair([table.schema.name, name])!== null) ) {
            name += ++i;
        }
        return name;
    };

    /*
     * @function
     * @private
     * @param {ERMrest.Columns} columns The object that we want the formatted values for.
     * @param {String} context the context that we want the formatted values for.
     * @param {object} data The object which contains key value pairs of data to be transformed
     * @return {object} A formatted keyvalue pair of object
     * @desc Returns a formatted keyvalue pairs of object as a result of using `col.formatValue`.
     */
    module._getFormattedKeyValues = function(columns, context, data) {
        var keyValues = {};

        var findCol = function (colName) {
            if (Array.isArray(columns)) {
                return columns.filter(function (col) {return col.name === colName;})[0];
            }
            return columns.get(k);
        };

        for (var k in data) {

            try {
                var col = findCol(k);
                keyValues[k] = col.formatvalue(data[k], { context: context });
            } catch(e) {
                keyValues[k] = data[k];
            }

            // Inject raw data in the keyvalues object prefixed with an '_'
            keyValues["_" + k] = data[k];
        }

        return keyValues;
    };

    /*
     * @function
     * @private
     * @param {ERMrest.Table} table The table that we want the row name for.
     * @param {String} context Current context.
     * @param {object} data The object which contains key value pairs of data.
     * @returns {object} The displayname object for the row. It includes has value, isHTML, and unformatted.
     * @desc Returns the row name (html) using annotation or heuristics.
     */
    module._generateRowName = function (table, context, data) {
        var annotation, col, template, keyValues, unformatted, unformattedAnnotation, pattern;

        // If table has table-display annotation then set it in annotation variable
        if (table.annotations && table.annotations.contains(module._annotations.TABLE_DISPLAY)) {
            annotation = module._getRecursiveAnnotationValue(module._contexts.ROWNAME, table.annotations.get(module._annotations.TABLE_DISPLAY).content);

            // getting the defined unformatted value
            unformattedAnnotation = module._getRecursiveAnnotationValue(module._contexts.ROWNAME_UNFORMATTED, table.annotations.get(module._annotations.TABLE_DISPLAY).content);
            if (unformattedAnnotation && typeof unformattedAnnotation.row_markdown_pattern) {
                // Get formatted keyValues for a table for the data
                keyValues = module._getFormattedKeyValues(table.columns, context, data);

                // get templated patten after replacing the values using Mustache
                unformatted = module._renderTemplate(unformattedAnnotation.row_markdown_pattern, keyValues, table, context, {formatted: true});
            }
        }

        // if annotation is populated and annotation has display.rowName property
        if (annotation && typeof annotation.row_markdown_pattern === 'string') {
            template = annotation.row_markdown_pattern;

            // Get formatted keyValues for a table for the data
            if (typeof keyValues === 'undefined') {
                keyValues = module._getFormattedKeyValues(table.columns, context, data);
            }

            pattern = module._renderTemplate(template, keyValues, table, context, {formatted: true});

        }


        // annotation was not defined, or it's producing empty string.
        if (pattern == null || pattern.trim() === '') {

            // no row_name annotation, use column with title, name, term
            var result, closest;
            var setDisplaynameForACol = function (name) {
                closest = module._getClosest(data, name);
                if (closest !== undefined && (typeof closest.data === 'string')) {
                    col = table.columns.get(closest.key);
                    result = col.formatvalue(closest.data, {context: context});
                    return true;
                }
                return false;
            };

            var columns = ['title', 'name', 'term', 'label', 'accession_id', 'accession_number'];

            for (var i = 0; i < columns.length; i++) {
                if (setDisplaynameForACol(columns[i])) {
                    break;
                }
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

                    result = idCol[0].formatvalue(data[idCol[0].name], {context: context});

                } else {

                    // Get the columns for shortestKey
                    var keyColumns = table.shortestKey;

                    // TODO this check needs to change. it is supposed to check if the table has a key or not
                    // if (keyColumns.length >= table.columns.length) {
                    //     return null;
                    // }

                    var values = [];

                    // Iterate over the keycolumns to get their formatted values for `row_name` context
                    keyColumns.forEach(function (c) {
                        var value = c.formatvalue(data[c.name], {context: context});
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
            pattern = module._renderTemplate(template, keyValues, table, context, {formatted: true});
        }

        // Render markdown content for the pattern
        if (pattern == null || pattern.trim() === '') {
            return {"value": "", "unformatted": ""};
        }

        return {
            "value": module._formatUtils.printMarkdown(pattern, { inline: true }),
            "unformatted": (typeof unformatted === 'undefined' || unformatted === null ) ? pattern : unformatted,
            "isHTML": true
        };

    };

    /**
     * @function
     * @param  {string} errorStatusText    http error status text
     * @param  {string} generatedErrMessage response data returned by http request
     * @return {object}                    error object
     */
    module._conflictErrorMapping = function(errorStatusText, generatedErrMessage) {
      var mappedErrMessage;

      if(generatedErrMessage.indexOf("violates foreign key constraint") > -1){
          referenceTable = generatedErrMessage.match(/(?:^|\W)dataset(\w+)(?!\w)/g);
          mappedErrMessage = "This entry cannot be deleted as it is still referenced from "+ referenceTable[1].slice(1) +" table. \n All dependent entries must be removed before this item can be deleted.";
          return new module.IntegrityConflictError(errorStatusText, mappedErrMessage, generatedErrMessage);
      }
      else if(generatedErrMessage.indexOf("violates unique constraint") > -1){
          var regExp = /\(([^)]+)\)/;
          detail = generatedErrMessage.search(/DETAIL:/g);
          matches = regExp.exec(generatedErrMessage);
          mappedErrMessage = "The entry cannot be created." + generatedErrMessage.substring(detail + 7, generatedErrMessage.length - 3) +" in the database. Please use a different ID to create new record.";
          // run loop on matche to create message
          // if(matches.length > 1){
          //   for(int i=0; i<matches.length;i++){
          //       primaryColumns =
          //   }
          // }
          return new module.DuplicateConflictError(errorStatusText, mappedErrMessage, generatedErrMessage);
      }
      else if (generatedErrMessage.indexOf("not consistent with your login profile") > -1){
          errStart = generatedErrMessage.search(/ERROR:/g);
          errEnd = generatedErrMessage.search(/CONTEXT:/g);
          mappedErrMessage = "The entry cannot be created." + generatedErrMessage.substring(errStart + 6, errEnd - 1);
          return new module.CustomConstraintConflictError(errorStatusText, mappedErrMessage, generatedErrMessage);
      }
      else{
          mappedErrMessage = "An unexpected error has occurred. Please report this problem to your system administrators.";
          return new module.ConflictError(errorStatusText, mappedErrMessage, generatedErrMessage);
      }
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
            case -1:
                return new module.NoConnectionError("No Internet Connection available");
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
            case 408:
                return new module.TimedOutError(response.statusText, response.data);
            case 409:
                return module._conflictErrorMapping(response.statusText, response.data);
            case 412:
                return new module.PreconditionFailedError(response.statusText, response.data);
            case 500:
                return new module.InternalServerError(response.statusText, response.data);
            case 503:
                return new module.ServiceUnavailableError(response.statusText, response.data);
            default:
                return new Error(response.statusText, response.data);
        }
    };

    module._stringToDate = function(_date, _format, _delimiter) {
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
         * @param {Object} [options] Configuration options. No options implemented so far.
         * @return {string} A string representation of value. Default is ISO 8601-ish like 2017-01-08 15:06:02.
         * @desc Formats a given timestamp value into a string for display.
         */
        printTimestamp: function printTimestamp(value, options) {
            var moment = module._moment;
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }

            try {
                value = value.toString();
            } catch (exception) {
                // Is this the right error?
                throw new module.InvalidInputError("Couldn't extract timestamp from input" + exception);
            }

            if (!moment(value).isValid()) {
                // Invalid timestamp
                throw new module.InvalidInputError("Couldn't transform input to a valid timestamp");
            }

            return moment(value).format('YYYY-MM-DD HH:mm:ss');
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
            var moment = module._moment;
            options = (typeof options === 'undefined') ? {} : options;
            if (value === null) {
                return '';
            }
            // var year, month, date;
            try {
                value = value.toString();
            } catch (exception) {
                // Is this the right error?
                throw new module.InvalidInputError("Couldn't extract date info from input" + exception);
            }

            if (!moment(value).isValid()) {
                // Invalid date
                throw new module.InvalidInputError("Couldn't transform input to a valid date");
            }

            return moment(value).format('YYYY-MM-DD');
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
                value = value.toFixed(4);
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

            if (options.inline) return module._markdownIt.renderInline(value);

            return module._markdownIt.render(value);
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

    /**
     * format the raw value based on the column definition type, heuristics, annotations, etc.
     * @param {ERMrest.Type} type - the type object of the column
     * @param {Object} data - the 'raw' data value.
     * @param {Object} options - the key value pair of possible options with all formatted values in '.formattedValues' key
     * @returns {string} The formatted value.
     */
    _formatValueByType = function(type, data, options) {
        var utils = module._formatUtils;
        switch(type.name) {
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
                data = utils.printJSON(data);
                break;
            default: // includes 'text' and 'longtext' cases
                data = type.baseType ? _formatValueByType(type.baseType, data, options) : utils.printText(data, options);
                break;
        }
        return data;
    };

    /**
     * @function
     * @param {Object} value The Markdown to transform
     * @param {Object} [options] Configuration options.
     * @return {string} A string representation of value
     * @desc public function to access markdown it renderer
     */
    module.renderMarkdown = function(value, options) {
      return module._formatUtils.printMarkdown(value, options);
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
                            var enlargeLink, posTop = true, captionClass = "", captionStyle = "", iframeClass = "", iframeStyle = "";

                            // Add all attributes to the iframe
                            openingLink.attrs.forEach(function(attr) {
                                if (attr[0] == "href") {
                                    iframeHTML += 'src="' + attr[1] + '"';
                                } else if (attr[0] == "link") {
                                    enlargeLink = attr[1];
                                } else if (attr[0] == "pos") {
                                    posTop = attr[1].toLowerCase() == 'bottom' ? false : true;
                                } else if (attr[0] == "caption-class") {
                                    captionClass = attr[1];
                                } else if (attr[0] == "caption-style") {
                                    captionStyle = attr[1];
                                } else if (attr[0] == "iframe-class") {
                                    iframeClass = attr[1];
                                } else if (attr[0] == "iframe-style") {
                                    iframeStyle = attr[1];
                                } else {
                                    iframeHTML +=  attr[0] + '="' + attr[1] + '"';
                                }
                                iframeHTML += " ";
                            });
                            html += iframeHTML + "></iframe>";

                            var captionHTML = "";

                            // If the next attribute is not a closing link then iterate
                            // over all the children until link_close is encountered rednering their markdown
                            if (attrs[0].children[1].type != 'link_close') {
                                for(var i=1; i<attrs[0].children.length; i++) {
                                    // If there is a caption then add it as a "div" with "caption" class
                                    if (attrs[0].children[i].type == "text") {
                                       captionHTML += md.renderInline(attrs[0].children[i].content);
                                    } else if (attrs[0].children[i].type !== 'link_close'){
                                       captionHTML += md.renderer.renderToken(attrs[0].children,i,{});
                                    } else {
                                        break;
                                    }
                                }
                            }

                            // If enlarge link is set then add an anchor tag for captionHTML
                            if (enlargeLink) {
                                 if (!captionHTML.trim().length) captionHTML = "Enlarge";
                                captionHTML = '<a href="' + enlargeLink + '" target="_blank">'  + captionHTML + '</a>';
                            }

                            // Encapsulate the captionHTML inside a figcaption tag with class embed-caption
                            if (posTop) {
                                html = '<figcaption class="embed-caption' + (captionClass.length ? (" " + captionClass) : "") +'" style="' + (captionStyle.length ? (" " + captionStyle) : "") + '">' + captionHTML + "</figcaption>" + html;
                            } else {
                                html += '<figcaption class="embed-caption' + (captionClass.length ? (" " + captionClass) : "") + '" style="' + (captionStyle.length ? (" " + captionStyle) : "") + '">' + captionHTML + "</figcaption>";
                            }

                            // Encapsulate the iframe inside a figure tag
                            html = '<figure class="embed-block' + (iframeClass.length ? (" "  + iframeClass): "") + '" style="' + (iframeStyle.length ? (" "  + iframeStyle ) : "") + '">' + html + "</figure>";
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
                                    var ullistHTML = '<ul class="dropdown-menu">' + lists.join('') + '</ul>';
                                    html = '<div class="btn-group markdown-dropdown">' + buttonHtml + buttonDDHtml + ullistHTML + "</div>";
                                }
                            }
                        }
                    }
                }
                return html;
            }
        });

        // Dependent on 'markdown-it-container' and 'markdown-it-attrs' plugins
        // Injects `image` tag
        md.use(mdContainer, 'image', {
            /*
             * Checks whether string matches format ":::image [CAPTION](LINK){ATTR=VALUE .CLASSNAME}"
             * String inside '{}' is Optional, specifies attributes to be applied to prev element
             */
            validate: function(params) {
                return params.trim().match(/image\s+(.*$)/i);
            },

            render: function (tokens, idx) {

                // Get token string after regeexp matching to determine actual internal markdown
                var m = tokens[idx].info.trim().match(/image\s+(.*)$/i);

                // If this is the opening tag i.e. starts with "::: image "
                if (tokens[idx].nesting === 1 && m.length > 0) {

                    // Extract remaining string before closing tag and get its parsed markdown attributes
                    var attrs = md.parseInline(m[1]), html = "";
                    if (attrs && attrs.length == 1 && attrs[0].children) {

                        // Check If the markdown is a link
                        if (attrs[0].children[0].type == "link_open") {
                            var imageHTML = "<img ", openingLink = attrs[0].children[0];
                            var enlargeLink, posTop = true;

                            // Add all attributes to the image
                            openingLink.attrs.forEach(function(attr) {
                                if (attr[0] == "href") {
                                    imageHTML += 'src="' + attr[1] + '"';
                                } else if (attr[0] == "link") {
                                    enlargeLink = attr[1];
                                } else if (attr[0] == "pos") {
                                    posTop = attr[1].toLowerCase() == 'bottom' ? false : true;
                                } else {
                                    imageHTML +=  attr[0] + '="' + attr[1] + '"';
                                }
                               imageHTML += " ";
                            });

                            html += imageHTML + "/>";

                            var captionHTML = "";

                            // If the next attribute is not a closing link then iterate
                            // over all the children until link_close is encountered rednering their markdown
                            if (attrs[0].children[1].type != 'link_close') {
                                for(var i=1; i<attrs[0].children.length; i++) {
                                    // If there is a caption then add it as a "div" with "caption" class
                                    if (attrs[0].children[i].type == "text") {
                                       captionHTML += md.renderInline(attrs[0].children[i].content);
                                    } else if (attrs[0].children[i].type !== 'link_close'){
                                       captionHTML += md.renderer.renderToken(attrs[0].children,i,{});
                                    } else {
                                        break;
                                    }
                                }
                            }

                            // Add caption html
                            if (posTop) {
                                html = '<figcaption class="embed-caption">' + captionHTML + "</figcaption>" + html;
                            } else {
                                html = html + '<figcaption class="embed-caption">' + captionHTML + "</figcaption>";
                            }

                            // If link is specified, then wrap the image and figcaption inside anchor tag
                            if (enlargeLink) {
                                html = '<a href="' + enlargeLink + '" target="_blank">' + html + '</a>' ;
                            }

                            // Encapsulate the iframe inside a paragraph tag
                            html = '<figure class="embed-block" style="display:inline-block;">' + html + "</figure>";
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

        md.use(mdContainer, 'video', {
            /*
             * Checks whether string matches format ":::video (LINK){ATTR=VALUE .CLASSNAME}"
             * String inside '{}' is Optional, specifies attributes to be applied to prev element
             */
            validate: function(params) {
                return params.trim().match(/video\s+(.*$)/i);
            },

            render: function (tokens, idx) {
                // Get token string after regeexp matching to determine actual internal markdown
                var m = tokens[idx].info.trim().match(/video\s+(.*)$/i);

                // If this is the opening tag i.e. starts with "::: video "
                if (tokens[idx].nesting === 1 && m.length > 0) {

                    // Extract remaining string before closing tag and get its parsed markdown attributes
                    var attrs = md.parseInline(m[1]), html = "";

                    if (attrs && attrs.length == 1 && attrs[0].children) {
                        // Check If the markdown is a link
                        if (attrs[0].children[0].type == "link_open") {
                            var videoHTML="<video controls ", openingLink = attrs[0].children[0];
                            var srcHTML="", videoClass="", flag = true, posTop = true;

                            // Add all attributes to the video
                            openingLink.attrs.forEach(function(attr) {
                                if (attr[0] == "href") {
                                    if(attr[1] == ""){
                                        flag= false;
                                        return "";
                                    }
                                    srcHTML += '<source src="' + attr[1] + '" type="video/mp4">';
                                }
                                else if ( (attr[0] == "width" || attr[0] == "height") && attr[1]!=="") {
                                    videoClass +=  attr[0]+ "="+ attr[1] +" ";
                                }
                                else if ( (attr[0] == "loop" || attr[0] == "preload" || attr[0] == "muted" || attr[0] == "autoload") && attr[1]=="") {
                                    videoClass +=  attr[0]+ " ";
                                }
                                else if ( (attr[0] == "pos") && attr[1]!=="") {
                                    posTop =  attr[1].toLowerCase() == 'bottom' ? false : true;
                                }
                            });

                            var captionHTML="";
                            // If the next attribute is not a closing link then iterate
                            // over all the children until link_close is encountered rednering their markdown
                            if (attrs[0].children[1].type != 'link_close') {
                                for(var i=1; i<attrs[0].children.length; i++) {
                                    // If there is a caption then add it as a "div" with "caption" class
                                    if (attrs[0].children[i].type == "text") {
                                       captionHTML += md.renderInline(attrs[0].children[i].content);
                                    } else if (attrs[0].children[i].type !== 'link_close'){
                                       captionHTML += md.renderer.renderToken(attrs[0].children,i,{});
                                    } else {
                                        break;
                                    }
                                }
                            }

                            if(captionHTML.trim().length && flag && posTop){
                                html +=  "<figure><figcaption>"+captionHTML+ "</figcaption>" + videoHTML + videoClass +">"+ srcHTML +"</video></figure>" ;
                            }else if(captionHTML.trim().length && flag){
                                html +=  "<figure>"+ videoHTML + videoClass +">"+ srcHTML +"</video><figcaption>"+captionHTML+ "</figcaption></figure>" ;
                            } else if(flag)
                                html += videoHTML + videoClass +">"+ srcHTML +"</video>";
                            else
                                return '';
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
    };

    // Characters to replace Markdown special characters
    module._escapeReplacementsForMarkdown = [
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
    module._escapeMarkdownCharacters = function(text) {
      return module._escapeReplacementsForMarkdown.reduce(
        function(text, replacement) {
          return text.replace(replacement[0], replacement[1]);
        }, text);
    };

    /**
     * @function
     * @param {String} text The text in which replacement needs to happen.
     * @desc
     * This private utility function replaces strings with this format {{NAME}} to this one {{&NAME}}.
     * This function is used with Mustache to change escaped variables to non-escaped one in a template
     * @returns {String} String after replacement
     */
    module._addIgnoreEscapingForTemplating = function(text) {
        var escapedVariables = [], escapedVarRegexp = /\{\{\{([\w\d-]+)\}\}\}/ig;
        var replaceVariables = {}, replaceVarRegexp = /\{\{([\w\d-]+)\}\}/ig;

        // Look for strings with this format {{{NAME}}} to avoid adding them to be non-escaped as they're already
        // in the Mustache format of non-escaping
        var placeholders = text.match(escapedVarRegexp);
        if (placeholders) {
            placeholders.forEach(function(p) {
                escapedVariables.push("{{"  + escapedVarRegexp.exec(p)[1] + "}}");
            });
        }

        // Look for strings with this format {{NAME}} to non-escaped them
        // in the Mustache format {{&NAME}}
        placeholders = text.match(replaceVarRegexp);
        if (placeholders) {
            placeholders.forEach(function(p) {
                // If it is part of escaped variable then simply ignore it
                if (escapedVariables.indexOf(p) == -1) {

                    // Grab the actual variable NAME from the string {{NAME}}
                    var variable = replaceVarRegexp.exec(p)[1];

                    // If the variable starts with "#", "^" or ends with "/", we ignore them as they're block tags.
                    // If the variable starts with "&" then we ignore it as it is already in the Mustache format of non-escaping
                    if (!variable.startsWith("&") && !variable.startsWith("#") && !variable.startsWith("^") && !variable.endsWith("/")) {
                        replaceVariables["{{" +variable + "}}"] = variable;
                    }
                }
            });
        }

        // Replace all the variables {{NAME}} in the text with their non-escaping Mustache format of {{&NAME}}
        for(var variable in replaceVariables) {
            text = text.replaceAll(variable,"{{&" + replaceVariables[variable] + "}}");
        }

        return text;
    };

    /**
     * @function
     * @desc
     * A function used by Mustache to encode strings in a template
     * @return {Function} A function that is called by Mustache when it stumbles across
     * {{#encode}} string while parsing the template.
     */
    module._encodeForTemplate = function() {
        return function(text, render) {

            // Replace inner variables of form {{NAME}} to {{&NAME}} to disable Mustache HTML escaping them.
            //text = module._addIgnoreEscapingForTemplating(text);

            return module._fixedEncodeURIComponent(render(text));
        };
    };

    /**
     * @function
     * @desc
     * A function used by Mustache to escape Markdown characters in a string
     * @return {Function} A function that is called by Mustache when it stumbles across
     * {{#escape}} string while parsing the template.
     */
    module._escapeForTemplate = function() {
        return function(text, render) {

            // Replace inner variables of form {{NAME}} to {{&NAME}} to disable Mustache HTML escaping them.
            // text = module._addIgnoreEscapingForTemplating(text);


            return module._escapeMarkdownCharacters(render(text));
        };
    };

    /**
     * @function
     * @desc
     * Gets currDate object once the page loads for future access in templates
     * @return {Object} A date object that contains all properties
     */
    var getCurrDate = function() {
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
    module._currDate = getCurrDate();

    /**
     * @function
     * @desc
     * Add utility objects such as date (Computed value) to mustache data obj
     * so that they can be accessed in the template
     */
    module._addErmrestVarsToTemplate = function(obj) {
        obj.$moment = module._currDate;
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
    module._renderMustacheTemplate = function(template, keyValues, options) {
        if (typeof template !== 'string') return null;

        options = options || {};

        var obj = {};

        // Inject ermrest internal utility objects such as date
        module._addErmrestVarsToTemplate(obj);

        // Inject the encode function in the keyValues object
        obj.encode = module._encodeForTemplate;

        // Inject the escape function in the keyValues object
        obj.escape = module._escapeForTemplate;

        // Inject other functions provided in the options.functions array if needed
        if (options.functions && options.functions.length) {
            options.functions.forEach(function(f) {
                obj[f.name] = function() {
                    return f.fn;
                };
            });
        }

        if (keyValues) {
            for (var k in keyValues) {
                // Replace "." with "_" to avoid problems with templating
                var newKey = k.replace(/\./g,"_");

                obj[newKey] = keyValues[k];
            }

        }




        // If we should validate, validate the template and if returns false, return null.
        if (!options.avoidValidation && !module._validateMustacheTemplate(template, obj)) {
            return null;
        }

        var content;

        try {
            content = module._mustache.render(template, obj);
        } catch(e) {
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
    module._validateMustacheTemplate = function (template, keyValues, ignoredColumns) {
        var conditionalRegex = /\{\{(#|\^)([\w\d-_. ]+)\}\}/;

        // If no conditional Mustache statements of the form {{#var}}{{/var}} or {{^var}}{{/var}} not found then do direct null check
        if (!conditionalRegex.exec(template)) {

            // Grab all placeholders ({{PROP_NAME}}) in the template
            var placeholders = template.match(/\{\{([\w\d-_. ]+)\}\}/ig);

            // If there are any placeholders
            if (placeholders && placeholders.length) {

                // Get unique placeholders
                placeholders = placeholders.filter(function(item, i, ar) { return ar.indexOf(item) === i; });

                /*
                 * Iterate over all placeholders to set pattern as null if any of the
                 * values turn out to be null or undefined
                 */
                for (var i=0; i<placeholders.length;i++) {

                    // Grab actual key from the placeholder {{name}} = name, remove "{{" and "}}" from the string for key
                    var key = placeholders[i].substring(2, placeholders[i].length - 2);

                    if (key[0] == "{") key = key.substring(1, key.length -1);

                    // If key is not in ingored columns value for the key is null or undefined then return null
                    if ((!Array.isArray(ignoredColumns) || ignoredColumns.indexOf(key) == -1) && (keyValues[key] === null || keyValues[key] === undefined)) {
                       return false;
                    }
                }
            }
        }
        return true;
    };

    /**
     * A wrapper for {ERMrest._renderMustacheTemplate}
     * This function will generate formmatted values from the given data,
     * if you don't want the funciton to format the data, make sure to have
     * options.formatted = true
     *
     * @param  {ERMrest.Table} table
     * @param  {object} data
     * @param  {string} template
     * @param  {string} context
     * @param  {Array.<Object>=} options optioanl parameters
     * @return {string} Returns a string produced as a result of templating using `Mustache`.
     */
    module._renderTemplate = function (template, data, table, context, options) {

        // to avoid computing data mutliple times, or if we don't want the formatted values
        if (options === undefined || !options.formatted) {
            data = module._getFormattedKeyValues(table.columns, context, data);
        }

        // render the template using Mustache
        return module._renderMustacheTemplate(template, data, options);
    };

    /**
     * A wrapper for {ERMrest._validateMustacheTemplate}
     * it will take care of adding formmatted and unformatted values.
     * options.formmatted=true: to avoid formatting key values
     * options.ignoredColumns: list of columns that you want validator to ignore
     *
     * @param  {ERMrest.Table} table
     * @param  {object} data
     * @param  {string} template
     * @param  {string} context
     * @param  {Array.<string>=} ignoredColumns the columns that should be ignored (optional)
     * @return {boolean} True if the template is valid.
     */
    module._validateTemplate = function (template, data, table, context, options) {

        var ignoredColumns;
        if (typeof options !== undefined && Array.isArray(options.ignoredColumns)) {
            ignoredColumns = options.ignoredColumns;
        }

        // to avoid computing data multiple times, or if we don't want the formatted values
        if (options === undefined || !options.formatted) {
            // make sure to add formatted columns too.
            if (ignoredColumns !== undefined) {
                ignoredColumns.forEach(function (col) {
                    ignoredColumns.push("_" + col);
                });
            }

            data = module._getFormattedKeyValues(table.columns, context, data);
        }

        // call the actual mustache validator
        return module._validateMustacheTemplate(template, data, ignoredColumns);
    };

    // module._constraintNames[catalogId][schemaName][constraintName] will return an object.
    module._constraintNames = {};

    /**
     * Creaes a map from catalog id, schema name, and constraint names to the actual object.
     *
     * @private
     * @param  {string} catalogId      catalog id
     * @param  {string} schemaName     schema name
     * @param  {string} constraintName the constraint name of the object
     * @param  {string} obj            the object that we want to store
     * @param  {string} subject        one of module._constraintTypes
     */
    module._addConstraintName = function (catalogId, schemaName, constraintName, obj, subject) {
        if (!(catalogId in module._constraintNames)) {
            module._constraintNames[catalogId] = {};
        }

        if (!(schemaName in this._constraintNames[catalogId])) {
            module._constraintNames[catalogId][schemaName] = {};
        }

        module._constraintNames[catalogId][schemaName][constraintName] = {
            "subject": subject,
            "object": obj
        };
    };

    /**
     * Return an object given catalog id, schema name, and constraint name.
     *
     * @private
     * @param  {string} catalogId      catalog id
     * @param  {string} schemaName     schema name
     * @param  {string} constraintName the constraint name of the object
     * @param  {string} subject        one of module._constraintTypes
     * @return {object}                the constraint object. It will have .subject (any of module._constraintTypes) and .object (actual object)
     */
    module._getConstraintObject = function (catalogId, schemaName, constraintName, subject) {
        var result;
        if ((catalogId in module._constraintNames) && (schemaName in module._constraintNames[catalogId])){
            result = module._constraintNames[catalogId][schemaName][constraintName];
        }
        return (result === undefined || (subject !== undefined && result.subject !== subject)) ? null : result;
    };


    module._constraintTypes = Object.freeze({
        KEY: "k",
        FOREIGN_KEY: "fk"
    });

    module._isEntryContext = function(context) {
        return module._entryContexts.indexOf(context) !== -1;
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
        COLUMN_DISPLAY: "tag:isrd.isi.edu,2016:column-display",
        TABLE_ALTERNATIVES: "tag:isrd.isi.edu,2016:table-alternatives",
        APP_LINKS: "tag:isrd.isi.edu,2016:app-links",
        GENERATED: "tag:isrd.isi.edu,2016:generated",
        IMMUTABLE: "tag:isrd.isi.edu,2016:immutable",
        NON_DELETABLE: "tag:isrd.isi.edu,2016:non-deletable",
        KEY_DISPLAY: "tag:isrd.isi.edu,2017:key-display",
        ASSET: "tag:isrd.isi.edu,2017:asset"
    });

    /**
     * @desc List of contexts that ermrestjs supports.
     * @private
     */
    module._contexts = Object.freeze({
        COMPACT: 'compact',
        COMPACT_BRIEF: 'compact/brief',
        COMPACT_SELECT: 'compact/select',
        CREATE: 'entry/create',
        DETAILED: 'detailed',
        EDIT: 'entry/edit',
        ENTRY: 'entry',
        FILTER: 'filter',
        DEFAULT: '*',
        ROWNAME :'row_name',
        ROWNAME_UNFORMATTED: "row_name/unformatted",
        COMPACT_BRIEF_INLINE: 'compact/brief/inline'
    });

    module._contextArray = ["compact", "compact/brief", "compact/select", "entry/create", "detailed", "entry/edit", "entry", "filter", "*", "row_name", "compact/brief/inline"];

    module._entryContexts = [module._contexts.CREATE, module._contexts.EDIT, module._contexts.ENTRY];

    module._tableKinds = Object.freeze({
        TABLE: "table",
        VIEW: "view"
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

    module._histogramSupportedTypes = [
        'int2', 'int4', 'int8', 'float', 'float4', 'float8', 'numeric',
        'serial2', 'serial4', 'serial8', 'timestamptz', 'date'
    ];

    module._facetUnsupportedTypes = [
        'markdown', 'longtext', 'serial2', 'serial4', 'serial8', 'ermrest_rid'
    ];

    module._systemColumns = ['RID', 'RCB', 'RMB', 'RCT', 'RMT'];
