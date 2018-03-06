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
            options.ermRest.resolve(singleEnitityUri, {
                cid: "test"
            }).then(function (response) {

            }).catch(function (err){
                console.dir(err);
                done.fail();
            });
        });

        describe("columns list, ", function () {
            it ("should ignore column objects in entity mode.", function () {
                
            });


            it ("should ignore the invalid column objects.", function () {

            });

            it ("should avoid duplicates (based on source, entity, and aggregate).", function () {

            });

            it ("should ignore the column objects that their equivalent Key, ForeignKey, or InbounDforeignKey exists.", function () {

            });

            it ("should ignore the column objects that the generated has is one of table's columns.", function () {

            });
        });

    });


};
