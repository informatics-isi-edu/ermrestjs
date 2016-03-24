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
     * converts a string to title case
     */
    module._toTitleCase = function (str) {
        return str.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
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

    return module;

}(ERMrest || {}));



