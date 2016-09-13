require('./../utils/starter.spec.js').runTests({
    description: 'In reference,',
    testCases: [
        "/reference/tests/01.reference_values.js"
    ],
    schemaConfigurations: [
        "/reference/conf/reference.conf.json",
        "/reference/conf/reference_2.conf.json"
    ]
});
