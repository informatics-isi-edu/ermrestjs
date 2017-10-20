exports.execute = function (options) {
    
    describe("Regarding Attributegroup Reference APIs, ", function () {
        var catID = process.env.DEFAULT_CATALOG,
            schemaName = "agref_schema",
            mainTable = "main",
            relatedTable = "related_table";
            
        var mainTableBaseUri = [
            options.url, "catalog", catID, "attributegroup", 
            schemaName + ":" + mainTable
        ].join("/");
        
        var ref, refWithModifiers;
        var loc, locWithModifiers;
        var keyColVisible, keyColInvisible, aggColVisible, aggColInvisible;
        
        describe("AttributeGroupLocation, ", function () {
            var checkLocation = function (obj, objName, path) {
                expect(loc).toBeDefined(objName + " was not defined.");
                expect(loc.service).toBe(options.url, objName + " service missmatch.");
                expect(loc.catalogId).toBe(catID, objName + " catalogId missmatch.");
                expect(loc.path).toBe(path, objName + " path missmatch.");
            };
            
            beforeAll(function () {
                loc = new options.ermRest.AttributeGroupLocation(options.url, catID, schemaName + ":" + mainTable);
                locWithModifiers = new options.ermRest.AttributeGroupLocation(
                    options.url, 
                    catID, 
                    schemaName + ":" + mainTable,
                    {"column": "col", "term": "test"}, // search
                    [{"column": "alias"}], // sort
                    {"before": true, "row": ["20"]} // paging
                );
            });
            
            it ("can create a location object passing the values.", function () {
                checkLocation(loc, "loc", schemaName + ":" + mainTable);
                
                checkLocation(locWithModifiers, "locWithModifiers", schemaName + ":" + mainTable);
            });
            
            it ("search related attributes are correct.", function () {
                expect(loc.searchObject).toBeUndefined("searchObject was defined.");
                expect(loc.searchTerm).toBeUndefined("searchTerm was defined.");
                expect(loc.searchColumn).toBeUndefined("searchColumn was defined.");
                expect(loc.searchFilter).toBeUndefined("searchFilter was defined.");
                
                expect(locWithModifiers.searchTerm).toBe("test", "searchTerm missmatch.");
                expect(locWithModifiers.searchColumn).toBe("col", "searchColumn missmatch.");
                expect(locWithModifiers.searchFilter).toBe("col::ciregexp::test", "searchFilter missmatch.");
            });
            
            it ("sorting related attributes are correct.", function () {
                expect(loc.sortObject).toBeUndefined("sortObject was defined.");
                expect(loc.sort).toBeUndefined("sort was defined.");
                
                expect(locWithModifiers.sort).toBe("@sort(alias)");
            });
            
            it ("paging related attributes are correct.", function () {
                expect(loc.pagingObject).toBeUndefined("sortObject was defined.");
                expect(loc.paging).toBeUndefined("sort was defined.");
                
                expect(locWithModifiers.paging).toBe("@before(20)");
            });
            
            it ("changeSearchTerm returns a new object with new search attributes.", function () {
                var newLoc = loc.changeSearchTerm("newTerm");
                expect(loc).not.toBe(newLoc, "Didn't return a new object.");
                expect(loc.searchObject).toBeUndefined("changed original object.");
                expect(newLoc.searchTerm).toBe("newTerm", "searchTerm missmatch");
                expect(newLoc.searchColumn).toBe(loc.searchColumn, "searchColumn missmatch");
            });
            
            it ("changeSort returns a new object with new sorting attributes.", function () {
                var newLoc = loc.changeSort([{"column": "col", "descending": true}]);
                expect(loc).not.toBe(newLoc, "Didn't return a new object.");
                expect(loc.sortObject).toBeUndefined("changed original object.");
                expect(newLoc.sort).toBe("@sort(col::desc::)");
            });
            
            it ("changePage returns a new object with new paging attributes.", function () {
                var newLoc = loc.changePage({"before": false, "row":["1"]});
                expect(loc).not.toBe(newLoc, "Didn't return a new object.");
                expect(loc.pagingObject).toBeUndefined("changed original object.");
                expect(newLoc.paging).toBe("@after(1)");
            });
        });
        
        describe("AttributeGroupColumn, ", function () {
            var checkColumn = function (objTitle, obj, term, displayname, typeName, comment, sortable) {
                expect(obj).toBeDefined(objTitle + " column was undefined.");
                expect(obj.term).toBe(term, objTitle + " term missmatch");
                expect(obj.displayname.value).toBe(displayname, objTitle + " displayname missmatch");
                expect(obj.type.name).toBe(typeName, objTitle + " type missmatch");
                expect(obj.comment).toBe(comment, objTitle + " comment missmatch");
                expect(obj.sortable).toBe(sortable, objTitle + " sortable missmatch");
                
            };
            
            beforeAll(function () {
                keyColVisible = new options.ermRest.AttributeGroupColumn(
                    null, "col", "column", "markdown", "comment", true, true
                );
                
                keyColInvisible = new options.ermRest.AttributeGroupColumn(
                    "alias", "invis_col", "invisible column", "text", "", false, false
                );
                
                aggColVisible = new options.ermRest.AttributeGroupColumn(
                    "c2", "cnt(*)", "count", "int4", "", true, true
                );
                
                aggColInvisible = new options.ermRest.AttributeGroupColumn(
                    "c3", "cnt_d(col)", "count col", "int4", "", true, false
                );
            });
            
            it ("can create column objects.", function () {
                checkColumn("keyColVisible", keyColVisible, "col", "column", "markdown", "comment", true);
                
                checkColumn("keyColInvisible", keyColInvisible, "invis_col", "invisible column", "text", "", false);
                
                checkColumn("aggColVisible", aggColVisible, "cnt(*)", "count", "int4", "", true);

                checkColumn("aggColInvisible", aggColInvisible, "cnt_d(col)", "count col", "int4", "", true);
            });
            
            describe ("toString, ", function () {
                it ("if column has an alias, should return alias:=term.", function () {
                    expect(keyColInvisible.toString()).toBe("alias:=invis_col", "keyColInvisible toString missmatch.");
                    expect(aggColVisible.toString()).toBe("c2:=cnt(*)", "aggColVisible toString missmatch.");
                    expect(aggColInvisible.toString()).toBe("c3:=cnt_d(col)", "aggColInvisible toString missmatch.");
                });
                
                it ("otherwise should return the term.", function() {
                    expect(keyColVisible.toString()).toBe("col");
                });
            });
            
            describe ("name, ", function () {
                it ("if column has an alias, should return the alias.", function () {
                    expect(keyColInvisible.name).toBe("alias", "keyColInvisible name missmatch.");
                    expect(aggColVisible.name).toBe("c2", "aggColVisible name missmatch.");
                    expect(aggColInvisible.name).toBe("c3", "aggColInvisible name missmatch.");
                });
                
                it ("otherwise should return the term.", function () {
                    expect(keyColVisible.name).toBe("col");
                });
            });
            
            describe ("formatvalue, ", function () {
                var val;
                it ("if data is null or undefined should return empty string.", function () {
                    expect(keyColVisible.formatvalue(undefined)).toBe("", "undefined missmatch.");
                    expect(keyColVisible.formatvalue(null)).toBe("", "null missmatch.");
                });
                
                it ("otherwise should format the value.", function () {
                    expect(keyColVisible.formatvalue("*markdown*")).toBe("*markdown*", "keyColVisible missmatch.");
                    expect(keyColInvisible.formatvalue("some text")).toBe("some text", "keyColInvisible missmatch.");
                    expect(aggColVisible.formatvalue(1231)).toBe("1,231", "aggColVisible missmatch.");
                });
            });
            
            describe ("formatPresentation, ", function () {
                it ("if column type is markdown should return render it.", function () {
                    expect(keyColVisible.formatPresentation("*markdown*").value).toBe("<em>markdown</em>", "keyColVisible missmatch.");
                });
                
                it ("otherwise jsut return the given data.", function () {
                    expect(keyColInvisible.formatPresentation("some text").value).toBe("some text", "keyColInvisible missmatch.");
                });
            });
        });
        
        describe("AttributeGroupReference, ", function () {
            var checkReference = function (objName, obj, location) {
                expect(obj).toBeDefined(objName + " is not defined.");
                expect(obj.location).toBe(location, objName + " location missmatch.");
            };
            
            beforeAll(function () {
                ref = new options.ermRest.AttributeGroupReference(
                    [keyColVisible, keyColInvisible],
                    [aggColVisible, aggColInvisible],
                    loc,
                    options.catalog
                );
                
                refWithModifiers = new options.ermRest.AttributeGroupReference(
                    [keyColVisible, keyColInvisible],
                    [aggColVisible, aggColInvisible],
                    locWithModifiers,
                    options.catalog
                );
            });
            
            it ('can create reference objects.', function () {
                checkReference("ref", ref, loc);
                checkReference("refWithModifiers", refWithModifiers, locWithModifiers);
            });
            
            it ("columns should return visible columns.", function () {
                expect(ref.columns.map(function (col) {
                    return col.name;
                })).toEqual(["col", "c2"]);
            });
            
            it ("shortestKey should return an array of key columns.", function () {
                expect(ref.shortestKey.map(function (col) {
                    return col.name;
                })).toEqual(["col", "alias"]);
            });
            
            it ("uri should return a complete uri to the data.", function () {
                expect(ref.uri).toBe(
                    mainTableBaseUri + "/col,alias:=invis_col;c2:=cnt(*),c3:=cnt_d(col)", 
                    "ref uri missmatch."
                );
                
                expect(refWithModifiers.uri).toBe(
                    mainTableBaseUri + "/col::ciregexp::test/col,alias:=invis_col;c2:=cnt(*),c3:=cnt_d(col)@sort(alias)@before(20)",
                    "refWithModifiers uri missmatch."
                );
            });
            
            describe("sort, ", function () {
                it ("should verify the input", function () {
                    expect(function () {
                        var r = refWithModifiers.sort({"column": "c1"});
                    }).toThrow("input should be an array");
                    
                    expect(function () {
                        var r = refWithModifiers.sort([{"col": "c1"}]);
                    }).toThrow("invalid arguments in array");
                });
                
                it ("should return a new reference with new sort.", function () {
                    var newRef = refWithModifiers.sort([{"column": "invis_col", "descending": true}]);
                    expect(newRef.location.sort).toBe("@sort(invis_col::desc::)");
                });
            });
            
            describe("search, ", function () {
                it ('should verify the input', function () {
                    expect(function () {
                        var r = refWithModifiers.search(22);
                    }).toThrow("Invalid argument");
                });
                
                it ("should throw an error if the reference's location doesn't have any search columns.", function () {
                    expect(function () {
                        var r = ref.search("new");
                    }).toThrow("Location object doesnt have search column.");
                });
                
                it ("should return a new reference with new searchTerm.", function () {
                    var newRef = refWithModifiers.search("new search");
                    expect(newRef).not.toBe(refWithModifiers, "reference didn't change");
                    expect(refWithModifiers.location.searchTerm).toBe("test", "main reference changed.");
                    expect(newRef.location.searchTerm).toBe("new search", "searchTerm didn't change.");
                });
            });            

            describe("getAggregates, ", function () {
                it ("should throw an error if reference has composite key.", function () {
                    expect(function () {
                        var aggList = [refWithModifiers.aggregate.countAgg];
                    }).toThrow("Cannot use count function, attribute group has more than one key column.");
                });
                
                it ("countAgg should return the count.", function (done) {
                    var newRef = new options.ermRest.AttributeGroupReference(
                        [keyColVisible], [aggColVisible], loc, options.catalog
                    );
                    var aggList = [newRef.aggregate.countAgg];
                    newRef.getAggregates(aggList).then(function (response) {
                        // TODO change this based on data
                        expect(response[0]).toBe(13);
                        done();
                    }).catch(function (err) {
                        consoel.log(err);
                        done.fail();
                    });
                });
            });
           
            describe("read, ", function () {
                var page, tuples;
                
                it ("should return a page object.", function (done) {
                    refWithModifiers.read(2).then(function (response) {
                        page = response;
                        expect(page).toBeDefined("page was not defined.");
                        done();
                    }).catch(function (err) {
                        consoel.log(err);
                        done.fail();
                    });
                });
                
                describe("page, ", function () {                    
                    it ("next should return a new reference with paging options.", function () {
                        var newRef = page.next;
                        expect(newRef).toBeDefined("reference was not defined");
                        expect(newRef.location.paging).toBe("@after(19)", "paging missmatch.");
                    });
                    
                    it ("previous should return a new reference with paging options.", function () {
                        var newRef = page.previous;
                        expect(newRef).toBeDefined("reference was not defined");
                        expect(newRef.location.paging).toBe("@before(18)", "paging missmatch.");
                    });
                    
                    it ("tuples should return an array of tuples.", function () {
                        tuples = page.tuples;
                        expect(tuples).toBeDefined("tupels was not defined");
                        expect(tuples.length).toBe(2, "length missmatch.");
                    });
                    
                    describe("tuple, ", function () {
                        it ("values should return an array of valeus.", function () {
                            var values = tuples[0].values;
                            expect(values).toEqual([
                                '<strong>test2</strong>', '2'
                            ]);
                        });
                        
                        it ("isHTML should return an array of valeus.", function () {
                            var isHTML = tuples[0].isHTML;
                            expect(isHTML).toEqual([
                                true, false
                            ]);
                        });
                        
                        it ("data should return the raw data.", function () {
                            var data = tuples[0].data;
                            expect(data.col).toEqual("**test2**", "col data missmatch.");
                            expect(data.alias).toEqual("18", "alias data missmatch.");
                            expect(data.c2).toEqual(2, "c2 data missmatch.");
                            expect(data.c3).toEqual(1, "c3 data missmatch.");
                        });
                        
                        it ("displayname should return rowname based on key columns.", function () {
                            var disp = tuples[0].displayname;
                            expect(disp.value).toBe("<strong>test2</strong>:18", "value missmatch.");
                            expect(disp.unformatted).toBe("**test2**:18", "unformatted missmatch.");
                            expect(disp.isHTML).toBe(true, "isHTML missmatch.");
                        });
                        
                        it ("uniqueId should return an id based on shortest key.", function () {
                            expect(tuples[0].uniqueId).toBe("**test2**_18");
                        });
                    });
                });
            });
        });
        
    });

};
