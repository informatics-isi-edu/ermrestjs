exports.execute = function (options) {

    describe("testing user_favorites property of table-config annotation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "table_config",
            tableName = "favorites_path",
            tableNameNoAnnotation = "no_annotation",
            tableNameMisconfiguredAnnotation = "favorites_null";

        var tableUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"  + tableName,
            tableNoAnnotationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"  + tableNameNoAnnotation,
            tableMisconfiguredAnnotationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"  + tableNameMisconfiguredAnnotation;

        var reference, referenceNoTableAnnotation, referenceMisconfiguredAnnotation;

        // configuration:
        //   - annotation properly defined on favorites_path
        //   - annotation not defined on favorites_no_anno
        //   - annoation defined improperly on favorites_null
        it("reference should have favoritesPath set to the favorites table defined in the table-config annotation on the table", function (done) {
            options.ermRest.resolve(tableUri, {cid: "test"}).then(function (response) {
                reference = response;
                expect(reference).toEqual(jasmine.any(Object));

                expect(reference.table.favoritesPath).toBe("/ermrest/catalog/1/entity/table_config:my_favorites", "table-config annotation not set properly on table favorites_path");

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        it("reference should have favoritesPath set to null with no table-config annotation on the table", function (done) {
            options.ermRest.resolve(tableNoAnnotationUri, {cid: "test"}).then(function (response) {
                referenceNoTableAnnotation = response;
                expect(referenceNoTableAnnotation).toEqual(jasmine.any(Object));

                expect(referenceNoTableAnnotation.table.favoritesPath).toBe(null, "default value for favoritesPath not set properly");

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        it("reference should have favoritesPath set to null when the table-config annotation is improperly defined on the table", function (done) {
            options.ermRest.resolve(tableMisconfiguredAnnotationUri, {cid: "test"}).then(function (response) {
                referenceMisconfiguredAnnotation = response;
                expect(referenceMisconfiguredAnnotation).toEqual(jasmine.any(Object));

                expect(referenceMisconfiguredAnnotation.table.favoritesPath).toBe(null, "misconfigured annotation did not set the value to the default");

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

    });

};
