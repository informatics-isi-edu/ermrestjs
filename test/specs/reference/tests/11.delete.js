exports.execute = function (options) {

    describe("deleting reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "delete_schema",
            tableName = "delete_table";

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

        it("should properly delete the referenced entity from the table.", function (done) {
            var reference,
                uri = baseUri + "/key_col=1";

            options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                reference = response;

                // need to read to have the etag
                return reference.read(1);
            }).then(function (response) {
                return reference.delete();
            }).then(function (response) {
                return reference.read(1);
            }).then(function (response) {
                expect(response._data.length).toBe(0);

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });
    });
};
