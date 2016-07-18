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
                if (!this.params) {
                    return fn.apply(scope, arguments );
                }

                // not allowed to alter 'arguments' so you must make a shallow
                // copy. it is also an 'array-like' object but not an actual
                // array, therefore arguments.slice() does not work.
                var args = [];
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

                // now call the fn
                return fn.apply(scope, args );
            }
        }

        // now wrap over the supported methods
        var wrapper = {};
        var methods = ['get', 'put', 'post', 'delete'];
        for (var i=0, len=methods.length; i<len; i++) {
            wrapper[methods[i]] = wrap(methods[i], http[methods[i]], http);
        }

        return wrapper;
    }

    return module;

}(ERMrest || {}));
