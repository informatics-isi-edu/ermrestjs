	(function() {
		module._injectExternalHandlerbarHelper = function(Handlebars) {

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

			    /*
			       {{#if (eq val1 val2)}}
 					.. content
					{{/if}}
				 */
			    eq: function (v1, v2) {
			        return v1 === v2;
			    },
			    /*
			       {{#if (ne val1 val2)}}
 					.. content
					{{/if}}
				 */
			    ne: function (v1, v2) {
			        return v1 !== v2;
			    },
			    /*
			       {{#if (lt val1 val2)}}
 					.. content
					{{/if}}
				 */
			    lt: function (v1, v2) {
			        return v1 < v2;
			    },
			    /*
			       {{#if (gt val1 val2)}}
 					.. content
					{{/if}}
				 */
			    gt: function (v1, v2) {
			        return v1 > v2;
			    },
			    /*
			       {{#if (lte val1 val2)}}
 					.. content
					{{/if}}
				 */
			    lte: function (v1, v2) {
			        return v1 <= v2;
			    },
			    /*
			       {{#if (gte val1 val2)}}
 					.. content
					{{/if}}
				 */
			    gte: function (v1, v2) {
			        return v1 >= v2;
			    },
			    /*
			       {{#if (and section1 section2)}}
 					.. content
					{{/if}}
				 */
			    and: function (v1, v2) {
			        return v1 && v2;
			    },
			    /*
			       {{#if (or section1 section2)}}
 					.. content
					{{/if}}
				 */
			    or: function (v1, v2) {
			        return v1 || v2;
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
	}());
