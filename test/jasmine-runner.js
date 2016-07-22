var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');

var jrunner = new Jasmine();

var run = function() {		
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
}; 

if (process.env.TRAVIS) {
      require('request')({
          url:  process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
          method: 'POST',
          body: 'username=test1&password=dummypassword'
      }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            var cookies = require('set-cookie-parser').parse(response); 
            cookies.forEach(function(c) {
              if (c.name == "webauthn") process.env.AUTH_COOKIE = c.name + "=" + c.value + ";";
            });
            if (process.env.AUTH_COOKIE) run();
          } else {
            console.dir(error);
          }
      });
} else {
  run();
}


