/**
 * To test the functionality of Client object in js/ermrest.js
 * Created by shuai on 3/1/16.
 */

var url = "https://dev.isrd.isi.edu/ermrest",
    authCookie = 'ermrest=C6KFIQn2JS37CGovofWnjKfu;';

var ermrestUtils = require("ermrest-data-utils");

var ermRest = require(process.env.PWD + "/build/ermrest.js");
ermRest.setUserCookie(authCookie);

describe('In ERMrest,', function () {
    var catalog_id = 1, schema, catalog;
    var server = ermRest.ermrestFactory.getServer(url);

    beforeAll(function (done) {
        server.catalogs.get(1).then(function(response) {
            catalog = response;
            schema = catalog.schemas.get('legacy');
            done();
        }, function(err) {
            console.dir(err);
        });
    });

    it('Should have schema name as legacy', function (done) {
        console.log("in test");
        expect(schema).toBeDefined();
        done();
    });


    it('should have catalog id as ' + catalog_id, function (done) {
        expect(catalog.id).toBe(catalog_id);
        done();
    });
});
