require('./../../utils/starter.spec.js').runTests({
    description: 'For Colummn related APIs,',
    testCases: [
        "/column/tests/01.columns_list.js",
        "/column/tests/02.reference_column.js",
        "/column/tests/03.pseudo_column.js",
    ],
    schemaConfigurations: [
        "/column/conf/columns.conf.json",
        "/column/conf/pseudo_column.conf.json",
    ]
});
