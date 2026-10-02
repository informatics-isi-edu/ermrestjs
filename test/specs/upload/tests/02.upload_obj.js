var uploadUtils = require('../utils.js');

exports.execute = function (options) {
  var exec = require('child_process').execSync;

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

      file.file = uploadUtils.createMockFile(filePath);
      fileDiffName.file = uploadUtils.createMockFile(filePathDiffName);

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

    it('reports the progress until all the chunks are uploaded', async () => {
      let progressCalls = 0;
      let lastUploaded = 0;
      const url = await uploadObj.start(0, (uploaded, fileSize) => {
        progressCalls++;
        lastUploaded = uploaded;
        expect(fileSize).toBe(file.size);
        expect(uploaded).toBeLessThanOrEqual(file.size);
      });

      expect(url).toBe(serverFilePath);
      expect(uploadObj.isPaused).toBe(false);
      expect(uploadObj.completed).toBe(true);
      expect(uploadObj.chunks.length).toBe(file.size / chunkSize);
      uploadObj.chunks.forEach((chunk) => {
        expect(chunk.completed).toBe(true);
        expect(chunk.progress).toBe(chunkSize);
      });

      // called after each chunk is uploaded (and while the chunks are being uploaded)
      expect(progressCalls).toBeGreaterThanOrEqual(uploadObj.chunks.length);
      expect(lastUploaded).toBe(file.size);
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
            // the versioned url of the existing file (its metadata was updated in place)
            expect(response.startsWith(serverFilePath + ':')).toBeTruthy('Upload job file path is incorrect');
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

    describe('for an empty (0-byte) file, ', function () {
      var emptyFile = { name: 'testfile0kb.txt', size: 0 };
      var emptyFilePath, emptyUploadObj;

      beforeAll(function () {
        emptyFilePath = 'test/specs/upload/files/' + emptyFile.name;
        // size 0 => `"\x01" x 0` is the empty string => a genuine 0-byte file
        exec('perl -e \'print "\\x01" x ' + emptyFile.size + "' > " + emptyFilePath);
        emptyFile.file = uploadUtils.createMockFile(emptyFilePath);
        emptyUploadObj = new options.ermRest.Upload(emptyFile.file, {
          column: column,
          reference: reference,
          chunkSize: chunkSize,
        });
      });

      it('allowEmptyFile should default to false when the annotation is not set.', function () {
        expect(column.allowEmptyFile).toBe(false, 'allowEmptyFile should default to false');
      });

      it('start() should reject with an InvalidInputError.', function (done) {
        emptyUploadObj
          .start()
          .then(
            function () {
              done.fail('start() should have rejected the empty file');
            },
            function (err) {
              expect(err instanceof options.ermRest.InvalidInputError).toBe(true, 'error is not an InvalidInputError');
              done();
            },
          )
          .catch(function (err) {
            console.dir(err);
            done.fail();
          });
      });

      afterAll(function () {
        exec('rm ' + emptyFilePath);
      });
    });

    // pause, resume, and cancel are tested in 05.pause_cancel.js

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
