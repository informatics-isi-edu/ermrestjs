exports.execute = function(options) {
    var catalogId = 1,
        schemaName = "parse_schema",
        tableName = "parse_table";

    describe("Filters,", function() {

        describe('single filter,', function() {
            var parsedFilter;
            var entityId = 10;
            var singleFilterPath = "/catalog/" + catalogId + "/entity/" +
                schemaName + ":" + tableName + "/id=" + entityId;

            it('parse should take a uri with a single filter and return a location object.', function() {
                var location = options.ermRest.parse(options.url + singleFilterPath);
                parsedFilter = location.filter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + singleFilterPath);
                expect(location.compactUri).toBe(options.url + singleFilterPath);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":" + tableName + "/id=" + entityId);
                expect(location.compactPath).toBe(schemaName + ":" + tableName + "/id=" + entityId);
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.sort).toBeUndefined();
                expect(location.sortObject).toBe(null);
                expect(location.paging).toBeUndefined();
                expect(location.beforeObject).toBe(null);
                expect(location.afterObject).toBe(null);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location.filter instanceof options.ermRest.ParsedFilter).toBe(true);
            });

            it('parsedFilter should have methods and values properly defined.', function() {
                expect(parsedFilter).toBeDefined();

                expect(parsedFilter.type).toBe("BinaryPredicate");
                expect(parsedFilter.column).toBe("id");
                expect(parsedFilter.operator).toBe('=');
                expect(parsedFilter.value).toBe(entityId.toString());

                expect(parsedFilter.setBinaryPredicate).toBeDefined();
                expect(parsedFilter.setFilters).toBeDefined();
            });
        });

        describe('single filter with empty value, ', function() {
            var parsedFilter;
            var singleFilterPath = "/catalog/" + catalogId + "/entity/" +
                schemaName + ":" + tableName + "/id=";

            it('parse should take a uri with a single filter and return a location object.', function() {
                var location = options.ermRest.parse(options.url + singleFilterPath);
                parsedFilter = location.filter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + singleFilterPath);
                expect(location.compactUri).toBe(options.url + singleFilterPath);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":" + tableName + "/id=");
                expect(location.compactPath).toBe(schemaName + ":" + tableName + "/id=");
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.sort).toBeUndefined();
                expect(location.sortObject).toBe(null);
                expect(location.paging).toBeUndefined();
                expect(location.beforeObject).toBe(null);
                expect(location.afterObject).toBe(null);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location.filter instanceof options.ermRest.ParsedFilter).toBe(true);
            });

            it('parsedFilter should have methods and values properly defined.', function() {
                expect(parsedFilter).toBeDefined();

                expect(parsedFilter.type).toBe("BinaryPredicate");
                expect(parsedFilter.column).toBe("id");
                expect(parsedFilter.operator).toBe('=');
                expect(parsedFilter.value).toBe("");

                expect(parsedFilter.setBinaryPredicate).toBeDefined();
                expect(parsedFilter.setFilters).toBeDefined();
            });
        });

        describe('multiple filters with a conjunction,', function() {
            var parsedFilter;
            var lowerLimit = 1,
                upperLimit = 10,
                sort = "summary",
                text = "some%20random%20text";
            var multipleFilterPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":" +
                tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "@sort(" + sort + ")" + "@after(" + text + ")";

            it('parse should take a uri with multiple filters and return a location object.', function() {
                var location = options.ermRest.parse(options.url + multipleFilterPath);
                parsedFilter = location.filter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + multipleFilterPath);
                expect(location.compactUri).toBe(options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" +
                    tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":" +
                    tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "@sort(" + sort + ")" + "@after(" + text + ")");
                expect(location.compactPath).toBe(schemaName + ":" +
                    tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit);
                expect(location.sort).toBe("@sort(" + sort + ")");
                expect(location.sortObject[0].column).toBe("summary");
                expect(location.sortObject[0].descending).toBe(false);
                expect(location.paging).toBe("@after(" + text + ")");
                expect(location.afterObject.length).toBe(1);
                expect(location.afterObject[0]).toBe("some random text");
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location.filter instanceof options.ermRest.ParsedFilter).toBe(true);
            });

            it('parsedFilter should have methods and values properly defined.', function() {
                expect(parsedFilter).toBeDefined();

                expect(parsedFilter.type).toBe("Conjunction");
                expect(parsedFilter.filters).toBeDefined();

                var filter1 = parsedFilter.filters[0];
                expect(filter1.type).toBe("BinaryPredicate");
                expect(filter1.column).toBe("id");
                expect(filter1.operator).toBe("::gt::");
                expect(filter1.value).toBe(lowerLimit.toString());

                var filter2 = parsedFilter.filters[1];
                expect(filter2.type).toBe("BinaryPredicate");
                expect(filter2.column).toBe("id");
                expect(filter2.operator).toBe("::lt::");
                expect(filter2.value).toBe(upperLimit.toString());
            });
        });

        describe('multiple filters with a disjunction,', function() {
            var parsedFilter;
            var firstEntityId = 4;
            var secondEntityId = 7;
            var multipleFilterPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":" +
                tableName + "/id=" + firstEntityId + ";id=" + secondEntityId;

            it('parse should take a uri with multiple filters and return a location object.', function() {
                var location = options.ermRest.parse(options.url + multipleFilterPath);
                parsedFilter = location.filter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + multipleFilterPath);
                expect(location.compactUri).toBe(options.url + multipleFilterPath);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":" +
                    tableName + "/id=" + firstEntityId + ";id=" + secondEntityId);
                expect(location.compactPath).toBe(schemaName + ":" +
                    tableName + "/id=" + firstEntityId + ";id=" + secondEntityId);
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.sort).toBeUndefined();
                expect(location.sortObject).toBe(null);
                expect(location.paging).toBeUndefined();
                expect(location.beforeObject).toBe(null);
                expect(location.afterObject).toBe(null);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location.filter instanceof options.ermRest.ParsedFilter).toBe(true);
            });

            it('parsedFilter should have methods and values properly defined.', function() {
                expect(parsedFilter).toBeDefined();

                expect(parsedFilter.type).toBe("Disjunction");
                expect(parsedFilter.filters).toBeDefined();

                var filter1 = parsedFilter.filters[0];
                expect(filter1.type).toBe("BinaryPredicate");
                expect(filter1.column).toBe("id");
                expect(filter1.operator).toBe("=");
                expect(filter1.value).toBe(firstEntityId.toString());

                var filter2 = parsedFilter.filters[1];
                expect(filter2.type).toBe("BinaryPredicate");
                expect(filter2.column).toBe("id");
                expect(filter2.operator).toBe("=");
                expect(filter2.value).toBe(secondEntityId.toString());
            });
        });
    });

    describe('Entity linking,', function() {
        var parsedFilter;
        var lowerLimit = 1,
            upperLimit = 10,
            sort = "id,summary",
            text = "2,some%20random%20text",
            tableName2 = "parse_table_2";
        var complexPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":" +
            tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)" +
            "@sort(" + sort + ")" + "@after(" + text + ")";

        it('parse should take a uri with multiple filters and return a location object.', function() {
            var location = options.ermRest.parse(options.url + complexPath);
            parsedFilter = location.filter;

            expect(location).toBeDefined();
            expect(location.uri).toBe(options.url + complexPath);
            expect(location.compactUri).toBe(options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" +
                tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)");
            expect(location.api).toBe("entity");
            expect(location.path).toBe(schemaName + ":" +
                tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)" +
                "@sort(" + sort + ")" + "@after(" + text + ")");
            expect(location.compactPath).toBe(schemaName + ":" +
                tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)");
            expect(location.sort).toBe("@sort(" + sort + ")");
            expect(location.sortObject[0].column).toBe("id");
            expect(location.sortObject[0].descending).toBe(false);
            expect(location.sortObject[1].column).toBe("summary");
            expect(location.sortObject[1].descending).toBe(false);
            expect(location.paging).toBe("@after(" + text + ")");
            expect(location.afterObject).toEqual(["2", "some random text"]);
            expect(location.afterObject.length).toBe(2);
            expect(location.afterObject[1]).toBe("some random text");
            expect(location.catalog).toBe(catalogId.toString());
            expect(location.projectionSchemaName).toBe(schemaName);
            expect(location.projectionTableName).toBe(tableName);
            expect(location.schemaName).toBe(schemaName);
            expect(location.tableName).toBe(tableName2);
            expect(location.filter instanceof options.ermRest.ParsedFilter).toBe(true);
        });

        it('parsedFilter should have methods and values properly defined.', function() {
            expect(parsedFilter).toBeDefined();

            expect(parsedFilter.type).toBe("Conjunction");
            expect(parsedFilter.filters).toBeDefined();

            var filter1 = parsedFilter.filters[0];
            expect(filter1.type).toBe("BinaryPredicate");
            expect(filter1.column).toBe("id");
            expect(filter1.operator).toBe("::gt::");
            expect(filter1.value).toBe(lowerLimit.toString());

            var filter2 = parsedFilter.filters[1];
            expect(filter2.type).toBe("BinaryPredicate");
            expect(filter2.column).toBe("id");
            expect(filter2.operator).toBe("::lt::");
            expect(filter2.value).toBe(upperLimit.toString());
        });
    });

    describe("Query parameters", function() {
        var queryParamsString = "subset=SOMESUBSET&limit=2";
        var path = schemaName + ":" + tableName;
        var uriWithoutQuery = options.url + "/catalog/" + catalogId + "/entity/" + path;
        var ermrestUriWithoutQuery = options.url + "/catalog/" + catalogId + "/entity/" + "M:=" + path;
        var uriWithQuery = uriWithoutQuery + "?" + queryParamsString;
        var location;

        beforeAll(function() {
            location = options.ermRest.parse(uriWithQuery);
        });

        it("parser should correctly return the url with path", function() {
            expect(location.uri).toBe(uriWithQuery, "uri mismatch.");
            expect(location.path).toBe(path, "path mismatch.");
            expect(location.compactPath).toBe(path, "compactPath mismatch.");
            expect(location.ermrestUri).toBe(ermrestUriWithoutQuery, "ermrestUri mismatch.");
            expect(location.ermrestPath).toBe("M:=" + path, "ermrestPath mismatch.");
            expect(location.ermrestCompactPath).toBe("M:=" + path, "ermrestCompactPath mismatch.");
        });

        it("parser should reutrn the correct queryParamsString.", function() {
            expect(location.queryParamsString).toBe(queryParamsString);
        });

        it("parser should create a dictionary of query params.", function() {
            expect(location.queryParams).toBeDefined("queryParams is not defined.");
            expect(location.queryParams.subset).toBe("SOMESUBSET", "subset mismatch.");
            expect(location.queryParams.limit).toBe("2", "limit mismatch.");
        });
    });

    describe("Facets, ", function() {
        var validBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhAEYQBdAX0uXWzywQAKiogkOMNlrMQAFxxI5nLtyA";
        var facetObj = {
            "and":[
                {"source":"accession", "choices":["1"]},
                {"source":"*", "search":["test"]}
            ]
        };

        var validBlob2 = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhACYQBdAX0uXWzywQAKiogkOMNlrMQAFxxI57btyA";
        var facetObj2 = {
            "and":[
                {"source":"accession", "choices":["2"]},
                {"source":"*", "search":["test2"]}
            ]
        };


        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" + tableName;
        var facetError = "Given encoded string for facets is not valid.";
        var location, uri;
        var invalidPageCondition = "Invalid uri: https://dev.isrd.isi.edu/ermrest/catalog/1/entity/parse_schema:parse_table@after(). Sort modifier is required with paging.";
        var invalidFilterOperator = "Invalid uri: https://dev.isrd.isi.edu/ermrest/catalog/1/entity/parse_schema:parse_table/id::gt:269. Couldn't parse 'id::gt:269' filter.";


        describe("when uri doesn't have any facets, ", function() {
            it("Location.facets should be undefined.", function() {
                location = options.ermRest.parse(baseUri);
                expect(location.facets).toBeUndefined();
            });
        });

        describe("when uri have invalid facet blob", function() {
            it("parser should throw an error.", function() {
                expect(function () {
                    options.ermRest.parse(baseUri + "/*::facets::invalidblob");
                }).toThrow(facetError);
            });
        });

        describe("when uri have invalid paging Criteria", function() {
            it("it should throw an error.", function() {
                expect(function () {
                    options.ermRest.parse(baseUri + "@after()");
                }).toThrow(invalidPageCondition);
            });
        });

        describe("when uri have invalid paging Criteria", function() {
            it("it should throw an error.", function() {
                expect(function () {
                    options.ermRest.parse(baseUri + "/id::gt:269");
                }).toThrow(invalidFilterOperator);
            });
        });

        describe("when uri has valid facet blob", function() {
            it("parser should understand the facets pseudo operator", function() {
                uri = baseUri + "/*::facets::" + validBlob;
                location = options.ermRest.parse(uri);
                expect(location).toBeDefined("location is not defined.");

                expect(location.uri).toBe(uri, "uri missmatch");

                expect(location.facets).toBeDefined("facets is not defined.");
            });

            it("Location.facets.decoded should return the facets object.", function() {
                expect(location.facets.decoded).toBeDefined();
                expect(JSON.stringify(location.facets.decoded)).toEqual(JSON.stringify(facetObj));
            });

            it("Location.facets.encoded should return the facets blob.", function() {
                expect(location.facets.encoded).toEqual(validBlob);
            });
        });

        describe("when uri has joins, ", function() {
            it("parser should handle having facet before join.", function() {
                uri = baseUri + "/*::facets::" + validBlob + "/(id)=(s:otherTable:id)";
                location = options.ermRest.parse(uri);
                expect(location).toBeDefined("location is not defined");

                expect(location.uri).toEqual(uri, "uri missmatch");

                expect(location.facets).toBeUndefined("facets is defined.");

                expect(location.projectionFacets).toBeDefined("projectionFacets is not defined.");
                expect(location.projectionFacets.encoded).toEqual(validBlob, "projection facets encoded missmatch.");
                expect(JSON.stringify(location.projectionFacets.decoded)).toEqual(JSON.stringify(facetObj), "projection facets decoded missmatch.");

                expect(location.ermrestCompactPath).toEqual("T:=parse_schema:parse_table/accession=1/$T/*::ciregexp::test/$T/M:=(id)=(s:otherTable:id)", "ermrestCompactPath missmatch");
            });

            it("parser should handle having facet after join.", function() {
                uri = baseUri + "/(id)=(s:otherTable:id)/*::facets::" + validBlob2;
                location = options.ermRest.parse(uri);
                expect(location).toBeDefined("location is not defined");

                expect(location.uri).toEqual(uri, "uri missmatch");

                expect(location.projectionFacets).toBeUndefined("projectionFacets is defined.");

                expect(location.facets).toBeDefined("facets is not defined.");
                expect(location.facets.encoded).toEqual(validBlob2, "facets encoded missmatch.");
                expect(JSON.stringify(location.facets.decoded)).toEqual(JSON.stringify(facetObj2), "facets decoded missmatch.");

                expect(location.ermrestCompactPath).toEqual("T:=parse_schema:parse_table/M:=(id)=(s:otherTable:id)/accession=2/$M/*::ciregexp::test2/$M", "ermrestCompactPath missmatch");
            });

            it('parser should handle having facet after and before join.', function() {
                uri = baseUri + "/*::facets::" + validBlob + "/(id)=(s:otherTable:id)" + "/*::facets::" + validBlob2;
                location = options.ermRest.parse(uri);
                expect(location).toBeDefined("location is not defined");

                expect(location.uri).toEqual(uri, "uri missmatch");

                expect(location.projectionFacets).toBeDefined("projectionFacets is not defined.");
                expect(location.projectionFacets.encoded).toEqual(validBlob, "projection facets encoded missmatch.");
                expect(JSON.stringify(location.projectionFacets.decoded)).toEqual(JSON.stringify(facetObj), "projection facets decoded missmatch.");

                expect(location.facets).toBeDefined("facets is not defined.");
                expect(location.facets.encoded).toEqual(validBlob2, "facets encoded missmatch.");
                expect(JSON.stringify(location.facets.decoded)).toEqual(JSON.stringify(facetObj2), "facets decoded missmatch.");

                expect(location.ermrestCompactPath).toEqual(
                    "T:=parse_schema:parse_table/accession=1/$T/*::ciregexp::test/$T/M:=(id)=(s:otherTable:id)/accession=2/$M/*::ciregexp::test2/$M",
                    "ermrestCompactPath missmatch"
                );
            });
        });

        describe("for changing facets in location, ", function () {
            it("Location.facets setter should be able to change the facet and update other APIs.", function() {
                location.facets = facetObj;

                uri = baseUri + "/*::facets::" + validBlob + "/(id)=(s:otherTable:id)" + "/*::facets::" + validBlob;
                expect(location.uri).toBe(uri, "uri missmatch.");

                expect(location.searchTerm).toEqual("test", "searchTerm missmatch.");
            });

            it("Location.projectionFacets setter should be able to change the facet and update other APIs.", function() {
                location.projectionFacets = facetObj2;

                uri = baseUri + "/*::facets::" + validBlob2 + "/(id)=(s:otherTable:id)" + "/*::facets::" + validBlob;
                expect(location.uri).toBe(uri, "uri missmatch.");

                expect(location.searchTerm).toEqual("test", "searchTerm missmatch.");
            });
        });

        describe("regarding handling different facets syntaxes, ", function () {
            var facet, blob;
            var unicodeSample =  "ɐ ɔ", encodedUnicodeSample = "%C9%90%20%C9%94";

            var expectError = function (blob) {
                expect(function () {
                    var loc = options.ermRest.parse(baseUri + "/*::facets::" + blob);
                    var ermrestURL = loc.ermrestUri;
                }).toThrow(facetError);
            };

            var expectLocation = function (blob, facetObject, path) {
                var url = baseUri + "/*::facets::" + blob;

                var loc = options.ermRest.parse(url);

                expect(loc).toBeDefined("location is not defined.");

                expect(loc.uri).toBe(url, "uri missmatch");

                expect(JSON.stringify(loc.facets.decoded)).toEqual(JSON.stringify(facetObject), "facets decoded missmatch.");
                expect(loc.facets.encoded).toEqual(blob, "facets encoded missmatch.");

                expect(loc.ermrestCompactPath).toEqual("M:=parse_schema:parse_table/" + path, "ermrestCompactPath missmatch");
            };

            describe("regarding source attribute, ", function () {
                it("should throw an error when `and` is not available.", function () {
                    expectError("N4Igzg9grgTgxgUxALhARhAGhHAFhAS0TBQG10QBdAXyA");
                });

                it("should throw an error when `and` value is not an array.", function () {
                    expectError("N4IghgdgJiBcoGcD2BXATgYwKZwIwBoQMALJAS2wTgG0RcQBdAXyaA");
                });

                it ("should throw an error when source is not available.", function () {
                    // {"and": [{"choices": ["1"]} ] }
                    expectError("N4IghgdgJiBcDaoDGALA9gSyQUwM53hAEYQBdAXwqA");

                });

                it ("should throw an error when source is not string.", function () {
                    // {"and": [ {"source": 1, "choices": ["1"]} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4EYAaELACxQEtck54R8QBdAXxaA");
                });

                it ("should accept string as source.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEYQAaELACxQEtck55CQBdAX1aA",
                        {"and": [ {"source": "1", "choices": ["1"]} ]},
                        "1=1/$M"
                    );
                });

                // array for source test cases are in faceting spec.
            });

            describe("regarding choices attribute, ", function () {
                it("should throw an error if its value is not an array.", function () {
                    //{"and": [ {"source": "c", "choices": "1"} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yXwEYQBfAXQaA");
                });

                it ("should handle null values.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTngjQBsGBdAXzaA",
                        {"and": [ {"source": "c", "choices": [null]} ]},
                        "c::null::/$M"
                    );
                });

                it ("should handle unicode characters.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhCwAsUBLXJOeQ0kAXQF8ug",
                        {"and": [ {"source": unicodeSample, "choices": [unicodeSample]} ]},
                        encodedUnicodeSample + "=" + encodedUnicodeSample + "/$M"
                    );
                });

                it ("should handle multiple values.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTnhAEZiAmIgZgF0BfLoA",
                        {"and": [ {"source": "c", "choices": ["1", 2, 3]} ]},
                        "c=1;c=2;c=3/$M"
                    );
                });
            });

            describe("regarding search attribute, ", function () {

                it("should throw an error if its value is not an array.", function () {
                    //{"and": [ {"source": "c", "search": "1"} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALfARhAF8BdeoA");
                });

                it ("should throw an error if search value is null/undefined.", function () {
                    // {"and": [ {"source": "c", "search": [null]} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALOeCNAG3oF0BfVoA");
                });

                it ('should create correct regex search filter.', function () {
                    var intRegexPrefix = "^(.*[^0-9.])?0*";
                    var intRegexSuffix = "([^0-9].*|$)";

                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALOeARgF0BfJoA",
                        {"and": [ {"source": "c", "search": [1]} ]},
                        "c::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "1" + intRegexSuffix) + "/$M"
                    );

                    expect(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALOecAAgCMQBdAXzaA",
                        {"and": [ {"source": "c", "search": ["a b"]} ]},
                        "c::ciregexp::a&c::ciregexp::b/$M"
                    );
                });

                it("should handle unicode characters.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhCRzGwAs55wQBdAX3aA",
                        {"and": [ {"source": unicodeSample, "search": ["a"] } ]},
                        encodedUnicodeSample + "::ciregexp::a/$M"
                    );
                });

                it ("should handle multiple values.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALOecYkAIxAF0BfNoA",
                        {"and": [ {"source": "c", "search": ["a", "b"]} ]},
                        "c::ciregexp::a;c::ciregexp::b/$M"
                    );
                });
            });

            describe("regarding `ranges` attribute, ", function () {
                it("should throw an error if its value is not an array.", function () {
                    //{"and": [ {"source": "c", "ranges": "1"} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJfARhAF8BdeoA");
                });

                it ("should throw an error if max and min are not defined.", function () {
                    // {"and": [ {"source": "c", "ranges": ["1"]} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOeEARhAF0BfFoA");
                });

                it ('should handle half ranges.', function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGAXwF1O2g",
                        {"and": [ {"source": "c", "ranges": [{"min":1}]} ]},
                        "c::gt::1/$M"
                    );

                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWzAA98AXEAXwF0v2g",
                        {"and": [ {"source": "c", "ranges": [{"max":"t"}]} ]},
                        "c::lt::t/$M"
                    );
                });

                it("should handle unicode characters.", function () {
                    expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhA0gHMck5EQBbASwn2LMubAA9OpEAF8AumOFA",
                            {"and": [ {"source": unicodeSample, "ranges": [{"min": unicodeSample, "max": unicodeSample}] } ]},
                            encodedUnicodeSample + "::gt::" + encodedUnicodeSample + "&" + encodedUnicodeSample + "::lt::" + encodedUnicodeSample + "/$M"
                    );
                });

                it("should handle multiple values.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGAXyNDrAA98AXEBy5M4AWhYlufWAFY2AXUVsgA",
                        {"and": [ {"source": "c", "ranges": [{"min":1}, {"max":"t"}, {"min": -1, "max": 5}]} ]},
                        "c::gt::1;c::lt::t;c::gt::-1&c::lt::5/$M"
                    );
                });
            });

            describe("regarding `not_null` attribute, ", function () {
                it ("should ignore the value if it's not `true`.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTngjQBsGBdEiFAFwH16naQAjCGYBfUUA",
                        {"and": [ {"source": "c", "choices": [null], "not_null": ["1"] }]},
                        "c::null::/$M"
                    );
                });

                it ("should create a not-null filter if it's `true`", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQIUAXAfQjQBta5yM0cBfAXVaA",
                        {"and": [ {"source": "c", "not_null": true} ]},
                        "!(c::null::)/$M"
                    );
                });

                it ("should handle unicode characters.", function () {
                    expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhAhQBcB9CNAGybhozRwF8BdLoA",
                            {"and": [ {"source": unicodeSample, "not_null": true} ] },
                            "!(" + encodedUnicodeSample + "::null::)/$M"
                    );
                });

                it ("should handle not_null and choice=null filter.", function () {
                    expectLocation(
                        "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTngjQBsGBdEiFAFwH16m4OMaHAF9mwoA",
                        {"and": [ {"source": "c", "choices": [null], "not_null": true} ]},
                        "c::null::;!(c::null::)/$M"
                    );
                });
            });

            it ("should throw an error if one of the facets don't have any constraints.", function () {
                // {"and": [ {"source": "*"} ]}
                expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4gCoQBfAXWKA");
            });
        });
    });

    describe("createPath, ", function() {
        var validBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gCoQAaEJHMbACznhABccl6QBdAXw6A";
        var facetObj = {
            "and":[{"source":"*", "search": ["test"]}]
        };
        var path;

        it('should throw error if parameters are invalid.', function() {
            expect(function () {
                options.ermRest.createPath(2, null, "table");
            }).toThrow("catalogId must be an string.");
            expect(function () {
                options.ermRest.createPath("2", null);
            }).toThrow("tableName must be an string.");
        });

        it("should handle not passing any schemaName", function() {
            path = options.ermRest.createPath("1", null, "table", facetObj);
            expect(path).toEqual("#1/table/*::facets::" + validBlob);
        });

        it("should handle passing an empty object for facets", function() {
            path = options.ermRest.createPath("1", "schema", "table", {});
            expect(path).toEqual("#1/schema:table");
        });

        it("should return a valid path, given valid parameters.", function() {
            path = options.ermRest.createPath("1", "schema", "table", facetObj);
            expect(path).toEqual("#1/schema:table/*::facets::" + validBlob);
        });
    });

    // NOTE: search test cases are in refererence/13.search.js
    // NOTE: more facet test cases are in faceting test specs
};
