var jasmineUtils = require('./jasmine-runner-utils.js');

// function to run all test specs
var runSpecs = function(config) {
	// Load the configuration file
	jasmineUtils.run(config);
};

var setRestrictedUserId = function(config) {
	var authCookieEnvName = 'RESTRICTED_AUTH_COOKIE';
	if (process.env[authCookieEnvName]) {
		require('request')({
			url:  process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
			method: 'GET',
			headers: {
				'Cookie': process.env[authCookieEnvName]
			}
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);
				process.env[authCookieEnvName + '_ID'] = info.client.id;
				console.log('Cookie: ' + process.env[authCookieEnvName] + " \nUserid: "  + process.env[authCookieEnvName + '_ID']);
				runSpecs(config);
			} else {
				throw new Error('Unable to retreive userinfo for restricted user');
			}
		});
	} else {
		runSpecs(config);
	}
};

exports.run = function(config) {
	if (process.env.CI) {

		var exec = require('child_process').exec;
		exec('hostname', function (error, stdout, stderr) {

	    	process.env.ERMREST_URL = 'http://' + stdout.trim() + '/ermrest';

	    	var setCookie = function(username, password, authCookieEnvName, cb) {
				require('request')({
					url:  process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
					method: 'POST',
					body: 'username=' + username + '&password=' + password
				}, function(error, response, body) {
					if (!error && response.statusCode == 200) {
						var cookies = require('set-cookie-parser').parse(response);

						cookies.forEach(function(c) {
							if (c.name == 'webauthn') {
							    process.env[authCookieEnvName] = c.name + '=' + c.value + ';';
							    console.log('Cookie found in CI ' + c.name + '=' + c.value + '; and set in env variable ' + authCookieEnvName);
							}
						});

						if (process.env[authCookieEnvName]) {
							cb();
						} else {
						 	throw new Error('Unable to retreive ' + authCookieEnvName + ' : ' + error.message);
						}
					} else {
						throw new Error('Unable to retreive ' + authCookieEnvName);
					}
				});
	    	};

	    	var done = 0;
	    	var success = function() {
	    		if (++done == 2) setRestrictedUserId(config);
	    	}
	    	setCookie('test1', 'dummypassword', 'AUTH_COOKIE', success);
	    	setCookie('test2', 'dummypassword', 'RESTRICTED_AUTH_COOKIE', success);
	    });
	} else {
	    setRestrictedUserId(config);
	}
};

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
