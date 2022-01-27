require('./../../utils/starter.spec.js').runTests({
    description: 'In error spec, ',
    testCases: [
        "/errors/tests/01.catalog_error.js",
        "/errors/tests/02.schema_error.js",
        "/errors/tests/03.table_error.js",
        "/errors/tests/04.entity_error.js",
        "/errors/tests/05.http_retry_error.js",
        "/errors/tests/06.http_401_error.js",
        "/errors/tests/07.http_409_error.js",
        "/errors/tests/08.http_content_error.js",
        "/errors/tests/09.modifier_error.js",
        "/errors/tests/10.http_400_error.js"
    ],
    schemaConfigurations: [
        "/errors/conf/error.conf.json"
    ]
});
