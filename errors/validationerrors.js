/**
 * @namespace ERMrest.Errors
 */
var ERMrest = (function(module) {

    module.InvalidFilterOperatorError = InvalidFilterOperatorError;
    module.InvalidInputError = InvalidInputError;

    /**
     * @memberof ERMrest.Errors
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
     * @memberof ERMrest.Errors
     * @param {string} message error message
     * @constructor
     * @desc An invalid input
     */
    function InvalidInputError(message) {
        this.message = message;
    }

    InvalidInputError.prototype = Object.create(Error.prototype);

    InvalidInputError.prototype.constructor = InvalidInputError;

    return module;

}(ERMrest || {}));

