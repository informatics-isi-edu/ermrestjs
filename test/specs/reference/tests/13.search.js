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
                reference2 = reference1.search("hanks");
                expect(reference2.location.searchTerm).toBe("hanks", "searchTerm missmatch.");

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object), "page is not an object");

                    tuples = page.tuples;
                    expect(tuples.length).toBe(2, "tuple length missmatch");
                    for(var i = 0; i < tuples.length; i++) {
                        expect(tuples[i]._data["name x"]).toMatch("Hanks", "name x missmatch for tuple " + i);
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('clear search. ', function(done) {
                reference2 = reference1.search();
                expect(reference2.location.searchTerm).toBeNull("searchTerm missmatch.");
                expect(reference2.location.facets).not.toBeDefined("facets missmatch.");

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object), "page is not an object.");

                    tuples = page.tuples;
                    expect(tuples.length).toBe(20, "tuple length missmatch.");

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('search() using conjunction of words. ', function(done) {
                reference2 = reference1.search("\"hanks\" 111111");
                expect(reference2.location.searchTerm).toBe("\"hanks\" 111111", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::hanks&*::ciregexp::" +  options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "111111" + intRegexSuffix) + "/$M",
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var i = 0; i < tuples.length; i++) {
                        expect(tuples[i]._data["name x"]).toMatch("Hanks", "name x missmatch for tuple " + i);
                        expect(tuples[i]._data["id x"]).toMatch("111111", "id x missmatch for tuple " + i);
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
                searchTerm = "11111";
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
                    expect(tuples.length).toBe(16, "length missmatch");
                    for(var i = 0; i < tuples.length; i++) {
                        expect(matchInAnyColumn(tuples[i], searchTerm)).toBeTruthy("didn't match the columns for tuple " + i);
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
                reference2 = reference1.search("\"wallace VIIII\"");
                expect(reference2.location.searchTerm).toBe("\"wallace VIIII\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::wallace%20VIIII" + "/$M",
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1);
                    for(var j=0; j<tuples.length; j++) {
                        expect(tuples[j]._data["name x"]).toMatch("Wallace VIIII");
                    }

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with multiple quoted terms split by a space.", function(done) {
                reference2 = reference1.search("\"wallace\" \"VIIII\"");
                expect(reference2.location.searchTerm).toBe("\"wallace\" \"VIIII\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::wallace&*::ciregexp::VIIII" + "/$M",
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
                reference2 = reference1.search("\"william\" \"171717\"");
                expect(reference2.location.searchTerm).toBe("\"william\" \"171717\"", "searchTerm missmatch.");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::william&*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "171717" + intRegexSuffix) + "/$M",
                    "ermrestCompactPath missmatch."
                );

                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    tuples = page.tuples;
                    expect(tuples.length).toBe(1, "length missmatch.");
                    expect(tuples[0]._data["name x"]).toEqual("Steven William Jones", "name x missmatch");

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("with multiple quoted terms split by a '|'.", function(done) {
                reference2 = reference1.search("\"wallace|VIIII\"");
                expect(reference2.location.searchTerm).toBe("\"wallace|VIIII\"");
                expect(reference2.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::wallace%7CVIIII" + "/$M",
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
            var searchFacet = {"and": [{"sourcekey": "search-box", "search": ["hanks 111111"]}]}

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
                expect(reference3.location.searchTerm).toBe("hanks 111111", "searchTerm missmatch.");
                expect(reference3.location.ermrestCompactPath).toBe(
                    path + "*::ciregexp::hanks" + "&" + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "111111" + intRegexSuffix) + "/$M",
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
                    expect(tuples[i]._data["id x"]).toMatch("111111");
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

    describe("regarding custom search feature", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableNameDefaultSearch = "search parser",
            tableNameCustomSearchInvalid = "table_w_custom_search_invalid",
            tableNameCustomSearch1 = "table_w_custom_search_1",
            searchTerm = "term";

        var searchFacet = {"and": [{"sourcekey": "search-box", "search": ["term"]}]};

        var createURL = function (table) {
            return options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + table;
        }

        var multipleEntityDefaultSearchUri = createURL(tableNameDefaultSearch),
            multipleEntityCustomSearchInvalidUri = createURL(tableNameCustomSearchInvalid),
            multipleEntityCustomSearch1Uri = createURL(tableNameCustomSearch1);

        var testCustomSearchAPIs = function (uri, expectedColumnNames, expectedColumnDisplaynames, done) {
            options.ermRest.resolve(uri, {cid: "test"}).then(function (ref) {
                if (expectedColumnNames === false) {
                    expect(ref.table.searchSourceDefinition).toBe(false, "searchSourceDefinition missmatch.");
                    expect(ref.searchColumns).toBe(false, "searchColumns missmatch.");
                } else {
                    var searchDef = ref.table.searchSourceDefinition;
                    expect(searchDef.length).toBe(expectedColumnNames.length, "def length missmatch");
                    expect(searchDef.map(function (sd) {
                        return sd.column.name;
                    })).toEqual(expectedColumnNames, "name missmatch");

                    var searchColumns = ref.searchColumns;
                    expect(searchColumns.length).toBe(expectedColumnDisplaynames.length, "columns length missmatch");
                    expect(searchColumns.map(function (sd) {
                        return sd.displayname.value;
                    })).toEqual(expectedColumnDisplaynames, "name missmatch");
                }

                done();
            }).catch(function (err) {
                done.fail(err);
            });
        }

        var testCustomSearchReference = function (ref, done) {
            expect(ref.location.searchTerm).toBe(searchTerm, "searchTerm missmatch.");
            expect(ref.location.ermrestCompactPath).toBe(
                "M:=" + schemaName + ":" + tableNameCustomSearch1 + "/search_col_2::ciregexp::" + searchTerm + ";search_col_1::ciregexp::" + searchTerm +"/$M",
                "ermrestCompactPath missmatch."
            );

            ref.read(5).then(function (page) {
                expect(page.length).toBe(2, "length missmatch");
                expect(page.tuples.map(function (t) {
                    return tuples.values['id'];
                })).toBe(["02", "03"])
            })
        };

        describe("Table.searchSourceDefinition and Reference.searchColumns, ", function () {
            it ("should return false if search-box source definition is missing.", function (done) {
                testCustomSearchAPIs(multipleEntityDefaultSearchUri, false, false, done);
            });

            it ("should return false if all the defined columns are invalid.", function (done) {
                testCustomSearchAPIs(multipleEntityCustomSearchInvalidUri, false, false, done);
            });

            it ("should return the valid columns.", function (done) {
                testCustomSearchAPIs(
                    multipleEntityCustomSearch1Uri,
                    ["search_col_2", "search_col_1"],
                    ["<strong>some name</strong>", "search_col_1"],
                    done
                );
            });
        });

        describe("reference.search() method when custom search is defined, ", function () {
            it ("location should return the correct urls, and read should return the correct results.", function () {
                options.ermRest.resolve(multipleEntityCustomSearch1Uri, {cid: "test"}).then(function (ref) {
                    testCustomSearchReference(ref.search(searchTerm), done);
                }).catch(function (err) {
                    done.fail(err);
                })
            });
        });

        describe("reference with search in uri when custom search is defined, ", function () {
            it ("location should return the correct urls, and read should return the correct results.", function () {
                options.ermRest.resolve(multipleEntityCustomSearch1Uri + "*::facets::" + options.ermRest.encodeFacet(searchFacet), {cid: "test"}).then(function (ref) {
                    testCustomSearchReference(ref.search(searchTerm), done);
                }).catch(function (err) {
                    done.fail(err);
                })
            });
        })

    });
};
