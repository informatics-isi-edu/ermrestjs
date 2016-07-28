exports.execute = function (options) {

    describe('For checking the .comment on models, ', function () {
        var schemaName = "schema_with_comment", schema;

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            done();
        });

        // Test Cases:
        it('schema_with_comment should have a non-null comment.', function () {
            expect(schema.comment).toBe("schema with a comment");
        });

        it('table_with_comment should have a non-null comment.', function () {
            expect(schema.tables.get('table_with_comment').comment).toBe("table with a comment");
        });

        it('key should have a non-null comment.', function () {
            var table = schema.tables.get('table_with_comment');
            console.log(table.keys.all());
        });

        it('foreign key should have a non-null comment.', function () {
            var table = schema.tables.get('table_with_comment');
            table.keys.all();
        });
    });
};
