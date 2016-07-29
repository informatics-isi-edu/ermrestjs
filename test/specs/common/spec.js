require('./../../utils/starter.spec.js').runTests({
    description: 'After introspection, ',
    testCases: [
        "/common/tests/01.foreignkey.js",
    ],
    schemaConfigurations: [
        "/common/conf/schema_2.conf.json", //this should come first since schema_1 has fk to it.
        "/common/conf/schema_1.conf.json",
    ]
});
