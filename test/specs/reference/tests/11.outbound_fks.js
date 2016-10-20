exports.execute = function (options) {
    describe('In case of outbound foreign keys, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table_outbound_fks",
            entityId = 1,
            limit = 1;

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function(tag, location) {
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
                    url =  searchURL;
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

        var data = {"id": "1", "id_1": "2", "id_2": "3"};

        var expectedValue = [
           '1', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000">Hank</a>', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9001">Harold</a>', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=4000">John</a>', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_values/id=4000">Hank</a>', 
           '4000', 
           '4001', 
           '4002', 
           '4003', 
           '12', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=1">4000 , 4001</a>', 
           '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=2">4000 , 4002</a>', 
           '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=4">4001 , 4002</a>'
        ];
        
        var reference, detailedRef, compactRef, entryCreateRef, entryEditRef, detailedColumns;

        beforeAll(function(done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function(response) {
                reference = response;
                detailedRef = response.contextualize.detailed; // visible-columns is not defined in this context
                detailedColumns = detailedRef.columns;
                compactRef = response.contextualize.compact; // visible-columns with duplicate values
                entryCreateRef = response.contextualize.entryCreate; // visible-columns with invalid names
                entryEditRef = response.contextualize.entryEdit; // visible-columns with correct values
                done();
            }, function(err) {
                console.dir(err);
                done.fail();
            });
        });

         function checkReferenceColumns(tesCases) {
            tesCases.forEach(function(test){
                expect(test.ref.columns.map(function(col){
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

        /**
         * This is the structure of the used table:
         * reference_table_outbound_fks:
         * columns:
         *  id -> single key, not part of any fk
         *  col_1
         *  col_2 -> has displayname
         *  col_3 -> has displayname
         *  col_4
         *  col_5
         *  col_6
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
         * 
         * expected output for ref.columns:
         * 0: id
         * 1: outbound_fk_1 (check to_name)
         * 2: outbound_fk_2 
         * 3: outbound_fk_3 (check disambiguation)
         * 4: outbound_fk_4 (check disambiguation)
         * 5: col_3
         * 6: col_4
         * 7: col_5
         * 8: col_6
         * 9: reference_schema:outbound_fk_7
         * 10:outbound_fk_5 (check to_name)
         * 11:outbound_fk_6 
         * 12:outbound_fk_8 (check disambiguation)
         * 13:outbound_fk_7 (check disambiguation)
         */

        describe('.columns, ', function() {

            describe('when visible-columns annotation is present for the context', function () {
                it ('should not include duplicate columns and FKRs.', function () {
                    checkReferenceColumns([{
                        ref: compactRef,
                        expected: [
                            "id",
                            ["reference_schema","outbound_fk_1"].join(":")
                        ]
                    }]);
                });

                it ('should just include columns and FKRs that are valid.', function () {
                    checkReferenceColumns([{
                        ref: entryCreateRef,
                        expected: [
                            ["reference_schema","outbound_fk_1"].join(":"),
                            "id"
                        ]
                    }]);
                });

                it ('should just include the column/FKRs mentioned in the annotations.', function () {
                    checkReferenceColumns([{
                        ref: entryEditRef,
                        expected: [
                            "id",
                            ["reference_schema","outbound_fk_1"].join(":")
                        ]
                    }]);
                });
            });


            describe('when visible-columns annotation is not present for the context', function () {

                it ('should include columns that are not part of any FKRs', function () {
                    expect(detailedColumns[0].isPseudo).toBe(false);
                    expect(detailedColumns[0].name).toBe("id");

                    expect(detailedColumns[9].isPseudo).toBe(false);
                    expect(detailedColumns[9].name).toBe("reference_schema:outbound_fk_7");
                });
                        
                describe('for columns that are part of a simple FKR, ', function () {
                    it('should replace them with PseudoColumn.', function () {
                        expect(detailedColumns[1].isPseudo).toBe(true);
                        expect(detailedColumns[1].name).toBe(["reference_schema", "outbound_fk_1"].join(":"));

                        expect(detailedColumns[2].isPseudo).toBe(true);
                        expect(detailedColumns[2].name).toBe(["reference_schema", "outbound_fk_2"].join(":"));

                        expect(detailedColumns[3].isPseudo).toBe(true);
                        expect(detailedColumns[3].name).toBe(["reference_schema", "outbound_fk_3"].join(":"));

                        expect(detailedColumns[4].isPseudo).toBe(true);
                        expect(detailedColumns[4].name).toBe(["reference_schema", "outbound_fk_4"].join(":"));
                    });
                });

                describe('for columns that are part of composite FKR', function () {

                    it ('should include the columns and avoid duplicate.', function () {
                        expect(detailedColumns[5].isPseudo).toBe(false);
                        expect(detailedColumns[5].name).toBe("col_3");

                        expect(detailedColumns[6].isPseudo).toBe(false);
                        expect(detailedColumns[6].name).toBe("col_4");

                        expect(detailedColumns[7].isPseudo).toBe(false);
                        expect(detailedColumns[7].name).toBe("col_5");

                        expect(detailedColumns[8].isPseudo).toBe(false);
                        expect(detailedColumns[8].name).toBe("col_6");
                    });

                    it('should create just one PseudoColumn for the FKR.', function () {
                        expect(detailedColumns[10].isPseudo).toBe(true);
                        expect(detailedColumns[10].name).toBe(["reference_schema", "outbound_fk_5"].join(":"));
                        
                        expect(detailedColumns[11].isPseudo).toBe(true);
                        expect(detailedColumns[11].name).toBe(["reference_schema", "outbound_fk_6"].join(":"));

                        expect(detailedColumns[12].isPseudo).toBe(true);
                        expect(detailedColumns[12].name).toBe(["reference_schema", "outbound_fk_8"].join(":"));

                        expect(detailedColumns[13].isPseudo).toBe(true);
                        expect(detailedColumns[13].name).toBe(["reference_schema", "outbound_fk_7"].join(":")+"1");
                    });
                });
            });

            
            describe('PseudoColumn, ', function () {

                it('should have the same functions as Column.', function () {
                    for (var i = 1; i < 5; i++) {
                        expect(haveSameProperties(detailedColumns[i], detailedColumns[0])).toBe(true);
                    }
                    for(var i = 10; i < 14; i++) {
                        expect(haveSameProperties(detailedColumns[i], detailedColumns[0])).toBe(true);
                    }
                });
                
                it('should have the correct type.', function () {
                    for (var i = 1; i < 5; i++) {
                        expect(detailedColumns[i].type.name).toBe("markdown");
                    }
                    for(var i = 10; i < 14; i++) {
                        expect(detailedColumns[i].type.name).toBe("markdown");
                    }
                });

                it('should have the correct table.', function () {
                    for (var i = 1; i < 4; i++) {
                        expect(detailedColumns[i].table.name).toBe("reference_table");
                    }
                    expect(detailedColumns[4].table.name).toBe("reference_values");
                    expect(detailedColumns[10].table.name).toBe("table_w_composite_key");
                    expect(detailedColumns[11].table.name).toBe("table_w_composite_key_2");
                    expect(detailedColumns[12].table.name).toBe("table_w_composite_key");
                    expect(detailedColumns[13].table.name).toBe("table_w_composite_key");
                });

              
                it('should have the correct reference.', function () {
                    for (var i = 1; i < 4; i++) {
                        expect(detailedColumns[i].reference._table.name).toBe("reference_table");
                    }
                    expect(detailedColumns[4].reference._table.name).toBe("reference_values");
                    expect(detailedColumns[10].reference._table.name).toBe("table_w_composite_key");
                    expect(detailedColumns[11].reference._table.name).toBe("table_w_composite_key_2");
                    expect(detailedColumns[12].reference._table.name).toBe("table_w_composite_key");
                    expect(detailedColumns[13].reference._table.name).toBe("table_w_composite_key");
                });

                describe('.displayname, ', function () {
                    it('should use the foreignKey\' s to_name.', function() {
                        expect(detailedColumns[1].displayname).toBe("to_name_value");
                        expect(detailedColumns[10].displayname).toBe("to_name_value"); 
                    });

                    describe('when foreignKey\' s to_name is not defined, ', function () {
                        describe('for simple foreign keys, ', function() {
                            it('should use column\'s displayname in the absence of to_name in foreignKey.', function () {
                                expect(detailedColumns[2].displayname).toBe("Column 2 Name");
                            });

                            it('should be disambiguated with Table.displayname when there are multiple foreignkeys.', function() {
                                expect(detailedColumns[3].displayname).toBe("Column 3 Name (reference_table)");
                                expect(detailedColumns[4].displayname).toBe("Column 3 Name (reference_values)");
                            });
                        });

                        describe('for composite foreign keys, ', function() {
                            it('should use referenced table\'s displayname in the absence of to_name in foreignKey.', function () {
                                expect(detailedColumns[11].displayname).toBe("table_w_composite_key_2");
                            });

                            it('should be disambiguated with displayname of columns when there are multiple foreignkeys to that table.', function() {
                                expect(detailedColumns[12].displayname).toBe("table_w_composite_key (Column 3 Name, col_5)");
                                expect(detailedColumns[13].displayname).toBe("table_w_composite_key (col_4, col_5)");
                            });
                        })

                    });
                });

                describe('.formatpresentation, ', function () {
                    var val;
                    it('should return the correct link.', function () {
                        val = detailedColumns[13].formatPresentation(data).value;

                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/id=1">' + data.id_1+' , '+data.id_2 + '</a>');
                    });

                    it('should not add a link when the caption has a link.', function () {
                        val = detailedColumns[11].formatPresentation(data).value;
                        expect(val).toEqual('<a href="https://dev.isrd.isi.edu/chaise/search">'+data.id+'</a>');
                    });
                });


            });

        });

        describe('.values', function () {
            it ('should return a link for PseudoColumns and value for Columns.', function (done) {
                detailedRef.read(limit).then(function(page) {
                    var tuples = page.tuples;
                    expect(tuples[0].values).toEqual(expectedValue);
                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });

    });

}