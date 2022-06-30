(function() {

    // allows recursive support of the given reducer function to be applied to args
    var reduceOp = function (args, reducer) {
        args = Array.from(args);
        args.pop(); // => options
        var first = args.shift();
        return args.reduce(reducer, first);
    };

    var regexpFindAll = function (value, regexp) {
        var regexpObj = new RegExp(regexp, 'g');
        var matches = value.match(regexpObj);

        return matches;
    };

    module._injectCustomHandlebarHelpers = function (Handlebars) {
        // general purpose helpers
        Handlebars.registerHelper({

            /**
             * escape markdown characters
             *
             * @returns escaped characeters
             */
            escape: function () {
                var args = Array.prototype.slice.call(arguments);
                var text = args.splice(0, args.length - 1).join('');
                return module._escapeMarkdownCharacters(text);
            },

            /**
             *
             * @returns url-encoded string
             */
            encode: function () {
                var args = Array.prototype.slice.call(arguments);
                var text = args.splice(0, args.length - 1).join('');
                return module._fixedEncodeURIComponent(text);
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
             * {{formatDate value format}}
             *
             * @returns formatted string of `value` with corresponding `format`
             */
            formatDate: function (value, format) {
                var m = module._moment(value);
                // if we don't validate, it will return "invalid date"
                if (m.isValid()) {
                    return m.format(format);
                }
                return "";
            },

            /**
             * {{#jsonStringify}}
             *  JSON Object
             * {{/jsonStringify}}
             *
             * @returns string representation of the given JSON object
             */
            jsonStringify: function (options) {
                return JSON.stringify(options.fn(this));
            },

            /**
             * {{#replace substr newSubstr}}
             *  string
             * {{/replace}}
             *
             * @returns replaces each match of the regexp with newSubstr
             */
            replace: function (substr, newSubstr, options) {
                var regexpObj = new RegExp(substr, 'g');

                return options.fn(this).replace(regexpObj, newSubstr);
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
             * {{#each (regexFindFirst value regexp)}}
             *   {{this}}
             * {{/each}}
             *
             * @returns first string from value that matches the regular expression or empty string
             */
            regexFindFirst: function (value, regexp) {
                var matches = regexpFindAll(value, regexp);
                return (matches && matches[0]) || "";
            },

            /**
             * {{#each (regexFindAll value regexp)}}
             *   {{this}}
             * {{/each}}
             *
             * @returns array of strings from value that match the regular expression or
             */
            regexFindAll: function (value, regexp) {
                return regexpFindAll(value, regexp) || [];
            },

            /**
             * {{#toTitleCase}}
             *  string
             * {{/toTitleCase}}
             *
             * @returns string representation of the given JSON object
             */
            toTitleCase: function (options) {
                var str = options.fn(this);
                // \w matches any word character
                // \S matches any non-whitespace character
                return str.replace(/\w\S*/g, function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1);
                });
            }

        });

        // compare helpers
        Handlebars.registerHelper({
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
               {{#if (not section1)}}
                 .. content
                {{/if}}
             */
            not: function (a) {
                return !a;
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

        // math helpers
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
