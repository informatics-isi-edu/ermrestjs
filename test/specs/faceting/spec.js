require('./../../utils/starter.spec.js').runTests({
    description: 'In Faceting, ',
    testCasesO: [
        "/faceting/tests/01.faceting.js"
    ],
    testCases: [
        "/dummy.spec.js"
    ],
    schemaConfigurations: [
        "/faceting/conf/faceting.conf.json"
    ]
});
