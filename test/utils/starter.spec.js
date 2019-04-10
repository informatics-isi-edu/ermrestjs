exports.runTests = function (options) {
    console.log("in start spec run tests");
    var description = options.description;
    var schemaConfs = options.schemaConfigurations || [];
    var testCases = options.testCases || [];


    console.log("before init");
    var includes = require('./ermrest-init.js').init();
    console.log("after init in starter spec");
    var server = includes.server;
    var importUtils = includes.importUtils;
    var testOptions = {
        includes: includes,
        server: server,
        importUtils: importUtils,
        description: options.description,
        schemaConfs: options.schemaConfigurations,
        ermRest: includes.ermRest,
        url: includes.url,
        authCookie: includes.authCookie
    };

    console.log("before describe");
    describe(description, function () {

        console.log("inside describe but not before ALL");
        require('./jasmine-matchers.js').execute();

        // Import the schemas
        beforeAll(function (done) {
            console.log("before import schemas");
            importUtils.importSchemas(schemaConfs, process.env.DEFAULT_CATALOG)
                .then(function (res) {
                    console.log("Data imported with catalogId " + res.catalogId);
                    testOptions.catalogId = res.catalogId;
                    testOptions.entities = res.entities;
                    return server.catalogs.get(process.env.DEFAULT_CATALOG);
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

        // execute test cases
        testCases.forEach(function (el) {
            require(process.env.PWD + "/test/specs" + el).execute(testOptions);
        });
    });
};
