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
    });
};
