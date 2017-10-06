var ermrestImport = require(process.env.PWD + '/test/utils/ermrest-import.js');

exports.execute = (options) => {

    var setCatalogAcls = (done, uri, catalogId, acls, cb, userCookie) => {
        ermrestImport.importAcls(acls).then(() => {
            removeCachedCatalog(catalogId);
            if (userCookie) {
                options.ermRest.setUserCookie(userCookie);
            } else {
                options.ermRest.resetUserCookie();
            }
            return options.ermRest.resolve(uri, { cid: "test" });
        }).then((response) => {
            cb(response);
            done();
        }, (err) => {
            console.log(err);
            done.fail();
        });
    }

    var resetCatalogAcls = (done, acls) => {
        ermrestImport.importAcls(acls).then(() => {
            done();
        }, (err) => {
            console.log(err);
            done.fail();
        });
    };

    var removeCachedCatalog = (catalogId) => {
        var server = options.ermRest.ermrestFactory.getServer(process.env.ERMREST_URL);
        delete server.catalogs._catalogs[catalogId];
    };

    describe("For determining reference object permissions,", () => {

        var restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID,
            restrictedUserCookie = process.env.RESTRICTED_AUTH_COOKIE;

        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            schemaName2 = "generated_schema",
            tableName2 = "table_1",                    // table from a generated schema
            schemaName3 = "generated_table_schema",
            tableName3_1 = "generated_table",          // generated table
            tableName3_2 = "generated_columns_table",  // table whose columns are all generated
            tableName3_3 = "generated_columns_table_2",// table with some generated columns
            schemaName4 = "immutable_schema",
            tableName4 = "table_1",                    // table from immutable schema
            schemaName5 = "generated_table_schema",
            tableName5_1 = "immutable_table",          // immutable table
            tableName5_2 = "immutable_columns_table",  // table whose columns are all immutable
            tableName5_3 = "immutable_columns_table_2",// table with some immutable columns
            tableName5_4 = "non_deletable_table",      // table with non-deletable annotation
            schemaName6 = "nondeletable_schema",
            tableName6 = "table_1",                    // table from non-deletable schema
            tableName7 = "table_w_composite_key",
            schemaName8 = "permission_schema",
            tableName8_1= "perm_table",
            tableName8_2= "perm_columns",
            entityId = 9000;

        var singleEnitityUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ':' + tableName + "/id=" + entityId;

        var genSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName2 + ':' + tableName2 + "/id=" + entityId;

        var genTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3_1 + "/id=" + entityId;

        var genColsUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3_2 + "/id=" + entityId;

        var genColsUri_2 = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3_3 + "/id=" + entityId;

        var immuSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName4 + ':' + tableName4 + "/id=" + entityId;

        var immuTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_1 + "/id=" + entityId;

        var immuColsUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_2 + "/id=" + entityId;

        var immuColsUri_2 = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_3 + "/id=" + entityId;

        var nonDeletableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_4 + "/id=" + entityId;

        var nonDeletableSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName6 + ':' + tableName6 + "/id=" + entityId;

        var emptyColumnsSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ':' + tableName7 + "/id=" + entityId;

        var tablePermUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName8 + ':' + tableName8_1 + "/id=" + entityId;

        var columnPermUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName8 + ':' + tableName8_2 + "/id=" + entityId;

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

            describe("should return true for ,", () => {
                it("canCreate.", () => {
                    expect(reference.canCreate).toBeTruthy();
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBeTruthy();
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBeTruthy();
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBeTruthy();
                });
            });

            afterAll((done) => {
                resetCatalogAcls(done, {
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

            describe("should return false for ", () => {
                it("canCreate.", () => {
                    expect(reference.canCreate).toBeFalsy();
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBeFalsy();
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBeFalsy();
                });
            });

            it("should return true for canRead.", () => {
                expect(reference.canRead).toBeTruthy();
            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "select": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when schema is generated,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, genSchemaTableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("generated schema should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be true in table,", () => {
                    expect(reference._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when table is generated,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, genTableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("generated table should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be true in table,", () => {
                    expect(reference._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });


        describe("check permissions when table columns are all generated,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, genColsUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("generated columns should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be false in table,", () => {
                    expect(reference._table._isGenerated).toBe(false);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when some table columns are generated,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, genColsUri_2, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("some generated columns should return true for all,", () => {

                it("_isGenerated should be false in table", () => {
                    expect(reference._table._isGenerated).toBe(false);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when schema is immutable,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, immuSchemaTableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("immutable schema should return true for create, read, and delete, false for update,", () => {

                it("_isImmutable should be true in table,", () => {
                    expect(reference._table._isImmutable).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when table is immutable,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, immuTableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("immutable table should return true for create, read, and delete, false for update,", () => {

                it("_isImmutable should be true in table", () => {
                    expect(reference._table._isImmutable).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when table columns are all immutable,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, immuColsUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("immutable columns should return true for create, read, and delete, false for update,", () => {

                it("_isImmutable should be false in table", () => {
                    expect(reference._table._isImmutable).toBe(false);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when some table columns are immutable,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, immuColsUri_2, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("some immutable columns should return true for all,", () => {

                it("_isImmutable should be false in table", () => {
                    expect(reference._table._isImmutable).toBe(false);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when schema is non-deletable,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, nonDeletableSchemaTableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("Table that is non-deletable should return false for delete, true for all,", () => {

                it("_isNonDeletable should be true in table", () => {
                    expect(reference._table._isNonDeletable).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(false);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when table is non-deletable,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, nonDeletableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("Table that is non-deletable should return false for delete, true for all,", () => {

                it("_isNonDeletable should be true in table", () => {
                    expect(reference._table._isNonDeletable).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(false);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when table visible columns list for entry/create and entry/edit is empty and undefined for other contexts,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, emptyColumnsSchemaTableUri, catalogId, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "enumerate": ["*"],
                            "write": [restrictedUserId] // everybody can write!
                        }
                    }
                }, (response) => reference = response, restrictedUserCookie);
            });

            describe("Table whose visible columns are empty for create and edit context should return false for create and update, and true for read and delete for undefined in other contexts,", () => {

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
                    "catalog": {
                        "id": catalogId,
                        "acls": {
                            "write": [] // nobody apart from owner can write!
                        }
                    }
                });
            });
        });

        describe("check permissions when table is accessed anonymously and as allowed user with insert only permission,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, tablePermUri, catalogId, {
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
                                            "insert" : ["*"],
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

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            describe("Table with anonymous context should return false for select, update and delete, and true for insert,", () => {

                beforeAll((done) => {
                    removeCachedCatalog(catalogId);
                    options.ermRest.resetUserCookie();
                    options.ermRest.resolve(tablePermUri, { cid: "test" }).then((response) => {
                        reference = response;
                        done();
                    }, (err) => {
                        console.log(err);
                        done.fail();
                    });
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(false);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(false);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
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

        describe("check permissions when table is accessed anonymously and as allowed user with select and update permissions,", () => {
            var reference;

            beforeAll((done) => {
                setCatalogAcls(done, tablePermUri, catalogId, {
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
                                            "update": ["*"],
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

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(false);
                });

            });

            describe("Table with anonymous context should return true for select and update, and false for insert and delete,", () => {

                beforeAll((done) => {
                    removeCachedCatalog(catalogId);
                    options.ermRest.resetUserCookie();
                    options.ermRest.resolve(tablePermUri, { cid: "test" }).then((response) => {
                        reference = response;
                        done();
                    }, (err) => {
                        console.log(err);
                        done.fail();
                    });
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(false);
                });

            });

            afterAll((done) => {
                resetCatalogAcls(done, {
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
                setCatalogAcls(done, tablePermUri, catalogId, {
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
                                            "update": ["*"],
                                            "insert": ["*"]
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
                resetCatalogAcls(done, {
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
            var reference, nameColumn, termColumn;

            beforeAll((done) => {
                setCatalogAcls(done, tablePermUri, catalogId, {
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
                                            "update": ["*"],
                                            "insert": ["*"]
                                        },
                                        "columns": {
                                            "name": {
                                                "acls": {
                                                    "insert" : ["*"],
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

            describe("Column name with anonymous user context, ", () => {


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
                    expect(nameColumn._baseCols[0].isHidden).toBe(true);
                });

            });

            describe("Column term with anonymous user context, ", () => {

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
                removeCachedCatalog(catalogId);
    
                resetCatalogAcls(done, {
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
};
