exports.execute = function (options) {

    describe("For determining sort,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "sorted_table",
            outboundTableName = "sorted_table_w_fk",
            tableWSlashName = "table_w_slash";

        var outboundTableVisColNames = [
            'id', 'AmU5Bnpob57TlHBvLFLu8w', 'eYcW4ExSOlwtjNUvpNrZbA',
            'DpOPZjKrep4VR09840YwRA', 'KSK3d0VUL0g8N4P1SZzDZw',
            '8tw62El12BT87wkFsN__1Q', 'HYUMN3Ihd6vR-0YnlIWR7Q',
        ];

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;

        var tableWSlashEntity = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableWSlashName;

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

        var reference1, reference2, outboundRef, tableWSlashRef;

        beforeAll(function(done) {
           options.ermRest.resolve(multipleEntityUri, {cid:"test"}).then(function(response) {
               reference1 = response;
               options.ermRest.resolve(tableWSlashEntity, {cid:"test"}).then(function(ref) {
                   tableWSlashRef = ref;
                   done();
               },function (err) {
                   console.dir(err);
                   done.fail();
               });
           },function (err) {
               console.dir(err);
               done.fail();
           });
        });

        // Test Cases:
        describe('Reference.sort() method, ', function() {
            var page;
            var limit = 10;

            it('sort should return a new Reference with new sort. ', function() {
                reference2 = reference1.sort([{"column":"name", "descending":false}]);
                expect(reference2._location.sortObject.length).toEqual(1);
                expect(reference2._location.sortObject[0].column).toEqual("name");
                expect(reference2._location.sortObject[0].descending).toEqual(false);
            });

            it('read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted. ', function() {
                tuples = page.tuples;
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
                }
            });

        });

        describe('read with sort param for multiple entities, ', function() {
            var reference, page;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(multipleEntityUri + "@sort(id::desc::)", {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted. ', function() {
                tuples = page.tuples;
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data.id).toBeGreaterThan(tuples[i+1]._data.id);
                }
            });

        });

        describe('read with no sort param (default) for multiple entities, ', function() {
            var reference, page;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(multipleEntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted by order specified in the schema. ', function() {
                tuples = page.tuples;
                for(var i = 0; i > tuples.length-1; i++) {
                    expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
                }
            });

        });

        describe('sorting based on different columns, ', function () {
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"+ outboundTableName,
                colName;
            var readPathPrefix = [
                "M:=reference_schema:sorted_table_w_fk/",
                "M_P1:=left(fk2_col_1)=(reference_schema:sorted_table:id)/F6:=left(fk1_col_1)=(reference_schema:table_w_composite_key:id)/$M/",
                "$M_P1/F4:=left(fk1_col_1)=(reference_schema:table_w_composite_key:id)/$M/",
                "F3:=left(fk3_col_1)=(reference_schema:table_w_composite_key:id)/$M/",
                "F2:=left(fk3_col_1)=(reference_schema:table_w_composite_key:id)/$M/",
                "F1:=left(fk1_col_1,fk1_col_2)=(reference_schema:table_w_composite_key:id_1,id_2)/$M/"
            ].join("");

            beforeAll(function(done) {
                options.ermRest.appLinkFn(appLinkFn);
                options.ermRest.resolve(uri, {cid:"test"}).then(function(response) {
                    outboundRef = response.contextualize.compact;
                    done();
                },function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('should return an error if the sort column is invalid', function (done) {
                colName = "invalid column";
                checkError([{"column":colName, "descending": false}], "Given column name `" + colName + "` in sort is not valid.", done);
            });

            it('should return an error if the sort column is not sortable', function (done) {
                colName = "col_not_sortable";
                checkError([{"column":colName, "descending": false}], "Column " + colName + " is not sortable.", done);
            });

            describe('when sorting based on a PseudoColumn, ', function () {

                describe("if foreignkey has a `column_order` other than false, should sort based on that.", function () {
                    it ("using the fk constraint name (backwards compatibility)", function (done) {
                        checkSort([{"column": "reference_schema_sorted_table_w_fk_fk1", "descending": false}], "02", done);
                    });

                    it ("using the fk name", function (done) {
                        checkSort([{"column": outboundTableVisColNames[1], "descending": false}], "02", done);
                    });
                });

                it("if foreignkey doesn't have `column_order` annotation and table has `row_order`, should sort based on table's row_order", function (done) {
                    // NOTE this will also make sure the logic of using proper fk alias works
                    //      since this is a subset of another visible-column, the alias of this based on another path
                    // it should honor the row_order as is, and don't apply column_order to that
                    checkSort(
                        // [reference_schema, sorted_table_w_fk_fk2] outbound fk
                        [{"column": outboundTableVisColNames[6], "descending": true}],
                        "03",
                        done,
                        [
                            readPathPrefix,
                            "F7:=M_P1:row_order_col,F8:=M_P1:id,RID;M:=array_d(M:*),F6:=F6:id,F5:=array_d(M_P1:*),F4:=array_d(F4:*),F3:=F3:col.%20w.%20dot.,F2:=array_d(F2:*),F1:=array_d(F1:*)@sort(F7::desc::,F8,RID)"
                        ].join("")
                    );
                });

                it("if foreignkey doesn't have `column_order` and is simple, should sort based on the constituent column.", function (done) {
                    // [reference_schema, sorted_table_w_fk_fk3] outbound fk
                    checkSort([{"column": outboundTableVisColNames[2], "descending": false}], "04", done);
                });

                it ("should be able to handle scalar foreignkeys.", function (done) {
                    // scalar sorted_table_w_fk_fk3 (col. w. dot. column)
                    checkSort(
                        [{"column": outboundTableVisColNames[3], "descending": false}],
                        "04",
                        done,
                        [
                            readPathPrefix,
                            "F7:=F3:col.%20w.%20dot.,RID;M:=array_d(M:*),F6:=F6:id,F5:=array_d(M_P1:*),F4:=array_d(F4:*),F3:=F3:col.%20w.%20dot.,F2:=array_d(F2:*),F1:=array_d(F1:*)@sort(F7,RID)"
                        ].join("")
                    );
                });

                describe ("should be able to handle foreignkeys using path prefix", function () {
                    it ("entity mode", function (done) {
                        // has sourcekey and outbound to table_w_composite_key table
                        checkSort([{"column": outboundTableVisColNames[4], "descending": false}], "03", done);
                    });

                    it ("scalar mode", function (done) {
                        // has sourcekey and outbound to table_w_composite_key table (id scalar)
                        checkSort(
                            [{"column": outboundTableVisColNames[5], "descending": true}],
                            "02",
                            done,
                            [
                                readPathPrefix,
                                "F7:=F6:id,RID;M:=array_d(M:*),F6:=F6:id,F5:=array_d(M_P1:*),F4:=array_d(F4:*),F3:=F3:col.%20w.%20dot.,F2:=array_d(F2:*),F1:=array_d(F1:*)@sort(F7::desc::,RID)"
                            ].join("")
                        );
                    });
                });
            });

            describe('when sorting based on a column, ', function () {

                it("if column has a `column_order` other than false, should sort based on that.", function (done) {
                    checkSort([{"column": "col_w_order", "descending": false}], "06", done);
                });

                it ("if column has a `column_order` other than false with descending, should sort based on that column and change the order.", function (done) {
                    // the column_order has [{col_w_order_multiple_1, descending}, col_w_order_multiple_2] which should turned into
                    // [col_w_order_multiple_1, {col_w_order_multiple_2, descending}]
                    checkSort([{"column": "col_w_order_multiple", "descending": true}], "05", done);
                });

                it("if column doesn't have `column_order`, should sort based on column value.", function (done) {
                    checkSort([{"column":"id", "descending": false}], "01", done);
                });

                it("if column is part of key but nullable, should sort add the shortest key.", function (done) {
                    checkSort(
                        [{"column":"col_nullable_key", "descending": false}], 
                        "04", done, 
                        [
                            readPathPrefix,
                            // we're making sure the RID is also added to the URL
                            "col_nullable_key,RID;M:=array_d(M:*),F6:=F6:id,F5:=array_d(M_P1:*),F4:=array_d(F4:*),F3:=F3:col.%20w.%20dot.,F2:=array_d(F2:*),F1:=array_d(F1:*)@sort(col_nullable_key,RID)"
                        ].join("")
                    );
                });

                it("it should encode the column names.", function (done) {
                    checkSort([{"column":"col w space", "descending": false}], "07", done);
                });

                if (!process.env.CI) {
                    it('should work with columns with slash(`/`) in their name.', function (done) {
                        checkSort([{"column":"col_w_slash/", "descending": false}], "08", done);
                    });
                }

            });

        });

        /**
         * to make the testing easier, I just test id of the first tuple.
         * All the tuples have distinct ids and in each scenario based on the data, one of them must be on top.
         */
        function checkSort(sortColumns, ExpectedFirstId, done, readPath) {
            var val;
            var ref = outboundRef.sort(sortColumns);
            if (readPath) {
                expect(ref.readPath).toBe(readPath, "read path missmatch");
            }
            ref.read(1).then(function (response) {
                expect(response.tuples[0].values[0]).toEqual(ExpectedFirstId);
                done();
            }, function (err) {
                done.fail(err);
            });
        }

        function checkError(sortColumns, error, done) {
            outboundRef.sort(sortColumns).read(1).then(function(response) {
                done.fail("expected function to throw error");
            }).catch(function (err) {
                expect(err.toString()).toEqual("Error: " + error);
                done();
            });
        }

    });
};
