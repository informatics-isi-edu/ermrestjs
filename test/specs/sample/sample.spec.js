
var includes = require('./../../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe('In ERMrest,', function () {
    var catalog_id, schemaName, schema, catalog;
    
    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('./conf.json'),
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

    it('Should have schema name', function (done) {
        expect(schema).toBeDefined();
        expect(schema.name).toBe(schemaName);
        done();
    });

    it('should have catalog id', function (done) {
        expect(catalog.id).toBe(catalog_id);
        done();
    });

    // This function should be present in all spec files. It will remove the newly created catalog
    afterAll(function(done) {
        ermrestUtils.tear({
            setup: require('./conf.json'),
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
