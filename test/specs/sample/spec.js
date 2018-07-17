require('./../../utils/starter.spec.js').runTests({
    description: 'In sample spec, ',
    testCasesO: [
        "/sample/tests/01.sample.js"
    ],
    testCases: [
        "dummy.spec.js"
    ],
    schemaConfigurations: [
        "/sample/conf/product.conf.json"
    ]
});
