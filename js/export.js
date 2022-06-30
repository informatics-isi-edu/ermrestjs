
    _exportHelpers = {

        /**
         *
         * Returns the export templates that are defined on this table.
         * NOTE If this returns `null`, then the exportTemplates is not defined on the table or schema
         * NOTE The returned array should not be directly used as it might be using fragments
         * @param {ERMrest.Table} table
         * @param {string} context
         * @private
         * @ignore
         */
        getExportAnnotTemplates: function (table, context) {
            var exp = module._annotations.EXPORT,
                expCtx = module._annotations.EXPORT_CONTEXTED,
                annotDefinition = {}, hasAnnot = false,
                chosenAnnot, templates = [];

            // start from table, then try schema, and then catalog
            [table, table.schema, table.schema.catalog].forEach(function (el) {
                if (hasAnnot) return;

                // get from table annotation
                if (el.annotations.contains(exp)) {
                    annotDefinition = {"*": el.annotations.get(exp).content};
                    hasAnnot = true;
                }

                // get from table contextualized annotation
                if (el.annotations.contains(expCtx)) {
                    annotDefinition = Object.assign({}, annotDefinition, el.annotations.get(expCtx).content);
                    hasAnnot = true;
                }

                if (hasAnnot) {
                    // find the annotation defined for the context
                    chosenAnnot = module._getAnnotationValueByContext(context, annotDefinition);

                    // not defined for the context
                    if (chosenAnnot === -1) {
                        hasAnnot = false;
                    }
                    // make sure it's the correct format
                    else if (isObjectAndNotNull(chosenAnnot) && ("templates" in chosenAnnot) && Array.isArray(chosenAnnot.templates)) {
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
         * @param {ERMrest.Table} table
         * @param {Object} defaultExportTemplate
         * @returns An object that can be used in combination with export annotation
         * @private
         * @ignore
         */
        getExportFragmentObject: function (table, defaultExportTemplate) {
            var exportFragments = {
                "$chaise_default_bdbag_template": {
                    "type": "BAG",
                    "displayname": {"fragment_key": "$chaise_default_bdbag_displayname"},
                    "outputs": [{"fragment_key": "$chaise_default_bdbag_outputs"}]
                },
                "$chaise_default_bdbag_displayname": "BDBag",
                "$chaise_default_bdbag_outputs": defaultExportTemplate ? defaultExportTemplate.outputs : null
            };
            var annotKey = module._annotations.EXPORT_FRAGMENT_DEFINITIONS, annot;
            [table.schema.catalog, table.schema, table].forEach(function (el) {
                if (!el.annotations.contains(annotKey)) return;

                annot = el.annotations.get(annotKey).content;
                if (isObjectAndNotNull(annot)) {
                    // remove the keys that start with $
                    Object.keys(annot).filter(function (k) {
                       return k.startsWith("$");
                    }).forEach(function (k) {
                        module._log.warn("Export: ignoring `" + k + "` fragment as it cannot start with $.");
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

                    if ("fragment_key" in obj) {
                        var fragmentKey = obj.fragment_key;

                        // there was a cycle, so just set the variables and abort
                        if (fragmentKey in usedFragments) {
                            module._log.warn("Export: circular dependency detected in the defined templates and therefore ignored and template will be ignored (caused by `" + fragmentKey +"` key)");
                            hasError = true;
                            return null;
                        }

                        // fragment_key is invalid
                        if (!(fragmentKey in exportFragments)) {
                            hasError = true;
                            module._log.warn("Export: the given fragment_key `" + fragmentKey + "` is not valid and template will be ignored.");
                            return null;
                        }

                        // replace with actual definition
                        var modified = module._simpleDeepCopy(usedFragments);
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
        }

    };

    /**
     * Given an object, returns a boolean that indicates whether it is a valid template or not
     * NOTE This will only validate the structure and not the values
     * @param  {Object} template
     * @return {boolean}
     */
    module.validateExportTemplate = function (template) {
        var errMessage = function (reason) {
            module._log.info("export template ignored with displayname=`" + template.displayname + "`. Reason: " + reason);
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
        if (!Array.isArray(template.outputs) || template.outputs.length === 0) {
            errMessage("outputs must be a non-empty array.");
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
     * Try export/<context> then export then 'detailed'
     * @param {ERMrest.reference} ref
     * @param {Boolean} useCompact - whether the current context is compact or not
     */
    module._getExportReference = function (ref, useCompact) {
        var detCtx = module._contexts.DETAILED,
            expCompCtx = module._contexts.EXPORT_COMPACT,
            expDetCtx = module._contexts.EXPORT_DETAILED;

        var isContext = function (context) {
            return context == ref._context;
        };

        var hasColumns = function (ctx) {
            var res = module._getRecursiveAnnotationValue(ctx, ref.table.annotations.get(module._annotations.VISIBLE_COLUMNS).content, true);
            return res !== -1 && Array.isArray(res);
        };

        var useMainContext = function () {
            return isContext(detCtx) ? ref : ref.contextualize.detailed;
        };

        if (ref.table.annotations.contains(module._annotations.VISIBLE_COLUMNS)) {
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
     * @param  {ERMrest.reference} ref       the reference that we want the output for
     * @param  {String} tableAlias          the alias that is used for projecting table (last table in path)
     * @param  {String=} path               the string that will be prepended to the path
     * @param  {String=} addMainKey         whether we want to add the key of the main table.
     *                                      if this is true, the next parameter is required.
     * @param  {ERMrest.Reference=} mainRef The main reference
     * @return {Object}                     the output object
     */
    module._referenceExportOutput = function(ref, tableAlias, path, addMainKey, mainRef, useCompact) {

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

        var exportRef = module._getExportReference(ref, useCompact);

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
                    if (!hasCandidate && col.foreignKeyPathLength === 1  && isCandidateColumn(firstFk.mapping.get(fkeyCol))) {
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
                fkAlias = "F" + (fkeys.length + 1);

                var fkeyPath = [];
                col.sourceObjectNodes.forEach(function (f, index, arr) {
                    if (f.isFilter) {
                        fkeyPath.push(f.toString());
                    } else {
                        fkeyPath.push(((f === col.lastForeignKeyNode) ? fkAlias + ":=" : "") + f.toString(false,true));
                    }
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

