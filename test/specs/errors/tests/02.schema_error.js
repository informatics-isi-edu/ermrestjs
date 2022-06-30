var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Schema exceptions, ', function () {
        var ermRest, catalog, id = "3423423", schema;


        beforeAll(function () {
            ermRest = options.ermRest;
            catalog = options.catalog;
            schema = catalog.schemas.get('error_schema');
        });

        var schemaName = "non_existing_schema";

        httpError.testForErrors(options, [{ message: "Schema " + schemaName + " not found in catalog.", type: 'NotFoundError' }], function(error, done) {
            expect(function() { catalog.schemas.get(schemaName); } )
                .toThrow(error);
            done();
        }, "non existing schema retreival");


        it("should raise a NotFound error on non existing annotation retreival on a schema", function() {
            var annotationName = "non_existing_annotation";

            expect(function() { schema.annotations.get(annotationName); } )
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
