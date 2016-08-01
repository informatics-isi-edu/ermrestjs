require('./../../utils/starter.spec.js').runTests({
    description: 'In error spec, ',
    testCases: [
         "/errors/tests/01.catalog_error.js",
        "/errors/tests/02.schema_error.js",
        "/errors/tests/03.table_error.js",
    ],
    schemaConfigurations: [
        "/errors/conf/error.conf.json"
    ]
});
