var utils = require(process.env.PWD + '/test/utils/utilities.js');

exports.execute = (options) => {

    describe("For permission related annotations, ", () => {

        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            schemaName2 = "generated_schema",
            referenceTable = "reference_table",
            genSchematableName1 = "table_1",                    // table from generated schema
            genSchematableName2 = "table_2",                    // table from generated schema
            genSchematableName3 = "table_3",                    // table from generated schema
            schemaName3 = "generated_table_schema",
            tableName3_1 = "generated_table",          // generated table
            tableName3_2 = "generated_columns_table",  // table whose columns are all generated
            tableName3_3 = "generated_columns_table_2",// table with some generated columns
            schemaName4 = "immutable_schema",
            immutSchemaTableName1 = "table_1",        // table from immutable schema
            immutSchemaTableName2 = "table_2",        // table from immutable schema
            schemaName5 = "generated_table_schema",
            tableName5_1 = "immutable_table",          // immutable table
            tableName5_2 = "immutable_columns_table",  // table whose columns are all immutable
            tableName5_3 = "immutable_columns_table_2",// table with some immutable columns
            tableName5_4 = "non_deletable_table",      // table with non-deletable annotation
            tableName5_5 = "mutable_table",      // table with immutable:false annotation
            schemaName6 = "nondeletable_schema",
            nonDelSchemaTableName1 = "table_1",                    // table from non-deletable schema
            nonDelSchemaTableName2 = "table_2",                    // table from non-deletable schema
            tableName7 = "table_w_composite_key",
            entityId = 9000;

        var mainTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ':' + referenceTable;

        var genSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName2 + ':' + genSchematableName1 + "/id=" + entityId;

        var genSchemaTable2Uri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName2 + ':' + genSchematableName2 + "/id=" + entityId;

        var genSchemaTable3Uri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName2 + ':' + genSchematableName3 + "/id=" + entityId;

        var genTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3_1 + "/id=" + entityId;

        var genColsUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3_2 + "/id=" + entityId;

        var genColsUri_2 = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3_3 + "/id=" + entityId;

        var immuSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName4 + ':' + immutSchemaTableName1 + "/id=" + entityId;

        var immuSchemaTable2Uri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName4 + ':' + immutSchemaTableName2 + "/id=" + entityId;

        var immuTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_1 + "/id=" + entityId;

        var immuColsUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_2 + "/id=" + entityId;

        var immuColsUri_2 = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_3 + "/id=" + entityId;

        var nonDeletableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName5 + ':' + tableName5_4 + "/id=" + entityId;

        var mutableTableInGenSchemaUri = options.url + "/catalog/" + catalogId + "/entity/"
        + schemaName5 + ':' + tableName5_5 + "/id=" + entityId;

        var nonDeletableSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName6 + ':' + nonDelSchemaTableName1 + "/id=" + entityId;

        var nonDeletableSchemaTable2Uri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName6 + ':' + nonDelSchemaTableName2 + "/id=" + entityId;

        var emptyColumnsSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ':' + tableName7 + "/id=" + entityId;

        beforeAll(() => {
            options.ermRest.setUserCookie(options.authCookie);
        });

        describe('check permissions when catalog is generated,', () => {
            let reference;
            beforeAll((done) => {
                utils.setCatalogAnnotations(options, { "tag:isrd.isi.edu,2016:generated": {} }).then(() => {
                    return options.ermRest.resolve(mainTableUri, { cid: "test" });
                }).then((ref) => {
                    reference = ref;
                    done();
                }).catch((err) => done.fail(err));
            });

            describe("generated catalog should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be true in table,", () => {
                    expect(reference._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                    expect(reference.canCreateReason).toBe("Table is generated.");
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                    expect(reference.canUpdateReason).toBe("Table is generated.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                // removed the catalog annotation
                utils.setCatalogAnnotations(options, {}).then(() => {
                    done();
                }).catch((err) => done.fail(err));
            });
        });

        describe("check permissions when schema is generated,", () => {
            var reference, referenceTable2, referenceTable3;

            beforeAll((done) => {
                options.ermRest.resolve(genSchemaTableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    return options.ermRest.resolve(genSchemaTable2Uri, { cid: "test" });
                }).then((response) => {
                    referenceTable2 = response;
                    return options.ermRest.resolve(genSchemaTable3Uri, { cid: "test" });
                }).then((response) => {
                    referenceTable3 = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
            });

            describe("generated schema should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be true in table,", () => {
                    expect(reference._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                    expect(reference.canCreateReason).toBe("Table is generated.");
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                    expect(reference.canUpdateReason).toBe("Table is generated.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            describe("when table has generated annotation with `false` value.", function () {
                it("_isGenerated should be false in table,", () => {
                    expect(referenceTable2._table._isGenerated).toBe(false);
                });

                it("canCreate.", () => {
                    expect(referenceTable2.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(referenceTable2.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(referenceTable2.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(referenceTable2.canDelete).toBe(true);
                });
            });

            describe("when table has immutable annotation with `false` value.", function () {
                it("_isGenerated should be false in table,", () => {
                    expect(referenceTable3._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(referenceTable3.canCreate).toBe(false);
                    expect(referenceTable3.canCreateReason).toBe("Table is generated.");
                });

                it("canRead.", () => {
                    expect(referenceTable3.canRead).toBe(true);
                });

                it("canUpdate should honor immutable:false annotation", () => {
                    expect(referenceTable3.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(referenceTable3.canDelete).toBe(true);
                });
            });

        });

        describe("check permissions when table is generated,", () => {
            var reference, reference2;

            beforeAll((done) => {
                options.ermRest.resolve(genTableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    return options.ermRest.resolve(mutableTableInGenSchemaUri, { cid: "test" });
                }).then ((response) => {
                    reference2 = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
            });

            describe("generated table should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be true in table,", () => {
                    expect(reference._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                    expect(reference.canCreateReason).toBe("Table is generated.");
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                    expect(reference.canUpdateReason).toBe("Table is generated.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            describe("when table has immutable annotation with `false` value.", function () {
                it("_isGenerated should be true in table,", () => {
                    expect(reference._table._isGenerated).toBe(true);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                    expect(reference.canCreateReason).toBe("Table is generated.");
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate should honor the immutable:false and ignore generated", () => {
                    expect(reference2.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });
            });

        });


        describe("check permissions when table columns are all generated,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(genColsUri, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
            });

            describe("generated columns should return true for read and delete, false for all else,", () => {

                it("_isGenerated should be false in table,", () => {
                    expect(reference._table._isGenerated).toBe(false);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                    expect(reference.canCreateReason).toBe("All columns are disabled.");
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                    expect(reference.canUpdateReason).toBe("All columns are disabled.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

        });

        describe("check permissions when some table columns are generated,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(genColsUri_2, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
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

        });

        describe('check permissions when catalog is immutable,', () => {
            let reference;
            beforeAll((done) => {
                utils.setCatalogAnnotations(options, { "tag:isrd.isi.edu,2016:immutable": {} }).then(() => {
                    return options.ermRest.resolve(mainTableUri, { cid: "test" });
                }).then((ref) => {
                    reference = ref;
                    done();
                }).catch((err) => done.fail(err));
            });

            describe("immutable catalog should return true for create, read, and delete, false for update,", () => {

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
                    expect(reference.canUpdateReason).toBe("Table is immutable.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            afterAll((done) => {
                // removed the catalog annotation
                utils.setCatalogAnnotations(options, {}).then(() => {
                    done();
                }).catch((err) => done.fail(err));
            });
        });

        describe("check permissions when schema is immutable,", () => {
            var reference, referenceTable2;

            beforeAll((done) => {
                options.ermRest.resolve(immuSchemaTableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    return options.ermRest.resolve(immuSchemaTable2Uri, { cid: "test" });
                }).then((response) => {
                    referenceTable2 = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
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
                    expect(reference.canUpdateReason).toBe("Table is immutable.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

            describe("when table has immutable annotation with `false` value.", function () {
                it("_isImmutable should be false in table,", () => {
                    expect(referenceTable2._table._isImmutable).toBe(false);
                });

                it("canCreate.", () => {
                    expect(referenceTable2.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(referenceTable2.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(referenceTable2.canUpdate).toBe(true);
                });

                it("canDelete.", () => {
                    expect(referenceTable2.canDelete).toBe(true);
                });
            })

        });

        describe("check permissions when table is immutable,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(immuTableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
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
                    expect(reference.canUpdateReason).toBe("Table is immutable.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

        });

        describe("check permissions when table columns are all immutable,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(immuColsUri, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
            });

            describe("immutable columns should return true for create, read, and delete, false for update,", () => {

                it("_isImmutable should be null in table", () => {
                    // annotation is missing, so it should return null
                    expect(reference._table._isImmutable).toBe(null);
                });

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                    expect(reference.canUpdateReason).toBe("All columns are disabled.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when some table columns are immutable,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(immuColsUri_2, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
            });

            describe("some immutable columns should return true for all,", () => {

                it("_isImmutable should be null in table", () => {
                    expect(reference._table._isImmutable).toBe(null);
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

        });

        describe('check permissions when catalog is non-deletable,', () => {
            let reference;
            beforeAll((done) => {
                utils.setCatalogAnnotations(options, { "tag:isrd.isi.edu,2016:non-deletable": {} }).then(() => {
                    return options.ermRest.resolve(mainTableUri, { cid: "test" });
                }).then((ref) => {
                    reference = ref;
                    done();
                }).catch((err) => done.fail(err));
            });

            describe("Catalog that is non-deletable should return false for delete, true for all,", () => {

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
                // removed the catalog annotation
                utils.setCatalogAnnotations(options, {}).then(() => {
                    done();
                }).catch((err) => done.fail(err));
            });
        });

        describe("check permissions when schema is non-deletable,", () => {
            var reference, referenceTable2;

            beforeAll((done) => {
                options.ermRest.resolve(nonDeletableSchemaTableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    return options.ermRest.resolve(nonDeletableSchemaTable2Uri, { cid: "test" });
                }).then((response) => {
                    referenceTable2 = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
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

        });

        describe("check permissions when table is non-deletable,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(nonDeletableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
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

        });

        describe("check permissions when table visible columns list for entry/create and entry/edit is empty and undefined for other contexts,", () => {
            var reference;

            beforeAll((done) => {
                options.ermRest.resolve(emptyColumnsSchemaTableUri, { cid: "test" }).then((response) => {
                    reference = response;
                    done();
                }, (err) => {
                    console.log(err);
                    done.fail();
                });
            });

            describe("Table whose visible columns are empty for create and edit context should return false for create and update, and true for read and delete for undefined in other contexts,", () => {

                it("canCreate.", () => {
                    expect(reference.canCreate).toBe(false);
                    expect(reference.canCreateReason).toBe("All columns are disabled.");
                });

                it("canRead.", () => {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", () => {
                    expect(reference.canUpdate).toBe(false);
                    expect(reference.canUpdateReason).toBe("All columns are disabled.");
                });

                it("canDelete.", () => {
                    expect(reference.canDelete).toBe(true);
                });

            });

        });

    });
};
