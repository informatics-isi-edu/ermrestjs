require('./../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/annotation/tests/05.citation.js",
        "/annotation/tests/08.google_metadata.js"
    ],
    schemaConfigurations: [
        "/annotation/conf/citation.conf.json",
        "/annotation/conf/google_metadata.conf.json"
    ]
});
