exports.execute = function (options) {

    // don't run these test cases on travis since iobox is missing.
    // TODO need to add iobox to travis
    if (process.env.TRAVIS) {
        describe ("iobox test cases, ", function () {
            it ("should be skipped on travis.", function () {

            });
        });
        return;
    }

    describe('IOBOX Export features, ', function () {
        var schemaName = "export",
            tableName = "main",
            tableNameInvalidTemplate = "invalid_temp",
            tableNameInvalidTemplate2 = "invalid_temp2",
            tableNameNoExport = "no_export_annot",
            table, ermRest, reference, exportObj;


        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/"
            + schemaName + ":" + tableName;

        beforeAll(function (done) {
            ermRest = options.ermRest;

            ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                reference = response;

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        describe("For exporter ," , function() {

            describe("table.exportTemplates, ", function () {
                it ("should return empty array if annotation missing or invalid.", function () {
                    var t = options.catalog.schemas.get(schemaName).tables.get(tableNameInvalidTemplate);
                    expect(t.exportTemplates.length).toBe(0, "length missmatch for invalid templates");

                    t = options.catalog.schemas.get(schemaName).tables.get(tableNameNoExport);
                    expect(t.exportTemplates.length).toBe(0, "length missmatch for no annoation");
                });

                it ("should ignore invalid templates.", function () {
                    var t = options.catalog.schemas.get(schemaName).tables.get(tableNameInvalidTemplate2);
                    expect(t.exportTemplates.length).toBe(1, "length missmatch");
                    expect(t.exportTemplates[0].format_name).toEqual("valid_temp", "format_name missmatch.");
                });

                it ("should return all the templates if they are valid.", function () {
                    table = options.catalog.schemas.get(schemaName).tables.get(tableName);

                    expect(table.exportTemplates.length).toBe(3);
                    expect(reference.table.exportTemplates.length).toBe(3);
                    expect(reference.table.exportTemplates).toEqual(table.exportTemplates);
                });
            });

            describe("for BDBag template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, reference.table.exportTemplates[0]);

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[0]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe(exportObj.formatOptions.BAG.name);
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "table": "export:main",
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "export_test_bag"
                        }
                    }
                    expect(exportParams.catalog.queries.length).toBe(1);
                    expect(exportParams.catalog.queries[0].query_path).toBe("/" + output.source.api + "/M:=" + output.source.table + "?limit=none");
                    expect(exportParams.catalog.queries[0].output_path).toBe(output.destination.name);
                    expect(exportParams.catalog.queries[0].output_format).toBe(output.destination.type);
                });

                it("exporter.run should return the proper response from iobox", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/iobox/export/bdbag/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("for BDBag CSV template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, reference.table.exportTemplates[1]);

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[1]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe(exportObj.formatOptions.BAG.name);
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "table": "export:main",
                            "api": "entity"
                        },
                        "destination": {
                            "type": "csv",
                            "name": "export_test_file_csv"
                        }
                    }
                    expect(exportParams.catalog.queries.length).toBe(1);
                    expect(exportParams.catalog.queries[0].query_path).toBe("/" + output.source.api + "/M:=" + output.source.table + "?limit=none");
                    expect(exportParams.catalog.queries[0].output_path).toBe(output.destination.name);
                    expect(exportParams.catalog.queries[0].output_format).toBe(output.destination.type);
                });

                it("exporter.run should return the proper response from iobox", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/iobox/export/file/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("for BDBag JSON template", function () {
                it("should create an exporter object", function() {
                    exportObj = new ermRest.Exporter(reference, reference.table.exportTemplates[2]);

                    expect(exportObj instanceof ermRest.Exporter).toBe(true);
                    expect(exportObj.template).toEqual(reference.table.exportTemplates[2]);
                });

                it("exporter.exportParameters should return the expected object", function () {
                    var exportParams = exportObj.exportParameters;

                    expect(exportParams.bag).toBeDefined();
                    expect(exportParams.bag.bag_name).toBe(exportObj.formatOptions.BAG.name);
                    expect(exportParams.bag.bag_algorithms).toBe(exportObj.formatOptions.BAG.algs);
                    expect(exportParams.bag.bag_archiver).toBe(exportObj.formatOptions.BAG.archiver);
                    expect(exportParams.bag.bag_metadata).toBe(exportObj.formatOptions.BAG.metadata);

                    expect(exportParams.catalog).toBeDefined();
                    expect(exportParams.catalog.host).toBe(options.url.replace('/ermrest', ''));
                    expect(exportParams.catalog.catalog_id).toBe(process.env.DEFAULT_CATALOG);

                    // queries are generated from the outputs array in the export annotation
                    var output = {
                        "source": {
                            "table": "export:main",
                            "api": "entity"
                        },
                        "destination": {
                            "type": "json",
                            "name": "export_test_file_json"
                        }
                    }
                    expect(exportParams.catalog.queries.length).toBe(1);
                    expect(exportParams.catalog.queries[0].query_path).toBe("/" + output.source.api + "/M:=" + output.source.table + "?limit=none");
                    expect(exportParams.catalog.queries[0].output_path).toBe(output.destination.name);
                    expect(exportParams.catalog.queries[0].output_format).toBe(output.destination.type);
                });

                it("exporter.run should return the proper response from iobox", function (done) {
                    exportObj.run().then(function (response) {
                        expect(response.data.length).toBe(1);
                        expect(response.data[0].startsWith("https://dev.isrd.isi.edu/iobox/export/file/")).toBeTruthy();

                        done();
                    }, function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });
        });

    });
}
