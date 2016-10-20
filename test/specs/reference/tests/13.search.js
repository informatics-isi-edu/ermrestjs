exports.execute = function (options) {

    describe("Reference Search,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "paging table w sort",
            filter1 = "*::ciregexp::hank",
            filter2 = "*::ciregexp::11";

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName;

        var searchEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName + "/" + filter1 + "&" + filter2;

        var reference1, reference2, reference3, reference4;

        beforeAll(function(done) {
            options.ermRest.resolve(multipleEntityUri, {cid:"test"}).then(function(response) {
                reference1 = response;
                done();
            },function (err) {
                console.dir(err);
                done.fail();
            });

            options.ermRest.resolve(searchEntityUri, {cid:"test"}).then(function(response) {
                reference3 = response;
                done();
            },function (err) {
                console.dir(err);
                done.fail();
            });
        });

        // Test Cases:
        describe('Reference.search() method, ', function() {
            var page, tuples;
            var limit = 20;

            it('search() using a single term. ', function() {
                reference2 = reference1.search("hank");
                expect(reference2.location.searchTerm).toBe("hank");
                expect(reference2.location.searchFilter).toBe(filter1);
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

            it('tuples should have correct row values. ', function() {
                tuples = page.tuples;
                expect(tuples.length).toBe(2);
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data["name x"]).toMatch("Hank");
                }
            });

            it('clear search. ', function() {
                reference2 = reference1.search();
                expect(reference2.location.searchTerm).toBeNull();
                expect(reference2.location.searchFilter).not.toBeDefined();
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

            it('tuples should return all rows. ', function() {
                tuples = page.tuples;
                expect(tuples.length).toBe(16);
            });

            it('search() using conjunction of words. ', function() {
                reference2 = reference1.search("\"hank\" 11");
                expect(reference2.location.searchTerm).toBe("\"hank\" 11");
                expect(reference2.location.searchFilter).toBe(filter1 + "&" + filter2);
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

            it('tuples should have correct row values. ', function() {
                tuples = page.tuples;
                expect(tuples.length).toBe(1);
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data["name x"]).toMatch("Hank");
                    expect(tuples[i]._data["id x"]).toMatch("11");
                }
            });

        });



        describe('Start reference uri with search filters, ', function() {
            var page, tuples;
            var limit = 20;

            it('location should have correct search parameters ', function() {
                expect(reference3.location.searchTerm).toBe("hank 11");
                expect(reference3.location.searchFilter).toBe(filter1 + "&" + filter2);
            });

            it('read should return a Page object that is defined.', function(done) {
                reference3.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should have correct row values. ', function() {
                tuples = page.tuples;
                expect(tuples.length).toBe(1);
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data["name x"]).toMatch("Hank");
                    expect(tuples[i]._data["id x"]).toMatch("11");
                }
            });

            it('clear search. ', function() {
                reference4 = reference3.search();
                expect(reference4.location.searchTerm).toBeNull();
                expect(reference4.location.searchFilter).not.toBeDefined();
            });

            it('read should return a Page object that is defined.', function(done) {
                reference4.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should return all rows. ', function() {
                tuples = page.tuples;
                expect(tuples.length).toBe(16);
            });

        });

    });
};
