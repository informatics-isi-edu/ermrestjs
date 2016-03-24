var ERMrest = (function(module) {

    module.Negation = function (filter) {
        this.filter = filter;
    };

    module.Conjunction = function (filters) {
        this.filters = filters;
    };

    module.Disjunction = function (filters) {
        this.filters = filters;
    };

    module.UnaryPredicate = function (column, operator) {
        this.column = column; // pathcolumn or column
        this.operator = operator;
    };

    module.BinaryPredicate = function (column, operator, rvalue) {

        this.column = column; // either pathcolumn or column
        this.operator = operator;
        this.rvalue = rvalue;
    };

    module.OPERATOR = {
        EQUAL: "=",
        GREATER_THAN: "::gt::",
        LESS_THAN: "::lt::",
        NULL: "::null::"
    };

    /**
     * @function
     * @param {String} filter filter to be converted into URI.
     * @desc
     * returns an URI string for the given filter
     */
    module.filterToUri = function (filter) {

        var uri = "";

        // Extend the URI with the filters.js
        var filters = [];

        // multiple filters.js
        if (filter instanceof module.Conjunction || filter instanceof module.Disjunction) {
            filters = filters.concat(filter.filters); // only one filter
        } else if (filter instanceof module.Negation) {
            filters.push(filter.filter);
        } else {
            filters.push(filter);
        }

        // loop through individual filters.js to create filter strings
        var filterStrings = [];
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];

            var filterString = "";
            var negate = false;
            if (f instanceof module.Negation) {
                f = f.filter;
                negate = true;
            }
            if (f instanceof module.BinaryPredicate) {
                filterString = f.column + f.operator + f.rvalue;
            } else if (f instanceof module.UnaryPredicate) {
                filterString = f.column + f.operator;
            }


            if (filter instanceof module.Negation || negate) {

                filterString = "!(" + filterString + ")";
            }

            filterStrings[i] = filterString;
        }

        if (filter instanceof module.Conjunction) {
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + "/" + filterStrings[j];
                else
                    uri = uri + "&" + filterStrings[j];
            }
        } else if (filter instanceof module.Disjunction) {
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + "/" + filterStrings[j];
                else
                    uri = uri + ";" + filterStrings[j];
            }
        } else { // single filter
            uri = uri + "/" + filterStrings[0];
        }

        return uri;
    };

    return module;

}(ERMrest || {}));
