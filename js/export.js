/*
 * Copyright 2018 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ERMrest = (function(module) {

    /**
     * Given an object, returns a boolean that indicates whether it is a valid template or not
     * NOTE This will only validate the structure and not the values
     * @param  {Object} template
     * @return {boolean}
     */
    module.validateExportTemplate = function (template) {
        var errMessage = function (reason) {
            module._log.info("export template ignored with name=`" + template.name + "`. Reason: " + reason);
        };

        // template is not an object
        if (template !== Object(template) || Array.isArray(template) || !template) {
            module._log.info("export template ignored. Reason: it's not an object.");
            return false;
        }

        // doesn't have the expected attributes
        if (!module.ObjectHasAllKeys(template, ['displayname', 'type'])) {
            module._log.info("export template ignored. Reason: first level required attributes are missing.");
            return false;
        }

        //type must be either FILE or BAG
        if (["BAG", "FILE"].indexOf(template.type) === -1) {
            module._log.info("export template ignored. Reason: template.type must be either `BAG` or `FILE`.");
            return false;
        }

        // in FILE, outputs must be properly defined
        if (template.type === "FILE") {
            if (!Array.isArray(template.outputs) || template.outputs.length === 0) {
                errMessage("outputs must be an array when template type is FILE.");
                return false;
            }
        } else if (template.outputs == null) {
            return true; // it could be missing or null (in this case we should use the default outputs)
        } else if (!Array.isArray(template.outputs) || template.outputs.length === 0) {
            errMessage("if outputs is defined, it must be an array.");
            return false;
        }

        var output;
        for (var i = 0; i < template.outputs.length; i++) {
            output = template.outputs[i];

            //output must be an object
            if (output !== Object(output) || Array.isArray(output) || !output) {
                errMessage("output index=" + i + " is not an object.");
                return false;
            }

            // output must have source and destination
            if (!module.ObjectHasAllKeys(output, ['source', 'destination'])) {
                errMessage("output index=" + i + " has missing required attributes.");
                return false;
            }

            // output.source must have api
            if (!module.ObjectHasAllKeys(output.source, ['api'])) {
                errMessage("output.source index=" + i + " has missing required attributes.");
                return false;
            }

            // output.destination must have at least a type
            if (!module.ObjectHasAllKeys(output.destination, ['type'])) {
                errMessage("output.destination index=" + i + " has missing required attributes.");
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
     * @param {ERMrest.Reference} reference
     * @param {String} bagName the name that will be used for the bag
     * @param {Object} template the tempalte must be in the valid format.
     * @param {String} servicePath the path to the service, i.e. "/deriva/export/"
     *
     *
     * @returns {Export}
     * @constructor
     */
    var exporter = function (reference, bagName, template, servicePath) {
        if (!module.validateExportTemplate(template)) {
            throw new module.InvalidInputError("Given Template is not valid.");
        }
        if (typeof servicePath !== "string" || servicePath.length === 0) {
            throw new module.InvalidInputError("Given service path is not valid.");
        }

        this.reference = reference;
        this.template = template;
        this.servicePath = module.trimSlashes(servicePath);
        this.formatOptions = {
            "BAG": {
                name: bagName,
                algs: ["md5"],
                archiver: "zip",
                metadata: {},
                table_format: "csv"
            }
        };
    };

    exporter.prototype = {
        constructor: exporter,

        /**
         * TODO: add description
         */
        get exportParameters () {
            if (this._exportParameters === undefined) {
                var exportParameters = {};
                var bagOptions = this.formatOptions.BAG;
                var template = this.template;

                var bagParameters = {
                    bag_name: bagOptions.name,
                    bag_algorithms: bagOptions.algs,
                    bag_archiver: bagOptions.archiver,
                    bag_metadata: bagOptions.metadata
                };

                exportParameters.bag = bagParameters;

                var base_url = this.reference.location.service;
                var queries = [];
                var catalogParameters = {
                    host: base_url.substring(0, base_url.lastIndexOf("/")),
                    catalog_id: this.reference.location.catalog,
                    query_processors: queries
                };

                exportParameters.catalog = catalogParameters;

                if (!template) {
                    // this is basically the same as a single file CSV or JSON export but packaged as a bag
                    var query = {
                        processor: bagOptions.table_format,
                        processor_params: {
                            output_path: bagOptions.name,
                            query_path: "/" + this.reference.location.api + "/" +
                                this.reference.location.ermrestCompactPath + "?limit=none"
                        }
                    };

                    queries.push(query);
                } else {
                    var outputs = template.outputs;
                    var predicate = this.reference.location.ermrestCompactPath;
                    var table = this.reference.table.name;
                    var output_path = module._sanitizeFilename(this.reference.displayname.unformatted);

                    outputs.forEach(function (output, index) {
                        var source = output.source, dest = output.destination;
                        var query = {}, queryParams = {};

                        // <api>/<current reference path>/<path>
                        var queryFrags = [
                            source.api,
                            predicate
                        ];
                        if (typeof source.path === "string") {
                            // remove the first and last slash if it has one
                            queryFrags.push(module.trimSlashes(source.path));
                        }

                        query.processor = dest.type || bagOptions.table_format;
                        queryParams.output_path = dest.name || output_path;

                        var queryStr = queryFrags.join("/");
                        if (queryStr.length > module.URL_PATH_LENGTH_LIMIT) {
                            module._log.warn("Cannot send the output index `" + index + "` for table `" + table + "` to ermrest (URL LENGTH ERROR). Generated query:", queryStr);
                            return;
                        }

                        queryParams.query_path = "/" + queryStr + "?limit=none";
                        if (dest.impl != null) {
                            query.processor_type = dest.impl;
                        }
                        if (dest.params != null) {
                            Object.assign(queryParams, dest.params);
                        }
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
            try {
                var defer = module._q.defer(), self = this;

                var serviceUrl = [
                    self.exportParameters.catalog.host,
                    self.servicePath,
                    (self.template.type == "BAG" ? "bdbag" : "file")
                ].join("/");

                // log parameters
                var headers = {};
                if (!contextHeaderParams || typeof contextHeaderParams !== "object") {
                    contextHeaderParams = {"action": "export"};
                }
                // add the reference information
                for (var key in self.reference.defaultLogInfo) {
                    if (key in contextHeaderParams) continue;
                    contextHeaderParams[key] = self.reference.defaultLogInfo[key];
                }
                headers[module.contextHeaderName] = contextHeaderParams;

                self.canceled = false;
                if (self.exportParameters.public != null) {
                    serviceUrl += "?public=" + self.exportParameters.public;
                }
                self.reference._server.http.post(serviceUrl, self.exportParameters, {headers: headers}).then(function success(response) {
                    return defer.resolve({data: response.data.split("\n"), canceled: self.canceled});
                }).catch(function (err) {
                    var error = module.responseToError(err);
                    return defer.reject(error);
                });

                return defer.promise;
            } catch (e) {
                return module._q.reject(e);
            }
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
        }
    };

    module.Exporter = exporter;

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
     * @param  {ERMrest.reference} ref       the reference that we want the output for
     * @param  {String} tableAlias          the alias that is used for projecting table (last table in path)
     * @param  {String=} path               the string that will be prepended to the path
     * @param  {String=} addMainKey         whether we want to add the key of the main table.
     *                                      if this is true, the next parameter is required.
     * @param  {ERMrest.Reference=} mainRef The main reference
     * @return {Object}                     the output object
     */
    module._referenceExportOutput = function(ref, tableAlias, path, addMainKey, mainRef) {

        var projectionList = [],
            keyList = [],
            name, i = 0,
            consideredFks = {},
            addedCols = {},
            usedNames = {},
            shortestKeyCols = {},
            fkeys = [],
            fk, fkAlias, candidate,
            addedColPrefix, names = {};

        var encode = module._fixedEncodeURIComponent;

        // find the candidate column of the table
        var getCandidateColumn = function(table) {
            return module._getCandidateRowNameColumn(table.columns.all().map(function(col) {
                return col.name;
            }));
        };

        // check whether the given column is a candidate column
        var isCandidateColumn = function (column) {
            return module._getCandidateRowNameColumn([column.name]) !== false;
        };

        var addColumn = function (c) {
            var columns = Array.isArray(c) ? c : [c];
            columns.forEach(function (col) {
                if (col == null || typeof col !== 'object'  || addedCols[col.name]) return;
                addedCols[col.name] = true;
                projectionList.push(encode(col.name));
            });
        };

        // don't use any of the table column names
        ref.table.columns.all().forEach(function(col) {
            usedNames[col.name] = true;
        });

        // shortestkey of the current reference
        ref.table.shortestKey.forEach(function(col) {
            keyList.push(encode(col.name));
            addedCols[col.name] = true;
        });

        // if it's a related entity and we need to key of the main table
        if (addMainKey) {
            // we have to add the shortestkey of main table
            addedColPrefix = encode(mainRef.table.name) + ".";
            mainRef.table.shortestKey.forEach(function(col) {
                shortestKeyCols[col.name] = true;
                name = addedColPrefix + encode(col.name);
                // make sure the alias doesn't exist in the table
                while (name in usedNames) {
                    name = addedColPrefix + encode(col.name) + "_" + (++i);
                }
                usedNames[name] = true;
                keyList.push(name + ":=" + mainRef.location.mainTableAlias + ":" + encode(col.name));
            });

            //add the candidate column of main table too
            candidate = getCandidateColumn(mainRef.table);
            if (candidate && !(candidate in shortestKeyCols)) {
                name = addedColPrefix + encode(candidate);
                // make sure the alias doesn't exist in the table
                while (name in usedNames) {
                    name = addedColPrefix + encode(candidate) + "_" + (++i);
                }
                usedNames[name] = true;
            }
        }

        var exportRef, hasExportColumns = false;
        if (ref.table.annotations.contains(module._annotations.VISIBLE_COLUMNS)) {
            var exportColumns = module._getRecursiveAnnotationValue(module._contexts.EXPORT, ref.table.annotations.get(module._annotations.VISIBLE_COLUMNS).content, true);
            hasExportColumns = exportColumns !== -1 && Array.isArray(exportColumns);
        }

        // use export annotation, otherwise fall back to using detailed
        exportRef = hasExportColumns ? ref.contextualize.export : ref.contextualize.detailed;

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
                var firstFk = col.foreignKeys[0].obj;
                firstFk.colset.columns.forEach(function (fkeyCol) {
                    addColumn(fkeyCol);
                    if (!hasCandidate && col.foreignKeys.length === 1  && isCandidateColumn(firstFk.mapping.get(fkeyCol))) {
                        hasCandidate = true;
                    }
                });

                // if any of the constituent columns is candidate, don't add fk projection
                if (hasCandidate) return;

                // find the candidate column in the referred table
                var lastFK = col.foreignKeys[col.foreignKeys.length - 1].obj;
                candidate = getCandidateColumn(lastFK.key.table);

                // we couldn't find any candidate columns
                if (!candidate) return;

                // add the fkey
                fkAlias = "F" + (fkeys.length + 1);

                var fkeyPath = [];
                col.foreignKeys.forEach(function (f, index, arr) {
                    fkeyPath.push(((index === arr.length-1) ? fkAlias + ":=" : "") + f.obj.toString(!f.isInbound,true));
                });

                // path to the foreignkey + reset the path to the main table
                fkeys.push(fkeyPath.join("/") + "/$" + tableAlias);

                // add to projectionList
                addedColPrefix = encode(col.table.name) + ".";
                name = addedColPrefix + encode(candidate);
                i = 0;
                while (name in usedNames) {
                    name = addedColPrefix + encode(candidate) + "_" + (++i);
                }
                usedNames[name] = true;
                name = name + ":=" + fkAlias + ":" + candidate;

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
        var exportPath = (typeof path === "string") ? (path + "/") : "";
        if (fkeys.length > 0) {
            exportPath += fkeys.join("/") + "/";
        }
        exportPath += keyList.join(",") + ";" + projectionList.join(",");

        if (exportPath.length > module.URL_PATH_LENGTH_LIMIT) {
            module._log.warn("Cannot use attributegroup  api for exporting `" + ref.table.name + "` because of url limitation.");
            return module._referenceExportEntityOutput(ref, path);
        }

        return {
            destination: {
                name: module._sanitizeFilename(ref.displayname.unformatted),
                type: "csv"
            },
            source: {
                api: "attributegroup",
                path: exportPath
            }
        };
    };

    /**
     * Given a reference object, will return the appropriate output object using entity api
     * @private
     * @param  {ERMrest.Reference} ref  the reference object
     * @param  {String} path the string that will be prepended to the path
     * @return {Object} the output object
     */
    module._referenceExportEntityOutput = function(ref, path) {
        var source = {
            api: "entity"
        };

        if (path) {
            source.path = path;
        }

        return {
            destination: {
                name: module._sanitizeFilename(ref.displayname.unformatted),
                type: "csv"
            },
            source: source
        };
    };

    /**
     * Given a column will return the appropriate output object for asset.
     * It will return null if column is not an asset.
     * @private
     * @param  {ERMrest.Column} col the column object
     * @param  {String} destinationPath the string that will be prepended to destination path
     * @param  {String} sourcePath      the string that will be prepended to source path
     * @return {Object}
     */
    module._getAssetExportOutput = function(col, destinationPath, sourcePath) {
        if (!col.isAsset) return null;

        var path = [], key;
        var sanitize = module._sanitizeFilename,
            encode = module._fixedEncodeURIComponent;

        // attributes
        var attributes = {
            byteCountColumn: "length",
            filenameColumn: "filename",
            md5: "md5",
            sha256: "sha256"
        };

        // add the url
        path.push("url:=" + encode(col.name));

        // add the attributes (ignore the ones that are not defined)
        for (key in attributes) {
            if (col[key] == null) continue;
            path.push(attributes[key] + ":=" + encode(col[key].name));
        }

        return {
            destination: {
                name: "assets/" + (destinationPath ? sanitize(destinationPath) + "/" : "") + sanitize(col.name),
                type: "fetch"
            },
            source: {
                api: "attribute",
                // exporter will throw an error if the url is null, so we are adding the check for not-null.
                path: (sourcePath ? sourcePath + "/" : "") + "!(" + encode(col.name) + "::null::)/" + path.join(",")
            }
        };
    };

    return module;

})(ERMrest || {});
