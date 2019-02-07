exports.execute = function (options) {

    // don't run these test cases on travis since export is missing.
    // TODO need to add export to travis
    if (process.env.TRAVIS) {
        describe ("export test cases, ", function () {
            it ("should be skipped on travis.", function () {

            });
        });
        return;
    }

    describe('IOBOX Export features, ', function () {
        var schemaName1 = "export_table_annot_schema",
            schemaName2 = "export_schema_annot_schema",
            tableName = "main",
            tableNameInvalidTemplate = "invalid_temp",
            tableNameInvalidTemplate2 = "invalid_temp2",
            tableNameNoExport = "no_export_annot",
            tableWithLongDefaultExport = "table_with_long_default_export",
            table, ermRest, reference, noAnnotReference, noExportoutputReference, tableWithLongDefaultReference, exportObj;

        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableName;

        // {"and":[{"source":"id","ranges":[{"min":"1","max":"10"}]},{"source":[{"inbound":["export_table_annot_schema","f1_fk_1"]},"id"],"choices":["1","2"]}]}
        var facetBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaEDSAcxyTkRAFsCJ8BGEU+sAD1YAYQAvgF0BxZOmx4EoJgCN00WiBxcADigwAXAPqawsgDY5tkCCh1IsACxyd2IAGYttDgNba2I0kRBDS1lAJcGgQQNlIAJl9hASA";
        var noAnnotUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableNameNoExport + "/id=1/*::facets::" + facetBlob;

        var noExportOutputUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName2 + ":" + tableNameNoExport;

        var noExportOutputWithLongPathUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableWithLongDefaultExport;

        /*
         * no_export_annot is identical in both export_schema_annot_schema and export_table_annot_schema,
         * All the relationships are identical too.
         * The only difference is just the schema name.
         */
        var getDefaultOutputs = function (schema) {
            return [
                {
                    destination: {
                        name: "__No Export Annot__",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "F1:=left(fk_col_1)=(" + schema + ":outbound1:id)/$M/F2:=left(fk_col_2,fk_col_3)=(" + schema + ":outbound1:id1,id2)/$M/F3:=left(fk_col_3)=(" + schema + ":outbound3:id)/$M/F4:=left(fk_col_3,fk_col_4)=(" + schema + ":outbound3:id1,id2)/$M" +
                              "/RID;id,fk_col_1,outbound1.Name_1:=F1:Name,fk_col_2,fk_col_3,outbound3.Accession_ID_1:=F3:Accession_ID,fk_col_4,name,outbound1.Name,outbound3.Accession_ID,asset_1,asset_1_filename,asset_1_bytes,asset_1_md5,asset_2,asset_2_filename,asset_2_bytes,asset_2_sha256,asset_3,asset_3_filename,asset_4,asset_4_bytes,asset_5,RCT,RMT,RCB,RMB,outbound1.Name_2:=F2:Name,outbound3.Accession_ID_2:=F4:Accession_ID"
                    }
                },
                {
                    destination: {
                        name: "assets/asset_1",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "!(asset_1::null::)/url:=asset_1,length:=asset_1_bytes,filename:=asset_1_filename,md5:=asset_1_md5"
                    }
                },
                {
                    destination: {
                        name: "assets/asset_2",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "!(asset_2::null::)/url:=asset_2,length:=asset_2_bytes,filename:=asset_2_filename,sha256:=asset_2_sha256"
                    }
                },
                {
                    destination: {
                        name: "F1_table",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "R:=(id)=(" + schema + ":f1:id)/F1:=left(id)=(" +schema + ":no_export_annot:id)/$R/RID;id,no_export_annot.name:=F1:name,asset_1,asset_1_filename,asset_1_bytes,asset_1_md5,asset_2,asset_2_filename,asset_2_bytes,asset_2_md5,RCT,RMT,RCB,RMB"
                    }
                },
                {
                    destination: {
                        name: "assets/F1_table/asset_1",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "R:=(id)=(" + schema + ":f1:id)/!(asset_1::null::)/url:=asset_1,length:=asset_1_bytes,filename:=asset_1_filename,md5:=asset_1_md5"
                    }
                },
                {
                    destination: {
                        name: "no_export_annot_f2_assoc",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "(id)=(" + schema + ":no_export_annot_f2_assoc:id_no_export_annot)/R:=(id_f2)=(" + schema + ":f2:id)/RID,no_export_annot.RID:=M:RID;id,col_1,RCT,RMT,RCB,RMB"
                    }
                },
                {
                    destination: {
                        name: "f3",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "(id)=(" + schema + ":no_export_annot_f2_assoc:id_no_export_annot)/(id_f2)=(" + schema + ":f2:id)/R:=(id)=(" + schema + ":f3:id)/RID,no_export_annot.RID_1:=M:RID;id,no_export_annot.RID,asset_1,asset_1_filename,asset_1_bytes,asset_1_md5,RCT,RMT,RCB,RMB"
                    }
                },
                {
                    destination: {
                        name: "assets/f3/asset_1",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "(id)=(" + schema + ":no_export_annot_f2_assoc:id_no_export_annot)/(id_f2)=(" + schema + ":f2:id)/R:=(id)=(" + schema + ":f3:id)/!(asset_1::null::)/url:=asset_1,length:=asset_1_bytes,filename:=asset_1_filename,md5:=asset_1_md5"
                    }
                }
            ];
        };

        beforeAll(function (done) {
            ermRest = options.ermRest;

            ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                reference = response;
                return ermRest.resolve(noAnnotUri, {cid: "test"});
            }).then(function (ref1) {
                noAnnotReference = ref1;
                return ermRest.resolve(noExportOutputUri, {cid: "test"});
            }).then(function (ref2) {
                noExportoutputReference = ref2;
                return ermRest.resolve(noExportOutputWithLongPathUri, {cid: "test"});
            }).then(function (ref3) {
                tableWithLongDefaultReference = ref3;
                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe("For exporter ," , function() {

            describe("table.exportTemplates, ", function () {
                var t;

                describe("if annotation is defined on the table, ", function () {
                    it ("should return empty array, if it's not well defined.", function () {
                        t = options.catalog.schemas.get(schemaName1).tables.get(tableNameInvalidTemplate);
                        expect(t.exportTemplates).toEqual([], "length missmatch for invalid templates");
                    });

                    it ("should ignore invalid templates", function () {
                        t = options.catalog.schemas.get(schemaName1).tables.get(tableNameInvalidTemplate2);
                        expect(t.exportTemplates.length).toBe(1, "length missmatch");
                        expect(t.exportTemplates[0].displayname).toEqual("valid_temp", "displayname missmatch.");
                    });

                    it ("should return all the templates that are valid.", function () {
                        table = options.catalog.schemas.get(schemaName1).tables.get(tableName);

                        expect(table.exportTemplates.length).toBe(3);
                    });
                });

                it ("otherwise if annotation is defined on the schema, should return it.", function () {
                    t = options.catalog.schemas.get(schemaName2).tables.get(tableNameNoExport);
                    expect(t.exportTemplates.length).toBe(1, "length missmatch");
                    expect(t.exportTemplates[0].displayname).toEqual("default schema template", "displayname missmatch");
                });

                it ("otherwise should return `null`.", function () {
                    t = options.catalog.schemas.get(schemaName1).tables.get(tableNameNoExport);
                    expect(t.exportTemplates).toBe(null, "length missmatch for no annoation");
                });
            });

            describe("reference.getExportTemplates, ", function () {
                var templates;
                it ("if valid templates are defined on the table, should return them.", function () {
                    templates = reference.getExportTemplates();
                    expect(templates.length).toBe(3, "length missmatch");
                    expect(templates).toEqual(table.exportTemplates, "templates missmatch");
                });

                describe('when useDefault is true,', function () {
                    it ("if template is missing outputs, should use the default output.", function () {
                        var templates = noExportoutputReference.getExportTemplates(true);
                        expect(templates.length).toBe(1, "length missmatch");

                        expect(templates[0].displayname).toBe("default schema template", "displayname missmatch");
                        expect(templates[0].type).toBe("BAG", "type missmatch");

                        var defaultOutput = getDefaultOutputs(schemaName2);

                        // just to produce a better error message
                        expect(templates[0].outputs.length).toBe(defaultOutput.length, "outputs length missmatch");
                        templates[0].outputs.forEach(function (temp, i) {
                            expect(temp).toEqual(defaultOutput[i], "template missmatch for index=" + i);
                        });
                    });

                    describe("if annotation is missing from table and schema, ", function () {
                        it ("if context is not detailed should return an empty array.", function () {
                            expect(noAnnotReference.getExportTemplates(true).length).toBe(0);
                        });

                        it ("otherwise should return the default export template.", function () {
                            var templates = noAnnotReference.contextualize.detailed.getExportTemplates(true);
                            expect(templates.length).toBe(1, "length missmatch");

                            expect(templates[0].displayname).toBe("BAG", "displayname missmatch");
                            expect(templates[0].type).toBe("BAG", "type missmatch");

                            var defaultOutput = getDefaultOutputs(schemaName1);

                            // just to produce a better error message
                            templates[0].outputs.forEach(function (temp, i) {
                                expect(temp).toEqual(defaultOutput[i], "template missmatch for index=" + i);
                            });
                        });

                        it ("if default export paths are long, should fall back to entity api.", function () {
                            var templates = tableWithLongDefaultReference.contextualize.detailed.getExportTemplates(true);
                            expect(templates.length).toBe(1, "length missmatch");

                            expect(templates[0].displayname).toBe("BAG", "displayname missmatch");
                            expect(templates[0].type).toBe("BAG", "type missmatch");

                            expect(templates[0].outputs.length).toBe(1, "outputs length missmatch");

                            expect(templates[0].outputs[0]).toEqual({
                                destination: {
                                    name: "table_with_long_default_export",
                                    type: "csv"
                                },
                                source: {
                                    api: "entity",
                                }
                            },"outputs length missmatch");
                        });
                    });
                });

                it ("otherwise should return empty.", function () {
                    var templates = noAnnotReference.contextualize.detailed.getExportTemplates(false);
                    expect(templates.length).toBe(0);
                });

            });

            describe("for BDBag template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, "bag-name", reference.table.exportTemplates[0], "/deriva/export/");

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[0]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe("bag-name");
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "Main _ table"
                        }
                    }
                    expect(exportParams.catalog.query_processors.length).toBe(1);
                    expect(exportParams.catalog.query_processors[0].processor).toBe(output.destination.type);
                    expect(exportParams.catalog.query_processors[0].processor_params.query_path).toBe("/" + output.source.api + "/M:=export_table_annot_schema:main?limit=none");
                    expect(exportParams.catalog.query_processors[0].processor_params.output_path).toBe(output.destination.name);
                });

                it("exporter.run should return the proper response from export service", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/deriva/export/bdbag/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("for BDBag CSV template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, "bag-name", reference.table.exportTemplates[1], "deriva/export/");

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[1]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe("bag-name");
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "export_test_file_csv"
                        }
                    };
                    expect(exportParams.catalog.query_processors.length).toBe(1);
                    expect(exportParams.catalog.query_processors[0].processor).toBe(output.destination.type);
                    expect(exportParams.catalog.query_processors[0].processor_params.query_path).toBe("/" + output.source.api + "/M:=export_table_annot_schema:main?limit=none");
                    expect(exportParams.catalog.query_processors[0].processor_params.output_path).toBe(output.destination.name);
                });

                it("exporter.run should return the proper response from export service", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/deriva/export/file/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("for BDBag JSON template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, "bag-name", reference.table.exportTemplates[2], "/deriva/export/");

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[2]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe("bag-name");
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "api": "entity"
                        },
                        "destination": {
                            "type": "json",
                            "name": "export_test_file_json"
                        }
                    };
                    expect(exportParams.catalog.query_processors.length).toBe(1);
                    expect(exportParams.catalog.query_processors[0].processor).toBe(output.destination.type);
                    expect(exportParams.catalog.query_processors[0].processor_params.query_path).toBe("/" + output.source.api + "/M:=export_table_annot_schema:main?limit=none");
                    expect(exportParams.catalog.query_processors[0].processor_params.output_path).toBe(output.destination.name);
                });

                it("exporter.run should return the proper response from export service", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/deriva/export/file/")).toBeTruthy();

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
