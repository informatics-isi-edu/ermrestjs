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

    describe("For paging with previous and next,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableNameNoSort = "paging_table_no_sort",
            tableNameWSort = "paging_table_w_sort";

        describe('page size, ', function() {
            var limit = 5,
                detailedLimit = 6,
                defaultLimit = 1,
                uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableNameWSort;

            var reference, contextualizedReference;

            beforeAll(function (done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function(response) {
                    reference = response;
                    contextualizedReference = response.contextualize.detailed;
                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                })
            });

            it('should be the value that is defined in read() function', function(done) {
                contextualizedReference.read(limit).then(function(response){
                    expect(response._data.length).toBe(limit);
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('should use the value defined in `page_size` in Table Display annotation when `limit` in read() is not defined.', function() {
                contextualizedReference.read().then(function(response){
                    expect(response._data.length).toBe(detailedLimit);
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('should use default value(1) when `limit` in read() and `page_size` in Table Display annotation are not defined.', function() {
                reference.read().then(function(response){
                    expect(response._data.length).toBe(defaultLimit);
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });


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
                        + tableNameNoSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data.value).toBeLessThan(tuples[i+1]._data.value);
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
                            + tableNameNoSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data.value).toBeLessThan(tuples[i+1]._data.value);
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
                    tuples = page2.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data.value).toBeLessThan(tuples[i+1]._data.value);
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
                        + tableNameWSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
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
                    expect(tuples.length).toBe(6);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameWSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
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
                    tuples = page2.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameWSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
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
                + tableNameNoSort + "/value::lt::1000@sort(value)";

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
                        + tableNameNoSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                    expect(tuples[i]._data.value).toBeLessThan(tuples[i+1]._data.value);
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
                            + tableNameNoSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data.value).toBeLessThan(tuples[i+1]._data.value);
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
                    tuples = page2.tuples;
                    expect(tuples.length === 10);
                    var shortestkey = tuples[0].reference._shortestKey[0].name; // only 1 column
                    for(var i = 0; i < tuples.length - 1; i++) {
                        expect(tuples[i].reference._location.uri).toBe(
                            options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                            + tableNameNoSort + "/" + shortestkey + "=" + tuples[i]._data[shortestkey]);
                        expect(tuples[i]._data.value).toBeLessThan(tuples[i+1]._data.value);
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

        // Test Cases:
        describe('Start with whole table and read first 10 rows', function() {


        });




    });
};
