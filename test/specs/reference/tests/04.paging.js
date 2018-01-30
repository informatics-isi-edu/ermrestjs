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

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length === 10);
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
                //TODO systems_cols_test we're sorting based on id..
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

                it('tuples should be sorted by ascending id by default. ', function() {
                    tuples = page3.tuples;
                    expect(tuples.length === 10);
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
            var uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
                      tableNameNoSort + "@sort(reference_schema_paging_table_no_sort_fk1,value%20x)";

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
                refUriJoin = baseUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)";

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
        });

    });
};
