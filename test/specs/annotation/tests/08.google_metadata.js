
exports.execute = function (options) {

    describe('For determining google_metadata annotation, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "google_metadata_schema",
            tableName1 = "google_metadata_w_handlebars",
            tableName2 = "google_metadata_without_template_engine";

        var handlebarsGoogleMetadataUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName1 + "/@sort(id)";
        var noTemplateEngineGoogleMetadataUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName2 + "/@sort(id)";

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function (tag, location) {
            var url;
            switch (tag) {
                case "tag:isrd.isi.edu,2016:chaise:record":
                    url = recordURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:record-two":
                    url = record2URL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:viewer":
                    url = viewerURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:search":
                    url = searchURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:recordset":
                    url = recordsetURL;
                    break;
                default:
                    url = recordURL;
                    break;
            }

            url = url + "/" + location.path;

            return url;
        };

        beforeAll(function () {
            options.ermRest.appLinkFn(appLinkFn);
        });

        describe("with handlebar templating", function () {
            var tuples, tuple, reference;

            beforeAll(function (done) {
                options.ermRest.resolve(handlebarsGoogleMetadataUri, { cid: "test" }).then(function (response) {
                    reference = response;
                    //console.log("ref1 " , reference);
                    return response.read(3);
                }).then(function (response) {
                    tuples = response.tuples;
                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("The google_metadata with all required attributes is successfully generated from the annotation", function (done) {
                tuple = tuples[0];
                var metadata = reference.googleDatasetMetadata.compute(tuple);
                expect(metadata.template_engine).toBe("handlebars", "Template engine does not match for tuple[0]");
                // expect(google_metadata.id).toBe("1", "Id does not match for tuple[0]");

                done();
            });

            it("The google_metadata with missing required attribute 'name' returned as null", function (done) {
                done(); 
            });
        });

        describe("validation of structured data", function () {

            it("The google_metadata with incorrect attribute 'verson' returned w/o it", function (done) {
                done();
            });

            it("The google_metadata with missing @context returned with correct @context", function (done) {
                done();
            });

            it("The google_metadata with missing required attribute 'name' inside 'creator' returned without 'creator'", function (done) {
                done();
            });

            it("The google_metadata with incorrect top level @type returned as null", function (done) {
                done();
            });

            it("The google_metadata with incorrect datatype of attribute, returned w/o that attribute", function (done) {
                done();
            });

            it("The google_metadata with incorrect element(incorrect data type) inside array returned with that element excluded", function (done) {
                done();
            });
        });
    });
};
