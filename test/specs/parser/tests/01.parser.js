exports.execute = function (options) {

    describe("Parse function and ParsedFilters,", function() {
        var catalogId = 1,
            schemaName = "parse_schema",
            tableName = "parse_table";

        describe('single filter,', function() {
            var parsedFilter;
            var entityId = 10;
            var singleFilterPath = "/catalog/" + catalogId + "/entity/"
                + schemaName + ":" + tableName + "/id=" + entityId;

            it('_parse should take a uri with a single filter and return a location object.', function() {
                var location = options.ermRest._parse(options.url + singleFilterPath);
                parsedFilter = location._firstFilter;

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
                expect(location.pagingObject).toBe(null);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location._firstFilter instanceof options.ermRest.ParsedFilter).toBe(true);
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

        describe('multiple filters with a conjunction,', function() {
            var parsedFilter;
            var lowerLimit = 1,
                upperLimit = 10,
                sort = "summary",
                text = "some%20random%20text"
            var multipleFilterPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":"
                + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "@sort(" + sort + ")" + "@after(" + text + ")";

            it('_parse should take a uri with multiple filters and return a location object.', function() {
                var location = options.ermRest._parse(options.url + multipleFilterPath);
                parsedFilter = location._firstFilter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + multipleFilterPath);
                expect(location.compactUri).toBe(options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":"
                    + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":"
                    + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "@sort(" + sort + ")"  + "@after(" + text + ")");
                expect(location.compactPath).toBe(schemaName + ":"
                    + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit);
                expect(location.sort).toBe("@sort(" + sort + ")");
                expect(location.sortObject[0].column).toBe("summary");
                expect(location.sortObject[0].descending).toBe(false);
                expect(location.paging).toBe("@after(" + text + ")");
                expect(location.pagingObject.before).toBe(false);
                expect(location.pagingObject.row.length).toBe(1);
                expect(location.pagingObject.row[0]).toBe("some random text");
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location._firstFilter instanceof options.ermRest.ParsedFilter).toBe(true);
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
            var multipleFilterPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":"
                + tableName + "/id=" + firstEntityId + ";id=" + secondEntityId;

            it('_parse should take a uri with multiple filters and return a location object.', function() {
                var location = options.ermRest._parse(options.url + multipleFilterPath);
                parsedFilter = location._firstFilter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + multipleFilterPath);
                expect(location.compactUri).toBe(options.url + multipleFilterPath);
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":"
                    + tableName + "/id=" + firstEntityId + ";id=" + secondEntityId);
                expect(location.compactPath).toBe(schemaName + ":"
                    + tableName + "/id=" + firstEntityId + ";id=" + secondEntityId);
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.sort).toBeUndefined();
                expect(location.sortObject).toBe(null);
                expect(location.paging).toBeUndefined();
                expect(location.pagingObject).toBe(null);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName);
                expect(location._firstFilter instanceof options.ermRest.ParsedFilter).toBe(true);
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

        describe('Entity linking,', function() {
            var parsedFilter;
            var lowerLimit = 1,
                upperLimit = 10,
                sort = "id,summary",
                text = "some%20random%20text",
                tableName2 = "parse_table_2";
            var complexPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":"
                + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)"
                + "@sort(" + sort + ")" + "@after(" + text + ")";

            it('_parse should take a uri with multiple filters and return a location object.', function() {
                var location = options.ermRest._parse(options.url + complexPath);
                parsedFilter = location._firstFilter;

                expect(location).toBeDefined();
                expect(location.uri).toBe(options.url + complexPath);
                expect(location.compactUri).toBe(options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":"
                    + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)") ;
                expect(location.api).toBe("entity");
                expect(location.path).toBe(schemaName + ":"
                    + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)"
                    + "@sort(" + sort + ")"  + "@after(" + text + ")");
                expect(location.compactPath).toBe(schemaName + ":"
                    + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/(id)=(" + schemaName + ":" + tableName2 + ":id2)" );
                expect(location.sort).toBe("@sort(" + sort + ")");
                expect(location.sortObject[0].column).toBe("id");
                expect(location.sortObject[0].descending).toBe(false);
                expect(location.sortObject[1].column).toBe("summary");
                expect(location.sortObject[1].descending).toBe(false);
                expect(location.paging).toBe("@after(" + text + ")");
                expect(location.pagingObject.before).toBe(false);
                expect(location.pagingObject.row.length).toBe(2);
                expect(location.pagingObject.row[0]).toBe("some random text");
                expect(location.catalog).toBe(catalogId.toString());
                expect(location.projectionSchemaName).toBe(schemaName);
                expect(location.projectionTableName).toBe(tableName);
                expect(location.schemaName).toBe(schemaName);
                expect(location.tableName).toBe(tableName2);
                expect(location._firstFilter instanceof options.ermRest.ParsedFilter).toBe(true);
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
    });
}
