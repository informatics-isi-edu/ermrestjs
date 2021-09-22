exports.execute = function (options) {
    var catalog_id = process.env.DEFAULT_CATALOG,
        schemaName = "source_definitions_schema",
        tableNameMain = "main",
        tableNameMainNoAnnot = "main_no_annot",
        tableNameMainTrue = "main_true_col_true_fkeys",
        tableNameMainNoColNoFk = "main_no_col_no_fkeys",
        tableMain, tableMainNoAnnot, tableMainNoColNoFk, tableMainTrue, tableMainSources;

    var testColumns = function (cols, expectedNames) {
        expect(cols.length).toBe(expectedNames.length, "length missmatch");
        for (var i = 0; i < cols.length; i++) {
            expect(cols[i].name).toEqual(expectedNames[i], "element index=" + i + " missmatch");
        }
    }

    var testForeignKeys = function (fkeys, expectedNames) {
        expect(fkeys.length).toBe(expectedNames.length, "fkeys length missmatch.");
        expect(fkeys.map(function (fk) {
            return fk.constraint_names[0];
        })).toEqual(jasmine.arrayContaining(expectedNames), "fkeys elements missmatch.");
    }

    var testSourceWrapperAPIs = function (obj, reverse, isLeft, outAlias, expectedString, expectedRawSource) {
        expect(obj.toString(reverse, isLeft, outAlias)).toEqual(expectedString, "toString missmatch");

        var src = obj.getRawSourcePath(reverse, outAlias);
        expect(JSON.stringify(src)).toEqual(JSON.stringify(expectedRawSource), "rawSource missmatch");
    }

    beforeAll(function (done) {
        var schema = options.catalog.schemas.get(schemaName);
        tableMain = schema.tables.get(tableNameMain);
        tableMainNoAnnot = schema.tables.get(tableNameMainNoAnnot);
        tableMainNoColNoFk = schema.tables.get(tableNameMainNoColNoFk);
        tableMainTrue = schema.tables.get(tableNameMainTrue);
        done();
    });

    describe("source definitions", function () {
        describe("columns, ", function () {
            it ("when annotation is missing, should return all the columns.", function () {
                testColumns(tableMainNoAnnot.sourceDefinitions.columns, ["id", "col", "RID", "RCT", "RMT", "RCB", "RMB"]);
            });

            it("when annotation is defined and columns is true, shoruld return all the columns.", function () {
                testColumns(tableMainTrue.sourceDefinitions.columns, ["id", "col",  "RID", "RCT", "RMT", "RCB", "RMB"]);
            });

            it ("when annotation is defined but columns is not a defined array, should return empty.", function () {
                testColumns(tableMainNoColNoFk.sourceDefinitions.columns, []);
            });

            it ("should validate the defined columns.", function () {
                testColumns(tableMain.sourceDefinitions.columns, ["col"]);
            });
        });

        describe("fkeys", function () {
            it ("when annotation is missing, should return all the foreignKeys.", function () {
                testForeignKeys(tableMainNoAnnot.sourceDefinitions.fkeys, [["source_definitions_schema", "main_no_annot_fk1"], ["source_definitions_schema", "main_no_annot_fk2"]]);
            });

            it("when annotation is defined and fkeys is true, shoruld return all the foreignKeys.", function () {
                testForeignKeys(tableMainTrue.sourceDefinitions.fkeys, [["source_definitions_schema", "main_true_col_true_fkeys_fk1"], ["source_definitions_schema", "main_true_col_true_fkeys_fk2"]]);
            });

            it ("when annotation is defined but fkeys is not a defined array, should return empty.", function () {
                testForeignKeys(tableMainNoColNoFk.sourceDefinitions.fkeys, []);
            });

            it ("should validate the defined foreignKeys.", function () {
                testForeignKeys(tableMain.sourceDefinitions.fkeys, [["source_definitions_schema", "main_fk2"]]);
            });
        });

        describe("sources and sourceMapping, ", function () {
            it ("when annotation is missing should return empty array.", function () {
                expect(tableMainNoAnnot.sourceDefinitions.sources).toEqual({});
            });

            describe("when annotation is defined, ", function () {
                it ("should validate the sources and allow all different column types.", function () {
                    tableMainSources = tableMain.sourceDefinitions.sources;
                    var expectedSources = {
                        "new_col": {
                            name: "col",
                            columnName: "col",
                            tableName: "main",
                            isHash: false,
                            hasPath: false,
                            hasInbound: false,
                            isEntityMode: false,
                            foreignKeyPathLength: 0
                        },
                        "new_col_2": {
                            name: "col",
                            columnName: "col",
                            tableName: "main",
                            isHash: false,
                            hasPath: false,
                            hasInbound: false,
                            isEntityMode: false
                        },
                        "fk1_col_entity": {
                            name: "DfGbmoqMIfSqDHRJasrtnQ",
                            columnName: "RID",
                            tableName: "main",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true
                        },
                        "fk1_col_scalar": {
                            name: "KAR6cMQDIO5pmnfhz5d4fw",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: false
                        },
                        "fk1_col_entity_duplicate": {
                            name: "DfGbmoqMIfSqDHRJasrtnQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true
                        },
                        "fk1_col_scalar_duplicate": {
                            name: "KAR6cMQDIO5pmnfhz5d4fw",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: false
                        },
                        "all_outbound_col": {
                            name: "TCvUzQfnU6gwYiBVTtE7jQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true
                        },
                        "inbound1_col": {
                            name: "gYt7pa2yjoSRQ4pgF9KEWQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "inbound1_col_2": {
                            name: "gYt7pa2yjoSRQ4pgF9KEWQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_cnt": {
                            name: "hVBgA7x0-AB8fNuiQ0uGYA",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_cnt_d": {
                            name: "Ym148G91WOlKt5GWzpq7lQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_min": {
                            name: "ii9Jz3vgiw-G00TDffG4ZQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_max": {
                            name: "raE5u8lqi8fLPc9SpChLtQ",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_array": {
                            name: "W-TwpGoWV0qkZnBXm2O97w",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_array_d_entity": {
                            name: "5KvRCbKSwkHPj74dunY-Xw",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true
                        },
                        "agg1_array_d": {
                            name: "Jb0K5FtG2b6SgdvH0Yud1w",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: false
                        },
                        "agg1_array_d_duplicate": {
                            name: "Jb0K5FtG2b6SgdvH0Yud1w",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: false
                        },
                        "path_to_outbound2_outbound1": {
                            name: "f3s1MZ913ANjVbDks5Xseg",
                            columnName: "RID",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true,
                            foreignKeyPathLength: 2
                        },
                        "path_to_outbound2_outbound1_w_prefix_diff_col": {
                            name: "sDfbEvnyAsNNIsAWqBgviw",
                            columnName: "id",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true,
                            foreignKeyPathLength: 2
                        },
                        "path_to_outbound2_outbound1_w_prefix_diff_col_recursive" :{
                            name: "x90z0fm7v_jUfKyJCXw_zA",
                            columnName: "col",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: false,
                            foreignKeyPathLength: 2
                        },
                        "path_to_outbound2_outbound1_outbound1_w_prefix": {
                            name: "W5dDGANuLo2PFmh44iiKFQ",
                            columnName: "RID",
                            tableName: "outbound2_outbound1_outbound1",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true,
                            foreignKeyPathLength: 3
                        },
                        "path_to_outbound2_outbound1_outbound1_wo_prefix": {
                            name: "W5dDGANuLo2PFmh44iiKFQ",
                            columnName: "RID",
                            tableName: "outbound2_outbound1_outbound1",
                            isHash: true,
                            hasPath: true,
                            hasInbound: false,
                            isEntityMode: true,
                            foreignKeyPathLength: 3
                        },
                        "path_to_outbound2_outbound1_inbound1_w_prefix": {
                            name: "CDEmeAy5bMfHEbHAKpaisQ",
                            columnName: "RID",
                            tableName: "outbound2_outbound1_inbound1",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true,
                            foreignKeyPathLength: 3
                        },
                        "path_to_outbound2_outbound1_inbound1_inbound1_w_recursive_prefix": {
                            name: "MeXAc4r6YsX7jA5uTcUzOg",
                            columnName: "RID",
                            tableName: "outbound2_outbound1_inbound1_inbound1",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true,
                            foreignKeyPathLength: 4
                        },
                        "path_to_outbound2_outbound1_inbound1_inbound1_wo_prefix": {
                            name: "MeXAc4r6YsX7jA5uTcUzOg",
                            columnName: "RID",
                            tableName: "outbound2_outbound1_inbound1_inbound1",
                            isHash: true,
                            hasPath: true,
                            hasInbound: true,
                            isEntityMode: true,
                            foreignKeyPathLength: 4
                        },
                    };
                    for (var key in expectedSources) {
                        if (!(expectedSources.hasOwnProperty(key))) continue;

                        expect(key in tableMainSources).toBe(true, "key `" + key + "`: missing from sources");
                        var s =  tableMainSources[key];
                        var expectedS = expectedSources[key];
                        expect(s.column.name).toBe(expectedS.columnName, "key `" + key + "`: columnName missmatch.");
                        // expect(s.column.table.name).toBe(expectedS.tableName, "key `" + key + "`: tableName missmatch.")
                        ["name", "isHash", "hasPath", "hasInbound", "isEntityMode", "foreignKeyPathLength"].forEach(function (attr) {
                            if (!(attr in expectedS)) return;
                            expect(s[attr]).toBe(expectedS[attr], "key `" + key + "`: " + attr + " missmatch.");
                        })

                    }
                    expect(Object.keys(tableMainSources).length).toBe(Object.keys(expectedSources).length, "keys length missmatch.");
                });

                it ("sourceMapping should be defined properly.", function () {
                    var tableMainMapping = tableMain.sourceDefinitions.sourceMapping;
                    var expectedSourceMapping = {
                        "col": ["new_col", "new_col_2"],
                        "KAR6cMQDIO5pmnfhz5d4fw": ["fk1_col_scalar", "fk1_col_scalar_duplicate"],
                        "DfGbmoqMIfSqDHRJasrtnQ": ["fk1_col_entity", "fk1_col_entity_duplicate"],
                        "TCvUzQfnU6gwYiBVTtE7jQ": ["all_outbound_col"],
                        "gYt7pa2yjoSRQ4pgF9KEWQ": ["inbound1_col", "inbound1_col_2"],
                        "hVBgA7x0-AB8fNuiQ0uGYA": ["agg1_cnt"],
                        "Ym148G91WOlKt5GWzpq7lQ": ["agg1_cnt_d"],
                        "raE5u8lqi8fLPc9SpChLtQ": ["agg1_max"],
                        "ii9Jz3vgiw-G00TDffG4ZQ": ["agg1_min"],
                        "W-TwpGoWV0qkZnBXm2O97w": ["agg1_array"],
                        "5KvRCbKSwkHPj74dunY-Xw": ["agg1_array_d_entity"],
                        "Jb0K5FtG2b6SgdvH0Yud1w": ["agg1_array_d", "agg1_array_d_duplicate"],
                        "f3s1MZ913ANjVbDks5Xseg": ["path_to_outbound2_outbound1"],
                        "sDfbEvnyAsNNIsAWqBgviw": ["path_to_outbound2_outbound1_w_prefix_diff_col"],
                        "x90z0fm7v_jUfKyJCXw_zA": ["path_to_outbound2_outbound1_w_prefix_diff_col_recursive"],
                        "W5dDGANuLo2PFmh44iiKFQ": ["path_to_outbound2_outbound1_outbound1_w_prefix", "path_to_outbound2_outbound1_outbound1_wo_prefix"],
                        "CDEmeAy5bMfHEbHAKpaisQ": ["path_to_outbound2_outbound1_inbound1_w_prefix"],
                        "MeXAc4r6YsX7jA5uTcUzOg": ["path_to_outbound2_outbound1_inbound1_inbound1_w_recursive_prefix", "path_to_outbound2_outbound1_inbound1_inbound1_wo_prefix"]
                    };

                    for (var key in expectedSourceMapping) {
                        if (!expectedSourceMapping.hasOwnProperty(key)) continue;
                        expect(key in tableMainMapping).toBe(true, "key `" + key + "`: missing from source mapping.");
                        expect(tableMainMapping[key].length).toBe(expectedSourceMapping[key].length, "key `" + key + "`: length missmatch.");

                        expectedSourceMapping[key].forEach(function (val, index) {
                            expect(tableMainMapping[key].indexOf(val)).not.toBe(-1, "key `" + key + "`: name `" + val + "` doesn't exist.");
                        });
                    }

                    expect(Object.keys(tableMainMapping).length).toBe(Object.keys(expectedSourceMapping).length, "keys length missmatch");
                });

                describe("regarding SourceObjectWrapper.toString and SourceObjectWrapper.getRawSourcePath", function () {
                   describe("when reverse=false is passed", function () {
                        it ("should be able to handle sources without any path", function () {
                            testSourceWrapperAPIs(tableMainSources["new_col"], false, true, "alias", "", []);
                        });

                        it ("should be able to handle sources with path", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_inbound1_inbound1_wo_prefix"],
                                false,
                                true,
                                "alias",
                                [
                                    "left(id)=(source_definitions_schema:outbound2:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1_inbound1:id)",
                                    "alias:=left(id)=(source_definitions_schema:outbound2_outbound1_inbound1_inbound1:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "main_fk2"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_inbound1_fk1"], "alias": "alias"}
                                ]
                            );
                        });

                        it ("should be able to handle sources with path prefix", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_inbound1_w_prefix"],
                                false,
                                true,
                                "alias",
                                [
                                    "left(id)=(source_definitions_schema:outbound2:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1:id)",
                                    "alias:=left(id)=(source_definitions_schema:outbound2_outbound1_inbound1:id)",
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "main_fk2"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_fk1"], "alias": "alias"}
                                ]
                            );
                        });

                        it ("should be able to handle sources with path prefix that just change end column", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_w_prefix_diff_col"],
                                false,
                                true,
                                "alias",
                                [
                                    "left(id)=(source_definitions_schema:outbound2:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "main_fk2"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_fk1"]}
                                ]
                            );
                        });

                        it ("should be able to handle sources with path prefix that just change end column (recursive)", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_w_prefix_diff_col_recursive"],
                                false,
                                true,
                                "alias",
                                [
                                    "left(id)=(source_definitions_schema:outbound2:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "main_fk2"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_fk1"]}
                                ]
                            );
                        });

                        it ("should be bale to handle sources with recursive path prefix", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_inbound1_inbound1_w_recursive_prefix"],
                                false,
                                true,
                                "alias",
                                [
                                    "left(id)=(source_definitions_schema:outbound2:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1:id)",
                                    "left(id)=(source_definitions_schema:outbound2_outbound1_inbound1:id)",
                                    "alias:=left(id)=(source_definitions_schema:outbound2_outbound1_inbound1_inbound1:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "main_fk2"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_inbound1_fk1"], "alias": "alias"}
                                ]
                            );
                        });
                   });

                   describe("when reverse=true is passed", function () {
                        it ("should be able to handle sources without any path", function () {
                            testSourceWrapperAPIs(tableMainSources["new_col"], true, false, "", "", []);
                        });

                        it ("should be able to handle sources with path", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_inbound1_inbound1_wo_prefix"],
                                true,
                                false,
                                "",
                                [
                                    "(id)=(source_definitions_schema:outbound2_outbound1_inbound1:id)",
                                    "(id)=(source_definitions_schema:outbound2_outbound1:id)",
                                    "(id)=(source_definitions_schema:outbound2:id)",
                                    "(id)=(source_definitions_schema:main:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_inbound1_fk1"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "main_fk2"]}
                                ]
                            );
                        });

                        it ("should be able to handle sources with path prefix that just change end column", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_w_prefix_diff_col"],
                                true,
                                false,
                                "",
                                [
                                    "(id)=(source_definitions_schema:outbound2:id)",
                                    "(id)=(source_definitions_schema:main:id)"
                                ].join("/"),
                                [
                                    {"inbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "main_fk2"]}
                                ]
                            );
                        });

                        it ("should be able to handle sources with path prefix that just change end column (recursive)", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_w_prefix_diff_col_recursive"],
                                true,
                                false,
                                "",
                                [
                                    "(id)=(source_definitions_schema:outbound2:id)",
                                    "(id)=(source_definitions_schema:main:id)"
                                ].join("/"),
                                [
                                    {"inbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "main_fk2"]}
                                ]
                            );
                        });

                        it ("should be able to handle sources with path prefix", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_inbound1_w_prefix"],
                                true,
                                false,
                                "",
                                [
                                    "(id)=(source_definitions_schema:outbound2_outbound1:id)/" +
                                    "(id)=(source_definitions_schema:outbound2:id)/" +
                                    "(id)=(source_definitions_schema:main:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "main_fk2"]}
                                ]
                            );
                        });

                        it ("should be bale to handle sources with recursive path prefix", function () {
                            testSourceWrapperAPIs(
                                tableMainSources["path_to_outbound2_outbound1_inbound1_inbound1_w_recursive_prefix"],
                                true,
                                false   ,
                                "",
                                [
                                    "(id)=(source_definitions_schema:outbound2_outbound1_inbound1:id)/" +
                                    "(id)=(source_definitions_schema:outbound2_outbound1:id)/" +
                                    "(id)=(source_definitions_schema:outbound2:id)/" +
                                    "(id)=(source_definitions_schema:main:id)"
                                ].join("/"),
                                [
                                    {"outbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_inbound1_fk1"]},
                                    {"outbound": ["source_definitions_schema", "outbound2_outbound1_inbound1_fk1"]},
                                    {"inbound": ["source_definitions_schema", "outbound2_fk1"]},
                                    {"inbound": ["source_definitions_schema", "main_fk2"]}
                                ]
                            );
                        });
                   });

                });
            });

        });
    });

};
