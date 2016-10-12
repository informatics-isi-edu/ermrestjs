exports.execute = function(options) {

    describe('About the Table class, ', function() {
        var schemaName2 = 'common_schema_2', multi_key_table;

        beforeAll(function(done) {
            multi_key_table = options.catalog.schemas.get(schemaName2).tables.get('multi_key_table');
            done();
        });

        // Test Cases:
        describe('Table class, ', function() {

            it('Shortest key', function(){
                expect(multi_key_table.shortestKey.length).toBe(1);
                expect(multi_key_table.shortestKey[0].name).toBe("id");
            });
        });
    });
};
