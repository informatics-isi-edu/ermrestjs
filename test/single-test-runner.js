var jasmineUtils = require('./utils/jasmine-runner-utils.js');

var config = {
  "spec_dir": "test",
  "helpers": [],
  "stopSpecOnExpectationFailure": false,
  "random": false
};

// Specify the spec file to be run here 
// or leave it same to execute the spec in /support folder
// Make changes to the tests and schema configuration values in spec.js in /support folder
// to execute specific test cases only
config["spec_files"] = ["support/*.spec.js"];

// function to run all test specs
var runSpecs = function() {		
	// Load the configuration file
	jasmineUtils.run(config);
}; 

runSpecs();

// Catch unhandled exceptions and show the stack trace. This is most
// useful when running the jasmine specs.
process.on('uncaughtException', function(e) {
	console.log('Caught unhandled exception: ');
	console.log(e);
	console.log(e.stack);
	if (!process.catalogDeleted) {
		process.catalogDeleted = true;
		//jasmineUtils.deleteCatalog();
	} else {
		process.exit(1);
	}
});


process.on('SIGINT', function(code) {
	if (!process.catalogDeleted) {
	    process.catalogDeleted = true;
	    console.log('About to exit because of SIGINT (ctrl + c)');
	    //jasmineUtils.deleteCatalog().done(function() {
	    //	process.exit(1);
	    //});
	} else {
		process.exit(1);
	}
});



