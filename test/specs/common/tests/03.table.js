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
        });

        describe("Display key, ", function () {
            it ('should return the shortest key.', function () {
                checkDisplayKey("table_w_dif_len_keys", ["col_3"]);
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
