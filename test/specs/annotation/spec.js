require('./../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/annotation/tests/01.displayname.js",
        '/annotation/tests/02.visible_columns.js'
    ],
    schemaConfigurations: [
        "/annotation/displayname.conf.json",
        "/annotation/visible_columns.conf.json"
    ]
});