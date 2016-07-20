
var includes = require(__dirname + '/../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;
var nock = require('nock');

describe('In ERMrest,', function () {
    var catalog_id, schemaName, schema, catalog;
    
    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('../configuration/sample.spec.conf.json'),
            url: includes.url ,
            authCookie : includes.authCookie
        }).then(function(data) {
            catalog_id = data.catalogId;
            schemaName = data.schema.name;
            console.log("Data imported with catalogId " + data.catalogId);
            done();
        }, function(err) {
            console.log("Unable to import data");
            console.dir(err);
            done.fail();
        });
    });


    var enableNet = function() {
        nock.cleanAll();
        nock.enableNetConnect();
    };


    it("should test http retries", function(done) {
        nock.disableNetConnect();
        includes.ermRest._http.max_retries = 1;
        includes.ermRest._http.initial_delay = 100;
        
        var id = "jhgjhgjhg",  options = {allowUnmocked: true};;
        nock("https://dev.isrd.isi.edu", options)
          .get("/ermrest/catalog/" + id + "/schema")
          .reply(500, 'Error message');

        var startTime = (new Date()).getTime();

        server.catalogs.get(id).then(null, function(err) {
            expect((new Date().getTime()) - startTime).toBeGreaterThan(100);
            enableNet();
            done();
        });
        
    });

    // Test Cases:
    it('should introspect catalog', function(done) {
        expect(server.catalogs).toBeDefined();
        expect(server.catalogs.get).toBeDefined();
        server.catalogs.get(catalog_id).then(function(response) {
            catalog = response;
            expect(catalog).toBeDefined();
            expect(catalog.schemas).toBeDefined();
            expect(catalog.schemas.get).toBeDefined();
            schema = catalog.schemas.get(schemaName);
            done();
        }, function(err) {
            console.dir(err);
            done.fail();
        });
    });

    it('Should have schema name', function () {
        expect(schema).toBeDefined();
        expect(schema.name).toBe(schemaName);
    });

    it('should have catalog id', function () {
        expect(catalog.id).toBe(catalog_id);
    });

    // This function should be present in all spec files. It will remove the newly created catalog
    afterAll(function(done) {
        enableNet();
        ermrestUtils.tear({
            setup: require('../configuration/sample.spec.conf.json'),
            catalogId: catalog_id,
            url:  includes.url ,
            authCookie : includes.authCookie
        }).then(function(data) {
            done();
        }, function(err) {
            console.log("Unable to import data");
            console.dir(err);
            done.fail();
        });
    })
});
