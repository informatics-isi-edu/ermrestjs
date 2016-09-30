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
            + schemaName + ":" + baseTable2;


        describe('1. for app linking with table annotation,', function() {
            var reference, reference_d, reference_c, reference_e;

            it('1.1 uncontextualized reference should have no app link, ', function(done) {
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
                expect(reference_d.appLink).toBe("tag:isrd.isi.edu,2016:chaise:search");
            });

            it('1.3 contextualize for compact should return correct app link, ', function() {
                reference_c = reference_d.contextualize.compact;
                expect(reference_c.appLink).toBe("tag:isrd.isi.edu,2016:chaise:search");
            });

            it('1.4 contextualize for entry should return correct app link, ', function() {
                reference_e = reference_c.contextualize.entry;
                expect(reference_e.appLink).toBe("tag:isrd.isi.edu,2016:chaise:search");
            });

        });

        describe('2. for app linking without table annotation,', function() {
            var reference, reference_d, reference_c, reference_e;

            it('2.1 uncontextualized reference should have no app link, ', function(done) {
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
                expect(reference_d.appLink).toBe("tag:isrd.isi.edu,2016:chaise:record");
            });

            it('2.3 contextualize for compact should return correct app link, ', function() {
                reference_c = reference_d.contextualize.compact;
                expect(reference_c.appLink).toBe("tag:isrd.isi.edu,2016:chaise:recordset");
            });

            it('2.4 contextualize for entry should return correct app link, ', function() {
                reference_e = reference_c.contextualize.entry;
                expect(reference_e.appLink).toBe("tag:isrd.isi.edu,2016:chaise:viewer");
            });

        });

    });

};
