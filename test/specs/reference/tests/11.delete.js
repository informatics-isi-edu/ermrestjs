exports.execute = function (options) {

    describe("deleting reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "delete_schema",
            tableName = "delete_table",
            reference;

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

        describe('when deleting regularly', function() {
            beforeAll(function (done) {
                var uri = baseUri + "/key_col=1";
                var tuples;
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference = response;
                    done();
                }).catch(function (error) {
                    console.dir();
                    done.fail();
                });
            });

            it("should properly delete the referenced entity from the table.", function (done) {
                // need to read to have the etag
                reference.read(1).then(function (response) {
                    tuples = response.tuples;
                    return reference.delete(tuples);
                }).then(function (response) {
                    // response should be empty
                    expect(response).not.toBeDefined();

                    return reference.read(1);
                }).then(function (response) {
                    // Reading an object that doesn't exist should return no data
                    expect(response._data.length).toBe(0);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            // entity with key_col = 1 deleted previously
            it("should return a positive error code when trying to delete an already deleted entity.", function (done) {
                reference.delete(tuples).then(function (response) {
                    // response should be a positive status code triggering the success calback
                    // response object should be undefined
                    expect(response).not.toBeDefined();

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });
    });
};
