var utils = require('./../../../utils/utilities.js');

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

        var createURL = function (tableName, facet) {
            var res =  options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
            if (facet) {
                res += "/*::facets::" + options.ermRest.encodeFacet(facet);
            }
            return res;
        }

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

            it("length should return number of returned data.", function () {
                expect(page1.length).toBe(10);
            });

            it('tuples should be sorted by ascending value of shortestkey by default. ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["RID"]).toBeLessThan(tuples[i+1]._data["RID"]);
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

                it("length should return number of returned data.", function () {
                    expect(page2.length).toBe(6);
                });

                it('tuples should be sorted by ascending value of shortestkey by default. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["RID"]).toBeLessThan(tuples[i+1]._data["RID"]);
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

                it("length should return number of returned data.", function () {
                    expect(page3.length).toBe(10);
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length).toBe(10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["RID"]).toBeLessThan(tuples[i+1]._data["RID"]);
                    }
                });
            });

            // limit was changed after paging back
            describe("with navigating back to the first page,", function() {
                var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableNameNoSort + "@sort(value%20x,RID)@before(33,ZZZZZ)?limit=" + limit;
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

                it("read with an increased limit and dontCorrectPage should return a Page object that is defined and honors the paging.", function(done) {
                    reference5.read(15, {}, false, true).then(function (response) {
                        expect(response).toEqual(jasmine.any(Object));
                        expect(response.tuples.length).toBe(11);
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

                        expect(increasedLimitPage).toEqual(jasmine.any(Object), "invalid page object");
                        expect(increasedLimitPage.length).toBe(increasedLimit, "length missmatch")
                        expect(increasedLimitPage.tuples.length).toBe(increasedLimit, "tuples length missmatch");

                        increasedLimitPreviousReference = increasedLimitPage.previous;
                        expect(increasedLimitPreviousReference).toBe(null, "previous missmatch");

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

                        expect(decreasedLimitPage).toEqual(jasmine.any(Object), "invalid page object");
                        expect(decreasedLimitPage.length).toBe(decreasedLimit, "length missmatch");
                        expect(decreasedLimitPage.tuples.length).toBe(decreasedLimit, "tuples length missmatch");

                        decreasedLimitPreviousReference = decreasedLimitPage.previous;
                        expect(decreasedLimitPreviousReference).toBe(null, "previous missmatch");

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

            it("length should return number of returned data.", function () {
                expect(page1.length).toBe(10);
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

                it("length should return number of returned data.", function () {
                    expect(page2.length).toBe(10);
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

                it("length should return number of returned data.", function () {
                    expect(page3.length).toBe(10);
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
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

            it("length should return number of returned data.", function () {
                expect(page1.length).toBe(10);
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

                it("length should return number of returned data.", function () {
                    expect(page2.length).toBe(6);
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

                it("length should return number of returned data.", function () {
                    expect(page3.length).toBe(10);
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length).toBe(10);
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

            it("length should return number of returned data.", function () {
                expect(page1.length).toBe(10);
            });

            it('tuples should be sorted by ascending id by default. ', function() {
                tuples = page1.tuples;
                expect(tuples.length).toBe(10);
                var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i].reference._location.uri).toBe(
                        options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                        + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data["RID"]).toBeLessThan(tuples[i+1]._data["RID"]);
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

                it("length should return number of returned data.", function () {
                    expect(page2.length).toBe(6);
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page2.tuples;
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["RID"]).toBeLessThan(tuples[i+1]._data["RID"]);
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

                it("length should return number of returned data.", function () {
                    expect(page3.length).toBe(10);
                });

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length).toBe(10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + encodeURIComponent(shortestkey) + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data["RID"]).toBeLessThan(tuples[i+1]._data["RID"]);
                    }
                });
            });
        });

        describe("Paging with sort based on foreignkey with null data ", function () {
            // reference_schema_paging_table_no_sort_fk1
            var fkHash = "SgqbHJAVFJyKddPY93Eq-w";
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
                        expect(page.length).toBe(5, "length missmatch");
                        expect(page.tuples.length).toEqual(5, "tuples length missmatch.");
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
                        expect(page.length).toBe(5, "length missmatch");
                        expect(page.tuples.length).toEqual(5, "tuples length missmatch.");
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

            // for refUri:
            //   - use 85 as limit for inbound_related_reference_table
            //   - set is ordered based on id in inbound_related_reference_table
            //   - ordered 1, 2, 3, 3xxxxxxxxxx, ..., 4, ..., 9, 91, 9x
            describe("if page didn't have any extra data, ", function () {
                it ("if page didn't have any paging options should return a reference without any page setting.", function (done) {
                    testUri(done, refUri, 85, null, null);
                });

                it ("if page had before, should return a reference with before.", function (done) {
                    // only 9 records after "id=9", so before should be 85 total rows - (9 after + id=9 itself), hence read with limit=75
                    testUri(done, refUri + "@before(9)", 75, null, ["9"]);
                });

                it ("if page had after, should return a reference with after.", function (done) {
                    testUri(done, refUri + "@after(96)", 5, ["96"], null);
                });

                // NOTE: based on current implementation, page cannot have both before and after
            });

            describe("if page had extra data, ", function () {
                it ("if page didn't have any paging options should return a reference with before.", function (done) {
                    testUri(done, refUri, 75, null, ["9"]);
                });

                it ("if page had before, should return a reference with same before and new after.", function (done) {
                    testUri(done, refUri + "@before(91)", 5, ["4"], ["91"]);
                });

                it ("if page had after, should return a reference with same after and new before.", function (done) {
                    testUri(done, refUri + "@after(5)", 5, ["5"], ["92"]);
                });

                // NOTE: based on current implementation, page cannot have both before and after
            });

            it ("if page had search, it should change the search accordingly.", function (done) {
                // same comment above as refUri, has 85 rows in table inbound_related_reference_table
                options.ermRest.resolve(baseUri + tableNameInboundRelated + "@sort(id)").then(function (ref) {
                    //this might match the values or RID, therefore we are reading all the existing rows
                    ref = ref.search("9");
                    return ref.read(85);
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

            describe("regarding facets, ", function () {
                var refWFacet1, refWFacet2, refWOFacet, pageWFacet1, pageWFacet2, pageWOFacet, mainTableRID;

                beforeAll(function (done) {
                    mainTableRID = {
                        "9004": utils.findEntityRID(options, schemaName, tableNameReference, "id", "9004"),
                        "9005": utils.findEntityRID(options, schemaName, tableNameReference, "id", "9005"),
                        "9006": utils.findEntityRID(options, schemaName, tableNameReference, "id", "9006")
                    };

                    var facet1 = {
                        "and": [
                            {"source": "*", "search": ["9"]},
                            {"source": [{"outbound": ["reference_schema", "hidden_fk_inbound_related_to_reference"]}, "RID"], "choices": [mainTableRID["9006"]]},
                            {"source": [{"outbound": ["reference_schema", "fromname_fk_inbound_related_to_reference"]}, "RID"], "choices": [mainTableRID["9005"]]}
                        ]
                    };
                    var facet2 = {
                        "and": [
                            {"source": [{"outbound": ["reference_schema", "fromname_fk_inbound_related_to_reference"]}, "RID"], "choices": [mainTableRID["9004"]]}
                        ]
                    };

                    options.ermRest.resolve(createURL(tableNameInboundRelated) + "@sort(id)").then(function (ref1) {
                        refWOFacet = ref1;
                        return refWOFacet.read(40);
                    }).then (function (page1) {
                        pageWOFacet = page1;
                        return options.ermRest.resolve(createURL(tableNameInboundRelated, facet1) + "@sort(id)");
                    }).then(function (ref2) {
                        refWFacet1 = ref2;
                        return refWFacet1.read(40);
                    }).then(function (page2) {
                        pageWFacet1 = page2;
                        return options.ermRest.resolve(createURL(tableNameInboundRelated, facet2) + "@sort(id)");
                    }).then(function (ref3) {
                        refWFacet2 = ref3;
                        return refWFacet2.read(40);
                    }).then (function (page3) {
                        pageWFacet2 = page3;
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("if the main reference has a facet, the returned reference must have it too.", function () {
                    var ref = refWFacet1.setSamePaging(pageWOFacet);
                    var expectedPath = [
                        "M:=reference_schema:inbound_related_reference_table",
                        "*::ciregexp::%5E%28.%2A%5B%5E0-9.%5D%29%3F0%2A9%28%5B%5E0-9%5D.%2A%7C%24%29/$M",
                        "(fk_to_reference_hidden)=(reference_schema:reference_table:id)/RID=" + mainTableRID["9006"] + "/$M",
                        "(fk_to_reference_with_fromname)=(reference_schema:reference_table:id)/RID=" + mainTableRID["9005"] + "/$M"
                    ].join("/");
                    expect(ref.location.ermrestCompactPath).toEqual(expectedPath);
                });

                it ("if the main reference doesn't have facet, but the page has, the returned reference must have it too.", function () {
                    var ref = refWOFacet.setSamePaging(pageWFacet2);
                    var expectedPath = [
                        "M:=reference_schema:inbound_related_reference_table",
                        "(fk_to_reference_with_fromname)=(reference_schema:reference_table:id)/RID=" + mainTableRID["9004"] + "/$M"
                    ].join("/");
                    expect(ref.location.ermrestCompactPath).toEqual(expectedPath);
                });

                it ("if both the main reference and page have facets, the retuerned reference must have all the facets.", function () {
                    var ref = refWFacet1.setSamePaging(pageWFacet2);
                    var expectedPath = [
                        "M:=reference_schema:inbound_related_reference_table",
                        "*::ciregexp::%5E%28.%2A%5B%5E0-9.%5D%29%3F0%2A9%28%5B%5E0-9%5D.%2A%7C%24%29/$M",
                        "(fk_to_reference_hidden)=(reference_schema:reference_table:id)/RID=" + mainTableRID["9006"] + "/$M",
                        "(fk_to_reference_with_fromname)=(reference_schema:reference_table:id)/RID=" + mainTableRID["9005"] + "/$M",
                        "(fk_to_reference_with_fromname)=(reference_schema:reference_table:id)/RID=" + mainTableRID["9004"] + "/$M"
                    ].join("/");
                    expect(ref.location.ermrestCompactPath).toEqual(expectedPath);
                });
            });


            describe("when page is sorted based on foreignkey column, ", function () {
                // since the shoretestkey is going to be RID, we cannot know its value therefore, the test case
                // is sorting based on fk value and a key value.
                var url = refUriWithoutSort + "@sort(reference_schema_fromname_fk_inbound_related_to_reference,id)";
                it ("if page didn't have any paging options should return a reference with before.", function (done) {
                    testUri(done, url, 3, null, ["9004", "4"]);
                });

                it ("if page had before, should return a reference with same before and new after.", function (done) {
                    testUri(done, url + "@before(9005,93)", 5, ["9005", "6"], ["9005", "93"]);
                });

                it ("if page had after, should return a reference with same after and new before.", function (done) {
                    testUri(done, url + "@after(9005,8)", 5, ["9005", "8"], ["9005", "95"]);
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

                expect(page.length).toBe(expectedIds.length, "length missmatch.");
                expect(page.tuples.length).toBe(expectedIds.length, "tuples length missmatch.");
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
                expect(page.length).toBe(nextExpectedIds.length, "length missmatch for next.");
                expect(p.tuples.length).toBe(nextExpectedIds.length, "tuples length missmatch for next.");
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
                expect(p.length).toBe(prevExpectedIds.length, "length missmatch for previous.");
                expect(p.tuples.length).toBe(prevExpectedIds.length, "tuples length missmatch for previous.");
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
