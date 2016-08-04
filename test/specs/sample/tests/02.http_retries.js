var nock = require('nock');

exports.execute = function (options) {

    describe('For determining http behavior on errocode 500, ', function () {
        var server, ermRest;

	    var enableNet = function() {
	        nock.cleanAll();
	        nock.enableNetConnect();
	    };

        beforeAll(function () {
            server = options.server;
            ermRest = options.ermRest;
        });

        it("should make 1 http retry", function(done) {
	        
	        var id = "jhgjhgjhg",  ops = {allowUnmocked: true};;
	        nock(options.url.replace('ermrest', ''), ops)
	          .get("/ermrest/catalog/" + id + "/schema?cid=null")
	          .reply(500, 'Error message');

	        var startTime = (new Date()).getTime();

	        server.catalogs.get(id).then(null, function(err) {
	            expect((new Date().getTime()) - startTime).toBeGreaterThan(100);
	            enableNet();
	            done();
	        });
	        
	    });

	    afterAll(function() {
	    	enableNet();
	    });

    });
};