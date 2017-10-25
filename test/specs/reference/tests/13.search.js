exports.execute = function (options) {

    describe("Reference Search,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "search parser",
            path = "M:=reference_schema:search%20parser/",
            intRegexPrefix = floatRegexPrefix = "^(.*[^0-9.])?0*",
            intRegexSuffix = "([^0-9].*|$)";

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;

        var reference1, reference2, reference3, reference4;

        // Specific to this table definition (paging table w sort) because of hard coded column names
        var matchInAnyColumn = function(tuple, valueToMatch) {
            return (tuple._data["name x"].match(valueToMatch) || tuple._data["id x"].match(valueToMatch) || (tuple._data["value x"] && tuple._data["value x"] == valueToMatch) || (tuple._data["decimal x"] && ("" + tuple._data["decimal x"]).includes(valueToMatch)));
        }

        beforeAll(function(done) {
            options.ermRest.resolve(multipleEntityUri, {cid:"test"}).then(function(response) {
                reference1 = response;
                done();
            },function (err) {
                console.dir(err);
                done.fail();
            });
        });

        // Test Cases:
        describe('Reference.search() method, ', function() {
            var page, tuples, searchTerm;
            var limit = 20;

            it('search() using a single term. ', function(done) {
                reference2 = reference1.search("hank");
                expect(reference2.location.searchTerm).toBe("hank");

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(2);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(tuples[i]._data["name x"]).toMatch("Hank");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('clear search. ', function(done) {
                reference2 = reference1.search();
                expect(reference2.location.searchTerm).toBeNull();
                expect(reference2.location.facets).not.toBeDefined();

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(20);

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('search() using conjunction of words. ', function(done) {
                reference2 = reference1.search("\"hank\" 11");
                expect(reference2.location.searchTerm).toBe("\"hank\" 11", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::hank&*::ciregexp::" +  options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "11" + intRegexSuffix) + "/$M", 
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(tuples[i]._data["name x"]).toMatch("Hank");
                        expect(tuples[i]._data["id x"]).toMatch("11");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("search() based on integer value with matching in text and integer columns. ", function(done) {
                // values with `id x` between 21 and 34 are specifically for this case
                // `id x` == 21-25, 27, and 28 should all match; 26, 29-34 are negative cases
                // rows with `name x` == "int" are notating that the int value is what is being tested for
                searchTerm = "1";
                reference2 = reference1.search(searchTerm);
                expect(reference2.location.searchTerm).toBe(searchTerm, "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + searchTerm + intRegexSuffix) + "/$M", 
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    //expect(tuples.length).toBe(16);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(matchInAnyColumn(tuples[i], searchTerm)).toBeTruthy();
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("search() with float value '11.1' with matching in text and float columns. ", function(done) {
                // values with `id x` between 35 and 40 are specifically for this case
                // `id x` == 35-38, should all match;  39 and 40 are negative cases
                searchTerm = "11.1";
                reference2 = reference1.search(searchTerm);
                expect(reference2.location.searchTerm).toBe(searchTerm, "searchTerm missmatch.");
                // Can't use searchTerm in the encode function because the term has to be regular expression encoded first, '\' is the regex escape character
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(floatRegexPrefix + "11\\.1") + "/$M", 
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(4);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(matchInAnyColumn(tuples[i], searchTerm)).toBeTruthy();
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("search() with float value '11.' with matching in text and float columns. ", function(done) {
                // values with `id x` between 41 and 46 are specifically for this case
                // `id x` == 35-38 and 41-44, should all match; 45 and 46 are negative cases
                // this is similar to the previous case that tests `11.1` and should match those positive cases as well
                searchTerm = "11.";
                reference2 = reference1.search(searchTerm);
                expect(reference2.location.searchTerm).toBe(searchTerm, "searchTerm missmatch.");
                // Can't use searchTerm in the encode function because the term has to be regular expression encoded first, '\' is the regex escape character
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(floatRegexPrefix + "11\\.") + "/$M",
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(8);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(matchInAnyColumn(tuples[i], searchTerm)).toBeTruthy();
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("search() with float value '.1' with matching in text and float columns. ", function(done) {
                // values with `id x` between 47 and 52 are specifically for this case
                // `id x` == 47-50 should all match; 51 and 52 are negative cases
                searchTerm = ".1";
                reference2 = reference1.search(searchTerm);
                expect(reference2.location.searchTerm).toBe(searchTerm, "searchTerm missmatch.");
                // Can't use searchTerm in the encode function because the term has to be regular expression encoded first, '\' is the regex escape character
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(floatRegexPrefix + "\\.1") + "/$M", 
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(4);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(matchInAnyColumn(tuples[i], searchTerm)).toBeTruthy();
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });

        describe("search() using quotation marks", function() {
            var page, tuples,
                limit = 20;

            it("with a full set of quotation marks.", function(done) {
                reference2 = reference1.search("\"harold\"");
                expect(reference2.location.searchTerm).toBe("\"harold\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::harold" + "/$M",
                    "ermrestCompactPath missmatch."
                );

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
                reference2 = reference1.search("\" william \"");
                expect(reference2.location.searchTerm).toBe("\" william \"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::%20william%20" + "/$M",
                    "ermrestCompactPath missmatch."
                );

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
                reference2 = reference1.search("\"wallace II\"");
                expect(reference2.location.searchTerm).toBe("\"wallace II\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::wallace%20II" + "/$M",
                    "ermrestCompactPath missmatch."
                );

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
                reference2 = reference1.search("\"wallace\" \"II\"");
                expect(reference2.location.searchTerm).toBe("\"wallace\" \"II\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::wallace&*::ciregexp::II" + "/$M",
                    "ermrestCompactPath missmatch."
                );

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
                // searching for integer values converts them into a regular expressio
                reference2 = reference1.search("\"william\" \"17\"");
                expect(reference2.location.searchTerm).toBe("\"william\" \"17\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::william&*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "17" + intRegexSuffix) + "/$M",
                    "ermrestCompactPath missmatch."
                );

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
                reference2 = reference1.search("\"wallace|II\"");
                expect(reference2.location.searchTerm).toBe("\"wallace|II\"");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::wallace%7CII" + "/$M", 
                    "ermrestCompactPath missmatch.");

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
                reference2 = reference1.search("\"harold");
                expect(reference2.location.searchTerm).toBe("\"harold", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::harold" + "/$M",
                    "ermrestCompactPath missmatch."
                );

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
            var searchFacet = {"and": [{"source": "*", "search": ["hank 11"]}]}
            
            beforeAll(function (done) {
                var searchEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                    + tableName + "/*::facets::" + options.ermRest.encodeFacet(searchFacet);
                    
                options.ermRest.resolve(searchEntityUri, {cid:"test"}).then(function(response) {
                    reference3 = response;
                    done();
                },function (err) {
                    console.dir(err);
                    done.fail();
                });
            })
            
            it('location should have correct search parameters ', function() {
                expect(reference3.location.searchTerm).toBe("hank 11", "searchTerm missmatch.");
                expect(reference3.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::hank" + "&" + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "11" + intRegexSuffix) + "/$M",
                    "ermrestCompactPath missmatch."
                );
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
