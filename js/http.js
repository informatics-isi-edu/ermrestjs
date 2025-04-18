/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
// services
import CatalogService from '@isrd-isi-edu/ermrestjs/src/services/catalog';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

// utils
import { _shorterVersion, CONTEXT_HEADER_LENGTH_LIMIT, contextHeaderName } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { fixedEncodeURIComponent, simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy
import { getElapsedTime, onload } from '@isrd-isi-edu/ermrestjs/js/setup/node';

    /**
     * Enumeration of HTTP Response Status Codes, which are used within this
     * sub- For internal use only.
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
    var _http401Handler = null;

    /**
     * set callback function which will be called when a HTTP 401 Error occurs
     * @param {httpUnauthorizedFn} fn callback function
     */
    export function setHTTP401Handler(fn) {
        _http401Handler = fn;
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
    function _onHttpAuthFlowFn(skipHTTP401Handling) {
        var defer = ConfigService.q.defer();

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
    export function getResponseHeader(response) {
        if (!response || response.headers == null) return {};
        if (typeof response.headers === "function") return response.headers();
        if (!("headers" in response)) return {};

        return response.headers;
    };

    var _onHTTPSuccess = function () {};
    /**
     * set callback function that triggers when a request returns with success
     * @param {onHTTPSuccess} fn callback function
     */
    export function onHTTPSuccess(fn) {
        _onHTTPSuccess = fn;
    };

    /**
     * This is an experimental function for wrapping an http service.
     * @memberof ERMrest
     * @function
     * @private
     */
    export function _wrap_http(http) {

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
                    if (typeof config.headers[contextHeaderName] === "object" && config.headers[contextHeaderName]) {
                        contextHeader = config.headers[contextHeaderName];
                    } else {
                        contextHeader = config.headers[contextHeaderName] = {};
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
                if (typeof config.headers[contextHeaderName] === 'object') {
                    config.headers[contextHeaderName].elapsed_ms = getElapsedTime();
                    // encode and make sure it's not very lengthy
                    config.headers[contextHeaderName] = _certifyContextHeader(config.headers[contextHeaderName]);
                }

                // now call the fn, with retry logic
                var deferred = ConfigService.q.defer();
                var max_retries = (this.max_retries !== undefined && this.max_retries !== null) ? this.max_retries : _default_max_retries;
                var delay = (this.initial_delay !== undefined && this.initial_delay !== null) ? this.initial_delay : _default_initial_delay;
                var count = 0;
                function asyncfn() {
                    fn.apply(scope, args).then(function(response) {
                        _onHTTPSuccess();
                        onload().then(function() {
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
                        // eslint-disable-next-line no-extra-boolean-cast
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
                            onload().then(function() {
                                deferred.reject(error);
                            });
                            return;
                        }


                        var contentType = getResponseHeader(response)["content-type"];

                        // if retry flag is set, skip on -1 and 0
                        var skipRetry = config.skipRetryBrowserError && (response.status == -1 || response.status == 0);
                        if ((_retriable_error_codes.indexOf(response.status) != -1) && count < max_retries && !skipRetry) {
                            count += 1;
                            setTimeout(function() {
                                _onHttpAuthFlowFn().then(function() {
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

                            onload().then(function() {
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
                                if (typeof _http401Handler == 'function') {

                                    // Set _encountered401Error to avoid the handler from being called again
                                    _encountered401Error = true;

                                    // Push the current call to _authroizationDefers by calling _onHttpAuthFlowFn
                                    _onHttpAuthFlowFn().then(function() {
                                        asyncfn();
                                    });

                                    // Call the handler, which will return a promise
                                    // On success set the flag as false and resolve all the authorizationDefers
                                    // So that other calls which failed due to 401 or were trigerred after the 401
                                    // are reexecuted
                                    // differentUser variable is a boolean variable that states whether the different user logged in after the 401 error was thrown
                                    _http401Handler().then(function(differentUser) {
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
                                _onHttpAuthFlowFn().then(function() {
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

                            onload().then(function() {
                                deferred.reject(response);
                            });
                        }
                    });
                }

                // Push the current call to _authorizationDefers by calling _onHttpAuthFlowFn
                // If the _encountered401Error is false then asyncfn will be called immediately
                // else it will be queued
                _onHttpAuthFlowFn(config.skipHTTP401Handling).then(function() {
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

        /**
     * Given an object will make sure it's safe for header.
     */
    function _encodeHeaderContent(obj) {
        return unescape(fixedEncodeURIComponent(JSON.stringify(obj)));
    }
    
    /**
     * @private
     * @desc
     * Given a header object, will encode and if neccessary truncate it.
     * Maximum allowed length of a header after encoding: 6500 characters.
     * The logic is as follows:
     *  1. If the encoded string is not lengthy, return it.
     *  2. otherwise,
     *    2.1. Return an empty object if the minimal header (defined below) goes over the limit.
     *    2.2. Otherwise start truncating `stack` object by doing the following. In each step,
     *         if the encoded and truncated header goes below the length limit, return it.
     *         - replace all foreign key constraints with their RIDs (if RID is defined for all of them).
     *         - replace values (`choices`, `ranges`, `search`) in the filters with the number of values.
     *         - replace all `filters.and` with the number of filters.
     *         - replace all source paths with the number of path nodes.
     *         - use replace stack value with the number of stack nodes.
     *         If after performing all these steps, the header is still lengthy, return the minimal header.
     *
     * A minimal header will have the following attributes:
     *  - cid, pid, wid, action, schema_table, catalog, t:1
     * And might have these optional attributes:
     *  - elapsed_ms, cqp, ppid, pcid
     *
     * @param {object} header - the header context
     * @return {object}
     */
    export function _certifyContextHeader(header) {
        var MAX_LENGTH = CONTEXT_HEADER_LENGTH_LIMIT;

        var shorter = _shorterVersion;
        var replaceConstraintWithRID = function (src, noRID) {
            if (noRID) return false;

            var o = shorter.outbound, i = shorter.inbound, fk;
            if (Array.isArray(src)) {
                src.forEach(function (srcNode) {
                    if (noRID) return;
                    [shorter.outbound, shorter.inbound].forEach(function (direction) {
                        if (noRID) return;

                        if (Array.isArray(srcNode[direction])) {
                            fk = CatalogService.getConstraintObject(catalog, srcNode[direction][0], srcNode[direction][1]);
                            if (fk && fk.RID) {
                                srcNode[direction] = fk.RID;
                            } else {
                                noRID = true;
                                return;
                            }
                        }
                    });
                });
            }

            return !noRID;
        };

        var encode = _encodeHeaderContent, i;

        var res = encode(header);

        if (res.length < MAX_LENGTH) {
            return res;
        }

        var catalog = header.catalog;
        var minimalObj = {
            cid: header.cid,
            wid: header.wid,
            pid: header.pid,
            catalog: header.catalog,
            schema_table: header.schema_table,
            action: header.action,
            t: 1
        };

        // these attributes might not be available on the header, but if they
        // are, we must include them in the minimal header content
        ['elapsed_ms', 'cqp', 'ppid', 'pcid'].forEach(function (attr) {
            if (header[attr]) {
                minimalObj[attr] = header[attr];
            }
        });

        // if even minimal is bigger than the limit, don't log anything
        if (encode(minimalObj).length >= MAX_LENGTH) {
            return {};
        }

        // truncation is based on stack, if there's no stack, just log the minimal object
        if (!Array.isArray(header.stack)) {
            return minimalObj;
        }

        var truncated = simpleDeepCopy(header);

        // replace all fk constraints with their RID
        // if RID is not available on even one fk, we will not replacing any of RIDs
        // and go to the next step.
        var noRID = false;
        truncated.stack.forEach(function (stackEl) {
            if (noRID) return;

            // filters
            if (stackEl.filters && Array.isArray(stackEl.filters.and)) {
                stackEl.filters.and.forEach(function (facet) {
                    if (noRID) return;

                    if (Array.isArray(facet[shorter.source])) {
                        noRID = !replaceConstraintWithRID(facet[shorter.source]);
                    }
                });
            }

            // sources
            if (stackEl.source && Array.isArray(stackEl.source)) {
                noRID = !replaceConstraintWithRID(stackEl.source);
            }
        });

        if (noRID) {
            truncated = simpleDeepCopy(header);
        } else {
            res = encode(truncated);
            if (res.length < MAX_LENGTH) {
            return res;
        }
        }

        // replace choices, ranges, search with number of values
        truncated.stack.forEach(function (stackEl) {
            if (stackEl.filters && Array.isArray(stackEl.filters.and)) {
                stackEl.filters.and.forEach(function (facet) {
                    [shorter.choices, shorter.ranges, shorter.search].forEach(function (k) {
                        facet[k] = Array.isArray(facet[k]) ? facet[k].length : 1;
                    });
                });
            }
        });

        res = encode(truncated);
        if (res.length < MAX_LENGTH) {
            return res;
        }

        // replace all filters.and with the number of filters
        truncated.stack.forEach(function (stackEl) {
            if (stackEl.filters && Array.isArray(stackEl.filters.and)) {
                stackEl.filters.and = stackEl.filters.and.length;
            }
        });

        res = encode(truncated);
        if (res.length < MAX_LENGTH) {
            return res;
        }

        // replace all source paths with the number of path nodes
        truncated.stack.forEach(function (stackEl) {
            if (stackEl.source) {
                stackEl.source = Array.isArray(stackEl.source) ? stackEl.source.length : 1;
            }
        });

        res = encode(truncated);
        if (res.length < MAX_LENGTH) {
            return res;
        }

        // replace stack with the number of elements
        truncated.stack = truncated.stack.length;

        res = encode(truncated);
        if (res.length < MAX_LENGTH) {
            return res;
        }

        // if none of the truncation works, just return the minimal obj
        return encode(minimalObj);
    };
        