const utils = require("../../../utils/utilities.js");

/**
 * For testing comment and comment_display using the visible columns annotation, fk annotation, and table annotation.
 * This spec is divided into 3 chunks for testing "simple inbound FK", "pure and binary FK", and "inbound multi hop foreign key"
 *
 * there is a catalog annotstion that turns off markdown comments.
 *
 * The structure of the tables used for "simple inbound FK":
 * 1. comment_display_simple_fk_table <- table_w_simple_key_source_override
 * 2. comment_display_simple_fk_table <- table_w_simple_key_fk_comment
 * 3. comment_display_simple_fk_table <- table_w_simple_key_bad_annotation
 * 4. comment_display_simple_fk_table <- table_w_simple_key_leaf_annotation
 *
 * Visible-columns for "comment_display_simple_fk_table" match the order of the above tables/foreign keys relationships:
 * 1. simple_fk_1 with comment in source syntax (turns on markdown comment)
 * 2. simple_fk_2 with from_comment in FK annotation (turns off markdown comment)
 * 3. simple_fk_3 with from_comment_display and no from_comment in FK annotation (turns off markdown comment)
 * 4. simple_fk_4 with comment in display annotation on table (turns on markdown comment)
 *
 *
 * The structure of tables used for "pure and binary FKs":
 * 1. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display (turns on markdown comment)
 * 2. comment_display_pb_table <- tocomment_fk_association_to_inbound_related -> inbound_related_reference_table_no_display (turns off markdown comment)
 * 3. comment_display_pb_table <- association_table_fk_to_comment_display -> inbound_related_reference_table_no_display (turns off markdown comment)
 * 4. comment_display_pb_table <- association_table_leaf_comment -> inbound_related_reference_table (turns on markdown comment)
 *
 * The structure of tables used for "inbound multi hop foreign key":
 * 5. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table (turns on markdown comment)
 * 6. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_comment_display (turns off markdown comment)
 * 7. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_leaf_comment (turns on markdown comment)
 * 8. comment_display_pb_table <- association_table -> inbound_related_reference_table_no_display -> multi_hop_related_reference_table_no_leaf_display (turns off markdown comment)
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

    describe("comment annotations usage in visible columns,", () => {

        const catalog_id = process.env.DEFAULT_CATALOG, schemaName = "comment_display_inline_schema";

        beforeAll((done) => {
            // changing the default behaior
            utils.setCatalogAnnotations(options, {
                "tag:misd.isi.edu,2015:display": {
                    "comment_display": {
                        "*": {
                            "comment_render_markdown": false
                        }
                    }
                }
            }).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });

        // simple "inbound" FK
        // main <- inbound leaf
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
                expect(simpleReference.columns[0].comment).toEqual({
                    value: "<p>simple fk source syntax comment</p>\n",
                    unformatted: "simple fk source syntax comment",
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

            it("next from_comment and from_comment_display should be used.", () => {
                expect(simpleReference.columns[1].comment).toEqual({
                    value: "simple fk from_comment comment",
                    unformatted: "simple fk from_comment comment",
                    isHTML: false,
                    displayMode: 'inline'
                });
            });

            it("by default the leaf table comment and comment_display should be used.", function () {
                expect(simpleReference.columns[3].comment).toEqual({
                    value: '<p>simple fk leaf table display comment</p>\n',
                    unformatted: 'simple fk leaf table display comment',
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

            it ('if from_comment_display is defined but not the from_comment, leaf table comment and this proeprty should be mixed', () => {
                expect(simpleReference.columns[2].comment).toEqual({
                    value: "table with simple key to reference and a foreign key annotation with no from comment display",
                    unformatted: "table with simple key to reference and a foreign key annotation with no from comment display",
                    isHTML: false,
                    displayMode: 'inline'
                });
            });
        });

        // pure and binary FK
        // main <- inbound association outbound -> leaf
        describe("for pure and binary relation", () => {

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
                expect(pBReference.columns[0].comment).toEqual({
                    value: "<p>pure and binary fk source syntax comment</p>\n",
                    unformatted: "pure and binary fk source syntax comment",
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

            it("next to_comment and to_comment_display should be used.", () => {
                expect(pBReference.columns[1].comment).toEqual({
                    value: "pure and binary fk to_comment",
                    unformatted: "pure and binary fk to_comment",
                    isHTML: false,
                    displayMode: 'inline'
                });
            });

            it("next the leaf table comment and comment_display should be used.", function () {
                expect(pBReference.columns[3].comment).toEqual({
                    value: '<p>pure and binary fk leaf table display comment</p>\n',
                    unformatted: 'pure and binary fk leaf table display comment',
                    isHTML: true,
                    displayMode: 'inline'
                });
            });

            it ('if to_comment_display is defined but not the to_comment, leaf table comment and this proeprty should be mixed', () => {
                expect(pBReference.columns[2].comment).toEqual({
                    value: "foreign key to association table no display",
                    unformatted: "foreign key to association table no display",
                    isHTML: false,
                    displayMode: 'inline'
                });
            });
        });

        // tests for pseudocolumn functionality when used for a related table
        // inbound multi hop foreign key
        // main <- inbound association outbound -> leaf outbound -> leaf
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
                expect(multiHopReference.columns[4].comment).toEqual({
                    isHTML: true,
                    unformatted: "multi hop fk source syntax comment",
                    value: "<p>multi hop fk source syntax comment</p>\n",
                    displayMode: 'inline'
                });
            });

            it("next use display annotation on leaf table", function () {
                expect(multiHopReference.columns[6].comment).toEqual({
                    isHTML: false,
                    unformatted: "multi hop fk leaf table display comment",
                    value: "multi hop fk leaf table display comment",
                    displayMode: 'inline'
                });
            });

            it("next use comment on leaf table model while using comment_display and markdown of display annotation,", function () {
                expect(multiHopReference.columns[5].comment).toEqual({
                    isHTML: true,
                    unformatted: "foreign key to association table with comment_display and no comment",
                    value: "<p>foreign key to association table with comment_display and no comment</p>\n",
                    displayMode: 'inline'
                });
            });

            it("next use comment on leaf table model and display annotation of catalog,", function () {
                expect(multiHopReference.columns[7].comment).toEqual({
                    isHTML: false,
                    unformatted: "foreign key to association table with no leaf display",
                    value: "foreign key to association table with no leaf display",
                    displayMode: 'tooltip'
                });
            });
        });

        afterAll((done) => {
            // remove the catalog annotation
            utils.setCatalogAnnotations(options, {}).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });

    });

};
