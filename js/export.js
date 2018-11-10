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
            console.log("export template ignored with name=`" + template.name + "`. Reason: " + reason);
        };

        // template is not an object
        if (template !== Object(template) || Array.isArray(template) || !template) {
            console.log("export template ignored. Reason: it's not an object.");
            return false;
        }

        // doesn't have the expected attributes
        if (!module.ObjectHasAllKeys(template, ['displayname', 'type'])) {
            console.log("export template ignored. Reason: first level required attributes are missing.");
            return false;
        }

        //type must be either FILE or BAG
        if (["BAG", "FILE"].indexOf(template.type) === -1) {
            console.log("export template ignored. Reason: template.type must be either `BAG` or `FILE`.");
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

            // output.destination must have name and type
            if (!module.ObjectHasAllKeys(output.destination, ['name', 'type'])) {
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
     * @param {Object} template the tempalte must be in the valid format.
     *
     *
     * @returns {Export}
     * @constructor
     */
    var exporter = function (reference, bagName, template) {
        if (!module.validateExportTemplate(template)) {
            throw new module.InvalidInputError("Given Template is not valid.");
        }

        this.reference = reference;
        this.template = template;
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

                    outputs.forEach(function (output) {
                        var source = output.source, dest = output.destination;
                        var query = {}, queryParams = {};

                        // <api>/<current reference path>/<path>
                        var queryFrags = [
                            source.api,
                            predicate
                        ];
                        if (typeof source.path === "string") {
                            // remove the first and last slash if it has one
                            queryFrags.push(source.path.replace(/^\/|\/$/g, ''));
                        }

                        query.processor = dest.type || bagOptions.table_format;
                        queryParams.output_path = dest.name;
                        queryParams.query_path = "/" + queryFrags.join("/") + "?limit=none";
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

                var serviceUrl = self.exportParameters.catalog.host + "/iobox/export/" + (self.template.type == "BAG" ? "bdbag" : "file");


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
                // add the template
                contextHeaderParams.template = self.template;
                headers[module._contextHeaderName] = contextHeaderParams;

                self.canceled = false;
                self.reference._server._http.post(serviceUrl, self.exportParameters, {headers: headers}).then(function success(response) {
                    return defer.resolve({data: response.data.split("\n"), canceled: self.canceled});
                }).catch(function (err) {
                    var error = module._responseToError(err);
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

    return module;

})(ERMrest || {});
