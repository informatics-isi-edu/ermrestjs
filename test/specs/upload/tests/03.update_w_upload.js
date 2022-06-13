var uploadUtils = require("../utils.js");
var utils = require("../../../utils/utilities.js");

exports.execute = function (options) {
    var exec = require('child_process').execSync;
    var FileAPI = require('file-api'), File = FileAPI.File;
    File.prototype.jsdom = true;

    describe("updating reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "upload";

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";
        var appLinkFn = function (tag, location) {
            var url;
            switch (tag) {
                case "tag:isrd.isi.edu,2016:chaise:record":
                    url = recordURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:record-two":
                    url = record2URL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:viewer":
                    url = viewerURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:search":
                    url = searchURL;
                    break;
                case "tag:isrd.isi.edu,2016:chaise:recordset":
                    url = recordsetURL;
                    break;
                default:
                    url = recordURL;
                    break;
            }

            url = url + "/" + location.path;

            return url;
        };

        beforeAll(function() {
            options.ermRest.appLinkFn(appLinkFn);
        });

        describe("for updating asset columns, ", function() {
            var reference, file1_column, file2_column,
                file1_columnName = "file1_uri",
                file2_columnName = "file2_uri",
                tableName = "file_update_table",
                sortBy = "key",
                baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName + "/key=1";

            // For update data
            var file1_url, file1_validRow, file2_url, file2_validRow, uploadObj1, uploadObj2, time1, time2;

            var files = [{
                    name: "testfile500kb.png",
                    size: 512000,
                    displaySize: "500KB",
                    type: "image/png",
                    hash: "4b178700e5f3b15ce799f2c6c1465741",
                    hash_64: "SxeHAOXzsVznmfLGwUZXQQ=="
                }, {
                    name: "testfile5MB.tiff",
                    size: 5242880,
                    displaySize: "5MB",
                    type: "text/plain",
                    hash: "08b46181d7094b5ece88bb389c7499af",
                    hash_64: "CLRhgdcJS17OiLs4nHSZrw=="
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
                    reference = reference.contextualize.entryEdit;

                    file1_column = reference.columns.find(function(c) { return c.name == file1_columnName;  });
                    file2_column = reference.columns.find(function(c) { return c.name == file2_columnName;  });

                    if (!file1_column) {
                        console.log("Unable to find column " + file1_columnName);
                        done.fail();
                        return;
                    } else if(!file2_column) {
                        console.log("Unable to find column " + file2_columnName);
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
                    timestamp: time1,
                    file2_uri: { md5_hex: files[1].hash }
                 };

                uploadObj2 = new options.ermRest.Upload(files[1].file, {
                    column: file2_column,
                    reference: reference,
                    chunkSize: 5 * 1024 * 1024
                });
                // File 2
                var expectedURL = "/hatrac/js/ermrestjs/" + file2_validRow.timestamp + "/.tiff/" + files[1].hash;
                uploadUtils.uploadFileForTests(files[1], 2, file2_validRow, expectedURL, uploadObj2, options).then(function(response) {
                    file2_url = response.url;
                    file2_validRow = response.validRow;

                    done();
                }, function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("the metadata for the asset should be updated.", function (done) {
                var tuples, tuple, updateData = {},
                    baseUrl = options.url.replace("/ermrest", "");

                reference.read(1).then(function(response) {
                    tuples = response.tuples;
                    tuple = tuples[0];

                    updateData = {
                        file1_uri: file1_url,
                        file1_bytes: file1_validRow.file1_bytes,
                        file1_MD5: file1_validRow.file1_MD5,
                        file1_name: file1_validRow.file1_name,
                        file2_uri: file2_url,
                        file2_bytes: file2_validRow.file2_bytes,
                        file2_MD5: file2_validRow.file2_MD5,
                        file2_name: file2_validRow.file2_name
                    }
                    var data = tuple.data;

                    for (var key in updateData) {
                        data[key] = updateData[key];
                    }

                    return reference.update(tuples);
                }).then(function (response) {
                    response = response.successful;
                    expect(response._data.length).toBe(1, "Update data set that was returned is not the right length");

                    utils.checkPageValues(response._data, tuples, sortBy);

                    // verify that reading the reference again returns the updated row
                    return reference.read(1);
                }).then(function (response) {
                    var pageData = response._data[0];

                    // file 1
                    expect(pageData.file1_uri).toBe(updateData.file1_uri, "Entity file1 uri does not match new file1 uri");
                    expect(pageData.file1_uri).not.toBe(tuple._oldData.file1_uri, "Entity file1 uri matches old file1 uri");

                    expect(pageData.file1_bytes).toBe(updateData.file1_bytes, "Entity file1 bytes does not match new file1 bytes");
                    expect(pageData.file1_bytes).not.toBe(tuple._oldData.file1_bytes, "Entity file1 bytes matches old file1 bytes");

                    expect(pageData.file1_MD5).toBe(updateData.file1_MD5, "Entity file1 md5 does not match new file1 md5");
                    expect(pageData.file1_MD5).not.toBe(tuple._oldData.file1_MD5, "Entity file1 md5 matches old file1 md5");

                    expect(pageData.file1_name).toBe(updateData.file1_name, "Entity file1 name does not match new file1 name");
                    expect(pageData.file1_name).not.toBe(tuple._oldData.file1_name, "Entity file1 name matches old file1 name");

                    // file 2
                    expect(pageData.file2_uri).toBe(updateData.file2_uri, "Entity file2 uri does not match new file2 uri");
                    expect(pageData.file2_uri).not.toBe(tuple._oldData.file2_uri, "Entity file2 uri matches old file2 uri");

                    expect(pageData.file2_bytes).toBe(updateData.file2_bytes, "Entity file2 bytes does not match new file2 bytes");
                    expect(pageData.file2_bytes).not.toBe(tuple._oldData.file2_bytes, "Entity file2 bytes matches old file2 bytes");

                    expect(pageData.file2_MD5).toBe(updateData.file2_MD5, "Entity file2 md5 does not match new file2 md5");
                    expect(pageData.file2_MD5).not.toBe(tuple._oldData.file2_MD5, "Entity file2 md5 matches old file2 md5");

                    expect(pageData.file2_name).toBe(updateData.file2_name, "Entity file2 name does not match new file2 name");
                    expect(pageData.file2_name).not.toBe(tuple._oldData.file2_name, "Entity file2 name matches old file2 name");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it ("clearing the asset column value should clear the metadata columns as well.", function (done) {
                var tuples, tuple, updateData = {},
                    baseUrl = options.url.replace("/ermrest", "");

                reference.read(1).then(function(response) {
                    tuples = response.tuples;
                    tuple = tuples[0];

                    updateData = {
                        file1_uri: null
                    }
                    var data = tuple.data;

                    for (var key in updateData) {
                        data[key] = updateData[key];
                    }

                    return reference.update(tuples);
                }).then(function (response) {
                    response = response.successful;
                    expect(response._data.length).toBe(1, "Update data set that was returned is not the right length");

                    utils.checkPageValues(response._data, tuples, sortBy);

                    // verify that reading the reference again returns the updated row
                    return reference.read(1);
                }).then(function (response) {
                    var pageData = response._data[0];
                    expect(pageData.file1_uri).toBe(null, "Entity file1 uri is not null.");
                    expect(pageData.file1_bytes).toBe(null, "Entity file1 bytes is not null.");
                    expect(pageData.file1_MD5).toBe(null, "Entity file1 md5 does is not null.");
                    expect(pageData.file1_name).toBe(null, "Entity file1 name does is not null.");
                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            afterAll(function(done) {
                // remove the files from the chaise folder
                for (var j=0; j<files.length; j++) {
                    var filePath = "test/specs/upload/files/" + files[j].name;
                    exec('rm ' + filePath);
                }

                // delete the files from hatrac
                uploadObj1.deleteFile().then(function() {

                    return uploadObj2.deleteFile();
                }).then(function() {

                    done();
                }).catch(function(err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });
    });
};
