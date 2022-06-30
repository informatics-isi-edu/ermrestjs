var utils = require('./../../../utils/utilities.js');

exports.execute = function (options) {
    var catalog_id = process.env.DEFAULT_CATALOG,
        schemaName = "pseudo_column_display_self_schema",
        tableName = "main";

    var mainEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
        schemaName + ":" + tableName + "/@sort(main_id)";
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

    describe("display setting in pseudo-columns while accessing $self, ", function () {
        var detailedExpectedValues, templateVariables;

        var mainRef, mainRefDetailed, mainPageDetailed;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(mainEntityUri, {cid: "test"}).then(function (response) {
                mainRef = response;
                mainRefDetailed = response.contextualize.detailed;
                done();
            }).catch(catchError(done));

            detailedExpectedValues = [
                {
                    title: 'self-link',
                    value: '<p>self_link <a href="' + recordURL + '/pseudo_column_display_self_schema:main/main_id=01">main one(1234501, 1,234,501)</a></p>\n'
                },
                {
                    title: 'normal column',
                    value: '<p>int_col: 1,234,501, 1234501</p>\n'
                },
                {
                    title: 'outbound entity',
                    value: '<p>outbound: <a href="' + getRecordURL('outbound1', 'outbound1_id', 'o01') + '">outbound1 one(1234511, 1,234,511)</a></p>\n'
                },
                {
                    title: 'outbound scalar',
                    value: '<p>outbound scalar: 1,234,511, 1234511</p>\n'
                },
                {
                    title: 'all-outbound entity',
                    value: '<p>all_outbound entity: <a href="' + getRecordURL('outbound1_outbound1', 'outbound1_outbound1_id', 'oo01') + '">outbound1_outbound1 one(12345111, 12,345,111)</a></p>\n'
                },
                {
                    title: 'all-otubound scalar',
                    value: '<p>all_outbound scalar: 12,345,111, 12345111</p>\n'
                },
                null, null, null, null, null, null
            ];

            templateVariables = {};
        });

        it("Tuple.values should return the expected values.", function (done) {
            mainRefDetailed.read(pageLen).then(function (response) {
                mainPageDetailed = response;
                expect(mainPageDetailed.tuples[0].values.length).toEqual(detailedExpectedValues.length, "length missmatch");
                mainPageDetailed.tuples[0].values.forEach(function (v, i) {
                    if (detailedExpectedValues[i] == null) {
                        expect(v).toEqual(null, "value missmatch for index=" + i);
                    } else {
                        expect(v).toEqual(detailedExpectedValues[i].value, "value missmatch for index=" + i + " (" + detailedExpectedValues[i].title + ")");
                    }
                })
                done();
            }).catch(catchError(done));
        });

        describe ("column.getAggregatedValue, ", function () {
            var testGetAggregatedValue = function (col, expected, testTemplateVariablesCB, done) {
                col.getAggregatedValue(mainPageDetailed).then(function (val) {
                    expect(val.length).toBe(expected.length, "length missmatch.");
                    val.forEach(function (v, i) {
                        expect(v.isHTML).toEqual(expected[i].isHTML, "isHTML missmatch for index=" + i);
                        expect(v.value).toEqual(expected[i].value, "value missmatch for index=" + i);
                        if (testTemplateVariablesCB) {
                          testTemplateVariablesCB(v, i);
                        }
                    });
                    done();
                }).catch(catchError(done));
            };

            it ("should return the expected value for array_d entity", function (done) {
                var expectedValue = "<p>array_d entity: ";
                var rowValues = [
                    {id: "i01", caption: "inbound1 one(1234521, 1,234,521)", rowName: "inbound1 one", int_col: "1,234,521", _int_col: 1234521},
                    {id: "i02", caption: "inbound1 two(1234522, 1,234,522)", rowName: "inbound1 two", int_col: "1,234,522", _int_col: 1234522},
                    {id: "i03", caption: "inbound1 three(1234523, 1,234,523)", rowName: "inbound1 three", int_col: "1,234,523", _int_col: 1234523},
                    {id: "i04", caption: "inbound1 four(1234524, 1,234,524)", rowName: "inbound1 four", int_col: "1,234,524", _int_col: 1234524},
                    {id: "i05", caption: "inbound1 five(1234525, 1,234,525)", rowName: "inbound1 five", int_col: "1,234,525", _int_col: 1234525}
                ];

                rowValues.forEach(function (r, index, arr) {
                    expectedValue += '<a href="' + getRecordURL('inbound1', 'inbound1_id', r.id) + '">' + r.caption + '</a>';
                    if (index !== arr.length - 1) expectedValue += ", ";
                });

                expectedValue += "</p>\n";

                testGetAggregatedValue(
                    mainRefDetailed.columns[6],
                    [{isHTML: true, value: expectedValue},{ isHTML: false, value: ""}],
                    function (value, index) {
                        if (index === 0) {
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index=" + index);
                            expect(value.templateVariables.$self.length).toBe(rowValues.length, "$self was not defined for index=" + index);
                            value.templateVariables.$self.forEach(function (tv, tvIndex) {
                                expect(tv.rowName).toEqual(rowValues[tvIndex].rowName, "templateVariables, rowName missmatch in index"+ tvIndex+ " for index=" + index);
                                expect(tv.uri.detailed).toEqual(getRecordURL('inbound1', 'inbound1_id', rowValues[tvIndex].id), "templateVariables, uri missmatch in index"+ tvIndex+ " for index=" + index);
                                expect(tv.values.int_col).toEqual(rowValues[tvIndex].int_col, "templateVariables, int_col missmatch in index"+ tvIndex+ " for index=" + index);
                                expect(tv.values._int_col).toEqual(rowValues[tvIndex]._int_col, "templateVariables, _int_col missmatch in index"+ tvIndex+ " for index=" + index);
                            });
                        } else {
                            // the null value
                            expect(value.templateVariables).toEqual({}, "templateVariables was defined for index=1");
                        }
                    },
                    done
                );
            });

            it ("should return the expected value for array_d scalar", function (done) {
                var expectedValue = "<p>array_d scalar: 1,234,521, 1,234,522, 1,234,523, 1,234,524, 1,234,525 - 1234521| 1234522| 1234523| 1234524| 1234525</p>\n";
                testGetAggregatedValue(
                    mainRefDetailed.columns[7],
                    [{isHTML: true, value: expectedValue},{ isHTML: false, value: ""}],
                    function(value, index) {
                        if (index === 0) {
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index=" + index);
                            expect(value.templateVariables.$self).toEqual("1,234,521, 1,234,522, 1,234,523, 1,234,524, 1,234,525", "$self missmatch for index=" + index);
                            var expected_self = [1234521, 1234522, 1234523, 1234524, 1234525];
                            expect(value.templateVariables.$_self.length).toBe(expected_self.length, "$_self length missmatch for index=" + index);
                            value.templateVariables.$_self.forEach(function (_selfVal, selfIndex) {
                                expect(_selfVal).toBe(expected_self[selfIndex], "$_self missmatch value in index= " + selfIndex + " for index=" + index);
                            })
                        } else {
                            // the null value
                            expect(value.templateVariables).toEqual({}, "templateVariables was defined for index=1");
                        }
                    },
                    done
                );
            });

            it ("should return the expected value for cnt scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[8],
                    [{isHTML: true, value: "<p>cnt: 5, 5</p>\n"},{ isHTML: false, value: "0"}],
                    function (value, index) {
                        if (index === 0) {
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index=" + index);
                            expect(value.templateVariables.$self).toEqual("5", "$self missmatch for index=" + index);
                            expect(value.templateVariables.$_self).toEqual(5, "$self missmatch for index=" + index);
                        } else {
                            // the null value
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index" + index);
                            expect(value.templateVariables.$self).toEqual("0", "$self missmatch for index=" + index);
                            expect(value.templateVariables.$_self).toEqual(0, "$self missmatch for index=" + index);
                        }
                    },
                    done
                );
            });

            it ("should return the expected value for cnt_d scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[9],
                    [{isHTML: true, value: "<p>cnt_d: 5, 5</p>\n"},{ isHTML: false, value: "0"}],
                    function (value, index) {
                        if (index === 0) {
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index=" + index);
                            expect(value.templateVariables.$self).toEqual("5", "$self missmatch for index=" + index);
                            expect(value.templateVariables.$_self).toEqual(5, "$self missmatch for index=" + index);
                        } else {
                            // the empty value
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index" + index);
                            expect(value.templateVariables.$self).toEqual("0", "$self missmatch for index=" + index);
                            expect(value.templateVariables.$_self).toEqual(0, "$self missmatch for index=" + index);
                        }
                    },
                    done
                );
            });

            it ("should return the expected value for min scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[10],
                    [{isHTML: true, value: "<p>min: 1,234,521, 1234521</p>\n"},{ isHTML: false, value: ""}],
                    function (value, index) {
                        if (index === 0) {
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index=" + index);
                            expect(value.templateVariables.$self).toEqual("1,234,521", "$self missmatch for index=" + index);
                            expect(value.templateVariables.$_self).toEqual(1234521, "$self missmatch for index=" + index);
                        } else {
                            // the null value
                            expect(value.templateVariables).toEqual({}, "templateVariables was defined for index=1");
                        }
                    },
                    done
                );
            });

            it ("should return the expected value for max scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[11],
                    [{isHTML: true, value: "<p>max: 1,234,525, 1234525</p>\n"},{ isHTML: false, value: ""}],
                    function (value, index) {
                        if (index === 0) {
                            expect(value.templateVariables).toBeDefined("templateVariables was not defined for index=" + index);
                            expect(value.templateVariables.$self).toEqual("1,234,525", "$self missmatch for index=" + index);
                            expect(value.templateVariables.$_self).toEqual(1234525, "$self missmatch for index=" + index);
                        } else {
                            // the null value
                            expect(value.templateVariables).toEqual({}, "templateVariables was defined for index=1");
                        }
                    },
                    done
                );
            });
        });

        describe("page.content, ", function () {
            it ("page.content for related entity with $self", function (done) {
                var related = mainRefDetailed.related;
                expect(related.length).toEqual(1, "related length missmatch");

                var content = "<p>";
                var rowValues = [
                    {id: "i01", caption: "inbound2 one(1,234,501, main one)"},
                    {id: "i02", caption: "inbound2 two(1,234,501, main one)"},
                    {id: "i03", caption: "inbound2 three(1,234,501, main one)"},
                    {id: "i04", caption: "inbound2 four(1,234,501, main one)"},
                    {id: "i05", caption: "inbound2 five(1,234,501, main one)"}
                ];
                rowValues.forEach(function (r, index, arr) {
                    content += '<a href="' + getRecordURL('inbound2', 'inbound2_id', r.id) + '">' + r.caption + '</a>';
                    if (index !== arr.length - 1) content += ", ";
                });
                content += "</p>\n";
                related[0].read(5).then(function (page) {
                    expect(page.content).toEqual(content);
                    done();
                }).catch(catchError(done));
            });
        });
    });
};
