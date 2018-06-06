exports.execute = function (options) {

    describe("For determining sort,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "sorted_table",
            outboundTableName = "sorted_table_w_fk",
            tableWSlashName = "table_w_slash";

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

            beforeAll(function(done) {
                options.ermRest.appLinkFn(appLinkFn);
                options.ermRest.resolve(uri, {cid:"test"}).then(function(response) {
                    outboundRef = response;
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

                it("if foreignkey has a `column_order` other than false, should sort based on that.", function (done) {
                    checkSort([{"column": "reference_schema_sorted_table_w_fk_fk1", "descending": false}], "02", done);
                });

                it("if foreignkey doesn't have `column_order` annotation and table has `row_order`, should sort based on table's row_order", function (done) {
                    // it should honor the row_order as is, and don't apply column_order to that
                    checkSort([{"column": "reference_schema_sorted_table_w_fk_fk2", "descending": false}], "02", done);
                });

                it("if foreignkey doesn't have `column_order` and is simple, should sort based on the constituent column.", function (done) {
                    checkSort([{"column": "reference_schema_sorted_table_w_fk_fk3", "descending": false}], "04", done);
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

                it("it should encode the column names.", function (done) {
                    checkSort([{"column":"col w space", "descending": false}], "07", done);
                });

                if (!process.env.TRAVIS) {
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
        function checkSort(sortColumns, ExpectedFirstId, done) {
            var val;
            outboundRef.sort(sortColumns).read(1).then(function (response) {
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
