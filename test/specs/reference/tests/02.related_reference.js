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

        var reference, related, relatedWithTuple, page;

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
                related = reference.related();
                return reference.read(1);
            }).then(function (responsePage) {
                delete reference._related;
                relatedWithTuple = reference.related(responsePage.tuples[0]);
                done();
            }).catch(function(error){
                console.dir(err);
                done.fail();
            });
        });

        it('should be defined and not empty.', function() {
            expect(reference.related).toBeDefined();
            expect(related).not.toEqual([]);
        });

        it('should only include visible foreign keys that are defined in the annotation.', function() {
            expect(related.length).toBe(5);
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

        it('.origColumnName should have the correct value', function() {
            expect(related[0].origColumnName).toBe("reference_schema_fromname_fk_inbound_related_to_reference");
            expect(related[1].origColumnName).toBe("reference_schema_fk_inbound_related_to_reference");
            expect(related[2].origColumnName).toBe("reference_schema_toname_fk_association_related_to_reference");
            expect(related[3].origColumnName).toBe("reference_schema_id_fk_association_related_to_reference");
        });

        describe('for inbound foreign keys, ', function() {
            it('should have the correct catalog, schema, and table.', function() {
                expect(related[0]._location.catalog).toBe(catalog_id.toString());
                expect(related[0]._table.schema.name).toBe(schemaName);
                expect(related[0]._table.name).toBe(inboudTableName);
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
                    it('should create the link using faceting.', function() {

                        var checkUri = function (index, expectedTable, expectedFacets, expectedQueryParam) {
                            var loc = relatedWithTuple[index].location;
                            expect(loc.facets).not.toBeNull("facets was null for tuple index=" + index);
                            expect(JSON.stringify(loc.facets.decoded['and'], null, 0)).toEqual(JSON.stringify(expectedFacets, null, 0), "facets was not as expected for tuple index="+ index);
                            expect(loc.tableName).toBe(expectedTable, "table name was not as expected for tuple index="+ index);
                            expect(loc.queryParams['subset']).toBeDefined();
                            expect(loc.queryParams['subset']).toBe(expectedQueryParam);
                        }

                        checkUri(0, "inbound_related_reference_table", [{
                            "source":[{"outbound":["reference_schema","fromname_fk_inbound_related_to_reference"]},"id"],
                            "choices":["9003"]
                        }], "to_name_value: 9003 and Henry");

                        checkUri(1, "inbound_related_reference_table", [{
                            "source":[{"outbound":["reference_schema","fk_inbound_related_to_reference"]},"id"],
                            "choices":["9003"]
                        }], "reference_table: 9003 and Henry");
                    });
                });
            });

            describe(".parentDisplayname", function () {
                it('should use to_name when annotation is present.', function () {
                    expect(related[0].parentDisplayname.value).toBe("to_name_value");
                });

                it("should return current reference displayname when to_name is not defined.", function () {
                    expect(related[1].parentDisplayname.value).toBe("reference_table");
                });
            });

            it('.columns should be properly defined based on schema and only in compact/brief context should not include foreign key columns that created the link.', function() {
                checkReferenceColumns([{
                    ref: related[0],
                    expected: [
                        ["reference_schema", "inbound_related_reference_key"].join("_"),
                        ["reference_schema", "fromname_fk_inbound_related_to_reference"].join("_"), // the fk
                        ["reference_schema", "hidden_fk_inbound_related_to_reference"].join("_"),
                        ["reference_schema", "fk_inbound_related_to_reference"].join("_"),
                        'RID', 'RCT', 'RMT', 'RCB', 'RMB'
                ]}, {
                    ref: related[1].contextualize.compactBrief,
                    expected: [
                        "id",
                        ["reference_schema", "fromname_fk_inbound_related_to_reference"].join("_"),
                        ["reference_schema", "hidden_fk_inbound_related_to_reference"].join("_")
                ]}]);
            });

            it('.derivedAssociationReference should be undefined', function() {
                expect(related[0].derivedAssociationReference).toBeUndefined();
                expect(related[1].derivedAssociationReference).toBeUndefined();
            });

            it('.read should return a Page object that is defined.', function(done) {
                related[0].read(limit).then(function(response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page._data[0].id).toBe(relatedEntityWithToNameId.toString());
                    expect(page._data.length).toBe(limit);

                    done();
                }, function(err) {
                    console.dir(err);
                    done.fail();
                });

                related[1].read(limit).then(function(response) {
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
                expect(related[2]._location.catalog).toBe(catalog_id.toString());
                expect(related[2]._table.name).toBe(inboudTableName);
            });

            describe('.displayname, ', function () {
                it('should use to_name when annotation is present.', function() {
                  expect(related[2].displayname.value).toBe("to_name_value");
                });

                it('should use the displayname of assocation table when annotation is not present.', function() {
                  expect(related[3].displayname.value).toBe(associationTableWithIDDisplayname);
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

            it('.derivedAssociationReference should be defined.', function() {
                expect(related[2].derivedAssociationReference._table.name).toBe("association_table_with_toname");
                expect(related[3].derivedAssociationReference._table.name).toBe("association table with id");
            });

            it('.read should return a Page object that is defined.', function(done) {
                related[2].sort([{"column":"id", "descending": false}]).read(limit).then(function(response) {
                    pageWithToName = response;

                    expect(pageWithToName).toEqual(jasmine.any(Object));
                    expect(pageWithToName._data[0].id).toBe("1");
                    expect(pageWithToName._data.length).toBe(limit);


                    related[3].sort([{"column":"id"}]).read(limit).then(function(response) {
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
                    related2 = response.contextualize.detailed.related();
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

        it('when table has alternative tables, should not include self-link to the base.', function (done) {
            var schemaName3 = "reference_schema_2",
                tableName3 = "table_w_alternate";

            var tableWAlternateUri = options.url + "/catalog/" + catalog_id + "/entity/"
                + schemaName3 + ":" + tableName3;

            options.ermRest.resolve(tableWAlternateUri, {cid: "test"}).then(function(response) {
                var rel = response.related();
                expect(rel.length).toBe(0);
                done();
            }, function(err) {
                console.dir(err);
                done.fail();
            });
        });

    });
};
