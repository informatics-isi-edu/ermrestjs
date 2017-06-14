exports.execute = function (options) {

    describe("deleting reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "delete_schema",
            tableName = "delete_table",
            reference;

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

        describe('when deleting regularly', function() {
            beforeAll(function (done) {
                var uri = baseUri + "/key_col=1";
                var tuples;
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir();
                    done.fail();
                });
            });

            it("should properly delete the referenced entity from the table.", function (done) {
                // need to read to have the etag
                reference.read(1).then(function (response) {
                    tuples = response.tuples;
                    return reference.delete(tuples);
                }).then(function (response) {
                    // response should be empty
                    expect(response).not.toBeDefined();

                    return reference.read(1);
                }).then(function (response) {
                    // Reading an object that doesn't exist should return no data
                    expect(response._data.length).toBe(0);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            // entity with key_col = 1 deleted previously
            it("should return a positive error code when trying to delete an already deleted entity.", function (done) {
                reference.delete(tuples).then(function (response) {
                    // response should be a positive status code triggering the success calback
                    // response object should be undefined
                    expect(response).not.toBeDefined();

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });

        describe('if attempting a delete with mismatching ETags', function() {
            // When a delete request is met with a 412 Precondition Failed, reference.delete
            // should check if its referenced data has changed (whether it's been deleted or modified
            // by a previous operation). If there's been no change, the delete proceeds as usual.
            // Otherwise, reference.delete should raise the 412 error.

            xit('should proceed with the delete if the referenced data has not changed', function(done) {
                var uri = baseUri + "/key_col=2", tuples, reference;

                options.ermRest.resolve(uri, {cid: "test"}).then(function(response) {
                    reference = response;
                    return reference.read(1);
                }).then(function(response) {
                    tuples = response.tuples;
                    // Deliberately modify reference's ETag to a bad one to simulate
                    // when someone has made a change to this table (but not this row).
                    tuples[0].page._etag = 'a mismatching ETag';
                    return reference.delete(tuples);
                }).then(function success(response) {
                    expect(response).not.toBeDefined();
                    return reference.read(1);
                }, function error(reason) {
                    // Should not reach this error callback
                    expect(reason).not.toBeDefined();
                    done.fail();
                }).then(function(response) {
                    // Reading an object that doesn't exist should return no data
                    expect(response._data.length).toBe(0);
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            }).pend("412 support has been dropped from ermestjs.");

            xit('should raise a 412 error if the referenced data was modified', function(done) {
                // To simulate this, we
                // 1. Get 2 references to the same row: ref1 and ref2.
                // 2. Update ref2 with new tuples.
                // 3. Attempt ref1.delete; it should error out.
                var uri = baseUri + "/key_col=3", tuples1, ref1, ref2;

                options.ermRest.resolve(uri, {cid: 'test'}).then(function(response) {
                    ref1 = response; ref2 = response.contextualize.entryEdit;
                    return ref1.read(1);
                }).then(function(response) {
                    tuples1 = response.tuples;
                    return ref2.read(1);
                }).then(function(response) {
                    var tuples2 = response.tuples;
                    var tuple2 = tuples2[0];
                    var data = tuple2.data;

                    var newRef2Data = {
                        "text_col": "abcdefgh",
                    };

                    for (var key in newRef2Data) {
                        data[key] = newRef2Data[key];
                    }
                    return ref2.update(tuples2);
                }).then(function(response) {
                    return ref1.delete(tuples1);
                }).then(function(response) {
                    expect(response).not.toBeDefined();
                    done.fail();
                }, function(error) {
                    expect(error.code).toBe(412);
                    done();
                }).catch(function(error) {
                    console.dir(error);
                    done.fail();
                });
            }).pend("412 support has been dropped from ermestjs.");

            xit('should return a positive error code when trying to delete an already deleted entity.', function(done) {
                // To simulate this, we
                // 1. Get 2 references to the same row: ref1 and ref2.
                // 2. Run ref2.delete.
                // 3. Attempt ref1.delete; it should not error out.
                var uri = baseUri + "/key_col=4", tuples1, ref1, ref2;

                options.ermRest.resolve(uri, {cid: 'test'}).then(function(response) {
                    ref1 = response; ref2 = response;
                    return ref1.read(1);
                }).then(function(response) {
                    tuples1 = response.tuples;
                    return ref2.read(1);
                }).then(function(response) {
                    var tuples2 = response.tuples;
                    return ref2.delete(tuples2);
                }).then(function(response) {
                    return ref1.delete(tuples1);
                }).then(function(response) {
                    // response should be empty
                    expect(response).not.toBeDefined();
                    done();
                }, function(error) {
                    expect(error).not.toBeDefined();
                    done.fail();
                }).catch(function(error) {
                    console.dir(error);
                    done.fail();
                });
            }).pend("412 support has been dropped from ermestjs.");
        })
    });
};
