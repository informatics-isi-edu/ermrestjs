require('./../utils/starter.spec.js').runTests({
    description: 'In sample spec, ',
    testCases: [
        "/errors/tests/05.http_retry_error.js"
    ],
    schemaConfigurations: [
        "/errors/conf/error.conf.json"
    ]
});
