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
    var module = {
        configure: configure,
        clientFactory: {
            getClient: getClient
        }
    };

    /**
     * @private
     * @var _clients
     * @desc
     * Internal collection of ERMrest clients.
     */
    var _clients = {};

    /**
     * @private
     * @var _http
     * @desc
     * The http service used by this module. This is private and not
     * visible to users of the module.
     */
    var _http = null;

    /**
     * @memberof ERMrest
     * @function
     * @param {Object} http Angular $http service object
     * @desc
     * This function is used to configure the module.
     * The module expects the http service to implement the
     * interface defined by the AngularJS 1.x $http service.
     */
    function configure(http) {
        _http = http;
    }

    /**
     * @memberof ERMrest
     * @function
     * @param {String} uri URI of the ERMrest service.
     * @param {Object} credentials Credentials object (TBD)
     * @return {Client} Returns a new ERMrest.Client instance.
     * @desc
     * ERMrest client factory creates or reuses ERMrest.Client instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getClient(uri, credentials) {
        cli = _clients[uri];
        if (! cli) {
            cli = new Client(uri, credentials);
            _clients[uri] = cli;
        }
        return cli;
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} uri URI of the client.
     * @param {Object} credentials TBD credentials object
     * @desc
     * Represents the ERMrest client endpoint. This is completely TBD. There
     * will be bootstrapping the connection, figuring out what credentials are
     * even needed, then how to establish those credentials etc. This may not
     * even be the right place to do this. There may be some other class needed
     * represent all of that etc.
     */
    function Client(uri, credentials) {
        if (uri === undefined || uri === null)
            throw "URI undefined or null";
        this.uri = uri;
        this.credentials = credentials;
    }

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
     */
    Client.prototype.getCatalog = function (id) {
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
        this.catalogID = id;
        this._uri = client.uri + "/catalog/" + id;
        this._schemas = null; // consider this "private"
    }

    /**
     * @var
     * @desc Identifier of the Catalog.
     */
    Catalog.prototype.catalogID = null;

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, it gets the
     * schemas of the catalog. This method should be called at least on the
     * catalog object before using the rest of its methods.
     */
    Catalog.prototype.introspect = function () {
        // TODO this needs to process the results not just return raw json to client.
        // This method should:
        //   1. make the http call to get the schemas.
        //   2. do any processing it needs to do on the raw json returned by server
        //   3. save a copy of the schemas in this._schemas
        //   4. then return the schemas via the promise
        return _http.get(this._uri + "/schema").then(function(response) {
            return response.data;
        });
    };

    /**
     * @function
     * @return {Object} Returns a dictionary of schemas.
     * @desc
     * A synchronous method that returns immediately.
     */
    Catalog.prototype.getSchemas = function () {
        return this._schemas;
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog The catalog the schema belongs to.
     * @param {Object} jsonSchema The raw json Schema returned by ERMrest.
     * @desc
     * Constructor for the Schema.
     */
    function Schema(catalog, jsonSchema) {
        this.catalog = catalog;
        this._uri = catalog._uri + "TODO";
        this.name = null; // get the name out of the json
        this._tables = {}; // dictionary of tables, keyed on table name
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
     * Returns a table from the schema.
     */
    Schema.prototype.getTable = function (name) {
        return this._table[name];
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema The schema that the table belongs to.
     * @param {Object} jsonTable The raw json of the table returned by ERMrest.
     * @desc
     * Creates an instance of the Table object.
     */
    function Table(schema, jsonTable) {
        this._schema = schema;
        this._uri = schema._uri + "TODO";
        this.name = ""; // get name out of json
        this.columns = null; // get from json
        this.keys = null; // get from json
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
    Table.prototype.columns = null;

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
     * @function
     * @param {Object} table The base table.
     * @param {Object} fitlers The filters.
     * @return {Object} a filtered table instance.
     * @desc
     * Returns a filtered table based on this table.
     */
    Table.prototype.getFilteredTable = function (table, filters) {
        // TODO create filtered table here
        return null;
    };

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, it gets the
     * rows for this table.
     */
    Table.prototype.getRows = function () {
        // TODO this needs to process the results not just return raw json to client.
        return null; // TODO
    };

    return module;
})();
