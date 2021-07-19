
exports.execute = function (options) {
    var module = options.includes.ermRest;
    
    describe('For determining google_metadata annotation, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "google_metadata_schema",
            tableName1 = "google_metadata_w_handlebars";

        var handlebarsGoogleMetadataUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName1 + "/@sort(id)";

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
                    reference = response.contextualize.detailed;
                    return response.read(2);
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
                expect(metadata).toBeObject();
                expect(JSON.stringify(metadata)).toBeJsonString(JSON.stringify(require("../resources/generated_json_ld.json")));
                expect(metadata.url).toEqual("https://dev.isrd.isi.edu/chaise/record/google_metadata_schema:google_metadata_w_handlebars/RID=1PM");
                done();
            });

            it("The google_metadata with missing required attribute 'description' returned as null", function (done) {
                tuple = tuples[1];
                var metadata = reference.googleDatasetMetadata.compute(tuple);
                expect(metadata).toBeNull();
                done();
            });
        });
    });
};
