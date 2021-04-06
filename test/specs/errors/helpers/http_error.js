var nock = require('nock');
var ops = {allowUnmocked: true};

var errorCodes = {
    "400" : { type: "BadRequestError", status: "Bad Request" },
    "401" : { type: "UnauthorizedError", status: "Unauthorized" },
    "403" : { type: "ForbiddenError", status: "Forbidden" },
    "404" : { type: 'NotFoundError', status: "Not Found" },
    "409" : { type: "ConflictError", status: "Conflict" },
    "500" : { type: "InternalServerError", status: "Internal Server Error" },
    "503" : { type: "ServiceUnavailableError", status: "Service Unavailable" }
};


exports.testForErrors = function(testOptions, method, errorTypes, cb, message, mockUrl) {
    if (!cb || typeof cb != 'function' || !message) return;

    var ermRest = testOptions.ermRest;
    var ermrestUrl = testOptions.url.replace('ermrest', '');

    errorTypes.forEach(function(et) {

        // create error object to use for mocking and expectations
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

            // must be here
            var server = testOptions.server;

            if (mockUrl) {
                // the url path to "mock"
                var url = mockUrl;
                if (typeof mockUrl == 'function') url = mockUrl();
                server.http.max_retries = 0;

                var nockObj = nock(ermrestUrl, ops)
                    .filteringPath(function(path){
                        return url;
                    });

                if (method == "GET" || method == "DELETE") {
                    nockObj = nockObj[method.toLowerCase()](url);
                } else if (method == "POST" || method == "PUT") {
                    nockObj = nockObj.filteringRequestBody(/.*/, '*')
                    nockObj = nockObj[method.toLowerCase()](url, "*");
                }

                // mark what the mocked url path should return
                // NOTE: (maybe TODO?) if path being mocked returns a success, this will not mock that response
                nockObj.reply(error.code, error.type).persist();
            }

            cb(error, done);
        });
    });
};
