exports.execute = function (options) {

    describe("2016:table-display annotation test", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "schema_table_display",
            tableName1 = "table_wo_title_wo_annotation",
            tableName2 = "table_w_title_wo_annotation",
            tableName3 = "table_w_accession_id_wo_annotation",
            tableName4 = "table_w_composite_key_wo_annotation",
            tableName5 = "table_w_table_display_annotation",
            tableName5b = "table_w_table_display_annotation_handlebars",
            tableName6 = 'table_w_table_display_annotation_w_row_name_context',
            tableName7 = "table_w_table_display_annotation_w_markdown_pattern",
            tableName8 = "table_w_rowname_fkeys1",
            tableName9 = "table_w_rowname_fkeys2",
            tableName10 = "table_w_rowname_fkeys3",
            tableName11 = "table_w_table_display_annotation_w_title",
            tableNameWoAnnot = "table_wo_annotation",
            tableNameCatalogAnnot = "table_w_rowname_catalog_snapshot",
            tableNameCompactOptions = "table_w_compact_options";

        var table1EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName1 + "/@sort(id)";

        var table2EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName2;

        var table3EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName3;

        var table4EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName4;


        var table5EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName5 + "/@sort(id)";

        var table5bEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName5b + "/@sort(id)";

        var table6EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName6 + "/@sort(id)";

        var table7EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName7 + "/@sort(id)";

        var table8EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName8 + "/@sort(id)";

        var table9EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName9 + "/@sort(id)";

        var table10EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName10 + "/@sort(id)";

        var table11EntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableName11 + "/@sort(id)";

        var tableWoAnnotEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableNameWoAnnot;

        var tableCatalogAnnotEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableNameCatalogAnnot;

        var tableCompactOptionsEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" +
            tableNameCatalogAnnot;

        var findRID = function (tableName, id) {
            return options.entities[schemaName][tableName].filter(function (e) {
                return e.id == id;
            })[0].RID;
        };

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
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(tuple.values[0]);
                    expect(tuple.displayname.unformatted).toBe(tuple.values[0]);
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

        describe('table entities without special columns without table-display:row_name annotation, ', function() {
            var limit = 2;

            it('tuple displayname should return the display key.', function(done) {
                options.ermRest.resolve(tableWoAnnotEntityUri, {cid: "test"}).then(function (reference) {
                    expect(reference.table.name).toBe(tableNameWoAnnot);

                    return reference.read(limit);
                }).then(function (page) {
                    var tuples = page.tuples;
                    for(var i = 0; i < limit; i++) {
                        var tuple = tuples[i];
                        expect(tuple.displayname.value).toBe(tuple.data.text_col, "value missmatch for i=" + i);
                        expect(tuple.displayname.unformatted).toBe(tuple.data.text_col, "unformatted missmatch for i=" + i);
                    }

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
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

        describe('table entities with table-display.row-name (handlebars) annotation, without table-display.row-name/unformatted annotation, ', function() {
            var reference, page, tuple;
            var limit = 5;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table5bEntityUri, {cid: "test"}).then(function (response) {
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
                    // if no firstname, just show lastname without a space
                    var expected = tuple.values[1] ? (tuple.values[1] + " " + tuple.values[2]) : tuple.values[2];
                    expect(tuple.displayname.value).toBe(expected);
                    expect(tuple.displayname.unformatted).toBe(expected);
                }
            });
        });

        describe('table entities with table-display.row-name/title annotation.', function () {
            var ref, limit = 5;
            beforeAll(function (done) {
                options.ermRest.resolve(table11EntityUri, {cid: "test"}).then(function (res) {
                    ref = res;
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            describe('tuple displayname, ', function () {
                it ("should use the row_name/title for getting the rowname.", function(done) {
                    ref.read(limit).then(function (page) {
                        for(var i = 0; i < limit; i++) {
                            var tuple = page.tuples[i];
                            var expected = tuple.values[2];
                            expect(tuple.displayname.value).toBe("<span class=\"new-class\">" + expected + "</span>", "value missmatch for tuple index="+i);
                            expect(tuple.displayname.unformatted).toBe(":span:" + expected + ":/span:{.new-class}", "unformatted missmatch for tuple index="+i);
                        }
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });
        });

        describe('table entities with table-display.row_markdown_pattern annotation', function() {
            var reference, page, tuple;
            var limit = 20;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(table7EntityUri, {cid: "test"}).then(function (response) {
                    reference = response.contextualize.detailed;

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

            var markdownPattern = ":::iframe [{{title}}{{#$fkeys.schema_table_display.table_w_t_disp_annot_w_mp_fkey}}(with {{{rowName}}} from catalog {{{$catalog.snapshot}}}){{/$fkeys.schema_table_display.table_w_t_disp_annot_w_mp_fkey}}](https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id={{_id}}) \n:::";
            it("reference.display._rowMarkdownPattern should be '" + markdownPattern + "' ", function() {
                expect(reference.display._rowMarkdownPattern).toEqual(markdownPattern);
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

            var content = '<h2>Movie titles</h2>\n' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Hamlet(with <strong>William Shakespeare</strong> from catalog '+catalog_id+')</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20001" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">The Adventures of Huckleberry Finn(with <strong>Mark Twain</strong> from catalog '+catalog_id+')</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20002" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Alice in Wonderland(with <strong>Lewis Carroll</strong> from catalog '+catalog_id+')</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20003" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Pride and Prejudice(with <strong>Jane Austen</strong> from catalog '+catalog_id+')</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20004" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Great Expectations</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20005" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">David Copperfield</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20006" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Emma</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20007" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">As You Like It</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20008" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">The Adventures of Tom Sawyer</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20009" ></iframe></figure>' +
            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Through the Looking Glass</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/record-two/1/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/id=20010" ></iframe></figure>';
            it('page.content should return HTML for all tuples using row_markdown_pattern and prefix_markdown and separator_markdown', function() {
                expect(page.content).toEqual(content);
            });

        });

        describe('Page.content', function() {
            var testPageContent = function (uri, limit, expected, done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (reference) {
                    return reference.contextualize.compact.read(2);
                }).then(function (page){
                    expect(page.content).toBe(expected);
                    done();
                }).catch(function(err) {
                    done.fail(err);
                });
            };

            // row_markdown_pattern test is in the previous describe

            // page_markdown_pattern test is in related reference spec

            describe("when row_markdown_pattern or page_markdown_pattern are not defined for the context, ", function () {
                it ("should return an unordered list of clickable row-names.", function (done) {
                    var expected = '<ul>\n' +
                                   '<li>\n<p><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_wo_title_wo_annotation/RID=' + findRID(tableName1, "20001") + '">20001</a></p>\n</li>\n' +
                                   '<li>\n<p><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_wo_title_wo_annotation/RID=' + findRID(tableName1, "20002") + '">20002</a></p>\n</li>\n' +
                                   '</ul>\n';
                    testPageContent(table1EntityUri, 2, expected, done);
                });

                it ("row-names should be using the row_name/<context> context format.", function (done) {
                    var expected = '<ul>\n' +
                                   '<li>\n<p><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_w_table_display_annotation_w_row_name_context/RID=' + findRID(tableName6, "10001") + '"><strong>Shakespeare</strong></a></p>\n</li>\n' +
                                   '<li>\n<p><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_w_table_display_annotation_w_row_name_context/RID=' + findRID(tableName6, "10002") + '"><strong>Twain</strong></a></p>\n</li>\n' +
                                   '</ul>\n';
                    testPageContent(table6EntityUri, 2, expected, done);
                });
            });
        });

        describe("table entities with $fkeys in their row_markdown_pattern.", function () {
            it ('should be able to access row-name and detailed uri of outbound foreign keys in annotation.', function (done) {
                options.ermRest.resolve(table8EntityUri, {cid: "test"}).then(function (ref) {
                    return ref.read(5);
                }).then(function (page) {
                    var expected = [
                        {id: 10001, rowName: "<strong>William Shakespeare</strong>"},
                        {id: 10002, rowName: "<strong>Mark Twain</strong>"},
                        {id: 10003, rowName: "<strong>Lewis Carroll</strong>"},
                        {id: 10004, rowName: "<strong>Jane Austen</strong>"},
                        {id: 10005, rowName: "<strong>Charles Dickens</strong>"},
                        ""
                    ];

                    var val;
                    page.tuples.forEach(function (t, index) {
                        if (typeof expected[i] === "string") {
                            val = expected[i];
                        } else {
                            val = '<a href="' + recordURL + '/schema_table_display:table_w_table_display_annotation/RID=' +
                                  findRID(tableName5, expected[index].id) + '">' + expected[index].rowName + '</a>';
                        }
                        expect(t.displayname.value).toEqual(val, "index= " + index + ". displayname missmatch.");
                    });
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            it ("should be able to access referred table unformatted and formatted data in annotation.", function (done) {
                options.ermRest.resolve(table9EntityUri, {cid: "test"}).then(function (ref) {
                    return ref.read(5);
                }).then(function (page) {
                    var expected = [
                        "10001: 10001",
                        "10002: 10002",
                        "10003: 10003",
                        "10004: 10004",
                        "10005: 10005",
                        ""
                    ];
                    page.tuples.forEach(function (t, index) {
                        expect(t.displayname.value).toEqual(expected[index], "index= " + index + ". displayname missmatch.");
                    });
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            it ("should be able to access columns with `.` in their names.", function (done) {
                options.ermRest.resolve(table10EntityUri, {cid: "test"}).then(function (ref) {
                    return ref.read(5);
                }).then(function (page) {
                    var expected = [
                        "20001: 20001",
                        "20002: 20002",
                        "20003: 20003",
                        "20004: 20004",
                        "20005: 20005",
                        ""
                    ];
                    page.tuples.forEach(function (t, index) {
                        expect(t.displayname.value).toEqual(expected[index], "index= " + index + ". displayname missmatch.");
                    });
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });
        });

        describe("table entities with $catalog in their row_markdown_pattern.", function () {
            it ('should be able to access row-name in annotation.', function (done) {
                options.ermRest.resolve(tableCatalogAnnotEntityUri, {cid: "test"}).then(function (ref) {
                    return ref.read(1);
                }).then(function (page) {
                    var expected = "catalog_snapshot:" + catalog_id + ", catalog_id:" + catalog_id;

                    expect(page.tuples[0].displayname.value).toEqual(expected, "catalog snapshot displayname mismatch.");
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });
        });

        describe("table with compact options.", function () {
            it ('should be able to access options in annotation.', function (done) {
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {

                    expect(ref.display.collapseToc).toBeTruthy("Collapse ToC option is not defined");
                    expect(ref.display.hideColumnHeaders).toBeTruthy("Hide Column Headers option is not defined");
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });
        });
    });
};
