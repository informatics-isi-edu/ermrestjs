/**
 * The structure of table and contexts used:
 * main -> f1 -> f2
 * - detailed context visible columns:
 * 0: id (none pseudo)
 * 1: col
 * 2: id (entity mode) - uAu3dAKI_aHyAYkDdaYMjw
 * 3: main_fk1 (entity mode) - xRrChcQgxGIr0CNyYQtQ0Q
 * 4: main_fk1 - o7Gpk7dRlnzNv3_JjhqDIg
 * 5: main_fk1 -> outbound_1_fk1 (entity mode) - CaEhWBd7gSjuYCLun-8D-A
 * 6: main_fk1 -> outbound_1_fk1 - 1EC_6-rbhKc3tIjczjq1fQ
 * 7: inbound_1_fk1 (entity mode) - GUABhSm2h_kaHHPGkzYWeA
 * 8: association (entity mode) - gNTPCP0bGB0GRwFKEATipw
 * 9: association -> inbound_2_fk1 (entity mode) - nGwW9Kpx5sLf8cpX-24WNQ
 * 10: main -> association (entity mode) - 0utuimdZvz8kTU4GI7tzWw (to check users can ignore p&b logic)
 *
 * - related entities:
 * 0: inbound_3_outbound_1_fk1 (length 1)
 * 1: inbound_3 association
 * 1: inbound_3_outbound_1 (association -> fk)
 */


exports.execute = function (options) {
    describe('PseudoColumn, ', function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "pseudo_column_schema",
            tableName = "main",
            invalidAnnotTableName = "table_w_invalid_pseudo_cols",
            entityId = "01",
            entryContext = "entry",
            detailedContext = "detailed";

        var mainEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "@sort(id)";

        var invalidEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + invalidAnnotTableName + "/id=01";

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

        var detailedExpectedValue = [
            '01', '<p>01: col val 01</p>\n',
            '<a href="https://dev.isrd.isi.edu/chaise/record/pseudo_column_schema:main/id=01">01</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/pseudo_column_schema:outbound_1/id=01">01</a>',
            '<p>01: 10</p>\n', '<a href="https://dev.isrd.isi.edu/chaise/record/pseudo_column_schema:outbound_1_outbound_1/id=01">01</a>',
            '01', '', '', '', ''
        ];

        var detailedExpectedNames = [
            'id', 'col', 'uAu3dAKI_aHyAYkDdaYMjw', 'xRrChcQgxGIr0CNyYQtQ0Q',
            'o7Gpk7dRlnzNv3_JjhqDIg', 'CaEhWBd7gSjuYCLun-8D-A', '1EC_6-rbhKc3tIjczjq1fQ',
            'GUABhSm2h_kaHHPGkzYWeA', 'gNTPCP0bGB0GRwFKEATipw', 'nGwW9Kpx5sLf8cpX-24WNQ',
            "0utuimdZvz8kTU4GI7tzWw"
        ];

        var mainRef, mainRefDetailed, invalidRef, detailedCols, detailedColsWTuple, mainTuple;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(mainEntityUri, {cid: "test"}).then(function (response) {
                mainRef = response;
                mainRefDetailed = response.contextualize.detailed;
                detailedCols = mainRefDetailed.columns;
                return options.ermRest.resolve(invalidEntityUri, {cid: "test"});
            }).then(function (response) {
                invalidRef = response;
                done();
            }).catch(function (err){
                console.dir(err);
                done.fail();
            });
        });

        describe("columns list, ", function () {
            it ("should ignore column objects in entry mode.", function () {
                checkReferenceColumns([{
                    "ref": mainRef.contextualize.entry,
                    "expected": []
                }]);
            });

            it ("should ignore the invalid column objects.", function () {
                checkReferenceColumns([{
                    "ref": invalidRef.contextualize.detailed,
                    "expected": []
                }]);
            });

            it ("should avoid duplicates (based on source, and entity).", function () {
                checkReferenceColumns([{
                    "ref": invalidRef.contextualize.compactSelect,
                    "expected": [
                        "col",
                        "id",
                        [{"outbound": ["pseudo_column_schema", "table_w_invalid_pseudo_cols_fk1"]}, "id"],
                        [{"outbound": ["pseudo_column_schema", "table_w_invalid_pseudo_cols_fk1"]}, "id"] // entity false
                    ]
                }]);
            });

            it ("should ignore the column objects that the generated hash is one of table's columns.", function () {
                checkReferenceColumns([{
                    "ref": invalidRef.contextualize.compactBrief,
                    "expected": []
                }]);
            });

            it ("should ignore the column objects that their equivalent Column, Key, ForeignKey, or InboundforeignKey exists.", function () {
                checkReferenceColumns([{
                    "ref": mainRef.contextualize.compactSelect,
                    "expected": [
                        "col",
                        "id",
                        ["pseudo_column_schema", "main_key1"].join("_"),
                        ["pseudo_column_schema", "main_fk1"].join("_"),
                        ["pseudo_column_schema", "main_inbound_2_association_fk1"].join("_"),
                        ["pseudo_column_schema", "inbound_1_fk1"].join("_")
                    ]
                }, {
                    "ref": mainRef.contextualize.compactBrief,
                    "expected": [
                        "col",
                        "id", // this is the normal column
                        "id", // this is the path column
                        [
                            {"outbound": ["pseudo_column_schema", "main_fk1"]},
                            "id"
                        ],
                        [
                            {"inbound": ["pseudo_column_schema", "inbound_1_fk1"]},
                            "id"
                        ],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_2_association_fk2"]},
                            "id"
                        ]
                    ]
                }]);
            });

            it ("should create the correct columns for valid list of sources.", function () {
                checkReferenceColumns([{
                    "ref": mainRefDetailed,
                    "expected": [
                        "id", "col", "id", // the key
                        [{"outbound": ["pseudo_column_schema", "main_fk1"]}, "id"],
                        [{"outbound": ["pseudo_column_schema", "main_fk1"]}, "id"],
                        [
                            {"outbound": ["pseudo_column_schema", "main_fk1"]},
                            {"outbound": ["pseudo_column_schema", "outbound_1_fk1"]},
                            "id"
                        ],
                        [
                            {"outbound": ["pseudo_column_schema", "main_fk1"]},
                            {"outbound": ["pseudo_column_schema", "outbound_1_fk1"]},
                            "id"
                        ],
                        [{"inbound": ["pseudo_column_schema", "inbound_1_fk1"]}, "id"],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_2_association_fk2"]},
                            "id"
                        ],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_2_association_fk2"]},
                            {"outbound": ["pseudo_column_schema", "inbound_2_fk1"]},
                            "id",
                        ],
                        [{"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]}, "id"]
                    ]
                }]);
            });
        });

        describe("integration with other APIs, ", function () {
            describe ("reading a reference with path columns, ", function () {
                it("read should handle path columns.", function (done) {
                    mainRefDetailed.read(1).then(function (page) {
                        mainTuple = page.tuples[0];
                        expect(page.tuples[0].values).toEqual(detailedExpectedValue);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                describe("sort and paging, ", function () {
                    describe("for one-to-one pseudoColumns, ", function () {
                        it ("sort in entity mode should apply the same logic as ForeignKeyPseudoColumn (use row-order if available).", function (done) {
                            // pseudo_column_schema_main_fk1
                            checkSort(mainRefDetailed, [{"column": detailedExpectedNames[3],"descending": false}], "10", done);
                        });

                        it ("otherwise should not sort based on row-order.", function (done) {
                            // pseudo_column_schema_main_fk1 with entity:false
                            checkSort(mainRefDetailed, [{"column": detailedExpectedNames[4],"descending": false}], "01", done);
                        });

                        var nextPage;
                        it ("next should be able to handle sorting based on pathColumns.", function (done) {
                            mainRefDetailed.sort([{"column": detailedExpectedNames[4],"descending": false}]).read(1).then(function (res) {
                                return res.next.read(1);
                            }).then(function (res) {
                                nextPage = res;
                                expect(res.tuples[0].values[0]).toEqual("10");
                                done();
                            }).catch(function (err) {
                                console.log(err);
                                done.fail();
                            });
                        });

                        it ("previous should be able to handle sorting based on pathColumns.", function (done) {
                            nextPage.previous.read(1).then(function (res) {
                                expect(res.tuples[0].values[0]).toEqual("01");
                                done();
                            }).catch(function (err) {
                                console.log(err);
                                done.fail();
                            });
                        });
                    });
                });

            });

            describe(".related, ", function () {
                var related;
                beforeAll(function () {
                    related = mainRefDetailed.related(mainTuple);
                });

                it ("should not add duplicate sources, and create the list as expected.", function () {
                    expect(related.length).toBe(3);
                });

                it ("related reference displayname should use the pseudo-column's displayname (markdown_name).", function () {
                    var names = [
                        "<strong>length 1 inbound</strong>",
                        "<strong>association</strong>",
                        "<strong>length 3 inbound</strong>"
                    ];

                    for (var i = 0; i < 3; i++) {
                        expect(related[i].displayname.value).toBe(names[i], "missmatch for index="+  i);
                    }
                });

                it ("if it's related with length one should have the expected attributes.", function () {
                    expect(related[0].derivedAssociationReference).toBeUndefined();
                });

                it ("If it's association should have the expected attributes.", function () {
                    expect(related[1].derivedAssociationReference).toBeDefined("undefined");
                    expect(related[1].derivedAssociationReference.table.name).toBe("main_inbound_3_association");
                });


                it ("other attributes must be as expected.", function () {

                });
            });

            it("generateColumnsList, passing tuple should not change the column list.", function () {
                detailedColsWTuple = mainRefDetailed.generateColumnsList(mainTuple);
                areSameColumnList(detailedColsWTuple, detailedCols);
            });

            it ("faceting should be able to handle these new type of columns.", function () {
                var facetColumns = mainRef.facetColumns;
                expect(facetColumns.length).toBe(14, "length missmatch.");
                expect(facetColumns.map(function (fc) {
                    return fc.dataSource;
                })).toEqual(
                    [
                        "id", "col", "id", // the key
                        [{"outbound": ["pseudo_column_schema", "main_fk1"]}, "id"],
                        [{"outbound": ["pseudo_column_schema", "main_fk1"]}, "id"],
                        [
                            {"outbound": ["pseudo_column_schema", "main_fk1"]},
                            {"outbound": ["pseudo_column_schema", "outbound_1_fk1"]},
                            "id"
                        ],
                        [
                            {"outbound": ["pseudo_column_schema", "main_fk1"]},
                            {"outbound": ["pseudo_column_schema", "outbound_1_fk1"]},
                            "id"
                        ],
                        [{"inbound": ["pseudo_column_schema", "inbound_1_fk1"]}, "id"],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_2_association_fk2"]},
                            "id"
                        ],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_2_association_fk2"]},
                            {"outbound": ["pseudo_column_schema", "inbound_2_fk1"]},
                            "id",
                        ],
                        [{"inbound": ["pseudo_column_schema", "main_inbound_2_association_fk1"]}, "id"],
                        [{"inbound": ["pseudo_column_schema", "inbound_3_outbound_1_fk1"]}, "id"],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_3_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_3_association_fk2"]},
                            "id"
                        ],
                        [
                            {"inbound": ["pseudo_column_schema", "main_inbound_3_association_fk1"]},
                            {"outbound": ["pseudo_column_schema", "main_inbound_3_association_fk2"]},
                            {"outbound": ["pseudo_column_schema", "inbound_3_fk1"]},
                            "id"
                        ]
                    ],
                    "array missmatch."
                );
            });
        });

        describe("column APIs, ", function () {
            describe ('isPathColumn, .', function () {
                it ("should be true for pseudo column", function () {
                    detailedColsWTuple.forEach(function (col, i) {
                        // first column is the id
                        if (i === 0) return;
                        expect(col.isPathColumn).toBe(true, "missmatch for with tuple and index =" + i);
                    });
                });

                it ("otherwise should not be defined.", function () {
                    expect(detailedColsWTuple[0].isPathColumn).toBeUndefined();
                });
            });

            describe ('hasPath, ', function () {
                it ('should be true if source has path.', function () {
                    for (var i = 3; i <= 10; i++) {
                        expect(detailedColsWTuple[i].hasPath).toBe(true, "missmatch for index =" + i);
                    }
                });

                it ('otherwise it should be false.', function () {
                    for (var i = 1; i < 3; i++) {
                        expect(detailedColsWTuple[i].hasPath).toBe(false, "missmatch for index =" + i);
                    }
                });
            });

            describe('isUnique, ', function () {
                it ('should return true if source doesn\'t have path', function () {
                    for (var i = 1; i < 3; i++) {
                        expect(detailedColsWTuple[i].isUnique).toBe(true, "missmatch for index =" + i);
                    }
                });

                it ('should return true if source has path of all outbound fks.', function () {
                    for (var i = 3; i <= 6; i++) {
                        expect(detailedColsWTuple[i].isUnique).toBe(true, "missmatch for index =" + i);
                    }
                });

                it ('otherwise should return false.', function () {
                    for (var i = 7; i <= 10; i++) {
                        expect(detailedColsWTuple[i].isUnique).toBe(false, "missmatch for index =" + i);
                    }
                });
            });

            describe('isEntityMode, ', function () {
                it ("should return true if column is not-null and part of simple key, and entity is not false.", function () {
                    expect(detailedColsWTuple[1].isEntityMode).toBe(false, "missmatch for index=" + i);
                    expect(detailedColsWTuple[4].isEntityMode).toBe(false, "missmatch for index=4");
                    expect(detailedColsWTuple[6].isEntityMode).toBe(false, "missmatch for index=6");
                });

                it ("otherwise it should return true", function () {
                    var i;
                    for (i = 2; i <= 3; i++) {
                        expect(detailedColsWTuple[i].isEntityMode).toBe(true, "missmatch for index=" + i);
                    }
                    expect(detailedColsWTuple[5].isEntityMode).toBe(true, "missmatch for index=5");
                    for (i = 7; i <= 10; i++) {
                        expect(detailedColsWTuple[i].isEntityMode).toBe(true, "missmatch for index=" + i);
                    }
                });
            });

            describe("isInboundForeignKey, ", function () {
                it ("should return true if path is a single inbound fk.", function () {
                    expect(detailedColsWTuple[7].isInboundForeignKey).toBe(true, "missmatch for index=7");

                    expect(detailedColsWTuple[10].isInboundForeignKey).toBe(true, "missmatch for index=10");
                });

                it ("should return true if path is a p&b association.", function () {
                    expect(detailedColsWTuple[8].isInboundForeignKey).toBe(true);
                });

                it ("otherwise should return false.", function () {
                    detailedColsWTuple.forEach(function (col, i) {
                        if (i === 0) return;
                        if (i === 7 || i === 8 || i === 10) return;
                        expect(col.isInboundForeignKey).toBe(false, "missmatch for index =" + i);
                    });
                });
            });

            describe ("name, ", function () {
                it ("if column doesn't have any path and is not entity mode, should return the underlying column's name.", function () {
                    expect(detailedColsWTuple[1].name).toBe("col");
                });

                it ("otherwise should return a deterministic and unique hash.", function () {
                    expect(detailedColsWTuple.map(function (col) {
                        return col.name;
                    })).toEqual(detailedExpectedNames);
                });
            });

            describe ("displayname, ", function () {
                it ("if `markdown_name` is defined, should use it.", function () {
                    checkDisplayname(detailedColsWTuple[8], "<strong>association table</strong>", true);
                });

                describe("if it's not a path,", function () {
                    it ("if it's entity mode, should return the key displayname.", function () {
                        checkDisplayname(detailedColsWTuple[2], "<strong>key name</strong>", true);
                    });

                    it ("otherwise should apply column's displayname logic.", function () {
                        checkDisplayname(detailedColsWTuple[1], "col name", false);
                    });
                });

                it ("if it's a one-to-one path in non-entity mode, should use the column's displayname logic.", function () {
                    checkDisplayname(detailedColsWTuple[6], "outbound_1_outbound_1 id name", false);
                });

                describe ("otherwise should apply the same logic as FacetColumn", function () {
                    it ("if last foreignkey is outbound should use its to_name.", function () {
                        checkDisplayname(detailedColsWTuple[5], "outbound_1_fk1 to_name", false);
                    });

                    it ("if last foreignkey is inbound should use its from_name.", function () {
                        checkDisplayname(detailedColsWTuple[7], "inbound_1 from_name", false);
                    });

                    it ("if to_name and from_name are not defined, should return the table's name.", function () {
                        checkDisplayname(detailedColsWTuple[9], "inbound_2_outbound_1", false, "index=9");
                        checkDisplayname(detailedColsWTuple[3], "outbound_1", false, "index=3");
                    });
                });
            });

            describe(".table, ", function () {
                it ("should return the column's table.", function () {
                    expect(detailedColsWTuple.map(function (col) {
                        return col.table.name;
                    })).toEqual([
                        'main', 'main', 'main', 'outbound_1', 'outbound_1',
                        'outbound_1_outbound_1', 'outbound_1_outbound_1',
                        'inbound_1', 'inbound_2', 'inbound_2_outbound_1',
                        'main_inbound_2_association'
                    ]);
                });
            });

            describe("sortable, ", function () {
                describe("if it's not a path.", function () {
                    it ("if in entity mode, should return the key sort settings.", function () {
                        checkSortable(detailedColsWTuple[2], true, ["col"]);
                    });

                    it ("otherwise should return the column sort settings.", function () {
                        checkSortable(detailedColsWTuple[0], true, ["id"]);
                    });
                });

                describe("if it's unique (one-to-one) path should apply the same logic as foreignkey. ", function () {
                    it ("use the column_order defined on last foreignkey.", function () {
                        checkSortable(detailedColsWTuple[5], true, ["col"]);
                    });

                    it ("use the row_order of table in entity_mode.", function () {
                        checkSortable(detailedColsWTuple[3], true, ["col"]);
                    });

                    it ("use the column's column_order if none-entity or row_order is not defined.", function () {
                        checkSortable(detailedColsWTuple[4], true, ["id"], "index=4");
                        checkSortable(detailedColsWTuple[6], true, ["id"], "index=5");
                    });
                });

                it ("otherwise should not be sortable.", function () {
                    for (var i = 7; i <= 10; i++) {
                        checkSortable(detailedColsWTuple[i], false, [], "index=" + i);
                    }
                });
            });

            describe ("formatPresentation, ", function () {
                it ("in entity mode should return null.", function () {
                    detailedColsWTuple.forEach(function (col, i) {
                        if (i === 0) return;
                        expect(col.formatPresentation({"id":"1", "col":"1"}, "entry").value).toEqual("", "missmatch for index=" + i);
                    });
                });

                describe("if it doesn't have path.", function () {
                    it ("if in entity mode, should return the key value.", function () {
                        expect(detailedColsWTuple[2].formatPresentation(
                            {"id": "121"},
                            "detailed"
                        ).value).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/pseudo_column_schema:main/id=121">121</a>');
                    });

                    it ("otherwise should return the underlying column value.", function () {
                        expect(detailedColsWTuple[0].formatPresentation(
                            "test",
                            "detailed"
                        ).value).toEqual('test', "id missmatch.");

                        expect(detailedColsWTuple[1].formatPresentation(
                            "A col value",
                            "detailed",
                            {formattedValues: {"col":"A value", "id": "1"}}
                        ).value).toEqual('<p>1: A value</p>\n', "col missmatch.");
                    });
                });

                describe("if it's a one-to-one path", function () {
                    it ("if in entity mode, should apply the foreignkey logic.", function () {
                        expect(detailedColsWTuple[3].formatPresentation(
                            {"col": "A value", "id": "101"},
                            "detailed"
                        ).value).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/pseudo_column_schema:outbound_1/id=101">101</a>', "index=3 missmatch.");

                        expect(detailedColsWTuple[5].formatPresentation(
                            {"col": "A value", "id": "101"},
                            "detailed"
                        ).value).toEqual('<a href="https://dev.isrd.isi.edu/chaise/record/pseudo_column_schema:outbound_1_outbound_1/id=101">101</a>', "index=5 missmatch.");
                    });

                    it ("otherwise should apply the underlying column logic.", function () {
                        expect(detailedColsWTuple[4].formatPresentation(
                            {"col": "A value", "id": "101"},
                            "detailed"
                        ).value).toEqual('<p>101: A value</p>\n', "index=4 missmatch.");

                        expect(detailedColsWTuple[6].formatPresentation(
                            {"col": "A value", "id": "101"},
                            "detailed"
                        ).value).toEqual('101', "index=6 missmatch.");
                    });
                });

                it ("otherwise (path), should return null.", function () {
                    for (var i = 7; i <= 10; i++) {
                        expect(detailedColsWTuple[i].formatPresentation({"id":"1", "col":"1"}, "detailed").value).toEqual("", "missmatch for index=" + i);
                    }
                });
            });

            describe("reference, ", function () {
                it ("should return the main reference if source doesn't have path", function () {
                    for (var i = 1; i <= 2; i++) {
                        expect(detailedColsWTuple[i].reference.location.ermrestUri).toBe(mainRefDetailed.location.ermrestUri, "missmatch for index=" + i);
                    }
                });

                it ("should apply the same logic as related reference if it's inbound fk.", function() {
                    checkRelatedReference(
                        detailedColsWTuple[7].reference,
                        "inbound_1",
                        {"and": [{"source": [{"outbound":[ 'pseudo_column_schema', 'inbound_1_fk1' ]}, "id"], "choices": ["01"]}]},
                        "(id)=(pseudo_column_schema:inbound_1:id)",
                        "8Xgp-B0t26q61nJsPj8K2Q",
                        "inbound_1 from_name",
                        "inbound_1 to_name",
                        "inbound related"
                    );

                    checkRelatedReference(
                        detailedColsWTuple[8].reference,
                        "inbound_2",
                        {"and": [
                            {"source": [
                                {"inbound":[ 'pseudo_column_schema', 'main_inbound_2_association_fk2' ]},
                                {"outbound":[ 'pseudo_column_schema', 'main_inbound_2_association_fk1' ]},
                                "id"],
                            "choices": ["01"]}
                        ]},
                        "(id)=(pseudo_column_schema:main_inbound_2_association:fk_to_main)",
                        "Ke1VPpRHeyXkuW4ohygQ9A",
                        "<strong>association table</strong>",
                        "main",
                        "association"
                    );

                    checkRelatedReference(
                        detailedColsWTuple[10].reference,
                        "main_inbound_2_association",
                        {"and": [{"source": [{"outbound":[ 'pseudo_column_schema', 'main_inbound_2_association_fk1' ]}, "id"], "choices": ["01"]}]},
                        "(id)=(pseudo_column_schema:main_inbound_2_association:fk_to_main)",
                        "Ke1VPpRHeyXkuW4ohygQ9A",
                        "main_inbound_2_association",
                        "main",
                        "inbound related 2"
                    );
                });

                it ("should be generated based on mainTuple.", function () {
                    checkReference(
                        detailedColsWTuple[3].reference,
                        "outbound_1",
                        {"and": [
                            {"source": [
                                {"inbound":[ 'pseudo_column_schema', 'main_fk1' ]},
                                "fk1"],
                            "choices": ["01"]}
                        ]},
                        "index=3"
                    );

                    checkReference(
                        detailedColsWTuple[6].reference,
                        "outbound_1_outbound_1",
                        {"and": [
                            {"source": [
                                {"inbound":[ 'pseudo_column_schema', 'outbound_1_fk1' ]},
                                {"inbound":[ 'pseudo_column_schema', 'main_fk1' ]},
                                "fk1"],
                            "choices": ["01"]}
                        ]},
                        "index=6"
                    );

                    checkReference(
                        detailedColsWTuple[9].reference,
                        "inbound_2_outbound_1",
                        {"and": [
                            {"source": [
                                {"inbound":[ 'pseudo_column_schema', 'inbound_2_fk1' ]},
                                {"inbound":[ 'pseudo_column_schema', 'main_inbound_2_association_fk2' ]},
                                {"outbound":[ 'pseudo_column_schema', 'main_inbound_2_association_fk1' ]},
                                "id"],
                            "choices": ["01"]}
                        ]},
                        "index=9"
                    );
                });

                it ("if mainTuple is not passed, should return an unfiltered referene.", function () {
                    checkReference(detailedCols[3].reference, "outbound_1", undefined, "index=3");

                    checkReference(detailedCols[6].reference, "outbound_1_outbound_1", undefined, "index=6");

                    checkReference(detailedCols[9].reference, "inbound_2_outbound_1", undefined, "index=9");
                });
            });

            describe("foreignKeys, ", function () {
                it ("if there's no path it should return an empty array.", function () {
                    for (var i = 1; i <= 2; i++) {
                        checkForeignKeys(detailedColsWTuple[i], [], "index="+ i);
                    }
                });

                it ("otherwise it should return a list of objects that have fk and its direction", function () {
                    checkForeignKeys(detailedColsWTuple[9], [
                        {"const": ["pseudo_column_schema", "main_inbound_2_association_fk1"].join("_"), "isInbound": true},
                        {"const": ["pseudo_column_schema", "main_inbound_2_association_fk2"].join("_"), "isInbound": false},
                        {"const": ["pseudo_column_schema", "inbound_2_fk1"].join("_"), "isInbound": false},
                    ]);
                });
            });

            it ("default, should throw error as this column should not be used in entity mode.",  function () {
                detailedColsWTuple.forEach(function (col, i) {
                    if (i === 0) return;
                    expect(function () {
                        var def = col.default;
                    }).toThrow("can not use this type of column in entry mode.", "missmatch for index=" + i);
                });
            });

            it ("nullok, should throw error as this column should not be used in entity mode.", function () {
                detailedColsWTuple.forEach(function (col, i) {
                    if (i === 0) return;
                    expect(function () {
                        var nullok = col.nullok;
                    }).toThrow("can not use this type of column in entry mode.", "missmatch for index=" + i);
                });
            });
        });

    });

    function areSameColumnList(cols1, cols2) {
        expect(cols1.length).toEqual(cols2.length, "didn't have the same length.");
        for (var i = 0; i < cols1.length; i++) {
            expect(cols1[i].name).toEqual(cols2[i].name, "missmatch in column with index=" + i);
        }
    }

    function checkReferenceColumns(tesCases) {
        tesCases.forEach(function (test) {
            var expected;
            expect(test.ref.columns.map(function (col) {
                // the name for pseudoColumns is a hash, this way of testing it is easier to read
                if (col.isPathColumn) {
                    return col.columnObject.source;
                }
                if (col.isPseudo && (col.isKey || col.isForeignKey || col.isInboundForeignKey)) {
                    return col._constraintName;
                }
                return  col.name;
            })).toEqual(test.expected);
        });
    }

    function checkSort(ref, sortObject, expectedID, done) {
        ref.sort(sortObject).read(1).then(function (page) {
            expect(page.tuples[0].values[0]).toEqual(expectedID);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    }

    function checkDisplayname(col, value, isHTML, colStr) {
        expect(col.displayname.value).toBe(value, "value missmatch" + (colStr? (" for " + colStr) : "") + ".");
        expect(col.displayname.isHTML).toBe(isHTML, "isHTML missmatch" + (colStr? (" for " + colStr) : "") + ".");
    }

    function checkSortable (col, sortable, sortColumns, colStr) {
        expect(col.sortable).toBe(sortable, "sortable missmatch" + (colStr ? (" for " + colStr) : "."));
        expect(col._sortColumns.length).toBe(sortColumns ? sortColumns.length : 0, "sortColumns length missmatch" + (colStr ? (" for " + colStr) : "."));
        if (sortColumns) {
            expect(col._sortColumns.map(function (col) {
                return col.name;
            })).toEqual(sortColumns, "_sortColumn missmatch" +  (colStr ? (" for " + colStr) : "."));
        }
    }

    function checkForeignKeys (col, fks, colStr) {
        expect(col.foreignKeys.length).toBe(fks.length, "length missmatch"  +  (colStr ? (" for " + colStr) : "."));
        expect(col.foreignKeys.map(function (fk) {
            return {"const": fk.obj._constraintName, "isInbound": fk.isInbound};
        })).toEqual(fks, "fks missmatch" + (colStr ? (" for " + colStr) : "."));
    }

    function checkRelatedReference (ref, table, facets, origFKR, origColumnName, displayname, parentDisplayname, colStr) {
        expect(ref.origFKR.toString()).toEqual(origFKR, "origFKR missmatch" + (colStr ? (" for " + colStr) : "."));
        expect(ref.table.name).toEqual(table, "table missmatch" + (colStr ? (" for " + colStr) : "."));
        expect(ref.location.facets.decoded).toEqual(facets, "facets missmatch" + (colStr ? (" for " + colStr) : "."));
        expect(ref.origColumnName).toEqual(origColumnName, "origColumnName missmatch" + (colStr ? (" for " + colStr) : "."));
        expect(ref.displayname.value).toEqual(displayname, "displayname missmatch" + (colStr ? (" for " + colStr) : "."));
        expect(ref.parentDisplayname.value).toEqual(parentDisplayname, "parentDisplayname missmatch" + (colStr ? (" for " + colStr) : "."));
    }

    function checkReference (ref, table, facets, colStr) {
        expect(ref.table.name).toEqual(table, "table missmatch" + (colStr ? (" for " + colStr) : "."));
        if (facets) {
            expect(ref.location.facets.decoded).toEqual(facets, "facets missmatch" + (colStr ? (" for " + colStr) : "."));
        } else {
            expect(ref.location.facets).toBeUndefined("facets missmatch" + (colStr ? (" for " + colStr) : "."));
        }
    }

};
