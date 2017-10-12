require('./../../utils/starter.spec.js').runTests({
    description: 'In Attributegroup Reference,',
    testCases: [
        "/reference/tests/01.ag_reference.js",
    ],
    schemaConfigurations: [
        "/reference/conf/agref_schema.conf.json",
    ]
});
