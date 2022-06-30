var nock = require('nock');

exports.execute = function (options) {

    describe("For determining HTTP 409 response message,", function () {
        var server, url, catalog,
            id = "7345274", // something very far out of range
            ops = {allowUnmocked: true};
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "error_schema",
            document_table = "parent_document_table",
            tableNameWithoutDisplayName = "parent_document_table_for_without_displayname",
            agreement_table = "child_agreement_table",
            document_table_for_fromname = "parent_document_table_for_fromname",
            duplicate_key_table = "duplicate_key_conflict",
            duplicate_composite_key_table = "duplicate_composite_key_conflict",
            reference1, reference2, reference3, reference4, duplicateReference, duplicateReferenceUpdate, duplicateCompositeKeyReference;

        var integrityErrorServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'The request conflicts with the state of the server. update or delete on table "dataset" violates foreign key constraint "dataset_human_age_dataset_id_fkey" on table "dataset_human_age" DETAIL:  Key (id)=(269) is still referenced from table "dataset_human_age".';
        var integrityErrorServerResponseArb = '409 Conflict\nThe request conflicts with the state of the server. ' +
                'The request conflicts with the state of the server. update or delete on table "1dataset" violates foreign key constraint "1dataset_human_age_dataset_id_fkey" on table "1dataset_human_age" DETAIL:  Key (id)=(269) is still referenced from table "1dataset_human_age".';
        var duplicateErrorServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'Input data violates model. ERROR:  duplicate key value violates unique constraint "dataset_pkey" DETAIL:  Key (id)=(269) already exists.';

        var generalConflictServerResponse = '409 Conflict\nThe request conflicts with the state of the server. ' +
            'ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site CONTEXT: PL/pgSQL function experiments.userid_update() line 25 at RAISE';

        var integrityErrorMappedMessage= "This entry cannot be deleted as it is still referenced from the <code>Agreement</code> table. \n All dependent entries must be removed before this item can be deleted.",
            integrityErrorMappedMessageWithoutDisplay= "This entry cannot be deleted as it is still referenced from the <code>child_agreement_table_without_displayname</code> table. \n All dependent entries must be removed before this item can be deleted.",
            integrityErrorMappedPureBinaryMessage = "This entry cannot be deleted as it is still referenced from the <code>to_name_value</code> table. \n All dependent entries must be removed before this item can be deleted.",
            integrityErrorMappedFromnameMessage = "This entry cannot be deleted as it is still referenced from the <code>from_name_value</code> table. \n All dependent entries must be removed before this item can be deleted.",
            integrityErrorMappedSiteAdminMessage = "This entry cannot be deleted as it is still referenced from the <code>1dataset_human_age</code> table. \n All dependent entries must be removed before this item can be deleted.\nIf you have trouble removing dependencies please contact the site administrator.",
            duplicateErrorMappedMessage = "The entry cannot be created/updated. Please use a different duplicate id for this record.",
            duplicateCompositeKeyErrorMappedMessage = "The entry cannot be created/updated. Please use a different combination of another_id, duplicate_id for this record.",
            generalConflictMappedMessage = "ERROR: the provided site_name is not consistent with your login profile. Please enter an appropriate site",
            integrityErrorWithoutDelMessage = 'The request conflicts with the state of the server. update or delete on table "dataset" violates foreign key constraint "dataset_human_age_dataset_id_fkey" on table "dataset_human_age" DETAIL:  Key (id)=(269) is still referenced from table "dataset_human_age".';

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + document_table,
          multipleEntityUriWithoutDisplayname = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableNameWithoutDisplayName,
          pureBinaryUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + agreement_table,
          fromNameUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + document_table_for_fromname,
          duplicateCreateUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + duplicate_key_table,
          duplicateUpdateUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + duplicate_key_table + "/duplicate%20id=1",
          duplicateCompositeKeyCreateUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + duplicate_composite_key_table;

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
            server = options.server;
            catalog = options.catalog;
            url = options.url.replace('ermrest', '');

            options.ermRest.resolve(multipleEntityUri, {cid:"test"}).then(function(response) {
                reference1 = response;
                return options.ermRest.resolve(multipleEntityUriWithoutDisplayname, {cid:"test"});
            }).then(function(response2) {
                reference2 = response2;
                return options.ermRest.resolve(pureBinaryUri, {cid:"test"});
            }).then(function(response3) {
                reference3 = response3;
                return options.ermRest.resolve(fromNameUri, {cid:"test"});
            }).then(function(response4) {
                reference4 = response4;
                return options.ermRest.resolve(duplicateCreateUri, {cid:"test"})
            }).then(function (response5) {
                duplicateReference = response5.contextualize.entryCreate;
                return options.ermRest.resolve(duplicateUpdateUri, {cid:"test"})
            }).then(function (response6) {
                duplicateReferenceUpdate = response6.contextualize.entryEdit;
                return options.ermRest.resolve(duplicateCompositeKeyCreateUri, {cid:"test"})
            }).then(function (response7) {
                duplicateCompositeKeyReference = response7.contextualize.entryCreate;
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail();
            });

            server.http.max_retries = 0;
        });

        it("if it's an integrity error, we should generate a more readable message.", function (done) {
          reference1.delete().then(null, function (err) {
              expect(err.status).toBe("Conflict", "invalid error status message");
              expect(err.message).toBe(integrityErrorMappedMessage, "invalid error message");
              done();
          }).catch(function(err) {
              console.log(err);
              done.fail();
          });
        });



        it("if it's an integrity error and no displayName was found then use table name passed by ermrest", function (done) {
          reference2.delete().then(null, function (err) {
              expect(err.status).toBe("Conflict", "invalid error status message");
              expect(err.message).toBe(integrityErrorMappedMessageWithoutDisplay, "invalid error message");
              done();
          }).catch(function(err) {
              console.log(err);
              done.fail();
          });
        });

        it("if it's an integrity error and pure and binary association then to_name should be displayed", function (done) {
          reference3.delete().then(null, function (err) {
              expect(err.status).toBe("Conflict", "invalid error status message");
              expect(err.message).toBe(integrityErrorMappedPureBinaryMessage, "invalid error message");
              done();
          }).catch(function(err) {
              console.log(err);
              done.fail();
          });
        });

        it("if it's an integrity error and related table then from_name should be displayed", function (done) {
          reference4.delete().then(null, function (err) {
              expect(err.status).toBe("Conflict", "invalid error status message");
              expect(err.message).toBe(integrityErrorMappedFromnameMessage, "invalid error message");
              done();
          }).catch(function(err) {
              console.log(err);
              done.fail();
          });
        });
        it("if it's an integrity error and no displayName was found then use table name passed by ermrest using mock", function (done) {
          var mockUri = "/ermrest/catalog/"+catalog_id+"/entity/M:=" + schemaName + ":" + tableNameWithoutDisplayName;

          nock(url, ops)
              .delete(mockUri)
              .reply(409, integrityErrorServerResponseArb)
              .persist();
          reference2.delete().then(null, function (err) {
              expect(err.status).toBe("Conflict", "invalid error status message");
              expect(err.message).toBe(integrityErrorMappedSiteAdminMessage, "invalid error message");
              done();
          }).catch(function(err) {
              console.log(err);
              done.fail();
          });

        });

        it("if it's an integrity error without deletion flag passed then we should allow the ermrest error to the client.", function (done) {
           nock(url, ops)
               .get("/ermrest/catalog/1234")
               .reply(409, integrityErrorServerResponse)
               .persist();

           server.catalogs.get("1234").then(null, function(err) {
               expect(err.code).toBe(409, "invalid error code");
               expect(err.status).toBe("Conflict", "invalid error status message");
               expect(err.message).toBe(integrityErrorWithoutDelMessage, "invalid error message");
               done();
           }).catch(function(err) {
               console.log(err);
               done.fail();
           });
       });

        it("on create, if it's a duplicate key error, we should generate a more readable message.", function (done) {
            duplicateReference.create([{"duplicate id": 1}]).then(null, function (err) {
                expect(err.code).toBe(409, "invalid error code");
                expect(err.status).toBe("Conflict", "invalid error status message");
                expect(err.message).toBe(duplicateErrorMappedMessage, "invalid error message");

                var referencePath = schemaName + ":" + duplicate_key_table + "/duplicate%20id=1";
                expect(err.duplicateReference).toBeDefined();
                expect(err.duplicateReference.location.compactPath).toBe(referencePath, "path for duplicate reference is incorrect");
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail();
            });
        });

        it("on update, if it's a duplicate key error, we should generate a more readable message.", function (done) {
            duplicateReferenceUpdate.read(1).then(function (response) {
                var data = response.tuples[0].data;

                // updateData = { "duplicate id": 2 }
                data["duplicate id"] = 2;

                return duplicateReferenceUpdate.update(response.tuples);
            }).then(null, function (err) {
                expect(err.code).toBe(409, "invalid error code");
                expect(err.status).toBe("Conflict", "invalid error status message");
                expect(err.message).toBe(duplicateErrorMappedMessage, "invalid error message");

                var referencePath = schemaName + ":" + duplicate_key_table + "/duplicate%20id=2";
                expect(err.duplicateReference).toBeDefined();
                expect(err.duplicateReference.location.compactPath).toBe(referencePath, "path for duplicate reference is incorrect");
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail(err);
            });
        });

        it("on create, if it's a duplicate composite key error, we should generate a more readable message.", function (done) {
            duplicateCompositeKeyReference.create([{duplicate_id: 1, another_id: 2}]).then(null, function (err) {
                expect(err.code).toBe(409, "invalid error code");
                expect(err.status).toBe("Conflict", "invalid error status message");
                expect(err.message).toBe(duplicateCompositeKeyErrorMappedMessage, "invalid error message");

                var referencePath = schemaName + ":" + duplicate_composite_key_table + "/another_id=2&duplicate_id=1";
                expect(err.duplicateReference).toBeDefined();
                expect(err.duplicateReference.location.compactPath).toBe(referencePath, "path for duplicate reference is incorrect");
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail();
            });
        });

        it("otherwise it should just show the error message without the prefix and suffix.", function (done) {
            nock(url, ops)
                .get("/ermrest/catalog/1236")
                .reply(409, generalConflictServerResponse)
                .persist();

            server.catalogs.get("1236").then(null, function(err) {
                expect(err.code).toBe(409, "invalid error code");
                expect(err.status).toBe("Conflict", "invalid error status message");
                expect(err.message).toBe(generalConflictMappedMessage, "invalid error message");
                done();
            }).catch(function(err) {
                console.log(err);
                done.fail();
            });
        });


	    afterAll(function() {
            nock.cleanAll();
	        nock.enableNetConnect();
	    });

    });
};
