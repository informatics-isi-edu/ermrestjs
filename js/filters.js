var Filters = (function() {

    var my = {};

    my.Negation = function (filter) {
        this.filter = filter;
    };

    my.Conjunction = function (filters) {
        this.filters = filters;
    };

    my.Disjunction = function (filters) {
        this.filters = filters;
    };

    my.UnaryPredicate = function (column, operator) {
        this.column = column; // pathcolumn or column
        this.operator = operator;
    };

    my.BinaryPredicate = function (column, operator, rvalue) {

        this.column = column; // either pathcolumn or column
        this.operator = operator;
        this.rvalue = rvalue;
    };

    my.OPERATOR = {
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
    my.filterToUri = function (filter) {

        var uri = "";

        // Extend the URI with the filters.js
        var filters = [];

        // multiple filters.js
        if (filter instanceof my.Conjunction || filter instanceof my.Disjunction) {
            filters = filters.concat(filter.filters); // only one filter
        } else if (filter instanceof my.Negation) {
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
            if (f instanceof my.Negation) {
                f = f.filter;
                negate = true;
            }
            if (f instanceof my.BinaryPredicate) {
                filterString = f.column + f.operator + f.rvalue;
            } else if (f instanceof my.UnaryPredicate) {
                filterString = f.column + f.operator;
            }


            if (filter instanceof my.Negation || negate) {

                filterString = "!(" + filterString + ")";
            }

            filterStrings[i] = filterString;
        }

        if (filter instanceof my.Conjunction) {
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + "/" + filterStrings[j];
                else
                    uri = uri + "&" + filterStrings[j];
            }
        } else if (filter instanceof my.Disjunction) {
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

    return my;

}());
