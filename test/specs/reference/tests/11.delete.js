exports.execute = function (options) {

    describe("deleting reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "delete_schema",
            tableName = "delete_table",
            assocTableName = "association_table";

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

        var associationUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + assocTableName;

        describe('when deleting one row', function() {
            var reference, tuples;

            beforeAll(function (done) {
                tuples = [{key_col: 1}];
                options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir();
                    done.fail();
                });
            });

            it("verify that the reference references multiple rows before deleting any of them.", function (done) {
                // There are 4 rows so 10 is more than enough
                reference.read(10).then(function (response) {
                    expect(response._data.length).toBe(4);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            })

            it("should properly delete the referenced entity from the table.", function (done) {

                reference.delete(tuples).then(function (response) {
                    // response should be empty
                    expect(response).not.toBeDefined();

                    return reference.read(10);
                }).then(function (response) {
                    // Reading the set should show 1 less than before
                    expect(response._data.length).toBe(3);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("verify that the row had been deleted", function (done) {
                // create a new reference that references only the deleted row
                options.ermRest.resolve(baseUri + "/key_col=1", {cid: "test"}).then(function (response) {
                    return response.read(1);
                }).then(function (response) {
                    // no data should be returned because the identified row was deleted
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

        describe('when deleting multiple rows', function() {
            var reference, tuples;

            beforeAll(function (done) {
                tuples = [{key_col: 2}, {key_col: 3}];
                options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir();
                    done.fail();
                });
            });

            it("should properly delete the referenced entity from the table.", function (done) {
                reference.delete(tuples).then(function (response) {
                    // response should be empty
                    expect(response).not.toBeDefined();

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("verify that the rows had been deleted", function (done) {
                // create a new reference that references only the deleted rows
                options.ermRest.resolve(baseUri + "/key_col=2;key_col=3", {cid: "test"}).then(function (response) {
                    return response.read(2);
                }).then(function (response) {
                    // no data should be returned because the identified rows were deleted
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

        describe('when deleting one row from an association table', function() {
            var reference, tuples;

            beforeAll(function (done) {
                tuples = [{delete_id: 4, leaf_id: 1}];
                options.ermRest.resolve(associationUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir();
                    done.fail();
                });
            });

            it("should properly delete the referenced entity from the table.", function (done) {

                reference.delete(tuples).then(function (response) {
                    // response should be empty
                    expect(response).not.toBeDefined();

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("verify that the row had been deleted", function (done) {
                // create a new reference that references only the deleted row
                options.ermRest.resolve(associationUri + "/delete_id=4&leaf_id=1", {cid: "test"}).then(function (response) {
                    return response.read(1);
                }).then(function (response) {
                    // no data should be returned because the identified row was deleted
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
        });
    });
};
