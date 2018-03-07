
exports.execute = function (options) {
// Test Cases:
describe("for testing default values while creating an entity/entities,", function () {
    var reference, createReference;
    var catalog_id = process.env.DEFAULT_CATALOG,
        schemaName = "default_value_schema",
        tableName = "default_value_table"
    
    var baseUri = options.url + "/catalog/" + catalog_id + "/entity/"
        + schemaName + ":" + tableName;

    beforeAll(function (done) {
        options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
            reference = response;
            createReference = response.contextualize.entryCreate;
            done();
        }).catch(function (error) {
            console.dir(error);
            done.fail();
        });
    });
    
    xit("Creating entry should throw an error if id is not passed", function(done) {
        var rows = [{"text_col": "test1", "json_col": true,"jsonb_col":true}];
        createReference.create(rows).then(function(response) {
            done.fail();
        }).catch(function (err) { 
            expect(err.message.substring(0,12)).toEqual('409 Conflict');
            done();
        });
    }).pend("No Special case for JSON column, as they are supposed to work just like other columns");
    
    
    xit("JSON and JSONB column should abe able to store FALSE value", function(done) {
        var rows = [{"id": 10, "text_col": "test1", "json_col": false,"jsonb_col":false}];
        createReference.create(rows).then(function(response) {
            var page = response.successful;
            expect(page._data[0].json_col).toBe(false);
            expect(page._data[0].jsonb_col).toBe(false);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    });
    
    
    xit("JSON and JSONB column should be able to store null value", function(done) {
        var rows = [{"id": 11, "text_col": "test1", "json_col": null,"jsonb_col":null}];

        createReference.create(rows).then(function(response) {
            var page = response.successful;
            expect(page._data[0].json_col).toBe(null);
            expect(page._data[0].jsonb_col).toBe(null);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    }).pend("No Special case for JSON column, as they are supposed to work just like other columns");
    
    xit("JSON column should be able to store default value if not passed", function(done) {
        var rows = [{"id": 12, "text_col": "test1","jsonb_col":null}];

        createReference.create(rows).then(function(response) {
            var page = response.successful;
            expect(page._data[0].json_col).toBe(null);
            expect(page._data[0].jsonb_col).toBe(null);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    }).pend("No Special case for JSON column, as they are supposed to work just like other columns");
    
    xit("JSONB column should be able to store default value if not passed", function(done) {
        var rows = [{"id": 13, "text_col": "test1"}];

        createReference.create(rows).then(function(response) {
            var page = response.successful;
            expect(page._data[0].json_col).toBe(null);
            expect(page._data[0].jsonb_col).toBe(null);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    }).pend("No Special case for JSON column, as they are supposed to work just like other columns");
    
    
    
});
};
