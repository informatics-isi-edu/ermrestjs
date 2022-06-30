require('../../utils/starter.spec.js').runTests({
    description: 'In annotations, ',
    testCases: [
        "/json_ld/tests/01.reference_google_dataset.js",
        "/json_ld/tests/02.json_ld_validator.js"
    ],
    schemaConfigurations: [
        "/json_ld/conf/google_metadata.conf"
    ]
});
