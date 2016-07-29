exports.execute = function(options) {

    describe('About foreign keys, ', function() {
        var schemaName1 = "common_schema_1",
            schemaName2 = "common_schema_2";
        var table1_schema1, // has two outbound fks to table2_schema1. with foreign-key annotation.
            table2_schema1, // has outbound fk to table1_schema2.
            table1_schema2, // doesn't have any outbount foreignkeys. in different schema.
            catalog;

        beforeAll(function(done) {
            catalog = options.catalog;
            table1_schema1 = catalog.schemas.get(schemaName1).tables.get('table_1_schema_1');
            table2_schema1 = catalog.schemas.get(schemaName1).tables.get('table_2_schema_1');
            table1_schema2 = catalog.schemas.get(schemaName2).tables.get('table_1_schema_2');
            done();
        });

        // Test Cases: 
        describe('foreignKeys in Table class, ', function() {

            it('should be defined.', function() {
                expect(table1_schema1.foreignKeys).toBeDefined();
                expect(table2_schema1.foreignKeys).toBeDefined();
                expect(table1_schema2.foreignKeys).toBeDefined();
            });

            describe('.all() ', function() {
                it('should return the foreign keys that are defined in schema.', function() {
                    var output = [
                        "common_schema_1:table_1_schema_1:first_fk_from_table_2>common_schema_1:table_2_schema_1:table_2_key",
                        "common_schema_1:table_1_schema_1:second_fk_from_table_2>common_schema_1:table_2_schema_1:table_2_key"
                    ];
                    expect(table1_schema1.foreignKeys.all().map(function(fk) {
                        return fk.toString();
                    })).toHaveSameItems(output, true);
                });

                it('should support foreign keys from different schemas.', function() {
                    var output = ["common_schema_1:table_2_schema_1:fk_1_from_table_1_schema_2,common_schema_1:table_2_schema_1:fk_2_from_table_1_schema_2>common_schema_2:table_1_schema_2:table_1_first_key,common_schema_2:table_1_schema_2:table_1_second_key"];
                    expect(table2_schema1.foreignKeys.all().map(function(fk) {
                        return fk.toString();
                    })).toHaveSameItems(output, true);
                });

                it('should return an empty array when table does not have any foreign keys.', function() {
                    expect(table1_schema2.foreignKeys.all()).toHaveSameItems([]);
                });
            });

            describe('.colsets() ', function() {
                it('should return the columns that are defined in foreign keys in schema.', function() {
                    var output = ["common_schema_1:table_1_schema_1:first_fk_from_table_2", "common_schema_1:table_1_schema_1:second_fk_from_table_2"];
                    expect(table1_schema1.foreignKeys.colsets().map(function(colset) {
                        return colset.toString();
                    })).toHaveSameItems(output, true);
                });

                it('should support foreign keys from different schemas.', function() {
                    var output = ["common_schema_1:table_2_schema_1:fk_1_from_table_1_schema_2,common_schema_1:table_2_schema_1:fk_2_from_table_1_schema_2"];
                    expect(table2_schema1.foreignKeys.colsets().map(function(colset) {
                        return colset.toString();
                    })).toHaveSameItems(output, true);
                });

                it('should return an empty array when table does not have any foreign keys.', function() {
                    expect(table1_schema2.foreignKeys.all()).toHaveSameItems([]);
                });
            });

            describe('.mappings() ', function() {
                it('should return the foreign keys that are defined in schema.', function() {
                    var output = [
                        "common_schema_1:table_1_schema_1:first_fk_from_table_2>common_schema_1:table_2_schema_1:table_2_key",
                        "common_schema_1:table_1_schema_1:second_fk_from_table_2>common_schema_1:table_2_schema_1:table_2_key"
                    ];
                    expect(table1_schema1.foreignKeys.mappings().map(function(fk) {
                        return fk.toString();
                    })).toHaveSameItems(output, true);
                });

                it('should support foreign keys from different schemas.', function() {
                    var output = ["common_schema_1:table_2_schema_1:fk_1_from_table_1_schema_2,common_schema_1:table_2_schema_1:fk_2_from_table_1_schema_2>common_schema_2:table_1_schema_2:table_1_first_key,common_schema_2:table_1_schema_2:table_1_second_key"];
                    expect(table2_schema1.foreignKeys.mappings().map(function(fk) {
                        return fk.toString();
                    })).toHaveSameItems(output, true);
                });

                it('should return an empty array when table does not have any foreign keys.', function() {
                    expect(table1_schema2.foreignKeys.mappings()).toHaveSameItems([]);
                });
            });

            it('.get(colset) should throw exception when colset is not in foreignkeys.', function() {
                // NOTE cannot test other cases, since cannot create colset object.
                expect(function() {
                    table1_schema2.foreignKeys.get({});
                }).toThrow();
            });

            it('.length() should be properly defined based on schemas.', function() {
                expect(table1_schema1.foreignKeys.length()).toBe(2);
                expect(table2_schema1.foreignKeys.length()).toBe(1);
                expect(table1_schema2.foreignKeys.length()).toBe(0);
            });

        });

        describe('referredBy in Table class,', function() {
            it('should return the inbound foreign keys that are defined in schema.', function() {
                var output = [
                    "common_schema_1:table_1_schema_1:first_fk_from_table_2>common_schema_1:table_2_schema_1:table_2_key",
                    "common_schema_1:table_1_schema_1:second_fk_from_table_2>common_schema_1:table_2_schema_1:table_2_key"
                ];
                expect(table2_schema1.referredBy.all().map(function(fk) {
                    return fk.toString();
                })).toHaveSameItems(output, true);
            });

            it('should support foreign keys from different schemas.', function() {
                var output = ["common_schema_1:table_2_schema_1:fk_1_from_table_1_schema_2,common_schema_1:table_2_schema_1:fk_2_from_table_1_schema_2>common_schema_2:table_1_schema_2:table_1_first_key,common_schema_2:table_1_schema_2:table_1_second_key"];
                expect(table1_schema2.referredBy.all().map(function(fk) {
                    return fk.toString();
                })).toHaveSameItems(output, true);
            });

            it('should return an empty array when table does not have any inbound foreign keys.', function() {
                expect(table1_schema1.referredBy.all()).toHaveSameItems([]);
            });
        });

        describe('ForeignKeyRef class, ', function() {
            describe('.annotations ', function() {
                it('should return the annotations that are defined in schema.', function() {
                    // defined
                    var table1_schema1_fks = table1_schema1.foreignKeys;
                    for (var i = 0; i < table1_schema1_fks.length; i++) {
                        // NOTE: this if statement assumes that only one foreignKey in table1_schema1 has annotation.
                        if (table1_schema1_fks[i].annotations.length()) {
                            var annotation = table1_schema1_fks[i].annotations;

                            expect(annotation.contains("tag:isrd.isi.edu,2016:foreign-key")).toBe(true);
                            expect(annotation.get("tag:isrd.isi.edu,2016:foreign-key").content).toEqual({
                                "from_name": "from_name_value",
                                "to_name": "to_name_value"
                            });
                        } else {
                            expect(table2_schema1.foreignKeys.all()[0].annotations.all()).toHaveSameItems([]);
                        }
                    }
                });

                it('should return an empty array when annotations are not defined.', function() {
                    expect(table2_schema1.foreignKeys.all()[0].annotations.all()).toHaveSameItems([]);
                });
            })

            describe('.key ', function() {
                it('.key should be properly defined based on schema.', function() {
                    var fk;
                    for (var i = 0; i < table1_schema1.foreignKeys; i++) {
                        fk = table1_schema1.foreignKeys[i];
                        expect(fk.key.toBeDefined());
                        expect(fk.key.table.name).toBe("table_2_schema_1");
                    }
                });

                it('should support multiple schemas.', function() {
                    var fk = table2_schema1.foreignKeys.all()[0];
                    expect(fk.key).toBeDefined();
                    expect(fk.key.table.name).toBe("table_1_schema_2");
                });

            })

            describe('.constraint_names ', function() {
                it('shold use the explicitly defined names in schema.', function() {
                    table1_schema1.foreignKeys.all().forEach(function(fk, index) {
                        // NOTE: this if statement assumes that foreignKey with annotation in table1_schema1 has defiend names.
                        if (fk.annotations.length() > 0) {
                            expect(fk.constraint_names).toEqual([
                                ["common_schema_1", "table_1_first_fk_name_1"],
                                ["common_schema_1", "table_1_first_fk_name_2"]
                            ]);
                        }
                    });
                });

                it('should use the value that ermrest automatically generated when it was not explicitly defined in schema.', function() {
                    // NOTE: ermrest creates a default constraint_name for fks when they are not explicitly defined.
                    expect(table2_schema1.foreignKeys.all()[0].constraint_names[0].join("|")).toBeAnyOf([
                        'common_schema_1|table_2_schema_1_fk_1_from_table_1_schema_2_fkey1',
                        'common_schema_1|table_2_schema_1_fk_2_from_table_1_schema_2_fkey1'
                    ]);
                });
            });

            describe('.from_name and .to_name ', function() {
                it('should return the values that are defined in foreign-key annotation.', function() {
                    table1_schema1.foreignKeys.all().forEach(function(fk, index) {
                        // NOTE: this if statement assumes that only one foreignKey in table1_schema1 has annotation.
                        //TODO wtf
                        if (fk.annotations.length() > 0) {
                            expect(fk.from_name).toBe("from_name_value");
                            expect(fk.to_name).toBe("to_name_value");
                        }
                    });
                });

                it('should return empty strings when annotations are not defined.', function() {
                    expect(table2_schema1.foreignKeys.all()[0].from_name).toBe("");
                    expect(table2_schema1.foreignKeys.all()[0].to_name).toBe("");
                });
            });

            it('.colset should be properly defined based on schema and support composite keys and multiple schemas.', function() {
                var fk = table2_schema1.foreignKeys.all()[0];
                expect(fk.colset).toBeDefined();
                var col_names = Array.prototype.map.call(fk.colset.columns, function(column) {
                    return column.name;
                });
                expect(col_names).toHaveSameItems(["fk_1_from_table_1_schema_2", "fk_2_from_table_1_schema_2"], true);
            });
        });
    });
};