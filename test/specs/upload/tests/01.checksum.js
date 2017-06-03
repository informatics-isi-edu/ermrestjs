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

        var files = [{
        	name: "testfile50MB.pdf",
        	size: 52428800,
        	displaySize: "50MB",
        	type: "application/pdf",
        	hash: "d54ead2fe9e6e2bf801bb62b3af43b91",
        	hash_64: "1U6tL+nm4r+AG7YrOvQ7kQ==",
        	doNotRunInTravis: true
        }, {
        	name: "testfile5MB.txt",
        	size: 5242880,
        	displaySize: "5MB",
        	type: "text/plain",
        	hash: "08b46181d7094b5ece88bb389c7499af",
        	hash_64: "CLRhgdcJS17OiLs4nHSZrw=="
        }, {
        	name: "testfile500kb.png",
        	size: 512000,
        	displaySize: "500KB",
        	type: "image/png",
        	hash: "4b178700e5f3b15ce799f2c6c1465741",
        	hash_64: "SxeHAOXzsVznmfLGwUZXQQ=="
        }];	

        if (process.env.TRAVIS) files = files.filter(function(f) { if (!f.doNotRunInTravis) return f; });

        var baseUri = options.url + "/catalog/" + process.env.DEFAULT_CATALOG + "/entity/"
            + schemaName + ":" + tableName;

        beforeAll(function (done) {
            schema = options.catalog.schemas.get(schemaName);
            ermRest = options.ermRest;

            files.forEach(function(f) {
	        	var filePath = "test/specs/upload/files/" + f.name

	        	exec("perl -e 'print \"\1\" x " + f.size + "' > " + filePath);

	        	//exec("dd if=/dev/random of=" + filePath + " bs=" + f.size + " count=1");
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


			        it("should return actual url for `generateURL` method as one of the properties 'fk_id' is not null in template `" + template + "`", function() {
			        	// Set hash object for testing generateUrl
		        		uploadObj.hash = { md5_hex: file.hash };

			        	//Note: Property uri.md5_hex is generated at runtime so we are setting it expliticly to test the function
			        	expect(uploadObj.generateURL(validRow)).toBe("/hatrac/ermrestjstest/800001/" + file.hash);
			        });


			        it("should show progress on calculation of checksum as well as calculate correct hash in hex and base64 format with correct url", function(done) {
			        	var chunkSize = uploadObj.PART_SIZE;

			        	var uploaded = 0;

			        	uploadObj.calculateChecksum(validRow).then(function(url) {
			        		
			        		expect(uploaded).toBe(file.size, "File progress was not called for all checksum chunk calculation");
			        		
			        		expect(url).toBe("/hatrac/ermrestjstest/800001/" + file.hash, "File generated url is not the same");

			        		expect(validRow.filename).toBe(file.name);
			        		expect(validRow.bytes).toBe(file.size);
			        		expect(validRow.checksum).toBe(file.hash);
			        		
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

        afterAll(function(done) {
        	files.forEach(function(f) {
	        	var filePath = "test/specs/upload/files/" + f.name;
	        	exec('rm ' + filePath);
	        });
	        done()
        })
        
    });
}