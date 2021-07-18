require('./../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/json-ld/tests/01.reference-google-dataset.js",
        "/json-ld/tests/02.json-ld-validator.js"
    ],
    schemaConfigurations: [
        "/json-ld/conf/google-metadata.conf"
    ]
});
