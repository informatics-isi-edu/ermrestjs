var q = require('q');
var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');
var jrunner = new Jasmine();
jrunner.exitCodeReporter = new (require('./exit-code-reporter.js'))(jrunner);
var ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');

// Util function to create a catalog before running all specs
// Returns a promise
var createCatalog = function() {
	var defer = q.defer();

	// make http request to create a catalog to be used across all specs
	ermrestUtils.importData({
        setup: { catalog: { acls: { 'enumerate': ['*'] } } },
        url: process.env.ERMREST_URL,
        authCookie: process.env.AUTH_COOKIE
    }).then(function (data) {
    	process.env.DEFAULT_CATALOG = data.catalogId;
	    defer.resolve(data.catalogId);
    }, function (err) {
	    defer.reject(err);
    });

	return defer.promise;
};
exports.createCatalog = createCatalog;

// Util function to delete a catalog if provided or uses process.env.DEFAULT_CATALOG after running all specs
// Returns a promise
var deleteCatalog = function(catalogId) {
	var defer = q.defer();
	catalogId = catalogId || process.env.DEFAULT_CATALOG;
	if (catalogId) {
		ermrestUtils.tear({
	        setup: { catalog : { } },
	        catalogId: catalogId,
	        url:  process.env.ERMREST_URL ,
	        authCookie : process.env.AUTH_COOKIE
	    }).then(function(data) {
		  	defer.resolve();
	    }, function(err) {
	        console.log("Unable to delete catalog");
		    defer.reject(err);
	    });
	} else {
		defer.resolve("no catalogId found");
	}

	return defer.promise;
};
exports.deleteCatalog = deleteCatalog


// Start running the test specs
// Accepts a config json
// Creates a catalog and then runs the specs as mentioned in the config file
// Deletes the created catalog once all specs have been executed
exports.run = function(config) {
	// Load the configuration
	jrunner.loadConfig(config);

	// Remove default reporter logs
	jrunner.configureDefaultReporter({ print: function() { } });

	// Add Jasmine  specReporter
	jrunner.addReporter(new SpecReporter());

	// Set timeout to a large value
	jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 180000;

	jrunner.onComplete(function(passed) {
		console.log("Test suite " + (passed ? "passed" : "failed"));
		deleteCatalog().done(function() {
			if (!passed) process.exit(1);
		});
	});

	// Create a catalog and then
	// Execute the specs mentioned in the config file jasmine.json in /support folder
	createCatalog().then(function() {
		jrunner.execute();
	}, function(err) {
		console.log(err ? err.message : "Some Catalog error");
		console.log("Unable to create default catalog");
		process.exit(1);
	}).catch(function(err) {
		console.log('Caught unhandled exception: ' + err.message);
		console.log(err.stack);

		process.exit(1);
	});
};
