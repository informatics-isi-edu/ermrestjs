require('./../../utils/starter.spec.js').runTests({
    description: 'In sample spec, ',
    testCases: [
        "/errors/tests/01.not_found_error_404.js",
    ],
    schemaConfigurations: [
        "/annotation/conf/visible_columns.conf.json"
    ]
});
