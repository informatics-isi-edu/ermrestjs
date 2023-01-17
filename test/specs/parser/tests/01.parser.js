exports.execute = function(options) {
    var catalogId = process.env.DEFAULT_CATALOG,
        schemaName = "parse_schema",
        tableName = "parse_table";

    var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" + tableName,
        baseUriWOSchema = options.url + "/catalog/" + catalogId + "/entity/" + tableName;


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
                expect(location.catalogId).toBe(catalogId.toString());
                expect(location.version).toBeNull();
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
                expect(location.catalogId).toBe(catalogId.toString());
                expect(location.version).toBeNull();
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
                expect(location.catalogId).toBe(catalogId.toString());
                expect(location.version).toBeNull();
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
                expect(location.catalogId).toBe(catalogId.toString());
                expect(location.version).toBeNull();
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

        describe('quantified value list (any) syntax', function () {
            var parsedFilter;
            var multipleFilterPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":" +
            tableName + "/some%20col=any(v%201,v%202)";

            it('parse should take a uri with `any` and return a location object.', function() {
                var location = options.ermRest.parse(options.url + multipleFilterPath);
                parsedFilter = location.filter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + multipleFilterPath);
                expect(location.compactUri).toBe(options.url + multipleFilterPath);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":" + tableName + "/some%20col=any(v%201,v%202)");
                expect(location.compactPath).toBe(schemaName + ":" + tableName + "/some%20col=any(v%201,v%202)");
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.catalogId).toBe(catalogId.toString());
                expect(location.version).toBeNull();
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
                expect(filter1.column).toBe("some col");
                expect(filter1.operator).toBe("=");
                expect(filter1.value).toBe("v 1");

                var filter2 = parsedFilter.filters[1];
                expect(filter2.type).toBe("BinaryPredicate");
                expect(filter2.column).toBe("some col");
                expect(filter2.operator).toBe("=");
                expect(filter2.value).toBe("v 2");
            });
        });


        describe("regarding changing filter to facet,", function () {
            var baseURI = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" + tableName;

            var testFilterToFacet = function (title, filterString, depth, facetObj) {
                var location = options.ermRest.parse(baseURI + "/" + filterString);
                expect(location).toBeDefined(title + ": location undefined.");

                var filter = location.filter;
                expect(filter).toBeDefined(title + ": filter undefined");
                expect(location.filtersString).toBe(filterString, title + ": filtersString missmatch.");
                expect(JSON.stringify(filter.facet)).toEqual(JSON.stringify(facetObj), title + ": facet missmatch.");
                expect(filter.depth).toBe(depth, title + ": depth missmatch");
            };

            it ("should handle single filters.", function () {
                testFilterToFacet("equality", "col=2", 1,
                    { and: [{"source": "col", "choices": ["2"]}]}
                );

                testFilterToFacet("leq", "col::leq::12", 1,
                    { and: [{"source": "col", "ranges": [{max: "12"}]}]}
                );

                testFilterToFacet("geq", "col::geq::12", 1,
                    { and: [{"source": "col", "ranges": [{min: "12"}]}]}
                );

                testFilterToFacet("null", "col::null::", 1,
                    { and: [{"source": "col", "choices": [null]}]}
                );

                testFilterToFacet("search", "col::ciregexp::test", 1,
                    { and: [{"source": "col", "search": ["test"]}] }
                );
            });

            it ("should handle conjunction filter.", function () {
                testFilterToFacet(
                    "same column",
                    "col=1&col::null::", 1,
                    {and:[
                        {"source": "col", "choices": ["1"]},
                        {"source": "col", "choices": [null]}
                    ]}
                );

                testFilterToFacet(
                    "different columns",
                    "id=1&col::null::", 1,
                    {and:[
                        {"source": "id", "choices": ["1"]},
                        {"source": "col", "choices": [null]}
                    ]}
                );
            });

            it ("should handle disjunction filter.", function () {
                testFilterToFacet(
                    "same column, same operator",
                    "col=1;col::null::", 1,
                    {and:[{"source": "col", "choices": ["1", null]}]}
                );

                testFilterToFacet(
                    "same column, different operator",
                    "col=1;col::geq::12", 1,
                    {and:[{"source": "col", "choices": ["1"], "ranges": [{min: "12"}]}]}
                );

                testFilterToFacet(
                    "different columns",
                    "id=1;col::null::", 1,
                    {or:[
                        {"source": "id", "choices": ["1"]},
                        {"source": "col", "choices": [null]}
                    ]}
                );

                testFilterToFacet(
                    "combination of same and differnt columns",
                    "col=1;id=2;col::leq::12", 1,
                    {or:[
                        {"source": "col", "choices": ["1"], "ranges": [{max: "12"}]},
                        {"source": "id", "choices": ["2"]}
                    ]}
                );
            });

            it ("should handle conjunction of disjunction filters.", function () {
                testFilterToFacet(
                    "disjunction of same column, and then conjunction",
                    "(col=1;col::leq::5)&(id=2;id::ciregexp::test)", 1,
                    {and:[
                        {"source": "col", "choices": ["1"], "ranges": [{max: "5"}]},
                        {"source": "id", "choices": ["2"], "search": ["test"]}
                    ]}
                );

                testFilterToFacet(
                    "combination",
                    "(col=1;col2::leq::5;col=5)&(col3=2;col3::ciregexp::test)", 2,
                    {and: [
                        {or: [
                            {"source": "col", "choices": ["1", "5"]},
                            {"source": "col2", "ranges": [{max: "5"}]}
                        ]},
                        {"source": "col3", "choices": ["2"], "search": ["test"]}
                    ]}
                );
            });

            it ("should handle disjunction of conjunction filters.", function () {
                testFilterToFacet(
                    "combination",
                    "(col1=1&col2::null::);(col3::ciregexp::123&col4=test)", 2,
                    {or: [
                        {and: [
                            {"source": "col1", "choices": ["1"]},
                            {"source": "col2", "choices": [null]}
                        ]},
                        {and: [
                            {"source": "col3", "search": ["123"]},
                            {"source": "col4", "choices": ["test"]}
                        ]}
                    ]}
                );
            });

            it ("should handle quantified value list (any) syntax", function () {
                testFilterToFacet(
                    "quantified value list",
                    "col1=any(val1,val2,val3)&col2=any(test%201,test%202)", 1,
                    {and: [
                        {"source": "col1", "choices": ["val1", "val2", "val3"]},
                        {"source": "col2", "choices": ["test 1", "test 2"]}
                    ]}
                );
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
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.version).toBeNull();
                expect(location.rootSchemaName).toBe(schemaName);
                expect(location.rootTableName).toBe(tableName);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName2);
                expect(location.filter).toBeUndefined();
            });
        });

        describe("Query parameters", function() {
            var queryParamsString = "qp=SOMEVAL&limit=2";
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
                expect(location.ermrestPath).toBe("M:=" + path, "ermrestPath mismatch.");
                expect(location.ermrestCompactPath).toBe("M:=" + path, "ermrestCompactPath mismatch.");
            });

            it("parser should reutrn the correct queryParamsString.", function() {
                expect(location.queryParamsString).toBe(queryParamsString);
            });

            it("parser should create a dictionary of query params.", function() {
                expect(location.queryParams).toBeDefined("queryParams is not defined.");
                expect(location.queryParams.qp).toBe("SOMEVAL", "qp mismatch.");
                expect(location.queryParams.limit).toBe("2", "limit mismatch.");
            });
        });

        describe("Facets, ", function() {
            var validBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhAEYQBdAX0uXWzywQqALY4AtCgAutHBnFYUAGzQiK1JDjDZazEFJxIpnLtyA";
            var facetObj = {
                "and":[
                    {"source":"accession", "choices":["1"]},
                    {"source":"some-other-column", "search":["test"]}
                ]
            };

            var validBlob2 = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhACYQBdAX0uXWzywQqALY4AtCgAutHBnFYUAGzQiK1JDjDZazEFJxIp7btyA";
            var facetObj2 = {
                "and":[
                    {"source":"accession", "choices":["2"]},
                    {"source":"some-other-column", "search":["test2"]}
                ]
            };

            var validBlob3 = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gBcALASyQFosUAbNAWwhABoQsiUTck54QA3AIwgAugF8mydNjyxCRMAUo16jFkhxhsRHiCQEMI0WKA";
            var facetObj3 = {
                "and":[
                    {"source":"this-column", "choices":["v1"]},
                    {"source":"that-column", "search":["str"]}
                ]
            };

            // has a null facet
            var validBlob4 = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gBcALASyQFosUAbNAWwhABoQsiUTck54I1rqAXQC+TZOmx5YhImAKUa9RiyQ4w2IjxBICGECJFA";
            var facetObj4 = {
                "and":[
                    {"source":"this-column", "choices":[null]},
                    {"source":"that-column", "search":["str"]}
                ]
            };

            var facetError = "Given encoded string for facets is not valid.";
            var location, uri;
            var invalidPageConditionErrorObj = {
                'status': 'Invalid Page Criteria',
                'messageWithCondition': "Sort modifier is required with paging.",
                'messageWithConditions': "Sort modifier is required with paging.",
                'errorData': { 'redirectPath': 'parse_schema:parse_table/id=269' }
            };
            var invalidFilterOperatorErrorObj = {
                'status': 'Invalid Filter',
                'message': "Couldn't parse 'id::gt:269' filter.",
                'errorData': { 'redirectPath': 'parse_schema:parse_table/' },
                'messageWithSort': "Couldn't parse 'id::gt:269' filter.",
                'errorDataWithSort': { 'redirectPath': 'parse_schema:parse_table/@sort()' }
            };
            var invalidFacetFilterErrorObj = {
                'status': 'Invalid Facet Filters',
                'message': "Given encoded string for facets is not valid.",
                'errorData': { 'redirectPath': 'parse_schema:parse_table/@sort()' },
                'errorDataWithoutSort': { 'redirectPath': 'parse_schema:parse_table/' }
            };

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

                it("should throw an error for invalid facet filter errors with sort() modifier.", function() {
                    try{
                        options.ermRest.parse(baseUri + "/*::facets::invalidblob@sort()");
                        expect(false).toBe(true, "invalid facet filter didn't throw any errors.");
                    } catch(e){
                        expect(e.status).toEqual(invalidFacetFilterErrorObj.status, "Error status did not match");
                        expect(e.message).toEqual(invalidFacetFilterErrorObj.message, "Error message did not match");
                        expect(e.errorData).toEqual(invalidFacetFilterErrorObj.errorData, "errorData attribute did not match");
                    }
                });
                it("should throw an error for invalid facet filter errors without sort() modifier.", function() {
                    try{
                        options.ermRest.parse(baseUri + "/*::facets::invalidblob");
                        expect(false).toBe(true, "invalid facet filter without sort() didn't throw any errors.");
                    } catch(e){
                        expect(e.status).toEqual(invalidFacetFilterErrorObj.status, "Error status did not match");
                        expect(e.message).toEqual(invalidFacetFilterErrorObj.message, "Error message did not match");
                        expect(e.errorData).toEqual(invalidFacetFilterErrorObj.errorDataWithoutSort, "errorData attribute did not match");
                    }
                });
            });

            describe("when uri has invalid paging Criteria", function() {
                it("it should throw an error for invalid pageing criteria.", function() {
                    try{
                        options.ermRest.parse(baseUri + "/id=269@after()");
                        expect(false).toBe(true, "invalid paging Criteria didn't throw any errors.");
                    } catch(e){
                        expect(e.status).toEqual(invalidPageConditionErrorObj.status, "Error status did not match");
                        expect(e.message).toEqual(invalidPageConditionErrorObj.messageWithCondition, "Error message did not match");
                        expect(e.errorData).toEqual(invalidPageConditionErrorObj.errorData, "errorData attribute did not match");
                    }
                });

                it("it should throw an error for invalid pageing criteria with both after() and before().", function() {
                    try{
                        options.ermRest.parse(baseUri + "/id=269@after(3)@before(7)");
                        expect(false).toBe(true, "invalid paging Criteria didn't throw any errors.");
                    } catch(e){
                        expect(e.status).toEqual(invalidPageConditionErrorObj.status, "Error status did not match");
                        expect(e.message).toEqual(invalidPageConditionErrorObj.messageWithConditions, "Error message did not match");
                        expect(e.errorData).toEqual(invalidPageConditionErrorObj.errorData, "errorData attribute did not match");
                    }
                });
            });

            describe("when uri has invalid filter", function() {
                it("it should throw an error for invalid filter.", function() {
                    try{
                        options.ermRest.parse(baseUri + "/id::gt:269");
                        expect(false).toBe(true, "invalid filter didn't throw any errors.");
                    } catch(e){
                        expect(e.status).toEqual(invalidFilterOperatorErrorObj.status, "Error status did not match");
                        expect(e.message).toEqual(invalidFilterOperatorErrorObj.message, "Error message did not match");
                        expect(e.errorData).toEqual(invalidFilterOperatorErrorObj.errorData, "errorData attribute did not match");
                    }
                });

                it("it should throw an error for invalid filter with sirt() modifier.", function() {
                    try{
                        options.ermRest.parse(baseUri + "/id::gt:269@sort()");
                        expect(false).toBe(true, "invalid filter with sort() modifier didn't throw any errors.");
                    } catch(e){
                        expect(e.status).toEqual(invalidFilterOperatorErrorObj.status, "Error status did not match");
                        expect(e.message).toEqual(invalidFilterOperatorErrorObj.messageWithSort, "Error message did not match");
                        expect(e.errorData).toEqual(invalidFilterOperatorErrorObj.errorDataWithSort, "errorData attribute did not match");
                    }
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

                    expect(location.ermrestCompactPath).toEqual("T:=parse_schema:parse_table/accession=1/$T/some-other-column::ciregexp::test/$T/M:=(id)=(s:otherTable:id)", "ermrestCompactPath missmatch");
                });

                it("parser should handle having facet after join.", function() {
                    uri = baseUri + "/(id)=(s:otherTable:id)/*::facets::" + validBlob2;
                    location = options.ermRest.parse(uri);
                    expect(location).toBeDefined("location is not defined");

                    expect(location.uri).toEqual(uri, "uri missmatch");

                    expect(location.rootFacets).toBeUndefined("rootFacets is defined.");

                    expect(location.facets).toBeDefined("facets is not defined.");
                    expect(location.facets.encoded).toEqual(validBlob2, "facets encoded missmatch.");
                    expect(JSON.stringify(location.facets.decoded)).toEqual(JSON.stringify(facetObj2), "facets decoded missmatch.");

                    expect(location.ermrestCompactPath).toEqual("T:=parse_schema:parse_table/M:=(id)=(s:otherTable:id)/accession=2/$M/some-other-column::ciregexp::test2/$M", "ermrestCompactPath missmatch");
                });

                it('parser should handle having facet after and before join.', function() {
                    uri = baseUri + "/*::facets::" + validBlob + "/(id)=(s:otherTable:id)" + "/*::facets::" + validBlob2;
                    location = options.ermRest.parse(uri);
                    expect(location).toBeDefined("location is not defined");

                    expect(location.uri).toEqual(uri, "uri missmatch");

                    expect(location.facets).toBeDefined("facets is not defined.");
                    expect(location.facets.encoded).toEqual(validBlob2, "facets encoded missmatch.");
                    expect(JSON.stringify(location.facets.decoded)).toEqual(JSON.stringify(facetObj2), "facets decoded missmatch.");

                    expect(location.ermrestCompactPath).toEqual(
                        "T:=parse_schema:parse_table/accession=1/$T/some-other-column::ciregexp::test/$T/M:=(id)=(s:otherTable:id)/accession=2/$M/some-other-column::ciregexp::test2/$M",
                        "ermrestCompactPath missmatch"
                    );
                });

                it ("parser should handle having multiple layers of join and facets.", function () {
                    uri = baseUri + "/*::facets::" + validBlob + "/some_col=v1/(id)=(s:otherTable:id)/(id2)=(s:otherTable2:id)" +
                          "/*::facets::" + validBlob2 + "/some_col2=v2/(id)=(s:yetAnotherTable:id)" + "/*::facets::" + validBlob3;
                    location = options.ermRest.parse(uri);
                    expect(location).toBeDefined("location is not defined");

                    expect(location.uri).toEqual(uri, "uri missmatch");

                    expect(location.facets).toBeDefined("facets is not defined.");
                    expect(location.facets.encoded).toEqual(validBlob3, "facets encoded missmatch.");
                    expect(JSON.stringify(location.facets.decoded)).toEqual(JSON.stringify(facetObj3), "facets decoded missmatch.");

                    expect(location.ermrestCompactPath).toEqual(
                        "T:=parse_schema:parse_table/accession=1/$T/some-other-column::ciregexp::test/$T/some_col=v1/(id)=(s:otherTable:id)/T1:=(id2)=(s:otherTable2:id)/accession=2/$T1/some-other-column::ciregexp::test2/$T1/some_col2=v2/M:=(id)=(s:yetAnotherTable:id)/this-column=v1/$M/that-column::ciregexp::str/$M",
                        "ermrestCompactPath missmatch"
                    );
                });
            });

            // relies on the previous test
            describe("for changing facets in location, ", function () {
                it("Location.facets setter should be able to change the facet and update other APIs.", function() {
                    location.facets = facetObj;

                    uri = baseUri + "/*::facets::" + validBlob + "/some_col=v1/(id)=(s:otherTable:id)/(id2)=(s:otherTable2:id)" +
                          "/*::facets::" + validBlob2 + "/some_col2=v2/(id)=(s:yetAnotherTable:id)" + "/*::facets::" + validBlob;
                    expect(location.uri).toBe(uri, "uri missmatch.");
                });
            });

            describe("regarding handling different facets syntaxes, ", function () {
                var facet, blob;
                var unicodeSample =  "ɐ ɔ", encodedUnicodeSample = "%C9%90%20%C9%94";

                var expectError = function (blob, passCatalog, errorMessage) {
                    expect(function () {
                        var loc = options.ermRest.parse(baseUri + "/*::facets::" + blob, passCatalog ? options.catalog : null);
                        var ermrestURL = loc.ermrestCompactUri;
                    }).toThrow(errorMessage ? errorMessage : facetError);
                };

                var expectLocation = function (blob, facetObject, path, hasNonSearchBoxVisibleFilters, errMessage, woSchema, woPrefix, aliases) {
                    var url = baseUri;
                    if (woSchema) {
                        url = baseUriWOSchema;
                    }

                    if (!blob) {
                        blob = options.ermRest.encodeFacet(facetObject);
                    }

                    url += "/*::facets::" + blob;
                    var loc = options.ermRest.parse(url, options.catalog);

                    expect(loc).toBeDefined("location is not defined" + (errMessage ? errMessage : "."));

                    expect(loc.uri).toBe(url, "uri missmatch" + (errMessage ? errMessage : "."));

                    expect(JSON.stringify(loc.facets.decoded)).toEqual(JSON.stringify(facetObject), "facets decoded missmatch" + (errMessage ? errMessage : "."));
                    expect(loc.facets.encoded).toEqual(blob, "facets encoded missmatch" + (errMessage ? errMessage : "."));

                    expect(loc.facets.hasNonSearchBoxVisibleFilters).toBe(hasNonSearchBoxVisibleFilters, "hasNonSearchBoxVisibleFilters missmatch" + (errMessage ? errMessage : "."));

                    var st = "M:=parse_schema:parse_table/";
                    if (woSchema) {
                        st = "M:=parse_table/";
                    }
                    if (woPrefix) {
                        st = "";
                    }
                    expect(loc.ermrestCompactPath).toEqual(st + path, "ermrestCompactPath missmatch" + (errMessage ? errMessage : "."));

                    if (aliases != null) {
                        expect(JSON.stringify(loc.pathPrefixAliasMapping.aliases)).toEqual(JSON.stringify(aliases), "alias mapping missmatch " + (errMessage ? errMessage : "."))
                    }
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
                            "1=1/$M",
                            true
                        );
                    });

                    describe("should proper handle sourcekey path prefix,", function () {
                        it ("when the prefix is used only once and we don't need alias", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfRwhoEsbKBfAGlCcIDNNHwgADmAxIcLJFgAWOALZgQ-amnqMorYaOYsAZiSYgAugJAAlAJIARK1uUpOuJBIvXrQA",
                                {"and": [
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["1"]
                                    }
                                ]},
                                "(fk1_col1)=(parse_schema:outbound1:id)/(id)=(parse_schema:outbound1_inbound1:id)/RID=1/$M",
                                true,
                                "",
                                false,
                                false,
                                {}
                            );
                        });

                        it ("when the prefix used only once and we don't need alias (with null)", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfRwhoEsbKBfAGlCcIDNNHwgADmAxIcLJFgAWOALZgQ-amnqMorYaOYsAZiSYgAugJAAlAJIARK1uUpOuJPghoANr+trIA",
                                {"and": [
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": [null]
                                    }
                                ]},
                                "parse_schema:outbound1_inbound1/RID::null::/(id)=(parse_schema:outbound1:id)/M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                                true,
                                "",
                                false,
                                true,
                                {}
                            );
                        });

                        it ("when the prefix is used more than once and we need alias", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZxANCFgBYrO5I48EDRABdAL7tk6bDiEzMuAsVik0lalHqMWbEFNDMIVNNCEgADmAxIcdJDxwBbMCE7lTtOsa-a6AGZ4opKcAEoAkgAi4pw8fAIWAEziEpJAA",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity",
                                        "choices": ["1"]
                                    },
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["2"]
                                    }
                                ]},
                                "M_P1:=(fk1_col1)=(parse_schema:outbound1:id)/RID=1/$M/$M_P1/(id)=(parse_schema:outbound1_inbound1:id)/RID=2/$M",
                                true,
                                "",
                                false,
                                false,
                                {"outbound1_entity":"M_P1"}
                            );
                        });

                        it ("facets with null should not share the same table instance", function () {
                            expectLocation(
                                "",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity",
                                        "choices": ["1"]
                                    },
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": [null]
                                    },
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"outbound": ["parse_schema", "outbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["2"]
                                    }
                                ]},
                                [
                                    "parse_schema:outbound1_inbound1/RID::null::/(id)=(parse_schema:outbound1:id)",
                                    "M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                                    "M_P1:=(fk1_col1)=(parse_schema:outbound1:id)/RID=1/$M",
                                    "$M_P1/(id)=(parse_schema:outbound1_outbound1:id)/RID=2/$M"
                                ].join("/"),
                                true,
                                "",
                                false,
                                true,
                                {"outbound1_entity":"M_P1"}
                            );
                        });

                        it ("when recursive prefix is used only once and we don't need alias", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfQEsIG1mWB3FgA4YcAMzYAPFjgg02NSgF8ANKA5do+EALAYkOFkiwALHAFswIJdTT1GUVmrsPOTliJJMQAXWUgASgCSACLeVsYobLhImp4+PkA",
                                {"and": [
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_inbound1_w_prefix_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["1"]
                                    }
                                ]},
                                "(fk1_col1)=(parse_schema:outbound1:id)/(id)=(parse_schema:outbound1_inbound1:id)/(id)=(parse_schema:outbound1_inbound1_inbound1:id)/RID=1/$M",
                                true,
                                "",
                                false,
                                false,
                                {}
                            );
                        });

                        it ("when recursive prefix is used only once and we don't need alias (with null)", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfQEsIG1mWB3FgA4YcAMzYAPFjgg02NSgF8ANKA5do+EALAYkOFkiwALHAFswIJdTT1GUVmrsPOTliJJMQAXWUgASgCSACLeVsYobLhI+BBoADZxPj5AA",
                                {"and": [
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_inbound1_w_prefix_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": [null]
                                    }
                                ]},
                                "parse_schema:outbound1_inbound1_inbound1/RID::null::/(id)=(parse_schema:outbound1_inbound1:id)/(id)=(parse_schema:outbound1:id)/M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                                true,
                                "",
                                false,
                                true
                            );
                        });

                        it ("when recursive prefix is used more than once and we need alias", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfQEsIG1mWB3FgA4YcAMzYAPFjgg02NSgF8ANKA5do+EALAYkOFkiwALHAFswIJdTT1GUVmrsPOTliJJMQAXWUgASgCSACLeVsYobLhImp4+KoTo2DhklLDWttz27C6ZrPxCohJSMnKUYUYRUZoATN7KyIm4+A3EyRRUtOpZ0rLyIPXpXZrauvqGJuaWg67usb6BIV7llTjRCCAAzFMALHU+QA",
                                {"and": [
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_inbound1_w_prefix_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["1"]
                                    },
                                    {
                                        "sourcekey": "outbound1_inbound1_w_prefix_entity",
                                        "choices": ["2"]
                                    },
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"outbound": ["parse_schema", "outbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["3", "4"]
                                    }
                                ]},
                                [
                                    "M_P2:=(fk1_col1)=(parse_schema:outbound1:id)/M_P1:=(id)=(parse_schema:outbound1_inbound1:id)",
                                    "(id)=(parse_schema:outbound1_inbound1_inbound1:id)/RID=1/$M/$M_P1/RID=2/$M",
                                    "$M_P2/(id)=(parse_schema:outbound1_outbound1:id)/RID=any(3,4)/$M",
                                ].join("/"),
                                true,
                                "",
                                false,
                                false,
                                {"outbound1_entity":"M_P2","outbound1_inbound1_w_prefix_entity":"M_P1"}
                            );
                        });

                        it ("when the prefix that changes the end column used once and we don't need alias", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZhdzMANCFgBYpmuJHHggaIALoBfGUA",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity_id",
                                        "choices": ["1"]
                                    },

                                ]},
                                "(fk1_col1)=(parse_schema:outbound1:id)/id=1/$M",
                                true,
                                "",
                                false,
                                false,
                                {}
                            );

                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPrlVq11pICWEA5g2pdVHo4IZdmUJ12MADQgsACxTtcSOPBA0QAXQC+uoA",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_outbound1_using_outbound1_entity_id",
                                        "choices": ["1"]
                                    }
                                ]},
                                "(fk1_col1)=(parse_schema:outbound1:id)/(id)=(parse_schema:outbound1_outbound1:id)/RID=1/$M",
                                true,
                                " case 2",
                                false,
                                false,
                                {}
                            );
                        });

                        it ("when the prefix that changes the end column used once and we don't need alias (with null)", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZhdzMANCFgBYpmuJHHgQ0AGwkBdAL5ygA",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity_id",
                                        "choices": [null]
                                    },

                                ]},
                                "parse_schema:outbound1/id::null::/M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                                true,
                                " case 1",
                                false,
                                true,
                                {}
                            );
                        });

                        it ("when the prefix that changes the end column used more than once and we need alias", function () {
                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZhdzMANCFgBYpmuJHHggaIALoBfLsnTZ8REuSppaDJq3ZYUAGxA9+g4aJAAmKdJlA",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity_id",
                                        "choices": ["1"]
                                    },
                                    {
                                        "sourcekey": "outbound1_entity_col",
                                        "choices": ["2"]
                                    }
                                ]},
                                "M_P1:=(fk1_col1)=(parse_schema:outbound1:id)/id=1/$M/$M_P1/col=2/$M",
                                true,
                                " case 1",
                                false,
                                false,
                                {"outbound1_entity":"M_P1","outbound1_entity_id":"M_P1"}
                            )

                            expectLocation(
                                "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZhdzMANCFgBYpmuJHHggaIALoBfLsnTZ8REuSppadVdSj00SZhADmmtJW31GLNh268BQnCIQgATFNnzMuAsVilTahqWrOxYKAA2IDz8gsKiIADM7jJAA",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity_id",
                                        "choices": ["1"]
                                    },
                                    {
                                        "sourcekey": "outbound1_outbound1_using_outbound1_entity_id",
                                        "choices": ["2"]
                                    },
                                    {
                                        "sourcekey": "outbound1_entity_col",
                                        "choices": ["3"]
                                    }
                                ]},
                                "M_P1:=(fk1_col1)=(parse_schema:outbound1:id)/id=1/$M/$M_P1/(id)=(parse_schema:outbound1_outbound1:id)/RID=2/$M/$M_P1/col=3/$M",
                                true,
                                " case 2",
                                false,
                                false,
                                {"outbound1_entity":"M_P1","outbound1_entity_id":"M_P1"}
                            );

                            expectLocation(
                                "",
                                {"and": [
                                    {
                                        "sourcekey": "outbound1_entity_id",
                                        "choices": ["1"]
                                    },
                                    {
                                        "sourcekey": "outbound1_outbound1_using_outbound1_entity_id",
                                        "choices": [null]
                                    },
                                    {
                                        "sourcekey": "outbound1_entity_col",
                                        "choices": ["3"]
                                    }
                                ]},
                                [
                                    "parse_schema:outbound1_outbound1/RID::null::",
                                    "(id)=(parse_schema:outbound1:id)/M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                                    "M_P1:=(fk1_col1)=(parse_schema:outbound1:id)/id=1/$M",
                                    "$M_P1/col=3/$M"
                                ].join("/"),
                                true,
                                " case 3",
                                false,
                                true,
                                {"outbound1_entity":"M_P1","outbound1_entity_id":"M_P1"}
                            );
                        });

                        it ("mixture of all different types", function () {
                            expectLocation(
                                "",
                                {"and": [
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_inbound1_w_prefix_entity"},
                                            {"inbound": ["parse_schema", "outbound1_inbound1_inbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["1"]
                                    },
                                    {
                                        "sourcekey": "outbound1_inbound1_w_prefix_entity",
                                        "choices": ["2"]
                                    },
                                    {
                                        "sourcekey": "outbound1_entity_id",
                                        "choices": ["1"]
                                    },
                                    {
                                        "source": [
                                            {"sourcekey": "outbound1_entity"},
                                            {"outbound": ["parse_schema", "outbound1_fk1"]},
                                            "RID"
                                        ],
                                        "choices": ["3", "4"]
                                    },
                                    {
                                        "sourcekey": "outbound1_outbound1_using_outbound1_entity_id",
                                        "choices": ["2"]
                                    },
                                    {
                                        "sourcekey": "outbound1_entity_col",
                                        "choices": ["3"]
                                    }
                                ]},
                                [
                                    "M_P2:=(fk1_col1)=(parse_schema:outbound1:id)",
                                    "M_P1:=(id)=(parse_schema:outbound1_inbound1:id)/(id)=(parse_schema:outbound1_inbound1_inbound1:id)/RID=1/$M",
                                    "$M_P1/RID=2/$M",
                                    "$M_P2/id=1/$M",
                                    "$M_P2/(id)=(parse_schema:outbound1_outbound1:id)/RID=any(3,4)/$M",
                                    "$M_P2/(id)=(parse_schema:outbound1_outbound1:id)/RID=2/$M",
                                    "$M_P2/col=3/$M"
                                ].join("/"),
                                true,
                                "",
                                false,
                                false,
                                {"outbound1_entity":"M_P2","outbound1_inbound1_w_prefix_entity":"M_P1","outbound1_entity_id":"M_P2"}
                            );
                        });

                        /*
                        // optimiziation has been removed
                        // filter is the based on the same values, so it should ignroe the last step
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfQEsIG1mWB3FgA4YcAMzYAPFjgg02NSgF8ANKA5do+EALAYkOFkiwALHAFswIJdTT1GUVmrsPOTliJJMQAXWUg2MLytjFDZcJE1PHx8gA",
                            {"and": [
                                {
                                    "source": [
                                        {"sourcekey": "outbound1_inbound1_w_prefix_entity"},
                                        {"inbound": ["parse_schema", "outbound1_inbound1_inbound1_fk1"]},
                                        "id"
                                    ],
                                    "choices": ["1"]
                                }
                            ]},
                            "M_P2:=(fk1_col1)=(parse_schema:outbound1:id)/M_P1:=(id)=(parse_schema:outbound1_inbound1:id)/id=1/$M",
                            true,
                            " case 4 (recursive path where last node will be ignored)",
                            false,
                            false
                        );

                        // filter is the based on the same values, so it should ignroe the last step (also with null)
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JFU1wGscBPOEdAFwCN1oBGAfQEsIG1mWB3FgA4YcAMzYAPFjgg02NSgF8ANKA5do+EALAYkOFkiwALHAFswIJdTT1GUVmrsPOTliJJMQAXWUg2MLytjFDZcJHwINAAbKJ8fIA",
                            {"and": [
                                {
                                    "source": [
                                        {"sourcekey": "outbound1_inbound1_w_prefix_entity"},
                                        {"inbound": ["parse_schema", "outbound1_inbound1_inbound1_fk1"]},
                                        "id"
                                    ],
                                    "choices": [null]
                                }
                            ]},
                            "parse_schema:outbound1_inbound1/id::null::/(id)=(parse_schema:outbound1:id)/M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                            true,
                            " case 5 (recursive path where lawst node will be ignored with null)",
                            false,
                            true
                        );
                        */
                    });

                    it ("should properly handle array as source", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEABzAyRwH0ksALHAWzBABprb6GRMCQA2jAGYBrAIwgAugF9uoAJYQyaCgj51GzNpx6E0pclGkM1G6BamzFvAEoBJACLzerFCtxJK9hUUgA",
                            {"and": [
                                {
                                    "source": [
                                        {"outbound": ["parse_schema", "parse_table_fk1"]},
                                        {"inbound": ["parse_schema", "outbound1_inbound1_fk1"]},
                                        "RID"
                                    ],
                                    "choices": ["1"]
                                }
                            ]},
                            "(fk1_col1)=(parse_schema:outbound1:id)/(id)=(parse_schema:outbound1_inbound1:id)/RID=1/$M",
                            true,
                            " case 1 (foreign key path)",
                            false,
                            false
                        );

                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEABzAyRwH0ksALHAWzBABprb6GRMCQA2jAGYBrAIwgAugF9uoAJYQyaCgj51GzNpx6E0pclGkM1G6BamzFvAEoBJACLzerFCtxJ8ENBERRUUgA",
                            {"and": [
                                {
                                    "source": [
                                        {"outbound": ["parse_schema", "parse_table_fk1"]},
                                        {"inbound": ["parse_schema", "outbound1_inbound1_fk1"]},
                                        "RID"
                                    ],
                                    "choices": [null]
                                }
                            ]},
                            "parse_schema:outbound1_inbound1/RID::null::/(id)=(parse_schema:outbound1:id)/M:=right(id)=(parse_schema:parse_table:fk1_col1)",
                            true,
                            " case 2 (foreign key path with null)",
                            false,
                            true
                        );

                    })

                    // other array for source test cases are in faceting spec.
                });

                describe("regarding sourcekey attribute, ", function () {
                    var searchFacet = {"and": [{"sourcekey": "search-box", "search": ["term"]}]};
                    var searchBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IALjhgLYgAugF9RQA";


                    it ("should throw an error if catalog is not passed", function () {
                        expectError(searchBlob, false, "");
                    });

                    it ("should throw an error if the sourcekey is not valid.", function () {
                        // {"and": [{"some-invalid-value": "search-box", "choices": ["1"]}]}
                        expectError("N4IghgdgJiBcDaoDOB7AtgUwLQEsIDcwAbHKLQogVwzhCQzACcBjACywCMUAPEAGhBsUOZhiRx4IAIwgAugF8FQA", false, "");
                    });

                    // NOTE extra test cases are in refererence/13.search.js
                    it ("should support search-box.", function () {
                        expectLocation(searchBlob, searchFacet, "*::ciregexp::term", false, "with schema");
                        expectLocation(searchBlob, searchFacet, "*::ciregexp::term", false, "without schema", true);
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixQBsQAaAgCxQEtck54QBGEAXQF9Tl1scBrHAE98SHGGwUAtACMUADzIhR4rBQYgAbmBIcOQA",
                            {"and": [
                                {"source": "col", "choices": ["1"]},
                                {"sourcekey": "search-box", "search": ["val"]}
                            ]},
                            "col=1/$M/*::ciregexp::val",
                            true,
                            "mixed with other facets"
                        );
                    });

                    it ("should handle valid sourcekeys.", function () {
                        // normal sourcekey
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZxANCFgBYrO5I48EADcaIALoBfaUA",
                            {"and": [ {"sourcekey": "outbound1_entity", "choices": ["v1"]} ]},
                            "(fk1_col1)=(parse_schema:outbound1:id)/RID=v1/$M",
                            true,
                            " case 1"
                        );

                        // sourcekey with path prefix
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPoCWEVatjz1U9A7nRjlkxIGANxx0ADvwBmDAB50cEMgzLEANCCwALFA1xI48ECJogAugF8rQA",
                            {"and": [ {"sourcekey": "outbound1_inbound1_inbound1_w_recursive_prefix_entity", "choices": ["v1"]} ]},
                            "(fk1_col1)=(parse_schema:outbound1:id)/(id)=(parse_schema:outbound1_inbound1:id)/(id)=(parse_schema:outbound1_inbound1_inbound1:id)/RID=v1/$M",
                            true,
                            " case 2 (with path prefix)",
                            false,
                            false,
                            {} // alias won't be added since it's not used by other parts of the URL
                        );

                        // multiple sourcekeys using the same prefix
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZxANCFgBYrO5I48EADcaIALoBfdsnTZ8REuSppadZhFXrN2qPQDudDDiyYkzETjoAHEwDNmADwZNWHLr345BCUQGZJGTlMXAJiWFI0Smp9DS1Yw1sHZ1cWNhBOHj4BIVEAJiDpIA",
                            {"and": [
                                {"sourcekey": "outbound1_entity", "choices": ["v1"]},
                                {"sourcekey": "outbound1_inbound1_inbound1_w_recursive_prefix_entity", "choices": ["v3"]},
                                {"sourcekey": "outbound1_inbound1_w_prefix_entity", "choices": ["v2"]}
                            ]},
                            [
                                "M_P1:=(fk1_col1)=(parse_schema:outbound1:id)/RID=v1/$M",
                                "$M_P1/M_P2:=(id)=(parse_schema:outbound1_inbound1:id)/(id)=(parse_schema:outbound1_inbound1_inbound1:id)/RID=v3/$M",
                                "$M_P2/RID=v2/$M"
                            ].join("/"),
                            true,
                            " case 3 (multiple sourcekeys with path prefix)",
                            false,
                            false,
                            {"outbound1_entity":"M_P1","outbound1_inbound1_w_prefix_entity":"M_P2"}
                        )
                    });

                    it ("should handle urls without schema name.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60AjAPo4RkCWZxANCFgBYrO5I48EADcaIALoBfaUA",
                            {"and": [ {"sourcekey": "outbound1_entity", "choices": ["v1"]} ]},
                            "(fk1_col1)=(parse_schema:outbound1:id)/RID=v1/$M",
                            true,
                            "without schema",
                             true
                        );
                    });
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
                            "c::null::/$M",
                            true
                        );
                    });

                    it ("should handle unicode characters.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhCwAsUBLXJOeQ0kAXQF8ug",
                            {"and": [ {"source": unicodeSample, "choices": [unicodeSample]} ]},
                            encodedUnicodeSample + "=" + encodedUnicodeSample + "/$M",
                            true
                        );
                    });

                    it ("should handle multiple values.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTnhAEZiAmIgZgF0BfLoA",
                            {"and": [ {"source": "c", "choices": ["1", 2, 3]} ]},
                            "c=any(1,2,3)/$M",
                            true
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
                            "c::ciregexp::" + options.ermRest._fixedEncodeURIComponent(intRegexPrefix + "1" + intRegexSuffix) + "/$M",
                            true
                        );

                        var useQuantifiedSyntax = options.catalog.features.quantified_value_lists;
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALOecAAgCMQBdAXzaA",
                            {"and": [ {"source": "c", "search": ["a b"]} ]},
                            useQuantifiedSyntax ? 'c::ciregexp::all(a,b)/$M' : 'c::ciregexp::a&c::ciregexp::b/$M',
                            true
                        );
                    });

                    it("should handle unicode characters.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhCRzGwAs55wQBdAX3aA",
                            {"and": [ {"source": unicodeSample, "search": ["a"] } ]},
                            encodedUnicodeSample + "::ciregexp::a/$M",
                            true
                        );
                    });

                    it ("should handle multiple values.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQkcxsALOecYkAIxAF0BfNoA",
                            {"and": [ {"source": "c", "search": ["a", "b"]} ]},
                            "c::ciregexp::a;c::ciregexp::b/$M",
                            true
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
                            "c::geq::1/$M",
                            true
                        );

                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWzAA98AXEAXwF0v2g",
                            {"and": [ {"source": "c", "ranges": [{"max":"t"}]} ]},
                            "c::leq::t/$M",
                            true
                        );
                    });

                    it ('should handle exclusive ranges', function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGExiAfRwA8sAbNEgYA3PLAAuGNDgC+AXQWygA",
                            {"and": [ {"source": "c", "ranges": [{"min":1, "min_exclusive": true}]} ]},
                            "c::gt::1/$M", true, "min exclusive"
                        );
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWzAA84BWEhxgfR0awBs0SAJYA3PLAAuGNDgC+AXQWygA",
                            {"and": [ {"source": "c", "ranges": [{"max":5, "max_exclusive": true}]} ]},
                            "c::lt::5/$M", true, "max exclusive"
                        );

                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGExiAfRwA8sAbNEgYA3PLAAuGNDnZgecAKxye3PoOFi4UmQF8Augd1A",
                            {"and": [ {"source": "c", "ranges": [{"min":1, "min_exclusive": true, "max":5, "max_exclusive": true}]} ]},
                            "c::gt::1&c::lt::5/$M", true, "min and max exclusive"
                        );

                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGEusADzgFZ2uA+jk5YANmiQMAbnlgAXDGhwBfALprlQA",
                            {"and": [ {"source": "c", "ranges": [{"min":1, "max":5, "max_exclusive": true}]} ]},
                            "c::geq::1&c::lt::5/$M", true, "min inclusive, max exclusive"
                        );

                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGExiAfRwA8sAbNEgYA3PLAAuGNDnZgecAKwBfALprlQA",
                            {"and": [ {"source": "c", "ranges": [{"min":1, "min_exclusive": true, "max":5}]} ]},
                            "c::gt::1&c::leq::5/$M", true, "min inclusive, max exclusive"
                        );
                    });

                    it("should handle unicode characters.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhA0gHMck5EQBbASwn2LMubAA9OpEAF8AumOFA",
                            {"and": [ {"source": unicodeSample, "ranges": [{"min": unicodeSample, "max": unicodeSample}] } ]},
                            encodedUnicodeSample + "::geq::" + encodedUnicodeSample + "&" + encodedUnicodeSample + "::leq::" + encodedUnicodeSample + "/$M",
                            true
                        );
                    });

                    it("should handle multiple values.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQNIBzHJOREAWwEsI4BGAXyNDrAA98AXEBy5M4AWhYlufWAFY2AXUVsgA",
                            {"and": [ {"source": "c", "ranges": [{"min":1}, {"max":"t"}, {"min": -1, "max": 5}]} ]},
                            "c::geq::1;c::leq::t;c::geq::-1&c::leq::5/$M",
                            true
                        );
                    });
                });

                describe("regarding `not_null` attribute, ", function () {
                    it ("should ignore the value if it's not `true`.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTngjQBsGBdEiFAFwH16naQAjCGYBfUUA",
                            {"and": [ {"source": "c", "choices": [null], "not_null": ["1"] }]},
                            "c::null::/$M",
                            true
                        );
                    });

                    it ("should create a not-null filter if it's `true`", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoQIUAXAfQjQBta5yM0cBfAXVaA",
                            {"and": [ {"source": "c", "not_null": true} ]},
                            "!(c::null::)/$M",
                            true
                        );
                    });

                    it ("should handle unicode characters.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4kAUgAAkBUgEAGhAhQBcB9CNAGybhozRwF8BdLoA",
                            {"and": [ {"source": unicodeSample, "not_null": true} ] },
                            "!(" + encodedUnicodeSample + "::null::)/$M",
                            true
                        );
                    });

                    it ("should handle not_null and choice=null filter.", function () {
                        expectLocation(
                            "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixABoCALFAS1yTngjQBsGBdEiFAFwH16m4OMaHAF9mwoA",
                            {"and": [ {"source": "c", "choices": [null], "not_null": true} ]},
                            "c::null::;!(c::null::)/$M",
                            true
                        );
                    });
                });

                it ("should throw an error if search-box doesn't have search.", function () {
                    // {"and": [ {"sourcekey": "search-box", "choices": ["test"]} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0IWlKAlrknPCABccSASAC6AX0lA");
                });

                it ("should throw an error if one of the facets don't have any constraints.", function () {
                    // {"and": [ {"source": "column"} ]}
                    expectError("N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixQBs0BbCEAXwF1Kg");
                });
            });
        });


        describe("CustomFacets, ", function () {

            var customFacetError = "Given encoded string for cfacets is not valid.", location, blob, cfacets;
            var testCustomFacets = function (uri, blob, cfacets, ermrestPath) {
                var loc = options.ermRest.parse(uri);
                expect(loc.customFacets.decoded).toEqual(cfacets, "customFacets missmatch");
                expect(loc.customFacets.encoded).toEqual(blob, "blob missmatch");
                expect(loc.uri).toEqual(uri, "uri missmatch.");
                expect(loc.ermrestPath).toEqual(ermrestPath, "ermrestCompactUri missmatch");
                if (typeof cfacets.displayname === "string") {
                    expect(loc.customFacets.displayname.value).toEqual(cfacets.displayname, "displayname missmatch");
                    expect(loc.customFacets.displayname.isHTML).toEqual(false, "isHTML missmatch");
                } else {
                    expect(loc.customFacets.displayname.value).toEqual(cfacets.displayname.value, "displayname missmatch");
                    expect(loc.customFacets.displayname.isHTML).toEqual(cfacets.displayname.isHTML, "isHTML missmatch");
                }
            };

            describe("getter, ", function () {
                it("when uri doesn't have any facets, Location.customFacets should be undefined.", function () {
                    location = options.ermRest.parse(baseUri);
                    expect(location.customFacets).toBeUndefined();
                });

                describe("when cfacets is not well-defined, ", function () {
                    it ("when uri has an invalid cfacests blob, parser should throw an error.", function () {
                        expect(function () {
                            options.ermRest.parse(baseUri + "/*::cfacets::invalidblob");
                        }).toThrow(customFacetError);
                    });

                    it ("when uri has a valid cfacets blob but `facets` and `ermrest_path` are missing, parser should throw an error.", function () {
                        // {"displayname": "value"}
                        blob = "N4IgJglgzgDgNgQwJ4DsEFsCmIBcIBuCcArtgL5A";
                        expect(function () {
                            options.ermRest.parse(baseUri + "/*::cfacets::" + blob);
                        }).toThrow(customFacetError);
                    });
                });

                describe("when cfacets is well-defined", function () {
                    it ("should handle passing only facets.", function () {
                        blob = "N4IgJglgzgDgNgQwJ4DsEFsCmIBcIBuCcArtgDQgBmCAxpgC5S6gIpi4DaoUA9sQE51cIGjzggKNABY8IdJjg4BGALoBfdWqA";
                        testCustomFacets(
                            baseUri + "/*::cfacets::" + blob,
                            blob,
                            {"displayname": "value", "facets": {"and": [{"source": "col", "choices": [1]}]}},
                            "M:=parse_schema:parse_table/col=1/$M"
                        );
                    });

                    it ("should handle passing only ermrest_path.", function () {
                        // {"displayname": {"value": "<strong>value</strong>", "isHTML": true}, "ermrest_path": "id=2"}
                        blob = "N4IgJglgzgDgNgQwJ4DsEFsCmIBcoBuCcArtjiADxQAuATgPYoDmAfISZhQPQ0PMsgANCGgAJACoBZADK46pAL7DMtdLUw0A+jATUAFrhFgAvACYQCoA";
                        testCustomFacets(
                            baseUri + "/*::cfacets::" + blob,
                            blob,
                            {"displayname": {"value": "<strong>value</strong>", "isHTML": true}, "ermrest_path": "id=2"},
                            "M:=parse_schema:parse_table/id=2"
                        );
                    });

                    it ("should handle passing both facets and ermrest_path", function () {
                        blob = "N4IgJglgzgDgNgQwJ4DsEFsCmIBcIBuCcArtgDQiYBO6VmUALgPowIMAWuIEYAvAEwgKAMwQBjTAyi5QCFGFwBtUFAD2xKhK5jVcISDHtVECdJyKAjAF0AvrZtA";
                        testCustomFacets(
                            baseUri + "/*::cfacets::" + blob,
                            blob,
                            {"displayname": "value", "ermrest_path": "id=2", "facets": {"and": [{"source": "col", "choices": [1]}]}},
                            "M:=parse_schema:parse_table/col=1/$M/id=2"
                        );
                    });

                    it ("should handle having both cfacets and facets.", function () {
                        // {"displayname": "value", "ermrest_path": "id=2"}
                        blob = "N4IgJglgzgDgNgQwJ4DsEFsCmIBcIBuCcArtgDQiYBO6VmUALgPowIMAWuIEYAvAEwgAvkA";

                        // facetObj = {"and":[{"source":"accession", "choices":["1"]}, {"source":"column", "search":["test"]}]}
                        var facetBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhAEYQBdAX0uXWzywaKADZoAthWpIcYbLWYgALjiRLOXbkA";
                        testCustomFacets(
                            baseUri + "/*::facets::" + facetBlob + "/*::cfacets::" + blob,
                            blob,
                            {"displayname": "value", "ermrest_path": "id=2"},
                            "M:=parse_schema:parse_table/accession=1/$M/column::ciregexp::test/$M/id=2"
                        );
                    });
                });
            });

            describe("setter, ", function () {
                var currLoc;
                beforeEach(function () {
                    currLoc = options.ermRest.parse(
                        baseUri + "/*::cfacets::N4IgJglgzgDgNgQwJ4DsEFsCmIBcIBuCcArtgDQgBmCAxpgC5S6gIpi4DaoUA9sQE51cIGjzggKNABY8IdJjg4BGALoBfdWqA"
                    );
                });

                it ('should be able to change it to something else', function () {
                    var newCustomFacet = {"displayname": "value", "facets": {"and": [{"source": "col", "choices": [1]}]}};
                    currLoc.customFacets = newCustomFacet;
                    expect(currLoc.customFacets.decoded).toEqual(newCustomFacet, "custom facets missmatch");
                    expect(currLoc.ermrestPath).toEqual("M:=parse_schema:parse_table/col=1/$M");
                });

                it ("should be able to set it to null.", function () {
                    currLoc.customFacets = null;
                    expect(currLoc.customFacets).toBeUndefined("custom facets missmatch");
                    expect(currLoc.ermrestPath).toEqual("M:=parse_schema:parse_table");
                });

            });
        });

        describe("createPath, ", function() {
            var validBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixQBs0BbCEAGgIAsUBLXJOeEAFxyTZAF0BffkA";
            var facetObj = {
                "and":[{"source": "column", "choices": ["test"]}]
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

        describe("createSearchPath, ", function() {
            var validBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCEjmNgBYC0ARigB4gA0p5Vc8IALjktwAJeGALYgAugF8pQA";
            var facetObj = {
                "and":[{"sourcekey": "search-box", "search": ["test term"]}]
            };
            var path;

            it('should throw error if parameters are invalid.', function() {
                expect(function () {
                    options.ermRest.createSearchPath(2, null, "table");
                }).toThrow("catalogId must be an string.");
                expect(function () {
                    options.ermRest.createSearchPath("2", null);
                }).toThrow("tableName must be an string.");
            });

            it("should handle not passing any schemaName", function() {
                path = options.ermRest.createSearchPath("1", null, "table", "test term");
                expect(path).toEqual("#1/table/*::facets::" + validBlob);
            });

            it("should handle passing no search term", function() {
                path = options.ermRest.createSearchPath("1", "schema", "table", "");
                expect(path).toEqual("#1/schema:table");
            });

            it("should return a valid path, given valid parameters.", function() {
                path = options.ermRest.createSearchPath("1", "schema", "table", "test term");
                expect(path).toEqual("#1/schema:table/*::facets::" + validBlob);
            });

            it ("should accept array of column names", function () {
                path = options.ermRest.createSearchPath("2", "s1", "t1", "test term", ["col 1"]);
                expect(path).toEqual("#2/s1:t1/col%201::ciregexp::test%20term", "case 1");

                path = options.ermRest.createSearchPath("2", "s1", "t1", "another term", ["col1", "col 2"]);
                expect(path).toEqual("#2/s1:t1/col1::ciregexp::another%20term;col%202::ciregexp::another%20term", "case 2");
            });
        });

        describe("createLocation, ", function () {
            var facetObj = {
                "and":[{"source":"column", "search": ["test"]}]
            };
            var parsedFacet = "column::ciregexp::test/$M";
            var service = "test.com/ermrest";
            var location;

            it('should throw error if parameters are invalid.', function() {
                expect(function () {
                    options.ermRest.createLocation(service, 2, null, "table");
                }).toThrow("catalogId must be an string.");
                expect(function () {
                    options.ermRest.createLocation(service, "2", null);
                }).toThrow("tableName must be an string.");
            });

            it("should handle not passing any schemaName", function() {
                location = options.ermRest.createLocation(service, "1", null, "table", facetObj);
                expect(location.ermrestCompactUri).toEqual(service + "/catalog/1/entity/M:=table/" + parsedFacet);
            });

            it("should handle passing an empty object for facets", function() {
                location = options.ermRest.createLocation(service, "1", "schema", "table", {});
                expect(location.ermrestCompactUri).toEqual(service + "/catalog/1/entity/M:=schema:table");
            });

            it("should return a valid path, given valid parameters.", function() {
                location = options.ermRest.createLocation(service + "/", "1", "schema", "table", facetObj);
                expect(location.ermrestCompactUri).toEqual(service + "/catalog/1/entity/M:=schema:table/" + parsedFacet);
            });
        });

        describe("Decoding Version snapshot, ", function () {
            var decode = options.ermRest.versionDecodeBase32;

            it("should decode snapshot values to milliseconds from epoch.", function() {
                expect(decode('0')*1000).toBe(0.0);
                expect(decode('2')*1000).toBe(1.0);
                expect(decode('Z-ZZZZ-ZZZZ-ZZZY')*1000).toBe(-1.0);
                expect(decode('G-0000-0000-0000')*1000).toBe(-9.223372036854776e+18);
                expect(decode('Z-M9DK-J8QS-NN80')*1000).toBe(-210866774822000000.0);
            });

            it("should decode to a value that we can properly convert to a datetime.", function () {
                expect(options.ermRest._moment(decode('Z-ZZZZ-ZZZY-2YW0')).utc().format("YYYY-MM-DDTHH:mm:ss")).toBe('1969-12-31T23:59:59');
                expect(options.ermRest._moment(decode('0')).utc().format("YYYY-MM-DDTHH:mm:ss")).toBe('1970-01-01T00:00:00');
                expect(options.ermRest._moment(decode('1-X140')).utc().format("YYYY-MM-DDTHH:mm:ss")).toBe('1970-01-01T00:00:01');
                expect(options.ermRest._moment(decode('2R6-QAMZ-AB8W')).utc().format("YYYY-MM-DDTHH:mm:ss.SSS")).toBe('2019-03-05T18:49:24.459');
            });
        });

    // NOTE: search test cases are in refererence/13.search.js
    // NOTE: more facet test cases are in faceting test specs
};
