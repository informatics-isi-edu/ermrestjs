var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Entity Errors, ', function () {
        var ermRest, catalog, schema, table, column, catalogId = 1, entityId = "8000";

        beforeAll(function () {
            ermRest = options.ermRest
            catalog = options.catalog;
            schema = catalog.schemas.get('error_schema');
            table = schema.tables.get('valid_table_name');
            catalogId = options.catalogId;

            options.server.http.max_retries = 0;

            table.keys.all().forEach(function(k) {
                k.colset.columns.forEach(function(c) {
                    if (c.name == 'id') column = c;
                });
            });
        });

        describe("Entity POST(create) exceptions", function() {

            httpError.testForErrors(options, "POST", ["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                table.entity.post([{ "valid_column_name" : "some randome value"}], [column.name]).then(function () {
                    done.fail("the request was succesful");
                }, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    expect(err instanceof ermRest.ERMrestError).toBe(true);
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    done.fail(e);
                });
            }, "entity creation using table.entity.post", function() {
                return "/ermrest/catalog/" + catalogId + "/entity/error_schema:valid_table_name";
            });
        });

        describe("Datapath GET exceptions", function() {

            httpError.testForErrors(options, "GET", ["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                var filter = new ermRest.BinaryPredicate(table.columns.get(column.name), "=", entityId);
                var path = new ermRest.DataPath(table);
                path = path.filter(filter);
                path.entity.get().then(function () {
                    done.fail("the request was succesful");
                }, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    expect(err instanceof ermRest.ERMrestError).toBe(true);
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    done.fail(e);
                });
            }, "entity retrieval using path.entity.get", function() {
                return "/ermrest/catalog/" + catalogId + "/entity/a:=error_schema:valid_table_name/id=" + entityId;
            });

        });


        describe("Attribute GET exceptions", function() {

            httpError.testForErrors(options, "GET", ["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                table.entity.get(null, null, [column]).then(function () {
                    done.fail("the request was succesful");
                }, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    expect(err instanceof ermRest.ERMrestError).toBe(true);
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    done.fail(e);
                });
            }, "entity retrieval using table.entity.get", function() {
                return "/ermrest/catalog/" + catalogId + "/attribute/error_schema:valid_table_name/id";
            });

        });

        describe("Aggregate GET(count) exceptions", function() {

            httpError.testForErrors(options, "GET", ["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                var filter = new ermRest.BinaryPredicate(table.columns.get(column.name), "=", entityId);
                table.entity.count(filter).then(function () {
                    done.fail("the request was succesful");
                }, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    expect(err instanceof ermRest.ERMrestError).toBe(true);
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    done.fail(e);
                });
            }, "entity retrieval using table.entity.get", function() {
                return "/ermrest/catalog/" + catalogId + "/aggregate/error_schema:valid_table_name/id";
            });

        });

        describe("Entity PUT(updated) exceptions", function() {

            httpError.testForErrors(options, "PUT", ["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                table.entity.put([{ "valid_column_name" : "some randome value"}]).then(function () {
                    done.fail("the request was succesful");
                }, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    expect(err instanceof ermRest.ERMrestError).toBe(true);
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    done.fail(e);
                });
            }, "entity update using table.entity.put", function() {
                return "/ermrest/catalog/" + catalogId + "/entity/a:=error_schema:valid_table_name";
            });
        });

        describe("Entity DELETE exceptions", function() {

            httpError.testForErrors(options, "DELETE", ["400", "401", "403", "409", "500", "503"], function(error, done) {
                var filter = new ermRest.BinaryPredicate(table.columns.get(column.name), "=", entityId);
                table.entity.delete(filter).then(function () {
                    done.fail("the request was succesful");
                }, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    expect(err instanceof ermRest.ERMrestError).toBe(true);
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    done.fail(e);
                });
            }, "entity update using table.entity.delete", function() {
                return "/ermrest/catalog/" + catalogId + "/entity/a:=error_schema:valid_table_name";
            });
        });

        afterEach(function() {
            nock.cleanAll();
            nock.enableNetConnect();
        });

        afterAll(function() {
            nock.cleanAll();
            nock.enableNetConnect();
        });
    });
};
