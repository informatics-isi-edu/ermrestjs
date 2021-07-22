var utils = require('./../../../utils/utilities.js');

exports.execute = function (options) {

    describe('For determining citation annotation, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "citation_schema",
            tableName1 = "citation_w_mustache",
            tableName2 = "citation_w_handlebars",
            tableName3 = "citation_without_template_engine",
            tableName4 = "missing_required",
            tableName5 = "no_citation",
            tableName6 = "citation_w_waitfor",
            tableName7 = "citation_w_waitfor_agg";

        var mustacheCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName1 + "/@sort(id)";
        var handlebarsCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName2 + "/@sort(id)";
        var noTemplateEngineCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName3 + "/@sort(id)";
        var missingRequiredCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName4 + "/@sort(id)";
        var noCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName5 + "/@sort(id)";
        var waitForCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName6 + "/@sort(id)";
        var aggWaitForCitationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName7 + "/@sort(id)";

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

        beforeAll(function() {
            options.ermRest.appLinkFn(appLinkFn);
        });

        describe("with mustache templating,", function () {
            var tuples, tuple, reference;

            beforeAll(function (done) {
                options.ermRest.resolve(mustacheCitationUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    return response.read(3);
                }).then(function (response) {
                    tuples = response.tuples;

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("the citation object should be properly defined with a title.", function (done) {
                // tuple with title
                tuple = tuples[0];
                expect(reference.citation).not.toBe(null, "Citation is null");

                var citation = reference.citation.compute(tuple);
                expect(citation.journal).toBe("Journal of ISRD Test Data", "Journal does not match for tuple[0]");
                expect(citation.author).toBe("John Doe", "Author does not match for tuple[0]");
                expect(citation.title).toBe("The First Data Row", "Title does not match for tuple[0]");
                expect(citation.year).toBe("2018", "Year does not match for tuple[0]");
                expect(citation.url).toBe("https://dev.isrd.isi.edu/chaise/record/citation_schema:citation_w_mustache/RID=" + utils.findEntityRID(options, schemaName, "citation_w_mustache", "id", "1"), "Url does not match for tuple[0]");
                expect(citation.id).toBe("1", "Id does not match for tuple[0]");

                done();
            });

            it("the citation object should be properly defined without a title.", function (done) {
                // tuple without title
                tuple = tuples[1];
                expect(reference.citation).not.toBe(null, "Citation is null");

                var citation = reference.citation.compute(tuple);
                expect(citation.journal).toBe("Journal of ISRD Test Data", "Journal does not match for tuple[1]");
                expect(citation.author).toBe("John Doe", "Author does not match for tuple[1]");
                expect(citation.title).toBe("No title", "Title does not match for tuple[1]");
                expect(citation.year).toBe("2018", "Year does not match for tuple[1]");
                expect(citation.url).toBe("https://dev.isrd.isi.edu/chaise/record/citation_schema:citation_w_mustache/RID=" + utils.findEntityRID(options, schemaName, "citation_w_mustache", "id", "2"), "Url does not match for tuple[0]");
                expect(citation.id).toBe("2", "Id does not match for tuple[1]");

                done();
            });

            it("when a required field's template evaluates to `null`, citation should be `null`.", function (done) {
                // tuple with journal template that evaluates to null (journal value is missing)
                tuple = tuples[2];
                expect(reference.citation).not.toBe(null, "Citation is not null");
                expect(reference.citation.compute(tuple)).toBe(null, "Computed value is not null");
                done();
            });
        });

        describe("with handlebars templating,", function () {
            var tuples, tuple, reference;

            beforeAll(function (done) {
                options.ermRest.resolve(handlebarsCitationUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    return response.read(3);
                }).then(function (response) {
                    tuples = response.tuples;

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("the citation object should be properly defined with a title.", function (done) {
                // citation.year value is based on the value of RCT
                var year = options.ermRest._moment().format("YYYY");

                // tuple with title
                tuple = tuples[0];
                expect(reference.citation).not.toBe(null, "Citation is null");

                var citation = reference.citation.compute(tuple);
                expect(citation.journal).toBe("Journal of ISRD Test Data", "Journal does not match for tuple[0]");
                expect(citation.author).toBe("John Doe", "Author does not match for tuple[0]");
                expect(citation.title).toBe("The First Data Row", "Title does not match for tuple[0]");
                expect(citation.year).toBe(year, "Year does not match for tuple[0]");
                expect(citation.url).toBe("https://dev.isrd.isi.edu/chaise/record/citation_schema:citation_w_handlebars/RID=" + utils.findEntityRID(options, schemaName, "citation_w_handlebars", "id", "1"), "Url does not match for tuple[0]");
                expect(citation.id).toBe("1", "Id does not match for tuple[0]");

                done();
            });

            it("the citation object should be properly defined without a title.", function (done) {
                // citation.year value is based on the value of RCT
                var year = options.ermRest._moment().format("YYYY");

                // tuple without title
                tuple = tuples[1];
                expect(reference.citation).not.toBe(null, "Citation is null");

                var citation = reference.citation.compute(tuple);
                expect(citation.journal).toBe("Journal of ISRD Test Data", "Journal does not match for tuple[1]");
                expect(citation.author).toBe("John Doe", "Author does not match for tuple[1]");
                expect(citation.title).toBe("No title", "Title does not match for tuple[1]");
                expect(citation.year).toBe(year, "Year does not match for tuple[1]");
                expect(citation.url).toBe("https://dev.isrd.isi.edu/chaise/record/citation_schema:citation_w_handlebars/RID=" + utils.findEntityRID(options, schemaName, "citation_w_handlebars", "id", "2"), "Url does not match for tuple[1]");
                expect(citation.id).toBe("2", "Id does not match for tuple[1]");

                done();
            });

            it("when a required field's template evaluates to `null`, citation should be `null`.", function (done) {
                // tuple with journal template that evaluates to null (journal value is missing)
                tuple = tuples[2];
                expect(reference.citation).not.toBe(null, "Citation is not null");
                expect(reference.citation.compute(tuple)).toBe(null, "Computed value is not null");

                done();
            });
        });

        describe("with waitfor, ", function () {
            describe("when pseudo-columns in waitfor are not secondary (aggregate, entityset)", function () {
                var tuple, citation, reference;
                it ("reference.citation should return an object with proper attributes.", function (done) {
                    options.ermRest.resolve(waitForCitationUri, {cid: "test"}).then(function (response) {
                        // it has to be detailed so the activelist take care of waitfor in citation.
                        reference = response.contextualize.detailed;
                        return reference.read(1);
                    }).then(function (response) {
                        tuple = response.tuples[0];

                        expect(reference.citation).not.toBe(null, "citation was null");

                        citation = reference.citation;
                        expect(citation.hasWaitFor).toBe(false, "hasWaitFor missmatch");
                        expect(citation.hasWaitForAggregate).toBe(false, "hasWaitForAggregate missmatch");
                        expect(citation.waitFor.length).toBe(1, "wait-for length missmatch");
                        expect(citation.waitFor[0].sourceObject.source).toEqual([
                            {"outbound": ["citation_schema", "citation_w_waitfor_fk1"]},
                            {"outbound": ["citation_schema", "journal_fk1"]},
                            "RID"
                        ], "sourceobject missmatch");

                        done();
                    }).catch(function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it ("reference.citation.compute should work without passing any templateVariables.", function (done) {
                    var computedCitation = citation.compute(tuple);
                    // citation.year value is based on the value of RCT
                    var year = options.ermRest._moment().format("YYYY");

                    expect(computedCitation.journal).toBe("journal defined name (computer science)", "Journal missmatch");
                    expect(computedCitation.author).toBe("Record author", "Author missmatch");
                    expect(computedCitation.title).toBe("Record title", "Title missmatch");
                    expect(computedCitation.year).toBe(year, "Year missmatch");
                    expect(computedCitation.url).toBe("https://dev.isrd.isi.edu/chaise/record/citation_schema:citation_w_waitfor/RID=" + utils.findEntityRID(options, schemaName, "citation_w_waitfor", "id", "1"), "Url missmatch");
                    expect(computedCitation.id).toBe("1", "id missmatch");
                    done();
                });
            });

            describe("when pseudo-columns in waitfor are secondary (aggregate, entityset)", function () {
                var tuple, citation, reference;
                it ("reference.citation should return an object with proper attributes.", function (done) {
                    options.ermRest.resolve(aggWaitForCitationUri, {cid: "test"}).then(function (response) {
                        // it has to be detailed so the activelist take care of waitfor in citation.
                        reference = response.contextualize.detailed;
                        return reference.read(1);
                    }).then(function (response) {
                        tuple = response.tuples[0];

                        expect(reference.citation).not.toBe(null, "citation was null");

                        citation = reference.citation;
                        expect(citation.hasWaitFor).toBe(true, "hasWaitFor missmatch");
                        expect(citation.hasWaitForAggregate).toBe(true, "hasWaitForAggregate missmatch");
                        expect(citation.waitFor.length).toBe(1, "wait-for length missmatch");
                        expect(citation.waitFor[0].sourceObject.source).toEqual([
                            {"inbound": ["citation_schema", "citation_w_waitfor_agg_authors_fk2"]},
                            {"outbound": ["citation_schema", "citation_w_waitfor_agg_authors_fk1"]},
                            "RID"
                        ], "sourceobject missmatch");

                        done();
                    }).catch(function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                // testing the compute function here is pointless since we have to pass templateVariables ourselves
                // the testing for this is mainly done in chaise.
            });
        });

        it("with no templating engine, the citation object should be properly defined.", function (done) {
            var tuple, reference;

            options.ermRest.resolve(noTemplateEngineCitationUri, {cid: "test"}).then(function (response) {
                reference = response;
                return response.read(1);
            }).then(function (response) {
                tuple = response.tuples[0];
                expect(reference.citation).not.toBe(null, "Citation is null");

                // tuple with title
                var citation = reference.citation.compute(tuple);
                expect(citation.journal).toBe("Journal of ISRD Test Data", "Journal does not match");
                expect(citation.author).toBe("John Doe", "Author does not match");
                expect(citation.title).toBe("The First Data Row", "Title does not match");
                expect(citation.year).toBe("2018", "Year does not match");
                expect(citation.url).toBe("https://dev.isrd.isi.edu/id=1", "Url does not match");
                expect(citation.id).toBe("1", "Id does not match");

                done();
            }).catch(function (err) {
                console.dir(err);
                done.fail();
            });
        });

        it("with missing required field, the citation object should `null`.", function (done) {
            var tuple;

            options.ermRest.resolve(missingRequiredCitationUri, {cid: "test"}).then(function (response) {

                expect(response.citation).toBe(null, "Citation is not null");

                done();
            }).catch(function (err) {
                console.dir(err);
                done.fail();
            });
        });

        it("with no citation annotation, the citation object should `null`.", function (done) {

            options.ermRest.resolve(noCitationUri, {cid: "test"}).then(function (response) {

                expect(response.citation).toBe(null, "Citation is not null");

                done();
            }).catch(function (err) {
                console.dir(err);
                done.fail();
            });
        });
    });
};
