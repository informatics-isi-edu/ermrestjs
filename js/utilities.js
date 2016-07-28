var ERMrest = (function(module) {

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
     * @param {Object} response http response object
     * @return {Object} error object
     * @desc create an error object from http response
     */
    module._responseToError = function (response) {
        var status = response.status;
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
     * @function
     * @param {Object} value A boolean value to transform
     * @param {Object} [options] Configuration options
     * @return {string} A string representation of a boolean value
     * @desc Formats a given boolean value into a string for display
     */
    module._printBoolean = function(value, options) {
        options = (typeof options === 'undefined') ? {} : options;
        if (value === null) {
            return '';
        }
        // TODO: What kinds of options are we supporting?
        return Boolean(value).toString();
    }

    /**
     * @function
     * @param {Object} value An integer value to transform
     * @param {Object} [options] Configuration options
     * @return {string} A string representation of value
     * @desc Formats a given integer value into a whole number (with a thousands
     * separator if necessary), which is transformed into a string for display.
     */
    module._printInteger = function(value, options) {
        options = (typeof options === 'undefined') ? {} : options;
        if (value === null) {
            return '';
        }

        // Remove fractional digits; implicitly transform value to number type
        // TODO: Truncate or round?
        value = Math.trunc(value);

        // Add comma separators
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // Use of .toLocaleString() = better internationalization (not just a comma but can accommodate other symbols as separators)
        // return Number(parseInt(value, 10)).toLocaleString();
    }

    module._printDatetime = function(value, options) {
        options = (typeof options === 'undefined') ? {} : options;

        if (value === null) {
            return '';
        }
        // TODO: Possible options: timezone support, local timezone support, JSON,
        // ISOString, UTCString, get year, get month, get milliseconds, get minutes..
        return new Date(value).toISOString();
    }

    module._printFloat = function(value, options) {
        options = (typeof options === 'undefined') ? {} : options;

        if (value === null) {
            return '';
        }

        value = parseFloat(value);
        if (options.numDecDigits) { // terminology?? "mantissa"
            value = value.toFixed(options.numDecDigits);
        } else {
            value = value.toFixed(2); // this rounds the number, is ok?
        }
        // Remove leading zeroes
        value = value.toString().replace(/^0+(?!\.|$)/, '');

        // Add comma separators
        var parts = value.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    /**
     * @desc List of annotations that ermrestjs supports.
     * @private
     */
    module._annotations = {
        DISPLAY: "tag:misd.isi.edu,2015:display",
        HIDDEN: "tag:misd.isi.edu,2015:hidden", //TODO deprecated and should be deleted.
        IGNORE: "tag:isrd.isi.edu,2016:ignore", //TODO should not be used in column and foreign key
        VISIBLE_COLUMNS: "tag:isrd.isi.edu,2016:visible-columns"
    };

    return module;

}(ERMrest || {}));
