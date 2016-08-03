var nock = require('nock');
var httpError = require('../helpers/http_error.js');

exports.execute = function (options) {

    describe('For determining Entity exceptions, ', function () {
        var server = options.server, ermRest = options.ermRest, url = options.url.replace('ermrest', ''), ops = {allowUnmocked: true}, 
        			catalog, schema, table, column catalogId = "3423423", entityId = "8000";

		httpError.setup(options);

        beforeAll(function () {
            catalog = options.catalog;
            schema = catalog.schemas.get('error_schema');
            table = schema.tables.get('valid_table_name');
            server._http.max_retries = 0;
            
            table.keys.all().forEach(function(k) {
                k.colset.columns.forEach(function(c) {
                    if (c.name == 'id') column = c;
                });
            });
        });

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
        }, "entity retreival using path", "/ermrest/catalog/" + catalogId + "/entity/a:=error_schema:valid_table_name/id=" + entityId);


        httpError.testForErrors(["400", "401", "403", "404", "409", "500", "503"], function(error, done) {
            table.entity.get(null, null, [column]).then(null, function(err) {
                expect(err instanceof ermRest[error.type]).toBeTruthy();
                done();
            }).catch(function(e) {
                console.dir(e);
                expect(false).toBe(true);
                done();
            });
        }, "entity retreival using table.entity", "/ermrest/catalog/" + catalogId + "/attribute/error_schema:valid_table_name/id");

    });
};