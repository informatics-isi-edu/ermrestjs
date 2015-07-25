/**
 * The root namespace for the ERMrest library.
 * @namespace ermrest
 */
var ermrest = (function () {

    /**
     * ERMrest Service Provider. This is a stub. An example implementation
     * of the ServiceProvider is the RestServiceProvider which implements the
     * ERMrest "REST" style protocol.
     *
     * @constructor
     * @this {ServiceProvider}
     * @memberof ermrest
     */
    ServiceProvider = function() {};

    /**
     * An ERMrest service endpoint. This is a stub. An example implementation
     * of the ServiceEndpoint is the RestServiceEndpoint which implements the
     * state of a connection to an ERMrest service.
     *
     * @constructor
     * @this {ServiceEndpoint}
     * @memberof ermrest
     */
    ServiceEndpoint = function() {};

    /**
     * Returns a {Catalog} instance located at this {ServiceEndpoint}. This
     * function returns immediately.
     *
     * @function
     * @this {ServiceEndpoint}
     * @param {String} name The name of the catalog.
     * @param {function} statusfn The status callback function.
     */
    ServiceEndpoint.prototype.catalog = function (name) {
        return Catalog(this, name);
    };

    /**
     * Creates an instance of Catalog.
     *
     * @memberof ermrest
     * @constructor
     * @this {Catalog}
     * @param {string} name The name of the catalog
     */
    Catalog = function(endpoint, name) {
        this.endpoint = endpoint;
        this.name = name;
    };

    /**
     * Creates the Catalog.
     *
     * @function
     * @this {Catalog}
     * @param {function} status A callback function
     */
    Catalog.prototype.create = function (status) {};
    Catalog.prototype.get = function (status) {};
    Catalog.prototype.destroy = function (status) {};

    /**
     * Returns the schemas interface for this Catalog.
     *
     * @this {Catalog}
     * @return {Object} schema interface
     */
    Catalog.prototype.schema = function() {
        return Schema(this);
    };

    /**
     * Schema constructor
     * @memberof ermrest
     * @constructor
     * @this {Schema}
     */
    Schema = function(catalog) {
        this.catalog = catalog;
        this.ready = false;
        this.s = [];
    };

    /**
     * Asynchronous method to get the schemas. Getting the schemas will update
     * or override the schema.s array.
     */
    Schema.prototype.get = function (success, failure) {};

    /**
     * Returns the entity interface for this Catalog.
     *
     * @this {Catalog}
     * @return {Object} entity interface
     */
    Catalog.prototype.entity = function () {};

    /**
     * Creates an Entity instance.
     *
     * @memberof ermrest
     * @constructor
     * @this {Entity}
     */
    Entity = function () {};

    /**
     * Creates an Alias out of a Table for use within the context of an
     * instance of the Entity interface.
     *
     * @function
     * @this {Entity}
     * @param {Table} table The table to alias
     * @return {Alias} An alias based on the table
     */
    Entity.prototype.alias = function (table) {};

    /**
     * Extends the current ERM path by a Table or Alias. This method must 
     * be called at least once before any operations may be performed.
     *
     * @function
     * @this {Entity}
     * @param {Table} table The table or table alias to extend the path
     * @return {Entity} This entity instance.
     */
    Entity.prototype.join = function (table) {};
    Entity.prototype.start = function (table) {};

    /**
     * Apply a filter to the current ERM path.
     * @function
     * @this {Entity}
     * @param {object} term The column name used in the filter
     * @param {string} op The operand of the filter condition
     * @param {object} literal The literal value for the condition
     */
    Entity.prototype.filter = function (term, op, literal) {};

    /**
     * @function
     * @this {Entity}
     */
    Entity.prototype.get = function () {};

    /**
     * @function
     * @this {Entity}
     */
    Entity.prototype.update = function () {};

    /**
     * @function
     * @this {Entity}
     */
    Entity.prototype.del = function () {};

    /**
     * Registered service providers.
     * @memberof ermrest
     * @var providers The dictionary of known service providers.
     */
    providers_ = { };

    return { providers: providers_ };
})();
