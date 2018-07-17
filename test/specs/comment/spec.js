require('./../../utils/starter.spec.js').runTests({
    description: 'In comment spec, ',
    testCasesO: [
        "/comment/tests/01.comment.js"
    ],
    testCases: [
        "dummy.spec.js"
    ],
    schemaConfigurations: [
        "/comment/conf/comment.conf.json"
    ]
});
