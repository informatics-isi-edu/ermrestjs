exports.execute = function (options) {

    describe("For alternative tables,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema_altTables",
            baseTable1 = "base_table",
            altDetailedTable1 = "alt_table_detailed",
            altCompactTable1 = "alt_table_compact",
            baseTable2 = "base_table_no_app_link",
            altDetailedTable2 = "alt_table_detailed_2",
            altCompactTable2 = "alt_table_compact_2";

        var base1Uri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + baseTable1;

        var base2Uri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + baseTable2 + "/value::gt::15@sort(id)";

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
            }

            url = url + "/" + location.path;

            return url;
        };

        describe('1. for app linking with table annotation,', function() {
            var reference, reference_d, reference_c, reference_e, result;

            it('1.1 uncontextualized reference should have no app link, ', function(done) {
                options.ermRest.appLinkFn(appLinkFn);
                options.ermRest.resolve(base1Uri, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    // uncontextualized
                    expect(reference.appLink).toBe(undefined);

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.2 contextualize for detailed should return correct app link, ', function() {
                reference_d = reference.contextualize.detailed;
                result = searchURL + "/" + reference_d.location.path;
                expect(reference_d.appLink).toBe(result);
            });

            it('1.3 contextualize for compact should return correct app link, ', function() {
                reference_c = reference_d.contextualize.compact;
                result = searchURL + "/" + reference_c.location.path;
                expect(reference_c.appLink).toBe(result);
            });

            it('1.4 contextualize for entry should return correct app link, ', function() {
                reference_e = reference_c.contextualize.entry;
                result = searchURL + "/" + reference_e.location.path;
                expect(reference_e.appLink).toBe(result);
            });

        });

        describe('2. for app linking without table annotation,', function() {
            var reference, reference_d, reference_c, reference_e, result;

            it('2.1 uncontextualized reference should have no app link, ', function(done) {
                options.ermRest.appLinkFn(appLinkFn);
                options.ermRest.resolve(base2Uri, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    // uncontextualized
                    expect(reference.appLink).toBe(undefined);

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
                var result = viewerURL + "/" + reference_e.location.path;
                expect(reference_e.appLink).toBe(result);
            });

        });

    });

};
