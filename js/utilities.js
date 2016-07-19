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
            var display_annotation = element.annotations.get("tag:misd.isi.edu,2015:display");
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

    /*
    module._makeRequest = {
        get: function(url) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            _retryRequest("get", url, null, deferred, retryCount, delay);
            return deferred.promise;
        },

        put: function(url, data) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            _retryRequest("put", url, data, deferred, retryCount, delay);
            return deferred.promise;
        },

        post: function(url, data) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            _retryRequest("post", url, data, deferred, retryCount, delay);
            return deferred.promise;
        },

        delete: function(url) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            _retryRequest("delete", url, null, deferred, retryCount, delay);
            return deferred.promise;
        }
    };

    /**
     *
     * @param method 'get', 'put', 'post', 'delete'
     * @param url request url
     * @param data request data
     * @param deferred
     * @param retryCount keep count of number of retries
     * @param delay milliseconds to delay before retry
     * @private
     *
    function _retryRequest (method, url, data, deferred, retryCount, delay) {

        var requestObj = {
            method: method,
            url: url
        };

        if (method === 'put' || method === 'post') {
            requestObj.data = data;
        }

        var self = this;

        // make http request
        module._http(requestObj).then(function(response) {
            // successful
            deferred.resolve(response);
        }, function(response) {
            if ((response.status === 0 || response.status === 500 || response.status === 503) && retryCount < 10 ) {
                // if error is 0, 500 or 503, and retry count is less than 10, retry
                retryCount += 1;
                // retry after delay
                delay = 2^retryCount * 100; // exponential backoff
                console.log("retry #" + retryCount);
                setTimeout(_retryRequest(method, url, data, deferred, retryCount, delay), delay);
            } else if (self.method === 'delete' && response.status === 404){
                // SPECIAL CASE:
                // if method is delete and error is 409 not found
                // return a success promise
                deferred.resolve(response);
            } else {
                // max retries reached or
                // reached returnable error, reject
                console.log("max retries reached");
                deferred.reject(response);
            }

        });

    }
    */

    return module;

}(ERMrest || {}));
