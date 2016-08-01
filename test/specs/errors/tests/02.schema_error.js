var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Schema exceptions, ', function () {
        var server = options.server, ermRest = options.ermRest, url = options.url.replace('ermrest', ''), ops = {allowUnmocked: true}, 
        			catalog, id = "3423423";

		httpError.setup(options);

        beforeAll(function () {
            catalog = options.catalog;
        });

        var schemaName = "non_existing_schema";
        httpError.testForErrors([{ message: "Schema " + schemaName + " not found in catalog.", type: 'NotFoundError' }], function(error, done) {
            expect(function() { catalog.schemas.get(schemaName); } )
                .toThrow(error);
            done();
        }, "non existing schema retreival");

    });
};