var requireReload = require('./require-reload.js').reload;

// Initialize ermrest configurations
exports.init = function (options) {
	options = options || {};

	var url = options.url || process.env.ERMREST_URL,
	    authCookie = options.ermrest_cookie || process.env.AUTH_COOKIE;

	var ermRest = requireReload(process.env.PWD + "/dist/ermrest.js");

	ermRest.setUserCookie(authCookie);

	/**
	 * we have to configure http otherwise nock won't work.
	 */
	ermRest.configure(require('axios'), require('q'));

	return {
		ermrestUtils: require('@isrd-isi-edu/ermrest-data-utils'),
		ermRest: ermRest,
		url: url,
		authCookie: authCookie,
		restrictedAuthCookie: process.env.RESTRICTED_AUTH_COOKIE,
		importUtils: require("./ermrest-import.js")
	};
};
