var utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

    describe("updating reference objects, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "update_schema";

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

        describe("should throw errors", function () {
            var tableName = "update_table",
                uri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName + "/ind_key1=2";

            var reference;

            beforeAll(function (done) {
                options.ermRest.resolve(uri, {cid: "test"}).then(function (response) {
                    reference = response;

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });

            it('when reference is not contextualized for `entry/edit` should throw an error.', function(done) {
                var updateData = {
                    "ind_key1": 777
                };

                return reference.read(1).then(function (response) {
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

            it("should throw an error when no data was updated.", function(done) {
                reference = reference.contextualize.entryEdit;

                reference.read(1).then(function (response) {
                    return reference.update(response.tuples);
                }).then(function (response) {
                    throw new Error("Did not return any errors");
                }).catch(function (err) {
                    expect(err instanceof options.ermRest.NoDataChangedError).toBe(true);
                    expect(err.message).toEqual("No data was changed in the update request. Please check the form content and resubmit the data.", "Wrong error message was returned");

                    done();
                });
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
                    response = response.successful;
                    expect(response._data.length).toBe(1);

                    utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1, "response data is not the same size as given.");
                        expect(response.reference._context).toEqual("compact", "page reference is not in the correct context.");

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                                    response = response.successful;
                                    expect(response._data.length).toBe(1);

                                    utils.checkPageValues(response._data, tuples, sortBy);

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
                                    response = response.successful;
                                    expect(response._data.length).toBe(1);

                                    utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(1);

                                utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(1);

                                utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(1);

                                utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(1);

                                utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(1);

                                utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(1);

                                utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(updateData.length);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(updateData.length);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(updateData.length);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            uri = baseUri + "/ind_key1=1;ind_key1=3;ind_key1=4@sort(ind_key1)";

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
                            response = response.successful;
                            expect(response._data.length).toBe(updateData.length);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                        response = response.successful;
                        expect(response._data.length).toBe(1);

                        utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(1);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                    var uri = baseUri + "/key=2;key=3@sort(key)";

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
                            response = response.successful;
                            expect(response._data.length).toBe(updateData.length);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                            response = response.successful;
                            expect(response._data.length).toBe(updateData.length);

                            utils.checkPageValues(response._data, tuples, sortBy);

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
                                response = response.successful;
                                expect(response._data.length).toBe(updateData.length);

                                utils.checkPageValues(response._data, tuples, sortBy);

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

        describe("for updating multiple entities should return a page object, when", function () {
            var tableName = "table_w_composite_key_as_shortest_key",
                sortBy = "id_1",
                reference, tuples;

            it("both parts of a composite key are changed.", function (done) {
                var updateData = [{
                    "id_1": 7,
                    "id_2": 7
                }, {
                    "id_1": 7,
                    "id_2": 8
                }, {
                    "id_1": 9,
                    "id_2": 8
                }];

                var baseCompositeUri = options.url + "/catalog/" + catalogId + "/entity/" + schemaName + ':' + tableName,
                    setUri = baseCompositeUri + "/id_1=1;id_1=2;id_1=3";

                options.ermRest.resolve(setUri, {cid: "test"}).then(function (response) {
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
                }).then(function (response){
                    response = response.successful;

                    expect(response._data.length).toBe(updateData.length);

                    utils.checkPageValues(response._data, tuples, sortBy);
                    var getFirstUri = baseCompositeUri + "/id_1=7&id_2=7";
                    return options.ermRest.resolve(getFirstUri, {cid: "test"});
                }).then(function (response) {
                    return response.read(1);
                }).then(function (response) {
                    var pageData = response._data[0],
                        tuple = tuples[0];

                    // id 1 and id 2 should be changed
                    expect(pageData.id_1).toBe(updateData[0].id_1);
                    expect(pageData.id_1).not.toBe(tuple._oldData.id_1);

                    expect(pageData.id_2).toBe(updateData[0].id_2);
                    expect(pageData.id_2).not.toBe(tuple._oldData.id_2);

                    // text values should not have changed
                    expect(pageData.text_1).toBe(tuple._oldData.text_1);
                    expect(pageData.text_2).toBe(tuple._oldData.text_2);

                    var getSecondUri = baseCompositeUri + "/id_1=7&id_2=8";
                    return options.ermRest.resolve(getSecondUri, {cid: "test"});
                }).then(function (response) {
                    return response.read(1);
                }).then(function (response) {
                    var pageData = response._data[0],
                        tuple = tuples[1];

                    // id 1 and id 2 should be changed
                    expect(pageData.id_1).toBe(updateData[1].id_1);
                    expect(pageData.id_1).not.toBe(tuple._oldData.id_1);

                    expect(pageData.id_2).toBe(updateData[1].id_2);
                    expect(pageData.id_2).not.toBe(tuple._oldData.id_2);

                    // text values should not have changed
                    expect(pageData.text_1).toBe(tuple._oldData.text_1);
                    expect(pageData.text_2).toBe(tuple._oldData.text_2);

                    var getThirdUri = baseCompositeUri + "/id_1=9&id_2=8";
                    return options.ermRest.resolve(getThirdUri, {cid: "test"});
                }).then(function (response) {
                    return response.read(1);
                }).then(function (response) {
                    var pageData = response._data[0],
                        tuple = tuples[2];

                    // id 1 and id 2 should be changed
                    expect(pageData.id_1).toBe(updateData[2].id_1);
                    expect(pageData.id_1).not.toBe(tuple._oldData.id_1);

                    expect(pageData.id_2).toBe(updateData[2].id_2);
                    expect(pageData.id_2).not.toBe(tuple._oldData.id_2);

                    // text values should not have changed
                    expect(pageData.text_1).toBe(tuple._oldData.text_1);
                    expect(pageData.text_2).toBe(tuple._oldData.text_2);

                    done();
                }).catch(function (error) {
                    console.dir(error);
                    done.fail();
                });
            });
        });

    });
};
