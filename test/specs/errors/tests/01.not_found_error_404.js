exports.execute = function (options) {

    describe('For determining NotFound exceptions, ', function () {
        var server, ermRest, url, ops = {allowUnmocked: true}, catalog, schema, table, keys, key, colset, id = "3423423";

        beforeAll(function () {
            server = options.server;
            ermRest = options.ermRest;
            catalog = options.catalog;
            schema = catalog.schemas.get('visible_columns_schema');
            table = schema.tables.get('table_without_annotation');
            keys = table.keys.all();
            key = keys[0];
            colset = keys[1].colset;
            url = options.url.replace('ermrest', '');
        });

	    it("should give a HTTP 404 Notfound Error on non existing catalog retreival", function(done) {
	        
	        server.catalogs.get(id).then(null, function(err) {
	        	expect(err instanceof ermRest.NotFoundError).toBeTruthy();
	            done();
	        }).catch(function() {
	        	expect(false).toBe(true);
	        	done();
	        });
	        
	    });

	    it("should throw NotFound error on non existing schema retreival", function() {
	    	var schemaName = "non_existing_schema";
	        expect(function() { catalog.schemas.get(schemaName); } )
	        	.toThrow(new ermRest.NotFoundError("", "Schema " + schemaName + " not found in catalog."));
	    });

	    it("should throw NotFound error on non existing schema retreival", function() {
	    	var schemaName = "non_existing_schema";
	        expect(function() { catalog.schemas.get(schemaName); } )
	        	.toThrow(new ermRest.NotFoundError("", "Schema " + schemaName + " not found in catalog."));
	    });

	    it("should throw NotFound error on non existing table retreival", function() {
	    	var tableName = "non_existing_table";
	    	expect(function() { schema.tables.get(tableName); } )
	        	.toThrow(new ermRest.NotFoundError("", "Table " + tableName + " not found in schema."));
	    });

	    it("should throw NotFound error on non existing annotation retreival on a schema as well as a table", function() {
	    	var annotationName = "non_existing_annotation";

	    	expect(function() { schema.annotations.get(annotationName); } )
	        	.toThrow(new ermRest.NotFoundError("", "Annotation " + annotationName + " not found."));

        	expect(function() { table.annotations.get(annotationName); } )
	        	.toThrow(new ermRest.NotFoundError("", "Annotation " + annotationName + " not found."));
	    });

	    it("should throw NotFound error on non existing column retreival", function() {
	    	var column_name = "non_existing_column";
	    	expect(function() { table.columns.get(column_name); } )
	        	.toThrow(new ermRest.NotFoundError("", "Column " + column_name + " not found in table."));
	    });
/*
	    it("should throw NotFound error on non existing key retreival", function() {
	    	var key_name = "non_existing_key";
	    	expect(function() { table.keys.get(key_name); } )
	        	.toThrow(new ermRest.NotFoundError("", "Key " + key_name + " not found in table."));
	    });
*/
    });
};