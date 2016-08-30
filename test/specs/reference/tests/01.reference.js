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
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('reference should be properly defined based on the constructor.', function() {
                expect(reference._location.uri).toBe(singleEnitityUri);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.firstSchemaName).toBe(schemaName);
                expect(reference._location.firstTableName).toBe(tableName);

                expect(reference.contextualize._reference).toBe(reference);
            });

            // Methods that are currently implemented
            it('reference should have methods properly defined.', function() {
                expect(reference.uri).toBe(reference._location.uri);
                expect(reference.columns).toBe(reference._columns);
                expect(reference.displayname).toBe(reference._table.name);
                expect(reference.canCreate).toBeDefined();
                expect(reference.canUpdate).toBeDefined();
                expect(reference.read()).toBeDefined();
            });

            it('reference should be properly defined after the callback is resolved.', function() {
                expect(reference._table).toBeDefined();
            });

            it('contextualize.detailed should return a contextualized reference object.', function() {
                var recordReference = reference.contextualize.detailed;

                // Make sure Reference prototype is available
                expect(recordReference.uri).toBeDefined();
                expect(recordReference.columns).toBeDefined();
                expect(recordReference.read).toBeDefined();

                // The only difference should be the set of columns returned
                expect(recordReference).not.toBe(reference);
                expect(recordReference.columns.length).not.toBe(reference.columns.length);
                expect(recordReference.columns.length).toBe(2);

                var columns = Array.prototype.map.call(recordReference.columns, function(column){
                    return column.name;
                });
                expect(columns).toEqual(["name", "value"]);

                expect(recordReference.uri).toBe(reference.uri);
                expect(recordReference._location.service).toBe(reference._location.service);
                // If catalog is the same, so will be the schema and table
                expect(recordReference._location.catalog).toBe(reference._location.catalog);
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
                expect(tuple._pageRef).toBe(reference);
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
                options.ermRest.resolve(multipleEntityUri + "@sort(value)", {cid: "test"}).then(function (response) {
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

            it('page should have entities ordered by value.', function() {
                var data = page._data;
                // check that the first value is not the first in the defined data set in the .json file
                expect(data[0].id).not.toBe((lowerLimit + 1).toString());
                expect(data[0].value).toBe(1);

                // The last tuple in the data set happens to have the largest value
                // Range was 10 entries, 8999 < id < 9010, but only 8 in the set, hence -3
                expect(data[data.length-1].id).toBe((upperLimit - 3).toString());
                expect(data[data.length-1].value).toBe(160);

                for (var i = 0; i < data.length - 1; i++) {
                    expect(data[i].value).toBeLessThan(data[i+1].value)
                }
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
