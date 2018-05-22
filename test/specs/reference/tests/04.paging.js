exports.execute = function (options) {

    // Test Cases:
    //   1. Sorting not specified, shortest key used
    //   2. Sort specified in schema
    //   3. Sort specified in URL, shortest not null integer/serial key is used.
    // Sub-cases:
    //   1. Next with more data
    //   2. Next with no more data
    //   3. Previous with more data
    //   4. Previous with no more data

    describe("Paging and Sorting Options,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableNameNoSort = "paging%20table%20no%20sort",
            tableNameWSort = "paging%20table%20w%20sort",
            tableNameReference = "reference_table",
            tableNameInboundRelated = "inbound_related_reference_table";

        var tableNoSortUri = options.url + "/catalog/" + catalog_id + "/entity/" +
                      schemaName + ":" + tableNameNoSort;

        describe("Paging table with no sort", function() {
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableNameNoSort;

            var reference1, reference2, reference3, tuples;
            var page1, page2, page3;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference1 = response;

                    expect(reference1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference1.read(limit).then(function (response) {
                    page1 = response;

                    expect(page1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted by ascending value by default. ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                }
            });

            describe("Next with more data", function() {

                it('next should return a Reference object that is defined.', function() {
                    reference2 = page1.next;
                    expect(reference2).toEqual(jasmine.any(Object));
                });

                it('read should return a Page object that is defined.', function(done) {
                    reference2.read(limit).then(function (response) {
                        page2 = response;

                        expect(page2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                    }
                });

            });

            describe("Next with no more data", function() {

                it('next should return null. ', function() {
                    var reference3 = page2.next;
                    expect(reference3).toBe(null);
                });

            });

            describe("Previous with more data", function() {

                it('previous should return a Reference object that is defined.', function() {
                    reference3 = page2.previous;
                    expect(reference3).toEqual(jasmine.any(Object));
                });

                it('read should return a Page object that is defined.', function(done) {
                    reference3.read(limit).then(function (response) {
                        page3 = response;

                        expect(page3).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                    }
                });
            });

            // limit was changed after paging back
            describe("with navigating back to the first page,", function() {
                var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableNameNoSort + "@sort(value%20x)@before(33)?limit=" + limit;
                var reference5;

                beforeAll(function(done) {
                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference5 = response;

                        expect(reference5).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it("read with an increased limit should return a Page object that is defined and doesn't have a previous page.", function(done) {
                    var increasedLimitPage, increasedLimitPreviousReference,
                        increasedLimit = 15;

                    reference5.read(increasedLimit).then(function (response) {
                        increasedLimitPage = response;

                        expect(increasedLimitPage).toEqual(jasmine.any(Object));
                        expect(increasedLimitPage.tuples.length).toBe(increasedLimit);

                        increasedLimitPreviousReference = increasedLimitPage.previous;
                        expect(increasedLimitPreviousReference).toBe(null);

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it("read with a decreased limit should return a Page object that is defined and doesn't have a previous page.", function(done) {
                    var decreasedLimitPage, decreasedLimitPreviousReference,
                        decreasedLimit = 5;

                    reference5.read(decreasedLimit).then(function (response) {
                        decreasedLimitPage = response;

                        expect(decreasedLimitPage).toEqual(jasmine.any(Object));
                        expect(decreasedLimitPage.tuples.length).toBe(decreasedLimit);

                        decreasedLimitPreviousReference = decreasedLimitPage.previous;
                        expect(decreasedLimitPreviousReference).toBe(null);

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            });

            describe("Previous with no more data", function() {

                it('previous should return null. ', function() {
                    var reference4 = page3.previous;
                    expect(reference4).toBe(null);

                });
            });


        });

        describe("Paging table with schema defined sort", function() {
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableNameWSort;

            var reference1, reference2, reference3, tuples;
            var page1, page2, page3;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference1 = response;

                    expect(reference1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference1.read(limit).then(function (response) {
                    page1 = response;

                    expect(page1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted by name. ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameWSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["name x"]).toBeLessThan(tuples[i+1]._data["name x"]);
                }
            });

            describe("Next with more data", function() {

                it('next should return a Reference object that is defined.', function() {
                    reference2 = page1.next;
                    expect(reference2).toEqual(jasmine.any(Object));

                });

                it('read should return a Page object that is defined.', function(done) {
                    reference2.read(limit).then(function (response) {
                        page2 = response;

                        expect(page2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by name. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameWSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["name x"]).toBeLessThan(tuples[i+1]._data["name x"]);
                    }
                });

            });

            describe("Next with no more data", function() {

                it('next should return null. ', function() {
                    var reference3 = page2.next;
                    expect(reference3).toBe(null);
                });

            });

            describe("Previous with more data", function() {

                it('previous should return a Reference object that is defined.', function() {
                    reference3 = page2.previous;
                    expect(reference3).toEqual(jasmine.any(Object));

                });

                it('read should return a Page object that is defined.', function(done) {
                    reference3.read(limit).then(function (response) {
                        page3 = response;

                        expect(page3).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameWSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["name x"]).toBeLessThan(tuples[i+1]._data["name x"]);
                    }
                });
            });


            describe("Next with no more data", function() {

                it('previous should return null. ', function() {
                    var reference4 = page3.previous;
                    expect(reference4).toBe(null);

                });
            });
        });

        describe("Paging with with url specified sort", function() {
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableNameNoSort + "/value%20x::lt::1000@sort(value%20x)";

            var reference1, reference2, reference3, tuples;
            var page1, page2, page3;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference1 = response;

                    expect(reference1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference1.read(limit).then(function (response) {
                    page1 = response;

                    expect(page1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted by ascending id by default. ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                }
            });

            describe("Next with more data", function() {

                it('next should return a Reference object that is defined.', function() {
                    reference2 = page1.next;
                    expect(reference2).toEqual(jasmine.any(Object));

                });

                it('read should return a Page object that is defined.', function(done) {
                    reference2.read(limit).then(function (response) {
                        page2 = response;

                        expect(page2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                    }
                });

            });

            describe("Next with no more data", function() {

                it('next should return null. ', function() {
                    var reference3 = page2.next;
                    expect(reference3).toBe(null);
                });

            });

            describe("Previous with more data", function() {

                it('previous should return a Reference object that is defined.', function() {
                    reference3 = page2.previous;
                    expect(reference3).toEqual(jasmine.any(Object));

                });

                it('read should return a Page object that is defined.', function(done) {
                    reference3.read(limit).then(function (response) {
                        page3 = response;

                        expect(page3).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                    }
                });
            });


            describe("Next with no more data", function() {

                it('previous should return null. ', function() {
                    var reference4 = page3.previous;
                    expect(reference4).toBe(null);

                });
            });
        });

        describe("Paging with sort based on column with null data, ", function () {
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableNameNoSort + "@sort(null%20value)";

            var reference1, reference2, reference3;
            var page1, page2, page3;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference1 = response;

                    expect(reference1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference1.read(limit).then(function (response) {
                    page1 = response;

                    expect(page1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted by ascending id by default. ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                }
            });

            describe("Next with more data ", function () {
                it('should return a Reference object that is defined.', function () {
                    reference2 = page1.next;
                    expect(reference2).toEqual(jasmine.any(Object));
                });

                it('read should return a Page object that is defined.', function(done) {
                    reference2.read(limit).then(function (response) {
                        page2 = response;

                        expect(page2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                    }
                });
            });

            describe("Previous with more data", function() {

                it('previous should return a Reference object that is defined.', function() {
                    reference3 = page2.previous;
                    expect(reference3).toEqual(jasmine.any(Object));

                });

                it('read should return a Page object that is defined.', function(done) {
                    reference3.read(limit).then(function (response) {
                        page3 = response;

                        expect(page3).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["value x"]).toBeLessThan(tuples[i+1]._data["value x"]);
                    }
                });
            });
        });

        describe("Paging with sort based on foreignkey with null data ", function () {
            // reference_schema_paging_table_no_sort_fk1
            var fkHash = "bITRC1H37ph9chTodns5cw";
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
                      tableNameNoSort + "@sort(" + fkHash + ",value%20x)";

            var page, newRef;
            beforeAll(function (done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (ref) {
                    return ref.read(5);
                }).then(function (res) {
                    page = res;
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            describe ("Next with more data ", function () {
                it ("should return a reference with correct url.", function () {
                    newRef = page.next;
                    // the last row has "value x": 17 and "fk_col": null
                    expect(newRef.location.uri).toEqual(uri + "@after(::null::,17)");
                });

                it ("tuples should be on the expected order.", function (done) {
                    newRef.read(5).then(function (res) {
                        page = res;
                        expect(page.tuples.length).toEqual(5, "length missmatch.");
                        expect(page.tuples[0].data['value x']).toEqual(19,"data missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });

            describe ("Previous with more data ", function () {
                it ("should return a reference with correct url.", function () {
                    // this is the page from the page.next
                    newRef = page.previous;

                    // the first row has "value x": 19 and "fk_col": null
                    expect(newRef.location.uri).toEqual(uri + "@before(::null::,19)");
                });

                it ("tuples should be on the expected order.", function (done) {
                    newRef.read(5).then(function (page) {
                        expect(page.tuples.length).toEqual(5, "length missmatch.");
                        expect(page.tuples[0].data['value x']).toEqual(1,"data missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });
        });

        describe("Paging with sort based on columns with column_order annotation.", function () {

            describe("for normal columns, ", function () {
                testNextPrevious(
                    tableNoSortUri + "@sort(col_w_order)@after(04,23)",
                    5, "id x",
                    ["02", "01", "10", "05", "04"], //previous
                    ["16", "09", "03", "08", "15",], //current
                    ["07", "14", "06", "12", "13"]  //next
                );
            });

            describe("for pseudo columns, ", function () {
                testNextPrevious(
                    tableNoSortUri + "@sort(reference_schema_paging_table_no_sort_fk2,id%20x)@after(23,Harry,05)",
                    5, "id x",
                    ["11", "02", "01", "10", "05"], //previous
                    ["04", "16", "09", "03", "08",], //current
                    ["15", "07", "14", "06", "12"]  //next
                );
            });
        });

        describe("when there are duplicate column names in the sort criteria, ", function () {
            testNextPrevious(
                tableNoSortUri + "@sort(reference_schema_paging_table_no_sort_fk2,id%20x,reference_schema_paging_table_no_sort_fk2)@after(23,Harry,05)",
                5, "id x",
                ["11", "02", "01", "10", "05"], //previous
                ["04", "16", "09", "03", "08",], //current
                ["15", "07", "14", "06", "12"]  //next
            );
        });

        // Test Cases:
        describe("Sorting, ", function() {
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableNameNoSort + "@sort(name%20x,id%20x)";

            var reference1, reference2, reference3, tuples;
            var page1, page2, page3;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference1 = response;

                    expect(reference1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference1.read(limit).then(function (response) {
                    page1 = response;

                    expect(page1).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted by name column ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["name x"]).toBeLessThan(tuples[i+1]._data["name x"]);
                }
            });

            describe("Next with more data", function() {

                it('next should return a Reference object that is defined.', function() {
                    reference2 = page1.next;
                    expect(reference2).toEqual(jasmine.any(Object));

                });

                it('read should return a Page object that is defined.', function(done) {
                    reference2.read(limit).then(function (response) {
                        page2 = response;

                        expect(page2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["name x"]).toBeLessThan(tuples[i+1]._data["name x"]);
                    }
                });

            });

        });


        describe("setSamePaging, ", function () {
            var baseUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":";
            var refUri = baseUri + tableNameInboundRelated + "@sort(id)",
                refUriWithoutSort = baseUri + tableNameInboundRelated,
                refUriJoin = baseUri + "reference_table/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)";

            var currRef, newRef;

            var testUri = function (done, uri, limit, afterObject, beforeObject) {
                options.ermRest.resolve(uri).then(function (ref) {
                    return ref.read(limit);
                }).then(function (page) {
                    newRef = currRef.setSamePaging(page);
                    expect(newRef.location.beforeObject).toEqual(beforeObject, "beforeObject missmatch.");
                    expect(newRef.location.afterObject).toEqual(afterObject, "afterObject missmatch.");
                    done();
                }).catch(function (err) {
                    done.fail();
                    console.log(err);
                });
            };

            beforeAll(function (done) {
                options.ermRest.resolve(refUriJoin + "/@sort(id)@after(5)@before(20)").then(function (ref) {
                    currRef = ref;
                    done();
                }).catch(function (err) {
                    done.fail();
                    console.log(err);
                });
            });

            it ("should throw an error if reference's table and page's table are not the same.", function (done) {
                options.ermRest.resolve(baseUri + tableNameReference).then(function (ref) {
                    return ref.read(2);
                }).then(function (page) {
                    expect(function () {
                        newRef = currRef.setSamePaging(page);
                    }).toThrow("Given page is not from the same table.");
                    done();
                }).catch(function (err) {
                    done.fail();
                    console.log(err);
                });
            });

            describe("if page didn't have any extra data, ", function () {
                it ("if page didn't have any paging options should return a reference without any page setting.", function (done) {
                    testUri(done, refUri, 25, null, null);
                });

                it ("if page had before, should return a reference with before.", function (done) {
                    testUri(done, refUri + "@before(6)", 5, null, ["6"]);
                });

                it ("if page had after, should return a reference with after.", function (done) {
                    testUri(done, refUri + "@after(96)", 5, ["96"], null);
                });

                // NOTE: based on current implementation, page cannot have both before and after
            });

            describe("if page had extra data, ", function () {
                it ("if page didn't have any paging options should return a reference with before.", function (done) {
                    testUri(done, refUri, 5, null, ["6"]);
                });

                it ("if page had before, should return a reference with same before and new after.", function (done) {
                    testUri(done, refUri + "@before(7)", 5, ["1"], ["7"]);
                });

                it ("if page had after, should return a reference with same after and new before.", function (done) {
                    testUri(done, refUri + "@after(5)", 5, ["5"], ["92"]);
                });

                // NOTE: based on current implementation, page cannot have both before and after
            });

            it ("if page had search, it should change the search accordingly.", function (done) {
                options.ermRest.resolve(baseUri + tableNameInboundRelated + "@sort(id)").then(function (ref) {
                    ref = ref.search("9");
                    return ref.read(5);
                }).then(function (page) {
                    newRef = currRef.setSamePaging(page);
                    expect(newRef.location.beforeObject).toEqual(null, "beforeObject missmatch.");
                    expect(newRef.location.afterObject).toEqual(null, "afterObject missmatch.");
                    expect(newRef.location.searchTerm).toEqual("9", "searchTerm missmatch.");
                    done();
                }).catch(function (err) {
                    done.fail();
                    console.log(err);
                });
            });


            describe("when page is sorted based on foreignkey column, ", function () {
                var url = refUriWithoutSort + "@sort(reference_schema_fromname_fk_inbound_related_to_reference)";
                it ("if page didn't have any paging options should return a reference with before.", function (done) {
                    testUri(done, url, 5, null, ["9005", "6"]); // since the fk value is not the key, its appending the shortestkey
                });

                it ("if page had before, should return a reference with same before and new after.", function (done) {
                    testUri(done, url + "@before(9005,7)", 5, ["9001", "1"], ["9005", "7"]);
                });

                it ("if page had after, should return a reference with same after and new before.", function (done) {
                    testUri(done, url + "@after(9003,3)", 5, ["9003", "3"], ["9005", "9"]);
                });
            });
        });

    });

    function testNextPrevious (uri, limit, idCol, prevExpectedIds, expectedIds, nextExpectedIds) {
        var page;
        it ('read should handle having sort and paging in the url.', function (done) {
            options.ermRest.resolve(uri, {cid: "test"}).then(function (ref) {
                return ref.read(limit);
            }).then(function (res) {
                page = res;

                expect(page.tuples.length).toBe(expectedIds.length, "length missmatch.");
                expect(page.tuples.map(function (t) {
                    return t.data[idCol];
                })).toEqual(expectedIds, "data missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ('next should return the correct reference.', function (done) {
            page.next.read(limit).then(function (p) {
                expect(p.tuples.length).toBe(nextExpectedIds.length, "length missmatch for next.");
                expect(p.tuples.map(function (t) {
                    return t.data[idCol];
                })).toEqual(nextExpectedIds, "data missmatch for next.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("previous shoudl return the correct reference.", function (done) {
            page.previous.read(limit).then(function (p) {
                expect(p.tuples.length).toBe(prevExpectedIds.length, "length missmatch for previous.");
                expect(p.tuples.map(function (t) {
                    return t.data[idCol];
                })).toEqual(prevExpectedIds, "data missmatch for previous.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });
    }
};
