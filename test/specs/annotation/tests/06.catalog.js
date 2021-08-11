exports.execute = function (options) {

    describe('For determining catalog annotation, ', function () {

        beforeAll(function (done) {
            catalog = options.catalog;
            done();
        });

        // Test Cases:
        it("should have chaise config defined based on annotation in config.json document", function (done) {
            expect(catalog.chaiseConfig).toBeDefined("chaiseConfig undefiend");
            expect(catalog.chaiseConfig).toEqual(jasmine.any(Object), "chaise config is not an object");
            expect(catalog.chaiseConfig.navbarBrandText).toBe("override test123", "navbarBrandText is not set properly");
            expect(catalog.chaiseConfig.navbarBrandImage).toBe("../images/logo.png", "navbarBrandImage is not set properly");
            done();
        });

        it("should have show_saved_query set to true with display annotation on the catalog defined in config.json document", function (done) {
            var uri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/catalog-annotation:config-table";
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
};
