exports.execute = function(options) {
    describe('.related, ', function() {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            inboudTableName = "inbound_related_reference_table",
            associationTableWithToName = "association_table_with_toname",
            associationTableWithIDDisplayname = "association table displayname",
            AssociationTableWithExtra = "association_table_with_extra",
            entityId = 9003,
            relatedEntityWithToNameId = 3,
            relatedEntityId = 1,
            limit = 1;

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + tableName + "/id=" + entityId;

        var reference, related, page;

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

        it('.origFKR should have the correct value', function() {
            expect(related[0].origFKR.toString()).toBe("(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)");
            expect(related[1].origFKR.toString()).toBe('(id)=(reference_schema:inbound_related_reference_table:fk_to_reference%20with%20space)');
            expect(related[2].origFKR.toString()).toBe('(id)=(reference_schema:association_table_with_toname:id_from_ref_table)');
            expect(related[3].origFKR.toString()).toBe('(id)=(reference_schema:association%20table%20with%20id:id%20from%20ref%20table)');
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

            describe('.uri', function() {
                it('should be properly defiend based on schema.', function() {
                    expect(related[0].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference_with_fromname)");
                });
                
                it('should be encoded.', function() {
                    expect(related[1].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:inbound_related_reference_table:fk_to_reference%20with%20space)");
                });
            });

            it('.columns should be properly defiend based on schema and not include foreign key columns.', function() {
                checkReferenceColumns([{
                    ref: related[0],
                    expected: [
                        ["reference_schema", "inbound_related_reference_key"].join(":"), 
                        ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":"), 
                        ["reference_schema", "fk_inbound_related_to_reference"].join(":")
                ]}, {
                    ref: related[1].contextualize.compactBrief,
                    expected: [
                        "id", 
                        ["reference_schema", "fromname_fk_inbound_related_to_reference"].join(":"), 
                        ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":")
                ]}]);
            });

            it('._derivedAssociationRef should be undefined', function() {
                expect(related[0]._derivedAssociationRef).toBeUndefined();
                expect(related[1]._derivedAssociationRef).toBeUndefined();
            });

            it('.read should return a Page object that is defined.', function(done) {
                reference.related[0].read(limit).then(function(response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page._data[0].id).toBe(relatedEntityWithToNameId.toString());
                    expect(page._data.length).toBe(limit);

                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });

                reference.related[1].read(limit).then(function(response) {
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

        describe('for pure and binray association foreign keys, ', function() {
            var pageWithToName, pageWithID;

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
                            ["reference_schema", "inbound_related_reference_key"].join(":"), 
                            ["reference_schema", "fromname_fk_inbound_related_to_reference"].join(":"),
                            ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":"),
                            ["reference_schema", "fk_inbound_related_to_reference"].join(":")
                    ]}]);
                });
                it('should ignore extra serial key columns in the assocation table', function() {
                    checkReferenceColumns([{
                        ref: related[3],
                        expected:[
                            ["reference_schema", "inbound_related_reference_key"].join(":"), 
                            ["reference_schema", "fromname_fk_inbound_related_to_reference"].join(":"), 
                            ["reference_schema", "hidden_fk_inbound_related_to_reference"].join(":"),
                            ["reference_schema", "fk_inbound_related_to_reference"].join(":")
                    ]}]);
                });
            });

            describe('.uri ', function () {
                it('.uri should be properly defiend based on schema.', function() {
                    expect(related[2].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association_table_with_toname:id_from_ref_table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
                });

                it('should be encoded.', function() {
                    expect(related[3].uri).toBe(singleEnitityUri + "/(id)=(reference_schema:association%20table%20with%20id:id%20from%20ref%20table)/(id_from_inbound_related_table)=(reference_schema:inbound_related_reference_table:id)");
                });
            });

            it('._derivedAssociationRef should be defined.', function() {
                expect(related[2]._derivedAssociationRef._table.name).toBe("association_table_with_toname");
                expect(related[3]._derivedAssociationRef._table.name).toBe("association table with id");
            });

            it('.contextualize.entryEdit/.entryCreate/.entry should be created based on the assocation table rather than the reference it is referring to.', function(){
                var refs;
                refs = [ related[2].contextualize.entryEdit, related[2].contextualize.entryCreate, related[2].contextualize.entry];
                refs.forEach(function (ref) {
                    expect(ref._table.name).toBe("association_table_with_toname");
                });
                refs = [related[3].contextualize.entryEdit, related[3].contextualize.entryCreate, related[3].contextualize.entry];
                refs.forEach(function (ref) {
                    expect(ref._table.name).toBe("association table with id");
                });
            });

            it('.read should return a Page object that is defined.', function(done) {
                related[2].read(limit).then(function(response) {
                    pageWithToName = response;

                    expect(pageWithToName).toEqual(jasmine.any(Object));
                    expect(pageWithToName._data[0].id).toBe("1");
                    expect(pageWithToName._data.length).toBe(limit);


                    related[3].read(limit).then(function(response) {
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
                //NOTE: using the compactPath for checking the equality of reference
                var expected = "reference_schema_2:reference_table_no_order/(id_1,id_2)=(reference_schema_2:related_reference_no_order:col_from_ref_no_order_1,col_from_ref_no_order_2)";
                expect(related2[1].location.compactPath).toEqual(expected);
            });

            it('should be sorted by order of foreign key columns when displayname and order of key columns is the same.', function() {
                var expected = "reference_schema_2:reference_table_no_order/(id_2,id_3)=(reference_schema_2:related_reference_no_order:col_from_ref_no_order_3,col_from_ref_no_order_4)";
                expect(related2[2].location.compactPath).toEqual(expected);
            });
        });

    });
};
