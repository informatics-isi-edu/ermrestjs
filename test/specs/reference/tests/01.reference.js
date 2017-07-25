exports.execute = function (options) {

    describe("For determining reference objects and its child objects, ", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            tableNameWithSlash = "table_w_slash",
            entityId = 9000,
            lowerLimit = 8999,
            upperLimit = 9010,
            originalTimeout;

        var entityWithSlash = baseUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableNameWithSlash;

        var baseUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName;

        var singleEntityUri = baseUri + "/id=" + entityId;

        var multipleEntityUri = baseUri + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit;

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function (tag, location) {
            var url;
            switch (tag) {
                case "tag:isrd.isi.edu,2016:chaise:record":
                    url = recordURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:record-two":
                    url = record2URL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:viewer":
                    url = viewerURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:search":
                    url = searchURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:recordset":
                    url = recordsetURL;
                    break;
                default:
                    url = recordURL;
                    break;
            }

            url = url + "/" + location.path;

            return url;
        };

        beforeAll(function() {
            options.ermRest.appLinkFn(appLinkFn);
        });

        // Test Cases:
        describe("for creating an entity/entities,", function () {
            var reference, createReference;

            beforeAll(function (done) {
                options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    createReference = response.contextualize.entryCreate;

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should return error if reference is not contextualized for create.", function(done) {
                var rows = [{ id: 9999, name: "Paula", value: 5 }];

                reference.create(rows).then(function(response) {
                    throw new Error("Did not return any errors");
                }).catch(function (err) {
                    expect(err.message).toEqual("reference must be in 'entry/create' context.");
                    done();
                });
            });

            it("a single entity should return a Page object that is defined.", function(done) {
                var rows = [{ id: 9999, name: "Paula", value: 5 }];

                createReference.create(rows).then(function (response) {
                    var page = response.successful;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page.reference._context).toEqual("compact", "page reference is not in the correct context.")
                    expect(page._data.length).toBe(rows.length);
                    expect(page._data[0].id).toBe((rows[0].id).toString());
                    expect(page._data[0].name).toBe(rows[0].name);
                    expect(page._data[0].value).toBe(rows[0].value);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("multiple entities should return a Page object that is defined.", function(done) {
                var rows = [{ id: 9800, name: "Greg", value: 8 },
                            { id: 9801, name: "Steven", value: 12 },
                            { id: 9802, name: "Garnet", value: 36 }];

                createReference.create(rows).then(function (response) {
                    var page = response.successful;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page.reference._context).toEqual("compact", "page reference is not in the correct context.")
                    expect(page._data.length).toBe(rows.length);
                    for(var i = 0; i < page._data.length; i++) {
                        expect(page._data[i].id).toBe((rows[i].id).toString());
                        expect(page._data[i].name).toBe(rows[i].name);
                        expect(page._data[i].value).toBe(rows[i].value);
                    }

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });

        describe('for a single entity,', function() {
            var reference, page, tuple;
            var limit = 1;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(singleEntityUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it('reference should be properly defined based on the constructor.', function() {
                expect(reference._location.uri).toBe(singleEntityUri);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(tableName);

                expect(reference.contextualize._reference).toBe(reference);
            });

            // Methods that are currently implemented
            it('reference should have methods properly defined.', function() {
                expect(reference.uri).toBe(reference._location.uri);
                expect(reference.displayname.value).toBe(reference._table.name);
                expect(reference.table).toBe(reference._table);
                expect(reference.canCreate).toBeDefined();
                expect(reference.canUpdate).toBeDefined();
                expect(reference.create()).toBeDefined();
                expect(reference.read()).toBeDefined();
                expect(reference.csvDownloadLink).toBe(reference.location.ermrestUri + "?limit=none&accept=csv&download=" + reference.displayname.unformatted);
            });

            it('reference should be properly defined after the callback is resolved.', function() {
                expect(reference._meta).toBeDefined();
                expect(reference._table).toBeDefined();
                expect(reference._shortestKey).toBeDefined();
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
                expect(recordReference._table).toBe(reference._table);
                expect(recordReference._context).toBe("detailed");
            });

            it('contextualize.compactBrief should return a contextualized reference object.', function() {
                var briefRecord = reference.contextualize.compactBrief;

                // Make sure Reference prototype is available
                expect(briefRecord.uri).toBeDefined();
                expect(briefRecord.columns).toBeDefined();
                expect(briefRecord.read).toBeDefined();

                // The only difference should be the set of columns returned
                expect(briefRecord).not.toBe(reference);
                expect(briefRecord.columns.length).not.toBe(reference.columns.length);
                expect(briefRecord._context).toBe("compact/brief");

                var columns = Array.prototype.map.call(briefRecord.columns, function(column){
                    return column.name;
                });
                expect(columns).toEqual(["name"]);

                expect(briefRecord.uri).toBe(reference.uri);
                expect(briefRecord._location.service).toBe(reference._location.service);
                expect(briefRecord._table).toBe(reference._table);
            });

            it('unfilteredReference should return a reference that refers to all entities of current table', function() {
                var unfiltered = reference.unfilteredReference;
                expect(unfiltered.table).toBe(reference.table);
                expect(unfiltered.uri).toEqual(baseUri);
            });

            // Single Entity specific tests
            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }).catch(function (error) {
                    console.dir(error);
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

            it('tuple.copy should create a shallow copy of the tuple except for the data.', function() {
                var key;
                var newTuple = tuple.copy();

                // The original and new Tuple should not be the same object, neither should the _data
                expect(newTuple).not.toBe(tuple);
                expect(newTuple._data).not.toBe(tuple._data);
                var keys = Object.keys(tuple._data);
                for (var i = 0; i < keys.length; i++) {
                    key = keys[i];
                    expect(newTuple._data[key]).toBe(tuple._data[key]);
                }

                // All other objects of tuple should be the same object
                // newTuple should have references to the original objects in tuple
                expect(newTuple._pageRef).toBe(tuple._pageRef);
            });

            it('values should return only the values of the tuple.', function() {
                var values = tuple.values;
                // based on order in reference_table.json
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
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it('unfilteredReference should return a reference that refers to all entities of current table', function() {
                var unfiltered = reference.unfilteredReference;
                expect(unfiltered.table).toBe(reference.table);
                expect(unfiltered.uri).toEqual(baseUri);
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }).catch(function (error) {
                    console.dir(error);
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
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it('unfilteredReference should return a reference that refers to all entities of current table', function() {
                var unfiltered = reference.unfilteredReference;
                expect(unfiltered.table).toBe(reference.table);
                expect(unfiltered.uri).toEqual(baseUri);
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }).catch(function (error) {
                    console.dir(error);
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
                    expect(values[1]).toBe(tuple._data.name);
                    expect(values[2]).toBe(tuple._data.value.toString());
                }
            });
        });

        // Local Test Cases:
        if (!process.env.TRAVIS) {
            describe("for tables with slash(`/`) in their name,", function () {
                var reference, page, tuple;
                var limit = 2;

                it('resolve should return a Reference object that is defined.', function(done) {
                    options.ermRest.resolve(entityWithSlash, {cid: "test"}).then(function (response) {
                        reference = response;
                        reference.session = { attributes: [] };

                        expect(reference).toEqual(jasmine.any(Object));

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it('read should return a Page object that is defined.', function(done) {
                    reference.read(limit).then(function (response) {
                        page = response;

                        expect(page).toEqual(jasmine.any(Object));

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it('page should be properly defined based on constructor.', function() {
                    expect(page._ref).toBe(reference);
                    expect(page._data.length).toBe(limit);
                });

                it('tuples should return an Array of Tuple objects.', function() {
                    tuple = page.tuples[0];
                    expect(page._tuples).toBeDefined();
                    expect(tuple._data).toBe(page._data[0]);
                    expect(tuple._pageRef).toBe(reference);
                });

                it('values should return only the values of the tuple.', function() {
                    var values = tuple.values;
                    // based on order in reference_table.json
                    expect(values[0]).toBe(tuple._data.id);
                    expect(values[1]).toBe(tuple._data.col_1);
                });
            });
        }
    });
};
