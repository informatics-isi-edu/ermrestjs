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

        it("should get aggregates for different columns without aliases being set.", function(done) {
            var aggregateList = [
                // int aggs
                reference.columns[1].aggregate.countNotNullAgg(),
                reference.columns[1].aggregate.minAgg(),
                reference.columns[1].aggregate.maxAgg(),
                // float aggs
                reference.columns[2].aggregate.countNotNullAgg(),
                reference.columns[2].aggregate.minAgg(),
                reference.columns[2].aggregate.maxAgg()
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                // returned values have keys based on their index in the aggregateList
                // int aggs
                expect(response['0']).toBe(5, "Int count not null is incorrect");
                expect(response['1']).toBe(2, "Int min value is incorrect");
                expect(response['2']).toBe(215, "Int max value is incorrect");
                // float aggs
                expect(response['3']).toBe(4, "Float count not null is incorrect");
                expect(response['4']).toBe(0.4222, "Float min value is incorrect");
                expect(response['5']).toBe(36.9201, "Float max value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        // verifies that aliasing when not set is based on aggregate list index
        it("should get aggregates for different columns with some aliases being set.", function(done) {
            var aggregateList = [
                // int aggs
                reference.columns[1].aggregate.countNotNullAgg(),
                reference.columns[1].aggregate.minAgg("int_min"),
                reference.columns[1].aggregate.maxAgg(),
                // float aggs
                reference.columns[2].aggregate.countNotNullAgg("float_cnt"),
                reference.columns[2].aggregate.minAgg(),
                reference.columns[2].aggregate.maxAgg(),
                // text agg
                reference.columns[3].aggregate.minAgg("text_min")
            ];

            reference.getAggregates(aggregateList).then(function (response) {
                // returned values have keys based on their index in the aggregateList
                // int aggs
                expect(response['0']).toBe(5, "Int count not null is incorrect");
                expect(response.int_min).toBe(2, "Int min value is incorrect");
                expect(response['2']).toBe(215, "Int max value is incorrect");
                // float aggs
                expect(response.float_cnt).toBe(4, "Float count not null is incorrect");
                expect(response['4']).toBe(0.4222, "Float min value is incorrect");
                expect(response['5']).toBe(36.9201, "Float max value is incorrect");
                // text agg
                expect(response.text_min).toBe("bread", "Text min value is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        // Produces 2 request URLs. One of length 2036 and the other is 410. All data should be lumped into one response though
        it("should get aggregates for different columns when there are too many aggregates for one request.", function(done) {
            var aggregateList = [
                // int aggs
                reference.columns[1].aggregate.countNotNullAgg("int_count_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[1].aggregate.countDistinctAgg("int_distinct_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[1].aggregate.minAgg("int_min_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[1].aggregate.maxAgg("int_max_agg_long_name_but_the_name_was_not_long_enough"),
                // float aggs
                reference.columns[2].aggregate.countNotNullAgg("float_count_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[2].aggregate.countDistinctAgg("float_distinct_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[2].aggregate.minAgg("float_min_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[2].aggregate.maxAgg("float_max_agg_long_name_but_the_name_was_not_long_enough"),
                // text aggs
                reference.columns[3].aggregate.countNotNullAgg("text_count_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[3].aggregate.countDistinctAgg("text_distinct_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[3].aggregate.minAgg("text_min_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[3].aggregate.maxAgg("text_max_agg_long_name_but_the_name_was_not_long_enough"),
                // date aggs
                reference.columns[4].aggregate.countNotNullAgg("date_count_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[4].aggregate.countDistinctAgg("date_distinct_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[4].aggregate.minAgg("date_min_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[4].aggregate.maxAgg("date_max_agg_long_name_but_the_name_was_not_long_enough"),
                // timestamp aggs
                reference.columns[5].aggregate.countNotNullAgg("t_stamp_count_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[5].aggregate.countDistinctAgg("t_stamp_distinct_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[5].aggregate.minAgg("t_stamp_min_agg_long_name_but_the_name_was_not_long_enough"),
                reference.columns[5].aggregate.maxAgg("t_stamp_max_agg_long_name_but_the_name_was_not_long_enough"),

                // repeated aggregates with a different alias because length is still not passed the limit
                // int aggs 2
                reference.columns[1].aggregate.countNotNullAgg("int_count_agg_long_name_again_to_increase_limit"),
                reference.columns[1].aggregate.countDistinctAgg("int_distinct_agg_long_name_again_to_increase_limit"),
                reference.columns[1].aggregate.minAgg("int_min_agg_long_name_again_to_increase_limit"),
                reference.columns[1].aggregate.maxAgg("int_max_agg_long_name_again_to_increase_limit"),
                // float aggs 2
                reference.columns[2].aggregate.countNotNullAgg("float_count_agg_long_name_again_to_increase_limit"),
                reference.columns[2].aggregate.countDistinctAgg("float_distinct_agg_long_name_again_to_increase_limit"),
                reference.columns[2].aggregate.minAgg("float_min_agg_long_name_again_to_increase_limit"),
                reference.columns[2].aggregate.maxAgg("float_max_agg_long_name_again_to_increase_limit"),
                // text aggs 2
                reference.columns[3].aggregate.countNotNullAgg("text_count_agg_long_name_again_to_increase_limit"),
                reference.columns[3].aggregate.countDistinctAgg("text_distinct_agg_long_name_again_to_increase_limit"),
                reference.columns[3].aggregate.minAgg("text_min_agg_long_name_again_to_increase_limit"),
                reference.columns[3].aggregate.maxAgg("text_max_agg_long_name_again_to_increase_limit")
            ];

            reference.getAggregates(aggregateList).then(function (response) {

                expect(response).toEqual(jasmine.any(Object));

                // int aggs
                expect(response.int_count_agg_long_name_but_the_name_was_not_long_enough).toBe(5, "Int count not null is incorrect");
                expect(response.int_distinct_agg_long_name_but_the_name_was_not_long_enough).toBe(4, "Int unique count is incorrect");
                expect(response.int_min_agg_long_name_but_the_name_was_not_long_enough).toBe(2, "Int min value is incorrect");
                expect(response.int_max_agg_long_name_but_the_name_was_not_long_enough).toBe(215, "Int max value is incorrect");
                // float aggs
                expect(response.float_count_agg_long_name_but_the_name_was_not_long_enough).toBe(4, "Float count not null is incorrect");
                expect(response.float_distinct_agg_long_name_but_the_name_was_not_long_enough).toBe(4, "Float unique count is incorrect");
                expect(response.float_min_agg_long_name_but_the_name_was_not_long_enough).toBe(0.4222, "Float min value is incorrect");
                expect(response.float_max_agg_long_name_but_the_name_was_not_long_enough).toBe(36.9201, "Float max value is incorrect");
                // text aggs
                expect(response.text_count_agg_long_name_but_the_name_was_not_long_enough).toBe(4, "Text count not null is incorrect");
                expect(response.text_distinct_agg_long_name_but_the_name_was_not_long_enough).toBe(3, "Text unique count is incorrect");
                expect(response.text_min_agg_long_name_but_the_name_was_not_long_enough).toBe("bread", "Text min value is incorrect");
                expect(response.text_max_agg_long_name_but_the_name_was_not_long_enough).toBe("sandwich", "Text max value is incorrect");
                // date aggs
                expect(response.date_count_agg_long_name_but_the_name_was_not_long_enough).toBe(3, "Date count not null is incorrect");
                expect(response.date_distinct_agg_long_name_but_the_name_was_not_long_enough).toBe(3, "Date unique count is incorrect");
                expect(response.date_min_agg_long_name_but_the_name_was_not_long_enough).toBe("2015-01-11", "Date min value is incorrect");
                expect(response.date_max_agg_long_name_but_the_name_was_not_long_enough).toBe("2017-07-17", "Date max value is incorrect");
                // timestamp aggs
                expect(response.t_stamp_count_agg_long_name_but_the_name_was_not_long_enough).toBe(5, "Timestamp count not null is incorrect");
                expect(response.t_stamp_distinct_agg_long_name_but_the_name_was_not_long_enough).toBe(5, "Timestamp unique count is incorrect");
                expect(response.t_stamp_min_agg_long_name_but_the_name_was_not_long_enough).toBe("2010-05-22T17:44:00", "Timestamp min value is incorrect");
                expect(response.t_stamp_max_agg_long_name_but_the_name_was_not_long_enough).toBe("2017-04-13T14:10:00", "Timestamp max value is incorrect");

                // repeated aggregates with a different alias
                expect(response.int_count_agg_long_name_again_to_increase_limit).toBe(5, "Int count not null 2 is incorrect");
                expect(response.int_distinct_agg_long_name_again_to_increase_limit).toBe(4, "Int unique count 2 is incorrect");
                expect(response.int_min_agg_long_name_again_to_increase_limit).toBe(2, "Int min value 2 is incorrect");
                expect(response.int_max_agg_long_name_again_to_increase_limit).toBe(215, "Int max value 2 is incorrect");
                // float aggs
                expect(response.float_count_agg_long_name_again_to_increase_limit).toBe(4, "Float count not null 2 is incorrect");
                expect(response.float_distinct_agg_long_name_again_to_increase_limit).toBe(4, "Float unique count 2 is incorrect");
                expect(response.float_min_agg_long_name_again_to_increase_limit).toBe(0.4222, "Float min value 2 is incorrect");
                expect(response.float_max_agg_long_name_again_to_increase_limit).toBe(36.9201, "Float max value 2 is incorrect");
                // text aggs
                expect(response.text_count_agg_long_name_again_to_increase_limit).toBe(4, "Text count not null 2 is incorrect");
                expect(response.text_distinct_agg_long_name_again_to_increase_limit).toBe(3, "Text unique count 2 is incorrect");
                expect(response.text_min_agg_long_name_again_to_increase_limit).toBe("bread", "Text min value 2 is incorrect");
                expect(response.text_max_agg_long_name_again_to_increase_limit).toBe("sandwich", "Text max value 2 is incorrect");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });
    });
}
