exports.execute = function (options) {

    describe("For updating reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = update_schema,
            tableName = update_table;

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

        describe("for updating ", function () {

            describe("a single entity should return a Page object, when ", function () {

                /* A single column is modified */
                it("modifying an independent key.", function () {

                });

                it("modifying a composite key.", function () {

                });

                it("modifying a non-key value.", function () {

                });

                /* Multiple columns modified */
                describe("multiple columns are modified. ", function () {

                    it("Columns are non-key values.", function () {

                    });

                    it("One column is a non-key value and one is part of a composite key.", function () {

                    });

                    it("One column is a non-key value and one is an independent key.", function () {

                    });

                    describe("2 key columns modified, ", function () {

                        it("both independent keys.", function () {

                        });

                        it("both part of composite keys.", function () {

                        });

                        it("one independent key and one part of a composite key.", function () {

                        });
                    });

                    describe("3 key columns modified, ", function () {

                        it("all part of composite keys.", function () {

                        });

                        it("one independent key and two part of composite keys.", function () {

                        });

                        it("two independent keys and one part of a composite key.", function () {

                        });
                    });

                    describe("3 columns modified, one non-key value", function () {

                        it(" and two part of composite keys.", function () {

                        });

                        it(", one part of a composite key, and one independent key.", function () {

                        });

                        it(" and two independent keys.", function () {

                        });
                    });
                });

            });

            describe("multiple entities, ", function () {

            });
        });
    });
};
