exports.execute = function (options) {

    describe('For determining order of visible foreign key, ', function () {
        var schemaName = "visible_foreign_keys_schema",
            tableWithAnnotation = "vfk_table_with_annotation",
            tableWithoutAnnotation = "vfk_table_without_annotation",
            schema;

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            done();
        });

        // Test Cases:
        // Helper function to add 'expect' based on test cases and the specified table
        function runTestCases(table, cases, check_order) {
            Object.keys(cases).forEach(function (context) {
                var fk_names = schema.tables.get(table).referredBy._contextualize(context).map( function(fk){
                    return fk.foreignKey.constraint_names[0][1]; // return the actual constraint_name
                });
                expect(fk_names).toHaveSameItems(cases[context], !check_order, "failed for context: " + context);
            });
        }

        // Test Cases:
        it('should use the defined order in anntoations based on its context.', function(){
            runTestCases(tableWithAnnotation, {
                "entry": [],
                "entry/edit": ["fk_inbound_to_with_annotation"],
                "*": []
            }, true);
        });

        it('should use `entry` context when context is `entry/edit` or `entry/create` and they are not present in annotation.', function () {
            runTestCases(tableWithAnnotation, {
                "entry/create": []
            }, true);
        });

        it('should use default (`*`) context for any context not matched by a more specific context name.', function () {
            runTestCases(tableWithAnnotation, {
                "filter": []
            }, true);
        });

        it('should ignore the constraint names that do not correspond to any inbound or outbound foreign key of the table.', function () {
            runTestCases(tableWithAnnotation, {
                "record": ["fk_inbound_to_with_annotation"]
            }, true);
        });

        it('should ignore repetitive constraint names and just consider the first one.', function () {
            runTestCases(tableWithAnnotation, {
                "compact": [
                    "fk_inbound_to_with_annotation"
                ]
            }, true);
        });

        it('should use the default order when context not matched by a more specific context name and default (`*`) context is not present.', function () {
            expect(schema.tables.get(tableWithoutAnnotation).referredBy._contextualize("filter")).toBe(-1);
        });


    });
};
