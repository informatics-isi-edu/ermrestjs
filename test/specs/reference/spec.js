require('./../../utils/starter.spec.js').runTests({
    description: 'In reference,',
    testCases: [
        "/reference/tests/01.reference.js",
        "/reference/tests/02.related_reference.js"
    ],
    schemaConfigurations: [
        "/reference/conf/reference.conf.json"
    ]
});
