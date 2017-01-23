require('./../../utils/starter.spec.js').runTests({
    description: 'After introspection, ',
    testCases: [
        "/common/tests/01.foreignkey.js",
        "/common/tests/02.column.js",
        "/common/tests/03.table.js"
    ],
    schemaConfigurations: [
        "/common/conf/common_schema_2.conf.json", //this should come first since schema_1 has fk to it.
        "/common/conf/common_schema_1.conf.json",
    ]
});
