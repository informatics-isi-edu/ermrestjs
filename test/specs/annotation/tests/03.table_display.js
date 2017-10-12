exports.execute = function (options) {

    describe("2016:table-display annotation test", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "schema_table_display",
            tableName1 = "table_wo_title_wo_annotation",
            tableName2 = "table_w_title_wo_annotation",
            tableName3 = "table_w_accession_id_wo_annotation"
            tableName4 = "table_w_composite_key_wo_annotation",
            tableName5 = "table_w_table_display_annotation",
            tableName6 = "table_w_table_display_annotation_w_unformatted",
            tableName7 = "table_w_table_display_annotation_w_markdown_pattern";

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

        var table6EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName6;

        var table7EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName7;

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
                var expected = [
                    "20,001", "20,002", "20,003", "20,004", "20,005", "20,006", "20,007", "20,008", "20,009", "20,010"
                ];
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(expected[i]);
                    expect(tuple.displayname.unformatted).toBe(expected[i]);
                }
            });
        });

        describe('table entities with name/title/accession_id without table-display:row_name annotation, ', function() {
            var reference, reference2, page, page2, tuple;
            var limit = 10;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table2EntityUri, {cid: "test"}).then(function (response) {
                    reference = response;

                    expect(reference).toEqual(jasmine.any(Object));

                    options.ermRest.resolve(table3EntityUri, {cid: "test"}).then(function (response) {
                        reference2 = response;

                        expect(reference2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
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

                    reference2.read(limit).then(function (response) {
                        page2 = response;

                        expect(page2).toEqual(jasmine.any(Object));

                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });

            });

            it('tuple displayname should return title column.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(tuple.values[1]);
                    expect(tuple.displayname.unformatted).toBe(tuple.values[1]);
                }
            });

            it('tuple displayname should be able to match columns case insensitively and ignore space, underlines, and hyphens.', function () {
                var tuples = page2.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(tuple.values[1]);
                    expect(tuple.displayname.unformatted).toBe(tuple.values[1]);
                }
            });
        });

         describe('table entities without name/title nor table-display:row_name context annotation with composite key, ', function() {
            var reference, page, tuple;
            var limit = 10;

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

            it('tuple displayname should return "description:id" column.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var expected = tuple.values[1] + ":" + tuple.values[0];
                    expect(tuple.displayname.value).toBe(expected);
                    expect(tuple.displayname.unformatted).toBe(expected);
                }
            });
        });

        describe('table entities with table-display.row-name annotation, without table-display.row-name/unformatted annotation, ', function() {
            var reference, page, tuple;
            var limit = 5;

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
                    var expected = tuple.values[1] + " " + tuple.values[2];
                    expect(tuple.displayname.value).toBe("<strong>" + expected + "</strong>");
                    expect(tuple.displayname.unformatted).toBe("**" + expected + "**");
                }
            });
        });

        describe('table entities with table-display.row-name and table-display.row-name/unformatted annotation, ', function() {
            var reference, page, tuple;
            var limit = 5;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table6EntityUri, {cid: "test"}).then(function (response) {
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

            it('tuple displayname should return the defined formatted and unformatted values in annotation.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var expected = tuple.values[1] + " " + tuple.values[2];
                    expect(tuple.displayname.value).toBe("<strong>" + expected + "</strong>");
                    expect(tuple.displayname.unformatted).toBe(expected);
                }
            });
        });


        describe('table entities with table-display.row_markdown_pattern annotation', function() {
            var reference, page, tuple;
            var limit = 20;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table7EntityUri, {cid: "test"}).then(function (response) {
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

            var content = '<h2>Movie titles</h2>\n<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Hamlet</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20001" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">The Adventures of Huckleberry Finn</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20002" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">Alice in Wonderland</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20003" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">Pride and Prejudice</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20004" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">Great Expectations</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20005" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">David Copperfield</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20006" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">Emma</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20007" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">As You Like It</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20008" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">The Adventures of Tom Sawyer</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20009" ></iframe></figure><figure class="embed-block" style=""><figcaption class="embed-caption" style="">Through the Looking Glass</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20010" ></iframe></figure>';
            it('page.content should return HTML for all tuples using row_markdown_pattern and prefix_markdown and separator_markdown', function() {
                expect(page.content).toEqual(content);
            });

        });
        describe('markdown display in case of no annotation is defined', function() {
            it('when no annotation is defiend; content should appear in unordered list format.', function(done){
                var content_without_annotation_w_para = '<ul>\n<li>\n<p><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_wo_title_wo_annotation/id=20001">20,001</a></p>\n</li>\n<li>\n<p><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_wo_title_wo_annotation/id=20002">20,002</a></p>\n</li>\n</ul>\n';
                options.ermRest.resolve(table1EntityUri, {cid: "test"}).then(function (response) {
                    return response;
                }).then(function (reference){ 
                    return reference.read(2);
                }).then(function (page){
                    expect(page.content).toBe(content_without_annotation_w_para);
                    done();
                }).catch(function(err) {
                    console.log(err);
                    done.fail();
                });
                
            })
        });
    });
};
