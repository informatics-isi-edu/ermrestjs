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

var isNode =  false;

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    isNode = true;
}

var ERMrest = (function(module) {

    /**
     * @desc Export Object
     *
     * @memberof ERMrest
     * @class
     * @param {ERMrest.Reference}
     *
     * @returns {Export}
     * @constructor
     */
    var exporter = function (reference, template) {
        this.reference = reference;
        this.template = template;
        this.formatOptions = {
            "BAG": {
                name: reference.location.tableName,
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
                    queries: queries
                };

                exportParameters.catalog = catalogParameters;

                if (!template) {
                    // this is basically the same as a single file CSV or JSON export but packaged as a bag
                    var query = {
                        output_path: bagOptions.name,
                        output_format: bagOptions.table_format,
                        query_path: "/" + this.reference.location.api + "/" + this.reference.location.ermrestCompactPath + "?limit=none"
                    };

                    queries.push(query);
                } else {
                    var outputs = template.outputs;
                    if ((outputs === undefined) || (outputs && outputs.length === 0)) {
                        var error = "No outputs configured in template: " + template.name;
                        throw new Error(error);
                    }

                    var tableAliasToken = "X";
                    var predicate = this.reference.location.ermrestCompactPath;
                    outputs.forEach(function (output) {
                        var query = {};
                        var queryFrags = [];
                        var source = output.source;
                        // encodeURIComponent && module._fixedEncodeURIComponent encode `:` to ``
                        var table = encodeURI(decodeURI(source.table));
                        var dest = output.destination;

                        queryFrags.push(source.api);
                        if (predicate.startsWith("M:=" + table)) {
                            queryFrags.push(predicate);
                        } else {
                            queryFrags.push(predicate);
                            queryFrags.push(tableAliasToken + ":=" + table);
                        }
                        if (source.path !== undefined) {
                            queryFrags.push(source.path);
                        }
                        query.query_path = "/" + queryFrags.join("/") + "?limit=none";
                        query.output_path = dest.name || table;
                        query.output_format = dest.type || bagOptions.table_format;
                        if (dest.params != null) {
                            query.output_format_params = dest.params;
                        }
                        queries.push(query);
                    });
                }
                this._exportParameters = exportParameters;
            }

            return this._exportParameters;
        },

        /**
         * TODO: add description
         */
        invokeExternalExport: function () {
            try {
                var defer = module._q.defer();

                var serviceUrl = this.exportParameters.catalog.host + "/iobox/export/" + (this.template.format_type == "BAG" ? "bdbag" : "file");

                this.reference._server._http.post(serviceUrl, this.exportParameters).then(function success(response) {
                    return defer.resolve(response.data.split("\n"));
                }, function error(response) {
                    var error = module._responseToError(response);
                    return defer.reject(error);
                }).catch(function (err) {
                    return defer.reject(error);
                });

                return defer.promise;
            } catch (e) {
                return module._q.reject(e);
            }
        }
    };

    module.Exporter = exporter;

    return module;

})(ERMrest || {});
