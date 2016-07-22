exports.runTests = function (options) {
    var description = options.description;
    var schemaConfs = options.schemaConfigurations;
    var testCases = options.testCases;


    var includes = require('./ermrest-init.js').init();
    var server = includes.server;
    var importUtils = includes.importUtils;

    describe(description, function () {
        var catalog_id;
        var testOptions = {};

        // Import the schemas
        beforeAll(function (done) {
            importUtils.importSchemas(schemaConfs)
                .then(function (catalogId) {
                    console.log("Data imported with catalogId " + catalogId);
                    catalog_id = catalogId;
                    return server.catalogs.get(catalog_id);
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
            require(process.env.PWD + "/test/specs"+ el).execute(testOptions);
        });

        // Delete the schemas
        afterAll(function (done) {
            importUtils.tear(schemaConfs, catalog_id, true).then(function () {
                done();
            }, function (err) {
                done.fail();
            });
        })
    });
};