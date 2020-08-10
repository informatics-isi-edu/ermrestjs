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

        describe("table, ", function () {
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

            it('table_w_display_comment should use the display comment.', function () {
                var table = schema.tables.get('table_w_display_comment');
                expect(table.comment).toBe("");
                // comment should be the same when fetched with getDisplay function
                expect(table.getDisplay("detailed").comment).toBe("", "comment from getDisplay is incorrect");
                // should use the default comment display value
                expect(table.getDisplay("detailed").columnCommentDisplay).toBe("tooltip", "default column comment display is incorrect");
                expect(table.getDisplay("detailed").tableCommentDisplay).toBe("tooltip", "default table comment display is incorrect");
            });

            it('table_w_contextualized_display_comment should use the contextualized display comment.', function () {
                var table = schema.tables.get('table_w_contextualized_display_comment');
                var annotationComment = "detailed comment";
                // comment will be from the table not the annotation
                expect(table.comment).not.toBe(annotationComment, "table comment is the same as annotaiton comment");
                // should use the default values since this context is not defined
                expect(table.getDisplay("*").columnCommentDisplay).toBe("tooltip", "* context, column comment display is incorrect");
                expect(table.getDisplay("*").tableCommentDisplay).toBe("tooltip", "* context, table comment display is incorrect");

                expect(table.getDisplay("detailed").comment).toBe(annotationComment, "detailed context, comment is incorrect");
                // should use the comment display values from annotation
                expect(table.getDisplay("detailed").columnCommentDisplay).toBe("tooltip", "detailed context, column comment display is incorrect");
                expect(table.getDisplay("detailed").tableCommentDisplay).toBe("inline", "detailed context, table comment display is incorrect");
            });
        });

        describe("column, ", function () {
            it('column_with_display_comment should have a non-null .comment property.', function () {
                var column = schema.tables.get('table_with_comment').columns.get("column_with_display_comment");
                expect(column.comment).toBe("display comment");
            });

            it('column_with_null_display_comment should use the model .comment property.', function () {
                var column = schema.tables.get('table_with_comment').columns.get("column_with_null_display_comment");
                expect(column.comment).toBe("column with a comment");
            });

            it('column_with_empty_display_comment should have an empty .comment property.', function () {
                var column = schema.tables.get('table_with_comment').columns.get("column_with_empty_display_comment");
                expect(column.comment).toBe("");
            });
        });


        //TODO Update this testcase for changes in system columns
        xit('this key with a comment should have a non-null .comment property.', function () {
            var key = schema.tables.get('table_with_comment').keys.all()[0];
            expect(key.hasOwnProperty('comment')).toBe(true);
            expect(key.comment).toBe("key with a comment");
        });

        it('this key in table_with_comment should have a null .comment property.', function() {
            var key = schema.tables.get('table_with_null_comment').keys.all()[0];
            expect(key.hasOwnProperty('comment')).toBe(true);
            expect(key.comment).toBe(null);
        });

        it('there should be 1 foreign key with a non-null .comment property and 1 foreign key with a null .comment property.', function () {
            var fkeys = schema.tables.get('table_with_comment').foreignKeys.all();
            var fkeysWithSpecifiedComment = 0;
            var fkeysWithNullComment = 0;
            for (var i = 0; i < fkeys.length; i++) {
                if (fkeys[i].comment === null) {
                    fkeysWithNullComment++;
                } else if (fkeys[i].comment === "foreign key with a comment") {
                    fkeysWithSpecifiedComment++;
                }
            }
            expect(fkeysWithNullComment).toBe(1);
            expect(fkeysWithSpecifiedComment).toBe(1);
        });
    });
};
