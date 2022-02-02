var utils = require("../../../utils/utilities.js");

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
                reference.delete().then(function (response) {
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
                reference.delete().then(function (response) {
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

        describe("when unlinking a set of rows from the main tuple (deleting association references)", function () {
            var mainTableName = "main_table",
                associationTableName = "association_table",
                leafTableName = "leaf_table",
                mainReference, assocReference, leafReference,
                relatedLeafReference, filteredLeafReference,
                mainTuple, relatedLeafTuples, assocTuples, leafTuples;

            var mainUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + mainTableName,
                assocUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + associationTableName,
                leafUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + leafTableName;

            beforeAll(function (done) {
                options.ermRest.resolve(mainUri + "/key_col=1", {cid: "test"}).then(function (response) {
                    mainReference = response;
                    relatedLeafReference = mainReference.related[0]

                    return mainReference.read(1);
                }).then(function (page) {
                    mainTuple = page.tuples[0];

                    return relatedLeafReference.read(7);
                }).then(function (page) {
                    relatedLeafTuples = page.tuples;
                    filteredLeafReference = relatedLeafTuples[0].reference;

                    return options.ermRest.resolve(assocUri, {cid: "test"});
                }).then(function (response) {
                    assocReference = response;

                    return assocReference.read(10);
                }).then(function (page) {
                    assocTuples = page.tuples;

                    return options.ermRest.resolve(leafUri, {cid: "test"});
                }).then(function (response) {
                    leafReference = response;

                    return leafReference.read(8);
                }).then(function (page) {
                    leafTuples = page.tuples;

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should get back defined references and expected set of rows", function (done) {
                expect(mainTuple).toBeDefined("the tuple for main_table is not defined");
                expect(relatedLeafTuples.length).toBe(7, "the tuples related to main for leaf_table are not what is expected");
                expect(filteredLeafReference).toBeDefined("leaf reference from a leaf tuple is not defined");
                expect(leafTuples.length).toBe(8, "the tuples for leaf_table are not what is expected");
                expect(assocTuples.length).toBe(10, "the tuples for association_table are not what is expected");
                done();
            });

            it("should delete multiple rows when calling deleteBatchAssociationTuples", function (done) {
                // remove the last four of the tuples from the array so we only delete 3 rows and check that 4 still remain
                // tuples to delete are (1, 11), (2, 22), (3, 33)
                relatedLeafTuples.splice(3, 4);
                // for deleteBatchAssociationTuples we need:
                //   - a "main_table" tuple
                //   - an array of "leaf_table" tuples
                //   - a filtered reference representing a single row from the leaf table
                filteredLeafReference.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples).then(function (res) {
                    expect(res.message).toBe("3 records successfully removed.")
                    expect(res.successTupleData.length).toBe(3, "success count for batch delete is incorrect");

                    return relatedLeafReference.read(7);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(4, "# of tuples after batch delete is incorrect");

                    expect(page.tuples.map(function (t) {
                        // data should be (4, 44), (5, 55), (6, 66), (7, 77)
                        return t.data.int_col;
                    })).toEqual([44, 55, 66, 77], "int_col values mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should verify association table rows were removed during deletion", function (done) {
                assocReference.read(10).then(function (page) {
                    expect(page.tuples.length).toBe(7, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should verify leaf table rows were not removed during deletion", function (done) {
                leafReference.read(8).then(function (page) {
                    expect(page.tuples.length).toBe(8, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should check failure cases for deleteBatchAssociationTuples", function (done) {
                // no mainTuple defined
                filteredLeafReference.deleteBatchAssociationTuples(null, relatedLeafTuples).then(null, function (err) {
                    expect(err.message).toBe("Error: 'parentTuple' must be specified");

                    // no tuuples set defined
                    return filteredLeafReference.deleteBatchAssociationTuples(mainTuple, null);
                }).then(null, function (err) {
                    expect(err.message).toBe("Error: 'tuples' must be specified");

                    // tuples set is empty
                    return filteredLeafReference.deleteBatchAssociationTuples(mainTuple, [])
                }).then(null, function (err) {
                    expect(err.message).toBe("Error: 'tuples' must have at least one row to delete");

                    // the reference is not filtered (no derived association)
                    return filteredLeafReference.unfilteredReference.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples);
                }).then(null, function (err) {
                    expect(err.message).toBe("Error: The current reference ('self') must have a derived association reference defined");

                    // one of the tuples has an empty data object
                    newTuples = relatedLeafTuples;
                    newTuples.push({data: {}});
                    return filteredLeafReference.deleteBatchAssociationTuples(mainTuple, newTuples)
                }).then(null, function (err) {
                    expect(err.message).toBe("One or more association_table tuples have a null value for int_col");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });

        describe("when trying to unlink with dynamic acls", function () {
            var mainUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":main_table",
                restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID,
                restrictedUserCookie = process.env.RESTRICTED_AUTH_COOKIE,
                reference;

            beforeAll(function(done) {
                // leaf_table is deletable
                // only row with leaf_key_col=11 is nondeletable for assoc for "non restricted user"
                utils.setCatalogAcls(options.ermRest, done, mainUri + "/key_col=1", catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "schemas" : {
                            "delete_schema": {
                                "tables" : {
                                    "main_table": {
                                        "acls": {
                                            "select": [restrictedUserId]
                                        }
                                    },
                                    "leaf_table": {
                                        "acls": {
                                            "select": [restrictedUserId],
                                            "delete": [restrictedUserId]
                                        }
                                    },
                                    "association_table": {
                                        "acls": {
                                            "select": [restrictedUserId]
                                        },
                                        "acl_bindings": {
                                            "can_delete_row": {
                                                "types": ["delete"],
                                                "projection": [
                                                    {"filter": "leaf_key_col", "operand": 11}, "leaf_key_col"
                                                ],
                                                "projection_type": "nonnull"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, (response) => reference = response.contextualize.detailed, restrictedUserCookie);
            });

            it("should return tuples with proper canUnlink values", function (done) {
                reference.read(1).then(function (page) {
                    expect(page.tuples.length).toBe(1, "main page tuples length mismatch");

                    expect(reference.related.length).toBe(1, "related length mismatch");

                    return reference.related[0].read(5, null, false, false, true, false, true);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(4, "related page tuples length mismatch");

                    expect(page.tuples.map(function (t) {
                        // data should be (4, 44), (5, 55), (6, 66), (7, 77)
                        return t.canUnlink;
                    })).toEqual([false, true, true, true], "canUnlink mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            afterAll(function (done) {
                utils.resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "schemas" : {
                            "delete_schema": {
                                "tables" : {
                                    "main_table": {
                                        "acls": {
                                            "select": []
                                        }
                                    },
                                    "leaf_table": {
                                        "acls": {
                                            "select": [],
                                            "delete": []
                                        }
                                    },
                                    "association_table": {
                                        "acls": {
                                            "select": []
                                        },
                                        "acl_bindings": {}
                                    }
                                }
                            }
                        }
                    }
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
