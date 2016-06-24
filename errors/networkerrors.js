/**
 * @namespace ERMrest.Errors
 */
var ERMrest = (function(module) {

    module.TimedOutError = TimedOutError;

    module.BadRequestError = BadRequestError;

    module.UnauthorizedError = UnauthorizedError;

    module.ForbiddenError = ForbiddenError;

    module.NotFoundError = NotFoundError;

    module.ConflictError = ConflictError;

    module.InternalServerError = InternalServerError;

    module.ServiceUnavailableError = ServiceUnavailableError;

    /**
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ServiceUnavailableError(status, message) {
        this.code = 500;
        this.status = status;
        this.message = message;
    }

    ServiceUnavailableError.prototype = Object.create(Error.prototype);

    ServiceUnavailableError.prototype.constructor = ServiceUnavailableError;

    return module;

}(ERMrest || {}));

