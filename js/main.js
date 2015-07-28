/**
 * @namespace ERMrest
 * @desc The root namespace for the ERMrest library.
 */
var ERMrest = (function () {

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} URL The URL of the ERMrest service.
     * @desc
     * ERMrest Service. This class represents the service endpoint.
     */
    function Service(url) { this.url = url; }

    /** 
     * @var
     * @desc
     * The URL of the ERMrest service.
     */
    Service.prototype.url = undefined;

    /**
     * @function
     * @param {String} name The name of the catalog.
     * @desc
     * Returns an interface to a catalog resource located on this service.
     * This function returns immediately, and it does not validate that the
     * catalog exists.
     */
    Service.prototype.catalog = function (name) { 
        return new Catalog(this, name); 
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Service} service The service that this catalog belongs to.
     * @param {String} name The name of the catalog.
     * @desc
     * Creates a new instance of the Catalog object which is the interface
     * to the catalog resource.
     */
    function Catalog (service, name) {
        this.service_ = service;
        this.name = name;
    }

    /** 
     * @var 
     * @desc The name of the catalog
     */
    Catalog.prototype.name = undefined;

    /**
     * @var
     * @desc Properties of the catalog
     */
    Catalog.prototype.properties = undefined;

    /**
     * @var
     * @desc Schemata of the catalog
     */
    Catalog.prototype.schemata = undefined;

    /**
     * @function
     * @param {function} cb A callback function
     * @desc
     * Gets a representation of a Catalog resource. If successful, the 
     * object's properties will be defined by this function.
     */
    Catalog.prototype.get = function (cb) {};

    /**
     * @function
     * @param {function} cb A callback function
     * @desc
     * Removes a Catalog resource. The caller must have permission to remove 
     * Catalog. Typically, the caller must be the 'owner' of the resource.
     */
    Catalog.prototype.remove = function (cb) {};

    /**
     * @function
     * @param {String} name The name of the schema.
     * @desc
     * Returns a new instance of a Schema object. The Schema may not be
     * bound to a real resource. This object may be used to get a 
     * representation of a Schema resource, if one exists that matches 
     * the schema name passed to this function. It may also be used to
     * create a new schema, if one does not exist that matches the name
     * passed to this function.
     */
    Catalog.prototype.schema = function (name) {
        return new Schema(this, name);
    };

    /**
     * @function
     * @param {function} cb A callback function
     * @desc
     * Creates a Catalog resource. The caller must have permission to create 
     * Catalog resources on the service. If successful, the object's properties
     * will be defined by this function.
     */
    Catalog.prototype.create = function (cb) {};

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
     * @desc The name of the schema
     */
    Schema.prototype.name = undefined;

    /**
     * @var
     * @desc A dictionary of table definitions of the schema
     */
    Schema.prototype.tables = undefined;

    /**
     * @function
     * @desc
     * Gets the schema definition from the catalog.
     */
    Schema.prototype.get = function () {};

    /**
     * @function
     * @desc
     * Creates a new schema definition within the catalog.
     */
    Schema.prototype.create = function () {};

    /**
     * @function
     * @desc
     * Removes the schema definition from the catalog. *Warning*: 
     * it also removes **all** data that are associated with the
     * schema and of its tables.
     */
    Schema.prototype.remove = function () {};

    /** 
     * @member providers Available ERMrest service providers
     */
    providers_ = { rest: function (URL) { return new Service(URL); } };

    return providers_;
})();
