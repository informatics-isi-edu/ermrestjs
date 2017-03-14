var nock = require("nock");

exports.execute = function (options) {

    describe("For determining reference object permissions,", function () {
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

        describe("for a user with permission to write to ERMrest,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(singleEnitityUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("should return true for ", function () {
                it("canCreate.", function () {
                    expect(reference.canCreate).toBeTruthy();
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBeTruthy();
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBeTruthy();
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBeTruthy();
                });
            });
        });

        describe("for a user without permission to write to ERMrest,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(singleEnitityUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("should return false for ", function () {
                it("canCreate.", function () {
                    expect(reference.canCreate).toBeFalsy();
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBeFalsy();
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBeFalsy();
                });
            });

            it("should return true for canRead.", function () {
                expect(reference.canRead).toBeTruthy();
            });
        });

        describe("check permissions when schema is generated,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(genSchemaTableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isGenerated).toBe(true);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("generated schema should return true for read and delete, false for all else", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });

        });

        describe("check permissions when table is generated,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(genTableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isGenerated).toBe(true);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("generated table should return true only for read and delete, false for all else", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when table columns are all generated,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(genColsUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isGenerated).toBe(false);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("generated columns should return true only for read and delete, false for all else", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when some table columns are generated,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(genColsUri_2, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isGenerated).toBe(false);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("some generated columns should return true for all", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when schema is immutable,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(immuSchemaTableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isImmutable).toBe(true);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("immutable schema should return true for create, read, and delete, false for update", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });

        });

        describe("check permissions when table is immutable,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(immuTableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isImmutable).toBe(true);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("immutable table should return true for create, read, and delete, false for update", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when table columns are all immutable,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(immuColsUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isImmutable).toBe(false);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("immutable columns should return true for create, read, and delete, false for update", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when some table columns are immutable,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(immuColsUri_2, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isImmutable).toBe(false);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("some immutable columns should return true for all", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });

            });
        });

        describe("check permissions when table is non-deletable,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(nonDeletableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isNonDeletable).toBe(true);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("Table that is non-deletable should return false for delete, true for all", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(false);
                });

            });
        });

        describe("check permissions when schema is non-deletable,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(nonDeletableSchemaTableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);
                    expect(reference._table._isNonDeletable).toBe(true);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("Table that is non-deletable should return false for delete, true for all", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(true);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(true);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(false);
                });
            });
        });

        describe("check permissions when table visible columns list for entry/create and entry/edit is empty and undefined for other contexts,", function () {
            var session, reference;
            var mockSessionObject = {
                attributes: [
                    {id: "write-tester"},
                    {id: "read-tester"}
                ]
            };

            beforeAll(function () {
                nock.disableNetConnect();
            });

            it("should mock the session and set the session on the reference.", function (done) {

                nock(options.url).get("/authn/session").reply(200, mockSessionObject);

                options.ermRest._http.get(options.url + "/authn/session").then(function (response) {
                    expect(response.data).toEqual(mockSessionObject);
                    session = response.data;

                    return options.ermRest.resolve(emptyColumnsSchemaTableUri, {cid: "test"})
                }).then(function (response) {
                    reference = response;
                    reference.session = mockSessionObject;

                    expect(reference._session).toEqual(mockSessionObject);

                    done();
                }, function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            describe("Table that is non-deletable should return false for delete, true for all", function () {

                it("canCreate.", function () {
                    expect(reference.canCreate).toBe(false);
                });

                it("canRead.", function () {
                    expect(reference.canRead).toBe(true);
                });

                it("canUpdate.", function () {
                    expect(reference.canUpdate).toBe(false);
                });

                it("canDelete.", function () {
                    expect(reference.canDelete).toBe(true);
                });
            });

        });

        afterEach(function () {
            nock.cleanAll();
        });

        afterAll(function () {
            nock.cleanAll();
            nock.enableNetConnect();
        });
    });
};
