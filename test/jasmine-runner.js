var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');
var q = require('q');
var jrunner = new Jasmine();


// Util function to create a catalog
// Returns a promise
var createCatalog = function() {
	var defer = q.defer();

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

// Util function to delete a catalog if provided or uses process.env.DEFAULT_CATALOG
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

// function to run all test specs
var runSpecs = function() {		

	// Load the configuration file
	jrunner.loadConfigFile(__dirname + '/support/jasmine.json');

	// Remove default reporter logs
	jrunner.configureDefaultReporter({ print: function() { } });

	// Add Jasmine  specReporter
	jrunner.addReporter(new SpecReporter());   

	// Set timeout to a large value 
	jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

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

if (process.env.TRAVIS) {
	process.env.ERMREST_URL = "http://localhost/ermrest";
	require('request')({
	  url:  process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
	  method: 'POST',
	  body: 'username=test1&password=dummypassword'
	}, function(error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var cookies = require('set-cookie-parser').parse(response); 
	    cookies.forEach(function(c) {
	      if (c.name == "webauthn") process.env['AUTH_COOKIE'] = c.name + "=" + c.value + ";";
	    });
	    if (process.env.AUTH_COOKIE) runSpecs();
	    else console.log("Unable to retreive authcoooie");
	    
	  } else {
	  	console.log("Unable to retreive authcoooie");
	    console.dir(error);
	  }
	})
} else {
    runSpecs();
}


