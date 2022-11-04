var utils = require("../../../utils/utilities.js");

exports.execute = (options) => {

    var setCatalogAcls = function (done, uri, catalogId, acls, cb, userCookie) {
        utils.setCatalogAcls(options.ermRest, done, uri, catalogId, acls, cb, userCookie);
    };

    var removeCachedCatalog = function (catalogId) {
        utils.removeCachedCatalog(options.ermRest, catalogId)
    };

    var checkReferenceACLs = function (ref, canRead, canCreate, canCreateReason, canUpdate, canUpdateReason, canDelete) {
        expect(ref.canRead).toBe(canRead, "canRead missmatch.");
        expect(ref.canCreate).toBe(canCreate, "canCreate missmatch.");
        if (canCreateReason) {
            expect(ref.canCreateReason).toEqual(canCreateReason, "canCreateReason missmatch.");
        }
        expect(ref.canUpdate).toBe(canUpdate, "canUpdate missmatch.");
        if (canUpdateReason) {
            expect(ref.canUpdateReason).toEqual(canUpdateReason, "canCreateReason missmatch.");
        }
        expect(ref.canDelete).toBe(canDelete, "canDelete missmatch.");
    };

    var checkTupleACLs = function (ref, canUpdate, canUpdateReason, canDelete, done) {
        ref.read(1).then(function (page) {
            expect(page.tuples.length).toBe(1, "tuple length missmatch.");
            var t = page.tuples[0];
            expect(t.canUpdate).toBe(canUpdate, "canUpdate missmatch.");
            if (canUpdateReason) {
                expect(ref.canUpdateReason).toEqual(canUpdateReason, "canCreateReason missmatch.");
            }
            expect(t.canDelete).toBe(canDelete, "canDelete missmatch.");
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    };

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

    describe("For ACL support, ", () => {

        /**
         * RESTRICTED_AUTH_COOKIE_ID is something that the test framework generates on basis of RESTRICTED_AUTH_COOKIE
         * by fetching the userinfo from webauthn using RESTRICTED_AUTH_COOKIE
         **/
        var restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID,
            restrictedUserCookie = process.env.RESTRICTED_AUTH_COOKIE;

        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            schemaName2 = "generated_schema",
            tableName2 = "table_1",                    // table from a generated schema
            schemaName3 = "permission_schema",
            tableName3= "perm_table",
            entityId = 9000;

        var singleEnitityUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ':' + tableName + "/id=" + entityId;

        var genSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName2 + ':' + tableName2 + "/id=" + entityId;

        var tablePermSingleUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3 + "/key=" + entityId;

        var tablePermUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3;

        beforeAll( () => {
            options.ermRest.appLinkFn(appLinkFn);
        });

        describe("regarding static ACLs, ", function () {
            describe("for a user with permission to write to ERMrest,", () => {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, singleEnitityUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"],
                                "write": [restrictedUserId] // everybody can write!
                            }
                        }
                    }, (response) => reference = response, restrictedUserCookie);
                });

                it ("Reference should return correct permissions.", function () {
                    checkReferenceACLs(reference, true, true, null, true, null, true);
                });

                it ("tuple should return correct permissions.", function (done) {
                    checkTupleACLs(reference, true, null, true, done);
                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "write": [] // nobody apart from owner can write!
                            }
                        }
                    });
                });
            });

            describe("for anonymous user without permission to write to ERMrest,", () => {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, genSchemaTableUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"], // everybody can introspect!
                                "select": ["*"] // everybody can read
                            }
                        }
                    }, (response) => reference = response);
                });

                it ("Reference should return true for canRead and false for other permissions.", function () {
                    checkReferenceACLs(reference, true, false, "Table is generated.", false, "Table is generated.", false);
                });

                it ("tuple should return correct permissions.", function (done) {
                    checkTupleACLs(reference, false, "Table is generated.", false, done);
                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "select": [] // nobody apart from owner can write!
                            }
                        }
                    });
                });
            });

            describe("check permissions when table is accessed anonymously and as allowed user with insert only permission,", () => {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermSingleUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "insert" : [restrictedUserId],
                                                "select": [restrictedUserId],
                                                "update": [restrictedUserId],
                                                "delete": [restrictedUserId]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response, restrictedUserCookie);
                });

                describe("Table with allowed user context should return true for insert, select, update and delete,", () => {
                    it ("Reference should return correct permissions.", function () {
                        checkReferenceACLs(reference, true, true, null, true, null, true);
                    });

                    it ("tuple should return correct permissions.", function (done) {
                        checkTupleACLs(reference, true, null, true, done);
                    });
                });

                describe("Table with anonymous context should return false for select, insert, update and delete.,", () => {

                    beforeAll((done) => {
                        removeCachedCatalog(catalogId);
                        options.ermRest.resetUserCookie();
                        options.ermRest.resolve(tablePermSingleUri, { cid: "test" }).then((response) => {
                            reference = response;
                            done();
                        }, (err) => {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it ("Reference should return correct permissions.", function () {
                        checkReferenceACLs(reference, false, false, "No permissions to create.", false, "No permissions to update.", false);
                    });
                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "insert" : [],
                                                "select": [],
                                                "update": [],
                                                "delete": []
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            });

            describe("check permissions when table is accessed anonymously and as allowed user with only select permissions,", () => {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermSingleUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "insert" : [restrictedUserId],
                                                "select": ["*"],
                                                "update": [restrictedUserId],
                                                "delete": []
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response, restrictedUserCookie);
                });

                describe("Table with allowed user context should return true for insert, select, update and false for delete,", () => {

                    it ("Reference should return correct permissions.", function () {
                        checkReferenceACLs(reference, true, true, null, true, null, false);
                    });

                    it ("tuple should return correct permissions.", function (done) {
                        checkTupleACLs(reference, true, null, false, done);
                    });

                });

                describe("Table with anonymous context should return true for select and update, and false for insert and delete,", () => {

                    beforeAll((done) => {
                        removeCachedCatalog(catalogId);
                        options.ermRest.resetUserCookie();
                        options.ermRest.resolve(tablePermSingleUri, { cid: "test" }).then((response) => {
                            reference = response;
                            done();
                        }, (err) => {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it ("Reference should return correct permissions.", function () {
                        checkReferenceACLs(reference, true, false, "No permissions to create.", false, "No permissions to update.", false);
                    });

                    it ("tuple should return correct permissions.", function (done) {
                        checkTupleACLs(reference, false, "No permissions to update.", false, done);
                    });

                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "insert" : [],
                                                "select": [],
                                                "update": [],
                                                "delete": []
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            });

            describe("check permissions when column is accessed as allowed user,", () => {
                var reference, nameColumn, termColumn;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermSingleUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select" : ["*"],
                                                "update": [restrictedUserId],
                                                "insert": [restrictedUserId]
                                            },
                                            "columns": {
                                                "name": {
                                                    "acls": {
                                                        "insert" : [restrictedUserId],
                                                        "select": [restrictedUserId],
                                                        "update": []
                                                    }
                                                },
                                                "term": {
                                                    "acls": {
                                                        "insert" : [],
                                                        "select": ["*"],
                                                        "update": [restrictedUserId]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response, restrictedUserCookie);
                });

                describe("Column name with allowed user context for insert and select, ", () => {

                    beforeAll(() => {
                        nameColumn = reference.columns.find((c) => c.name === 'name');
                    });

                    it(".isGeneratedPerACLs should be false.", () => {
                        expect(nameColumn._baseCols[0].isGeneratedPerACLs).toBe(false);
                    });

                    it(".isImmutablePerACLs should be true", () => {
                        expect(nameColumn._baseCols[0].isImmutablePerACLs).toBe(true);
                    });

                    it(".isHiddenPerACLs should be false.", () => {
                        expect(nameColumn._baseCols[0].isHiddenPerACLs).toBe(false);
                    });

                });

                describe("Column term with allowed user context for update and select, ", () => {

                    beforeAll(() => {
                        termColumn = reference.columns.find((c) => c.name === 'term');
                    });

                    it(".isGeneratedPerACLs should be true.", () => {
                        expect(termColumn._baseCols[0].isGeneratedPerACLs).toBe(true);
                    });

                    it(".isImmutablePerACLs should be false", () => {
                        expect(termColumn._baseCols[0].isImmutablePerACLs).toBe(false);
                    });

                    it(".isHiddenPerACLs should be false.", () => {
                        expect(termColumn._baseCols[0].isHiddenPerACLs).toBe(false);
                    });

                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select" : [],
                                                "update": [],
                                                "insert": []
                                            },
                                            "columns": {
                                                "name": {
                                                    "acls": {
                                                        "insert" : [],
                                                        "select": ["*"],
                                                        "update": []
                                                    }
                                                },
                                                "term": {
                                                    "acls": {
                                                        "insert" : [],
                                                        "select": ["*"],
                                                        "update": []
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            });

            describe("check permissions when column is accessed anonymously, ", () => {
                var reference, termColumn;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermSingleUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select" : ["*"],
                                                "update": [restrictedUserId],
                                                "insert": [restrictedUserId]
                                            },
                                            "columns": {
                                                "name": {
                                                    "acls": {
                                                        "insert" : [restrictedUserId],
                                                        "select": [restrictedUserId],
                                                        "update": []
                                                    }
                                                },
                                                "term": {
                                                    "acls": {
                                                        "insert": [],
                                                        "select": ["*"],
                                                        "update": [restrictedUserId]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response);
                });

                describe("Column 'name' with anonymous user context, ", () => {

                    it("name column shouldn't be available in the context", () => {
                        var nameColumn = reference.columns.find((c) => c.name === 'name');
                        expect(nameColumn).toBeUndefined();
                    });

                });

                describe("Column 'term' with anonymous user context, ", () => {

                    beforeAll(() => {
                        termColumn = reference.columns.find((c) => c.name === 'term');
                    });

                    it(".isGeneratedPerACLs should be true.", () => {
                        expect(termColumn._baseCols[0].isGeneratedPerACLs).toBe(true);
                    });

                    it(".isImmutablePerACLs should be false", () => {
                        expect(termColumn._baseCols[0].isImmutablePerACLs).toBe(true);
                    });

                    it(".isHiddenPerACLs should be false.", () => {
                        expect(termColumn._baseCols[0].isHiddenPerACLs).toBe(false);
                    });

                });

                afterAll((done) => {
                    options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                    removeCachedCatalog(catalogId);
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "enumerate": ["*"]
                            },
                            "schemas" : {
                            "permission_schema": {
                                "tables" : {
                                    "perm_table": {
                                        "acls": {
                                            "select" : [],
                                            "update": [],
                                            "insert": []
                                        },
                                        "columns": {
                                            "name": {
                                                "acls": {
                                                    "insert" : [],
                                                    "select": ["*"],
                                                    "update": []
                                                }
                                            },
                                            "term": {
                                                "acls": {
                                                    "insert" : [],
                                                    "select": ["*"],
                                                    "update": []
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        }
                    });
                });
            });
        });

        describe("regarding dynamic ACLs, ", function () {

            describe ("when delete is only allowed for certain rows, ", function () {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select": ["*"]
                                            },
                                            "acl_bindings": {
                                                "can_delete_row": {
                                                    "types": ["delete"],
                                                    "projection": [
                                                        {"filter": "key", "operand": 9001}, "key"
                                                    ],
                                                    "projection_type": "nonnull"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response, restrictedUserCookie);
                });

                it ("Tuple should should return static ACLs by default", function (done) {
                    reference.read(3).then(function (page) {
                        expect(page.length).toBe(3, "page length missmatch");

                        expect(page.tuples.map(function (t) {
                            return t.canDelete;
                        })).toEqual([true, true, true], "canDelete missmatch");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("Tuple should should return proper canDelete values when asked to use TRS", function (done) {
                    reference.read(3, null, false, false, true).then(function (page) {
                        expect(page.length).toBe(3, "page length missmatch");

                        expect(page.tuples.map(function (t) {
                            return t.canDelete;
                        })).toEqual([false, true, false], "canDelete missmatch");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
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

            describe("when delete is only allowed for certain rows in related entities, ", function () {
                var reference;

                beforeAll((done) => {
                    // the tables are readable
                    // perm_related_table is deletable
                    // only row with id_2=2 is deletable for assoc
                    setCatalogAcls(done, tablePermUri + "/key=9000", catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select": [restrictedUserId]
                                            }
                                        },
                                        "perm_related_table": {
                                            "acls": {
                                                "select": [restrictedUserId],
                                                "delete": [restrictedUserId]
                                            }
                                        },
                                        "perm_association_table": {
                                            "acls": {
                                                "select": [restrictedUserId]
                                            },
                                            "acl_bindings": {
                                                "can_delete_row": {
                                                    "types": ["delete"],
                                                    "projection": [
                                                        {"filter": "id_2", "operand": "2"}, "id_2"
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

                it ("should Tuple should return proper canUnlink values", function (done) {
                    reference.read(1).then(function (page) {
                        expect(page.length).toBe(1, "main page length missmatch");

                        // will generate the related reference
                        var activeList = reference.generateRelatedList(page.tuples[0]);

                        expect(reference.related.length).toBe(1, "related length missmatch");

                        return reference.related[0].read(2, null, false, false, true, false, true);
                    }).then(function (page) {
                        expect(page.length).toBe(2, "page length missmatch");

                        expect(page.tuples.map(function (t) {
                            return t.canUnlink;
                        })).toEqual([false, true], "canUnlink missmatch");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select": []
                                            }
                                        },
                                        "perm_related_table": {
                                            "acls": {
                                                "select": [],
                                                "delete": []
                                            }
                                        },
                                        "perm_association_table": {
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

            describe ("when update is only allowed for certain rows, ", function () {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select": ["*"]
                                            },
                                            "acl_bindings": {
                                                "can_update_row": {
                                                    "types": ["update"],
                                                    "projection": [
                                                        {"filter": "key", "operand": 9002}, "key"
                                                    ],
                                                    "projection_type": "nonnull"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response, restrictedUserCookie);
                });

                it ("Tuple should return static ACLs by default", function (done) {
                    reference.read(3).then(function (page) {
                        expect(page.length).toBe(3, "path length missmatch");
                        expect(page.tuples.map(function (t) {
                            return t.canUpdate;
                        })).toEqual([true, true, true], "canUpdate missmatch");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("Tuple should return proper canUpdate values when asked to use TRS", function (done) {
                    reference.read(3, {}, false, false, true).then(function (page) {
                        expect(page.length).toBe(3, "page length missmatch");

                        expect(page.tuples.map(function (t) {
                            return t.canUpdate;
                        })).toEqual([false, false, true], "canUpdate missmatch");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                afterAll((done) => {
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
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

            describe ("when update is only allowed for certain columns, ", function () {
                var reference, tuples;

                beforeAll((done) => {
                    // all the rows can be updated
                    // the table dynamic acl are not used for columns
                    // all the columns can update row with key=9001
                    // some columns of key=9002 can be updated
                    // therefore:
                    //  9000: none of the columns can be updated
                    //  9001: all the columns can be updated
                    //  9002: some columns can be updated (term, fk_col_2)
                    setCatalogAcls(done, tablePermUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": {
                                                "select": ["*"]
                                            },
                                            "acl_bindings": {
                                                "can_update_any_valid_rows": {
                                                    "types": ["update"],
                                                    "projection": [
                                                        {"filter": "key", "operand": -9999, "negate": true}, "key"
                                                    ],
                                                    "projection_type": "nonnull"
                                                }
                                            },
                                            "columns": {
                                                "key": {
                                                    "acls": {
                                                        "select": ["*"]
                                                    },
                                                    "acl_bindings": {
                                                        "can_update_any_valid_rows": false,
                                                        "can_update_col_for_9001": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9001}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "acls": {
                                                        "select": ["*"]
                                                    },
                                                    "acl_bindings": {
                                                        "can_update_any_valid_rows": false,
                                                        "can_update_col_for_9001": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9001}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        }
                                                },
                                                },
                                                "term": {
                                                    "acls": {
                                                        "select": ["*"]
                                                    },
                                                    "acl_bindings": {
                                                        "can_update_any_valid_rows": false,
                                                        "can_update_col_for_9001": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9001}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        },
                                                        "can_update_col_for_9002": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9002}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        }
                                                    }
                                                },
                                                "fk_col_1": {
                                                    "acls": {
                                                        "select": ["*"]
                                                    },
                                                    "acl_bindings": {
                                                        "can_update_any_valid_rows": false,
                                                        "can_update_col_for_9001": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9001}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        }
                                                    }
                                                },
                                                "fk_col_2": {
                                                    "acls": {
                                                        "select": ["*"]
                                                    },
                                                    "acl_bindings": {
                                                        "can_update_any_valid_rows": false,
                                                        "can_update_col_for_9001": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9001}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        },
                                                        // this column allows for 9002,
                                                        // but since fk_col_1 doesn't the whole fk doesn't
                                                        "can_update_col_for_9002": {
                                                            "types": ["update"],
                                                            "projection": [
                                                                {"filter": "key", "operand": 9002}, "key"
                                                            ],
                                                            "projection_type": "nonnull"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, (response) => reference = response.contextualize.entryEdit, restrictedUserCookie);
                });

                it ("Tuple should return proper canUpdate based on table and column level acls when using TCRS, ", function (done) {
                    // NOTE passing the getTCRS=true option
                    reference.read(3, null, false, false, false, true).then(function (page) {
                        expect(page.length).toBe(3, "page length missmatch");

                        tuples = page.tuples;

                        expect(tuples[0].data['key']).toBe(9000, "tuple index=0 missmatch");
                        expect(tuples[0].canUpdate).toBe(false, "none of the columns can be udpated");

                        expect(tuples[1].data['key']).toBe(9001, "tuple index=1 missmatch");
                        expect(tuples[1].canUpdate).toBe(true, "all columns can be updated");

                        expect(tuples[2].data['key']).toBe(9002, "tuple index=2 missmatch");
                        expect(tuples[2].canUpdate).toBe(true, "some of the columns can be udpated");

                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("Tuple should return proper canUpdateValues based on table and column level acls, ", function () {
                    // none of the columns can be updated
                    tuples[0].canUpdateValues.forEach(function (cuv, i) {
                        expect(cuv).toBe(false, "missmatch for row index=0, col index="+ i);
                    });

                    // all of the columns can be updated
                    tuples[1].canUpdateValues.forEach(function (cuv, i) {
                        expect(cuv).toBe(true, "missmatch for row index=1, col index="+ i);
                    });

                    // only term can be updated:
                    tuples[2].canUpdateValues.forEach(function (cuv, i) {
                        // term is the third visible column list
                        expect(cuv).toBe(i == 2, "missmatch for row index=2, col index="+ i);
                    });
                });

                it ("update should ignore the rows and columns that cannot be updated", function (done) {
                    tuples.forEach(function (t) {
                        t.data["name"] = "new name";
                        t.data["term"] = "new term";
                    })

                    reference.update([tuples[0], tuples[1]]).then(function (res) {
                        var p = res.disabled;
                        expect(p.length).toBe(1, "disabled length missmatch");
                        expect(p.tuples[0].values[0]).toBe("9000", "disabled first row key missmatch");

                        p = res.successful;
                        expect(p.length).toBe(1, "result length missmatch");
                        expect(p.tuples[0].values[0]).toBe("9001", "successful key missmatch");
                        expect(p.tuples[0].values[1]).toBe("new name", "successful name missmatch");
                        expect(p.tuples[0].values[2]).toBe("new term", "successful term missmatch");

                        // NOTE we cannot support multi-edit for this case,
                        // if we attempt multi-edit, it will throw an error
                        return reference.update([tuples[2]]);
                    }).then(function (res) {
                        p = res.successful;
                        expect(p.length).toBe(1, "successful 9002 length missmatch");
                        expect(p.tuples[0].values[0]).toBe("9002", "successful 9002 key missmatch");
                        // name cannot be updated and therefore ignored
                        expect(p.tuples[0].values[1]).toBe("one", "successful 9002 name missmatch");
                        expect(p.tuples[0].values[2]).toBe("new term", "successful 9002 term missmatch");
                        return reference.read(3);
                    }).then (function (res) {
                        expect(res.length).toBe(3, "after update: page length missmatch");

                        var values = [
                            {"key": 9000, "name": "one", "term": "term one"},
                            {"key": 9001, "name": "new name", "term": "new term"},
                            {"key": 9002, "name": "one", "term": "new term"}
                        ]
                        values.forEach(function (v, i) {
                            for (var k in v) {
                                expect(res.tuples[i].data[k]).toEqual(v[k], "after update: tuple index=" + i  + ", col="+ k +" value missmatch");
                            }
                        })

                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail(err);
                    });
                });

                afterAll((done) => {
                    options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                    removeCachedCatalog(catalogId);
                    utils.resetCatalogAcls(done, {
                        "catalog": {
                            "id": catalogId,
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acls": { "select": [] },
                                            "acl_bindings": {},
                                            "columns": {
                                                "key": { "acl_bindings": {} },
                                                "name": { "acl_bindings": {} },
                                                "term": { "acl_bindings": {} },
                                                "fk_col_1": { "acl_bindings": {} },
                                                "fk_col_2": { "acl_bindings": {} }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            })

        });

    });
};
