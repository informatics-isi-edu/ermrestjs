var utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

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

    var useQuantifiedSyntax = false;
    beforeAll(function() {
        options.ermRest.appLinkFn(appLinkFn);
        useQuantifiedSyntax = options.catalog.features.quantified_value_lists;
    });

    describe("Reference Search,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "search_schema",
            tableName = "search parser",
            path = "M:=search_schema:search%20parser/",
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
                var encodedNumber = options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "111111" + intRegexSuffix);
                expect(reference2.location.ermrestCompactPath).toBe(
                    useQuantifiedSyntax ? `${path}*::ciregexp::all(hanks,${encodedNumber})` : `${path}*::ciregexp::hanks&*::ciregexp::${encodedNumber}`,
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
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + searchTerm + intRegexSuffix),
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
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(floatRegexPrefix + "11\\.1"),
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
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(floatRegexPrefix + "11\\."),
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
                    path + "*::ciregexp::" + options.ermRest._fixedEncodeURIComponent(floatRegexPrefix + "\\.1"),
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
                    path + "*::ciregexp::harold",
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
                    path + "*::ciregexp::%20william%20",
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
                    path + "*::ciregexp::wallace%20VIIII",
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
                    useQuantifiedSyntax ? `${path}*::ciregexp::all(wallace,VIIII)` : `${path}*::ciregexp::wallace&*::ciregexp::VIIII`,
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
                var encodedNumber = options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "171717" + intRegexSuffix);
                expect(reference2.location.ermrestCompactPath).toBe(
                     useQuantifiedSyntax ? `${path}*::ciregexp::all(william,${encodedNumber})` : `${path}*::ciregexp::william&*::ciregexp::${encodedNumber}`,
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
                    path + "*::ciregexp::wallace%7CVIIII",
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
                    path + "*::ciregexp::harold",
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
                var encodedNumber = options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "111111" + intRegexSuffix);
                expect(reference3.location.ermrestCompactPath).toBe(
                    useQuantifiedSyntax ? `${path}*::ciregexp::all(hanks,${encodedNumber})` : `${path}*::ciregexp::hanks&*::ciregexp::${encodedNumber}`,
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
            schemaName = "search_schema",
            tableNameDefaultSearch = "search parser",
            tableNameCustomSearchInvalid = "table_w_custom_search_invalid",
            tableNameCustomSearchPartial = "table_w_custom_search_partial_valid",
            tableNameCustomSearchNullok = "table_w_custom_search_nullok_col",
            tableNameCustomSearchDynamicSelect = "table_w_custom_search_dynamic_select_col",
            tableNameCustomSearchInbound = "table_w_custom_search_multiple_w_inbound",
            tableNameCustomSearchLocalCols = "table_w_custom_search_local_cols",
            tableNameCustomSearchSinglePath = "table_w_custom_search_single_path",
            tableNameCustomSearchSamePrefix = "table_w_custom_search_same_prefix_1",
            tableNameCustomSearchSamePrefix2 = "table_w_custom_search_same_prefix_2",
            tableNameCustomSearchInnerSafe1 = "table_w_custom_search_inner_safe_1",
            tableNameCustomSearchInnerSafe2 = "table_w_custom_search_inner_safe_2",
            searchTerm = "term";

        var searchFacet = {"and": [{"sourcekey": "search-box", "search": ["term"]}]},
            customSearchLocalColsCompactPath = "M:=" + schemaName + ":" + tableNameCustomSearchLocalCols + "/search_col_2::ciregexp::" + searchTerm + ";search_col_1::ciregexp::" + searchTerm,
            customSearchSinglePathCompactPath = "M:=search_schema:table_w_custom_search_single_path/(id)=(search_schema:table_w_custom_search_single_path_vocab_assoc:fk_to_custom_search_2)/(fk_to_vocab)=(search_schema:search_vocab_table:id)/name::ciregexp::term/$M",
            customSearchSamePrefixCompactPath = "M:=search_schema:table_w_custom_search_same_prefix_1/(id)=(search_schema:table_w_custom_search_same_prefix_1_vocab_assoc:fk_to_custom_search_3)/(fk_to_vocab)=(search_schema:search_vocab_table:id)/name::ciregexp::term;second_name::ciregexp::term;third_name::ciregexp::term/$M",
            customSearchInnerSafe1CompactPath = [
                "M:=search_schema:table_w_custom_search_inner_safe_1",
                "M_S1:=(fk_to_vocab)=(search_schema:search_vocab_table:id)/$M",
                "$M_S1/M_S2:=(fk_to_outbound1)=(search_schema:search_vocab_table_outbound1:id)/$M",
                "M_S1:second_name::ciregexp::term;M_S1:third_name::ciregexp::term;M_S2:name::ciregexp::term;main%20name::ciregexp::term;main%20second_name::ciregexp::term"
            ].join("/"),
            customSearchInnerSafe2CompactPath = [
                "M:=search_schema:table_w_custom_search_inner_safe_2",
                "M_S1:=(fk_to_vocab)=(search_schema:search_vocab_table:id)/$M",
                "M_S2:=(fk_to_vocab_2)=(search_schema:search_vocab_table_2:id)/$M",
                "main%20name::ciregexp::term;M_S1:second_name::ciregexp::term;M_S1:name::ciregexp::term;M_S2:name::ciregexp::term"
            ].join("/"),
            customSearchLocalColsResults = ["02", "03"],
            customSearchSinglePathResults = ["02", "04", "05"],
            customSearchSamePrefixResults = ["02", "03", "04", "05", "06"],
            customSearchInnerSafe1Results = ["01", "03", "04", "05", "06"],
            customSearchInnerSafe2Results = ["02", "04", "05", "06"];

        var createURL = function (table, facet) {
            var res = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + table;
            if (facet) {
                res += "/*::facets::" + options.ermRest.encodeFacet(facet);
            }
            return res;
        }

        var defaultSearchReference, invalidSearchColumnReference,  partialInvalidSearchColumnReference,
            customSearchInboundReference, customSearchNullokReference,
            customSearchInnerSafeRereference1, customSearchInnerSafeRereference2,
            customSearchLocalColsReference, customSearchSinglePathReference, customSearchSamePrefixReference;

        var testCustomSearchAPIs = function (ref, expectedColumnNames, expectedColumnDisplaynames) {
            if (expectedColumnNames === false) {
                expect(ref.table.searchSourceDefinition).toBe(false, "searchSourceDefinition missmatch.");
                if (ref.searchColumns && Array.isArray(ref.searchColumns)) {
                    // to ensure it's producing a proper mesasge in the console
                    expect(ref.searchColumns.length).toBe(-1, "searchColumns missmatch.");
                } else {
                    expect(ref.searchColumns).toBe(false, "searchColumns missmatch.");
                }
            } else {
                var searchDef = ref.table.searchSourceDefinition.columns;
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
        }

        var testCustomSearchReference = function (ref, compactPath, result, done) {
            expect(ref.location.searchTerm).toBe(searchTerm, "searchTerm missmatch.");
            expect(ref.location.ermrestCompactPath).toBe(
                compactPath,
                "ermrestCompactPath missmatch."
            );

            ref.read(5).then(function (page) {
                expect(page.length).toBe(result.length, "length missmatch");
                expect(page.tuples.map(function (t) {
                    return t.data['id'];
                })).toEqual(result)

                done();
            }).catch(function (err) {
                done.fail(err);
            })
        };

        beforeAll(function (done) {
            options.ermRest.resolve(createURL(tableNameDefaultSearch), {"cid": "test"}).then(function (ref1) {
                defaultSearchReference = ref1;
                return options.ermRest.resolve(createURL(tableNameCustomSearchInvalid));
            }).then(function (ref2) {
                invalidSearchColumnReference = ref2;
                return options.ermRest.resolve(createURL(tableNameCustomSearchNullok));
            }).then(function (ref3) {
                customSearchNullokReference = ref3;
                return options.ermRest.resolve(createURL(tableNameCustomSearchLocalCols));
            }).then(function (ref4) {
                customSearchLocalColsReference = ref4;
                return options.ermRest.resolve(createURL(tableNameCustomSearchSinglePath));
            }).then(function (ref5) {
                customSearchSinglePathReference = ref5;
                return options.ermRest.resolve(createURL(tableNameCustomSearchSamePrefix));
            }).then(function (ref6) {
                customSearchSamePrefixReference = ref6;
                return options.ermRest.resolve(createURL(tableNameCustomSearchInnerSafe1));
            }).then(function (ref7) {
                customSearchInnerSafeRereference1 = ref7;
                return options.ermRest.resolve(createURL(tableNameCustomSearchInnerSafe2));
            }).then(function (ref8) {
                customSearchInnerSafeRereference2 = ref8;
                return options.ermRest.resolve(createURL(tableNameCustomSearchPartial));
            }).then(function (ref9) {
                partialInvalidSearchColumnReference = ref9;
                return options.ermRest.resolve(createURL(tableNameCustomSearchInbound));
            }).then(function (ref10) {
                customSearchInboundReference = ref10;
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });

        describe("Table.searchSourceDefinition and Reference.searchColumns, ", function () {
            it ("should return false if search-box source definition is missing.", function () {
                testCustomSearchAPIs(defaultSearchReference, false, false);
            });

            it ("should return false if all the defined columns are invalid.", function () {
                testCustomSearchAPIs(invalidSearchColumnReference, false, false);
            });

            it ("should ignore the invalid columns and only return the valid ones.", function () {
                testCustomSearchAPIs(partialInvalidSearchColumnReference, ["id"], ["id"]);
            });

            describe ("should ignore the columns that we cannot guarantee inner join safe.", function () {
                it ("a column directive with inbound fks", function () {
                    // two columns and both have inbound, so returns false
                    testCustomSearchAPIs(customSearchInboundReference, false, false);
                });

                it ("when at least one of the columns involved in the fk path of column is nullok.", function () {
                    testCustomSearchAPIs(customSearchNullokReference, ["nullable_fk_to_vocab"], ["nullable_fk_to_vocab"]);
                });

                // dynamic acl test has been moved to the end since it will change the catalog
            });

            it ("should handle multiple local columns.", function () {
                testCustomSearchAPIs(
                    customSearchLocalColsReference,
                    ["search_col_2", "search_col_1"],
                    ["<strong>some name</strong>", "search_col_1"]
                );
            });

            it ("should handle single column with path.", function () {
                testCustomSearchAPIs(
                    customSearchSinglePathReference,
                    ["name"],
                    ["Vocab"]
                );
            });

            it ("should handle columns that are using the same path prefix", function () {
                testCustomSearchAPIs(
                    customSearchSamePrefixReference,
                    ["name", "second_name", "third_name"],
                    ["name", "second_name", "third name"]
                );
            });

            // TODO
            describe ("should handle combination of columns that are inner join safe.", function () {
                it ("case 1", function () {
                    testCustomSearchAPIs(
                        customSearchInnerSafeRereference1,
                        ['second_name', 'third_name', 'name', 'main name', 'main second_name'],
                        ['vocab second_name', 'vocab third_name', 'vocab o1 name', 'main name', 'main second_name']
                    );
                });

                it ("case 2", function () {
                    testCustomSearchAPIs(
                        customSearchInnerSafeRereference2,
                        ['main name', 'second_name', 'name', 'name'],
                        ['main name', 'vocab second_name', 'vocab name', 'vocab 2 name']
                    );
                });
            });
        });

        describe("reference.search() method when custom search is defined, ", function () {
            it ("should handle multiple local columns.", function (done) {
                testCustomSearchReference(customSearchLocalColsReference.search(searchTerm), customSearchLocalColsCompactPath, customSearchLocalColsResults, done);
            });

            it ("should handle single column with path.", function (done) {
                testCustomSearchReference(customSearchSinglePathReference.search(searchTerm), customSearchSinglePathCompactPath, customSearchSinglePathResults, done);
            });

            it ("should handle columns that are using the same path prefix", function (done) {
                testCustomSearchReference(customSearchSamePrefixReference.search(searchTerm), customSearchSamePrefixCompactPath, customSearchSamePrefixResults, done);
            });

            describe ("should handle combination of columns that are inner join safe.", function () {
                it ("case 1", function (done) {
                    testCustomSearchReference(customSearchInnerSafeRereference1.search(searchTerm), customSearchInnerSafe1CompactPath, customSearchInnerSafe1Results, done);
                });

                it ("case 2", function (done) {
                    testCustomSearchReference(customSearchInnerSafeRereference2.search(searchTerm), customSearchInnerSafe2CompactPath, customSearchInnerSafe2Results, done);
                });
            });
        });

        describe("reference with search in uri when custom search is defined, ", function () {
            it ("should handle multiple local columns", function (done) {
                options.ermRest.resolve(createURL(tableNameCustomSearchLocalCols, searchFacet), {cid: "test"}).then(function (ref) {
                    testCustomSearchReference(ref, customSearchLocalColsCompactPath, customSearchLocalColsResults, done);
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("should handle single column with path.", function (done) {
                options.ermRest.resolve(createURL(tableNameCustomSearchSinglePath, searchFacet), {cid: "test"}).then(function (ref) {
                    testCustomSearchReference(ref, customSearchSinglePathCompactPath, customSearchSinglePathResults, done);
                }).catch(function (err) {
                    done.fail(err);
                })
            });

            it ("should handle columns that are using the same path prefix", function (done) {
                options.ermRest.resolve(createURL(tableNameCustomSearchSamePrefix, searchFacet), {cid: "test"}).then(function (ref) {
                    testCustomSearchReference(ref, customSearchSamePrefixCompactPath, customSearchSamePrefixResults, done);
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            describe ("should handle combination of columns that are inner join safe.", function () {
                it ("case 1", function (done) {
                    options.ermRest.resolve(createURL(tableNameCustomSearchInnerSafe1, searchFacet), {cid: "test"}).then(function (ref) {
                        testCustomSearchReference(ref, customSearchInnerSafe1CompactPath, customSearchInnerSafe1Results, done);
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("case 2", function (done) {
                    options.ermRest.resolve(createURL(tableNameCustomSearchInnerSafe2, searchFacet), {cid: "test"}).then(function (ref) {
                        testCustomSearchReference(ref, customSearchInnerSafe2CompactPath, customSearchInnerSafe2Results, done);
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });
            });
        });


        describe("regarding readPath and path prefix", function () {
            var readPathRef;
            it ("if possible same instance should be used for search and alloutbound cols", function (done) {
                options.ermRest.resolve(createURL(tableNameCustomSearchSamePrefix2, searchFacet), {cid: "test"}).then(function (ref) {
                    readPathRef = ref.contextualize.compact;

                    var readPath = [
                        "M:=search_schema:table_w_custom_search_same_prefix_2",
                        "M_P1:=(fk_to_vocab)=(search_schema:search_vocab_table:id)",
                        "name::ciregexp::term;second_name::ciregexp::term/$M",
                        "RID;M:=array_d(M:*),F1:=M_P1:name@sort(RID)"
                    ].join("/")
                    expect(readPathRef.readPath).toEqual(readPath, "readPath missmatch");

                    return readPathRef.read(5)
                }).then(function (page) {
                    expect(page.length).toBe(2, "page length missmatch");

                    var tuples = page.tuples;
                    expect(tuples[0].data.id).toBe("02", "id raw value missmatch");
                    expect(tuples[1].data.id).toBe("03", "id raw value missmatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("if url has facet, the instance should properly be shared", function (done) {
                var facet = {
                    "and": [
                        {"sourcekey": "search-box", "search": ["term"]},
                        {"sourcekey": "path_to_vocab_name", "choices": ["name 2 with term"]}
                    ]
                };

                options.ermRest.resolve(createURL(tableNameCustomSearchSamePrefix2, facet), {cid: "test"}).then(function (ref) {
                    readPathRef = ref.contextualize.compact;

                    var readPath = [
                        "M:=search_schema:table_w_custom_search_same_prefix_2",
                        "M_P1:=(fk_to_vocab)=(search_schema:search_vocab_table:id)",
                        "name::ciregexp::term;second_name::ciregexp::term/$M",
                        "$M_P1/name=name%202%20with%20term/$M/RID;M:=array_d(M:*),F1:=M_P1:name@sort(RID)"
                    ].join("/");
                    expect(readPathRef.readPath).toEqual(readPath, "readPath missmatch");

                    return readPathRef.read(5)
                }).then(function (page) {
                    expect(page.length).toBe(1, "page length missmatch");

                    var tuples = page.tuples;
                    expect(tuples[0].data.id).toBe("02", "id raw value missmatch");

                    var expectedValues = ['02', 'name 2 with term'];
                    expect(tuples[0].values).toEqual(jasmine.arrayContaining(expectedValues), "values missmatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });

            });
        });

        
        describe("regarding dynamic acl support", function () {
            var tempRef;

            beforeAll(function (done) {
                utils.setCatalogAcls(
                    options.ermRest, 
                    done, 
                    createURL(tableNameCustomSearchDynamicSelect), 
                    catalog_id, 
                    {
                        "catalog": {
                            "id": catalog_id,
                            "schemas" : {
                                "search_schema": {
                                    "tables" : {
                                        "table_w_custom_search_dynamic_select_col": {
                                            "acls": {
                                                "select": ["*"]
                                            },
                                            "columns": {
                                                "fk_to_vocab": {
                                                    "acls": {
                                                        "select": []
                                                    },
                                                    "acl_bindings": {
                                                        "can_select_rows": {
                                                            "types": ["select"],
                                                            "projection": [
                                                                // we don't care about the value, we just want a dynamic acl
                                                                {"filter": "id", "operand": 3}, "id"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, 
                    (response) => tempRef = response, 
                    process.env.RESTRICTED_AUTH_COOKIE
                );
            });

            describe("Table.searchSourceDefinition and Reference.searchColumns", function () {
                it("should ignore columns in the all-outbound path cannot be selected by user (and therefore is nullable).", function () {
                    testCustomSearchAPIs(tempRef, ["id"], ["id"]);
                });
            });

            afterAll(function () {
                options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                utils.removeCachedCatalog(options.ermRest, catalog_id)
            });
            
        });

    });
};
