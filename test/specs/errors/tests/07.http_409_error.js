var nock = require('nock');

exports.execute = function (options) {
  
    describe("For determining HTTP 409 response message,", function () {
        var server, url, catalog,
            id = "7345274", // something very far out of range
            ops = {allowUnmocked: true};
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "error_schema",
            tableName = "main_delete_table",
            reference1;

        var duplicateErrorServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'Input data violates model. ERROR:  duplicate key value violates unique constraint "dataset_pkey" DETAIL:  Key (id)=(269) already exists.';

        var generalConflictServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site CONTEXT: PL/pgSQL function experiments.userid_update() line 25 at RAISE';

        var integrityErrorMappedMessage= "This entry cannot be deleted as it is still referenced from the <code>Association</code> table. \n All dependent entries must be removed before this item can be deleted.",
            duplicateErrorMappedMessage = "The entry cannot be created/updated. Please use a different id for this record.",
            generalConflictMappedMessage = "ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site";

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
        beforeAll(function (done) {
            server = options.server;
            catalog = options.catalog;
            url = options.url.replace('ermrest', '');

            options.ermRest.resolve(multipleEntityUri, {cid:"test"}).then(function(response) {
                reference1 = response;
                done();
            },function (err) {
                console.dir(err);
                done.fail();
            });
            server._http.max_retries = 0;
        });

        it("if it's an integrity error, we should generate a more readable message.", function (done) {
          reference1.delete().then(null, function (err) {
              expect(err.message).toBe(integrityErrorMappedMessage, "invalid error message");
              done();
          }).catch(function(err) {
              console.log(err);
              done.fail();
          });
        });

        it("if it's a duplicate key error, we should generate a more readable message.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/1235/schema")
                .reply(409, duplicateErrorServerResponse)
                .persist();

            server.catalogs.get("1235").then(null, function(err) {
                expect(err.code).toBe(409, "invalid error code");
                expect(err.message).toBe(duplicateErrorMappedMessage, "invalid error message");
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail();
            });
        });

        it("otherwise it should just show the error message without the prefix and suffix.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/1236/schema")
                .reply(409, generalConflictServerResponse)
                .persist();

            server.catalogs.get("1236").then(null, function(err) {
                expect(err.code).toBe(409, "invalid error code");
                expect(err.message).toBe(generalConflictMappedMessage, "invalid error message");
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail();
            });
        });


	    afterAll(function() {
            nock.cleanAll();
	        nock.enableNetConnect();
	    });

    });
};
