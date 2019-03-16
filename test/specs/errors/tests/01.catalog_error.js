var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Catalog exceptions, ', function () {
        var server = options.server,
            ermRest = options.ermRest,
            id = "123123123";

        httpError.setup(options);

        beforeAll(function () {
            server.http.max_retries = 0;
        });

        httpError.testForErrors("GET", ["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
            server.catalogs.get(id).then(function (response) {
                expect(false).toBe(true, "Success cb reached");
                done();
            }, function(err) {
                expect(err instanceof ermRest[error.type]).toBeTruthy("Error is type: " + err.constructor.name + " , when it should be: " + error.type);
                expect(err instanceof ermRest.ERMrestError).toBe(true);
                done();
            }).catch(function (error) {
                console.dir(error);
                expect(false).toBe(true);
                done();
            });
        }, "existing catalog retreival",
        "/ermrest/catalog/" + id);

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
