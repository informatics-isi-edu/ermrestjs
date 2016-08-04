var nock = require('nock');

exports.execute = function (options) {

    describe('For determining http behavior on errocode 500, ', function () {
        var server, ermRest, url, ops = {allowUnmocked: true}, catalog, schema, table, id = "3423423";

	    var enableNet = function() {
	        nock.cleanAll();
	        nock.enableNetConnect();
	    };

        beforeAll(function () {
            server = options.server;
            ermRest = options.ermRest;
            catalog = options.catalog;
            schema = catalog.schemas.get('public');
            //table = schema.tables.get('form_test');
            url = options.url.replace('ermrest', '');
        });

        it("should make 5 http retries and then call error callback", function(done) {
	        
        	server._http.max_retries = 5;
        	server._http.initial_delay = 50;
        	var delay  = server._http.max_retries * server._http.initial_delay;

	        nock(url, ops)
	          .get("/ermrest/catalog/" + id + "/schema?cid=null")
	          .reply(500, 'Error message')
	          .persist();

	        var startTime = (new Date()).getTime();

	        server.catalogs.get(id).then(null, function(err) {
	            expect((new Date().getTime()) - startTime).toBeGreaterThan(delay);
	            nock.cleanAll();
	            done();
	        }).catch(function() {
	        	expect(false).toBe(true);
	        	nock.cleanAll();
	        	done();
	        });
	        
	    });


	    afterAll(function() {
	    	enableNet();
	    });

    });
};