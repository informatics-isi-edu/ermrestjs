require('./../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCasesO: [
        "/annotation/tests/01.displayname.js",
        "/annotation/tests/03.table_display.js",
        "/annotation/tests/04.visible_foreign_keys.js"
    ],
    testCases: [
        "dummy.spec.js"
    ],
    schemaConfigurations: [
        "/annotation/conf/displayname.conf.json",
        "/annotation/conf/table_display.conf.json",
        "/annotation/conf/visible_foreign_keys.json"
    ]
});
