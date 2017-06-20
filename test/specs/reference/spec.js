require('./../../utils/starter.spec.js').runTests({
    description: 'In reference,',
    testCases: [
        "/reference/tests/01.reference.js",
        "/reference/tests/02.related_reference.js",
        "/reference/tests/03.reference_sort.js",
        "/reference/tests/04.paging.js",
        "/reference/tests/05.reference_values.js",
        "/reference/tests/06.permissions.js",
        "/reference/tests/07.contextualize.js",
        "/reference/tests/08.alternative_tables.js",
        "/reference/tests/09.app_linking.js",
        "/reference/tests/10.update.js",
        "/reference/tests/11.delete.js",
        "/reference/tests/12.reference_values_edit.js",
        "/reference/tests/13.search.js",
        "/reference/tests/14.pseudo_columns.js",
        "/reference/tests/15.reference_column.js",
        "/reference/tests/16.default_value.js"

    ],
    schemaConfigurations: [
        "/reference/conf/generated.conf.json",
        "/reference/conf/generated_table.conf.json",
        "/reference/conf/immutable.conf.json",
        "/reference/conf/nondeletable.conf.json",
        "/reference/conf/reference.conf.json",
        "/reference/conf/reference_2.conf.json",
        "/reference/conf/reference_altTables.conf.json",
        "/reference/conf/update.conf.json",
        "/reference/conf/delete.conf.json",
        "/reference/conf/default_value.conf.json"
    ]
});
