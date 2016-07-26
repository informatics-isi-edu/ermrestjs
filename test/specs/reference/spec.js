var includes = require('./../../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe("For determining reference objects and it's child objects,", function () {
    var catalog_id, schemaName, singleEnitityUri, multipleEntityUri;
    var tableName = "reference_table", entityId = 9000, lowerLimit = 8999, upperLimit = 9010;

    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('./reference.conf.json'),
            url: includes.url,
            authCookie: includes.authCookie
        }).then(function importData(data) {
            catalog_id = data.catalogId;
            schemaName = data.schema.name;

            singleEnitityUri = includes.url + "/catalog/" + catalog_id + "/entity/"
                + schemaName + ":" + tableName + "/id=" + entityId;

            multipleEntityUri = includes.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit;

            console.log("Data imported with catalog Id " + catalog_id);
            done();
        }, function importError(err) {
            console.log("Unable to import data");
            console.dir(err);
            done.fail();
        });
    });

    // Test Cases:
    describe('for a single entity,', function() {
        var reference, page, tuple;
        var limit = 1;

        it('resolve should return a Reference object that is defined.', function(done) {
            ermRest.resolve(singleEnitityUri, {cid: "test"}).then(function (response) {
                reference = response;

                expect(reference).toEqual(jasmine.any(Object));

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        it('reference should be properly defined based on the constructor.', function() {
            expect(reference._uri).toBe(singleEnitityUri);
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

        // Single Entity specific tests
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
            expect(page._data.length).toBe(limit);
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
            expect(values[0]).toBe(tuple._data.id);
            expect(values[1]).toBe(tuple._data.name);
            expect(values[2]).toBe(tuple._data.value.toString());
        });
    });

    describe('for multiple entities,', function() {
        var reference, page, tuple;
        var limit = 5;

        it('resolve should return a Reference object that is defined.', function(done) {
            ermRest.resolve(multipleEntityUri, {cid: "test"}).then(function (response) {
                reference = response;

                expect(reference).toEqual(jasmine.any(Object));

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
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
            expect(page._data.length).toBe(limit);
            expect(page._data[0].id).toBe((lowerLimit + 1).toString());
        });

        it('tuples should return an Array of Tuple objects.', function() {
            tuples = page.tuples;

            expect(page._tuples).toBeDefined();
            expect(tuples.length).toBe(page._data.length);
            expect(tuples.length).toBe(limit);
            expect(tuples[0]._data).toBe(page._data[0]);
            expect(tuples[4]._data).toBe(page._data[4]);
        });

        it('values should return only the values of the tuple.', function() {
            for(var i = 0; i < limit; i++) {
                var tuple = tuples[i];
                var values = tuple.values;
                // based on order in reference_table.json
                expect(values[0]).toBe(tuple._data.id);
                expect(values[1]).toBe(tuple._data.name);
                expect(values[2]).toBe(tuple._data.value.toString());
            }
        });
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
