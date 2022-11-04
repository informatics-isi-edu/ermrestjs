const { template } = require("handlebars");
const utils = require("../../../utils/utilities.js");

exports.execute = function (options) {
    //add the catalog level annotations
    beforeAll((done) => {
        utils.setCatalogAnnotations(options, {
            "tag:isrd.isi.edu,2019:export": {
                "compact/select": {
                    "templates": [
                        {
                            "displayname": "contextualized catalog template",
                            "type": "BAG",
                            "outputs": [
                                {"fragment_key": "$chaise_default_bdbag_outputs"}
                            ]
                        }
                    ]
                }
            },
            "tag:isrd.isi.edu,2021:export-fragment-definitions": {
                "template_w_circular_dep": {
                    "displayname": "recursive",
                    "type": "BAG",
                    "outputs": [
                        {
                            "source": {
                                "api": "entity"
                            },
                            "destination": {
                                "type": "csv",
                                "name": "valid_output"
                            }
                        },
                        {"fragment_key": "output_w_circular_dep"}
                    ]
                },
                "output_w_circular_dep": {
                    "source": {
                        "api": "entity"
                    },
                    "destination": {"fragment_key": "destination_w_circular_dep"}
                },
                "destination_w_circular_dep": {"fragment_key": "output_w_circular_dep"},
                "template_w_invalid_fragment_key": {
                    "displayname": "invalid fragment key",
                    "type": "BAG",
                    "outputs": [
                        {
                            "source": {
                                "api": "entity"
                            },
                            "destination": {
                                "type": "csv",
                                "name": "valid_output"
                            }
                        },
                        {"fragment_key": "some_invalid_frag_key_that_doesnt_exist"}
                    ]
                },
                "$ignored_template": {
                    "displayname": "$ in fragment key",
                    "type": "BAG",
                    "outputs": [
                        {
                            "source": {
                                "api": "entity"
                            },
                            "destination": {
                                "type": "csv",
                                "name": "valid_output"
                            }
                        }
                    ]
                },
                "defined_default_outputs": [
                    {
                        "source": {
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "catalog_default_output_1"
                        }
                    },
                    {
                        "source": {
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "catalog_default_output_2"
                        }
                    }
                ],
                "defined_default_templates": [
                    {
                        "displayname": "default temp1",
                        "type": "BAG",
                        "outputs": [{"fragment_key": "defined_default_outputs"}]
                    },
                    {
                        "displayname": "default temp2",
                        "type": "BAG",
                        "outputs": [{"fragment_key": "defined_default_outputs"}],
                        "postprocessors": [
                            {
                                "processor": "identifier",
                                "processor_params": {
                                    "test": "True"
                                }
                            }
                        ]
                    }
                ]
            }
        }).then(() => {
            done();
        }).catch((err) => done.fail(err));
    });

    describe('Export integration, ', function () {
        var schemaName1 = "export_table_annot_schema",
            schemaName2 = "export_schema_annot_schema",
            tableName = "main",
            tableNameInvalidTemplate = "invalid_temp",
            tableNameInvalidTemplate2 = "invalid_temp2",
            tableNameNoExport = "no_export_annot",
            tableWithLongDefaultExport = "table_with_long_default_export",
            tableWithContextualizedExport = "table_w_contextualized_export",
            tableWithEmptyVisColExport = "table_w_empty_vis_col_for_export",
            tableWUsedFragments = "table_w_used_fragments",
            tableWInvalidFragments = "table_w_invalid_fragments",
            tableWCustomizedFragments = "table_w_customized_fragments",
            table, ermRest, reference, noAnnotReference, noExportoutputReference, tableWithLongDefaultReference,
            tableWithContextExportReference, tableAndSchemaWithContextExportReference, emptyVisColExportReference, exportObj;

        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/", ermRest;

        // {"and":[{"source":"id","ranges":[{"min":"1","max":"10"}]},{"source":[{"inbound":["export_table_annot_schema","f1_fk_1"]},"RID"],"choices":["1","2"]}]}
        var facetBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaEDSAcxyTkRAFsCJ8BGEU+sAD1YAYQAvgF0BxZOmx4EoJgCN00WiBxcADigwAXAPqawsgDY5tkCCh1IsACxyd2IAGYttDgNba2I0gCUAkgBEQIVJrFAJcGgQQNlIAJiDhASA";
        var noAnnotUri = baseUri + schemaName1 + ":" + tableNameNoExport + "/id=1/*::facets::" + facetBlob;

        var noExportOutputUri = baseUri + schemaName2 + ":" + tableNameNoExport;

        var noExportOutputWithLongPathUri = baseUri + schemaName1 + ":" + tableWithLongDefaultExport;

        var contextualizedTableExportUri = baseUri + schemaName1 + ":" + tableWithContextualizedExport;

        var contextualizedTableAndSchemaExportUri = baseUri + schemaName2 + ":" + tableWithContextualizedExport;

        var emptyVisColExportUri = baseUri + schemaName1 + ":" + tableWithEmptyVisColExport;

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

        var createURL = function (schema, table) {
            return baseUri + schema + ":" + table;
        }

        var checkFirstTemplateDisplayname = function (schema_name, table_name, context, expected, done) {
            ermRest.resolve(createURL(schema_name, table_name), {cid: "test"}).then(function (ref) {
                switch (context) {
                    case "compact":
                        ref = ref.contextualize.compact;
                        break;
                    case "compact/select":
                        ref = ref.contextualize.compactSelect;
                        break;
                    case "detailed":
                        ref = ref.contextualize.detailed;
                        break;
                }
                var templates = ref.getExportTemplates(false);
                expect(templates.length).toBe(1, "length missmatch");
                expect(templates[0].displayname).toEqual(expected, "displayname missmatch.");
                done();
            }).catch(function (err) {
                done.fail(err);
            });
        };

        beforeAll(function (done) {
            
            ermRest = options.ermRest;

            ermRest.resolve(baseUri + schemaName1 + ":" + tableName, { cid: "test" }).then(function (response) {
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
            }).catch(function (err) {
                done.fail(err);
            });
        });


        describe("reference.getExportTemplates, ", function () {
            describe('regarding overall template list, ', function () {
                it ("if annotation defined with an invalid value, should return empty array.", function (done) {
                    ermRest.resolve(createURL(schemaName1, tableNameInvalidTemplate)).then(function (ref) {
                        ref = ref.contextualize.detailed;
                        expect(ref.getExportTemplates(true)).toEqual([]);
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("should ignore invalid templates.", function (done) {
                    checkFirstTemplateDisplayname(schemaName1, tableNameInvalidTemplate2, null, "valid_temp", done);
                });

                it ("should return the template defined for the given context in table.", function () {
                    var templates = tableAndSchemaWithContextExportReference.contextualize.compact.getExportTemplates();
                    expect(templates.length).toBe(1, "length missmatch");
                    expect(templates[0].displayname).toEqual("contextualized table template", "displayname missmatch");
                });

                it ("otherwise, should return the 2016:export on the table.", function (done) {
                    checkFirstTemplateDisplayname(schemaName2, tableWithContextualizedExport, "detailed", "default table template", done);
                });

                it("otherwise, should the 2019:export defined on the schema for the context.", function (done) {
                    checkFirstTemplateDisplayname(schemaName2, tableNameNoExport, "compact", "contextualized schema template", done);
                });

                it ("otherwise, should return the 2016:export defined on the schema.", function (done) {
                    checkFirstTemplateDisplayname(schemaName2, tableNameNoExport, "detailed", "default schema template", done);
                });

                it ("otherwise, should return the export defined on the catalog for the context", function (done) {
                    checkFirstTemplateDisplayname(schemaName1, tableNameNoExport, "compact/select", "contextualized catalog template", done);
                });

                describe("otherwise (no annotation defined), ", function () {
                    it ("if context is not detailed should return an empty array.", function () {
                        expect(noAnnotReference.getExportTemplates(true).length).toBe(0);
                    });

                    it ("if useDefault is false should return an empty array.", function () {
                        var templates = noAnnotReference.contextualize.detailed.getExportTemplates(false);
                        expect(templates.length).toBe(0, "missmatch for when annot is not defined at all");

                        templates = tableWithContextExportReference.contextualize.detailed.getExportTemplates();
                        expect(templates.length).toBe(0, "missmatch for when annot is not defined for the given context.");
                    });

                    describe("if useDefault is true and in detailed context, ", function () {
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
            });

            describe("regarding fragment support", function () {
                it ("should be able to use the default bdbag fragments", function (done) {
                    ermRest.resolve(createURL(schemaName2, tableWUsedFragments, {cid: "test"})).then(function (ref) {
                        ref = ref.contextualize.detailed;
                        var templates = ref.getExportTemplates(false);
                        expect(templates.length).toBe(2, "length missmatch");

                        // first template i using default displayname, but outputs is customized
                        expect(templates[0].displayname).toEqual("BDBag", "temp 0, displayname");
                        expect(templates[0].outputs.length).toEqual(1, "temp 0, outputs length");
                        expect(templates[0].outputs[0].destination.name).toEqual("custom_defined_destination", "temp 0, destination");

                        // second template is using the default template
                        expect(templates[1].displayname).toEqual("BDBag", "temp 1, displayname");
                        expect(templates[1].outputs.length).toEqual(1, "temp 1, outputs length");
                        expect(templates[1].outputs[0].source.path).toEqual("RID;id,col,RCT,RMT,RCB,RMB", "temp 1, source");
                        expect(templates[1].outputs[0].destination.name).toEqual("table_w_used_fragments", "temp 1, destination");
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("should ignore templates that have invalid fragments or circular dependency", function (done) {
                    ermRest.resolve(createURL(schemaName2, tableWInvalidFragments, {cid: "test"})).then(function (ref) {
                        ref = ref.contextualize.compact;
                        var templates = ref.getExportTemplates(false);
                        expect(templates.length).toBe(1, "length missmatch");

                        expect(templates[0].displayname).toEqual("compact table template");
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("should use the fragment defined on the table", function (done) {
                    ermRest.resolve(createURL(schemaName2, tableWCustomizedFragments, {cid: "test"})).then(function (ref) {
                        ref = ref.contextualize.compact;
                        var templates = ref.getExportTemplates(false);
                        expect(templates.length).toBe(2, "length missmatch");

                        // first template comes from the fragment on table
                        expect(templates[0].displayname).toEqual("template fragment on table", "temp 0, displayname");
                        expect(templates[0].outputs.length).toEqual(1, "temp 0, outputs length");
                        expect(templates[0].outputs[0].destination.name).toEqual("table customized", "temp 0, destination");

                        // second template comes from the export on table
                        expect(templates[1].displayname).toEqual("compact table template", "temp 1, displayname");
                        expect(templates[1].outputs.length).toEqual(1, "temp 1, outputs length");
                        expect(templates[1].outputs[0].destination.name).toEqual("man_bag", "temp 1, destination");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("otherwise should use the schema definition", function (done) {
                    ermRest.resolve(createURL(schemaName2, tableWUsedFragments, {cid: "test"})).then(function (ref) {
                        ref = ref.contextualize.compact;
                        var templates = ref.getExportTemplates(false);
                        expect(templates.length).toBe(2, "length missmatch");

                        // both templates come from the fragment on catalog,
                        // with customized output in schema

                        expect(templates[0].displayname).toEqual("default temp1", "temp 0, displayname");
                        expect(templates[0].outputs.length).toEqual(2, "temp 0, outputs length");
                        expect(templates[0].outputs[0].destination.name).toEqual("schema_default_output_1", "temp 0, output 0, destination");
                        expect(templates[0].outputs[1].destination.name).toEqual("schema_default_output_2", "temp 0, output 1, destination");

                        expect(templates[1].displayname).toEqual("default temp2", "temp 1, displayname");
                        expect(templates[1].outputs.length).toEqual(2, "temp 1, outputs length");
                        expect(templates[1].outputs[0].destination.name).toEqual("schema_default_output_1", "temp 1, output 0, destination");
                        expect(templates[1].outputs[1].destination.name).toEqual("schema_default_output_2", "temp 1, output 1, destination");
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ('otherwise should use the one defined in catalog', function (done) {
                    ermRest.resolve(createURL(schemaName1, tableWUsedFragments, {cid: "test"})).then(function (ref) {
                        ref = ref.contextualize.compact;
                        var templates = ref.getExportTemplates(false);
                        expect(templates.length).toBe(3, "length missmatch");

                        // first template is defined on the table export annot
                        expect(templates[0].displayname).toEqual("compact table template", "temp 0, displayname");
                        expect(templates[0].outputs.length).toEqual(1, "temp 0, outputs length");
                        expect(templates[0].outputs[0].destination.name).toEqual("table_man_bag", "temp 0, destination");

                        // second and third templates are using the fragment on catalog
                        expect(templates[1].displayname).toEqual("default temp1", "temp 1, displayname");
                        expect(templates[1].outputs.length).toEqual(2, "temp 1, outputs length");
                        expect(templates[1].outputs[0].destination.name).toEqual("catalog_default_output_1", "temp 1, output 0, destination");
                        expect(templates[2].outputs[1].destination.name).toEqual("catalog_default_output_2", "temp 1, output 1, destination");

                        expect(templates[2].displayname).toEqual("default temp2", "temp 2, displayname");
                        expect(templates[2].outputs.length).toEqual(2, "temp 2, outputs length");
                        expect(templates[2].outputs[0].destination.name).toEqual("catalog_default_output_1", "temp 2, output 0, destination");
                        expect(templates[2].outputs[1].destination.name).toEqual("catalog_default_output_2", "temp 2, output 1, destination");
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });
            });
        });

        describe("reference.csvDownloadLink should honor the visible-columns, ", function () {
            var baseURL = options.url + "/catalog/" + process.env.DEFAULT_CATALOG +
                            "/attributegroup/M:=export_table_annot_schema:no_export_annot/id::geq::1&id::leq::10/$M" +
                            "/(id)=(export_table_annot_schema:f1:id)/RID=any(1,2)/$M/id=1/";
            var qParam = "?limit=none&accept=csv&uinit=1&cid=test&download=%2A%2ANo%20Export%20Annot%2A%2A";

            it ("if export/<context> is defined should use it.", function () {
                var ref = noAnnotReference.contextualize.compact;
                var path = "F1:=left(fk_col_2,fk_col_3)=(export_table_annot_schema:outbound1:id1,id2)/$M/RID;id,name,asset_5,fk_col_2,fk_col_3,outbound1.Name_1:=F1:Name";
                expect(ref.csvDownloadLink).toEqual(baseURL + path + qParam);
            });

            it ("otherwise should use export context.", function () {
                expect(noAnnotReference.csvDownloadLink).toEqual(baseURL + getDefaultOutputs(schemaName1)[0].source.path + qParam);
            });

            it ("otherwise should use the detailed context (even for compact context)", function () {
                var res = options.url + "/catalog/" + process.env.DEFAULT_CATALOG +
                            "/attributegroup/M:=export_table_annot_schema:main/"+
                            "RID;id,text_col,lgt" +
                            "?limit=none&accept=csv&uinit=1&cid=test&download=Main%20%2F%20table";

                            expect(reference.contextualize.compact.csvDownloadLink).toEqual(res, "missmatch for compact");
                expect(reference.contextualize.detailed.csvDownloadLink).toEqual(res, "missmatch for detailed");
            });

            it ("should return null if visible-columns is empty", function () {
                expect(emptyVisColExportReference.csvDownloadLink).toEqual(null);
            });
        });

        // we don't want to call the export in CI since it's not installed
        if (process.env.CI) return;


        it ("templates are properly defined for the rest of test cases", function () {
            var templates = reference.getExportTemplates();
            expect(templates.length).toBe(3, "length missmatch");
        });

        describe("for BDBag template", function () {
            it("should create an exporter object", function() {
                exportObj = new ermRest.Exporter(reference, "bag-name", reference.getExportTemplates()[0], "/deriva/export/");

                expect(exportObj instanceof ermRest.Exporter).toBe(true);
                expect(exportObj.template).toEqual(reference.getExportTemplates()[0]);
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
                exportObj = new ermRest.Exporter(reference, "bag-name", reference.getExportTemplates()[1], "deriva/export/");

                expect(exportObj instanceof ermRest.Exporter).toBe(true);
                expect(exportObj.template).toEqual(reference.getExportTemplates()[1]);
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
                exportObj = new ermRest.Exporter(reference, "bag-name", reference.getExportTemplates()[2], "/deriva/export/");

                expect(exportObj instanceof ermRest.Exporter).toBe(true);
                expect(exportObj.template).toEqual(reference.getExportTemplates()[2]);
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

    // remove the added catalog level annotations
    afterAll((done) => {
        utils.setCatalogAnnotations(options, {}).then(() => {
            done();
        }).catch((err) => done.fail(err));
    });
}
