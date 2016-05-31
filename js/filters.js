/**
 * @namespace ERMrest.Filters
 */
var ERMrest = (function(module) {

    module.Negation = Negation;

    module.Conjunction = Conjunction;

    module.Disjunction = Disjunction;

    module.UnaryPredicate = UnaryPredicate;

    module.BinaryPredicate = BinaryPredicate;

    module.OPERATOR = {
        EQUAL: "=",
        GREATER_THAN: "::gt::",
        LESS_THAN: "::lt::",
        NULL: "::null::"
    };

    module.isValidOperator = function(opr) {
        return (opr === "=" || opr === "::gt::" || opr === "::lt::" || opr === "::null::");

    };

    /**
     * @memberof ERMrest.Filters
     * @param filter
     * @constructor
     */
    function Negation (filter) {
        this.filter = filter;
    }

    Negation.prototype = {
        constructor: Negation,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function () {
            return "!(" + this.filter.toUri() + ")";
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param filters
     * @constructor
     */
    function Conjunction (filters) {
        this.filters = filters;
    }

    Conjunction.prototype = {
        constructor: Conjunction,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function () {
            // loop through individual filters to create filter strings
            var filterStrings = [];
            for (var i = 0; i < this.filters.length; i++) {
                filterStrings[i] = this.filters[i].toUri();
            }

            // combine filter strings
            var uri = "";
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + filterStrings[j];
                else
                    uri = uri + "&" + filterStrings[j];
            }

            return uri;
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param filters
     * @constructor
     */
    function Disjunction (filters) {
        this.filters = filters;
    }

    Disjunction.prototype = {
        constructor: Disjunction,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function () {
            // loop through individual filters to create filter strings
            var filterStrings = [];
            for (var i = 0; i < this.filters.length; i++) {
                filterStrings[i] = this.filters[i].toUri();
            }

            // combine filter strings
            var uri = "";
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + filterStrings[j];
                else
                    uri = uri + ";" + filterStrings[j];
            }

            return uri;
        }
    };

    /**
     *
     * @memberof ERMrest.Filters
     * @param {ERMrest.Column} column
     * @param {ERMrest.Filters.OPERATOR} operator
     * @constructor
     */
    function UnaryPredicate (column, operator) {
        if (!module.isValidOperator(operator)) {
            throw new Errors.InvalidFilterOperatorError("'" + operator + "' is not a valid operator");
        }
        this.column = column; // pathcolumn or column
        this.operator = operator;
    }

    UnaryPredicate.prototype = {
        constructor: UnaryPredicate,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function() {
            var colName =  (this.column.name ?
                // Column
                encodeURIComponent(this.column.name) :
                // Pathcolumn
                encodeURIComponent(this.column.pathtable.alias) + ":" + encodeURIComponent(this.column.column.name));
            return colName + this.operator;
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param {ERMrest.Column} column
     * @param {ERMrest.Filters.OPERATOR} operator
     * @param {String | Number} rvalue
     * @constructor
     */
    function BinaryPredicate (column, operator, rvalue) {
        if (!module.isValidOperator(operator)) {
            throw new Errors.InvalidFilterOperatorError("'" + operator + "' is not a valid operator");
        }
        this.column = column; // either pathcolumn or column
        this.operator = operator;
        this.rvalue = rvalue;
    }

    BinaryPredicate.prototype = {
        constructor: BinaryPredicate,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function() {
            var colName =  (this.column.name ?
                // Column
                encodeURIComponent(this.column.name) :
                // Pathcolumn
                encodeURIComponent(this.column.pathtable.alias) + ":" + encodeURIComponent(this.column.column.name));
            return colName + this.operator + encodeURIComponent(this.rvalue);
        }
    };


    return module;

}(ERMrest || {}));
