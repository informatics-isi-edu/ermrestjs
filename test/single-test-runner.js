var jasmineWrapper = require('./utils/jasmine-wrapper.js');

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
jasmineWrapper.run(config);
