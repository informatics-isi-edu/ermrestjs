exports.execute = function (options) {

    describe("Regarding Attributegroup Reference APIs, ", function () {
        var catID = process.env.DEFAULT_CATALOG,
            schemaName = "agref_schema",
            mainTable = "main",
            unicodeTable = "uᴉɐɯ",
            unicodeTableEncoded = "u%E1%B4%89%C9%90%C9%AF",
            relatedTable = "related_table";

        var encodedMain = "u%E1%B4%89%C9%90%C9%AF",
            decodedMain = "uᴉɐɯ",
            encodedCol = "lo%C9%94",
            decodedCol = "loɔ",
            encodedID = "p%E1%B4%89";
            decodedID = "pᴉ";

        var schema;
        var mainTableBasePath = schemaName + ":" + mainTable;

        var mainTableBaseUri = [
            options.url, "catalog", catID, "attributegroup",
            mainTableBasePath
        ].join("/");

        var unicodeTableBaseUri = [
            options.url, "catalog", catID, "attributegroup",
            schemaName + ":" + unicodeTableEncoded
        ].join("/");

        var ref, refWithModifiers, refColumnOrder, refColumnOrderSorted, unicodeRef;
        var loc, locWithModifiers, unicodeLoc;
        var keyColVisible, keyColVisible2, keyColInvisible, keyColOrder, keyColOrder2, aggColVisible, aggColInvisible, aggColNoSort, unicodeID, unicodeCol;

        var checkLocation = function (objName, obj, path) {
            expect(obj).toBeDefined(objName + " was not defined.");
            expect(obj.service).toBe(options.url, objName + " service missmatch.");
            expect(obj.catalog.id).toBe(catID, objName + " catalog missmatch.");
            expect(obj.path).toBe(path, objName + " path missmatch.");
        };

        var checkColumn = function (objName, obj, term, displayname, typeName, comment, sortable) {
            expect(obj).toBeDefined(objName + " column was undefined.");
            expect(obj.term).toBe(term, objName + " term missmatch");
            expect(obj.displayname.value).toBe(displayname, objName + " displayname missmatch");
            expect(obj.type.name).toBe(typeName, objName + " type missmatch");
            expect(obj.comment).toBe(comment, objName + " comment missmatch");
            expect(obj.sortable).toBe(sortable, objName + " sortable missmatch");
        };

        var checkReference = function (objName, obj, location) {
            expect(obj).toBeDefined(objName + " is not defined.");
            expect(obj.location).toBe(location, objName + " location missmatch.");
        };

        beforeAll(function () {
            schema = options.catalog.schemas.get(schemaName);
        });

        describe("AttributeGroupLocation, ", function () {
            beforeAll(function () {
                loc = new options.ermRest.AttributeGroupLocation(options.url, options.catalog, schemaName + ":" + mainTable);
                locWithModifiers = new options.ermRest.AttributeGroupLocation(
                    options.url,
                    options.catalog,
                    schemaName + ":" + mainTable,
                    {"column": "col", "term": "test"}, // search
                    [{"column": "alias"}], // sort
                    null, //after
                    ["20"] // before
                );
            });

            it ("can create a location object passing the values.", function () {
                checkLocation("loc", loc, schemaName + ":" + mainTable);

                checkLocation("locWithModifiers", locWithModifiers, schemaName + ":" + mainTable);
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

                expect(locWithModifiers.sortObject[0]).toEqual({"column": "alias"}, "sortObject undefined for locWithModifiers");
            });

            it ("paging related attributes are correct.", function () {
                expect(loc.beforeObject).toBeUndefined("beforeObject was defined.");
                expect(loc.afterObject).toBeUndefined("afterObject was defined.");
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

            describe ("changeSort, ", function () {
                it ("returns a new object with new sorting attributes.", function () {
                    var newLoc = loc.changeSort([{"column": "col", "descending": true}]);
                    expect(loc).not.toBe(newLoc, "Didn't return a new object.");
                    expect(loc.sortObject).toBeUndefined("changed original object.");
                    expect(newLoc.sortObject[0]).toEqual({"column": "col", "descending": true}, "sortObject missmatch");
                });

                it ("should remove all the pagings.", function () {
                    var newLoc = locWithModifiers.changeSort([{"column": "col", "descending": true}]);
                    expect(locWithModifiers).not.toBe(newLoc, "Didn't return a new object.");
                    expect(locWithModifiers.sortObject[0]).toEqual({"column": "alias"},"changed original object.");
                    expect(locWithModifiers.beforeObject).toBeDefined("changed original before.");
                    expect(locWithModifiers.afterObject).toBeDefined("changed original after.");
                    expect(newLoc.sortObject[0]).toEqual({"column": "col", "descending": true}, "sortObject missmatch.");
                    expect(newLoc.beforeObject).toBeUndefined("didn't remove before.");
                    expect(newLoc.afterObject).toBeUndefined("didn't remove after.");
                });
            });

            it ("changePage returns a new object with new paging attributes.", function () {
                var newLoc = loc.changePage(["1"], null);
                expect(loc).not.toBe(newLoc, "Didn't return a new object.");
                expect(loc.afterObject).toBeUndefined("changed oridingal object sort.");
                expect(newLoc.paging).toBe("@after(1)", "paging missmatch.");
                expect(newLoc.afterObject).toEqual(["1"], "afterObject missmatch.");
            });
        });

        describe("AttributeGroupColumn, ", function () {

            beforeAll(function () {
                keyColVisible = new options.ermRest.AttributeGroupColumn(
                    null, "col", null, "column", "markdown", "comment", true, true
                );

                var col = schema.tables.get(mainTable).columns.get("col_w_pre_format");
                keyColVisible2 = new options.ermRest.AttributeGroupColumn(
                    null, "col_w_pre_format", col, null, null, null, true, true
                );

                keyColInvisible = new options.ermRest.AttributeGroupColumn(
                    "alias", "invis_col", null, "invisible column", "text", "", true, false
                );


                col = schema.tables.get(mainTable).columns.get("col_w_column_order");
                keyColOrder = new options.ermRest.AttributeGroupColumn(
                    "0", col.name, col, null, null, null, true, true
                );

                col = schema.tables.get(mainTable).columns.get("col_w_column_order_false");
                keyColOrder2 = new options.ermRest.AttributeGroupColumn(
                    "1", col.name, col, null, null, null, true, true
                );

                aggColNoSort = new options.ermRest.AttributeGroupColumn(
                    "2", "cnt(*)", null, "count", "int4", "", false, false
                );

                aggColVisible = new options.ermRest.AttributeGroupColumn(
                    "c2", "cnt(*)", null, "count", "int4", "", true, true
                );

                aggColInvisible = new options.ermRest.AttributeGroupColumn(
                    "c3", "cnt_d(col)", null, "count col", "int4", "", true, false
                );
            });

            it ("can create column objects.", function () {
                checkColumn("keyColVisible", keyColVisible, "col", "column", "markdown", "comment", true);

                checkColumn("keyColVisible with base column", keyColVisible2, "col_w_pre_format", "col_w_pre_format", "boolean", null, true);

                checkColumn("keyColInvisible", keyColInvisible, "invis_col", "invisible column", "text", "", true);

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
                it ("if data is null or undefined should return `null`.", function () {
                    expect(keyColVisible.formatvalue(undefined)).toBe(null, "undefined missmatch.");
                    expect(keyColVisible.formatvalue(null)).toBe(null, "null missmatch.");
                });

                it ("if baseColumn is defined, should honor the annotation defined on it.", function () {
                    expect(keyColVisible2.formatvalue(true, "compact")).toBe("YES", "missmatch for compact");
                    expect(keyColVisible2.formatvalue(true, "detailed")).toBe("true", "missmatch for detailed");
                });

                it ("otherwise should format the value.", function () {
                    expect(keyColVisible.formatvalue("*markdown*")).toBe("*markdown*", "keyColVisible missmatch.");
                    expect(keyColInvisible.formatvalue("some text")).toBe("some text", "keyColInvisible missmatch.");
                    expect(aggColVisible.formatvalue(1231)).toBe("1,231", "aggColVisible missmatch.");
                });
            });

            describe ("formatPresentation, ", function () {
                it ("if column type is markdown should return render it.", function () {
                    expect(keyColVisible.formatPresentation({"col": "*markdown*"}).value).toBe("<em>markdown</em>", "keyColVisible missmatch.");
                });

                it ("otherwise return the formatted data.", function () {
                    expect(keyColVisible2.formatPresentation({"col_w_pre_format": false}, "compact/select").value).toBe("NO", "keyColVisible2 missmatch.");
                    expect(keyColInvisible.formatPresentation({"alias": "some text"}).value).toBe("some text", "keyColInvisible missmatch.");
                });
            });
        });

        describe("AttributeGroupReference, ", function () {
            var table;

            beforeAll(function () {
                table = schema.tables.get(mainTable);

                ref = new options.ermRest.AttributeGroupReference(
                    [keyColVisible, keyColInvisible, keyColVisible2],
                    [aggColVisible, aggColInvisible],
                    loc,
                    options.catalog
                );

                refWithModifiers = new options.ermRest.AttributeGroupReference(
                    [keyColVisible, keyColInvisible, keyColVisible2],
                    [aggColVisible, aggColInvisible],
                    locWithModifiers,
                    options.catalog,
                    table,
                    "compact/select"
                );

                refColumnOrder = new options.ermRest.AttributeGroupReference(
                    [keyColOrder, keyColOrder2],
                    [aggColNoSort],
                    loc,
                    options.catalog,
                    null,
                    "compact/select"
                );
            });

            it ('can create reference objects.', function () {
                checkReference("ref", ref, loc);
                checkReference("refWithModifiers", refWithModifiers, locWithModifiers);
            });

            it ("table should be the source table.", function () {
                expect(ref.table).toBeUndefined(".table property when not present should be undefined");
                expect(refWithModifiers.table).toBe(table, ".table is not the expected table");
                expect(refColumnOrder.table).toBeNull(".table property when set as 'null' is not 'null'");
            });

            it ("columns should return visible columns.", function () {
                expect(ref.columns.map(function (col) {
                    return col.name;
                })).toEqual(["col", "col_w_pre_format", "c2"]);
            });

            it ("shortestKey should return an array of visible key columns.", function () {
                expect(ref.shortestKey.map(function (col) {
                    return col.name;
                })).toEqual(["col", "col_w_pre_format"]);
            });

            // since these are context based APIs, so they should be this way.
            describe("Column _sortColumns and sortable", function () {
                it ("sortable should return false if column is not sortable.", function () {
                    // TODO
                });

                it ("should return the same column if it's sortable and has no baseColumn.", function () {
                    // TODO
                });

                it ("should return the base column's column_order if it's defined.", function () {
                    // TODO
                });
            });

            it ("uri should return a complete uri to the data.", function () {
                expect(ref.uri).toBe(
                    mainTableBaseUri + "/col,alias:=invis_col,col_w_pre_format;c2:=cnt(*),c3:=cnt_d(col)",
                    "ref uri missmatch."
                );

                expect(refWithModifiers.uri).toBe(
                    mainTableBaseUri + "/col::ciregexp::test/col,alias:=invis_col,col_w_pre_format;c2:=cnt(*),c3:=cnt_d(col)@sort(alias)@before(20)",
                    "refWithModifiers uri missmatch."
                );
            });

            it ("unfilteredReference should return an error when a table is not defined as part of the constructor.", function () {
                try {
                    var errorRef = ref.unfilteredReference;
                } catch (err) {
                    expect(err.message).toBe("table is not defined for current reference");
                }
            });

            it ("unfilteredReference should be defined when a table is defined as part of the constructor.", function () {
                var unfilteredRef = refWithModifiers.unfilteredReference;
                var unfilteredUri = mainTableBaseUri + "/col,alias:=invis_col,col_w_pre_format;c2:=cnt(*),c3:=cnt_d(col)";
                var unfilteredPath = mainTableBasePath + "/col,alias:=invis_col,col_w_pre_format;c2:=cnt(*),c3:=cnt_d(col)";

                expect(unfilteredRef.location).toEqual(loc, "unfilteredRef location mismatch.");
                expect(unfilteredRef._catalog).toBe(options.catalog, "unfilteredRef catalog mismatch.");
                expect(unfilteredRef.table).toBe(table, "unfilteredRef table missmatch.");

                // uri and ermrestPath should not have modifiers on it
                expect(unfilteredRef.uri).toBe(unfilteredUri, "unfilteredRef uri mismatch.");
                expect(unfilteredRef.ermrestPath).toBe(unfilteredPath, "unfilteredRef ermrestPath mismatch.");

                // sort object should be empty
                expect(unfilteredRef.ermrestSortObject).toEqual([], "unfilteredRef sortObject mismatch");
            });

            it("ermrestPath should return the path.", function () {
                expect(ref.ermrestPath).toBe(
                    mainTableBasePath + "/col,alias:=invis_col,col_w_pre_format;c2:=cnt(*),c3:=cnt_d(col)",
                    "ref uri missmatch."
                );

                expect(refWithModifiers.ermrestPath).toBe(
                    mainTableBasePath + "/col::ciregexp::test/col,alias:=invis_col,col_w_pre_format;c2:=cnt(*),c3:=cnt_d(col)@sort(alias)@before(20)",
                    "refWithModifiers uri missmatch."
                );
            });

            it ("ermrestSortObject should return the sort object that will be used for ermest.", function () {
                expect(ref.ermrestSortObject).toEqual([], "sortObject missmatch for ref");
                expect(refWithModifiers.ermrestSortObject).toEqual([{ column: 'alias', descending: false, term: 'invis_col' }], "sortObject missmatch for ref with modifiers");
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

                it ("should throw an error when trying to sort based on a column that is not sortable.", function () {
                    expect(function () {
                        var r = refColumnOrder.sort([{"column": "2", "descending": true}]);
                    }).toThrow("column '2' is not sortable (Attributegroup)");

                    expect(function () {
                        var r = refColumnOrder.sort([{"column": "1", "descending": true}]);
                    }).toThrow("column '1' is not sortable (Attributegroup)");
                });

                it ("should return a new reference with new sort.", function () {
                    var newRef = refWithModifiers.sort([{"column": "alias", "descending": true}]);
                    expect(newRef.location.sortObject[0]).toEqual({"column": "alias", "descending": true});
                });

                describe("based on a column that has baseColumn, ", function () {
                    it ('should return a new reference.', function () {
                        refColumnOrderSorted = refColumnOrder.sort([{"column": "0", "descending": true}]);
                        expect(refColumnOrderSorted.location.sortObject[0]).toEqual({"column": "0", "descending": true});
                    });

                    it ("ermrestSortObject should return the actual sort object.", function () {
                        expect(refColumnOrderSorted.ermrestSortObject).toEqual([
                            { column: '3', descending: false, term: 'order_col' },
                            { column: '4', descending: true, term: 'col' }
                        ]);
                    });

                    it ("ermrestPath should return the correct path.", function () {
                        expect(refColumnOrderSorted.ermrestPath).toEqual("agref_schema:main/0:=col_w_column_order,1:=col_w_column_order_false,3:=order_col,4:=col;2:=cnt(*)@sort(3,4::desc::)");
                    });
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
                        expect(response[0]).toBe(14);
                        done();
                    }).catch(function (err) {
                        consoel.log(err);
                        done.fail();
                    });
                });
            });

            describe("read, ", function () {
                var page, tuples, pageColumnOrder, nextReferenceColumnOrder;

                it ("should return a page object.", function (done) {
                    refWithModifiers.read(2).then(function (response) {
                        page = response;
                        expect(page).toBeDefined("page was not defined.");
                        return refColumnOrderSorted.read(2);
                    }).then(function (response2) {
                        pageColumnOrder = response2;
                        expect(pageColumnOrder).toBeDefined("page with order was not defined.");
                        done();
                    }).catch(function (err) {
                        consoel.log(err);
                        done.fail();
                    });
                });

                describe("page, ", function () {
                    describe("next, ", function () {
                        it ("should return a new reference with paging options.", function () {
                            var newRef = page.next;
                            expect(newRef).toBeDefined("reference was not defined");
                            expect(newRef.location.paging).toBe("@after(19)", "paging missmatch.");
                        });

                        it ("should handle when sort is based on a column with column-order.", function (done) {
                            var newRef = pageColumnOrder.next;
                            expect(newRef).toBeDefined("reference was not defined");
                            expect(newRef.ermrestPath).toEqual("agref_schema:main/0:=col_w_column_order,1:=col_w_column_order_false,3:=order_col,4:=col;2:=cnt(*)@sort(3,4::desc::)@after(02,%2A%2Atwo%2A%2A)", "ermrestPath missmatch for page.next.");

                            newRef.read(2).then(function (p) {
                                nextReferenceColumnOrder = p.next;
                                expect(nextReferenceColumnOrder).toBeDefined("reference.next was not defined");
                                expect(nextReferenceColumnOrder.ermrestPath).toEqual("agref_schema:main/0:=col_w_column_order,1:=col_w_column_order_false,3:=order_col,4:=col;2:=cnt(*)@sort(3,4::desc::)@after(04,%2A%2Afour%2A%2A)", "ermrestPath missmatch for page.next.next.");
                                done();
                            }).catch(function (err) {
                                done.fail(err);
                            });
                        });
                    });

                    describe("previous, ", function () {

                        it ("should return a new reference with paging options.", function () {
                            var newRef = page.previous;
                            expect(newRef).toBeDefined("reference was not defined");
                            expect(newRef.location.paging).toBe("@before(18)", "paging missmatch.");
                        });

                        it ("should handle when sort is based on a column with column-order.", function (done) {
                            nextReferenceColumnOrder.read(2).then(function (p) {
                                var newRef = p.previous;
                                expect(newRef).toBeDefined("reference was not defined");
                                expect(newRef.ermrestPath).toBe("agref_schema:main/0:=col_w_column_order,1:=col_w_column_order_false,3:=order_col,4:=col;2:=cnt(*)@sort(3,4::desc::)@before(05,%2A%2Afive%2A%2A)", "paging missmatch.");
                                done();
                            }).catch(function (err) {
                                done.fail(err);
                            });
                        });
                    });

                    it ("tuples should return an array of tuples.", function () {
                        tuples = page.tuples;
                        expect(tuples).toBeDefined("tupels was not defined");
                        expect(tuples.length).toBe(2, "length missmatch.");
                    });

                    describe("tuple, ", function () {
                        it ("values should return an array of values.", function () {
                            var values = tuples[0].values;
                            expect(values).toEqual([
                                '<strong>test2</strong>', 'YES', '2'
                            ]);
                        });

                        it ("isHTML should return an array of valeus.", function () {
                            var isHTML = tuples[0].isHTML;
                            expect(isHTML).toEqual([
                                true, false, false
                            ]);
                        });

                        it ("data should return the raw data.", function () {
                            var data = tuples[0].data;
                            expect(data.col).toEqual("**test2**", "col data missmatch.");
                            expect(data.alias).toEqual("18", "alias data missmatch.");
                            expect(data.col_w_pre_format).toEqual(true, "col_w_pre_format data missmatch.");
                            expect(data.c2).toEqual(2, "c2 data missmatch.");
                            expect(data.c3).toEqual(1, "c3 data missmatch.");
                        });

                        it ("displayname should return rowname based on visible key columns.", function () {
                            var disp = tuples[0].displayname;
                            expect(disp.value).toBe("<strong>test2</strong>:YES", "value missmatch.");
                            expect(disp.unformatted).toBe("**test2**:YES", "unformatted missmatch.");
                            expect(disp.isHTML).toBe(true, "isHTML missmatch.");
                        });

                        describe("uniqueId, ", function () {
                            it ("should return an string based on raw values of shortest key.", function () {
                                expect(tuples[0].uniqueId).toBe("**test2**_true");
                            });

                            it ("should return null if any of the key columns are null.", function (done) {
                                refWithModifiers.sort([{"column": "alias", "descending": false}]).read(7).then(function (page) {
                                    expect(page).toBeDefined("page was not defined.");
                                    expect(page.length).toBe(7, "page length missmatch");
                                    expect(page.tuples[6].uniqueId).toBe(null, "uniqueId missmatch.");
                                    done();
                                }).catch(function (err) {
                                    consoel.log(err);
                                    done.fail();
                                });
                            });
                        });
                    });
                });
            });
        });

        describe ("regarding table and columns with unicode characters, ", function () {
            it ("Location should handle it.", function () {
                unicodeLoc = new options.ermRest.AttributeGroupLocation(
                    options.url,
                    options.catalog,
                    schemaName + ":" + unicodeTableEncoded,
                    {"column": decodedCol, "term": "test"}, // search
                    [{"column": decodedCol}], // sort
                    ["c"], //after
                    ["z"] // before
                );

                checkLocation("Location: ", unicodeLoc, schemaName + ":" + unicodeTableEncoded);
            });

            it ("Column should handle it.", function () {
                unicodeID = new options.ermRest.AttributeGroupColumn(
                    null, encodedID, null, decodedID, "serial4", "comment", true, true
                );

                unicodeCol = new options.ermRest.AttributeGroupColumn(
                    null, encodedCol, null, decodedCol, "text", "comment", true, true
                );


                checkColumn("Column: id", unicodeID, encodedID, decodedID, "serial4", "comment", true);

                checkColumn("Column: col", unicodeCol, encodedCol, decodedCol, "text", "comment", true);

                expect(unicodeID.name).toBe(decodedID, "unicodeID name missmatch.");
                expect(unicodeCol.name).toBe(decodedCol, "unicodeCol name missmatch.");
            });

            describe ("Reference, ", function () {
                beforeAll(function () {
                    unicodeRef = new options.ermRest.AttributeGroupReference(
                        [unicodeID],
                        [unicodeCol],
                        unicodeLoc,
                        options.catalog
                    );
                });

                it ("reference should have the correct attributes.", function () {
                    checkReference("Reference: ", unicodeRef, unicodeLoc);
                });

                it ("uri should be correct.", function () {
                    expect(unicodeRef.uri).toBe(
                        unicodeTableBaseUri + "/" + encodedCol + "::ciregexp::test/" + encodedID + ";" + encodedCol + "@sort(" + encodedCol + ")@after(c)@before(z)"
                    );
                });

                it ("search, should return a new reference with new searchTerm.", function () {
                    var newRef = unicodeRef.search("new search");
                    expect(newRef).not.toBe(unicodeRef, "reference didn't change");
                    expect(unicodeRef.location.searchTerm).toBe("test", "main reference changed.");
                    expect(newRef.location.searchTerm).toBe("new search", "searchTerm didn't change.");
                });

                it ("read should return the correct values.", function (done) {
                    unicodeRef.read(1).then(function (page) {
                        expect(page).toBeDefined("page was not defined.");
                        expect(page.length).toBe(1, "page length missmatch");
                        expect(page.tuples[0].values).toEqual(["4", "val test 4"], "value missmatch.");
                        done();
                    }).catch(function (err) {
                        consoel.log(err);
                        done.fail();
                    });
                });

                describe("getAggregates, ", function () {
                    it ("countAgg should return the count and not any errors.", function (done) {
                        var aggList = [unicodeRef.aggregate.countAgg];
                        unicodeRef.getAggregates(aggList).then(function (response) {
                            expect(response[0]).toBe(2);
                            done();
                        }).catch(function (err) {
                            consoel.log(err);
                            done.fail();
                        });
                    });
                });
            });
        });
    });

};
