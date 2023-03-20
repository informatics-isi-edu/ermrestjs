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
            tableWSimpleKey = "table_w_simple_key",
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

        var tableWSimpleKeyUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWSimpleKey;

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
            "RID": "RND",
            "id": "1",
            "id_1": "2",
            "id_2": "3"
        };

        // NOTE relies on the heuristics
        // needs to be adjusted if we change the heuristics
        var expectedCompressedDataSources = [
            "id",
            [{"o": ["columns_schema", "outbound_fk_1"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_2"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_3"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_4"]}, "RID"],
            "col_3",
            "col_4",
            "col 5",
            "col_6",
            "col_7",
            "columns_schema_outbound_fk_7",
            "columns_schema_handlebars_col",
            "RID",
            "RCT",
            "RMT",
            "RCB",
            "RMB",
            [{"o": ["columns_schema", "outbound_fk_5"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_6"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_8"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_7"]}, "RID"],
            [{"o": ["columns_schema", "outbound_fk_9"]}, "RID"]
        ];


        var reference, compactRef, entryCreateRef, entryEditRef, compactSelectRef, compactBriefRef, compactColumns;
        var assetRef, assetRefCompactCols, assetRefEntryCols, detailedRef, detailedColumns, diffColTypeColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.setClientConfig({
                internalHosts: [options.catalog.server.host, "dev.isrd.isi.edu"]
            });
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

        // remove the client-config
        afterAll(function () {
            options.ermRest.setClientConfig({});
        });

        describe('.isPseudo, ', function () {
            it('for PseudoColumns should return true.', function () {
                let i;
                for (i = 0; i < 5; i++) {
                    expect(compactColumns[i].isPseudo).toBe(true, "problem with Outbound FKs, index=" + i);
                }
                for (i = 17; i < 22; i++) {
                    expect(compactColumns[i].isPseudo).toBe(true, "problem with Outbound FKs, index=" + i);
                }

                for (i = 9; i < 12; i++) {
                    expect(assetRefCompactCols[i].isPseudo).toBe(true, "problem with Asset index=" + i);
                }

                expect(detailedColumns[3].isPseudo).toBe(true, "problem with Inbound FKs.");

            });

            it('for other columns should return false.', function () {
                for (var i = 5; i < 12; i++) {
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
                for (var i = 1; i < 21; i++) {
                    expect(compactColumns[i].isForeignKey).toBe(true);
                    if (i == 4) i = 10;
                    if (i == 10) i = 17;
                }
            });

            it ('for other columns should return undefined.', function () {
                expect(compactColumns[0].isForeignKey).toBe(undefined);
                for (var i = 5; i < 17; i++) {
                    expect(compactColumns[i].isForeignKey).toBe(undefined);
                }
            });
        });

        describe('.isAsset, ', function () {
            it ('for PseudoColumns that are asset should return true.', function () {
                for (var i = 8; i < 12; i++) {
                    expect(assetRefCompactCols[i].isAsset).toBe(true, "invalid isAsset for index="+ i);
                }

                expect(assetRefCompactCols[14].isAsset).toBe(true, "invalid isAsset for index=14");
            });

            it ('for other columns should return undefined.', function () {
                for (var i = 0; i < 8; i++) {
                    expect(assetRefCompactCols[i].isAsset).toBe(undefined, "invalid isAsset for index="+ i);
                }
            });
        });

        describe('.isInboundForeignKey', function () {``
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
                expect(compactColumns[17].table.name).toBe("table_w_composite_key");
                expect(compactColumns[18].table.name).toBe("table_w_composite_key_2");
                expect(compactColumns[19].table.name).toBe("table_w_composite_key");
                expect(compactColumns[20].table.name).toBe("table_w_composite_key");
                expect(compactColumns[21].table.name).toBe("table_w_composite_key");
            });

            it('for pseudoColumns that are inbound foreign key, should return the foreign key table.', function () {
                expect(detailedColumns[3].table.name).toEqual("inbound_related_to_columns_table_2");
            });

            it('for other columns should return the base column\'s table.', function () {
                for (var i = 5; i < 12; i++) {
                    expect(compactColumns[i].table.name).toBe(tableName);
                }

                for (var i = 8; i < 12; i++) {
                    expect(assetRefCompactCols[i].table.name).toBe(tableWithAsset);
                }
            });
        });


        describe("compressedDataSource, ", function () {
            it ("should return the correct value for all the different column types.", function () {
                compactColumns.forEach(function (col, index) {
                    expect(col.compressedDataSource).toEqual(expectedCompressedDataSources[index], "missmatch for index=" + index);
                });
            });
        })

        describe('.name, ', function () {
            it('for pseudoColumns, should return a unique and deterministic string.', function () {
                //ref_table_outbound_fks_key
                expect(compactColumns[0].name).toBe("l-7AKq6z2IDzE63S0vQNPg", "name missmatch for compact, index=0");
                //outbound_fk_8
                expect(compactColumns[19].name).toBe("Q5M6jdxFlTp2p682Kn-2UQ", "name missmatch for compact, index=13");
                //inbound_related_to_columns_table_2_fkey
                expect(detailedColumns[3].name).toBe("tKEjVbHI9RPuBFya-7_j6Q", "name missmatch for detailed, index=3");
                //outbound_fk_7
                expect(compactColumns[20].name).toBe("kAAK8J6ar0hTrADb36nOIw", "name missmatch for compact, index=14");
            });

            it('for other columns should return the base column\'s name.', function () {
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

                        it('should be disambiguated with Table.displayname when there are multiple simple foreignkeys.', function () {
                            checkDisplayname(compactColumns[3].displayname, "table_w_simple_key (Column 3 Name)", false);
                            checkDisplayname(compactColumns[4].displayname, "table_w_simple_key_2 (Column 3 Name)", false);
                        });

                        it ("should not add table name if the other foreignKey is composite.", function (done) {
                            options.ermRest.resolve(tableWSimpleKeyUri,  {cid: "test"}).then(function (response) {
                                var ref = response.contextualize.compactBrief;
                                checkDisplayname(ref.columns[0].displayname, "fk_col_1", false);
                                done();
                            }).catch(function (err) {
                                done.fail(err);
                            });
                        });
                    });

                    describe('for composite foreign keys, ', function () {
                        it('should use referenced table\'s displayname in the absence of to_name in foreignKey.', function () {
                            checkDisplayname(compactColumns[18].displayname, "table_w_composite_key_2", false);
                        });

                        it('should be disambiguated with displayname of columns when there are multiple foreignkeys to that table.', function () {
                            checkDisplayname(compactColumns[19].displayname, "table_w_composite_key (col 5, Column 3 Name)", false);
                            checkDisplayname(compactColumns[20].displayname, "table_w_composite_key (col 5, col_4)", false);
                        });
                    });

                });
            });

            describe('for pseudoColumns that are key, ', function() {
                it('should use `markdown_name` that is defined on display annotation.', function () {
                    checkDisplayname(compactBriefRef.columns[2].displayname, "<strong>fourth key</strong>", true);
                });

                it('should use `markdown_name` that is defined on display annotation.', function () {
                    checkDisplayname(compactBriefRef.columns[3].displayname, "<strong>fifth key</strong>", true);
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
                for (var i = 17; i < 22; i++) {
                    expect(compactColumns[i].type.name).toBe("markdown");
                }
                for (var i = 9; i < 12; i++) {
                    expect(assetRefCompactCols[i].type.name).toBe('markdown');
                }

                expect(detailedColumns[3].type.name).toBe("markdown");
            });

            it('for other columns should return the base column\'s type.', function () {
                for (var i = 5; i < 12; i++) {
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
                    expect(compactColumns[12].nullok).toBe(false);
                    // composite fk, all false
                    expect(compactColumns[13].nullok).toBe(false);
                    // simple key
                    expect(compactColumns[0].nullok).toBe(false);
                });

                it('otherwise should return true.', function () {
                    // simple fk
                    expect(compactColumns[2].nullok).toBe(true);
                    // composite fk, all true
                    expect(compactColumns[15].nullok).toBe(true);
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
                    expect(compactColumns[21].default).toBe(null);
                });

                it ('should return a rowname with correct context if it is possible to generate one with default values.', function () {
                    expect(compactColumns[20].default).toEqual('col 4 default , col 5 default');
                });

                it ('should return a rowname using only the consitutent column values if rowname heuristics returned an empty string.', function () {
                    expect(compactColumns[18].default).toEqual('col 3 default:col 6 default');
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
                    expect(compactColumns[17].comment).toBe("composite fk to table_w_composite_key with to_name");
                });
            });

            it('for other columns should return the base column\'s comment.', function () {
                expect(compactColumns[10].comment).toBe("not part of any FKRs.");
            });
        });

        describe('.hideColumnHeader, ', function() {
            it('should return true if hideColumnHeader set to true in column-display annotation', function() {
                // "id" column has column-display annotation
                expect(detailedColumns[0].hideColumnHeader).toBeTruthy();
            });

            it('should return false if property is not defined in column-display annotation', function() {
                expect(detailedColumns[1].hideColumnHeader).toBeFalsy();
            });
        });

        describe('.inputDisabled, ', function () {
            describe('for pseudoColumns, ', function () {
                it('that are inbound foreignkey should return an error.', function () {
                    expect(function () {
                        let inputDisabled = detailedColumns[3].inputDisabled;
                    }).toThrow("can not use this type of column in entry mode.");
                });

                describe("for assets,", function () {
                    it ("if url_pattern is invalid, return true.", function () {
                        expect(assetRefEntryCols[4].isAsset).toBe(true, "isAsset invalid");
                        expect(assetRefEntryCols[4].inputDisabled).toBe(true, "inputDisabled invalid");
                    });

                    it ("otherwise return the base column's result.", function () {
                        expect(assetRefEntryCols[5].inputDisabled).toBe(true, "input disabled invalid for col_asset_2");
                        expect(assetRefEntryCols[6].inputDisabled).toBe(false, "input disabled invalid for col_asset_3");
                    });
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

            describe('for normal columns', function () {
                it ("should return true if annotation is defined.", function () {
                    // it's generated so it should return true in edit mode
                    expect(entryEditRef.columns[1].inputDisabled).toBe(true);
                });

                it ("should ignore generated when immutable is `false`", function () {
                    expect(entryEditRef.columns[0].inputDisabled).toBe(false);
                });

                it ("otherwise should return false", function () {
                    expect(entryEditRef.columns[2].inputDisabled).toBe(false);
                });
            });
        });

        describe('.filteredRef and .hasDomainFilter, ', function() {
            var mainEntityReference, mainEntityColumns, filteredReference, mainEntityData, foreignKeyData,
                mainEntityTableName = "main-entity-table",
                schemaUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":";
                mainEntityUri = schemaUri  + mainEntityTableName;

            var testFilteredRef = function (ref, tableName, ermrestPath, displayname) {
                expect(ref.table.name).toBe(tableName, "table name missmatch");

                if (ermrestPath == "" || ermrestPath == null) {
                    expect(ref.uri).toBe(schemaUri + tableName, "uri missmatch.");
                } else {
                    expect(ref.location.filter).not.toBeTruthy("fitler defined.");
                    expect(ref.location.customFacets).toBeTruthy("custom facet undefiend");
                    expect(ref.location.customFacets.ermrestPath).toBe(ermrestPath, "ermrestPath missmatch");
                    if (displayname) {
                        expect(ref.location.customFacets.displayname.value).toEqual(displayname, "displayname missmatch");
                    } else {
                        expect(ref.location.customFacets.displayname).not.toBeDefined("displayname missmatch");
                    }
                    expect(ref.location.customFacets.removable).toEqual(false, "removable missmatch");
                }

            };

            describe('for pseudoColumns, ', function() {
                describe('for foreign keys, ', function() {

                    beforeAll(function(done) {
                        options.ermRest.resolve(mainEntityUri, {
                            cid: "test"
                        }).then(function (response) {
                            mainEntityReference = response;

                            // mainEntityColumns[i] where:
                            // 1=0 - id for table
                            // i=1 - foreign key to no constraint table this constrains the following col (fk_no_constraint)
                            // i=2 - foreign key to constrained table with domain filter defined with a dynamic value (fk_constrained)
                            // i=3 - foreign key to position table with domain filter defined with a static value (fk_position_predefined)
                            // i=4 - text column that constrains the following fk (position_text_col)
                            // i=5 - foreign key to position table with domain filter defined with dynamic value (fk_position_user_defined)
                            // i=6 - foreign key to constrained table with domain filter with a conjunction of 2 dynamic values (fk_multi_constrained)
                            // i=7 - foreign key to position table with (fk_using_fkeys)
                            mainEntityColumns = response.columns;

                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });
                    });

                    it ('hasDomainFilter should return the proper values.', () => {
                        expect(mainEntityColumns.map(function (col) {
                            return !!col.hasDomainFilter;
                        })).toEqual(jasmine.arrayContaining([false, false, true, true, false, true, true, true]), "fkeys elements missmatch.");
                    });

                    describe('should return a filtered reference based on provided data.', function () {
                        it('Reference for mainEntityColumns[3], should have proper domain filter.', function() {
                            mainEntityData = {}
                            filteredReference = mainEntityColumns[3].filteredRef(mainEntityData);

                            // doesn't have displayname and therefore should be hidden
                            testFilteredRef(filteredReference, "position-type-table", "position_type_col=fixed");
                        });

                        it('Reference for mainEntityColumns[5], should have proper domain filter.', function() {
                            mainEntityData = {"position_text_col": "relative"};
                            filteredReference = mainEntityColumns[5].filteredRef(mainEntityData);

                            testFilteredRef(
                                filteredReference,
                                "position-type-table",
                                "position_type_col=" + mainEntityData.position_text_col,
                                 "<strong>position_type_col</strong>: " + mainEntityData.position_text_col
                             );
                        });

                        it('Reference for mainEntityColumns[2], should have proper domain filter.', function() {
                            mainEntityData = {"fk1": 1234};
                            filteredReference = mainEntityColumns[2].filteredRef(mainEntityData);

                            // using the old domain_filter_pattern syntax
                            testFilteredRef(filteredReference, "fk-constrained-table", "fk2=" + mainEntityData.fk1);
                        });

                        it('Reference for mainEntityColumns[6], should have proper domain filter.', function() {
                            mainEntityData = {"fk1": 1234, "position_text_col": "relative"};
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            testFilteredRef(
                                filteredReference,
                                "fk-constrained-table",
                                "fk2=" + mainEntityData.fk1 + "&position_col=" + mainEntityData.position_text_col,
                                "<strong>fk2</strong>: " + mainEntityData.fk1 + " and <strong>position_col</strong>:" + mainEntityData.position_text_col
                            );
                        });
                    });

                    describe('should return the originating reference if the variable in the domain filter pattern is not present.', function() {
                        it('Reference for mainEntityColumns[5], should have no filter defined.', function() {
                            mainEntityData = {};
                            filteredReference = mainEntityColumns[5].filteredRef(mainEntityData);

                            testFilteredRef(filteredReference, "position-type-table");
                        });

                        it('Reference for mainEntityColumns[2], should have no filter defined.', function() {
                            mainEntityData = {};
                            filteredReference = mainEntityColumns[2].filteredRef(mainEntityData);

                            testFilteredRef(filteredReference, "fk-constrained-table");
                        });

                        it('Reference for mainEntityColumns[6], should have proper domain filter.', function() {
                            mainEntityData = {};
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            testFilteredRef(filteredReference, "fk-constrained-table");

                            // if one value is defined and the other isn't, filter should still be null
                            mainEntityData.fk1 = 1;
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            testFilteredRef(filteredReference, "fk-constrained-table");

                            delete mainEntityData.fk1;
                            mainEntityData.position_text_col = "relative";
                            filteredReference = mainEntityColumns[6].filteredRef(mainEntityData);

                            testFilteredRef(filteredReference, "fk-constrained-table");
                        });
                    });

                    describe("should be able to access other foreignkey data, ", function () {
                        it ("when data is not available should return the unfiltered reference.", function () {
                            mainEntityData = {"fk1": 1234};
                            filteredReference = mainEntityColumns[7].filteredRef(mainEntityData);

                            testFilteredRef(filteredReference, "fk-constrained-table");
                        });

                        it("otherwise should use the provided data.", function () {
                            mainEntityData = {"fk1": 1234};

                            // [columns_schema, fk_position_predefined]: KPc9qmb9G8DAyIxeQVpMjg
                            // [columns_schema, fk_position_user_defined]: stTmPlpgbtPMZ8QZFAhvwg
                            foreignKeyData = {
                                "KPc9qmb9G8DAyIxeQVpMjg": {
                                    "int_value": 4321,
                                    "id": 1
                                },
                                "stTmPlpgbtPMZ8QZFAhvwg": {
                                    "int_value": 1235,
                                    "id": 2
                                }
                            };
                            filteredReference = mainEntityColumns[7].filteredRef(mainEntityData, foreignKeyData);

                            testFilteredRef(
                                filteredReference,
                                "fk-constrained-table",
                                "fk2=4321&position_col=1235&id=1234",
                                "<strong>fk2</strong>: 4321 and <strong>position_col</strong>:1235"
                            );
                        });
                    });
                });
            });
        });

        describe(".getDefaultDisplay", function () {
            var urlPrefix = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":",
                data = {"id": 1, "col_3": "v3", "col_4": "v4", "col 5": "v5", "col_6": "v6"};

            var testDefaultDisplay = function (result, rowname, values, refUri) {
                expect(result.rowname.value).toEqual(rowname, "rowname missmatch.");
                expect(result.values).toEqual(values, "values missmatch.");
                if (refUri == null) {
                    expect(result.reference).toEqual(null, "reference missmatch.");
                } else {
                    expect(result.reference.uri).toEqual(refUri, "reference.uri missmatch.");
                }
            };

            describe("for foreign key pseudo columns, ", function () {
                it ("should return null value if the given values are not sufficient.", function () {
                    testDefaultDisplay(
                        compactColumns[20].getDefaultDisplay({"id": 1}),
                        null, {}, null
                    );
                });

                it ("should return the row-name if data is sufficient.", function () {
                    testDefaultDisplay(
                        compactColumns[20].getDefaultDisplay(data),
                        "v4 , v5",
                        {"id_1": "v4", "id_2": "v5"},
                        urlPrefix + "table_w_composite_key/id_1=v4&id_2=v5"
                    );
                });

                it ("should return a default col1:col2 if data is sufficient for link but not for rowname.", function () {
                    testDefaultDisplay(
                        compactColumns[18].getDefaultDisplay(data),
                        "v3:v6",
                        {"id_1": "v3", "id_2": "v6"},
                        urlPrefix + "table_w_composite_key_2/id_1=v3&id_2=v6"
                    );
                });
            });

            it ("should not be available for other column types.", function () {
                expect(compactColumns[0].getDefaultDisplay).toBe(undefined, "missmatch for index=0");
                for (var i = 5; i < 17; i++) {
                    expect(compactColumns[i].getDefaultDisplay).toBe(undefined, "missmatch for index=" + i);
                }
            });
        });


        describe('.formatPresentation, ', function () {
            var val;
            describe('for pseudoColumns, ', function () {
                describe('for foreign keys, ', function () {
                    // NOTE The show_foreign_key_link are in a separate spec

                    it('should return the correct link.', function () {
                        val = compactColumns[20].formatPresentation(data, 'compact').value;

                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/RID=RND">' + data.id_1 + ' , ' + data.id_2 + '</a>');
                    });

                    it('should not add a link when the caption has a link.', function () {
                        val = compactColumns[18].formatPresentation(data).value;
                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/search">' + data.id + '</a>');
                    });

                    it('should use the key when only the main table entries are available in data.', function () {
                        var partialData = {
                            "id_1": "col_3_data", "id_2": "col_6_data"
                        };
                        var expectetValue = '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key_2/' +
                                            'id_1=' + partialData["id_1"]+ '&id_2='  +partialData["id_2"] + '">' + partialData["id_1"] + ":" + partialData["id_2"] + '</a>';
                        val = compactColumns[18].formatPresentation(partialData).value;
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

                    it('should use `markdown_pattern` from key display annotation with a link.', function () {
                        val = compactBriefRef.columns[1].formatPresentation({"col_1":1, "col_3":2, "col_4":"value"}, "compact/brief", {"col_4":"value"}).value;
                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/col_1=1&col_3=2"><strong>value</strong></a>');
                    });

                    describe('otherwise, ', function () {
                        it ("should use key columns values separated with colon for caption. The URL should refer to the current reference.", function(){
                            val = compactColumns[0].formatPresentation({"id":2}, "detailed", {"id":2}).value;
                            expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/id=2">2</a>');

                            val = compactBriefRef.columns[0].formatPresentation({"col_3":"3", "col_6":"6"}, "compact/brief", {"col_3":"3", "col_6":"6"}).value;
                            expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/col_3=3&col_6=6">3:6</a>');
                        });

                        it('should not add link if the key columns produce a link.', function () {
                            val = compactBriefRef.columns[2].formatPresentation({"columns_schema_outbound_fk_7":"value"}, "compact/brief", {"columns_schema_outbound_fk_7":"value"}).value;
                            expect(val).toEqual('<p><a href="http://example.com" class="external-link-icon external-link">value</a></p>\n');
                        })
                    });
                });

                describe('for assets, ', function() {
                    it('if in entry context, return the original underlying data, even if colummn-display annotation is present.', function() {
                        val = assetRefEntryCols[6].formatPresentation({"col_asset_3": "https://example.com"}, "entry", {"col_asset_3": "https://example.com"}).value;
                        expect(val).toEqual("https://example.com");

                        val = assetRefCompactCols[9].formatPresentation({"col_filename": "filename", "col_asset_2": "value"}, "entry", {"col_filename": "filename"}).value;
                        expect(val).toEqual("value");
                    });

                    it('otherwise, if coulmn has column-display annotation, use it.', function () {
                        val = assetRefCompactCols[9].formatPresentation({"col_filename": "filename", "col_asset_2": "value"}, "compact", {"col_filename": "filename"}).value;
                        expect(val).toEqual("<h2>filename</h2>\n");
                    });

                    describe('otherwise should create a download link,', () => {
                        it ('filename should be used as caption if it\'s defined and has non-empty value', () => {
                            val = assetRefCompactCols[10].formatPresentation({"col_asset_3": "https://example.com", "col_filename": "filename"}).value;
                            expect(val).toEqual('<a href="https://example.com" download="" class="external-link-icon external-link">filename</a>', "value missmatch.");

                            val = assetRefCompactCols[10].formatPresentation({"col_asset_3": "https://example.com?query=1&v=1", "col_filename": "filename"}).value;
                            //NOTE this is the output but it will be displayed correctly.
                            expect(val).toEqual('<a href="https://example.com?query=1&amp;v=1" download="" class="external-link-icon external-link">filename</a>', "couldn't handle having query params in the url.");
                        });

                        it ("if url matches the expected hatrac format, extract the filename and use it as caption.", function () {
                            var hatracSampleURL = "/hatrac/Zf/ZfDsy20170915D/file-test.csv:2J7IIX63WQRUDIALUGYDKDO36A";
                            var expectedValue = '<a href="' + hatracSampleURL +'?uinit=1&amp;cid=test" download="" class="asset-permission">file-test.csv</a>';
                            val = assetRefCompactCols[8].formatPresentation({"col_asset_1": hatracSampleURL}).value;
                            expect(val).toEqual(expectedValue, "value missmatch.");

                            // has filenameColumn but its value is null
                            val = assetRefCompactCols[10].formatPresentation({"col_asset_3": hatracSampleURL, "col_filename": null}).value;
                            expect(val).toEqual(expectedValue, "value missmatch.");
                        });

                        it ("if context is detailed and url is absolute, use last part of url as caption and add origin beside the button.", function () {
                            var url = "http://example.com/folder/next/folder/image.png";
                            val = assetRefCompactCols[8].formatPresentation({"col_asset_1": url}, "detailed").value;
                            expect(val).toEqual('<a href="' + url +'" download="" class="external-link-icon external-link">image.png</a><span class="asset-source-description">(source: example.com)</span>', "value missmatch for detailed");
                        });

                        it ("otherwise, use the last part of url for caption without any origin information.", function () {
                            // has filenameColumn but its value is null
                            val = assetRefCompactCols[10].formatPresentation({"col_asset_3": "https://example.com/asset.png", "col_filename": null}).value;
                            expect(val).toEqual('<a href="https://example.com/asset.png" download="" class="external-link-icon external-link">asset.png</a>', "value missmatch.");

                            var url = "http://example.com/folder/next/folder/image.png";
                            val = assetRefCompactCols[8].formatPresentation({"col_asset_1": url}, "compact").value;
                            expect(val).toEqual('<a href="' + url +'" download="" class="external-link-icon external-link">image.png</a>', "value missmatch for compact");

                            val = assetRefCompactCols[8].formatPresentation({"col_asset_1": url}, "compact/brief").value;
                            expect(val).toEqual('<a href="' + url +'" download="" class="external-link-icon external-link">image.png</a>', "value missmatch for compact/brief");

                            // detailed but relative url
                            val = assetRefCompactCols[8].formatPresentation({"col_asset_1": "go/to/file.png"}, "detailed").value;
                            expect(val).toEqual('<a href="go/to/file.png?uinit=1&amp;cid=test" download="" class="asset-permission">file.png</a>', "value missmatch for detailed context");
                        })
                    });

                 });

                it('should use the show-nulls annotation, when the data is null.', function () {
                    val = compactColumns[20].formatPresentation({}, "detailed").value;
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
                    expect(compactColumns[4]._sortColumns[0].column.name).toBe("name");
                });

                it("when foreignKey doesn't have any `column_order` annotation and referenced table has `row_order`, should use the table's row_order.", function () {
                    //outbound_fk_6
                    expect(compactColumns[18].sortable).toBe(true);
                    expect(compactColumns[18]._sortColumns.length).toBe(1);
                    expect(compactColumns[18]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['id_2']);
                });

                it("when foreignKey doesn't have any `column_order` annotation and is simple, should be based on the constituent column.", function () {
                    // outbound_fk_2 -> id
                    expect(compactColumns[2].sortable).toBe(true);
                    expect(compactColumns[2]._sortColumns.length).toBe(1);
                    expect(compactColumns[2]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['id']);
                });

                describe("when foreign key is not simple, ", function () {
                    it ("and doesn't have `foreign key` annotation (therefore no `column_order` annotation), should return false.", function () {
                        // outbound_fk_7
                        expect(compactColumns[20].sortable).toBe(false);
                        expect(compactColumns[20]._sortColumns.length).toBe(0);
                    });

                    it ('and has `foreign key` annotation but no `display` (and therefore no `column_order` annotation), should return false.', function () {
                        // outbound_fk_8
                        expect(compactColumns[19].sortable).toBe(false);
                        expect(compactColumns[19]._sortColumns.length).toBe(0);
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
                        return col.column.name
                    })).toEqual(['col_1', 'col_2']);
                });

                it("when key doesn't have any `column_order` annotation and is simple, should be based on the constituent column.", function () {
                    expect(compactColumns[0].sortable).toBe(true);
                    expect(compactColumns[0]._sortColumns.length).toBe(1);
                    expect(compactColumns[0]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['id']);
                });

                it("when key doesn't have `column_order` annotation and is not simple, should return false.", function () {
                    expect(compactBriefRef.columns[0].sortable).toBe(false);
                    expect(compactBriefRef.columns[0]._sortColumns.length).toBe(0);
                });
            });

            describe("for assets, ", function () {
                it ("should return the defined column_order on the column.", function () {
                    expect(assetRefCompactCols[9].sortable).toBe(true, "sortable missmatch, index=9.");
                    expect(assetRefCompactCols[9]._sortColumns.length).toBe(2, "sort column length missmatch, index=9.");
                    expect(assetRefCompactCols[9]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['col_asset_2', 'col_filename'], "sort columns missmatch, index=9.");
                });

                it ("otherwise if filename column is defined should return it", function () {
                    expect(assetRefCompactCols[10].sortable).toBe(true, "sortable missmatch, index=10.");
                    expect(assetRefCompactCols[10]._sortColumns.length).toBe(1, "sort column length missmatch, index=10.");
                    expect(assetRefCompactCols[10]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['col_filename'], "sort columns missmatch, index=10.");

                    expect(assetRefCompactCols[11].sortable).toBe(true, "sortable missmatch, index=11.");
                    expect(assetRefCompactCols[11]._sortColumns.length).toBe(1, "sort column length missmatch, index=11.");
                    expect(assetRefCompactCols[11]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['col_asset_4_filename'], "sort columns missmatch, index=11.");
                });

                it ("otherwise should return the url column.", function () {
                    expect(assetRefCompactCols[8].sortable).toBe(true, "sortable missmatch, index=8.");
                    expect(assetRefCompactCols[8]._sortColumns.length).toBe(1, "sort column length missmatch, index=8.");
                    expect(assetRefCompactCols[8]._sortColumns.map(function (col) {
                        return col.column.name
                    })).toEqual(['col_asset_1'], "sort columns missmatch, index=8.");
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
                        return col.column.name
                    })).toEqual(['columns_schema_outbound_fk_7']);
                });

                it ("if column defined in `column_order` is json or jsonb, should ignore those.", function () {
                    expect(diffColTypeColumns[0].sortable).toBe(true, "sortable missmatch.");
                    expect(compactColumns[0]._sortColumns.length).toBe(1, "sort column length missmatch.");
                    expect(compactColumns[0]._sortColumns[0].column.name).toBe("id", "sort column name missmatch.");
                });

                it("when column doesn't have `column_order ` annotation, should return true and use the presented column for sort.", function () {
                    // columns_schema_outbound_fk_7
                    expect(compactColumns[10].sortable).toBe(true);
                    expect(compactColumns[10]._sortColumns.length).toBe(1);
                    expect(compactColumns[10]._sortColumns.map(function (col) {
                        return col.column.name
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

            describe(".templateEngine", function () {
                it ("should return the defined template_engine", function () {
                    expect(assetRefCompactCols[9].templateEngine).toBe("", "missmatch for index=9");
                    expect(assetRefCompactCols[10].templateEngine).toBe("handlebars", "missmatch for index=10");
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
                it('should return empty array if file_name_ext is not present.', function () {
                    expect(assetRefCompactCols[9].filenameExtFilter.length).toBe(0, "Returned value is not an empty array");
                });

                it('otherwise should return the defined array of file name extensions.', function () {
                    expect(assetRefCompactCols[10].filenameExtFilter).toEqual(["*.jpg"]);
                });
            });

            describe('.filenameExtRegexp', function() {
                it('should return empty array if file_name_ext is not present.', function () {
                    expect(assetRefCompactCols[9].filenameExtFilter.length).toBe(0, "Returned value is not an empty array");
                });

                it('otherwise should return the defined array of file name extensions.', function () {
                    expect(assetRefCompactCols[10].filenameExtRegexp).toEqual([".special.jpg", ".jpg"]);
                });
            });

            describe(".getMetadata", function () {
                var testMetadata = function (col, data, context, message, expectedCaption, expectedHostInformation, expectedSameOrigin, expectedFilename, expectedByte, expectedMd5, expectedSha256) {
                    var m = col.getMetadata(data, context);
                    if (expectedCaption != null) {
                        expect(m.caption).toBe(expectedCaption, "caption missmatch for " + message);
                    }

                    if (expectedFilename != null) {
                        expect(m.filename).toBe(expectedFilename, "filename missmatch for " + message);
                    }

                    if (expectedByte != null) {
                        expect(m.byteCount).toEqual(expectedByte, "byteCount missmatch for " + message);
                    }

                    if (expectedMd5 != null) {
                        expect(m.md5).toBe(expectedMd5, "md5 missmatch for " + message);
                    }

                    if (expectedSha256 != null) {
                        expect(m.sha256).toBe(expectedSha256, "sha256 missmatch for " + message);
                    }

                    if (expectedHostInformation != null) {
                        expect(m.hostInformation).toBe(expectedHostInformation, "origin missmatch for " + message);
                    }

                    if (expectedSameOrigin != null) {
                        expect(m.sameHost).toBe(expectedSameOrigin, "origin missmatch for " + message);
                    }
                };

                var assetMetadataTestData = {
                    col_asset_3: "/hatrac/testurl",
                    col_filename: "filenamevalue.png",
                    col_byte: 12400000,
                    col_md5: "md5value",
                    col_sha256: "sha256value"
                };

                it ("should return empty values if the asset is null.", function () {
                    testMetadata(assetRefCompactCols[9], {}, null, "empty asset index=9.", "", "", false, "", "", "", "");

                    testMetadata(assetRefCompactCols[10], {}, null, "empty asset index=10.", "", "", false, "", "", "", "");
                });

                describe("regarding byteCount, md5, sha256.", function () {
                    it ("if annotation has metadata columns, should return their values.", function () {
                        testMetadata(assetRefCompactCols[10], assetMetadataTestData, null, "empty asset index=10.", null, null, null, "filenamevalue.png",12400000, "md5value", "sha256value");
                    });

                    it ("otherwise should return empty string.", function () {
                        testMetadata(assetRefCompactCols[9], {"col_asset_2": "/hatrac/testurl"}, null, "empty asset index=10.", null, null, null, "", "", "", "");
                    });
                });

                describe("regarding caption, hostInformation, and sameHost ", function () {
                    it ("if asset column has filename column and its value is not empty, should return it as caption. hostInformation should be empty. sameHost should be false.", function () {
                        testMetadata(assetRefCompactCols[10], assetMetadataTestData, null, "asset with filename value", "filenamevalue.png", "", true);
                    });

                    it ("otherwise, if the url value matches the format, should extract the filename. hostInformation should be empty. sameHost should be true.", function () {
                        testMetadata(assetRefCompactCols[8], {col_asset_1: "/hatrac/Zf/ZfDsy20170915D/file-test.csv:2J7IIX63WQRUDIALUGYDKDO36A"}, null, "hatrac file", "file-test.csv", "", true);
                    });

                    it ("otherwise, should return the last part of url. hostInformation in detailed if url is absolute should be valid.", function () {
                        testMetadata(assetRefCompactCols[8], {col_asset_1: "http://example.com/folder/next/folder/image.png"}, "compact", "non-hatrac compact file", "image.png", "", false);

                        testMetadata(assetRefEntryCols[4], {col_asset_1: "http://example.com/folder/next/folder/image.png"}, "detailed", "non-hatrac entry file", "image.png", "example.com", false);

                        testMetadata(assetRefEntryCols[4], {col_asset_1: "next/folder/image.png"}, "non-hatrac entry file", "detailed", "image.png", "", true);
                    });

                    it("if url is absolute and from the same origin, host information should not be returned.", function () {
                        testMetadata(assetRefEntryCols[4], {col_asset_1: options.url + "/folder/next/folder/image.png"}, "detailed", "absolute, same host, non-hatrac entry file", "image.png", null, true);
                    });

                    it("if url is absolute and NOT from the same origin, and hatrac is in the path, host information should be returned.", function () {
                        testMetadata(assetRefEntryCols[4], {col_asset_1: "http://example.com/hatrac/next/folder/image.png"}, "detailed", "absolute, different host, hatrac name included in entry file", "image.png", "example.com", false);
                    });
                });
            });

            describe ('.displayImagePreview', function () {
                it ('should return true if its defined for the context', function () {
                    expect(assetRefEntryCols[9].displayImagePreview).toBe(true);
                });

                it ('otherwise should return false.', function () {
                    for (var i = 8; i < 12; i++) {
                        expect(assetRefCompactCols[i].displayImagePreview).toBe(false, "invalid isAsset for index="+ i);
                    }

                    expect(assetRefCompactCols[14].displayImagePreview).toBe(false, "invalid isAsset for index=14");
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
