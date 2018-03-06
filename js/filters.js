/**
 * @namespace ERMrest.Filters
 */

    module.Negation = Negation;

    module.Conjunction = Conjunction;

    module.Disjunction = Disjunction;

    module.UnaryPredicate = UnaryPredicate;

    module.BinaryPredicate = BinaryPredicate;

    module.OPERATOR = {
        EQUAL: "=",
        GREATER_THAN: "::gt::",
        GREATER_THAN_OR_EQUAL_TO: "::geq::",
        LESS_THAN: "::lt::",
        LESS_THAN_OR_EQUAL_TO: "::leq::",
        NULL: "::null::",
        CASE_INS_REG_EXP: "::ciregexp::"
    };

    module.isValidOperator = function(opr) {
        var isOperator = false;
        for (var enumOpr in module.OPERATOR) {
            if (module.OPERATOR[enumOpr] === opr) {
                isOperator = true;
            }
        }
        return isOperator;

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
                if (this.filters[i] instanceof Conjunction || this.filters[i] instanceof Disjunction) {
                    filterStrings[i] = "(" + this.filters[i].toUri() + ")";
                } else {
                    filterStrings[i] = this.filters[i].toUri();
                }
            }

            // combine filter strings
            var uri = "";
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + filterStrings[j];
                else
                    uri = uri + "&" + filterStrings[j];
            }
            uri = uri;

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
                if (this.filters[i] instanceof Conjunction || this.filters[i] instanceof Disjunction) {
                    filterStrings[i] = "(" + this.filters[i].toUri() + ")";
                } else {
                    filterStrings[i] = this.filters[i].toUri();
                }
            }

            // combine filter strings
            var uri = "";
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + filterStrings[j];
                else
                    uri = uri + ";" + filterStrings[j];
            }
            uri = uri;

            return uri;
        }
    };

    /**
     *
     * @memberof ERMrest.Filters
     * @param {ERMrest.Column} column
     * @param {ERMrest.Filters.OPERATOR} operator
     * @throws {ERMrest.Errors.InvalidFilterOperatorError} invalid filter operator
     * @constructor
     */
    function UnaryPredicate (column, operator) {
        if (!module.isValidOperator(operator)) {
            throw new module.InvalidFilterOperatorError("'" + operator + "' is not a valid operator");
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
                module._fixedEncodeURIComponent(this.column.name) :
                // Pathcolumn
                module._fixedEncodeURIComponent(this.column.pathtable.alias) + ":" + module._fixedEncodeURIComponent(this.column.column.name));
            return colName + this.operator;
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param {ERMrest.Column} column
     * @param {ERMrest.Filters.OPERATOR} operator
     * @param {String | Number} rvalue
     * @throws {ERMrest.Errors.InvalidFilterOperatorError} invalid filter operator
     * @constructor
     */
    function BinaryPredicate (column, operator, rvalue) {
        if (!module.isValidOperator(operator)) {
            throw new module.InvalidFilterOperatorError("'" + operator + "' is not a valid operator", this._path, '');
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
                module._fixedEncodeURIComponent(this.column.name) :
                // Pathcolumn
                module._fixedEncodeURIComponent(this.column.pathtable.alias) + ":" + module._fixedEncodeURIComponent(this.column.column.name));
            return colName + this.operator + module._fixedEncodeURIComponent(this.rvalue);
        }
    };
