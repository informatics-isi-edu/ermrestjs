var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');
var jrunner = new Jasmine();
jrunner.exitCodeReporter = new (require('./exit-code-reporter.js'))(jrunner);
const { importData, tear } = require('@isrd-isi-edu/ermrest-data-utils');

// Util function to create a catalog before running all specs
// Returns a promise
const createCatalog = function () {
  return new Promise((resolve, reject) => {
    // make http request to create a catalog to be used across all specs
    importData({
      setup: { catalog: { acls: { enumerate: ['*'] } } },
      url: process.env.ERMREST_URL,
      authCookie: process.env.AUTH_COOKIE,
    }).then(
      function (data) {
        process.env.DEFAULT_CATALOG = data.catalogId;
        resolve(data.catalogId);
      },
      function (err) {
        reject(err);
      },
    );
  });
};
exports.createCatalog = createCatalog;

// Util function to delete a catalog if provided or uses process.env.DEFAULT_CATALOG after running all specs
// Returns a promise
const deleteCatalog = function (catalogId) {
  return new Promise((resolve, reject) => {
    catalogId = catalogId || process.env.DEFAULT_CATALOG;
    if (catalogId) {
      tear({
        setup: { catalog: {} },
        catalogId: catalogId,
        url: process.env.ERMREST_URL,
        authCookie: process.env.AUTH_COOKIE,
      }).then(
        function (data) {
          resolve();
        },
        function (err) {
          console.log('Unable to delete catalog');
          reject(err);
        },
      );
    } else {
      resolve('no catalogId found');
    }
  });
};
exports.deleteCatalog = deleteCatalog;

// Start running the test specs
// Accepts a config json
// Creates a catalog and then runs the specs as mentioned in the config file
// Deletes the created catalog once all specs have been executed
exports.run = function (config) {
  // Load the configuration
  jrunner.loadConfig(config);

  // Remove default reporter logs
  jrunner.configureDefaultReporter({ print: function () {} });

  // Add Jasmine  specReporter
  jrunner.addReporter(new SpecReporter());

  // Set timeout to a large value
  jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 180000;

  jrunner.onComplete(function (passed) {
    console.log('Test suite ' + (passed ? 'passed' : 'failed'));
    deleteCatalog().done(function () {
      if (!passed) process.exit(1);
    });
  });

  // Create a catalog and then
  // Execute the specs mentioned in the config file jasmine.json in /support folder
  createCatalog()
    .then(
      function () {
        jrunner.execute();
      },
      function (err) {
        console.log(err ? err.message : 'Some Catalog error');
        console.log('Unable to create default catalog');
        process.exit(1);
      },
    )
    .catch(function (err) {
      console.log('Caught unhandled exception: ' + err.message);
      console.log(err.stack);

      process.exit(1);
    });
};
