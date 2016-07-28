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
	console.log('Caught unhandled exception: ' + e.toString());
	console.log(e.stack);
	jasmineUtils.deleteCatalog();
});


