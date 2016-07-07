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

var ERMrest = (function(module) {

    /**
     * @memberof ERMrest
     * @function
     * @param {String} uri A `URI` to a resource in an ERMrest service.
     * @return {Promise} Promise when resolved passes the
     * {@link ERMrest.Reference} object. If rejected, passes one of:
     * {@link ERMrest.Errors.TimedOutError},
     * {@link ERMrest.Errors.InternalServerError},
     * {@link ERMrest.Errors.ServiceUnavailableError},
     * {@link ERMrest.Errors.Conflict, {@link ERMrest.Errors.ForbiddenError},
     * or {@link ERMrest.Errors.Unauthorized}
     * @throws {ERMrest.Errors.MalformedURI} if the input URI is malformed.
     * ...other exceptions to be documented...
     * @desc This function resolves a URI reference to a {@link ERMrest.Reference}
     * object. It validates the syntax of the URI and validates that the references
     * to model elements in it. This function makes a call to the ERMrest server
     * in order to get the `schema` resource which it uses in the validation of
     * the URI reference.
     */
    module.resolve = function(uri) {
        // parse the uri; validating its syntax here
        // make a uri to the catalog schema resource
        // get the catalog/N/schema
        // validate the model references in the `uri` parameter
        // this method needs to internally construct a reference object that
        // represents the `uri` parameter
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @desc The constructor of the `Reference` object.
     */
    function Reference() {

    }

    Reference.prototype = {
        constructor: Reference,

        /**
         * @type {Object}
         * @desc Statically defined "modes" to contextualize the reference.
         */
        mode: {
            view: "view",
            edit: "edit"
        },

        /**
         * @type {Boolean}
         * @desc A Boolean value that indicates whether this Reference is
         * _inherently_ unique. Meaning, that it can only refere to a single
         * data element, like a single row. This is determined based on whether
         * the reference filters on a unique key.
         */
        get isUnique: function() {
            return undefined;
        },

        /**
         * @param {ERMrest.Reference.mode} Indicates the contextual mode that
         * the client wants to switch into.
         * @returns {ERMrest.Reference} A contextualized reference object, which
         * is a copy of _this_ reference object. The _contextualized_ reference
         * will behave and reflect state according to the mode. For instance,
         * in a "view" mode on a table, some columns may be hidden.
         */
        contextualize: function(mode) {
            // - ideally we use copy-on-write style of copy here
            var ref = _referenceCopy(this);
            // - may need to reprocess the annotations according to the
            //   contextual mode
            return ref;
        }
    }

    /**
     * @private
     * @function
     * @param {ERMrest.Reference} source The source reference to be copied.
     * @returns {ERMrest.Reference} The copy of the reference object.
     * @desc This is a private function that makes a copy of a reference object.
     */
    function _referenceCopy(source) {
        // make a (copy-on-write) copy of the source reference
        return source; // TODO
    }

    return module;

}(ERMrest || {}));
