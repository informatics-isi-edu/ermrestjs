exports.execute = function (options) {
	var exec = require('child_process').execSync;

	var  FileAPI = require('file-api'), File = FileAPI.File;
	File.prototype.jsdom = true;

    describe('For Checking upload object creation and checksum calculation works, ', function () {
        var schemaName = "upload",
            schema,
            tableName = "file",
            table,
            columnName = "uri",
            column,
            template = "/hatrac/ermrestjstest/{{{fk_id}}}/{{{uri.md5_hex}}}",
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

	        	exec("dd if=/dev/random of=" + filePath + " bs=" + f.size + " count=1");
	        	f.file = new File(filePath);
	        });

            options.ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                reference = response;
                reference = reference.contextualize.entryCreate;
            	column = reference.columns.find(function(c) { return c.name == columnName;  });

            	if (!column) throw new Error("Unable to find column " + columnName);
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

			        it("should return false for `validateurl` method as one of the properties 'fk_id' is null in template `" + template + "`", function() {
			        	//Note: Property uri.md5_hex is generated at runtime so we don't need to send it
			        	expect(uploadObj.validateURL(invalidRow)).toBe(false);
			        });

			        it("should return true for `validateurl` method as one of the properties 'fk_id' is not null in template `" + template + "`", function() {
		        		//Note: Property uri.md5_hex is generated at runtime so we don't need to send it
			        	expect(uploadObj.validateURL(validRow)).toBe(true);
			        });

			        it("should throw an error for `generateURL` method as one of the properties 'fk_id' is null in template `" + template + "`", function() {
			        	// Set hash object for testing generateUrl
		        		uploadObj.hash = { md5_hex: "md5" };

		        		var fn = uploadObj.generateURL.bind(uploadObj, invalidRow);

			        	//Note: Property uri.md5_hex is generated at runtime so we are setting it expliticly to test the function
			        	expect(fn).toThrow("Some column values are null in the template " + template);
			        });

			        it("should return actual url for `generateURL` method as one of the properties 'fk_id' is not null in template `" + template + "`", function() {
			        	// Set hash object for testing generateUrl
		        		uploadObj.hash = { md5_hex: "md5" };

			        	//Note: Property uri.md5_hex is generated at runtime so we are setting it expliticly to test the function
			        	expect(uploadObj.generateURL(validRow)).toBe(baseUrl + "/hatrac/ermrestjstest/800001/md5");
			        });


			        it("should show progress on calculation of checksum as well as calculate correct hash in hex and base64 format with correct url", function(done) {
			        	var chunkSize = uploadObj.PART_SIZE;

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

        		});

        	})(f);
        });

        afterAll(function() {
        	files.forEach(function(f) {
	        	var filePath = "test/specs/upload/files/" + f.name;
	        	exec('rm ' + filePath);
	        });
	        done()
        })
        
    });
}