var jasmineUtils = require('./utils/jasmine-runner-utils.js');

// function to run all test specs
var runSpecs = function() {
	// Load the configuration file
	jasmineUtils.run(require('./support/jasmine.json'));
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
	    else {
	      throw new Error("Unable to retreive authcookie : " + error.message);
		}
	  } else {
	  	throw new Error("Unable to retreive authcookie ");
	  }
	});
} else {
    runSpecs();
}

// Catch unhandled exceptions and show the stack trace. This is most
// useful when running the jasmine specs.
process.on('uncaughtException', function(e) {
	if (e) {
		console.log('Caught unhandled exception: ' + e.toString());
		console.log(e.stack);
	}
	jasmineUtils.deleteCatalog().done(function() {
		process.exit(1);
	});
	setTimeout(function() {
		process.exit(1);
	}, 3000);
});
