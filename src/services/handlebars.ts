/* eslint-disable no-useless-escape */
import Handlebars from 'handlebars';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

import _injectCustomHandlebarHelpers from '@isrd-isi-edu/ermrestjs/js/utils/handlebar_helpers';
import { _handlebarsHelpersList } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { _addErmrestVarsToTemplate, _addTemplateVars, _getPath } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

export default class HandlebarsService {
  private static _setupDone = false;
  private static _handlebarsHelpersHash: Record<string, boolean> = {};
  // Cache to store all the handlebar templates to reduce compute time
  private static _handlebarsCompiledTemplates: Record<string, HandlebarsTemplateDelegate> = {};

  static get handlebars() {
    if (!HandlebarsService._setupDone) {
      HandlebarsService._setupDone = true;

      // inject the custom handlebars
      _injectCustomHandlebarHelpers(Handlebars);

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
  static render(template: string, keyValues: Record<string, any>, catalog: any, options: any): string | null {
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
}
