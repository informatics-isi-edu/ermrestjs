exports.execute = function (options) {

    describe('For checking the .comment on models, ', function () {
        var schemaName = "schema_with_comment", schema;

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            done();
        });

        // Test Cases:
        it('schema_with_comment should have a non-null .comment property.', function () {
            expect(schema.comment).toBe("schema with a comment");
        });

        it('table_with_comment should have a non-null .comment property.', function () {
            expect(schema.tables.get('table_with_comment').comment).toBe("table with a comment");
        });

        it('this key with a comment should have a non-null .comment property.', function () {
            var key = schema.tables.get('table_with_comment').keys.all()[0];
            expect(key.comment).toBe("key with a comment");
        });

        it('this foreign key with a comment should have a non-null .comment property.', function () {
            var fkey = schema.tables.get('table_with_comment').foreignKeys.all()[0];
            expect(fkey.comment).toBe("foreign key with a comment");
        });
    });
};
