// Unit Test that are related to annotations should be here

var includes = require('./../../utils/ermrest-init.js').init();

var server = includes.server;
var ermrestUtils = includes.ermrestUtils;
var importUtils = includes.importUtils;

describe('For determining order of visible columns, ', function () {
    var catalog_id, schemaName = "visible_columns_schema", schema, catalog;

    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        importUtils.importSchemas(["/visible_columns/visible_columns.conf.json"])
            .then(function(catalogId) {
                console.log("Data imported with catalogId " + catalogId);
                catalog_id = catalogId;
                return server.catalogs.get(catalog_id);
            }).then(function (response) {
                schema = response.schemas.get(schemaName);
                done();
            }, function(err) {
                catalogId = err.catalogId;
                done.fail(err);
            }).catch(function(err)   {
                console.log(err);
                done.fail(err);
            });
    });

    // Helper function to add 'expect' based on test cases and the specified table
    function runTestCases(table, cases) {
        var columns = schema.tables.get(table).columns;

        Object.keys(cases).forEach(function (key) {
            expect(columns._contextualize(key).names()).toEqual(cases[key]);
        });
    }

    // Test Cases:

    it('should use the defined order in annotations based on its context.', function () {
        runTestCases('table_with_all_contexts', {
            "entry": ['column_1', 'column_2'],
            "edit": ['column_1', 'column_3'],
            "create": ['column_2', 'column_3'],
            "record": ['column_1'],
            "filter": ['column_2'],
            "compact": ['column_3'],
            "*": []
        });
    });

    it('should use `entry` context when context is `edit` or `create` and they are not present in annotation.', function () {
        runTestCases('table_with_entry_filter_compact_star', {
            "edit": ['column_1'], 'create': ['column_1']
        });
    });

    it('should use default (`*`) context for any context not matched by a more specific context name.', function () {
        runTestCases('table_with_entry_filter_compact_star', {
            "record": ['column_2'], 'not_a_context': ['column_2']
        });
    });

    it('should use the default order when context not matched by a more specific context name and default (`*`) context is not present.', function () {
        var expected = ['column_1', 'column_2'];
        runTestCases('table_without_annotation', {
            "entry": expected,
            "edit": expected,
            "create": expected,
            "record": expected,
            "filter": expected,
            "compact": expected,
            "*": expected
        });
    });

    it('should ignore the column names that do not correspond to any column in the table.', function () {
        runTestCases('table_with_entry_filter_compact_star', {
            "filter": ["column_2"]
        });
    });

    it('should ignore repetitive column names and just consider the first one.', function () {
        runTestCases('table_with_entry_filter_compact_star', {
            "compact": ["column_2", "column_1"]
        });
    });

    // This function should be present in all spec files. It will remove the newly created catalog
    afterAll(function (done) {
        importUtils.tear(["/visible_columns/visible_columns.conf.json"], catalog_id, true).then(function() {
            done();
        }, function(err) {
            done.fail();
        });
    })
});
