/**
 * All the test cases related to the reference.columns logic
 */
exports.execute = function (options) {
    describe('In case of outbound foreign keys, ', function () {
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

        var data = {
            "id": "1",
            "id_1": "2",
            "id_2": "3"
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
             '<p>12</p>\n',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id_1=4000&id_2=4001">4000 , 4001</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key_2/id_1=4000&id_2=4003">4000:4003</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id_1=4000&id_2=4002">4000 , 4002</a>',
             '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id_1=4001&id_2=4002">4001 , 4002</a>',
             ''
        ];

        var compactRefExpectedLinkedValue = [
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/id=1">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/id=9000">Hank</a>',
            '',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/id=4000">John</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key_2/id=4000">Hank</a>',
            '4000',
            '4001',
            '4002',
            '4003',
            '',
            '<p>12</p>\n',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id=1">4000 , 4001</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/search">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id=2">4000 , 4002</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_composite_key/id=4">4001 , 4002</a>',
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

        var tableWSlashData = [
            '1',
            '1',
            '2',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/id=9001">Harold</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_simple_key/id=9000">Hank</a>'
        ];

        var assetEntryExpectedValue = [
            '1', '1', '1000', '10001', 'https://dev.isrd.isi.edu', 'https://dev.isrd.isi.edu', 4
        ];

        var assetCompactExpectedValue = [
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:table_w_asset/id=1">1</a>',
            '<a href="https://dev.isrd.isi.edu/chaise/record/columns_schema:columns_table/id=1">1</a>',
            '1000', '10001', 'filename', '1,242', 'md5', 'sha256',
            '',
            '<h2>filename</h2>\n',
            '<a href="https://dev.isrd.isi.edu?uinit=1" download="" class="download">filename</a>',
            '4'
        ];

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
         *  8: col_asset_1 (asset with default options) is null
         *  9: col_asset_2 *AssetPseudoColumn* (asset with invalid options) has column-display
         *  10: col_asset_3 *AssetPseudoColumn* (asset with valid options)
         *  11: col_asset_4 (asset with type not text)
         *
         *  ref.columns for entry (no context present):
         *  0: id
         *  1: table_w_asset_fk_to_outbound *ForeignKeyPseudoColumn*
         *  2: col_1
         *  3: col_2
         *  4: col_asset_2 *AssetPseudoColumn*
         *  5: col_asset_3 *AssetPseudoColumn*
         *  6: col_asset_4
         *
         *
         *  contexts that are used:
         *  - compact: no visible-columns
         *  - edit: no visible-columns
         *  - entry/create: does not include col_asset_3 -> so no ignore
         *  - entry/edit: includes col_asset_3 and all its contituent columns
         *  - compact/brief: includes col_asset_3 and all its contituent columns
         *
         *  3. table_w_composite_key:
         *      has different values for row_name, row_name/compact and row_name/entry.
         */

        var compactRef, compactBriefRef, compactSelectRef, entryRef, entryCreateRef, entryEditRef,
            slashRef, assetRef, assetRefEntry, assetRefCompact, assetRefCompactCols,
            compactColumns, compactSelectColumns, table2RefColumns;

        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {

                compactRef = response.contextualize.compact;
                compactBriefRef = response.contextualize.compactBrief;
                compactSelectRef = response.contextualize.compactSelect;

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
                                "columns_schema_outbound_fk_7", ["columns_schema","outbound_fk_7"].join("_") + "1"
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
                                ["columns_schema", "outbound_fk_7"].join("_") + "1",
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


                    describe("for checking table which has an asset column with invalid url pattern in entry context, ", function() {

                        var assetRef1;

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

                        it("'uri1' column should not be returned in visible-columns as it has no url_pattern property", function() {
                            var column = assetRef1.columns.find(function(c) { return c.name === "uri1" });
                            expect(column).toBeUndefined();
                        });

                        it("'uri2' column should not be returned in visible-columns as it doesn't has 'hatrac' in url_pattern (/js/ermrestjs/{{{_uri.md5_hex}}}) property", function() {
                            var column = assetRef1.columns.find(function(c) { return c.name === "uri2" });
                            expect(column).toBeUndefined();
                        });

                        it("'uri3' column should be returned in visible-columns and should be of asset type as it has 'hatrac' in url_pattern (/hatrac/js/ermrestjs/{{{_uri.md5_hex}}}) property", function() {
                            var column = assetRef1.columns.find(function(c) { return c.name === "uri3" });
                            expect(column).toBeDefined();
                            expect(column.isAsset).toBe(true);
                        });

                        it("'uri3' column should be returned in visible-columns and should be of asset type as it has 'hatrac' in url_pattern (https://example.com/hatrac/js/ermrestjs/{{{_uri.md5_hex}}}) property", function() {
                            var column = assetRef1.columns.find(function(c) { return c.name === "uri4" });
                            expect(column).toBeDefined();
                            expect(column.isAsset).toBe(true);
                        });
                    });
                });

                describe("for inbound foreignkey columns, ", function () {
                    it("in entry context, should ignore them.", function () {
                        expect(entryCreateRef.columns.length).toBe(4);
                    });

                    it('in other columns, should create a pseudo-column for those and remove them from related references.', function () {
                        expect(detailedRef.columns[3].name).toBe(["columns_schema", "inbound_related_to_columns_table_2_fkey"].join("_"), "didn't create a pseudo column.");

                        expect(detailedRef.related().length).toBe(1, "didn't remove the column from related references");
                        expect(detailedRef.related()[0].table.name).toBe("inbound_related_to_columns_table", "the name of related reference is not what was expected");
                    });
                });

                if (!process.env.TRAVIS) {
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
                            expect(ref.columns[0].name).toEqual("columns_schema_table_w_simple_key_as_fk_key_foreignkey");

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
                            expect(compactColumns[0].name).toEqual(["columns_schema", "ref_table_outbound_fks_key"].join("_"));
                        });

                        // TODO: Update this testcase because of changes related to system columns 
                        xit("if table has several keys with same size, should pick the one with most text columns.", function (done) {
                            options.ermRest.resolve(singleEnitityUriCompositeKey3, {cid:"test"}).then(function(ref) {
                                expect(ref.columns[0].isPseudo).toBe(true);
                                expect(ref.columns[0].name).toEqual(["columns_schema", "table_w_composite_key_3_key"].join("_"));

                                done();
                            }, function (err) {
                                console.dir(err);
                                done.fail();
                            });
                        });

                        it('if table has several keys with same size and same number of texts, should pick the key that has lower column positions.', function (done) {
                            options.ermRest.resolve(singleEnitityUriCompositeKey2, {cid:"test"}).then(function(ref) {
                                expect(ref.columns[0].isPseudo).toBe(true);
                                expect(ref.columns[0].name).toEqual(["columns_schema", "table_w_composite_key_2_key"].join("_"));

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
                    expect(compactColumns.length).toBe(21);
                    expect(entryRef.columns.length).toBe(16);
                });

                it('should include columns that are not part of any FKRs.', function () {
                    expect(compactColumns[10].isPseudo).toBe(false);
                    expect(compactColumns[10].name).toBe("columns_schema_outbound_fk_7");
                });

                describe('for columns that are part of a simple FKR, ', function () {
                    it('should replace them with PseudoColumn.', function () {
                        expect(compactColumns[1].isPseudo).toBe(true);
                        expect(compactColumns[1].name).toBe(["columns_schema", "outbound_fk_1"].join("_"));

                        expect(compactColumns[2].isPseudo).toBe(true);
                        expect(compactColumns[2].name).toBe(["columns_schema", "outbound_fk_2"].join("_"));

                        expect(compactColumns[3].isPseudo).toBe(true);
                        expect(compactColumns[3].name).toBe(["columns_schema", "outbound_fk_3"].join("_"));

                        expect(compactColumns[4].isPseudo).toBe(true);
                        expect(compactColumns[4].name).toBe(["columns_schema", "outbound_fk_4"].join("_"));
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
                            "columns_schema_outbound_fk_7", ["columns_schema", "outbound_fk_5"].join("_"), ["columns_schema", "outbound_fk_6"].join("_"), ["columns_schema", "outbound_fk_8"].join("_"), ["columns_schema", "outbound_fk_7"].join("_") + "1", ["columns_schema", "outbound_fk_9"].join("_")
                        ];

                        checkReferenceColumns([{
                            ref: entryRef,
                            expected: expectedCols
                        }]);
                    });

                    it('should create just one PseudoColumn for the FKR.', function () {
                        expect(compactColumns[16].isPseudo).toBe(true);
                        expect(compactColumns[16].name).toBe(["columns_schema", "outbound_fk_5"].join("_"));

                        expect(compactColumns[17].isPseudo).toBe(true);
                        expect(compactColumns[17].name).toBe(["columns_schema", "outbound_fk_6"].join("_"));

                        expect(compactColumns[18].isPseudo).toBe(true);
                        expect(compactColumns[18].name).toBe(["columns_schema", "outbound_fk_8"].join("_"));

                        expect(compactColumns[19].isPseudo).toBe(true);
                        expect(compactColumns[19].name).toBe(["columns_schema", "outbound_fk_7"].join("_") + "1");

                        expect(compactColumns[20].isPseudo).toBe(true);
                        expect(compactColumns[20].name).toBe(["columns_schema", "outbound_fk_9"].join("_"));
                    });
                });

                describe('for asset columns,', function () {
                    describe('filname, byte, md5, and sha256 columns', function() {
                        it('should be ignored in edit context.', function() {
                            checkReferenceColumns([{
                                ref: assetRefEntry,
                                expected: [
                                    "id",
                                    ["columns_schema", "table_w_asset_fk_to_outbound"].join("_"),
                                    "col_1", "col_2", "col_asset_2", "col_asset_3", "col_asset_4"
                                ]
                            }]);
                        });

                        it('should not be ignored in other contexts.', function() {
                            expect(assetRefCompactCols.length).toBe(17);
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
                      expect(assetRefCompactCols[11].name).toBe("col_asset_4");
                      expect(assetRefCompactCols[11].isPseudo).toBe(false);
                      expect(assetRefEntry.columns[6].name).toBe("col_asset_4");
                      expect(assetRefEntry.columns[6].isPseudo).toBe(false);
                    });

                    it('if columns has been used as the keyReferenceColumn, should ignore the asset annotation.', function () {
                        expect(assetRefCompactCols[0].name).toBe(["columns_schema", "table_w_asset_key_1"].join("_"));
                        expect(assetRefCompactCols[0].isKey).toBe(true);
                    });

                    it('if column is part of any foreignkeys, should ignore the asset annotation.', function() {
                        expect(assetRefCompactCols[1].name).toBe(["columns_schema", "table_w_asset_fk_to_outbound"].join("_"));
                        expect(assetRefCompactCols[1].isForeignKey).toBe(true);
                    });
                });

                if (!process.env.TRAVIS) {
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
        });

        describe('tuple.values, ', function () {
            describe('when linked data is available, ', function () {
                it('should return a link for PseudoColumns and value for Columns; and respect null values.', function (done) {
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
                        console.dir(err);
                        done.fail();
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
            });

            if (!process.env.TRAVIS) {
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
                    return col.name;
                })).toEqual(jasmine.arrayContaining(test.expected));
            });
        }
    });

}
