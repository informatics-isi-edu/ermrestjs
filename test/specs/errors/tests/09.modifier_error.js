exports.execute = function(options) {

    describe("errors related to modifiers (sort and page) in url, ", function() {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "error_schema",
            tableName = "valid_table_name";

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ":" + tableName;

        var invalidPageConditionErrorObjWOSort = {
            'status': 'Invalid Page Criteria',
            'messageWithCondition': "Sort modifier is required with paging.",
            'messageWithConditions': "Sort modifier is required with paging.",
            'errorData': {
                'redirectPath': schemaName + ":" + tableName + '/id=269'
            }
        };
        var invalidPageConditionErrorObjWSort = {
            'status': 'Invalid Page Criteria',
            'invalidAfterMessage': "sort and after should have the same number of columns.",
            'invalidBeforeMessage': "sort and before should have the same number of columns.",
            'errorData': {
                'redirectPath': schemaName + ":" + tableName + "@sort(id)"
            }
        };

        var invalidFilterOperatorErrorObj = {
            'status': 'Invalid Filter',
            'message': "Couldn't parse 'id::gt:269' filter.",
            'errorData': {
                'redirectPath': schemaName + ":" + tableName + '/'
            },
            'messageWithSort': "Couldn't parse 'id::gt:269' filter.",
            'errorDataWithSort': {
                'redirectPath': schemaName + ":" + tableName + '/@sort()'
            }
        };
        var invalidFacetFilterErrorObj = {
            'status': 'Invalid Facet Filters',
            'message': "Given encoded string for facets is not valid.",
            'errorData': {
                'redirectPath': schemaName + ":" + tableName + '/@sort()'
            },
            'errorDataWithoutSort': {
                'redirectPath': schemaName + ":" + tableName + "/"
            }
        };

        var invalidSortCriteriaErrorObj = {
            'status': 'Invalid Sort Criteria',
            'message': "Column disabled_sort_col is not sortable.",
            'errorData': {
                'redirectPath': schemaName + ":" + tableName
            }

        };

        var location, uri;

        describe("when uri have invalid facet blob", function() {

            it("should throw an error for invalid facet filter errors with sort() modifier.", function() {
                try {
                    options.ermRest.parse(baseUri + "/*::facets::invalidblob@sort()", options.catalog);
                    expect(false).toBe(true, "invalid facet filter didn't throw any errors.");
                } catch (e) {
                    expect(e.status).toEqual(invalidFacetFilterErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFacetFilterErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFacetFilterErrorObj.errorData, "errorData attribute did not match");
                }
            });
            it("should throw an error for invalid facet filter errors without sort() modifier.", function() {
                try {
                    options.ermRest.parse(baseUri + "/*::facets::invalidblob", options.catalog);
                    expect(false).toBe(true, "invalid facet filter without sort() didn't throw any errors.");
                } catch (e) {
                    expect(e.status).toEqual(invalidFacetFilterErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFacetFilterErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFacetFilterErrorObj.errorDataWithoutSort, "errorData attribute did not match");
                }
            });
        });

        describe("when uri has invalid paging Criteria", function() {
            it("it should throw an error for invalid pageing criteria.", function() {
                try {
                    options.ermRest.parse(baseUri + "/id=269@after()", options.catalog);
                    expect(false).toBe(true, "invalid paging Criteria didn't throw any errors.");
                } catch (e) {
                    expect(e.status).toEqual(invalidPageConditionErrorObjWOSort.status, "Error status did not match");
                    expect(e.message).toEqual(invalidPageConditionErrorObjWOSort.messageWithCondition, "Error message did not match");
                    expect(e.errorData).toEqual(invalidPageConditionErrorObjWOSort.errorData, "errorData attribute did not match");
                }
            });

            it("it should throw an error for invalid pageing criteria with both after() and before().", function() {
                try {
                    options.ermRest.parse(baseUri + "/id=269@after(3)@before(7)", options.catalog);
                    expect(false).toBe(true, "invalid paging Criteria didn't throw any errors.");
                } catch (e) {
                    expect(e.status).toEqual(invalidPageConditionErrorObjWOSort.status, "Error status did not match");
                    expect(e.message).toEqual(invalidPageConditionErrorObjWOSort.messageWithConditions, "Error message did not match");
                    expect(e.errorData).toEqual(invalidPageConditionErrorObjWOSort.errorData, "errorData attribute did not match");
                }
            });

            it ("read should throw an error if sort and after are not the same length.", function (done) {
                options.ermRest.resolve(baseUri + "@sort(id)@after(1,2)", {cid: "test"}).then(function(reference) {
                    return reference.read(1);
                }).then(function () {
                    done.fail("expected read to throw error");
                }).catch(function(e) {
                    console.log(e);
                    expect(e.status).toEqual(invalidPageConditionErrorObjWSort.status, "Error status did not match");
                    expect(e.message).toEqual(invalidPageConditionErrorObjWSort.invalidAfterMessage, "Error message did not match");
                    expect(e.errorData).toEqual(invalidPageConditionErrorObjWSort.errorData, "errorData attribute did not match");
                    done();
                });
            });

            it ("read should throw an error if sort and before are not the same length.", function (done) {
                options.ermRest.resolve(baseUri + "@sort(id)@before(1,2,4)", {cid: "test"}).then(function(reference) {
                    return reference.read(1);
                }).then(function () {
                    done.fail("expected read to throw error");
                }).catch(function(e) {
                    expect(e.status).toEqual(invalidPageConditionErrorObjWSort.status, "Error status did not match");
                    expect(e.message).toEqual(invalidPageConditionErrorObjWSort.invalidBeforeMessage, "Error message did not match");
                    expect(e.errorData).toEqual(invalidPageConditionErrorObjWSort.errorData, "errorData attribute did not match");
                    done();
                });
            });
        });

        describe("when uri has invalid filter", function() {
            it("it should throw an error for invalid filter.", function() {
                try {
                    options.ermRest.parse(baseUri + "/id::gt:269", options.catalog);
                    expect(false).toBe(true, "invalid filter didn't throw any errors.");
                } catch (e) {
                    expect(e.status).toEqual(invalidFilterOperatorErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFilterOperatorErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFilterOperatorErrorObj.errorData, "errorData attribute did not match");
                }
            });

            it("it should throw an error for invalid filter with sort() modifier.", function() {
                try {
                    options.ermRest.parse(baseUri + "/id::gt:269@sort()", options.catalog);
                    expect(false).toBe(true, "invalid filter with sort() modifier didn't throw any errors.");
                } catch (e) {
                    expect(e.status).toEqual(invalidFilterOperatorErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidFilterOperatorErrorObj.messageWithSort, "Error message did not match");
                    expect(e.errorData).toEqual(invalidFilterOperatorErrorObj.errorDataWithSort, "errorData attribute did not match");
                }
            });
        });

        describe("when uri has invalid sort", function() {

            it("it should throw an error for invalid sort.", function(done) {
                options.ermRest.resolve(baseUri + "@sort(disabled_sort_col)", {cid: "test"}).then(function(reference) {
                    return reference.read(1);
                }).then(function () {
                    done.fail("expected read to throw error");
                }).catch(function(e) {
                    expect(e.status).toEqual(invalidSortCriteriaErrorObj.status, "Error status did not match");
                    expect(e.message).toEqual(invalidSortCriteriaErrorObj.message, "Error message did not match");
                    expect(e.errorData).toEqual(invalidSortCriteriaErrorObj.errorData, "errorData attribute did not match");
                    done();
                });
            });
        }); //describe

    });
}
