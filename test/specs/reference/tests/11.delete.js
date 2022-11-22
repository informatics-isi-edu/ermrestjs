var utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

    describe("deleting reference objects, ", function () {
        const restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID;
        const restrictedUserCookie = process.env.RESTRICTED_AUTH_COOKIE;

        const checkDetailsMessage = 'Check the error details below to see more information.';

        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "delete_schema",
            tableName = "delete_table",
            reference;

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

        const getReference = (filters) => {
            return new Promise((resolve, reject) => {
                options.ermRest.resolve(`${baseUri}/${filters}`, {cid: "test"}).then(function (response) {
                    resolve(response);
                }).catch((error) => reject(error));
            });
        };

        const findRID = (table, columnName, columnValue) => {
            return utils.findEntityRID(options, schemaName, table, columnName, columnValue)
        }

        describe('when deleting a reference', function() {
            beforeAll(function (done) {
                var uri = baseUri + "/key_col=1";
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir();
                    done.fail(error);
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
                    done.fail(error);
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
                    done.fail(error);
                });
            });
        });

        describe('when deleteing a list of tuples', () => {
            // we're using this to make sure we're actually using tuples and not the reference
            let usedReference;
            beforeAll((done) => {
                getReference('key_col=5').then((response) => {
                    // the context shouldn't matter
                    usedReference = response.contextualize.entryEdit;
                    done();
                }).catch((err) => done.fail(error));
            })

            it ('should properly delete the tuple if there are no issues', (done) => {
                getReference('key_col=6').then((ref) => {
                    return ref.read(1)
                }).then((page) => {
                    return usedReference.delete(page.tuples);
                }).then((res) => {
                    expect(res.message).toEqual("The displayed record successfully deleted.")
                    expect(res.successTupleData.length).toBe(1);
                    expect(res.successTupleData[0].RID).toEqual(findRID(tableName, 'key_col', 6));
                    expect(res.failedTupleData.length).toBe(0);
                    done();
                }).catch((error) => {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it ('should fail if the tuple cannot be deleted.', (done) => {
                getReference('key_col=7').then((ref) => {
                    return ref.read(1)
                }).then((page) => {
                    return usedReference.delete(page.tuples);
                }).then((res) => {
                    expect(res.message).toEqual(`The displayed record could not be deleted. ${checkDetailsMessage}`)
                    expect(res.successTupleData.length).toBe(0);
                    expect(res.failedTupleData.length).toBe(1);
                    expect(res.failedTupleData[0].RID).toEqual(findRID(tableName, 'key_col', 7));
                    const subMessage = [
                        'This entry cannot be deleted as it is still referenced from the <code>outbound1_table</code> table. ',
                        ' All dependent entries must be removed before this item can be deleted.'
                    ].join("\n")
                    expect(res.subMessage).toBe(subMessage);
                    done();
                }).catch((error) => {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it ('should be able handle multiple.', (done) => {
                getReference('key_col::geq::8&key_col::leq::10').then((ref) => {
                    return ref.read(3)
                }).then((page) => {
                    return usedReference.delete(page.tuples);
                }).then((res) => {
                    expect(res.message).toEqual("All of the 3 displayed records successfully deleted.")
                    expect(res.successTupleData.length).toBe(3);
                    expect(res.failedTupleData.length).toBe(0);
                    done();
                }).catch((error) => {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it ('should send two requests because of length lmitation and properly report the failed and successful requests', (done) => {
                // one row in the first batch should be referenced by something else
                getReference('key_col::geq::16&key_col::leq::1100').then((ref) => {
                    return ref.read(1085);
                }).then((page) => {
                    return usedReference.delete(page.tuples);
                }).then((res) => {
                    expect(res.message).toEqual(`94 records successfully deleted. 991 records could not be deleted. ${checkDetailsMessage}`)
                    expect(res.successTupleData.length).toBe(94);
                    expect(res.failedTupleData.length).toBe(991);
                    done();
                }).catch((error) => {
                    console.dir(error);
                    done.fail(error);
                });
            });

            describe('regarding dynamic ACL support', () => {
                let dynamicRef, dynamicTuples;
                /**
                 * deletable rows: 11, 13
                 * other rows that will be used here are: 12, 14, 15
                 */
                beforeAll((done) => {
                    utils.setCatalogAcls(options.ermRest, done,  `${baseUri}/key_col::geq::11&key_col::leq::15@sort(key_col)`, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "delete_schema": {
                                    "tables" : {
                                        "delete_table": {
                                            "acls": {
                                                "select": ["*"]
                                            },
                                            "acl_bindings": {
                                                "deletable_rows": {
                                                    "types": ["delete"],
                                                    "projection": [{
                                                        "or": [
                                                            {"filter": "key_col", "operand": 11},
                                                            {"filter": "key_col", "operand": 13},
                                                        ]
                                                    }, "key_col"]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => dynamicRef = response.contextualize.entryEdit, restrictedUserCookie);
                });

                // this is here just to make sure we're getting proper ACLs for tuple
                it ('should read the new reference so we get the proper ACLs', (done) => {
                    dynamicRef.read(5, null, false, false, true).then((page) => {
                        expect(page.length).toBe(5);
                        expect(page.tuples.map(function (t) {
                            return t.canDelete;
                        })).toEqual([true, false, true, false, false]);
                        dynamicTuples = page.tuples;
                        done();
                    }).catch((error) => {
                        console.dir(error);
                        done.fail(error);
                    });
                });

                it ('should handle the cases where none of the tuples can be deleted', (done) => {
                    // key_col=14 and key_col=15
                    usedReference.delete([dynamicTuples[3], dynamicTuples[4]]).then((res) => {
                        expect(res.message).toEqual(`None of the 2 displayed records could be deleted. ${checkDetailsMessage}`);
                        expect(res.successTupleData.length).toBe(0);
                        expect(res.failedTupleData.length).toBe(2);
                        const subMessage = [
                            'The following records could not be deleted based on your permissions:',
                            '- Record number 1: 14', '- Record number 2: 15'
                        ].join("\n")
                        expect(res.subMessage).toBe(subMessage);
                        done();
                    }).catch((error) => {
                        console.dir(error);
                        done.fail(error);
                    });
                });

                it ('should ignore the tuples that user cannot delete, and delete the rest', (done) => {
                    usedReference.delete(dynamicTuples).then((res) => {
                        expect(res.message).toEqual(`2 records successfully deleted. 3 records could not be deleted. ${checkDetailsMessage}`);
                        expect(res.successTupleData.length).toBe(2);
                        expect(res.failedTupleData.length).toBe(3);
                        const subMessage = [
                            'The following records could not be deleted based on your permissions:',
                            '- Record number 2: 12', '- Record number 4: 14', '- Record number 5: 15'
                        ].join("\n")
                        expect(res.subMessage).toBe(subMessage);
                        done();
                    }).catch((error) => {
                        console.dir(error);
                        done.fail(error);
                    });
                });

                afterAll(function (done) {
                    options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                    utils.removeCachedCatalog(options.ermRest, catalogId);
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "delete_schema": {
                                    "tables" : {
                                        "delete_table": {
                                            "acl_bindings": {}
                                        }
                                    }
                                }
                            }
                        }
                    });
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
                    done.fail(error);
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
                    expect(res.message).toBe("All of the 3 chosen records successfully unlinked.")
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
                    done.fail(error);
                });
            });

            it("should verify association table rows were removed during deletion", function (done) {
                assocReference.read(10).then(function (page) {
                    expect(page.tuples.length).toBe(7, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should verify leaf table rows were not removed during deletion", function (done) {
                leafReference.read(8).then(function (page) {
                    expect(page.tuples.length).toBe(8, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should check failure cases for deleteBatchAssociationTuples", function (done) {
                // no mainTuple defined
                filteredLeafReference.deleteBatchAssociationTuples(null, relatedLeafTuples).then(null, function (err) {
                    expect(err.message).toBe("'parentTuple' must be specified");

                    // no tuuples set defined
                    return filteredLeafReference.deleteBatchAssociationTuples(mainTuple, null);
                }).then(null, function (err) {
                    expect(err.message).toBe("'tuples' must be specified");

                    // tuples set is empty
                    return filteredLeafReference.deleteBatchAssociationTuples(mainTuple, [])
                }).then(null, function (err) {
                    expect(err.message).toBe("'tuples' must have at least one row to delete");

                    // the reference is not filtered (no derived association)
                    return filteredLeafReference.unfilteredReference.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples);
                }).then(null, function (err) {
                    expect(err.message).toBe("The current reference ('self') must have a derived association reference defined");

                    // one of the tuples has an empty data object
                    newTuples = relatedLeafTuples;
                    newTuples.push({data: {}});
                    return filteredLeafReference.deleteBatchAssociationTuples(mainTuple, newTuples)
                }).then(null, function (err) {
                    expect(err.message).toBe("One or more association_table records have a null value for leaf_key_col.");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });
        });

        describe("when trying to unlink with dynamic acls", function () {
            var mainUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":main_table",
                mainReference, relatedLeafReference, filteredLeafReferenceWAcls,
                mainTuple, relatedLeafTuples;

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
                                                    {
                                                        "or": [
                                                            {"filter": "leaf_key_col", "operand": 44},
                                                            {"filter": "leaf_key_col", "operand": 66}
                                                        ]
                                                    }, "leaf_key_col"
                                                ],
                                                "projection_type": "nonnull"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, (response) => mainReference = response.contextualize.detailed, restrictedUserCookie);
            });

            it("should return tuples with proper canUnlink values", function (done) {
                mainReference.read(1).then(function (page) {
                    expect(page.tuples.length).toBe(1, "main page tuples length mismatch");
                    mainTuple = page.tuples[0];

                    // will generate the related reference
                    var relatedList = mainReference.generateRelatedList(page.tuples[0]);

                    expect(mainReference.related.length).toBe(1, "related length mismatch");
                    relatedLeafReference = mainReference.related[0];

                    return relatedLeafReference.read(5, null, false, false, true, false, true);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(4, "related page tuples length mismatch");
                    relatedLeafTuples = page.tuples;
                    filteredLeafReferenceWAcls = relatedLeafTuples[0].reference;

                    expect(relatedLeafTuples.map(function (t) {
                        // data should be (4, 44), (5, 55), (6, 66), (7, 77)
                        // user can unlink (4, 44) and (6, 66)
                        return t.canUnlink;
                    })).toEqual([true, false, true, false], "canUnlink mismatch");

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail(err);
                });
            });

            it("should fail to delete all rows with when some have canUlink false", function (done) {
                // remove the first row that can be deleted
                relatedLeafTuples.splice(0, 1);

                // trying to delete rows (5, 55), (6, 66), (7, 77)
                // user can only unlink (6, 66)
                filteredLeafReferenceWAcls.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples).then(function (res) {
                    expect(res.status).toBe("Batch Unlink Summary", "error status for batch delete is incorrect");
                    expect(res.message).toBe(`None of the 3 chosen records could be unlinked. ${checkDetailsMessage}`, "error message for batch delete is incorrect");
                    expect(res.subMessage).toBe("403 Forbidden\nThe requested delete access on one or more matching rows in table :delete_schema:association_table is forbidden.\n", "error sub message for batch delete is incorrect");
                    expect(res.successTupleData.length).toBe(0, "success count for batch delete is incorrect");
                    expect(res.failedTupleData.length).toBe(3, "failed count for batch delete is incorrect");

                    return relatedLeafReference.read(5);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(4, "# of tuples after batch delete is incorrect");

                    expect(page.tuples.map(function (t) {
                        // data should be (4, 44), (5, 55), (6, 66), and (7, 77)
                        return t.data.int_col;
                    })).toEqual([44, 55, 66, 77], "int_col values mismatch");

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail(err);
                });
            });

            it("should verify leaf table rows were not removed during deletion", function (done) {
                var leafUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":leaf_table";

                options.ermRest.resolve(leafUri, {cid: "test"}).then(function (response) {
                    leafReference = response;

                    return response.read(8);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(8, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            afterAll(function (done) {
                options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                utils.removeCachedCatalog(options.ermRest, catalogId);
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

        describe("when unlinking a set of rows from the main tuple with url limit issues and dynamic acls", function () {
            var mainTableName = "main_table",
                associationTableName = "association_table_long_ids",
                leafTableName = "leaf_table_long_ids",
                restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID,
                restrictedUserCookie = process.env.RESTRICTED_AUTH_COOKIE,
                mainReference, assocReference, leafReference,
                relatedLeafReference, filteredLeafReference,
                mainTuple, relatedLeafTuples, assocTuples, leafTuples;

            var mainUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + mainTableName,
                assocUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + associationTableName,
                leafUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + leafTableName;

            beforeAll(function (done) {
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
                                    "leaf_table_long_ids": {
                                        "acls": {
                                            "select": [restrictedUserId],
                                            "delete": [restrictedUserId]
                                        }
                                    },
                                    "association_table_long_ids": {
                                        "acls": {
                                            "select": [restrictedUserId]
                                        },
                                        "acl_bindings": {
                                            "can_delete_row": {
                                                "types": ["delete"],
                                                "projection": [
                                                    {"filter": "l_key_col", "operand": "8500000000000000000000000000000000000000000000085"}, "l_key_col"
                                                ],
                                                "projection_type": "nonnull"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, (response) => mainReference = response.contextualize.detailed, restrictedUserCookie);
            });

            it("should get back defined references and expected set of rows", function (done) {
                // NOTE: should only be the reference that was based off projections
                expect(mainReference.related.length).toBe(1, "number of related references is incorrect")
                relatedLeafReference = mainReference.related[0];

                mainReference.read(1).then(function (page) {
                    mainTuple = page.tuples[0];

                    expect(mainTuple).toBeDefined("the tuple for main_table is not defined");

                    return relatedLeafReference.read(100);
                }).then(function (page) {
                    relatedLeafTuples = page.tuples;
                    expect(relatedLeafTuples.length).toBe(85, "the tuples related to main for leaf_table_long_ids are not what is expected");

                    filteredLeafReference = relatedLeafTuples[0].reference;
                    expect(filteredLeafReference).toBeDefined("leaf reference from a leaf tuple is not defined");

                    return options.ermRest.resolve(assocUri, {cid: "test"});
                }).then(function (response) {
                    assocReference = response;

                    return assocReference.read(100);
                }).then(function (page) {
                    assocTuples = page.tuples;
                    expect(assocTuples.length).toBe(91, "the tuples for association_table_long_ids are not what is expected");

                    return options.ermRest.resolve(leafUri, {cid: "test"});
                }).then(function (response) {
                    leafReference = response;

                    return leafReference.read(100);
                }).then(function (page) {
                    leafTuples = page.tuples;
                    expect(leafTuples.length).toBe(88, "the tuples for leaf_table_long_ids are not what is expected");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should create 2 paths for deletion, both paths should fail. One path has no deletable rows and the other has a mix of deletable and non-deletable rows when calling deleteBatchAssociationTuples", function (done) {
                relatedLeafTuples.splice(0, 4);
                // for deleteBatchAssociationTuples we need:
                //   - a "main_table" tuple
                //   - an array of "leaf_table" tuples
                //   - a filtered reference representing a single row from the leaf table
                filteredLeafReference.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples).then(function (res) {
                    expect(res.message).toBe(`None of the 81 chosen records could be unlinked. ${checkDetailsMessage}`);
                    expect(res.successTupleData.length).toBe(0, "success count for batch delete is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should create 2 paths for deletion, one path fails to delete rows while the other succesfully deletes 1 row when calling deleteBatchAssociationTuples", function (done) {
                relatedLeafTuples.splice(0, 1);
                // for deleteBatchAssociationTuples we need:
                //   - a "main_table" tuple
                //   - an array of "leaf_table" tuples
                //   - a filtered reference representing a single row from the leaf table
                filteredLeafReference.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples).then(function (res) {
                    expect(res.message).toBe(`1 record successfully unlinked. 79 records could not be unlinked. ${checkDetailsMessage}`)
                    expect(res.successTupleData.length).toBe(1, "success count for batch delete is incorrect");

                    return relatedLeafReference.read(100);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(84, "# of tuples after batch delete is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should verify association table rows were removed during deletion", function (done) {
                assocReference.read(100).then(function (page) {
                    expect(page.tuples.length).toBe(90, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should verify leaf table rows were not removed during deletion", function (done) {
                leafReference.read(100).then(function (page) {
                    expect(page.tuples.length).toBe(88, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            afterAll(function (done) {
                options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                utils.removeCachedCatalog(options.ermRest, catalogId);
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
                                    "leaf_table_long_ids": {
                                        "acls": {
                                            "select": [],
                                            "delete": []
                                        }
                                    },
                                    "association_table_long_ids": {
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

        describe("when unlinking a set of rows from the main tuple with url limit issues and NO dynamic acls", function () {
            var mainTableName = "main_table",
                associationTableName = "association_table_long_ids",
                leafTableName = "leaf_table_long_ids",
                mainReference, assocReference, leafReference,
                relatedLeafReference, filteredLeafReference,
                mainTuple, relatedLeafTuples, assocTuples, leafTuples;

            var mainUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + mainTableName,
                assocUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + associationTableName,
                leafUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + leafTableName;

            beforeAll(function (done) {
                options.ermRest.resolve(mainUri + "/key_col=1", {cid: "test"}).then(function (res) {
                    mainReference = res;
                    // there are 2 related references, we want the 2nd one
                    relatedLeafReference = mainReference.related[1];

                    return mainReference.read(1)
                }).then(function (page) {
                    mainTuple = page.tuples[0];

                    return relatedLeafReference.read(100);
                }).then(function (page) {
                    relatedLeafTuples = page.tuples;
                    filteredLeafReference = relatedLeafTuples[0].reference;

                    return options.ermRest.resolve(assocUri, {cid: "test"});
                }).then(function (response) {
                    assocReference = response;

                    return assocReference.read(100);
                }).then(function (page) {
                    assocTuples = page.tuples;

                    return options.ermRest.resolve(leafUri, {cid: "test"});
                }).then(function (response) {
                    leafReference = response;

                    return leafReference.read(100);
                }).then(function (page) {
                    leafTuples = page.tuples;

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should get back defined references and expected set of rows", function (done) {
                expect(mainTuple).toBeDefined("the tuple for main_table is not defined");
                expect(relatedLeafTuples.length).toBe(84, "the tuples related to main for leaf_table_long_ids are not what is expected");
                expect(filteredLeafReference).toBeDefined("leaf reference from a leaf tuple is not defined");
                expect(leafTuples.length).toBe(88, "the tuples for leaf_table_long_ids are not what is expected");
                expect(assocTuples.length).toBe(90, "the tuples for association_table_long_ids are not what is expected");
                done();
            });

            it("should create 2 paths for deletion, with both succeeding when calling deleteBatchAssociationTuples", function (done) {
                relatedLeafTuples.splice(0, 2);
                // for deleteBatchAssociationTuples we need:
                //   - a "main_table" tuple
                //   - an array of "leaf_table" tuples
                //   - a filtered reference representing a single row from the leaf table
                filteredLeafReference.deleteBatchAssociationTuples(mainTuple, relatedLeafTuples).then(function (res) {
                    expect(res.message).toBe("All of the 82 chosen records successfully unlinked.")
                    expect(res.successTupleData.length).toBe(82, "success count for batch delete is incorrect");

                    return relatedLeafReference.read(100);
                }).then(function (page) {
                    expect(page.tuples.length).toBe(2, "# of tuples after batch delete is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should verify association table rows were removed during deletion", function (done) {
                assocReference.read(100).then(function (page) {
                    expect(page.tuples.length).toBe(8, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
                });
            });

            it("should verify leaf table rows were not removed during deletion", function (done) {
                leafReference.read(100).then(function (page) {
                    expect(page.tuples.length).toBe(88, "leaf table rows length mismatch");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail(error);
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
                    done.fail(error);
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
                    done.fail(error);
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
                    done.fail(error);
                });
            }).pend("412 support has been dropped from ermestjs.");
        });
    });
};
