exports.execute = function (options) {

    describe("For determining reference objects and it's child objects,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "sorted_table";

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName;

        var reference1, reference2;

        beforeAll(function(done) {
           options.ermRest.resolve(multipleEntityUri, {cid:"test"}).then(function(response) {
               reference1 = response;
               done();
           },function (err) {
               console.dir(err);
               done.fail();
           });
        });

        // Test Cases:
        describe('Reference.sort() method, ', function() {
            var page;
            var limit = 10;

            it('sort should return a new Reference with new sort. ', function() {
                reference2 = reference1.sort([{"column":"name", "descending":false}]);
                expect(reference2._location.sortObject.length).toEqual(1);
                expect(reference2._location.sortObject[0].column).toEqual("name");
                expect(reference2._location.sortObject[0].descending).toEqual(false);
            });

            it('read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuples should be sorted. ', function() {
                tuples = page.tuples;
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
                }
            });

        });

        describe('read with sort param for multiple entities, ', function() {
            var reference, page;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(multipleEntityUri + "@sort(id::desc::)", {cid: "test"}).then(function (response) {
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

            it('tuples should be sorted. ', function() {
                tuples = page.tuples;
                for(var i = 0; i < tuples.length - 1; i++) {
                    expect(tuples[i]._data.id).toBeGreaterThan(tuples[i+1]._data.id);
                }
            });

        });

        describe('read with no sort param (default) for multiple entities, ', function() {
            var reference, page;
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

            it('tuples should be sorted by order specified in the schema. ', function() {
                tuples = page.tuples;
                for(var i = 0; i > tuples.length-1; i++) {
                    expect(tuples[i]._data.name).toBeLessThan(tuples[i+1]._data.name);
                }
            });

        });
    });
};
