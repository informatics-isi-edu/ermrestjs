var uploadUtils = require("../utils.js");
var utils = require("../../../utils/utilities.js");

exports.execute = function (options) {
    var exec = require('child_process').execSync;
    var FileAPI = require('file-api'), File = FileAPI.File;
    File.prototype.jsdom = true;

    describe("creating reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "upload";

        describe("for creating asset columns, ", function() {
            var reference, file1_column, file2_column,
                file1_columnName = "file1_uri",
                file2_columnName = "file2_uri",
                file3_columnName = "file3_uri",
                tableName = "file_update_table",
                sortBy = "key",
                baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

            // For update data
            var file1_url, file1_validRow, file2_url, file2_validRow,file3_url, file3_validRow, uploadObj1, uploadObj2, uploadObj3, time1, time2, time3;

            var files = [{
                    name: "testfile500kb.png",
                    size: 512000,
                    displaySize: "500KB",
                    type: "image/png",
                    hash: "4b178700e5f3b15ce799f2c6c1465741",
                    hash_64: "SxeHAOXzsVznmfLGwUZXQQ=="
                }, {
                    name: "testfile5MB.omni.tiff",
                    size: 5242880,
                    displaySize: "5MB",
                    type: "text/plain",
                    hash: "08b46181d7094b5ece88bb389c7499af",
                    hash_64: "CLRhgdcJS17OiLs4nHSZrw=="
                }, {
                    name: "testfile0MB.some.extension",
                    size: 0,
                    displaySize: "0MB",
                    type: "text/plain",
                    hash: "d41d8cd98f00b204e9800998ecf8427e",
                    hash_64: "1B2M2Y8AsgTpgAmY7PhCfg=="
                }
            ];

            beforeAll(function (done) {

                for (var i=0; i<files.length; i++) {
                    var file = files[i];
                    var filePath = "test/specs/upload/files/" + file.name;

                    exec("perl -e 'print \"\1\" x " + file.size + "' > " + filePath);

                    file.file = new File(filePath);
                }

                options.ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                    reference = response;
                    reference = reference.contextualize.entryCreate;

                    file1_column = reference.columns.find(function(c) { return c.name == file1_columnName;  });
                    file2_column = reference.columns.find(function(c) { return c.name == file2_columnName;  });
                    file3_column = reference.columns.find(function(c) { return c.name == file3_columnName;  });

                    if (!file1_column) {
                        console.log("Unable to find column " + file1_columnName);
                        done.fail();
                        return;
                    } else if(!file2_column) {
                        console.log("Unable to find column " + file2_columnName);
                        done.fail();
                        return;
                    } else if(!file3_column) {
                        console.log("Unable to find column " + file3_columnName);
                        done.fail();
                        return;
                    } 

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("should upload file 1 properly.", function(done) {
                time1 = Date.now();

                file1_validRow = {
                    timestamp: time1,
                    file1_uri: { md5_hex: files[0].hash }
                 };

                uploadObj1 = new options.ermRest.Upload(files[0].file, {
                    column: file1_column,
                    reference: reference,
                    chunkSize: 5 * 1024 * 1024
                });
                // File 1
                var expectedURL = "/hatrac/js/ermrestjs/" + file1_validRow.timestamp + "/.png/" + files[0].hash;
                uploadUtils.uploadFileForTests(files[0], 1, file1_validRow, expectedURL, uploadObj1, options).then(function(response) {
                    file1_url = response.url;
                    file1_validRow = response.validRow;

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                })
            });

            it("should upload file 2 properly.", function(done) {
                time2 = Date.now();

                file2_validRow = {
                    timestamp: time2,
                    file2_uri: { md5_hex: files[1].hash }
                 };

                uploadObj2 = new options.ermRest.Upload(files[1].file, {
                    column: file2_column,
                    reference: reference,
                    chunkSize: 5 * 1024 * 1024
                });
                // File 2
                var expectedURL = "/hatrac/js/ermrestjs/" + file2_validRow.timestamp + "/.omni.tiff/" + files[1].hash;
                uploadUtils.uploadFileForTests(files[1], 2, file2_validRow, expectedURL, uploadObj2, options).then(function(response) {
                    file2_url = response.url;
                    file2_validRow = response.validRow;

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("should upload file 3 properly.", function(done) {
                time3 = Date.now();

                file3_validRow = {
                    timestamp: time3,
                    file3_uri: { md5_hex: files[2].hash }
                 };

                uploadObj3 = new options.ermRest.Upload(files[2].file, {
                    column: file3_column,
                    reference: reference,
                    chunkSize: 5 * 1024 * 1024
                });
                // File 3
                var expectedURL = "/hatrac/js/ermrestjs/" + file3_validRow.timestamp + "/.some.extension/" + files[2].hash;
                uploadUtils.uploadFileForTests(files[2], 3, file3_validRow, expectedURL, uploadObj3, options).then(function(response) {
                    file3_url = response.url;
                    file3_validRow = response.validRow;

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("the row should be created with the metadata set properly.", function (done) {
                var createReference, createDataset,
                    baseUrl = options.url.replace("/ermrest", "");

                createDataset = [{
                    key: 2,
                    file1_uri: file1_url,
                    file1_bytes: file1_validRow.file1_bytes,
                    file1_MD5: file1_validRow.file1_MD5,
                    file1_name: file1_validRow.file1_name,
                    file2_uri: file2_url,
                    file2_bytes: file2_validRow.file2_bytes,
                    file2_MD5: file2_validRow.file2_MD5,
                    file2_name: file2_validRow.file2_name,
                    file3_uri: file3_url,
                    file3_bytes: file3_validRow.file3_bytes,
                    file3_MD5: file3_validRow.file3_MD5,
                    file3_name: file3_validRow.file3_name
                }];

                reference.create(createDataset).then(function (response) {
                    response = response.successful;
                    expect(response._data.length).toBe(1, "Create data set that was returned is not the right size")

                    var tuples = [];
                    var tupleObj = {
                        _data: createDataset[0]
                    }
                    tuples.push(tupleObj);
                    utils.checkPageValues(response._data, tuples, sortBy);

                    var readUri = baseUri + "/key=2";

                    return options.ermRest.resolve(readUri, { cid: "test" });
                }).then(function (response) {
                    createReference = response;

                    // verify that reading the reference again returns the updated row
                    return createReference.read(1);
                }).then(function (response) {
                    var pageData = response._data[0];
                    var createData = createDataset[0];

                    expect(pageData.key).toBe(createData.key, "Entity key does no match created key");

                    // file 1
                    expect(pageData.file1_uri).toBe(createData.file1_uri, "Entity file1 uri does not match created file1 uri");
                    expect(pageData.file1_bytes).toBe(createData.file1_bytes, "Entity file1 bytes does not match created file1 bytes");
                    expect(pageData.file1_MD5).toBe(createData.file1_MD5, "Entity file1 md5 does not match created file1 md5");
                    expect(pageData.file1_name).toBe(createData.file1_name, "Entity file1 name does not match created file1 name");

                    // file 2
                    expect(pageData.file2_uri).toBe(createData.file2_uri, "Entity file2 uri does not match created file2 uri");
                    expect(pageData.file2_bytes).toBe(createData.file2_bytes, "Entity file2 bytes does not match created file2 bytes");
                    expect(pageData.file2_MD5).toBe(createData.file2_MD5, "Entity file2 md5 does not match created file2 md5");
                    expect(pageData.file2_name).toBe(createData.file2_name, "Entity file2 name does not match created file2 name");

                    // file 3
                    expect(pageData.file3_uri).toBe(createData.file3_uri, "Entity file3 uri does not match created file2 uri");
                    expect(pageData.file3_bytes).toBe(createData.file3_bytes, "Entity file3 bytes does not match created file2 bytes");
                    expect(pageData.file3_MD5).toBe(createData.file3_MD5, "Entity file3 md5 does not match created file2 md5");
                    expect(pageData.file3_name).toBe(createData.file3_name, "Entity file3 name does not match created file2 name");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            afterAll(function(done) {
                // remove the files from chaise
                for (var j=0; j<files.length; j++) {
                    var filePath = "test/specs/upload/files/" + files[j].name;
                    exec('rm ' + filePath);
                }

                // delete the files from hatrac
                uploadObj1.deleteFile().then(function() {
                    return uploadObj2.deleteFile();
                }).then(function() {
                    return uploadObj3.deleteFile();
                }).then(function() {
                    done();
                }).catch(function(err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });
    });
}
