
exports.execute = function (options) {
    var module = options.includes.ermRest;
    describe("validation of structured data", function () {
        var jsonInputOrig = require("./../resources/input-json-ld.json");

        it("The google_metadata with incorrect attribute 'verson' returned w/o it", function (done) {
            var jsonInput = Object.assign({}, jsonInputOrig);
            jsonInput["verson"] = "4";
            expect(jsonInput.verson).toEqual("4");

            var result = module.validateJSONLD(jsonInput);
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

            var result = module.validateJSONLD(jsonInput);
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

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(false);
            done();
        });

        it("The google_metadata with missing required attribute 'name' inside 'creator' returned without 'creator'", function (done) {
            var jsonInput = Object.assign({}, jsonInputOrig);
            expect(jsonInput["creator"]["name"]).toEqual("Statista");
            delete jsonInput["creator"]["name"];
            expect(jsonInput["creator"]["name"]).toEqual(undefined);
            expect(jsonInput["creator"]).toBeObject();

            var result = module.validateJSONLD(jsonInput);
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

            var result = module.validateJSONLD(jsonInput);
            expect(result.isValid).toEqual(false);
            done();
        });

        it("The google_metadata with incorrect datatype of attribute, returned w/o that attribute", function (done) {
            var jsonInput = Object.assign({}, jsonInputOrig);
            expect(jsonInput["url"]).toEqual("https://www.statista.com/statistics/190426/top-ice-cream-brands-in-the-united-states/");
            jsonInput["url"] = 77;
            expect(jsonInput["url"]).toEqual(77);
            expect(jsonInput).not.toEqual(jsonInputOrig);

            var result = module.validateJSONLD(jsonInput);
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

            var result = module.validateJSONLD(jsonInput);
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
};
