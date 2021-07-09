require('./../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/annotation/tests/01.displayname.js",
        "/annotation/tests/03.table_display.js",
        "/annotation/tests/04.visible_foreign_keys.js",
        "/annotation/tests/05.citation.js",
        "/annotation/tests/06.catalog.js",
        "/annotation/tests/07.source_definitions.js",
        "/annotation/tests/08.google_metadata.js"
    ],
    schemaConfigurations: [
        "/annotation/conf/displayname.conf.json",
        "/annotation/conf/table_display.conf.json",
        "/annotation/conf/visible_foreign_keys.json",
        "/annotation/conf/citation.conf.json",
        "/annotation/conf/catalog.conf.json",
        "/annotation/conf/source_definitions.conf.json",
        "/annotation/conf/google_metadata.conf.json"
    ]
});
