exports.execute = function (options) {
    describe('ReferenceColumn, ', function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table_outbound_fks", // the structure of this table is explained in outbound_fks test suit
            entityId = 1,
            limit = 1,
            entryContext = "entry",
            createContext = "entry/create",
            editContext = "entry/edit",
            detailedContext = "detailed";

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/id=" + entityId;

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

        var reference, detailedRef, entryRef, entryCreateRef, entryEditRef, compactSelectRef, compactBriefRef, detailedColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {
                reference = response;

                detailedRef = response.contextualize.detailed;

                entryRef = response.contextualize.entry;
                entryCreateRef = response.contextualize.entryCreate;
                entryEditRef = response.contextualize.entryEdit;

                detailedColumns = detailedRef.columns;

                compactSelectRef = response.contextualize.compactSelect;
                compactBriefRef = response.contextualize.compactBrief;

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe('.isPseudo', function () {
            it('for pseudoColumns, should return true.', function () {
                for (var i = 1; i < 5; i++) {
                    expect(detailedColumns[i].isPseudo).toBe(true);
                }
                for (var i = 11; i < 16; i++) {
                    expect(detailedColumns[i].isPseudo).toBe(true);
                }
            });

            it('for other columns, should return false.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(detailedColumns[i].isPseudo).toBe(false);
                }
            });
        });

        describe('.type, ', function () {
            it('for pseudoColumns, should return markdown.', function () {
                for (var i = 1; i < 5; i++) {
                    expect(detailedColumns[i].type.name).toBe("markdown");
                }
                for (var i = 11; i < 16; i++) {
                    expect(detailedColumns[i].type.name).toBe("markdown");
                }
            });

            it('for other columns, should return their underlying column\'s type.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(detailedColumns[i].type.name).toBe("text");
                }
            });
        });

        describe('.table, ', function () {
            it('for pseudoColumns, should return the foreignkey key table.', function () {
                for (var i = 1; i < 4; i++) {
                    expect(detailedColumns[i].table.name).toBe("reference_table");
                }
                expect(detailedColumns[4].table.name).toBe("reference_values");
                expect(detailedColumns[11].table.name).toBe("table_w_composite_key");
                expect(detailedColumns[12].table.name).toBe("table_w_composite_key_2");
                expect(detailedColumns[13].table.name).toBe("table_w_composite_key");
                expect(detailedColumns[14].table.name).toBe("table_w_composite_key");
                expect(detailedColumns[15].table.name).toBe("table_w_composite_key");
            });

            it('for other columns, should return the underlying column\'s table.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(detailedColumns[i].table.name).toBe(tableName);
                }
            });

        });

        describe('.reference, ', function () {
            it('for pseudoColumns, should return the correct reference.', function () {
                for (var i = 1; i < 4; i++) {
                    expect(detailedColumns[i].reference._table.name).toBe("reference_table");
                }
                expect(detailedColumns[4].reference._table.name).toBe("reference_values");
                expect(detailedColumns[11].reference._table.name).toBe("table_w_composite_key");
                expect(detailedColumns[12].reference._table.name).toBe("table_w_composite_key_2");
                expect(detailedColumns[13].reference._table.name).toBe("table_w_composite_key");
                expect(detailedColumns[14].reference._table.name).toBe("table_w_composite_key");
                expect(detailedColumns[15].reference._table.name).toBe("table_w_composite_key");
            });

            it('for other columns, should be undefined.', function () {
                for (var i = 5; i < 11; i++) {
                    expect(detailedColumns[i].reference).toBeUndefined();
                }
            });

        });

        describe('.displayname, ', function () {
            describe('for pseudoColumns, ', function () {
                it('should use the foreignKey\'s to_name.', function () {
                    expect(detailedColumns[1].displayname).toBe("to_name_value");
                    expect(detailedColumns[11].displayname).toBe("to_name_value");
                });

                describe('when foreignKey\'s to_name is not defined, ', function () {
                    describe('for simple foreign keys, ', function () {
                        it('should use column\'s displayname in the absence of to_name in foreignKey.', function () {
                            expect(detailedColumns[2].displayname).toBe("Column 2 Name");
                        });

                        it('should be disambiguated with Table.displayname when there are multiple foreignkeys.', function () {
                            expect(detailedColumns[3].displayname).toBe("Column 3 Name (reference_table)");
                            expect(detailedColumns[4].displayname).toBe("Column 3 Name (reference_values)");
                        });
                    });

                    describe('for composite foreign keys, ', function () {
                        it('should use referenced table\'s displayname in the absence of to_name in foreignKey.', function () {
                            expect(detailedColumns[12].displayname).toBe("table_w_composite_key_2");
                        });

                        it('should be disambiguated with displayname of columns when there are multiple foreignkeys to that table.', function () {
                            expect(detailedColumns[13].displayname).toBe("table_w_composite_key (Column 3 Name, col_5)");
                            expect(detailedColumns[14].displayname).toBe("table_w_composite_key (col_4, col_5)");
                        });
                    })

                });
            });

            it('for other columns, should return the underlying column\'s displayname.', function () {
                expect(detailedColumns[0].displayname).toBe("id");
                expect(detailedColumns[5].displayname).toBe("Column 3 Name");
            });
        });

        describe('.comment', function () {
            describe('for pseudoColumns, ', function () {
                it('when foreign key is simple should use column\'s comment.', function () {
                    expect(detailedColumns[1].comment).toBe("simple fk to reference, col_1");
                });

                it('otherwise should use foreignkey\'s comment.', function () {
                    expect(detailedColumns[11].comment).toBe("composite fk to table_w_composite_key with to_name");
                });
            });

            it('for other columns, should return the underlying column\'s comment.', function () {
                expect(detailedColumns[0].comment).toBe("not part of any FKRs.");
            });
        });

        describe('.formatpresentation, ', function () {
            describe('for pseudoColumns, ', function () {
                var val;
                it('should return the correct link.', function () {
                    val = detailedColumns[14].formatPresentation(data).value;

                    expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=1">' + data.id_1 + ' , ' + data.id_2 + '</a>');
                });

                it('should not add a link when the caption has a link.', function () {
                    val = detailedColumns[12].formatPresentation(data).value;
                    expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/search">' + data.id + '</a>');
                });

                it('should use the key when only the main table entries are available in data.', function () {
                    var partialData = {
                        "id_1": "col_3_data",
                        "id_2": "col_6_data"
                    };
                    var expectetValue = '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key_2/' +
                        'id_1=' + partialData["id_1"] + '&id_2=' + partialData["id_2"] + '">' + partialData["id_1"] + ":" + partialData["id_2"] + '</a>';
                    val = detailedColumns[12].formatPresentation(partialData).value;
                    expect(val).toEqual(expectetValue);
                });

                it('should use the show-nulls annotation, when the data is null.', function () {
                    val = detailedColumns[14].formatPresentation({}, {
                        context: "detailed"
                    }).value;
                    expect(val).toBe(null);
                    val = entryRef.columns[10].formatPresentation({}).value;
                    expect(val).toBe("");
                });
            });
        });

        describe('.nullok, ', function () {
            describe('for pseudoColumns, ', function () {
                it('should set to false if any of its columns have nullok=false; otherwise true.', function () {
                    // simple fk, false
                    expect(detailedColumns[3].nullok).toBe(false);

                    // simple fk, true
                    expect(detailedColumns[1].nullok).toBe(true);

                    // composite fk, one if false
                    expect(detailedColumns[11].nullok).toBe(false);

                    // composite fk, all false
                    expect(detailedColumns[12].nullok).toBe(false);

                    // composite fk, all true
                    expect(detailedColumns[14].nullok).toBe(true);
                });
            });
            it('for other columns, it should use the underlying column\'s nullok.', function () {
                expect(detailedColumns[0].nullok).toBe(true);
                expect(detailedColumns[5].nullok).toBe(false);
            });
        });

        describe('.getInputDisabled, ', function () {
            describe('for composite foreignkeys, ', function () {
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
                        expect(entryEditRef.columns[10].inputDisabled).toBe(true);
                    });

                    it('if none of the columns are immutable and all of them are generated, should return true.', function () {
                        expect(entryEditRef.columns[9].inputDisabled).toBe(true);
                    });

                    it('if none of the columns are immutable and at least one of the columns is not generated, should return false.', function () {
                        expect(entryEditRef.columns[8].inputDisabled).toBe(false);
                    });
                });

                it('in other contexts should return true.', function () {
                    expect(compactSelectRef.columns[5].inputDisabled).toBe(true);
                    expect(compactBriefRef.columns[1].inputDisabled).toBe(true);
                });
            });

            it('for simple foreignkeys, should return underlying column\`s result.', function () {
                // has generated in create
                expect(entryCreateRef.columns[0].inputDisabled).toEqual({
                    message: "Automatically generated"
                });

                // has immutable in edit
                expect(entryEditRef.columns[2].inputDisabled).toBe(true);

                // does not have immutable nor generated
                expect(entryEditRef.columns[6].inputDisabled).toBe(false);
            });

            it('for other columns, it should use the underlying column\'s result.', function () {
                // this feature has been tested in depth in column test suit.

                // has immutable in edit
                expect(entryEditRef.columns[5].inputDisabled).toBe(true);
            });
        });

        describe('.sortable and ._sortColumns, ', function () {
            describe('for pseudoColumns, ', function () {
                it('when foreignkey has `column_order:false` annotation, should return false.', function () {
                    // outbound_fk_1
                    expect(detailedColumns[1].sortable).toBe(false);
                    expect(detailedColumns[1]._sortColumns.length).toBe(0);
                });
                
                it("when foreignKey has a `column_order` annotation with value other than false, should return true and use those columns for sort.", function () {
                    // outbound_fk_4
                    expect(detailedColumns[4].sortable).toBe(true);
                    expect(detailedColumns[4]._sortColumns.length).toBe(1);
                    expect(detailedColumns[4]._sortColumns[0].name).toBe("name");
                });

                it("when foreignKey doesn't have any `column_order` annotation and referenced table has `row_order`, should use the table's row_order.", function () {
                    //outbound_fk_6
                    expect(detailedColumns[12].sortable).toBe(true);
                    expect(detailedColumns[12]._sortColumns.length).toBe(1);
                    expect(detailedColumns[12]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['id_2']);
                });
                
                it("when foreignKey doesn't have any `column_order` annotation and is simple, should be based on the constituent column.", function () {
                    // outbound_fk_2 -> id
                    expect(detailedColumns[2].sortable).toBe(true);
                    expect(detailedColumns[2]._sortColumns.length).toBe(1);
                    expect(detailedColumns[2]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['id']);
                });
                
                it("when foreign doesn't have `column_order` annotation and is not simple, should return false.", function () {
                    // outbound_fk_7
                    expect(detailedColumns[14].sortable).toBe(false);
                    expect(detailedColumns[14]._sortColumns.length).toBe(0);
                });
                
            });

            describe('for other columns, ', function () {
                it('when `column_order:false` annotation is defined in column, should return false.', function () {
                    // col_3
                    expect(detailedColumns[5].sortable).toBe(false);
                    expect(detailedColumns[5]._sortColumns.length).toBe(0);
                });

                it("when column has a `column_order` annotation with value other than false, should return ture and use those columns for sort.", function () {
                    // col_4
                    expect(detailedColumns[6].sortable).toBe(true);
                    expect(detailedColumns[6]._sortColumns.length).toBe(1);
                    expect(detailedColumns[6]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['reference_schema_outbound_fk_7']);
                });

                it("when column doesn't have `column_order ` annotation, should return true and use the presented column for sort.", function () {
                    // id
                    expect(detailedColumns[0].sortable).toBe(true);
                    expect(detailedColumns[0]._sortColumns.length).toBe(1);
                    expect(detailedColumns[0]._sortColumns.map(function (col) {
                        return col.name
                    })).toEqual(['id']);
                });
            });
        });
        
    });
};