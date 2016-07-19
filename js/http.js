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
     * Retriable error codes. These can sometimes indicate transient errors
     * that can be resolved simply by retrying the request, up to a limit.
     * @private
     * @type {Array<Number>}
     */
    var _retriable_error_codes = [0, 500, 503];

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
                    args[cfg_idx] = args[cfg_idx] || {};
                    args[cfg_idx].params = args[cfg_idx].params || {};

                    // now add default params iff they do not collide
                    for (var key in this.params) {
                        if (!(key in args[cfg_idx].params)) {
                            args[cfg_idx].params[key] = this.params[key];
                        }
                    }
                }
                else {
                    args = arguments;
                }

                // now call the fn, with retry logic
                var deferred = module._q.defer();
                var max_retries = this.max_retries || _default_max_retries;
                var delay = this.initial_delay || _default_initial_delay;
                var count = 0;
                function asyncfn() {
                    fn.apply(scope, args).then(function(response) {
                        deferred.resolve(response);
                    },
                    function(error) {
                        if (error.status in _retriable_error_codes && count < max_retries) {
                            count += 1;
                            console.log("[debug] retry count: " + count); // TODO remove this after debug
                            setTimeout(asyncfn, delay);
                            delay *= 2;
                        } else if (count && method === 'delete' && error.status === 404) {
                            /* SPECIAL CASE: "retried delete"
                             * This indicates that a 'delete' was attempted, but
                             * failed due to a transient error. It was retried 
                             * at least one more time and at some point 
                             * succeeded.
                             */
                            deferred.resolve(); // TODO should this return something?
                        } else {
                            deferred.reject(error);
                        }
                    });
                }
                asyncfn();
                return deferred.promise;
            }
        }

        // now wrap over the supported methods
        var wrapper = {};
        var methods = ['get', 'put', 'post', 'delete']; // TODO might as well include all of the supported convenience methods here
        for (var i=0, len=methods.length; i<len; i++) {
            wrapper[methods[i]] = wrap(methods[i], http[methods[i]], http);
        }

        return wrapper;
    }

    return module;

}(ERMrest || {}));
