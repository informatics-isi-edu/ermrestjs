var jasmineUtils = require('./jasmine-runner-utils.js');
var axios = require('axios');

// function to run all test specs
var runSpecs = function (config) {
  // Load the configuration file
  jasmineUtils.run(config);
};

var setRestrictedUserId = function (config) {
  var authCookieEnvName = 'RESTRICTED_AUTH_COOKIE';
  if (process.env[authCookieEnvName]) {
    console.log('Attempting to retreive userinfo for restricted user...');
    axios({
      url: process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
      method: 'GET',
      headers: {
        Cookie: process.env[authCookieEnvName],
      },
    })
      .then(function (response) {
        process.env[authCookieEnvName + '_ID'] = response.data.client.id;
        console.log(`restricted user cookie: ${process.env[authCookieEnvName]} \nrestricted user id: ${process.env[authCookieEnvName + '_ID']}`);
        runSpecs(config);
      })
      .catch(function (err) {
        console.log(err);
        throw new Error('Unable to retreive userinfo for restricted user');
      });
  } else {
    runSpecs(config);
  }
};

exports.run = function (config) {
  if (process.env.CI) {
    var exec = require('child_process').exec;
    exec('hostname', function (error, stdout, stderr) {
      process.env.ERMREST_URL = `http://${stdout.trim()}/ermrest`;

      var setCookie = function (username, password, authCookieEnvName, cb) {
        console.log(`Attempting to retreive ${authCookieEnvName} ...`);
        axios({
          url: process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
          method: 'POST',
          data: `username=${username}&password=${password}`,
        })
          .then(function (res) {
            console.log('username and password are working.');
            try {
              const cookieName = 'webauthn';
              const cookie = res.headers['set-cookie'].find((cookie) => cookie.includes(cookieName))?.match(new RegExp(`^${cookieName}=(.+?);`))?.[1];
              if (cookie) {
                process.env[authCookieEnvName] = `${cookieName}=${cookie};`;
                console.log(`Cookie found in CI ${cookieName}=${cookie}; and set in env variable ${authCookieEnvName}`);
              } else {
                console.log('Cookie not found in CI');
                process.env[authCookieEnvName] = null;
              }
            } catch (exp) {
              console.dir(exp);
              process.env[authCookieEnvName] = null;
            }

            if (process.env[authCookieEnvName]) {
              cb();
            } else {
              throw new Error(`Unable to retreive ${authCookieEnvName} : set-cookie was not in response`);
            }
          })
          .catch(function (error) {
            if (error.response) {
              console.log(error.response.data);
            } else if (error.request) {
              console.log(error.request);
            } else {
              console.log('Error', error.message);
            }
            throw new Error(`Unable to retreive ${authCookieEnvName}`);
          });
      };

      var done = 0;
      var success = function () {
        if (++done == 2) setRestrictedUserId(config);
      };
      setCookie('test1', 'dummypassword', 'AUTH_COOKIE', success);
      setCookie('test2', 'dummypassword', 'RESTRICTED_AUTH_COOKIE', success);
    });
  } else {
    setRestrictedUserId(config);
  }
};

// Catch unhandled exceptions and show the stack trace. This is most
// useful when running the jasmine specs.
process.on('uncaughtException', function (e) {
  if (e) {
    console.log(`Caught unhandled exception: ${e.message}`);
    console.log(e.stack);
  }

  if (!process.catalogDeleted) {
    process.catalogDeleted = true;
    jasmineUtils.deleteCatalog().finally(function () {
      process.exit(1);
    });
    setTimeout(function () {
      process.exit(1);
    }, 3000);
  }
});

process.on('SIGINT', function (code) {
  if (!process.catalogDeleted) {
    process.catalogDeleted = true;
    console.log('About to exit because of SIGINT (ctrl + c)');
    jasmineUtils.deleteCatalog().finally(function () {
      process.exit(1);
    });
  }
});
