exports.execute = function (options) {
    // Test Cases:
    describe("for testing aggregate functions on tables and columns,", function () {
        var moment = options.ermRest._moment;

        function formatTimestamp(value) {
            return moment(value).format(options.ermRest._dataFormats.DATETIME.returnFormat);
        }

        var reference;
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "aggregate_schema",
            tableName = "aggregate_table",
            tableNameWithCompKey = "table_w_only_composite_key",
            tableNameWithSimpleKey = "table_w_simple_key",
            tableNameHistogramAnnotation = "histogram_annotation";

        var encodedMain = "u%E1%B4%89%C9%90%C9%AF",
            decodedMain = "uᴉɐɯ",
            encodedCol = "lo%C9%94",
            decodedCol = "loɔ",
            encodedID = "p%E1%B4%89";
            decodedID = "pᴉ";

        // Columns in aggregate table are as follows:
        // [id, int_agg, float_agg, text_agg, date_agg, timestamp_agg]

        var baseUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName;

        var attrGroupUri = options.url + "/catalog/" + catalog_id + "/attributegroup/M:=" +
            schemaName + ":" + tableName;

        var compositeTableWithJoinUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/(id)=(" + schemaName + ":" + tableNameWithCompKey + ":col)";

        var tableWithJoinUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/(id)=(" + schemaName + ":" + tableNameWithSimpleKey + ":simple_id)";

        var tableWithJoinAttrGroupUri = options.url + "/catalog/" + catalog_id + "/attributegroup/T:=" +
            schemaName + ":" + tableName + "/M:=(id)=(" + schemaName + ":" + tableNameWithSimpleKey + ":simple_id)";

        var tableWithUnicode = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/(id)=(" + schemaName + ":" + encodedMain + ":" + encodedID + ")";

        var tableWithUnicodeAttrGroupUri = options.url + "/catalog/" + catalog_id + "/attributegroup/T:=" +
            schemaName + ":" + tableName + "/M:=(id)=(" + schemaName + ":" + encodedMain + ":" + encodedID + ")";

        var histogramAnnotationUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableNameHistogramAnnotation;


        beforeAll(function (done) {
            options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                reference = response;

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        describe("regarding aggregate APIs, ", function () {
            it("should get the aggregate count for the aggregate_table table.", function(done) {
                var aggregateList = [
                    reference.aggregate.countAgg
                ];

                reference.getAggregates(aggregateList).then(function (response) {

                    expect(response[0]).toBe(5, "Table count is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should get aggregates for int_agg column.", function(done) {
                var intColumnAggs = reference.columns[1].aggregate;
                var aggregateList = [
                    intColumnAggs.countNotNullAgg,
                    intColumnAggs.countDistinctAgg,
                    intColumnAggs.minAgg,
                    intColumnAggs.maxAgg
                ];

                reference.getAggregates(aggregateList).then(function (response) {

                    expect(response[0]).toBe(5, "Int count not null is incorrect");
                    expect(response[1]).toBe(4, "Int unique count is incorrect");
                    expect(response[2]).toBe(2, "Int min value is incorrect");
                    expect(response[3]).toBe(215, "Int max value is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should get aggregates for float_agg column.", function(done) {
                var floatColumnAggs = reference.columns[2].aggregate;
                var aggregateList = [
                    floatColumnAggs.countNotNullAgg,
                    floatColumnAggs.countDistinctAgg,
                    floatColumnAggs.minAgg,
                    floatColumnAggs.maxAgg
                ];

                reference.getAggregates(aggregateList).then(function (response) {

                    expect(response[0]).toBe(4, "Float count not null is incorrect");
                    expect(response[1]).toBe(4, "Float unique count is incorrect");
                    expect(response[2]).toBe(0.4221, "Float min value is incorrect");
                    expect(response[3]).toBe(36.9201, "Float max value is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should get aggregates for text_agg column.", function(done) {
                var textColumnAggs = reference.columns[3].aggregate;
                var aggregateList = [
                    textColumnAggs.countNotNullAgg,
                    textColumnAggs.countDistinctAgg,
                    textColumnAggs.minAgg,
                    textColumnAggs.maxAgg
                ];

                reference.getAggregates(aggregateList).then(function (response) {

                    expect(response[0]).toBe(4, "Text count not null is incorrect");
                    expect(response[1]).toBe(3, "Text unique count is incorrect");
                    expect(response[2]).toBe("bread", "Text min value is incorrect");
                    expect(response[3]).toBe("sandwich", "Text max value is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should get aggregates for date_agg column.", function(done) {
                var dateColumnAggs = reference.columns[4].aggregate;
                var aggregateList = [
                    dateColumnAggs.countNotNullAgg,
                    dateColumnAggs.countDistinctAgg,
                    dateColumnAggs.minAgg,
                    dateColumnAggs.maxAgg
                ];

                reference.getAggregates(aggregateList).then(function (response) {

                    expect(response[0]).toBe(3, "Date count not null is incorrect");
                    expect(response[1]).toBe(3, "Date unique count is incorrect");
                    expect(response[2]).toBe("2015-01-11", "Date min value is incorrect");
                    expect(response[3]).toBe("2017-07-17", "Date max value is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it("should get aggregates for timestamp_agg column.", function(done) {
                var timestampColumnAggs = reference.columns[5].aggregate;
                var aggregateList = [
                    timestampColumnAggs.countNotNullAgg,
                    timestampColumnAggs.countDistinctAgg,
                    timestampColumnAggs.minAgg,
                    timestampColumnAggs.maxAgg
                ];

                reference.getAggregates(aggregateList).then(function (response) {

                    expect(response[0]).toBe(5, "Timestamp count not null is incorrect");
                    expect(response[1]).toBe(5, "Timestamp unique count is incorrect");
                    expect(formatTimestamp(response[2])).toBe(formatTimestamp("2010-05-22T17:44:00-07:00"), "Timestamp min value is incorrect");
                    expect(formatTimestamp(response[3])).toBe(formatTimestamp("2017-04-13T14:10:00-07:00"), "Timestamp max value is incorrect");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });

        describe("regarding group aggregate APIs, ", function () {
            describe ('column.groupAggregate, ', function () {
                it ('should return null if is being called on a pseudo-column', function () {
                    expect(reference.columns[0].groupAggregate).toBe(null);
                });

                it ('otherwise should return an object.', function () {
                    expect(reference.columns[1].groupAggregate).toBeDefined();
                });
            });

            describe("entityCounts, ", function () {
                var expectAttrGroupRef = function (ag_ref, uri, colDisplaynames) {
                    expect(ag_ref).toEqual(jasmine.any(Object), "attributegroup reference is not an object.");

                    expect(ag_ref.isAttributeGroup).toBe(true, "It's not an attributegroup reference");
                    expect(ag_ref.uri).toBe(uri, "invalid URI");
                    expect(ag_ref.columns.map(function (c) {return c.displayname.value;})).toEqual(colDisplaynames, "column names missmatch.");
                };


                it ("if there's a join in the path should and table doesn't have single keys, should throw an error.", function (done) {
                    options.ermRest.resolve(compositeTableWithJoinUri, {cid: "test"}).then(function (reference) {
                        expect(function () {
                            var ec = reference.columns[0].groupAggregate.entityCounts;
                        }).toThrow("Table must have a simple key for entity counts: table_w_only_composite_key");

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it ("if there's a join in the path should return an attributegroup reference, using cnt_d(shortestKey) for count.", function (done) {
                    options.ermRest.resolve(tableWithJoinUri, {cid: "test"}).then(function (reference) {
                        expectAttrGroupRef(
                            reference.columns[0].groupAggregate.entityCounts,
                            tableWithJoinAttrGroupUri + "/value:=col;count:=cnt_d(simple_id)@sort(count::desc::,value)",
                            ["col", "Number of Occurences"]
                        );
                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it ("should be able to handle table and columns with unicode characters.", function (done) {
                    options.ermRest.resolve(tableWithUnicode, {cid: "test"}).then(function (reference) {
                        expectAttrGroupRef(
                            reference.columns[1].groupAggregate.entityCounts,
                            tableWithUnicodeAttrGroupUri + "/value:=" + encodedCol + ";count:=cnt_d("+ encodedID +")@sort(count::desc::,value)",
                            [decodedCol, "Number of Occurences"]
                        );
                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it ("for int_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[1].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=int_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["int_agg", "Number of Occurences"]
                    );
                });

                it ("for float_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[2].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=float_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["float_agg", "Number of Occurences"]
                    );
                });

                it ("for text_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[3].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=text_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["text_agg", "Number of Occurences"]
                    );
                });

                it ("for date_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[4].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=date_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["date_agg", "Number of Occurences"]
                    );
                });


                it ("for timestamp_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[5].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=timestamp_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["timestamp_agg", "Number of Occurences"]
                    );
                });


            });

            describe("histograms, ", function () {
                var bucketAgRef, min, max, calculatedMax, calculatedWidth, maxBucketIndex,
                    bucketCount = 30,
                    errorThreshold = 0.01; // 1%

                function calulatePrecision(currVal, nextVal, type) {
                    var marginOfError;
                    if (type == "date") {
                        marginOfError = moment.duration(moment(nextVal).diff(moment(currVal))).asDays();
                    } else if (type == "timestamp") {
                        marginOfError = moment.duration(moment(nextVal).diff(moment(currVal))).asSeconds();
                    } else {
                        marginOfError = nextVal - currVal;
                    }
                    return marginOfError/calculatedWidth - 1;
                }

                function testHistogramRead(graphData, precisionMarginOfError, type) {
                    var labels = graphData.labels;

                    expect(graphData.x[0]).toBe(min, "First x axis label is incorrect");
                    expect(graphData.x[graphData.x.length-1]).toBe(calculatedMax, "Last x axis label is incorrect");
                    expect(graphData.x).toEqual(graphData.labels.min, "X and label.min arrays don't match");

                    expect(graphData.y[0]).toBeGreaterThan(0, "No values in the bucket representing the min group");
                    // the max being adjusted to 'calculated max', the actual max value falls into a different bucket than the very last one.
                    expect(graphData.y[maxBucketIndex]).toBeGreaterThan(0, "No values in the bucket representing the max group");

                    expect(labels.min[0]).toBe(min, "First label is incorrect in labels");
                    expect(labels.min[labels.min.length-1]).toBe(calculatedMax, "Last label is incorrect in labels");
                    expect(labels.min).toEqual(graphData.x, "X axis values and labels array are not the same");

                    for (var i=0; i<labels.min.length; i++) {
                        if (i != labels.min.length-1) {
                            // verify that each x value is lessthan the next one
                            expect(graphData.x[i]).toBeLessThan(graphData.x[i+1], "X value at index " + i + " ");

                            // verify each range is within a percentage of the expected width value
                            var precisionPercent = calulatePrecision(graphData.x[i], graphData.x[i+1], type);
                            var errorMess = "Bucket range for indices: (" + i + "," + (i+1) + ") is not within the margin of error";
                            if (type === "integer") {
                                expect(precisionPercent).toBe(precisionMarginOfError, errorMess);
                            } else {
                                expect(precisionPercent).toBeLessThan(precisionMarginOfError, errorMess);
                            }

                            // verify that each max is the next min label
                            expect(labels.max[i]).toBe(labels.min[i+1], "max label is not consistent with the next min label");
                        }
                    }
                }

                it("should set properties properly based on anotation value.", function (done) {
                    options.ermRest.resolve(histogramAnnotationUri, {cid: "test"}).then(function (response) {
                        facetColumns = response.facetColumns;
                        // no_histogram_int column
                        expect(facetColumns[0].barPlot).toBeFalsy("no_histogram_int column shows a histogram");
                        expect(facetColumns[0].histogramBucketCount).toBe(30, "no_histogram_int column bucket count is not the default");
                        // dif_num_buckets_float column
                        expect(facetColumns[1].barPlot).toBeTruthy("dif_num_buckets_float column does not show a histogram");
                        expect(facetColumns[1].histogramBucketCount).toBe(50, "dif_num_buckets_float column bucket count is not the same as what is defined in the annotation");
                        // default_date column
                        expect(facetColumns[2].barPlot).toBeTruthy("default_date column does not show a histogram");
                        expect(facetColumns[2].histogramBucketCount).toBe(30, "default_date column bucket count is not the default");

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                describe("for an integer column,", function () {

                    beforeAll(function () {
                        min = 2;
                        max = 215;
                        calculatedMax = 242;
                        calculatedWidth = 8;
                        maxBucketIndex = Math.floor( (max-min)/calculatedWidth );
                    });

                    it("the histogram function should return a proper bucket AG reference.", function () {
                        bucketAgRef = reference.columns[1].groupAggregate.histogram(bucketCount, min, max);

                        expect(bucketAgRef instanceof options.ermRest.BucketAttributeGroupReference).toBeTruthy("Reference returned by histogram is not an instance of BucketAttributeGroupReference");
                        expect(bucketAgRef.isAttributeGroup).toBeTruthy("Reference is not of type attribute group");

                        // verify histoggram required properties
                        expect(bucketAgRef._min).toBe(min, "Histogram min was not set properly on reference");
                        expect(bucketAgRef._max).toBe(calculatedMax, "Histogram max was not set properly on reference");
                        expect(bucketAgRef._numberOfBuckets).toBe(bucketCount, "Histogram bucket count was not set properly on reference");
                        expect(bucketAgRef._bucketWidth).toBe(calculatedWidth, "Histogram bucket width was not set properly on reference");
                    });

                    it("should read the histogram data and return it in a proper format for plotly.", function (done) {

                        bucketAgRef.read().then(function (response) {
                            testHistogramRead(response, 0, "integer");

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });

                describe("for a float column,", function () {

                    beforeAll(function () {
                        min = 0.4221;
                        max = 36.9201;
                        calculatedMax = max;
                        calculatedWidth = 1.2166;
                        maxBucketIndex = Math.floor( (max-min)/calculatedWidth );
                    });

                    it("the histogram function should return a proper bucket AG reference.", function () {
                        bucketAgRef = reference.columns[2].groupAggregate.histogram(bucketCount, min, max);

                        expect(bucketAgRef instanceof options.ermRest.BucketAttributeGroupReference).toBeTruthy("Reference returned by histogram is not an instance of BucketAttributeGroupReference");
                        expect(bucketAgRef.isAttributeGroup).toBeTruthy("Reference is not of type attribute group");

                        // verify histoggram required properties
                        expect(bucketAgRef._min).toBe(min, "Histogram min was not set properly on reference");
                        expect(bucketAgRef._max).toBe(max, "Histogram max was not set properly on reference");
                        expect(bucketAgRef._numberOfBuckets).toBe(bucketCount, "Histogram bucket count was not set properly on reference");
                        expect(bucketAgRef._bucketWidth).toBe(calculatedWidth, "Histogram bucket width was not set properly on reference");
                    });

                    it("should read the histogram data and return it in a proper format for plotly.", function (done) {

                        bucketAgRef.read().then(function (response) {
                            testHistogramRead(response, errorThreshold, "float");

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });

                describe("for a date column,", function () {

                    beforeAll(function () {
                        min = "2015-01-11";
                        max = "2017-07-17";
                        calculatedMax = "2017-07-29";
                        calculatedWidth = 31;
                        var dayDiff = moment.duration(moment(max).diff(moment(min))).asDays();
                        maxBucketIndex = Math.floor( dayDiff/calculatedWidth );
                    });

                    it("the histogram function should return a proper bucket AG reference.", function () {
                        bucketAgRef = reference.columns[4].groupAggregate.histogram(bucketCount, min, max);

                        expect(bucketAgRef instanceof options.ermRest.BucketAttributeGroupReference).toBeTruthy("Reference returned by histogram is not an instance of BucketAttributeGroupReference");
                        expect(bucketAgRef.isAttributeGroup).toBeTruthy("Reference is not of type attribute group");

                        // verify histoggram required properties
                        expect(bucketAgRef._min).toBe(min, "Histogram min was not set properly on reference");
                        expect(bucketAgRef._max).toBe(calculatedMax, "Histogram max was not set properly on reference");
                        expect(bucketAgRef._numberOfBuckets).toBe(bucketCount, "Histogram bucket count was not set properly on reference");
                        expect(bucketAgRef._bucketWidth).toBe(calculatedWidth, "Histogram bucket width was not set properly on reference");
                    });

                    it("should read the histogram data and return it in a proper format for plotly.", function (done) {

                        bucketAgRef.read().then(function (response) {
                            testHistogramRead(response, errorThreshold, "date");

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });

                describe("for a timestamp column,", function () {
                    var submissionMin, submissionMax;

                    beforeAll(function () {
                        submissionMin = formatTimestamp("2010-05-22T17:44:00-07:00");
                        submissionMax = formatTimestamp("2017-04-13T14:10:00-07:00");

                        min = "2010-05-22 17:44:00";
                        max = "2017-04-13 14:10:00";
                        calculatedMax = max;
                        calculatedWidth = 7251412;
                        var secondsDiff = moment.duration(moment(max).diff(moment(min))).asSeconds();
                        maxBucketIndex = Math.floor( secondsDiff/calculatedWidth );
                    });

                    it("the histogram function should return a proper bucket AG reference.", function () {
                        // different submission values because they are formatted differently
                        bucketAgRef = reference.columns[5].groupAggregate.histogram(bucketCount, submissionMin, submissionMax);

                        expect(bucketAgRef instanceof options.ermRest.BucketAttributeGroupReference).toBeTruthy("Reference returned by histogram is not an instance of BucketAttributeGroupReference");
                        expect(bucketAgRef.isAttributeGroup).toBeTruthy("Reference is not of type attribute group");

                        // verify histoggram required properties
                        expect(bucketAgRef._min).toBe(submissionMin, "Histogram min was not set properly on reference");
                        expect(bucketAgRef._max).toBe(submissionMax, "Histogram max was not set properly on reference");
                        expect(bucketAgRef._numberOfBuckets).toBe(bucketCount, "Histogram bucket count was not set properly on reference");
                        expect(bucketAgRef._bucketWidth).toBe(calculatedWidth, "Histogram bucket width was not set properly on reference");
                    });

                    it("should read the histogram data and return it in a proper format for plotly.", function (done) {

                        bucketAgRef.read().then(function (response) {
                            testHistogramRead(response, errorThreshold, "timestamp");

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });
            });

            //TODO add test cases for entityValues
        });
    });
};
