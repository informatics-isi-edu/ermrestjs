exports.execute = function (options) {
	var exec = require('child_process').execSync;

	var  FileAPI = require('file-api'), File = FileAPI.File;
	File.prototype.jsdom = true;

    describe('For upload proces , ', function () {
        var schemaName = "upload",
            schema,
            tableName = "file",
            table,
            columnName = "uri",
            column,
            template = "/hatrac/{{{fk_id}}}/{{{uri.md5_hex}}}",
            ermRest,
            reference;

        var baseUrl = options.url.replace("/ermrest", "");

        var files = [{
        	name: "testfile50MB.pdf",
        	size: 52428800,
        	displaySize: "50MB",
        	type: "application/pdf"
        }, {
        	name: "testfile5MB.txt",
        	size: 5242880,
        	displaySize: "5MB",
        	type: "text/plain"
        }, {
        	name: "testfile500kb.png",
        	size: 512000,
        	displaySize: "500KB",
        	type: "image/png"
        }];

        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/"
            + schemaName + ":" + tableName;

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            ermRest = options.ermRest;


            files.forEach(function(f) {
	        	var filePath = "test/specs/upload/files/" + f.name

	        	exec('perl -e \'print "\1" x ' + f.size + '\' > ' + filePath);

	        	f.file = new File(filePath);
	        });

            options.ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                reference = response;
                reference = reference.contextualize.entryCreate;
            	column = reference.columns.find(function(c) { return c.name == columnName;  });

            	if (!column) {
            		console.log("Unable to find column " + columnName);
            		done.fail();
            		return;
            	} 
                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        files.forEach(function(f) {

        	(function(file) {

        		describe("For file " + file.name + "," , function() {

	        		var uploadObj, 
	        			invalidRow = { fk_id: null, uri : { md5_hex: "wfqewf4234" } }, 
	     				validRow = { fk_id: "800001", uri : { md5_hex: "wfqewf4234" } };

		        	it("should create an upload object", function(done) {

			        	try {
				        	uploadObj = new ermRest.Upload(file.file, {  
				        		column: column, 
				        		reference: reference,
				        		chunkSize: 5 * 1024 * 1024
			        		});

				        	expect(uploadObj instanceof ermRest.Upload).toBe(true);
				        	done();
			        	} catch(e) {
			    			console.dir(e);
			        		done.fail();
			        	}
			        });

			        it("should contains properties of file in `fileInfo` property of uploadObj (Size: " + file.size + " (" + file.displaySize + "), type: " + file.type + ", name: " + file.name + ")", function() {
			        	expect(uploadObj.fileInfo.size).toBe(file.size);
			        	expect(uploadObj.fileInfo.name).toBe(file.name);
			        	expect(uploadObj.fileInfo.type).toBe(file.type);
			        });

			        it("should show progress on calculation of checksum as well as calculate correct hash in hex and base64 format with correct url", function(done) {
			        	var uploaded = 0;

			        	uploadObj.calculateChecksum(validRow).then(function(url) {
			        		
			        		expect(uploaded).toBe(file.size, "File progress was not called for all checksum chunk calculation");
			        		
			        		expect(url).toBe(baseUrl + "/hatrac/ermrestjstest/800001/" + uploadObj.hash.md5_hex, "File generated url is not the same");


							done();

	                    }, function(e) {
	                    	console.dir(e);
	                    	expect(file).toBe("");
	                    	done.fail();
	                    }, function(uploadedSize) {
	                    	uploaded = uploadedSize;
	                    });

			        });

			        it("should create an upload job and return upload job url", function(done) {

			        	uploadObj.createUploadJob().then(function(url) {
			        		expect(url).toBeDefined("Chunk url not returned");
			        		done();
	                    }, function(e) {
	                    	console.dir(e);
	                    	expect(file).toBe("", e.message);
	                    	done.fail();
	                    });

			        });

			        it("should check for existing file and get resolved for 404 and 409 error codes as well as 200 HTTP code", function(done) {

			        	uploadObj.fileExists().then(function() {
			        		expect(true).toBe(true);
			        		done();
	                    }, function(e) {
	                    	console.dir(e);
	                    	expect(file).toBe("", e.message);
	                    	done.fail();
	                    });

			        });

			        it("should start upload, show progress and get final url on upload completion", function(done) {

			        	var uploaded = 0;

			        	uploadObj.start().then(function(url) {
			        		expect(uploaded).toBe(file.size, "File progress was not called for all uploading");
			        		expect(url).toBe(baseUrl + "/hatrac/ermrestjstest/800001/" + uploadObj.hash.md5_hex, "File  url is not the same");
			        		done();
	                    }, function(e) {
	                    	console.dir(e);
	                    	expect(file).toBe("");
	                    	done.fail();
	                    }, function(uploadedSize) {
	                    	expect(uploadedSize).toBeGreaterThan(0);
	                    	uploaded = uploadedSize;
	                    });

			        });

			        it("should complete upload job and return final url", function(done) {

			        	uploadObj.completeUpload().then(function(url) {
			        		expect(url).toContain(baseUrl + "/hatrac/ermrestjstest/800001/" + uploadObj.hash.md5_hex, "File  url is not the same");
			        		done();
	                    }, function(e) {
	                    	console.dir(e);
	                    	expect(file).toBe("");
	                    	done.fail();
	                    });

			        });

        		});

        	})(f);
        });

	
		afterAll(function(done) {
        	files.forEach(function(f) {
	        	var filePath = "test/specs/upload/files/" + f.name;
	        	exec('rm ' + filePath);
	        });
	        done();
        });


        
    });
}