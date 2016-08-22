exports.execute = function(options) {
    describe('.related, ', function() {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            inboudTableName = "inbound_related_reference_table",
            AssociationTableWithToName = "association_table_with_toname",
            AssociationTableWithID = "association_table_with_id",
            entityId = 9003,
            relatedEntityId = 3,
            limit = 1;

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        var reference, related;

        beforeAll(function(done) {
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function(response) {
                reference = response.contextualize.record;
                related = reference.related;
                done();
            }, function(err) {
                console.dir(err);
                done.fail();
            })
        });

        it('should be defined and not empty.', function() {
            expect(reference.related).toBeDefined();
            expect(reference.related).not.toEqual([]);
        });

        it('should only include visible foreign keys that are defined in the annotation.', function() {
            expect(reference.related.length).toBe(4);
        });

        describe('for inbound foreign keys, ', function() {
            it('should have the correct catalog, schema, and table.', function() {
                expect(related[0]._catalogId).toBe(catalog_id.toString());
                expect(related[0]._schemaName).toBe(schemaName);
                expect(related[0]._tableName).toBe(inboudTableName);
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
                var cases = [{
                    ref: related[0],
                    expected: ["id", "fk_to_reference_hidden", "fk_to_reference"]
                }, {
                    ref: related[1],
                    expected: ["id", "fk_to_reference_with_fromname", "fk_to_reference_hidden"]
                }];
                cases.forEach(function(test){
                    expect(test.ref.columns.map(function(col){
                        return col.name;
                    })).toEqual(test.expected);
                });
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
                expect(related[2]._catalogId).toBe(catalog_id.toString());
                expect(related[2]._schemaName).toBe(schemaName);
                expect(related[2]._tableName).toBe(inboudTableName);
            });

            describe('.displayname, ', function (){
                it('should use to_name when annotation is present.', function() {
                  expect(related[2].displayname).toBe("to_name_value");
                });

                it('should use the name of the table when annotation is not present.', function() {
                  expect(related[3].displayname).toBe(inboudTableName);
                });
            });

            it('.uri should be properly defiend based on schema.', function() {
              expect(related[2].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association_table_with_toname:id_from_ref_table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
              expect(related[3].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association_table_with_id:id_from_ref_table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
            });

            it('.columns should be properly defiend based on schema', function() {
              [related[2], related[3]].forEach(function(ref){
                  expect(ref.columns.map(function(col){
                      return col.name;
                  })).toEqual(["id", "fk_to_reference_with_fromname", "fk_to_reference_hidden", "fk_to_reference"]);
              });
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
    });
};
