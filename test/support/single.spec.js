require('./../utils/starter.spec.js').runTests({
    description: 'In reference alternative tables, ',
    testCases: [
        "/reference/tests/07.alternative_tables.js"
    ],
    schemaConfigurations: [
        "/reference/conf/reference_altTables.conf.json"
    ]
});
