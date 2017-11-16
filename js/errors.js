
    module.TimedOutError = TimedOutError;
    module.BadRequestError = BadRequestError;
    module.UnauthorizedError = UnauthorizedError;
    module.ForbiddenError = ForbiddenError;
    module.NotFoundError = NotFoundError;
    module.ConflictError = ConflictError;
    module.PreconditionFailedError = PreconditionFailedError;
    module.InternalServerError = InternalServerError;
    module.ServiceUnavailableError = ServiceUnavailableError;
    module.InvalidFacetOperatorError = InvalidFacetOperatorError;
    module.InvalidFilterOperatorError = InvalidFilterOperatorError;
    module.InvalidInputError = InvalidInputError;
    module.MalformedURIError = MalformedURIError;
    module.NoDataChangedError = NoDataChangedError;
    module.NoConnectionError = NoConnectionError;

    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function TimedOutError(status, message) {
        this.code = 0;
        this.status = status;
        this.message = message;
    }

    TimedOutError.prototype = Object.create(Error.prototype);
    TimedOutError.prototype.constructor = TimedOutError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function BadRequestError(status, message) {
        this.code = 400;
        this.status = status;
        this.message = message;
    }

    BadRequestError.prototype = Object.create(Error.prototype);
    BadRequestError.prototype.constructor = BadRequestError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function UnauthorizedError(status, message) {
        this.code = 401;
        this.status = status;
        this.message = message;
    }

    UnauthorizedError.prototype = Object.create(Error.prototype);
    UnauthorizedError.prototype.constructor = UnauthorizedError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ForbiddenError(status, message) {
        this.code = 403;
        this.status = status;
        this.message = message;
    }

    ForbiddenError.prototype = Object.create(Error.prototype);
    ForbiddenError.prototype.constructor = ForbiddenError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function NotFoundError(status, message) {
        this.code = 404;
        this.status = status;
        this.message = message;
    }

    NotFoundError.prototype = Object.create(Error.prototype);
    NotFoundError.prototype.constructor = NotFoundError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ConflictError(status, message) {
        this.code = 409;
        this.status = status;
        this.message = message;
    }

    ConflictError.prototype = Object.create(Error.prototype);
    ConflictError.prototype.constructor = ConflictError;

    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function PreconditionFailedError(status, message, data) {
        this.code = 412;
        this.status = status;
        this.message = message;
        this.data = data;
    }

    PreconditionFailedError.prototype = Object.create(Error.prototype);
    PreconditionFailedError.prototype.constructor = PreconditionFailedError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function InternalServerError(status, message) {
        this.code = 500;
        this.status = status;
        this.message = message;
    }

    InternalServerError.prototype = Object.create(Error.prototype);
    InternalServerError.prototype.constructor = InternalServerError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ServiceUnavailableError(status, message) {
        this.code = 503;
        this.status = status;
        this.message = message;
    }

    ServiceUnavailableError.prototype = Object.create(Error.prototype);
    ServiceUnavailableError.prototype.constructor = ServiceUnavailableError;


    // Errors not associated with http status codes
    // these are errors that we defined to manage errors in the API
    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid facet operator
     */
    function InvalidFacetOperatorError(message) {
        this.message = message ? message : "Given encoded string for facets is not valid.";
    }

    InvalidFacetOperatorError.prototype = Object.create(Error.prototype);
    InvalidFacetOperatorError.prototype.constructor = InvalidFacetOperatorError;
    
    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid filter operator
     */
    function InvalidFilterOperatorError(message) {
        this.message = message;
    }

    InvalidFilterOperatorError.prototype = Object.create(Error.prototype);
    InvalidFilterOperatorError.prototype.constructor = InvalidFilterOperatorError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid input
     */
    function InvalidInputError(message) {
        this.message = message;
    }

    InvalidInputError.prototype = Object.create(Error.prototype);
    InvalidInputError.prototype.constructor = InvalidInputError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A malformed URI was passed to the API.
     */
    function MalformedURIError(message) {
        this.message = message;
    }

    MalformedURIError.prototype = Object.create(Error.prototype);
    MalformedURIError.prototype.constructor = MalformedURIError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc no data was changed for update
     */
    function NoDataChangedError(message) {
        this.message = message;
    }

    NoDataChangedError.prototype = Object.create(Error.prototype);
    NoDataChangedError.prototype.constructor = NoDataChangedError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A no internert was passed to the API.
     */
    function NoConnectionError(message) {
        this.message = message;
    }

    NoConnectionError.prototype = Object.create(Error.prototype);
    NoConnectionError.prototype.constructor = NoConnectionError;
