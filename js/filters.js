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

    function Negation (filter) {
        this.filter = filter;
    }

    Negation.prototype = {
        constructor: Negation,

        toUri: function () {
            return "!(" + this.filter.toUri() + ")";
        }
    };

    function Conjunction (filters) {
        this.filters = filters;
    }

    Conjunction.prototype = {
        constructor: Conjunction,

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

    function Disjunction (filters) {
        this.filters = filters;
    }

    Disjunction.prototype = {
        constructor: Disjunction,

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

    function UnaryPredicate (column, operator) {
        this.column = column; // pathcolumn or column
        this.operator = operator;
    }

    UnaryPredicate.prototype = {
        constructor: UnaryPredicate,

        toUri: function() {
            var colName =  (this.column instanceof Column ?
                // Column
                this.column.name :
                // Pathcolumn
            "$" + this.column.pathtable.alias + ":" + this.column.column.name);
            return colName + this.operator;
        }
    };

    function BinaryPredicate (column, operator, rvalue) {

        this.column = column; // either pathcolumn or column
        this.operator = operator;
        this.rvalue = rvalue;
    }

    BinaryPredicate.prototype = {
        constructor: BinaryPredicate,

        toUri: function() {
            var colName =  (this.column instanceof Column ?
                // Column
                this.column.name :
                // Pathcolumn
                "$" + this.column.pathtable.alias + ":" + this.column.column.name);
            return colName + this.operator + this.rvalue;
        }
    };


    return module;

}(ERMrest || {}));
