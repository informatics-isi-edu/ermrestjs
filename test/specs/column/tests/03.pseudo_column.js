exports.execute = function (options) {
    describe('PseudoColumn, ', function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "columns_schema",
            tableName = "columns_table", // the structure of this table is explained in 14.pseudo_columns.js
            tableWithAsset = "table_w_asset", // the structure of this table is exlpained in 14.pseudo_columns.js
            tableWithDiffColTypes = "table_w_diff_col_types",
            entityId = 1,
            limit = 1,
            entryContext = "entry",
            createContext = "entry/create",
            editContext = "entry/edit",
            detailedContext = "detailed";

        var singleEnitityUri = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableName + "/id=" + entityId;

        var singleEnitityUriWithAsset = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithAsset + "/id=" + entityId;

        var singleEnitityUriDiffColTypes = options.url + "/catalog/" + catalog_id + "/entity/" +
            schemaName + ":" + tableWithDiffColTypes + "/id=" + entityId;

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


        beforeAll(function (done) {
            options.ermRest.appLinkFn(appLinkFn);
            // options.ermRest.resolve(singleEnitityUri, {
            //     cid: "test"
            // }).then(function (response) {
            //
            // }).catch(function (err){
            //     console.dir(err);
            //     done.fail();
            // });
            done();
        });

        describe("columns list, ", function () {
            it ("should ignore column objects in entry mode.", function () {

            });


            it ("should ignore the invalid column objects.", function () {

            });

            it ("should avoid duplicates (based on source, and entity).", function () {

            });

            it ("should ignore the column objects that their equivalent Key, ForeignKey, or InbounDforeignKey exists.", function () {

            });

            it ("should ignore the column objects that the generated hash is one of table's columns.", function () {

            });

            it ("should create the correct columns for valid list of sources.", function () {

            });
        });

        describe("column APIs, ", function () {
            it ('isPath, should be true for the columns.', function () {

            });

            describe ('hasPath, ', function () {
                it ('should be true if source has path.', function () {

                });

                it ('otherwise it should be false.', function () {

                });
            });

            describe('isUnique, ', function () {
                it ('should return true if source doesn\'t have path', function () {

                });

                it ('should return true if source has path of all outbound fks.', function () {

                });

                it ('otherwise should return false.', function () {

                });
            });

            describe("isInboundForeignKey, ", function () {
                it ("should return true if path is a single inbound fk.", function () {

                });

                it ("should return true if path is a p&b association.", function () {

                });

                it ("otherwise should return false.", function () {

                });
            });

            describe("reference, ", function () {
                it ("should return the main reference if source doesn't have path", function () {

                });

                it ("should apply the same logic as related reference if it's inbound fk.", function() {

                });

                it ("should be generated if mainTuple is passed.", function () {

                });

                // TODO if mainTuple is not defined.
            });

            describe("foreignKeys, ", function () {
                // TODO
            });

            describe ("displayname, ", function () {
                // TODO
            });

            describe ("name, ", function () {
                //TODO
            });

            describe ("formatPresentation, ", function () {
                it ("in entity mode should return null.", function () {

                });

                it ("if it's not a path, should return the column's value.", function () {

                });

                it ("if it's not entity mode, should return the column's value.", function () {

                });

                it ("if it's not a unique (one-to-one) path, should return null.", function () {

                });

                it ("otherwise should apply the same logic as foreignkey for the last foreignkey in path.", function () {

                });
            });

            describe("sortable, ", function () {
                it ("if it's not a path, should use  the column's sortable settings.", function () {

                });

                it ("if it's not entity mode, should use the column's sortable settings.", function () {

                });

                it ("if it's not a unique (one-to-one) path, should return false.", function () {

                });

                describe("it it's a unique (one-to-one) path, ", function () {

                });
            });


            it ("default, should throw error as this column should not be used in entity mode.",  function () {

            });

            it ("nullok, should throw error as this column should not be used in entity mode.", function () {

            });
        });

        describe("integration with other APIs, ", function () {
            describe ("reading a reference with path columns, ", function () {
                // test sort with backward compatibility too
                // TODO
            });

        });
    });


};
