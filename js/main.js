/**
 * @namespace ERMrest
 * @desc
 * The ERMrest module is a JavaScript client library for the ERMrest 
 * service.
 *
 * IMPORTANT NOTE: This contents of this source file are a work in progress.
 * It is likely to change several times before we have an interface we wish
 * to use for ERMrest JavaScript agents.
 */
var ERMrest = (function () {

    /**
     * @var
     * @private
     */
    var module = {};

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} url URL of the service.
     * @param {Object} header HTTP header attributes.
     * @desc
     * Represents the ERMrest service endpoint. This is completely TBD. There
     * will be bootstrapping the connection, figuring out what credentials are
     * even needed, then how to establish those credentials etc. This may not
     * even be the right place to do this. There may be some other class needed
     * represent all of that etc.
     */
    module.service = function(url, header) {
        return new Service(url, header);
    };
    function Service(url, header) { this.url = url; }

    /** 
     * @var
     * @desc
     * The URL of the ERMrest service.
     */
    Service.prototype.url = undefined;

    /** 
     * @var
     * @desc
     * The attributes to use in the HTTP Head of HTTP requests to the service.
     */
    Service.prototype.header = undefined;

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
        this.props = undefined;
        this.model = undefined;
    }

    /** 
     * @var 
     * @desc Identifier of the Catalog.
     */
    Catalog.prototype.id = undefined;

    /**
     * @var
     * @desc Properties of the catalog. In ERMrest, we currently provide access
     * to these under the "meta" API. But we've talked of changing that to a 
     * different term like "properties" or "props".
     */
    Catalog.prototype.props = undefined;

    /**
     * @var
     * @desc The introspected data model of the Catalog or undefined. TBD This
     * may be something that looks like a dictionary of Schema objects.
     *
     * ```javascript
     *   { schema_name: schema_object ...}
     * ```
     */
    Catalog.prototype.model = undefined;

    /**
     * @function
     * @return Promise Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, the
     * Catalog's details will be defined (i.e., it's model and props).
     */
    Catalog.prototype.get = function () {};

    /**
     * @function
     * @return Promise Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, the 
     * Catalog will be removed **from the Server** and **all data will be
     * permanently removed**.
     */
    Catalog.prototype.remove = function () {};

    /**
     * @function
     * @return Promise Returns a Promise.
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
    Schema.prototype.name = undefined;

    /**
     * @var
     * @desc TBD, likely something that looks like a dictionary.
     *
     * ```javascript
     *   { table_name: table_object ...}
     * ```
     */
    Schema.prototype.tables = undefined;

    /**
     * @function
     * @return Promise Returns a Promise.
     * @desc
     * Asynchronous function that attempts to create a new Schema.
     */
    Schema.prototype.create = function () {};

    /**
     * @function
     * @return Promise Returns a Promise.
     * @desc
     * Asynchronous function that attempts to remove a Schema from the Catalog.
     * IMPORTANT: If successful, the Schema and **all** data in it will be 
     * removed from the Catalog.
     */
    Schema.prototype.remove = function () {};

    return module;
})();
