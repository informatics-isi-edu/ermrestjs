require('./../utils/starter.spec.js').runTests({
    description: 'In reference,',
    testCases: [
         "/reference/tests/04.reference_values.js"
    ],
    schemaConfigurations: [
        "/reference/conf/reference.conf.json"
    ]
});
