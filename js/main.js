/**
 * The root namespace for the ERMrest library.
 *
 * @namespace ERMrest
 */
var ERMrest = (function () {

    /**
     * ERMrest Service.
     *
     * @memberof ERMrest
     * @this {Service}
     * @constructor
     * @param {String} URL The URL of the ERMrest service.
     */
    Service = function(URL) {

        /**
         * Returns an interface to a catalog resource located on this service.
         * This function returns immediately, and it does not validate that the
         * catalog exists.
         *
         * @constructor
         * @this {Service}
         * @param {String} name The name of the catalog.
         */
        this.Catalog = function (name) {
            return Catalog_(this, name);
        };


        /**
         *
         * This is the real implementation of the Catalog.
         *
         * @constructor
         * @this {Catalog}
         * @param {Object} service The service that this catalog belongs to.
         * @param {String} name The name of the catalog.
         */
        Catalog = function(service, name) {

            /**
             * The name of the Catalog resource.
             * @this {Catalog}
             * @var
             */
            this.name = name;

            /**
             * The properties of the Catalog resource.
             * This variable will be populated by a successful Catalog.get().
             *
             * @this {Catalog}
             * @var
             */
            this.properties = undefined;

            /**
             * The schemata of the Catalog resource.
             * This variable will be populated by a successful Catalog.get().
             *
             * @this {Catalog}
             * @var
             */
            this.schemata = undefined;

            /**
             * Creates a Catalog resource. The caller must have permission to create 
             * Catalog resources on the service. If successful, the object's properties
             * will be defined by this function.
             *
             * @this {Catalog}
             * @function
             * @param {function} cb A callback function
             */
            this.create = function (cb) {};

            /**
             * Gets a representation of a Catalog resource. If successful, the 
             * object's properties will be defined by this function.
             *
             * @this {Catalog}
             * @function
             * @param {function} cb A callback function
             */
            this.get = function (cb) {};

            /**
             * Removes a Catalog resource. The caller must have permission to remove 
             * Catalog. Typically, the caller must be the 'owner' of the resource.
             *
             * @this {Catalog}
             * @method
             * @param {function} cb A callback function
             */
            this.remove = function (cb) {};

            /**
             * Creates a representation of a Schema resource.
             *
             * @this {Schema}
             * @constructor
             * @param {String} name The name of the schema.
             */
            this.Schema = function (name) {
                return Schema_(this,name);
            };

            Schema_ = function (catalog, name) {
                this.name = name;
                return this;
            }; // {Schema}

            return this;
        }; // {Catalog}


        return this;
    }; // {Service}


    /**
     * Registered service providers.
     * @memberof ERMrest
     * @var providers The dictionary of known service providers.
     */
    providers_ = { };

    return { providers: providers_ };
})();
