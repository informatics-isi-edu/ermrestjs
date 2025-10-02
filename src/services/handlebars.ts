/* eslint-disable no-useless-escape */
import Handlebars from 'handlebars';
import moment from 'moment-timezone';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

import { _handlebarsHelpersList } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import HistoryService from '@isrd-isi-edu/ermrestjs/src/services/history';

import {
  _addErmrestVarsToTemplate,
  _addTemplateVars,
  _escapeMarkdownCharacters,
  _formatUtils,
  _getPath,
  encodeFacet,
  encodeFacetString,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import AuthnService from '@isrd-isi-edu/ermrestjs/src/services/authn';
import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import printf from '@isrd-isi-edu/ermrestjs/js/format';
import { type Catalog } from '@isrd-isi-edu/ermrestjs/js/core';

export default class HandlebarsService {
  private static _setupDone = false;
  private static _handlebarsHelpersHash: Record<string, boolean> = {};
  // Cache to store all the handlebar templates to reduce compute time
  private static _handlebarsCompiledTemplates: Record<string, HandlebarsTemplateDelegate> = {};

  static get handlebars() {
    if (!HandlebarsService._setupDone) {
      HandlebarsService._setupDone = true;

      // inject the custom handlebars
      HandlebarsService._injectCustomHandlebarHelpers();

      // loop through handlebars defined list of helpers and check against the enum in ermrestJs
      // if not in enum, set helper to false
      // should help defend against new helpers being exposed without us being aware of it
      Object.keys(Handlebars.helpers).forEach(function (key) {
        HandlebarsService._handlebarsHelpersHash[key] = _handlebarsHelpersList.includes(key);
      });
    }

    return Handlebars;
  }

  /**
   * @function
   * @public
   * @param template The template string to transform
   * @param keyValues The key-value pair of object to be used for template tags replacement.
   * @param catalog The catalog object created by ermrestJS representing the current catalog from the url
   * @param options Configuration options.
   * @return {string} A string produced after templating
   * @desc Calls the private function to return a string produced as a result of templating using `Handlebars`.
   */
  static render(template: string, keyValues: Record<string, any>, catalog: Catalog | { id: string }, options: any): string | null {
    options = options || {};

    const obj = _addTemplateVars(keyValues, catalog, options);
    let content, _compiledTemplate;

    // If we should validate, validate the template and if returns false, return null.
    if (!options.avoidValidation && !HandlebarsService.validate(template, obj, catalog)) {
      return null;
    }

    try {
      // Read template from cache
      _compiledTemplate = HandlebarsService._handlebarsCompiledTemplates[template];

      // If template not found then add it to cache
      if (!_compiledTemplate) {
        const compileOptions = {
          knownHelpersOnly: true,
          knownHelpers: HandlebarsService._handlebarsHelpersHash,
        };

        HandlebarsService._handlebarsCompiledTemplates[template] = _compiledTemplate = HandlebarsService.handlebars.compile(template, compileOptions);
      }

      // Generate content from the template
      content = _compiledTemplate(obj);
    } catch (e) {
      $log.error(e);
      content = null;
    }

    return content;
  }

  /**
   * Returns true if all the used keys have values.
   *
   * NOTE:
   * This implementation is very limited and if conditional Handlebar statements
   * of the form {{#if }}{{/if}} or {{^if VARNAME}}{{/if}} or {{#unless VARNAME}}{{/unless}} or {{^unless }}{{/unless}} found then it won't check
   * for null values and will return true.s
   *
   * @param  template       mustache template
   * @param  keyValues      key-value pairs
   * @param  catalog        the catalog object
   * @param  ignoredColumns the columns that should be ignored (optional)
   * @return true if all the used keys have values
   */
  static validate(template: string, keyValues: Record<string, any>, catalog: any, ignoredColumns?: string[]): boolean {
    const conditionalRegex = /\{\{(((#|\^)([^\{\}]+))|(if|unless|else))([^\{\}]+)\}\}/;
    let i, key, value;

    // Inject ermrest internal utility objects such as date
    // needs to be done in the case _validateTemplate is called without first calling _renderTemplate
    _addErmrestVarsToTemplate(keyValues, catalog);

    // If no conditional handlebars statements of the form {{#if VARNAME}}{{/if}} or {{^if VARNAME}}{{/if}} or {{#unless VARNAME}}{{/unless}} or {{^unless VARNAME}}{{/unless}} not found then do direct null check
    if (!conditionalRegex.exec(template)) {
      // Grab all placeholders ({{PROP_NAME}}) in the template
      const placeholders = template.match(/\{\{([^\{\}\(\)\s]+)\}\}/gi);

      // These will match the placeholders that are encapsulated in square brackets {{[string with space]}} or {{{[string with space]}}}
      const specialPlaceholders = template.match(/\{\{((\[[^\{\}]+\])|(\{\[[^\{\}]+\]\}))\}\}/gi);

      // If there are any placeholders
      if (placeholders && placeholders.length) {
        // Get unique placeholders
        const uniquePlaceholders = placeholders.filter(function (item, i, ar) {
          return ar.indexOf(item) === i && item !== 'else';
        });

        /*
         * Iterate over all placeholders to set pattern as null if any of the
         * values turn out to be null or undefined
         */
        for (i = 0; i < uniquePlaceholders.length; i++) {
          // Grab actual key from the placeholder {{name}} = name, remove "{{" and "}}" from the string for key
          key = uniquePlaceholders[i].substring(2, uniquePlaceholders[i].length - 2);

          if (key[0] == '{') key = key.substring(1, key.length - 1);

          // find the value.
          value = _getPath(keyValues, key.trim());

          // TODO since we're not going inside the object this logic of ignoredColumns is not needed anymore,
          // it was a hack that was added for asset columns.
          // If key is not in ingored columns value for the key is null or undefined then return null
          if ((!Array.isArray(ignoredColumns) || ignoredColumns.indexOf(key) === -1) && (value === null || value === undefined)) {
            return false;
          }
        }
      }

      // If there are any placeholders
      if (specialPlaceholders && specialPlaceholders.length) {
        // Get unique placeholders
        const uniqueSpecialPlaceholders = specialPlaceholders.filter(function (item, i, ar) {
          return ar.indexOf(item) === i && item !== 'else';
        });

        /*
         * Iterate over all specialPlaceholders to set pattern as null if any of the
         * values turn out to be null or undefined
         */
        for (i = 0; i < uniqueSpecialPlaceholders.length; i++) {
          // Grab actual key from the placeholder {{name}} = name, remove "{{" and "}}" from the string for key
          key = uniqueSpecialPlaceholders[i].substring(2, uniqueSpecialPlaceholders[i].length - 2);

          if (key[0] == '{') key = key.substring(1, key.length - 1);

          // Remove [] from the key {{[name]}} = name, remove "[" and "]" from the string for key
          key = key.substring(1, key.length - 1);

          // find the value.
          value = _getPath(keyValues, key.trim());

          // TODO since we're not going inside the object this logic of ignoredColumns is not needed anymore,
          // it was a hack that was added for asset columns.
          // If key is not in ingored columns value for the key is null or undefined then return null
          if ((!Array.isArray(ignoredColumns) || ignoredColumns.indexOf(key) === -1) && (value === null || value === undefined)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private static _injectCustomHandlebarHelpers() {
    // general purpose helpers
    Handlebars.registerHelper({
      /**
       * escape markdown characters
       * @ignore
       * @returns escaped characeters
       */
      escape: function (...args) {
        // last argument is options object provided by handlebars
        const text = args.splice(0, args.length - 1).join('');
        return _escapeMarkdownCharacters(text);
      },

      /**
       * @ignore
       * @returns url-encoded string
       */
      encode: function (...args) {
        const text = args.splice(0, args.length - 1).join('');
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
      encodeFacet: function (options: Handlebars.HelperOptions | string | any) {
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
       * {{formatDatetime value format}}
       * @ignore
       * @returns formatted string of `value` with corresponding `format`
       */
      formatDatetime: function (value, format) {
        const m = moment(value);
        // if we don't validate, it will return "invalid date"
        if (m.isValid()) {
          return m.format(format);
        }
        return '';
      },

      /**
       * {{formatDate value format}}
       * @deprecated use formatDatetime instead
       * @returns formatted string of `value` with corresponding `format`
       */
      formatDate: function (value, format) {
        const m = moment(value);
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
      replace: function (substr: string, newSubstr: string, options) {
        let flags = 'g';
        if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
          flags = options.hash.flags;
        }
        const regexpObj = new RegExp(substr, flags);
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
        let flags = 'g';
        if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
          flags = options.hash.flags;
        }
        const regexpObj = new RegExp(regexp, flags);
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
        let flags = 'g';
        if (options && isObjectAndNotNull(options.hash) && typeof options.hash.flags === 'string') {
          flags = options.hash.flags;
        }
        const matches = regexpFindAll(value, regexp, flags);
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
      regexFindAll: function (value: string, regexp: string, options?: Handlebars.HelperOptions) {
        let flags = 'g';
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
      toTitleCase: function (options: Handlebars.HelperOptions) {
        const str = options.fn(this);
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
      humanizeBytes: function (value: number, options: Handlebars.HelperOptions) {
        let mode, precision, tooltip;
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
      stringLength: function (value: string) {
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

      /**
       * {{dateTimeToSnapshot value}}
       */
      datetimeToSnapshot: function (value: string) {
        const m = moment(value);
        // if we don't validate, it will return "invalid date"
        if (m.isValid()) {
          try {
            return HistoryService.datetimeISOToSnapshot(m.toISOString());
          } catch (e) {
            $log.error(`error while converting ${value} to snapshot`);
            $log.error(e);
            return '';
          }
        } else {
          $log.error(`invalid timestamp passed to datetimeToSnapshot: ${value}`);
        }
        return '';
      },

      /**
       * {{snapshotToDatetime value}}
       * {{snapshotToDatetime value 'YYYY-MM-DD HH:mm:ss'}}
       */
      snapshotToDatetime: function (value: string, format?: string) {
        try {
          const iso = HistoryService.snapshotToDatetimeISO(value);
          if (typeof format === 'string') {
            return moment(iso).format(format);
          }
          return iso;
        } catch (e) {
          $log.error(`error in snapshotToDatetime while converting ${value} to ISO`);
          $log.error(e);
          return '';
        }
      },
    });

    // compare helpers
    Handlebars.registerHelper({
      /*
       *{{#if (eq val1 val2)}}
       *   .. content
       *{{/if}}
       */
      eq: function (...args) {
        return reduceOp(args, (a, b) => a === b);
      },
      /*
       *{{#if (ne val1 val2)}}
       *   .. content
       *{{/if}}
       */
      ne: function (...args) {
        return reduceOp(args, (a, b) => a !== b);
      },
      /*
       *{{#if (lt val1 val2)}}
       *   .. content
       *{{/if}}
       */
      lt: function (...args) {
        return reduceOp(args, (a, b) => a < b);
      },
      /*
       *{{#if (gt val1 val2)}}
       *   .. content
       *{{/if}}
       */
      gt: function (...args) {
        return reduceOp(args, (a, b) => a > b);
      },
      /*
       *{{#if (lte val1 val2)}}
       *   .. content
       *{{/if}}
       */
      lte: function (...args) {
        return reduceOp(args, (a, b) => a <= b);
      },
      /*
       *{{#if (gte val1 val2)}}
       *    .. content
       *{{/if}}
       */
      gte: function (...args) {
        return reduceOp(args, (a, b) => a >= b);
      },
      /*
       *{{#if (and section1 section2)}}
       *   .. content
       *{{/if}}
       */
      and: function (...args) {
        return reduceOp(args, (a, b) => a && b);
      },
      /*
       *{{#if (or section1 section2)}}
       *   .. content
       *{{/if}}
       */
      or: function (...args) {
        return reduceOp(args, (a: boolean, b: boolean) => a || b);
      },
      /*
       *{{#if (not section1)}}
       *   .. content
       *{{/if}}
       */
      not: function (a) {
        return !a;
      },
      /*
       *{{#ifCond value "===" value2}}
       *   Values are equal!
       *{{else}}
       *   Values are different!
       *{{/ifCond}}
       */
      ifCond: function (v1, operator: string, v2, options: Handlebars.HelperOptions) {
        switch (operator) {
          case '==':
            // eslint-disable-next-line eqeqeq
            return v1 == v2 ? options.fn(this) : options.inverse(this);
          case '===':
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case '!=':
            // eslint-disable-next-line eqeqeq
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
      add: function (arg1: unknown, arg2: unknown) {
        return Number(arg1) + Number(arg2);
      },

      subtract: function (arg1: unknown, arg2: unknown) {
        return Number(arg1) - Number(arg2);
      },
    });
  }
}

// allows recursive support of the given reducer function to be applied to args
const reduceOp = function (args: any[], reducer: (a: boolean, b: boolean) => boolean) {
  args = Array.from(args);
  args.pop(); // => options
  const first = args.shift();
  return args.reduce(reducer, first);
};

const regexpFindAll = function (value: string, regexp: string, flags: string) {
  const regexpObj = new RegExp(regexp, flags);
  const matches = value.match(regexpObj);

  return matches;
};
