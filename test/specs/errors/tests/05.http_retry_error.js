var nock = require('nock');

exports.execute = function (options) {

    describe('For determining http retry behaviour, ', function () {
        var server, ermRest, url, ops = {allowUnmocked: true}, catalog, schema, table, id = "3423423";

	    var enableNet = function() {
	        nock.cleanAll();
	        nock.enableNetConnect();
	    };

        beforeAll(function () {
            server = options.server;
            ermRest = options.ermRest;
            catalog = options.catalog;
            schema = catalog.schemas.get('error_schema');
            table = schema.tables.get('valid_table_name');
            catalogId = options.catalogId;

            url = options.url.replace('ermrest', '');
        });


        it("should make default 2 http retries with initial 50ms delay and then call error callback for error code 503", function (done) {

        	server.http.max_retries = 2;
        	server.http.initial_delay = 50;
        	var delay  = server.http.initial_delay, i = 0;
        	while (i > server.http.max_retries) {
        		delay *= 2;
        	}
        	delay += server.http.initial_delay;

	        nock(url, ops)
	          .get("/ermrest/catalog/" + id)
	          .reply(503, 'Service Unavailable')
	          .persist();

	        var startTime = (new Date()).getTime();

	        server.catalogs.get(id).then(null, function(err) {
	        	var currentTime = (new Date().getTime());
	        	expect(currentTime - startTime).toBeGreaterThan(delay);
	            expect(err instanceof ermRest.ServiceUnavailableError).toBe(true);
              expect(err instanceof ermRest.ERMrestError).toBe(true);
	            done();
	        }).catch(function() {
	        	expect(false).toBe(true);
	        	done();
	        });
        });


        it("should make 5 http retries with initial 50ms delay and then call error callback for error code 500", function(done) {

        	server.http.max_retries = 5;
        	server.http.initial_delay = 50;
        	var delay  = server.http.initial_delay, i = 0;
        	while (i > server.http.max_retries) {
        		delay *= 2;
        	}
        	delay += server.http.initial_delay;

	        nock(url, ops)
	          .get("/ermrest/catalog/" + id)
	          .reply(500, 'Internal Server Error')
	          .persist();

	        var startTime = (new Date()).getTime();

	        server.catalogs.get(id).then(null, function(err) {
	            expect((new Date().getTime()) - startTime).toBeGreaterThan(delay);
	            expect(err instanceof ermRest.InternalServerError).toBe(true);
              expect(err instanceof ermRest.ERMrestError).toBe(true);
	            done();
	        }).catch(function() {
	        	expect(false).toBe(true);
	        	done();
	        });

	    });


	    it("should make 3 http retry with initial 500ms delay and then call success callback for entity delete", function(done) {

        	server.http.max_retries = 3;
        	server.http.initial_delay = 500;
        	var delay  = server.http.initial_delay, i = 0;
        	while (i < server.http.max_retries-1) {
        		delay *= 2;
        		i++;
        	}
        	delay += server.http.initial_delay;

        	var uri = "/ermrest/catalog/" + catalog.id + "/entity/a:=error_schema:valid_table_name/id=8001"

	        nock(url, ops)
              .filteringPath(function(path){ return uri; })
              .delete(uri)
              .times(server.http.max_retries)
	          .reply(500, 'Internal Server Error');

            var startTime = (new Date()).getTime();

            setTimeout(function() {
            	enableNet();
            }, delay);

	        var filter = new ermRest.BinaryPredicate(table.columns.get("id"), "=", "8001");
            table.entity.delete(filter).then(function() {
            	expect((new Date().getTime()) - startTime).toBeGreaterThan(delay);
            	done();
            }, function(err) {
            	console.dir(err);
                expect(err.message).toBe(true);
	            done();
            }).catch(function(e) {
                console.dir(e);
                expect(e.message).toBe(true);
                done();
            });

	    });


        afterEach(function() {
        	nock.cleanAll();
        })

	    afterAll(function() {
	    	enableNet();
	    });

    });
};
