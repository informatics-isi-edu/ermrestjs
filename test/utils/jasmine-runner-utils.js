var q = require('q');
var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');
var jrunner = new Jasmine();

// Util function to create a catalog before running all specs
// Returns a promise
var createCatalog = function() {
	var defer = q.defer();

	// make http request to create a catalog to be used across all specs
	require('request')({
	  url:  process.env.ERMREST_URL + "/catalog",
	  method: 'POST',
	  headers: {
	    'Cookie': process.env.AUTH_COOKIE
	  }
	}, function(error, response, body) {
	  if (!error && response.statusCode >= 200 && response.statusCode < 300) {
	  	var catalog = JSON.parse(body);
	  	process.env.DEFAULT_CATALOG = catalog.id;
	    console.log("Catalog created with id " + catalog.id);
	    defer.resolve(catalog.id);
	  } else {
	  	console.log("Unable to create catalog");
	    defer.reject(error);
	  }
	})

	return defer.promise;
};
exports.createCatalog = createCatalog;

// Util function to delete a catalog if provided or uses process.env.DEFAULT_CATALOG after running all specs
// Returns a promise
var deleteCatalog = function(catalogId) {
	var defer = q.defer();
	catalogId = catalogId || process.env.DEFAULT_CATALOG;
	if (catalogId) {
		require('request')({
		  url:  process.env.ERMREST_URL + "/catalog/" + catalogId,
		  method: 'DELETE',
		  headers: {
		    'Cookie': process.env.AUTH_COOKIE
		  }
		}, function(error, response, body) {
		  if (!error && response.statusCode >= 200 && response.statusCode < 300) {
		  	console.log("Catalog deleted with id " + catalogId);
		  	defer.resolve();
		  } else {
		  	console.log("Unable to delete catalog");
		    defer.reject(error);
		  }
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
	jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

	jrunner.onComplete(function(passed) {
		deleteCatalog();
	});

	// Create a catalog and then
	// Execute the specs mentioned in the config file jasmine.json in /support folder
	createCatalog().then(function() {
		jrunner.execute();
	}, function(err) {
		console.log("Unable to create default catalog");
		console.dir(err);
	}).catch(function(err) {
		console.dir(err);
	});
};