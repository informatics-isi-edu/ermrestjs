var utils = require('./../../../utils/utilities.js');

exports.execute = function (options) {
    var catalog_id = process.env.DEFAULT_CATALOG,
        schemaName = "active_list_schema",
        tableName = "main", // the main table that this test is based on
        tableNameEmptyFK = "main_empty_fkeys"; // table that doesn't have any fkeys

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

    var catchError = function (done) {
        return function (err) {
            done.fail(err);
        };
    };

    var getRecordURL = function (table, keyCol, keyValue) {
        return recordURL + "/" + schemaName + ":" + table + "/" + "RID=" + utils.findEntityRID(options, schemaName, table, keyCol, keyValue);
    };

    var mainRef, mainRefCompactPage, mainRefCompact, mainRefDetailed, compactColumns, detailedColumns, compactActiveList, detailedActiveList;
    var mainEmptFkRefCompact, mainEmptyFkPage;
    var columnMapping = {
        "self_link_rowname": "6LvAfWRWZJUaupAC4ebm4A",
        "self_link_id": "lOGv1uEUiOj6Z8tDhF-fwA",
        "normal_col_int_col": "int_col",
        "normal_col_int_col_2": "int_col_2",
        "normal_col_int_col_3": "int_col_3",
        "outbound_entity_o1": "y6R-m2ymr0EhgNSKV6Qe7A",
        "outbound_entity_o2": "b4ZrDs2fzRyG3-ILA7Pi0g",
        "outbound_entity_o3": "Rzgty37irl-gLs6e6tLT8g",
        "outbound_scalar_o1": "Wu1nyG6bGPP6IBYJDLwNWA",
        "outbound_scalar_o2": "tOa196qFq98xeJivYVyTbQ",
        "all_outbound_entity_o1_o1": "IOJPnQD8kuh8cvHyD-0fEw",
        "all_outbound_entity_o2_o1": "Nm5OCB2D-e2dVlNnUU3WWw",
        "all_outbound_entity_o3_o1": "uv-tHOqsFV1KkjxjniFJgA",
        "all_outbound_scalar_o1_o1": "0X8ZiZGuFAvzhQUB7bMcbA",
        "all_outbound_scalar_o2_o1": "jR-MB1loZ3612WqvUj0mgA",
        "all_outbound_entity_o3_o2": "jxW56Ojtk_V-gmkDlmdQGA",
        "all_outbound_entity_o3_o1_o1": "c-526yB1MLeRWCqqjh1sHA",
        "all_outbound_entity_o3_o2_o1": "b-w1EzeTSFpuVEylmVkovQ",
        "all_outbound_scalar_o3_o1_o1": "mKjtWJKOo0Xd4j6Zl56vPA",
        "array_d_entity_i1": "64kqS9WdLdRQqrvyfw-AJw",
        "array_d_entity_i2": "hawzNjl9v59kGZ8je9edoQ",
        "array_d_entity_i3": "wusUF4TQXvbXy1OSymIEPw",
        "array_d_entity_i4": "VcQmlRU-Mahxh5Vjzk67PQ",
        "array_d_entity_i5": "g2lKGxMbA35qAQteJMsBYg",
        "array_d_scalar_i1": "EE5EjVczQrFfaQ7JlenEWQ",
        "array_d_scalar_i2": "g8f416ZxENt8ejyOGd4WgA",
        "array_d_scalar_i4": "gIwZe4GiBnmxcLh6OMPIjw",
        "cnt_i1": "nPxeAON3qVZu1NH5ncMo1w",
        "cnt_i2": "8qaM1tvjK0KehBBZCdm6ug",
        "cnt_d_i1": "rIc0V0U8-B2h8euwEamiXg",
        "cnt_d_i2": "oX4g5PbVAbGZH2bXFulGnw",
        "min_i1": "T-YMk68YjENgSetpNC9tCQ",
        "min_i2": "m_DvdkYJAeh4GGdlNAlVRA",
        "max_i1": "dp5Zl2YrqOoMlAj9wem1vQ",
        "max_i2": "2OFqwCNSHfLzTAXJ_KQJOQ",
        "entity_set_i1": "uhmkxs3irNFoqjzz5Is5vA",
        "entity_set_i2": "KzHiS_RqpvKpWRShWIe2ew",
        "entity_set_i3": "4NZdQnp5e5sLqAbxTskhOQ",
        "entity_set_i4": "lOcGfWIxYIyGCNA9pgEgbw",
        "entity_set_i5": "F9KkhBV_Qkaw20GzvIMAjQ",
        "entity_set_i6": "FZPDS1yFBJ1mdyr_Q",
        "entity_set_i7": "VEu1Crxy0bkExWQzrm6vvA",
        "all_outbound_entity_o1_o1_o1": "nTVhVgmnwDAdAScCUP5qwA"
    };
    var reverseColumnMapping = Object.keys(columnMapping).reduce(function (ret, key) {
        ret[columnMapping[key]] = key;
        return ret;
    }, {});

    var expectedCompactColumns, expectedDetailedColumns, expectedCompactActiveList, expectedDetaledActiveList;

    describe("active list related APIs, ", function () {
        beforeAll(function (done) {
            options.ermRest.setClientConfig({
                templating: {engine: "handlebars"}
            });
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(mainEntityUri, {cid: "test"}).then(function (response) {
                mainRef = response;
                mainRefCompact = response.contextualize.compact;
                compactColumns = mainRefCompact.columns;

                mainRefDetailed = response.contextualize.detailed;
                detailedColumns = mainRefDetailed.columns;

                return options.ermRest.resolve(mainEmptyFkEntityUri, {cid: "test"});
            }).then(function (response2) {
                mainEmptFkRefCompact = response2.contextualize.compact;
                done();
            }).catch(catchError(done));

            // must be here, to be able to get RID
            generateExpectedValues();
        });

        /*
            There's no point in testing sourceMarkdownPattern in here since it relies
            on the templateVariables that are being passed into the function, and chaise
            is responsible for generating those values. So we should be testing different
            scenarios of sourceMarkdownPattern in chaise.
         */

        describe("Column.waitFor, ", function () {
            it ("should return the proper wait_fors (compact).", function () {
                testColumnList(compactColumns, expectedCompactColumns);
            });

            it ("should return the proper wait_fors (detailed).", function () {
                testColumnList(detailedColumns, expectedDetailedColumns);
            });
        });

        describe("Citation waitfor APIs", function () {
            var citation;
            beforeAll(function () {
                citation = mainRefDetailed.citation;
            })

            it (".waitFor should return the correct values.", function () {
                expect(citation).not.toBe(null, "citation was null.");
                expect(citation.waitFor.length).toBe(3, "citation was null.");
                expect(citation.waitFor.map(function (wf) {
                    return reverseColumnMapping[wf.name];
                })).toEqual(["all_outbound_entity_o3_o1", "array_d_entity_i5", "entity_set_i4"], "waitfor missmatch");
            });

            it ("hasWaitFor and hasWaitForAggregate should return the correct values.", function () {
                expect(citation.hasWaitFor).toBe(true, "hasWaitFor missmatch");
                expect(citation.hasWaitForAggregate).toBe(true, "hasWaitForAggregate missmatch");
            });

            // more in depth test can be found in citation spec and chaise
        });

        describe("Reference.sourceWaitFor", function () {
            it ("should be properly defined on related entities.", function () {
                var expectedRelatedEntitiesWaitFor = [
                    {"waitFor": ["array_d_entity_i4", "array_d_entity_i5"], "hasWaitFor": true},
                    {"waitFor": ["entity_set_i5", "all_outbound_entity_o3_o1_o1"], "hasWaitFor": true},
                    {"waitFor": [], "hasWaitFor": false}
                ];
                var related = mainRefDetailed.related;
                expect(related.length).toBe(expectedRelatedEntitiesWaitFor.length, "list length missmatch");
                expectedRelatedEntitiesWaitFor.forEach(function (exp, i) {
                    expect(related[i].display.sourceWaitFor.length).toBe(exp.waitFor.length, "waitfor length missmatch for index=" + i);
                    if (exp.waitFor.length > 0) {
                        expect(related[i].display.sourceWaitFor.map(function (wf) {
                            return reverseColumnMapping[wf.name];
                        })).toEqual(exp.waitFor, "waifor list missmatch for index=" + i);
                    }
                    expect(related[i].display.sourceHasWaitFor).toBe(exp.hasWaitFor, "hasWaitFor missmatch for index=" + i);
                });
            });
        });

        describe("Reference.activeList, ", function () {
            beforeAll(function () {
                compactActiveList = mainRefCompact.activeList;
                detailedActiveList = mainRefDetailed.activeList;
            });

            describe("for compact, ", function () {
                it ("should return the requests list properly.", function () {
                    testRequestList(compactActiveList.requests, expectedCompactActiveList.requests);
                });

                it ("should return the allOutBounds properly.", function () {
                    testNameList(compactActiveList.allOutBounds, expectedCompactActiveList.allOutBounds);
                });

                it ("should return the selfLinks properly.", function () {
                    testNameList(compactActiveList.selfLinks, expectedCompactActiveList.selfLinks);
                });
            });

            describe("for detailed, ", function () {
                it ("should return the requests list properly.", function () {
                    testRequestList(detailedActiveList.requests, expectedDetailedActiveList.requests);
                });

                it ("should return the allOutBounds properly.", function () {
                    testNameList(detailedActiveList.allOutBounds, expectedDetailedActiveList.allOutBounds);
                });

                it ("should return the selfLinks properly.", function () {
                    testNameList(detailedActiveList.selfLinks, expectedDetailedActiveList.selfLinks);
                });
            });
        });

        describe("Reference._getReadPath in case of attributegroup", function () {
            // NOTE since we're using static ACLs here, the readPath should not have trs/tcrs

            it ("should add the allOutBounds.", function () {
                // the order of defined foreignkeys might change in the schema, and
                // therefore the order of .fkeys that we get from sourceDefinitions might change.
                // which in turn causes allOutBounds API under activeList to not be consistent.
                // so we are testing for both possible values.
                var appendText = "F9:=left(fk2_col1,fk2_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/$M/" +
                "left(fk1_col1,fk1_col2)=(active_list_schema:outbound1:outbound1_id1,outbound1_id2)/" +
                "left(fk1_col1)=(active_list_schema:outbound1_outbound1:outbound1_outbound1_id)/" +
                "F8:=left(fk1_col1)=(active_list_schema:outbound1_outbound1_outbound1:outbound1_outbound1_outbound1_id)/$M/"+
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
                "main_id;M:=array_d(M:*),F11:=array_d(F11:*),F10:=array_d(F10:*),F9:=F9:int_col," +
                "F8:=array_d(F8:*),F7:=F7:int_col,F6:=F6:int_col,F5:=array_d(F5:*)," +
                "F4:=array_d(F4:*),F3:=F3:int_col,F2:=array_d(F2:*),F1:=array_d(F1:*)@sort(main_id)";

                var expectedPath1 = "M:=active_list_schema:main/" +
                "F11:=left(fk4_col1)=(active_list_schema:outbound3:outbound3_id)/$M/" +
                "F10:=left(fk3_col1,fk3_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/$M/" +
                appendText;

                var expectedPath2 = "M:=active_list_schema:main/" +
                "F11:=left(fk3_col1,fk3_col2)=(active_list_schema:outbound2:outbound2_id1,outbound2_id2)/$M/" +
                "F10:=left(fk4_col1)=(active_list_schema:outbound3:outbound3_id)/$M/" +
                appendText;

                expect([expectedPath1, expectedPath2]).toContain(mainRefCompact.readPath);
            });

            it ("should fall back to entity no outbound foreignkeys.", function () {
                expect(mainEmptFkRefCompact.readPath).toEqual("M:=active_list_schema:main_empty_fkeys@sort(main_empty_fkeys_id)");
            });
        });

        describe("tuple.values, ", function () {
            it ("should return empty result for the columns with secondary request wait_for.", function (done) {
                mainRefCompact.read(pageLen).then(function (page) {
                    mainRefCompactPage = page;
                    expect(page.tuples[0].values.length).toEqual(expectedCompactColumns.length, "length missmatch");
                    page.tuples[0].values.forEach(function (v, i) {
                        var expectedVal = expectedCompactColumns[i].value;
                        if (expectedCompactColumns[i].hasWaitFor) {
                            expectedVal = "";
                        }
                        expect(v).toEqual(expectedVal, "value missmatch for `" + expectedCompactColumns[i].title + "`");
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
            it ("should not have $self or $_self", function () {
                // this test case assumes that .values (and therefore .formatPresentation) is called before this
                // in .formatPresentation of columns we manipulate the templateVariables
                // to include $self and $_self and this test case is making sure that
                // those values are not added to the original templateVariables object
                // and are modifying a local variable instead.
                var tv = mainRefCompactPage.templateVariables;
                expect(tv.length).toBe(pageLen, "length missmatch");
                tv.forEach(function (v, i) {
                    expect(v.values.$_self).toBeFalsy("$_self exists for index=" + i);
                    expect(v.values.$self).toBeFalsy("$self exists for index=" + i);
                });
            });

            it ("should not include outbound fks if they are inivisble and source definitions fkeys is empty.", function () {
                var res = mainEmptyFkPage.templateVariables[0];
                expect(res.rowName).toBe("main_empty_fkeys one", "rowname missmatch");
                expect(res.uri.detailed).toContain("active_list_schema:main_empty_fkeys/RID=" + utils.findEntityRID(options, schemaName, "main_empty_fkeys", "main_empty_fkeys_id", "01"), "uri missmatch");
                var expectedValues = {
                    rowname_col: "main_empty_fkeys one",
                    _rowname_col: "main_empty_fkeys one",
                    int_col: "1,234,501",
                    _int_col: 1234501,
                    main_empty_fkeys_id: "01",
                    _main_empty_fkeys_id: "01"
                };

                expect(Object.keys(res.values).length).toBe(Object.keys(expectedValues).length, "keys length missmatch");
                for (var k in expectedValues) {
                    expect(res.values[k]).toEqual(expectedValues[k], "value missmatch for variable " + k);
                }

            });
        });

        afterAll(function () {
            options.ermRest.setClientConfig({});
        });
    });

// ----------------------- helpers
    function testColumnList (list, expected) {
        expect(list.length).toBe(expected.length, "length missmatch");
        expected.forEach(function (col, index) {
            var message = " for `" + col.title + "`.";
            expect(list[index].waitFor.length).toBe(col.waitFor.length, "waitfor length missmatch" + message);
            if (col.waitFor.length > 0) {
                expect(list[index].waitFor.map(function (wf) {
                    return wf.name;
                })).toEqual(jasmine.arrayContaining(col.waitFor.map(function (c) {
                    return columnMapping[c];
                })), "wait_for missmatch" + message);
            }
            expect(list[index].hasWaitFor).toBe(col.hasWaitFor, "hasWaitFor missmatch" + message);
        });
    }

    function testRequestList (requests, expected) {
        expect(requests.length).toBe(expected.length, "length missmatch.");
        requests.forEach(function (req, reqIndex) {
            var expReq = expected[reqIndex];

            if (req.inline) {
                expect(req.inline).toBe(expReq.inline, "inline missmatch for index=" + reqIndex);
            } else if (req.related) {
                expect(req.related).toBe(expReq.related, "related missmatch for index=" + reqIndex);
            } else {
                // entityset/aggregate
                var message = " for index= " + reqIndex + "(expected column= `"+ reverseColumnMapping[req.column.name] +"`)";
                expect(req.column.name).toBe(columnMapping[expReq.column], "column missmatch" + message);
                expect(req.entityset).toBe(expReq.entityset, "entityset missmatch" + message);
                expect(req.aggregate).toBe(expReq.aggregate, "aggregate missmatch" + message);
                expect(req.objects.length).toBe(expReq.objects.length, "objects length missmatch" + message);


                req.objects.forEach(function (obj, objIndex) {
                    var expObj = expReq.objects[objIndex];
                    expect(obj.index).toBe(expObj.index, "index missmatch" + message + " obj index=" + objIndex);
                    expect(obj.isWaitFor).toBe(expObj.isWaitFor, "isWaitFor missmatch" + message + " obj index=" + objIndex);
                    expect(obj.column).toBe(expObj.column, "column missmatch" + message + " obj index=" + objIndex);
                });
            }

        });
    }

    function testNameList (list, expected) {
        expect(list.length).toBe(expected.length, "length missmatch");
        var expectedRaw = expected.map(function (e) {
            return columnMapping[e] ? columnMapping[e] : e;
        })
        list.forEach(function (el, index) {
            var elReverse = "";
            if (reverseColumnMapping[el.name]) {
                elReverse = reverseColumnMapping[el.name];
            }
            expect(expectedRaw).toContain(el.name, el.name + " was not in the expected list" + (elReverse ?  " (the mapped value: " + elReverse + ")" : ""));
        });
    };

    function generateExpectedValues() {

        expectedCompactColumns = [
            {
                "title": "int_col_3",
                "waitFor": [],
                "hasWaitFor": false,
                "value": "1,234,521"
            },
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
            },
            {
                "title": "virtual_column",
                "waitFor": ["max_i2"],
                "hasWaitFor": true,
                "value": ""
            }
        ];

        expectedDetailedColumns = [
            {
                "title": "int_col_3",
                "waitFor": [],
                "hasWaitFor": false,
                "value": "1,234,521"
            },
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
                "title": "entity_set_i1",
                "waitFor": ["entity_set_i2", "array_d_entity_i5"],
                "hasWaitFor": true,
                "value": ""
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
                "title": "entity_set_i2",
                "waitFor": ["entity_set_i5"],
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
                "title": "entity_set_i3",
                "waitFor": [],
                "hasWaitFor": false,
                "value": ""
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
            },
            {
                "title": "virtual_column",
                "waitFor": ["max_i2", "entity_set_i3"],
                "hasWaitFor": true,
                "value": ""
            }
        ];

        /*
         * This will test all the scenarios:
         * - invalid wait_for
         * - all-outbound waitfors in citation, vis-col, vis-fk, key-displ, col-displ that should be added to read  request.
         * - ordering of active list in both compact and detailed
         * - entitysets in waitfor as well as visible.
         * - entityset with aggregate waitfor, without aggregate waitfor, without any waitfor
         */
        expectedCompactActiveList = {
            requests: [
                {
                    "column": "array_d_scalar_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 2, "isWaitFor": true, "column": true},
                        { "index": 15, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "cnt_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 4, "isWaitFor": true, "column": true},
                        {"index": 6, "isWaitFor": true, "column": true},
                        {"index": 17, "isWaitFor": false, "column": true},
                        {"index": 18, "isWaitFor": true, "column": true},
                        {"index": 20, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "array_d_entity_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 8, "isWaitFor": true, "column": true},
                        {"index": 13, "isWaitFor": false, "column": true},
                        {"index": 24, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "max_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 8, "isWaitFor": true, "column": true},
                        {"index": 23, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "array_d_scalar_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 10, "isWaitFor": true, "column": true},
                        {"index": 16, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "array_d_entity_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 14, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "cnt_d_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 14, "isWaitFor": true, "column": true},
                        {"index": 20, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "max_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 16, "isWaitFor": true, "column": true},
                        {"index": 24, "isWaitFor": false, "column": true},
                        {"index": 25, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "cnt_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 18, "isWaitFor": false,"column": true},
                        {"index": 20, "isWaitFor": true, "column": true},
                        {"index": 22, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "array_d_entity_i3",
                    "aggregate": true,
                    "objects": [
                        {"index": 18, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "cnt_d_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 19, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "array_d_scalar_i4",
                    "aggregate": true,
                    "objects": [
                        {"index": 20, "isWaitFor": true, "column": true},
                        {"index": 24, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "min_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 21, "isWaitFor": false,"column": true}
                    ]
                },
                {
                    "column": "min_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 22, "isWaitFor": false, "column": true}
                    ]
                }
            ],
            allOutBounds: [
                "outbound_entity_o1", "outbound_entity_o2", "outbound_scalar_o1", "all_outbound_entity_o1_o1",
                "all_outbound_entity_o2_o1", "all_outbound_scalar_o1_o1", "all_outbound_scalar_o2_o1",
                "all_outbound_entity_o1_o1_o1", "outbound_scalar_o2",
                "tLQ8i6ghoS6sodD7G8V7kQ", // not defined, so it's the fk.name (main_fk3)
                "outbound_entity_o3"
            ],
            selfLinks: [
                "self_link_rowname", "self_link_id"
            ]
        };

        expectedDetailedActiveList = {
            requests: [
                {
                    "column": "array_d_entity_i5",
                    "aggregate": true,
                    "objects": [
                        {"citation": true, "isWaitFor": true},
                        {"inline": true, "index": 4, "isWaitFor": true},
                        {"related": true, "index": 0, "isWaitFor": true}
                    ]
                },
                {
                    "column": "entity_set_i4",
                    "entityset": true,
                    "objects": [
                        {"citaiton": true, "isWaitFor": true}
                    ]
                },
                {
                    "inline": true,
                    "index": 8
                },
                {
                    "column": "entity_set_i5",
                    "entityset": true,
                    "objects": [
                        {"inline": true, "index": 8, "isWaitFor": true},
                        {"related": true, "index": 1, "isWaitFor": true}
                    ]
                },
                {
                    "inline": true,
                    "index": 14
                },
                {
                    "column": "array_d_scalar_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 2, "isWaitFor": true, "column": true},
                        { "index": 18, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "inline": true,
                    "index": 4
                },
                {
                    "column": "entity_set_i2",
                    "entityset": true,
                    "objects": [
                        {"inline": true, "index": 4, "isWaitFor": true}
                    ]
                },
                {
                    "column": "cnt_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 5, "isWaitFor": true, "column": true},
                        {"index": 7, "isWaitFor": true, "column": true},
                        {"index": 20, "isWaitFor": false, "column": true},
                        {"index": 21, "isWaitFor": true, "column": true},
                        {"index": 23, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "array_d_entity_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 10, "isWaitFor": true, "column": true},
                        {"index": 16, "isWaitFor": false, "column": true},
                        {"index": 27, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "max_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 10, "isWaitFor": true, "column": true},
                        {"index": 26, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "array_d_scalar_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 12, "isWaitFor": true, "column": true},
                        {"index": 19, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "array_d_entity_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 17, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "cnt_d_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 17, "isWaitFor": true, "column": true},
                        {"index": 23, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "max_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 19, "isWaitFor": true, "column": true},
                        {"index": 27, "isWaitFor": false, "column": true},
                        {"index": 28, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "cnt_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 21, "isWaitFor": false,"column": true},
                        {"index": 23, "isWaitFor": true, "column": true},
                        {"index": 25, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "array_d_entity_i3",
                    "aggregate": true,
                    "objects": [
                        {"index": 21, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "cnt_d_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 22, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "array_d_scalar_i4",
                    "aggregate": true,
                    "objects": [
                        {"index": 23, "isWaitFor": true, "column": true},
                        {"index": 27, "isWaitFor": true, "column": true}
                    ]
                },
                {
                    "column": "min_i1",
                    "aggregate": true,
                    "objects": [
                        {"index": 24, "isWaitFor": false,"column": true}
                    ]
                },
                {
                    "column": "min_i2",
                    "aggregate": true,
                    "objects": [
                        {"index": 25, "isWaitFor": false, "column": true}
                    ]
                },
                {
                    "column": "entity_set_i3",
                    "entityset": true,
                    "objects": [
                        {"column": true, "isWaitFor": true, "index": 28}
                    ]
                },
                {
                    "related": true,
                    "index": 0
                },
                {
                    "column": "array_d_entity_i4",
                    "aggregate": true,
                    "objects": [
                        {"related": true, "isWaitFor": true, "index": 0}
                    ]
                },
                {
                    "related": true,
                    "index": 1
                },
                {
                    "related": true,
                    "index": 2
                }
            ],
            allOutBounds: [
                "all_outbound_entity_o3_o1", "outbound_entity_o1",
                "outbound_entity_o2", "outbound_scalar_o1", "all_outbound_entity_o1_o1", "all_outbound_entity_o2_o1",
                "all_outbound_scalar_o1_o1", "all_outbound_scalar_o2_o1", "all_outbound_entity_o1_o1_o1",
                "outbound_scalar_o2", "all_outbound_entity_o3_o1_o1",
                "tLQ8i6ghoS6sodD7G8V7kQ", // not defined, so it's the fk.name (main_fk3)
                "outbound_entity_o3"
            ],
            selfLinks: [
                "self_link_rowname", "self_link_id"
            ]
        };
    }
};
