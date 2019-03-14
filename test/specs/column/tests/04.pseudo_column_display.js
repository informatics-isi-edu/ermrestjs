exports.execute = function (options) {
    var catalog_id = process.env.DEFAULT_CATALOG,
        schemaName = "pseudo_column_display_schema",
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

    describe("display setting in pseudo-columns, ", function () {
        var detailedExpectedValues;

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
                    value: '<p><a href="' + getRecordURL('main', 'main_id', '01') + '">main one(1234501, 1,234,501)</a></p>\n'
                },
                {
                    title: 'normal column',
                    value: '<p>1,234,501, 1234501</p>\n'
                },
                {
                    title: 'outbound entity',
                    value: '<p><a href="' + getRecordURL('outbound1', 'outbound1_id', 'o01') + '">outbound1 one(1234511, 1,234,511)</a></p>\n'
                },
                {
                    title: 'outbound scalar',
                    value: '<p>1,234,511, 1234511</p>\n'
                },
                {
                    title: 'all-outbound entity',
                    value: '<p><a href="' + getRecordURL('outbound1_outbound1', 'outbound1_outbound1_id', 'oo01') + '">outbound1_outbound1 one(12345111, 12,345,111)</a></p>\n'
                },
                {
                    title: 'all-otubound scalar',
                    value: '<p>12,345,111, 12345111</p>\n'
                },
                null, null, null, null, null, null
            ];
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
            var testGetAggregatedValue = function (col, expected, done) {
                col.getAggregatedValue(mainPageDetailed).then(function (val) {
                    expect(val.length).toBe(expected.length, "length missmatch.");
                    val.forEach(function (v, i) {
                        expect(v.isHTML).toEqual(expected[i].isHTML, "isHTML missmatch for index=" + i);
                        expect(v.value).toEqual(expected[i].value, "value missmatch for index=" + i);
                    });
                    done();
                }).catch(catchError(done));
            };

            it ("should return the expected value for array_d entity", function (done) {
                var expectedValue = "<p>";
                var rowValues = [
                    {id: "i01", caption: "inbound1 one(1234521, 1,234,521)"},
                    {id: "i02", caption: "inbound1 two(1234522, 1,234,522)"},
                    {id: "i03", caption: "inbound1 three(1234523, 1,234,523)"},
                    {id: "i04", caption: "inbound1 four(1234524, 1,234,524)"},
                    {id: "i05", caption: "inbound1 five(1234525, 1,234,525)"}
                ];

                rowValues.forEach(function (r, index, arr) {
                    expectedValue += '<a href="' + getRecordURL('inbound1', 'inbound1_id', r.id) + '">' + r.caption + '</a>';
                    if (index !== arr.length - 1) expectedValue += ", ";
                });

                expectedValue += "</p>\n";

                testGetAggregatedValue(
                    mainRefDetailed.columns[6],
                    [{isHTML: true, value: expectedValue},{ isHTML: false, value: ""}],
                    done
                );
            });

            it ("should return the expected value for array_d scalar", function (done) {
                var expectedValue = "<p>1,234,521,1,234,522,1,234,523,1,234,524,1,234,525 - 1234521| 1234522| 1234523| 1234524| 1234525</p>\n";
                testGetAggregatedValue(
                    mainRefDetailed.columns[7],
                    [{isHTML: true, value: expectedValue},{ isHTML: false, value: ""}],
                    done
                );
            });

            it ("should return the expected value for cnt scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[8],
                    [{isHTML: true, value: "<p>5, 5</p>\n"},{ isHTML: false, value: ""}],
                    done
                );
            });

            it ("should return the expected value for cnt_d scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[9],
                    [{isHTML: true, value: "<p>5, 5</p>\n"},{ isHTML: false, value: ""}],
                    done
                );
            });

            it ("should return the expected value for min scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[10],
                    [{isHTML: true, value: "<p>1,234,521, 1234521</p>\n"},{ isHTML: false, value: ""}],
                    done
                );
            });

            it ("should return the expected value for max scalar", function (done) {
                testGetAggregatedValue(
                    mainRefDetailed.columns[11],
                    [{isHTML: true, value: "<p>1,234,525, 1234525</p>\n"},{ isHTML: false, value: ""}],
                    done
                );
            });
        });

        it ("page.content for related entity", function (done) {
            var related = mainRefDetailed.related();
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
};
