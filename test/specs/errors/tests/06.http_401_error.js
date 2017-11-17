var nock = require('nock');

exports.execute = function (options) {

  describe('For determining http 401 and 409 error behaviour, ', function () {

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
              .get("/ermrest/catalog/" + id + "/schema?cid=null")
              .reply(401, 'Service Unavailable');

            server.catalogs.get(id).then(null, function(err) {
                expect(err instanceof ermRest.UnauthorizedError).toBe(true);
                done();
            }).catch(function() {
                expect(false).toBe(true);
                done();
            });
        });


        it("should have httpUnauthorizedFn handler and make a Get Catalog call, for which the handler should be called and catalog call should fail with 404", function(done) {

            nock(url, ops)
              .get("/ermrest/catalog/" + id + "/schema?cid=null")
              .reply(401, 'Unauthorized Error');

            ermRest.setHttpUnauthorizedFn(function() {
                var defer = ermRest._q.defer();

                nock(url, ops)
                    .get("/ermrest/catalog/" + id + "/schema?cid=null")
                    .reply(404, 'Catalog Not Found');

                defer.resolve();
                return defer.promise;
            });


            server.catalogs.get(id).then(null, function(err) {
                expect(err instanceof ermRest.NotFoundError).toBe(true);
                done();
            }).catch(function(err) {
                console.log(err);
                expect(false).toBe(true);
                done();
            });

        });
      });

      describe("For determining http 409 Conflict error behaviour,", function(){

          it("should have duplicate conflict error and 409 type exception should be thrown.", function(done) {
              nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, 'DuplicateConflictError');

              server.catalogs.get(id).then(null, function(err) {
                  expect(err instanceof ermRest.ConflictError).toBe(true);
                  done();
              }).catch(function(err) {
                  console.log(err);
                  expect(false).toBe(true);
                  done();
              });
          });
          it("should have integrity conflict error and 409 type exception should be thrown.", function(done) {
              nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, 'IntegrityConflictError');

              server.catalogs.get(id).then(null, function(err) {
                  expect(err instanceof ermRest.ConflictError).toBe(true);
                  done();
              }).catch(function(err) {
                  console.log(err);
                  expect(false).toBe(true);
                  done();
              });
          });
          it("should have custom constraint conflict error and 409 type exception should be thrown.", function(done) {
              nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, 'CustomConstraintConflictError');

              server.catalogs.get(id).then(null, function(err) {
                  expect(err instanceof ermRest.ConflictError).toBe(true);
                  done();
              }).catch(function(err) {
                  console.log(err);
                  expect(false).toBe(true);
                  done();
              });
          });
        })



        afterEach(function() {
            nock.cleanAll();
            ermRest.setHttpUnauthorizedFn(null);
        })

        afterAll(function() {
            enableNet();
            ermRest.setHttpUnauthorizedFn(null);
        });

    });
};
