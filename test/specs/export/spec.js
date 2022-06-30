require('./../../utils/starter.spec.js').runTests({
    description: 'In export spec, ',
    testCases: [
        "/export/tests/01.export.js"
    ],
    schemaConfigurations: [
        "/export/conf/export_table_annot_schema.conf.json",
        "/export/conf/export_schema_annot_schema.conf.json"
    ]
});
