/*
 * Copyright 2015 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ERMrest = (function(module) {

    module.TimedOutError = TimedOutError;
    module.BadRequestError = BadRequestError;
    module.UnauthorizedError = UnauthorizedError;
    module.ForbiddenError = ForbiddenError;
    module.NotFoundError = NotFoundError;
    module.ConflictError = ConflictError;
    module.PreconditionFailedError = PreconditionFailedError;
    module.InternalServerError = InternalServerError;
    module.ServiceUnavailableError = ServiceUnavailableError;
    module.InvalidFilterOperatorError = InvalidFilterOperatorError;
    module.InvalidInputError = InvalidInputError;
    module.MalformedURIError = MalformedURIError;

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

    return module;

}(ERMrest || {}));
