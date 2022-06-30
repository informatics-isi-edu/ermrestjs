exports.execute = function(options) {

    describe('Table class, ', function() {
        var schemaName = 'common_schema_2';
        var tables;

         beforeAll(function (done) {
            tables = options.catalog.schemas.get(schemaName).tables;
            done();
        });

        // Test Cases:
        describe('Shortest key, ', function () {
            //NOTE shortest key will always be RID

            it("should return RID as the shortest key.", function () {
                checkShortestKey("table_w_rid_key", ["RID"]);
            });

            it("should return the shortest key.", function () {
                checkShortestKey("table_w_dif_len_keys", ["RID"]);
            });
        });

        describe("Display key, ", function () {
            it ('should return the proper key.', function () {
                checkDisplayKey("table_w_dif_len_keys", ["col_3"]);
            });

            // the existing nullable_col should be ignored and RID should be used instead.
            it ("should ignore the nullable keys.", function () {
                checkDisplayKey("table_w_nullable_key", ["RID"]);
            });
        });


        describe("supportHistory", function () {
            it ("if annotation is missing, should return true", function () {
                checkSupportHistory("table_wo_history_capture", true);
            });

            it ("if annotation is defined and true, should return true", function () {
                checkSupportHistory("table_w_history_capture_true", true);
            });

            it ("if annotation is defined and false, should return false", function () {
                checkSupportHistory("table_w_history_capture_false", false);
            });
        });


        // Helper Functions:

        function checkError(tableName, errorMessage) {
            expect(function () {
                var sk = tables.get(tableName).shortestKey;
            }).toThrow(errorMessage);
        }

        function checkShortestKey(tableName, expectedCols) {
            expect(tables.get(tableName).shortestKey.map(function (col) {
                return col.name;
            })).toEqual(expectedCols);
        }

        function checkDisplayKey(tableName, expectedCols) {
            expect(tables.get(tableName).displayKey.map(function (col) {
                return col.name;
            })).toEqual(expectedCols);
        }

        function checkSupportHistory (tableName, expectedVal) {
            expect(tables.get(tableName).supportHistory).toBe(expectedVal);
        }
    });
};
