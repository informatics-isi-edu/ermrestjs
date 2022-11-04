const utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

    describe("testing show_saved_query property of display annotation on catalog,", function () {

        beforeAll((done) => {
            utils.setCatalogAnnotations(options, {
                "tag:misd.isi.edu,2015:display": {
                    "show_saved_query": true
                }
            }).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });

        // NOTE: display annotation is defined in catalog.conf.json since defining `annotations` in multiple different conf.json files causes the annotations to be over-written
        it("should have show_saved_query set to true with display annotation on the catalog defined in config.json document", function (done) {
            var uri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/show_saved_queries_catalog:show_queries";
            var reference;

            options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                reference = response;

                expect(reference).toEqual(jasmine.any(Object));

                expect(reference.display.showSavedQuery).toBeTruthy("display annotation not set properly on catalog");

                done();
            }, function (err) {
                done.fail(err);
            });
        });

        afterAll((done) => {
            // remove the catalog annotation
            utils.setCatalogAnnotations(options, {}).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });
    });
}
