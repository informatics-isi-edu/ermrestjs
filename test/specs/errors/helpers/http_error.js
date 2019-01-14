var nock = require('nock');
var server, ermRest, ermrestUrl, ops = {allowUnmocked: true};

var errorCodes = { 
	"400" : { type: "BadRequestError" },
	"401" : { type: "UnauthorizedError" },
	"403" : { type: "ForbiddenError" },
	"404" : { type: 'NotFoundError' }, 
	"409" : { type: "ConflictError" },
	"500" : { type: "InternalServerError" },
	"503" : { type: "ServiceUnavailableError" }
};

exports.setup = function(options) {
	server = options.server;
	ermRest = options.ermRest;
	ermrestUrl = options.url.replace('ermrest', '');
};

exports.testForErrors = function(method, errorTypes, cb, message, mockUrl) {
	if (!cb || typeof cb != 'function' || !message) return;

	errorTypes.forEach(function(et) {

		var error;
		if (typeof et == 'string') {
			if (errorCodes[et]) {
				error = new ermRest[errorCodes[et].type]();
				error.type = errorCodes[et].type;
			} else {
				return;
			}
		} else if (typeof et == 'object' && ermRest[et.type] && et.message) {
			error = new ermRest[et.type]("", et.message);
			error.type = et.type;
		} else {
			return;
		}
			
		it("should raise a " 
			+ (mockUrl ? "HTTP " : "") 
			+ (error.code != undefined  ? (error.code + " ") : "") 
			+ error.type 
			+ " on " + message, function(done) {
				
				if (mockUrl) {
					var url = mockUrl;
					if (typeof mockUrl == 'function') url = mockUrl();
					server.http.max_retries = 0;
		            
	            	var scope = nock(ermrestUrl, ops)
				       				.filteringPath(function(path){
								        return url;
								    });

	            	if (method == "GET" || method == "DELETE") scope = scope[method.toLowerCase()](url);
	            	else if (method == "POST" || method == "PUT") {
	            		scope = scope.filteringRequestBody(/.*/, '*')
	            		scope = scope[method.toLowerCase()](url, "*");
	            	}

               		scope.reply(error.code, error.type);
				}

				cb(error, done);
		});
	});
};