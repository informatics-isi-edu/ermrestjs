/**
 * For testing comment and comment_display using the visible columns annotation, fk annotation, and table annotation.
 * This spec is divided into 3 chunks for testing "simple inbound FK", "pure and binary FK", and "inbound multi hop foreign key"
 *
 * The structure of the tables used for "simple inbound FK":
 * 1. comment_display_simple_fk_table <- table_w_simple_key_source_override
 * 2. comment_display_simple_fk_table <- table_w_simple_key_fk_comment
 * 3. comment_display_simple_fk_table <- table_w_simple_key_bad_annotation
 * 4. comment_display_simple_fk_table <- table_w_simple_key_leaf_annotation
 *
 * Visible-columns for "comment_display_simple_fk_table" match the order of the above tables/foreign keys relationships:
 * 1. simple_fk_1 with comment in source syntax
 * 2. simple_fk_2 with from_comment in FK annotation
 * 3. simple_fk_3 with from_comment_display and no from_comment in FK annotation
 * 4. simple_fk_4 with comment in display annotation on table
 *
 *
 * The structure of tables used for "pure and binary FKs":
 * 1. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display
 * 2. comment_display_pb_table <- tocomment_fk_association_to_inbound_related -> inbound_related_reference_table_no_display
 * 3. comment_display_pb_table <- association_table_fk_to_comment_display -> inbound_related_reference_table_no_display
 * 4. comment_display_pb_table <- association_table_leaf_comment -> inbound_related_reference_table
 *
 * The structure of tables used for "inbound multi hop foreign key":
 * 5. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table
 * 6. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_comment_display
 * 7. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_leaf_comment
 *
 * Visible-columns for "comment_display_pb_table" match the order of the above tables/foreign keys relationships:
 * 1. pb_source_comment with comment in source syntax
 * 2. pb_to_comment with to_comment in FK annotation
 * 3. pb_to_comment_display with to_comment_display and no to_comment in FK annotation
 * 4. pb_leaf_comment with comment in display annotation on table
 *
 * 5. multi_source_comment with comment in source syntax
 * 6. multi_comment_display with table_comment_display and no comment in display annotation on table
 * 7. multi_leaf_comment with comment in display annotation on table
 *
 **/
exports.execute = function (options) {

    describe("testing visible columns annotation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "comment_display_inline_schema",
            limit = 1;

        // simple "inbound" FK
        // main <- inbound leaf
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
                    expect(simpleReference.columns[0].comment).toBe("simple fk source syntax comment");
                });

                it("then the from_comment in foreign-key annotation", function () {
                    expect(simpleReference.columns[1].comment).toBe("simple fk from_comment comment");
                });

                it("next use display annotation on leaf table", function () {
                    expect(simpleReference.columns[3].comment).toBe("simple fk leaf table display comment");
                });
            });

            describe("for comment_display,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(simpleReference.columns[0].commentDisplay).toBe("inline");
                });

                it("then the from_comment_display property in foreign-key annotation if from_comment was defined", function () {
                    expect(simpleReference.columns[1].commentDisplay).toBe("inline");
                });

                it("ignore the from_comment_display property if from_comment is not defined", function () {
                    expect(simpleReference.columns[2].commentDisplay).toBe("tooltip");
                });

                it("next use display annotation on leaf table", function () {
                    expect(simpleReference.columns[3].commentDisplay).toBe("inline");
                });
            });
        });

        // pure and binary FK
        // main <- inbound association outbound -> leaf
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
                    expect(pBReference.columns[0].comment).toBe("pure and binary fk source syntax comment");
                });

                it("then the to_comment in foreign-key annotation", function () {
                    expect(pBReference.columns[1].comment).toBe("pure and binary fk to_comment");
                });

                it("next use display annotation on leaf table", function () {
                    expect(pBReference.columns[3].comment).toBe("pure and binary fk leaf table display comment");
                });
            });

            describe("for comment_display,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(pBReference.columns[0].commentDisplay).toBe("inline");
                });

                it("then the to_comment_display property in foreign-key annotation if to_comment was defined", function () {
                    expect(pBReference.columns[1].commentDisplay).toBe("inline");
                });

                it("ignore the to_comment_display property if to_comment is not defined", function () {
                    expect(pBReference.columns[2].commentDisplay).toBe("tooltip");
                });

                it("next use display annotation on leaf table", function () {
                    expect(pBReference.columns[3].commentDisplay).toBe("inline");
                });
            });
        });

        // tests for pseudocolumn functionality when used for a related table
        // inbound multi hop foreign key
        // main <- inbound association outbound -> leaf outbound -> leaf
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
                    expect(multiHopReference.columns[4].comment).toBe("multi hop fk source syntax comment");
                });

                it("next use display annotation on leaf table", function () {
                    expect(multiHopReference.columns[6].comment).toBe("multi hop fk leaf table display comment");
                });

                it("next use comment on leaf table,", function () {
                    expect(multiHopReference.columns[5].comment).toBe("foreign key to association table with comment_display and no comment");
                });
            });

            describe("for comment_display,", function () {
                it("source syntax in visible foreign keys should be used first", function () {
                    expect(multiHopReference.columns[4].commentDisplay).toBe("inline");
                });

                it("next use display annotation on leaf table", function () {
                    expect(multiHopReference.columns[5].commentDisplay).toBe("inline", "missmatch for index=5");
                    expect(multiHopReference.columns[6].commentDisplay).toBe("inline", "missmatch for index=6");
                });

            });
        });

    });

};
