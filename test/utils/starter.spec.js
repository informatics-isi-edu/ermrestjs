exports.runTests = function (options) {
    var description = options.description;
    var schemaConfs = options.schemaConfigurations || [];
    var testCases = options.testCases || [];


    var includes = require('./ermrest-init.js').init();
    var importUtils = includes.importUtils;
    var testOptions = {
        includes: includes,
        importUtils: importUtils,
        description: options.description,
        schemaConfs: options.schemaConfigurations,
        ermRest: includes.ermRest,
        url: includes.url,
        authCookie: includes.authCookie
    };

    describe(description, function () {

        require('./jasmine-matchers.js').execute();

        // Import the schemas
        beforeAll(function (done) {
            testOptions.ermRest.ermrestFactory.getServer(testOptions.url, {cid: "test"}).then(function (server) {
                testOptions.server = server;
                return importUtils.importSchemas(schemaConfs, process.env.DEFAULT_CATALOG);
            }).then(function (res) {
                console.log("Data imported with catalogId " + res.catalogId);
                testOptions.catalogId = res.catalogId;
                testOptions.entities = res.entities;
                return testOptions.server.catalogs.get(process.env.DEFAULT_CATALOG);
            }).then(function (response) {
                testOptions.catalog = response;
                done();
            }, function (err) {
                catalogId = err.catalogId;
                done.fail(err);
            }).catch(function (err) {
                console.log(err);
                done.fail(err);
            });
        });

        afterAll(function () {
            // remove the client-config that it have been set by any of the specs
            testOptions.ermRest.setClientConfig({});
        })

        // execute test cases
        testCases.forEach(function (el) {
            require(process.env.PWD + "/test/specs" + el).execute(testOptions);
        });
    });
};
