require('./../../utils/starter.spec.js').runTests({
    description: 'For Colummn related APIs,',
    testCases: [
        "/column/tests/01.columns_list.js",
        "/column/tests/02.reference_column.js",
        "/column/tests/03.pseudo_column.js",
        "/column/tests/04.pseudo_column_display_self.js",
        "/column/tests/05.active_list.js",
        "/column/tests/06.iframe_input.js",
        "/column/tests/07.file_preview.ts"
    ],
    schemaConfigurations: [
        "/column/conf/columns.conf.json",
        "/column/conf/pseudo_column.conf.json",
        "/column/conf/pseudo_column_display_self.conf.json",
        "/column/conf/active_list.conf.json",
        "/column/conf/file_preview.conf.json"
    ]
});
