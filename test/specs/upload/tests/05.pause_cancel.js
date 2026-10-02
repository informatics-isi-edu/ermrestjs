const axios = require('axios');
const nock = require('nock');
const { createTestFile, removeTestFile, delay, waitFor, trackPromise } = require('../utils.js');

/*
 * hatrac is mocked with nock in these specs, so the chunk requests can be delayed and inspected.
 * only ermrest is used for getting the reference and the asset column.
 */
exports.execute = (options) => {
  describe('For pausing and canceling an upload, ', () => {
    const chunkSize = 1000;
    const chunkCount = 8;
    let testFile;
    let reference;
    let column;
    let jobCounter = 0;

    beforeAll(async () => {
      testFile = createTestFile('testfile_pause_cancel.png', chunkSize * chunkCount);

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
     * Creates an upload object that has an upload job (the request is mocked).
     */
    const createUploadWithJob = async () => {
      const upload = new options.ermRest.Upload(testFile.file, { column, reference, chunkSize });
      const url = await upload.calculateChecksum({ timestamp: Date.now(), uri: {} });

      jobCounter++;
      nock(upload.SERVER_URI)
        .post((path) => path.startsWith(`${url};upload`))
        .reply(201, '', { location: `${url};upload/job${jobCounter}` });

      await upload.createUploadJob();
      return upload;
    };

    /**
     * Mocks the chunk requests of the given upload. Each request is answered after the given delay.
     * @returns the index of each chunk that was requested
     */
    const mockChunkRequests = (upload, responseDelay) => {
      const requestedChunks = [];
      nock(upload.SERVER_URI)
        .persist()
        .put((path) => path.startsWith(`${upload.chunkUrl}/`))
        .delay(responseDelay)
        .reply((path) => {
          requestedChunks.push(Number(path.split('/').pop()));
          return [204, ''];
        });
      return requestedChunks;
    };

    it('cancel aborts the chunks that are being uploaded', async () => {
      const upload = await createUploadWithJob();
      const requestedChunks = mockChunkRequests(upload, 500);

      const startResult = trackPromise(upload.start());
      await waitFor(() => requestedChunks.length === upload.CHUNK_QUEUE_SIZE);

      await upload.cancel();

      // if the requests were not aborted, their responses would mark the chunks as completed
      await delay(800);
      expect(upload.chunks.some((chunk) => chunk.completed)).toBe(false);
      expect(upload.chunks.every((chunk) => chunk.abortController === null)).toBe(true);
      expect(requestedChunks.length).toBe(upload.CHUNK_QUEUE_SIZE);
      expect(upload.erred).toBe(false);
      expect(startResult.state).toBe('pending');
    });

    it('pause aborts the chunks that are being uploaded', async () => {
      const upload = await createUploadWithJob();
      const requestedChunks = mockChunkRequests(upload, 500);

      const startResult = trackPromise(upload.start());
      await waitFor(() => requestedChunks.length === upload.CHUNK_QUEUE_SIZE);

      upload.pause();

      await delay(800);
      expect(upload.isPaused).toBe(true);
      expect(upload.chunks.some((chunk) => chunk.completed)).toBe(false);
      expect(upload.chunks.every((chunk) => chunk.abortController === null)).toBe(true);
      expect(requestedChunks.length).toBe(upload.CHUNK_QUEUE_SIZE);
      expect(upload.erred).toBe(false);
      expect(startResult.state).toBe('pending');
    });

    it('cancel stops uploading the queued chunks', async () => {
      const upload = await createUploadWithJob();
      const requestedChunks = mockChunkRequests(upload, 50);

      /*
       * cancel as soon as the first chunk is uploaded.
       * cancel calls the progress callback too, so `canceled` must be set before calling it.
       */
      let canceled = false;
      let cancelPromise;
      let requestedBeforeCancel;
      const onProgress = () => {
        if (canceled || !upload.chunkTracker.some(Boolean)) return;
        canceled = true;
        requestedBeforeCancel = requestedChunks.length;
        cancelPromise = upload.cancel();
      };

      trackPromise(upload.start(0, onProgress));
      await waitFor(() => canceled);
      await cancelPromise;

      await delay(300);
      expect(requestedChunks.length).toBe(requestedBeforeCancel);
      expect(upload.chunks.some((chunk) => !chunk.completed)).toBe(true);
    });

    it('resuming right after pausing finishes the upload', async () => {
      const upload = await createUploadWithJob();
      const requestedChunks = mockChunkRequests(upload, 200);

      trackPromise(upload.start());
      await waitFor(() => requestedChunks.length === upload.CHUNK_QUEUE_SIZE);

      // the aborted requests are rejected after the upload is resumed, so they must be ignored
      upload.pause();
      upload.resume();

      await waitFor(() => upload.completed);
      expect(upload.erred).toBe(false);
      expect(upload.chunks.every((chunk) => chunk.completed)).toBe(true);
    });

    it('cancel can also delete the upload job', async () => {
      const upload = await createUploadWithJob();
      const deleteJob = nock(upload.SERVER_URI).delete(upload.chunkUrl).reply(204);

      await upload.cancel(true);

      expect(deleteJob.isDone()).toBe(true);
      expect(upload.chunkUrl).toBeNull();
    });

    it('a canceled request is rejected without retries', async () => {
      const upload = await createUploadWithJob();
      const requestedChunks = mockChunkRequests(upload, 1000);

      // a retry would only happen after initial_delay, so a fast rejection means there wasn't any
      const { max_retries: maxRetries, initial_delay: initialDelay } = upload.http;
      upload.http.max_retries = 1;
      upload.http.initial_delay = 1000;

      try {
        const controller = new AbortController();
        const request = upload.http.put(`${upload.SERVER_URI}${upload.chunkUrl}/0`, Buffer.alloc(10), {
          headers: {},
          signal: controller.signal,
        });
        await waitFor(() => requestedChunks.length === 1);

        const abortTime = Date.now();
        controller.abort();

        let error;
        try {
          await request;
        } catch (err) {
          error = err;
        }

        expect(Date.now() - abortTime).toBeLessThan(500);
        expect(axios.isCancel(error)).toBe(true);
        expect(requestedChunks.length).toBe(1);
      } finally {
        upload.http.max_retries = maxRetries;
        upload.http.initial_delay = initialDelay;
      }
    });
  });
};
