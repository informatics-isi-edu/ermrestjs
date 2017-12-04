/**
 * All the test cases related to the ReferenceColumn object.
 */
exports.execute = function (options) {
    describe('ReferenceColumn, ', function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "columns_schema",
            tableName = "columns_table", // the structure of this table is explained in 14.pseudo_columns.js
            tableWithAsset = "table_w_asset", // the structure of this table is exlpained in 14.pseudo_columns.js
            tableWithDiffColTypes = "table_w_diff_col_types",
            entityId = 1,
            limit = 1,
            entryContext = "entry",
            createContext = "entry/create",
            editContext = "entry/edit",
            detailedContext = "detailed";

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/id=" + entityId;

        var singleEnitityUriWithAsset = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithAsset + "/id=" + entityId;
            
        var singleEnitityUriDiffColTypes = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithDiffColTypes + "/id=" + entityId;

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function (tag, location) {
            var url;
            switch (tag) {
                case "tag:isrd.isi.edu,2016:chaise:record":
                    url = recordURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:record-two":
                    url = record2URL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:viewer":
                    url = viewerURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:search":
                    url = searchURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:recordset":
                    url = recordsetURL;
                    break;
                default:
                    url = recordURL;
                    break;
            }

            url = url + "/" + location.path;

            return url;
        };

        var data = {
            "id": "1",
            "id_1": "2",
            "id_2": "3"
        };


        var reference, compactRef, entryCreateRef, entryEditRef, compactSelectRef, compactBriefRef, compactColumns;
        var assetRef, assetRefCompactCols, assetRefEntryCols, detailedRef, detailedColumns, diffColTypeColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {
                reference = response;

                detailedRef = response.contextualize.detailed;
                compactRef = response.contextualize.compact;

                entryCreateRef = response.contextualize.entryCreate;
                entryEditRef = response.contextualize.entryEdit;

                compactColumns = compactRef.columns;
                detailedColumns = detailedRef.columns; // the

                compactSelectRef = response.contextualize.compactSelect;
                compactBriefRef = response.contextualize.compactBrief; // first column is a composite key

                return options.ermRest.resolve(singleEnitityUriWithAsset, {cid:"test"});
            }).then(function(ref){
                assetRef = ref;
                assetRefCompactCols = ref.contextualize.compact.columns;
                assetRefEntryCols = ref.contextualize.entry.columns;
                return options.ermRest.resolve(singleEnitityUriDiffColTypes, {cid: "test"});
            }).then(function (ref) {
                diffColTypeColumns = ref.contextualize.compact.columns;
                
                done();
            }).catch(function (err){
                console.dir(err);
                done.fail();
            });
        });

        describe('.isPseudo, ', function () {
            it('for PseudoColumns should return true.', function () {
                let i;
                for (i = 0; i < 5; i++) {
                    expect(compactColumns[i].isPseudo).toBe(true, "problem with Outbound FKs, index=" + i);
                }
                for (i = 11; i < 16; i++) {
                    expect(compactColumns[i].isPseudo).toBe(true, "problem with Outbound FKs, index=" + i);
                }

                for (i = 9; i < 11; i++) {
                    expect(assetRefCompactCols[i].isPseudo).toBe(true, "problem with Asset index=" + i);
                }

                expect(detailedColumns[3].isPseudo).toBe(true, "problem with Inbound FKs.");

            });

            it('for other columns should return false.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(compactColumns[i].isPseudo).toBe(false);
                }
            });
        });

        describe('.isKey, ', function () {
            it ('for PseudoColumns that are key should return true.', function () {
                expect(compactColumns[0].isKey).toBe(true);
            });

            it ('for other columns should return undefined.', function () {
                for (var i = 1; i < 16; i++) {
                    expect(compactColumns[i].isKey).toBe(undefined);
                }
            });
        });

        describe('.isForeignKey, ', function () {
            it ('for PseudoColumns that are foreign key should return true.', function () {
                for (var i = 1; i < 16; i++) {
                    expect(compactColumns[i].isForeignKey).toBe(true);
                    if (i == 4) i = 10;
                }
            });

            it ('for other columns should return undefined.', function () {
                expect(compactColumns[0].isForeignKey).toBe(undefined);
                for (var i = 5; i < 11; i++) {
                    expect(compactColumns[i].isForeignKey).toBe(undefined);
                }
            });
        });

        describe('.isAsset, ', function () {
            it ('for PseudoColumns that are asset should return true.', function () {
                for (var i = 9; i < 11; i++) {
                    expect(assetRefCompactCols[i].isAsset).toBe(true);
                }
            });

            it ('for other columns should return undefined.', function () {
                for (var i = 0; i < 9; i++) {
                    expect(assetRefCompactCols[i].isAsset).toBe(undefined);
                }
            });
        });

        describe('.isInboundForeignKey', function () {
            it ('for PseudoColumns that are inbound foreign key should return true.', function () {
                expect(detailedColumns[3].isInboundForeignKey).toEqual(true);
            });

            it ('for other columns should return undefined.', function () {
                for (var i = 0; i < 2; i++) {
                    expect(detailedColumns[i].isInboundForeignKey).toBe(undefined);
                }
            });
        })


        describe('.table, ', function () {
            it('for pseudoColumns that are key, should return the key table.', function () {
                expect(compactColumns[0].table.name).toBe("columns_table");
            });

            it('for pseudoColumns that are foreign key, should return the foreign key table.', function () {
                for (var i = 1; i < 4; i++) {
                    expect(compactColumns[i].table.name).toBe("table_w_simple_key");
                }
                expect(compactColumns[4].table.name).toBe("table_w_simple_key_2");
                expect(compactColumns[11].table.name).toBe("table_w_composite_key");
                expect(compactColumns[12].table.name).toBe("table_w_composite_key_2");
                expect(compactColumns[13].table.name).toBe("table_w_composite_key");
                expect(compactColumns[14].table.name).toBe("table_w_composite_key");
                expect(compactColumns[15].table.name).toBe("table_w_composite_key");
            });

            it('for pseudoColumns that are inboud foreign key, should return the foreign key table.', function () {
                expect(detailedColumns[3].table.name).toEqual("inbound_related_to_columns_table_2");
            });

            it('for other columns should return the base column\'s table.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(compactColumns[i].table.name).toBe(tableName);
                }

                for (var i = 8; i < 11; i++) {
                    expect(assetRefCompactCols[i].table.name).toBe(tableWithAsset);
                }
            });
        });

        describe('.name, ', function () {
            it('for pseudoColumns, ', function () {
                it('should use constraint name.', function () {
                    expect(compactColumns[0].name).toBe(["columns_schema", "ref_table_outbound_fks_key"].join(":"));
                    expect(compactColumns[13].name).toBe(["columns_schema", "outbound_fk_8"].join(":"));
                    expect(detailedColumns[3].name).toBe(["columns_schema", "inbound_related_to_columns_table_2_fkey"].join("_"));
                });

                it('should make sure that the chosen name is unique.', function () {
                    expect(compactColumns[14].name).toBe(["columns_schema", "outbound_fk_7"].join(":")+"1");
                });
            });

            it('for other columns should return the base column\'s type.', function () {
                expect(compactColumns[10].name).toBe("columns_schema_outbound_fk_7");
            });
        });

        describe('.displayname, ', function () {
            describe('for pseudoColumns that are foreign key, ', function () {
                it('should use the foreignKey\'s to_name.', function () {
                    checkDisplayname(compactColumns[1].displayname, "to_name_value", false);
                });

                describe('when foreignKey\'s to_name is not defined, ', function () {
                    describe('for simple foreign keys, ', function () {
                        it('should use column\'s displayname in the absence of to_name in foreignKey.', function () {
                            checkDisplayname(compactColumns[2].displayname, "Column 2 Name", false);
                        });

                        it('should be disambiguated with Table.displayname when there are multiple foreignkeys.', function () {
                            checkDisplayname(compactColumns[3].displayname, "Column 3 Name (table_w_simple_key)", false);
                            checkDisplayname(compactColumns[4].displayname, "Column 3 Name (table_w_simple_key_2)", false);
                        });
                    });

                    describe('for composite foreign keys, ', function () {
                        it('should use referenced table\'s displayname in the absence of to_name in foreignKey.', function () {
                            checkDisplayname(compactColumns[12].displayname, "table_w_composite_key_2", false);
                        });

                        it('should be disambiguated with displayname of columns when there are multiple foreignkeys to that table.', function () {
                            checkDisplayname(compactColumns[13].displayname, "table_w_composite_key (col 5, Column 3 Name)", false);
                            checkDisplayname(compactColumns[14].displayname, "table_w_composite_key (col 5, col_4)", false);
                        });
                    })

                });
            });

            describe('for pseudoColumns that are key, ', function() {
                it('should use `markdown_name` that is defined on display annotation.', function () {
                    checkDisplayname(compactBriefRef.columns[2].displayname, "<strong>fourth key</strong>", true);
                });

                it('should use `name` that is defined on display annotation.', function () {
                    checkDisplayname(compactBriefRef.columns[1].displayname, "third key", false);
                });

                it('otherwise, should return the consitutent column displaynames seperated by colon.', function() {
                    checkDisplayname(compactColumns[0].displayname, "id", false);
                    checkDisplayname(compactBriefRef.columns[0].displayname, "Column 3 Name:col_6", false);
                });

            });

            describe('for pseudoColumns that are inbound foreign key, ', function () {
                it("should return the reference's displayname.", function () {
                    checkDisplayname(detailedColumns[3].displayname, "inbound_related_to_columns_table_2", false);
                });
            });

            it('for other columns, should return the base column\'s displayname.', function () {
                checkDisplayname(compactColumns[5].displayname, "Column 3 Name", false);
            });
        });

        describe('.type, ', function () {
            it('for PseudoColumns should return `markdown`.', function () {
                for (var i = 0; i < 5; i++) {
                    expect(compactColumns[i].type.name).toBe("markdown");
                }
                for (var i = 11; i < 16; i++) {
                    expect(compactColumns[i].type.name).toBe("markdown");
                }
                for (var i = 9; i < 11; i++) {
                    expect(assetRefCompactCols[i].type.name).toBe('markdown');
                }

                expect(detailedColumns[3].type.name).toBe("markdown");
            });

            it('for other columns should return the base column\'s type.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(compactColumns[i].type.name).toBe("text");
                }
            });
        });

        describe('.nullok, ', function () {
            describe('for PseudoColumns,', function () {
                it('that are inbound foreignkey should return an error.', function () {
                    expect(function () {
                        let nullok = detailedColumns[3].nullok;
                    }).toThrow("can not use this type of column in entry mode.");
                });

                it("if any of its columns have nullok=false, should return false.", function () {
                    // simple fk
                    expect(compactColumns[3].nullok).toBe(false);
                    // composite fk, one false
                    expect(compactColumns[11].nullok).toBe(false);
                    // composite fk, all false
                    expect(compactColumns[12].nullok).toBe(false);
                    // simple key
                    expect(compactColumns[0].nullok).toBe(false);
                });

                it('otherwise should return true.', function () {
                    // simple fk
                    expect(compactColumns[2].nullok).toBe(true);
                    // composite fk, all true
                    expect(compactColumns[14].nullok).toBe(true);
                });
            });

            it('for other columns should return the base column\'s nullok.', function () {
                expect(compactColumns[5].nullok).toBe(false);
                expect(compactColumns[9].nullok).toBe(true);
            });
        });

        describe('.default, ', function () {
            describe('for pseudoColumns that are foreign key, ', function () {
                it('that are inbound foreignkey should return an error.', function () {
                    expect(function () {
                        var def = detailedColumns[3].default;
                    }).toThrow("can not use this type of column in entry mode.");
                });

                it ('should return null if any of the constituent column default values is null.', function () {
                    expect(compactColumns[1].default).toBe(null);
                    expect(compactColumns[15].default).toBe(null);
                });

                it ('should return a rowname if it is possible to generate one with default values.', function () {
                    expect(compactColumns[14].default).toEqual('col 4 default , col 5 default');
                });

                it ('should return a rowname using only the consitutent column values if rowname heuristics returned an empty string.', function () {
                    expect(compactColumns[12].default).toEqual('col 3 default:col 6 default');
                });
            });

            it('for pseudoColumns that are key, should return undefined.', function () {
                expect(compactColumns[0].default).toBe(undefined);
            });

            it('for other columns should return the base column\'s default value.', function () {
                expect(compactColumns[6].default).toEqual('col 4 default');
                expect(compactColumns[7].default).toEqual('col 5 default');
                expect(compactColumns[9].default).toEqual(null);
            });
        });

        describe('.comment, ', function () {
            describe('for pseudoColumns, ', function () {
                it('that are inbound foreignkey should return table\'s comment.', function () {
                    expect(detailedColumns[3].comment).toEqual("inbound related to columns_table");
                });

                it('when key/foreign key is simple should use column\'s comment.', function () {
                    expect(compactColumns[0].comment).toBe("not part of any FKRs.");
                    expect(compactColumns[1].comment).toBe("simple fk to reference, col_1");
                });

                it('otherwise should use key/foreignkey\'s comment.', function () {
                    expect(compactColumns[11].comment).toBe("composite fk to table_w_composite_key with to_name");
                });
            });

            it('for other columns should return the base column\'s comment.', function () {
                expect(compactColumns[10].comment).toBe("not part of any FKRs.");
            });
        });

        describe('.inputDisabled, ', function () {
            describe('for pseudoColumns, ', function () {
                it('that are inbound foreignkey should return an error.', function () {
                    expect(function () {
                        let inputDisabled = detailedColumns[3].inputDisabled;
                    }).toThrow("can not use this type of column in entry mode.");
                });

                it('if it\'s based on one column (simple), should return base column\`s result.', function () {
                    // has generated
                    expect(entryCreateRef.columns[0].inputDisabled).toEqual({
                        message: "Automatically generated"
                    });

                    // has immutable
                    expect(entryEditRef.columns[3].inputDisabled).toBe(true);

                    // does not have immutable nor generated
                    expect(entryEditRef.columns[4].inputDisabled).toBe(false);
                });

                describe('otherwise, ', function () {
                    describe('in create context, ', function () {
                        it('if all columns are generated, should return generated message.', function () {
                            expect(entryCreateRef.columns[1].inputDisabled).toEqual({
                                message: "Automatically generated"
                            });
                        });

                        it('if at least one of the columns is not generated, should return false.', function () {
                            expect(entryCreateRef.columns[2].inputDisabled).toBe(false);
                        });
                    });

                    describe('in edit context, ', function () {
                        it('if one of the columns is immutable, should return true.', function () {
                            expect(entryEditRef.columns[7].inputDisabled).toBe(true);
                        });

                        it('if none of the columns are immutable and all of them are generated, should return true.', function () {
                            expect(entryEditRef.columns[5].inputDisabled).toBe(true);
                        });

                        it('if none of the columns are immutable and at least one of the columns is not generated, should return false.', function () {
                            expect(entryEditRef.columns[6].inputDisabled).toBe(false);
                        });
                    });

                    it('in other contexts should return true.', function () {
                        expect(compactSelectRef.columns[5].inputDisabled).toBe(true);
                    });
                });
            });
        });

        describe('.filteredRef, ', function() {
            var mainEntityReference, mainEntityColumns, filteredReference, mainEntityData, foreignKeyData,
                mainEntityTableName = "main-entity-table",
                schemaUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":";
                mainEntityUri = schemaUri  + mainEntityTableName;

            describe('for pseudoColumns, ', function() {
                describe('for foreign keys, ', function() {

                    beforeAll(function(done) {
                        options.ermRest.resolve(mainEntityUri, {
                            cid: "test"
                        }).then(function (response) {
                            mainEntityReference = response;

                            // mainEntityColumns[i] where:
                            // 1=0 - id for table
                            // i=1 - foreign key to no constraint table this constrains the following col
                            // i=2 - foreign key to constrained table with domain filter defined with a dynamic value
                            // i=3 - foreign key to position table with domain filter defined with a static value
                            // i=4 - text column that constrains the following fk
                            // i=5 - foreign key to position table with domain filter defined with dynamic value
                            // i=6 - foreign key to constrained table with domain filter with a conjunction of 2 dynamic values
                            // i=7 - foreign key to position table with 
                            mainEntityColumns = response.columns;

                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });
                    });

                    describe('should return a filtered reference based on provided data.', function () {
                        it('Reference for mainEntityColumns[3], should have proper domain filter.', function() {
                            mainEntityData = {}
                            filteredReference = mainEntityColumns[3].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "position-type-table/position_type_col=fixed");
                        });

                        it('Reference for mainEntityColumns[5], should have proper domain filter.', function() {
                            mainEntityData = {"position_text_col": "relative"};
                            filteredReference = mainEntityColumns[5].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "position-type-table/position_type_col=" + mainEntityData.position_text_col);
                        });

                        it('Reference for mainEntityColumns[2], should have proper domain filter.', function() {
                            mainEntityData = {"fk1": 1234};
                            filteredReference = mainEntityColumns[2].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table/fk2=" + mainEntityData.fk1);
                        });

                        it('Reference for mainEntityColumns[6], should have proper domain filter.', function() {
                            mainEntityData = {"fk1": 1234, "position_text_col": "relative"};
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table/fk2=" + mainEntityData.fk1 + "&position_col=" + mainEntityData.position_text_col);
                        });
                    });

                    describe('should return the originating reference if the variable in the domain filter pattern is not present.', function() {
                        it('Reference for mainEntityColumns[5], should have no filter defined.', function() {
                            mainEntityData = {};
                            filteredReference = mainEntityColumns[5].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "position-type-table");
                        });

                        it('Reference for mainEntityColumns[2], should have no filter defined.', function() {
                            mainEntityData = {};
                            filteredReference = mainEntityColumns[2].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table");
                        });

                        it('Reference for mainEntityColumns[6], should have proper domain filter.', function() {
                            mainEntityData = {};
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table");

                            // if one value is defined and the other isn't, filter should still be null
                            mainEntityData.fk1 = 1;
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table");

                            delete mainEntityData.fk1;
                            mainEntityData.position_text_col = "relative";
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table");
                        });
                    });

                    describe("should be able to access other foreignkey data, ", function () {
                        it ("when data is not available should return the unfiltered reference.", function () {
                            mainEntityData = {"fk1": 1234};
                            filteredReference = mainEntityColumns[7].filteredRef(mainEntityData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table");
                        });
                        
                        it("otherwise should use the provided data.", function () {
                            mainEntityData = {"fk1": 1234};
                            foreignKeyData = {
                                "columns_schema_fk_position_predefined": {
                                    "int_value": 4321,
                                    "id": 1
                                },
                                "columns_schema_fk_position_user_defined": {
                                    "int_value": 1235,
                                    "id": 2
                                }
                            };
                            filteredReference = mainEntityColumns[7].filteredRef(mainEntityData, foreignKeyData);

                            expect(filteredReference.uri).toBe(schemaUri + "fk-constrained-table/fk2=4321&position_col=1235&id=1234");
                        });
                    });
                    
                    it("should return the originating reference if the domain_filter_pattern results in an invalid (not understandable by parser) url.", function () {
                        mainEntityData = {"position_text_col": "a&v&c"};
                        filteredReference = mainEntityColumns[5].filteredRef(mainEntityData);

                        expect(filteredReference.uri).toBe(schemaUri + "position-type-table");
                    });
                });
            });
        });

        describe('.formatPresentation, ', function () {
            var val;
            describe('for pseudoColumns, ', function () {
                describe('for foreign keys, ', function () {
                    it('should return the correct link.', function () {
                        val = compactColumns[14].formatPresentation(data).value;

                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id=1">' + data.id_1 + ' , ' + data.id_2 + '</a>');
                    });

                    it('should not add a link when the caption has a link.', function () {
                        val = compactColumns[12].formatPresentation(data).value;
                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/search">' + data.id + '</a>');
                    });

                    it('should use the key when only the main table entries are available in data.', function () {
                        var partialData = {
                            "id_1": "col_3_data", "id_2": "col_6_data"
                        };
                        var expectetValue = '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key_2/' +
                                            'id_1=' + partialData["id_1"]+ '&id_2='  +partialData["id_2"] + '">' + partialData["id_1"] + ":" + partialData["id_2"] + '</a>';
                        val = compactColumns[12].formatPresentation(partialData).value;
                        expect(val).toEqual(expectetValue);
                    });

                });

                describe('for keys, ', function () {
                    it('should return null-value if any of the key columns are null.', function () {
                        val = compactColumns[0].formatPresentation({"id_2":1}, "detailed").value;
                        expect(val).toBe(null);

                        val = compactBriefRef.columns[0].formatPresentation({"col_3":"3"}, "compact/brief").value;
                        expect(val).toBe('');
                    });

                    it('should use `markdown_pattern` from key display annotation.', function () {
                        val = compactBriefRef.columns[1].formatPresentation({"col_1":1, "col_3":2, "col_4":"value"}, "compact/brief", {"formattedValues": {"col_4":"value"}}).value;
                        expect(val).toEqual('<strong>value</strong>');
                    });

                    describe('otherwise, ', function () {
                        it ("should use key columns values separated with colon for caption. The URL should refer to the current reference.", function(){
                            val = compactColumns[0].formatPresentation({"id":2}, "detailed", {"formattedValues": {"id":2}}).value;
                            expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/id=2">2</a>');

                            val = compactBriefRef.columns[0].formatPresentation({"col_3":"3", "col_6":"6"}, "compact/brief", {"formattedValues": {"col_3":"3", "col_6":"6"}}).value;
                            expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/col_3=3&col_6=6">3:6</a>');
                        });

                        it('should not add link if the key columns are html.', function () {
                            val = compactBriefRef.columns[2].formatPresentation({"columns_schema_outbound_fk_7":"value"}, "compact/brief", {"formattedValues": {"columns_schema_outbound_fk_7":"value"}}).value;
                            expect(val).toEqual('<p>value</p>\n');
                        })
                    });
                });

                describe('for assets, ', function() {
                    it('if in entry context, return the original underlying data, even if colummn-display annotation is present.', function() {
                        val = assetRefEntryCols[5].formatPresentation({"col_asset_3": "https://example.com"}, "entry", {"formattedValues":{"col_asset_3": "https://example.com"}}).value;
                        expect(val).toEqual("https://example.com");
                        
                        val = assetRefCompactCols[9].formatPresentation({"col_filename": "filename", "col_asset_2": "value"}, "entry", {"formattedValues":{"col_filename": "filename"}}).value;
                        expect(val).toEqual("value");
                    });
                    
                    it('if coulmn has column-display annotation, use it.', function () {
                        val = assetRefCompactCols[9].formatPresentation({"col_filename": "filename", "col_asset_2": "value"}, "compact", {"formattedValues":{"col_filename": "filename"}}).value;
                        expect(val).toEqual("<h2>filename</h2>\n");
                    });

                    it("otherwise return a download link", function() {
                        val = assetRefCompactCols[10].formatPresentation({"col_asset_3": "https://example.com", "col_filename": "filename"}).value;
                        expect(val).toEqual('<a href="https://example.com" download="" class="btn btn-primary">filename</a>');
                    });
                 });

                it('should use the show-nulls annotation, when the data is null.', function () {
                    val = compactColumns[14].formatPresentation({}, "detailed").value;
                    expect(val).toBe(null);
                    val = entryEditRef.columns[7].formatPresentation({}).value;
                    expect(val).toBe("");
                });
            });
        });

        describe('.sortable and ._sortColumns, ', function () {
            describe('for pseudoColumns that are foreignkey, ', function () {
                it('when foreignkey has `column_order:false` annotation, should return false.', function () {
                    // outbound_fk_1
                    expect(compactColumns[1].sortable).toBe(false);
                    expect(compactColumns[1]._sortColumns.length).toBe(0);
                });

                it("when foreignKey has a `column_order` annotation with value other than false, should return true and use those columns for sort.", function () {
                    // outbound_fk_4
                    expect(compactColumns[4].sortable).toBe(true);
                    expect(compactColumns[4]._sortColumns.length).toBe(1);
                    expect(compactColumns[4]._sortColumns[0].name).toBe("name");
                });

                it("when foreignKey doesn't have any `column_order` annotation and referenced table has `row_order`, should use the table's row_order.", function () {
                    //outbound_fk_6
                    expect(compactColumns[12].sortable).toBe(true);
                    expect(compactColumns[12]._sortColumns.length).toBe(1);
                    expect(compactColumns[12]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['id_2']);
                });

                it("when foreignKey doesn't have any `column_order` annotation and is simple, should be based on the constituent column.", function () {
                    // outbound_fk_2 -> id
                    expect(compactColumns[2].sortable).toBe(true);
                    expect(compactColumns[2]._sortColumns.length).toBe(1);
                    expect(compactColumns[2]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['id']);
                });

                describe("when foreign key is not simple, ", function () {
                    it ("and doesn't have `foreign key` annotation (therefore no `column_order` annotation), should return false.", function () {
                        // outbound_fk_7
                        expect(compactColumns[14].sortable).toBe(false);
                        expect(compactColumns[14]._sortColumns.length).toBe(0);
                    });

                    it ('and has `foreign key` annotation but no `display` (and therefore no `column_order` annotation), should return false.', function () {
                        // outbound_fk_8
                        expect(compactColumns[13].sortable).toBe(false);
                        expect(compactColumns[13]._sortColumns.length).toBe(0);
                    });
                });

            });

            describe("for pseudoColumns that are key, ", function () {
                it('when key has `column_order:false` annotation, should return false.', function () {
                    expect(compactBriefRef.columns[2].sortable).toBe(false);
                    expect(compactBriefRef.columns[2]._sortColumns.length).toBe(0);
                });

                it("when key has a `column_order` annotation with value other than false, should return true and use those columns for sort.", function () {
                    expect(compactBriefRef.columns[1].sortable).toBe(true);
                    expect(compactBriefRef.columns[1]._sortColumns.length).toBe(2);
                    expect(compactBriefRef.columns[1]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['col_1', 'col_2']);
                });

                it("when key doesn't have any `column_order` annotation and is simple, should be based on the constituent column.", function () {
                    expect(compactColumns[0].sortable).toBe(true);
                    expect(compactColumns[0]._sortColumns.length).toBe(1);
                    expect(compactColumns[0]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['id']);
                });

                it("when key doesn't have `column_order` annotation and is not simple, should return false.", function () {
                    expect(compactBriefRef.columns[0].sortable).toBe(false);
                    expect(compactBriefRef.columns[0]._sortColumns.length).toBe(0);
                });
            });

            describe('for other columns, ', function () {
                it('when `column_order:false` annotation is defined in column, should return false.', function () {
                    // col_3
                    expect(compactColumns[5].sortable).toBe(false);
                    expect(compactColumns[5]._sortColumns.length).toBe(0);
                });

                it("when column has a `column_order` annotation with value other than false, should return ture and use those columns for sort.", function () {
                    // col_4
                    expect(compactColumns[6].sortable).toBe(true);
                    expect(compactColumns[6]._sortColumns.length).toBe(1);
                    expect(compactColumns[6]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['columns_schema_outbound_fk_7']);
                });
                
                it ("if column defined in `column_order` is json or jsonb, should ignore those.", function () {
                    expect(diffColTypeColumns[0].sortable).toBe(true, "sortable missmatch.");
                    expect(compactColumns[0]._sortColumns.length).toBe(1, "sort column length missmatch.");
                    expect(compactColumns[0]._sortColumns[0].name).toBe("id", "sort column name missmatch.");
                });

                it("when column doesn't have `column_order ` annotation, should return true and use the presented column for sort.", function () {
                    // columns_schema_outbound_fk_7
                    expect(compactColumns[10].sortable).toBe(true);
                    expect(compactColumns[10]._sortColumns.length).toBe(1);
                    expect(compactColumns[10]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['columns_schema_outbound_fk_7']);
                });
                
                it ("when column doesn't have `column_order ` annotation, should return false if it's json or jsonb.", function () {
                    expect(diffColTypeColumns[8].sortable).toBe(false, "sortable missmatch, index=8.");
                    expect(diffColTypeColumns[8]._sortColumns.length).toBe(0, "sort column length missmatch, index=8.");
                    expect(diffColTypeColumns[9].sortable).toBe(false, "sortable missmatch, index=9.");
                    expect(diffColTypeColumns[9]._sortColumns.length).toBe(0, "sort column length missmatch, index=9.");
                });
            });
        });

        describe('Asset related properties, ', function () {

            describe('.urlPattern', function() {
                it('otherwise should return the defined url_pattern in annotation.', function () {
                    expect(assetRefCompactCols[9].urlPattern).toBe("/hatrac/{{col_asset_2}}");
                    expect(assetRefCompactCols[10].urlPattern).toBe("/hatrac/{{col_asset_3}}");
                });
            });

            describe('.filenameColumn', function() {

                it('should return null if column is not valid or not present.', function () {
                    expect(assetRefCompactCols[9].filenameColumn).toBe(null);
                });

                it('otherwise should return the column.', function () {
                    expect(assetRefCompactCols[10].filenameColumn.name).toBe("col_filename");
                });
            });

            describe('.byteCountColumn', function() {
                it('should return null if column is not valid or not present.', function () {
                    expect(assetRefCompactCols[9].byteCountColumn).toBe(null);
                });

                it('otherwise should return the column.', function () {
                    expect(assetRefCompactCols[10].byteCountColumn.name).toBe("col_byte");
                });
            });

            describe('.md5', function() {
                it('should return the md5 defined.', function () {
                    expect(assetRefCompactCols[9].md5).toBe(true);
                    expect(assetRefCompactCols[10].md5.name).toBe("col_md5");
                });
            });

            describe('.sha256', function() {
                it('should return the sha256 defined.', function () {
                    expect(assetRefCompactCols[9].sha256).toBe(true);
                    expect(assetRefCompactCols[10].sha256.name).toBe("col_sha256");
                });
            });

            describe('.filenameExtFilter', function() {
                it('should return null if file_name_ext is not present.', function () {
                    expect(assetRefCompactCols[9].filenameExtFilter).toBe(null);
                });

                it('otherwise should return the defined array of file name extensions.', function () {
                    expect(assetRefCompactCols[10].filenameExtFilter).toEqual(["*.jpg"]);
                });
            });
        })

        describe("Inbound Foreign key related properties, ", function () {
            it('.reference should return the related reference.', function () {
                expect(detailedColumns[3].reference).toBeDefined("reference was not defined.");
                var relatedURI = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
                relatedURI += "/id=1/(id)=(columns_schema:inbound_related_to_columns_table_2:id)";
                expect(detailedColumns[3].reference.uri).toEqual(relatedURI);
            });
        });
    });

    function checkDisplayname(displayname, expectedVal, expectedHTML) {
        expect(displayname.value).toBe(expectedVal);
        expect(displayname.isHTML).toBe(expectedHTML);
    }
}
