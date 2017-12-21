
    module.ErmrestjsError = ErmrestjsError;
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

    function ErmrestjsError(code, status, message, subMessage) {
        this.code = code;
        this.status = status;
        this.message = message;
        this.subMessage = subMessage;
    }

    ErmrestjsError.prototype = Object.create(Error.prototype);
    ErmrestjsError.prototype.constructor = ConflictError;
    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function TimedOutError(status, message) {
        var code= 0
        ErmrestjsError.call(this, code, status, message);
    }

    TimedOutError.prototype = Object.create(ErmrestjsError.prototype);
    TimedOutError.prototype.constructor = TimedOutError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function BadRequestError(status, message) {
        var code = 400;
        ErmrestjsError.call(this, code, status, message);
    }

    BadRequestError.prototype = Object.create(ErmrestjsError.prototype);
    BadRequestError.prototype.constructor = BadRequestError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function UnauthorizedError(status, message) {
        var code = 401;
        ErmrestjsError.call(this, code, status, message);
    }

    UnauthorizedError.prototype = Object.create(ErmrestjsError.prototype);
    UnauthorizedError.prototype.constructor = UnauthorizedError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ForbiddenError(status, message) {
        var code = 403;
        var status = (status != 'undefined' && status != '') ? status: "Forbidden";
        ErmrestjsError.call(this, code, status, message);
    }

    ForbiddenError.prototype = Object.create(ErmrestjsError.prototype);
    ForbiddenError.prototype.constructor = ForbiddenError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function NotFoundError(status, message) {
        var code = 404;
        var status = (status != 'undefined' && status != '') ? status: "Item Not Found";
        ErmrestjsError.call(this, code, status, message);
    }

    NotFoundError.prototype = Object.create(ErmrestjsError.prototype);
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
        ErmrestjsError.call(this, code, status, message, subMessage);
    }

    ConflictError.prototype = Object.create(ErmrestjsError.prototype);
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
        ErmrestjsError.call(this, code, status, message);
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
        ErmrestjsError.call(this, code, status, message);
    }

    InternalServerError.prototype = Object.create(ErmrestjsError.prototype);
    InternalServerError.prototype.constructor = InternalServerError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ServiceUnavailableError(status, message) {
        var code = 503;
        ErmrestjsError.call(this, code, status, message);
    }

    ServiceUnavailableError.prototype = Object.create(ErmrestjsError.prototype);
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
        var message = message ? message : "Given encoded string for facets is not valid.";
        ErmrestjsError.call(this, '', "Faceting Error", message);
    }

    InvalidFacetOperatorError.prototype = Object.create(ErmrestjsError.prototype);
    InvalidFacetOperatorError.prototype.constructor = InvalidFacetOperatorError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid filter operator
     */
    function InvalidFilterOperatorError(message) {
        var message = message;
        ErmrestjsError.call(this, '', 'Invalid Filter', message);
    }

    InvalidFilterOperatorError.prototype = Object.create(ErmrestjsError.prototype);
    InvalidFilterOperatorError.prototype.constructor = InvalidFilterOperatorError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid input
     */
    function InvalidInputError(message) {
        var message = message;
        ErmrestjsError.call(this, '', 'Invalid Input', message);
    }

    InvalidInputError.prototype = Object.create(ErmrestjsError.prototype);
    InvalidInputError.prototype.constructor = InvalidInputError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A malformed URI was passed to the API.
     */
    function MalformedURIError(message) {
        this.message = message;
        ErmrestjsError.call(this, '', 'Invalid URI', message);
    }

    MalformedURIError.prototype = Object.create(ErmrestjsError.prototype);
    MalformedURIError.prototype.constructor = MalformedURIError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc no data was changed for update
     */
    function NoDataChangedError(message) {
        var message = message;
        ErmrestjsError.call(this, '', 'No Data Changed', message);
    }

    NoDataChangedError.prototype = Object.create(ErmrestjsError.prototype);
    NoDataChangedError.prototype.constructor = NoDataChangedError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A no internert was passed to the API.
     */
    function NoConnectionError(message) {
        var message = message;
        ErmrestjsError.call(this, '', 'No Connection Error', message);
    }

    NoConnectionError.prototype = Object.create(Error.prototype);
    NoConnectionError.prototype.constructor = NoConnectionError;
