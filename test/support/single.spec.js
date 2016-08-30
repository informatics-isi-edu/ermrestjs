require('./../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/annotation/tests/03.table_display.js"
    ],
    schemaConfigurations: [
        "/annotation/conf/table_display.conf.json"
    ]
});
