exports.execute = function (options) {

    describe("For alternative tables,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema_altTables",
            baseTableName = "base_table",
            altDetailedTableName = "alt_table_detailed",
            altCompactTableName = "alt_table_compact",
            entityId = "00001";

        var allEntityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + baseTableName;

        var singleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaName + ":" + baseTableName + "/id=" + entityId;

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + baseTableName + "/id=00001;id=00002;id=00003;id=00004;id=00005;id=00006";


        // Test Cases:
        describe('for no entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('1.1. resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(allEntityUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.2. base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTableName);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTableName);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTableName);
                expect(reference._table.baseTable.name).toBe(baseTableName);

            });

            it('1.3. reference should be properly defined', function() {
                expect(reference._location.uri).toBe(allEntityUri);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTableName);

            });

            it('1.4. contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTableName);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("idx");
                expect(reference2._columns.length).toBe(2);
                expect(reference2._columns[0].name).toBe("idx");
                expect(reference2._columns[1].name).toBe("details");
                expect(reference2._displayname).toBe(altDetailedTableName);
            });

            it('1.5. read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.6. page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.idx).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('1.7. tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTableName);
                expect(tuple.reference._displayname).toBe(baseTableName);
                expect(tuple.reference._columns[0].name).toBe("id");
                expect(tuple.reference._columns[1].name).toBe("name");
                expect(tuple.reference._columns[2].name).toBe("value");
                expect(tuple.reference._location.path).toBe(schemaName + ":" + baseTableName + "/id=00001");
            });

            it('1.8. tuple read should return correct data from base table', function(done) {
                tuple.reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page.tuples.length).toBe(1);
                    expect(page.tuples[0]._data).toEqual({"id":"00001","name":"Hank","value":12});

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });





        describe('for single entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('2.1. resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(singleEntityUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.2. base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTableName);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTableName);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTableName);
                expect(reference._table.baseTable.name).toBe(baseTableName);

            });

            it('2.3. reference should be properly defined', function() {
                expect(reference._location.uri).toBe(singleEntityUri);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTableName);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('2.4. contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTableName);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("idx");
                expect(reference2._columns.length).toBe(2);
                expect(reference2._columns[0].name).toBe("idx");
                expect(reference2._columns[1].name).toBe("details");
                expect(reference2._displayname).toBe(altDetailedTableName);
            });

            it('2.5. read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.6. page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.idx).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('2.7. tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTableName);
                expect(tuple.reference._displayname).toBe(baseTableName);
                expect(tuple.reference._columns[0].name).toBe("id");
                expect(tuple.reference._columns[1].name).toBe("name");
                expect(tuple.reference._columns[2].name).toBe("value");
                expect(tuple.reference._location.path).toBe(schemaName + ":" + baseTableName + "/id=00001");
            });

            it('2.8. tuple read should return correct data from base table', function(done) {
                tuple.reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page.tuples.length).toBe(1);
                    expect(page.tuples[0]._data).toEqual({"id":"00001","name":"Hank","value":12});

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });


        describe('3.1. for multiple entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(multipleEntityUri, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.2. base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTableName);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTableName);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTableName);
                expect(reference._table.baseTable.name).toBe(baseTableName);

            });

            it('3.3. reference should be properly defined', function() {
                expect(reference._location.uri).toBe(multipleEntityUri);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTableName);

            });

            it('3.4. contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTableName);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("idx");
                expect(reference2._columns.length).toBe(2);
                expect(reference2._columns[0].name).toBe("idx");
                expect(reference2._columns[1].name).toBe("details");
                expect(reference2._displayname).toBe(altDetailedTableName);
            });

            it('3.5. read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.6. page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.idx).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('3.7. tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTableName);
                expect(tuple.reference._displayname).toBe(baseTableName);
                expect(tuple.reference._columns[0].name).toBe("id");
                expect(tuple.reference._columns[1].name).toBe("name");
                expect(tuple.reference._columns[2].name).toBe("value");
                expect(tuple.reference._location.path).toBe(schemaName + ":" + baseTableName + "/id=00001");
            });

            it('3.8. tuple read should return correct data from base table', function(done) {
                tuple.reference.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));
                    expect(page.tuples.length).toBe(1);
                    expect(page.tuples[0]._data).toEqual({"id":"00001","name":"Hank","value":12});

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });

    });
};
