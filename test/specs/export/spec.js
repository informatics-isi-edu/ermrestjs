require('./../../utils/starter.spec.js').runTests({
    description: 'In export spec, ',
    testCases: [
        "/export/tests/01.export.js"
    ],
    schemaConfigurations: [
        "/export/conf/export.conf.json"
    ]
});
