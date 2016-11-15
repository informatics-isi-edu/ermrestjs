var nock = require("nock");

exports.execute = function (options) {

    describe("For determining reference object permissions,", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            schemaName2 = "generated_schema",
            tableName2 = "table_1",                  // table from a generated schema
            schemaName3 = "generated_table_schema",
            tableName3 = "generated_table",        // generated table
            entityId = 9000;

        var singleEnitityUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ':' + tableName + "/id=" + entityId;

        var genSchemaTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName2 + ':' + tableName2 + "/id=" + entityId;

        var genTableUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName3 + ':' + tableName3 + "/id=" + entityId;



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

            describe("generated schema should return true only for read, false for all", function () {

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
                    expect(reference.canDelete).toBe(false);
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

            describe("generated table should return true only for read, false for all", function () {

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
                    expect(reference.canDelete).toBe(false);
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
