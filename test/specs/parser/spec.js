var includes = require('./../../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe("Parse function and ParsedFilters,", function() {
    var parsedFilter;
    var catalogId = 1,
        schemaName = "parse_schema",
        tableName = "parse_table";

    describe('single filter,', function() {
        var entityId = 10;
        var singleFilterPath = "/catalog/" + catalogId + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        it('_parse should take a uri with a single filter and return a context object.', function() {
            var context = ermRest._parse(includes.url + singleFilterPath);
            parsedFilter = context.filter;

            expect(context).toBeDefined();
            expect(context.path).toBe(singleFilterPath);
            expect(context.catalogId).toBe(catalogId.toString());
            expect(context.schemaName).toBe(schemaName);
            expect(context.tableName).toBe(tableName);
            expect(context.filter instanceof ermRest.ParsedFilter).toBe(true);
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

    describe('multiple filters,', function() {
        var lowerLimit = 1,
            upperLimit = 10,
            sort = "summary";
        var multipleFilterPath = "/catalog/" + catalogId + "/entity/" + schemaName + ":"
            + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "@sort(" + sort + ")";

        it('_parse should take a uri with multiple filters and return a context object.', function() {
            var context = ermRest._parse(includes.url + multipleFilterPath);
            parsedFilter = context.filter;

            expect(context).toBeDefined();
            expect(context.path).toBe(multipleFilterPath);
            expect(context.sort).toBe(sort);
            expect(context.catalogId).toBe(catalogId.toString());
            expect(context.schemaName).toBe(schemaName);
            expect(context.tableName).toBe(tableName);
            expect(context.filter instanceof ermRest.ParsedFilter).toBe(true);
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
