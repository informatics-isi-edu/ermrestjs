/**
 * For testing comment and comment_display using the visible foreign keys annotation, fk annotation, and table annotation.
 * This spec is divided into 3 chunks for testing "simple inbound FK", "pure and binary FK", and "inbound multi hop foreign key"
 *
 * there are no catalog annotations in this spec
 *   the main difference with the other test spec/schema. in the other one catalog is turning of comment markdown,
 *   so the isHTML of that one is filpped from this one
 *
 *
 * The structure of the tables used for "simple inbound FK":
 * 1. comment_display_simple_fk_table <- table_w_simple_key_source_override
 * 2. comment_display_simple_fk_table <- table_w_simple_key_fk_comment
 * 3. comment_display_simple_fk_table <- table_w_simple_key_bad_annotation
 * 4. comment_display_simple_fk_table <- table_w_simple_key_leaf_annotation
 *
 * Visible-foreign-keys for "comment_display_simple_fk_table" match the order of the above tables/foreign keys relationships:
 * 1. simple_fk_1 with comment in source syntax (turns off markdown comment)
 * 2. simple_fk_2 with from_comment in FK annotation (turns on markdown comment)
 * 3. simple_fk_3 with from_comment_display and no from_comment in FK annotation (turns on markdown comment)
 * 4. simple_fk_4 with comment in display annotation on table (turns off markdown comment)
 *
 *
 * The structure of tables used for "pure and binary FKs":
 * 1. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display (turns off markdown comment)
 * 2. comment_display_pb_table <- tocomment_fk_association_to_inbound_related -> inbound_related_reference_table_no_display (turns on markdown comment)
 * 3. comment_display_pb_table <- association_table_fk_to_comment_display -> inbound_related_reference_table_no_display (turns on markdown comment)
 * 4. comment_display_pb_table <- association_table_leaf_comment -> inbound_related_reference_table (turns off markdown comment)
 *
 * The structure of tables used for "inbound multi hop foreign key":
 * 5. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table (turns off markdown comment)
 * 6. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_comment_display (turns on markdown comment)
 * 7. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_leaf_comment (turns off markdown comment)
 *
 * Visible-foreign-keys for "comment_display_pb_table" match the order of the above tables/foreign keys relationships:
 * 1. pb_source_comment with comment in source syntax
 * 2. pb_to_comment with to_comment in FK annotation
 * 3. pb_to_comment_display with to_comment_display and no to_comment in FK annotation
 * 4. pb_leaf_comment with comment in display annotation on table
 *
 * 5. multi_source_comment with comment in source syntax
 * 6. multi_comment_display with table_comment_display and no comment in display annotation on table
 * 7. multi_leaf_comment with comment in display annotation on table
 *
 */
exports.execute = function (options) {

    describe("comment annotations usage in related references,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "comment_display_related_schema",
            limit = 1;

        describe("for simple foreign key", function() {

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

            it("source syntax in visible foreign keys should be used first", () => {
                expect(simpleReference.related[0].comment).toEqual({
                    value: "simple fk source syntax comment",
                    unformatted: "simple fk source syntax comment",
                    isHTML: false,
                    displayMode: 'inline'
                });
            });

            it("next from_comment and from_comment_display should be used.", () => {
                expect(simpleReference.related[1].comment).toEqual({
                    value: "<p>simple fk from_comment comment</p>\n",
                    unformatted: "simple fk from_comment comment",
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

            it("by default the leaf table comment and comment_display should be used.", function () {
                expect(simpleReference.related[3].comment).toEqual({
                    value: 'simple fk leaf table display comment',
                    unformatted: 'simple fk leaf table display comment',
                    isHTML: false,
                    displayMode: 'inline'
                });
            });

            it ('if from_comment_display is defined but not the from_comment, leaf table comment and this proeprty should be mixed', () => {
                expect(simpleReference.related[2].comment).toEqual({
                    value: "<p>table with simple key to reference and a foreign key annotation with no from comment display</p>\n",
                    unformatted: "table with simple key to reference and a foreign key annotation with no from comment display",
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

        });

        describe("for pure and binary relation", function() {

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

            it("source syntax in visible-columns should be used first", () => {
                expect(pBReference.related[0].comment).toEqual({
                    value: "pure and binary fk source syntax comment",
                    unformatted: "pure and binary fk source syntax comment",
                    isHTML: false,
                    displayMode: 'inline'
                });
            });

            it("next to_comment and to_comment_display should be used.", () => {
                expect(pBReference.related[1].comment).toEqual({
                    value: "<p>pure and binary fk to_comment</p>\n",
                    unformatted: "pure and binary fk to_comment",
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

            it("next the leaf table comment and comment_display should be used.", function () {
                expect(pBReference.related[3].comment).toEqual({
                    value: 'pure and binary fk association table display comment',
                    unformatted: 'pure and binary fk association table display comment',
                    isHTML: false,
                    displayMode: 'inline'
                });
            });

            it ('if to_comment_display is defined but not the to_comment, leaf table comment and this proeprty should be mixed', () => {
                expect(pBReference.related[2].comment).toEqual({
                    value: "<p>has fk to comment_display_pb_table and inbound_related_reference_table. fk to inbound_related_reference_table has to_comment_display with no to_comment</p>\n",
                    unformatted: "has fk to comment_display_pb_table and inbound_related_reference_table. fk to inbound_related_reference_table has to_comment_display with no to_comment",
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

        });

        // tests for pseudocolumn functionality when used for a related table
        describe("for multi hop foreign key", function() {

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

            it("source syntax in visible-columns should be used first", () => {
                expect(multiHopReference.related[4].comment).toEqual({
                    isHTML: false,
                    unformatted: "multi hop fk source syntax comment",
                    value: "multi hop fk source syntax comment",
                    displayMode: 'inline'
                });
            });

            it("next use display annotation on leaf table", function () {
                expect(multiHopReference.related[6].comment).toEqual({
                    isHTML: true,
                    unformatted: "multi hop fk leaf table display comment",
                    value: "<p>multi hop fk leaf table display comment</p>\n",
                    displayMode: 'inline'
                });
            });

            it("next use comment on leaf table model while using comment_display and markdown of display annotation,", function () {
                expect(multiHopReference.related[5].comment).toEqual({
                    isHTML: false,
                    unformatted: "foreign key to association table with comment_display and no comment",
                    value: "foreign key to association table with comment_display and no comment",
                    displayMode: 'inline'
                });
            });

            it("next use comment on leaf table model and display annotation of catalog,", function () {
                expect(multiHopReference.related[7].comment).toEqual({
                    isHTML: true,
                    unformatted: "foreign key to association table with no leaf display",
                    value: "<p>foreign key to association table with no leaf display</p>\n",
                    displayMode: 'tooltip'
                });
            });
        });

    });

};
