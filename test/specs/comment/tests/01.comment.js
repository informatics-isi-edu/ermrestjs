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
            expect(schema.comment.unformatted).toBe("schema with a comment");
        });

        describe("table, ", function () {
            it('table_with_comment should have a non-null .comment property.', function () {
                var table = schema.tables.get('table_with_comment');
                expect(table.hasOwnProperty('comment')).toBe(true);
                expect(table.comment.unformatted).toBe("table with a comment");
            });

            it('table_with_null_comment should have a null .comment property.', function () {
                var table = schema.tables.get('table_with_null_comment');
                expect(table.hasOwnProperty('comment')).toBe(true);
                expect(table.comment).toBe(null);
            });

            it('table_w_display_comment should use the display comment.', function () {
                var table = schema.tables.get('table_w_display_comment');
                const expectedComment = {
                    isHTML: true,
                    value: '',
                    unformatted: '',
                    displayMode: 'tooltip'
                };
                // comment should be the same when fetched with getDisplay function
                expect(table.getDisplay("detailed").comment).toEqual(expectedComment, "comment from getDisplay is incorrect");
                // should use the default comment display value
                expect(table.getDisplay("detailed").columnCommentDisplayMode).toBe('tooltip', "default column comment display is incorrect");
                expect(table.getDisplay("detailed").tableCommentDisplayMode).toBe('tooltip', "default table comment display is incorrect");
            });

            it('table_w_contextualized_display_comment should use the contextualized display comment.', function () {
                var table = schema.tables.get('table_w_contextualized_display_comment');
                // should use the default values since this context is not defined
                expect(table.getDisplay("*").columnCommentDisplayMode).toBe('tooltip', "* context, column comment display is incorrect");
                expect(table.getDisplay("*").tableCommentDisplayMode).toBe('tooltip', "* context, table comment display is incorrect");

                expect(table.getDisplay("detailed").comment).toEqual({
                    isHTML: true,
                    value: '<p>detailed comment</p>\n',
                    unformatted: 'detailed comment',
                    displayMode: 'inline'
                }, 'detailed context, comment is incorrect');
                // should use the comment display values from annotation
                expect(table.getDisplay("detailed").columnCommentDisplayMode).toBe('tooltip', "detailed context, column comment display is incorrect");
                expect(table.getDisplay("detailed").tableCommentDisplayMode).toBe("inline", "detailed context, table comment display is incorrect");
            });
        });

        describe("column, ", function () {
            it('column_with_display_comment should have a non-null .comment property.', function () {
                var column = schema.tables.get('table_with_comment').columns.get("column_with_display_comment");
                expect(column.getDisplay("*").comment).toEqual({
                    isHTML: true,
                    value: '<p>display comment</p>\n',
                    unformatted: 'display comment',
                    displayMode: 'tooltip'
                });
            });

            it('column_with_null_display_comment should use the model .comment property.', function () {
                var column = schema.tables.get('table_with_comment').columns.get("column_with_null_display_comment");
                expect(column.getDisplay("*").comment).toEqual({
                    isHTML: true,
                    value: '<p>column with a comment</p>\n',
                    unformatted: 'column with a comment',
                    displayMode: 'tooltip'
                });
            });

            it('column_with_empty_display_comment should have an empty .comment property.', function () {
                var column = schema.tables.get('table_with_comment').columns.get("column_with_empty_display_comment");
                expect(column.getDisplay("*").comment).toEqual({
                    isHTML: true,
                    value: '',
                    unformatted: '',
                    displayMode: 'tooltip'
                });
            });
        });


        //TODO Update this testcase for changes in system columns
        xit('this key with a comment should have a non-null .comment property.', function () {
            var key = schema.tables.get('table_with_comment').keys.all()[0];
            expect(key.hasOwnProperty('comment')).toBe(true);
            expect(key.comment).toEqual({
                isHTML: true,
                value: '<p>key with a comment</p>\n',
                unformatted: 'key with a comment',
                displayMode: 'tooltip'
            });
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
                } else if (fkeys[i].comment.unformatted === "foreign key with a comment") {
                    fkeysWithSpecifiedComment++;
                }
            }
            expect(fkeysWithNullComment).toBe(1);
            expect(fkeysWithSpecifiedComment).toBe(1);
        });
    });
};
