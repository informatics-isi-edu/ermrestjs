require('./../../utils/starter.spec.js').runTests({
    description: 'In Attributegroup Reference, ',
    testCasesO: [
        "/ag_reference/tests/01.ag_reference.js"
    ],
    testCases: [
        "/dummy.spec.js"
    ],
    schemaConfigurations: [
        "/ag_reference/conf/agref_schema.conf.json"
    ]
});
