
    module.ERMrestError = ERMrestError;
    module.TimedOutError = TimedOutError;
    module.BadRequestError = BadRequestError;
    module.QueryTimeoutError = QueryTimeoutError;
    module.UnauthorizedError = UnauthorizedError;
    module.ForbiddenError = ForbiddenError;
    module.NotFoundError = NotFoundError;
    module.ConflictError = ConflictError;
    module.PreconditionFailedError = PreconditionFailedError;
    module.InternalServerError = InternalServerError;
    module.BadGatewayError = BadGatewayError;
    module.ServiceUnavailableError = ServiceUnavailableError;
    module.InvalidFacetOperatorError = InvalidFacetOperatorError;
    module.InvalidCustomFacetOperatorError = InvalidCustomFacetOperatorError;
    module.InvalidFilterOperatorError = InvalidFilterOperatorError;
    module.InvalidInputError = InvalidInputError;
    module.MalformedURIError = MalformedURIError;
    module.BatchUnlinkResponse = BatchUnlinkResponse;
    module.BatchDeleteResponse = BatchDeleteResponse;
    module.NoDataChangedError = NoDataChangedError;
    module.NoConnectionError = NoConnectionError;
    module.IntegrityConflictError = IntegrityConflictError;
    module.DuplicateConflictError = DuplicateConflictError;
    module.InvalidSortCriteria = InvalidSortCriteria;
    module.InvalidPageCriteria = InvalidPageCriteria;
    module.InvalidServerResponse = InvalidServerResponse;
    module.UnsupportedFilters = UnsupportedFilters;

    /**
     * @memberof ERMrest
     * @param  {int} code           http error code
     * @param  {string} status      message status/title in the modal box
     * @param  {string} message     main user error message
     * @param  {string} subMessage  technical details about the error. Appear in collapsible span in the modal box
     * @param  {string} redirectPath path that would be added to the host to create full redirect link in Chaise
     * @constructor
     */
    function ERMrestError(code, status, message, subMessage, redirectPath) {
        this.errorData = {};
        this.code = code;
        this.status = status;
        this.message = message;
        this.subMessage = subMessage;
        if(redirectPath !== undefined && redirectPath !== null) {
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.TIME_OUT;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.BAD_REQUEST;
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
    function QueryTimeoutError(status, message) {
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.TIME_OUT;
        ERMrestError.call(this, module._HTTPErrorCodes.BAD_REQUEST, status, message);
    }

    QueryTimeoutError.prototype = Object.create(ERMrestError.prototype);
    QueryTimeoutError.prototype.constructor = QueryTimeoutError;

    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function UnauthorizedError(status, message) {
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.UNAUTHORIZED;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.FORBIDDEN;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.NOT_FOUND;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.CONFLICT;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.CONFLICT;
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
    function DuplicateConflictError(status, message, subMessage, duplicateReference) {
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.CONFLICT;
        ConflictError.call(this, status, message, subMessage);
        this.duplicateReference = duplicateReference;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.PRECONDITION_FAILED;
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
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.INTERNAL_SERVER_ERROR;
        // use the message as subMessage and add a generic message instead
        ERMrestError.call(this, module._HTTPErrorCodes.INTERNAL_SERVER_ERROR, status, module._errorMessage.INTERNAL_SERVER_ERROR, message);
    }

    InternalServerError.prototype = Object.create(ERMrestError.prototype);
    InternalServerError.prototype.constructor = InternalServerError;


    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function BadGatewayError(status, message) {
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.BAD_GATEWAY;
        ERMrestError.call(this, module._HTTPErrorCodes.BAD_GATEWAY, status, message);
    }

    BadGatewayError.prototype = Object.create(ERMrestError.prototype);
    BadGatewayError.prototype.constructor = BadGatewayError;

    /**
     * @memberof ERMrest
     * @param {string} status the network error code
     * @param {string} message error message
     * @constructor
     */
    function ServiceUnavailableError(status, message) {
        status = isStringAndNotEmpty(status) ? status : module._errorStatus.SERVIVE_UNAVAILABLE;
        ERMrestError.call(this, module._HTTPErrorCodes.SERVIVE_UNAVAILABLE, status, message);
    }

    ServiceUnavailableError.prototype = Object.create(ERMrestError.prototype);
    ServiceUnavailableError.prototype.constructor = ServiceUnavailableError;


    //remove invalid facet filterString from path
    function removeInvalidFacetFilter(path){
      // if URI has modifier starting with '@' then find the blob and replace it with blank
      // else remove entire facetFilter
      var newPath,
          modifierStart = path.indexOf('@'),
          facetBlobStart = path.search('\\*::facets::');

      if(modifierStart > 0){
        var facetFilter = path.slice(facetBlobStart, modifierStart);
        newPath = path.replace(facetFilter, '');
      } else{
        newPath = path.slice(0, facetBlobStart);
      }
      return newPath;
    }
    // Errors not associated with http status codes
    // these are errors that we defined to manage errors in the API
    /**
     * @memberof ERMrest
     * @param {string} path path for redirectLink
     * @param {string} subMessage the details of the error message
     * @constructor
     * @desc An invalid facet operator
     */
    function InvalidFacetOperatorError(path, subMessage) {
        var message = module._errorMessage.INVALID_FACET;
        var redirectPath = removeInvalidFacetFilter(path);
        ERMrestError.call(this, '', module._errorStatus.INVALID_FACET, message, subMessage, redirectPath);
    }

    InvalidFacetOperatorError.prototype = Object.create(ERMrestError.prototype);
    InvalidFacetOperatorError.prototype.constructor = InvalidFacetOperatorError;

    //remove invalid facet filterString from path
    function removeInvalidCustomFacetFilter(path){
      // if URI has modifier starting with '@' then find the blob and replace it with blank
      // else remove entire facetFilter
      var newPath,
          modifierStart = path.indexOf('@'),
          facetBlobStart = path.search('\\*::cfacets::');

      if(modifierStart > 0){
        var facetFilter = path.slice(facetBlobStart, modifierStart);
        newPath = path.replace(facetFilter, '');
      } else{
        newPath = path.slice(0, facetBlobStart);
      }
      return newPath;
    }
    // Errors not associated with http status codes
    // these are errors that we defined to manage errors in the API
    /**
     * @memberof ERMrest
     * @param {string} path path for redirectLink
     * @param {string} subMessage the details of the error message
     * @constructor
     * @desc An invalid facet operator
     */
    function InvalidCustomFacetOperatorError(path, subMessage) {
        var message = module._errorMessage.INVALID_CUSTOM_FACET;
        var redirectPath = removeInvalidCustomFacetFilter(path);
        ERMrestError.call(this, '', module._errorStatus.INVALID_CUSTOM_FACET, message, subMessage, redirectPath);
    }

    InvalidCustomFacetOperatorError.prototype = Object.create(ERMrestError.prototype);
    InvalidCustomFacetOperatorError.prototype.constructor = InvalidCustomFacetOperatorError;

    // path consits of facet filter alongwith table and schemaName
    // invalidFilter is removed from the path if found else everything is removed after path ends
    function removeInvalidFilter(path, invalidFilter){
      var newPath;

      if (invalidFilter != ''){
        newPath = path.replace(invalidFilter, '');
      } else{
        var lastIndex = path.indexOf('/');
        newPath = (lastIndex === -1) ? path : path.slice(0, lastIndex);
      }
      return newPath;
    }

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @param {string} path path for redirectLink
     * @param {string} invalidFilter filter that should be removed
     * @constructor
     * @desc An invalid filter operator
     */
    function InvalidFilterOperatorError(message, path, invalidFilter) {
        var redirectPath = removeInvalidFilter(path, invalidFilter);
        ERMrestError.call(this, '', module._errorStatus.INVALID_FILTER, message, '', redirectPath);
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
        ERMrestError.call(this, '', module._errorStatus.INVALID_INPUT, message);
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
        ERMrestError.call(this, '', module._errorStatus.INVALID_URI, message);
    }

    MalformedURIError.prototype = Object.create(ERMrestError.prototype);
    MalformedURIError.prototype.constructor = MalformedURIError;

    /**
     * return the proper message that should be displayed to users. format:
     * - one record:
     *   - success: The {chosen|displayed} record successfully {unlinked|deleted}.
     *   - failure: The {chosen|displayed} record could not be {unlinked|deleted}. <check error>
     * - multiple records:
     *   - all success: All of the <number> {chosen|displayed} records successfully {unlinked|deleted}.
     *   - all failure: None of the <number> {chosen|displayed} records could be {unlinked|deleted}. <check error>
     *   - mix: <number> records successfully {unlinked|deleted}. <number> records could not be {unlinked|deleted}. <check error>
     * 
     * <check error>: Check the error details below to see more information.
     */
    function generateBatchDeleteMessage(successTupleData, failedTupleData, isUnlink) {
        var totalSuccess = successTupleData.length,
            totalFail = failedTupleData.length;
        var message = "";
        var checkDetails = " Check the error details below to see more information.";
        var verb = isUnlink ? 'unlinked' : 'deleted';
        var adj = isUnlink ? 'chosen' : 'displayed';

        // there was just one row
        if (totalSuccess + totalFail === 1) {
            if (totalSuccess > 0) {
                message = 'The ' + adj + ' record successfully ' + verb + '.';
            } else {
                message = 'The ' + adj + ' record could not be ' + verb + '.';
            }
        }
        // multiple rows
        else {
            if (totalFail === 0) {
                message = 'All of the ' + totalSuccess + ' ' + adj + ' records successfully ' + verb + '.'; 
            } 
            else if (totalSuccess === 0) {
                message = 'None of the ' + totalFail + ' ' + adj + ' records could be ' + verb + '.';
            } else {
                message = totalSuccess + ' record' + (totalSuccess > 1 ? 's' : '') + ' successfully ' + verb + '.';
                message += ' ' + totalFail + ' record' + (totalFail > 1 ? 's' : '') + ' could not be ' + verb + '.';
            }
        }
        return message + (totalFail > 0 ? checkDetails : '');
    }

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A malformed URI was passed to the API.
     */
    function BatchUnlinkResponse(successTupleData, failedTupleData, subMessage) {
        this.successTupleData = successTupleData;
        this.failedTupleData = failedTupleData;

        var message = generateBatchDeleteMessage(successTupleData, failedTupleData, true);
        ERMrestError.call(this, '', module._errorStatus.BATCH_UNLINK, message, subMessage);
    }

    BatchUnlinkResponse.prototype = Object.create(ERMrestError.prototype);
    BatchUnlinkResponse.prototype.constructor = BatchUnlinkResponse;

    function BatchDeleteResponse(successTupleData, failedTupleData, subMessage) {
        this.successTupleData = successTupleData;
        this.failedTupleData = failedTupleData;

        var message = generateBatchDeleteMessage(successTupleData, failedTupleData, false);
        ERMrestError.call(this, '', module._errorStatus.BATCH_DELETE, message, subMessage);
    }

    BatchDeleteResponse.prototype = Object.create(ERMrestError.prototype);
    BatchDeleteResponse.prototype.constructor = BatchDeleteResponse;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc no data was changed for update
     */
    function NoDataChangedError(message) {
        message = message;
        ERMrestError.call(this, '', module._errorStatus.NO_DATA_CHANGED, message);
    }

    NoDataChangedError.prototype = Object.create(ERMrestError.prototype);
    NoDataChangedError.prototype.constructor = NoDataChangedError;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @constructor
     * @desc A No Connection or No Internet Connection was passed to the API.
     */
    function NoConnectionError(message) {
        message = message || module._errorMessage.NO_CONNECTION_ERROR;
        ERMrestError.call(this, -1, module._errorStatus.NO_CONNECTION_ERROR, message);
    }

    NoConnectionError.prototype = Object.create(Error.prototype);
    NoConnectionError.prototype.constructor = NoConnectionError;

    function removePageCondition(path){
      if (path != undefined){
        path = path.replace(/(@before\([^\)]*\))/, '');
        path = path.replace(/(@after\([^\)]*\))/, '');
     }
      return path;
    }

    function removeSortCondition(path){
      if (path != undefined) {
          return path.replace(/(@sort\([^\)]*\))/, '');
      }
    }

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @param {string} path path for redirectLink
     * @constructor
     * @desc Invalid sorting conditions
     */
    function InvalidSortCriteria(message, path) {
        var newPath = removePageCondition(removeSortCondition(path));
        ERMrestError.call(this, '', module._errorStatus.INVALID_SORT, message, '', newPath);
    }

    InvalidSortCriteria.prototype = Object.create(ERMrestError.prototype);
    InvalidSortCriteria.prototype.constructor = InvalidSortCriteria;

    /**
     * @memberof ERMrest
     * @param {string} message error message
     * @param {string} path path for redirectLink
     * @constructor
     * @desc Invalid page conditions
     */
    function InvalidPageCriteria(message, path) {
        var newPath = removePageCondition(path);
        ERMrestError.call(this, '', module._errorStatus.INVALID_PAGE, message, '', newPath);
    }

    InvalidPageCriteria.prototype = Object.create(ERMrestError.prototype);
    InvalidPageCriteria.prototype.constructor = InvalidPageCriteria;

    /**
     * @memberof ERMrest
     * @param {string} uri error message
     * @param {object} data the returned data
     * @param {string} logAction the log action of the request
     * @constructor
     * @desc Invalid server response
     */
     function InvalidServerResponse(uri, data, logAction) {
        var message = "Request URI: " + uri + "\n";
        message += "Request action: " + logAction + "\n";
        message += "returned data:\n" + data;
        ERMrestError.call(this, '', module._errorStatus.INVALID_SERVER_RESPONSE, message);
    }

    InvalidServerResponse.prototype = Object.create(ERMrestError.prototype);
    InvalidServerResponse.prototype.constructor = InvalidServerResponse;


    function _createDiscardedFacetSubMessage(obj, onlyChoices) {
        var sum = [];
        if (Array.isArray(obj.choices) && obj.choices.length > 0) {
            tempSum = obj.choices.length;
            if (obj.total_choice_count) {
                tempSum += "/" + obj.total_choice_count;
            }
            tempSum += " choice" + (obj.choices.length > 1 ? "s" : "");
            sum.push(tempSum);
        }

        if (!onlyChoices && Array.isArray(obj.ranges) && obj.ranges.length > 0) {
            sum.push(obj.ranges.length + " range" + (obj.ranges.length > 1 ? "s" : ""));
        }

        if (!onlyChoices && obj.not_null) {
            sum.push("not null");
        }

        var values = [];
        if (Array.isArray(obj.choices) && obj.choices.length > 0) {
            values = values.concat(obj.choices.map(function (ch) { return "  - " + ch;}));
        }
        if (!onlyChoices && Array.isArray(obj.ranges) && obj.ranges.length > 0) {
            values = values.concat(obj.ranges.map(function (r) { return "  - " + JSON.stringify(r);}));
        }
        if (!onlyChoices && obj.not_null) {
            values = values.concat("  - not null");
        }


        return "- " + obj.markdown_name + " (" + sum.join(",") + "):\n" + values.join("\n");
    }

    /**
     * @memberof ERMrest
     * @param {Object[]} discardedFacets
     * @param {Object[]} partialyDiscardedFacets
     * @constructor
     * @desc Invalid server response
     */
    function UnsupportedFilters(discardedFacets, partialyDiscardedFacets) {

        // process discarded facets
        var discardedFacetMsg = [], discardedFacetSubMsg = [];
        discardedFacets.forEach(function (f) {
            if (!f.markdown_name) return;
            discardedFacetMsg.push(f.markdown_name);
            discardedFacetSubMsg.push(_createDiscardedFacetSubMessage(f));
        });
        // process partialy discarded facets
        var partDiscardedFacetMsg = [], partDiscardedFacetSubMsg = [];
        partialyDiscardedFacets.forEach(function (f) {
            if (!f.markdown_name) return;
            partDiscardedFacetMsg.push(f.markdown_name);
            partDiscardedFacetSubMsg.push(_createDiscardedFacetSubMessage(f, true));
        });

        // create the message:
        // TODO using HTML here looks hacky, although we already are using html
        //      in conflict error
        var message = "<p>" + module._errorMessage.UNSUPPORTED_FILTERS + "</p>";
        if (discardedFacetMsg.length > 0 || partDiscardedFacetMsg.length > 0) {
            message += "<ul>";
            if (discardedFacetMsg.length > 0) {
                message += "<li style='list-style-type: disc;'> Discarded facets: " + discardedFacetMsg.join(", ") + "</li>";
            }
            if (partDiscardedFacetMsg.length > 0) {
                message += "<li style='list-style-type: disc;'> Facets with some discarded choices: " + partDiscardedFacetMsg.join(", ") + "</li>";
            }
            message += "</ul>";
        }

        // create the submessage
        var subMessage = "";
        if (discardedFacetSubMsg.length > 0) {
            subMessage += "Discarded facets:\n\n";
            subMessage += discardedFacetSubMsg.join("\n") + "\n\n\n";
        }
        if (partDiscardedFacetSubMsg.length > 0) {
            subMessage += "Partially discarded facets:\n\n";
            subMessage += partDiscardedFacetSubMsg.join("\n") + "\n";
        }
        ERMrestError.call(this, '', module._errorStatus.UNSUPPORTED_FILTERS, message, subMessage);
    }
    UnsupportedFilters.prototype = Object.create(ERMrestError.prototype);
    UnsupportedFilters.prototype.constructor = InvalidServerResponse;

    /**
     * Log the error object to the given ermrest location.
     * It will generate a put request to the /terminal_error with the correct headers.
     * ermrset will return a 400 page, but will log the message.
     * NOTE this function assumes ERMrestJS is properly configured and has a http module
     * @param  {object} err             the error object
     * @param  {string} ermrestLocation the ermrest location
     */
    module.logError = function (err, ermrestLocation, contextHeaderParams) {
        var defer = module._q.defer();
        var server = module.ermrestFactory.getServer(ermrestLocation);

        if (!contextHeaderParams || typeof contextHeaderParams != "object") {
            contextHeaderParams = {};
        }
        contextHeaderParams.e = 1;
        contextHeaderParams.name = err.constructor.name;
        contextHeaderParams.message = err.message;

        var headers = {};
        headers[module.contextHeaderName] = contextHeaderParams;

        // this http request will fail but will still log the message.
        server.http.put(ermrestLocation + "/terminal_error", {}, {headers: headers}).then(function () {
            defer.resolve();
        }).catch(function (err) {
            defer.resolve();
        });

        return defer.promise;
    };
