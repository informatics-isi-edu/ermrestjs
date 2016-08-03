var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Entity Errors, ', function () {
        var server = options.server, ermRest = options.ermRest, url = options.url.replace('ermrest', ''), ops = {allowUnmocked: true}, 
        			catalog, schema, table, column, catalogId = 1, entityId = "8000";

		httpError.setup(options);

        beforeAll(function () {
            catalog = options.catalog;
            schema = catalog.schemas.get('error_schema');
            table = schema.tables.get('valid_table_name');
            catalogId = options.catalogId;

            server._http.max_retries = 0;
            
            table.keys.all().forEach(function(k) {
                k.colset.columns.forEach(function(c) {
                    if (c.name == 'id') column = c;
                });
            });
        });

        describe("Datapath GET exceptions", function() {

            httpError.testForErrors(["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                var filter = new ermRest.BinaryPredicate(table.columns.get(column.name), "=", entityId);
                var path = new ermRest.DataPath(table);
                path = path.filter(filter);
                path.entity.get().then(null, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    expect(false).toBe(true);
                    done();
                });
            }, "entity retrieval using path.entity.get", function() {
                return "/ermrest/catalog/" + catalogId + "/entity/a:=error_schema:valid_table_name/id=" + entityId;
            });

        });

        describe("Attribute GET exceptions", function() {

            httpError.testForErrors(["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                table.entity.get(null, null, [column]).then(null, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    expect(false).toBe(true);
                    done();
                });
            }, "entity retrieval using table.entity.get", function() {
                return "/ermrest/catalog/" + catalogId + "/attribute/error_schema:valid_table_name/id";
            });

        });

        describe("Entity POST(create) exceptions", function() {

            httpError.testForErrors(["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
                table.entity.post([{ "valid_column_name" : "some randome value"}], [column.name]).then(null, function(err) {
                    expect(err instanceof ermRest[error.type]).toBeTruthy();
                    done();
                }).catch(function(e) {
                    console.dir(e);
                    expect(false).toBe(true);
                    done();
                });
            }, "entity creation using table.entity.post", function() {
                return "/ermrest/catalog/" + catalogId + "/entity/a:=error_schema:valid_table_name?defaults=" + column.name + "&cid=null";
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