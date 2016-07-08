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
     * references to model elements in it. This function makes a call to the 
     * ERMrest server in order to get the `schema` resource which it uses in the
     * validation of the URI reference.
     * @memberof ERMrest
     * @function resolve
     * @param {!string} uri A `URI` to a resource in an ERMrest service.
     * @return {Promise} Promise when resolved passes the
     * {@link ERMrest.Reference} object. If rejected, passes one of:
     * {@link ERMrest.Errors.TimedOutError},
     * {@link ERMrest.Errors.InternalServerError},
     * {@link ERMrest.Errors.ServiceUnavailableError},
     * {@link ERMrest.Errors.Conflict, {@link ERMrest.Errors.ForbiddenError},
     * or {@link ERMrest.Errors.Unauthorized}
     * @throws {ERMrest.Errors.MalformedURIError} if the input URI is malformed.
     */
    module.resolve = function(uri) {
        // parse the uri; validating its syntax here
        //  if invalid syntax; throw malformed uri error
        // make a uri to the catalog schema resource
        // get the catalog/N/schema
        // validate the model references in the `uri` parameter
        // this method needs to internally construct a reference object that
        // represents the `uri` parameter
        return undefined; // this will probably return a promise that was
                          // returned from the module._http calls
    };

    /**
     * Constructs a Reference object.
     * @memberof ERMrest
     * @class
     * @param {!string} uri The `URI` for this reference.
     */
    function Reference(uri) {
        this._uri = uri;
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
         * The model element for this reference. 
         *
         * _Note_: everything returned from ERMrest is a 'tuple' or a 'relation'
         * and the `model` property here is therefore the model of that tuple.
         * In the simplest cases, the refernece is to an entity or set of 
         * entities, therefore they can be described by a {@link ERMrest.Table}.
         * Other types of tuples, like a projection of columns using the
         * `attribute/` interface, are not described by a particular table 
         * definition. We may need to introduce a `Relation` element to the
         * model objects to cover the non-table cases.
         * @type {(ERMrest.Table|Object)}
         */
        model: null,

        /**
         * Statically defined "modes" to contextualize the reference.
         * This object should be used like an enumeration type as a parameter
         * to the contextualize function.
         * @type {Object}
         */
        mode: {
            /**
             * Use to specify "view" mode context.
             */
            view: "view",
            /**
             * Use to specify "edit" mode context.
             */
            edit: "edit"
        },

        /**
         * A Boolean value that indicates whether this Reference is _inherently_
         * unique. Meaning, that it can only refere to a single data element, 
         * like a single row. This is determined based on whether the reference 
         * filters on a unique key.
         * @type {boolean}
         */
        get isUnique() {
            /* This getter should determine whether the reference is unique
             * on-demand.
             */
            return; // TODO
        },

        /**
         * _Contextualizes_ a {@link ERMrest.Reference}.  The contextualized 
         * reference will behave and reflect state according to the mode. For 
         * instance, in a "view" mode on a table, some columns may be hidden.
         *
         * Usage example:
         * ```
         * var myRef2 = myRef1.contextualize(Reference.mode.view);
         * // myRef1 is unchanged
         * ```
         * @param {!ERMrest.Reference.mode} mode Indicates the desired contextual
         * mode.
         * @returns {ERMrest.Reference} A contextualized reference object, which
         * is a copy of _this_ reference object.
         */
        contextualize: function(mode) {
            // ideally we use copy-on-write style of copy here
            var ref = _referenceCopy(this);
            // may need to reprocess the annotations according to the
            // contextual mode
            return ref;
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
         * @throws {ERMrest.Errors.InvalidInputError} if `limit` is not 
         * defined or not in the valid range.
         */
        create: function(tbd) {
            return;
        },

        /**
         * Reads the references resources.
         * @param {!number} limit The limit of results to be returned by the
         * read request.
         * @returns {Promise} A promise for a {@Link ERMRest.Page} of results.
         * @throws {ERMrest.Errors.InvalidInputError} if `limit` is not 
         * defined or not in the valid range.
         */
        read: function(limit) {
            if (limit === undefined || limit <= 0) {
                throw new ERMrest.InvalidInputError();
            }
            return; // will probably return a promise from the underlying http
                    // calls
        },

        /**
         * Updates a set of resources.
         * @param {!Array} tbd TBD parameters. Probably an array of pairs of
         * [ (keys+values, allvalues)]+ ] for all entities to be updated.
         * @returns {Promise} A promise for a TBD result.
         * @throws {ERMrest.Errors.InvalidInputError} if `limit` is not 
         * defined or not in the valid range.
         */
        update: function(tbd) {
            return;
        },

        /**
         * Deletes the referenced resources.
         *
         * Note that `delete` is a JavaScript keyword. We could consider 
         * changing it to `del` but there is probably no harm is leaving it as
         * `delete`.
         * @returns {Promise} A promise for a TBD result.
         * @throws {ERMrest.Errors.InvalidInputError} if `limit` is not 
         * defined or not in the valid range.
         */
        delete: function() {
            return;
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
     * Because this method is defined withing this module's closure, it will
     * only be accessible to functions within this module.
     * @memberof ERMrest
     * @private
     * @param {!ERMrest.Reference} source The source reference to be copied.
     * @returns {ERMrest.Reference} The copy of the reference object.
     */
    function _referenceCopy(source) {
        // make a (copy-on-write) copy of the source reference
        return source; // TODO
    }


    /**
     * Constructs a new Page.
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
         * An array of unprocessed tuples returned by ERMrest.
         *
         * See also {@link ERMrest.Page#tuple}.
         * @type {Object[]}
         */
        get data() {
            return this._data;
        },

        /**
         * An array of processed tuples. The results will be processed
         * according to the contextualized model element associated with this
         * page of tuples.
         *
         * See also {@link ERMrest.Page#data}.
         * @type {ERMrest.Tuple[]}
         */
        get tuple() {
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
            var ref = _referenceCopy(this);
            // TODO: modify reference to point to previous entity set
            return ref;
        },

        /**
         * A reference to the next set of results.
         * @type {ERMrest.Reference}
         */
        get next() {
            var ref = _referenceCopy(this);
            // TODO: modify reference to point to next entity set
            return ref;
        }
    };


    /**
     * Constructs a new Tuple.
     *
     * _Note_: An open question in this part of the API is whether the client
     * should change `.value[i]`s or `.data[i]` when in an edit mode. In an
     * edit mode, we might expect that the `.value[i]` is not processed for
     * display and therefore is just a shallow copy of the `.data` which should
     * not be modified by the client.
     * @memberof ERMrest
     * @class
     * @param {!ERMrest.Reference} reference The reference object from which
     * this data was acquired.
     * @param {!Object} data The unprocessed tuple of data returned from ERMrest.
     */
    function Tuple(reference, data) {
        this._ref = reference;
        this._orig = data;
        // TBD do we need a reference to the `page` also?
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
            return module._q.defer().promise;
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
            return module._q.defer().promise;
        },

        /**
         * The unprocessed tuple of data returned from ERMrest. It can be
         * treated like a map that is keyed on the column name.
         *
         * ```
         * var raw = page.tuple[i].data['column_name'];
         * ```
         * @type {Object}
         */
        get data() {
            // Do a shallow copy here because we do not want clients ever to 
            // change the original copy of data. We need to protect that copy
            // of data so that we can use it for comparison when doing an
            // update.
            if (this._data === undefined) {
                this._data = {};
                for (var key in this._orig) {
                    this._data[key] = this._orig[key];
                }
            }
            return this._data;
        },

        /**
         * The processed values of this tuple. It can be treated like a map that
         * is keyed on the column name.
         *
         * ```
         * var raw = page.tuple[i].value['column_name'];
         * ```
         * @type {Object}
         */
        get value() {
            if (this._value === undefined) {
                this._value = {};
                for (var key in this._orig) {
                    // TODO something like this...
                    //this._value[key] = this._ref.model.columns.byName(key)
                    //                    .prettyprint(this._orig[key]);
                }
            }
            return this._value;
        },

        /**
         * The logical "name" of this tuple. For example, if this tuple is a
         * row from a table, then the "name" is defined by the heuristic or
         * the annotation for the _row name_.
         * @type {string}
         */
        get name() {
            // TODO do this on demand
            return undefined;
        }
    };


    return module;

}(ERMrest || {}));
