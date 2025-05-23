exports.execute = function (options) {
  var exec = require('child_process').execSync;

  var FileAPI = require('file-api'),
    File = FileAPI.File;
  File.prototype.jsdom = true;

  describe('For verifying the upload object, ', function () {
    var schemaName = 'upload',
      tableName = 'file',
      columnName = 'uri',
      chunkSize = 128000,
      reference,
      column,
      filePath,
      uploadObj,
      chunkUrl,
      filePathDiffName,
      uploadObjDiffName;

    var serverUri = options.url.replace('/ermrest', '');
    var baseUri = options.url + '/catalog/' + process.env.DEFAULT_CATALOG + '/entity/' + schemaName + ':' + tableName;

    var file = {
      name: 'testfile500kb.png',
      size: 512000,
      displaySize: '500KB',
      type: 'image/png',
      hash: '4b178700e5f3b15ce799f2c6c1465741',
      hash_64: 'SxeHAOXzsVznmfLGwUZXQQ==',
    };

    // should be same file as
    var fileDiffName = {
      name: 'diff_testfile500kb.png',
      size: 512000,
      displaySize: '500KB',
      type: 'image/png',
      hash: '4b178700e5f3b15ce799f2c6c1465741',
      hash_64: 'SxeHAOXzsVznmfLGwUZXQQ==',
    };

    var firstTime = Date.now();
    var validRow = {
      timestamp: firstTime,
      uri: { md5_hex: file.hash },
    };

    var serverFilePath = '/hatrac/js/ermrestjs/' + validRow.timestamp + '/' + file.hash;

    beforeAll(function (done) {
      filePath = 'test/specs/upload/files/' + file.name;
      filePathDiffName = 'test/specs/upload/files/' + fileDiffName.name;

      exec('perl -e \'print "\\x01" x ' + file.size + "' > " + filePath);
      exec('cp ' + filePath + ' ' + filePathDiffName);

      file.file = new File(filePath);
      fileDiffName.file = new File(filePathDiffName);

      options.ermRest.resolve(baseUri, { cid: 'test' }).then(
        function (response) {
          reference = response;

          column = reference.columns.find(function (c) {
            return c.name == columnName;
          });

          if (!column) {
            console.log('Unable to find column ' + columnName);
            done.fail();
            return;
          }

          done();
        },
        function (err) {
          console.dir(err);
          done.fail();
        },
      );
    });

    it('should have properties set appropriately by its constructor.', function () {
      uploadObj = new options.ermRest.Upload(file.file, {
        column: column,
        reference: reference,
        chunkSize: chunkSize,
      });

      expect(uploadObj.PART_SIZE).toBe(chunkSize, 'chunk size is incorrect');
      expect(uploadObj.CHUNK_QUEUE_SIZE).toBe(4, 'chunk queue size is incorrect');
      expect(uploadObj.file).toEqual(file.file, 'file is not an Object');
      expect(uploadObj.column).toEqual(column, 'column is incorrect');

      // reference associated
      expect(uploadObj.reference).toEqual(reference, 'reference is incorrect');
      expect(uploadObj.SERVER_URI).toBe(serverUri, 'server uri is incorrect');
      expect(uploadObj.http).toEqual(reference._server.http, 'http is incorrect');

      // initial values
      expect(uploadObj.isPaused).toBeFalsy('is paused is incorrect');
      expect(uploadObj.chunks).toBeDefined('chunks is incorrect');
      expect(uploadObj.log).toEqual(console.log, 'log is incorrect');
    });

    it('should have a file the same as the one that was uploaded.', function () {
      expect(uploadObj.file.path).toBe(filePath, 'file path is incorrect');
      expect(uploadObj.file.name).toBe(file.name, 'file name is incorrect');
      expect(uploadObj.file.type).toBe(file.type, 'file type is incorrect');
      expect(uploadObj.file.size).toBe(file.size, 'file size is incorrect');
    });

    it('should verify the URL functions.', function (done) {
      expect(uploadObj.validateURL(validRow)).toBe(true);

      uploadObj.calculateChecksum(validRow).then(
        function (url) {
          expect(url).toBe(serverFilePath, 'File generated url is incorrect after calculating the checksum');

          expect(validRow.filename).toBe(file.name, 'Valid row name is incorrect');
          expect(validRow.bytes).toBe(file.size, 'Valid row size is incorrect');
          expect(validRow.checksum).toBe(file.hash, 'Valid row hash is incorrect');

          expect(uploadObj.hash instanceof options.ermRest.Checksum).toBeTruthy('hash is not of type ermRest.Checksum');

          // calculateChecksum() calls generateUrl(), verify values are set properly on uploadObj
          expect(uploadObj.url).toBe(serverFilePath, 'url is incorrect');
          expect(uploadObj.chunkUrl).toBeFalsy('chunk url is incorrect');
          expect(uploadObj.fileExistsFlag).toBeFalsy('file exists flag is incorrect');
          expect(uploadObj.completed).toBeFalsy('completed is incorrect');
          expect(uploadObj.jobDone).toBeFalsy('job done is incorrect');

          expect(uploadObj._getAbsoluteUrl(uploadObj.url)).toBe(serverUri + serverFilePath, 'absolute url is incorrect');

          done();
        },
        function (err) {
          console.dir(err);
          done.fail();
        },
      );
    });

    it("should verify the job doesn't exist yet and neither does the file.", function (done) {
      uploadObj
        ._getExistingJobStatus()
        .then(function (response) {
          expect(response).not.toBeDefined('Job status is defined');

          return uploadObj.fileExists();
        })
        .then(function (response) {
          expect(response).toBe(serverFilePath, 'Server file path is incorrect');

          done();
        })
        .catch(function (err) {
          console.dir(err);
          done.fail(err);
        });
    });

    it('should verify the upload job is created.', function (done) {
      uploadObj.createUploadJob().then(
        function (response) {
          chunkUrl = response;
          expect(response.startsWith(serverFilePath)).toBeTruthy('Upload job file path is incorrect');
          done();
        },
        function (err) {
          console.dir(err);
          done.fail(err);
        },
      );
    });

    it('should verify the job now exists but the file does not yet.', function (done) {
      uploadObj
        ._getExistingJobStatus()
        .then(function (response) {
          expect(response).toBeDefined('Job status is not defined');
          var data = response.data;

          expect(data.url).toBe(chunkUrl, 'Job status chunk url is incorrect');
          expect(data.target).toBe(serverFilePath, 'Job status server file path is incorrect');
          expect(data['content-md5']).toBe(file.hash_64, 'Job status hash 64 is incorrect');
          expect(data['content-length']).toBe(file.size, 'Job status size is incorrect');
          expect(data['content-type']).toBe(file.type, 'Job status type is incorrect');
          expect(data['chunk-length']).toBe(chunkSize, 'Job status chunk size is incorrect');

          return uploadObj.fileExists();
        })
        .then(function (response) {
          expect(response).toBe(serverFilePath, 'Server file path is incorrect');

          done();
        })
        .catch(function (err) {
          console.dir(err);
          done.fail();
        });
    });

    it('should verify we can get notified as the job is running after each chunk is uploaded.', function (done) {
      // keeps track of each time notify is called, should be once per chunk
      var counter = 1;

      uploadObj
        .start()
        .then(
          function (response) {
            expect(response).toBe(serverFilePath, 'Upload job file path is incorrect');
            expect(uploadObj.isPaused).toBeFalsy('Upload job is paused');

            done();
          },
          function (err) {
            console.dir(err);
            done.fail();
          },
          function notify() {
            var chunks = uploadObj.chunks;
            // we get notified by updateProgressBar() after the chunk is PUT to the hatrac server
            expect(chunks.length).toBe(file.size / chunkSize, 'Upload job chunks is incorrect');

            // verify completed chunks
            var numCompleteChunks = 0;
            var numIncompleteChunks = 0;
            // the chunks get added in a random order in the array. sometimes chunk[2] is uploaded before chunk[1]
            for (var i = 0; i < chunks.length; i++) {
              if (chunks[i].completed) {
                expect(chunks[i].progress).toBe(chunkSize, 'Chunk progress is not the same as chunk size after completion');
                numCompleteChunks++;
              } else {
                expect(chunks[i].progress).toBe(0, "Chunk progress has started even though it's not complete");
                numIncompleteChunks++;
              }
            }
            expect(numCompleteChunks).toBe(counter, 'Not enough chunks completed');
            expect(numIncompleteChunks).toBe(chunks.length - counter, 'Too many chunks completed');

            // verify the file is uploaded or not
            if (counter == chunks.length) {
              expect(uploadObj.completed).toBeTruthy('File not yet created');
            } else {
              expect(uploadObj.completed).toBeFalsy('File has been created');
            }
            counter++;
          },
        )
        .catch(function (err) {
          console.dir(err);
          done.fail();
        });
    });

    it('should complete the upload.', function (done) {
      uploadObj.completeUpload().then(
        function (response) {
          expect(response.startsWith(serverFilePath + ':')).toBeTruthy('Upload job file path is incorrect');
          expect(uploadObj.jobDone).toBeTruthy('Upload job is not complete');

          done();
        },
        function (err) {
          console.dir(err);
          done.fail();
        },
      );
    });

    // test trying to upload the same file but with a different file.name
    describe('now trying to upload the same file again with a different file name', function () {
      it('should have properties set appropriately by its constructor.', function () {
        uploadObjDiffName = new options.ermRest.Upload(fileDiffName.file, {
          column: column,
          reference: reference,
          chunkSize: chunkSize,
        });

        expect(uploadObjDiffName.PART_SIZE).toBe(chunkSize, 'chunk size is incorrect');
        expect(uploadObjDiffName.CHUNK_QUEUE_SIZE).toBe(4, 'chunk queue size is incorrect');
        expect(uploadObjDiffName.file).toEqual(fileDiffName.file, 'file is not an Object');
        expect(uploadObjDiffName.column).toEqual(column, 'column is incorrect');

        // reference associated
        expect(uploadObjDiffName.reference).toEqual(reference, 'reference is incorrect');
        expect(uploadObjDiffName.SERVER_URI).toBe(serverUri, 'server uri is incorrect');
        expect(uploadObjDiffName.http).toEqual(reference._server.http, 'http is incorrect');

        // initial values
        expect(uploadObjDiffName.isPaused).toBeFalsy('is paused is incorrect');
        expect(uploadObjDiffName.chunks).toBeDefined('chunks is incorrect');
        expect(uploadObjDiffName.log).toEqual(console.log, 'log is incorrect');
      });

      it('should have a file the same as the one that was uploaded.', function () {
        expect(uploadObjDiffName.file.path).toBe(filePathDiffName, 'file path is incorrect');
        expect(uploadObjDiffName.file.name).toBe(fileDiffName.name, 'file name is incorrect');
        expect(uploadObjDiffName.file.type).toBe(fileDiffName.type, 'file type is incorrect');
        expect(uploadObjDiffName.file.size).toBe(fileDiffName.size, 'file size is incorrect');
      });

      it('should verify the URL functions.', function (done) {
        expect(uploadObjDiffName.validateURL(validRow)).toBe(true);

        uploadObjDiffName.calculateChecksum(validRow).then(
          function (url) {
            expect(url).toBe(serverFilePath, 'File generated url is incorrect after calculating the checksum');

            expect(validRow.filename).toBe(fileDiffName.name, 'Valid row name is incorrect');
            expect(validRow.bytes).toBe(fileDiffName.size, 'Valid row size is incorrect');
            expect(validRow.checksum).toBe(fileDiffName.hash, 'Valid row hash is incorrect');

            expect(uploadObjDiffName.hash instanceof options.ermRest.Checksum).toBeTruthy('hash is not of type ermRest.Checksum');

            // calculateChecksum() calls generateUrl(), verify values are set properly on uploadObj
            expect(uploadObjDiffName.url).toBe(serverFilePath, 'url is incorrect');
            expect(uploadObjDiffName.chunkUrl).toBeFalsy('chunk url is incorrect');
            expect(uploadObjDiffName.fileExistsFlag).toBeFalsy('file exists flag is incorrect');
            expect(uploadObjDiffName.completed).toBeFalsy('completed is incorrect');
            expect(uploadObjDiffName.jobDone).toBeFalsy('job done is incorrect');

            expect(uploadObjDiffName._getAbsoluteUrl(uploadObjDiffName.url)).toBe(serverUri + serverFilePath, 'absolute url is incorrect');

            done();
          },
          function (err) {
            console.dir(err);
            done.fail();
          },
        );
      });

      it("should verify the job doesn't exist yet but a version of the same file does with a different filename. The file metadata update request should then run", function (done) {
        uploadObjDiffName
          ._getExistingJobStatus()
          .then(function (response) {
            expect(response).not.toBeDefined('Job status is defined');

            return uploadObjDiffName.fileExists();
          })
          .then(function (response) {
            expect(response).toBe(serverFilePath, 'Server file path is incorrect');

            expect(uploadObjDiffName.isPaused).toBeFalsy('is paused is incorrect');
            expect(uploadObjDiffName.completed).toBeTruthy('completed is incorrect');
            expect(uploadObjDiffName.jobDone).toBeTruthy('job done is incorrect');

            done();
          })
          .catch(function (err) {
            console.dir(err);
            done.fail();
          });
      });

      it("should verify the upload doesn't run and returns before getting existing job status.", function (done) {
        uploadObjDiffName.createUploadJob().then(
          function (response) {
            expect(response).toBeFalsy('create upload job returned the wrong response');

            done();
          },
          function (err) {
            console.dir(err);
            done.fail();
          },
        );
      });

      it("should return since file didn't need to be uploaded and is marked complete already.", function (done) {
        // keeps track of each time notify is called, should be once per chunk
        var counter = 1;

        uploadObjDiffName
          .start()
          .then(function (response) {
            expect(response).toBe(serverFilePath, 'Upload job file path is incorrect');
            expect(uploadObjDiffName.isPaused).toBeFalsy('is paused is incorrect');

            done();
          })
          .catch(function (err) {
            console.dir(err);
            done.fail();
          });
      });

      it('should complete the upload.', function (done) {
        uploadObjDiffName.completeUpload().then(
          function (response) {
            // no ':' appended since it's not a versioned url for the response
            expect(response.startsWith(serverFilePath)).toBeTruthy('Upload job file path is incorrect');
            expect(uploadObjDiffName.jobDone).toBeTruthy('Upload job is not complete');

            done();
          },
          function (err) {
            console.dir(err);
            done.fail();
          },
        );
      });
    });

    // TODO: Upload.pause(), Upload.resume(), and Upload.cancel() are not tested.
    // we can't interrupt a promise even during the notify callback. We will have to look into
    // a way to mock the upload endpoint and change the Synchronization so it is ignored

    afterAll(function (done) {
      // removes the file from the chaise folder
      exec('rm ' + filePath);
      exec('rm ' + filePathDiffName);
      // removes the files from hatrac
      uploadObj
        .deleteFile()
        .then(function () {
          return uploadObjDiffName.deleteFile();
        })
        .then(function () {
          done();
        })
        .catch(function (err) {
          console.dir(err);
          done.fail();
        });
    });
  });
};
