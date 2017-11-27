var nock = require('nock');

exports.execute = function (options) {

    describe("For determining HTTP response objects with content type including HTML,", function () {
        var server, url, catalog,
            id = "7345274", // something very far out of range
            ops = {allowUnmocked: true};

        var htmlResponseMessage = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">'
            + '<html>'
                + '<head>'
                    + '<title>404 Not Found</title>'
                + '</head>'
                + '<body>'
                    + '<h1>Not Found</h1>'
                    + '<p>The requested URL /t.html was not found on this server.</p>'
                + '</body>'
            + '</html>';

            var htmlConflictResponseMessage = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">'
                + '<html>'
                    + '<head>'
                        + '<title>409 Conflict</title>'
                    + '</head>'
                    + '<body>'
                        + '<h1>Conflict</h1>'
                        + '<p>The request conflicts with the state of the server. update or delete on table "dataset" violates foreign key constraint "dataset_human_age_dataset_id_fkey" on table "dataset_human_age" DETAIL:  Key (id)=(269) is still referenced from table "dataset_human_age".</p>'
                    + '</body>'
                + '</html>';

            var htmlUniqueResponseMessage = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">'
                + '<html>'
                    + '<head>'
                        + '<title>409 Conflict</title>'
                    + '</head>'
                    + '<body>'
                        + '<h1>Conflict</h1>'
                        + '<p>409 Conflict The request conflicts with the state of the server. Input data violates model. ERROR:  duplicate key value violates unique constraint "dataset_pkey" DETAIL:  Key (id)=(269) already exists.</p>'
                    + '</body>'
                + '</html>';


        var terminalErrorMessage = "An unexpected error has occurred. Please report this problem to your system administrators.",
            deleteConflict = "This entry cannot be deleted as it is still referenced from the <code>Human Age\".</p></body></h</code> table. \n All dependent entries must be removed before this item can be deleted.",
            uniqueConstraint = "The entry cannot be created/updated. Please use a different ID for this record.",
            constraintErr = "Error 409 Conflict The request conflicts with the state of the server. ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site CONTEXT: PL/pgSQL function experiments.userid_update() line 25 at RAISE",
            mappedConstraintErr = "ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site",
            generalError ="Error 409 Conflict occurred. ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site. Error shou be handled";

        beforeAll(function () {
            server = options.server;
            catalog = options.catalog;
            url = options.url.replace('ermrest', '');

            server._http.max_retries = 0;
        });

        it("should be returned as a 503 error.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(404, htmlResponseMessage, {"Content-Type": "text/html"});

            server.catalogs.get(id).then(null, function(err) {
                expect(err.code).toBe(500);
                expect(err.message).toBe(terminalErrorMessage);

                done();
            }).catch(function() {
                expect(false).toBe(true);
                done();
            });
        });

        it("should be returned as a 409 error with deletion conflict.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, htmlConflictResponseMessage);

            server.catalogs.get(id).then(null, function(err) {

                expect(err.code).toBe(409);
                expect(err.message).toBe(deleteConflict);

                done();
            }).catch(function() {
                expect(false).toBe(true);
                done.fail();
            });
        });

        it("should be returned as a 409 error with unique constraint error.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, htmlUniqueResponseMessage);

            server.catalogs.get(id).then(null, function(err) {

                expect(err.code).toBe(409);
                expect(err.message).toBe(uniqueConstraint);

                done();
            }).catch(function() {
                expect(false).toBe(true);
                done.fail();
            });
        });

        it("should be returned as a 409 custom error.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, constraintErr);

            server.catalogs.get(id).then(null, function(err) {

                expect(err.code).toBe(409);
                expect(err.message).toBe(mappedConstraintErr);
                done();
            }).catch(function() {
                expect(false).toBe(true);
                done.fail();
            });
        });

        it("should be returned as a 409 general error without modification.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/" + id + "/schema?cid=null")
                .reply(409, generalError);

            server.catalogs.get(id).then(null, function(err) {

                expect(err.code).toBe(409);
                expect(err.message).toBe(generalError);
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
