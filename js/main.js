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

/**
 * @namespace ERMrest
 * @desc
 * The ERMrest module is a JavaScript client library for the ERMrest 
 * service.
 *
 * IMPORTANT NOTE: This module is a work in progress.
 * It is likely to change several times before we have an interface we wish
 * to use for ERMrest JavaScript agents.
 */
var ERMrest = (function () {

    /**
     * @var
     * @private
     * @desc This is the state of the module.
     */
    var module = { service: service };

    /**
     * @memberof ERMrest
     * @function
     * @param {Service} url URL of the service.
     * @param {Object} credentials TBD credentials object
     * @return {Service} Returns a new Catalog.Service instance.
     * @desc
     * See Catalog.Service.
     */
    function service(url, credentials) {
        return new Service(url, credentials);
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} url URL of the service.
     * @param {Object} credentials TBD credentials object
     * @desc
     * Represents the ERMrest service endpoint. This is completely TBD. There
     * will be bootstrapping the connection, figuring out what credentials are
     * even needed, then how to establish those credentials etc. This may not
     * even be the right place to do this. There may be some other class needed
     * represent all of that etc.
     */
    function Service(url, credentials) {
        this.url = url;
        this.credentials = credentials;
    }

    /** 
     * @var
     * @desc
     * The URL of the Service.
     */
    Service.prototype.url = null;

    /**
     * @function
     * @param {String} id Identifier of a catalog within the context of a
     * service.
     * @desc
     * Returns an interface to a catalog resource located on this service.
     * This function returns immediately, and it does not validate that the
     * catalog exists.
     */
    Service.prototype.catalog = function (id) { 
        return new Catalog(this, id); 
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Service} service The ERMrest.Service this Catalog belongs to.
     * @param {String} id Identifier of a catalog within the context of a
     * service.
     * @desc
     * The hidden constructor for the Catalog. In the object model, it 
     * represents an ERMrest Catalog.
     */
    function Catalog (service, id) {
        this.service_ = service;
        this.id = id;
        this.props = null;
        this.model = null;
    }

    /** 
     * @var 
     * @desc Identifier of the Catalog.
     */
    Catalog.prototype.id = null;

    /**
     * @var
     * @desc Properties of the catalog.
     *
     * In ERMrest, we currently provide access to these under the "meta" API.
     * But we've talked of changing that to a different term like "properties"
     * or "props".
     */
    Catalog.prototype.props = null;

    /**
     * @var
     * @desc The introspected data model of the Catalog or null. TBD This
     * may be something that looks like a dictionary of Schema objects.
     *
     * ```javascript
     *   { schema_name: schema_object ...}
     * ```
     */
    Catalog.prototype.model = null;

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, the
     * Catalog's details will be defined (i.e., it's model and props).
     */
    Catalog.prototype.get = function () {};

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, the 
     * Catalog will be removed **from the Server** and **all data will be
     * permanently removed**.
     */
    Catalog.prototype.remove = function () {};

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, the 
     * Catalog will be created. TBD: should its state (model, props,...) also
     * be defined?
     */
    Catalog.prototype.create = function () {};

    /**
     * @function
     * @param {String} name The name of the schema.
     * @desc
     * Returns a new instance of a Schema object. The Schema may not be
     * bound to a real resource. The most likely (TBD only?) reason to
     * use this method is to create an unbound Schema object that can
     * be used to create a new schema. Clients should get Schema objects
     * from the Catalog.model.
     */
    Catalog.prototype.schema = function (name) {
        return new Schema(this, name);
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog The catalog the schema belongs to.
     * @param {String} name The name of the schema.
     * @desc
     * Creates an instance of the Schema object.
     */
    function Schema(catalog, name) {
        this.catalog_ = catalog;
        this.name = name;
    }

    /**
     * @var
     * @desc The name of the schema.
     */
    Schema.prototype.name = null;

    /**
     * @var
     * @desc TBD, likely something that looks like a dictionary.
     *
     * ```javascript
     *   { table_name: table_object ...}
     * ```
     */
    Schema.prototype.tables = null;

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * Asynchronous function that attempts to create a new Schema.
     */
    Schema.prototype.create = function () {};

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * Asynchronous function that attempts to remove a Schema from the Catalog.
     * IMPORTANT: If successful, the Schema and **all** data in it will be 
     * removed from the Catalog.
     */
    Schema.prototype.remove = function () {};

    /**
     * @function
     * @param {String} name The name of the table.
     * @desc
     * Returns a new instance of a Table object. The Table may not be
     * bound to a real resource. The most likely (TBD only?) reason to
     * use this method is to create an unbound Table object that can
     * be used to create a new table. Clients should get Table objects
     * from the Catalog.model.
     */
    Schema.prototype.table = function (name) {
        return new Table(this, name);
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema The schema that the table belongs to.
     * @param {String} name The name of the table.
     * @desc
     * Creates an instance of the Table object.
     */
    function Table(schema, name) {
        this.schema_ = schema;
        this.name = name;
        this.cols = null;
        this.key = null;
        this.annotations = null;
    }

    /**
     * @var
     * @desc The name of the table.
     */
    Table.prototype.name = null;

    /**
     * @var
     * @desc TBD, likely something that looks like a dictionary.
     *
     * ```javascript
     *   { column_name: column_object ...}
     * ```
     */
    Table.prototype.cols = null;

    /**
     * @var
     * @desc an ordered list of columns (or column names?) that make up the key.
     *
     * ```javascript
     *   [ column+ ]
     * ```
     */
    Table.prototype.key = null;

    /**
     * @var
     * @desc a list or dictionary of annotation objects
     */
    Table.prototype.annotations = null;

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * Asynchronous function that attempts to create a new Table.
     */
    Table.prototype.create = function () {};

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * Asynchronous function that attempts to remove a Table from the Catalog.
     * IMPORTANT: If successful, the Table and **all** data in it will be 
     * removed from the Catalog.
     */
    Table.prototype.remove = function () {};

    return module;
})();
