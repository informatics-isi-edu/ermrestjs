exports.execute = function (options) {

    describe("Reference Search,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "paging table w sort",
            filter1 = "*::ciregexp::hank",
            // filter2 is a regular expression that will be url encoded.
            filter2 = "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent("(^|[^1-9])0*11([^0-9]|$)");

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
                for(var i = 0; i < tuples.length; i++) {
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
                expect(tuples.length).toBe(20);
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
                for(var i = 0; i < tuples.length; i++) {
                    expect(tuples[i]._data["name x"]).toMatch("Hank");
                    expect(tuples[i]._data["id x"]).toMatch("11");
                }
            });
        });

        describe("search() using quotation marks", function() {
            var page, tuples,
                limit = 20;

            it("with a full set of quotation marks.", function(done) {
                var quotedFilter = "*::ciregexp::harold";

                reference2 = reference1.search("\"harold\"");
                expect(reference2.location.searchTerm).toBe("\"harold\"");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(2);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("Harold");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with quoted whitespace around the search term.", function(done) {
                var quotedFilter = "*::ciregexp::%20william%20";

                reference2 = reference1.search("\" william \"");
                expect(reference2.location.searchTerm).toBe("\" william \"");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("William");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with two words in 1 quoted term.", function(done) {
                var quotedFilter = "*::ciregexp::wallace%20II";

                reference2 = reference1.search("\"wallace II\"");
                expect(reference2.location.searchTerm).toBe("\"wallace II\"");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("Wallace II");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with multiple quoted terms split by a space.", function(done) {
                var quotedFilter = "*::ciregexp::wallace&*::ciregexp::II";

                reference2 = reference1.search("\"wallace\" \"II\"");
                expect(reference2.location.searchTerm).toBe("\"wallace\" \"II\"");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("Wallace");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with multiple quoted terms split by a space across multiple columns.", function(done) {
                // searching for integer values converts them into a regular expression
                var quotedFilter = "*::ciregexp::william&*::ciregexp::" + options.ermRest._fixedEncodeURIComponent("(^|[^1-9])0*17([^0-9]|$)");

                reference2 = reference1.search("\"william\" \"17\"");
                expect(reference2.location.searchTerm).toBe("\"william\" \"17\"");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("William");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with multiple quoted terms split by a '|'.", function(done) {
                var quotedFilter = "*::ciregexp::wallace%7CII";

                reference2 = reference1.search("\"wallace|II\"");
                expect(reference2.location.searchTerm).toBe("\"wallace|II\"");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(2);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("Wallace|II");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("without an ending quote.", function(done) {
                var quotedFilter = "*::ciregexp::harold";

                reference2 = reference1.search("\"harold");
                expect(reference2.location.searchTerm).toBe("\"harold");
                expect(reference2.location.searchFilter).toBe(quotedFilter);

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(2);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("Harold");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });

        describe('Start reference uri with search filters, ', function() {
            var page, tuples;
            var limit = 20;

            it('location should have correct search parameters ', function() {
                expect(reference3.location.searchTerm).toBe("hank (^|[^1-9])0*11([^0-9]|$)");
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
                for(var i = 0; i < tuples.length; i++) {
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
                expect(tuples.length).toBe(20);
            });

        });

    });
};
