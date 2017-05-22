require('./../../utils/starter.spec.js').runTests({
    description: 'In upload spec, ',
    testCases: [
        "/upload/tests/01.checksum.js",
        "/upload/tests/02.upload_process.js"
    ],
    schemaConfigurations: [
        "/upload/conf/upload.conf.json"
    ]
});
