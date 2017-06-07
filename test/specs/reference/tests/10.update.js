exports.execute = function (options) {
    var exec = require('child_process').execSync;
    var  FileAPI = require('file-api'), File = FileAPI.File;
	File.prototype.jsdom = true;

    /*
     * @param pageData - data retruned from update request
     * @param tuples - tuples sent to the database for update
     * verifies that the returned data is the same as the submitted data
     */
    function checkPageValues(pageData, tuples, sortBy) {
        pageData.sort(function(a, b) {
            return a[sortBy] - b[sortBy];
        });

        tuples.sort(function(a, b) {
            return a._data[sortBy] - b._data[sortBy];
        });

        for (var i = 0; i < pageData.length; i++) {
            var tupleData = tuples[i]._data;
            var columns = Object.keys(tupleData);
            var responseData = pageData[i];
            for (var j = 0; j < columns.length; j++) {
                var columnName = columns[j];
                expect(responseData[columnName]).toBe(tupleData[columnName]);
            }
        }
    }

    describe("updating reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "update_schema";

        it('when reference is not contextualized for `entry/edit` should throw an error.', function(done) {
            var tableName = "update_table",
                uri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName + "/ind_key1=2";

            var reference;
            var updateData = {
                "ind_key1": 777
            };

            options.ermRest.resolve(uri, {
                cid: "test"
            }).then(function (response) {
                reference = response;
                return reference.read(1);
            }).then(function (response) {
                var data = response.tuples[0].data;

                for (var key in updateData) {
                    data[key] = updateData[key];
                }

                return reference.update(response.tuples);
            }).then(function(response) {
                throw new Error("Did not return any errors");
            }).catch(function (err) {
                expect(err.message).toEqual("reference must be in 'entry/edit' context.");
                done();
            });

        });

        describe("for updating aliased columns, ", function () {
            var tableName = "alias_table",
                sortBy = "key", // column used to sort the data
                baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

            it("where a key and non-key share similar names when aliased.", function (done) {
                var tuples, tuple, reference,
                    uri = baseUri + "/key=1";

                var updateData = {
                    "key": 6
                };

                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference = response.contextualize.entryEdit;

                    return reference.read(1);
                }).then(function (response) {
                    tuples = response.tuples;
                    tuple = tuples[0];
                    var data = tuple.data;

                    for (var key in updateData) {
                        data[key] = updateData[key];
                    }

                    return reference.update(response.tuples);
                }).then(function (response) {
                    expect(response._data.length).toBe(1);

                    checkPageValues(response._data, tuples, sortBy);

                    var getUri = baseUri + "/key=6";
                    return options.ermRest.resolve(getUri, {cid: "test"});
                }).then(function (response) {
                    return response.read(1);
                }).then(function (response) {
                    var pageData = response._data[0];

                    expect(pageData.key).toBe(updateData.key);
                    expect(pageData.key).not.toBe(tuple._oldData.key);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });

        describe("for updating asset columns, ", function() {
            var reference, column,
                columnName = "uri",
                tableName = "file_update_table",
                sortBy = "key",
                baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName + "/key=1";

            var file = {
                name: "testfile500kb.png",
                size: 512000,
                displaySize: "500KB",
                type: "image/png",
                hash: "4b178700e5f3b15ce799f2c6c1465741",
                hash_64: "SxeHAOXzsVznmfLGwUZXQQ=="
            }

            beforeAll(function (done) {
                var filePath = "test/specs/reference/files/" + file.name;

                exec("perl -e 'print \"\1\" x " + file.size + "' > " + filePath);

	        	file.file = new File(filePath);

                options.ermRest.resolve(baseUri, { cid: "test" }).then(function (response) {
                    reference = response;
                    reference = reference.contextualize.entryEdit;

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

            it("the metadata for the asset should be updated.", function (done) {
                var tuples, tuple, fileUrl, updateData = {},
                    baseUrl = options.url.replace("/ermrest", "");

                var validRow = { key: 1, uri : { md5_hex: file.hash } };

                var uploadObj = new options.ermRest.Upload(file.file, {
                    column: column,
                    reference: reference,
                    chunkSize: 5 * 1024 * 1024
                });

                expect(uploadObj instanceof options.ermRest.Upload).toBe(true, "Upload object is not of type 'ermrest.Upload'");

                reference.read(1).then(function(response) {
                    tuples = response.tuples;
                    tuple = tuples[0];

                    return uploadObj.calculateChecksum(validRow);
                }).then(function(url) {
                    expect(url).toBe("/hatrac/" + validRow.key + "/" + file.hash, "File generated url is not the same after calculating the checksum");

                    expect(validRow.filename).toBe(file.name, "file.name is not the same");
                    expect(validRow.bytes).toBe(file.size, "file.size is not the same");
                    expect(validRow.File_MD5).toBe(file.hash, "file.hash is not the same");

                    return uploadObj.createUploadJob();
                }).then(function(url) {
                    expect(url).toBeDefined("Chunk url not returned");

                    return uploadObj.start();
                }).then(function(url) {
                    expect(url).toBe("/hatrac/" + validRow.key + "/" + file.hash, "File url is not the same during upload");

                    return uploadObj.completeUpload();
                }).then(function(url) {
                    expect(url).toContain("/hatrac/" + validRow.key + "/" + file.hash, "File url is not the same after upload has completed");

                    updateData = {
                        uri: url,
                        bytes: validRow.bytes,
                        File_MD5: validRow.File_MD5,
                        filename: validRow.filename
                    }
                    var data = tuple.data;

                    for (var key in updateData) {
                        data[key] = updateData[key];
                    }

                    return reference.update(tuples);
                }).then(function (response) {
                    expect(response._data.length).toBe(1, "Update data set that was returned is not the right length");

                    checkPageValues(response._data, tuples, sortBy);

                    // verify that reading the reference again returns the updated row
                    return reference.read(1);
                }).then(function (response) {
                    var pageData = response._data[0];

                    expect(pageData.uri).toBe(updateData.uri, "Entity uri does not match new uri");
                    expect(pageData.uri).not.toBe(tuple._oldData.uri, "Entity uri matches old uri");

                    expect(pageData.bytes).toBe(updateData.bytes, "Entity bytes does not match new bytes");
                    expect(pageData.bytes).not.toBe(tuple._oldData.bytes, "Entity bytes matches old bytes");

                    expect(pageData.File_MD5).toBe(updateData.File_MD5, "Entity md5 does not match new md5");
                    expect(pageData.File_MD5).not.toBe(tuple._oldData.File_MD5, "Entity md5 matches old md5");

                    expect(pageData.filename).toBe(updateData.filename, "Entity filename does not match new filename");
                    expect(pageData.filename).not.toBe(tuple._oldData.filename, "Entity filename matches old filename");

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            afterAll(function(done) {
                var filePath = "test/specs/reference/files/" + file.name;
                exec('rm ' + filePath);
                done();
            });
        });

        describe("for updating entities in update_table ", function () {
            var tableName = "update_table",
                sortBy = "ind_key1", // column used to sort the data
                baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

            describe("a single entity should return a page object, when ", function () {
                it("modifying an independent key that IS the shortest key.", function (done) {
                    var tuples, tuple, reference,
                        uri = baseUri + "/ind_key1=2";

                    var updateData = {
                        "ind_key1": 777
                    }

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        return reference.read(1);
                    }).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1, "response data is not the same size as given.");
                        expect(response.reference._context).toEqual("compact", "page reference is not in the correct context.");

                        checkPageValues(response._data, tuples, sortBy);

                        var getUri = baseUri + "/ind_key1=777";
                        return options.ermRest.resolve(getUri, {cid: "test"});
                    }).then(function (response) {
                        return response.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.ind_key1).toBe(updateData.ind_key1, "updated data is not correct.");
                        expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1, "data has not been updated.");

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });

            describe("a single entity should return a Page object, when multiple columns are modified. ", function () {
                it("One column is a non-key value and one is an independent key that IS the shortest key.", function (done) {
                    var tuples, tuple, reference,
                        uri = baseUri + "/ind_key1=777";

                    var updateData = {
                        "ind_key1": 2,
                        "non_key_col3": 36
                    }

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        return reference.read(1);
                    }).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        var getUri = baseUri + "/ind_key1=2";
                        return options.ermRest.resolve(getUri, {cid: "test"});
                    }).then(function (response) {
                        return response.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.ind_key1).toBe(updateData.ind_key1);
                        expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                        expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                        expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("2 key columns modified, both independent keys.", function (done) {
                    var tuples, tuple, reference,
                        uri = baseUri + "/ind_key1=2";

                    var updateData = {
                        "ind_key1": 777,
                        "ind_key2": "b_modified"
                    }

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        return reference.read(1);
                    }).then(function (response) {
                        tuples = response.tuples
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        var getUri = baseUri + "/ind_key1=777";
                        return options.ermRest.resolve(getUri, {cid: "test"});
                    }).then(function (response) {
                        return response.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.ind_key1).toBe(updateData.ind_key1);
                        expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                        expect(pageData.ind_key2).toBe(updateData.ind_key2);
                        expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("2 key columns modified, one independent key, that is the shortest key, and one part of a composite key.", function (done) {
                    var tuples, tuple, reference,
                        uri = baseUri + "/ind_key1=777";

                    var updateData = {
                        "ind_key1": 2,
                        "comp_shared_key_col": "manager"
                    }

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        return reference.read(1);
                    }).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        var getUri = baseUri + "/ind_key1=2";
                        return options.ermRest.resolve(getUri, {cid: "test"});
                    }).then(function (response) {
                        return response.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.ind_key1).toBe(updateData.ind_key1);
                        expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                        expect(pageData.comp_shared_key_col).toBe(updateData.comp_shared_key_col);
                        expect(pageData.comp_shared_key_col).not.toBe(tuple._oldData.comp_shared_key_col);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                describe("3 key columns modified, two independent keys, ", function () {
                    it("and one part of a composite key.", function (done) {
                        var tuples, tuple, reference,
                            uri = baseUri + "/ind_key1=2";

                        var updateData = {
                            "ind_key1": 777,
                            "ind_key2": "b_re-modified",
                            "comp_key1_col2": "Lars"
                        }

                        options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                            reference = response.contextualize.entryEdit;

                            return reference.read(1);
                        }).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            var getUri = baseUri + "/ind_key1=777";
                            return options.ermRest.resolve(getUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.ind_key1).toBe(updateData.ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                            expect(pageData.ind_key2).toBe(updateData.ind_key2);
                            expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                            expect(pageData.comp_key1_col2).toBe(updateData.comp_key1_col2);
                            expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("and one non-key value.", function (done) {
                        var tuples, tuple, reference,
                            uri = baseUri + "/ind_key1=777";

                        var updateData = {
                            "ind_key1": 2,
                            "ind_key2": "b",
                            "non_key_col3": 36006
                        }

                        options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                            reference = response.contextualize.entryEdit;

                            return reference.read(1);
                        }).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            var getUri = baseUri + "/ind_key1=2";
                            return options.ermRest.resolve(getUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.ind_key1).toBe(updateData.ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                            expect(pageData.ind_key2).toBe(updateData.ind_key2);
                            expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                            expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                            expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });
            });

            describe("a single entity should return a Page object, when ", function () {
                var reference;

                beforeAll(function (done) {
                    var uri = baseUri + "/ind_key1=1";

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                /* A single column is modified */
                it("modifying an independent key that is NOT the shortest key.", function (done) {
                    var tuples, tuple;

                    var updateData = {
                        "ind_key2": "bbbbbbbbbb"
                    }

                    reference.read(1).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        return reference.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.ind_key2).toBe(updateData.ind_key2);
                        expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("modifying a column that's part of 1 composite key.", function (done) {
                    var tuples, tuple;

                    var updateData = {
                        "comp_key1_col3": "Watson-Smith"
                    }

                    reference.read(1).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        return reference.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.comp_key1_col3).toBe(updateData.comp_key1_col3);
                        expect(pageData.comp_key1_col3).not.toBe(tuple._oldData.comp_key1_col3);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("modifying a column that's part of 2 separate composite keys.", function (done) {
                    var tuples, tuple;

                    var updateData = {
                        "comp_shared_key_col": "businessman"
                    }

                    reference.read(1).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        return reference.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.comp_shared_key_col).toBe(updateData.comp_shared_key_col);
                        expect(pageData.comp_shared_key_col).not.toBe(tuple._oldData.comp_shared_key_col);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("modifying a non-key value.", function (done) {
                    var tuples, tuple;

                    var updateData = {
                        "non_key_col3": 117
                    }

                    reference.read(1).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        return reference.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                        expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                /* Multiple columns modified */
                describe("multiple columns are modified. ", function () {
                    it("Columns are non-key values.", function (done) {
                        var tuples, tuple;

                        var updateData = {
                            "non_key_col1": "modified sales text",
                            "non_key_col3": 7117
                        }

                        reference.read(1).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            return reference.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.non_key_col1).toBe(updateData.non_key_col1);
                            expect(pageData.non_key_col1).not.toBe(tuple._oldData.non_key_col1);

                            expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                            expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("One column is a non-key value and one is part of a composite key.", function (done) {
                        var tuples, tuple;

                        var updateData = {
                            "comp_key1_col2": "Stephen",
                            "non_key_col3": 67117
                        }

                        reference.read(1).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            return reference.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.comp_key1_col2).toBe(updateData.comp_key1_col2);
                            expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                            expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                            expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("One column is a non-key value and one is an independent key that is NOT the shortest key.", function (done) {
                        var tuples, tuple;

                        var updateData = {
                            "ind_key2": "aabbccdd",
                            "non_key_col3": 3667117
                        }

                        reference.read(1).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            return reference.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.ind_key2).toBe(updateData.ind_key2);
                            expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                            expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                            expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    describe("2 key columns modified, ", function () {
                        describe("both part of the same composite key.", function () {
                            it("One column is part of another key as well.", function (done) {
                                var tuples, tuple;

                                var updateData = {
                                    "comp_key2_col1": "automobile",
                                    "comp_shared_key_col": "artisan"
                                }

                                reference.read(1).then(function (response) {
                                    tuples = response.tuples;
                                    tuple = tuples[0];
                                    var data = tuple.data;

                                    for (var key in updateData) {
                                        data[key] = updateData[key];
                                    }

                                    return reference.update(response.tuples);
                                }).then(function (response) {
                                    expect(response._data.length).toBe(1);

                                    checkPageValues(response._data, tuples, sortBy);

                                    return reference.read(1);
                                }).then(function (response) {
                                    var pageData = response._data[0];

                                    expect(pageData.comp_key2_col1).toBe(updateData.comp_key2_col1);
                                    expect(pageData.comp_key2_col1).not.toBe(tuple._oldData.comp_key2_col1);

                                    expect(pageData.comp_shared_key_col).toBe(updateData.comp_shared_key_col);
                                    expect(pageData.comp_shared_key_col).not.toBe(tuple._oldData.comp_shared_key_col);

                                    done();
                                }).catch(function (error) {
                                    console.dir(error);
                                    done.fail();
                                });
                            });

                            it("Both columns are part of a distinct composite key.", function (done) {
                                var tuples, tuple;

                                var updateData = {
                                    "comp_key1_col1": "Stuart",
                                    "comp_key1_col2": "Jonas"
                                }

                                reference.read(1).then(function (response) {
                                    tuples = response.tuples;
                                    tuple = tuples[0];
                                    var data = tuple.data;

                                    for (var key in updateData) {
                                        data[key] = updateData[key];
                                    }

                                    return reference.update(response.tuples);
                                }).then(function (response) {
                                    expect(response._data.length).toBe(1);

                                    checkPageValues(response._data, tuples, sortBy);

                                    return reference.read(1);
                                }).then(function (response) {
                                    var pageData = response._data[0];

                                    expect(pageData.comp_key1_col1).toBe(updateData.comp_key1_col1);
                                    expect(pageData.comp_key1_col1).not.toBe(tuple._oldData.comp_key1_col1);

                                    expect(pageData.comp_key1_col2).toBe(updateData.comp_key1_col2);
                                    expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                                    done();
                                }).catch(function (error) {
                                    console.dir(error);
                                    done.fail();
                                });
                            });
                        });

                        it("both part of separate composite keys.", function (done) {
                            var tuples, tuple;

                            var updateData = {
                                "comp_key2_col1": "motorcycle",
                                "comp_key3_col1": "pickled goods"
                            }

                            reference.read(1).then(function (response) {
                                tuples = response.tuples;
                                tuple = tuples[0];
                                var data = tuple.data;

                                for (var key in updateData) {
                                    data[key] = updateData[key];
                                }

                                return reference.update(response.tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(1);

                                checkPageValues(response._data, tuples, sortBy);

                                return reference.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0];

                                expect(pageData.comp_key2_col1).toBe(updateData.comp_key2_col1);
                                expect(pageData.comp_key2_col1).not.toBe(tuple._oldData.comp_key2_col1);

                                expect(pageData.comp_key3_col1).toBe(updateData.comp_key3_col1);
                                expect(pageData.comp_key3_col1).not.toBe(tuple._oldData.comp_key3_col1);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });

                        it("one independent key, that isn't the shortest key, and one part of a composite key.", function (done) {
                            var tuples, tuple;

                            var updateData = {
                                "ind_key2": "asdfjkl",
                                "comp_key1_col3": "Mahoney"
                            }

                            reference.read(1).then(function (response) {
                                tuples = response.tuples;
                                tuple = tuples[0];
                                var data = tuple.data;

                                for (var key in updateData) {
                                    data[key] = updateData[key];
                                }

                                return reference.update(response.tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(1);

                                checkPageValues(response._data, tuples, sortBy);

                                return reference.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0];

                                expect(pageData.ind_key2).toBe(updateData.ind_key2);
                                expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                                expect(pageData.comp_key1_col3).toBe(updateData.comp_key1_col3);
                                expect(pageData.comp_key1_col3).not.toBe(tuple._oldData.comp_key1_col3);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });
                    });

                    describe("3 key columns modified, ", function () {
                        it("all part of composite keys.", function (done) {
                            var tuples, tuple;

                            var updateData = {
                                "comp_key1_col1": "Winona",
                                "comp_key1_col2": "Marie",
                                "comp_key1_col3": "Mansfield"
                            }

                            reference.read(1).then(function (response) {
                                tuples = response.tuples;
                                tuple = tuples[0];
                                var data = tuple.data;

                                for (var key in updateData) {
                                    data[key] = updateData[key];
                                }

                                return reference.update(response.tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(1);

                                checkPageValues(response._data, tuples, sortBy);

                                return reference.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0];

                                expect(pageData.comp_key1_col1).toBe(updateData.comp_key1_col1);
                                expect(pageData.comp_key1_col1).not.toBe(tuple._oldData.comp_key1_col1);

                                expect(pageData.comp_key1_col2).toBe(updateData.comp_key1_col2);
                                expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                                expect(pageData.comp_key1_col3).toBe(updateData.comp_key1_col3);
                                expect(pageData.comp_key1_col3).not.toBe(tuple._oldData.comp_key1_col3);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });

                        it("one independent key and two part of composite keys.", function (done) {
                            var tuples, tuple;

                            var updateData = {
                                "ind_key2": "qwerty",
                                "comp_key1_col2": "Frank",
                                "comp_key3_col1": "house"
                            }

                            reference.read(1).then(function (response) {
                                tuples = response.tuples;
                                tuple = tuples[0];
                                var data = tuple.data;

                                for (var key in updateData) {
                                    data[key] = updateData[key];
                                }

                                return reference.update(response.tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(1);

                                checkPageValues(response._data, tuples, sortBy);

                                return reference.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0];

                                expect(pageData.ind_key2).toBe(updateData.ind_key2);
                                expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                                expect(pageData.comp_key1_col2).toBe(updateData.comp_key1_col2);
                                expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                                expect(pageData.comp_key3_col1).toBe(updateData.comp_key3_col1);
                                expect(pageData.comp_key3_col1).not.toBe(tuple._oldData.comp_key3_col1);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });
                    });

                    describe("3 columns modified, one non-key value", function () {
                        it(" and two part of composite keys.", function (done) {
                            var tuples, tuple;

                            var updateData = {
                                "non_key_col2": "remove this please",
                                "comp_key1_col2": "Randolph",
                                "comp_key2_col1": "boat"
                            }

                            reference.read(1).then(function (response) {
                                tuples = response.tuples;
                                tuple = tuples[0];
                                var data = tuple.data;

                                for (var key in updateData) {
                                    data[key] = updateData[key];
                                }

                                return reference.update(response.tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(1);

                                checkPageValues(response._data, tuples, sortBy);

                                return reference.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0];

                                expect(pageData.non_key_col2).toBe(updateData.non_key_col2);
                                expect(pageData.non_key_col2).not.toBe(tuple._oldData.non_key_col2);

                                expect(pageData.comp_key1_col2).toBe(updateData.comp_key1_col2);
                                expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                                expect(pageData.comp_key2_col1).toBe(updateData.comp_key2_col1);
                                expect(pageData.comp_key2_col1).not.toBe(tuple._oldData.comp_key2_col1);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });

                        it(", one part of a composite key, and one independent key.", function (done) {
                            var tuples, tuple;

                            var updateData = {
                                "non_key_col3": 3003,
                                "comp_key1_col3": "Wallace-Jennings",
                                "comp_key2_col1": "car"
                            }

                            reference.read(1).then(function (response) {
                                tuples = response.tuples;
                                tuple = tuples[0];
                                var data = tuple.data;

                                for (var key in updateData) {
                                    data[key] = updateData[key];
                                }

                                return reference.update(response.tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(1);

                                checkPageValues(response._data, tuples, sortBy);

                                return reference.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0];

                                expect(pageData.non_key_col3).toBe(updateData.non_key_col3);
                                expect(pageData.non_key_col3).not.toBe(tuple._oldData.non_key_col3);

                                expect(pageData.comp_key1_col3).toBe(updateData.comp_key1_col3);
                                expect(pageData.comp_key1_col3).not.toBe(tuple._oldData.comp_key1_col3);

                                expect(pageData.comp_key2_col1).toBe(updateData.comp_key2_col1);
                                expect(pageData.comp_key2_col1).not.toBe(tuple._oldData.comp_key2_col1);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });
                    });
                });

            });

            describe("multiple entities, ", function () {
                describe("where one column is changed and it's the shortest independent key ", function () {
                    it("in both entities.", function (done) {
                        var reference, tuples,
                            uri = baseUri + "/ind_key1=3;ind_key1=4";

                        var updateData = [{
                            "ind_key1": 38
                        }, {
                            "ind_key1": 42
                        }]

                        options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                            reference = response.contextualize.entryEdit;

                            return reference.read(2);
                        }).then(function (response) {
                            tuples = response.tuples;

                            for (var i = 0; i < tuples.length; i++) {
                                for (var key in updateData[i]) {
                                    tuples[i].data[key] = updateData[i][key];
                                }
                            }

                            return reference.update(tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(updateData.length);

                            checkPageValues(response._data, tuples, sortBy);

                            // Retrieve each updated tuple and verify only updateData columns were changed

                            var getFirstUri = baseUri + "/ind_key1=38";
                            return options.ermRest.resolve(getFirstUri);
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[0];

                            // Only ind_key1 should have changed
                            expect(pageData.ind_key1).toBe(updateData[0].ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                            expect(pageData.ind_key2).toBe(tuple._oldData.ind_key2);
                            expect(pageData.comp_key1_col1).toBe(tuple._oldData.comp_key1_col1);
                            expect(pageData.comp_key1_col2).toBe(tuple._oldData.comp_key1_col2);
                            expect(pageData.comp_key1_col3).toBe(tuple._oldData.comp_key1_col3);

                            expect(pageData.comp_key2_col1).toBe(tuple._oldData.comp_key2_col1);
                            expect(pageData.comp_key3_col1).toBe(tuple._oldData.comp_key3_col1);
                            expect(pageData.comp_shared_key_col).toBe(tuple._oldData.comp_shared_key_col);

                            expect(pageData.non_key_col1).toBe(tuple._oldData.non_key_col1);
                            expect(pageData.non_key_col2).toBe(tuple._oldData.non_key_col2);
                            expect(pageData.non_key_col3).toBe(tuple._oldData.non_key_col3);


                            var getSecondUri = baseUri + "/ind_key1=42";
                            return options.ermRest.resolve(getSecondUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[1];

                            // Only ind_key1 should have changed
                            expect(pageData.ind_key1).toBe(updateData[1].ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                            expect(pageData.ind_key2).toBe(tuple._oldData.ind_key2);
                            expect(pageData.comp_key1_col1).toBe(tuple._oldData.comp_key1_col1);
                            expect(pageData.comp_key1_col2).toBe(tuple._oldData.comp_key1_col2);
                            expect(pageData.comp_key1_col3).toBe(tuple._oldData.comp_key1_col3);

                            expect(pageData.comp_key2_col1).toBe(tuple._oldData.comp_key2_col1);
                            expect(pageData.comp_key3_col1).toBe(tuple._oldData.comp_key3_col1);
                            expect(pageData.comp_shared_key_col).toBe(tuple._oldData.comp_shared_key_col);

                            expect(pageData.non_key_col1).toBe(tuple._oldData.non_key_col1);
                            expect(pageData.non_key_col2).toBe(tuple._oldData.non_key_col2);
                            expect(pageData.non_key_col3).toBe(tuple._oldData.non_key_col3);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("in one of the entities.", function (done) {
                        var reference, tuples,
                            uri = baseUri + "/ind_key1=38;ind_key1=42";

                        var updateData = [{
                            "ind_key1": 3
                        }, {
                            "comp_key2_col1": "plane"
                        }];

                        options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                            reference = response.contextualize.entryEdit;

                            return reference.read(2);
                        }).then(function (response) {
                            tuples = response.tuples;

                            for (var i = 0; i < tuples.length; i++) {
                                for (var key in updateData[i]) {
                                    tuples[i].data[key] = updateData[i][key];
                                }
                            }

                            return reference.update(tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(updateData.length);

                            checkPageValues(response._data, tuples, sortBy);

                            // Retrieve each updated tuple and verify only updateData columns were changed

                            var getFirstUri = baseUri + "/ind_key1=3";
                            return options.ermRest.resolve(getFirstUri);
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[0];

                            // Only ind_key1 should have changed
                            expect(pageData.ind_key1).toBe(updateData[0].ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);


                            var getSecondUri = baseUri + "/ind_key1=42";
                            return options.ermRest.resolve(getSecondUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[1];

                            // Only comp_key2_col1 should have changed
                            expect(pageData.comp_key2_col1).toBe(updateData[1].comp_key2_col1);
                            expect(pageData.comp_key2_col1).not.toBe(tuple._oldData.comp_key2_col1);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });

                describe("where multiple columns are changed, ", function () {
                    it("one entity has it's shortest independent key changed.", function (done) {
                        var reference, tuples,
                            uri = baseUri + "/ind_key1=3;ind_key1=42";

                        var updateData = [{
                            "comp_key1_col2": "Mary",
                            "comp_key1_col3": "Bigelow"
                        }, {
                            "ind_key1": 4,
                            "non_key_col2": "just owner text"
                        }]

                        options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                            reference = response.contextualize.entryEdit;

                            return reference.read(2);
                        }).then(function (response) {
                            tuples = response.tuples;

                            for (var i = 0; i < tuples.length; i++) {
                                for (var key in updateData[i]) {
                                    tuples[i].data[key] = updateData[i][key];
                                }
                            }

                            return reference.update(tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(updateData.length);

                            checkPageValues(response._data, tuples, sortBy);

                            // Retrieve each updated tuple and verify only updateData columns were changed

                            var getFirstUri = baseUri + "/ind_key1=3";
                            return options.ermRest.resolve(getFirstUri);
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[0];

                            expect(pageData.comp_key1_col2).toBe(updateData[0].comp_key1_col2);
                            expect(pageData.comp_key1_col2).not.toBe(tuple._oldData.comp_key1_col2);

                            expect(pageData.comp_key1_col3).toBe(updateData[0].comp_key1_col3);
                            expect(pageData.comp_key1_col3).not.toBe(tuple._oldData.comp_key1_col3);

                            var getSecondUri = baseUri + "/ind_key1=4";
                            return options.ermRest.resolve(getSecondUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[1];

                            expect(pageData.ind_key1).toBe(updateData[1].ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                            expect(pageData.non_key_col2).toBe(updateData[1].non_key_col2);
                            expect(pageData.non_key_col2).not.toBe(tuple._oldData.non_key_col2);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("between 3 entities, one has it's shortest key modified.", function (done) {
                        var reference, tuples,
                            uri = baseUri + "/ind_key1=1;ind_key1=3;ind_key1=4";

                        var updateData = [{
                            "ind_key1": 100101110,
                            "comp_shared_key_col": "pilot"
                        }, {
                            "ind_key2": "c_mod",
                            "comp_key1_col1": "Deborah"
                        }, {
                            "ind_key2": "d_mod",
                            "comp_shared_key_col": "senior manager"
                        }];

                        options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                            reference = response.contextualize.entryEdit;

                            return reference.read(3);
                        }).then(function (response) {
                            tuples = response.tuples;

                            for (var i = 0; i < tuples.length; i++) {
                                for (var key in updateData[i]) {
                                    tuples[i].data[key] = updateData[i][key];
                                }
                            }

                            return reference.update(tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(updateData.length);

                            checkPageValues(response._data, tuples, sortBy);

                            // Retrieve each updated tuple and verify only updateData columns were changed

                            var getFirstUri = baseUri + "/ind_key1=100101110";
                            return options.ermRest.resolve(getFirstUri);
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[0];

                            expect(pageData.ind_key1).toBe(updateData[0].ind_key1);
                            expect(pageData.ind_key1).not.toBe(tuple._oldData.ind_key1);

                            expect(pageData.comp_shared_key_col).toBe(updateData[0].comp_shared_key_col);
                            expect(pageData.comp_shared_key_col).not.toBe(tuple._oldData.comp_shared_key_col);

                            var getSecondUri = baseUri + "/ind_key1=3";
                            return options.ermRest.resolve(getSecondUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[1];

                            expect(pageData.ind_key2).toBe(updateData[1].ind_key2);
                            expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                            expect(pageData.comp_key1_col1).toBe(updateData[1].comp_key1_col1);
                            expect(pageData.comp_key1_col1).not.toBe(tuple._oldData.comp_key1_col1);

                            var getThirdUri = baseUri + "/ind_key1=4";
                            return options.ermRest.resolve(getThirdUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[2];

                            expect(pageData.ind_key2).toBe(updateData[2].ind_key2);
                            expect(pageData.ind_key2).not.toBe(tuple._oldData.ind_key2);

                            expect(pageData.comp_shared_key_col).toBe(updateData[2].comp_shared_key_col);
                            expect(pageData.comp_shared_key_col).not.toBe(tuple._oldData.comp_shared_key_col);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });
            });
        });

        describe("for updating entities with foreign keys ", function () {
            var tableName = "update_table_with_foreign_key",
                sortBy = "key",
                baseUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName;

            describe("a single entity should return a page object, when ", function () {
                var reference;

                beforeAll(function (done) {
                    var uri = baseUri + "/key=1";

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("modifying an independent foreign key.", function (done) {
                    var tuples, tuple;

                    var updateData = {
                        "ind_fkey1_col1": 3
                    }

                    reference.read(1).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        return reference.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.ind_fkey1_col1).toBe(updateData.ind_fkey1_col1);
                        expect(pageData.ind_fkey1_col1).not.toBe(tuple._oldData.ind_fkey1_col1);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it("modifying 1 column in a composite foreign key.", function (done) {
                    var tuples, tuple;

                    var updateData = {
                        "comp_fkey1_col2": 4
                    }

                    reference.read(1).then(function (response) {
                        tuples = response.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }

                        return reference.update(response.tuples);
                    }).then(function (response) {
                        expect(response._data.length).toBe(1);

                        checkPageValues(response._data, tuples, sortBy);

                        return reference.read(1);
                    }).then(function (response) {
                        var pageData = response._data[0];

                        expect(pageData.comp_fkey1_col2).toBe(updateData.comp_fkey1_col2);
                        expect(pageData.comp_fkey1_col2).not.toBe(tuple._oldData.comp_fkey1_col2);

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                describe("modifying multiple columns, ", function () {
                    it("modifying 1 independent foreign key and 1 composite key column.", function (done) {
                        var tuples, tuple;

                        var updateData = {
                            "ind_fkey1_col1": 4,
                            "comp_fkey1_col1": 2
                        }

                        reference.read(1).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            return reference.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.ind_fkey1_col1).toBe(updateData.ind_fkey1_col1);
                            expect(pageData.ind_fkey1_col1).not.toBe(tuple._oldData.ind_fkey1_col1);

                            expect(pageData.comp_fkey1_col1).toBe(updateData.comp_fkey1_col1);
                            expect(pageData.comp_fkey1_col1).not.toBe(tuple._oldData.comp_fkey1_col1);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("modifying 2 composite key columns.", function (done) {
                        var tuples, tuple;

                        var updateData = {
                            "comp_fkey1_col1": 10,
                            "comp_fkey1_col2": 15
                        }

                        reference.read(1).then(function (response) {
                            tuples = response.tuples;
                            tuple = tuples[0];
                            var data = tuple.data;

                            for (var key in updateData) {
                                data[key] = updateData[key];
                            }

                            return reference.update(response.tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(1);

                            checkPageValues(response._data, tuples, sortBy);

                            return reference.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0];

                            expect(pageData.comp_fkey1_col1).toBe(updateData.comp_fkey1_col1);
                            expect(pageData.comp_fkey1_col1).not.toBe(tuple._oldData.comp_fkey1_col1);

                            expect(pageData.comp_fkey1_col2).toBe(updateData.comp_fkey1_col2);
                            expect(pageData.comp_fkey1_col2).not.toBe(tuple._oldData.comp_fkey1_col2);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });
                });
            });

            describe("multiple entities should return a page object, when ", function () {
                var reference;

                beforeAll(function (done) {
                    var uri = baseUri + "/key=2;key=3";

                    options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                        reference = response.contextualize.entryEdit;

                        done();
                    }).catch(function (error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                describe("one column is changed and it's the independent foreign key ", function () {
                    it("in both entities.", function (done) {
                        var tuples;

                        var updateData = [{
                            "ind_fkey1_col1": 4
                        }, {
                            "ind_fkey1_col1": 5
                        }]

                        reference.read(2).then(function (response) {
                            tuples = response.tuples;

                            for (var i = 0; i < tuples.length; i++) {
                                for (var key in updateData[i]) {
                                    tuples[i].data[key] = updateData[i][key];
                                }
                            }

                            return reference.update(tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(updateData.length);

                            checkPageValues(response._data, tuples, sortBy);

                            // Retrieve each updated tuple and verify only updateData columns were changed

                            var getFirstUri = baseUri + "/key=2";
                            return options.ermRest.resolve(getFirstUri);
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[0];

                            // Only ind_fkey1_col1 should have changed
                            expect(pageData.ind_fkey1_col1).toBe(updateData[0].ind_fkey1_col1);
                            expect(pageData.ind_fkey1_col1).not.toBe(tuple._oldData.ind_fkey1_col1);

                            expect(pageData.key).toBe(tuple._oldData.key);
                            expect(pageData.comp_fkey1_col1).toBe(tuple._oldData.comp_fkey1_col1);
                            expect(pageData.comp_fkey1_col2).toBe(tuple._oldData.comp_fkey1_col2);

                            var getSecondUri = baseUri + "/key=3";
                            return options.ermRest.resolve(getSecondUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[1];

                            // Only ind_fkey1_col1 should have changed
                            expect(pageData.ind_fkey1_col1).toBe(updateData[1].ind_fkey1_col1);
                            expect(pageData.ind_fkey1_col1).not.toBe(tuple._oldData.ind_fkey1_col1);

                            expect(pageData.key).toBe(tuple._oldData.key);
                            expect(pageData.comp_fkey1_col1).toBe(tuple._oldData.comp_fkey1_col1);
                            expect(pageData.comp_fkey1_col2).toBe(tuple._oldData.comp_fkey1_col2);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    it("in one of the entities.", function (done) {
                        var tuples;

                        var updateData = [{
                            "ind_fkey1_col1": 2
                        }, {
                            "comp_fkey1_col2": 1
                        }]

                        reference.read(2).then(function (response) {
                            tuples = response.tuples;

                            for (var i = 0; i < tuples.length; i++) {
                                for (var key in updateData[i]) {
                                    tuples[i].data[key] = updateData[i][key];
                                }
                            }

                            return reference.update(tuples);
                        }).then(function (response) {
                            expect(response._data.length).toBe(updateData.length);

                            checkPageValues(response._data, tuples, sortBy);

                            // Retrieve each updated tuple and verify only updateData columns were changed

                            var getFirstUri = baseUri + "/key=2";
                            return options.ermRest.resolve(getFirstUri);
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[0];

                            // Only ind_fkey1_col1 should have changed
                            expect(pageData.ind_fkey1_col1).toBe(updateData[0].ind_fkey1_col1);
                            expect(pageData.ind_fkey1_col1).not.toBe(tuple._oldData.ind_fkey1_col1);

                            expect(pageData.key).toBe(tuple._oldData.key);
                            expect(pageData.comp_fkey1_col1).toBe(tuple._oldData.comp_fkey1_col1);
                            expect(pageData.comp_fkey1_col2).toBe(tuple._oldData.comp_fkey1_col2);

                            var getSecondUri = baseUri + "/key=3";
                            return options.ermRest.resolve(getSecondUri, {cid: "test"});
                        }).then(function (response) {
                            return response.read(1);
                        }).then(function (response) {
                            var pageData = response._data[0],
                                tuple = tuples[1];

                            // Only ind_fkey1_col1 should have changed
                            expect(pageData.comp_fkey1_col2).toBe(updateData[1].comp_fkey1_col2);
                            expect(pageData.comp_fkey1_col2).not.toBe(tuple._oldData.comp_fkey1_col2);

                            expect(pageData.key).toBe(tuple._oldData.key);
                            expect(pageData.ind_fkey1_col1).toBe(tuple._oldData.ind_fkey1_col1);
                            expect(pageData.comp_fkey1_col1).toBe(tuple._oldData.comp_fkey1_col1);

                            done();
                        }).catch(function (error) {
                            console.dir(error);
                            done.fail();
                        });
                    });

                    describe("multiple columns are changed, ", function () {
                        it("one has it's independent foreign key modified.", function (done) {
                            var tuples;

                            var updateData = [{
                                "ind_fkey1_col1": 1,
                                "comp_fkey1_col2": 2
                            }, {
                                "comp_fkey1_col1": 1,
                                "comp_fkey1_col2": 4
                            }]

                            reference.read(2).then(function (response) {
                                tuples = response.tuples;

                                for (var i = 0; i < tuples.length; i++) {
                                    for (var key in updateData[i]) {
                                        tuples[i].data[key] = updateData[i][key];
                                    }
                                }

                                return reference.update(tuples);
                            }).then(function (response) {
                                expect(response._data.length).toBe(updateData.length);

                                checkPageValues(response._data, tuples, sortBy);

                                // Retrieve each updated tuple and verify only updateData columns were changed

                                var getFirstUri = baseUri + "/key=2";
                                return options.ermRest.resolve(getFirstUri);
                            }).then(function (response) {
                                return response.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0],
                                    tuple = tuples[0];

                                expect(pageData.ind_fkey1_col1).toBe(updateData[0].ind_fkey1_col1);
                                expect(pageData.ind_fkey1_col1).not.toBe(tuple._oldData.ind_fkey1_col1);

                                expect(pageData.comp_fkey1_col2).toBe(updateData[0].comp_fkey1_col2);
                                expect(pageData.comp_fkey1_col2).not.toBe(tuple._oldData.comp_fkey1_col2);

                                var getSecondUri = baseUri + "/key=3";
                                return options.ermRest.resolve(getSecondUri, {cid: "test"});
                            }).then(function (response) {
                                return response.read(1);
                            }).then(function (response) {
                                var pageData = response._data[0],
                                    tuple = tuples[1];

                                expect(pageData.comp_fkey1_col1).toBe(updateData[1].comp_fkey1_col1);
                                expect(pageData.comp_fkey1_col1).not.toBe(tuple._oldData.comp_fkey1_col1);

                                expect(pageData.comp_fkey1_col2).toBe(updateData[1].comp_fkey1_col2);
                                expect(pageData.comp_fkey1_col2).not.toBe(tuple._oldData.comp_fkey1_col2);

                                done();
                            }).catch(function (error) {
                                console.dir(error);
                                done.fail();
                            });
                        });
                    });
                });
            });
        });

    });
};
