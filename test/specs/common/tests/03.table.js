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
            it("should return RID as the shortest key.", function () {
                checkShortestKey("table_w_rid_key", ["RID"]);
            });

            it("should return the shortest key.", function () {
                checkShortestKey("table_w_dif_len_keys", ["col_3"]);
            });

            it('when keys have the same length, should return the one that is all integer/serial.', function () {
                checkShortestKey("multi_w_same_len_keys_w_all_serial", ["col_2", "col_3"]);
            });

            // position of columns: col_1: 2 col_2: 1 col_3: 0
            // I named them this way to make sure we're actually going by position and not the column name
            it("otherwise should return the key that its constituent columns have smaller index.", function () {
                checkShortestKey("multi_w_same_len_keys", ["col_2", "col_3"]);
            });
        });

        describe("Display key, ", function () {
            it ('should return the shortest key.', function () {
                checkDisplayKey("table_w_dif_len_keys", ["col_3"]);
            });

            // col_1 is text therefore is going to be chosen.
            it ("when keys have the same length, should return the one that has more text columns.", function () {
                checkDisplayKey("multi_w_same_len_keys_w_all_serial", ["col_1", "col_2"]);
            });

            // position of columns: col_1: 2 col_2: 1 col_3: 0
            // I named them this way to make sure we're actually going by position and not the column name
            it("otherwise should return the key that its constituent columns have smaller index", function () {
                checkDisplayKey("multi_w_same_len_keys", ["col_2", "col_3"]);
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
    });
};
