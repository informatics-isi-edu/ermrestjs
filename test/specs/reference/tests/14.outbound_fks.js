exports.execute = function (options) {
    describe('In case of outbound foreign keys, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table_outbound_fks",
            tableWithCompositeKey = "table_w_composite_key",
            tableWithCompositeKey2 = "table_w_composite_key_2",
            tableWithSimpleKeyFK = "table_w_simple_key_fk",
            tableWithCompositeKey3 = "table_w_composite_key_3",
            tableWithSlash = "table_w_slash",
            entityId = 1,
            limit = 1,
            entryContext = "entry",
            createContext = "entry/create",
            editContext = "entry/edit",
            detailedContext = "detailed";

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/id=" + entityId;
        
        var singleEnitityUriCompositeKey = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithCompositeKey + "/id=" + entityId;
        
        var singleEnitityUriCompositeKey2 = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithCompositeKey2 + "/id=" + entityId;

        var singleEnitityUriCompositeKey3 = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithCompositeKey3 + "/id=" + entityId;

        var singleEnitityUriSimpleKeyFK = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithSimpleKeyFK + "/id=" + entityId;
        
        var singleEnitityUriWithSlash = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithSlash + "/id=" + entityId;

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

        var referenceRawData = [   
            {
                "id": "1",
                "col_1": "9000",
                "col_2": null,
                "col_3": "4000",
                "col_4": "4001",
                "col 5": "4002",
                "col_6": "4003",
                "col_7": null,
                "reference_schema_outbound_fk_7": "12"
            },
            {
                "id": "2",
                "col_1": "9001",
                "col_2": null,
                "col_3": "4000",
                "col_4": "4002",
                "col 5": "4003",
                "col_6": "4004",
                "col_7": null,
                "reference_schema_outbound_fk_7": "13"
            }
        ];
        
        var compactRefExpectedPartialValue = [ 
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table_outbound_fks/id=1">1</a>', 
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000">9000</a>', 
            '', 
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=4000">4000</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_values/id=4000">4000</a>', 
            '4000', 
            '4001', 
            '4002', 
            '4003',
             '', 
             '<p>12</p>\n', 
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id_1=4000&id_2=4001">4000 , 4001</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key_2/id_1=4000&id_2=4003">4000:4003</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id_1=4002&id_2=4000">4002 , 4000</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id_1=4002&id_2=4001">4002 , 4001</a>', 
             ''
        ];

        var compactRefExpectedLinkedValue = [
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table_outbound_fks/id=1">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000">Hank</a>',
            '',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=4000">John</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_values/id=4000">Hank</a>',
            '4000',
            '4001',
            '4002',
            '4003',
            '',
            '<p>12</p>\n',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=1">4000 , 4001</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=5">4002 , 4000</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=8">4002 , 4001</a>',
            ''
        ];

        var entryRefExpectedPartialValue = [
            '1', 
            '9000', 
            '', 
            '4000', 
            '4000', 
            '12', 
            '4000 , 4001', 
            '4000:4003', 
            '4002 , 4000', 
            '4002 , 4001', 
            '' // 
        ];

        var entryRefExpectedLinkedValue = [
            '1',
            'Hank',
            '',
            'John',
            'Hank',
            '12',
            '4000 , 4001',
            '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
            '4002 , 4000',
            '4002 , 4001',
            ''
        ];

        var entryCreateRefExpectedLinkedValue = [ 
            'Hank', '', '4002 , 4000', '1' 
        ];
        
        var entryCreateRefExpectedPartialValue = [
            '9000', '', '4002 , 4000', '1'
        ];

        var tableWSlashData = [
            '1', 
            '1', 
            '2', 
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9001">Harold</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000">Hank</a>'
        ]

        /**
         * This is the structure of the used table:
         * reference_table_outbound_fks:
         * columns:
         *  id -> single key, not part of any fk
         *  col_1 -> has generated annotation
         *  col_2 -> has displayname (value is null) | has immutable annotation | (colum_order: [id, col_1])
         *  col_3 -> has displayname (nullok is false) | (column_order: false)
         *  col_4 -> has generated annotation | (column_order: [col_2, col_3])
         *  col 5 -> has generated annotation
         *  col_6 -> nullok false
         *  col_7 -> value is null | has generated and immutable annotation
         *  reference_schema_outbound_fk_7 -> not part of any fk | has immutable
         * 
         * FKRs:
         *  outbound_fk_1: col_1 -> ref_table (to_name) (column_order: false)
         *  outbound_fk_2: col_2 -> ref_table
         *  outbound_fk_3: col_3 -> ref_table 
         *  outbound_fk_4: col_3 -> reference_values | (column_order: [name])
         *  outbound_fk_5: col_3, col_4 -> table_w_composite_key (to_name) | (column_order: [id])
         *  outbound_fk_6: col_3, col_6 -> table_w_composite_key_2
         *  outbound_fk_7: col_4, col 5 -> table_w_composite_key
         *  outbound_fk_8: col_3, col 5 -> table_w_composite_key
         *  outbound_fk_9: col_7, col 5 -> table_w_composite_key -> col_7 is null
         * 
         * expected output for ref.columns in detailed, compact/select, and entry/edit contexts:
         * 0:   id
         * 1:   outbound_fk_1 (check to_name) (check nullok)
         * 2:   outbound_fk_2  -> is null
         * 3:   outbound_fk_3 (check disambiguation) (check nullok)
         * 4:   outbound_fk_4 (check disambiguation)
         * 5:   col_3
         * 6:   col_4
         * 7:   col 5
         * 8:   col_6
         * 9:   col_7
         * 10:  reference_schema_outbound_fk_7
         * 11:  outbound_fk_5 (check to_name) (check nullok)
         * 12:  outbound_fk_6 (check nullok)
         * 13:  outbound_fk_8 (check disambiguation)
         * 14:  outbound_fk_7 (check disambiguation) (check nullok)
         * 15:  outbound_fk_9
         * 
         * expected output for ref.columns in entry context:
         * 0:   id
         * 1:   outbound_fk_1
         * 2:   outbound_fk_2
         * 3:   outbound_fk_3
         * 4:   outbound_fk_4
         * 5:   reference_schema_outbound_fk_7
         * 6:   outbound_fk_5
         * 7:   outbound_fk_6 
         * 8:   outbound_fk_8
         * 9:   outbound_fk_7
         * 10:  outbound_fk_9
         * 
         * 
         * ref.columns in entry/edit:
         * 
         * 0:   col_6
         * 1:   id
         * 2:   col_3
         * 3:   outbound_fk_2 (used for inputDisabled)
         * 4:   outbound_fk_3 (used for inputDisabled)
         * 5:   outbound_fk_7 (used for inputDisabled)
         * 6:   outbound_fk_8 (used for inputDisabled)
         * 7:   outbound_fk_9 (used for inputDisabled)
         * 
         * contexts that are used:
         *  
         *  compact: doesn't have visible-columns
         *  compact/brief: has visible-columns with three composite keys
         *  compact/select: has all of the columns in visible-columns + has some foreign keys too
         *  detailed: has visible-columns with duplicate values
         *  entry: doesn't have visible-columns
         *  entry/edit: has visible-columns annotation. (just key)
         *  entry/create: has all of the columns in visible-column + has some foreign keys too
         */

        var compactRef, compactBriefRef, compactSelectRef, compactRef, entryRef, entryCreateRef, entryEditRef, slashRef,
            compactColumns, compactSelectColumns, table2RefColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {

                compactRef = response.contextualize.compact;
                compactBriefRef = response.contextualize.compactBrief;
                compactSelectRef = response.contextualize.compactSelect;

                detailedRef = response.contextualize.detailed;

                entryRef = response.contextualize.entry;
                entryCreateRef = response.contextualize.entryCreate;
                entryEditRef = response.contextualize.entryEdit;

                compactColumns = compactRef.columns;
                compactSelectColumns = compactSelectRef.columns;

                options.ermRest.resolve(singleEnitityUriWithSlash, {cid:"test"}).then(function(ref) {
                    slashRef = ref;
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe('.columns, ', function () {
            describe('when visible-columns annotation is present for the context, ', function () {
                it('should not include duplicate columns and PseudoColumns.', function () {
                    checkReferenceColumns([{
                        ref: detailedRef,
                        expected: [
                            "id", 
                            ["reference_schema","ref_table_outbound_fks_key"].join("_"),
                            ["reference_schema", "outbound_fk_1"].join("_")
                        ]
                    }]);
                });
                
                it('should just include columns and PseudoColumns that are valid.', function () {
                    checkReferenceColumns([{
                        ref: entryCreateRef,
                        expected: [
                            ["reference_schema", "outbound_fk_1"].join("_"),
                            ["reference_schema", "outbound_fk_9"].join("_"),
                            ["reference_schema", "outbound_fk_8"].join("_"),
                            "id"
                        ]
                    }]);
                });

                it('should not apply heuristics and just return given list.', function() {
                    expect(compactSelectColumns.length).toBe(13);
                    checkReferenceColumns([{
                        ref: compactSelectRef,
                        expected: [
                            "id", ["reference_schema", "outbound_fk_1"].join("_"),
                            "col_1", "col_2", "col_3", "col_4","col 5", ["reference_schema","outbound_fk_3"].join("_"), 
                            "col_6", "col_7", ["reference_schema","outbound_fk_5"].join("_"), 
                            "reference_schema_outbound_fk_7", ["reference_schema","outbound_fk_7"].join("_") + "1"
                        ]
                    }]);
                });

                it('in entry contexts, instead of creating a PseudoColumn for key, should add its contituent columns (avoid duplicate).', function () {
                    checkReferenceColumns([{
                        ref: entryEditRef,
                        expected: [
                            "col_6", "id", "col_3",
                            ["reference_schema", "outbound_fk_2"].join("_"),
                            ["reference_schema", "outbound_fk_3"].join("_"),
                            ["reference_schema", "outbound_fk_7"].join("_") + "1",
                            ["reference_schema", "outbound_fk_8"].join("_"),
                            ["reference_schema", "outbound_fk_9"].join("_")
                        ]
                    }]);
                });

                if (!process.env.TRAVIS) {
                    it('should handle the columns with slash(`/`) in their names.', function () {
                        checkReferenceColumns([{
                            ref: slashRef.contextualize.compactBrief,
                            expected: [
                                "id", 
                                "col_with_slash/", 
                                ["reference_schema", "table_w_slash_fk_1"].join("_"), 
                                ["reference_schema", "table_w_slash_fk_2"].join("_")
                            ]
                        }]);             
                    });
                }
            });


            describe('when visible-columns annotation is not present for the context, ', function () {
                describe('PseudoColumn for key, ', function () {
                    it('if key columns are nullable, should not be added.', function (done) {
                        options.ermRest.resolve(singleEnitityUriCompositeKey, {cid:"test"}).then(function(ref) {
                            expect(ref.columns[0].isPseudo).toBe(false);
                            expect(ref.columns[0].name).toEqual("id");
                            
                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });
                    });

                    it('if key is simple and its contituent columns are part of simple foreign key, should not be added (instead it should apply the PseudoColumn for foreignkey logic.)', function(done) {
                        options.ermRest.resolve(singleEnitityUriSimpleKeyFK, {cid:"test"}).then(function(ref) {
                            expect(ref.columns[0].isPseudo).toBe(true);
                            expect(ref.columns[0].name).toEqual("reference_schema_table_w_simple_key_fk_foreignkey");

                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });
                    });

                    it('if context is detailed, entry, entry/create, or entry/edit, should not be added.', function (done) {
                        expect(entryRef.columns[0].isPseudo).toBe(false);
                        expect(entryRef.columns[0].name).toEqual("id");

                        options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                                ref = ref.contextualize.detailed;
                                expect(ref.columns[0].isPseudo).toBe(false);
                                expect(ref.columns[0].name).toEqual("id");
                                
                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                    });

                    describe('otherwise, ', function () {
                        it ('should pick the shortest notnull and not html key.', function () {
                            expect(compactColumns[0].isPseudo).toBe(true);
                            expect(compactColumns[0].name).toEqual(["reference_schema", "ref_table_outbound_fks_key"].join("_"));
                        });

                        it("if table has several keys with same size, should pick the one with most text columns.", function (done) {
                            options.ermRest.resolve(singleEnitityUriCompositeKey3, {cid:"test"}).then(function(ref) {
                                expect(ref.columns[0].isPseudo).toBe(true);
                                expect(ref.columns[0].name).toEqual(["reference_schema", "table_w_composite_key_3_key"].join("_"));
                                
                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                        });

                        it('if table has several keys with same size and same number of texts, should pick the key that has lower column positions.', function (done) {
                            options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                                expect(ref.columns[0].isPseudo).toBe(true);
                                expect(ref.columns[0].name).toEqual(["reference_schema", "table_w_composite_key_2_key"].join("_"));
                                
                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                        });
                        
                    });
                });

                it('should not include serial columns that are part of a simple key, and that key has not been used for self-link.', function (){
                    options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                        expect(ref.columns.length).toBe(3);
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                })

                it('should not include duplicate Columns or PseudoColumns.', function() {
                    expect(compactColumns.length).toBe(16);
                    expect(entryRef.columns.length).toBe(11);
                });

                it('should include columns that are not part of any FKRs.', function () {
                    expect(compactColumns[10].isPseudo).toBe(false);
                    expect(compactColumns[10].name).toBe("reference_schema_outbound_fk_7");
                });

                describe('for columns that are part of a simple FKR, ', function () {
                    it('should replace them with PseudoColumn.', function () {
                        expect(compactColumns[1].isPseudo).toBe(true);
                        expect(compactColumns[1].name).toBe(["reference_schema", "outbound_fk_1"].join("_"));

                        expect(compactColumns[2].isPseudo).toBe(true);
                        expect(compactColumns[2].name).toBe(["reference_schema", "outbound_fk_2"].join("_"));

                        expect(compactColumns[3].isPseudo).toBe(true);
                        expect(compactColumns[3].name).toBe(["reference_schema", "outbound_fk_3"].join("_"));

                        expect(compactColumns[4].isPseudo).toBe(true);
                        expect(compactColumns[4].name).toBe(["reference_schema", "outbound_fk_4"].join("_"));
                    });
                });

                describe('for columns that are part of composite FKR, ', function () {

                    it('should include the columns and avoid duplicate.', function () {
                        expect(compactColumns[5].isPseudo).toBe(false);
                        expect(compactColumns[5].name).toBe("col_3");

                        expect(compactColumns[6].isPseudo).toBe(false);
                        expect(compactColumns[6].name).toBe("col_4");

                        expect(compactColumns[7].isPseudo).toBe(false);
                        expect(compactColumns[7].name).toBe("col 5");

                        expect(compactColumns[8].isPseudo).toBe(false);
                        expect(compactColumns[8].name).toBe("col_6");

                        expect(compactColumns[9].isPseudo).toBe(false);
                        expect(compactColumns[9].name).toBe("col_7");
                    });


                    it('in edit or create context should not include the columns, and just create PseudoColumn for them.', function () {
                        var expectedCols = [
                            "id", ["reference_schema", "outbound_fk_1"].join("_"), ["reference_schema", "outbound_fk_2"].join("_"), ["reference_schema", "outbound_fk_3"].join("_"), ["reference_schema", "outbound_fk_4"].join("_"),
                            "reference_schema_outbound_fk_7", ["reference_schema", "outbound_fk_5"].join("_"), ["reference_schema", "outbound_fk_6"].join("_"), ["reference_schema", "outbound_fk_8"].join("_"), ["reference_schema", "outbound_fk_7"].join("_") + "1", ["reference_schema", "outbound_fk_9"].join("_")
                        ];

                        checkReferenceColumns([{
                            ref: entryRef,
                            expected: expectedCols
                        }]);
                    });

                    it('should create just one PseudoColumn for the FKR.', function () {
                        expect(compactColumns[11].isPseudo).toBe(true);
                        expect(compactColumns[11].name).toBe(["reference_schema", "outbound_fk_5"].join("_"));

                        expect(compactColumns[12].isPseudo).toBe(true);
                        expect(compactColumns[12].name).toBe(["reference_schema", "outbound_fk_6"].join("_"));

                        expect(compactColumns[13].isPseudo).toBe(true);
                        expect(compactColumns[13].name).toBe(["reference_schema", "outbound_fk_8"].join("_"));

                        expect(compactColumns[14].isPseudo).toBe(true);
                        expect(compactColumns[14].name).toBe(["reference_schema", "outbound_fk_7"].join("_") + "1");

                        expect(compactColumns[15].isPseudo).toBe(true);
                        expect(compactColumns[15].name).toBe(["reference_schema", "outbound_fk_9"].join("_"));
                    });
                });


                if (!process.env.TRAVIS) {
                    it('should handle the columns with slash(`/`) in their names.', function () {
                        checkReferenceColumns([{
                            ref: slashRef,
                            expected: [
                                "id", 
                                "col_1", 
                                "col_with_slash/", 
                                ["reference_schema", "table_w_slash_fk_1"].join("_"), 
                                ["reference_schema", "table_w_slash_fk_2"].join("_")
                            ]
                        }]);             
                    });
                }
            });
            
        });

        describe('tuple.values, ', function () {
            describe('when linked data is available, ', function () {
                it('should return a link for PseudoColumns and value for Columns; and respect null values.', function (done) {
                    compactRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(compactRefExpectedLinkedValue);
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
                
                it('should not return a link for PseudoColumns and just return row name in entry contexts; and respect null values.', function (done) {
                    entryRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(entryRefExpectedLinkedValue);
                        
                        entryCreateRef.read(limit).then(function (page) {
                            var tuples = page.tuples;
                            expect(tuples[0].values).toEqual(entryCreateRefExpectedLinkedValue);
                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });

                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            });

            describe('in absence of linked data, ', function () {
                var page;
                it('should return a link for PseudoColumns and value for Columns; and respect null values.', function () {
                    page = options.ermRest._createPage(compactRef, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(compactRefExpectedPartialValue);
                });
                
                it('should not return a link for PseudoColumns and just return row name in entry contexts; and respect null values.', function () {
                    page = options.ermRest._createPage(entryRef, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(entryRefExpectedPartialValue);

                    page = options.ermRest._createPage(entryCreateRef, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(entryCreateRefExpectedPartialValue);
                }); 
            });

            if (!process.env.TRAVIS) {
                it('should handle the columns with slash(`/`) in their names.', function (done) {
                    slashRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(tableWSlashData);
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            }
        });
        
        /************** HELPER FUNCTIONS ************* */
        function checkReferenceColumns(tesCases) {
            tesCases.forEach(function (test) {
                expect(test.ref.columns.map(function (col) {
                    return col.name;
                })).toEqual(test.expected);
            });
        }
    });

}