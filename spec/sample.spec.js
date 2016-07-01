
var url = "https://dev.isrd.isi.edu/ermrest", cookie = "ermrest=C6KFIQn2JS37CGovofWnjKfu;";

var includes = require(__dirname + '/utils/ermrest-init.js').init({
    url: url,
    authCookie : cookie
});

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe('In ERMrest,', function () {
    var catalog_id, schemaName, schema, catalog;
    
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('./configuration/sample.spec.conf.json'), 
            url: url ,
            authCookie : cookie
        }).then(function(data) {
            catalog_id = data.catalogId;
            schemaName = data.schema.name;
            console.log("Data imported with catalogId " + data.catalogId);
            done();
        }, function(err) {
            console.log("Unable to import data");
            console.dir(err);
        });
    });

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
    })

    it('Should have schema name', function (done) {
        console.log("in test");
        expect(schema).toBeDefined();
        expect(schema.name).toBe(schemaName);
        done();
    });

    it('should have catalog id', function (done) {
        expect(catalog.id).toBe(catalog_id);
        done();
    });

    afterAll(function(done) {
        ermrestUtils.tear({
            setup: require('./configuration/sample.spec.conf.json'),
            catalogId: catalog_id,
            url:  url ,
            authCookie : cookie
        }).then(function(data) {
            done();
        }, function(err) {
            console.log("Unable to import data");
            console.dir(err);
        });
    })
});
