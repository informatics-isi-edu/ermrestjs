const utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

    describe('For determining catalog annotation, ', function () {

        beforeAll((done) => {
            utils.setCatalogAnnotations(options, {
                "tag:isrd.isi.edu,2019:chaise-config": {
                    "navbarBrandText": "override test123",
                    "navbarBrandImage": "../images/logo.png"
                }
            }).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });

        // Test Cases:
        it("should have chaise config defined based on annotation in config.json document", function (done) {
            const catalog = options.catalog;
            expect(catalog.chaiseConfig).toBeDefined("chaiseConfig undefiend");
            expect(catalog.chaiseConfig).toEqual(jasmine.any(Object), "chaise config is not an object");
            expect(catalog.chaiseConfig.navbarBrandText).toBe("override test123", "navbarBrandText is not set properly");
            expect(catalog.chaiseConfig.navbarBrandImage).toBe("../images/logo.png", "navbarBrandImage is not set properly");
            done();
        });

        afterAll((done) => {
            // remove the catalog annotation
            utils.setCatalogAnnotations(options, {}).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });
    });
};
