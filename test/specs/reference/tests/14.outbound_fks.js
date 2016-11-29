exports.execute = function (options) {
    describe('In case of outbound foreign keys, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table_outbound_fks",
            entityId = 1,
            limit = 1,
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

        var detailedRefExpectedValue = [
            '1',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000">Hank</a>',
            null,
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=4000">John</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_values/id=4000">Hank</a>',
            '4000',
            '4001',
            '4002',
            '4003',
            null,
            '12',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=1">4000 , 4001</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=2">4000 , 4002</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=4">4001 , 4002</a>',
            null
        ];

        var entryEditRefExpectedValue = [
            '1',
            'Hank',
            '',
            'John',
            'Hank',
            '12',
            '4000 , 4001',
            '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
            '4000 , 4002',
            '4001 , 4002',
            ''
        ];

        /**
         * This is the structure of the used table:
         * reference_table_outbound_fks:
         * columns:
         *  id -> single key, not part of any fk
         *  col_1 -> has generated annotation
         *  col_2 -> has displayname (value is null) | has immutable annotation
         *  col_3 -> has displayname (nullok is false)
         *  col_4 -> has generated annotation
         *  col_5 -> has generated annotation
         *  col_6 -> nullok false
         *  col_7 -> value is null | has generated and immutable annotation
         *  reference_schema:outbound_fk_7 -> not part of any fk
         * 
         * FKRs:
         *  outbound_fk_1: col_1 -> ref_table (to_name)
         *  outbound_fk_2: col_2 -> ref_table
         *  outbound_fk_3: col_3 -> ref_table 
         *  outbound_fk_4: col_3 -> reference_values
         *  outbound_fk_5: col_3, col_4 -> table_w_composite_key (to_name)
         *  outbound_fk_6: col_3, col_6 -> table_w_composite_key_2
         *  outbound_fk_7: col_4, col_5 -> table_w_composite_key
         *  outbound_fk_8: col_3, col_5 -> table_w_composite_key
         *  outbound_fk_9: col_5, col_7 -> table_w_composite_key -> col_7 is null
         * 
         * expected output for ref.columns in detailed and compact/select context:
         * 0:   id
         * 1:   outbound_fk_1 (check to_name) (check nullok)
         * 2:   outbound_fk_2  -> is null
         * 3:   outbound_fk_3 (check disambiguation) (check nullok)
         * 4:   outbound_fk_4 (check disambiguation)
         * 5:   col_3
         * 6:   col_4
         * 7:   col_5
         * 8:   col_6
         * 9:   col_7
         * 10:  reference_schema:outbound_fk_7
         * 11:  outbound_fk_5 (check to_name) (check nullok)
         * 12:  outbound_fk_6 (check nullok)
         * 13:  outbound_fk_8 (check disambiguation)
         * 14:  outbound_fk_7 (check disambiguation) (check nullok)
         * 15:  outbound_fk_9
         * 
         * expected output for ref.columns in edit or create context:
         * 0:   id
         * 1:   outbound_fk_1
         * 2:   outbound_fk_2
         * 3:   outbound_fk_3
         * 4:   outbound_fk_4
         * 5:   reference_schema:outbound_fk_7
         * 6:   outbound_fk_5
         * 7:   outbound_fk_6 
         * 8:   outbound_fk_8
         * 9:   outbound_fk_7
         * 10:  outbound_fk_9
         * 
         * contexts that are used:
         *  
         *  compact: has visible-columns with duplicate values
         *  compact/brief: has visible-columns with correct values 
         *  compact/select: has all of the columns in visible-columns + has some foreign keys too
         *  detailed: doesn't have visible-columns
         *  entry: doesn't have visible-columns
         *  entry/create: has visible-columns with invalid names
         *  entry/edit: has all of the columns in visible-column + has some foreign keys too
         * 
         */

        var reference, compactRef, compactBriefRef, compactSelectRef, detailedRef, entryRef, entryCreateRef, entryEditRef, detailedColumns, compactSelectColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {
                reference = response;

                compactRef = response.contextualize.compact;
                compactBriefRef = response.contextualize.compactBrief;
                compactSelectRef = response.contextualize.compactSelect;

                detailedRef = response.contextualize.detailed;

                entryRef = response.contextualize.entry;
                entryCreateRef = response.contextualize.entryCreate;
                entryEditRef = response.contextualize.entryEdit;

                detailedColumns = detailedRef.columns;
                compactSelectColumns = compactSelectRef.columns;

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe('.columns, ', function () {
            describe('when visible-columns annotation is present for the context, ', function () {
                it('should not include duplicate columns and FKRs.', function () {
                    checkReferenceColumns([{
                        ref: compactRef,
                        expected: [
                            "id", ["reference_schema", "outbound_fk_1"].join(":")
                        ]
                    }]);
                });
                
                
                it('should just include columns and FKRs that are valid.', function () {
                    checkReferenceColumns([{
                        ref: entryCreateRef,
                        expected: [
                            ["reference_schema", "outbound_fk_1"].join(":"),
                            ["reference_schema", "outbound_fk_9"].join(":"),
                            ["reference_schema", "outbound_fk_8"].join(":"),
                            "id"
                        ]
                    }]);
                });

                it('should just include the column/FKRs mentioned in the annotations.', function () {
                    checkReferenceColumns([{
                        ref: compactBriefRef,
                        expected: [
                            "id", "reference_schema:outbound_fk_7", ["reference_schema", "outbound_fk_1"].join(":")
                        ]
                    }]);
                });
                
                describe('if some columns are part of any foreign keys, ', function () {
                    checkAllPseudoColumns(true);
                });
                
            });


            describe('when visible-columns annotation is not present for the context, ', function () {
                checkAllPseudoColumns(false);
            });
            
            describe('PseudoColumn, ', function () {
                it('should have the same functions as Column.', function () {
                    for (var i = 1; i < 5; i++) {
                        expect(haveSameProperties(detailedColumns[i], detailedColumns[0])).toBe(true);
                    }
                    for (var i = 11; i < 16; i++) {
                        expect(haveSameProperties(detailedColumns[i], detailedColumns[0])).toBe(true);
                    }
                });
                
                it('should have the correct type.', function () {
                    for (var i = 1; i < 5; i++) {
                        expect(detailedColumns[i].type.name).toBe("markdown");
                    }
                    for (var i = 11; i < 16; i++) {
                        expect(detailedColumns[i].type.name).toBe("markdown");
                    }
                });
                
                it('should have the correct table.', function () {
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

                
                it('should have the correct reference.', function () {
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

                
                describe('.displayname, ', function () {
                    it('should use the foreignKey\' s to_name.', function () {
                        expect(detailedColumns[1].displayname).toBe("to_name_value");
                        expect(detailedColumns[11].displayname).toBe("to_name_value");
                    });

                    describe('when foreignKey\' s to_name is not defined, ', function () {
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

                describe('.comment', function () {
                    it ('when foreign key is simple should use column\'s comment.', function () {
                        expect(detailedColumns[1].comment).toBe("simple fk to reference, col_1");
                    });

                    it('otherwise should use foreignkey\'s comment.', function () {
                        expect(detailedColumns[11].comment).toBe("composite fk to table_w_composite_key with to_name");
                    });
                })
                
                describe('.formatpresentation, ', function () {
                    var val;
                    it('should return the correct link.', function () {
                        val = detailedColumns[14].formatPresentation(data).value;

                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=1">' + data.id_1 + ' , ' + data.id_2 + '</a>');
                    });

                    it('should not add a link when the caption has a link.', function () {
                        val = detailedColumns[12].formatPresentation(data).value;
                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/search">' + data.id + '</a>');
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

                
                describe('.nullok, ', function () {
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

                describe('.getInputDisabled, ', function () {
                    it('for simple foreignkeys, should return column\`s result.', function () {
                        // has generated in create
                        expect(entryCreateRef.columns[0].inputDisabled).toEqual({
                            message: "Automatically generated by the server"
                        });
                        
                        // has immutable in edit
                        expect(entryEditRef.columns[2].inputDisabled).toBe(true);

                        // does not have immutable nor generated
                        expect(entryEditRef.columns[6].inputDisabled).toBe(false);
                    });
                    
                    describe('for composite foreignkeys, ', function () {
                        describe('in create context, ', function () {
                            it('if all columns are generated, should return generated message.', function () {
                                expect(entryCreateRef.columns[1].inputDisabled).toEqual({
                                    message: "Automatically generated by the server"
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
                    
                });
                

            });
            
        });

        describe('.values, ', function () {
            it('should return a link for PseudoColumns and value for Columns; and respect null values.', function (done) {
                detailedRef.read(limit).then(function (page) {
                    var tuples = page.tuples;
                    expect(tuples[0].values).toEqual(detailedRefExpectedValue);
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('should not return a link for PseudoColumns and just return row name in entry/edit context; and respect null values.', function (done) {
                entryEditRef.read(limit).then(function (page) {
                    var tuples = page.tuples;
                    expect(tuples[0].values).toEqual(entryEditRefExpectedValue);
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });;
            });
        });


        /************** HELPER FUNCTIONS ************* */
        function checkAllPseudoColumns(hasAnnotation) {
            var columns, currEntryRef;

            beforeAll(function () {
                if (hasAnnotation) {
                    currEntryRef = entryEditRef;
                    columns = compactSelectColumns;
                } else {
                    currEntryRef = entryRef;
                    columns = detailedColumns;
                }
            });

            it('should not include duplicate Columns or PseudoColumns.', function() {
                expect(columns.length).toBe(16);
                expect(currEntryRef.columns.length).toBe(11);
            });

            it('should include columns that are not part of any FKRs.', function () {
                expect(columns[0].isPseudo).toBe(false);
                expect(columns[0].name).toBe("id");

                expect(columns[10].isPseudo).toBe(false);
                expect(columns[10].name).toBe("reference_schema:outbound_fk_7");
            });

            describe('for columns that are part of a simple FKR, ', function () {
                it('should replace them with PseudoColumn.', function () {
                    expect(columns[1].isPseudo).toBe(true);
                    expect(columns[1].name).toBe(["reference_schema", "outbound_fk_1"].join(":"));

                    expect(columns[2].isPseudo).toBe(true);
                    expect(columns[2].name).toBe(["reference_schema", "outbound_fk_2"].join(":"));

                    expect(columns[3].isPseudo).toBe(true);
                    expect(columns[3].name).toBe(["reference_schema", "outbound_fk_3"].join(":"));

                    expect(columns[4].isPseudo).toBe(true);
                    expect(columns[4].name).toBe(["reference_schema", "outbound_fk_4"].join(":"));
                });
            });

            describe('for columns that are part of composite FKR, ', function () {

                it('should include the columns and avoid duplicate.', function () {
                    expect(columns[5].isPseudo).toBe(false);
                    expect(columns[5].name).toBe("col_3");

                    expect(columns[6].isPseudo).toBe(false);
                    expect(columns[6].name).toBe("col_4");

                    expect(columns[7].isPseudo).toBe(false);
                    expect(columns[7].name).toBe("col_5");

                    expect(columns[8].isPseudo).toBe(false);
                    expect(columns[8].name).toBe("col_6");

                    expect(columns[9].isPseudo).toBe(false);
                    expect(columns[9].name).toBe("col_7");
                });


                it('in edit or create context should not include the columns, and just create PseudoColumn for them.', function () {
                    var expectedCols = [
                        "id", ["reference_schema", "outbound_fk_1"].join(":"), ["reference_schema", "outbound_fk_2"].join(":"), ["reference_schema", "outbound_fk_3"].join(":"), ["reference_schema", "outbound_fk_4"].join(":"),
                        "reference_schema:outbound_fk_7", ["reference_schema", "outbound_fk_5"].join(":"), ["reference_schema", "outbound_fk_6"].join(":"), ["reference_schema", "outbound_fk_8"].join(":"), ["reference_schema", "outbound_fk_7"].join(":") + "1", ["reference_schema", "outbound_fk_9"].join(":")
                    ];

                    checkReferenceColumns([{
                        ref: currEntryRef,
                        expected: expectedCols
                    }]);
                });

                it('should create just one PseudoColumn for the FKR.', function () {
                    expect(columns[11].isPseudo).toBe(true);
                    expect(columns[11].name).toBe(["reference_schema", "outbound_fk_5"].join(":"));

                    expect(columns[12].isPseudo).toBe(true);
                    expect(columns[12].name).toBe(["reference_schema", "outbound_fk_6"].join(":"));

                    expect(columns[13].isPseudo).toBe(true);
                    expect(columns[13].name).toBe(["reference_schema", "outbound_fk_8"].join(":"));

                    expect(columns[14].isPseudo).toBe(true);
                    expect(columns[14].name).toBe(["reference_schema", "outbound_fk_7"].join(":") + "1");

                    expect(columns[15].isPseudo).toBe(true);
                    expect(columns[15].name).toBe(["reference_schema", "outbound_fk_9"].join(":"));
                });
            });
        }

        function checkReferenceColumns(tesCases) {
            tesCases.forEach(function (test) {
                expect(test.ref.columns.map(function (col) {
                    return col.name;
                })).toEqual(test.expected);
            });
        }

        function haveSameProperties(source, dest) {
            for (var pr in dest) {
                if (dest.hasOwnProperty(pr)) {
                    if (!source.hasOwnProperty(pr)) {
                        return false;
                    }
                }
            }
            return true;
        }
    });

}