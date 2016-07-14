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
     * This is an experimental function for wrapping an http service.
     * @memberof ERMrest
     * @function
     * @private
     */
    module._wrap_http = function(http) {
        // wrapping function
        function wrap(method, fn, scope) {
            scope = scope || window;
            return function() {
                /* TODO: http convenience method parameters can be intercepted,
                 * altered, and passed to the wrapped method here.
                 */
                return fn.apply(scope, [ arguments[0], arguments[1], arguments[2] ] );
            }
        }

        // now wrap over the supported methods
        var methods = ['get', 'put', 'post', 'delete'];
        for (var i=0, len=methods.length; i<len; i++) {
            http[methods[i]] = wrap(methods[i], http[methods[i]], http);
        }

        return http;
    }

    return module;

}(ERMrest || {}));
