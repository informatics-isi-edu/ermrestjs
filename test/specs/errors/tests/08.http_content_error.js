var nock = require('nock');

exports.execute = function (options) {

    describe("For determining HTTP response objects with content type including HTML,", function () {
        var server, url, catalog,
            id = "7345274", // something very far out of range
            ops = {allowUnmocked: true};

        var htmlResponseMessage = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">'
            + '<html>'
                + '<head>'
                    + '<title>404 Not Found</title>'
                + '</head>'
                + '<body>'
                    + '<h1>Not Found</h1>'
                    + '<p>The requested URL /t.html was not found on this server.</p>'
                + '</body>'
            + '</html>';
        
        var internalServerErrorMessage = "An unexpected error has occurred. ";
        internalServerErrorMessage += "Please report this problem to your system administrators."

        beforeAll(function () {
            server = options.server;
            catalog = options.catalog;
            url = options.url.replace('ermrest', '');

            server.http.max_retries = 0;
        });

        it("should be returned as a 500 error.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/" + id)
                .reply(404, htmlResponseMessage, {"Content-Type": "text/html"});

            server.catalogs.get(id).then(null, function(err) {
                expect(err.code).toBe(500);
                expect(err.message).toBe(internalServerErrorMessage, "message missmatch");
                expect(err.subMessage).toBe(htmlResponseMessage, "subMessage missmatch");
                done();
            }).catch(function() {
                expect(false).toBe(true);
                done();
            });
        });

	    afterAll(function() {
            nock.cleanAll();
	        nock.enableNetConnect();
	    });

    });
};
