exports.execute = function (options) {

    describe("2016:table-display annotation test", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "schema_table_display",
            tableName1 = "table_wo_title_wo_annotation",
            tableName2 = "table_w_title_wo_annotation",
            tableName3 = "table_w_composite_key_wo_annotation",
            tableName4 = "table_w_table_display_annotation",
            tableName5 = "table_w_table_display_annotation_w_markdown_pattern";

        var table1EntityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName1;

        var table2EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName2;

        var table3EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName3;

    
        var table4EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName4;

        var table5EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName5;

        describe('table entities without name/title nor table-display:row_name context annotation, ', function() {
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

            it('reference.display should be an object that is defined and display.type is set to table', function() {
                var display = reference.display;
                expect(display).toEqual(jasmine.any(Object));
                expect(display.type).toEqual('table');
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

            it('tuple displayname should return formatted value of id as it is the unique key.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var displayname = tuple.displayname;
                    expect(displayname).toBe(tuple.values[0]);
                }
            });
        });

        describe('table entities with name/title without table-display:row_name annotation, ', function() {
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

            it('reference.display should be an object that is defined and display.type is set to table', function() {
                var display = reference.display;
                expect(display).toEqual(jasmine.any(Object));
                expect(display.type).toEqual('table');
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
                    expect(displayname).toBe(tuple.values[1]);
                }
            });
        });

         describe('table entities without name/title nor table-display:row_name context annotation with composite key, ', function() {
            var reference, page, tuple;
            var limit = 10;

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

            it('reference.display should be an object that is defined and display.type is set to table', function() {
                var display = reference.display;
                expect(display).toEqual(jasmine.any(Object));
                expect(display.type).toEqual('table');
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

            it('tuple displayname should return "description:id" column.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var displayname = tuple.displayname;
                    expect(displayname).toBe(tuple.values[1] + ":" + tuple.values[0]);
                }
            });
        });

        describe('table entities with table-display.row-name annotation', function() {
            var reference, page, tuple;
            var limit = 5;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table4EntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('reference.display should be an object that is defined and display.type is set to table', function() {
                var display = reference.display;
                expect(display).toEqual(jasmine.any(Object));
                expect(display.type).toEqual('table');
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
                    expect(displayname).toBe(tuple.values[1] + " " + tuple.values[2]);
                }
            });
        });


        describe('table entities with table-display.row_markdown_pattern annotation', function() {
            var reference, page, tuple;
            var limit = 20;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table5EntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('reference.display should be an object that is defined and display.type is set to markdown', function() {
                var display = reference.display;
                expect(display).toEqual(jasmine.any(Object));
                expect(display.type).toEqual('markdown');
            });

            var markdownPattern = ":::iframe [{{title}}](https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id={{_id}}) \n:::";
            it("reference.display._markdownPattern should be '" + markdownPattern + "' ", function() {
                expect(reference.display._markdownPattern).toEqual(markdownPattern);
            });

            it("reference.display._separator should be '\n'", function() {
                expect(reference.display._separator).toEqual('\n');
            });

            it("reference.display._prefix should be '\n'", function() {
                expect(reference.display._prefix).toEqual("## Movie titles \n\n");
            });
            
            it("reference.display._suffix should be '\n'", function() {
                expect(reference.display._suffix).toEqual("");
            });

            it("reference.display.defaultPageSize should be defined based on the annotation.", function() {
                expect(reference.display.defaultPageSize).toEqual(10);
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

            var content = '<h2>Movie titles</h2>\n<figure class="embed-block"><figcaption class="embed-caption">Hamlet</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20001" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">The Adventures of Huckleberry Finn</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20002" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">Alice’s Adventures in Wonderland</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20003" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">Pride and Prejudice</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20004" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">Great Expectations</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20005" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">David Copperfield</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20006" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">Emma</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20007" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">As You Like It</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20008" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">The Adventures of Tom Sawyer</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20009" ></iframe></figure><figure class="embed-block"><figcaption class="embed-caption">Through the Looking Glass</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20010" ></iframe></figure>'; 
            it('page.content should return HTML for all tuples using row_markdown_pattern and prefix_markdown and separator_markdown', function() {
                expect(page.content).toEqual(content);
            });

        });
    });
};