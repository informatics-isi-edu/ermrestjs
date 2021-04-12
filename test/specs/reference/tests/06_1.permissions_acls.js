var ermrestImport = require(process.env.PWD + '/test/utils/ermrest-import.js');
var utils = require("../../../utils/utilities.js");

exports.execute = (options) => {

    var setCatalogAcls = function (done, uri, catalogId, acls, cb, userCookie) {
        utils.setCatalogAcls(options.ermRest, done, uri, catalogId, acls, cb, userCookie);
    };

    var removeCachedCatalog = function (catalogId) {
        return utils.removeCachedCatalog(options.ermRest, catalogId)
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
                        removeCachedCatalog(catalogId).then(() => {
                            options.ermRest.resetUserCookie();
                            return options.ermRest.resolve(tablePermSingleUri, { cid: "test" });
                        }).then((response) => {
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
                        removeCachedCatalog(catalogId).then(() => {
                            options.ermRest.resetUserCookie();
                            return options.ermRest.resolve(tablePermSingleUri, { cid: "test" });
                        }).then((response) => {
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

                    it(".isGenerated should be false.", () => {
                        expect(nameColumn._baseCols[0].isGenerated).toBe(false);
                    });

                    it(".isImmutable should be true", () => {
                        expect(nameColumn._baseCols[0].isImmutable).toBe(true);
                    });

                    it(".isHidden should be false.", () => {
                        expect(nameColumn._baseCols[0].isHidden).toBe(false);
                    });

                });

                describe("Column term with allowed user context for update and select, ", () => {

                    beforeAll(() => {
                        termColumn = reference.columns.find((c) => c.name === 'term');
                    });

                    it(".isGenerated should be true.", () => {
                        expect(termColumn._baseCols[0].isGenerated).toBe(true);
                    });

                    it(".isImmutable should be false", () => {
                        expect(termColumn._baseCols[0].isImmutable).toBe(false);
                    });

                    it(".isHidden should be false.", () => {
                        expect(termColumn._baseCols[0].isHidden).toBe(false);
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
                                                        "select": [],
                                                        "update": []
                                                    }
                                                },
                                                "term": {
                                                    "acls": {
                                                        "insert" : [],
                                                        "select": [],
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

                    it(".isGenerated should be true.", () => {
                        expect(termColumn._baseCols[0].isGenerated).toBe(true);
                    });

                    it(".isImmutable should be false", () => {
                        expect(termColumn._baseCols[0].isImmutable).toBe(true);
                    });

                    it(".isHidden should be false.", () => {
                        expect(termColumn._baseCols[0].isHidden).toBe(false);
                    });

                });

                afterAll((done) => {
                    options.ermRest.setUserCookie(process.env.AUTH_COOKIE);
                    removeCachedCatalog(catalogId).then(() => {
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
                                                        "select": [],
                                                        "update": []
                                                    }
                                                },
                                                "term": {
                                                    "acls": {
                                                        "insert" : [],
                                                        "select": [],
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
        });

        describe("regarding dynamic ACLs, ", function () {
            describe ("when delete is prohibited for certain rows", function () {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "select": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acl_bindings": {
                                                "can_delete_row": {
                                                    "types": ["delete"],
                                                    "projection": [
                                                        {"filter": [null, "key"], "operand": 9001}, "key"
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

                it ("should Tuple should return proper canDelete values", function (done) {
                    reference.read(3).then(function (page) {
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
                                            "acl_bindings": {}
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            });

            describe ("when update is prohibited for certain rows", function () {
                var reference;

                beforeAll((done) => {
                    setCatalogAcls(done, tablePermUri, catalogId, {
                        "catalog": {
                            "id": catalogId,
                            "acls": {
                                "select": ["*"]
                            },
                            "schemas" : {
                                "permission_schema": {
                                    "tables" : {
                                        "perm_table": {
                                            "acl_bindings": {
                                                "can_update_row": {
                                                    "types": ["delete"],
                                                    "projection": [
                                                        {"filter": [null, "key"], "operand": 9002}, "key"
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

                it ("should Tuple should return proper canDelete values", function (done) {
                    reference.read(3).then(function (page) {
                        expect(page.length).toBe(3, "page length missmatch");

                        expect(page.tuples.map(function (t) {
                            return t.canDelete;
                        })).toEqual([false, false, true], "canDelete missmatch");

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
                                            "acl_bindings": {}
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            });

            // TODO
            describe ("when udpate is prohibited for certain columns", function () {

            });
        });
    });
};
