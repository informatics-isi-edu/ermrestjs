exports.execute = function (options) {

    describe("testing visible columns annotation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "comment_display_inline_schema",
            limit = 1;

        describe("testing comment and comment_display for simple foreign key", function() {

            var tableSimpleFKName = "comment_display_simple_fk_table";

            var commentSimpleFKUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tableSimpleFKName + "/id=1";

            var simpleReference, page, tuples;

            beforeAll(function(done) {

                // Fetch the entities beforehand
                options.ermRest.resolve(commentSimpleFKUri, {cid: "test"}).then(function (response) {
                    simpleReference = response.contextualize.detailed;
                    expect(simpleReference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                }).catch(function(err) {
                    console.dir(err);
                    done.fail();
                });

            });

            describe("for comment,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(simpleReference.columns[0].reference.comment).toBe("simple fk source syntax comment");
                });

                it("then the from_comment in foreign-key annotation", function () {
                    expect(simpleReference.columns[1].reference.comment).toBe("simple fk from_comment comment");
                });

                it("next use display annotation on leaf table", function () {
                    expect(simpleReference.columns[3].reference.comment).toBe("simple fk leaf table display comment");
                });
            });

            describe("for comment_display,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(simpleReference.columns[0].reference.commentDisplay).toBe("inline");
                });

                it("then the from_comment_display property in foreign-key annotation if from_comment was defined", function () {
                    expect(simpleReference.columns[1].reference.commentDisplay).toBe("inline");
                });

                it("ignore the from_comment_display property if from_comment is not defined", function () {
                    expect(simpleReference.columns[2].reference.commentDisplay).toBe("tooltip");
                });

                it("next use display annotation on leaf table", function () {
                    expect(simpleReference.columns[3].reference.commentDisplay).toBe("inline");
                });
            });
        });

        describe("testing comment and comment_display for pure and binary relation", function() {

            var tablePBName = "comment_display_pb_table";

            var commentPBUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tablePBName + "/id=1";

            var pBReference, page, tuples;

            beforeAll(function(done) {

                // Fetch the entities beforehand
                options.ermRest.resolve(commentPBUri, {cid: "test"}).then(function (response) {
                    pBReference = response.contextualize.detailed;
                    expect(pBReference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                }).catch(function(err) {
                    console.dir(err);
                    done.fail();
                });

            });

            describe("for comment,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(pBReference.columns[0].reference.comment).toBe("pure and binary fk source syntax comment");
                });

                it("then the to_comment in foreign-key annotation", function () {
                    expect(pBReference.columns[1].reference.comment).toBe("pure and binary fk to_comment");
                });

                it("next use display annotation on leaf table", function () {
                    expect(pBReference.columns[3].reference.comment).toBe("pure and binary fk leaf table display comment");
                });
            });

            describe("for comment_display,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(pBReference.columns[0].reference.commentDisplay).toBe("inline");
                });

                it("then the to_comment_display property in foreign-key annotation if to_comment was defined", function () {
                    expect(pBReference.columns[1].reference.commentDisplay).toBe("inline");
                });

                it("ignore the to_comment_display property if to_comment is not defined", function () {
                    expect(pBReference.columns[2].reference.commentDisplay).toBe("tooltip");
                });

                it("next use display annotation on leaf table", function () {
                    expect(pBReference.columns[3].reference.commentDisplay).toBe("inline");
                });
            });
        });

        // tests for pseudocolumn functionality when used for a related table
        describe("testing comment and comment_display for multi hop foreign key", function() {

            var tablePBName = "comment_display_pb_table";

            var commentPBUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
                + tablePBName + "/id=1";

            var multiHopReference, page, tuples;

            beforeAll(function(done) {

                // Fetch the entities beforehand
                options.ermRest.resolve(commentPBUri, {cid: "test"}).then(function (response) {
                    multiHopReference = response.contextualize.detailed;
                    expect(multiHopReference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                }).catch(function(err) {
                    console.dir(err);
                    done.fail();
                });

            });

            describe("for comment,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(multiHopReference.columns[4].reference.comment).toBe("multi hop fk source syntax comment");
                });

                it("next use display annotation on leaf table", function () {
                    expect(multiHopReference.columns[6].reference.comment).toBe("multi hop fk leaf table display comment");
                });
            });

            describe("for comment_display,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(multiHopReference.columns[4].reference.commentDisplay).toBe("inline");
                });

                it("ignore the comment_display property if comment is not defined", function () {
                    expect(multiHopReference.columns[5].reference.commentDisplay).toBe("tooltip");
                });

                it("next use display annotation on leaf table", function () {
                    expect(multiHopReference.columns[6].reference.commentDisplay).toBe("inline");
                });
            });
        });

    });

};
