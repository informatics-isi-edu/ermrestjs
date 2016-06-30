var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');

var jrunner = new Jasmine();

// Load the configuration file
jrunner.loadConfigFile(__dirname + '/support/jasmine.json');

// Remove default reporter logs
jrunner.configureDefaultReporter({ print: function() { } });

// Add Jasmine  specReporter
jrunner.addReporter(new SpecReporter());   

// Set timeout to a large value 
jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;


// Execute the specs mentioned in the config file
jrunner.execute();