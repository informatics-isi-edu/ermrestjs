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
	      if (c.name == "webauthn") {
	        process.env['AUTH_COOKIE'] = c.name + "=" + c.value + ";";
    	    console.log("Cookie found in TRAVIS " + c.name + "=" + c.value + ";");
	   	  }
	    });

	    if (process.env.AUTH_COOKIE) {
	    	var exec = require('child_process').exec;
			exec('curl -v --cookie "' + process.env.AUTH_COOKIE + '" ' + process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session', function (error, stdout, stderr) {
      			console.log(stdout);
      			runSpecs();
   			});
	    } 
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
		console.log('Caught unhandled exception: ' + e.message);
		console.log(e.stack);
	}

	if (!process.catalogDeleted) {
		process.catalogDeleted = true;
		jasmineUtils.deleteCatalog().done(function() {
			process.exit(1);
		});
		setTimeout(function() {
			process.exit(1);
		}, 3000);
	}
});


process.on('SIGINT', function(code) {
	if (!process.catalogDeleted) {
	    process.catalogDeleted = true;
	    console.log('About to exit because of SIGINT (ctrl + c)');
	    jasmineUtils.deleteCatalog().done(function() {
	    	process.exit(1);
	    });
	}
});
