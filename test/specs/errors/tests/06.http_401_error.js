var nock = require('nock');

exports.execute = function (options) {

  describe('For determining http 401 error behaviour, ', function () {

    var server, ermRest, url, ops = {allowUnmocked: true}, catalog, schema, table, id = "3423423";

    var enableNet = function() {
        nock.cleanAll();
        nock.enableNetConnect();
    };

    beforeAll(function () {
        server = options.server;
        ermRest = options.ermRest;
        catalog = options.catalog;
        catalogId = options.catalogId;

        url = options.url.replace('ermrest', '');
    });

    describe('For determining http 401 error behaviour, ', function () {
        it("should have no httpUnauthorizedFn handler and make a Get Catalog call and receive an exception with error code 401", function (done) {

            nock(url, ops)
              .get("/ermrest/catalog/" + id)
              .reply(401, 'Service Unavailable');

            server.catalogs.get(id).then(function (response) {
                done.fail("didn't throw any errors");
            }, function(err) {

                expect(err instanceof ermRest.UnauthorizedError).toBe(true);
                expect(err instanceof ermRest.ERMrestError).toBe(true);
                done();
            }).catch(function(err) {
                done.fail(err);
            });
        });


        it("should have httpUnauthorizedFn handler and make a Get Catalog call, for which the handler should be called and catalog call should fail with 404", function(done) {

            nock(url, ops)
              .get("/ermrest/catalog/" + id)
              .reply(401, 'Unauthorized Error');

            ermRest.setHTTP401Handler(function() {
                var defer = ermRest._q.defer();

                nock(url, ops)
                    .get("/ermrest/catalog/" + id)
                    .reply(404, 'Catalog Not Found');

                defer.resolve();
                return defer.promise;
            });

            server.catalogs.get(id).then(function (response) {
                done.fail("didn't throw any errors");
            }, function(err) {
                expect(err instanceof ermRest.NotFoundError).toBe(true);
                expect(err instanceof ermRest.ERMrestError).toBe(true);
                done();
            }).catch(function(err) {
                done.fail(err);
            });

        });

        it ("should ignore the httpUnauthorizedFn if the allowUnauthorized is passed as config to the http function.", function (done) {
            nock(url, ops)
              .get("/ermrest/catalog/" + id)
              .reply(401, 'Unauthorized Error')
              .persist();

            ermRest.setHTTP401Handler(function() {
                var defer = ermRest._q.defer();

                nock(url, ops)
                    .get("/ermrest/catalog/" + id)
                    .reply(404, 'Catalog Not Found');

                defer.resolve();
                return defer.promise;
            });

            server.http.get(url + "ermrest/catalog/" + id, {skipHTTP401Handling: true}).then(function (response) {
                done.fail("didn't throw any errors");
            }, function(err) {
                // since the error is coming directly from the http module, it won't be any of the ERMrestError objects
                expect(err.status).toBe(401);
                done();
            }).catch(function(err) {
                done.fail(err);
            });
        });
    });

    afterEach(function() {
        nock.cleanAll();
        ermRest.setHTTP401Handler(null);
    })

    afterAll(function() {
        enableNet();
        ermRest.setHTTP401Handler(null);
    });

  });
};
