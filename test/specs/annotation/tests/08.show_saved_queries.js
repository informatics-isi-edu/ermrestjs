exports.execute = function (options) {

    describe("testing show_saved_query property of display annotation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "show_saved_queries",
            tableName = "hide_queries",
            tableNameNoAnnotation = "show_queries";

        var tableUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"  + tableName,
            tableNoAnnotationUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"  + tableNameNoAnnotation;

        var reference, referenceNoTableAnnotation;

        // configuration:
        //   - annotation to false on schema
        //   - one table has annotation but true
        it("should have show_saved_query set to true with display annotation on the table (overrides schema annotation set to false)", function (done) {
            options.ermRest.resolve(tableUri, {cid: "test"}).then(function (response) {
                reference = response;
                expect(reference).toEqual(jasmine.any(Object));

                expect(reference.display.showSavedQuery).toBeTruthy("display annotation not set properly on table hide_queries");

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        it("should have show_saved_query set to false with display annotation on the schema (overrides catalog annotation set to true)", function (done) {
            options.ermRest.resolve(tableNoAnnotationUri, {cid: "test"}).then(function (response) {
                referenceNoTableAnnotation = response;
                expect(referenceNoTableAnnotation).toEqual(jasmine.any(Object));

                expect(referenceNoTableAnnotation.display.showSavedQuery).toBeFalsy("display annotation not set properly on schema show_saved_queries");

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

    });

};
