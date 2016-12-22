exports.execute = function (options) {
    describe('In case of outbound foreign keys, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table_outbound_fks",
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

        var referenceRawData = [   
            {
                "id": "1",
                "col_1": "9000",
                "col_2": null,
                "col_3": "4000",
                "col_4": "4001",
                "col_5": "4002",
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
                "col_5": "4003",
                "col_6": "4004",
                "col_7": null,
                "reference_schema_outbound_fk_7": "13"
            }
        ];

        var detailedRefExpectedPartialValue = [ 
            '1', 
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000">9000</a>', 
            null, 
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=4000">4000</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_values/id=4000">4000</a>', 
            '4000', 
            '4001', 
            '4002', 
            '4003',
             null, 
             '12', 
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id_1=4000&id_2=4001">4000 , 4001</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key_2/id_1=4000&id_2=4003">4000:4003</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id_1=4000&id_2=4002">4000 , 4002</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id_1=4001&id_2=4002">4001 , 4002</a>', 
             null
        ];

        var detailedRefExpectedLinkedValue = [
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

        var entryEditRefExpectedPartialValue = [
            '1', 
            '9000', 
            '', 
            '4000', 
            '4000', 
            '12', 
            '4000 , 4001', 
            '4000:4003', 
            '4000 , 4002', 
            '4001 , 4002', 
            '' // 
        ];

        var entryEditRefExpectedLinkedValue = [
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

        var entryCreateRefExpectedLinkedValue = [ 
            'Hank', '', '4000 , 4002', '1' 
        ];
        
        var entryCreateRefExpectedPartialValue = [
            '9000', '', '4000 , 4002', '1'
        ];

        /**
         * This is the structure of the used table:
         * reference_table_outbound_fks:
         * columns:
         *  id -> single key, not part of any fk
         *  col_1 -> has generated annotation
         *  col_2 -> has displayname (value is null) | has immutable annotation | (colum_order: [id, col_1])
         *  col_3 -> has displayname (nullok is false) | (column_order: false)
         *  col_4 -> has generated annotation | (column_order: [col_2, col_3])
         *  col_5 -> has generated annotation
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
         *  outbound_fk_7: col_4, col_5 -> table_w_composite_key
         *  outbound_fk_8: col_3, col_5 -> table_w_composite_key
         *  outbound_fk_9: col_7, col_5 -> table_w_composite_key -> col_7 is null
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
         * 10:  reference_schema_outbound_fk_7
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
         * 5:   reference_schema_outbound_fk_7
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
         *  entry: has visible-columns with invalid names
         *  entry/edit: has all of the columns in visible-column + has some foreign keys too
         *  entry/create: has all of the columns in visible-column + has some foreign keys too
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
                            "id", ["reference_schema", "outbound_fk_1"].join("_")
                        ]
                    }]);
                });
                
                
                it('should just include columns and FKRs that are valid.', function () {
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

                it('should just include the column/FKRs mentioned in the annotations.', function () {
                    checkReferenceColumns([{
                        ref: compactBriefRef,
                        expected: [
                            "id", "reference_schema_outbound_fk_7", ["reference_schema", "outbound_fk_1"].join("_")
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
            
        });

        describe('tuple.values, ', function () {
            describe('when linked data is available, ', function () {
                it('should return a link for PseudoColumns and value for Columns; and respect null values.', function (done) {
                    detailedRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(detailedRefExpectedLinkedValue);
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
                
                it('should not return a link for PseudoColumns and just return row name in entry contexts; and respect null values.', function (done) {
                    entryEditRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(entryEditRefExpectedLinkedValue);
                        
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
                    page = options.ermRest._createPage(detailedRef, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(detailedRefExpectedPartialValue);
                });
                
                it('should not return a link for PseudoColumns and just return row name in entry contexts; and respect null values.', function () {
                    page = options.ermRest._createPage(entryEditRef, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(entryEditRefExpectedPartialValue);

                    page = options.ermRest._createPage(entryCreateRef, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(entryCreateRefExpectedPartialValue);
                }); 
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
                expect(columns[10].name).toBe("reference_schema_outbound_fk_7");
            });

            describe('for columns that are part of a simple FKR, ', function () {
                it('should replace them with PseudoColumn.', function () {
                    expect(columns[1].isPseudo).toBe(true);
                    expect(columns[1].name).toBe(["reference_schema", "outbound_fk_1"].join("_"));

                    expect(columns[2].isPseudo).toBe(true);
                    expect(columns[2].name).toBe(["reference_schema", "outbound_fk_2"].join("_"));

                    expect(columns[3].isPseudo).toBe(true);
                    expect(columns[3].name).toBe(["reference_schema", "outbound_fk_3"].join("_"));

                    expect(columns[4].isPseudo).toBe(true);
                    expect(columns[4].name).toBe(["reference_schema", "outbound_fk_4"].join("_"));
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
                        "id", ["reference_schema", "outbound_fk_1"].join("_"), ["reference_schema", "outbound_fk_2"].join("_"), ["reference_schema", "outbound_fk_3"].join("_"), ["reference_schema", "outbound_fk_4"].join("_"),
                        "reference_schema_outbound_fk_7", ["reference_schema", "outbound_fk_5"].join("_"), ["reference_schema", "outbound_fk_6"].join("_"), ["reference_schema", "outbound_fk_8"].join("_"), ["reference_schema", "outbound_fk_7"].join("_") + "1", ["reference_schema", "outbound_fk_9"].join("_")
                    ];

                    checkReferenceColumns([{
                        ref: currEntryRef,
                        expected: expectedCols
                    }]);
                });

                it('should create just one PseudoColumn for the FKR.', function () {
                    expect(columns[11].isPseudo).toBe(true);
                    expect(columns[11].name).toBe(["reference_schema", "outbound_fk_5"].join("_"));

                    expect(columns[12].isPseudo).toBe(true);
                    expect(columns[12].name).toBe(["reference_schema", "outbound_fk_6"].join("_"));

                    expect(columns[13].isPseudo).toBe(true);
                    expect(columns[13].name).toBe(["reference_schema", "outbound_fk_8"].join("_"));

                    expect(columns[14].isPseudo).toBe(true);
                    expect(columns[14].name).toBe(["reference_schema", "outbound_fk_7"].join("_") + "1");

                    expect(columns[15].isPseudo).toBe(true);
                    expect(columns[15].name).toBe(["reference_schema", "outbound_fk_9"].join("_"));
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