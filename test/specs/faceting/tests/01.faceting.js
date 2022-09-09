exports.execute = function (options) {
    /*
     * The tables that are used in this test spec:
     *
     * main:
     *  - Has the following facets:
     *    0: id | choices | appliedFilter: 1 | markdown_name
     *    1: int_col | ranges | appliedFilter: min:-2
     *    2: float_col | markdown_name
     *    3: date_col
     *    4: timestamp_col
     *    5: text_col
     *    6: longtext_col
     *    7: markdown_col
     *    8: boolean_col
     *    9: jsonb_col
     *    10: main_fk1, id (f1 table) | markdown_name: **F1**
     *    11: main_fk2, id (f2 table) | open
     *    12: f3, term (association table) | scalar
     *    13: f4_fk1, id (inbound) | entity:false | ux_mode: check_presence
     *    14: a long path
     *    15: second path (based on id), entity
     *    16: second path (based on RID), entity
     *    17: second path (based on id), scalar
     *    18: f3, id (association table), entity
     *    19: numeric_col
     *    20: f4_fk1, int_col (inbound) | entity:false
     *    21: path_to_path_prefix_o1_o1 (using path prefix), col
     *    22: recurstive path to path_prefix_o1_o1_i1, col
     *    23: id (has filter)
     *    24: path_to_path_prefix_o1_w_filter (has complicated filter)
     *    25: same as 21 but with filter
     *    26: same as 22 but with filter
     *
     * f1:
     *  - main has fk to it.
     *  - has filter annotation, but it's invalid and should be ignored.
     * f2:
     *  - main has fk to it.
     *  - has filter annotation, but the source that is there is invalid
     *
     * f4:
     *  - doesn't have facet annotation.
     *  - visible columns in compact, and related entities in detailed are wellformed.
     *
     * main_wo_faceting_annot_1:
     *  - Doesn't have facet annotation
     *  - has asset and composite foreign keys.
     * main_wo_faceting_annot_2
     *  - Doesn't have facet annotation
     *  - has longtext, markdown, and serial columns.
     *
     * main_w_facets_w_alt:
     *  - two tables have fk to this table, both have alternative
     *
     * refLP5:
     * - has facet annotation
     * - has * facet with choices (should be ignored)
     *
     * refAP2:
     * - has facet annotation
     * - has multiple * facets with search.
     */

    describe('for testing faceting features, ', function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "faceting_schema",
            tableF1 = "f1",
            tableF2 = "f2",
            tableF4 = "f4",
            tableWOAnnot1 = "main_wo_faceting_annot_1",
            tableWOAnnot2 = "main_wo_faceting_annot_2",
            tableLongPath5 = "longpath_5",
            tableSecondPath2 = "secondpath_2",
            tableMain = "main",
            tableWAlt = "table_w_alt",
            tableWFacetAlt = "main_w_facets_w_alt",
            tableWArray = "table_w_array";

        var refF1, refF2, refF4, refMain, refWOAnnot1, refWOAnnot2, refLP5, refSP2;
        var refMainMoreFilters, refNotNullFilter, refWCustomFilters, refMainAllData;
        var unsupportedFilter = "id=1;int_col::geq::5";
        var mainFacets;
        var i, facetObj, ref;

        var currDate = new Date();
        var currentDateString = options.ermRest._fixedEncodeURIComponent(currDate.getFullYear() + "-" + (currDate.getMonth()+1) + "-" + currDate.getDay());

        var createURL = function (tableName, facet) {
            var res = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
            if (facet) {
                res += "/*::facets::" + options.ermRest.encodeFacet(facet);
            }
            return res;
        };

        var checkFacetSource = function (fcName, fc, source) {
            expect(JSON.stringify(fc.dataSource)).toEqual(JSON.stringify(source), fcName + ": source missmatch.");
        };

        var checkMainFacetDisplayname = function (index, value, isHTML) {
            var disp = mainFacets[index].displayname;
            expect(disp.value).toBe(value, "value missmatch for index=" + index);
            expect(disp.isHTML).toBe(isHTML, "isHTML missmatch for index=" + index);
        };

        var checkSourceReference = function (fcName, fc, compactPath, colName) {
            var sr = fc.sourceReference;
            var col = fc.column;

            expect(sr.location.ermrestCompactPath).toBe(compactPath, fcName + ": compactPath missmatch.");
            expect(col._baseReference).toBe(sr, fcName + ": column wasn't based on sourceReference.");
            expect(col.name).toBe(colName, fcName + ": colname missmatch.");
        };

        var chaiseURL = "https://dev.isrd.isi.edu/chaise",
            recordURL = chaiseURL + "/record",
            record2URL = chaiseURL + "/record-two",
            viewerURL = chaiseURL + "/viewer",
            searchURL = chaiseURL + "/search",
            recordsetURL = chaiseURL + "/recordset";
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

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);

            // get all the references needed for the test cases
            options.ermRest.resolve(createURL(tableMain), { cid: "test" }).then(function (ref) {
                refMain = ref.contextualize.compact;
                return refMain.generateFacetColumns();
            }).then(function (res) {
                mainFacets = res.facetColumns;

                facetObj = {
                    "and": [
                        { "source": "id", "choices": ["1"] },
                        { "source": "int_col", "ranges": [{ "min": -2 }] },
                        { "source": [{ "outbound": ["faceting_schema", "main_fk2"] }, "id"], "choices": ["2", "3"] }
                    ]
                };
                return options.ermRest.resolve(createURL(tableMain, facetObj));
            }).then(function (ref) {
                refMainFilterOnFK = ref;

                facetObj = {
                    "and": [
                        { "source": "int_col", "ranges": [{ "min": -2 }] }
                    ]
                };
                return options.ermRest.resolve(createURL(tableMain, facetObj));
            }).then (function (ref) {
                refMainAllData = ref;

                return options.ermRest.resolve(createURL(tableF4), { cid: "test" });
            }).then(function (ref) {
                refF4 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableLongPath5), { cid: "test" });
            }).then(function (ref) {
                refLP5 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableSecondPath2), { cid: "test" });
            }).then(function (ref) {
                refSP2 = ref.contextualize.compact;
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });

        });


        // NOTE Reference.generateFacetColumns and Reference.facetColumns
        //      should behave the same in all cases except entity mapping,
        //      but since chaise is using .generateFacetColumns our default tests should be based on that
        describe("Reference.generateFacetColumns, ", function () {
            describe("when `filter` annotation is not defined, ", function () {
                describe("when visible columns for `compact` and related entities for `detailed` are wellformed.", function () {
                    beforeAll(function (done) {
                        refF4.generateFacetColumns().then(function (res) {
                            // we don't need to do anything, refF4.facetColumns is populated
                            done();
                        }).catch(function (err) {
                            done.fail(err);
                        })
                    })

                    it("it should use the visible columns from `compact` and related entities from `detailed`", function () {
                        expect(refF4.facetColumns.length).toBe(7, "length missmatch.");
                    });

                    it('should create a scalar picker for simple keys.', function () {
                        expect(refF4.facetColumns[0]._column.name).toBe("id", "column name missmatch.");
                        expect(refF4.facetColumns[0]._column.table.name).toBe("f4", "table name missmatch.");
                        expect(refF4.facetColumns[0].dataSource).toBe("id", "dataSource missmatch.");
                        expect(refF4.facetColumns[0].isEntityMode).toBe(false, "entityMode missmatch.");
                    });


                    describe("regarding Key pseudo-columns, ", function () {
                        it("should attach ux_mode=choices for int/serial key columns.", function () {
                            expect(refF4.facetColumns[0]._facetObject.ux_mode).toBe("choices", "preferredMode missmatch for index=0");
                        });

                        it("should not attach specific ux_mode for other column types.", function () {
                            expect(refF4.facetColumns[1]._facetObject.ux_mode).toBeUndefined("preferredMode defined for index=2");
                            expect(refF4.facetColumns[2]._facetObject.ux_mode).toBeUndefined("preferredMode defined for index=3");
                            expect(refF4.facetColumns[3]._facetObject.ux_mode).toBeUndefined("preferredMode defined for index=4");
                        });
                    });

                    it("should create scalar picker for normal columns.", function () {
                        expect(refF4.facetColumns[4]._column.name).toBe("term", "column name missmatch.");
                        expect(refF4.facetColumns[4]._column.table.name).toBe("f4", "table name missmatch.");
                        expect(refF4.facetColumns[4].dataSource).toBe("term", "dataSource missmatch.");
                        expect(refF4.facetColumns[4].isEntityMode).toBe(false, "entityMode missmatch.");
                    });

                    describe("for simple inbound and outbound pusedo columns, ", function () {
                        it("should create a entity picker facet.", function () {
                            expect(refF4.facetColumns[5]._column.name).toBe("RID", "column name missmatch for outbound.");
                            expect(refF4.facetColumns[5]._column.table.name).toBe("main", "table name missmatch for outbound.");
                            expect(JSON.stringify(refF4.facetColumns[5].dataSource)).toBe(
                                '[{"outbound":["faceting_schema","f4_fk1"]},"RID"]',
                                "dataSource missmatch for outbound."
                            );
                            expect(refF4.facetColumns[5].isEntityMode).toBe(true, "entityMode missmatch for outbound.");


                            expect(refF4.facetColumns[6]._column.name).toBe("RID", "column name missmatch for inbound.");
                            expect(refF4.facetColumns[6]._column.table.name).toBe("main_wo_faceting_annot_1", "table name missmatch for inbound.");
                            expect(JSON.stringify(refF4.facetColumns[6].dataSource)).toBe(
                                '[{"inbound":["faceting_schema","main_wo_annot_1_fkey1"]},"RID"]',
                                "dataSource missmatch for outbound."
                            );
                            expect(refF4.facetColumns[6].isEntityMode).toBe(true, "entityMode missmatch for inbound.");
                        });

                        it("should define markdown_name properly.", function () {
                            expect(refF4.facetColumns[5]._facetObject.markdown_name).toBe("to_name", "missmatch for outbound.");

                            expect(refF4.facetColumns[6]._facetObject.markdown_name).toBe("main_wo_faceting_annot_1", "missmatch for inbound.");
                        });
                    });
                });

                it("it should ignore asset columns, and composite keys. But create a facet for composite inbound and outbound foreignKeys based on shortestKey.", function (done) {
                    options.ermRest.resolve(createURL(tableWOAnnot1), { cid: "test" }).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(2, "length missmatch.");
                        expect(ref.facetColumns[0]._column.name).toBe("RID", "column name missmatch for outbound.");
                        expect(ref.facetColumns[0]._column.table.name).toBe("main_wo_faceting_annot_2", "table name missmatch for outbound.");
                        expect(JSON.stringify(ref.facetColumns[0].dataSource)).toBe(
                            '[{"outbound":["faceting_schema","main_wo_annot_1_fkey2"]},"RID"]',
                            "dataSource missmatch for outbound."
                        );
                        expect(ref.facetColumns[0].isEntityMode).toBe(true, "entityMode missmatch for outbound.");


                        expect(ref.facetColumns[1]._column.name).toBe("RID", "column name missmatch for inbound.");
                        expect(ref.facetColumns[1]._column.table.name).toBe("main_wo_faceting_annot_2", "table name missmatch for inbound.");
                        expect(JSON.stringify(ref.facetColumns[1].dataSource)).toBe(
                            '[{"inbound":["faceting_schema","main_wo_annot_2_fkey1"]},"RID"]',
                            "dataSource missmatch for inbound."
                        );
                        expect(ref.facetColumns[1].isEntityMode).toBe(true, "entityMode missmatch for inbound.");

                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("it should ignore columns with `json`, `jsonb`, `longtext`, `markdown`, and `serial` type if it's not entity picker.", function (done) {
                    options.ermRest.resolve(createURL(tableWOAnnot2), { cid: "test" }).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });

            describe("when `filter` annotation is defined, ", function () {
                // TODO
                it("if it's not in the valid format, should use heuristics.", function (done) {
                    options.ermRest.resolve(createURL(tableF1), { cid: "test" }).then(function (ref) {
                        expect(ref.facetColumns[0]._column.name).toBe("term", "column name missmatch.");
                        expect(ref.facetColumns[0]._column.table.name).toBe("f1", "table name missmatch.");
                        expect(ref.facetColumns[0].dataSource).toBe("term", "dataSource missmatch.");
                        expect(ref.facetColumns[0].isEntityMode).toBe(false, "entityMode missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should ignore invalid facets.", function (done) {
                    options.ermRest.resolve(createURL(tableF2), { cid: "test" }).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should ignore array columns.", function (done) {
                    options.ermRest.resolve(createURL(tableWArray), { cid: "test" }).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should create facets based on what data modelers have defined, and ignore the column types that are not supported (json).", function () {
                    expect(refMain.facetColumns.length).toBe(27);

                    expect(refMain.facetColumns.map(function (fc) {
                        return fc._column.name;
                    })).toEqual(
                        ['id', 'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col', 'longtext_col',
                            'markdown_col', 'boolean_col', 'jsonb_col', 'id', 'id', 'term', 'id', 'col', 'id', 'RID', 'RID', 'id', 'numeric_col', 'int_col',
                            'path_prefix_o1_o1_col', 'path_prefix_o1_o1_i1_col',
                            'id', 'path_prefix_o1_col', 'path_prefix_o1_o1_col', 'path_prefix_o1_o1_i1_col'
                        ]
                    );
                });

                it("should update the location object based on preselected values.", function () {
                    // this will populate the facetColumns list and update the facets on the location
                    var facetColumns = refMain.facetColumns;
                    expect(refMain.location.facets).toBeDefined("facets is undefined.");
                    expect(refMain.location.ermrestCompactPath).toBe(
                        "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M",
                        "path missmatch."
                    );
                });

                describe("if sourcekey: `search-box` is defined, ", function () {
                    it("if it doesn't have `search`, it should be ignored.", function () {
                        var facetColumns = refLP5.facetColumns;
                        expect(refLP5.location.searchTerm).toBe(null, "has searchTerm");
                        expect(facetColumns.length).toBe(1, "length missmatch.");
                        expect(facetColumns[0]._column.name).toBe("id", "column name missmatch.");
                    });

                    it("only the first instance of it with `search` should be considered.", function () {
                        var facetColumns = refSP2.facetColumns;
                        expect(refSP2.location.searchTerm).toBe("term", "searchTerm missmatch.");
                        expect(facetColumns.length).toBe(1, "length missmatch.");
                        expect(facetColumns[0]._column.name).toBe("id", "column name missmatch.");
                    });
                });
            });

            describe("if reference already has facets or filters applied, ", function () {

                it("should merge the facet lists, but get the filters from uri.", function (done) {
                    facetObj = { "and": [{ "source": "unfaceted_column", "search": ["test"] }] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function (res) {
                        expect(ref.facetColumns.length).toBe(28, "length missmatch.");
                        expect(ref.facetColumns[27]._column.name).toBe("unfaceted_column", "column name missmatch.");
                        expect(ref.facetColumns[27].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toEqual(
                            "M:=faceting_schema:main/unfaceted_column::ciregexp::test/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("If the facet exists in the annotation should only add the filter to that facet from uri. (choices)", function (done) {
                    // the facet definition is based on sourcekey, but facet blob is based on source
                    facetObj = { "and": [{ "source": "id", "choices": ["2"] }] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[0].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=2/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("If the facet exists in the annotation should only add the filter to that facet from uri. (ranges)", function (done) {
                    facetObj = { "and": [{ "source": "int_col", "ranges": [{ "max": 12, "min": 5 }] }] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[1].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/int_col::geq::5&int_col::leq::12/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("If the facet exists in the annotation should only add the filter to that facet from uri. (sourcekey)", function (done) {
                    // both facet definition and facet blob are based on sourcekey
                    facetObj = { "and": [{ "sourcekey": "text_col_source_definition", "choices": ["val"] }] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[5].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/text_col=val/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it("if the facet exists in the annotation and the uri is based on sourcekey, should be able to merge them.", function (done) {
                    // facet definition is based on source, but facet blob is based on sourcekey
                    facetObj = { "and": [{ "sourcekey": "f1_source_definition", "choices": ["4"] }] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[10].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/(fk_to_f1)=(faceting_schema:f1:id)/id=4/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it("should be able to handle multiple types of filter.", function (done) {
                    facetObj = {
                        "and": [
                            { "source": "id", "choices": ["1"] },
                            { "source": "int_col", "ranges": [{ "min": -2 }] },
                            { "source": "text_col", "ranges": [{ "min": "a" }, { "max": "b" }], "search": ["a", "b"], "choices": ["a", "b"] },
                        ]
                    };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                        ref = res;
                        refMainMoreFilters = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[0].filters.length).toBe(1, "# of filters defined is incorrect, index=0");
                        expect(ref.facetColumns[1].filters.length).toBe(1, "# of filters defined is incorrect, index=1");
                        expect(ref.facetColumns[5].filters.length).toBe(6, "# of filters defined is incorrect, index=5");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/text_col=any(a,b);text_col::geq::a;text_col::leq::b;text_col::ciregexp::a;text_col::ciregexp::b/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should ignore entity/scalar mode and just match based on definition if source is passed.", function (done) {
                    facetObj = {
                        "and": [
                            {
                                "source": [
                                    { "inbound": ["faceting_schema", "secondpath_1_fk1"] },
                                    { "inbound": ["faceting_schema", "secondpath_2_fk1"] },
                                    "RID"
                                ],
                                "choices": ["val1"]
                            }
                        ]
                    };

                    // NOTE we don't want to trigger the entity choice mapping becuase of random value in this test
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[17].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/(id)=(faceting_schema:secondpath_1:id)/(id)=(faceting_schema:secondpath_2:id)/" +
                            "RID=val1/$M/(id)=(faceting_schema:secondpath_1:id)/(id)=(faceting_schema:secondpath_2:id)/RID=val1/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should ignore extra attributes in source and just match based on structure if source is passed.", function (done) {
                    facetObj = {
                        "and": [
                            {
                                "source": [
                                    { "inbound": ["faceting_schema", "secondpath_1_fk1"], "alias": "A" },
                                    { "inbound": ["faceting_schema", "secondpath_2_fk1"], "alias": "C" },
                                    "id"
                                ],
                                "choices": ["id1"]
                            }
                        ]
                    };

                    // NOTE we don't want to trigger the entity choice mapping becuase of random value in this test
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                        expect(ref.facetColumns[15].filters.length).toBe(1, "# of filters defined is incorrect");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/(id)=(faceting_schema:secondpath_1:id)/(id)=(faceting_schema:secondpath_2:id)/id=id1/$M",
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                describe("should be able to handle sources with prefix", function () {
                    it("when the same path prefix is used", function (done) {
                        facetObj = {
                            "and": [
                                {
                                    "sourcekey": "path_to_path_prefix_o1_o1",
                                    "choices": ["1"]
                                }
                            ]
                        };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                            expect(ref.facetColumns[21].filters.length).toBe(1, "# of filters defined is incorrect");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=1/$M",
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it("when the same path prefix is used and it's recursive  match based on structure", function (done) {
                        facetObj = {
                            "and": [
                                {
                                    "source": [
                                        { "sourcekey": "path_to_path_prefix_o1_o1" },
                                        { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                        "path_prefix_o1_o1_i1_col"
                                    ],
                                    "choices": ["1"]
                                }
                            ]
                        };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                            expect(ref.facetColumns[22].filters.length).toBe(1, "# of filters defined is incorrect");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                ["M:=faceting_schema:main/(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                                    "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                    "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=1/$M"].join("/"),
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    })

                    it("when the structure is used without path prefix should not match", function (done) {
                        facetObj = {
                            "and": [
                                {
                                    "source": [
                                        { "outbound": ["faceting_schema", "main_fk3"] },
                                        { "outbound": ["faceting_schema", "path_prefix_o1_fk1"] },
                                        { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                        "path_prefix_o1_o1_i1_col"
                                    ],
                                    "choices": ["1"]
                                }
                            ]
                        };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(28, "length missmatch.");
                            expect(ref.facetColumns[27].filters.length).toBe(1, "# of filters defined is incorrect");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                ["M:=faceting_schema:main/(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                                    "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                    "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=1/$M"].join("/"),
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

                describe("should be able to handle sources with filter", function () {
                    it ("when the facet exists in the annotation, should merge", function (done) {
                        facetObj = {
                            "and": [
                                {
                                    "source": [
                                        {"outbound": ["faceting_schema", "main_fk3"]},
                                        {
                                            "negate": true,
                                            "and": [
                                                {"operand_pattern": "some_non_used_value", "filter": "path_prefix_o1_col"},
                                                {"operator": "::gt::", "filter": "date_col", "operand_pattern": "{{{$moment.year}}}-{{{$moment.month}}}-{{{$moment.day}}}"},
                                            ]
                                        },
                                        "path_prefix_o1_col"
                                    ],
                                    "choices": ["1"]
                                }
                            ]
                        };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                            expect(ref.facetColumns[24].filters.length).toBe(1, "# of filters defined is incorrect");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                [
                                    "M:=faceting_schema:main",
                                    // "id::gt::-1",
                                    "(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                                    "!(date_col::gt::" + currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                                    "path_prefix_o1_col=1/$M"
                                ].join("/"),
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

                describe("should be able to handle and filter on same source", function () {
                    it("when the facet exists in the annotation.", function (done) {
                        facetObj = { "and": [{ "source": "id", "choices": ["1"] }, { "source": "id", "choices": ["2"] }] };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(28, "length missmatch.");
                            expect(ref.facetColumns[0].filters.length).toBe(1, "# of filters defined is incorrect for index=0");
                            expect(ref.facetColumns[27].filters.length).toBe(1, "# of filters defined is incorrect for index=20");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/id=1/$M/id=2/$M",
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it("when the facet does not exist in the annotation.", function (done) {
                        facetObj = { "and": [{ "source": "unfaceted_column", "choices": ["1"] }, { "source": "unfaceted_column", "choices": ["2"] }] };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(29, "length missmatch.");
                            expect(ref.facetColumns[27].filters.length).toBe(1, "# of filters defined is incorrect for index=20");
                            expect(ref.facetColumns[28].filters.length).toBe(1, "# of filters defined is incorrect for index=21");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/unfaceted_column=1/$M/unfaceted_column=2/$M",
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

                it("if annotation has default search and so does the uri, the uri should take precedence.", function (done) {
                    facetObj = { "and": [{ "sourcekey": "search-box", "search": ["newTerm"] }] };
                    options.ermRest.resolve(createURL(tableSecondPath2, facetObj)).then(function (res) {
                        ref = res;
                        return ref.generateFacetColumns();
                    }).then(function () {
                        expect(ref.facetColumns.length).toBe(1, "length missmatch.");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.searchTerm).toBe("newTerm", "searchTerm missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });

                });

                describe("if a facet has not-null filter,", function () {
                    it("if facet has =null filter too, should return an empty list for its filters.", function (done) {
                        var fObj = { "and": [{ "source": "id", "not_null": true, "choices": [null] }] };
                        options.ermRest.resolve(createURL(tableMain, fObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(27, "facet list length missmatch.");
                            expect(ref.facetColumns[0].filters.length).toBe(0, "filters length missmatch.");
                            expect(ref.location.ermrestCompactPath).toEqual(
                                "M:=faceting_schema:main",
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it("otherwise should only return the not-null filter and ignore other filters.", function (done) {
                        var fObj = { "and": [{ "source": "id", "not_null": true, "choices": ["1"], "search": ["1"], "ranges": [{ 'min': 1 }] }] };
                        options.ermRest.resolve(createURL(tableMain, fObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(27, "facet list length missmatch.");
                            expect(ref.facetColumns[0].filters.length).toBe(1, "filters length missmatch.");
                            expect(ref.location.facets).toBeDefined("facets is defined.");
                            expect(ref.location.ermrestCompactPath).toEqual(
                                "M:=faceting_schema:main/!(id::null::)/$M",
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

                describe("if reference has filters,", function () {
                    var filter;
                    it("if filter can be represented in facet syntax, should change the location's filter into facet.", function (done) {
                        filter = "(id=1;id=2)&(int_col::geq::5;int_col::leq::15;int_col::gt::6)";
                        options.ermRest.resolve(createURL(tableMain) + "/" + filter).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(ref.facetColumns.length).toBe(27, "length missmatch.");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.filter).toBeUndefined("filter was defined.");
                            expect(ref.location.filtersString).toBeUndefined("filtersString was defined.");
                            expect(ref.facetColumns[0].filters.length).toBe(2, "# of filters defined for id is incorrect");
                            expect(ref.facetColumns[1].filters.length).toBe(3, "# of filters defined for int_col is incorrect.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/id=any(1,2)/$M/int_col::geq::5;int_col::leq::15;int_col::gt::6/$M",
                                "path missmatch."
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it("otherwise should not change the filter.", function (done) {
                        options.ermRest.resolve(createURL(tableMain) + "/" + unsupportedFilter).then(function (ref) {
                            refWCustomFilters = ref;
                            return ref.generateFacetColumns();
                        }).then(function () {
                            expect(refWCustomFilters.facetColumns.length).toBe(27, "length missmatch.");
                            expect(refWCustomFilters.location.facets).toBeUndefined("facets is defined.");
                            expect(refWCustomFilters.location.filter).toBeDefined("filter was undefined.");
                            expect(refWCustomFilters.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/" + unsupportedFilter,
                                "path missmatch."
                            );
                            expect(refWCustomFilters.facetColumns[0].filters.length).toBe(0, "# of filters defined is incorrect");
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

                describe("if reference has hidden filters,", function () {
                    var refWithHiddenFacets;
                    beforeAll(function (done) {
                        facetObj = { "and": [{ "source": "id", "choices": ["2"], "hidden": true }, { "source": "unfaceted_column", "choices": ["4"], "hidden": true }] };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                            refWithHiddenFacets = ref;
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it("should not create new facet column for it.", function () {
                        expect(refWithHiddenFacets.facetColumns.length).toBe(27);
                    });

                    it("should not apply preselected annotation filters.", function () {
                        expect(refWithHiddenFacets.facetColumns[0].filters.length).toBe(0);
                    });

                    it("location should still have the facets", function () {
                        expect(refWithHiddenFacets.location.facets.decoded).toEqual(facetObj);
                    });
                });

                /**
                 * 1. invalid source
                 * 2. invalid filter to facet source
                 * 3. invalid sourcekey
                 * 4. correct surcekey, invalid entity mode
                 * 5. invalid source_domain should just be ignored (will be url)
                 * 6. missmatch source_domain.table
                 * 7. scalar mode with different end column (will be in url) -> this is the new one
                 * 8. no rows found in entity mode
                 * 9. invalid choice types were given, so all will be ignored
                 * 9. partially no rows found (will be in url)
                 */
                describe("regarding UnsupportedFilters error handling", function () {
                    // 1. testing the case where no facet remains
                    it("if the facet in the url is invalid should ignore them and return the issues.", function (done) {
                        facetObj = { "and": [{ "source": "invalid_column_that_doesnt_exist", "choice": ["test"] }] };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function (result) {
                            expect(result.facetColumns.length).toBe(27, "length missmatch.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main",
                                "path missmatch."
                            );
                            expect(result.issues).toBeDefined("issues was not defined");
                            expect(result.issues instanceof options.ermRest.UnsupportedFilters).toBe(true, "issues type missmatch");
                            expect(result.issues.subMessage).toEqual("");
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    // 2. testing the case where no facet remains
                    it("if the filter in url can be turned into facet, should turn it to facet and properly ignore it.", function (done) {
                        var invalidURL = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableMain + "/invalid_column_that_doesnt_exist=1234";
                        options.ermRest.resolve(invalidURL).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function (result) {
                            expect(result.facetColumns.length).toBe(27, "length missmatch.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main",
                                "path missmatch."
                            );
                            expect(result.issues).toBeDefined("issues was not defined");
                            expect(result.issues instanceof options.ermRest.UnsupportedFilters).toBe(true, "issues type missmatch");
                            expect(result.issues.subMessage).toEqual("");
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    // 3 - 9
                    it("should validate filters and ignore the invalid ones.", function (done) {
                        facetObj = {
                            "and": [
                                //3
                                { "sourcekey": "invalid_sourcekey_that_doesnt_exist", "choices": ["test1"] },
                                //4
                                { "sourcekey": "path_to_path_prefix_o1_o1_entity", "markdown_name": "Name 4", "entity": false, "choices": ["test2"] },
                                //5
                                {
                                    "sourcekey": "path_to_path_prefix_o1_o1",
                                    "source_domain": {
                                        "table": "some_invalid_table",
                                        "schema": "some_invalid_schema",
                                        "column": "some_invalid_column"
                                    },
                                    "choices": [
                                        "1"
                                    ]
                                },
                                //6
                                {
                                    "sourcekey": "path_to_path_prefix_o1_o1",
                                    "source_domain": {
                                        "table": "table_w_alt"
                                    },
                                    "choices": ["test3"]
                                },
                                //7
                                {
                                    "sourcekey": "id_source_definition",
                                    "source_domain": {
                                        "column": "text_col"
                                    },
                                    "choices": ["v1", "v2"]
                                },
                                //8
                                {
                                    "sourcekey": "second_path_source_defnition",
                                    "source_domain": {
                                        "schema": "faceting_schema",
                                        "table": "secondpath_2",
                                        "column": "id"
                                    },
                                    "choices": [213145, 213147]
                                },
                                //9
                                {
                                    "sourcekey": "second_path_source_defnition",
                                    "markdown_name": "Name 9",
                                    "source_domain": {
                                        "schema": "faceting_schema",
                                        "table": "secondpath_2",
                                        "column": "id"
                                    },
                                    "choices": ["som_val_1", "some_val_2"]
                                },
                                //10
                                {
                                    "sourcekey": "path_to_f3_id",
                                    "markdown_name": "f3 name",
                                    "source_domain": {
                                        "schema": "faceting_schema",
                                        "table": "f3",
                                        "column": "term"
                                    },
                                    "choices": ["one", "not_found", "three", "another_not_found"]
                                }
                            ]
                        };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (res) {
                            ref = res;
                            return ref.generateFacetColumns();
                        }).then(function (result) {
                            // it's adding one
                            expect(result.facetColumns.length).toBe(28, "length missmatch.");
                            expect(ref.location.facets).toBeDefined("facets is undefined.");
                            expect(ref.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/text_col=any(v1,v2)/$M/" +
                                "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/id=any(1,3)/$M/" +
                                "M_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=1/$M/" +
                                "$M_P1/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=test2/$M",
                                "path missmatch."
                            );
                            expect(result.issues).toBeDefined("issues was not defined");
                            expect(result.issues instanceof options.ermRest.UnsupportedFilters).toBe(true, "issues type missmatch");
                            var expectedSubMessage = "Discarded facets:\n\n";
                            expectedSubMessage += "- invalid_sourcekey_that_doesnt_exist (1 choice):\n";
                            expectedSubMessage += "  - test1\n";
                            expectedSubMessage += "- Name 4 (1 choice):\n";
                            expectedSubMessage += "  - test2\n";
                            expectedSubMessage += "- path_to_path_prefix_o1_o1 (1 choice):\n";
                            expectedSubMessage += "  - test3\n";
                            expectedSubMessage += "- second_path_source_defnition (2 choices):\n";
                            expectedSubMessage += "  - 213145\n";
                            expectedSubMessage += "  - 213147\n";
                            expectedSubMessage += "- Name 9 (2 choices):\n";
                            expectedSubMessage += "  - som_val_1\n";
                            expectedSubMessage += "  - some_val_2\n\n\n";
                            expectedSubMessage += "Partially discarded facets:\n\n";
                            expectedSubMessage += "- f3 name (2/4 choices):\n";
                            expectedSubMessage += "  - not_found\n";
                            expectedSubMessage += "  - another_not_found\n";

                            expect(result.issues.subMessage).toEqual(expectedSubMessage);
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

            });

            describe("regarding alternative tables for main table, ", function () {
                // TODO: We need to rewrite this testcase because of system columns
                xit("if main table has an alternative for compact and not for detailed, we should add linkage from main to alternative to all the detailed related entities.", function (done) {
                    options.ermRest.resolve(createURL(tableWAlt)).then(function (ref) {
                        ref = ref.contextualize.compact;
                        var facetColumns = ref.facetColumns;
                        expect(facetColumns.length).toBe(2, "length missmatch.");
                        checkFacetSource("index=0, ", facetColumns[0], [{ "outbound": ["faceting_schema", "alt_compact_fk2"] }, "id_f5"]);
                        checkFacetSource("index=1, ", facetColumns[1], [{ "outbound": ["faceting_schema", "alt_compact_fk1"] }, { "inbound": ["faceting_schema", "f6_fk1"] }, "id_f6"]);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });

            describe("regarding alternative tables for any of facets (table used in faceting is not what we should display for compact/select), ", function () {
                it("if facet is in scalar mode, should not change the facet and just add it.", function (done) {
                    options.ermRest.resolve(createURL(tableWFacetAlt)).then(function (ref) {
                        ref = ref.contextualize.compact;
                        expect(ref.facetColumns.length).toBe(2, "length missmatch.");
                        checkFacetSource(
                            "index=0",
                            ref.facetColumns[0],
                            [{ "inbound": ["faceting_schema", "f8_fk1"] }, "id_f8_2"]
                        );
                        checkFacetSource(
                            "index=1",
                            ref.facetColumns[1],
                            [{ "inbound": ["faceting_schema", "f7_fk1"] }, "col"]
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                // for testing the rest of the cases, I'm relying on the logic that we have for merging facets in url with the annotation,
                // I did this to separate the test cases. otherwise there would have been just one `it` statement that
                // was testing the number of expected facet columns:

                it("otherwise, if facet is based on an alternative table, we should discard it.", function (done) {
                    // facet path ends up in an alternative table, but for compact/select we should go to another table
                    // we're not handling this now.
                    acetObj = { "and": [{ "source": [{ "inbound": ["faceting_schema", "f7_fk1"] }, { "outbound": ["faceting_schema", "f7_detailed_alt_fk1"] }, "id_f8_1"], "choices": ["1"] }] };
                    options.ermRest.resolve(createURL(tableWFacetAlt, facetObj)).then(function (ref) {
                        ref = ref.contextualize.compact;
                        expect(ref.facetColumns.length).toBe(2);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });

                });

                describe("otherwise, if facet is based on main table and has alternative table for compact/select.", function () {
                    it("if filter is based on the key, add the join to path.", function (done) {
                        facetObj = { "and": [{ "source": [{ "inbound": ["faceting_schema", "f7_fk1"] }, "id_f7"], "choices": ["1"] }] };
                        options.ermRest.resolve(createURL(tableWFacetAlt, facetObj)).then(function (ref) {
                            ref = ref.contextualize.compact;
                            expect(ref.facetColumns.length).toBe(3, "length missmatch.");
                            checkFacetSource(
                                "",
                                ref.facetColumns[2],
                                [{ "inbound": ["faceting_schema", "f7_fk1"] }, { "inbound": ["faceting_schema", "f7_compact_alt_fk1"] }, "id"]
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });

                    it("in othercases, we should just discard the facet.", function (done) {
                        facetObj = { "and": [{ "source": [{ "inbound": ["faceting_schema", "f8_fk1"] }, "id_f8_1"], "choices": ["1"] }] };
                        options.ermRest.resolve(createURL(tableWFacetAlt, facetObj)).then(function (ref) {
                            ref = ref.contextualize.compact;
                            expect(ref.facetColumns.length).toBe(2);
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });

            });
        });

        describe('Reference.removeAllFacetFilters, ', function () {
            var ref;
            beforeAll(function () {
                ref = refWCustomFilters.facetColumns[0].addChoiceFilters(["1"]);
            });

            it("should return all facets and filters if input is not true.", function () {
                var newRef = ref.removeAllFacetFilters();
                expect(newRef).not.toBe(ref, "reference didn't change.");
                expect(ref.location.facets).toBeDefined("original reference changed.");
                expect(newRef.location.filter).toBeUndefined("filter missmatch.");
                expect(newRef.location.facets).toBeUndefined("facets was defined.");
                expect(newRef.facetColumns.filter(function (f) {
                    return f.filters.length !== 0;
                }).length).toBe(0, "some of the facetColumns have facet.");
            });

            it("otherwise should only remove the filters.", function () {
                var newRef = ref.removeAllFacetFilters(false, false, true);
                expect(newRef).not.toBe(ref, "reference didn't change.");
                expect(ref.location.filtersString).toBeDefined("original reference changed.");
                expect(newRef.location.filter).toBeUndefined("filter missmatch.");
                expect(newRef.location.facets).toBeDefined("facets missmatch.");
                expect(JSON.stringify(newRef.location.facets.decoded)).toEqual(JSON.stringify(
                    { and: [{ "source": "id", "choices": ["1"] }] }
                ));
            });
        });

        describe("Reference.hideFacets", function () {
            it("should throw an error if the reference doesn't have any facets.", function (done) {
                options.ermRest.resolve(createURL(tableMain), { cid: "test" }).then(function (ref) {
                    expect(function () {
                        var h = ref.hideFacets();
                    }).toThrow("Reference doesn't have any facets.");
                    done();
                }).catch(function (err) {
                    done.fail(err);
                })
            });

            var refWithHiddenFacets;
            it("should return a reference with same facets but hidden.", function () {
                refWithHiddenFacets = refMain.hideFacets();
                refWithHiddenFacets.facetColumns.forEach(function (f, index) {
                    expect(f.filters).toEqual([], 'fitlers missmatch index=' + index);
                });

                expect(refWithHiddenFacets.location.ermrestCompactPath).toBe(
                    "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M",
                    "path missmatch."
                );
            });

            it("should be able to add new filters to the reference that are not hidden.", function () {
                var newRef = refWithHiddenFacets.facetColumns[0].addChoiceFilters(["2"]);
                expect(newRef.facetColumns[0].filters.length).toEqual(1, "filters length missmatch");
                expect(newRef.location.ermrestCompactPath).toBe(
                    "M:=faceting_schema:main/id=2/$M/id=1/$M/int_col::geq::-2/$M",
                    "path missmatch."
                );
            });

            it("removeAllFacetFilters should not remove hidden facets.", function () {
                var newRef = refWithHiddenFacets.removeAllFacetFilters();
                expect(newRef.facetColumns[0].filters.length).toEqual(0, "filters length missmatch");
                expect(newRef.location.ermrestCompactPath).toBe(
                    "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M",
                    "path missmatch."
                );
            });
        })

        describe("FacetColumn APIs, ", function () {
            describe("isOpen, ", function () {
                it("should return true if facet has filters.", function () {
                    expect(mainFacets[0].isOpen).toBe(true, "missmatch for id.");
                    expect(mainFacets[1].isOpen).toBe(true, "missmatch for int_col.");
                });

                it("otherwise should return true if facet object has `open:true`.", function () {
                    expect(mainFacets[11].isOpen).toBe(true);
                });

                it("otherwise should return false.", function () {
                    for (i = 2; i < 11; i++) {
                        expect(mainFacets[i].isOpen).toBe(false, "missmatch for facet index=" + i);
                    }

                    for (i = 14; i < 20; i++) {
                        expect(mainFacets[i].isOpen).toBe(false, "missmatch for facet index=" + i);
                    }
                });
            });

            describe("isEntityMode, ", function () {
                it('should return false if source is not a path.', function () {
                    for (i = 0; i < 7; i++) {
                        expect(mainFacets[i].isEntityMode).toBe(false, "missmatch for facet index=" + i);
                    }
                });

                it('should return false if source is an array, but filter is not based on simple key.', function () {
                    expect(mainFacets[12].isEntityMode).toBe(false);
                });

                it('should return false if source is based on simple key, and `entity:false` is set.', function () {
                    expect(mainFacets[13].isEntityMode).toBe(false);
                });

                it('should return true if source is based on simple key.', function () {
                    for (i = 10; i < 12; i++) {
                        expect(mainFacets[i].isEntityMode).toBe(true, "missmatch for facet index=" + i);
                    }
                });
            });

            describe("preferredMode, ", function () {
                it("if facet has check_presence mode in annotation and also null, should return check_presence.", function () {
                    var newRef = mainFacets[13].addChoiceFilters([null]);
                    expect(newRef.facetColumns[13].preferredMode).toBe("check_presence");
                });

                it('if facet has preselected choices or ranges facet, honor it.', function () {
                    expect(mainFacets[0].preferredMode).toBe("choices", "missmatch for facet index=0");
                    expect(mainFacets[1].preferredMode).toBe("ranges", "missmatch for facet index=0");
                });

                it('if ux_mode is defined and is valid, should return it.', function () {
                    expect(mainFacets[8].preferredMode).toBe("ranges", "missmatch for facet index=8");
                    expect(mainFacets[13].preferredMode).toBe("check_presence", "missmatch for facet index=13");
                });


                it("if in entity mode should return `choices`.", function () {
                    [10, 11, 15, 16, 18].forEach(function (fc) {
                        expect(mainFacets[fc].preferredMode).toBe("choices", "missmatch for facet index=" + fc);
                    });
                });

                it("if unique not-null int/serial, should return `choices`.", function () {
                    expect(mainFacets[17].preferredMode).toBe("choices", "missmatch for facet index=17");
                });

                it("if its a range supported type, should return ranges.", function () {
                    for (i = 2; i <= 4; i++) {
                        expect(mainFacets[i].preferredMode).toBe("ranges", "missmatch for facet index=" + i);
                    }
                    // numeric type
                    expect(mainFacets[19].preferredMode).toBe("ranges", "missmatch for facet index=19");

                    //int in path
                    expect(mainFacets[20].preferredMode).toBe("ranges", "missmatch for facet index=20");
                });

                it("otherwise should return choices.", function () {
                    [5, 6, 7, 9, 12, 14].forEach(function (fc) {
                        expect(mainFacets[fc].preferredMode).toBe("choices", "missmatch for facet index=" + fc);
                    });
                });
            });

            describe("displayname, ", function () {

                it("if `markdown_name` is defined, should return it.", function () {
                    checkMainFacetDisplayname(0, "ID facet", true);
                    checkMainFacetDisplayname(2, "float_col markdown_name", true);
                    checkMainFacetDisplayname(10, "<strong>F1</strong>", true);
                });

                it("if source is not an array, should return the column's displayname.", function () {
                    checkMainFacetDisplayname(1, "int_col", false);
                    checkMainFacetDisplayname(3, "date_col", false);
                    checkMainFacetDisplayname(4, "timestamp_col", false);
                    checkMainFacetDisplayname(5, "text_col", false);
                    checkMainFacetDisplayname(6, "longtext_col", false);
                    checkMainFacetDisplayname(7, "markdown_col", false);
                });

                describe('otherwise (source is an array), ', function () {
                    it('if the last foreignKey in path is inbound, and from_name is defined, should return it.', function () {
                        checkMainFacetDisplayname(14, "from_name", false);
                    });

                    it('if the last foreignKey in path is outbound, and to_name is defined, should return it.', function () {
                        checkMainFacetDisplayname(11, "to_name", false);
                    });

                    describe("otherwise, ", function () {
                        it('in entity mode should return the table\'s name.', function () {
                            checkMainFacetDisplayname(15, "secondpath_2", false);
                        });
                        it('in scalar mode, should return the table\'s name and column\'s name.', function () {
                            checkMainFacetDisplayname(12, "f3 (term)", false);
                        });
                    });
                });
            });

            describe("comment", function () {
                it("return the comment defined on the facet.", function () {
                    expect(mainFacets[6].comment).toBe("long text comment in facet");
                });

                it("return empty string if the defined comment is `false`.", function () {
                    expect(mainFacets[7].comment).toBe("", "missmatch for index=7");
                    expect(mainFacets[10].comment).toBe("", "missmatch for index=10");
                });

                it('if in scalar mode, return column\'s comment', function () {
                    expect(mainFacets[5].comment).toBe("text comment");
                });

                it('otherwise return table\'s comment.', function () {
                    expect(mainFacets[11].comment).toBe("has fk to main table + has rowname");
                });
            });

            describe('filter related APIs, ', function () {
                describe("addSearchFilter, ", function () {
                    it("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[5].addSearchFilter(null);
                        }).toThrow("`term` is required.");
                    });

                    it("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[5].addSearchFilter("test");
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/text_col::ciregexp::test/$M",
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[5].filters.length).toBe(1, "filters length missmatch.");
                        expect(newRef.facetColumns[5].filters[0].term).toBe("test", "filter term missmatch.");
                    });
                });

                describe("addChoiceFilters, ", function () {
                    it("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].addChoiceFilters("2");
                        }).toThrow("given argument must be an array");
                    });

                    it("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[0].addChoiceFilters(["2", "3"]);
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=any(1,2,3)/$M/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(3, "filters length missmatch.");
                        expect(newRef.facetColumns[0].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["1", "2", "3"], "filter terms missmatch.");
                    });

                    it("should handle facets with path.", function () {
                        var ref = mainFacets[10].addChoiceFilters(["1", "2"]);
                        expect(ref).not.toBe(refMain, "reference didn't change.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/(fk_to_f1)=(faceting_schema:f1:id)/id=any(1,2)/$M",
                            "path missmatch."
                        );
                        expect(ref.facetColumns[10].filters.length).toBe(2, "filters length missmatch.");
                        expect(ref.facetColumns[10].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["1", "2"], "filter terms missmatch.");
                    });

                });

                describe("replaceAllChoiceFilters, ", function () {
                    it("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].replaceAllChoiceFilters("2");
                        }).toThrow("given argument must be an array");
                    });

                    it("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[0].replaceAllChoiceFilters(["2", "3"]);
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=any(2,3)/$M/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(2, "filters length missmatch.");
                        expect(newRef.facetColumns[0].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["2", "3"], "filter terms missmatch.");
                    });
                });

                describe("removeChoiceFilters, ", function () {
                    it("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].removeChoiceFilters("2");
                        }).toThrow("given argument must be an array");
                    });

                    it("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[0].removeChoiceFilters(["1", "3"]);
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(0, "filters length missmatch.");
                    });
                });

                var refWithMin, refWithMax, refWithMinMax, refWithMinExcMax, refWithMinExcMaxAndMinMax;
                describe("addRangeFilter, ", function () {
                    var testAddRange = function (min, minExclusive, max, maxExclusive, path, message, reference) {
                        var ref = refMain;
                        if (reference) ref = reference;
                        var res = ref.facetColumns[0].addRangeFilter(min, minExclusive, max, maxExclusive);
                        expect(res.reference).not.toBe(refMain, "reference didn't change " + (message ? message : "."));
                        expect(res.reference.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1;" + path + "/$M/int_col::geq::-2/$M",
                            "path missmatch " + (message ? message : ".")
                        );
                        expect(res.reference.facetColumns[0].filters.length).toBe(2, "filters length missmatch " + (message ? message : "."));
                        return res.reference;
                    };

                    it("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].addRangeFilter();
                        }).toThrow("One of min and max must be defined.");
                    });

                    describe("should return a new reference with the applied filter.", function () {
                        it("when passing only min.", function () {
                            testAddRange("1", false, null, false, "id::geq::1");
                        });

                        it("when passing only max.", function () {
                            testAddRange(null, false, "1", false, "id::leq::1");
                        });

                        it("when passing both min, and max.", function () {
                            testAddRange("1", false, "2", false, "id::geq::1&id::leq::2");
                        });

                    });

                    it("should handle facets with path.", function () {
                        var ref = mainFacets[3].addRangeFilter("2014-03-03", false, "2016-07-11", false).reference;
                        expect(ref).not.toBe(refMain, "reference didn't change.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/date_col::geq::2014-03-03&date_col::leq::2016-07-11/$M",
                            "path missmatch."
                        );
                        expect(ref.facetColumns[3].filters.length).toBe(1, "filters length missmatch.");
                        expect(ref.facetColumns[3].filters[0].toString()).toBe("2014-03-03 to 2016-07-11", "toString missmatch.");
                    });

                    describe("should handle exclusive/inclusive ranges.", function () {
                        it("when passing only min.", function () {
                            refWithMin = testAddRange("1", true, null, false, "id::gt::1");
                        });

                        it("when passing only max.", function () {
                            refWithMax = testAddRange(null, false, "1", true, "id::lt::1");
                        });

                        it("when passing both min, and max inclusive.", function () {
                            refWithMinMax = testAddRange("1", true, "2", true, "id::gt::1&id::lt::2");
                        });

                        it("when passing min and max with exclusive flag.", function () {
                            refWithMinExcMax = testAddRange("1", true, "2", false, "id::gt::1&id::leq::2", "for min exclusive");
                            refWithMinMaxExc = testAddRange("1", false, "2", true, "id::geq::1&id::lt::2", "for max exclusive");
                            refWithMinExcMaxExc = testAddRange("1", true, "2", true, "id::gt::1&id::lt::2", "for min and max exclusive");
                        });
                    });

                    describe("should handle adding duplciate filters.", function () {
                        it("when passing only min.", function () {
                            expect(refWithMin.facetColumns[0].addRangeFilter("1", true, null, false)).toBe(false);
                        });

                        it("when passing only max.", function () {
                            expect(refWithMax.facetColumns[0].addRangeFilter(null, false, "1", true)).toBe(false);
                        });

                        it("when passing both min, and max.", function () {
                            expect(refWithMinMax.facetColumns[0].addRangeFilter("1", true, "2", true)).toBe(false);
                        });

                        it("when passing min and max with exclusive flag.", function () {
                            expect(refWithMinExcMax.facetColumns[0].addRangeFilter("1", true, "2", false)).toBe(false, "for min exclusive");
                            expect(refWithMinMaxExc.facetColumns[0].addRangeFilter("1", false, "2", true)).toBe(false, "for max exclusive");
                            expect(refWithMinExcMaxExc.facetColumns[0].addRangeFilter("1", true, "2", true)).toBe(false, "for min and max exclusive");
                        });

                        it('and take exclusive attributes into account.', function () {
                            var res = refWithMinExcMax.facetColumns[0].addRangeFilter("1", false, "2", false);
                            refWithMinExcMaxAndMinMax = res.reference;
                            expect(res.reference).not.toBe(refWithMinExcMax, "reference didn't change.");
                            expect(res.reference.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/id=1;id::gt::1&id::leq::2;id::geq::1&id::leq::2/$M/int_col::geq::-2/$M",
                                "path missmatch."
                            );
                            expect(res.reference.facetColumns[0].filters.length).toBe(3, "filters length missmatch.");
                        });
                    });
                });
                describe("removeRangeFilter, ", function () {
                    it("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[1].removeRangeFilter();
                        }).toThrow("One of min and max must be defined.");
                    });

                    it("should return a new reference with the new filter.", function () {
                        var res = refMain.facetColumns[1].removeRangeFilter(-2, false, null, false);
                        expect(res.reference).not.toBe(refMain, "reference didn't change.");
                        expect(res.reference.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M",
                            "path missmatch."
                        );
                        expect(res.reference.facetColumns[1].filters.length).toBe(0, "filters length missmatch.");
                    });

                    it('should handle exclusive/inclusive ranges.', function () {
                        var res = refWithMinExcMaxAndMinMax.facetColumns[0].removeRangeFilter("1", false, "2", false);
                        expect(res.reference).not.toBe(refWithMinExcMaxAndMinMax, "reference didn't change.");
                        expect(res.reference.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1;id::gt::1&id::leq::2/$M/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(res.reference.facetColumns[0].filters.length).toBe(2, "filters length missmatch.");
                    });
                });

                describe("addNotNullFilter, ", function () {
                    it("should remove all the existing filters on the facet and just add a not-null filter.", function () {
                        refNotNullFilter = mainFacets[0].addNotNullFilter();
                        expect(refNotNullFilter).not.toBe(refMain, "reference didn't change.");
                        expect(refNotNullFilter.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/!(id::null::)/$M/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(refNotNullFilter.facetColumns[0].filters.length).toBe(1, "filters length missmatch.");
                    });
                });

                describe("removeNotNullFilter, ", function () {
                    it("should only remove the not-null filter on that facet.", function () {
                        var prevRef = refNotNullFilter.facetColumns[0].addChoiceFilters(["1"]);
                        var newRef = prevRef.facetColumns[0].removeNotNullFilter();
                        expect(newRef).not.toBe(prevRef, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(1, "filters length missmatch.");
                    });

                    it("should not change filters of the facet if facet didn't have any not-null filter.", function () {
                        var newRef = mainFacets[0].removeNotNullFilter();
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M",
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(1, "filters length missmatch.");
                    });
                });

                it("removeAllFilters, should return a reference without filters of the given facet.", function () {
                    var newRef = refMain.facetColumns[0].removeAllFilters();
                    expect(newRef).not.toBe(refMain, "reference didn't change.");
                    expect(newRef.location.ermrestCompactPath).toBe(
                        "M:=faceting_schema:main/int_col::geq::-2/$M",
                        "path missmatch."
                    );
                    expect(newRef.facetColumns[0].filters.length).toBe(0, "filters length missmatch for index=0.");
                    expect(newRef.facetColumns[1].filters.length).toBe(1, "filters length missmatch for index=1.");
                });

                describe("filters, ", function () {
                    it("otherwise should return all the filters available on the facetColumn.", function () {
                        for (i = 0; i < 2; i++) {
                            expect(mainFacets[i].filters.length).toBe(1, "missmatch for facet index=" + i);
                        }
                        expect(mainFacets[0].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["1"], "filter missmatch for facet index=0");

                        for (i = 2; i < 20; i++) {
                            expect(mainFacets[i].filters.length).toBe(0, "missmatch for facet index=" + i);
                        }
                    });
                });

                it("searchFilters, should return the search filters.", function () {
                    var filters = refMainMoreFilters.facetColumns[5].searchFilters;
                    expect(filters.length).toBe(2, "length missmatch.");
                    expect(filters[0].term).toBe("a", "term index=0 missmatch.");
                    expect(filters[1].term).toBe("b", "term index=0 missmatch.");
                });

                it("choiceFilters, should return the choice filters.", function () {
                    var filters = refMainMoreFilters.facetColumns[5].choiceFilters;
                    expect(filters.length).toBe(2, "length missmatch.");
                    expect(filters[0].term).toBe("a", "term index=0 missmatch.");
                    expect(filters[1].term).toBe("b", "term index=0 missmatch.");
                });

                it("rangeFilters, should return the range filters.", function () {
                    var filters = refMainMoreFilters.facetColumns[5].rangeFilters;
                    expect(filters.length).toBe(2, "length missmatch.");
                    expect(filters[0].toString()).toBe("≥ a", "term index=0 missmatch.");
                    expect(filters[1].toString()).toBe("≤ b", "term index=0 missmatch.");
                });

                describe("hasNotNullFilter,", function () {
                    var newRef;
                    it('should return true if facet has not-null filter', function () {
                        newRef = mainFacets[0].addNotNullFilter().contextualize.detailed;
                        expect(newRef.facetColumns[0].hasNotNullFilter).toEqual(true);
                    });

                    it("otherwise it should return false.", function () {
                        expect(mainFacets[0].hasNotNullFilter).toEqual(false);
                    });
                });

                describe("hasNullFilter, ", function () {
                    var newRef;
                    it('should return true if facet has null filter', function () {
                        newRef = mainFacets[0].addChoiceFilters([null]).contextualize.detailed;
                        expect(newRef.facetColumns[0].hasNullFilter).toEqual(true);
                    });

                    it("otherwise it should return false.", function () {
                        expect(mainFacets[0].hasNullFilter).toEqual(false);
                    });
                });

                describe("FacetFilter attributes, ", function () {
                    it("toString should return the appropriate value.", function () {
                        expect(refMainMoreFilters.facetColumns[5].choiceFilters[0].toString()).toBe("a", "missmatch for choices");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[0].toString()).toBe("≥ a", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[1].toString()).toBe("≤ b", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].searchFilters[0].toString()).toBe("a", "missmatch for search");

                    });

                    it("uniqueId should return the appropriate value.", function () {
                        expect(refMainMoreFilters.facetColumns[5].choiceFilters[0].uniqueId).toBe("a", "missmatch for choices");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[0].uniqueId).toBe("≥ a", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[1].uniqueId).toBe("≤ b", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].searchFilters[0].uniqueId).toBe("a", "missmatch for search");
                    });

                    it("term should return the appropriate value for search and choices.", function () {
                        expect(refMainMoreFilters.facetColumns[5].choiceFilters[0].term).toBe("a", "missmatch for choices");
                        expect(refMainMoreFilters.facetColumns[5].searchFilters[0].term).toBe("a", "missmatch for search");
                    });

                    it("min and max should return the appropriate value for ranges.", function () {
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[0].min).toBe("a", "missmatch for min index=0");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[0].max).toBe(null, "missmatch for max index=0");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[1].min).toBe(null, "missmatch for min index=1");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[1].max).toBe("b", "missmatch for max index=1");
                    });
                });

                describe("For different column types, ", function () {
                    describe("regarding boolean,", function () {
                        var newRef;
                        it("addChoiceFilters should be able to handle true, false, and null.", function () {
                            newRef = refMain.facetColumns[8].addChoiceFilters([true, false, null]);
                            expect(newRef).not.toBe(refMain, "reference didn't change.");
                            expect(newRef.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/boolean_col=any(true,false);boolean_col::null::/$M",
                                "path missmatch."
                            );
                            expect(newRef.facetColumns[8].filters.length).toBe(3, "filters length missmatch.");
                            expect(newRef.facetColumns[8].filters[0].term).toBe(true, "filter term missmatch for true.");
                            expect(newRef.facetColumns[8].filters[0].uniqueId).toBe(true, "filter uniqueId missmatch for true.");
                            expect(newRef.facetColumns[8].filters[0].toString()).toBe("YES", "filter toString missmatch for true.");

                            expect(newRef.facetColumns[8].filters[1].term).toBe(false, "filter term missmatch for false.");
                            expect(newRef.facetColumns[8].filters[1].uniqueId).toBe(false, "filter uniqueId missmatch for false.");
                            expect(newRef.facetColumns[8].filters[1].toString()).toBe("NO", "filter toString missmatch for false.");

                            expect(newRef.facetColumns[8].filters[2].term).toBe(null, "filter term missmatch for null.");
                            expect(newRef.facetColumns[8].filters[2].uniqueId).toBe(null, "filter uniqueId missmatch for null.");
                            expect(newRef.facetColumns[8].filters[2].toString()).toBe(null, "filter toString missmatch for null.");
                        });

                        it("removeChoiceFilters should be able to handle true, false, and null.", function () {
                            newRef = newRef.facetColumns[8].removeChoiceFilters([true]);
                            expect(newRef.facetColumns[8].filters.length).toBe(2, "filters didn't change.");
                        });

                    });

                    describe("regarding json/jsonb,", function () {
                        var newRef;
                        var testJSONFilter = function (object, urlEncodedObject) {
                            newRef = refMain.facetColumns[9].addChoiceFilters([object]);
                            expect(newRef).not.toBe(refMain, "reference didn't change.");
                            expect(newRef.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/jsonb_col=" + urlEncodedObject + "/$M",
                                "path missmatch."
                            );
                            expect(newRef.facetColumns[9].filters.length).toBe(1, "filters length missmatch.");

                            expect(JSON.stringify(newRef.facetColumns[9].filters[0].term)).toEqual(JSON.stringify(object), "filter term missmatch for true.");
                            expect(JSON.stringify(newRef.facetColumns[9].filters[0].uniqueId)).toBe(JSON.stringify(object), "filter uniqueId missmatch for true.");
                            expect(newRef.facetColumns[9].filters[0].toString()).toBe(JSON.stringify(object, null, 2), "filter toString missmatch for true.");

                            newRef = newRef.facetColumns[9].removeChoiceFilters([object]);
                            expect(newRef.facetColumns[9].filters.length).toBe(0, "filters didn't change.");
                        };

                        describe("filter manipulation functions should be able to add any json values and parse should serialize it correctly.", function () {
                            it("Having object as the value.", function () {
                                testJSONFilter({ "key": "one" }, "%7B%22key%22%3A%22one%22%7D");
                            });

                            it("Having array as the value.", function () {
                                testJSONFilter(["key", "one"], "%5B%22key%22%2C%22one%22%5D");
                            });

                            it("Having number as the value.", function () {
                                testJSONFilter(1234, "1234");
                            });

                            it("having string literal of integer as value.", function () {
                                testJSONFilter("1234", "%221234%22");
                            });

                            it("Having string literal as the value.", function () {
                                testJSONFilter("value", "%22value%22");
                            });

                            it("Having boolean as the value.", function () {
                                testJSONFilter(true, "true");
                            });
                        });

                        describe("filter manipulation functions should be able to handle null value.", function () {
                            it("when null is given as javascript `null`.", function () {
                                newRef = refMain.facetColumns[9].addChoiceFilters([null]);

                                expect(newRef).not.toBe(refMain, "reference didn't change.");
                                expect(newRef.location.ermrestCompactPath).toBe(
                                    "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/jsonb_col=null;jsonb_col::null::/$M",
                                    "path missmatch."
                                );
                                expect(newRef.facetColumns[9].filters.length).toBe(1, "filters length missmatch.");

                                expect(newRef.facetColumns[9].filters[0].term).toEqual(null, "filter term missmatch for true.");
                                expect(newRef.facetColumns[9].filters[0].uniqueId).toBe(null, "filter uniqueId missmatch for true.");
                                expect(newRef.facetColumns[9].filters[0].toString()).toBe(null, "filter toString missmatch for true.");

                                newRef = newRef.facetColumns[9].removeChoiceFilters([null]);
                                expect(newRef.facetColumns[9].filters.length).toBe(0, "filters didn't change.");
                            });

                            it("when null is given as javascript string '`null`'", function () {
                                newRef = refMain.facetColumns[9].addChoiceFilters(["null"]);

                                expect(newRef).not.toBe(refMain, "reference didn't change.");
                                expect(newRef.location.ermrestCompactPath).toBe(
                                    "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/jsonb_col=null;jsonb_col::null::/$M",
                                    "path missmatch."
                                );
                                expect(newRef.facetColumns[9].filters.length).toBe(1, "filters length missmatch.");
                            });
                        });

                    });
                });
            });

            describe("sourceReference and column APIs, ", function () {
                it("should have filters of other facet columns, and not filters of itself.", function () {
                    checkSourceReference(
                        "mainTable, index=0",
                        refMainMoreFilters.facetColumns[0],
                        "M:=faceting_schema:main/int_col::geq::-2/$M/text_col=any(a,b);text_col::geq::a;text_col::leq::b;text_col::ciregexp::a;text_col::ciregexp::b/$M",
                        "id"
                    );

                    checkSourceReference(
                        "mainTable, index=1",
                        refMainMoreFilters.facetColumns[1],
                        "M:=faceting_schema:main/id=1/$M/text_col=any(a,b);text_col::geq::a;text_col::leq::b;text_col::ciregexp::a;text_col::ciregexp::b/$M",
                        "int_col"
                    );

                    checkSourceReference(
                        "mainTable, index =5",
                        refMainMoreFilters.facetColumns[5],
                        "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M",
                        "text_col"
                    );
                });

                it("should have the search term from the reference.", function () {
                    checkSourceReference(
                        "secondpath_2, index=0",
                        refSP2.facetColumns[0],
                        "M:=faceting_schema:secondpath_2/*::ciregexp::term",
                        "id"
                    );

                    var ref = refMain.search("sometext");
                    checkSourceReference(
                        "mainTable, index=0, with search",
                        ref.facetColumns[5],
                        "M:=faceting_schema:main/*::ciregexp::sometext/id=1/$M/int_col::geq::-2/$M",
                        "text_col"
                    );
                });

                it('should handle filters on columns with path.', function () {
                    checkSourceReference(
                        "mainTable with filter on FK, index = 11",
                        refMainFilterOnFK.facetColumns[11],
                        "T:=faceting_schema:main/id=1/$T/int_col::geq::-2/$T/M:=(fk_to_f2)=(faceting_schema:f2:id)",
                        "id"
                    );

                    checkSourceReference(
                        "mainTable with filter on FK, index = 0",
                        refMainFilterOnFK.facetColumns[0],
                        "M:=faceting_schema:main/int_col::geq::-2/$M/(fk_to_f2)=(faceting_schema:f2:id)/id=any(2,3)/$M",
                        "id"
                    );
                });

                it("should handle filter (not facet) on the main reference.", function () {
                    var sr = refWCustomFilters.facetColumns[0].sourceReference;
                    expect(sr.location.ermrestCompactPath).toBe("M:=faceting_schema:main/" + unsupportedFilter, "compactPath missmatch.");
                    sr = refWCustomFilters.facetColumns[11].sourceReference;
                    expect(sr.location.ermrestCompactPath).toBe("T:=faceting_schema:main/" + unsupportedFilter + "/M:=(fk_to_f2)=(faceting_schema:f2:id)", "compactPath missmatch.");
                });

                it("should handle custom facet on the main reference.", function (done) {
                    // cfacet: {"displayname": "test", "ermrest_path": "(fk_to_f2)=(faceting_schema:f2:id)/term::ciregexp::test/$M/(fk_to_f1)=(faceting_schema:f1:id)/term::ciregexp::test/$M"}
                    var cfacetBlob = "N4IgJglgzgDgNgQwJ4DsEFsCmIBcIAumU+IANCJgE7qVH4D6MC+AFriABQBmA1vfgHt6XAEwBKALzcEAY0z4IKAOb0oMlpnQIconBDBiA9IWo4cMiLSWYAHjDOFihgCQBZQ9z6DhARknS5BWVVdU1tLh89A2MqdDMLK1t7HEd8F1cQAF8gA";
                    // facet: {"and": [{"source": "id", "choices": [2]}, {"source": "int_col", "ranges": [{"min": -5}]}]}
                    var facetBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaELACxQNyTngCYBdAX2OXWz1kIgBcB9LCgA2IUhkgBzHLQSgAtgQhwAtAFZmLFkA";
                    options.ermRest.resolve(createURL(tableMain) + "/*::facets::" + facetBlob + "/*::cfacets::" + cfacetBlob).then(function (ref) {
                        expect(ref.facetColumns[0].sourceReference.location.ermrestCompactPath).toEqual("M:=faceting_schema:main/int_col::geq::-5/$M/(fk_to_f2)=(faceting_schema:f2:id)/term::ciregexp::test/$M/(fk_to_f1)=(faceting_schema:f1:id)/term::ciregexp::test/$M", "sourceReference index=0 missmatch");
                        expect(ref.facetColumns[11].sourceReference.location.ermrestCompactPath).toEqual("T:=faceting_schema:main/id=2/$T/int_col::geq::-5/$T/(fk_to_f2)=(faceting_schema:f2:id)/term::ciregexp::test/$T/(fk_to_f1)=(faceting_schema:f1:id)/term::ciregexp::test/$T/M:=(fk_to_f2)=(faceting_schema:f2:id)", "sourceReference index=11 missmatch");
                        expect(ref.location.ermrestCompactPath).toEqual("M:=faceting_schema:main/id=2/$M/int_col::geq::-5/$M/(fk_to_f2)=(faceting_schema:f2:id)/term::ciregexp::test/$M/(fk_to_f1)=(faceting_schema:f1:id)/term::ciregexp::test/$M", "reference ermrestCompactPath missmatch");
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });
            });

            describe("getChoiceDisplaynames, ", function () {
                var checkChoiceDisplayname = function (objName, obj, uniqueId, value, isHTML) {
                    expect(obj.uniqueId).toEqual(uniqueId, objName + ": uniqueId missmatch.");
                    expect(obj.displayname.value).toEqual(value, objName + ": value missmatch.");
                    expect(obj.displayname.isHTML).toEqual(isHTML, objName + ": isHTMl missmatch.");
                };

                it("should return an empty list, if there are no choice filters.", function (done) {
                    refMain.facetColumns[5].getChoiceDisplaynames().then(function (res) {
                        expect(res.length).toEqual(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should return the list of toStrings in scalar mode.", function (done) {
                    refMainMoreFilters.facetColumns[5].getChoiceDisplaynames().then(function (res) {
                        expect(res.length).toEqual(2, "length missmatch.");
                        checkChoiceDisplayname("index=0", res[0], "a", "a", false);
                        checkChoiceDisplayname("index=1", res[1], "b", "b", false);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should return the list of rownames in entity-mode.", function (done) {
                    refMainFilterOnFK.facetColumns[11].getChoiceDisplaynames().then(function (res) {
                        expect(res.length).toEqual(2, "length missmatch.");
                        checkChoiceDisplayname("index=0", res[0], 2, "<strong>two</strong>", true);
                        checkChoiceDisplayname("index=1", res[1], 3, "<strong>three</strong>", true);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should not return the null filter.", function (done) {
                    var newRef = refMainFilterOnFK.facetColumns[11].addChoiceFilters([null]);
                    newRef.facetColumns[11].getChoiceDisplaynames().then(function (res) {
                        expect(res.length).toEqual(2, "length missmatch.");
                        checkChoiceDisplayname("index=1", res[0], 2, "<strong>two</strong>", true);
                        checkChoiceDisplayname("index=2", res[1], 3, "<strong>three</strong>", true);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("if the given filters are not in database, should just return the raw values.", function (done) {
                    var newRef = refMainFilterOnFK.facetColumns[11].addChoiceFilters([8888, 5, 4, 7777]);
                    newRef.facetColumns[11].getChoiceDisplaynames().then(function (res) {
                        expect(res.length).toEqual(6, "length missmatch.");
                        checkChoiceDisplayname("index=1", res[0], 2, "<strong>two</strong>", true);
                        checkChoiceDisplayname("index=2", res[1], 3, "<strong>three</strong>", true);
                        checkChoiceDisplayname("index=3", res[2], 4, "<strong>four</strong>", true);
                        checkChoiceDisplayname("index=4", res[3], 5, "<strong>five</strong>", true);
                        checkChoiceDisplayname("index=5", res[4], 8888, "8888", false);
                        checkChoiceDisplayname("index=6", res[5], 7777, "7777", false);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });

            describe("hideNumOccurrences, ", function () {
                it('should return false if hide_num_occurrences is not `true`.', function () {
                    expect(mainFacets[0].hideNumOccurrences).toBe(false, "missmatch for index=0");
                    expect(mainFacets[2].hideNumOccurrences).toBe(false, "missmatch for index=2");
                });

                it("otherwise should return true.", function () {
                    expect(mainFacets[1].hideNumOccurrences).toBe(true, "missmatch for index=1");
                    expect(mainFacets[7].hideNumOccurrences).toBe(true, "missmatch for index=7");
                });
            });

            describe("hideNullChoice, ", function () {
                var testHideNullChoice = function (indices, res) {
                    indices.forEach(function (index) {
                        expect(mainFacets[index].hideNullChoice).toBe(res, "missmatch for index=" + index);
                    })
                }

                var newRefWithNull;
                beforeAll(function () {
                    newRefWithNull = mainFacets[15].addChoiceFilters([null]).contextualize.detailed;
                });

                it("should return `false` if facet has null.", function () {
                    expect(newRefWithNull.facetColumns[15].hideNullChoice).toBe(false, "missmatch for index=10");
                });

                it("should return `true` if hide_null_choice is set to `true`.", function () {
                    testHideNullChoice([10, 15], true);
                });

                it ("should return `true` if there are filters in the source definition", function () {
                    testHideNullChoice([23, 24, 25, 26], true);
                });

                it("should return `true` if source doesn't have any path and it's not-null.", function () {
                    testHideNullChoice([0], true);
                });

                it("should return `false` if source doesn't have any path and it's nullable.", function () {
                    testHideNullChoice([1, 2, 3, 4, 5, 6, 7, 8, 9, 19], false);
                });

                it("should return `true` if it's an all outbound path with all the columns being not-null.", function () {
                    testHideNullChoice([11], true);
                });

                it("should return `true` if source has a path and column is nullable.", function () {
                    testHideNullChoice([12, 14, 20], true);
                });

                it("should return `false` if column is not nullable, and source has path one and foreignkey can be ignored.", function () {
                    testHideNullChoice([13], false);
                });

                describe("otherwise for facets with column not-null and path, ", function () {
                    it("if any other such facet has null, it should return `true`.", function () {
                        [16, 18].forEach(function (index) {
                            expect(newRefWithNull.facetColumns[index].hideNullChoice).toBe(true, "missmatch for index=" + index);
                        })
                    });

                    it("otherwise should return `false`.", function () {
                        testHideNullChoice([16, 18], false);
                    });
                })
            });

            describe("hideNotNullChoice, ", function () {
                var testHideNotNullChoice = function (indices, res) {
                    indices.forEach(function (index) {
                        expect(mainFacets[index].hideNotNullChoice).toBe(res, "missmatch for index=" + index);
                    });
                };

                var newRefWithNull;
                beforeAll(function () {
                    newRefWithNull = mainFacets[2].addNotNullFilter().contextualize.detailed;
                });

                it("should return `false` if facet has not-null.", function () {
                    expect(newRefWithNull.facetColumns[2].hideNullChoice).toBe(false, "missmatch for index=10");
                });

                it("should return true if hide_not_null_choice is `true`.", function () {
                    testHideNotNullChoice([1, 2, 12], true);
                });

                it("should return `true` if facet doesn't have any path and is not-null.", function () {
                    testHideNotNullChoice([0], true);
                });

                it("should return `true` for all-outbound facets that all the column in path are not-null.", function () {
                    testHideNotNullChoice([10, 11], true);
                });

                it('otherwise should return `false`.', function () {
                    testHideNotNullChoice([3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 20], false);
                });

            });

            describe("sortColumns", function () {
                var testSortColumns = function (returned, expected, message) {
                    expect(returned.length).toBe(expected.length, "length missmatch");
                    expected.forEach(function (e, i) {
                        if (e.num_occurrences) {
                            expect(returned[i].num_occurrences).toBe(e.num_occurrences, "num_occurrences missmatch for i=" + i + message);
                        } else {
                            expect(returned[i].column.name).toBe(e.column, "column missmatch for i=" + i + message);
                        }
                        expect(returned[i].descending).toBe(e.descending, "descending missmatch for i=" + i + message);
                    });
                };

                it('should throw an error in entity mode.', function () {
                    expect(function () {
                        var sc = mainFacets[10].sortColumns;
                    }).toThrow("sortColumns cannot be used in entity mode.");
                });

                it("when order is missing, should return descending num_occurrences and ascending value.", function () {
                    testSortColumns(mainFacets[0].sortColumns, [
                        { num_occurrences: true, descending: true },
                        { column: "id", descending: false }
                    ], "");
                });

                it("when order is missing and column is not sortable, still should return desc num_occ and asc value.", function () {
                    testSortColumns(mainFacets[9].sortColumns, [
                        { num_occurrences: true, descending: true },
                        { column: "jsonb_col", descending: false }
                    ], "");
                });

                it("when order is defined, should be honored.", function () {
                    testSortColumns(mainFacets[1].sortColumns, [
                        { column: "id", descending: true },
                    ], "missing num_occurrences, missing actual column");

                    testSortColumns(mainFacets[2].sortColumns, [
                        { column: "id", descending: false },
                        { column: "float_col", descending: true }
                    ], "missing num_occurrences, having actual column");

                    //text_col
                    testSortColumns(mainFacets[5].sortColumns, [
                        { column: "date_col", descending: false },
                        { num_occurrences: true, descending: false }
                    ], "having num_occurrences, missing actual column");
                });

                it("when order is not valid array (or the columns were not valid), should return the default.", function () {
                    testSortColumns(mainFacets[6].sortColumns, [
                        { num_occurrences: true, descending: true },
                        { column: "longtext_col", descending: false }
                    ], "longtext");

                    testSortColumns(mainFacets[7].sortColumns, [
                        { num_occurrences: true, descending: true },
                        { column: "markdown_col", descending: false }
                    ], "markdown");
                });
            });

            describe("scalarValuesReference", function () {
                var testEntityCounts = function (entityCountRef, displayname, path, length, values, valuesLength, done) {
                    expect(entityCountRef.ermrestPath).toEqual(path, "path missmatch.");
                    expect(entityCountRef.columns[0].displayname.value).toBe(displayname, "displayname missmatch");
                    entityCountRef.read(length).then(function (page) {
                        expect(page.tuples.length).toBe(length, "length missmatch.");
                        // all tuples are the same, just looking at the first one is enough
                        // This is just to test that whether the sortColumns is messing with the values or not
                        expect(page.tuples[0].values.length).toBe(valuesLength, "values length missmatch");
                        expect(page.tuples.map(function (t) {
                            return t.values[0];
                        })).toEqual(values, "values missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail(err);
                    });
                };

                it('should throw an error in entity mode.', function () {
                    expect(function () {
                        var sc = mainFacets[10].sortColumns;
                    }).toThrow("sortColumns cannot be used in entity mode.");
                });

                it("should return the list of avaialble facets sorted by frequency and tie break by column.", function (done) {
                    testEntityCounts(
                        mainFacets[0].scalarValuesReference,
                        "ID facet",
                        "M:=faceting_schema:main/int_col::geq::-2/$M/!(id::null::)/0:=id;count:=cnt(*)@sort(count::desc::,0)",
                        10,
                        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                        2,
                        done
                    );
                });

                it("should be able to pass the FacetColumn.sortColumns to it.", function (done) {
                    testEntityCounts(
                        mainFacets[2].scalarValuesReference,
                        "float_col markdown_name",
                        "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/!(float_col::null::)/0:=float_col,1:=id;count:=cnt(*)@sort(1,0::desc::)",
                        1, // the reference has applied filters
                        ["11.1100"],
                        2,
                        done
                    );
                });

                it("should be able to pass the FacetColumn.hideNumOccurrences to it (should still add the count and just hide it).", function (done) {
                    testEntityCounts(
                        mainFacets[7].scalarValuesReference,
                        "markdown_col",
                        "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/!(markdown_col::null::)/0:=markdown_col;count:=cnt(*)@sort(count::desc::,0)",
                        1,
                        ["<strong>one</strong>"],
                        1,
                        done
                    );
                });

                it("should not add count column if it's hidden and not part of sortColumns.", function (done) {
                    testEntityCounts(
                        mainFacets[1].scalarValuesReference,
                        "int_col",
                        "M:=faceting_schema:main/id=1/$M/!(int_col::null::)/0:=int_col,1:=id@sort(1::desc::)",
                        1,
                        ["11"],
                        1,
                        done
                    );
                });

                it ("should properly handle sourecs with path prefix", function (done) {
                    testEntityCounts(
                        refMainAllData.facetColumns[21].scalarValuesReference,
                        "Path to o1_o1 with prefix",
                        [
                            "T:=faceting_schema:main/int_col::geq::-2/$T",
                            "(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                            "!(path_prefix_o1_o1_col::null::)",
                            "0:=path_prefix_o1_o1_col;count:=cnt_d(T:RID)@sort(count::desc::,0)"
                        ].join("/"),
                        3,
                        ['one_o1_o1', 'three_o1_o1', 'two_o1_o1'],
                        2,
                        done
                    );
                });

                it ("should properly handle sources with filter", function (done) {
                    testEntityCounts(
                        refMainAllData.facetColumns[23].scalarValuesReference,
                        "id with filter",
                        [
                            "M:=faceting_schema:main/int_col::geq::-2/$M/id::gt::1",
                            "!(id::null::)/0:=id;count:=cnt(*)@sort(count::desc::,0)"
                        ].join("/"),
                        10,
                        ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
                        2,
                        done
                    );
                });

                it ("should properly handle sources with path and filter", function (done) {
                    testEntityCounts(
                        refMainAllData.facetColumns[24].scalarValuesReference,
                        "path with complicated filters",
                        [
                            "T:=faceting_schema:main/int_col::geq::-2/$T",
                            "M:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "!(date_col::gt::" +  currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                            "!(path_prefix_o1_col::null::)/0:=path_prefix_o1_col;count:=cnt_d(T:RID)@sort(count::desc::,0)"
                        ].join("/"),
                        4,
                        ['one', 'three', 'four', 'two'],
                        2,
                        done
                    );
                });

                it ("should properly handle sourecs with path prefix and filter", function (done) {

                    testEntityCounts(
                        refMainAllData.facetColumns[25].scalarValuesReference,
                        "Path to o1_o1 with prefix and filter",
                        [
                            "T:=faceting_schema:main/int_col::geq::-2/$T",
                            "(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "!(date_col::gt::" +  currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                            "M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                            "!(path_prefix_o1_o1_col::null::)/0:=path_prefix_o1_o1_col;count:=cnt_d(T:RID)@sort(count::desc::,0)"
                        ].join("/"),
                        3,
                        ['one_o1_o1', 'three_o1_o1', 'two_o1_o1' ],
                        2,
                        done
                    );
                });
            });
        });

        describe("should be able to handle facets with long paths.", function () {
            var ref;
            beforeAll(function () {
                // refMain has -> id=1, int_col>-2
                ref = refMain.facetColumns[14].addChoiceFilters(["a", "test"]);
                ref = ref.facetColumns[16].addChoiceFilters(["1", null]);
                ref = ref.facetColumns[12].addSearchFilter("t");
                ref = ref.facetColumns[2].addRangeFilter(-1, false, 20.2, false).reference;
            });

            it("should be able to construct a reference with multiple filters.", function () {

                uri = "faceting_schema:secondpath_2/RID=1;RID::null::/(id)=(faceting_schema:secondpath_1:id)/M:=right(id)=(faceting_schema:main:id)/" +
                    "id=1/$M/int_col::geq::-2/$M/float_col::geq::-1&float_col::leq::20.2/$M/" +
                    "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/term::ciregexp::t/$M/(id)=(faceting_schema:longpath_1:id)/(id)=(faceting_schema:longpath_2:id)/(id)=(faceting_schema:longpath_3:id)/(id)=(faceting_schema:longpath_4:id)/(id)=(faceting_schema:longpath_5:id)/col=any(a,test)/$M";

                facetObj = {
                    "and": [
                        { "source": "id", "choices": ["1"] },
                        { "source": "int_col", "ranges": [{ "min": -2 }] },
                        { "source": ["float_col"], "ranges": [{ "max": 20.2, "min": -1 }] },
                        {
                            "source": [
                                { "inbound": ["faceting_schema", "main_f3_assoc_fk1"] },
                                { "outbound": ["faceting_schema", "main_f3_assoc_fk2"] },
                                "term"
                            ],
                            "search": ["t"]
                        },
                        {
                            "source": [
                                { "inbound": ["faceting_schema", "longpath_1_fk1"] },
                                { "inbound": ["faceting_schema", "longpath_2_fk1"] },
                                { "inbound": ["faceting_schema", "longpath_3_fk1"] },
                                { "inbound": ["faceting_schema", "longpath_4_fk1"] },
                                { "inbound": ["faceting_schema", "longpath_5_fk1"] },
                                "col"
                            ],
                            "choices": ["a", "test"]
                        },
                        {
                            "source": [
                                { "inbound": ["faceting_schema", "secondpath_1_fk1"] },
                                { "inbound": ["faceting_schema", "secondpath_2_fk1"] },
                                "RID"
                            ],
                            "choices": ["1", null]
                        }
                    ]
                };

                expect(ref.location.ermrestCompactPath).toEqual(uri, "uri missmatch.");
                expect(JSON.stringify(ref.location.facets.decoded)).toEqual(JSON.stringify(facetObj), "facets missmatch.");
            });

            it("sourceReference should return the correct reference.", function () {
                checkSourceReference(
                    "new refernece, index = 0",
                    ref.facetColumns[0],
                    "faceting_schema:secondpath_2/RID=1;RID::null::/(id)=(faceting_schema:secondpath_1:id)/M:=right(id)=(faceting_schema:main:id)/" + "int_col::geq::-2/$M/float_col::geq::-1&float_col::leq::20.2/$M/" +
                    "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/term::ciregexp::t/$M/" +
                    "(id)=(faceting_schema:longpath_1:id)/(id)=(faceting_schema:longpath_2:id)/(id)=(faceting_schema:longpath_3:id)/(id)=(faceting_schema:longpath_4:id)/(id)=(faceting_schema:longpath_5:id)/col=any(a,test)/$M",
                    "id"
                );

                checkSourceReference(
                    "new refernece, index = 14",
                    ref.facetColumns[14],
                    "faceting_schema:secondpath_2/RID=1;RID::null::/(id)=(faceting_schema:secondpath_1:id)/T:=right(id)=(faceting_schema:main:id)/" +
                    "id=1/$T/int_col::geq::-2/$T/float_col::geq::-1&float_col::leq::20.2/$T/" +
                    "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/term::ciregexp::t/$T/" +
                    "(id)=(faceting_schema:longpath_1:id)/(id)=(faceting_schema:longpath_2:id)/(id)=(faceting_schema:longpath_3:id)/(id)=(faceting_schema:longpath_4:id)/M:=(id)=(faceting_schema:longpath_5:id)",
                    "col"
                );
            });

            it("read on sourceReference should return the expected values.", function (done) {
                ref.facetColumns[0].sourceReference.read(25).then(function (p) {
                    expect(p._data[0].id).toEqual(1, "data missmatch");
                    return ref.facetColumns[14].sourceReference.read(25);
                }).then(function (p) {
                    expect(p._data[0].col).toEqual("test", "col missmatch");
                    expect(p._data[0].id).toEqual(1, "id missmatch");
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });
        });

        describe("integration with other APIs, ", function () {

            it("changing facet should not remove the sort on the reference.", function () {
                var refSorted = refMain.sort([{ "column": "int_col", "descending": false }]);
                var refSortedWithFilter = refSorted.facetColumns[10].addChoiceFilters(["1", "2"]);
                expect(refSortedWithFilter.location.ermrestCompactPath).toBe(
                    "M:=faceting_schema:main/id=1/$M/int_col::geq::-2/$M/(fk_to_f1)=(faceting_schema:f1:id)/id=any(1,2)/$M",
                    "path missmatch."
                );
                expect(refSortedWithFilter.location.sortObject.length).toEqual(1, "sort length missmatch.");
                expect(refSortedWithFilter.location.sortObject[0].column).toEqual("int_col", "sort column missmatch.");
            });

            it("should be able to call histogram on .column, and should be properly defined.", function () {
                var agRef = mainFacets[20].column.groupAggregate.histogram(2, 2, 10);
                expect(agRef.columns.length).toBe(2, "column length invalid");
                expect(agRef.columns[1].term).toBe("cnt_d(T:RID)", "invalid term (must use the facet base table)");
            });

            describe("regarding usage of path prefix,", function () {
                var currRef;

                // NOTE this function is making assumption about the facets and results,
                // so we cannot just pass any arbitary inputs to it
                var testReadAndReadPath = function (currFacetObj, expectedReadPath, expectedSourceRefs) {
                    it("readPath should be able to reuse the aliases in facet as part of all-outbound", function (done) {
                        options.ermRest.resolve(createURL(tableMain, currFacetObj)).then(function (ref) {
                            // visible-fks are defined for compact
                            currRef = ref.contextualize.compact;

                            expect(currRef.readPath).toEqual(expectedReadPath);
                            done();
                        }).catch(function (err) {
                            done.fail(err);
                        });
                    });

                    it("read should return proper values", function (done) {
                        currRef.read(25).then(function (page) {
                            expect(page.length).toBe(1, "page length missmatch");

                            var tuples = page.tuples;
                            expect(tuples[0].data.id).toBe(4, "id raw value missmatch");

                            var expectedValues = ['4', 'two', 'two_o1_o1', 'two_o1_o1_o1'];
                            expect(tuples[0].values).toEqual(jasmine.arrayContaining(expectedValues), "values missmatch");

                            done();
                        }).catch(function (err) {
                            done.fail(err);
                        })
                    });

                    if (expectedSourceRefs) {
                        expectedSourceRefs.forEach(function (expSourceRef) {
                            var sourceRef, facetIndex = expSourceRef.facetIndex;
                            describe("for facet index=" +  facetIndex, function () {
                                it ("sourceReference should return the proper readPath", function () {
                                    sourceRef = currRef.facetColumns[facetIndex].sourceReference;

                                    expect(sourceRef).toBeDefined();
                                    expect(sourceRef.readPath).toEqual(expSourceRef.sourceReadPath);
                                });

                                it ("sourceReference.read should return proper values", function (done) {
                                    sourceRef.read(25).then(function (page) {
                                        expect(page.length).toBe(expSourceRef.read.length, "page length missmatch");

                                        var tuples = page.tuples;
                                        expect(tuples[0].data.id).toBe(expSourceRef.read.firstID, "id raw value missmatch");

                                        // var expectedValues = ['4', 'two', 'two_o1_o1', 'two_o1_o1_o1'];
                                        // expect(tuples[0].values).toEqual(jasmine.arrayContaining(expectedValues), "values missmatch");

                                        done();
                                    }).catch(function (err) {
                                        done.fail(err);
                                    })
                                });
                            });
                        });
                    }
                }

                describe("when null is not in the choices", function () {
                    describe("case 1", function () {
                        testReadAndReadPath(
                            {
                                "and": [
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                            "path_prefix_o1_o1_i1_col"
                                        ],
                                        "choices": ["one_o1_o1_i1"]
                                    },
                                    {
                                        "sourcekey": "path_to_path_prefix_o1_o1",
                                        "choices": ["two_o1_o1"]
                                    }
                                ]
                            },
                            [
                                "M:=faceting_schema:main",
                                "M_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                                "$M_P1/path_prefix_o1_o1_col=two_o1_o1/$M",
                                "$M_P1/F3:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M",
                                "RID;M:=array_d(M:*),F3:=F3:path_prefix_o1_o1_o1_col,F2:=M_P1:path_prefix_o1_o1_col,F1:=M_P2:path_prefix_o1_col@sort(RID)"
                            ].join("/"),
                            [
                                {
                                    facetIndex: 21,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                        "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$T",
                                        "$M/F1:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 2,
                                        firstID: 1
                                    }
                                },
                                {
                                    facetIndex: 22,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$T",
                                        "$T_P1/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/M:=(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)",
                                        "F1:=left(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                }
                            ]
                        );
                    });

                    // sourcekey used before the prefix
                    describe("case 2", function () {
                        testReadAndReadPath(
                            {
                                "and": [
                                    {
                                        "sourcekey": "path_to_path_prefix_o1_o1",
                                        "choices": ["two_o1_o1"]
                                    },
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                            "path_prefix_o1_o1_i1_col"
                                        ],
                                        "choices": ["one_o1_o1_i1"]
                                    }
                                ]
                            },
                            [
                                "M:=faceting_schema:main",
                                "M_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M_P2:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$M",
                                "$M_P2/(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                                "$M_P2/F3:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M",
                                "RID;M:=array_d(M:*),F3:=F3:path_prefix_o1_o1_o1_col,F2:=M_P2:path_prefix_o1_o1_col,F1:=M_P1:path_prefix_o1_col@sort(RID)"
                            ].join("/"),
                            [
                                {
                                    facetIndex: 21,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                        "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$T",
                                        "$M/F1:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 2,
                                        firstID: 1
                                    }
                                },
                                {
                                    facetIndex: 22,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$T",
                                        "$T_P1/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/M:=(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)",
                                        "F1:=left(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                }
                            ]
                        );
                    });

                    // prefix with different end column
                    describe("case 3", function () {
                        testReadAndReadPath(
                            {
                                "and": [
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            "id"
                                        ],
                                        "choices": ["2"]
                                    },
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                            "path_prefix_o1_o1_i1_col"
                                        ],
                                        "choices": ["one_o1_o1_i1"]
                                    }
                                ]
                            },
                            [
                                "M:=faceting_schema:main",
                                "M_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=2/$M",
                                "$M_P1/(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                                "$M_P1/F3:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M",
                                "RID;M:=array_d(M:*),F3:=F3:path_prefix_o1_o1_o1_col,F2:=M_P1:path_prefix_o1_o1_col,F1:=M_P2:path_prefix_o1_col@sort(RID)"
                            ].join("/"),
                            [
                                {
                                    facetIndex: 21,
                                    // the facet in url doesn't match with this facetColumn anymore
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                        "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$T/$M/id=2/$T",
                                        "$M/F1:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                },
                                {
                                    facetIndex: 22,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        // NOTE T_P2 is not needed but code doesn't handle it
                                        "T_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/T_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=2/$T",
                                        "$T_P1/M:=(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)",
                                        "F1:=left(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                }
                            ]
                        );
                    });
                });

                describe("when null is in the choices", function () {
                    describe("case 1 (null)", function () {
                        testReadAndReadPath(
                            {
                                "and": [
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                            "path_prefix_o1_o1_i1_col"
                                        ],
                                        "choices": ["one_o1_o1_i1", null]
                                    },
                                    {
                                        "sourcekey": "path_to_path_prefix_o1_o1",
                                        "choices": ["two_o1_o1"]
                                    }
                                ]
                            },
                            [
                                "faceting_schema:path_prefix_o1_o1_i1/path_prefix_o1_o1_i1_col=one_o1_o1_i1;path_prefix_o1_o1_i1_col::null::",
                                "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/(id)=(faceting_schema:path_prefix_o1:fk_to_path_prefix_o1_o1)",
                                "M:=right(id)=(faceting_schema:main:fk_to_path_prefix_o1)/M_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                                "M_P2:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$M",
                                "$M_P2/F3:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M",
                                "RID;M:=array_d(M:*),F3:=F3:path_prefix_o1_o1_o1_col,F2:=M_P2:path_prefix_o1_o1_col,F1:=M_P1:path_prefix_o1_col@sort(RID)"
                            ].join("/"),
                            [
                                {
                                    facetIndex: 21,
                                    sourceReadPath: [
                                        "faceting_schema:path_prefix_o1_o1_i1/path_prefix_o1_o1_i1_col=one_o1_o1_i1;path_prefix_o1_o1_i1_col::null::",
                                        "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/(id)=(faceting_schema:path_prefix_o1:fk_to_path_prefix_o1_o1)",
                                        "T:=right(id)=(faceting_schema:main:fk_to_path_prefix_o1)",
                                        // TODO the code doesn't properly account for null that's why T_P1 is added
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                        "F1:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 3,
                                        firstID: 1
                                    }
                                },
                                {
                                    facetIndex: 22,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$T",
                                        "$T_P1/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/M:=(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)",
                                        "F1:=left(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                }
                            ]
                        );
                    });

                    // sourcekey used before the prefix
                    describe("case 2 (null)", function () {
                        testReadAndReadPath(
                            {
                                "and": [
                                    {
                                        "sourcekey": "path_to_path_prefix_o1_o1",
                                        "choices": ["two_o1_o1"]
                                    },
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                            "path_prefix_o1_o1_i1_col"
                                        ],
                                        "choices": ["one_o1_o1_i1", null]
                                    }
                                ]
                            },
                            [
                                "faceting_schema:path_prefix_o1_o1_i1/path_prefix_o1_o1_i1_col=one_o1_o1_i1;path_prefix_o1_o1_i1_col::null::",
                                "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/(id)=(faceting_schema:path_prefix_o1:fk_to_path_prefix_o1_o1)",
                                "M:=right(id)=(faceting_schema:main:fk_to_path_prefix_o1)",
                                "M_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M_P2:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$M",
                                "$M_P2/F3:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M",
                                "RID;M:=array_d(M:*),F3:=F3:path_prefix_o1_o1_o1_col,F2:=M_P2:path_prefix_o1_o1_col,F1:=M_P1:path_prefix_o1_col@sort(RID)"
                            ].join("/"),
                            [
                                {
                                    facetIndex: 21,
                                    // TODO the code doesn't properly account for null that's why T_P1 is added
                                    sourceReadPath: [
                                        "faceting_schema:path_prefix_o1_o1_i1/path_prefix_o1_o1_i1_col=one_o1_o1_i1;path_prefix_o1_o1_i1_col::null::",
                                        "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/(id)=(faceting_schema:path_prefix_o1:fk_to_path_prefix_o1_o1)",
                                        "T:=right(id)=(faceting_schema:main:fk_to_path_prefix_o1)",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                                        "F1:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 3,
                                        firstID: 1
                                    }
                                },
                                {
                                    facetIndex: 22,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$T",
                                        "$T_P1/(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/M:=(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)",
                                        "F1:=left(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                }
                            ]
                        );
                    });

                    // prefix with different end column
                    describe("case 3 (null)", function () {
                        testReadAndReadPath(
                            {
                                "and": [
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            "id"
                                        ],
                                        "choices": ["2"]
                                    },
                                    {
                                        "source": [
                                            { "sourcekey": "path_to_path_prefix_o1_o1" },
                                            { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                            "path_prefix_o1_o1_i1_col"
                                        ],
                                        "choices": ["one_o1_o1_i1", null]
                                    }
                                ]
                            },
                            [
                                "faceting_schema:path_prefix_o1_o1_i1/path_prefix_o1_o1_i1_col=one_o1_o1_i1;path_prefix_o1_o1_i1_col::null::",
                                "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/(id)=(faceting_schema:path_prefix_o1:fk_to_path_prefix_o1_o1)",
                                "M:=right(id)=(faceting_schema:main:fk_to_path_prefix_o1)",
                                "M_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                                "M_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=2/$M",
                                "$M_P1/F3:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M",
                                "RID;M:=array_d(M:*),F3:=F3:path_prefix_o1_o1_o1_col,F2:=M_P1:path_prefix_o1_o1_col,F1:=M_P2:path_prefix_o1_col@sort(RID)"
                            ].join("/"),
                            [
                                {
                                    facetIndex: 21,
                                    // the facet in url doesn't match with this facetColumn anymore
                                    sourceReadPath: [
                                        "faceting_schema:path_prefix_o1_o1_i1/path_prefix_o1_o1_i1_col=one_o1_o1_i1;path_prefix_o1_o1_i1_col::null::",
                                        "(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/(id)=(faceting_schema:path_prefix_o1:fk_to_path_prefix_o1_o1)",
                                        "T:=right(id)=(faceting_schema:main:fk_to_path_prefix_o1)",
                                        "T_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/M:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=2/$T",
                                        "$M/F1:=left(fk_to_path_prefix_o1_o1_o1)=(faceting_schema:path_prefix_o1_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                },
                                {
                                    facetIndex: 22,
                                    sourceReadPath: [
                                        "T:=faceting_schema:main",
                                        // NOTE T_P2 is not needed but code doesn't handle it
                                        "T_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)/T_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=2/$T",
                                        "$T_P1/M:=(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)",
                                        "F1:=left(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                                    ].join("/"),
                                    read: {
                                        length: 1,
                                        firstID: 2
                                    }
                                }
                            ]
                        );
                    });

                });
            });

            /**
             * NOTE filters used all-outbounds/local columns of visible-columns
             *      will produce a separate request and won't be part of all-outbounds
             *      added to the URL, so we don't need to test them in combination of each other
             * and we just want to make sure the read path properly shares path for them.
             * that's why the following is separated from the above.
             */
            describe('regarding usage of filter in source with path prefix,', function () {
                var currRef;

                var testReadAndReadPath = function (currFacetObj, expectedReadPath) {
                    it("readPath should be able to reuse the aliases in facet as part of all-outbound", function (done) {
                        options.ermRest.resolve(createURL(tableMain, currFacetObj)).then(function (ref) {
                            // visible-fks are defined for compact/select
                            currRef = ref.contextualize.compactSelect;

                            if (expectedReadPath) {
                                expect(currRef.readPath).toEqual(expectedReadPath);
                            }
                            done();
                        }).catch(function (err) {
                            done.fail(err);
                        });
                    });

                    it("read should return proper values", function (done) {
                        currRef.read(25).then(function (page) {
                            expect(page.length).toBe(1, "page length missmatch");

                            var tuples = page.tuples;
                            expect(tuples[0].data.id).toBe(4, "id raw value missmatch");

                            var expectedValues = ['4'];
                            expect(tuples[0].values).toEqual(jasmine.arrayContaining(expectedValues), "values missmatch");

                            done();
                        }).catch(function (err) {
                            done.fail(err);
                        })
                    });
                }

                describe("case 1", function () {
                    testReadAndReadPath(
                        {
                            "and": [
                                {
                                    "source": [
                                        { "sourcekey": "path_to_path_prefix_o1_o1_w_filter" },
                                        { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                        "path_prefix_o1_o1_i1_col"
                                    ],
                                    "choices": ["one_o1_o1_i1"]
                                },
                                {
                                    "sourcekey": "path_to_path_prefix_o1_o1_w_filter",
                                    "choices": ["two_o1_o1"]
                                }
                            ]
                        },
                        [
                            "M:=faceting_schema:main",
                            // "id::gt::-1",
                            "M_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "!(date_col::gt::" + currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                            "M_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                            "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                            "$M_P1/path_prefix_o1_o1_col=two_o1_o1/$M",
                            "F1:=left(fk_to_f1)=(faceting_schema:f1:id)/$M",
                            "RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                        ].join("/")
                    );
                });

                // sourcekey used before the prefix
                describe("case 2", function () {
                    testReadAndReadPath(
                        {
                            "and": [
                                {
                                    "sourcekey": "path_to_path_prefix_o1_o1_w_filter",
                                    "choices": ["two_o1_o1"]
                                },
                                {
                                    "source": [
                                        { "sourcekey": "path_to_path_prefix_o1_o1_w_filter" },
                                        { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                        "path_prefix_o1_o1_i1_col"
                                    ],
                                    "choices": ["one_o1_o1_i1"]
                                }
                            ]
                        },
                        [
                            "M:=faceting_schema:main",
                            // "id::gt::-1",
                            "M_P1:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "!(date_col::gt::" + currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                            "M_P2:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/path_prefix_o1_o1_col=two_o1_o1/$M",
                            "$M_P2/(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                            "F1:=left(fk_to_f1)=(faceting_schema:f1:id)/$M",
                            "RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                        ].join("/")
                    );
                });

                // prefix with different end column
                describe("case 3", function () {
                    testReadAndReadPath(
                        {
                            "and": [
                                {
                                    "source": [
                                        { "sourcekey": "path_to_path_prefix_o1_o1_w_filter" },
                                        "id"
                                    ],
                                    "choices": ["2"]
                                },
                                {
                                    "source": [
                                        { "sourcekey": "path_to_path_prefix_o1_o1_w_filter" },
                                        { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                        "path_prefix_o1_o1_i1_col"
                                    ],
                                    "choices": ["one_o1_o1_i1"]
                                }
                            ]
                        },
                        [
                            "M:=faceting_schema:main",
                            // "id::gt::-1",
                            "M_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "!(date_col::gt::" + currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                            "M_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)/id=2/$M",
                            "$M_P1/(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                            "F1:=left(fk_to_f1)=(faceting_schema:f1:id)/$M",
                            "RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                        ].join("/")
                    );
                });

                // prefix with added filter
                describe("case 4", function () {
                    testReadAndReadPath(
                        {
                            "and": [
                                {
                                    "source": [
                                        { "sourcekey": "path_to_path_prefix_o1_o1_w_filter" },
                                        { "inbound": ["faceting_schema", "path_prefix_o1_o1_i1_fk1"] },
                                        "path_prefix_o1_o1_i1_col"
                                    ],
                                    "choices": ["one_o1_o1_i1"]
                                },
                                {
                                    "source": [
                                        {"sourcekey": "path_to_path_prefix_o1_o1_w_filter"},
                                        {"or": [
                                            {"filter": "id", "operator": "::null::"},
                                            {"and": [
                                                {"filter": "RID", "operator": "::null::", "negate": true},
                                                {"filter": "id", "operator": "::null::", "negate": true}
                                            ]}
                                        ]},
                                        "path_prefix_o1_o1_col"
                                    ],
                                    "choices": ["two_o1_o1"]
                                }
                            ]
                        },
                        [
                            "M:=faceting_schema:main",
                            // "id::gt::-1",
                            "M_P2:=(fk_to_path_prefix_o1)=(faceting_schema:path_prefix_o1:id)",
                            "!(date_col::gt::" + currentDateString + "&path_prefix_o1_col=some_non_used_value)",
                            "M_P1:=(fk_to_path_prefix_o1_o1)=(faceting_schema:path_prefix_o1_o1:id)",
                            "(id)=(faceting_schema:path_prefix_o1_o1_i1:fk_to_path_prefix_o1_o1)/path_prefix_o1_o1_i1_col=one_o1_o1_i1/$M",
                            "$M_P1/(id::null::;(!(RID::null::)&!(id::null::)))",
                            "path_prefix_o1_o1_col=two_o1_o1/$M",
                            "F1:=left(fk_to_f1)=(faceting_schema:f1:id)/$M",
                            "RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)"
                        ].join("/")
                    );
                });

            });
        });
    });
};
