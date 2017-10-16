require('./../../utils/starter.spec.js').runTests({
    description: 'In Attributegroup Reference, ',
    testCases: [
        "/ag_reference/tests/01.ag_reference.js"
    ],
    schemaConfigurations: [
        "/ag_reference/conf/agref_schema.conf.json"
    ]
});
