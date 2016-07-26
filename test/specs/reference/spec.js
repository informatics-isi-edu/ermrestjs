var includes = require('./../../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe("For determining reference objects and it's child objects, ", function () {
    var catalog_id, schemaName, uri, reference, page, tuple;
    var tableName = "reference_table", entityId = 9000, limit = 1;

    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('./reference.conf.json'),
            url: includes.url,
            authCookie: includes.authCookie
        }).then(function importData(data) {
            catalog_id = data.catalogId;
            schemaName = data.schema.name;

            uri = includes.url + "/catalog/" + catalog_id + "/entity/"
                + schemaName + ":" + tableName + "/id=" + entityId;

            console.log("Data imported with catalog Id " + catalog_id);
            done();
        }, function importError(err) {
            console.log("Unable to import data");
            console.dir(err);
            done.fail();
        });
    });

    // Test Cases:
    it('resolve should return a Reference object that is defined.', function(done) {
        ermRest.resolve(uri, {cid: "test"}).then(function (response) {
            reference = response;

            expect(reference).toEqual(jasmine.any(Object));

            done();
        }, function (err) {
            console.dir(err);
            done.fail();
        });
    });

    it('reference should be properly defined based on the constructor.', function() {
        expect(reference._uri).toBe(uri);
        expect(reference._serviceUrl).toBe(includes.url);
        expect(reference._catalogId).toBe(catalog_id.toString());
        expect(reference._schemaName).toBe(schemaName);
        expect(reference._tableName).toBe(tableName);
        expect(reference._filter instanceof ermRest.ParsedFilter).toBeDefined();
    });

    // Methods that are currently implemented
    it('reference should have methods properly defined.', function() {
        expect(reference.uri).toBe(reference._uri);
        expect(reference.columns).toBe(reference._columns);
        expect(reference.read()).toBeDefined();
    });

    it('reference should be properly defined after the callback is resolved.', function() {
        expect(reference._catalog).toBeDefined();
        expect(reference._schema).toBeDefined();
        expect(reference._table).toBeDefined();
        expect(reference._columns).toBeDefined();
    });

    it('read should return a Page object that is defined.', function(done) {
        reference.read(limit).then(function (response) {
            page = response;

            expect(page).toEqual(jasmine.any(Object));

            done();
        }, function (err) {
            console.dir(err);
            done.fail();
        });
    });

    it('page should be properly defined based on constructor.', function() {
        expect(page._ref).toBe(reference);
        expect(page._data.length).toBe(1);
        expect(page._data[0].id).toBe(entityId.toString());
    });

    it('page should have methods properly defined.', function() {
        expect(page.tuples).toBeDefined();
    });

    it('tuples should return an Array of Tuple objects.', function() {
        tuple = page.tuples[0];
        expect(page._tuples).toBeDefined();
        expect(tuple._data).toBe(page._data[0]);
        expect(tuple._ref).toBe(reference);
    });

    it('tuples should have methods properly defined.', function() {
        expect(tuple.values).toBeDefined();
    });

    it('values should return only the values of the tuple.', function() {
        var values = tuple.values;
        // based on order in reference_table.json
        expect(values[0]).toBe('9000');
        expect(values[1]).toBe('Hank');
        expect(values[2]).toBe('12');
    });

    // This function should be present in all spec files. It will remove the newly created catalog
    afterAll(function (done) {
        ermrestUtils.tear({
            setup: require('./reference.conf.json'),
            catalogId: catalog_id,
            url: includes.url,
            authCookie: includes.authCookie
        }).then(function (data) {
            done();
        }, function (err) {
            console.log("Unable to delete data");
            console.dir(err);
            done.fail();
        });
    });
});
