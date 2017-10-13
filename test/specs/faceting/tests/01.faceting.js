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
     */
    
    
    describe('for testing faceting features, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "faceting_schema",
            tableF1 = "f1", 
            tableF2 = "f2",
            tableF4 = "f4",
            tableWOAnnot1 = "main_wo_faceting_annot_1",
            tableWOAnnot2 = "main_wo_faceting_annot_2",
            tableMain = "main";
        
        var refF1, refF2, refF4, refMain, refWOAnnot1, refWOAnnot2;
        var mainFacets;
        var i;
        
        var createURL = function (tableName, facet) {
            var res =  options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
            if (facet) {
                res += "/*::facets::" + options.ermRest.encodeFacet(facet);
            }
            return res;
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
            
            //get all the references needed for the test cases
            options.ermRest.resolve(createURL(tableF1), {cid: "test"}).then(function (ref) {
                refF1 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableF2), {cid: "test"});
            }).then(function (ref) {
                refF2 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableF4), {cid: "test"});
            }).then(function (ref) {
                refF4 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableWOAnnot1), {cid: "test"});
            }).then(function (ref) {
                refWOAnnot1 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableWOAnnot2), {cid: "test"});
            }).then(function (ref) {
                refWOAnnot2 = ref.contextualize.compact;
                return options.ermRest.resolve(createURL(tableMain), {cid: "test"});
            }).then(function (ref) {
                refMain = ref.contextualize.compact;
                mainFacets = refMain.facetColumns;
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });
        
        describe("Reference.facetColumns, ", function () {
            describe ("when `filter` annotation is not defined, ", function () {
                describe("when visible columns for `compact` and related entities for `detailed` are wellformed.", function () {
                    // f4
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
                
                it ("it should ignore asset columns, and any inbound or outbound composite foreign keys, or composite keys.", function () {
                    // main_wo_faceting_annot_1
                    expect(refWOAnnot1.facetColumns.length).toBe(0);
                });
                
                it ("it should ignore columns with `longtext`, `markdown`, and `serial` type if it's not entity picker.", function () {
                    // main_wo_faceting_annot_2
                    expect(refWOAnnot2.facetColumns.length).toBe(0);
                });
                
                // TODO alternative table
            });
            
            describe("when `filter` annotation is defined, ", function () {
                it ("if it's not in the valid format, should use heuristics.", function () {
                    expect(refF1.facetColumns.length).toBe(2, "length missmatch.");
                    expect(refF1.facetColumns[0]._column.name).toBe("term", "column name missmatch.");
                    expect(refF1.facetColumns[0]._column.table.name).toBe("f1", "table name missmatch.");
                    expect(refF1.facetColumns[0].dataSource).toBe("term", "dataSource missmatch.");
                    expect(refF1.facetColumns[0].isEntityMode).toBe(false, "entityMode missmatch.");
                });
                
                it ("should ignore invalid facets.", function () {
                    expect(refF2.facetColumns.length).toBe(0);
                });
                
                it ("should create facets based on what data modelers have defined.", function () {
                    expect(refMain.facetColumns.length).toBe(13);
                    
                    expect(refMain.facetColumns.map(function (fc) {
                        return fc._column.name;
                    })).toEqual(
                        ['id', 'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col', 'longtext_col', 'markdown_col', 'id', 'id', 'term', 'id', 'col']
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
            });
            
            
            describe("if reference already has facets applied, ", function () {
                var facetObj;
                it ("if it's not part of visible facets, should be appended to list of facets.", function (done) {
                    facetObj = { "and": [ {"source": "unfaceted_column", "search": ["test"]} ] };
                    options.ermRest.resolve(createURL(tableMain, facetObj)).then(function (ref) {
                        var facetColumns = ref.facetColumns;
                        expect(ref.facetColumns.length).toBe(14, "length missmatch.");
                        expect(ref.facetColumns[13]._column.name).toBe("unfaceted_column", "column name missmatch.");
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
                        var facetColumns = ref.facetColumns;
                        expect(ref.facetColumns.length).toBe(13, "length missmatch.");
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
                        var facetColumns = ref.facetColumns;
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
                
            });
            
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
                    
                    for (i = 10; i < 13; i ++) {
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
                        [5, 6, 7, 10, 12].forEach(function (fc) {
                            expect(mainFacets[fc].preferredMode).toBe("choices", "missmatch for facet index=" + fc);
                        });
                    });
                });
            });
            
            describe("displayname, ", function () {
                var checkDisplayname = function (index, value, isHTML) {
                    var disp = mainFacets[index].displayname;
                    expect(disp.value).toBe(value, "value missmatch for index="+ index);
                    expect(disp.isHTML).toBe(isHTML, "isHTML missmatch for index="+ index);
                    
                };
                
                it ("if `markdown_name` is defined, should return it.", function () {
                    checkDisplayname(8, "<strong>F1</strong>", true);
                });
                
                it ("if source is not an array, should return the column's displayname.", function () {
                    checkDisplayname(0, "id", false);
                    checkDisplayname(1, "int_col", false);
                    checkDisplayname(2, "float_col", false);
                    checkDisplayname(3, "date_col", false);
                    checkDisplayname(4, "timestamp_col", false);
                    checkDisplayname(5, "text_col", false);
                    checkDisplayname(6, "longtext_col", false);
                    checkDisplayname(7, "markdown_col", false);
                });
                
                describe('otherwise (source is an array), ', function () {
                    it ('if the last foreignKey in path is inbound, and from_name is defined, should return it.', function () {
                        checkDisplayname(12, "from_name", false);
                    });
                    
                    it ('if the last foreignKey in path is outbound, and to_name is defined, should return it.', function () {
                        checkDisplayname(9, "to_name", false);
                    });
                    
                    it ('otherwise should return the table\'s name and in scalar mode, should add column\'s name too', function () {
                        checkDisplayname(10, "f3 (term)", false);
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
            
            /*
            describe("sourceReference, ", function () {
                it ("should have the search term from the reference.", function () {
                    
                });
                
                it ("should have filters of other facet columns.", function () {
                    
                });
            });
            
            describe("column, ", function () {
                it ("should be based on sourceReference.", function () {
                    
                });
                
                it ('should point to the last column in path.', function () {
                    
                });
            });
            */
            
            // describe ("getChoiceDisplaynames, ", function (done) {
            //     done(); // TODO
            // });
            
            // TODO filter manipulation functions
            
            
            
        });
    });
};
