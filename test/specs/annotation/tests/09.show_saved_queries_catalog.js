exports.execute = function (options) {

    describe("testing show_saved_query property of display annotation on catalog,", function () {

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
    });
}
