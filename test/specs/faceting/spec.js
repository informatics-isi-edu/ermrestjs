require('./../../utils/starter.spec.js').runTests({
    description: 'In Faceting, ',
    testCases: [
        "/faceting/tests/01.faceting.js"
    ],
    schemaConfigurations: [
        "/faceting/conf/faceting.conf.json"
    ]
});
