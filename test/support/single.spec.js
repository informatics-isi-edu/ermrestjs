require('./../utils/starter.spec.js').runTests({
    description: 'In single spec, ',
    testCases: [
        "/sample/tests/01.sample.js",
    ],
    schemaConfigurations: [
        "/sample/conf/product.conf.json"
    ]
});
