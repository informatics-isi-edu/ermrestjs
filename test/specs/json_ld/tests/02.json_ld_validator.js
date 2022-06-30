
exports.execute = function (options) {
    var module = options.includes.ermRest;
    describe("validation of structured data", function () {
        it("should ignore attributes that are not part of the vocabulary", function (done) {
            var jsonInput = {"@type": "Dataset","@context": "http://schema.org","name": "dummy", 
            "description": "lorem ipsum", "verson": "4"};
            expect(jsonInput.verson).toEqual("4");

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd.verson).toEqual(undefined);
            delete jsonInput["verson"];
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });

        it("should return false if missing @context", function (done) {
            var jsonInput = {"@type": "Dataset","name": "dummy", 
            "description": "lorem ipsum"};
            expect(jsonInput["@context"]).toEqual(undefined);

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd["@context"]).toEqual("https://schema.org");
            jsonInput["@context"] = "https://schema.org";
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });

        it("should return false if incorrect @type", function (done) {
            var jsonInput = {"@type": "Datass","@context": "http://schema.org","name": "dummy", 
            "description": "lorem ipsum"};
            expect(jsonInput["@type"]).toEqual("Datass");

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(false);
            done();
        });

        it("The google_metadata with missing required attribute 'name' inside 'creator' returned without 'creator'", function (done) {
            var jsonInput = {
                "@type": "Dataset", "@context": "http://schema.org", "name": "dummy",
                "description": "lorem ipsum", "creator": {
                    "@type": "Organization",
                    "url": "https://www.statista.com",
                    "address": "los angeles",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://cdn.statcdn.com/static/img/Statista-Logo.png"
                    }
                }
            };
            expect(jsonInput["creator"]["name"]).toEqual(undefined);
            expect(jsonInput["creator"]).toBeObject();

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd["creator"]).not.toBeObject();
            delete jsonInput["creator"];
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });

        it("should return false if missing required vocabulary keyword", function (done) {
            var jsonInput = {"@type": "Dataset","@context": "http://schema.org", "description": "lorem ipsum"};
            expect(jsonInput["name"]).toEqual(undefined);

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(false);
            done();
        });

        it("should ignore attribute if datatype not followed", function (done) {
            var jsonInput = {"@type": "Dataset","@context": "http://schema.org","name": "dummy", 
            "description": "lorem ipsum", "url": 77};
            expect(jsonInput["url"]).toEqual(77);

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd["url"]).toEqual(undefined);
            delete jsonInput["url"];
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });

        it("The google_metadata with incorrect element(incorrect data type) inside array returned with that element excluded", function (done) {
            var jsonInput = {
                "@type": "Dataset", "@context": "http://schema.org", "name": "dummy",
                "description": "lorem ipsum", 
                "keywords": ["sales",
                    "ice cream",
                    "ice cream brands",
                    "brands",
                    22
                ]
            };
            expect(jsonInput["keywords"].length).toEqual(5);
            expect(jsonInput["keywords"][4]).toEqual(22);
            expect(jsonInput["keywords"][3]).toEqual("brands");
            expect(jsonInput["keywords"][2]).toEqual("ice cream brands");
            expect(jsonInput["keywords"][1]).toEqual("ice cream");
            expect(jsonInput["keywords"][0]).toEqual("sales");

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd["keywords"].length).toEqual(4);
            expect(result.modifiedJsonLd["keywords"][4]).toEqual(undefined);
            expect(result.modifiedJsonLd["keywords"][3]).toEqual("brands");
            expect(result.modifiedJsonLd["keywords"][2]).toEqual("ice cream brands");
            expect(result.modifiedJsonLd["keywords"][1]).toEqual("ice cream");
            expect(result.modifiedJsonLd["keywords"][0]).toEqual("sales");
            jsonInput["keywords"].splice(4, 1);
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });

        it("The google_metadata with incorrect element(null) inside array returned with that element excluded", function (done) {
            var jsonInput = {
                "@type": "Dataset", "@context": "http://schema.org", "name": "dummy",
                "description": "lorem ipsum", 
                "keywords": ["sales",
                    "ice cream",
                    "ice cream brands",
                    "brands",
                    null
                ]
            };
            expect(jsonInput["keywords"].length).toEqual(5);
            expect(jsonInput["keywords"][4]).toEqual(null);
            expect(jsonInput["keywords"][3]).toEqual("brands");
            expect(jsonInput["keywords"][2]).toEqual("ice cream brands");
            expect(jsonInput["keywords"][1]).toEqual("ice cream");
            expect(jsonInput["keywords"][0]).toEqual("sales");

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd["keywords"].length).toEqual(4);
            expect(result.modifiedJsonLd["keywords"][4]).toEqual(undefined);
            expect(result.modifiedJsonLd["keywords"][3]).toEqual("brands");
            expect(result.modifiedJsonLd["keywords"][2]).toEqual("ice cream brands");
            expect(result.modifiedJsonLd["keywords"][1]).toEqual("ice cream");
            expect(result.modifiedJsonLd["keywords"][0]).toEqual("sales");
            jsonInput["keywords"].splice(4, 1);
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });

        it("The google_metadata with all incorrect element(null) inside array returned without array", function (done) {
            var jsonInput = {
                "@type": "Dataset", "@context": "http://schema.org", "name": "dummy",
                "description": "lorem ipsum", 
                "keywords": [
                    null,
                    ""
                ]
            };
            expect(jsonInput["keywords"].length).toEqual(2);
            expect(jsonInput["keywords"][1]).toEqual("");
            expect(jsonInput["keywords"][0]).toEqual(null);

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(true);
            expect(result.modifiedJsonLd["keywords"]).toBeUndefined();
            delete jsonInput["keywords"];
            expect(result.modifiedJsonLd).toEqual(jsonInput);
            done();
        });
    });
};
