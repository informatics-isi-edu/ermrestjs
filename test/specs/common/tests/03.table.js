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
            // TODO should be deleted
            it("when table doesn't have any keys, should reutn all the columns.", function () {
                checkShortestKey("table_wo_key", ["col_1","col_2"]);
            });

            it("If table doesn't have any not-null key, should use shortest of other keys.", function () {
                checkShortestKey("table_wo_notnull_key", ["id"]);
                // TODO should be changed to this:
                // checkError("table_wo_notnull_key", "Table `table_wo_notnull_key` does not have any not-null key.");
            });

            it("should return the shortest key.", function () {
                checkShortestKey("table_w_dif_len_keys", ["col_3"]);
            });

            it('when keys have the same length, should return the one that is all integer/serial.', function () {
                checkShortestKey("multi_w_same_len_keys_w_all_serial", ["col_2", "col_3"]);
            });

            it("otherwise should sort keys based on their column names and return the first one.", function () {
                checkShortestKey("multi_w_same_len_keys", ["col_1", "col_2"]);
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
    });
};
