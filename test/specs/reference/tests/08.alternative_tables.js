exports.execute = function (options) {

    describe("For alternative tables,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference schema altTables",
            schemaNameEncoded = "reference%20schema%20altTables",
            baseTable1 = "base table",
            baseTable1Encoded = "base%20table",
            altDetailedTable1 = "alt table detailed",
            altDetailedTable1Encoded = "alt%20table%20detailed",
            altCompactTable1 = "alt table compact",
            altCompactTable1Encoded = "alt%20table%20compact",
            baseTable2 = "base table no app link",
            baseTable2Encoded = "base%20table%20no%20app%20link",
            altDetailedTable2 = "alt table detailed 2",
            altDetailedTable2Encoded = "alt%20table%20detailed%202",
            altCompactTable2 = "alt table compact 2",
            altCompactTable2Encoded = "alt%20table%20compact%202",
            entityId = "00001",
            value = "12";

        /**
         * Test Cases:
         *
         * 1) start from base_table with no filter
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 2) start from base_table with single entity shared key filter (single col)
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 3) start from base_table with single entity shared key filter (multi col)
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 4) start from base_table with other filters
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 5) start from alt_table_detailed with no filter
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 6) start from alt_table_detailed with single entity shared key filter (single col)
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 7) start from alt_table_detailed with single entity shared key filter (multi col)
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 8) start from alt_table_detailed with other filters
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 9) start from alt_table_compact with no filter
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 10) start from alt_table_compact with single entity shared key filter (single col)
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 11) start from alt_table_compact with single entity shared key filter (multi col)
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         * 12) start from alt_table_compact with other filters
         *      a. contextualize entry (base_table)
         *      b. contextualize detailed (alt_table_detailed)
         *      c. contextualize compact (alt_table_compact)
         */

        var uri1 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + baseTable1Encoded;

        var uri2 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + baseTable1Encoded + "/id=" + entityId;

        var uri3 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + baseTable2Encoded + "/id=" + entityId + "&value=" + value;

        var uri4 = options.url + "/catalog/" + catalog_id + "/entity/" + schemaNameEncoded + ":"
            + baseTable1Encoded + "/id=00001;id=00002;id=00003;id=00004;id=00005;id=00006";

        var uri5 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + altDetailedTable1Encoded;

        var uri6 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + altDetailedTable1Encoded + "/id%20x=" + entityId;

        var uri7 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + altDetailedTable2Encoded + "/id%20x=" + entityId + "&value%20x=" + value;

        var uri8 = options.url + "/catalog/" + catalog_id + "/entity/" + schemaNameEncoded + ":"
            + altDetailedTable1Encoded + "/id%20x=00001;id%20x=00002;id%20x=00003;id%20x=00004;id%20x=00005;id%20x=00006";

        var uri9 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + altCompactTable1Encoded;

        var uri10 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + altCompactTable1Encoded + "/id%20y=" + entityId;

        var uri11 = options.url + "/catalog/" + catalog_id + "/entity/"
            + schemaNameEncoded + ":" + altCompactTable2Encoded + "/id%20y=" + entityId + "&value%20y=" + value;

        var uri12 = options.url + "/catalog/" + catalog_id + "/entity/" + schemaNameEncoded + ":"
            + altCompactTable1Encoded + "/id%20y=00001;id%20y=00002;id%20y=00003;id%20y=00004;id%20y=00005;id%20y=00006";


        describe('1. base table with no entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('1.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri1, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.2 base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTable1);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTable1);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('1.3. reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri1);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTable1);

            });

            it('1.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('1.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('1.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('1.A.4 tuple read should return correct data from base table', function(done) {
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

            it('1.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('1.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('1.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('1.B.4 tuple read should return correct data from base table', function(done) {
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

            it('1.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('1.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('1.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('1.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('1.C.4 tuple read should return correct data from base table', function(done) {
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


        describe('2. base table with single entity filter (single col key),', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('2.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri2, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.2 base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTable1);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTable1);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('2.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri2);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTable1);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('2.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('2.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('2.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('2.A.4 tuple read should return correct data from base table', function(done) {
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

            it('2.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('2.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('2.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('2.B.3 tuple read should return correct data from base table', function(done) {
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

            it('2.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('2.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('2.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('2.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('2.C.4 tuple read should return correct data from base table', function(done) {
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



        describe('3. base table with single entity filter (multi col key),', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('3.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri3, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.2 base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTable2);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTable2);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTable2);
                expect(reference._table._baseTable.name).toBe(baseTable2);
            });

            it('3.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri3);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTable2);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('3.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable2);
            });

            it('3.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('3.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12");
            });

            it('3.A.4 tuple read should return correct data from base table', function(done) {
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

            it('3.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable2);
            });

            it('3.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data["value x"]).toBe(12);
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('3.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                var success = (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12") ||
                    (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/value=12&id=00001");
                expect(success).toBe(true);
            });

            it('3.B.4 tuple read should return correct data from base table', function(done) {
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

            it('3.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable2);
            });

            it('3.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('3.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('3.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                var success = (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12") ||
                    (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/value=12&id=00001");
                expect(success).toBe(true);
            });

            it('3.C.4 tuple read should return correct data from base table', function(done) {
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


        describe('4. base table with multiple entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('4.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri4, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('4.2 base table should be properly defined', function() {
                expect(reference._table.name).toBe(baseTable1);
                expect(reference._table._alternatives.detailed.name).toBe(altDetailedTable1);
                expect(reference._table._alternatives.compact.name).toBe(altCompactTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('4.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri4);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(baseTable1);

            });

            it('4.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('4.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('4.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('4.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('4.A.4 tuple read should return correct data from base table', function(done) {
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

            it('4.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('4.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('4.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('4.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('4.B.4 tuple read should return correct data from base table', function(done) {
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

            it('4.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('4.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('4.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('4.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('4.C.4 tuple read should return correct data from base table', function(done) {
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










        describe('5. alternative detailed table with no entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('5.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri5, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('5.2 alternative detailed table should be properly defined', function() {
                expect(reference._table.name).toBe(altDetailedTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('5.3. reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri5);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altDetailedTable1);

            });

            it('5.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('5.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('5.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('5.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('5.A.4 tuple read should return correct data from base table', function(done) {
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

            it('5.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('5.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('5.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('5.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('5.B.4 tuple read should return correct data from base table', function(done) {
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

            it('5.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('5.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('5.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('5.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('5.C.4 tuple read should return correct data from base table', function(done) {
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


        describe('6. alternative detail table with single entity filter (single col key),', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('6.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri6, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('6.2 alternative detail table should be properly defined', function() {
                expect(reference._table.name).toBe(altDetailedTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('6.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri6);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altDetailedTable1);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('6.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('6.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('6.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('6.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('6.A.4 tuple read should return correct data from base table', function(done) {
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

            it('6.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('6.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('6.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('6.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('6.B.3 tuple read should return correct data from base table', function(done) {
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

            it('6.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('6.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('6.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('6.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('6.C.4 tuple read should return correct data from base table', function(done) {
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



        describe('7. alternative detail table with single entity filter (multi col key),', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('7.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri7, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('7.2 alternative detail table should be properly defined', function() {
                expect(reference._table.name).toBe(altDetailedTable2);
                expect(reference._table._baseTable.name).toBe(baseTable2);
            });

            it('7.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri7);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altDetailedTable2);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('7.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable2);
            });

            it('7.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('7.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('7.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12");
            });

            it('7.A.4 tuple read should return correct data from base table', function(done) {
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

            it('7.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable2);
            });

            it('7.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('7.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data["value x"]).toBe(12);
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('7.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                var success = (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12") ||
                    (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/value=12&id=00001");
                expect(success).toBe(true);
            });

            it('7.B.4 tuple read should return correct data from base table', function(done) {
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

            it('7.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable2);
            });

            it('7.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('7.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('7.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                var success = (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12") ||
                    (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/value=12&id=00001");
                expect(success).toBe(true);
            });

            it('7.C.4 tuple read should return correct data from base table', function(done) {
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


        describe('8. alternative detail table with multiple entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('8.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri8, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('8.2 alternative compact table should be properly defined', function() {
                expect(reference._table.name).toBe(altDetailedTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('8.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri8);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altDetailedTable1);

            });

            it('8.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('8.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('8.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('8.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('8.A.4 tuple read should return correct data from base table', function(done) {
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

            it('8.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('8.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('8.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('8.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('8.B.4 tuple read should return correct data from base table', function(done) {
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

            it('8.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('8.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('8.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('8.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('8.C.4 tuple read should return correct data from base table', function(done) {
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










        describe('9. alternative compact table with no entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('9.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri9, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('9.2 alternative compact table should be properly defined', function() {
                expect(reference._table.name).toBe(altCompactTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('9.3. reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri9);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altCompactTable1);

            });

            it('9.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('9.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('9.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('9.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('9.A.4 tuple read should return correct data from base table', function(done) {
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

            it('9.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('9.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('9.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('9.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('9.B.4 tuple read should return correct data from base table', function(done) {
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

            it('9.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('9.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('9.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(8);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('9.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('9.C.4 tuple read should return correct data from base table', function(done) {
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


        describe('10. alternative compact table with single entity filter (single col key),', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('10.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri10, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('10.2 alternative compact table should be properly defined', function() {
                expect(reference._table.name).toBe(altCompactTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('10.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri10);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altCompactTable1);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('10.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('10.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('10.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('10.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('10.A.4 tuple read should return correct data from base table', function(done) {
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

            it('10.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('10.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('10.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('10.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('10.B.3 tuple read should return correct data from base table', function(done) {
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

            it('10.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('10.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('10.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('10.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('10.C.4 tuple read should return correct data from base table', function(done) {
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



        describe('11. alternative compact table with single entity filter (multi col key),', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('11.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri11, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('11.2 alternative compact table should be properly defined', function() {
                expect(reference._table.name).toBe(altCompactTable2);
                expect(reference._table._baseTable.name).toBe(baseTable2);
            });

            it('11.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri11);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altCompactTable2);
                expect(reference._location.filter instanceof options.ermRest.ParsedFilter).toBe(true);

            });

            it('11.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable2);
            });

            it('11.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('11.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('11.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12");
            });

            it('11.A.4 tuple read should return correct data from base table', function(done) {
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

            it('11.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable2);
            });

            it('11.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('11.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data["value x"]).toBe(12);
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('11.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                var success = (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12") ||
                    (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/value=12&id=00001");
                expect(success).toBe(true);
            });

            it('11.B.4 tuple read should return correct data from base table', function(done) {
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

            it('11.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable2);
                expect(reference2._shortestKey.length).toBe(2);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable2);
            });

            it('11.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('11.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(1);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('11.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable2);
                expect(tuple.reference.displayname).toBe(baseTable2);
                var success = (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/id=00001&value=12") ||
                    (tuple.reference._location.path === schemaNameEncoded + ":" + baseTable2Encoded+ "/value=12&id=00001");
                expect(success).toBe(true);
            });

            it('11.C.4 tuple read should return correct data from base table', function(done) {
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


        describe('12. alternative compact table with multiple entity filters,', function() {
            var reference, reference2, page, tuple;
            var limit = 25;

            it('12.1 resolve should return a Reference object that is defined.', function(done) {
                options.ermRest.resolve(uri12, {cid: "test"}).then(function (response) {
                    reference = response;
                    reference.session = { attributes: [] };

                    expect(reference).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('12.2 alternative compact table should be properly defined', function() {
                expect(reference._table.name).toBe(altCompactTable1);
                expect(reference._table._baseTable.name).toBe(baseTable1);
            });

            it('12.3 reference should be properly defined', function() {
                expect(reference._location.uri).toBe(uri12);
                expect(reference._location.service).toBe(options.url);
                expect(reference._location.catalog).toBe(catalog_id.toString());
                expect(reference._location.schemaName).toBe(schemaName);
                expect(reference._location.tableName).toBe(altCompactTable1);

            });

            it('12.A contextualize entry should return a new reference with base table', function() {
                reference2 = reference.contextualize.entry;
                expect(reference2._table.name).toBe(baseTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id");
                expect(reference2.displayname).toBe(baseTable1);
            });

            it('12.A.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('12.A.2 page data should be the values from base table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data.id).toBe("00001");
                expect(tuple._data.name).toBe("Hank");
                expect(tuple._data.value).toBe(12);
            });

            it('12.A.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('12.A.4 tuple read should return correct data from base table', function(done) {
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

            it('12.B contextualize detailed should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.detailed;
                expect(reference2._table.name).toBe(altDetailedTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id x");
                expect(reference2.displayname).toBe(altDetailedTable1);
            });

            it('12.B.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('12.B.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id x"]).toBe("00001");
                expect(tuple._data.details).toBe("Hank, Male 23");
            });

            it('12.B.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('12.B.4 tuple read should return correct data from base table', function(done) {
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

            it('12.C contextualize compact should return a new reference with alternative table', function() {
                reference2 = reference.contextualize.compact;
                expect(reference2._table.name).toBe(altCompactTable1);
                expect(reference2._shortestKey.length).toBe(1);
                expect(reference2._shortestKey[0].name).toBe("id y");
                expect(reference2.displayname).toBe(altCompactTable1);
            });

            it('12.C.1 read should return a Page object that is defined.', function(done) {
                reference2.read(limit).then(function (response) {
                    page = response;

                    expect(page).toEqual(jasmine.any(Object));

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('12.C.2 page data should be the values from alternative table.', function() {
                expect(page._ref).toBe(reference2);
                expect(page._data.length).toBe(6);

                tuple = page.tuples[0];
                expect(tuple._pageRef).toBe(reference2);
                expect(tuple._data["id y"]).toBe("00001");
                expect(tuple._data.summary).toBe("Hank 23");
            });

            it('12.C.3 tuple reference should be on the base table with correct filter', function() {
                expect(tuple.reference).toBeDefined();
                expect(tuple.reference._table.name).toBe(baseTable1);
                expect(tuple.reference.displayname).toBe(baseTable1);
                expect(tuple.reference._location.path).toBe(schemaNameEncoded + ":" + baseTable1Encoded + "/id=00001");
            });

            it('12.C.4 tuple read should return correct data from base table', function(done) {
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
