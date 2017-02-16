exports.execute = function (options) {

    /*
     * @param pageData - data retruned from update request
     * @param tuples - tuples sent to
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
                    reference = response;

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

        describe("for updating ", function () {
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
                        reference = response;

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
                        reference = response;

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
                        reference = response;

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
                        reference = response;

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
                            reference = response;

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
                            reference = response;

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
                        reference = response;

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
                            reference = response;

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
                            reference = response;

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
                            reference = response;

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
                            reference = response;

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

            describe("with mismatching ETags (412 error)", function() {
                it('should return a page object if the old data and current data from DB match', function(done) {
                    var reference, tuples, tuple,
                        uri = baseUri + '/ind_key1=2';

                    var updateData = {
                        "comp_key1_col1": "Robert"
                    };

                    // Read a reference of Record A -> RefA
                    options.ermRest.resolve(uri, {cid: 'test'}).then(function(response) {
                        reference = response;
                        return reference.read(1);
                    }).then(function(page) {
                        // Modify RefA._etag to simulate a change to this table that doesn't affect the referenced row
                        reference._etag = 'a bad etag';

                        // Perform an update and a page object like normal
                        tuples = page.tuples;
                        tuple = tuples[0];
                        var data = tuple.data;

                        for (var key in updateData) {
                            data[key] = updateData[key];
                        }
                        return reference.update(tuples);
                    }).then(function(response) {
                        expect(response._data.length).toBe(1);
                        checkPageValues(response._data, tuples, sortBy);
                        var pageData = response._data[0];
                        expect(pageData.comp_key1_col1).toBe(updateData.comp_key1_col1);
                        done();
                    }, function(error) {
                        console.dir(error);
                        expect('There to be no errors in update operation').toBe('but one was encountered.');
                    }).catch(function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });

                it('should raise a 412 error if the old data and current data from DB do not match', function(done) {
                    var ref1, ref2, tuples1, tuple1, tuples2, tuple2,
                        uri = baseUri + '/ind_key1=2';

                    var newRef1Tuple = {
                        "comp_key1_col1": "Roberta"
                    };

                    var newRef2Tuple = {
                        "comp_key1_col1": "Rowena"
                    };
                    // Read a reference of Record A -> Ref1
                    options.ermRest.resolve(uri, {cid: 'test'}).then(function(response) {
                        ref1 = response;
                        return ref1.read(1);
                    }).then(function(response) {
                        tuples1 = response.tuples;
                        tuple1 = tuples1[0];
                        var data = tuple1.data;
                        for (var key in newRef1Tuple) {
                            data[key] = newRef1Tuple[key];
                        }
                        return options.ermRest.resolve(uri, {cid: 'test'});
                    }).then(function(response) {
                        ref2 = response;
                        // Read a 2nd reference of Record A -> Ref2
                        return ref2.read(1);
                    }).then(function(response) {
                        tuples2 = response.tuples;
                        tuple2 = tuples2[0];
                        var data = tuple2.data;
                        for (var key in newRef2Tuple) {
                            data[key] = newRef2Tuple[key];
                        }
                        // Ref2.update(someNewTupleB) -> expect a Page back, ETag modified
                        return ref2.update(response.tuples);
                    }).then(function(response) {
                        expect(response._data.length).toBe(1);
                        var pageData = response._data[0];
                        expect(pageData.comp_key1_col1).toBe(newRef2Tuple.comp_key1_col1);

                        // Ref1.update(someNewTupleA) -> expect 412 error
                        return ref1.update(tuples1);
                    }).then(function(response) {
                        expect(response).not.toBeDefined();
                        done.fail();
                    }, function(error) {
                        expect(error.code).toBe(412);
                        done();
                    }).catch(function(error) {
                        console.dir(error);
                        done.fail();
                    });
                });
            });
        });

    });
};
