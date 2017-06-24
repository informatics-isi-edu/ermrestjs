require('./../../utils/starter.spec.js').runTests({
    description: 'In upload spec, ',
    testCases: [
        "/upload/tests/01.checksum.js",
        "/upload/tests/02.upload_obj.js",
        "/upload/tests/03.update_w_upload.js",
        "/upload/tests/04.create_w_upload.js"
    ],
    schemaConfigurations: [
        "/upload/conf/upload.conf.json"
    ]
});
