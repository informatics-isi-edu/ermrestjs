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

    module._nextChar = function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    };

    /**
     * @function
     * @param {Object} element a model element (schema, table, or column)
     * @return {String}
     * @desc This function determines the display name for the schema, table, or
     * column elements of a model.
     */
    module._determineDisplayName = function (element) {
        var displayname = element.name;
        try {
            var display_annotation = element.annotations.get("tag:misd.isi.edu,2015:display");
            if (display_annotation && display_annotation.content &&
                display_annotation.content.name) {
                displayname = display_annotation.content.name;
            }
        } catch (exception) {
            // no display annotation, don't do anything
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

    module._makeRequest = {
        get: function(url) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            return _retryRequest(url, null, deferred, retryCount, delay);
        },

        put: function(url, data) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            return _retryRequest(url, data, deferred, retryCount, delay);
        },

        post: function(url, data) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            return _retryRequest(url, data, deferred, retryCount, delay);
        },

        delete: function(url) {
            var deferred = module._q.defer();
            var retryCount = 0;
            var delay = 0; // ms
            return _retryRequest(url, null, deferred, retryCount, delay);
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
     * @return {Promise}
     */
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
        return module._http(requestObj).then(function(response) {
            // successful
            deferred.resolve(response);
            return deferred.promise;
        }, function(response) {
            if ((response.status === 0 || response.status === 500 || response.status === 503) && retryCount <= 10 ) {
                // if error is 0, 500 or 503, and retry count is less than 10, retry
                retryCount += 1;
                // retry after delay
                delay = 2^retryCount * 100; // exponential backoff
                _sleep(delay); // not using setTimeout because setTimeout is asychronous
                return _retryRequest(method, url, data, deferred, retryCount, delay);
            } else if (self.method === 'delete' && response.status === 404){
                // SPECIAL CASE:
                // if method is delete and error is 409 not found
                // return a success promise
                deferred.resolve(response);
                return deferred.promise;
            } else {
                // max retries reached or
                // reached returnable error, reject
                deferred.reject(response);
                return deferred.promise;
            }

        });

    }

    function _sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                break;
            }
        }
    }

    return module;

}(ERMrest || {}));
