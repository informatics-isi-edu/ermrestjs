exports.execute = function (options) {
    /*
     * The tables that are used in this test spec:
     *
     * main: 
     *  - Has the following facets:
     *    0: id | choices | appliedFilter: 1
     *    1: int_col | ranges | appliedFilter: min:-2
     *    2: float_col
     *    3: date_col
     *    4: timestamp_col
     *    5: text_col
     *    6: longtext_col
     *    7: markdown_col
     *    8: main_fk1, id (f1 table) | markdown_name: **F1**
     *    9: main_fk2, id (f2 table) | open
     *    10: f3, term (association table)
     *    11: f4_fk1, id (inbound) | entity:false | ux_mode: choices
     *    12: a long path
     *    13: second path
     *
     * f1:
     *  - main has fk to it.
     *  - has filter annotation, but it's invalid and should be ignored.
     * f2: 
     *  - main has fk to it.
     *  - has filter annotation, but the source that is there is invalid
     *
     * f4:
     *  - 
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
            tableWAlt = "table_w_alt";

        var refF1, refF2, refF4, refMain, refWOAnnot1, refWOAnnot2, refLP5, refSP2;
        var refMainMoreFilters;
        var mainFacets;
        var i, facetObj;
        
        var createURL = function (tableName, facet) {
            var res =  options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
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
             expect(disp.value).toBe(value, "value missmatch for index="+ index);
             expect(disp.isHTML).toBe(isHTML, "isHTML missmatch for index="+ index);    
         };
         
         var checkSourceReference = function (fcName, fc, compactPath, projectionFacets, colName) {
             var sr = fc.sourceReference;
             var col = fc.column;
             
             expect(sr.location.ermrestCompactPath).toBe(compactPath, fcName + ": compactPath missmatch.");
             expect(sr.location.facets).toBeUndefined(fcName + ": facets was defined.");
             expect(sr.location.projectionFacets).toBeDefined(fcName + ": didn't have projection facets.");
             expect(JSON.stringify(sr.location.projectionFacets.decoded)).toEqual(
                 JSON.stringify(projectionFacets),
                 fcName + ": projectionFacets missmatch."
             );
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
            options.ermRest.resolve(createURL(tableMain), {cid: "test"}).then(function (ref) {
                refMain = ref.contextualize.compact;
                mainFacets = refMain.facetColumns;
                
                facetObj = { "and": [ {"source": [{"outbound": ["faceting_schema", "main_fk2"]}, "id"], "choices": ["2", "3"]} ] };
                return options.ermRest.resolve(createURL(tableMain, facetObj));
            }).then(function (ref) {
                refMainFilterOnFK = ref;
                return options.ermRest.resolve(createURL(tableF4), {cid: "test"});
            }).then(function (ref) {
                refF4 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableLongPath5), {cid: "test"});
            }).then(function (ref) {
                refLP5 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableSecondPath2), {cid: "test"});
            }).then(function (ref) {
                refSP2 = ref.contextualize.compact;
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
            
        });

        describe("Reference.facetColumns, ", function () {
            describe ("when `filter` annotation is not defined, ", function () {
                describe("when visible columns for `compact` and related entities for `detailed` are wellformed.", function () {
                    it ("it should use the visible columns from `compact` and related entities from `detailed`", function () {
                        expect(refF4.facetColumns.length).toBe(4, "length missmatch.");
                    });
                    
                    it ('should create a scalar picker for simple keys.', function () {
                        expect(refF4.facetColumns[0]._column.name).toBe("id", "column name missmatch.");
                        expect(refF4.facetColumns[0]._column.table.name).toBe("f4", "table name missmatch.");
                        expect(refF4.facetColumns[0].dataSource).toBe("id", "dataSource missmatch.");
                        expect(refF4.facetColumns[0].isEntityMode).toBe(false, "entityMode missmatch.");
                    });
                    
                    it ("should create scalar picker for normal columns.", function () {
                        expect(refF4.facetColumns[1]._column.name).toBe("term", "column name missmatch.");
                        expect(refF4.facetColumns[1]._column.table.name).toBe("f4", "table name missmatch.");
                        expect(refF4.facetColumns[1].dataSource).toBe("term", "dataSource missmatch.");
                        expect(refF4.facetColumns[1].isEntityMode).toBe(false, "entityMode missmatch.");
                    });
                    
                    describe("for simple inbound and outbound pusedo columns, ", function () {
                        it ("should create a entity picker facet.", function () {
                            expect(refF4.facetColumns[2]._column.name).toBe("id", "column name missmatch for outbound.");
                            expect(refF4.facetColumns[2]._column.table.name).toBe("main", "table name missmatch for outbound.");
                            expect(JSON.stringify(refF4.facetColumns[2].dataSource)).toBe(
                                '[{"outbound":["faceting_schema","f4_fk1"]},"id"]', 
                                "dataSource missmatch for outbound."
                            );
                            expect(refF4.facetColumns[2].isEntityMode).toBe(true, "entityMode missmatch for outbound.");
                            
                            
                            expect(refF4.facetColumns[3]._column.name).toBe("id", "column name missmatch for inbound.");
                            expect(refF4.facetColumns[3]._column.table.name).toBe("main_wo_faceting_annot_1", "table name missmatch for inbound.");
                            expect(JSON.stringify(refF4.facetColumns[3].dataSource)).toBe(
                                '[{"inbound":["faceting_schema","main_wo_annot_1_fkey1"]},"id"]', 
                                "dataSource missmatch for outbound."
                            );
                            expect(refF4.facetColumns[3].isEntityMode).toBe(true, "entityMode missmatch for inbound.");
                        });
                        
                        it ("should define markdown_name properly.", function () {
                            expect(refF4.facetColumns[2]._facetObject.markdown_name).toBe("to_name", "missmatch for outbound.");
                            
                            expect(refF4.facetColumns[3]._facetObject.markdown_name).toBe("main_wo_faceting_annot_1", "missmatch for inbound.");
                        });
                    });
                });

                it ("it should ignore asset columns, and any inbound or outbound composite foreign keys, or composite keys.", function (done) {
                    options.ermRest.resolve(createURL(tableWOAnnot1), {cid: "test"}).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("it should ignore columns with `longtext`, `markdown`, and `serial` type if it's not entity picker.", function (done) {
                    options.ermRest.resolve(createURL(tableWOAnnot2), {cid: "test"}).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });
            
            describe("when `filter` annotation is defined, ", function () {
                it ("if it's not in the valid format, should use heuristics.", function (done) {
                    options.ermRest.resolve(createURL(tableF1), {cid: "test"}).then(function (ref) {
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
                
                it ("should ignore invalid facets.", function (done) {
                    options.ermRest.resolve(createURL(tableF2), {cid: "test"}).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("should create facets based on what data modelers have defined.", function () {
                    expect(refMain.facetColumns.length).toBe(14);
                    
                    expect(refMain.facetColumns.map(function (fc) {
                        return fc._column.name;
                    })).toEqual(
                        ['id', 'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col', 'longtext_col', 'markdown_col', 'id', 'id', 'term', 'id', 'col', 'id']
                    );
                });
                
                it ("should update the location object based on preselected values.", function () {
                    var facetColumns = refMain.facetColumns;
                    expect(refMain.location.facets).toBeDefined("facets is undefined.");
                    expect(refMain.location.ermrestCompactPath).toBe(
                        "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M", 
                        "path missmatch."
                    );
                });
                
                describe("if source: `*` is defined, ", function () {
                    it ("if it doesn't have `search`, it should be ignored.", function () {
                        var facetColumns = refLP5.facetColumns;
                        expect(refLP5.location.searchTerm).toBe(null, "has searchTerm");
                        expect(facetColumns.length).toBe(1, "length missmatch.");
                        expect(facetColumns[0]._column.name).toBe("id", "column name missmatch.");
                    });
                    
                    it ("only the first instance of it with `search` should be considered.", function () {
                        var facetColumns = refSP2.facetColumns;
                        expect(refSP2.location.searchTerm).toBe("term", "searchTerm missmatch.");
                        expect(facetColumns.length).toBe(1, "length missmatch.");
                        expect(facetColumns[0]._column.name).toBe("id", "column name missmatch.");
                    });
                });
            });
            
            describe("if reference already has facets applied, ", function () {
                it ("if it's not part of visible facets, should be appended to list of facets.", function (done) {
                    facetObj = { "and": [ {"source": "unfaceted_column", "search": ["test"]} ] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        var facetColumns = ref.facetColumns;
                        expect(ref.facetColumns.length).toBe(15, "length missmatch.");
                        expect(ref.facetColumns[14]._column.name).toBe("unfaceted_column", "column name missmatch.");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toEqual(
                            "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M/unfaceted_column::ciregexp::test/$M", 
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("it it's part of applied filters in annotation, should not add it (avoid duplicates),", function (done) {
                    facetObj = { "and": [ {"source": "id", "choices": ["1"]} ] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(14, "length missmatch.");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M", 
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("if it's part of visible facets, should add the filter.", function (done) {
                    facetObj = { "and": [ {"source": "id", "choices": ["2"]} ] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        expect(ref.facetColumns.length).toBe(14, "length missmatch.");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1;id=2/$M/int_col::gt::-2/$M", 
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("should be able to handle multiple types of filter.", function (done) {
                    facetObj = {"and": [{"source": "text_col", "ranges": [{"min":"a"}, {"max": "b"}], "search": ["a", "b"], "choices": ["a", "b"]}]};
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        refMainMoreFilters = ref;
                        expect(ref.facetColumns.length).toBe(14, "length missmatch.");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M/text_col=a;text_col=b;text_col::gt::a;text_col::lt::b;text_col::ciregexp::a;text_col::ciregexp::b/$M", 
                            "path missmatch."
                        );
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("if annotation has default search and so does the uri, the uri should take precedence.", function (done) {
                    facetObj = {"and": [{"source": "*", "search": ["newTerm"]}]};
                    options.ermRest.resolve(createURL(tableSecondPath2, facetObj)).then(function (ref) {
                        var facetColumns = ref.facetColumns;
                        expect(facetColumns.length).toBe(1, "length missmatch.");
                        expect(ref.location.facets).toBeDefined("facets is undefined.");
                        expect(ref.location.searchTerm).toBe("newTerm", "searchTerm missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                
                });
                
            });
            
            describe("regarding alternative tables for main table, ", function () { 
                // TODO: We need to rewrite this testcase because of system columns
                xit("if main table has an alternative for compact and not fot detailed, we should add linkage from main to alternative to all the detailed related entities.", function (done) {
                    options.ermRest.resolve(createURL(tableWAlt)).then(function (ref) {
                        ref = ref.contextualize.compact;
                        var facetColumns = ref.facetColumns;
                        expect(facetColumns.length).toBe(2, "length missmatch.");
                        checkFacetSource("index=0, ", facetColumns[0], [{"outbound": ["faceting_schema", "alt_compact_fk2"]}, "id_f5"]);
                        checkFacetSource("index=1, ", facetColumns[1], [{"outbound": ["faceting_schema", "alt_compact_fk1"]}, {"inbound": ["faceting_schema", "f6_fk1"]}, "id_f6"]);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });

            describe("regarding alternative tables for any of facets, ", function () {
                describe ("if facet is based on main table, but it has an alternative table for compact/select.", function () {
                    it ("if filter is based on the key, add the join to path.", function (done) {
                        facetObj = { "and": [ {"source": [{"inbound": ["faceting_schema", "f7_fk1"]}, "id_f7"], "choices": ["1"]} ] };
                        options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                            ref = ref.contextualize.compact;
                            expect(ref.facetColumns.length).toBe(15, "length missmatch.");
                            checkFacetSource(
                                "",
                                ref.facetColumns[14],
                                [{"inbound": ["faceting_schema", "f7_fk1"]}, {"inbound": ["faceting_schema", "f7_compact_alt_fk1"]}, "id"]
                            );
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        });
                    });
                });
                
                it("in othercases, it should just discard the facet.", function (done) {
                    facetObj = { "and": [ {"source": [{"inbound": ["faceting_schema", "f8_fk1"]}, "id_8"], "choices": ["1"]} ] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        ref = ref.contextualize.compact;
                        expect(ref.facetColumns.length).toBe(14);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });
        });
        
        it("Reference.removeAllFacetFilters, should return a new reference without any filters.", function () {
            var newRef = refMain.removeAllFacetFilters();
            expect(newRef).not.toBe(refMain, "reference didn't change.");
            expect(newRef.location.facets).toBeUndefined("facets was defined.");
            expect(newRef.facetColumns.filter(function (f) {
                return f.filters.length !== 0;
            }).length).toBe(0, "some of the facetColumns have facet.");
        });
        
        describe("FacetColumn APIs, ", function () {
            describe("isOpen, ", function () {
                it ("should return true if facet has filters.", function () {
                    expect(mainFacets[0].isOpen).toBe(true, "missmatch for id.");
                    expect(mainFacets[1].isOpen).toBe(true, "missmatch for int_col.");
                });
                
                it ("otherwise should return true if facet object has `open:true`.", function () {
                    expect(mainFacets[9].isOpen).toBe(true);
                });
                
                it ("otherwise should return false.", function () {
                    for (i = 2; i < 8; i ++) {
                        expect(mainFacets[i].isOpen).toBe(false, "missmatch for facet index="+ i);
                    }
                    
                    for (i = 10; i < 14; i ++) {
                        expect(mainFacets[i].isOpen).toBe(false, "missmatch for facet index="+ i);
                    }
                });
            });
            
            describe("isEntityMode, ", function () {
                it ('should return false if source is not a path.', function () {
                    for (i = 0; i < 7; i ++) {
                        expect(mainFacets[i].isEntityMode).toBe(false, "missmatch for facet index="+ i);
                    }
                });
                
                it ('should return false if source is an array, but filter is not based on simple key.', function () {
                    expect(mainFacets[10].isEntityMode).toBe(false);
                });
                
                it ('should return false if source is based on simple key, and `entity:false` is set.', function () {
                    expect(mainFacets[11].isEntityMode).toBe(false);
                });
                
                it ('should return true if source is based on simple key.', function () {
                    for (i = 8; i < 10; i ++) {
                        expect(mainFacets[i].isEntityMode).toBe(true, "missmatch for facet index="+ i);
                    }
                });
            });

            describe("preferredMode, ", function () {
                it ('if ux_mode is defined and is valid, should return it.', function () {
                    expect(mainFacets[0].preferredMode).toBe("choices", "missmatch for facet index=0");
                    expect(mainFacets[11].preferredMode).toBe("choices", "missmatch for facet index=11");
                });
                
                describe("otherwise, ", function () {
                    it ("if in entity mode should return `choices`.", function () {
                        for (i = 8; i < 10; i ++) {
                            expect(mainFacets[i].preferredMode).toBe("choices", "missmatch for facet index="+ i);
                        }
                    });
                    
                    it ("if its a range supported type, should return ranges.", function () {
                        for (i = 1; i < 5; i ++) {
                            expect(mainFacets[i].preferredMode).toBe("ranges", "missmatch for facet index="+ i);
                        }
                    });
                    
                    it ("otherwise should return choices.", function () {
                        [5, 6, 7, 10, 12, 13].forEach(function (fc) {
                            expect(mainFacets[fc].preferredMode).toBe("choices", "missmatch for facet index=" + fc);
                        });
                    });
                });
            });
            
            describe("displayname, ", function () {
                
                it ("if `markdown_name` is defined, should return it.", function () {
                    checkMainFacetDisplayname(8, "<strong>F1</strong>", true);
                });
                
                it ("if source is not an array, should return the column's displayname.", function () {
                    checkMainFacetDisplayname(0, "id", false);
                    checkMainFacetDisplayname(1, "int_col", false);
                    checkMainFacetDisplayname(2, "float_col", false);
                    checkMainFacetDisplayname(3, "date_col", false);
                    checkMainFacetDisplayname(4, "timestamp_col", false);
                    checkMainFacetDisplayname(5, "text_col", false);
                    checkMainFacetDisplayname(6, "longtext_col", false);
                    checkMainFacetDisplayname(7, "markdown_col", false);
                });
                
                describe('otherwise (source is an array), ', function () {
                    it ('if the last foreignKey in path is inbound, and from_name is defined, should return it.', function () {
                        checkMainFacetDisplayname(12, "from_name", false);
                    });
                    
                    it ('if the last foreignKey in path is outbound, and to_name is defined, should return it.', function () {
                        checkMainFacetDisplayname(9, "to_name", false);
                    });
                    
                    describe("otherwise, ", function () {
                        it ('in entity mode should return the table\'s name.', function () {
                            checkMainFacetDisplayname(13, "secondpath_2", false);
                        });
                        it ('in scalar mode, should return the table\'s name and column\'s name.', function () {
                            checkMainFacetDisplayname(10, "f3 (term)", false);
                        });
                    });
                });
            });
                
            describe("comment", function () {
                it ('if in scalar mode, return column\'s comment', function () {
                    expect(mainFacets[5].comment).toBe("text comment");
                });
                
                it ('in entity mode, if foreignKey has comment return it.', function () {
                    expect(mainFacets[8].comment).toBe("fk to f1");
                });
                
                it ('otherwise return table\'s comment.', function () {
                    expect(mainFacets[9].comment).toBe("has fk to main table + has rowname");
                });
            });

            describe('filter related APIs, ', function () {
                describe("addSearchFilter, ", function () {
                    it ("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[5].addSearchFilter(null);
                        }).toThrow("`term` is required.");
                    });
                    
                    it ("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[5].addSearchFilter("test");
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M/text_col::ciregexp::test/$M", 
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[5].filters.length).toBe(1, "filters length missmatch.");
                        expect(newRef.facetColumns[5].filters[0].term).toBe("test", "filter term missmatch.");
                    });
                });
                
                describe("addChoiceFilters, ", function () {
                    it ("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].addChoiceFilters("2");
                        }).toThrow("given argument must be an array");
                    });
                    
                    it ("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[0].addChoiceFilters(["2", "3"]);
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1;id=2;id=3/$M/int_col::gt::-2/$M", 
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(3, "filters length missmatch.");
                        expect(newRef.facetColumns[0].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["1", "2", "3"], "filter terms missmatch.");
                    });
                    
                    it("should handle facets with path.", function () {
                        var ref = mainFacets[8].addChoiceFilters(["1", "2"]);
                        expect(ref).not.toBe(refMain, "reference didn't change.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M/(fk_to_f1)=(faceting_schema:f1:id)/id=1;id=2/$M", 
                            "path missmatch."
                        );
                        expect(ref.facetColumns[8].filters.length).toBe(2, "filters length missmatch.");
                        expect(ref.facetColumns[8].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["1", "2"], "filter terms missmatch.");
                    });

                });
                
                describe("replaceAllChoiceFilters, ", function () {
                    it ("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].replaceAllChoiceFilters("2");
                        }).toThrow("given argument must be an array");
                    });
                    
                    it ("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[0].replaceAllChoiceFilters(["2", "3"]);
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=2;id=3/$M/int_col::gt::-2/$M", 
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(2, "filters length missmatch.");
                        expect(newRef.facetColumns[0].filters.map(function (f) {
                            return f.term;
                        })).toEqual(["2", "3"], "filter terms missmatch.");
                    });
                });
                
                describe("removeChoiceFilters, ", function () {
                    it ("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].removeChoiceFilters("2");
                        }).toThrow("given argument must be an array");
                    });
                    
                    it ("should return a new reference with the applied filter.", function () {
                        var newRef = refMain.facetColumns[0].removeChoiceFilters(["1", "3"]);
                        expect(newRef).not.toBe(refMain, "reference didn't change.");
                        expect(newRef.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/int_col::gt::-2/$M", 
                            "path missmatch."
                        );
                        expect(newRef.facetColumns[0].filters.length).toBe(0, "filters length missmatch.");
                    });
                });
                
                describe("addRangeFilter, ", function () {
                    it ("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[0].addRangeFilter();
                        }).toThrow("One of min and max must be defined.");
                    });
                    
                    describe ("should return a new reference with the applied filter.", function () {
                        var testAddRange = function (min, max, path) {
                            var res = refMain.facetColumns[0].addRangeFilter(min, max);
                            expect(res.reference).not.toBe(refMain, "reference didn't change.");
                            expect(res.reference.location.ermrestCompactPath).toBe(
                                "M:=faceting_schema:main/id=1;" + path + "/$M/int_col::gt::-2/$M",
                                "path missmatch."
                            );
                            expect(res.reference.facetColumns[0].filters.length).toBe(2, "filters length missmatch.");
                        };
                        
                        it ("when passing only min.", function () {
                            testAddRange("1", null, "id::gt::1");
                        });
                        
                        it ("when passing only max.", function () {
                            testAddRange(null, "1", "id::lt::1");
                        });
                        
                        it ("when passing both min, and max.", function () {
                            testAddRange("1", "2", "id::gt::1&id::lt::2");
                        });
                        
                    });
                    
                    it("should handle facets with path.", function () {
                        var ref = mainFacets[3].addRangeFilter("2014-03-03", "2016-07-11").reference;
                        expect(ref).not.toBe(refMain, "reference didn't change.");
                        expect(ref.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M/date_col::gt::2014-03-03&date_col::lt::2016-07-11/$M", 
                            "path missmatch."
                        );
                        expect(ref.facetColumns[3].filters.length).toBe(1, "filters length missmatch.");
                        expect(ref.facetColumns[3].filters[0].toString()).toBe("2014-03-03 to 2016-07-11", "toString missmatch.");
                    });
                });
                
                describe("removeRangeFilter, ", function () {
                    it ("should verify the input.", function () {
                        expect(function () {
                            var newRef = refMain.facetColumns[1].removeRangeFilter();
                        }).toThrow("One of min and max must be defined.");
                    });
                    
                    it ("should return a new reference with the new filter.", function () {
                        var res = refMain.facetColumns[1].removeRangeFilter(-2, null);
                        expect(res.reference).not.toBe(refMain, "reference didn't change.");
                        expect(res.reference.location.ermrestCompactPath).toBe(
                            "M:=faceting_schema:main/id=1/$M", 
                            "path missmatch."
                        );
                        expect(res.reference.facetColumns[1].filters.length).toBe(0, "filters length missmatch.");
                    });
                });
                
                it("removeAllFilters, should return a reference without filters of the given facet.", function () {
                    var newRef = refMain.facetColumns[0].removeAllFilters();
                    expect(newRef).not.toBe(refMain, "reference didn't change.");
                    expect(newRef.location.ermrestCompactPath).toBe(
                        "M:=faceting_schema:main/int_col::gt::-2/$M", 
                        "path missmatch."
                    );
                    expect(newRef.facetColumns[0].filters.length).toBe(0, "filters length missmatch for index=0.");
                    expect(newRef.facetColumns[1].filters.length).toBe(1, "filters length missmatch for index=1.");
                });
                
                it ("filters, should return all the filters available on the facetColumn.", function () {
                    for (i = 0; i < 2; i ++) {
                        expect(mainFacets[i].filters.length).toBe(1, "missmatch for facet index="+ i);
                    }
                    expect(mainFacets[0].filters.map(function (f) {
                        return f.term;
                    })).toEqual(["1"], "filter missmatch for facet index=0");
                    
                    for (i = 2; i < 14; i ++) {
                        expect(mainFacets[i].filters.length).toBe(0, "missmatch for facet index="+ i);
                    }
                });
                
                it ("searchFilters, should return the search filters.", function () {
                    var filters = refMainMoreFilters.facetColumns[5].searchFilters;
                    expect(filters.length).toBe(2, "length missmatch.");
                    expect(filters[0].term).toBe("a", "term index=0 missmatch.");
                    expect(filters[1].term).toBe("b", "term index=0 missmatch.");
                });
                
                it ("choiceFilters, should return the choice filters.", function () {
                    var filters = refMainMoreFilters.facetColumns[5].choiceFilters;
                    expect(filters.length).toBe(2, "length missmatch.");
                    expect(filters[0].term).toBe("a", "term index=0 missmatch.");
                    expect(filters[1].term).toBe("b", "term index=0 missmatch.");
                });
                
                it ("rangeFilters, should return the range filters.", function () {
                    var filters = refMainMoreFilters.facetColumns[5].rangeFilters;
                    expect(filters.length).toBe(2, "length missmatch.");
                    expect(filters[0].toString()).toBe("> a", "term index=0 missmatch.");
                    expect(filters[1].toString()).toBe("< b", "term index=0 missmatch.");
                });
                
                describe("FacetFilter attributes, ", function () {
                    it("toString should return the appropriate value.", function () {
                        expect(refMainMoreFilters.facetColumns[5].choiceFilters[0].toString()).toBe("a", "missmatch for choices");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[0].toString()).toBe("> a", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[1].toString()).toBe("< b", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].searchFilters[0].toString()).toBe("a", "missmatch for search");
                        
                    });
                    
                    it("uniqueId should return the appropriate value.", function () {
                        expect(refMainMoreFilters.facetColumns[5].choiceFilters[0].uniqueId).toBe("a", "missmatch for choices");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[0].uniqueId).toBe("> a", "missmatch for range");
                        expect(refMainMoreFilters.facetColumns[5].rangeFilters[1].uniqueId).toBe("< b", "missmatch for range");
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
            });
            
            describe("sourceReference and column APIs, ", function () {
                it ("should have filters of other facet columns, and not filters of itself.", function () {
                    checkSourceReference(
                        "mainTable, index=0", 
                        refMainMoreFilters.facetColumns[0], 
                        "M:=faceting_schema:main/int_col::gt::-2/$M/text_col=a;text_col=b;text_col::gt::a;text_col::lt::b;text_col::ciregexp::a;text_col::ciregexp::b/$M", 
                        {
                            "and":[
                                {"source": "int_col", "ranges": [{"min":-2}]},
                                {"source": "text_col", "choices": ["a","b"], "ranges": [ {"min":"a"},{"max":"b"}], "search": ["a","b"]}
                            ]
                        },
                        "id"
                    );
                    
                    checkSourceReference(
                        "mainTable, index=1", 
                        refMainMoreFilters.facetColumns[1], 
                        "M:=faceting_schema:main/id=1/$M/text_col=a;text_col=b;text_col::gt::a;text_col::lt::b;text_col::ciregexp::a;text_col::ciregexp::b/$M", 
                        {
                            "and":[
                                {"source": "id", "choices": ["1"]},
                                {"source": "text_col", "choices": ["a","b"], "ranges": [ {"min":"a"},{"max":"b"}], "search": ["a","b"]}
                            ]
                        },
                        "int_col"
                    );
                    
                    checkSourceReference(
                        "mainTable, index =5",
                        refMainMoreFilters.facetColumns[5], 
                        "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M", 
                        {
                            "and":[
                                {"source": "id", "choices": ["1"]},
                                {"source": "int_col", "ranges": [{"min":-2}]}
                            ]
                        },
                        "text_col"
                    );
                });
                
                it ("should have the search term from the reference.", function () {
                    checkSourceReference(
                        "secondpath_2, index=0",
                        refSP2.facetColumns[0],
                        "M:=faceting_schema:secondpath_2/*::ciregexp::term/$M",
                        {"and":[{"source":"*","search":["term"]}]},
                        "id"
                    );
                    
                    var ref = refMain.search("sometext");
                    checkSourceReference(
                        "mainTable, index=0, with search",
                        ref.facetColumns[5],
                        "M:=faceting_schema:main/*::ciregexp::sometext/$M/id=1/$M/int_col::gt::-2/$M",
                        {
                            "and":[
                                {"source":"*","search":["sometext"]},
                                {"source": "id", "choices": ["1"]},
                                {"source": "int_col", "ranges": [{"min":-2}]}
                            ]
                        },
                        "text_col"
                    );
                });
                
                it('should handle filters on columns with path.', function () {
                    checkSourceReference(
                        "mainTable with filter on FK, index = 9",
                        refMainFilterOnFK.facetColumns[9],
                        "T:=faceting_schema:main/id=1/$T/int_col::gt::-2/$T/M:=(fk_to_f2)=(faceting_schema:f2:id)",
                        {
                            "and":[
                                {"source": "id", "choices": ["1"]},
                                {"source": "int_col", "ranges": [{"min":-2}]}
                            ]
                        },
                        "id"
                    );
                    
                    checkSourceReference(
                        "mainTable with filter on FK, index = 0",
                        refMainFilterOnFK.facetColumns[0],
                        "M:=faceting_schema:main/int_col::gt::-2/$M/(fk_to_f2)=(faceting_schema:f2:id)/id=2;id=3/$M",
                        {
                            "and":[
                                {"source": "int_col", "ranges": [{"min":-2}]},
                                {"source": [{ "outbound":["faceting_schema", "main_fk2"]}, "id"], "choices":["2", "3"]}
                            ]
                        },
                        "id"
                    );
                });
            });
            
            describe ("getChoiceDisplaynames, ", function () {
                var checkChoiceDisplayname = function (objName, obj, uniqueId, value, isHTML) {
                        expect(obj.uniqueId).toEqual(uniqueId, objName + ": uniqueId missmatch.");
                        expect(obj.displayname.value).toEqual(value, objName + ": value missmatch.");
                        expect(obj.displayname.isHTML).toEqual(isHTML, objName + ": isHTMl missmatch.");
                };
                
                it ("should return an empty list, if there are no choice filters.", function (done) {
                    refMain.facetColumns[5].getChoiceDisplaynames().then(function (res){
                        expect(res.length).toEqual(0);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("should return the list of toStrings in scalar mode.", function (done) {
                    refMainMoreFilters.facetColumns[5].getChoiceDisplaynames().then(function (res){
                        expect(res.length).toEqual(2, "length missmatch.");
                        checkChoiceDisplayname("index=0", res[0], "a", "a", false);
                        checkChoiceDisplayname("index=1", res[1], "b", "b", false);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
                
                it ("should return the list of rownames in entity-mode.", function (done) {
                    refMainFilterOnFK.facetColumns[9].getChoiceDisplaynames().then(function (res){
                        expect(res.length).toEqual(2, "length missmatch.");
                        checkChoiceDisplayname("index=0", res[0], 2, "<strong>two</strong>", true);
                        checkChoiceDisplayname("index=0", res[1], 3, "<strong>three</strong>", true);
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });
            
        });
        
        // TODO change the value accordingly
        describe("should be able to handle facets with long paths.", function () {
            var ref;
            it ("should be able to construct a reference with multiple filters.", function () {
                // refMain has -> id=1, int_col>-2
                ref = refMain.facetColumns[12].addChoiceFilters(["a", "test"]);
                ref = ref.facetColumns[9].addChoiceFilters(["1", "2"]);
                ref = ref.facetColumns[10].addSearchFilter("t");
                ref = ref.facetColumns[2].addRangeFilter(-1, 20.2).reference;
                
                uri = "M:=faceting_schema:main/id=1/$M/int_col::gt::-2/$M/float_col::gt::-1&float_col::lt::20.2/$M/" +
                      "(fk_to_f2)=(faceting_schema:f2:id)/id=1;id=2/$M/" +
                      "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/term::ciregexp::t/$M/" +
                      "(id)=(faceting_schema:longpath_1:id)/(id)=(faceting_schema:longpath_2:id)/(id)=(faceting_schema:longpath_3:id)/(id)=(faceting_schema:longpath_4:id)/(id)=(faceting_schema:longpath_5:id)/col=a;col=test/$M";
                  
                facetObj = {
                    "and": [
                        {"source": "id", "choices":["1"]},
                        {"source":"int_col","ranges":[{"min":-2}]},
                        {"source":"float_col","ranges":[{"max":20.2,"min":-1}]},
                        {"source":[{"outbound":["faceting_schema","main_fk2"]},"id"],"choices":["1","2"]},
                        {
                            "source": [
                                {"inbound":  ["faceting_schema","main_f3_assoc_fk1"]},
                                {"outbound": ["faceting_schema","main_f3_assoc_fk2"]},
                                "term"
                            ],
                            "search": ["t"]
                        },
                        {
                            "source": [
                                {"inbound": ["faceting_schema","longpath_1_fk1"]},
                                {"inbound": ["faceting_schema","longpath_2_fk1"]},
                                {"inbound": ["faceting_schema","longpath_3_fk1"]},
                                {"inbound": ["faceting_schema","longpath_4_fk1"]},
                                {"inbound": ["faceting_schema","longpath_5_fk1"]},
                                "col"
                            ],
                            "choices":["a","test"]
                        }
                    ]
                };
                
                expect(ref.location.ermrestCompactPath).toEqual(uri, "uri missmatch.");
                expect(JSON.stringify(ref.location.facets.decoded)).toEqual(JSON.stringify(facetObj), "facets missmatch.");
            });
            
            it ("sourceReference should return the correct reference.", function () {
                checkSourceReference(
                    "new refernece, index = 0",
                    ref.facetColumns[0],
                    "M:=faceting_schema:main/int_col::gt::-2/$M/float_col::gt::-1&float_col::lt::20.2/$M/" +
                    "(fk_to_f2)=(faceting_schema:f2:id)/id=1;id=2/$M/" +
                    "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/term::ciregexp::t/$M/" +
                    "(id)=(faceting_schema:longpath_1:id)/(id)=(faceting_schema:longpath_2:id)/(id)=(faceting_schema:longpath_3:id)/(id)=(faceting_schema:longpath_4:id)/(id)=(faceting_schema:longpath_5:id)/col=a;col=test/$M",
                    {
                        "and": [
                            {"source":"int_col","ranges":[{"min":-2}]},
                            {"source":"float_col","ranges":[{"max":20.2,"min":-1}]},
                            {"source":[{"outbound":["faceting_schema","main_fk2"]},"id"],"choices":["1","2"]},
                            {
                                "source": [
                                    {"inbound":  ["faceting_schema","main_f3_assoc_fk1"]},
                                    {"outbound": ["faceting_schema","main_f3_assoc_fk2"]},
                                    "term"
                                ],
                                "search": ["t"]
                            },
                            {
                                "source": [
                                    {"inbound": ["faceting_schema","longpath_1_fk1"]},
                                    {"inbound": ["faceting_schema","longpath_2_fk1"]},
                                    {"inbound": ["faceting_schema","longpath_3_fk1"]},
                                    {"inbound": ["faceting_schema","longpath_4_fk1"]},
                                    {"inbound": ["faceting_schema","longpath_5_fk1"]},
                                    "col"
                                ],
                                "choices":["a","test"]
                            }
                        ]
                    },
                    "id"
                );
                
                checkSourceReference(
                    "new refernece, index = 13",
                    ref.facetColumns[12],
                    "T:=faceting_schema:main/id=1/$T/int_col::gt::-2/$T/float_col::gt::-1&float_col::lt::20.2/$T/" +
                    "(fk_to_f2)=(faceting_schema:f2:id)/id=1;id=2/$T/" +
                    "(id)=(faceting_schema:main_f3_assoc:id_main)/(id_f3)=(faceting_schema:f3:id)/term::ciregexp::t/$T/" +
                    "(id)=(faceting_schema:longpath_1:id)/(id)=(faceting_schema:longpath_2:id)/(id)=(faceting_schema:longpath_3:id)/(id)=(faceting_schema:longpath_4:id)/M:=(id)=(faceting_schema:longpath_5:id)",
                    {
                        "and": [
                            {"source": "id", "choices":["1"]},
                            {"source":"int_col","ranges":[{"min":-2}]},
                            {"source":"float_col","ranges":[{"max":20.2,"min":-1}]},
                            {"source":[{"outbound":["faceting_schema","main_fk2"]},"id"],"choices":["1","2"]},
                            {
                                "source": [
                                    {"inbound":  ["faceting_schema","main_f3_assoc_fk1"]},
                                    {"outbound": ["faceting_schema","main_f3_assoc_fk2"]},
                                    "term"
                                ],
                                "search": ["t"]
                            }
                        ]
                    },
                    "col"
                );
            });
            
            it ("read on sourceReference should return the expected values.", function (done) {
                ref.facetColumns[0].sourceReference.read(25).then(function (p) {
                    expect(p._data[0].id).toEqual(1, "data missmatch for index = 0");
                    return ref.facetColumns[12].sourceReference.read(25);
                }).then(function (p){
                    expect(p._data[0].col).toEqual("test", "col missmatch for index = 13");
                    expect(p._data[0].id).toEqual(1, "id missmatch for index = 13");
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });
        });
    });
};
