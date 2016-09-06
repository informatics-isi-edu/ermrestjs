require('./../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/annotation/tests/01.displayname.js",
        "/annotation/tests/03.table_display.js"
    ],
    schemaConfigurations: [
        "/annotation/conf/displayname.conf.json",
        "/annotation/conf/table_display.conf.json"
    ]
});
