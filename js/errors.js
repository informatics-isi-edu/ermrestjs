
    module.ERMrestError = ERMrestError;
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
    module.InvalidFacetSorting = InvalidFacetSorting
    module.InvalidPageCriteria = InvalidPageCriteria

    /**
     * @memberof ERMrest
     * @param  {int} code           http error code
     * @param  {string} status      message status/title in the modal box
     * @param  {string} message     main user error message
     * @param  {string} subMessage  technical details about the error. Appear in collapsible span in the modal box
     * @constructor
     */
    function ERMrestError(code, status, message, subMessage, redirectPath) {
        this.code = code;
        this.status = status;
        this.message = message;
        this.subMessage = subMessage;
        if(redirectPath !=='undefined' && redirectPath != ''){
           this.errorData = {};
           this.errorData.redirectPath = redirectPath;
        }
    }

    ERMrestError.prototype = Object.create(Error.prototype);
    ERMrestError.prototype.constructor = ERMrestError;
    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function TimedOutError(status, message) {
        ERMrestError.call(this, 0, status, message);
    }

    TimedOutError.prototype = Object.create(ERMrestError.prototype);
    TimedOutError.prototype.constructor = TimedOutError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function BadRequestError(status, message) {
        ERMrestError.call(this, module._HTTPErrorCodes.BAD_REQUEST, status, message);
    }

    BadRequestError.prototype = Object.create(ERMrestError.prototype);
    BadRequestError.prototype.constructor = BadRequestError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function UnauthorizedError(status, message) {
        ERMrestError.call(this, module._HTTPErrorCodes.UNAUTHORIZED, status, message);
    }

    UnauthorizedError.prototype = Object.create(ERMrestError.prototype);
    UnauthorizedError.prototype.constructor = UnauthorizedError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ForbiddenError(status, message) {
        status = (status != 'undefined' && status != '') ? status: module._errorStatus.forbidden;
        ERMrestError.call(this, module._HTTPErrorCodes.FORBIDDEN, status, message);
    }

    ForbiddenError.prototype = Object.create(ERMrestError.prototype);
    ForbiddenError.prototype.constructor = ForbiddenError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function NotFoundError(status, message) {
        status = (status != 'undefined' && status != '') ? status: module._errorStatus.itemNotFound;
        ERMrestError.call(this, module._HTTPErrorCodes.NOT_FOUND, status, message);
    }

    NotFoundError.prototype = Object.create(ERMrestError.prototype);
    NotFoundError.prototype.constructor = NotFoundError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @param  {type} subMessage technical message returned by http request
     * @constructor
     */
    function ConflictError(status, message, subMessage) {
        ERMrestError.call(this, module._HTTPErrorCodes.CONFLICT, status, message, subMessage);
    }

    ConflictError.prototype = Object.create(ERMrestError.prototype);
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
        ERMrestError.call(this, module._HTTPErrorCodes.PRECONDITION_FAILED, status, message);
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
        ERMrestError.call(this, module._HTTPErrorCodes.INTERNAL_SERVER_ERROR, status, message);
    }

    InternalServerError.prototype = Object.create(ERMrestError.prototype);
    InternalServerError.prototype.constructor = InternalServerError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ServiceUnavailableError(status, message) {
        ERMrestError.call(this, module._HTTPErrorCodes.SERVIVE_UNAVAILABLE, status, message);
    }

    ServiceUnavailableError.prototype = Object.create(ERMrestError.prototype);
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
        ERMrestError.call(this, '', module._errorStatus.facetingError, message);
    }

    InvalidFacetOperatorError.prototype = Object.create(ERMrestError.prototype);
    InvalidFacetOperatorError.prototype.constructor = InvalidFacetOperatorError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid filter operator
     */
    function InvalidFilterOperatorError(message) {
        message = message;
        ERMrestError.call(this, '', module._errorStatus.invalidFilter, message);
    }

    InvalidFilterOperatorError.prototype = Object.create(ERMrestError.prototype);
    InvalidFilterOperatorError.prototype.constructor = InvalidFilterOperatorError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc An invalid input
     */
    function InvalidInputError(message) {
        message = message;
        ERMrestError.call(this, '', module._errorStatus.invalidInput, message);
    }

    InvalidInputError.prototype = Object.create(ERMrestError.prototype);
    InvalidInputError.prototype.constructor = InvalidInputError;


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A malformed URI was passed to the API.
     */
    function MalformedURIError(message) {
        this.message = message;
        ERMrestError.call(this, '', module._errorStatus.invalidURI, message);
    }

    MalformedURIError.prototype = Object.create(ERMrestError.prototype);
    MalformedURIError.prototype.constructor = MalformedURIError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc no data was changed for update
     */
    function NoDataChangedError(message) {
        message = message;
        ERMrestError.call(this, '', module._errorStatus.noDataChanged, message);
    }

    NoDataChangedError.prototype = Object.create(ERMrestError.prototype);
    NoDataChangedError.prototype.constructor = NoDataChangedError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A no internet was passed to the API.
     */
    function NoConnectionError(message) {
        message = message;
        ERMrestError.call(this, module._HTTPErrorCodes.NO_CONNECTION_ERROR, module._errorStatus.noConnectionError, message);
    }

    NoConnectionError.prototype = Object.create(Error.prototype);
    NoConnectionError.prototype.constructor = NoConnectionError;


    // function findAndReplace(path, replace){
    //   if (path != 'undefined' && path.indexOf(replace) !== -1) {
    //      newReg = new RegExp('/('+replace+'\([^\)]*\))/')
    //      match = newReg[Symbol.match](replace);
    //      console.log(match);
    //       // newPath = path.replace(afterLiteral, '');
    //   }
    // }

    function removePageCondition(path){
      var newPath;
      if (path != 'undefined' && path.indexOf("@before") !== -1) {
        beforerLiteral = path.match(/(@before\([^\)]*\))/)[1];
          path = path.replace(beforerLiteral, '');
      }
      if (path != 'undefined' && path.indexOf("@after") !== -1) {
        afterLiteral = path.match(/(@after\([^\)]*\))/)[1];
          path = path.replace(afterLiteral, '');
      }
      return path;
    }
    function removeSortCondition(path){
      var newPath;
      if (path != 'undefined' && path.indexOf("@before") !== -1) {
        beforerLiteral = path.match(/(@before\([^\)]*\))/)[1];
          newPath = path.replace(beforerLiteral, '');
      }
      return newPath;
    }


    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc Invalid sorting conditions
     */
    function InvalidFacetSorting(message, path) {
        var newPath = removePageCondition(removeSortCondition(path));
        ERMrestError.call(this, '', module._errorStatus.invalidFacetSorting, message, '', newPath);
    }

    InvalidFacetSorting.prototype = Object.create(ERMrestError.prototype);
    InvalidFacetSorting.prototype.constructor = InvalidFacetSorting;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc Invalid page conditions
     */
    function InvalidPageCriteria(message, path) {
        var newPath = removePageCondition(path);
        ERMrestError.call(this, '', module._errorStatus.invalidPageCriteria, message, '', newPath);
    }

    InvalidPageCriteria.prototype = Object.create(ERMrestError.prototype);
    InvalidPageCriteria.prototype.constructor = InvalidPageCriteria;
