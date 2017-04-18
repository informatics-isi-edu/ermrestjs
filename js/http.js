/*
 * Copyright 2015 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ERMrest = (function (module) {

    /**
     * Enumeration of HTTP Response Status Codes, which are used within this
     * sub-module. For internal use only.
     * @private
     * @type {Object}
     */
    var _http_status_codes = {
        timed_out: 0,
        no_content: 204,
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
     * @callback httpUnauthorizedFn
     * @type {httpUnauthorizedFn}
     * @private
     */
    module._httpUnauthorizedFn = null;

    /**
     * set callback function which will be called when a HTTP 401 Error occurs
     * @callback httpUnauthorizedFn
     * @param {httpUnauthorizedFn} fn callback function
     */
    module.httpUnauthorizedFn = function(fn) {
        module._httpUnauthorizedFn = fn;
    };

    var _ermrestAuthorizationFailureFlag = false;
    var _authorizationDefers = [];

    /**
     * @function
     * @private
     * @returns {Promise} A promise for {@link ERMrest} scripts loaded,
     * This function is used by http. It resolves promises by calling this function
     * to make sure thirdparty scripts are loaded.
     */
    module._onHttpAuthFlowFn = function() {
        var defer = module._q.defer();

        if (_ermrestAuthorizationFailureFlag) _authorizationDefers.push(defer);
        else defer.resolve();

        return defer.promise;
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
                // if no default params, then just call the fn
                var args;
                if (this.params) {
                    // not allowed to alter 'arguments' so you must make a shallow
                    // copy. it is also an 'array-like' object but not an actual
                    // array, therefore arguments.slice() does not work.
                    args = [];
                    for (var i=0, len=arguments.length; i<len; i++) {
                        args[i] = arguments[i];
                    }

                    // make sure arguments has a config, and config has a params
                    var config = args[cfg_idx] = args[cfg_idx] || {};
                    config.params = config.params || {};

                    // now add default params iff they do not collide
                    for (var key in this.params) {
                        if (!(key in config.params)) {
                            config.params[key] = this.params[key];
                        }
                    }
                }
                else {
                    args = arguments;
                }

                // now call the fn, with retry logic
                var deferred = module._q.defer();
                var max_retries = (this.max_retries !== undefined && this.max_retries !== null) ? this.max_retries : _default_max_retries;
                var delay = (this.initial_delay !== undefined && this.initial_delay !== null) ? this.initial_delay : _default_initial_delay;
                var count = 0;
                function asyncfn() {
                    fn.apply(scope, args).then(function(response) {
                        module._onload().then(function() {
                            deferred.resolve(response);
                        });
                    },
                    function(response) {
                        response.status = response.status || response.statusCode;
                        if ((_retriable_error_codes.indexOf(response.status) != -1) && count < max_retries) {
                            count += 1;
                            setTimeout(function() {
                                module._onHttpAuthFlowFn().then(function() {
                                    asyncfn();
                                });
                            }, delay);
                            delay *= 2;
                        } else if (method == 'delete' && response.status == _http_status_codes.not_found) {
                            /* SPECIAL CASE: "retried delete"
                             * This indicates that a 'delete' was attempted, but
                             * failed due to a transient error. It was retried
                             * at least one more time and at some point
                             * succeeded.
                             *
                             * Both of the currently supported delete operations
                             * (entity/ and attribute/) return 204 No Content.
                             */
                            response.status = response.statusCode = _http_status_codes.no_content;

                            module._onload().then(function() {
                                deferred.resolve(response);
                            });
                        } else if (response.status == 401) {
                            module._onHttpAuthFlowFn().then(function() {
                                asyncfn();
                            });

                            if (_ermrestAuthorizationFailureFlag === false) {
                                
                                _ermrestAuthorizationFailureFlag = true;

                                if (typeof module._httpUnauthorizedFn == 'function') {
                                
                                    module._httpUnauthorizedFn().then(function() {
                                
                                        _ermrestAuthorizationFailureFlag = false;
                                
                                        _authorizationDefers.forEach(function(defer) {
                                            defer.resolve();
                                        });
                                
                                    });
                                
                                } else {
                                    throw new Error("httpUnauthorizedFn Event Handler not registered");
                                }
                            }

                        } else {
                            module._onload().then(function() {
                                deferred.reject(response);
                            });
                        }
                    });
                }

                module._onHttpAuthFlowFn().then(function() {
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

    return module;

}(ERMrest || {}));
