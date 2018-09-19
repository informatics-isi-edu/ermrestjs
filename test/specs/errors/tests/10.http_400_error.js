var nock = require('nock');

exports.execute = function (options) {

    describe("For determining http 400 error behaviour when Query imeout occurs,", function () {
        var server, ermRest, url,
            ops = {allowUnmocked: true};

        beforeAll(function (done) {
            server = options.server;
            ermRest = options.ermRest;
            url = options.url.replace('ermrest', '');

            server._http.max_retries = 0;
            done();
        });

        it("should be returned as a QueryTimeoutError.", function (done) {
            var queryTimeoutResponse = '400 Bad Request\nQuery run time limit exceeded.';

            nock(url, ops)
                .get("/ermrest/catalog/1235/schema")
                .reply(400, queryTimeoutResponse)
                .persist();

            server.catalogs.get("1235").then(function(res) {
                done.fail("success callback!");
            }, function(err) {
                expect(err.code).toBe(400);
                expect(err.message).toBe(queryTimeoutResponse);

                expect(err instanceof ermRest.QueryTimeoutError).toBe(true);
                expect(err instanceof ermRest.ERMrestError).toBe(true);
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail("catch callback");
            });
        });

	    afterAll(function() {
            nock.cleanAll();
	        nock.enableNetConnect();
	    });

    });

};
