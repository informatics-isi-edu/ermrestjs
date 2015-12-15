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
    var module = { client: client };

    /**
     * @memberof ERMrest
     * @function
     * @param {Object} http Angular $http service object
     * @param {String} uri URI of the ERMrest service.
     * @param {Object} credentials Credentials object (TBD)
     * @return {Client} Returns a new ERMrest.Client instance.
     * @desc
     * ERMrest client factory creates ERMrest.Client instances.
     */
    function createClient(http, uri, credentials) {
        return new Client(http, uri, credentials);
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Object} http Angular $http service object
     * @param {String} uri URI of the client.
     * @param {Object} credentials TBD credentials object
     * @desc
     * Represents the ERMrest client endpoint. This is completely TBD. There
     * will be bootstrapping the connection, figuring out what credentials are
     * even needed, then how to establish those credentials etc. This may not
     * even be the right place to do this. There may be some other class needed
     * represent all of that etc.
     */
    function Client(http, uri, credentials) {
        if (http === undefined || http === null)
            throw "http undefined or null"
        if (uri === undefined || uri === null)
            throw "URI undefined or null";
        this.http = http;
        this.uri = uri;
        this.credentials = credentials;
    }

    /** 
     * @var
     * @desc
     * Instance of Angular $http service.
     */
    Client.prototype.http = null;

    /** 
     * @var
     * @desc
     * The URI of the ERMrest service.
     */
    Client.prototype.uri = null;

    /**
     * @function
     * @param {String} id Identifier of a catalog within the context of a
     * client connection to an ERMrest service.
     * @desc
     * Returns an interface to a Catalog object representing the catalog
     * resource on the service.
     *
     * TBD: should this return immediately, without validating that the
     * catalog exists on the server?
     */
    Client.prototype.lookupCatalog = function (id) {
        if (id === undefined || id === null)
            throw "ID is undefined or nul";
        return new Catalog(this, id); 
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Client} client The ERMrest.Client connection.
     * @param {String} id Identifier of a catalog within the context of a
     * service.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog (client, id) {
        this.client = client;
        this.uri = client.uri + "/catalog/" + id;
        this.id = id;
    }

    /** 
     * @var 
     * @desc Identifier of the Catalog.
     */
    Catalog.prototype.id = null;

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, 
     * it gets the schemas of the catalog.
     */
    Catalog.prototype.getSchemas = function () {
        // TODO this needs to process the results not just return raw json to client.
        return this.client.http.get(this.uri_ + "/schema");
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog The catalog the schema belongs to.
     * @param {String} name The name of the schema.
     * @desc
     * Constructor for the Schema.
     */
    function Schema(catalog, name) {
        this.catalog = catalog;
        this.name = name;
    }

    /**
     * @var
     * @desc The name of the schema.
     */
    Schema.prototype.name = null;

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
    Schema.prototype.lookupTable = function (name) {
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
        this.schema = schema;
        this.name = name;
        this.cols = null;
        this.keys = null;
        this.annotations = null;
    }

    /**
     * @var
     * @desc The name of the table.
     */
    Table.prototype.name = null;

    /**
     * @var
     * @desc list of column definitions.
     */
    Table.prototype.cols = null;

    /**
     * @var
     * @desc list of keys of the table.
     */
    Table.prototype.keys = null;

    /**
     * @var
     * @desc a list or dictionary of annotation objects.
     */
    Table.prototype.annotations = null;

    /**
     * @private
     * @var http
     * @desc
     * This is a small utility of http routines that promisify XMLHttpRequest.
     */
    var http = {

        /**
         * @private
         * @function
         * @param {String} url Location of the resource.
         * @return {Promise} Returns a promise object.
         * @desc
         * Gets a representation of the resource at 'url'. This function treats
         * only HTTP 200 as a successful response.
         */
        get: function (url) {

            return new Promise( function( resolve, reject ) {
                var err;
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    // debug statements (to be removed)
                    //console.log("readyState == " + xhr.readyState);
                    //console.log("status == " + xhr.status);
                    //console.log("response == " + xhr.responseText);
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(xhr.responseText);
                        }
                        else if (xhr.status === 0) {
                            err = Error("Network error");
                            err.status = 0;
                            reject(err);
                        }
                        else {
                            err = Error(xhr.responseText);
                            err.status = xhr.status;
                            reject(err);
                        }
                    }
                };
                xhr.open('GET', url);
                xhr.setRequestHeader("Accept", "application/json");
                xhr.send();
            });
        }
    };

    return module;
})();

