require('./../../utils/starter.spec.js').runTests({
    description: 'In Faceting, ',
    testCases: [
        "/faceting/tests/01.faceting.js",
        "/faceting/tests/02.fast_filter.js",
        "/faceting/tests/03.facet_group.js",
    ],
    schemaConfigurations: [
        "/faceting/conf/faceting.conf.json",
        "/faceting/conf/fast_filter.conf.json",
        "/faceting/conf/facet_group.conf.json",
    ]
});
