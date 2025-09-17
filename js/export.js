/* eslint-disable @typescript-eslint/no-this-alias */

// models
import { InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

// utils
import { isObjectAndNotNull, isStringAndNotEmpty, ObjectHasAllKeys } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent, trimSlashes, simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { _annotations, contextHeaderName, _contexts, _exportKnownAPIs, URL_PATH_LENGTH_LIMIT } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import {
  _getAnnotationValueByContext,
  _getRecursiveAnnotationValue,
  _getCandidateRowNameColumn,
  _sanitizeFilename,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

export const _exportHelpers = {
  /**
   *
   * Returns the export templates that are defined on this table.
   * NOTE If this returns `null`, then the exportTemplates is not defined on the table or schema
   * NOTE The returned array should not be directly used as it might be using fragments
   * @param {Table} table
   * @param {string} context
   * @private
   * @ignore
   */
  getExportAnnotTemplates: function (table, context) {
    var exp = _annotations.EXPORT,
      expCtx = _annotations.EXPORT_CONTEXTED,
      annotDefinition = {},
      hasAnnot = false,
      chosenAnnot,
      templates = [];

    // start from table, then try schema, and then catalog
    [table, table.schema, table.schema.catalog].forEach(function (el) {
      if (hasAnnot) return;

      // get from table annotation
      if (el.annotations.contains(exp)) {
        annotDefinition = { '*': el.annotations.get(exp).content };
        hasAnnot = true;
      }

      // get from table contextualized annotation
      if (el.annotations.contains(expCtx)) {
        annotDefinition = Object.assign({}, annotDefinition, el.annotations.get(expCtx).content);
        hasAnnot = true;
      }

      if (hasAnnot) {
        // find the annotation defined for the context
        chosenAnnot = _getAnnotationValueByContext(context, annotDefinition);

        // not defined for the context
        if (chosenAnnot === -1) {
          hasAnnot = false;
        }
        // make sure it's the correct format
        else if (isObjectAndNotNull(chosenAnnot) && 'templates' in chosenAnnot && Array.isArray(chosenAnnot.templates)) {
          templates = chosenAnnot.templates;
        }
      }
    });

    if (hasAnnot) {
      return templates;
    }

    return null;
  },

  /**
   * Return the export fragments that should be used with export annotation.
   * @param {Table} table
   * @param {Object} defaultExportTemplate
   * @returns An object that can be used in combination with export annotation
   * @private
   * @ignore
   */
  getExportFragmentObject: function (table, defaultExportTemplate) {
    var exportFragments = {
      $chaise_default_bdbag_template: {
        type: 'BAG',
        displayname: { fragment_key: '$chaise_default_bdbag_displayname' },
        outputs: [{ fragment_key: '$chaise_default_bdbag_outputs' }],
      },
      $chaise_default_bdbag_displayname: 'BDBag',
      $chaise_default_bdbag_outputs: defaultExportTemplate ? defaultExportTemplate.outputs : null,
    };
    var annotKey = _annotations.EXPORT_FRAGMENT_DEFINITIONS,
      annot;
    [table.schema.catalog, table.schema, table].forEach(function (el) {
      if (!el.annotations.contains(annotKey)) return;

      annot = el.annotations.get(annotKey).content;
      if (isObjectAndNotNull(annot)) {
        // remove the keys that start with $
        Object.keys(annot)
          .filter(function (k) {
            return k.startsWith('$');
          })
          .forEach(function (k) {
            $log.warn('Export: ignoring `' + k + '` fragment as it cannot start with $.');
            delete annot[k];
          });
        Object.assign(exportFragments, annot);
      }
    });

    return exportFragments;
  },

  /**
   * Replace the fragments used in templates with actual definition
   * @param {Array} templates the template definitions
   * @param {*} exportFragments the fragment object
   * @returns An array of templates that should be validated and used
   * @private
   * @ignore
   */
  replaceFragments: function (templates, exportFragments) {
    var hasError;

    // traverse through the object and replace fragment with the actual definition
    var _replaceFragments = function (obj, usedFragments) {
      if (hasError) return null;

      if (!usedFragments) {
        usedFragments = {};
      }

      var res, intRes;

      // if it's an array, then we have to process each individual value
      if (Array.isArray(obj)) {
        res = [];
        obj.forEach(function (item) {
          // flatten the values and just concat with each other
          intRes = _replaceFragments(item, usedFragments);
          if (intRes == null || hasError) {
            res = null;
            return;
          }
          res = res.concat(intRes);
        });

        return res;
      }

      // if it's an object, we have to see whether it's fragment or not
      if (isObjectAndNotNull(obj)) {
        if ('fragment_key' in obj) {
          var fragmentKey = obj.fragment_key;

          // there was a cycle, so just set the variables and abort
          if (fragmentKey in usedFragments) {
            $log.warn(`Export: circular dependency detected in the defined templates and therefore ignored (caused by ${fragmentKey} key)`);
            hasError = true;
            return null;
          }

          // fragment_key is invalid
          if (!(fragmentKey in exportFragments)) {
            hasError = true;
            $log.warn('Export: the given fragment_key `' + fragmentKey + '` is not valid and template will be ignored.');
            return null;
          }

          // replace with actual definition
          var modified = simpleDeepCopy(usedFragments);
          modified[fragmentKey] = true;
          return _replaceFragments(exportFragments[fragmentKey], modified);
        }

        // run the function for each value
        res = {};
        for (var k in obj) {
          intRes = _replaceFragments(obj[k], usedFragments);
          if (intRes == null || hasError) {
            res = null;
            return;
          }
          res[k] = intRes;
        }
        return res;
      }

      // for other data types, just return the input without any change
      return obj;
    };

    var finalRes = [];

    templates.forEach(function (t) {
      hasError = false;
      var tempRes = _replaceFragments(t, {});
      // if there was an issue, the whole thing should return null
      if (tempRes != null) {
        finalRes = finalRes.concat(tempRes);
      }
    });

    return finalRes;
  },
};

/**
 * Given an object, returns a boolean that indicates whether it is a valid template or not
 * NOTE This will only validate the structure and not the values
 * @param  {Object} template
 * @return {boolean}
 */
export const validateExportTemplate = function (template) {
  var errMessage = function (reason) {
    $log.info('export template ignored with displayname=`' + template.displayname + '`. Reason: ' + reason);
  };

  // template is not an object
  if (template !== Object(template) || Array.isArray(template) || !template) {
    $log.info("export template ignored. Reason: it's not an object.");
    return false;
  }

  // doesn't have the expected attributes
  if (!ObjectHasAllKeys(template, ['displayname', 'type'])) {
    $log.info('export template ignored. Reason: first level required attributes are missing.');
    return false;
  }

  //type must be either FILE or BAG
  if (['BAG', 'FILE'].indexOf(template.type) === -1) {
    $log.info('export template ignored. Reason: template.type must be either `BAG` or `FILE`.');
    return false;
  }

  // in FILE, outputs must be properly defined
  if (!Array.isArray(template.outputs) || template.outputs.length === 0) {
    errMessage('outputs must be a non-empty array.');
    return false;
  }

  var output;
  for (var i = 0; i < template.outputs.length; i++) {
    output = template.outputs[i];

    //output must be an object
    if (output !== Object(output) || Array.isArray(output) || !output) {
      errMessage('output index=' + i + ' is not an object.');
      return false;
    }

    // output must have source and destination
    if (!ObjectHasAllKeys(output, ['source', 'destination'])) {
      errMessage('output index=' + i + ' has missing required attributes.');
      return false;
    }

    // output.source must have api
    if (!ObjectHasAllKeys(output.source, ['api'])) {
      errMessage('output.source index=' + i + ' has missing required attributes.');
      return false;
    }

    // output.destination must have at least a type
    if (!ObjectHasAllKeys(output.destination, ['type'])) {
      errMessage('output.destination index=' + i + ' has missing required attributes.');
      return false;
    }
  }

  return true;
};

/**
 * @desc Export Object
 *
 * @memberof ERMrest
 * @class
 * @param {Reference} reference
 * @param {String} bagName the name that will be used for the bag
 * @param {Object} template the tempalte must be in the valid format.
 * @param {String} servicePath the path to the service, i.e. "/deriva/export/"
 *
 *
 * @returns {Export}
 * @constructor
 */
export function Exporter(reference, bagName, template, servicePath) {
  if (!validateExportTemplate(template)) {
    throw new InvalidInputError('Given Template is not valid.');
  }
  if (typeof servicePath !== 'string' || servicePath.length === 0) {
    throw new InvalidInputError('Given service path is not valid.');
  }

  this.reference = reference;
  this.template = template;
  this.servicePath = trimSlashes(servicePath);
  this.formatOptions = {
    BAG: {
      name: bagName,
      algs: ['md5'],
      archiver: 'zip',
      metadata: {},
      table_format: 'csv',
    },
  };
}

Exporter.prototype = {
  constructor: Exporter,

  /**
   * TODO: add description
   */
  get exportParameters() {
    if (this._exportParameters === undefined) {
      var exportParameters = {};
      var bagOptions = this.formatOptions.BAG;
      var template = this.template;

      var bagParameters = {
        bag_name: bagOptions.name,
        bag_algorithms: bagOptions.algs,
        bag_archiver: bagOptions.archiver,
        bag_metadata: bagOptions.metadata,
      };

      exportParameters.bag = bagParameters;

      var base_url = this.reference.location.service;
      var queries = [];
      var catalogParameters = {
        host: base_url.substring(0, base_url.lastIndexOf('/')),
        catalog_id: this.reference.location.catalog,
        query_processors: queries,
      };

      exportParameters.catalog = catalogParameters;

      if (!template) {
        // this is basically the same as a single file CSV or JSON export but packaged as a bag
        var query = {
          processor: bagOptions.table_format,
          processor_params: {
            output_path: bagOptions.name,
            query_path: '/' + this.reference.location.api + '/' + this.reference.location.ermrestCompactPath + '?limit=none',
          },
        };

        queries.push(query);
      } else {
        var outputs = template.outputs;
        var predicate = this.reference.location.ermrestCompactPath;
        var table = this.reference.table.name;
        var output_path = _sanitizeFilename(this.reference.displayname.unformatted);

        outputs.forEach(function (output, index) {
          var source = output.source,
            dest = output.destination;
          var query = {},
            queryParams = {};

          // <api>/<current reference path>/<path>
          var queryFrags = [];
          if (isStringAndNotEmpty(source.api)) {
            queryFrags.push(source.api);
          }
          if (!source.skip_root_path) {
            queryFrags.push(predicate);
          }
          if (isStringAndNotEmpty(source.path)) {
            // remove the first and last slash if it has one
            const addedPath = trimSlashes(source.path);
            // make sure the path is not empty
            if (addedPath.length > 0) {
              queryFrags.push(addedPath);
            }
          }

          var queryStr = queryFrags.join('/');
          if (queryStr.length > URL_PATH_LENGTH_LIMIT) {
            $log.warn(
              'Cannot send the output index `' + index + '` for table `' + table + '` to ermrest (URL LENGTH ERROR). Generated query:',
              queryStr,
            );
            return;
          }

          // find the character that should be used for added q params
          var qParamCharacter = queryStr.indexOf('?') !== -1 ? '&' : '?';

          /**
           * add limit q param if all the following are set
           *   - skip_limit is not set to true
           *   - API is known.
           *   - it's not part of the url
           */
          var addLimit =
            !source.skip_limit &&
            isStringAndNotEmpty(queryStr) &&
            _exportKnownAPIs.some(function (api) {
              return queryStr.startsWith(api + '/');
            });
          // if limit is already part of the query, don't add it.
          if (addLimit) {
            addLimit = !/[?]([^&=]*=[^&]*[&])*limit=/.test(queryStr);
          }
          if (addLimit) {
            queryStr += qParamCharacter + 'limit=none';
          }

          queryParams.query_path = '/' + queryStr;
          queryParams.output_path = dest.name || output_path;
          if (dest.impl != null) {
            query.processor_type = dest.impl;
          }
          if (dest.params != null) {
            Object.assign(queryParams, dest.params);
          }
          query.processor = dest.type || bagOptions.table_format;
          query.processor_params = queryParams;
          queries.push(query);
        });
      }
      if (template.transforms != null) {
        exportParameters.transform_processors = template.transforms;
      }
      if (template.postprocessors != null) {
        exportParameters.post_processors = template.postprocessors;
      }
      if (template.public != null) {
        exportParameters.public = template.public;
      }
      if (template.bag_archiver != null) {
        exportParameters.bag.bag_archiver = template.bag_archiver;
      }
      if (template.bag_idempotent != null) {
        exportParameters.bag.bag_idempotent = template.bag_idempotent;
      }
      this._exportParameters = exportParameters;
    }

    return this._exportParameters;
  },

  /**
   * sends the export request to ioboxd
   * @param {Object} contextHeaderParams the object that will be logged
   * @returns {Promise}
   */
  run: function (contextHeaderParams) {
    var defer = ConfigService.q.defer(),
      self = this;
    try {
      var serviceUrl = [self.exportParameters.catalog.host, self.servicePath, self.template.type == 'BAG' ? 'bdbag' : 'file'].join('/');

      // log parameters
      var headers = {};
      if (!contextHeaderParams || typeof contextHeaderParams !== 'object') {
        contextHeaderParams = { action: 'export' };
      }
      // add the reference information
      for (var key in self.reference.defaultLogInfo) {
        if (key in contextHeaderParams) continue;
        contextHeaderParams[key] = self.reference.defaultLogInfo[key];
      }
      headers[contextHeaderName] = contextHeaderParams;

      self.canceled = false;
      if (self.exportParameters.public != null) {
        serviceUrl += '?public=' + self.exportParameters.public;
      }
      self.reference._server.http
        .post(serviceUrl, self.exportParameters, { headers: headers })
        .then(function success(response) {
          defer.resolve({ data: response.data.split('\n'), canceled: self.canceled });
        })
        .catch(function (err) {
          var error = ErrorService.responseToError(err);
          defer.reject(error);
        });
    } catch (e) {
      defer.reject(e);
    }
    return defer.promise;
  },

  /**
   * Will set the canceled flag so when the datat comes back, we can tell the client
   * to ignore the value. If it is already canceled it won't do anything.
   * @return {boolean} returns false if the export is already canceled
   */
  cancel: function () {
    if (this.canceled) return false;
    this.canceled = true;
    return true;
  },
};

/**
 * Try export/<context> then export then 'detailed'
 * @param {reference} ref
 * @param {Boolean} useCompact - whether the current context is compact or not
 */
export const _getExportReference = function (ref, useCompact) {
  var detCtx = _contexts.DETAILED,
    expCompCtx = _contexts.EXPORT_COMPACT,
    expDetCtx = _contexts.EXPORT_DETAILED;

  var isContext = function (context) {
    return context == ref._context;
  };

  var hasColumns = function (ctx) {
    var res = _getRecursiveAnnotationValue(ctx, ref.table.annotations.get(_annotations.VISIBLE_COLUMNS).content, true);
    return res !== -1 && Array.isArray(res);
  };

  var useMainContext = function () {
    return isContext(detCtx) ? ref : ref.contextualize.detailed;
  };

  if (ref.table.annotations.contains(_annotations.VISIBLE_COLUMNS)) {
    // export/<context>
    // NOTE even if only export context is defined, the visible-columns logic will handle it
    if (useCompact) {
      if (hasColumns(expCompCtx)) {
        return isContext(expCompCtx) ? ref : ref.contextualize.exportCompact;
      }
    } else {
      if (hasColumns(expDetCtx)) {
        return isContext(expDetCtx) ? ref : ref.contextualize.exportDetailed;
      }
    }
  }

  // <context> or no annot
  return useMainContext();
};

/**
 * Given a reference object, will return the appropriate output object.
 * It might use attributegroup or entity apis based on the situation.
 *
 * given a reference and the path from main table to it (it might be empty),
 * will generate the appropriate output.
 * - If addMainKey is true,
 *    it will add the shortestkey of main table to the projection list.
 * - will go based on visible columns defined for `export` (if not `detailed`):
 *   - Normal Columns: add to the projection list.
 *   - ForeignKey pseudo-column: Add the constituent columns alongside extra "candidate" columns (if needed).
 *   - Key pseudo-column: add the constituent columns.
 *   - Asset pseudo-column: add all the metadata columns alongside the url value.
 *   - Inline table: not applicable. Because of the one-to-many nature of the relationship this is not feasible.
 *   - other pseudo-columns (aggregate): not applicable.
 * If the genarated attributegroup path is long, will fall back to the entity api
 *
 * In case of attributegroup, we will change the projection list.
 * Assume that this is the model:
 * main_table <- t1 <- t2
 * the key list will be based on:
 * - shortestkey of main_table and t2 (with alias name in `<tablename>.<shortestkey_column_name>` format)
 * the projection list will be based on:
 * - visible columns of t2
 * - "candidate" columns of the foreignkeys (with alias name in `<tablename>.<candidate_column_name>` format)
 *
 * by "candidate" we mean columns that might make more sense to user instead of the typical "RID" or "ID".
 * These are the same column names that we are using for row-name generation.
 *
 * @private
 * @param  {reference} ref       the reference that we want the output for
 * @param  {String} tableAlias          the alias that is used for projecting table (last table in path)
 * @param  {String=} path               the string that will be prepended to the path
 * @param  {boolean=} addMainKey         whether we want to add the key of the main table.
 *                                      if this is true, the next parameter is required.
 * @param  {Reference=} mainRef The main reference
 * @return {any}                     the output object
 */
export const _referenceExportOutput = function (ref, tableAlias, path, addMainKey, mainRef, useCompact) {
  var projectionList = [],
    keyList = [],
    name,
    i = 0,
    consideredFks = {},
    addedCols = {},
    usedNames = {},
    shortestKeyCols = {},
    fkeys = [],
    fkAlias,
    candidate,
    addedColPrefix;

  var encode = fixedEncodeURIComponent;

  // find the candidate column of the table
  var getCandidateColumn = function (table) {
    return _getCandidateRowNameColumn(
      table.columns.all().map(function (col) {
        return col.name;
      }),
    );
  };

  // check whether the given column is a candidate column
  var isCandidateColumn = function (column) {
    return _getCandidateRowNameColumn([column.name]) !== false;
  };

  var addColumn = function (c) {
    var columns = Array.isArray(c) ? c : [c];
    columns.forEach(function (col) {
      if (col == null || typeof col !== 'object' || addedCols[col.name]) return;
      addedCols[col.name] = true;
      projectionList.push(encode(col.name));
    });
  };

  // don't use any of the table column names
  ref.table.columns.all().forEach(function (col) {
    usedNames[col.name] = true;
  });

  // shortestkey of the current reference
  ref.table.shortestKey.forEach(function (col) {
    keyList.push(encode(col.name));
    addedCols[col.name] = true;
  });

  // if it's a related entity and we need to key of the main table
  if (addMainKey) {
    // we have to add the shortestkey of main table
    addedColPrefix = encode(mainRef.table.name) + '.';
    mainRef.table.shortestKey.forEach(function (col) {
      shortestKeyCols[col.name] = true;
      name = addedColPrefix + encode(col.name);
      // make sure the alias doesn't exist in the table
      while (name in usedNames) {
        name = addedColPrefix + encode(col.name) + '_' + ++i;
      }
      usedNames[name] = true;
      keyList.push(name + ':=' + mainRef.location.mainTableAlias + ':' + encode(col.name));
    });

    //add the candidate column of main table too
    candidate = getCandidateColumn(mainRef.table);
    if (candidate && !(candidate in shortestKeyCols)) {
      name = addedColPrefix + encode(candidate);
      // make sure the alias doesn't exist in the table
      while (name in usedNames) {
        name = addedColPrefix + encode(candidate) + '_' + ++i;
      }
      usedNames[name] = true;
    }
  }

  var exportRef = _getExportReference(ref, useCompact);

  if (exportRef.columns.length === 0) {
    return null;
  }

  exportRef.columns.forEach(function (col) {
    if (!col.isPseudo) {
      addColumn(col);
      return;
    }

    if (col.isForeignKey || (col.isPathColumn && col.isUnique && col.isEntityMode)) {
      if (consideredFks[col.name]) return;
      consideredFks[col.name] = true;

      // add the constituent columns
      var hasCandidate = false;
      var firstFk = col.firstForeignKeyNode.nodeObject;
      firstFk.colset.columns.forEach(function (fkeyCol) {
        addColumn(fkeyCol);
        if (!hasCandidate && col.foreignKeyPathLength === 1 && isCandidateColumn(firstFk.mapping.get(fkeyCol))) {
          hasCandidate = true;
        }
      });

      // if any of the constituent columns is candidate, don't add fk projection
      if (hasCandidate) return;

      // find the candidate column in the referred table;
      candidate = getCandidateColumn(col.lastForeignKeyNode.nodeObject.key.table);

      // we couldn't find any candidate columns
      if (!candidate) return;

      // add the fkey
      fkAlias = 'F' + (fkeys.length + 1);

      var fkeyPath = [];
      col.sourceObjectNodes.forEach(function (f) {
        if (f.isFilter) {
          fkeyPath.push(f.toString());
        } else {
          fkeyPath.push((f === col.lastForeignKeyNode ? fkAlias + ':=' : '') + f.toString(false, true));
        }
      });

      // path to the foreignkey + reset the path to the main table
      fkeys.push(fkeyPath.join('/') + '/$' + tableAlias);

      // add to projectionList
      addedColPrefix = encode(col.table.name) + '.';
      name = addedColPrefix + encode(candidate);
      i = 0;
      while (name in usedNames) {
        name = addedColPrefix + encode(candidate) + '_' + ++i;
      }
      usedNames[name] = true;
      name = name + ':=' + fkAlias + ':' + candidate;

      projectionList.push(name);

      return;
    }

    if (col.isKey) {
      // add constituent columns
      col.key.colset.columns.forEach(addColumn);
      return;
    }

    if (col.isAsset) {
      // add the column alongside the metadata columns
      addColumn([col, col.filenameColumn, col.byteCountColumn, col.md5, col.sha256]);
      return;
    }

    // other pseudo-columns won't be added
  });

  // generate the path, based on given values.
  var exportPath = typeof path === 'string' ? path + '/' : '';
  if (fkeys.length > 0) {
    exportPath += fkeys.join('/') + '/';
  }
  exportPath += keyList.join(',') + ';' + projectionList.join(',');

  if (exportPath.length > URL_PATH_LENGTH_LIMIT) {
    $log.warn('Cannot use attributegroup  api for exporting `' + ref.table.name + '` because of url limitation.');
    return _referenceExportEntityOutput(ref, path);
  }

  return {
    destination: {
      name: _sanitizeFilename(ref.displayname.unformatted),
      type: 'csv',
    },
    source: {
      api: 'attributegroup',
      path: exportPath,
    },
  };
};

/**
 * Given a reference object, will return the appropriate output object using entity api
 * @private
 * @param  {Reference} ref  the reference object
 * @param  {String} path the string that will be prepended to the path
 * @return {Object} the output object
 */
export const _referenceExportEntityOutput = function (ref, path) {
  var source = {
    api: 'entity',
  };

  if (path) {
    source.path = path;
  }

  return {
    destination: {
      name: _sanitizeFilename(ref.displayname.unformatted),
      type: 'csv',
    },
    source: source,
  };
};

/**
 * Given a column will return the appropriate output object for asset.
 * It will return null if column is not an asset.
 * @private
 * @param  {Column} col the column object
 * @param  {String} destinationPath the string that will be prepended to destination path
 * @param  {String} sourcePath      the string that will be prepended to source path
 * @return {Object}
 */
export const _getAssetExportOutput = function (col, destinationPath, sourcePath) {
  if (!col.isAsset) return null;

  var path = [],
    key;
  var sanitize = _sanitizeFilename,
    encode = fixedEncodeURIComponent;

  // attributes
  var attributes = {
    byteCountColumn: 'length',
    filenameColumn: 'filename',
    md5: 'md5',
    sha256: 'sha256',
  };

  // add the url
  path.push('url:=' + encode(col.name));

  // add the attributes (ignore the ones that are not defined)
  for (key in attributes) {
    if (col[key] == null) continue;
    path.push(attributes[key] + ':=' + encode(col[key].name));
  }

  return {
    destination: {
      name: 'assets/' + (destinationPath ? sanitize(destinationPath) + '/' : '') + sanitize(col.name),
      type: 'fetch',
    },
    source: {
      api: 'attribute',
      // exporter will throw an error if the url is null, so we are adding the check for not-null.
      path: (sourcePath ? sourcePath + '/' : '') + '!(' + encode(col.name) + '::null::)/' + path.join(','),
    },
  };
};

/**
 * Returns a object, that can be used as a default export template.
 * NOTE SHOULD ONLY BE USED IN DETAILED CONTEXT
 * It will include:
 * - csv of the main table.
 * - csv of all the related entities
 * - fetch all the assets. For fetch, we need to provide url, length, and md5 (or other checksum types).
 *   if these columns are missing from the asset annotation, they won't be added.
 * - fetch all the assetes of related tables.
 * @param {Reference} reference the reference object
 */
export const _getDefaultExportTemplate = function (reference) {
  const outputs = [],
    relatedTableAlias = 'R';

  const getTableOutput = _referenceExportOutput,
    getAssetOutput = _getAssetExportOutput;

  const addOutput = function (output) {
    if (output != null) {
      outputs.push(output);
    }
  };

  // create a csv + fetch all the assets
  const processRelatedReference = function (rel) {
    // the path that will be used for assets of related entities
    const destinationPath = rel.displayname.unformatted;
    // this will be used for source path
    let sourcePath;
    if (rel.pseudoColumn && !rel.pseudoColumn.isInboundForeignKey) {
      // const lastFk = rel.pseudoColumn.sourceObjectWrapper.lastForeignKeyNode;
      // path from main to the related reference
      sourcePath = rel.pseudoColumn.sourceObjectWrapper.toString(false, false, relatedTableAlias);

      // path more than length one, we need to add the main table fkey
      addOutput(getTableOutput(rel, relatedTableAlias, sourcePath, rel.pseudoColumn.foreignKeyPathLength >= 2, reference));
    }
    // association table
    else if (rel.derivedAssociationReference) {
      const assoc = rel.derivedAssociationReference;
      sourcePath = assoc.origFKR.toString() + '/' + relatedTableAlias + ':=' + assoc.associationToRelatedFKR.toString(true);
      addOutput(getTableOutput(rel, relatedTableAlias, sourcePath, true, reference));
    }
    // single inbound related
    else {
      sourcePath = relatedTableAlias + ':=' + rel.origFKR.toString(false, false);
      addOutput(getTableOutput(rel, relatedTableAlias, sourcePath));
    }

    // add asset of the related table
    const expRef = _getExportReference(rel);

    // alternative table, don't add asset
    if (expRef.table !== rel.table) return;

    expRef.columns.forEach(function (col) {
      const output = getAssetOutput(col, destinationPath, sourcePath);
      addOutput(output);
    });
  };

  // main entity
  addOutput(getTableOutput(reference, reference.location.mainTableAlias));

  const exportRef = _getExportReference(reference);

  // we're not supporting alternative tables
  if (exportRef.table.name === reference.table.name) {
    // main assets
    exportRef.columns.forEach(function (col) {
      const output = getAssetOutput(col, '', '');
      addOutput(output);
    });

    // inline entities
    exportRef.columns.forEach(function (col) {
      if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
        return processRelatedReference(col.reference);
      }
    });
  }

  // related entities (use the export context otherwise detailed)
  let hasRelatedExport = false;
  if (reference.table.annotations.contains(_annotations.VISIBLE_FOREIGN_KEYS)) {
    const exportRelated = _getRecursiveAnnotationValue(
      _contexts.EXPORT,
      reference.table.annotations.get(_annotations.VISIBLE_FOREIGN_KEYS).content,
      true,
    );
    hasRelatedExport = exportRelated !== -1 && Array.isArray(exportRelated);
  }

  // if export context is defined in visible-foreign-keys, use it, otherwise fallback to detailed
  const exportRefForRelated = hasRelatedExport
    ? reference.contextualize.export
    : reference._context === _contexts.DETAILED
      ? reference
      : reference.contextualize.detailed;
  if (exportRefForRelated.table.name === reference.table.name) {
    exportRefForRelated.related.forEach(processRelatedReference);
  }

  if (outputs.length === 0) {
    return null;
  }

  return {
    displayname: 'BDBag',
    type: 'BAG',
    outputs: outputs,
  };
};
