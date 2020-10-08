(function() {

    // allows recursive support of the given reducer function to be applied to args
    var reduceOp = function (args, reducer) {
        args = Array.from(args);
        args.pop(); // => options
        var first = args.shift();
        return args.reduce(reducer, first);
    };

    module._injectHandlerbarCompareHelpers = function(Handlebars) {

        Handlebars.registerHelper({
            /**
             * {{formatDate value format}}
             *
             * @returns formatted string of `value` with corresponding `format`
             */
            formatDate: function (value, format) {
                return module._moment(value).format(format);
            },

            /**
             * {{#encodeFacet}}
             *  str
             * {{/encodeFacet}}
             *
             * @returns encoded facet string that can be used in url
             */
            encodeFacet: function (options) {
                return module.encodeFacetString(options.fn(this));
            },

            /**
             * {{#if (regexMatch value regexp)}}
             *   .. content
             * {{/if}}
             *
             * @returns boolean if the value matches the regexp
             */
            regexMatch: function (value, regexp) {
                var regexpObj = new RegExp(regexp);
                return regexpObj.test(value);
            },

            /**
             * {{#each (regexFindAll value regexp)}}
             *   {{this}}
             * {{/each}}
             *
             * @returns array of strings that match the regular expression
             */
            regexFindAll: function (value, regexp) {
                var regexpObj = new RegExp(regexp, 'g');
                // var parts = value.match("/" + regexp + "/");

                var matches = [];
                var regexpArray;
                while ( (regexpArray = regexpObj.exec(value)) !== null) {
                    matches.push(regexpArray[0]);
                }
                // for (var j=1; j<parts.length; j++) {
                //     matches.push(parts[j]);
                // }
                return matches;
            },

            /*
               {{#if (eq val1 val2)}}
                 .. content
                {{/if}}
             */
            eq: function () {
                return reduceOp(arguments, function (a, b) {
                    return a === b;
                });
            },
            /*
               {{#if (ne val1 val2)}}
                 .. content
                {{/if}}
             */
            ne: function () {
                return reduceOp(arguments, function (a, b) {
                    return a !== b;
                });
            },
            /*
               {{#if (lt val1 val2)}}
                 .. content
                {{/if}}
             */
            lt: function () {
                return reduceOp(arguments, function (a, b) {
                    return a < b;
                });
            },
            /*
               {{#if (gt val1 val2)}}
                 .. content
                {{/if}}
             */
            gt: function () {
                return reduceOp(arguments, function (a, b) {
                    return a > b;
                });
            },
            /*
               {{#if (lte val1 val2)}}
                 .. content
                {{/if}}
             */
            lte: function () {
                return reduceOp(arguments, function (a, b) {
                    return a <= b;
                });
            },
            /*
               {{#if (gte val1 val2)}}
                 .. content
                {{/if}}
             */
            gte: function () {
                return reduceOp(arguments, function (a, b) {
                    return a >= b;
                });
            },
            /*
               {{#if (and section1 section2)}}
                 .. content
                {{/if}}
             */
            and: function () {
                return reduceOp(arguments, function (a, b) {
                    return a && b;
                });
            },
            /*
               {{#if (or section1 section2)}}
                 .. content
                {{/if}}
             */
            or: function () {
                return reduceOp(arguments, function (a, b) {
                    return a || b;
                });
            },
            /*
                {{#ifCond value "===" value2}}
                    Values are equal!
                {{else}}
                    Values are different!
                {{/ifCond}}
              */
            ifCond: function (v1, operator, v2, options) {
                switch (operator) {
                    case '==':
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '!=':
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);
                    case '!==':
                        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }
            }
        });
    };

    module._injectHandlerbarMathHelpers = function(Handlebars) {

        Handlebars.registerHelper({
            add: function (arg1, arg2) {
                return Number(arg1) + Number(arg2);
            },

            subtract: function (arg1, arg2) {
                return Number(arg1) - Number(arg2);
            }
        });
    };
}());
