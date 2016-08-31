require('./../utils/starter.spec.js').runTests({
    description: 'In reference,',
    testCases: [
         "/reference/tests/06.permissions.js"
    ],
    schemaConfigurations: [
        "/reference/conf/reference.conf.json"
    ]
});
