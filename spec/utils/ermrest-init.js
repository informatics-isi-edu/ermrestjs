
exports.init = function (options) {
	options = options || {};

	var url = options.url || "https://dev.isrd.isi.edu/ermrest",
	    authCookie = options.ermrest_cookie;

	var ermRest = require(process.env.PWD + "/build/ermrest.js");

	ermRest.setUserCookie(authCookie);

	var server = ermRest.ermrestFactory.getServer(url);

	return {
		ermrestUtils: require("ermrest-data-utils"),
		ermRest: ermRest,
		server: server
	};
};