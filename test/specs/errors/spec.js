require('./../../utils/starter.spec.js').runTests({
    description: 'In error spec, ',
    testCases: [
        "/errors/tests/01.not_found_error_404.js",
    ],
    schemaConfigurations: [
        "/errors/conf/error.conf.json"
    ]
});
