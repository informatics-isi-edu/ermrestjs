exports.execute = function (options) {

    // don't run these test cases on travis since iobox is missing.
    // TODO need to add iobox to travis
    if (process.env.TRAVIS) {
        describe ("iobox test cases, ", function () {
            it ("should be skipped on travis.", function () {

            });
        });
        return;
    }

    describe('IOBOX Export features, ', function () {
        var schemaName = "export",
            tableName = "main",
            tableNameInvalidTemplate = "invalid_temp",
            tableNameInvalidTemplate2 = "invalid_temp2",
            tableNameNoExport = "no_export_annot",
            table, ermRest, reference, noAnnotReference, exportObj;


        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName + ":" + tableName;

        // {"and":[{"source":"id","ranges":[{"min":"1","max":"10"}]},{"source":[{"inbound":["export","f1_fk_1"]},"id"],"choices":["1","2"]}]}
        var facetBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaEDSAcxyTkRAFsCJ8BGEU+sAD1YAYQAvgF0BxZOmx4EoJgCN00WiBxcADigwAXdiABmLAPq6A1gbYjSREENJYAFigK4aCEG1IAma8IFA";
        var noAnnotUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName + ":" + tableNameNoExport + "/id=1/*::facets::" + facetBlob;

        beforeAll(function (done) {
            ermRest = options.ermRest;

            ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                reference = response;
                return ermRest.resolve(noAnnotUri, {cid: "test"});
            }).then(function (ref) {
                noAnnotReference = ref;
                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe("For exporter ," , function() {

            describe("table.exportTemplates, ", function () {
                it ("should return empty array if annotation missing or invalid.", function () {
                    var t = options.catalog.schemas.get(schemaName).tables.get(tableNameInvalidTemplate);
                    expect(t.exportTemplates.length).toBe(0, "length missmatch for invalid templates");

                    t = options.catalog.schemas.get(schemaName).tables.get(tableNameNoExport);
                    expect(t.exportTemplates.length).toBe(0, "length missmatch for no annoation");
                });

                it ("should ignore invalid templates.", function () {
                    var t = options.catalog.schemas.get(schemaName).tables.get(tableNameInvalidTemplate2);
                    expect(t.exportTemplates.length).toBe(1, "length missmatch");
                    expect(t.exportTemplates[0].format_name).toEqual("valid_temp", "format_name missmatch.");
                });

                it ("should return all the templates if they are valid.", function () {
                    table = options.catalog.schemas.get(schemaName).tables.get(tableName);

                    expect(table.exportTemplates.length).toBe(3);
                    expect(reference.table.exportTemplates.length).toBe(3);
                    expect(reference.table.exportTemplates).toEqual(table.exportTemplates);
                });
            });

            describe("reference.exportTemplates, ", function () {
                it ("if valid templates are defined on the table, should return them.", function () {
                    expect(reference.exportTemplates.length).toBe(3, "length missmatch");
                    expect(reference.exportTemplates).toEqual(table.exportTemplates, "templates missmatch");
                });

                it ("otherwise if context is not detailed should return an empty array.", function () {
                    expect(noAnnotReference.exportTemplates.length).toBe(0);
                });

                it ("otherwise should return the default export template.", function () {
                    var templates = noAnnotReference.contextualize.detailed.exportTemplates;
                    expect(templates.length).toBe(1, "length missmatch");

                    var expectedTemplates = [
                        {
                            destination: {
                                name: "no_export_annot",
                                type: "csv"
                            },
                            source: {
                                api: "entity",
                                table: "export:no_export_annot"
                            }
                        },
                        {
                            destination: {
                                name: "f1",
                                type: "csv"
                            },
                            source: {
                                api: "entity",
                                table: "export:f1"
                            }
                        },
                        {
                            destination: {
                                name: "f2",
                                type: "csv"
                            },
                            source: {
                                api: "attributegroup",
                                table: "export:no_export_annot",
                                path: "(id)=(export:no_export_annot_f2_assoc:id_no_export_annot)/(id_f2)=(export:f2:id)/RID,main_table_RID_2:=M:RID;id,col_1,main_table_RID_0,main_table_RID_1,RCT,RMT,RCB,RMB"
                            }
                        },
                        {
                            destination: {
                                name: "f3",
                                type: "csv"
                            },
                            source: {
                                api: "attributegroup",
                                table: "export:no_export_annot",
                                path: "(id)=(export:no_export_annot_f2_assoc:id_no_export_annot)/(id_f2)=(export:f2:id)/(id)=(export:f3:id)/RID,main_table_RID_0:=M:RID;id,RCT,RMT,RCB,RMB"
                            }
                        },
                        {
                            destination: {
                                name: "asset_1",
                                type: "fetch"
                            },
                            source: {
                                api: "attribute",
                                table: "export:no_export_annot",
                                path: "url:=asset_1,length:=asset_1_bytes,filename:=asset_1_filename,md5:=asset_1_md5"
                            }
                        },
                        {
                            destination: {
                                name: "asset_2",
                                type: "fetch"
                            },
                            source: {
                                api: "attribute",
                                table: "export:no_export_annot",
                                path: "url:=asset_2,length:=asset_2_bytes,filename:=asset_2_filename"
                            }
                        },
                        {
                            destination: {
                                name: "asset_3",
                                type: "fetch"
                            },
                            source: {
                                api: "attribute",
                                table: "export:no_export_annot",
                                path: "url:=asset_3,filename:=asset_3_filename"
                            }
                        },
                        {
                            destination: {
                                name: "asset_4",
                                type: "fetch"
                            },
                            source: {
                                api: "attribute",
                                table: "export:no_export_annot",
                                path: "url:=asset_4"
                            }
                        }
                    ];

                    // just to produce a better error message
                    templates[0].outputs.forEach(function (temp, i) {
                        expect(temp).toEqual(expectedTemplates[i], "template missmatch for index=" + i);
                    });
                });
            });

            describe("for BDBag template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, reference.table.exportTemplates[0]);

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[0]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe(exportObj.formatOptions.BAG.name);
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "table": "export:main",
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "export_test_bag"
                        }
                    }
                    expect(exportParams.catalog.query_processors.length).toBe(1);
                    expect(exportParams.catalog.query_processors[0].processor).toBe(output.destination.type);
                    expect(exportParams.catalog.query_processors[0].processor_params.query_path).toBe("/" + output.source.api + "/M:=" + output.source.table + "?limit=none");
                    expect(exportParams.catalog.query_processors[0].processor_params.output_path).toBe(output.destination.name);
                });

                it("exporter.run should return the proper response from iobox", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/iobox/export/bdbag/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("for BDBag CSV template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, reference.table.exportTemplates[1]);

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[1]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe(exportObj.formatOptions.BAG.name);
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "table": "export:main",
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "export_test_file_csv"
                        }
                    }
                    expect(exportParams.catalog.query_processors.length).toBe(1);
                    expect(exportParams.catalog.query_processors[0].processor).toBe(output.destination.type);
                    expect(exportParams.catalog.query_processors[0].processor_params.query_path).toBe("/" + output.source.api + "/M:=" + output.source.table + "?limit=none");
                    expect(exportParams.catalog.query_processors[0].processor_params.output_path).toBe(output.destination.name);
                });

                it("exporter.run should return the proper response from iobox", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/iobox/export/file/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("for BDBag JSON template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, reference.table.exportTemplates[2]);

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[2]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe(exportObj.formatOptions.BAG.name);
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "table": "export:main",
                            "api": "entity"
                        },
                        "destination": {
                            "type": "json",
                            "name": "export_test_file_json"
                        }
                    }
                    expect(exportParams.catalog.query_processors.length).toBe(1);
                    expect(exportParams.catalog.query_processors[0].processor).toBe(output.destination.type);
                    expect(exportParams.catalog.query_processors[0].processor_params.query_path).toBe("/" + output.source.api + "/M:=" + output.source.table + "?limit=none");
                    expect(exportParams.catalog.query_processors[0].processor_params.output_path).toBe(output.destination.name);
                });

                it("exporter.run should return the proper response from iobox", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/iobox/export/file/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });
        });

    });
}
