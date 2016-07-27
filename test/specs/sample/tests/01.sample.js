exports.execute = function (options) {

    describe('For determining server, ', function () {
        var server, ermRest, catalogId, schemaName = "product";

        beforeAll(function () {
            server = options.server;
            ermRest = options.ermRest;
            catalogId = options.catalogId
        });

        // Test Cases:
        it('should introspect catalog', function(done) {
            expect(server.catalogs).toBeDefined();
            expect(server.catalogs.get).toBeDefined();
            server.catalogs.get(catalogId).then(function(response) {
                catalog = response;
                expect(catalog).toBeDefined();
                expect(catalog.schemas).toBeDefined();
                expect(catalog.schemas.get).toBeDefined();
                schema = catalog.schemas.get(schemaName);
                done();
            }, function(err) {
                console.dir(err);
                done.fail();
            });
        });

        it('Should have schema name', function () {
            expect(schema).toBeDefined();
            expect(schema.name).toBe(schemaName);
        });

        it('should have catalog id', function () {
            expect(catalog.id).toBe(catalogId);
        });
    });
}