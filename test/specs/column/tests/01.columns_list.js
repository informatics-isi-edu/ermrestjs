/**
 * All the test cases related to the reference.columns logic
 */
 var utils = require('./../../../utils/utilities.js');

exports.execute = function (options) {
    describe('Regarding column list heuristics and logics, ', function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "columns_schema",
            tableName = "columns_table",
            tableWithCompositeKey = "table_w_composite_key",
            tableWithCompositeKey2 = "table_w_composite_key_2",
            tableWithSimpleKeyFK = "table_w_simple_key_as_fk",
            tableWithCompositeKey3 = "table_w_composite_key_3",
            tableWithSlash = "table_w_slash",
            tableWithAsset = "table_w_asset",
            tableWithInvalidUrlPattern = "table_with_invalid_url_pattern",
            tableWithNoVisibleColumns = "system_columns_heuristic_table",
            entityId = 1,
            limit = 1,
            entryContext = "entry",
            createContext = "entry/create",
            editContext = "entry/edit",
            detailedContext = "detailed";


        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/id=" + entityId;

        var singleEnitityUriCompositeKey = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithCompositeKey + "/id=" + entityId;

        var singleEnitityUriCompositeKey2 = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithCompositeKey2 + "/id=" + entityId;

        var singleEnitityUriCompositeKey3 = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithCompositeKey3 + "/id=" + entityId;

        var singleEnitityUriSimpleKeyFK = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithSimpleKeyFK + "/id=" + entityId;

        var singleEnitityUriWithSlash = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithSlash + "/id=" + entityId;

        var singleEnitityUriWithAsset = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithAsset + "/id=" + entityId;

        var tableWithInvalidUrlPatternURI = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ':' + tableWithInvalidUrlPattern;

        var singleEnitityUriSystemColumnsHeuristics = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithNoVisibleColumns + "/id=" + entityId;

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function (tag, location) {
            var url;
            switch (tag) {
                case "tag:isrd.isi.edu,2016:chaise:record":
                    url = recordURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:record-two":
                    url = record2URL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:viewer":
                    url = viewerURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:search":
                    url = searchURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:recordset":
                    url = recordsetURL;
                    break;
                default:
                    url = recordURL;
                    break;
            }

            url = url + "/" + location.path;

            return url;
        };

        var referenceRawData = [
            {
                "id": "1",
                "col_1": "9000",
                "col_2": null,
                "col_3": "4000",
                "col_4": "4001",
                "col 5": "4002",
                "col_6": "4003",
                "col_7": null,
                "columns_schema_outbound_fk_7": "12"
            },
            {
                "id": "2",
                "col_1": "9001",
                "col_2": null,
                "col_3": "4000",
                "col_4": "4002",
                "col 5": "4003",
                "col_6": "4004",
                "col_7": null,
                "columns_schema_outbound_fk_7": "13"
            }
        ];

        var compactRefExpectedPartialValue = [
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/id=1">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/id=9000">9000</a>',
            '',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/id=4000">4000</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key_2/id=4000">4000</a>',
            '4000',
            '4001',
            '4002',
            '4003',
             '',
             '<p><a href="http://example.com" class="external-link-icon external-link">12</a></p>\n',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id_1=4000&id_2=4001">4000 , 4001</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key_2/id_1=4000&id_2=4003">4000:4003</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id_1=4000&id_2=4002">4000 , 4002</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id_1=4001&id_2=4002">4001 , 4002</a>',
             ''
        ];

        var entryRefExpectedPartialValue = [
            '1',
            '9000',
            '',
            '4000',
            '4000',
            '12',
            '4000 : 4001',
            '4000:4003',
            '4000 : 4002',
            '4001 : 4002',
            ''
        ];

        var entryRefExpectedLinkedValue = [
            '1',
            'Hank',
            '',
            'John',
            'Hank',
            '12',
            '4000 : 4001',
            '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
            '4000 : 4002',
            '4001 : 4002',
            ''
        ];

        var entryCreateRefExpectedLinkedValue = [
            'Hank', '', '4000 : 4002', '1'
        ];

        var entryCreateRefExpectedPartialValue = [
            '9000', '', '4000 : 4002', '1'
        ];

        var assetEntryExpectedValue = [
            '1', '1', '1000', '10001', null, 'https://dev.isrd.isi.edu', 'https://dev.isrd.isi.edu', 'https://dev.isrd.isi.edu', 4
        ];

        var compactRefExpectedLinkedValue, assetCompactExpectedValue, assetDetailedExpectedValue, tableWSlashData;

        /**
         * This is the structure of the used tables:
         *
         * 1. columns_table:
         * columns:
         *  id -> single key, not part of any fk
         *  col_1 -> has generated annotation
         *  col_2 -> has displayname (value is null) | has immutable annotation | (colum_order: [id, col_1])
         *  col_3 -> has displayname (nullok is false) | (column_order: false)
         *  col_4 -> has generated annotation | (column_order: [col_2, col_3])
         *  col 5 -> has generated annotation
         *  col_6 -> nullok false
         *  col_7 -> value is null | has generated and immutable annotation
         *  columns_schema_outbound_fk_7 -> not part of any fk | has immutable
         *
         * FKRs:
         *  outbound_fk_1: col_1 -> ref_table (to_name) (column_order: false)
         *  outbound_fk_2: col_2 -> ref_table
         *  outbound_fk_3: col_3 -> ref_table
         *  outbound_fk_4: col_3 -> table_w_simple_key_2 | (column_order: [name])
         *  outbound_fk_5: col_3, col_4 -> table_w_composite_key (to_name) | (column_order: [id])
         *  outbound_fk_6: col_3, col_6 -> table_w_composite_key_2
         *  outbound_fk_7: col_4, col 5 -> table_w_composite_key
         *  outbound_fk_8: col_3, col 5 -> table_w_composite_key
         *  outbound_fk_9: col_7, col 5 -> table_w_composite_key -> col_7 is null
         *
         * expected output for ref.columns in compact (default heuristics) contexts:
         * 0:   id
         * 1:   outbound_fk_1 (check to_name)
         * 2:   outbound_fk_2  -> is null
         * 3:   outbound_fk_3 (check disambiguation) (check nullok)
         * 4:   outbound_fk_4 (check disambiguation)
         * 5:   col_3
         * 6:   col_4
         * 7:   col 5
         * 8:   col_6
         * 9:   col_7
         * 10:  columns_schema_outbound_fk_7
         * 11:  outbound_fk_5 (check to_name) (check nullok)
         * 12:  outbound_fk_6 (check nullok)
         * 13:  outbound_fk_8 (check disambiguation)
         * 14:  outbound_fk_7 (check disambiguation) (check nullok)
         * 15:  outbound_fk_9
         *
         * expected output for ref.columns in entry context:
         * 0:   id
         * 1:   outbound_fk_1
         * 2:   outbound_fk_2
         * 3:   outbound_fk_3
         * 4:   outbound_fk_4
         * 5:   columns_schema_outbound_fk_7
         * 6:   outbound_fk_5
         * 7:   outbound_fk_6
         * 8:   outbound_fk_8
         * 9:   outbound_fk_7
         * 10:  outbound_fk_9
         *
         *
         * ref.columns in entry/edit:
         *
         * 0:   col_6
         * 1:   id
         * 2:   col_3
         * 3:   outbound_fk_2 (used for inputDisabled)
         * 4:   outbound_fk_3 (used for inputDisabled)
         * 5:   outbound_fk_7 (used for inputDisabled)
         * 6:   outbound_fk_8 (used for inputDisabled)
         * 7:   outbound_fk_9 (used for inputDisabled)
         *
         * contexts that are used:
         *
         *  compact: doesn't have visible-columns
         *  compact/brief: has visible-columns with three composite keys
         *  compact/select: has all of the columns in visible-columns + has some foreign keys too
         *  detailed: has visible-columns with duplicate values + inbound fk (last one, index: 3)
         *  entry: doesn't have visible-columns
         *  entry/edit: has visible-columns annotation. (just key)
         *  entry/create: has all of the columns in visible-column + has some foreign keys too + inbound fk (which should be ignored)
         *
         *
         * 2. table_w_asset:
         *  ref.columns for detailed (no context present):
         *  0: table_w_asset_key_1 *KeyPseudoColumn*
         *  1: table_w_asset_fk_to_outbound *ForeignKeyPseudoColumn*
         *  2: col_1
         *  3: col_2
         *  4: col_filename
         *  5: col_byte
         *  6: col_md5
         *  7: col_sha256
         *  8: col_asset_1 *AssetPseudoColumn* disabeld (no url_pattern)
         *  9: col_asset_2 *AssetPseudoColumn* (asset with invalid options) has column-display (markdown and order)
         *  10: col_asset_3 *AssetPseudoColumn* (asset with valid options)
         *  11: col_asset_4 *AssetPseudoColumn* (asset with url_pattern and filename) has column-display (markdown)
         *  12: col_asset_4_filename
         *  13: col_asset_5 (asset with type not text)
         *  14: col_asset_6 *AssetPseudoColumn* (asset with url_pattern, filename, and image_preview)
         *  15: col_asset_5_filename
         *
         *  ref.columns for entry (no context present):
         *  0: id
         *  1: table_w_asset_fk_to_outbound *ForeignKeyPseudoColumn*
         *  2: col_1
         *  3: col_2
         *  4: col_asset_1 *AssetPseudoColumn* (disabled)
         *  5: col_asset_2 *AssetPseudoColumn*
         *  6: col_asset_3 *AssetPseudoColumn*
         *  7: col_asset_4
         *  8: col_asset_5
         *  9: col_asset_6 *AssetPseudoColumn* (with image_preview)
         *
         *
         *  contexts that are used:
         *  - compact: no visible-columns
         *  - detailed: valid assets: col_asset_3, col_asset_4, col_asset_6
         *  - edit: no visible-columns
         *  - entry/create: does not include col_asset_3 -> so no ignore
         *  - entry/edit: includes col_asset_3 and all its contituent columns
         *  - compact/brief: includes col_asset_3 and all its contituent columns
         *  - compact/brief/inline: inlcudes inline table that should not be visible
         *
         *  3. table_w_composite_key:
         *      has different values for row_name, row_name/compact and row_name/entry.
         */

        var compactRef, compactBriefRef, compactSelectRef, compactBriefInlineRef, entryRef, entryCreateRef, entryEditRef,
            slashRef, assetRef, assetRefEntry, assetRefCompact, assetRefCompactCols,
            compactColumns, compactSelectColumns, table2RefColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.setClientConfig({
                internalHosts: [options.catalog.server.host, "dev.isrd.isi.edu"]
            });
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {
                compactRef = response.contextualize.compact;
                compactBriefRef = response.contextualize.compactBrief;
                compactSelectRef = response.contextualize.compactSelect;
                compactBriefInlineRef = response.contextualize.compactBriefInline;

                detailedRef = response.contextualize.detailed;

                entryRef = response.contextualize.entry;
                entryCreateRef = response.contextualize.entryCreate;
                entryEditRef = response.contextualize.entryEdit;

                compactColumns = compactRef.columns;
                compactSelectColumns = compactSelectRef.columns;

                return options.ermRest.resolve(singleEnitityUriWithSlash, {cid:"test"});
            }).then(function(ref){
                slashRef = ref;
                return options.ermRest.resolve(singleEnitityUriWithAsset, {cid:"test"});
            }).then(function(ref){
                assetRef = ref;
                assetRefCompact = ref.contextualize.compact;
                assetRefCompactCols = assetRefCompact.columns;
                assetRefEntry = ref.contextualize.entry;
                done();
            }).catch(function (err) {
                console.dir(err);
                done.fail();
            });

            compactRefExpectedLinkedValue = [
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/id=1">1</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_simple_key", "id", "9000") + '">Hank</a>',
                '',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_simple_key", "id", "4000") + '">John</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key_2/RID=' + utils.findEntityRID(options, schemaName, "table_w_simple_key_2", "id", "4000") + '">Hank</a>',
                '4000',
                '4001',
                '4002',
                '4003',
                '',
                '<p><a href="http://example.com" class="external-link-icon external-link">12</a></p>\n',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_composite_key", "id", "1") + '">4000 , 4001</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_composite_key", "id", "2") + '">4000 , 4002</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_composite_key", "id", "4") + '">4001 , 4002</a>',
                ''
            ];

            assetDetailedExpectedValue = [
                '<a href="https://dev.isrd.isi.edu?uinit=1&amp;cid=test" download="" class="asset-permission">filename</a>',
                '<p>filename4</p>\n',
                '<a href="https://dev.isrd.isi.edu/file.png?uinit=1&amp;cid=test" download="" class="asset-permission">filename6</a>'
            ];

            assetCompactExpectedValue = [
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_asset/id=1">1</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/RID=' + utils.findEntityRID(options, schemaName, "columns_table", "id", "1") + '">1</a>',
                '1000', '10001', 'filename', '1,242', 'md5', 'sha256',
                '',
                '<h2>filename</h2>\n',
                '<a href="https://dev.isrd.isi.edu?uinit=1&amp;cid=test" download="" class="asset-permission">filename</a>',
                'filename4',
                '4',
                'filename6',
                '<a href="https://dev.isrd.isi.edu/file.png?uinit=1&amp;cid=test" download="" class="asset-permission">filename6</a>'
            ];

            tableWSlashData = [
                '1',
                '1',
                '2',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_simple_key", "id", "9001") + '">Harold</a>',
                '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/RID=' + utils.findEntityRID(options, schemaName, "table_w_simple_key", "id", "9000") + '">Hank</a>'
            ];
        });


        // remove the client-config
        afterAll(function () {
            options.ermRest.setClientConfig({});
        });

        describe('.columns, ', function () {
            describe('when visible-columns annotation is present for the context, ', function () {
                it('should not include duplicate columns and PseudoColumns.', function () {
                    checkReferenceColumns([{
                        ref: detailedRef,
                        expected: [
                            "id",
                            ["columns_schema","ref_table_outbound_fks_key"].join("_"),
                            ["columns_schema", "outbound_fk_1"].join("_"),
                            ["columns_schema", "inbound_related_to_columns_table_2_fkey"].join("_")
                        ]
                    }]);
                });

                it('should just include columns and PseudoColumns that are valid.', function () {
                    checkReferenceColumns([{
                        ref: entryCreateRef,
                        expected: [
                            ["columns_schema", "outbound_fk_1"].join("_"),
                            ["columns_schema", "outbound_fk_9"].join("_"),
                            ["columns_schema", "outbound_fk_8"].join("_"),
                            "id"
                        ]
                    }]);
                });

                describe('for foreignKey columns,', function () {
                    it('should not apply heuristics and just return given list.', function() {
                        expect(compactSelectColumns.length).toBe(13);
                        checkReferenceColumns([{
                            ref: compactSelectRef,
                            expected: [
                                "id", ["columns_schema", "outbound_fk_1"].join("_"),
                                "col_1", "col_2", "col_3", "col_4","col 5", ["columns_schema","outbound_fk_3"].join("_"),
                                "col_6", "col_7", ["columns_schema","outbound_fk_5"].join("_"),
                                "columns_schema_outbound_fk_7", ["columns_schema","outbound_fk_7"].join("_")
                            ]
                        }]);
                    });
                });

                describe('for key columns,', function () {
                    it('in entry contexts, instead of creating a PseudoColumn for key, should add its contituent columns (avoid duplicate).', function () {
                        checkReferenceColumns([{
                            ref: entryEditRef,
                            expected: [
                                "col_6", "id", "col_3",
                                ["columns_schema", "outbound_fk_2"].join("_"),
                                ["columns_schema", "outbound_fk_3"].join("_"),
                                ["columns_schema", "outbound_fk_7"].join("_"),
                                ["columns_schema", "outbound_fk_8"].join("_"),
                                ["columns_schema", "outbound_fk_9"].join("_")
                            ]
                        }]);
                    });
                });

                describe('for asset columns,', function () {
                    describe('filname, byte, md5, and sha256 columns', function() {
                        it('should be ignored in edit context if the asset column is present.', function() {
                            checkReferenceColumns([{
                                ref: assetRef.contextualize.entryEdit,
                                expected: [
                                    "col_asset_3"
                                ]
                            }]);
                        });

                        it('should not be ignored in any contexts if the asset column is not present.', function() {
                            checkReferenceColumns([{
                                ref: assetRef.contextualize.entryCreate,
                                expected: [
                                    "col_filename","col_byte","col_md5","col_sha256"
                                ]
                            }]);
                        });

                        it('otherwise, should not be ignored.', function() {
                            checkReferenceColumns([{
                                ref: assetRef.contextualize.compactBrief,
                                expected: [
                                    "col_asset_3", "col_filename","col_byte","col_md5","col_sha256"
                                ]
                            }]);
                        });
                    });


                    describe("for checking table which has asset column without upload feature, ", function() {

                        var assetRef1;

                        var checkCol = function (name) {
                            var colIndex = assetRef1.columns.findIndex(function(c) { return c.name === name; });
                            expect(colIndex).not.toBe(-1, "column doesn't exist.");
                            var col = assetRef1.columns[colIndex];
                            expect(col.isAsset).toBe(true, "column is not asset.");
                            expect(col.inputDisabled).toBe(true, "column was not disabled.");
                        }

                        beforeAll(function (done) {
                            options.ermRest.resolve(tableWithInvalidUrlPatternURI, { cid: "test" }).then(function (response) {
                                assetRef1 = response;
                                assetRef1 = assetRef1.contextualize.entryCreate;
                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                        });

                        it("should create asset column if annotation is available, but disable it if url_pattern is missing", function() {
                            checkCol("uri1");
                        });

                        it("should create asset column if annotation is available, but disable it if url_pattern is not an string", function() {
                            checkCol("uri2");
                        });

                        it("should create asset column if annotation is available, but disable it if url_pattern is an empty string", function() {
                            checkCol("uri3");
                        });

                        it("should create asset column if annotation is available, but disable it if browser_upload is false", function() {
                            checkCol("uri4");
                        });
                    });
                });

                describe("for inbound foreignkey columns, ", function () {
                    it("in non-detailed context, should ignore them.", function () {
                        expect(entryCreateRef.columns.length).toBe(4, "entry/create missmatch.");

                        expect(compactBriefInlineRef.columns.length).toBe(1, "compact/brief/inline missmatch");
                    });

                    it('in detailed context, should create a pseudo-column for those and remove them from related references.', function () {
                        expect(detailedRef.columns[3]._constraintName).toBe(["columns_schema", "inbound_related_to_columns_table_2_fkey"].join("_"), "didn't create a pseudo column.");

                        expect(detailedRef.related.length).toBe(1, "didn't remove the column from related references");
                        expect(detailedRef.related[0].table.name).toBe("inbound_related_to_columns_table", "the name of related reference is not what was expected");
                    });
                });

                if (!process.env.CI) {
                    it('should handle the columns with slash(`/`) in their names.', function () {
                        checkReferenceColumns([{
                            ref: slashRef.contextualize.compactBrief,
                            expected: [
                                "id",
                                "col_with_slash/",
                                ["columns_schema", "table_w_slash_fk_1"].join("_"),
                                ["columns_schema", "table_w_slash_fk_2"].join("_")
                            ]
                        }]);
                    });
                }
            });


            describe('when visible-columns annotation is not present for the context, ', function () {
                describe('PseudoColumn for key, ', function () {

                    // TODO: Update this testcase because of changes related to system columns
                    xit('if key is simple and its constituent columns are part of simple foreign key, should not be added (instead it should apply the PseudoColumn for foreignkey logic.)', function(done) {
                        options.ermRest.resolve(singleEnitityUriSimpleKeyFK, {cid:"test"}).then(function(ref) {
                            expect(ref.columns[0].isPseudo).toBe(true);
                            expect(ref.columns[0]._constraintName).toEqual("columns_schema_table_w_simple_key_as_fk_key_foreignkey");

                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });
                    });

                    it('if context is detailed, entry, entry/create, or entry/edit, should not be added.', function (done) {
                        expect(entryRef.columns[0].isPseudo).toBe(false);
                        expect(entryRef.columns[0].name).toEqual("id");

                        options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                                ref = ref.contextualize.detailed;
                                expect(ref.columns[0].isPseudo).toBe(false);
                                expect(ref.columns[0].name).toEqual("id");

                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                    });

                    describe('otherwise, ', function () {
                        it ('should pick the shortest notnull and not html key.', function () {
                            expect(compactColumns[0].isPseudo).toBe(true);
                            expect(compactColumns[0]._constraintName).toEqual(["columns_schema", "ref_table_outbound_fks_key"].join("_"));
                        });

                        // TODO: Update this testcase because of changes related to system columns
                        xit("if table has several keys with same size, should pick the one with most text columns.", function (done) {
                            options.ermRest.resolve(singleEnitityUriCompositeKey3, {cid:"test"}).then(function(ref) {
                                expect(ref.columns[0].isPseudo).toBe(true);
                                expect(ref.columns[0]._constraintName).toEqual(["columns_schema", "table_w_composite_key_3_key"].join("_"));

                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                        });

                        it('if table has several keys with same size and same number of texts, should pick the key that has lower column positions.', function (done) {
                            options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                                expect(ref.columns[0].isPseudo).toBe(true);
                                expect(ref.columns[0]._constraintName).toEqual(["columns_schema", "table_w_composite_key_2_key"].join("_"));

                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                        });

                    });
                });

                it('should not include serial columns that are part of a simple key, and that key has not been used for self-link.', function (){
                    options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                        expect(ref.columns.length).toBe(8);
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                })

                it('should not include duplicate Columns or PseudoColumns.', function() {
                    expect(compactColumns.length).toBe(22);
                    expect(entryRef.columns.length).toBe(17);
                });

                it('should include columns that are not part of any FKRs.', function () {
                    expect(compactColumns[10].isPseudo).toBe(false);
                    expect(compactColumns[10].name).toBe("columns_schema_outbound_fk_7");
                });

                describe('for columns that are part of a simple FKR, ', function () {
                    it('should replace them with PseudoColumn.', function () {
                        expect(compactColumns[1].isPseudo).toBe(true);
                        expect(compactColumns[1]._constraintName).toBe(["columns_schema", "outbound_fk_1"].join("_"));

                        expect(compactColumns[2].isPseudo).toBe(true);
                        expect(compactColumns[2]._constraintName).toBe(["columns_schema", "outbound_fk_2"].join("_"));

                        expect(compactColumns[3].isPseudo).toBe(true);
                        expect(compactColumns[3]._constraintName).toBe(["columns_schema", "outbound_fk_3"].join("_"));

                        expect(compactColumns[4].isPseudo).toBe(true);
                        expect(compactColumns[4]._constraintName).toBe(["columns_schema", "outbound_fk_4"].join("_"));
                    });
                });

                describe('for columns that are part of composite FKR, ', function () {

                    it('should include the columns and avoid duplicate.', function () {
                        expect(compactColumns[5].isPseudo).toBe(false);
                        expect(compactColumns[5].name).toBe("col_3");

                        expect(compactColumns[6].isPseudo).toBe(false);
                        expect(compactColumns[6].name).toBe("col_4");

                        expect(compactColumns[7].isPseudo).toBe(false);
                        expect(compactColumns[7].name).toBe("col 5");

                        expect(compactColumns[8].isPseudo).toBe(false);
                        expect(compactColumns[8].name).toBe("col_6");

                        expect(compactColumns[9].isPseudo).toBe(false);
                        expect(compactColumns[9].name).toBe("col_7");
                    });

                    it('in edit or create context should not include the columns, and just create PseudoColumn for them.', function () {
                        var expectedCols = [
                            "id", ["columns_schema", "outbound_fk_1"].join("_"), ["columns_schema", "outbound_fk_2"].join("_"), ["columns_schema", "outbound_fk_3"].join("_"), ["columns_schema", "outbound_fk_4"].join("_"),
                            "columns_schema_outbound_fk_7", ["columns_schema", "outbound_fk_5"].join("_"), ["columns_schema", "outbound_fk_6"].join("_"), ["columns_schema", "outbound_fk_8"].join("_"), ["columns_schema", "outbound_fk_7"].join("_"), ["columns_schema", "outbound_fk_9"].join("_")
                        ];

                        checkReferenceColumns([{
                            ref: entryRef,
                            expected: expectedCols
                        }]);
                    });

                    it('should create just one PseudoColumn for the FKR.', function () {
                        expect(compactColumns[17].isPseudo).toBe(true);
                        expect(compactColumns[17]._constraintName).toBe(["columns_schema", "outbound_fk_5"].join("_"));

                        expect(compactColumns[18].isPseudo).toBe(true);
                        expect(compactColumns[18]._constraintName).toBe(["columns_schema", "outbound_fk_6"].join("_"));

                        expect(compactColumns[19].isPseudo).toBe(true);
                        expect(compactColumns[19]._constraintName).toBe(["columns_schema", "outbound_fk_8"].join("_"));

                        expect(compactColumns[20].isPseudo).toBe(true);
                        expect(compactColumns[20]._constraintName).toBe(["columns_schema", "outbound_fk_7"].join("_"));

                        expect(compactColumns[21].isPseudo).toBe(true);
                        expect(compactColumns[21]._constraintName).toBe(["columns_schema", "outbound_fk_9"].join("_"));
                    });
                });

                describe('for asset columns,', function () {
                    describe('filename, byte, md5, and sha256 columns', function() {
                        it('should be ignored in edit context.', function() {
                            checkReferenceColumns([{
                                ref: assetRefEntry,
                                expected: [
                                    "id",
                                    ["columns_schema", "table_w_asset_fk_to_outbound"].join("_"),
                                    "col_1", "col_2",
                                    "col_asset_1", "col_asset_2", "col_asset_3", "col_asset_4", "col_asset_5"
                                ]
                            }]);
                        });

                        it('should not be ignored in other contexts.', function() {
                            expect(assetRefCompactCols.length).toBe(21);
                            expect(assetRefCompactCols[4].name).toBe("col_filename");
                            expect(assetRefCompactCols[4].isPseudo).toBe(false);
                            expect(assetRefCompactCols[5].name).toBe("col_byte");
                            expect(assetRefCompactCols[5].isPseudo).toBe(false);
                            expect(assetRefCompactCols[6].name).toBe("col_md5");
                            expect(assetRefCompactCols[6].isPseudo).toBe(false);
                            expect(assetRefCompactCols[7].name).toBe("col_sha256");
                            expect(assetRefCompactCols[7].isPseudo).toBe(false);
                        });
                    });

                    describe('if column has asset annotation, but `no url_pattern`', function () {
                        it('in edit context it should be removed from the visible-columns.', function (){
                            //TODO
                        });

                        it('in other contexts it should be treated as a normal column.', function (){
                            //TODO
                        });
                    });

                    it("if column type is not `text`, should ignore the asset annotation.", function() {
                      expect(assetRefCompactCols[13].name).toBe("col_asset_5", "invalid name for compact");
                      expect(assetRefCompactCols[13].isPseudo).toBe(false, "invalid isPseudo for compact");
                      expect(assetRefEntry.columns[8].name).toBe("col_asset_5", "invalid name for entry");
                      expect(assetRefEntry.columns[8].isPseudo).toBe(false, "invalid isPseudo for entry");
                    });

                    it('if columns has been used as the keyReferenceColumn, should ignore the asset annotation.', function () {
                        expect(assetRefCompactCols[0]._constraintName).toBe(["columns_schema", "table_w_asset_key_1"].join("_"));
                        expect(assetRefCompactCols[0].isKey).toBe(true);
                    });

                    it('if column is part of any foreignkeys, should ignore the asset annotation.', function() {
                        expect(assetRefCompactCols[1]._constraintName).toBe(["columns_schema", "table_w_asset_fk_to_outbound"].join("_"));
                        expect(assetRefCompactCols[1].isForeignKey).toBe(true);
                    });
                });

                if (!process.env.CI) {
                    it('should handle the columns with slash(`/`) in their names.', function () {
                        checkReferenceColumns([{
                            ref: slashRef,
                            expected: [
                                "id",
                                "col_1",
                                "col_with_slash/",
                                ["columns_schema", "table_w_slash_fk_1"].join("_"),
                                ["columns_schema", "table_w_slash_fk_2"].join("_")
                            ]
                        }]);
                    });
                }
            });

        });

        describe('.generateColumnsList, ', function () {
            it('should return the same columns list as .columns', function () {
                areSameColumnList(compactRef.generateColumnsList(), compactColumns);
                areSameColumnList(entryEditRef.generateColumnsList(), entryEditRef.columns);
            });

            describe('with system columns heuristic config options defined,', function () {
                function systemColumnsHeuristicsMode(context) {
                    var mode = null;
                    if (context.indexOf('compact') != -1) {
                        mode = true;
                    } else if (context == 'detailed') {
                        mode = ['RCT', 'RMB', 'not_a_col', 'RID', 'col_1'];
                    } else if (context.indexOf('entry') != -1) {
                        mode = ['RMB', 'RID', 'RMT'];
                    }

                    return mode;
                }

                var compactSystemColumnsModeRef, compactSystemColumnsModeColumns,
                    detailedSystemColumnsModeRef, detailedSystemColumnsModeColumns,
                    entrySystemColumnsModeRef, entrySystemColumnsModeColumns;

                beforeAll(function (done) {
                    // set this here so it doesn't affect above columns list tests
                    options.ermRest.systemColumnsHeuristicsMode(systemColumnsHeuristicsMode);
                    options.ermRest.resolve(singleEnitityUriSystemColumnsHeuristics, {
                        cid: "test"
                    }).then(function (response) {
                        compactSystemColumnsModeRef = response.contextualize.compact;
                        detailedSystemColumnsModeRef = response.contextualize.detailed;
                        entrySystemColumnsModeRef = response.contextualize.entry;

                        compactSystemColumnsModeColumns = compactSystemColumnsModeRef.columns;
                        detailedSystemColumnsModeColumns = detailedSystemColumnsModeRef.columns;
                        entrySystemColumnsModeColumns = entrySystemColumnsModeRef.columns;

                        done();
                    }).catch(function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('with config option: `systemColumnsDisplayCompact=true`, RID should be first, RCB, RMB, RCT, RMT at the end', function () {
                    areSameColumnList(compactSystemColumnsModeRef.generateColumnsList(), compactSystemColumnsModeColumns);
                    //verify RID is first
                    expect(compactSystemColumnsModeColumns[0]._baseCols[0].name).toBe('RID', 'RID is not fisrt');
                    expect(compactSystemColumnsModeColumns.length).toBe(8, 'length missmatch');
                    //verify RMB, RCB, RMT, RCT are last
                    expect(compactSystemColumnsModeColumns[4].isForeignKey).toBe(true, 'isForeignKey index=4 missmatch');
                    expect(compactSystemColumnsModeColumns[4].table.name).toBe("person", 'col index=4 missmatch');

                    expect(compactSystemColumnsModeColumns[5].isForeignKey).toBe(true, 'isForeignKey index=5 missmatch');
                    expect(compactSystemColumnsModeColumns[5].table.name).toBe("person", 'col index=5 missmatch');

                    expect(compactSystemColumnsModeColumns[6].name).toBe('RCT', 'col index=6 missmatch');
                    expect(compactSystemColumnsModeColumns[7].name).toBe('RMT', 'col index=7 missmatch');
                });

                it("with config option: `systemColumnsDisplayDetailed=['RCT', 'RMB', 'not_a_col', 'RID', 'col_1']`, RID should be first, RMB, RCT at the end.", function () {
                    var columnNames = []
                    detailedSystemColumnsModeColumns.forEach(function (col) {
                        columnNames.push(col.name);
                    });
                    // order for system columns is always in the order of module._systemColumns
                    // i.e. ['RID', 'RCB', 'RMB', 'RCT', 'RMT']
                    areSameColumnList(detailedSystemColumnsModeRef.generateColumnsList(), detailedSystemColumnsModeColumns);
                    expect(columnNames.length).toBe(6, 'length missmatch');

                    expect(detailedSystemColumnsModeColumns[0]._baseCols[0].name).toBe('RID', 'RID is not first');

                    // col_1 shouldn't be moved out of default order (defined before col_2 in table definition)
                    expect(columnNames.indexOf('col_1') < columnNames.indexOf('col_2')).toBeTruthy("col_1 is not before col_2");

                    // the only system columns, and should be at the end
                    expect(detailedSystemColumnsModeColumns[4].isForeignKey).toBe(true, 'isForeignKey index=4 missmatch');
                    expect(detailedSystemColumnsModeColumns[4].table.name).toBe("person", 'col index=4 missmatch');

                    expect(columnNames[5]).toBe('RCT', 'col index=5 missmatch');

                    // other system columns should not be present
                    expect(columnNames.indexOf('RCB')).toBe(-1, 'RCB in column list');
                    expect(columnNames.indexOf('RMT')).toBe(-1, 'RMT in column list');
                    // not_a_col is not in the table definition, and should be ignored
                    expect(columnNames.indexOf('not_a_col')).toBe(-1, 'not_a_col in column list');
                });

                it("with config option: `systemColumnsDisplayEntry=['RMB', 'RID', 'RMT']`, RID should be first, RMB, RMT at the end", function () {
                    var columnNames = []
                    entrySystemColumnsModeColumns.forEach(function (col) {
                        columnNames.push(col.name);
                    });

                    areSameColumnList(entrySystemColumnsModeRef.generateColumnsList(), entrySystemColumnsModeColumns);
                    //verify RID is first
                    expect(entrySystemColumnsModeColumns[0]._baseCols[0].name).toBe('RID', 'RID is not first');
                    expect(entrySystemColumnsModeColumns.length).toBe(6, 'length mismatch');

                    // the only system columns, and should be at the end
                    expect(entrySystemColumnsModeColumns[4].isForeignKey).toBe(true, 'isForeignKey index=4 mismatch');
                    expect(entrySystemColumnsModeColumns[4].table.name).toBe("person", 'col index=4 mismatch');

                    expect(entrySystemColumnsModeColumns[5].name).toBe('RMT', 'col index=5 mismatch');

                    // other system columns should not be present
                    expect(columnNames.indexOf('RCB')).toBe(-1, 'RCB in column list');
                    expect(columnNames.indexOf('RCT')).toBe(-1, 'RMT in column list');
                });

                afterAll(function () {
                    options.ermRest.systemColumnsHeuristicsMode(function () {});
                });
            });
        });

        describe('tuple.values, ', function () {
            describe('when linked data is available, ', function () {
                it('should return a link for PseudoColumns and value for Columns; and respect null values.', function (done) {
                    options.ermRest.appLinkFn(appLinkFn);
                    compactRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(jasmine.arrayContaining(compactRefExpectedLinkedValue));
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('in entry contexts should not return a link for PseudoColumns and just return row name; and respect null values.', function (done) {
                    entryRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(jasmine.arrayContaining(entryRefExpectedLinkedValue));

                        entryCreateRef.read(limit).then(function (page) {
                            var tuples = page.tuples;
                            expect(tuples[0].values).toEqual(jasmine.arrayContaining(entryCreateRefExpectedLinkedValue));
                            done();
                        }, function (err) {
                            console.dir(err);
                            done.fail();
                        });

                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            });

            describe('in absence of linked data, ', function () {
                var page;
                it('should return a link for PseudoColumns and value for Columns; and respect null values.', function () {
                    page = options.ermRest._createPage(compactRef, null, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(jasmine.arrayContaining(compactRefExpectedPartialValue));
                });

                it('in entry contexts should not return a link for PseudoColumns and just return row name; and respect null values.', function () {
                    page = options.ermRest._createPage(entryRef, null, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(jasmine.arrayContaining(entryRefExpectedPartialValue));

                    page = options.ermRest._createPage(entryCreateRef, null, referenceRawData, false, false);
                    expect(page.tuples[0].values).toEqual(jasmine.arrayContaining(entryCreateRefExpectedPartialValue));
                });
            });

            describe('for tables with asset column, ', function () {
                it('should return the underlying value in entry context.', function(done) {
                    assetRefEntry.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(jasmine.arrayContaining(assetEntryExpectedValue));
                        done();
                    }, function (err) {
                        done.fail(err);
                    });
                });

                it('otherwise should return the download button.', function(done) {
                    assetRefCompact.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(jasmine.arrayContaining(assetCompactExpectedValue));
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('in detailed, should return the download button and image preview if applicaple.', function(done) {
                    assetRefCompact.contextualize.detailed.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(jasmine.arrayContaining(assetDetailedExpectedValue));
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            });

            if (!process.env.CI) {
                it('should handle the columns with slash(`/`) in their names.', function (done) {
                    slashRef.read(limit).then(function (page) {
                        var tuples = page.tuples;
                        expect(tuples[0].values).toEqual(jasmine.arrayContaining(tableWSlashData));
                        done();
                    }, function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            }
        });

        /************** HELPER FUNCTIONS ************* */
        function areSameColumnList(cols1, cols2) {
            expect(cols1.length).toEqual(cols2.length, "didn't have the same length.");
            for (var i = 0; i < cols1.length; i++) {
                expect(cols1[i].name).toEqual(cols2[i].name, "missmatch in column with index=" + i);
            }
        }

        function checkReferenceColumns(tesCases) {
            tesCases.forEach(function (test) {
                expect(test.ref.columns.map(function (col) {
                    return (col.isPseudo && (col.isKey || col.isForeignKey || col.isInboundForeignKey)) ? col._constraintName : col.name;
                })).toEqual(jasmine.arrayContaining(test.expected));
            });
        }
    });

}
