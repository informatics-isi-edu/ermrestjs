exports.execute = function (options) {

    // don't run these test cases on ci since export is missing.
    // TODO need to add export to CI
    if (process.env.CI) {
        describe ("export test cases, ", function () {
            it ("should be skipped on CI.", function () {

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
            tableWithContextualizedExport = "table_w_contextualized_export",
            tableWithEmptyVisColExport = "table_w_empty_vis_col_for_export",
            table, ermRest, reference, noAnnotReference, noExportoutputReference, tableWithLongDefaultReference,
            tableWithContextExportReference, tableAndSchemaWithContextExportReference, emptyVisColExportReference, exportObj;

        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableName;

        // {"and":[{"source":"id","ranges":[{"min":"1","max":"10"}]},{"source":[{"inbound":["export_table_annot_schema","f1_fk_1"]},"RID"],"choices":["1","2"]}]}
        var facetBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaEDSAcxyTkRAFsCJ8BGEU+sAD1YAYQAvgF0BxZOmx4EoJgCN00WiBxcADigwAXAPqawsgDY5tkCCh1IsACxyd2IAGYttDgNba2I0gCUAkgBEQIVJrFAJcGgQQNlIAJiDhASA";
        var noAnnotUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableNameNoExport + "/id=1/*::facets::" + facetBlob;

        var noExportOutputUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName2 + ":" + tableNameNoExport;

        var noExportOutputWithLongPathUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableWithLongDefaultExport;

        var contextualizedTableExportUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableWithContextualizedExport;

        var contextualizedTableAndSchemaExportUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName2 + ":" + tableWithContextualizedExport;

        var emptyVisColExportUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/" + schemaName1 + ":" + tableWithEmptyVisColExport;

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
                        path: "F1:=left(fk_col_1)=(" + schema+ ":outbound1:id)/$M/F2:=left(fk_col_3)=(" + schema + ":outbound3:id)/$M/F3:=left(fk_col_2,fk_col_3)=("+ schema + ":outbound1:id1,id2)/$M/" +
                              "F4:=left(fk_col_3,fk_col_4)=(" + schema + ":outbound3:id1,id2)/$M/left(fk_col_2)=(" + schema + ":outbound2:id)/F5:=left(fk_col)=(" + schema + ":outbound1:id)/$M/" +
                              "RID;id,fk_col_1,outbound1.Name_1:=F1:Name,fk_col_2,fk_col_3,outbound3.Accession_ID_1:=F2:Accession_ID,outbound1.Name_2:=F3:Name,fk_col_4,outbound3.Accession_ID_2:=F4:Accession_ID,fk_col_5,outbound1.Name_3:=F5:Name," +
                              "asset_5,asset_4,asset_3,asset_3_filename,asset_2,asset_2_filename,asset_2_bytes,asset_2_sha256,asset_1,asset_1_filename,asset_1_bytes,asset_1_md5"
                    }
                },
                {
                    destination: {
                        name: "assets/asset_5",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "!(asset_5::null::)/url:=asset_5"
                    }
                },
                {
                    destination: {
                        name: "assets/asset_4",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "!(asset_4::null::)/url:=asset_4"
                    }
                },
                {
                    destination: {
                        name: "assets/asset_3",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "!(asset_3::null::)/url:=asset_3,filename:=asset_3_filename"
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
                        name: "inline F1_table",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "R:=(id)=(" + schema + ":inline_f1:id)/F1:=left(id)=(" +schema + ":no_export_annot:id)/$R/RID;id,asset_1,asset_1_filename,asset_1_bytes,asset_1_md5,no_export_annot.name:=F1:name,asset_2_filename"
                    }
                },
                {
                    destination: {
                        name: "assets/inline F1_table/asset_1",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "R:=(id)=(" + schema + ":inline_f1:id)/!(asset_1::null::)/url:=asset_1,length:=asset_1_bytes,filename:=asset_1_filename,md5:=asset_1_md5"
                    }
                },
                {
                    destination: {
                        name: "no_export_annot_inline_f2_assoc",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "(id)=(" + schema + ":no_export_annot_inline_f2_assoc:id_no_export_annot)/R:=(id_inline_f2)=(" + schema + ":inline_f2:id)/RID,no_export_annot.RID:=M:RID;id,col_1,RCT,RMT,RCB,RMB"
                    }
                },
                {
                    destination: {
                        name: "inline_f3",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "(id)=(" + schema + ":no_export_annot_inline_f2_assoc:id_no_export_annot)/(id_inline_f2)=(" + schema + ":inline_f2:id)/R:=(id)=(" + schema + ":inline_f3:id)/RID,no_export_annot.RID_1:=M:RID;id,no_export_annot.RID,asset_1_filename,asset_1,asset_1_bytes,asset_1_md5"
                    }
                },
                {
                    destination: {
                        name: "assets/inline_f3/asset_1",
                        type: "fetch"
                    },
                    source: {
                        api: "attribute",
                        path: "(id)=(" + schema + ":no_export_annot_inline_f2_assoc:id_no_export_annot)/(id_inline_f2)=(" + schema + ":inline_f2:id)/R:=(id)=(" + schema + ":inline_f3:id)/!(asset_1::null::)/url:=asset_1,length:=asset_1_bytes,filename:=asset_1_filename,md5:=asset_1_md5"
                    }
                },
                {
                    destination: {
                        name: "F1_table",
                        type: "csv"
                    },
                    source: {
                        api: "attributegroup",
                        path: "R:=(id)=(" + schema + ":f1:id)/F1:=left(id)=(" +schema + ":no_export_annot:id)/$R/RID;id,asset_1,asset_1_filename,asset_1_bytes,asset_1_md5,no_export_annot.name:=F1:name,asset_2_filename"
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
                        path: "(id)=(" + schema + ":no_export_annot_f2_assoc:id_no_export_annot)/(id_f2)=(" + schema + ":f2:id)/R:=(id)=(" + schema + ":f3:id)/RID,no_export_annot.RID_1:=M:RID;id,no_export_annot.RID,asset_1_filename,asset_1,asset_1_bytes,asset_1_md5"
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
                return ermRest.resolve(contextualizedTableAndSchemaExportUri, {cid: "test"});
            }).then(function (ref4) {
                tableAndSchemaWithContextExportReference = ref4;
                return ermRest.resolve(contextualizedTableExportUri, {cid: "test"});
            }).then(function (ref5) {
                tableWithContextExportReference = ref5;
                return ermRest.resolve(emptyVisColExportUri, {cid: "test"});
            }).then(function (ref6) {
                emptyVisColExportReference = ref6;
                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe("For exporter ," , function() {

            describe("table.getExportTemplates(), ", function () {
                var checkFirstTemplateDisplayname = function (schema_name, table_name, context, expected) {
                    var t = options.catalog.schemas.get(schema_name).tables.get(table_name);
                    var templates = t.getExportTemplates(context);
                    expect(templates.length).toBe(1, "length missmatch");
                    expect(templates[0].displayname).toEqual(expected, "displayname missmatch.");
                };

                describe("regarding 2016:export annotation, ", function () {
                    describe("if annotation is defined on the table, ", function () {
                        it ("should return empty array, if it's not well defined.", function () {
                            var t = options.catalog.schemas.get(schemaName1).tables.get(tableNameInvalidTemplate);
                            expect(t.getExportTemplates()).toEqual([], "length missmatch for invalid templates");
                        });

                        it ("should ignore invalid templates", function () {
                            checkFirstTemplateDisplayname(schemaName1, tableNameInvalidTemplate2, null, "valid_temp");
                        });

                        it ("should return all the templates that are valid.", function () {
                            table = options.catalog.schemas.get(schemaName1).tables.get(tableName);
                            expect(table.getExportTemplates().length).toBe(3);
                        });
                    });

                    it ("otherwise if annotation is defined on the schema, should return it.", function () {
                        checkFirstTemplateDisplayname(schemaName2, tableNameNoExport, null, "default schema template");
                    });
                });

                describe("regarding context-based export annotation, ", function () {
                    it ("should return the template defined for the given context in table.", function () {
                        checkFirstTemplateDisplayname(schemaName2, tableWithContextualizedExport, "compact", "contextualized table template");
                    });

                    it ("otherwise, should return the 2016:export result.", function () {
                        checkFirstTemplateDisplayname(schemaName2, tableWithContextualizedExport, "detailed", "default table template");
                    });

                    it("otherwise, should the 2019:export defined on the schema for the context.", function () {
                        checkFirstTemplateDisplayname(schemaName2, tableNameNoExport, "compact", "contextualized schema template");
                    });

                    it ("otherwise, should return the 2016:export defined on the table for the context.", function () {
                        checkFirstTemplateDisplayname(schemaName2, tableNameNoExport, "detailed", "default schema template");
                    });
                });

                it ("otherwise (no 2016:export or 2019:export annotations) should return `null`.", function () {
                    t = options.catalog.schemas.get(schemaName1).tables.get(tableNameNoExport);
                    expect(t.getExportTemplates()).toBe(null, "length missmatch for no annoation");
                });
            });

            describe("reference.getExportTemplates, ", function () {
                var templates;
                it ("if valid templates are defined, should return them.", function () {
                    templates = reference.getExportTemplates();
                    expect(templates.length).toBe(3, "length missmatch");
                    expect(templates).toEqual(table.getExportTemplates(), "templates missmatch");
                });

                it ("should get the templates from the correct context.", function () {
                    templates = tableAndSchemaWithContextExportReference.contextualize.compact.getExportTemplates();
                    expect(templates.length).toBe(1, "length missmatch");
                    expect(templates[0].displayname).toEqual("contextualized table template", "displayname missmatch");
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
                            var message = "missmatch for index=" + i;
                            expect(temp.destination.name).toEqual(defaultOutput[i].destination.name, "destination.name "+ message);
                            expect(temp.destination.type).toEqual(defaultOutput[i].destination.type, "destination.type "+ message);
                            expect(temp.source.api).toEqual(defaultOutput[i].source.api, "source.api "+ message);
                            expect(temp.source.path).toEqual(defaultOutput[i].source.path, "source.path "+ message);
                        });
                    });

                    describe("if annotation is missing from table and schema, ", function () {
                        it ("if context is not detailed should return an empty array.", function () {
                            expect(noAnnotReference.getExportTemplates(true).length).toBe(0);
                        });

                        it ("otherwise should return the default export template.", function () {
                            var templates = noAnnotReference.contextualize.detailed.getExportTemplates(true);
                            expect(templates.length).toBe(1, "length missmatch");

                            expect(templates[0].displayname).toBe("BDBag", "displayname missmatch");
                            expect(templates[0].type).toBe("BAG", "type missmatch");

                            var defaultOutput = getDefaultOutputs(schemaName1);

                            // just to produce a better error message
                            expect(templates[0].outputs.length).toBe(defaultOutput.length, "outputs length missmatch");
                            templates[0].outputs.forEach(function (temp, i) {
                                var message = "missmatch for index=" + i;
                                expect(temp.destination.name).toEqual(defaultOutput[i].destination.name, "destination.name "+ message);
                                expect(temp.destination.type).toEqual(defaultOutput[i].destination.type, "destination.type "+ message);
                                expect(temp.source.api).toEqual(defaultOutput[i].source.api, "source.api "+ message);
                                expect(temp.source.path).toEqual(defaultOutput[i].source.path, "source.path "+ message);
                            });
                        });

                        it ("should return empty if vis-col export context is empty array", function () {
                            var tempRef = emptyVisColExportReference.contextualize.detailed;
                            expect(tempRef.defaultExportTemplate).toBe(null, "default template missmatch")
                            expect(tempRef.getExportTemplates(true).length).toBe(0, "templates length missmatch");
                        });

                        it ("if default export paths are long, should fall back to entity api.", function () {
                            var templates = tableWithLongDefaultReference.contextualize.detailed.getExportTemplates(true);
                            expect(templates.length).toBe(1, "length missmatch");

                            expect(templates[0].displayname).toBe("BDBag", "displayname missmatch");
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
                    expect(templates.length).toBe(0, "missmatch for when annot is not defined at all");

                    templates = tableWithContextExportReference.contextualize.detailed.getExportTemplates();
                    expect(templates.length).toBe(0, "missmatch for when annot is not defined for the given context.");
                });

            });


            describe("reference.csvDownloadLink should honor the visible-columns, ", function () {
                var baseURL = options.url + "/catalog/" + process.env.DEFAULT_CATALOG +
                              "/attributegroup/M:=export_table_annot_schema:no_export_annot/id::geq::1&id::leq::10/$M" +
                              "/(id)=(export_table_annot_schema:f1:id)/RID=1;RID=2/$M/id=1/";
                var qParam = "?limit=none&accept=csv&uinit=1&cid=test&download=%2A%2ANo%20Export%20Annot%2A%2A";

                it ("if export/<context> is defined should use it.", function () {
                    var ref = noAnnotReference.contextualize.compact;
                    var path = "F1:=left(fk_col_2,fk_col_3)=(export_table_annot_schema:outbound1:id1,id2)/$M/RID;id,name,asset_5,fk_col_2,fk_col_3,outbound1.Name_1:=F1:Name";
                    expect(ref.csvDownloadLink).toEqual(baseURL + path + qParam);
                });

                it ("otherwise should use export context.", function () {
                    expect(noAnnotReference.csvDownloadLink).toEqual(baseURL + getDefaultOutputs(schemaName1)[0].source.path + qParam);
                });

                it ("otherwise should use the detailed context", function () {
                    var res = options.url + "/catalog/" + process.env.DEFAULT_CATALOG +
                             "/attributegroup/M:=export_table_annot_schema:main/"+
                             "RID;id,text_col,lgt,markdown_col,int_col,float_col,date_col,timestamp_col" +
                             "?limit=none&accept=csv&uinit=1&cid=test&download=Main%20%2F%20table";

                    expect(reference.csvDownloadLink).toEqual(res);
                });

                it ("should return null if visible-columns is empty", function () {
                    expect(emptyVisColExportReference.csvDownloadLink).toEqual(null);
                });
            });

            describe("for BDBag template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, "bag-name", reference.table.getExportTemplates()[0], "/deriva/export/");

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.getExportTemplates()[0]);
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
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });
            });

            describe("for BDBag CSV template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, "bag-name", reference.table.getExportTemplates()[1], "deriva/export/");

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.getExportTemplates()[1]);
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
                    exportObj = new ermRest.Exporter(reference, "bag-name", reference.table.getExportTemplates()[2], "/deriva/export/");

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.getExportTemplates()[2]);
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
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });
            });
        });

    });
}
