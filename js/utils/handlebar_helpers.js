import moment from 'moment-timezone';

import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

import printf from '@isrd-isi-edu/ermrestjs/js/format';
import { _formatUtils, _escapeMarkdownCharacters, encodeFacetString, encodeFacet } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import AuthnService from '@isrd-isi-edu/ermrestjs/src/services/authn';

// allows recursive support of the given reducer function to be applied to args
const reduceOp = function (args, reducer) {
  args = Array.from(args);
  args.pop(); // => options
  var first = args.shift();
  return args.reduce(reducer, first);
};

const regexpFindAll = function (value, regexp, flags) {
  var regexpObj = new RegExp(regexp, flags);
  var matches = value.match(regexpObj);

  return matches;
};

export default function _injectCustomHandlebarHelpers(Handlebars) {
  // general purpose helpers
  Handlebars.registerHelper({
    /**
     * escape markdown characters
     * @ignore
     * @returns escaped characeters
     */
    escape: function () {
      var args = Array.prototype.slice.call(arguments);
      var text = args.splice(0, args.length - 1).join('');
      return _escapeMarkdownCharacters(text);
    },

    /**
     * @ignore
     * @returns url-encoded string
     */
    encode: function () {
      var args = Array.prototype.slice.call(arguments);
      var text = args.splice(0, args.length - 1).join('');
      return fixedEncodeURIComponent(text);
    },

    /**
     * {{#encodeFacet}}
     *  str
     * {{/encodeFacet}}
     *
     * or
     *
     * {{encodeFacet obj}}
     *
     * or
     *
     * {{encodeFacet str}}
     *
     * This is order of checking syntax (first applicaple rule):
     * - first see if the block syntax with str inside it is used or not
     * - if the input is an object we will encode it
     * - try encoding as string (will return empty string if it wasn't a string)
     * @ignore
     * @returns encoded facet string that can be used in url
     */
    encodeFacet: function (options) {
      try {
        return encodeFacetString(options.fn(this));
      } catch {
        if (isObjectAndNotNull(options)) {
          return encodeFacet(options);
        }
      }
      return encodeFacetString(options);
    },

    /**
     * {{printf value "%4d" }}
     * @ignore
     */
    printf: function (value, format) {
      return printf({ format: format }, value);
    },

    /**
     * {{formatDate value format}}
     * @ignore
     * @returns formatted string of `value` with corresponding `format`
     */
    formatDate: function (value, format) {
      var m = moment(value);
      // if we don't validate, it will return "invalid date"
      if (m.isValid()) {
        return m.format(format);
      }
      return '';
    },

    /**
     * {{#jsonStringify}}
     *  JSON Object
     * {{/jsonStringify}}
     *
     * or
     *
     * {{#jsonStringify obj}}{{/jsonStringify}}
     * @ignore
     * @returns string representation of the given JSON object
     */
    jsonStringify: function (options) {
      try {
        return JSON.stringify(options.fn(this));
      } catch {
        return JSON.stringify(options);
      }
    },

    /**
     * {{#replace substr newSubstr}}
     *  string
     * {{/replace}}
     *
     * {{replace value regexp flags="ig"}}
     * @ignore
     * @returns replaces each match of the regexp with newSubstr
     */
    replace: function (substr, newSubstr, options) {
      var flags = 'g';
      if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
        flags = options.hash.flags;
      }
      var regexpObj = new RegExp(substr, flags);
      return options.fn(this).replace(regexpObj, newSubstr);
    },

    /**
     * {{#if (regexMatch value regexp)}}
     *   .. content
     * {{/if}}
     *
     * {{regexMatch value regexp flags="i"}}
     * @ignore
     * @returns boolean if the value matches the regexp
     */
    regexMatch: function (value, regexp, options) {
      var flags = 'g';
      if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
        flags = options.hash.flags;
      }
      var regexpObj = new RegExp(regexp, flags);
      return regexpObj.test(value);
    },

    /**
     * {{#each (regexFindFirst value regexp)}}
     *   {{this}}
     * {{/each}}
     *
     * {{regexFindFirst value regexp flags="i"}}
     * @ignore
     * @returns first string from value that matches the regular expression or empty string
     */
    regexFindFirst: function (value, regexp, options) {
      var flags = 'g';
      if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
        flags = options.hash.flags;
      }
      var matches = regexpFindAll(value, regexp, flags);
      return (matches && matches[0]) || '';
    },

    /**
     * {{#each (regexFindAll value regexp)}}
     *   {{this}}
     * {{/each}}
     *
     * {{regexFindFirst value regexp flags="ig"}}
     * @ignore
     * @returns array of strings from value that match the regular expression or
     */
    regexFindAll: function (value, regexp, options) {
      var flags = 'g';
      if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
        flags = options.hash.flags;
      }
      return regexpFindAll(value, regexp, flags) || [];
    },

    /**
     * {{#toTitleCase}}
     *  string
     * {{/toTitleCase}}
     * @ignore
     * @returns string representation of the given JSON object
     */
    toTitleCase: function (options) {
      var str = options.fn(this);
      // \w matches any word character
      // \S matches any non-whitespace character
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
      });
    },

    /**
     * {{humanizeBytes value }}
     * {{humanizeBytes value mode='si' }}
     * {{humanizeBytes value precision=4}}
     * {{humanizeBytes value tooltip=true }}
     * @ignore
     * @returns formatted string of `value` with corresponding `mode`
     */
    humanizeBytes: function (value, options) {
      var mode, precision, tooltip;
      if (options && isObjectAndNotNull(options.hash)) {
        mode = options.hash.mode;
        precision = options.hash.precision;
        tooltip = options.hash.tooltip;
      }
      return _formatUtils.humanizeBytes(value, mode, precision, tooltip);
    },

    /**
     * {{stringLength value }}
     * @ignore
     * @returns the length of the given string
     */
    stringLength: function (value) {
      return value.length;
    },

    /**
     * {{isUserInAcl group1 group2 }}}
     * {{isUserInAcl groupArray }}
     * {{isUserInAcl "https:/some-group" "https://another-group" }}
     *
     * @returns a boolean indicating if the user is in any of the given groups
     */
    isUserInAcl: function (...args) {
      const groups = args.reduce((acc, arg) => {
        if (Array.isArray(arg)) {
          return acc.concat(arg);
        } else if (typeof arg === 'string') {
          return acc.concat([arg]);
        }
        return acc;
      }, []);

      return AuthnService.isUserInAcl(groups);
    },
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
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case '===':
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case '!=':
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        case '!==':
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case '<':
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case '<=':
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case '>':
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case '>=':
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case '&&':
          return v1 && v2 ? options.fn(this) : options.inverse(this);
        case '||':
          return v1 || v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
  });

  // math helpers
  Handlebars.registerHelper({
    add: function (arg1, arg2) {
      return Number(arg1) + Number(arg2);
    },

    subtract: function (arg1, arg2) {
      return Number(arg1) - Number(arg2);
    },
  });
}
