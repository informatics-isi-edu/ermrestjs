// Unit Test that are related to annotations should be here

var includes = require(__dirname + '/../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe('Display Name: ', function () {
    var catalog_id, schemaName, schema, catalog;

    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('../configuration/displayname.spec.conf.json'),
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

    it('schema should use its own heuristics.', function(done) {
        server.catalogs.get(catalog_id).then(function(response) {
            schema = response.schemas.get(schemaName);
            expect(schema.displayname).toBe("displayname schema");
            done();
        }, function(err) {
            console.dir(err);
            done.fail();
        });
    });

    it('table should use its own name.', function(){
        expect(schema.tables.get("category").displayname).toBe("Categories");
    });

    it('table should use its own heuristics.', function(){
        expect(schema.tables.get("booking").displayname).toBe("Booking");
        expect(schema.tables.get("empty_table").displayname).toBe("Empty_Table");
    });

    it('table should use schema heuristics when it is undefined.', function(){
        expect(schema.tables.get("accommodation_image").displayname).toBe("accommodation image");
        expect(schema.tables.get("accommodation").displayname).toBe("accommodation");
    });

    it('column should use its own name.', function(){
        var column = schema.tables.get("category").columns.get("term");
        expect(column.displayname).toBe("Category Title");
    });

    it('column should use its own heuristics.', function(){
        var column = schema.tables.get("file").columns.get("image_width");
        expect(column.displayname).toBe("Image Width");
    });

    it('column should use table heuristics when it is not defined on column.', function(){
        var column = schema.tables.get("file").columns.get("content_type");
        expect(column.displayname).toBe("content_type");
    });

    it('column should use schema heuristics when it is not defined on column and table.', function(){
        var column = schema.tables.get("accommodation").columns.get("customer_count");
        expect(column.displayname).toBe("customer count");
    });


    // This function should be present in all spec files. It will remove the newly created catalog
    afterAll(function(done) {
        ermrestUtils.tear({
            setup: require('../configuration/displayname.spec.conf.json'),
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
