exports.execute = function(options) {
    var catalogId = process.env.DEFAULT_CATALOG,
        schemaName = "error_schema",
        tableName = "valid_table_name";

    describe("Facets, ", function() {
        var validBlob = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhAEYQBdAX0uXWzywQAKiogkOMNlrMQAFxxI5nLtyA";
        var facetObj = {
            "and":[
                {"source":"accession", "choices":["1"]},
                {"source":"*", "search":["test"]}
            ]
        };

        var validBlob2 = "N4IghgdgJiBcDaoDOB7ArgJwMYFM7i1ySQEsUIQAaELACxRKLnhACYQBdAX0uXWzywQAKiogkOMNlrMQAFxxI57btyA";
        var facetObj2 = {
            "and":[
                {"source":"accession", "choices":["2"]},
                {"source":"*", "search":["test2"]}
            ]
        };


        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" + tableName;
        var facetError = "Given encoded string for facets is not valid.";
        var location, uri;
        var invalidPageConditionErrorObj = {
                       'status': 'Invalid Page Criteria',
                       'messageWithCondition': "Invalid uri: " + options.url + "/catalog/"+catalogId+"/entity/"+schemaName+":"+tableName+"/id=269@after(). Sort modifier is required with paging.",
                       'messageWithConditions': "Invalid uri: " + options.url + "/catalog/"+catalogId+"/entity/"+schemaName+":"+tableName+"/id=269@after(3)@before(7). Sort modifier is required with paging.",
                       'errorData': { 'redirectPath': schemaName+":"+tableName+'/id=269' }
       };
        var invalidFilterOperatorErrorObj = {
                       'status': 'Invalid Filter',
                       'message': "Invalid uri: " + options.url + "/catalog/"+catalogId+"/entity/"+schemaName+":"+tableName+"/id::gt:269. Couldn't parse 'id::gt:269' filter.",
                       'errorData': { 'redirectPath':schemaName+":"+tableName+'/' },
                       'messageWithSort': "Invalid uri: " + options.url + "/catalog/"+catalogId+"/entity/"+schemaName+":"+tableName+"/id::gt:269@sort(). Couldn't parse 'id::gt:269' filter.",
                       'errorDataWithSort': { 'redirectPath': schemaName+":"+tableName+'/@sort()' }
       };
        var invalidFacetFilterErrorObj = {
                       'status': 'Invalid Facet Filters',
                       'message': "Given encoded string for facets is not valid.",
                       'errorData': { 'redirectPath': schemaName+":"+tableName+'/@sort()' },
                       'errorDataWithoutSort': { 'redirectPath': schemaName+":"+tableName+"/" }
      };

      var invalidSortCriteriaErrorObj = {
                     'status': 'Invalid Sort Criteria',
                     'message': "Column id is not sortable.",
                     'errorData': { 'redirectPath': schemaName + ":" + tableName }

    };

      beforeAll(function (done) {
        options.ermRest.resolve(baseUri + "@sort(id)", {cid:"test"}).then(function(response) {
          references = response;
          done();
        });
      });


        describe("when uri have invalid facet blob", function() {

            it("should throw an error for invalid facet filter errors with sort() modifier.", function() {
                try{
                    options.ermRest.parse(baseUri + "/*::facets::invalidblob@sort()");
                    expect(false).toBe(true, "invalid facet filter didn't throw any errors.");
                } catch(e){
                    expect(e.status).toEqual(invalidFacetFilterErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFacetFilterErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFacetFilterErrorObj.errorData, "errorData attribute did not match");
                }
            });
            it("should throw an error for invalid facet filter errors without sort() modifier.", function() {
                try{
                    options.ermRest.parse(baseUri + "/*::facets::invalidblob");
                    expect(false).toBe(true, "invalid facet filter without sort() didn't throw any errors.");
                } catch(e){
                    expect(e.status).toEqual(invalidFacetFilterErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFacetFilterErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFacetFilterErrorObj.errorDataWithoutSort, "errorData attribute did not match");
                }
            });
        });

        describe("when uri has invalid paging Criteria", function() {
            it("it should throw an error for invalid pageing criteria.", function() {
                try{
                    options.ermRest.parse(baseUri + "/id=269@after()");
                    expect(false).toBe(true, "invalid paging Criteria didn't throw any errors.");
                } catch(e){
                    expect(e.status).toEqual(invalidPageConditionErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidPageConditionErrorObj.messageWithCondition, "Error message did not match");
                    expect(e.errorData).toEqual(invalidPageConditionErrorObj.errorData, "errorData attribute did not match");
                }
            });

            it("it should throw an error for invalid pageing criteria with both after() and before().", function() {
                try{
                    options.ermRest.parse(baseUri + "/id=269@after(3)@before(7)");
                    expect(false).toBe(true, "invalid paging Criteria didn't throw any errors.");
                } catch(e){
                    expect(e.status).toEqual(invalidPageConditionErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidPageConditionErrorObj.messageWithConditions, "Error message did not match");
                    expect(e.errorData).toEqual(invalidPageConditionErrorObj.errorData, "errorData attribute did not match");
                }
            });
        });

        describe("when uri has invalid filter", function() {
            it("it should throw an error for invalid filter.", function() {
                try{
                    options.ermRest.parse(baseUri + "/id::gt:269");
                    expect(false).toBe(true, "invalid filter didn't throw any errors.");
                } catch(e){
                    expect(e.status).toEqual(invalidFilterOperatorErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFilterOperatorErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFilterOperatorErrorObj.errorData, "errorData attribute did not match");
                }
            });

            it("it should throw an error for invalid filter with sort() modifier.", function() {
                try{
                    options.ermRest.parse(baseUri + "/id::gt:269@sort()");
                    expect(false).toBe(true, "invalid filter with sort() modifier didn't throw any errors.");
                } catch(e){
                    expect(e.status).toEqual(invalidFilterOperatorErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFilterOperatorErrorObj.messageWithSort, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFilterOperatorErrorObj.errorDataWithSort, "errorData attribute did not match");
                }
            });
        });

        describe("when uri has invalid sort", function() {

            it("it should throw an error for invalid sort.", function(done) {


                  references.sort([{"column" : "id", "descending" : true}]).read(1).then(function(){

                    done.fail();
                  }).catch(function (e) {
                    expect(e.status).toEqual(invalidSortCriteriaErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidSortCriteriaErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidSortCriteriaErrorObj.errorData, "errorData attribute did not match");
                    done();
                  });
                });
              });//describe


        });
    }
