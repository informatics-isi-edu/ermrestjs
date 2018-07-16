exports.execute = function (options) {

    describe("For determining system columns in reference objects, ", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "table_with_system_columns";

        var baseUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName;

        var systemColumns = ["RID", "RCT", "RMT", "RCB", "RMB"];

        // Test Cases:
        describe("are disabled ", function () {
            var reference, createReference, output = { message: 'Automatically generated' };

            beforeAll(function (done) {
                options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("when creating a reference", function() {
                var createReference = reference.contextualize.entryCreate;

                createReference.columns.forEach(function(c) {
                    if (systemColumns.indexOf(c.name) !== -1) {
                        expect(c.inputDisabled).toEqual(output);
                    }
                });

            });

            it("when updating a reference", function() {
                var updateReference = reference.contextualize.entryEdit;
                updateReference.columns.forEach(function(c) {
                    if (systemColumns.indexOf(c.name) !== -1) {
                        expect(c.inputDisabled).toBe(true);
                    }
                });
            });
        });
    });
};
