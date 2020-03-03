exports.execute = function (options) {
    var catalog_id = process.env.DEFAULT_CATALOG,
        schemaName = "active_list_schema",
        tableName = "main",
        tableNameEmptyFK = "main_empty_fkeys";

    var mainEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName + "/@sort(main_id)";
    var mainEmptyFkEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableNameEmptyFK + "/@sort(main_empty_fkeys_id)";
    var pageLen = 2;

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

    // you should use this function only after options.entities value is populated
    // (in any of jasmine blocks)
    var findRID = function (currTable, keyName, keyValue) {
        return options.entities[schemaName][currTable].filter(function (e) {
            return e[keyName] == keyValue;
        })[0].RID;
    };

    var catchError = function (done) {
        return function (err) {
            done.fail(err);
        };
    };

    var getRecordURL = function (table, keyCol, keyValue) {
        return recordURL + "/" + schemaName + ":" + table + "/" + "RID=" + findRID(table, keyCol, keyValue);
    };

    var mainRef, mainRefCompact, mainPageCompact, mainTupleCompact, compactColumns;
    var mainEmptFkRefCompact, mainEmptyFkPage;
    var columnMapping = {
        "self_link_rowname": "6LvAfWRWZJUaupAC4ebm4A",
        "self_link_id": "lOGv1uEUiOj6Z8tDhF-fwA",
        "normal_col_int_col": "int_col",
        "normal_col_int_col_2": "int_col_2",
        "outbound_entity_o1": "y6R-m2ymr0EhgNSKV6Qe7A",
        "outbound_entity_o2": "b4ZrDs2fzRyG3-ILA7Pi0g",
        "outbound_scalar_o1": "Wu1nyG6bGPP6IBYJDLwNWA",
        "outbound_scalar_o2": "tOa196qFq98xeJivYVyTbQ",
        "all_outbound_entity_o1_o1": "IOJPnQD8kuh8cvHyD-0fEw",
        "all_outbound_entity_o2_o1": "Nm5OCB2D-e2dVlNnUU3WWw",
        "all_outbound_scalar_o1_o1": "0X8ZiZGuFAvzhQUB7bMcbA",
        "all_outbound_scalar_o2_o1": "jR-MB1loZ3612WqvUj0mgA",
        "array_d_entity_i1": "64kqS9WdLdRQqrvyfw-AJw",
        "array_d_entity_i2": "hawzNjl9v59kGZ8je9edoQ",
        "array_d_scalar_i1": "EE5EjVczQrFfaQ7JlenEWQ",
        "array_d_scalar_i2": "g8f416ZxENt8ejyOGd4WgA",
        "cnt_i1": "nPxeAON3qVZu1NH5ncMo1w",
        "cnt_i2": "8qaM1tvjK0KehBBZCdm6ug",
        "cnt_d_i1": "rIc0V0U8-B2h8euwEamiXg",
        "cnt_d_i2": "oX4g5PbVAbGZH2bXFulGnw",
        "min_i1": "T-YMk68YjENgSetpNC9tCQ",
        "min_i2": "m_DvdkYJAeh4GGdlNAlVRA",
        "max_i1": "dp5Zl2YrqOoMlAj9wem1vQ",
        "max_i2": "2OFqwCNSHfLzTAXJ_KQJOQ",
        "array_d_entity_i3": "wusUF4TQXvbXy1OSymIEPw",
        "array_d_scalar_i4": "gIwZe4GiBnmxcLh6OMPIjw",
        "all_outbound_entity_o1_o1_o1": "nTVhVgmnwDAdAScCUP5qwA"
    };

    var expectedColumns, expectedActiveList;

    describe("active list related APIs, ", function () {
        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(mainEntityUri, {cid: "test"}).then(function (response) {
                mainRef = response;
                mainRefCompact = response.contextualize.compact;
                compactColumns = mainRefCompact.columns;
                return options.ermRest.resolve(mainEmptyFkEntityUri, {cid: "test"});
            }).then(function (response2) {
                mainEmptFkRefCompact = response2.contextualize.compact;
                done();
            }).catch(catchError(done));

            // must be here, to be able to get RID
            expectedColumns = [
                {
                    "title": "self_link_rowname",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": '<a href="' + recordURL + '/' + schemaName + ':' + tableName + '/rowname_col=main%20one">main one</a>'
                },
                {
                    "title": "self_link_id",
                    "waitFor": ["array_d_scalar_i1"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "normal_col_int_col",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": "1,234,501"
                },
                {
                    "title": "normal_col_int_col_2",
                    "waitFor": ["cnt_i1"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "outbound_entity_o1",
                    "waitFor": ["outbound_entity_o2"],
                    "hasWaitFor": false,
                    "value": '<a href="' + getRecordURL('outbound1', 'outbound1_id', 'o01') + '">outbound1 one</a>'
                },
                {
                    "title": "outbound_entity_o2",
                    "waitFor": ["cnt_i1","self_link_rowname"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "outbound_scalar_o1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": '1,234,511'
                },
                {
                    "title": "outbound_scalar_o2",
                    "waitFor": ["array_d_entity_i1","max_i1"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "all_outbound_entity_o1_o1",
                    "waitFor": ["all_outbound_entity_o2_o1"],
                    "hasWaitFor": false,
                    "value": '<a href="' + getRecordURL('outbound1_outbound1', 'outbound1_outbound1_id', 'oo01') + '">outbound1_outbound1 one</a>'
                },
                {
                    "title": "all_outbound_entity_o2_o1",
                    "waitFor": ["array_d_scalar_i2"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "all_outbound_scalar_o1_o1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": "12,345,111"
                },
                {
                    "title": "all_outbound_scalar_o2_o1",
                    "waitFor": ["all_outbound_entity_o1_o1_o1"],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "array_d_entity_i1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "array_d_entity_i2",
                    "waitFor": ["cnt_d_i2"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "array_d_scalar_i1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "array_d_scalar_i2",
                    "waitFor": ["max_i2"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "cnt_i1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "cnt_i2",
                    "waitFor": ["array_d_entity_i3", "cnt_i1"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "cnt_d_i1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "cnt_d_i2",
                    "waitFor": ["array_d_scalar_i4", "cnt_i1", "cnt_i2"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "min_i1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "min_i2",
                    "waitFor": [ "all_outbound_entity_o2_o1", "cnt_i2"],
                    "hasWaitFor": true,
                    "value": ""
                },
                {
                    "title": "max_i1",
                    "waitFor": [],
                    "hasWaitFor": false,
                    "value": ""
                },
                {
                    "title": "max_i2",
                    "waitFor": [ "array_d_entity_i1", "array_d_scalar_i4"],
                    "hasWaitFor": true,
                    "value": ""
                }
            ];

            expectedActiveList = {
                requests: [
                    {
                        "column": "array_d_scalar_i1",
                        "objects": [
                            {"index": 1, "isWaitFor": true, "column": true},
                            { "index": 14, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "cnt_i1",
                        "objects": [
                            {"index": 3, "isWaitFor": true, "column": true},
                            {"index": 5, "isWaitFor": true, "column": true},
                            {"index": 16, "isWaitFor": false, "column": true},
                            {"index": 17, "isWaitFor": true, "column": true},
                            {"index": 19, "isWaitFor": true, "column": true}
                        ]
                    },
                    {
                        "column": "array_d_entity_i1",
                        "objects": [
                            {"index": 7, "isWaitFor": true, "column": true},
                            {"index": 12, "isWaitFor": false, "column": true},
                            {"index": 23, "isWaitFor": true, "column": true}
                        ]
                    },
                    {
                        "column": "max_i1",
                        "objects": [
                            {"index": 7, "isWaitFor": true, "column": true},
                            {"index": 22, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "array_d_scalar_i2",
                        "objects": [
                            {"index": 9, "isWaitFor": true, "column": true},
                            {"index": 15, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "array_d_entity_i2",
                        "objects": [
                            {"index": 13, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "cnt_d_i2",
                        "objects": [
                            {"index": 13, "isWaitFor": true, "column": true},
                            {"index": 19, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "max_i2",
                        "objects": [
                            {"index": 15, "isWaitFor": true, "column": true},
                            {"index": 23, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "cnt_i2",
                        "objects": [
                            {"index": 17, "isWaitFor": false,"column": true},
                            {"index": 19, "isWaitFor": true, "column": true},
                            {"index": 21, "isWaitFor": true, "column": true}
                        ]
                    },
                    {
                        "column": "array_d_entity_i3",
                        "objects": [
                            {"index": 17, "isWaitFor": true, "column": true}
                        ]
                    },
                    {
                        "column": "cnt_d_i1",
                        "objects": [
                            {"index": 18, "isWaitFor": false, "column": true}
                        ]
                    },
                    {
                        "column": "array_d_scalar_i4",
                        "objects": [
                            {"index": 19, "isWaitFor": true, "column": true},
                            {"index": 23, "isWaitFor": true, "column": true}
                        ]
                    },
                    {
                        "column": "min_i1",
                        "objects": [
                            {"index": 20, "isWaitFor": false,"column": true}
                        ]
                    },
                    {
                        "column": "min_i2",
                        "objects": [
                            {"index": 21, "isWaitFor": false, "column": true}
                        ]
                    }
                ],
                allOutBounds: [
                    "outbound_entity_o1", "outbound_entity_o2", "outbound_scalar_o1",
                    "all_outbound_entity_o1_o1", "all_outbound_entity_o2_o1",
                    "all_outbound_scalar_o1_o1", "all_outbound_scalar_o2_o1", "all_outbound_entity_o1_o1_o1",
                    "outbound_scalar_o2",
                    "tLQ8i6ghoS6sodD7G8V7kQ", // not defined, so it's the fk.name
                ],
                selfLinks: [
                    "self_link_rowname", "self_link_id"
                ]
            }
        });


        /* TODO mvoe to chaise and do the simpler ones here.
        describe("column.sourceMarkdownPattern, ", function () {

            describe("1. for self link columns, ", function () {
                it ("should handle without display.", function () {
                    // 0
                });

                it ("should handle with display.", function () {
                    // 1
                });
            });

            describe("2. for normal columns, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("3. for outbound entity, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("4. for outbound scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("5. for all-outbound entity, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("6. for all-outbound scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("7. for array_d entity, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("8. for array_d scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("9. for cnt scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("10. for cnt_d scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("11. for min scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });

            describe("12. for max scalar, ", function () {
                it ("should handle without display.", function () {

                });

                it ("should handle with display.", function () {

                });
            });
        });
        */

        describe("Column.waitFor, ", function () {
            it ("should return empty array if it's not defined.", function () {
                expect(compactColumns[0].waitFor.length).toBe(expectedColumns[0].waitFor.length, "length missmatch.");
                expect(compactColumns[0].hasWaitFor).toBe(expectedColumns[0].hasWaitFor, "hasWaitFor missmatch.");
            });

            it ("should validate the given names and not allow entity sets in non-detailed context.", function () {
                expect(compactColumns[2].waitFor.length).toBe(expectedColumns[2].waitFor.length, "length missmatch.");
                expect(compactColumns[2].hasWaitFor).toBe(expectedColumns[2].hasWaitFor, "hasWaitFor missmatch.");
            });

            it ("should return the proper wait_fors.", function () {
                expectedColumns.forEach(function (col, index) {
                    var message = " for `" + col.title + "`.";
                    expect(compactColumns[index].waitFor.length).toBe(col.waitFor.length, "length missmatch" + message);
                    if (col.waitFor.length > 0) {
                        expect(compactColumns[index].waitFor.map(function (wf) {
                            return wf.name;
                        })).toEqual(jasmine.arrayContaining(col.waitFor.map(function (c) {
                            return columnMapping[c];
                        })), "wait_for missmatch" + message);
                    }
                    expect(compactColumns[index].hasWaitFor).toBe(col.hasWaitFor, "hasWaitFor missmatch" + message);
                })
            });
        });


        describe("Reference.activeList, ", function () {
            var activeList;
            var testNameList = function (list, expected) {
                expect(list.length).toBe(expected.length, "length missmatch");
                list.forEach(function (el, index) {
                    var expectedVal = columnMapping[expected[index]] ? columnMapping[expected[index]] : expected[index];
                    expect(el.name).toBe(expectedVal, "value missmatch in index=" + index);
                });
            };

            beforeAll(function () {
                activeList = mainRefCompact.activeList;
            });

            it ("should return the aggregate list properly.", function () {
                expect(activeList.requests.length).toBe(expectedActiveList.requests.length, "length missmatch.");
                // expect(activeList.requests).toEqual({});
                activeList.requests.forEach(function (ag, agIndex) {
                    var expAgg = expectedActiveList.requests[agIndex];
                    var message = " for index= " + agIndex + "(expected column= `"+ columnMapping[expAgg.column] +"`)";

                    expect(ag.column.name).toBe(columnMapping[expAgg.column], "column missmatch" + message);
                    expect(ag.objects.length).toBe(expAgg.objects.length, "objects length missmatch" + message);
                    ag.objects.forEach(function (obj, objIndex) {
                        var expObj = expAgg.objects[objIndex];
                        expect(obj.index).toBe(expObj.index, "index missmatch" + message + " obj index=" + objIndex);
                        expect(obj.isWaitFor).toBe(expObj.isWaitFor, "isWaitFor missmatch" + message + " obj index=" + objIndex);
                        expect(obj.column).toBe(expObj.column, "column missmatch" + message + " obj index=" + objIndex);
                    });
                });
            });

            it ("should return the allOutBounds properly.", function () {
                testNameList(activeList.allOutBounds, expectedActiveList.allOutBounds);
            });

            it ("should return the selfLinks properly.", function () {
                testNameList(activeList.selfLinks, expectedActiveList.selfLinks);
            });
        });

        describe("Reference._getReadPath in case of attributegroup", function () {
            it ("should add the allOutBounds.", function () {
                var expectedPath = "M:=active_list_schema:main/" +
                "F10:=left(fk3_col1,fk3_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/$M/" +
                "F9:=left(fk2_col1,fk2_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/$M/" +
                "left(fk1_col1,fk1_col2)=(active_list_schema:outbound1:outbound1_id1,outbound1_id2)/" +
                "left(fk1_col1)=(active_list_schema:outbound1_outbound1:outbound1_outbound1_id)/" +
                "F8:=left(fk1_col1)=(active_list_schema:outbound1_outbound1_outbound1:outbound1_outbound1_outbound1_id)/$M/" +
                "left(fk2_col1,fk2_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/" +
                "F7:=left(fk1_col1)=(active_list_schema:outbound2_outbound1:outbound2_outbound1_id)/$M/" +
                "left(fk1_col1,fk1_col2)=(active_list_schema:outbound1:outbound1_id1,outbound1_id2)/" +
                "F6:=left(fk1_col1)=(active_list_schema:outbound1_outbound1:outbound1_outbound1_id)/$M/" +
                "left(fk2_col1,fk2_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/" +
                "F5:=left(fk1_col1)=(active_list_schema:outbound2_outbound1:outbound2_outbound1_id)/$M/" +
                "left(fk1_col1,fk1_col2)=(active_list_schema:outbound1:outbound1_id1,outbound1_id2)/" +
                "F4:=left(fk1_col1)=(active_list_schema:outbound1_outbound1:outbound1_outbound1_id)/$M/" +
                "F3:=left(fk1_col1,fk1_col2)=(active_list_schema:outbound1:outbound1_id1,outbound1_id2)/$M/" +
                "F2:=left(fk2_col1,fk2_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/$M/" +
                "F1:=left(fk1_col1,fk1_col2)=(active_list_schema:outbound1:outbound1_id1,outbound1_id2)/$M/" +
                "main_id;M:=array_d(M:*),F10:=array_d(F10:*),F9:=array_d(F9:*),F8:=array_d(F8:*),F7:=array_d(F7:*)," +
                "F6:=array_d(F6:*),F5:=array_d(F5:*),F4:=array_d(F4:*),F3:=array_d(F3:*),F2:=array_d(F2:*),F1:=array_d(F1:*)@sort(main_id)";

                expect(mainRefCompact.readPath).toEqual(expectedPath);
            });

            it ("should fallback to entity if there are no outbound foreignkeys.", function () {
                expect(mainEmptFkRefCompact.readPath).toEqual("M:=active_list_schema:main_empty_fkeys@sort(main_empty_fkeys_id)");
            });
        });

        describe("tuple.values, ", function () {
            it ("should return empty result for the columns with secondary request wait_for.", function (done) {
                mainRefCompact.read(pageLen).then(function (response) {
                    mainPageCompact = response;
                    expect(mainPageCompact.tuples[0].values.length).toEqual(expectedColumns.length, "length missmatch");
                    mainPageCompact.tuples[0].values.forEach(function (v, i) {
                        var expectedVal = expectedColumns[i].value;
                        if (expectedColumns[i].hasWaitFor) {
                            expectedVal = "";
                        }
                        expect(v).toEqual(expectedVal, "value missmatch for `" + expectedColumns[i].title + "`");
                    });
                    done();
                }).catch(catchError(done));
            });

            it ("should work properly when fkeys is empty.", function (done) {
                mainEmptFkRefCompact.read(1).then(function (response) {
                    mainEmptyFkPage = response;
                    expect(mainEmptyFkPage.tuples[0].values.length).toEqual(2, "length missmatch");
                    expect(mainEmptyFkPage.tuples[0].values[0]).toEqual("01", "first value missmatch.");
                    expect(mainEmptyFkPage.tuples[0].values[1]).toEqual("main_empty_fkeys one", "second value missmatch.");
                    done();
                }).catch(catchError(done));
            });
        });

        describe("Page.templateVariables, ", function () {
            it ("should not include outbound fks if they are inivisble and source definitions fkeys is empty.", function () {
                var res = mainEmptyFkPage.templateVariables[0];
                var expected = {
                    rowname_col: "main_empty_fkeys one",
                    _rowname_col: "main_empty_fkeys one",
                    int_col: "1,234,501",
                    _int_col: 1234501,
                    main_empty_fkeys_id: "01",
                    _main_empty_fkeys_id: "01"
                };

                expect(Object.keys(res).length).toBe(Object.keys(expected).length, "keys length missmatch");
                for (var k in expected) {
                    expect(res[k]).toEqual(expected[k], "value missmatch for variable " + k);
                }

            });
        });
    });

// ----------------------- helpers
    function checkForeignKeys (col, fks, colStr) {
        expect(col.foreignKeys.length).toBe(fks.length, "length missmatch"  +  (colStr ? (" for " + colStr) : "."));
        expect(col.foreignKeys.map(function (fk) {
            return {"const": fk.obj._constraintName, "isInbound": fk.isInbound};
        })).toEqual(fks, "fks missmatch" + (colStr ? (" for " + colStr) : "."));
    }
};
