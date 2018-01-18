exports.execute = function (options) {
    // Test Cases:
    describe("for testing aggregate functions on tables and columns,", function () {
        var reference;
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "aggregate_schema",
            tableName = "aggregate_table",
            tableNameWithCompKey = "table_w_only_composite_key",
            tableNameWithSimpleKey = "table_w_simple_key";
        
        var encodedMain = "u%E1%B4%89%C9%90%C9%AF",
            decodedMain = "uᴉɐɯ",
            encodedCol = "lo%C9%94",
            decodedCol = "loɔ",
            encodedID = "p%E1%B4%89";
            decodedID = "pᴉ";

        // Columns in aggregate table are as follows:
        // [id, int_agg, float_agg, text_agg, date_agg, timestamp_agg]

        var baseUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName;
            
        var attrGroupUri = options.url + "/catalog/" + catalog_id + "/attributegroup/M:=" +
            schemaName + ":" + tableName;
        
        var compositeTableWithJoinUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/(id)=(" + schemaName + ":" + tableNameWithCompKey + ":col)";
            
        var tableWithJoinUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/(id)=(" + schemaName + ":" + tableNameWithSimpleKey + ":simple_id)";
        
        var tableWithJoinAttrGroupUri = options.url + "/catalog/" + catalog_id + "/attributegroup/T:=" + 
            schemaName + ":" + tableName + "/M:=(id)=(" + schemaName + ":" + tableNameWithSimpleKey + ":simple_id)";
        
        var tableWithUnicode = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/(id)=(" + schemaName + ":" + encodedMain + ":" + encodedID + ")";
            
        var tableWithUnicodeAttrGroupUri = options.url + "/catalog/" + catalog_id + "/attributegroup/T:=" + 
            schemaName + ":" + tableName + "/M:=(id)=(" + schemaName + ":" + encodedMain + ":" + encodedID + ")";
            

        beforeAll(function (done) {
            options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                reference = response;

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });
        
        describe("regarding aggregate APIs, ", function () {
            it("should get the aggregate count for the aggregate_table table.", function(done) {
                var aggregateList = [
                    reference.aggregate.countAgg
                ];
                
                reference.getAggregates(aggregateList).then(function (response) {
                    
                    expect(response[0]).toBe(5, "Table count is incorrect");
                    
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
            
            it("should get aggregates for int_agg column.", function(done) {
                var intColumnAggs = reference.columns[1].aggregate;
                var aggregateList = [
                    intColumnAggs.countNotNullAgg,
                    intColumnAggs.countDistinctAgg,
                    intColumnAggs.minAgg,
                    intColumnAggs.maxAgg
                ];
                
                reference.getAggregates(aggregateList).then(function (response) {
                    
                    expect(response[0]).toBe(5, "Int count not null is incorrect");
                    expect(response[1]).toBe(4, "Int unique count is incorrect");
                    expect(response[2]).toBe(2, "Int min value is incorrect");
                    expect(response[3]).toBe(215, "Int max value is incorrect");
                    
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
            
            it("should get aggregates for float_agg column.", function(done) {
                var floatColumnAggs = reference.columns[2].aggregate;
                var aggregateList = [
                    floatColumnAggs.countNotNullAgg,
                    floatColumnAggs.countDistinctAgg,
                    floatColumnAggs.minAgg,
                    floatColumnAggs.maxAgg
                ];
                
                reference.getAggregates(aggregateList).then(function (response) {
                    
                    expect(response[0]).toBe(4, "Float count not null is incorrect");
                    expect(response[1]).toBe(4, "Float unique count is incorrect");
                    expect(response[2]).toBe(0.4222, "Float min value is incorrect");
                    expect(response[3]).toBe(36.9201, "Float max value is incorrect");
                    
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
            
            it("should get aggregates for text_agg column.", function(done) {
                var textColumnAggs = reference.columns[3].aggregate;
                var aggregateList = [
                    textColumnAggs.countNotNullAgg,
                    textColumnAggs.countDistinctAgg,
                    textColumnAggs.minAgg,
                    textColumnAggs.maxAgg
                ];
                
                reference.getAggregates(aggregateList).then(function (response) {
                    
                    expect(response[0]).toBe(4, "Text count not null is incorrect");
                    expect(response[1]).toBe(3, "Text unique count is incorrect");
                    expect(response[2]).toBe("bread", "Text min value is incorrect");
                    expect(response[3]).toBe("sandwich", "Text max value is incorrect");
                    
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
            
            it("should get aggregates for date_agg column.", function(done) {
                var dateColumnAggs = reference.columns[4].aggregate;
                var aggregateList = [
                    dateColumnAggs.countNotNullAgg,
                    dateColumnAggs.countDistinctAgg,
                    dateColumnAggs.minAgg,
                    dateColumnAggs.maxAgg
                ];
                
                reference.getAggregates(aggregateList).then(function (response) {
                    
                    expect(response[0]).toBe(3, "Date count not null is incorrect");
                    expect(response[1]).toBe(3, "Date unique count is incorrect");
                    expect(response[2]).toBe("2015-01-11", "Date min value is incorrect");
                    expect(response[3]).toBe("2017-07-17", "Date max value is incorrect");
                    
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
            
            it("should get aggregates for timestamp_agg column.", function(done) {
                var timestampColumnAggs = reference.columns[5].aggregate;
                var aggregateList = [
                    timestampColumnAggs.countNotNullAgg,
                    timestampColumnAggs.countDistinctAgg,
                    timestampColumnAggs.minAgg,
                    timestampColumnAggs.maxAgg
                ];
                
                reference.getAggregates(aggregateList).then(function (response) {
                    
                    expect(response[0]).toBe(5, "Timestamp count not null is incorrect");
                    expect(response[1]).toBe(5, "Timestamp unique count is incorrect");
                    expect(response[2]).toBe("2010-05-22T17:44:00", "Timestamp min value is incorrect");
                    expect(response[3]).toBe("2017-04-13T14:10:00", "Timestamp max value is incorrect");
                    
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });
       
        describe("regarding group aggregate APIs, ", function () {
            describe ('column.groupAggregate, ', function () {
                it ('should return null if is being called on a pseudo-column', function () {
                    expect(reference.columns[0].groupAggregate).toBe(null);
                });
                
                it ('otherwise should return an object.', function () {
                    expect(reference.columns[1].groupAggregate).toBeDefined();
                });
            });
            
            describe("entityCounts, ", function () {
                var expectAttrGroupRef = function (ag_ref, uri, colDisplaynames) {
                    expect(ag_ref).toEqual(jasmine.any(Object), "attributegroup reference is not an object.");
                    
                    expect(ag_ref.isAttributeGroup).toBe(true, "It's not an attributegroup reference");
                    expect(ag_ref.uri).toBe(uri, "invalid URI");
                    expect(ag_ref.columns.map(function (c) {return c.displayname.value;})).toEqual(colDisplaynames, "column names missmatch.");
                };
                
                it ("if there's a join in the path should return an attributegroup reference, using cnt_d(shortestKey) for count.", function (done) {
                    options.ermRest.resolve(tableWithJoinUri, {cid: "test"}).then(function (reference) {
                        expectAttrGroupRef(
                            reference.columns[0].groupAggregate.entityCounts, 
                            tableWithJoinAttrGroupUri + "/value:=col;count:=cnt_d(simple_id)@sort(count::desc::,value)",
                            ["col", "Number of Occurences"]
                        );
                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });
                
                it ("should be able to handle table and columns with unicode characters.", function (done) {
                    options.ermRest.resolve(tableWithUnicode, {cid: "test"}).then(function (reference) {
                        expectAttrGroupRef(
                            reference.columns[1].groupAggregate.entityCounts, 
                            tableWithUnicodeAttrGroupUri + "/value:=" + encodedCol + ";count:=cnt_d("+ encodedID +")@sort(count::desc::,value)",
                            [decodedCol, "Number of Occurences"]
                        );
                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });
                
                it ("for int_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[1].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=int_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["int_agg", "Number of Occurences"]
                    );
                });
                
                it ("for float_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[2].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=float_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["float_agg", "Number of Occurences"]
                    );
                });
                
                it ("for text_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[3].groupAggregate.entityCounts, 
                        attrGroupUri + "/value:=text_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["text_agg", "Number of Occurences"]
                    );
                });
                
                it ("for date_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[4].groupAggregate.entityCounts, 
                        attrGroupUri + "/value:=date_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["date_agg", "Number of Occurences"]
                    );
                });
                
                
                it ("for timestamp_agg should return an attributegroup reference, using cnt(*) for count.", function () {
                    expectAttrGroupRef(
                        reference.columns[5].groupAggregate.entityCounts,
                        attrGroupUri + "/value:=timestamp_agg;count:=cnt(*)@sort(count::desc::,value)",
                        ["timestamp_agg", "Number of Occurences"]
                    );
                });
                

            });
            
            //TODO add test cases for entityValues and histogram
            
        });
    });
};
