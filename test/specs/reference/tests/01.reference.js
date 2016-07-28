exports.execute = function (options) {

    describe("For determining reference objects and it's child objects,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            entityId = 9000,
            lowerLimit = 8999,
            upperLimit = 9010;

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit;


        // Test Cases:
        describe('for a single entity,', function() {
            var reference, page, tuple;
            var limit = 1;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(singleEnitityUri, {cid: "test"}).then(function (response) {
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
                expect(reference._serviceUrl).toBe(options.url);
                expect(reference._catalogId).toBe(catalog_id.toString());
                expect(reference._schemaName).toBe(schemaName);
                expect(reference._tableName).toBe(tableName);
                expect(reference._filter instanceof options.ermRest.ParsedFilter).toBeDefined();
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

            it('contextualize.record should return a contextualized reference object.', function() {
                var recordReference = reference.contextualize.record;

                expect(recordReference).not.toBe(reference);
                expect(recordReference.columns.length).not.toBe(reference.columns.length);
                expect(recordReference.columns.length).toBe(2);
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

        describe('for multiple entities with limit less than the number of referenced entities,', function() {
            var reference, page, tuple;
            var limit = 5;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(multipleEntityUri, {cid: "test"}).then(function (response) {
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
                expect(tuples[5]).toBeUndefined();
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

        // There are only 8 entities and limit is set to 10, only 8 should be returned
        describe('for multiple entities with limit greater than the number of referenced entities,', function() {
            var reference, page, tuple;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(multipleEntityUri, {cid: "test"}).then(function (response) {
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

            // See comment above the describe
            it('page should have less entities than limit.', function() {
                expect(page._data.length).toBeLessThan(limit);
            });

            it('tuples should return an Array of Tuple objects.', function() {
                tuples = page.tuples;

                expect(page._tuples).toBeDefined();
                expect(tuples.length).toBe(page._data.length);
                expect(tuples.length).toBeLessThan(limit);
                expect(tuples[0]._data).toBe(page._data[0]);
                expect(tuples[7]._data).toBe(page._data[7]);
                expect(tuples[8]).toBeUndefined();
            });

            it('values should return only the values of the tuple.', function() {
                for(var i = 0; i < page._data.length; i++) {
                    var tuple = tuples[i];
                    var values = tuple.values;
                    // based on order in reference_table.json
                    expect(values[0]).toBe(tuple._data.id);
                    expect(values[1]).toBe(tuple._data.name);
                    expect(values[2]).toBe(tuple._data.value.toString());
                }
            });
        });
    });
};
