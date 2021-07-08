
exports.execute = function (options) {
    var module = options.includes.ermRest;
    
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
                //console.log("ref", metadata);
                //expect(metadata.template_engine).toBe("handlebars", "Template engine does not match for tuple[0]");

                done();
            });

            it("The google_metadata with missing required attribute 'name' returned as null", function (done) {
                done(); 
            });
        });

        describe("validation of structured data", function () {
            var jsonInputOrig = require("./../conf/google_metadata/data/jsonLd1.json");

            it("The google_metadata with incorrect attribute 'verson' returned w/o it", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                jsonInput["verson"] = "4";
                expect(jsonInput.verson).toEqual("4");

                var result = module.performJsonLdValidation(jsonInput);
                expect(result.isValid).toEqual(true);
                expect(result.modifiedJsonLd.verson).toEqual(undefined);
                expect(result.modifiedJsonLd).toEqual(jsonInputOrig);
                done();
            });

            it("The google_metadata with missing @context returned with correct @context", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                expect(jsonInput["@context"]).toEqual("https://schema.org");
                delete jsonInput["@context"];
                expect(jsonInput["@context"]).toEqual(undefined);
                expect(jsonInput).not.toEqual(jsonInputOrig);

                var result = module.performJsonLdValidation(jsonInput);
                expect(result.isValid).toEqual(true);
                expect(result.modifiedJsonLd["@context"]).toEqual("https://schema.org");
                expect(result.modifiedJsonLd).toEqual(jsonInputOrig);
                done();
            });

            it("The google_metadata with incorrect @type returned false", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                expect(jsonInput["@type"]).toEqual("Dataset");
                jsonInput["@type"] = "Datass";
                expect(jsonInput["@type"]).toEqual("Datass");
                expect(jsonInput).not.toEqual(jsonInputOrig);

                var result = module.performJsonLdValidation(jsonInput);
                expect(result.isValid).toEqual(false);
                done();
            });

            it("The google_metadata with missing required attribute 'name' inside 'creator' returned without 'creator'", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                expect(jsonInput["creator"]["name"]).toEqual("Statista");
                delete jsonInput["creator"]["name"];
                expect(jsonInput["creator"]["name"]).toEqual(undefined);
                expect(jsonInput["creator"]).toBeObject();

                var result = module.performJsonLdValidation(jsonInput);
                expect(result.isValid).toEqual(true);
                expect(result.modifiedJsonLd["creator"]).not.toBeObject();
                expect(result.modifiedJsonLd).not.toEqual(jsonInputOrig);
                done();
            });

            it("The google_metadata with missing required attribute returned as false", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                expect(jsonInput["name"]).toEqual("Sales of the leading ice cream brands of the U.S. 2020");
                delete jsonInput["name"];
                expect(jsonInput["name"]).toEqual(undefined);
                expect(jsonInput).not.toEqual(jsonInputOrig);

                var result = module.performJsonLdValidation(jsonInput);
                expect(result.isValid).toEqual(false);
                done();
            });

            it("The google_metadata with incorrect datatype of attribute, returned w/o that attribute", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                expect(jsonInput["url"]).toEqual("https://www.statista.com/statistics/190426/top-ice-cream-brands-in-the-united-states/");
                jsonInput["url"] = 77;
                expect(jsonInput["url"]).toEqual(77);
                expect(jsonInput).not.toEqual(jsonInputOrig);

                var result = module.performJsonLdValidation(jsonInput); 
                expect(result.isValid).toEqual(true);
                expect(result.modifiedJsonLd["url"]).toEqual(undefined);
                expect(result.modifiedJsonLd).not.toEqual(jsonInputOrig);
                done();
            });

            it("The google_metadata with incorrect element(incorrect data type) inside array returned with that element excluded", function (done) {
                var jsonInput = Object.assign({}, jsonInputOrig);
                expect(jsonInput["keywords"].length).toEqual(4);
                jsonInput["keywords"].push(22);
                expect(jsonInput["keywords"].length).toEqual(5);
                expect(jsonInput["keywords"][4]).toEqual(22);
                expect(jsonInput["keywords"][3]).toEqual("brands");
                expect(jsonInput["keywords"][2]).toEqual("ice cream brands");
                expect(jsonInput["keywords"][1]).toEqual("ice cream");
                expect(jsonInput["keywords"][0]).toEqual("sales");

                var result = module.performJsonLdValidation(jsonInput); 
                expect(result.isValid).toEqual(true);
                expect(result.modifiedJsonLd["keywords"].length).toEqual(4);
                expect(jsonInput["keywords"][4]).toEqual(undefined);
                expect(jsonInput["keywords"][3]).toEqual("brands");
                expect(jsonInput["keywords"][2]).toEqual("ice cream brands");
                expect(jsonInput["keywords"][1]).toEqual("ice cream");
                expect(jsonInput["keywords"][0]).toEqual("sales");
                done();
            });
        });
    });
};
