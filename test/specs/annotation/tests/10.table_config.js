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


    describe("testing stable key related properties of table-config annotation", function () {
        var schema, schemaName = "table_config";

        var testStableKey = function (tableName, cols) {
            expect(schema.tables.get(tableName).stableKey.map(function (col) {
                return col.name;
            })).toEqual(cols);
        }

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            done();
        });

        it ("should return the shortest key if stable_key and stable_key_columns are not defined", function () {
            testStableKey("no_annotation", ["RID"]);
        });

        it ("should ignore stable_key if it's invalid", function () {
            testStableKey("table_w_invalid_stable_key", ["RID"]);
        });

        it ("should ignore stable_key_columns if it has invalid columns", function () {
            testStableKey("table_w_invalid_stable_key_columns", ["RID"]);
        });

        it ("should ignore stable_key if it's composite.", function () {
            testStableKey("table_w_stable_key_composite", ["RID"]);
        });

        it ("should ignore stable_key_columns if it's composite.", function () {
            testStableKey("table_w_stable_key_columns_composite", ["RID"]);
        });

        it ("should ignore stable_key if it has nullable column.", function () {
            testStableKey("table_w_stable_key_nullable", ["RID"]);
        });

        it ("should ignore stable_key_columns if it has nullable column.", function () {
            testStableKey("table_w_stable_key_columns_nullable", ["RID"]);
        }); 

        it ("should honor the stable_key", function () {
            testStableKey("table_w_valid_stable_key", ["id"]);
        });

        it ("should honor the stable_key_columns", function () {
            testStableKey("table_w_valid_stable_key_columns", ["id"]);
        });

    });

};
