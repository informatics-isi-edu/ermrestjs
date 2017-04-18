var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Catalog exceptions, ', function () {
        var server = options.server, ermRest = options.ermRest, url = options.url.replace('ermrest', ''), ops = {allowUnmocked: true}, 
        			catalog, id = "3423423";

		httpError.setup(options);

        beforeAll(function () {
            catalog = options.catalog;
            server._http.max_retries = 0;
        });

        httpError.testForErrors("GET", ["400", "403", "404", "409", "500", "503"], function(error, done) {
        	server.catalogs.get(id).then(null, function(err) {
        		expect(err instanceof ermRest[error.type]).toBeTruthy();
	            done();
	        }).catch(function(e) {
	        	console.dir(e);
	        	expect(false).toBe(true);
	        	done();
	        });
        }, "existing catalog retreival", 
        "/ermrest/catalog/" + id + "/schema");

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