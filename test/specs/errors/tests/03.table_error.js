var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Table exceptions, ', function () {
        var ermRest, catalog, schema, table, id = "3423423";

        beforeAll(function () {
            ermRest = options.ermRest
            catalog = options.catalog;
            schema = catalog.schemas.get('error_schema');
            table = schema.tables.get('valid_table_name');
        });

        var tableName = "non_existing_table";
        httpError.testForErrors(options, [{ message: "Table " + tableName + " not found in schema.", type: 'NotFoundError' }], function(error, done) {
            expect(function() { schema.tables.get(tableName); } )
                .toThrow(error);
            done();
        }, "non existing table retreival");


        it("should raise a NotFound error on non existing annotation retreival on a table", function() {
            var annotationName = "non_existing_annotation";

            expect(function() { table.annotations.get(annotationName); })
                .toThrow(new ermRest.NotFoundError("", "Annotation " + annotationName + " not found."));
        });

        afterEach(function() {
            nock.cleanAll();
            nock.enableNetConnect();
        });

        afterAll(function() {
            nock.cleanAll();
            nock.enableNetConnect();
        });
    });
};
