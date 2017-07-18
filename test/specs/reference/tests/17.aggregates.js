exports.execute = function (options) {
    // Test Cases:
    describe("for testing default values while creating an entity/entities,", function () {
        var reference;
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "aggregate_schema",
            tableName = "aggregate_table";

        // Columns in aggregate table are as follows:
        // [id, int_agg, float_agg, text_agg, date_agg, timestamp_agg]

        var baseUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName;

        beforeAll(function (done) {
            options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                reference = response;

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        it("should get the aggregate count for the aggregate_table table.", function(done) {
            var aggregateList = [
                reference.aggregate.countAgg("cnt")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                response = response[0];

                expect(response.cnt).toBe(5, "Table count is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        it("should get aggregates for int_agg column.", function(done) {
            var intColumnAggs = reference.columns[1].aggregate;
            var aggregateList = [
                intColumnAggs.countNotNullAgg("cnt"),
                intColumnAggs.countDistinctAgg("unique"),
                intColumnAggs.minAgg("min"),
                intColumnAggs.maxAgg("max")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                response = response[0];

                expect(response.cnt).toBe(5, "Int count not null is incorrect");
                expect(response.unique).toBe(4, "Int unique count is incorrect");
                expect(response.min).toBe(2, "Int min value is incorrect");
                expect(response.max).toBe(215, "Int max value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        it("should get aggregates for float_agg column.", function(done) {
            var floatColumnAggs = reference.columns[2].aggregate;
            var aggregateList = [
                floatColumnAggs.countNotNullAgg("cnt"),
                floatColumnAggs.countDistinctAgg("unique"),
                floatColumnAggs.minAgg("min"),
                floatColumnAggs.maxAgg("max")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                response = response[0];

                expect(response.cnt).toBe(4, "Float count not null is incorrect");
                expect(response.unique).toBe(4, "Float unique count is incorrect");
                expect(response.min).toBe(0.4222, "Float min value is incorrect");
                expect(response.max).toBe(36.9201, "Float max value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        it("should get aggregates for text_agg column.", function(done) {
            var textColumnAggs = reference.columns[3].aggregate;
            var aggregateList = [
                textColumnAggs.countNotNullAgg("cnt"),
                textColumnAggs.countDistinctAgg("unique"),
                textColumnAggs.minAgg("min"),
                textColumnAggs.maxAgg("max")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                response = response[0];

                expect(response.cnt).toBe(4, "Text count not null is incorrect");
                expect(response.unique).toBe(3, "Text unique count is incorrect");
                expect(response.min).toBe("bread", "Text min value is incorrect");
                expect(response.max).toBe("sandwich", "Text max value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        it("should get aggregates for date_agg column.", function(done) {
            var dateColumnAggs = reference.columns[4].aggregate;
            var aggregateList = [
                dateColumnAggs.countNotNullAgg("cnt"),
                dateColumnAggs.countDistinctAgg("unique"),
                dateColumnAggs.minAgg("min"),
                dateColumnAggs.maxAgg("max")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                response = response[0];

                expect(response.cnt).toBe(3, "Date count not null is incorrect");
                expect(response.unique).toBe(3, "Date unique count is incorrect");
                expect(response.min).toBe("2015-01-11", "Date min value is incorrect");
                expect(response.max).toBe("2017-07-17", "Date max value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        it("should get aggregates for timestamp_agg column.", function(done) {
            var timestampColumnAggs = reference.columns[5].aggregate;
            var aggregateList = [
                timestampColumnAggs.countNotNullAgg("cnt"),
                timestampColumnAggs.countDistinctAgg("unique"),
                timestampColumnAggs.minAgg("min"),
                timestampColumnAggs.maxAgg("max")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                response = response[0];

                expect(response.cnt).toBe(5, "Timestamp count not null is incorrect");
                expect(response.unique).toBe(5, "Timestamp unique count is incorrect");
                expect(response.min).toBe("2010-05-22T17:44:00", "Timestamp min value is incorrect");
                expect(response.max).toBe("2017-04-13T14:10:00", "Timestamp max value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });
    });
}
