exports.execute = function (options) {

    describe("For alternative tables,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference schema altTables",
            schemaNameEncoded = "reference%20schema%20altTables",
            baseTable1 = "base table",
            baseTable1Encoded = "base%20table",
            altDetailedTable1 = "alt table detailed",
            altDetailedTable1Encoded = "alt%20table%20detailed",
            altCompactTable1 = "alt table compact",
            altCompactTable1Encoded = "alt%20table%20compact",
            baseTable2 = "base table no app link",
            baseTable2Encoded = "base%20table%20no%20app%20link",
            altDetailedTable2 = "alt table detailed 2",
            altDetailedTable2Encoded = "alt%20table%20detailed%202",
            altCompactTable2 = "alt table compact 2",
            altCompactTable2Encoded = "alt%20table%20compact%202";

        var base1Uri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + baseTable1Encoded;

        var base2Uri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + baseTable2Encoded + "/value::gt::15@sort(id)";

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function(tag, location) {
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
                    url =  searchURL;
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

        describe('1. for app linking without providing appLinkFn, ', function() {
            var reference, reference_d, appLink;

            it('1.1 uncontextualized reference should return error, ', function(done) {
                delete options.ermRest._appLinkFn;
                options.ermRest.resolve(base1Uri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(function() { appLink = reference.appLink; }).toThrow("`appLinkFn` function is not defined.");
                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.2 contextualized reference should return error, ', function() {
                reference_d = reference.contextualize.detailed;
                expect(function() { appLink = reference_d.appLink; }).toThrow("`appLinkFn` function is not defined.");
            });
        });

        describe('2. for app linking with table annotation,', function() {
            var reference, reference_d, reference_c, reference_e, result;

            it('2.1 uncontextualized reference should use default app link, ', function(done) {
                options.ermRest.appLinkFn(appLinkFn);
                options.ermRest.resolve(base1Uri, {cid: "test"}).then(function (response) {
                    reference = response;

                    // uncontextualized
                    result = recordURL + "/" + reference.location.path;
                    expect(reference.appLink).toBe(result);

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.2 contextualize for detailed should return correct app link, ', function() {
                reference_d = reference.contextualize.detailed;
                result = recordURL + "/" + reference_d.location.path;
                expect(reference_d.appLink).toBe(result);
            });

            it('2.3 contextualize for compact should return correct app link, ', function() {
                reference_c = reference_d.contextualize.compact;
                result = recordsetURL + "/" + reference_c.location.path;
                expect(reference_c.appLink).toBe(result);
            });

            it('2.4 contextualize for entry should return correct app link, ', function() {
                reference_e = reference_c.contextualize.entry;
                result = recordURL + "/" + reference_e.location.path;
                expect(reference_e.appLink).toBe(result);
            });

        });

        describe('3. for app linking without table annotation,', function() {
            var reference, reference_d, reference_c, reference_e, result;

            it('3.1 uncontextualized reference should have default link, ', function(done) {
                options.ermRest.appLinkFn(appLinkFn);
                options.ermRest.resolve(base2Uri, {cid: "test"}).then(function (response) {
                    reference = response;

                    // uncontextualized
                    result = recordURL + "/" + reference.location.path;
                    expect(reference.appLink).toBe(result);

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.2 contextualize for detailed should return correct app link, ', function() {
                reference_d = reference.contextualize.detailed;
                result = recordURL + "/" + reference_d.location.path;
                expect(reference_d.appLink).toBe(result);
            });

            it('3.3 contextualize for compact should return correct app link, ', function() {
                reference_c = reference_d.contextualize.compact;
                result = recordsetURL + "/" + reference_c.location.path;
                expect(reference_c.appLink).toBe(result);
            });

            it('3.4 contextualize for entry should return correct app link, ', function() {
                reference_e = reference_c.contextualize.entry;
                var result = viewerURL + "/" + reference_e.location.path;
                expect(reference_e.appLink).toBe(result);
            });

        });



    });

};
