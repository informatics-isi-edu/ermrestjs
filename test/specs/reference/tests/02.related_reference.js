var utils = require('./../../../utils/utilities.js');

exports.execute = function(options) {
    describe('.related, ', function() {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            inboundTableName = "inbound_related_reference_table",
            associationTableWithToName = "association_table_with_toname",
            associationTableWithIDDisplayname = "association table displayname",
            associationTableWithID = "association table with id",
            AssociationTableWithExtra = "association_table_with_extra",
            associationTableWithOverlappingCol = "association_table_with_overlapping_col",
            entityId = 9003,
            relatedEntityWithToNameId = 3,
            relatedEntityId = 1,
            limit = 1;

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        var currDate = new Date();
        var currentDateString = options.ermRest._fixedEncodeURIComponent(currDate.getFullYear() + "-" + (currDate.getMonth()+1) + "-" + currDate.getDay());

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

        var pathRelatedWithTuple, compactSelectRef;
        var reference, related, relatedWithTuple, page;

        function checkReferenceColumns(tesCases) {
            tesCases.forEach(function(test){
                expect(test.ref.columns.map(function(col){
                    return (col.isKey || col.isForeignKey || col.isInboundForeignKey) ? col._constraintName : col.displayname.value;
                })).toEqual(test.expected, "missmatch for " + test.title);
            });
        }

        function checkRelated (ref, schema, table, facet, ermrestCompactPath) {
            expect(ref.table.schema.name).toBe(schema, "schema missmatch.");
            expect(ref.table.name).toBe(table, "table missmatch.");
            if (facet) {
                expect(ref.location.facets.decoded).toEqual(facet, "facet missmatch.");
            }

            if (ermrestCompactPath) {
                expect(ref.location.ermrestCompactPath).toEqual(ermrestCompactPath);
            }
        };

        function checkUri (index, expectedTable, expectedFacets) {
            var loc = relatedWithTuple[index].location;
            expect(loc.facets).not.toBeNull("facets was null for tuple index=" + index);
            expect(JSON.stringify(loc.facets.decoded['and'], null, 0)).toEqual(JSON.stringify(expectedFacets, null, 0), "facets was not as expected for tuple index="+ index);
            expect(loc.tableName).toBe(expectedTable, "table name was not as expected for tuple index="+ index);
        }

        function checkFilterProps (rel, hasRootFilter, hasFilterInBetween, leafFilterString, message) {
            expect(rel.pseudoColumn).toBeDefined(true, message + ': isFiltered undefined');
            expect(rel.pseudoColumn.isFiltered).toBe(true, message + ': isFiltered missmatch');
            expect(rel.pseudoColumn.filterProps).toBeDefined(message + ': filterProps undefined');
            expect(rel.pseudoColumn.filterProps.hasRootFilter).toEqual(hasRootFilter, message + ': hasRootFilter missmatch');
            expect(rel.pseudoColumn.filterProps.hasFilterInBetween).toEqual(hasFilterInBetween, message + ': hasFilterInBetween missmatch');
            expect(rel.pseudoColumn.filterProps.leafFilterString).toEqual(leafFilterString, message + ': leafFilterString missmatch');
        };

        beforeAll(function(done) {
            options.ermRest.appLinkFn(appLinkFn);
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function(response) {
                reference = response.contextualize.detailed;
                related = reference.generateRelatedList();
                return reference.read(1);
            }).then(function (responsePage) {
                delete reference._related;
                relatedWithTuple = reference.generateRelatedList(responsePage.tuples[0]);

                compactSelectRef = reference.contextualize.compactSelect;
                return compactSelectRef.read(1);
            }).then(function (page) {
                pathRelatedWithTuple = compactSelectRef.generateRelatedList(page.tuples[0]);
                done();
            }).catch(function(error){
                done.fail(error);
            });
        });

        describe("related reference list, ", function () {

            describe('when visible foreign keys are not defined, ', function() {
                var schemaName2 = "reference_schema_2",
                tableName2 = "reference_table_no_order",
                related2;

                var noOrderUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName2 + ":" + tableName2;

                beforeAll(function(done) {
                    options.ermRest.resolve(noOrderUri, {
                        cid: "test"
                    }).then(function(response) {
                        related2 = response.contextualize.detailed.related;
                        done();
                    }, function(err) {
                        done.fail(err);
                    });
                });

                it('should include all foreign keys.', function() {
                    expect(related2.length).toBe(4);
                });

                it('should be sorted by displayname.', function() {
                    expect(related2[0].displayname.value).toBe("first_related");
                });

                it('should be sorted by order of key columns when displayname is the same.', function (){
                    //NOTE: using the compactPath for checking the equality of reference
                    var expected = "reference_schema_2:reference_table_no_order/(id_1,id_2)=(reference_schema_2:related_reference_no_order:col_from_ref_no_order_1,col_from_ref_no_order_2)";
                    expect(related2[1].location.compactPath).toEqual(expected);
                });

                it('should be sorted by order of foreign key columns when displayname and order of key columns is the same.', function() {
                    var expected = "reference_schema_2:reference_table_no_order/(id_2,id_3)=(reference_schema_2:related_reference_no_order:col_from_ref_no_order_3,col_from_ref_no_order_4)";
                    expect(related2[2].location.compactPath).toEqual(expected);
                });
            });

            describe("when visible foreign keys are defined, ", function () {
                it('should be defined and not empty.', function() {
                    expect(reference.related).toBeDefined();
                    expect(related).not.toEqual([]);
                });

                it('should only include visible foreign keys that are defined in the annotation. Should support path.', function() {
                    expect(related.length).toBe(7);
                });

                describe("regarding column objects defining path.", function () {

                    it ('should ignore the invalid (invalid, no path, non-entity, has aggregate, all-outbound) objects.', function () {
                        expect(pathRelatedWithTuple.length).toBe(10);
                    });

                    it ('should create the reference by using facet syntax (starting from related table with facet on shortestkey of main table.).', function () {
                        checkRelated(
                            pathRelatedWithTuple[0], "reference_schema", "association table with id",
                            {"and": [{"source" :[{"outbound": ["reference_schema","id_fk_association_related_to_reference"]}, "RID"], "choices": [utils.findEntityRID(options, schemaName, tableName, "id", "9003")]}]});

                        checkRelated(
                            pathRelatedWithTuple[3], "reference_schema", "table_w_linked_rowname_fk1",
                            {"and": [{"source" :[{"outbound": ["reference_schema","table_w_linked_rowname_fk1"]}, "RID"], "choices": [utils.findEntityRID(options, schemaName, tableName, "id", "9003")]}]});
                    });

                    it ('should be able to support path with longer length.', function () {
                        checkRelated(
                            pathRelatedWithTuple[1], "reference_schema", "reference_table",
                            {"and":[{"source":[
                                {"inbound": ["reference_schema","fromname_fk_inbound_related_to_reference"]},
                                {"inbound":["reference_schema","fk_to_inbound_related_reference_table"]},
                                {"outbound":["reference_schema","id_fk_association_related_to_reference"]},
                                "RID"
                            ], "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]}]}
                        );
                    });

                    it ("should be able to support paths that start with outbound.", function () {
                        checkRelated(
                            pathRelatedWithTuple[2], "reference_schema", "reference_outbound_1_inbound_1",
                            {"and":[{"source": [
                                {"outbound": ["reference_schema", "reference_outbound_1_inbound_1_fk1"]},
                                {"inbound": ["reference_schema", "reference_table_fk1"]},
                                "RID"
                            ], "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]}]}
                        );
                    });

                    it ("should be able to support paths that have prefix.", function () {
                        checkRelated(
                            pathRelatedWithTuple[4], "reference_schema", "reference_outbound1_inbound1_outbound1",
                            {"and":[{"source": [
                                {"inbound": ["reference_schema", "reference_outbound_1_inbound_1_fk2"]},
                                {"outbound": ["reference_schema", "reference_outbound_1_inbound_1_fk1"]},
                                {"inbound": ["reference_schema", "reference_table_fk1"]},
                                "RID"
                            ], "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]}]}
                        );
                    });

                    it ("should be able to support paths that have recursive prefix.", function () {
                        checkRelated(
                            pathRelatedWithTuple[5], "reference_schema", "reference_outbound1_inbound1_outbound1_inbound1",
                            {"and":[{"source": [
                                {"outbound": ["reference_schema", "reference_outbound1_inbound1_outbound1_inbound1_fk1"]},
                                {"inbound": ["reference_schema", "reference_outbound_1_inbound_1_fk2"]},
                                {"outbound": ["reference_schema", "reference_outbound_1_inbound_1_fk1"]},
                                {"inbound": ["reference_schema", "reference_table_fk1"]},
                                "RID"
                            ], "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]}]}
                        );
                    });

                    it ("should be able to support inbound related with filter", function () {
                        // we cannot guarantee the order of properties so we cannot check the facet object
                        checkRelated(
                            pathRelatedWithTuple[6], "reference_schema", "inbound_related_reference_table", null,
                            [
                                "M:=reference_schema:inbound_related_reference_table",
                                "!(id=-1)/(fk_to_reference%20with%20space)=(reference_schema:reference_table:id)/(RCT::null::;RID::null::)",
                                "RID=" + utils.findEntityRID(options, schemaName, tableName, "id", "9003"),
                                "$M"
                            ].join("/")
                        );

                    });

                    it ("should be able to support pure & binary related with filter", function () {
                        // we cannot guarantee the order of properties so we cannot check the facet object
                        checkRelated(
                            pathRelatedWithTuple[7], "reference_schema", "inbound_related_reference_table", null,
                            [
                                "M:=reference_schema:inbound_related_reference_table",
                                "(RCT::null::;RID::null::)/A:=(id)=(reference_schema:association%20table%20with%20id:id_from_inbound_related_table)",
                                "(id%20from%20ref%20table)=(reference_schema:reference_table:id)/!(RID=-1)",
                                "RID=" + utils.findEntityRID(options, schemaName, tableName, "id", "9003"),
                                "$M"
                            ].join("/")
                        );

                        checkRelated(
                            pathRelatedWithTuple[8], "reference_schema", "inbound_related_reference_table", null,
                            [
                                "M:=reference_schema:inbound_related_reference_table",
                                "A:=(id)=(reference_schema:association%20table%20with%20id:id_from_inbound_related_table)",
                                "(RCT::null::;RID::null::)",
                                "(id%20from%20ref%20table)=(reference_schema:reference_table:id)",
                                "RID=" + utils.findEntityRID(options, schemaName, tableName, "id", "9003"),
                                "$M"
                            ].join("/")
                        );
                    });

                    it ("should be able to support free-form related with filter", function () {
                        // we cannot guarantee the order of properties so we cannot check the facet object
                        checkRelated(
                            pathRelatedWithTuple[9], "reference_schema", "reference_table", null,
                            [
                                "M:=reference_schema:reference_table",
                                "(RCT::null::;RID::null::)/(id)=(reference_schema:association%20table%20with%20id:id%20from%20ref%20table)",
                                "!(RID=-1)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)",
                                "(fk_to_reference_with_fromname)=(reference_schema:reference_table:id)",
                                "!(RCT::lt::" + currentDateString + ")",
                                "RID=" + utils.findEntityRID(options, schemaName, tableName, "id", "9003"),
                                "$M"
                            ].join("/")
                        );
                    });
                });
            });
        });

        describe("related reference APIs, ", function () {
            it('should not be labeled as association when table has extra columns.', function (){
                expect(related[5]._table.name).toBe(AssociationTableWithExtra);
            });

            it('.origFKR should have the correct value', function() {
                expect(related[0].origFKR.toString()).toBe("(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)");
                expect(related[1].origFKR.toString()).toBe('(id)=(reference_schema:inbound_related_reference_table:fk_to_reference%20with%20space)');
                expect(related[2].origFKR.toString()).toBe('(id)=(reference_schema:association_table_with_toname:id_from_ref_table)');
                expect(related[3].origFKR.toString()).toBe('(id)=(reference_schema:association%20table%20with%20id:id%20from%20ref%20table)');
            });

            it ('.compressedDataSource should have the correct value', function () {
                var expectedCompressedDataSources = [
                    [{"i": ["reference_schema", "fromname_fk_inbound_related_to_reference"]}, "RID"],
                    [{"i": ["reference_schema", "fk_inbound_related_to_reference"]}, "id"],
                    [
                        {"key": "path_to_association_table_with_toname"},
                        {"o": ["reference_schema", "association_table_with_toname_id_from_inbound_related_table1"]},
                        "RID"
                    ],
                    [
                        {"i": ["reference_schema", "id_fk_association_related_to_reference"]},
                        {"o": ["reference_schema", "fk_to_inbound_related_reference_table"]},
                        "id"
                    ],
                    [
                        {"i": ["reference_schema", "system_col_fk_asscoation_related_to_reference"]},
                        {"o": ["reference_schema", "association_table_with_system_col_fk_fk2"]},
                        "RID"
                    ],
                    [
                        {"i": ["reference_schema", "extra_fk_association_related_to_reference"]},
                        "RID"
                    ],
                    [
                        {"i": ["reference_schema", "association_table_with_overlapping_col_fk1"]},
                        {"o": ["reference_schema", "association_table_with_overlapping_col_fk2"]},
                        "RID"
                    ]
                ];
                related.forEach(function (rel, i) {
                    expect(related[i].compressedDataSource).toEqual(expectedCompressedDataSources[i], "missmatch for index=" + i);
                });
            });

            describe("for related tables using source path.", function () {
                // what about other APIs?
                it (".compressedDataSource should have the correct value.", function () {
                    var expectedCompressedDataSources = [
                        [{"i": ["reference_schema", "id_fk_association_related_to_reference"]}, "ID"],
                        [
                            {"i": ["reference_schema", "id_fk_association_related_to_reference"]},
                            {"o": ["reference_schema", "fk_to_inbound_related_reference_table"]},
                            {"o": ["reference_schema", "fromname_fk_inbound_related_to_reference"]},
                            "id"
                        ],
                        [
                            {"o": ["reference_schema", "reference_table_fk1"]},
                            {"i": ["reference_schema", "reference_outbound_1_inbound_1_fk1"]},
                            "id"
                        ],
                        [
                            {"i": ["reference_schema", "table_w_linked_rowname_fk1"]},
                            "RID"
                        ],
                        [
                            {"key": "path_to_outbound1_inbound1"},
                            {"o": ["reference_schema", "reference_outbound_1_inbound_1_fk2"]},
                            "RID"
                        ],
                        [
                            {"key": "path_to_outbound1_inbound1_outbound1"},
                            {"i": ["reference_schema", "reference_outbound1_inbound1_outbound1_inbound1_fk1"]},
                            "RID"
                        ],
                        [
                            {"or": [
                                {"f": "RCT", "opr": "::null::"},
                                {"f": "RID", "opr": "::null::"}
                            ]},
                            {"i": ["reference_schema", "fk_inbound_related_to_reference"]},
                            {"f": "id", "opd": "-1", "n": true},
                            "id"
                        ], false, false
                    ];
                    pathRelatedWithTuple.forEach(function (rel, i) {
                        var expVal = expectedCompressedDataSources[i];
                        if (!expVal) {
                            // we cannot easily test the expected value, so just make sure it's not throwing any errors.
                            expect(rel.compressedDataSource).toBeDefined("missmatch for index=" + i);
                        }
                        else {
                            expect(rel.compressedDataSource).toEqual(expVal, "missmatch for index=" + i);
                        }
                    });
                });
            });

            describe('for inbound foreign keys, ', function() {
                it('should have the correct catalog, schema, and table.', function() {
                    expect(related[0]._location.catalog).toBe(catalog_id.toString());
                    expect(related[0]._table.schema.name).toBe(schemaName);
                    expect(related[0]._table.name).toBe(inboundTableName);
                });

                describe('.displayname, ', function() {
                    it('should use from_name when annotation is present.', function() {
                        expect(related[0].displayname.value).toBe("from_name_value");
                    });

                    it('should use the name of the table when annotation is not present.', function() {
                        expect(related[1].displayname.value).toBe("inbound_related_reference_table");
                    });
                });

                describe('.uri, ', function() {
                    var uri1 = singleEnitityUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)";
                    var uri2 = singleEnitityUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference%20with%20space)";

                    describe("without tuple, ", function() {
                        it('should be properly defiend based on schema and not include faceting.', function() {
                            expect(related[0].location.uri).toBe(uri1);
                        });

                        it('should be encoded.', function() {
                            expect(related[1].location.uri).toBe(uri2);
                        });
                    });

                    describe("with tuple defined, ", function () {
                        it('should create the link using faceting (starting from related table with facet based on shortestkey of main table).', function() {

                            checkUri(0, "inbound_related_reference_table", [{
                                "source":[{"outbound":["reference_schema","fromname_fk_inbound_related_to_reference"]},"RID"],
                                "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]
                            }]);

                            checkUri(1, "inbound_related_reference_table", [{
                                "source":[{"outbound":["reference_schema","fk_inbound_related_to_reference"]},"RID"],
                                "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]
                            }]);
                        });
                    });
                });

                it('.columns should be properly defiend based on schema and only in compact/brief context should not include foreign key columns that created the link.', function() {
                    checkReferenceColumns([
                        {
                            title: "detailed context",
                            ref: related[1],
                            expected: [
                                'id',
                                ["reference_schema", "fromname_fk_inbound_related_to_reference"].join("_"), // the fk
                                ["reference_schema", "hidden_fk_inbound_related_to_reference"].join("_"),
                                ["reference_schema", "fk_inbound_related_to_reference"].join("_")
                            ]
                        },
                        {
                            title: "compact/brief context",
                            ref: related[1].contextualize.compactBrief,
                            expected: [
                                "id",
                                ["reference_schema", "fromname_fk_inbound_related_to_reference"].join("_"),
                                ["reference_schema", "hidden_fk_inbound_related_to_reference"].join("_")
                            ]
                        },
                        {
                            title: "compact/brief/inline context",
                            ref: related[1].contextualize.compactBriefInline,
                            expected: [
                                "id",
                                ["reference_schema", "fromname_fk_inbound_related_to_reference"].join("_"),
                                ["reference_schema", "hidden_fk_inbound_related_to_reference"].join("_")
                            ]
                        },
                        {
                            title: "source syntax, detailed context",
                            ref: pathRelatedWithTuple[0],
                            expected: [
                                ["reference_schema", "id_fk_association_related_to_reference"].join("_"), // the fk
                                "ignored column 02", // scalar column based on the fk
                                "ID"
                            ]
                        },
                        {
                            title: "source syntax, compact/brief context",
                            ref: pathRelatedWithTuple[0].contextualize.compactBrief,
                            expected: ["ID"]
                        },
                        {
                            title: "source syntax, compact/brief/inline context",
                            ref: pathRelatedWithTuple[0].contextualize.compactBriefInline,
                            expected: ["ID"]
                        }
                    ]);
                });

                it('.derivedAssociationReference should be undefined', function() {
                    expect(related[0].derivedAssociationReference).toBeUndefined();
                    expect(related[1].derivedAssociationReference).toBeUndefined();
                });

                it('.read should return a Page object that is defined.', function(done) {
                    related[0].sort([{"column":"id", "descending":false}]).read(limit).then(function(response) {
                        page = response;

                        expect(page).toEqual(jasmine.any(Object));
                        expect(page._data[0].id).toBe(relatedEntityWithToNameId.toString());
                        expect(page._data.length).toBe(limit);

                        done();
                    }, function(err) {
                        console.dir(err);
                        done.fail();
                    });

                    related[1].sort([{"column":"id", "descending":false}]).read(limit).then(function(response) {
                        page = response;

                        expect(page).toEqual(jasmine.any(Object));
                        expect(page._data[0].id).toBe(relatedEntityId.toString());
                        expect(page._data.length).toBe(limit);

                        done();
                    }, function(err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('Tuple.getAssociationRef should return null.', function() {
                    var a = page.tuples[0].getAssociationRef({});
                    expect(a).toBe(null);
                });
            });

            describe('for pure and binary association foreign keys, ', function() {
                var pageWithToName, pageWithID;

                it('should have the correct catalog, schema, and table.', function (){
                    expect(related[2]._location.catalog).toBe(catalog_id.toString(), "missmatch for catalog index=2");
                    expect(related[2]._table.name).toBe(inboundTableName, "missmatch for table index=2");

                    expect(related[3]._location.catalog).toBe(catalog_id.toString(), "missmatch for catalog index=3");
                    expect(related[3]._table.name).toBe(inboundTableName, "missmatch for table index=3");

                    expect(related[4]._location.catalog).toBe(catalog_id.toString(), "missmatch for catalog index=4");
                    expect(related[4]._table.name).toBe(inboundTableName, "missmatch for table index=4 (table with system column fk)");

                    expect(related[6]._location.catalog).toBe(catalog_id.toString(), "missmatch for catalog index=6");
                    expect(related[6]._table.name).toBe("table_w_only_composite_key", "missmatch for table index=6 (table with system column fk)");
                });

                describe('.displayname, ', function () {
                    it('should use to_name when annotation is present.', function() {
                        expect(related[2].displayname.value).toBe("to_name_value");
                    });

                    it('should use the displayname of association table when annotation is not present.', function() {
                        expect(related[3].displayname.value).toBe(associationTableWithIDDisplayname);
                    });
                });

                describe('.uri ', function () {
                    describe("without tuple, ", function () {
                        it('.uri should be properly defined based on schema.', function() {
                            expect(related[2].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association_table_with_toname:id_from_ref_table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
                        });

                        it('should be encoded.', function() {
                            expect(related[3].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association%20table%20with%20id:id%20from%20ref%20table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
                        });
                    });

                    describe("with tuple, ", function () {
                        it('should create the link using faceting (starting from related table with facet based on shortestkey of main table).', function() {
                            // eventhough the path is defined with prefix, the revese one is using proper raw path with alias
                            checkUri(2, "inbound_related_reference_table", [{
                                "source":[
                                    {"inbound":["reference_schema","association_table_with_toname_id_from_inbound_related_table1"], "alias": "A"},
                                    {"outbound":["reference_schema","toname_fk_association_related_to_reference"]},
                                    "RID"
                                ],
                                "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]
                            }]);

                            checkUri(3, "inbound_related_reference_table", [{
                                "source":[
                                    {"inbound":["reference_schema","fk_to_inbound_related_reference_table"], "alias": "A"},
                                    {"outbound":["reference_schema","id_fk_association_related_to_reference"]},
                                    "RID"
                                ],
                                "choices":[utils.findEntityRID(options, schemaName, tableName, "id", "9003")]
                            }]);
                        });
                    })
                });

                it('.derivedAssociationReference should be defined.', function() {
                    expect(related[2].derivedAssociationReference._table.name).toBe("association_table_with_toname");
                    expect(related[3].derivedAssociationReference._table.name).toBe("association table with id");
                });

                it('.read should return a Page object that is defined.', function(done) {
                    related[2].sort([{"column":"id", "descending":false}]).read(limit).then(function(response) {
                        pageWithToName = response;

                        expect(pageWithToName).toEqual(jasmine.any(Object));
                        expect(pageWithToName._data[0].id).toBe("1");
                        expect(pageWithToName._data.length).toBe(limit);


                        related[3].sort([{"column":"id", "descending":false}]).read(limit).then(function(response) {
                            pageWithID = response;

                            expect(pageWithID).toEqual(jasmine.any(Object));
                            expect(pageWithID._data[0].id).toBe("2");
                            expect(pageWithID._data.length).toBe(limit);

                            done();
                        }, function(err) {
                            console.dir(err);
                            done.fail();
                        });

                    }, function(err) {
                        console.dir(err);
                        done.fail();
                    });
                });

                it('Tuple.getAssociationRef should return the filtered assocation reference.', function() {
                    var url = options.url + "/catalog/" + catalog_id + "/entity/", ref;

                    ref = pageWithID.tuples[0].getAssociationRef({"id":9003});
                    expect(ref).not.toBe(null);
                    expect(ref.uri).toEqual(url+"reference_schema:association%20table%20with%20id/id%20from%20ref%20table=9003&id_from_inbound_related_table=2");

                    ref = pageWithToName.tuples[0].getAssociationRef({"id":9003});
                    expect(ref).not.toBe(null);
                    expect(ref.uri).toEqual(url + "reference_schema:association_table_with_toname/id_from_ref_table=9003&id_from_inbound_related_table=1");
                });

                it('Tuple.getAssociationRef should return null, if the given data is incomplete.', function() {
                    var ref = pageWithToName.tuples[0].getAssociationRef({"not the id":9003});
                    expect(ref).toBe(null);
                });
            });

            describe('filter in source related APIs, ', function () {
                it ('should return falsy values for related references without filter in source.', function () {
                    related.forEach((rel, i) => {
                        expect(rel.pseudoColumn && rel.isFiltered).toBeFalsy('related isFiltered missmatch for index=' + i);
                    });

                    pathRelatedWithTuple.forEach((rel, i) => {
                        if (i >= 6) return;
                        expect(rel.pseudoColumn && rel.isFiltered).toBeFalsy('path-related isFiltered missmatch for index=' + i);
                    });
                });

                it ('should return proper values for related references with filter in source.', function () {
                    // has root and leaf filters
                    checkFilterProps(pathRelatedWithTuple[6], true, false, '!(id=-1)', 'index = 6');
                    // has root and leaf filters
                    checkFilterProps(pathRelatedWithTuple[7], true, false, '(RCT::null::;RID::null::)', 'index = 7');
                    // only has filter in between
                    checkFilterProps(pathRelatedWithTuple[8], false, true, '', 'index = 8');
                    // has root, in between, and leaf filters
                    checkFilterProps(pathRelatedWithTuple[9], true, true, '(RCT::null::;RID::null::)', 'index = 9');
                });
            });

            it('when table has alternative tables, should not include self-link to the base.', function (done) {
                var schemaName3 = "reference_schema_2",
                tableName3 = "table_w_alternate";

                var tableWAlternateUri = options.url + "/catalog/" + catalog_id + "/entity/"
                + schemaName3 + ":" + tableName3;

                options.ermRest.resolve(tableWAlternateUri, {cid: "test"}).then(function(response) {
                    var rel = response.related;
                    expect(rel.length).toBe(0);
                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });

        describe("integration with other APIs", function () {
            describe("Page.content", function () {
                var testPageContent = function (ref, pageSize, content, done) {
                    options.ermRest.appLinkFn(appLinkFn);
                    ref.read(pageSize).then(function (page) {
                        expect(page.content).toEqual(content, "page.content invalid for related");
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                };

                it ("should use the markdown_pattern defined on the visible-foreign-key annotation.", function (done) {
                    var content = '<p>';
                    content += '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:association%20table%20with%20id/RID=' + utils.findEntityRID(options, schemaName, associationTableWithID, "ID", "2") + '">2</a>';
                    content += ', ';
                    content += '<a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:association%20table%20with%20id/RID=' + utils.findEntityRID(options, schemaName, associationTableWithID, "ID", "3") + '">3</a>';
                    content += '</p>\n';
                    testPageContent(pathRelatedWithTuple[0], 5, content, done);
                })

                it ("should be able to use page_markdown_pattern and have access to the parent attributes.", function (done) {
                    testPageContent(relatedWithTuple[1], 1, '<p>reference_schema:reference_table, parent name=Henry, where id is one of 1</p>\n', done);
                });

                it ("otherwise should use the row_markdown_pattern.", function (done) {
                    testPageContent(pathRelatedWithTuple[2], 1, '<p>01, 1, 1</p>\n', done);
                });

                it ("if none of the markdown_patterns are not defined, should return a list of rownames.", function (done) {
                    content = '<ul>\n';
                    content += '<li><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/RID=' + utils.findEntityRID(options, schemaName, tableName, "id", "9002") + '">Heather</a></li>\n';
                    content += '<li><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/RID=' + utils.findEntityRID(options, schemaName, tableName, "id", "9003") + '">Henry</a></li>\n';
                    content += '</ul>\n';

                    testPageContent(pathRelatedWithTuple[1], 5, content, done);
                });

                it ("if none of the markdown_patterns are defined and the returned values have links, should not add the links.", function (done) {
                    content = '<ul>\n';
                    content += '<li><a href="https://example.com">one</a></li>\n';
                    content += '<li><a href="https://example.com">two</a></li>\n';
                    content += '</ul>\n';
                    testPageContent(pathRelatedWithTuple[3], 3, content, done);
                });
            });
        });
    });
};
