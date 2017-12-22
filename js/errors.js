
    module.ErmrestError = ErmrestError;
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
    module.IntegrityConflictError = IntegrityConflictError;
    module.DuplicateConflictError = DuplicateConflictError;

    /**
     * @memberof ERMrest
     * @param  {int} code           http error code
     * @param  {string} status      message status/title in modal box
     * @param  {string} message     main user error message
     * @param  {string} subMessage  technical details about error. Appear in collapsible span in modal box
     * @constructor
     */
    function ErmrestError(code, status, message, subMessage) {
        this.code = code;
        this.status = status;
        this.message = message;
        this.subMessage = subMessage;
    }

    ErmrestError.prototype = Object.create(Error.prototype);
    ErmrestError.prototype.constructor = ErmrestError;
    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function TimedOutError(status, message) {
        var code = 0;
        ErmrestError.call(this, code, status, message);
    }

    TimedOutError.prototype = Object.create(ErmrestError.prototype);
    TimedOutError.prototype.constructor = TimedOutError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function BadRequestError(status, message) {
        var code = 400;
        ErmrestError.call(this, code, status, message);
    }

    BadRequestError.prototype = Object.create(ErmrestError.prototype);
    BadRequestError.prototype.constructor = BadRequestError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function UnauthorizedError(status, message) {
        var code = 401;
        ErmrestError.call(this, code, status, message);
    }

    UnauthorizedError.prototype = Object.create(ErmrestError.prototype);
    UnauthorizedError.prototype.constructor = UnauthorizedError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ForbiddenError(status, message) {
        var code = 403;
        status = (status != 'undefined' && status != '') ? status: module._errorStatus.forbidden;
        ErmrestError.call(this, code, status, message);
    }

    ForbiddenError.prototype = Object.create(ErmrestError.prototype);
    ForbiddenError.prototype.constructor = ForbiddenError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function NotFoundError(status, message) {
        var code = 404;
        status = (status != 'undefined' && status != '') ? status: module._errorStatus.itemNotFound;
        ErmrestError.call(this, code, status, message);
    }

    NotFoundError.prototype = Object.create(ErmrestError.prototype);
    NotFoundError.prototype.constructor = NotFoundError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @param  {type} subMessage technical message returned by http request
     * @constructor
     */
    function ConflictError(status, message, subMessage) {
        var code = 409;
        ErmrestError.call(this, code, status, message, subMessage);
    }

    ConflictError.prototype = Object.create(ErmrestError.prototype);
    ConflictError.prototype.constructor = ConflictError;

    /**
     * IntegrityConflictError - Return error pertaining to integrity violoation
     *
     * @memberof ERMrest
     * @param  {type} status     the network error code
     * @param  {type} message    error message
     * @param  {type} subMessage technical message returned by http request
     * @constructor
     */
    function IntegrityConflictError(status, message, subMessage) {
        ConflictError.call(this, status, message, subMessage);
    }

    IntegrityConflictError.prototype = Object.create(ConflictError.prototype);
    IntegrityConflictError.prototype.constructor = IntegrityConflictError;

    /**
     * DuplicateConflictError - Return error pertaining to Duplicate entried
     *
     * @memberof ERMrest
     * @param  {type} status      the network error code
     * @param  {type} message     error message
     * @param  {type} subMessage  technical message returned by http request
     * @constructor
     */
    function DuplicateConflictError(status, message, subMessage) {
        ConflictError.call(this, status, message, subMessage);
    }

    DuplicateConflictError.prototype = Object.create(ConflictError.prototype);
    DuplicateConflictError.prototype.constructor = DuplicateConflictError;

    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function PreconditionFailedError(status, message, data) {
        var code = 412;
        ErmrestError.call(this, code, status, message);
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
        var code = 500;
        ErmrestError.call(this, code, status, message);
    }

    InternalServerError.prototype = Object.create(ErmrestError.prototype);
    InternalServerError.prototype.constructor = InternalServerError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ServiceUnavailableError(status, message) {
        var code = 503;
        ErmrestError.call(this, code, status, message);
    }

    ServiceUnavailableError.prototype = Object.create(ErmrestError.prototype);
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
        message = message ? message : module._errorMessage.facetingError;
        ErmrestError.call(this, '', module._errorStatus.facetingError, message);
    }

    InvalidFacetOperatorError.prototype = Object.create(ErmrestError.prototype);
    InvalidFacetOperatorError.prototype.constructor = InvalidFacetOperatorError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid filter operator
     */
    function InvalidFilterOperatorError(message) {
        message = message;
        ErmrestError.call(this, '', module._errorStatus.invalidFilter, message);
    }

    InvalidFilterOperatorError.prototype = Object.create(ErmrestError.prototype);
    InvalidFilterOperatorError.prototype.constructor = InvalidFilterOperatorError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid input
     */
    function InvalidInputError(message) {
        message = message;
        ErmrestError.call(this, '', module._errorStatus.invalidInput, message);
    }

    InvalidInputError.prototype = Object.create(ErmrestError.prototype);
    InvalidInputError.prototype.constructor = InvalidInputError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A malformed URI was passed to the API.
     */
    function MalformedURIError(message) {
        this.message = message;
        ErmrestError.call(this, '', module._errorStatus.invalidURI, message);
    }

    MalformedURIError.prototype = Object.create(ErmrestError.prototype);
    MalformedURIError.prototype.constructor = MalformedURIError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc no data was changed for update
     */
    function NoDataChangedError(message) {
        message = message;
        ErmrestError.call(this, '', module._errorStatus.noDataChanged, message);
    }

    NoDataChangedError.prototype = Object.create(ErmrestError.prototype);
    NoDataChangedError.prototype.constructor = NoDataChangedError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A no internert was passed to the API.
     */
    function NoConnectionError(message) {
        message = message;
        ErmrestError.call(this, '', module._errorStatus.noConnectionError, message);
    }

    NoConnectionError.prototype = Object.create(Error.prototype);
    NoConnectionError.prototype.constructor = NoConnectionError;
