var requireReload = require('./require-reload.js').reload;

// Initialize ermrest configurations
exports.init = function (options) {
	options = options || {};

	var url = options.url || process.env.ERMREST_URL,
	    authCookie = options.ermrest_cookie || process.env.AUTH_COOKIE;

	var ermRest = requireReload(process.env.PWD + "/build/ermrest.js");

	ermRest.setUserCookie(authCookie);

	var server = ermRest.ermrestFactory.getServer(url);

    console.log("inside init");
	return {
		ermrestUtils: require(process.env.PWD + "/../ErmrestDataUtils/import.js"),
		ermRest: ermRest,
		server: server,
		url: url,
		authCookie: authCookie,
		restrictedAuthCookie: process.env.RESTRICTED_AUTH_COOKIE,
		importUtils: require("./ermrest-import.js")
	};
};
