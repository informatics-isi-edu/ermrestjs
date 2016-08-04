exports.execute = function (options) {

    describe("2016:table-display annotation test", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "schema_table_display",
            tableName1 = "table_wo_title_wo_annotation",
            tableName2 = "table_w_title_wo_annotation",
            tableName3 = "table_w_table_display_annotation";

        var table1EntityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName1;

        var table2EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName2;

        var table3EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName3;

        describe('table entities without lable/name/title nor table-display:row_name annotation, ', function() {
            var reference, page, tuple;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table1EntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuple displayname should return empty string.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var displayname = tuple.displayname;
                    expect(displayname).toBe("");
                }
            });
        });

        describe('table entities with lable/name/title without table-display:row_name annotation, ', function() {
            var reference, page, tuple;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table2EntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuple displayname should return title column.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var displayname = tuple.displayname;
                    expect(displayname).toBe(tuple._data.title);
                }
            });
        });

        describe('table entities with table-display.row-name annotation', function() {
            var reference, page, tuple;
            var limit = 5;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table3EntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('read should return a Page object that is defined.', function(done) {
                reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('tuple displayname should return string: firstname lastname', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var displayname = tuple.displayname;
                    expect(displayname).toBe(tuple._data.firstname + " " + tuple._data.lastname);
                }
            });
        });

    });
};