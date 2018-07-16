exports.execute = function (options) {

    describe('For determining server, ', function () {
        var server, ermRest, catalogId, schemaName = "product";

        beforeAll(function () {
            server = options.server;
            ermRest = options.ermRest;
            catalogId = options.catalogId;
        });

        // Test Cases:
        it('should introspect catalog', function(done) {
            expect(server.catalogs).toBeDefined("catalogs is not defined.");
            expect(server.catalogs.get).toBeDefined("catalogs get function is not defined.");
            server.catalogs.get(catalogId).then(function(response) {
                catalog = response;
                expect(catalog).toBeDefined("catalog is not defined.");
                expect(catalog.schemas).toBeDefined("schemas is not defined.");
                expect(catalog.schemas.get).toBeDefined("schemas get function is not defined.");
                schema = catalog.schemas.get(schemaName);
                done();
            }, function(err) {
                console.dir(err);
                done.fail();
            });
        });

        it('Should have schema name', function () {
            expect(schema).toBeDefined("schema is not defined");
            expect(schema.name).toBe(schemaName, "schema name missmatch");
        });

        it('should have catalog id', function () {
            expect(catalog.id).toBe(catalogId);
        });

        it("should test custom matcher toHaveSameItems", function() {
            // second argument to the toHaveSameItems function takes a boolean value
            // It determines ignore sorting or not, default is false
            expect([1,2,3]).toHaveSameItems([1,3,2], true);
            expect([1,2,3]).toHaveSameItems([1,2,3]);
            expect([schema,catalogId, schemaName, server]).toHaveSameItems([ schema, catalogId, server, schemaName], true);
        });
    });
}
