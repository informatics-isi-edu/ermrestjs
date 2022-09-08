var utils = require('./../../../utils/utilities.js');

exports.execute = function (options) {

    describe("Reference display related APIs", function () {

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
            tableNameCompactOptions;

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
                    done.fail(err);
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
                    done.fail(err);
                });
            });

            it('tuple displayname and rowName should return formatted value of id as it is the unique key.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(tuple.values[0], "displayname value missmatch");
                    expect(tuple.displayname.unformatted).toBe(tuple.values[0], "displayname unformatted missmatch");
                    expect(tuple.rowName.value).toBe(tuple.values[0], "rowName value missmatch");
                    expect(tuple.rowName.unformatted).toBe(tuple.values[0], "rowName unformatted missmatch");
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
                        done.fail(err);
                    });
                }, function (err) {
                    done.fail(err);
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
                        done.fail(err);
                    });
                }, function (err) {
                    done.fail(err);
                });

            });

            it('tuple displayname and rowName should return title column.', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(tuple.values[1], "displayname value missmatch");
                    expect(tuple.displayname.unformatted).toBe(tuple.values[1], "displayname unformatted missmatch");
                    expect(tuple.rowName.value).toBe(tuple.values[1], "rowName value missmatch");
                    expect(tuple.rowName.unformatted).toBe(tuple.values[1], "rowName unformatted missmatch");
                }
            });

            it('tuple displayname/rowName should be able to match columns case insensitively and ignore space, underlines, and hyphens.', function () {
                var tuples = page2.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    expect(tuple.displayname.value).toBe(tuple.values[1], "displayname value missmatch");
                    expect(tuple.displayname.unformatted).toBe(tuple.values[1], "displayname unformatted missmatch");
                    expect(tuple.rowName.value).toBe(tuple.values[1], "rowName value missmatch");
                    expect(tuple.rowName.unformatted).toBe(tuple.values[1], "rowName unformatted missmatch");
                }
            });
        });

        describe('table entities without special columns without table-display:row_name annotation, ', function() {
            var limit = 2;

            it('tuple displayname/rowName should return the display key.', function(done) {
                options.ermRest.resolve(tableWoAnnotEntityUri, {cid: "test"}).then(function (reference) {
                    expect(reference.table.name).toBe(tableNameWoAnnot);

                    return reference.read(limit);
                }).then(function (page) {
                    var tuples = page.tuples;
                    for(var i = 0; i < limit; i++) {
                        var tuple = tuples[i];
                        expect(tuple.displayname.value).toBe(tuple.data.text_col, "displayname value missmatch for i=" + i);
                        expect(tuple.displayname.unformatted).toBe(tuple.data.text_col, "displayname unformatted missmatch for i=" + i);
                        expect(tuple.rowName.value).toBe(tuple.data.text_col, "rowName value missmatch for i=" + i);
                        expect(tuple.rowName.unformatted).toBe(tuple.data.text_col, "rowName unformatted missmatch for i=" + i);
                    }

                    done();
                }).catch(function (err) {
                    done.fail(err);
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
                    done.fail(err);
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
                    done.fail(err);
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
                    done.fail(err);
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
                    done.fail(err);
                });
            });

            it('tuple displayname/rowName should return string: firstname lastname', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    var expected = tuple.values[1] + " " + tuple.values[2];
                    expect(tuple.displayname.value).toBe("<strong>" + expected + "</strong>", "displayname value missmatch");
                    expect(tuple.displayname.unformatted).toBe("**" + expected + "**", "displayname unformatted missmatch");
                    expect(tuple.rowName.value).toBe("<strong>" + expected + "</strong>", "rowName value missmatch");
                    expect(tuple.rowName.unformatted).toBe("**" + expected + "**", "rowName unformatted missmatch");
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
                    done.fail(err);
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
                    done.fail(err);
                });
            });

            it('tuple displayname/rowName should return string: firstname lastname', function() {
                var tuples = page.tuples;
                for(var i = 0; i < limit; i++) {
                    var tuple = tuples[i];
                    // if no firstname, just show lastname without a space
                    var expected = tuple.values[1] ? (tuple.values[1] + " " + tuple.values[2]) : tuple.values[2];
                    expect(tuple.displayname.value).toBe(expected, "displayname value missmatch");
                    expect(tuple.displayname.unformatted).toBe(expected, "displayname unformatted missmatch");
                    expect(tuple.rowName.value).toBe(expected, "rowName value missmatch");
                    expect(tuple.rowName.unformatted).toBe(expected, "rowName unformatted missmatch");
                }
            });
        });

        describe('table entities with table-display.row-name/title annotation.', function () {
            var ref, limit = 5, tuples;
            beforeAll(function (done) {
                options.ermRest.resolve(table11EntityUri, {cid: "test"}).then(function (res) {
                    ref = res;
                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it('tuple displayname displayname should use the row_name/title, ', function (done) {
                ref.read(limit).then(function (page) {
                    tuples = page.tuples;
                    tuples.forEach(function (tuple) {
                        var expected = tuple.values[2];
                        expect(tuple.displayname.value).toBe("<span class=\"new-class\">" + expected + "</span>", "displayname value missmatch for tuple index="+i);
                        expect(tuple.displayname.unformatted).toBe(":span:" + expected + ":/span:{.new-class}", "displayname unformatted missmatch for tuple index="+i);
                    });
                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("tuple rowName should NOT use row_name/title", function (done) {
                tuples.forEach(function (tuple) {
                    expect(tuple.rowName.value).toBe("<strong>" + tuple.values[1] + " " + tuple.values[2] + "</strong>", "rowName value missmatch for tuple index="+i);
                    expect(tuple.rowName.unformatted).toBe("**" + tuple.values[1] + " " + tuple.values[2] + "**", "rowName unformatted missmatch for tuple index="+i);
                });
                done();
            })
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
                    done.fail(err);
                });
            });

            it('reference.display should be an object that is defined and display.type is set to markdown', function() {
                var display = reference.display;
                expect(display).toEqual(jasmine.any(Object));
                expect(display.type).toEqual('markdown');
            });

            var markdownPattern = ":::iframe [{{{$self.rowName}}}{{#$fkeys.schema_table_display.table_w_t_disp_annot_w_mp_fkey}}(with {{{rowName}}} from catalog {{{$catalog.snapshot}}}){{/$fkeys.schema_table_display.table_w_t_disp_annot_w_mp_fkey}}]({{{$self.uri.detailed}}}) \n:::";
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
                    done.fail(err);
                });
            });
            it('page.content should return HTML for all tuples using row_markdown_pattern and prefix_markdown and separator_markdown', function() {
                var rowContent = function (id, caption) {
                    var ridVal = utils.findEntityRID(options, schemaName, tableName7, "id", id);
                    var iframeURL = 'https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_w_table_display_annotation_w_markdown_pattern/RID=' + ridVal;
                    return '<figure class="embed-block -chaise-post-load">' +
                                '<div class="figcaption-wrapper" style="width: 100%;">' +
                                    '<figcaption class="embed-caption">' + caption + '</figcaption>' +
                                    '<div class="iframe-btn-container">' +
                                        '<a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="' + iframeURL + '">' +
                                            '<span class="fullscreen-icon"></span> Full screen' +
                                        '</a>' +
                                    '</div>' +
                                '</div>' +
                                '<iframe src="' + iframeURL + '"></iframe>' +
                            '</figure>';
                }
                var content = '<h2>Movie titles</h2>\n';
                content += rowContent('20001', 'Hamlet(with <strong>William Shakespeare</strong> from catalog '+catalog_id+')');
                content += rowContent('20002', 'The Adventures of Huckleberry Finn(with <strong>Mark Twain</strong> from catalog '+catalog_id+')');
                content += rowContent('20003', 'Alice in Wonderland(with <strong>Lewis Carroll</strong> from catalog '+catalog_id+')');
                content += rowContent('20004', 'Pride and Prejudice(with <strong>Jane Austen</strong> from catalog '+catalog_id+')');
                content += rowContent('20005', 'Great Expectations');
                content += rowContent('20006', 'David Copperfield');
                content += rowContent('20007', 'Emma');
                content += rowContent('20008', 'As You Like It');
                content += rowContent('20009', 'The Adventures of Tom Sawyer');
                content += rowContent('20010', 'Through the Looking Glass');

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

            // source markdown_pattern test is in related reference spec

            // page_markdown_pattern test is in related reference spec

            describe("when row_markdown_pattern or page_markdown_pattern are not defined for the context, ", function () {
                it ("should return an unordered list of clickable row-names.", function (done) {
                    var expected = '<ul>\n' +
                                   '<li><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_wo_title_wo_annotation/RID=' + utils.findEntityRID(options, schemaName, tableName1, "id", "20001") + '">20001</a></li>\n' +
                                   '<li><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_wo_title_wo_annotation/RID=' + utils.findEntityRID(options, schemaName, tableName1, "id", "20002") + '">20002</a></li>\n' +
                                   '</ul>\n';
                    testPageContent(table1EntityUri, 2, expected, done);
                });

                it ("row-names should be using the row_name/<context> context format.", function (done) {
                    var expected = '<ul>\n' +
                                   '<li><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_w_table_display_annotation_w_row_name_context/RID=' + utils.findEntityRID(options, schemaName, tableName6, "id", "10001") + '"><strong>Shakespeare</strong></a></li>\n' +
                                   '<li><a href="https://dev.isrd.isi.edu/chaise/record/schema_table_display:table_w_table_display_annotation_w_row_name_context/RID=' + utils.findEntityRID(options, schemaName, tableName6, "id", "10002") + '"><strong>Twain</strong></a></li>\n' +
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
                                  utils.findEntityRID(options, schemaName, tableName5, "id", expected[index].id) + '">' + expected[index].rowName + '</a>';
                        }
                        expect(t.displayname.value).toEqual(val, "index= " + index + ". displayname missmatch.");
                        expect(t.rowName.value).toEqual(val, "index= " + index + ". rowName missmatch.");
                    });
                    done();
                }).catch(function (err) {
                    done.fail(err);
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
                        expect(t.rowName.value).toEqual(expected[index], "index= " + index + ". rowName missmatch.");
                    });
                    done();
                }).catch(function (err) {
                    done.fail(err);
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
                        expect(t.rowName.value).toEqual(expected[index], "index= " + index + ". rowName missmatch.");
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
                    done.fail(err);
                });
            });
        });

        describe("table with compact options.", function () {
            it ('should be able to access options in annotation.', function (done) {
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    var ref = ref.contextualize.compact
                    expect(ref.display.collapseToc).toBeTruthy("Collapse ToC compact mismatch");
                    expect(ref.display.hideColumnHeaders).toBeTruthy("Hide Column Headers compact mismatch");

                    // other contexts should return false values
                    ref = ref.contextualize.detailed;
                    expect(ref.display.collapseToc).toBeFalsy("Collapse ToC detailed mismatch");
                    expect(ref.display.hideColumnHeaders).toBeFalsy("Hide Column Headers detailed mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });
        });

        describe("display.facetPanelOpen", function () {
            it ("should be set properly on references of different contexts based on the chaise defaults (defined using setClientConfig)", function (done) {
                // chaise defaults
                options.ermRest.setClientConfig({
                    facetPanelDisplay: { open: ["compact"], closed: ["compact/select"] }
                });
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    var ref = ref.contextualize.compact
                     // based on supplied default value
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact mismatch");

                    ref = ref.contextualize.detailed;
                     // not available in this context
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open detailed mismatch");

                    ref = ref.contextualize.compactSelect;
                     // based on supplied default value
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select mismatch");

                    ref = ref.contextualize.compactSelectAssociation;
                     // based on inheritence
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select association mismatch");

                    ref = ref.contextualize.compactSelectAssociationLink;
                    // based on inheritence
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select association link mismatch");

                    ref = ref.contextualize.compactSelectForeignKey;
                    // based on supplied value
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select foreign_key mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("should be set properly on references of different contexts based on the open: ['*']", function (done) {
                // chaise defaults
                options.ermRest.setClientConfig({
                    facetPanelDisplay: { open: ["*"], closed: ["compact/select/foreign_key"] }
                });
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    var ref = ref.contextualize.compact
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact mismatch");

                    ref = ref.contextualize.detailed;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open detailed mismatch");

                    ref = ref.contextualize.compactSelect;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select mismatch");

                    ref = ref.contextualize.compactSelectAssociation;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association mismatch");

                    ref = ref.contextualize.compactSelectAssociationLink;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association link mismatch");

                    ref = ref.contextualize.compactSelectForeignKey;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select foreign_key mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("should be set properly on references of different contexts based on defaults and association open", function (done) {
                // chaise defaults
                options.ermRest.setClientConfig({
                    facetPanelDisplay: { open: ["compact", "compact/select/association"], closed: ["compact/select"] }
                });
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    var ref = ref.contextualize.compact
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact mismatch");

                    ref = ref.contextualize.detailed;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open detailed mismatch");

                    ref = ref.contextualize.compactSelect;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select mismatch");

                    ref = ref.contextualize.compactSelectAssociation;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association mismatch");

                    ref = ref.contextualize.compactSelectAssociationLink;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association link mismatch");

                    ref = ref.contextualize.compactSelectForeignKey;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select foreign_key mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("should be set properly on references of different contexts based on open overriding closed", function (done) {
                // chaise defaults
                options.ermRest.setClientConfig({
                    facetPanelDisplay: { open: ["compact/select/association", "compact/select"], closed: ["compact/select"] }
                });
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    var ref = ref.contextualize.compact
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact mismatch");

                    ref = ref.contextualize.detailed;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open detailed mismatch");

                    ref = ref.contextualize.compactSelect;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select mismatch");

                    ref = ref.contextualize.compactSelectAssociation;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association mismatch");

                    ref = ref.contextualize.compactSelectAssociationLink;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association link mismatch");

                    ref = ref.contextualize.compactSelectForeignKey;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select foreign_key mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("should be set properly on references of different contexts if only one property is defined", function (done) {
                // chaise defaults
                options.ermRest.setClientConfig({
                    facetPanelDisplay: { open: ["compact/select/association"] }
                });
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    var ref = ref.contextualize.compact
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact mismatch");

                    ref = ref.contextualize.detailed;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open detailed mismatch");

                    ref = ref.contextualize.compactSelect;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select mismatch");

                    ref = ref.contextualize.compactSelectAssociation;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association mismatch");

                    ref = ref.contextualize.compactSelectAssociationLink;
                    expect(ref.display.facetPanelOpen).toBeTruthy("Facet Panel Open compact select association link mismatch");

                    ref = ref.contextualize.compactSelectForeignKey;
                    expect(ref.display.facetPanelOpen).toBeFalsy("Facet Panel Open compact select foreign_key mismatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });
        });

        describe("display.hideTotalCount", function () {
            var refWithHideRowCountAnnot, refWithoutHideRowCountAnnot;

            it ("should get it from display annotation on table", function (done) {
                options.ermRest.resolve(tableCompactOptionsEntityUri, {cid: "test"}).then(function (ref) {
                    refWithHideRowCountAnnot = ref;

                    expect(ref.contextualize.compact.display.hideRowCount).toBeFalsy("hide Row Count compact missmatch");
                    expect(ref.contextualize.compactSelect.display.hideRowCount).toBeTruthy("hide Row Count compact/select missmatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("otherwise should get it from display annotation on schema", function (done) {
                options.ermRest.resolve(table1EntityUri, {cid: "test"}).then(function (ref) {
                    refWithoutHideRowCountAnnot = ref;

                    expect(ref.contextualize.compact.display.hideRowCount).toBeTruthy("hide Row Count compact missmatch");
                    expect(ref.contextualize.compactSelect.display.hideRowCount).toBeFalsy("hide Row Count compact/select missmatch");

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("should return false if not defined for the context", function () {
                // both are not defined for detailed
                expect(refWithHideRowCountAnnot.contextualize.detailed.display.hideRowCount).toBeFalsy("missmatch for first reference");
                expect(refWithoutHideRowCountAnnot.contextualize.detailed.display.hideRowCount).toBeFalsy("missmatch for second reference");
            });
        });

    });

};
