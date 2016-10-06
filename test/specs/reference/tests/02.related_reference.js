exports.execute = function(options) {
    describe('.related, ', function() {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            inboudTableName = "inbound_related_reference_table",
            associationTableWithToName = "association_table_with_toname",
            associationTableWithID = "association_table_with_id",
            associationTableWithIDDisplayname = "association table displayname",
            AssociationTableWithExtra = "association_table_with_extra",
            entityId = 9003,
            relatedEntityId = 3,
            limit = 1;

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        var reference, related;

        function checkReferenceColumns(tesCases) {
            tesCases.forEach(function(test){
                expect(test.ref.columns.map(function(col){
                    return col.name;
                })).toEqual(test.expected);
            });
        }

        beforeAll(function(done) {
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function(response) {
                reference = response.contextualize.detailed;
                related = reference.related;
                done();
            }, function(err) {
                console.dir(err);
                done.fail();
            });
        });

        it('should be defined and not empty.', function() {
            expect(reference.related).toBeDefined();
            expect(reference.related).not.toEqual([]);
        });

        it('should only include visible foreign keys that are defined in the annotation.', function() {
            expect(reference.related.length).toBe(5);
        });

        it('should not be labeled as association when table has extra columns.', function (){
            expect(related[4]._table.name).toBe(AssociationTableWithExtra);
        });

        describe('for inbound foreign keys, ', function() {
            it('should have the correct catalog, schema, and table.', function() {
                expect(related[0]._location.catalog).toBe(catalog_id.toString());
                expect(related[0]._table.schema.name).toBe(schemaName);
                expect(related[0]._table.name).toBe(inboudTableName);
            });

            describe('.displayname, ', function() {
                it('should use from_name when annotation is present.', function() {
                    expect(related[0].displayname).toBe("from_name_value");
                });

                it('should use the name of the table when annotation is not present.', function() {
                    expect(related[1].displayname).toBe("inbound_related_reference_table");
                });
            });

            it('.uri should be properly defiend based on schema.', function() {
                expect(related[0].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)");
                expect(related[1].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference)");
            });

            it('.columns should be properly defiend based on schema', function() {
                checkReferenceColumns([{
                    ref: related[0],
                    expected: [
                        "id", 
                        ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":"), 
                        ["reference_schema","fk_inbound_related_to_reference"].join(":")
                ]}, {
                    ref: related[1],
                    expected: [
                        "id", 
                        ["reference_schema", "fromname_fk_inbound_related_to_reference"].join(":"), 
                        ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":")
                ]}]);
            });

            it('.read should return a Page object that is defined.', function(done) {
                reference.related[0].read(limit).then(function(response) {
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

        });

        describe('for pure and binray association foreign keys, ', function() {
            it('should have the correct catalog, schema, and table.', function (){
                expect(related[2]._location.catalog).toBe(catalog_id.toString());
                expect(related[2]._table.name).toBe(inboudTableName);
            });

            describe('.displayname, ', function (){
                it('should use to_name when annotation is present.', function() {
                  expect(related[2].displayname).toBe("to_name_value");
                });

                it('should use the displayname of assocation table when annotation is not present.', function() {
                  expect(related[3].displayname).toBe(associationTableWithIDDisplayname);
                });
            });

            describe('.columns, ', function() {
                it('should ignore all the foreign keys that create the connection for assocation.', function() {
                    checkReferenceColumns([{
                        ref: related[2],
                        expected:[
                            "id", 
                            ["reference_schema", "fromname_fk_inbound_related_to_reference"].join(":"),
                            ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":"),
                            ["reference_schema", "fk_inbound_related_to_reference"].join(":")
                    ]}]);
                });
                it('should ignore extra serial key columns in the assocation table', function() {
                    checkReferenceColumns([{
                        ref: related[3],
                        expected:[
                            "id", 
                            ["reference_schema", "fromname_fk_inbound_related_to_reference"].join(":"), 
                            ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":"),
                            ["reference_schema", "fk_inbound_related_to_reference"].join(":")
                    ]}]);
                });
            });

            it('.uri should be properly defiend based on schema.', function() {
              expect(related[2].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association_table_with_toname:id_from_ref_table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
              expect(related[3].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association_table_with_id:id_from_ref_table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
            });

            it('.read should return a Page object that is defined.', function(done) {
                related[2].read(limit).then(function(response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page._data[0].id).toBe("1");
                    expect(page._data.length).toBe(limit);

                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });

                related[3].read(limit).then(function(response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page._data[0].id).toBe("2");
                    expect(page._data.length).toBe(limit);

                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });
            });

        });

        describe('when visible foreign keys are not defined, ', function() {
            var schemaName2 = "reference_schema_2",
                tableName2 = "reference_table_no_order",
                related2;

            var noOrderUri = options.url + "/catalog/" + catalog_id + "/entity/"
                + schemaName2 + ":" + tableName2;

            beforeAll(function(done) {
                options.ermRest.resolve(noOrderUri, {
                    cid: "test"
                }).then(function(response) {
                    related2 = response.contextualize.detailed.related;
                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('should include all foreign keys.', function() {
                expect(related2.length).toBe(4);
            });

            it('should be sorted by displayname.', function() {
                expect(related2[0].displayname).toBe("first_related");
            });

            it('should be sorted by order of key columns when displayname is the same.', function (){
                checkReferenceColumns([{
                    ref: related2[1],
                    expected: [
                        ["reference_schema_2","related_reference_no_order_id_fkey1"].join(":"),
                         "col_from_ref_no_order_3", 
                         "col_from_ref_no_order_4", 
                         "col_from_ref_no_order_5",
                          "col_from_ref_no_order_6"
                    ]
                }]);
            });

            it('should be sorted by order of foreign key columns when displayname and order of key columns is the same.', function() {
                checkReferenceColumns([{
                    ref: related2[2],
                    expected:[
                        ["reference_schema_2","related_reference_no_order_id_fkey1"].join(":"), 
                        "col_from_ref_no_order_1", 
                        "col_from_ref_no_order_2", 
                        "col_from_ref_no_order_5", 
                        "col_from_ref_no_order_6"
                    ]
                }]);
            });
        });

    });
};
