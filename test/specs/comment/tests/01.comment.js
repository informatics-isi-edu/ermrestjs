exports.execute = function (options) {

    describe('For checking the .comment on models, ', function () {
        var schemaName = "schema_with_comment", schema;

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            done();
        });

        // Test Cases:
        it('schema_with_comment should have a non-null .comment property.', function () {
            expect(schema.hasOwnProperty('comment')).toBe(true);
            expect(schema.comment).toBe("schema with a comment");
        });

        it('table_with_comment should have a non-null .comment property.', function () {
            var table = schema.tables.get('table_with_comment');
            expect(table.hasOwnProperty('comment')).toBe(true);
            expect(table.comment).toBe("table with a comment");
        });

        it('table_with_null_comment should have a null .comment property.', function () {
            var table = schema.tables.get('table_with_null_comment');
            expect(table.hasOwnProperty('comment')).toBe(true);
            expect(table.comment).toBe(null);
        });

        it('this key with a comment should have a non-null .comment property.', function () {
            var key = schema.tables.get('table_with_comment').keys.all()[0];
            expect(key.hasOwnProperty('comment')).toBe(true);
            expect(key.comment).toBe("key with a comment");
        });

        it('this key in table_with_comment should have a null .comment property.', function() {
            var key = schema.tables.get('table_with_null_comment').keys.all()[0];
            expect(key.hasOwnProperty('comment')).toBe(true);
            expect(key.comment).toBe(null);
        });

        it('this foreign key with a comment should have a non-null .comment property.', function () {
            var fkey = schema.tables.get('table_with_comment').foreignKeys.all()[0];
            expect(fkey.hasOwnProperty('comment')).toBe(true);
            expect(fkey.comment).toBe("foreign key with a comment");
        });

        it('this foreign key in table_with_null_comment should have a null .comment property.', function() {
            var fkey = schema.tables.get('table_with_null_comment').foreignKeys.all()[0];
            expect(fkey.hasOwnProperty('comment')).toBe(true);
            expect(fkey.comment).toBe(null);
        });
    });
};
