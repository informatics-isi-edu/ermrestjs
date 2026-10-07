const nock = require('nock');
const { createTestFile, removeTestFile } = require('../utils.js');

/*
 * hatrac is mocked with nock in these specs, so we can control how the existing file looks and how the filename update responds.
 * only ermrest is used for getting the reference and the asset column.
 */
exports.execute = (options) => {
  describe('For uploading a file that already exists, ', () => {
    const fileName = 'testfile_existing.png';
    let testFile;
    let reference;
    let column;

    beforeAll(async () => {
      testFile = createTestFile(fileName, 5000);

      const uri = `${options.url}/catalog/${process.env.DEFAULT_CATALOG}/entity/upload:file`;
      const response = await options.ermRest.resolve(uri, { cid: 'test' });
      reference = response.contextualize.entryCreate;
      column = reference.columns.find((c) => c.name === 'uri');
    });

    afterEach(() => {
      nock.cleanAll();
    });

    afterAll(() => {
      nock.enableNetConnect();
      removeTestFile(testFile.path);
    });

    /**
     * Creates an upload object that has its checksum and url calculated.
     * @returns the upload object and the row that it populated
     */
    const createUpload = async () => {
      const row = { timestamp: Date.now(), uri: {} };
      const upload = new options.ermRest.Upload(testFile.file, { column, reference });
      await upload.calculateChecksum(row);
      return { upload, row };
    };

    /**
     * Mocks the HEAD request, so it looks like the same file already exists with the given content-disposition.
     */
    const mockExistingFile = (upload, contentDisposition) => {
      nock(upload.SERVER_URI)
        .head(upload.url)
        .reply(200, '', {
          'content-md5': upload.hash.md5_base64,
          'content-length': String(upload.file.size),
          'content-disposition': contentDisposition,
          'content-location': `${upload.url}:version1`,
        });
    };

    /**
     * Mocks the request that updates the filename of the existing file.
     * @returns the body and the context header of each request that was sent
     */
    const mockFilenameUpdate = (upload) => {
      const requests = [];
      nock(upload.SERVER_URI)
        .put(`${upload.url};metadata/content-disposition`)
        .reply(function (path, body) {
          // nock lowercases the header names
          requests.push({ body, context: JSON.parse(this.req.headers['deriva-client-context']) });
          return [204, ''];
        });
      return requests;
    };

    it('skips the upload when the filename is the same', async () => {
      const { upload } = await createUpload();
      mockExistingFile(upload, `filename*=UTF-8''${fileName}`);
      const filenameUpdates = mockFilenameUpdate(upload);

      expect(await upload.fileExists()).toBe(upload.url);
      expect(upload.completed).toBe(true);
      expect(upload.jobDone).toBe(true);
      expect(upload.versionedUrl).toBe(`${upload.url}:version1`);
      expect(filenameUpdates.length).toBe(0);
    });

    it('reads the filename without the UTF-8 prefix', async () => {
      const { upload } = await createUpload();
      mockExistingFile(upload, `filename="${fileName}"`);
      const filenameUpdates = mockFilenameUpdate(upload);

      await upload.fileExists();

      expect(upload.jobDone).toBe(true);
      expect(filenameUpdates.length).toBe(0);
    });

    it('updates the filename when it is different', async () => {
      const { upload } = await createUpload();
      mockExistingFile(upload, "filename*=UTF-8''other.png");
      const filenameUpdates = mockFilenameUpdate(upload);

      expect(await upload.fileExists()).toBe(upload.url);

      expect(filenameUpdates.length).toBe(1);
      expect(filenameUpdates[0].body).toBe(`filename*=UTF-8''${fileName}`);
      expect(filenameUpdates[0].context.action).toBe('upload/metadata/update');
      expect(upload.completed).toBe(true);
      expect(upload.jobDone).toBe(true);
      // updating the metadata doesn't create a new version
      expect(upload.versionedUrl).toBe(`${upload.url}:version1`);
      expect(await upload.completeUpload()).toBe(`${upload.url}:version1`);
    });

    it('does not change the given context header params', async () => {
      const { upload } = await createUpload();
      mockExistingFile(upload, "filename*=UTF-8''other.png");
      const filenameUpdates = mockFilenameUpdate(upload);
      const contextHeaderParams = { action: 'test/file-exists' };

      await upload.fileExists(null, contextHeaderParams);

      expect(contextHeaderParams.action).toBe('test/file-exists');
      expect(filenameUpdates[0].context.action).toBe('upload/metadata/update');
    });

    describe('when the filename update fails, ', () => {
      const failures = [
        { name: 'a 403 error', mockReply: (interceptor) => interceptor.reply(403, 'Forbidden') },
        { name: 'a 500 error', mockReply: (interceptor) => interceptor.reply(500, 'Internal Server Error') },
        { name: 'a network error', mockReply: (interceptor) => interceptor.replyWithError('connection reset') },
      ];

      failures.forEach(({ name, mockReply }) => {
        it(`uses the existing file after ${name}`, async () => {
          const { upload, row } = await createUpload();
          mockExistingFile(upload, "filename*=UTF-8''other.png");
          const filenameUpdate = mockReply(nock(upload.SERVER_URI).put(`${upload.url};metadata/content-disposition`));
          const uploadJob = nock(upload.SERVER_URI)
            .post((path) => path.startsWith(`${upload.url};upload`))
            .reply(201, '', { location: `${upload.url};upload/job` });

          // so the 500 and network errors are not retried
          const maxRetries = upload.http.max_retries;
          upload.http.max_retries = 0;
          try {
            expect(await upload.fileExists()).toBe(upload.url);
          } finally {
            upload.http.max_retries = maxRetries;
          }

          expect(filenameUpdate.isDone()).toBe(true);
          expect(upload.completed).toBe(true);
          expect(upload.jobDone).toBe(true);
          // the record gets the new filename, while the file in hatrac keeps the old one
          expect(row.filename).toBe(fileName);

          // the rest of the steps don't send any requests, and the existing version is used
          expect(await upload.createUploadJob()).toBeNull();
          expect(uploadJob.isDone()).toBe(false);
          expect(await upload.start()).toBe(upload.url);
          expect(await upload.completeUpload()).toBe(`${upload.url}:version1`);
        });
      });
    });
  });
};
