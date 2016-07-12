/*
 * Copyright 2016 University of Southern California
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
     * This function resolves a URI reference to a {@link ERMrest.Reference} 
     * object. It validates the syntax of the URI and validates that the 
     * references to model elements in it are correct. This function makes a 
     * call to the ERMrest server in order to get the `schema` which it uses to
     * validate the URI path.
     * @memberof ERMrest
     * @function resolve
     * @param {!string} uri A `URI` to a resource in an ERMrest service.
     * @return {Promise} Promise when resolved passes the
     * {@link ERMrest.Reference} object. If rejected, passes one of:
     * {@link ERMrest.MalformedURIError}
     * {@link ERMrest.TimedOutError},
     * {@link ERMrest.InternalServerError},
     * {@link ERMrest.ConflictError},
     * {@link ERMrest.ForbiddenError},
     * {@link ERMrest.Unauthorized},
     * {@link ERMrest.NotFoundError},
     */
    module.resolve = function(uri) {
        // TODO
        // parse the uri; validating its syntax here
        //  if invalid syntax; reject with malformed uri error
        // make a uri to the catalog schema resource
        // get the catalog/N/schema
        // validate the model references in the `uri` parameter
        // this method needs to internally construct a reference object that
        // represents the `uri` parameter
        return notimplemented();
    };

    /**
     * Returns a rejected promise with a reason set to an `Error` object
     * with the message 'not implemented'.
     * @memberof ERMrest
     * @private
     * @function notimplemented
     * @returns {Promise} the rejected promise
     */
    function notimplemented() {
        return module._q.reject(new Error('not implemented'));
    }

    /**
     * Constructs a Reference object.
     *
     * For most uses, maybe all, of the `ermrestjs` library, the Reference
     * will be the main object that the client will interact with. References
     * are immutable objects and therefore can be safely passed around and
     * used between multiple client components without risk that the underlying
     * reference to server-side resources could change.
     * @memberof ERMrest
     * @class
     * @param {!string} uri The `URI` for this reference.
     */
    function Reference(uri) {
        this._uri = uri;
        // TODO
        // The reference will also need a reference to the catalog or a 
        // way to get a refernece to the catalog
    }

    Reference.prototype = {
        constructor: Reference,

        /**
         * The string form of the `URI` for this reference.
         * @type {string}
         */
        get uri() {
            return this._uri;
        },

        /**
         * The array of column definitions which represent the model of
         * the resources accessible via this reference.
         *
         * _Note_: in database jargon, technically everything returned from 
         * ERMrest is a 'tuple' or a 'relation'. A tuple consists of attributes
         * and the definitions of those attributes are represented here as the
         * array of {@link ERMrest.Column}s. The column definitions may be
         * contextualized (see {@link ERMrest.Reference#contextualize}).
         * @type {ERMrest.Column[]}
         */
        columns: null,

        /**
         * A Boolean value that indicates whether this Reference is _inherently_
         * unique. Meaning, that it can only refere to a single data element, 
         * like a single row. This is determined based on whether the reference 
         * filters on a unique key.
         *
         * As a simple example, the following would make a unique reference:
         * 
         * ```
         * https://example.org/ermrest/catalog/42/entity/s1:t1/key=123
         * ```
         *
         * Assuming that table `s1:t1` has a `UNIQUE NOT NULL` constraint on
         * column `key`. Such a unique reference can return `0` or `1` results.
         *
         * _Note_: we intend to support other semantic checks on references like
         * `isUnconstrained`, `isFiltered`, etc.
         * @type {boolean}
         */
        get isUnique() {
            /* This getter should determine whether the reference is unique
             * on-demand.
             */
            return undefined; // TODO
        },

        /**
         * The members of this object are _contextualized references_.
         *
         * These references will behave and reflect state according to the mode.
         * For instance, in a `view` mode on a table some columns may be hidden.
         *
         * Usage example:
         * ```
         * // ...we already have an uncontextualized reference "ref"
         * var viewRef = ref.contextualize.view;
         * // ref is unchanged
         * // viewRef now has a reconfigured reference
         * // for e.g., viewRef.columns may look different from ref.columns
         * ```
         */
        contextualize: {
            /* TODO: you'll need to figure out how to allow the following 
             * getters to have access to `this` with respect to the Refernece
             * object not the nested contextualize object. A simple test can be
             * done. The brute force way would be to introduce a `Contextualize`
             * class that gets instantiated. Or a better less brute force way
             * would be to have another lazy getter for the contextualize
             * property.
             */

            /**
             * The _view_ context of this reference.
             * @type {ERMrest.Reference}
             */
            get view() {
                // TODO: remember these are copies of this reference.
                return undefined;
            },

            /**
             * The _edit_ context of this reference.
             * @type {ERMrest.Reference}
             */
            get edit() {
                // TODO: remember these are copies of this reference.
                return undefined;
            }
        },

        /**
         * Indicates whether the client has the permission to _create_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canCreate() {
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _read_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canRead() {
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _update_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canUpdate() {
            return undefined;
        },

        /**
         * Indicates whether the client has the permission to _delete_
         * the referenced resource(s). In some cases, this permission cannot
         * be determined and the value will be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canDelete() {
            return undefined;
        },

        /**
         * Creates a set of resources.
         * @param {!Array} tbd TBD parameters. Probably an array of tuples
         * [ {tuple},... ] for all entities to be created.
         * @returns {Promise} A promise for a TBD result.
         */
        create: function(tbd) {
            return notimplemented();
        },

        /**
         * Reads the referenced resources.
         * @param {!number} limit The limit of results to be returned by the
         * read request. __required__
         * @returns {Promise} A promise for a {@link ERMrest.Page} of results,
         * or
         * {@link ERMrest.InvalidInputError} if `limit` is invalid,
         * TODO document other errors here.
         */
        read: function(limit) {
            var defer = module._q.defer();
            if (limit === undefined) {
                defer.reject(
                    new ERMrest.InvalidInputError("'limit' must be specified"));
            } else if (typeof(limit) != 'number') {
                defer.reject(
                    new ERMrest.InvalidInputError("'limit' must be a number"));
            } else if (limit < 1) {
                defer.reject(
                    new ERMrest.InvalidInputError("'limit' must be greater than 0"));
            }
            // TODO the real stuff goes here
            // this can probably be direct calls to the module._http
            // I do not think we need to re-use the current ...entity.get(...)
            // methods implemented in the other scripts
            return defer.promise;
        },

        /**
         * Updates a set of resources.
         * @param {!Array} tbd TBD parameters. Probably an array of pairs of
         * [ (keys+values, allvalues)]+ ] for all entities to be updated.
         * @returns {Promise} A promise for a TBD result or errors.
         */
        update: function(tbd) {
            return notimplemented();
        },

        /**
         * Deletes the referenced resources.
         *
         * Note that `delete` is a JavaScript keyword. We could consider 
         * changing it to `del` but there is probably no harm is leaving it as
         * `delete`.
         * @returns {Promise} A promise for a TBD result or errors.
         */
        delete: function() {
            return notimplemented();
        },

        /**
         * The "related" references. Relationships are defined by foreign key
         * references between {@link ERMrest.Table}s. Those references can be
         * considered "outbound" where the table has FKRs to other entities or
         * "inbound" where other entities have FKRs to this entity. Finally,
         * entities can be "associated" by means of associative entities. Those
         * are entities in another table that establish _many-to-many_ 
         * relationships between entities. If this help `A <- B -> C` where
         * entities in `B` establish relationships between entities in `A` and
         * `C`. Thus entities in `A` and `C` may be associated and we may
         * ignore `B` and think of this relationship as `A <-> C`, unless `B`
         * has other moderating attributes, for instance that indicate the 
         * `type` of relationship, but this is a model-depenent detail.
         *
         * _Note_: Initially, this will only reflect relationships based on
         * "inbound" references.
         * @type {ERMrest.Reference[]}
         */
        get relatedReferences() {
            if (this._relatedReferences === undefined) {
                this._relatedReferences = [];
                /* TODO
                 * Assuming this reference is to a table, introspect the
                 * model to find all "inbound" FK references to the table.
                 * For each such FK reference, create a Reference object.
                 * The new Reference object may be a copy of this reference.
                 * Conceptually, if you think of the ERMrest URL the
                 * refernece is an extension of the current URL path.
                 * Assume something that might look like this: 
                 *  `A/B/b=123/C`
                 * After finding incoming references from `D` to `C` the
                 * corresponding related reference might look something like
                 * this:
                 *  `A/B/b=123/C/(fkeys:D)`
                 * Note that we need to use the explicit `/(fkeys:D)` rather
                 * than the simpler implicit `/D` form of joining so that
                 * we handle cases where there are more than one FK reference
                 * from `D` to `C` in this example.
                 */
            }
            return this._relatedReferences;
        }
    };

    /**
     * This is a private function that makes a copy of a reference object.
     * @memberof ERMrest
     * @private
     * @param {!ERMrest.Reference} source The source reference to be copied.
     * @returns {ERMrest.Reference} The copy of the reference object.
     */
    function _referenceCopy(source) {
        // TODO: make a (copy-on-write) copy of the source reference
        return source; // TODO
    }


    /**
     * Constructs a new Page. A _page_ represents a set of results returned from
     * ERMrest. It may not represent the complete set of results. There is an
     * iterator pattern used here, where its {@link ERMrest.Page#previous} and
     * {@link ERMrest.Page#next} properties will give the client a 
     * {@link ERMrest.Reference} to the previous and next set of results, 
     * respectively.
     * @memberof ERMrest
     * @class
     * @param {!ERMrest.Reference} reference The reference object from which
     * this data was acquired.
     * @param {!Object[]} data The data returned from ERMrest.
     */
    function Page(reference, data) {
        this._ref = reference;
        this._data = data;
    }

    Page.prototype = {
        constructor: Page,

        /**
         * An array of processed tuples. The results will be processed
         * according to the contextualized scheme (model) of this reference.
         * @type {ERMrest.Tuple[]}
         */
        get tuples() {
            if (this._tuple === undefined) {
                for (var i=0, len=page._data.length; i<len; i++) {
                    page._tuple[i] = new Tuple(page._ref, page._data[i]);
                }
            }
            return this._tuple;
        },

        /**
         * A reference to the previous set of results.
         * @type {ERMrest.Reference}
         */
        get previous() {
            // TODO: a reference to previous entity set
            return undefined;
        },

        /**
         * A reference to the next set of results.
         * @type {ERMrest.Reference}
         */
        get next() {
            // TODO: a reference to next entity set
            return undefined;
        }
    };


    /**
     * Constructs a new Tuple. In database jargon, a tuple is a row in a 
     * relation. This object represents a row returned by a query to ERMrest.
     * @memberof ERMrest
     * @class
     * @param {!ERMrest.Reference} reference The reference object from which
     * this data was acquired.
     * @param {!Object} data The unprocessed tuple of data returned from ERMrest.
     */
    function Tuple(reference, data) {
        this._ref = reference;
        this._data = data;
    }

    Tuple.prototype = {
        constructor: Tuple,

        /**
         * Indicates whether the client can update this tuple. Because
         * some policies may be undecidable until query execution, this
         * property may also be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canUpdate() {
            return undefined;
        },

        /**
         * Indicates whether the client can delete this tuple. Because
         * some policies may be undecidable until query execution, this
         * property may also be `undefined`.
         * @type {(boolean|undefined)}
         */
        get canDelete() {
            return undefined;
        },

        /**
         * Attempts to update this tuple. This is a server side transaction,
         * and therefore an asynchronous operation that returns a promise.
         * @returns {Promise} a promise (TBD the result object)
         */
        update: function() {
            // TODO
            // - since we only support updates on "simple paths" that are just
            //   entity references with no joins, we can first validate that
            //   this tuple represents a row from a single table, and then
            //   we may need to create a reference to that table
            // - then, we can go back and call that reference
            //   `return entity_reference.update(...);`
            return notimplemented();
        },

        /**
         * Attempts to delete this tuple. This is a server side transaction,
         * and therefore an asynchronous operation that returns a promise.
         * @returns {Promise} a promise (TBD the result object)
         */
        delete: function() {
            // TODO
            // - create a new reference by taking this._ref and adding filters
            //   based on keys for this tuple
            // - then call the delete on that reference
            //   `return tuple_ref.delete();`
            return notimplemented();
        },

        /**
         * The array of formatted values of this tuple. The ordering of the 
         * values in the array matches the ordering of the columns in the 
         * reference (see {@link ERMrest.Reference#columns}).
         *
         * Example of looping through all the values in all the tuples in a 
         * page of results:
         * ```
         * for (var i=0; i<ref.columns.length; i++) {
         *   console.log("this tuple's", ref.columns[i].name, "column has value", tuple.values[i]);
         *   ...
         * }
         * ```
         *
         * Example of getting a specific value for a prefetched column by its
         * position:
         * ```
         * console.log("this tuple's", col.name, "column has value", tuple.values[col.position]);
         * ```
         * @type {string[]}
         */
        get values() {
            if (this._values === undefined) {
                this._values = [];
                for (var i=0; i<this._ref.columns.length; i++) {
                    var col = reference.columns[i];
                    this._values[i] = col.formatvalue(this._data[col.name]);
                }
            }
            return this._values;
        },

        /**
         * The _disaply name_ of this tuple. For example, if this tuple is a
         * row from a table, then the display name is defined by the heuristic
         * or the annotation for the _row name_.
         *
         * TODO: add a @link to the ermrest row name annotation
         * @type {string}
         */
        get displayname() {
            // TODO do this on demand
            return undefined;
        }
    };


    return module;

}(ERMrest || {}));
