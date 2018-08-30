require('./../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/annotation/tests/01.displayname.js",
        "/annotation/tests/03.table_display.js",
        "/annotation/tests/04.visible_foreign_keys.js",
        "/annotation/tests/05.citation.js"
    ],
    schemaConfigurations: [
        "/annotation/conf/displayname.conf.json",
        "/annotation/conf/table_display.conf.json",
        "/annotation/conf/visible_foreign_keys.json",
        "/annotation/conf/citation.conf.json"
    ]
});
