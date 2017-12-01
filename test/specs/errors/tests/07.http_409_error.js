var nock = require('nock');

exports.execute = function (options) {

    describe("For determining HTTP 409 response message,", function () {
        var server, url, catalog,
            id = "7345274", // something very far out of range
            ops = {allowUnmocked: true};


        var integrityErrorServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'The request conflicts with the state of the server. update or delete on table "dataset" violates foreign key constraint "dataset_human_age_dataset_id_fkey" on table "dataset_human_age" DETAIL:  Key (id)=(269) is still referenced from table "dataset_human_age".';

        var duplicateErrorServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'Input data violates model. ERROR:  duplicate key value violates unique constraint "dataset_pkey" DETAIL:  Key (id)=(269) already exists.';
        
        var generalConflictServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site CONTEXT: PL/pgSQL function experiments.userid_update() line 25 at RAISE';

        var integrityErrorMappedMessage= "This entry cannot be deleted as it is still referenced from the <code>dataset_human_age</code> table. \n All dependent entries must be removed before this item can be deleted.",
            duplicateErrorMappedMessage = "The entry cannot be created/updated. Please use a different ID for this record.",
            generalConflictMappedMessage = "ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site";

        beforeAll(function () {
            server = options.server;
            catalog = options.catalog;
            url = options.url.replace('ermrest', '');

            server._http.max_retries = 0;
        });

        it("if it's an integrity error, we should generate a more readable message.", function (done) {
            server.catalogs.get(id).then(null, function(err) {
              nock(url, ops)
                  .get("/ermrest/catalog/" + id + "/schema")
                  .reply(409, integrityErrorServerResponse);
                  expect(err.message).toBe(integrityErrorMappedMessage);
                done();
            }).catch(function() {
                expect(false).toBe(true);
                done.fail();
            });
        });

        it("if it's a duplicate key error, we should generate a more readable message.", function (done) {
            server.catalogs.get(id).then(null, function(err) {
              nock(url, ops)
                  .get("/ermrest/catalog/" + id + "/schema")
                  .reply(409, duplicateErrorServerResponse);
                expect(err.code).toBe(409);
                expect(err.message).toBe(duplicateErrorMappedMessage);
                done();
            }).catch(function() {
                expect(false).toBe(true);
                done.fail();
            });
        });

        it("otherwise it should just show the error message without the prefix and suffix.", function (done) {
            server.catalogs.get(id).then(null, function(err) {
              nock(url, ops)
                  .get("/ermrest/catalog/" + id + "/schema")
                  .reply(409, generalConflictServerResponse);
                expect(err.code).toBe(409);
                expect(err.message).toBe(generalConflictMappedMessage);
                done();
            }).catch(function() {
                expect(false).toBe(true);
                done.fail();
            });
        });


	    afterAll(function() {
            nock.cleanAll();
	        nock.enableNetConnect();
	    });

    });
};
