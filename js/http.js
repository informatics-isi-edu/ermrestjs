
    /**
     * Enumeration of HTTP Response Status Codes, which are used within this
     * sub-module. For internal use only.
     * @private
     * @type {Object}
     */
    var _http_status_codes = {
        no_connection: -1,
        timed_out: 0,
        no_content: 204,
        unauthorized: 401,
        not_found: 404,
        internal_server_error: 500,
        service_unavailable: 503
    };

    /**
     * Retriable error codes. These can sometimes indicate transient errors
     * that can be resolved simply by retrying the request, up to a limit.
     * @private
     * @type {Array<Number>}
     */
    var _retriable_error_codes = [
        _http_status_codes.no_connection,
        _http_status_codes.timed_out,
        _http_status_codes.internal_server_error,
        _http_status_codes.service_unavailable];

    /**
     * Mapping from convenience method name to its config argument index.
     * @private
     * @type {Object}
     */
    var _method_to_config_idx = {
        get: 1,
        delete: 1,
        head: 1,
        jsonp: 1,
        post: 2,
        put: 2,
        patch: 2
    };

    /**
     * Default maximum allowable retries. This can be overridden by setting
     * the `max_retries` property on the wrapped http object.
     * @private
     * @type {Number}
     */
    var _default_max_retries = 10;

    /**
     * Initial timeout delay. This dely will be doubled each time to perform
     * an exponential backoff retry protocol. Units in mililiseconds. This
     * can be overridden by setting the `initial_dely` property on the wrapped
     * http object.
     * @private
     * @type {Number}
     */
    var _default_initial_delay = 100;

    /**
     * function that is called when a HTTP 401 Error occurs
     * and should return a promise
     * @type {function}
     * @private
     */
    module._http401Handler = null;

    /**
     * set callback function which will be called when a HTTP 401 Error occurs
     * @param {httpUnauthorizedFn} fn callback function
     */
    module.setHTTP401Handler = function(fn) {
        module._http401Handler = fn;
    };


    /**
     * The callback that will be called whenever 401 HTTP error is encountered,
     * unless there is already login flow in progress.
     * @callback httpUnauthorizedFn
     */

    /*
     * A flag to determine whether emrest authorization error has occured
     * as well as to determine the login flow is currently in progress to avoid
     * calling the _http401Handler callback again
     */
    var _encountered401Error = false;

    /*
     * All the calls that were paused because of 401 error are added to this array
     *  Once the _encountered401Error is false, all of them will be resolved/restarted
    */
    var _authorizationDefers = [];

    /**
     * @function
     * @private
     * @param {Boolean} skipHTTP401Handling whether we should check for the _encountered401Error or not
     * @returns {Promise} A promise for {@link ERMrest} scripts loaded,
     * This function is used by http. It resolves promises by calling this function
     * to make sure _encountered401Error is false.
     */
    module._onHttpAuthFlowFn = function(skipHTTP401Handling) {
        var defer = module._q.defer();

        // If _encountered401Error is true then push the defer to _authorizationDefers
        // else just resolve it directly
        if (!skipHTTP401Handling && _encountered401Error) _authorizationDefers.push(defer);
        else defer.resolve();

        return defer.promise;
    };

    /**
     * given a respone object from http module, will return the headers
     * This is to ensure angularjs and axios behave the same way.
     * In case of angularjs' $http the headers is a function while for axios
     * it's an object.
     *
     * The response is always going to be an object
     */
    module.getResponseHeader = function (response) {
        if (!response || response.headers == null) return {};
        if (typeof response.headers === "function") return response.headers();
        if (!("headers" in response)) return {};

        return response.headers;
    };

    /**
     * This is an experimental function for wrapping an http service.
     * @memberof ERMrest
     * @function
     * @private
     */
    module._wrap_http = function(http) {

        // wrapping function
        function wrap(method, fn, scope) {
            scope = scope || window;
            var cfg_idx = _method_to_config_idx[method];
            return function() {
                var args;

                // not allowed to alter 'arguments' so you must make a shallow
                // copy. it is also an 'array-like' object but not an actual
                // array, therefore arguments.slice() does not work.
                args = [];
                for (var i=0, len=arguments.length; i<len; i++) {
                    args[i] = arguments[i];
                }

                // make sure arguments has a config, and config has a headers
                var config = args[cfg_idx] = args[cfg_idx] || {};

                // now add default headers i
                config.headers = config.headers || {};

                // if no default contextHeaderParams, then just call the fn
                if (this.contextHeaderParams) {
                    // Iterate over headers iff they do not collide
                    var contextHeader;
                    if (typeof config.headers[module.contextHeaderName] === "object" && config.headers[module.contextHeaderName]) {
                        contextHeader = config.headers[module.contextHeaderName];
                    } else {
                        contextHeader = config.headers[module.contextHeaderName] = {};
                    }
                    for (var key in this.contextHeaderParams) {
                        if (!(key in contextHeader)) {
                            contextHeader[key] = this.contextHeaderParams[key];
                        }
                    }
                } else {
                    args = arguments;
                }

                /**
                  * If context header is found in header then encode the stringified value of the header and unescape to keep some of them same
                  *     JSON and HTTP safe reserved chars: {, }, ", ,, :
                  *     non-reserved punctuation: -, _, ., ~
                  *     digit: 0 - 9
                  *     alpha: A - Z and a - z
                  *
                  **/
                if (typeof config.headers[module.contextHeaderName] === 'object') {
                    config.headers[module.contextHeaderName].elapsed_ms = module.getElapsedTime();
                    // encode and make sure it's not very lengthy
                    config.headers[module.contextHeaderName] = module._certifyContextHeader(config.headers[module.contextHeaderName]);
                }

                // now call the fn, with retry logic
                var deferred = module._q.defer();
                var max_retries = (this.max_retries !== undefined && this.max_retries !== null) ? this.max_retries : _default_max_retries;
                var delay = (this.initial_delay !== undefined && this.initial_delay !== null) ? this.initial_delay : _default_initial_delay;
                var count = 0;
                function asyncfn() {
                    fn.apply(scope, args).then(function(response) {
                        module._onHTTPSuccess();
                        module.onload().then(function() {
                            deferred.resolve(response);
                        });
                    },
                    function(error) {
                        /**
                         * in axios, network error doesn't have proper status code,
                         * so this will make sure we're treating it the same as response.status=-1
                         *
                         * https://github.com/axios/axios/issues/383
                         */
                        if (!!error.isAxiosError) {
                            if (typeof error.response !== 'object') {
                                error = { response: { status: _http_status_codes.no_connection } };
                            } else if (typeof error.response.status !== 'number') {
                                error.response.status = _http_status_codes.no_connection;
                            }
                        }

                        /**
                         * angularjs' $http returns the "response" object
                         * while axios returns an "error" object that has "response" in it
                         */
                        var response = ("response" in error) ? error.response : error;

                        /**
                         * there was an error with calling the http module,
                         * not that we got an error from server.
                         */
                        if (typeof response !== "object" || response == null) {
                            module.onload().then(function() {
                                deferred.reject(error);
                            });
                            return;
                        }


                        var contentType = module.getResponseHeader(response)["content-type"];

                        // if retry flag is set, skip on -1 and 0
                        var skipRetry = config.skipRetryBrowserError && (response.status == -1 || response.status == 0);
                        if ((_retriable_error_codes.indexOf(response.status) != -1) && count < max_retries && !skipRetry) {
                            count += 1;
                            setTimeout(function() {
                                module._onHttpAuthFlowFn().then(function() {
                                    asyncfn();
                                });
                            }, delay);
                            delay *= 2;
                        } else if (method == 'delete' && response.status == _http_status_codes.not_found) {
                            /** SPECIAL CASE: "retried delete"
                              * This indicates that a 'delete' was attempted, but
                              * failed due to a transient error. It was retried
                              * at least one more time and at some point
                              * succeeded.
                              *
                              * Both of the currently supported delete operations
                              * (entity/ and attribute/) return 204 No Content.
                              */

                            // If we get an HTTP error with HTML in it, this means something the server returned as an error.
                            // Ermrest never produces HTML errors, so this was produced by the server itself
                            if (contentType && contentType.indexOf("html") > -1) {
                                response.status = _http_status_codes.internal_server_error;
                                // keep response.data the way it is, so client can provide more info to users
                            } else {
                                response.status = _http_status_codes.no_content;
                            }

                            module.onload().then(function() {
                                deferred.resolve(response);
                            });
                        } else if (response.status == _http_status_codes.unauthorized) {

                            // skip the 401 handling
                            if (config.skipHTTP401Handling) {
                                deferred.reject(response);
                                return;
                            }

                            // If _encountered401Error is not set then
                            if (_encountered401Error === false) {

                                // If callback has been registered in _http401Handler
                                if (typeof module._http401Handler == 'function') {

                                    // Set _encountered401Error to avoid the handler from being called again
                                    _encountered401Error = true;

                                    // Push the current call to _authroizationDefers by calling _onHttpAuthFlowFn
                                    module._onHttpAuthFlowFn().then(function() {
                                        asyncfn();
                                    });

                                    // Call the handler, which will return a promise
                                    // On success set the flag as false and resolve all the authorizationDefers
                                    // So that other calls which failed due to 401 or were trigerred after the 401
                                    // are reexecuted
                                    // differentUser variable is a boolean variable that states whether the different user logged in after the 401 error was thrown
                                    module._http401Handler().then(function(differentUser) {
                                        // if not a different user, continue with retrying previous requests
                                        // This should handle the case where 'differentUser' is undefined or null as well
                                        if (!differentUser) {
                                            _encountered401Error = false;

                                            _authorizationDefers.forEach(function(defer) {
                                                defer.resolve();
                                            });
                                        }
                                    }, function (response) {
                                        _encountered401Error = false;
                                        deferred.reject(response);
                                    });

                                } else {
                                    //throw new Error("httpUnauthorizedFn Event Handler not registered");
                                    deferred.reject(response);
                                }
                            } else {
                                // Push the current call to _authroizationDefers by calling _onHttpAuthFlowFn
                                module._onHttpAuthFlowFn().then(function() {
                                    asyncfn();
                                });
                            }

                        } else {
                            // If we get an HTTP error with HTML in it, this means something the server returned as an error.
                            // Ermrest never produces HTML errors, so this was produced by the server itself
                            if (contentType && contentType.indexOf("html") > -1) {
                                response.status  = _http_status_codes.internal_server_error;
                                // keep response.data the way it is, so client can provide more info to users
                            }

                            module.onload().then(function() {
                                deferred.reject(response);
                            });
                        }
                    });
                }

                // Push the current call to _authorizationDefers by calling _onHttpAuthFlowFn
                // If the _encountered401Error is false then asyncfn will be called immediately
                // else it will be queued
                module._onHttpAuthFlowFn(config.skipHTTP401Handling).then(function() {
                    asyncfn();
                });

                return deferred.promise;
            };
        }

        // now wrap over the supported methods
        var wrapper = {};
        for (var method in _method_to_config_idx) {
            wrapper[method] = wrap(method, http[method], http);
        }

        return wrapper;
    };
