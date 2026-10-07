import type { AxiosProgressEvent } from 'axios';

// models
import { Checksum, type UploadFile } from '@isrd-isi-edu/ermrestjs/src/models/hatrac/checksum';
import { Chunk } from '@isrd-isi-edu/ermrestjs/src/models/hatrac/chunk';
import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';
import { InvalidInputError, MalformedURIError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import type { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { AssetPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';

// services
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
import HTTPService from '@isrd-isi-edu/ermrestjs/src/services/http';

// utils
import { isObject, isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { contextHeaderName } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { getFilename, getFilenameExtension } from '@isrd-isi-edu/ermrestjs/src/utils/file-utils';

// legacy
import { _validateTemplate, _renderTemplate, _getFormattedKeyValues, _parseUrl } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/**
 * the characters that are not allowed in the filename that we send to hatrac (they are replaced with `_`)
 */
const FILENAME_REGEXP = /[^a-zA-Z0-9_.-]/gi;

/**
 * The row of data (or the linked data/template variables) that the asset is part of.
 */
export type UploadRow = Record<string, unknown>;

/**
 * The file properties that Upload adds to the value of the asset column in the row.
 * These can be used in the url_pattern and filename_pattern.
 */
export type AssetUploadValue = {
  size?: number;
  mimetype?: string;
  md5_hex?: string;
  md5_base64?: string;
  sha256?: string;
  filename?: string;
  filename_ext?: string | null;
  filename_basename?: string;
};

export type UploadOptions = {
  /**
   * size of the chunks in bytes. Default is 5MB (the minimum part size defined by hatrac).
   */
  chunkSize?: number;
  /**
   * number of chunks that are uploaded at the same time. Default is 4.
   */
  chunkQueueSize?: number;
  /**
   * the asset column that the file is uploaded for.
   */
  column: AssetPseudoColumn;
  reference: Reference;
};

/**
 * The object that is sent in the context header of each request (for logging on the server).
 */
export type UploadContextHeaderParams = Record<string, unknown>;

/**
 * @param uploaded the amount that has been uploaded so far
 * @param fileSize the total size of the file.
 */
export type UploadProgressCallback = (uploaded: number, fileSize?: number) => void;

/**
 * The config of the requests that we send to hatrac.
 */
export type HatracHTTPConfig = {
  headers: Record<string, unknown>;
  /**
   * used for aborting the request
   */
  signal?: AbortSignal;
  /**
   * called while the request body is being uploaded
   */
  onUploadProgress?: (event: AxiosProgressEvent) => void;
};

/**
 * The response of the requests that we send to hatrac.
 */
export type HatracHTTPResponse = {
  status: number;
  data: unknown;
  headers: Record<string, string | undefined>;
};

/**
 * The methods of the wrapped http service (see HTTPService.wrapHTTP) that are used for talking to hatrac.
 */
export interface HatracHTTP {
  head(url: string, config: HatracHTTPConfig): PromiseLike<HatracHTTPResponse>;
  get(url: string, config: HatracHTTPConfig): PromiseLike<HatracHTTPResponse>;
  delete(url: string, config: HatracHTTPConfig): PromiseLike<HatracHTTPResponse>;
  put(url: string, data: unknown, config: HatracHTTPConfig): PromiseLike<HatracHTTPResponse>;
  post(url: string, data: unknown, config: HatracHTTPConfig): PromiseLike<HatracHTTPResponse>;
}

/**
 * Returns the headers object with the given params as the context header.
 */
const generateContextHeader = (contextHeaderParams?: UploadContextHeaderParams): Record<string, unknown> => {
  if (!contextHeaderParams || !isObject(contextHeaderParams)) {
    contextHeaderParams = {};
  }

  return { [contextHeaderName]: contextHeaderParams };
};

/**
 * The http status of a failed request (undefined if it's not available).
 */
const getResponseStatus = (response: unknown): number | undefined => {
  if (typeof response === 'object' && response !== null && 'status' in response && typeof response.status === 'number') {
    return response.status;
  }
  return undefined;
};

/**
 * Create a new instance with new Upload(file, otherInfo)
 * To validate url generation for a file call validateURL(row, linkedData) with row of data and the fk data
 * To calculate checksum call calculateChecksum(row, linkedData) with row of data and the fk data
 * To check for existing file call fileExists()
 * To create an upload call createUploadJob()
 * To start uploading, call start()
 * To complete upload job call completeUpload()
 * You can pause with pause()
 * Resume with resume()
 * Cancel with cancel()
 */
export class Upload {
  /**
   * size of the chunks in bytes
   */
  PART_SIZE: number;

  /**
   * number of chunks that are uploaded at the same time
   */
  CHUNK_QUEUE_SIZE: number;

  file: UploadFile;

  /**
   * the name that will be used for content-disposition and filename column
   */
  storedFilename: string;

  column: AssetPseudoColumn;

  reference: Reference;

  /**
   * the origin that relative hatrac urls are resolved against (the ermrest uri without `/ermrest`)
   */
  SERVER_URI: string;

  /**
   * the http service of the reference's server, so the requests have the same retry and 401 handling as the ermrest ones
   */
  http: HatracHTTP;

  /**
   * whether the upload is paused (or canceled)
   */
  isPaused: boolean;

  /**
   * the options that this object was created with
   */
  otherInfo: UploadOptions;

  /**
   * the chunks of the file (created by start)
   */
  chunks: Chunk[];

  /**
   * array of true values for tracking which chunks are uploaded so far.
   * used to determine what chunk to resume upload from if needed
   */
  chunkTracker: boolean[];

  /**
   * the index of the chunk that we started the upload from (when resuming an existing upload job)
   */
  startChunkIdx: number;

  /**
   * the checksum of the file (created by calculateChecksum)
   */
  hash?: Checksum;

  /**
   * the hatrac url of the file (generated by calculateChecksum)
   */
  url = '';

  /**
   * the url of the upload job
   */
  chunkUrl: string | null = null;

  /**
   * the versioned url of the uploaded file
   */
  versionedUrl?: string;

  /**
   * whether all the chunks are uploaded (or the file already existed)
   */
  completed = false;

  /**
   * whether the upload job is completed (or the file already existed)
   */
  jobDone = false;

  /**
   * whether a chunk upload failed. used to make sure we only report the first error.
   */
  erred = false;

  /**
   * TODO this is only ever set to false (the unit tests check it).
   */
  fileExistsFlag = false;

  /**
   * the chunks that are waiting to be uploaded
   */
  chunkQueue: Chunk[] = [];

  /**
   * the promise that start returned. it's settled when all the chunks are uploaded or one of them fails.
   */
  uploadPromise?: DeferredPromise<string>;

  /**
   * the onProgress callback that was passed to start
   */
  uploadProgressCallback?: UploadProgressCallback;

  /**
   * @param file the file object
   * @param otherInfo the column and reference are mandatory
   */
  constructor(file: UploadFile, otherInfo: UploadOptions) {
    this.PART_SIZE = otherInfo.chunkSize || 5 * 1024 * 1024; //minimum part size defined by hatrac 5MB

    this.CHUNK_QUEUE_SIZE = otherInfo.chunkQueueSize || 4;

    this.file = file;
    if (!this.file) throw new Error('No file provided while creating hatrac file object');

    this.storedFilename = file.name;

    this.column = otherInfo.column;
    if (!this.column) throw new Error('No column provided while creating hatrac file object');

    this.reference = otherInfo.reference;
    if (!this.reference) throw new Error('No reference provided while creating hatrac file object');

    this.SERVER_URI = this.reference.server.uri.replace('/ermrest', '');

    this.http = this.reference.server.http;

    this.isPaused = false;
    this.otherInfo = otherInfo;

    this.chunks = [];
    this.chunkTracker = [];
    this.startChunkIdx = 0;
  }

  /**
   * Call this function with the row of data to determine whether it is able to generate a url.
   * If any properties in the template are found null without null handling then return false
   * @param row - row object containing keyvalues of entity
   * @param linkedData - object containing the linked data (outbound fk values)
   * @param templateVariables - other template variables that should be available
   */
  validateURL(row: UploadRow, linkedData?: UploadRow, templateVariables?: UploadRow): boolean {
    if (!this.column.urlPattern) return true;

    const template = this.column.urlPattern;

    const ignoredColumns: string[] = [];

    // Add file properties depending on column to ignore_columns
    if (this.column.filenameColumn) ignoredColumns.push(this.column.filenameColumn.name);
    if (this.column.byteCountColumn) ignoredColumns.push(this.column.byteCountColumn.name);
    if (this.column.md5 && typeof this.column.md5 === 'object') ignoredColumns.push(this.column.md5.name);
    if (this.column.sha256 && typeof this.column.sha256 === 'object') ignoredColumns.push(this.column.sha256.name);

    ignoredColumns.push('md5_hex');
    ignoredColumns.push('md5_base64');
    ignoredColumns.push('filename');
    ignoredColumns.push('size');
    ignoredColumns.push('mimetype');
    ignoredColumns.push('filename_ext');
    ignoredColumns.push(this.column.name + '.md5_hex');
    ignoredColumns.push(this.column.name + '.md5_base64');
    ignoredColumns.push(this.column.name + '.filename');
    ignoredColumns.push(this.column.name + '.size');
    ignoredColumns.push(this.column.name + '.mimetype');
    ignoredColumns.push(this.column.name + '.filename_ext');
    // TODO is this needed?
    // make sure to add raw columns too.
    // NOTE: this must be forEach as it only goes through the elements that existed before the loop started.
    // changing this to `for...of` will cause an infinite loop.
    ignoredColumns.forEach((col) => {
      ignoredColumns.push('_' + col);
    });

    const keyValues = _getFormattedKeyValues(this.reference.table, this.reference.context, row, linkedData) as Record<string, unknown>;
    if (isObjectAndNotNull(templateVariables)) {
      Object.assign(keyValues, templateVariables);
    }

    return _validateTemplate(template, keyValues, this.reference.table.schema.catalog, {
      ignoredColumns: ignoredColumns,
      templateEngine: this.column.templateEngine,
    });
  }

  /**
   * Call this function to calculate checksum before uploading to server
   * @param row - row object containing keyvalues of entity
   * @param linkedData - object containing the linked data (outbound fk values)
   * @param templateVariables - other template variables that should be available
   * @param onProgress - a callback function to be called for progress
   * @returns A promise resolved with a url where we will upload the file
   * or rejected with error if unable to calculate checksum
   */
  async calculateChecksum(
    row: UploadRow,
    linkedData?: UploadRow,
    templateVariables?: UploadRow,
    onProgress?: (uploaded: number) => void,
  ): Promise<string> {
    this.erred = false;

    // If the hash is calculated then simply generate the url and notify
    if (this.hash && (this.hash.md5_base64 || this.hash.sha256)) {
      this._generateURL(row, linkedData, templateVariables);
      if (onProgress) onProgress(this.file.size);
      return this.url;
    }

    const hash = new Checksum(this.file);
    this.hash = hash;

    await new Promise<void>((resolve, reject) => {
      hash.calculate(
        this.PART_SIZE,
        (uploaded) => {
          if (onProgress) onProgress(uploaded);
        },
        () => resolve(),
        (err) => {
          const hasMessage = typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string';
          const message = hasMessage && err.message ? err.message : 'Unable to calculate checksum for file';
          reject(new Error(message + ' ' + this.file.name));
        },
      );
    });

    this._generateURL(row, linkedData, templateVariables);
    return this.url;
  }

  /**
   * Call this function to determine file exists on the server
   * If it doesn't then resolve the promise with url.
   * If it does then set isPaused, completed and jobDone to true
   * @param previousJobUrl - if an existing job is being tracked locally and the checksum for current `upload`
   *     matches that matched job, return the stored previousJobUrl to be used if a 409 is returned
   *       - a 409 could mean the namespace already exists and we have an existing job for that namespace we know is partially uplaoded
   *       - if all the above is true, set the `upload.chunkUrl` to the jobUrl we were tracking locally
   * @param contextHeaderParams - the object that will be logged
   */
  async fileExists(previousJobUrl?: string | null, contextHeaderParams?: UploadContextHeaderParams): Promise<string> {
    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = this._getDefaultContextHeaderParams('upload/file-exists');
    }

    const config: HatracHTTPConfig = {
      headers: generateContextHeader(contextHeaderParams),
    };

    let response: HatracHTTPResponse;
    try {
      response = await this.http.head(this._getAbsoluteUrl(this.url), config);
    } catch (err) {
      const status = getResponseStatus(err);
      // 403 - file exists but user can't read it -> create a new one
      // 404 - file doesn't exist -> create new one
      if (status === 403 || status === 404) {
        return this.url;
      }

      // 409 - The parent path does not denote a namespace OR the namespace already exists (from hatrac docs)
      if (status === 409) {
        // the namespace might exist with no content, maybe there is a partial upload
        // set the chunkUrl to the previousJobUrl that we stored in chaise with a partial upload
        // previousJobUrl = self.url + ';upload/' + job.hash
        if (previousJobUrl) this.chunkUrl = previousJobUrl;
        return this.url;
      }

      throw ErrorService.responseToError(err);
    }

    const headers: Record<string, string | undefined> = HTTPService.getResponseHeader(response);
    const hash = this._getCalculatedHash();

    // If the file is not same, then simply resolve the promise without setting completed and jobDone
    // NOTE: content-length is a string while the file size is a number
    if (headers['content-md5'] !== hash.md5_base64 || Number(headers['content-length']) !== this.file.size) {
      return this.url;
    }

    // check if filename in content disposition is different from filename being uploaded
    // if it is, create an update metadata request for updating the content-disposition
    const filename = this.storedFilename.replace(FILENAME_REGEXP, '_');
    if (getFilename(this.url, headers['content-disposition']) !== filename) {
      // NOTE: this updates the current version in place, so any other record that points to the same version will
      // be downloaded with the new name too.
      const url = this._getAbsoluteUrl(this.url + ';metadata/content-disposition');
      const putConfig: HatracHTTPConfig = {
        headers: {
          ...generateContextHeader({ ...contextHeaderParams, action: 'upload/metadata/update' }),
          'content-type': 'text/plain',
        },
      };

      try {
        await this.http.put(url, "filename*=UTF-8''" + filename, putConfig);
      } catch {
        // this was the best effort, so it's ok if it fails
      }
    }

    // mark as completed and job done since there's no need to transfer the file data
    this.isPaused = false;
    this.completed = true;
    this.jobDone = true;
    // the HEAD request returns the current version, and updating the metadata doesn't change the version.
    this.versionedUrl = headers['content-location'];
    return this.url;
  }

  /**
   * Call this function to create an upload job for chunked uploading
   * @param contextHeaderParams - the object that will be logged
   * @returns A promise resolved with the url of the upload job (if the file already exists, it might be null)
   */
  async createUploadJob(contextHeaderParams?: UploadContextHeaderParams): Promise<string | null> {
    this.erred = false;

    if (this.completed && this.jobDone) {
      return this.chunkUrl;
    }

    const hash = this._getCalculatedHash();

    let existingJob: HatracHTTPResponse | undefined;
    try {
      // Check whether an existing upload job is available for current file
      existingJob = await this._getExistingJobStatus();
    } catch (err) {
      // TODO if the tracked upload job doesn't exist anymore (e.g. it expired), we should create a new one instead of failing.
      throw ErrorService.responseToError(err);
    }

    // if upload job exists and the md5 of it is the same as the one that we calculated then use the current chunk url
    const existingJobData = existingJob ? (existingJob.data as { 'content-md5'?: string } | null) : null;
    if (existingJobData && existingJobData['content-md5'] === hash.md5_base64) {
      return this.chunkUrl;
    }

    this.chunkUrl = null;

    const url = this._getAbsoluteUrl(this.url + ';upload?parents=true');

    const data = {
      'chunk-length': this.PART_SIZE,
      'content-length': this.file.size,
      'content-type': this.file.type,
      'content-md5': hash.md5_base64,
      'content-disposition': "filename*=UTF-8''" + this.storedFilename.replace(FILENAME_REGEXP, '_'),
    };

    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = this._getDefaultContextHeaderParams('upload/create');
    }

    const config: HatracHTTPConfig = {
      headers: { ...generateContextHeader(contextHeaderParams), 'content-type': 'application/json' },
    };

    let response: HatracHTTPResponse;
    try {
      response = await this.http.post(url, data, config);
    } catch (err) {
      throw ErrorService.responseToError(err);
    }

    const headers: Record<string, string | undefined> = HTTPService.getResponseHeader(response);
    this.chunkUrl = headers.location || null;
    return this.chunkUrl;
  }

  /**
   * Call this function to start chunked upload to server. It reads the file and divides in into chunks
   * If the completed flag is true, then this means that all chunks were already uploaded, thus it will resolve the promize with url
   * else it will start uploading the chunks. If the job was paused then resume by uploading just those chunks which were not completed.
   *
   * @param startChunkIdx - the index of the chunk to start uploading from in case of resuming a found incomplete upload job
   * @param onProgress - a callback function to be called for progress
   * @returns A promise resolved with a url where we uploaded the file
   * or rejected with error if unable to upload any chunk
   */
  start(startChunkIdx?: number, onProgress?: UploadProgressCallback): Promise<string> {
    this.erred = false;

    const deferred = new DeferredPromise<string>();

    this.uploadPromise = deferred;
    this.uploadProgressCallback = onProgress;

    if (this.completed) {
      if (onProgress) onProgress(this.file.size);

      // TODO it's not clear why this is resolved with a delay
      setTimeout(() => {
        deferred.resolve(this.url);
      }, 10);

      return deferred.promise;
    }

    const startIdx = startChunkIdx || 0;

    // If isPaused is not true, or chunks length is 0 then create chunks and start uploading
    // else directly start uploading the chunks
    if (!this.isPaused || this.chunks.length === 0) {
      this.chunks = [];

      if (this.file.size === 0) {
        // empty (0-byte) uploads are rejected unless the asset annotation opts in via allow_empty_file
        if (this.column.allowEmptyFile) {
          deferred.resolve(this.url);
        } else {
          deferred.reject(new InvalidInputError(`The file "${this.file.name}" is empty (0 bytes). Empty files are not allowed.`));
        }
        return deferred.promise;
      }

      let start = 0;
      let index = 0;
      while (start < this.file.size) {
        const end = Math.min(start + this.PART_SIZE, this.file.size);
        this.chunks.push(new Chunk(index++, start, end));
        start = end;
      }

      this.startChunkIdx = startIdx;
      // intialize array to the same length as the number of chunks we have
      // this initializes every index to `Empty`
      this.chunkTracker = new Array<boolean>(this.chunks.length);
      // set index in array to true for each chunk we know is already uploaded
      for (let j = 0; j < startIdx; j++) this.chunkTracker[j] = true;
    }

    this.isPaused = false;
    this.chunkQueue = [];

    this.chunks.forEach((chunk, idx) => {
      // check the startChunkIdx before uploading the chunk in the case we are resuming an upload job
      if (idx < startIdx) return;

      this.chunkQueue.push(chunk);
    });

    for (let i = 0; i < this.CHUNK_QUEUE_SIZE; i++) {
      const nextChunk = this.chunkQueue.shift();
      if (nextChunk) this._uploadPart(nextChunk);
    }

    return deferred.promise;
  }

  /**
   * This function is used to complete the chunk upload by notifying hatrac about it returning a promise with final url
   * @param contextHeaderParams - the object that will be logged
   * @returns A promise resolved with a url where we uploaded the file
   * or rejected with error if unable to complete the job
   */
  async completeUpload(contextHeaderParams?: UploadContextHeaderParams): Promise<string> {
    if (this.completed && this.jobDone) {
      return this.versionedUrl ? this.versionedUrl : this.url;
    }

    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = this._getDefaultContextHeaderParams('upload/complete');
    }

    const config: HatracHTTPConfig = {
      headers: { ...generateContextHeader(contextHeaderParams), 'content-type': 'application/json' },
    };

    if (!this.chunkUrl) {
      throw new Error('The upload job must be created before it can be completed.');
    }

    // get's the versioned hatrac url
    let response: HatracHTTPResponse;
    try {
      response = await this.http.post(this._getAbsoluteUrl(this.chunkUrl), {}, config);
    } catch (err) {
      throw ErrorService.responseToError(err);
    }

    this.jobDone = true;

    const headers: Record<string, string | undefined> = HTTPService.getResponseHeader(response);
    if (!headers.location) {
      // TODO this turns a successful response into an error.
      throw ErrorService.responseToError(response);
    }

    this.versionedUrl = headers.location;
    return this.versionedUrl;
  }

  /**
   * Pause the upload
   * Remember, the current progressing part will fail,
   * that part will start from beginning (< 5MB of upload is wasted)
   */
  pause(): void {
    if (this.completed || this.isPaused) return;

    this.isPaused = true;
    this.chunks.forEach((chunk) => {
      chunk.abort();
      if (!chunk.completed) chunk.progress = 0;
    });
    this._updateProgressBar();
  }

  /**
   * Resumes the upload
   */
  resume(): void {
    if (!this.isPaused) return;

    this.erred = false;

    // code to handle reupload
    // TODO start() replaces uploadPromise, so the promise that the first start() returned never settles, and the
    // result of this one is not returned to the caller.
    this.start().catch(() => {});
  }

  /**
   * Aborts/cancels the upload
   * @param deleteJob whether we should also delete the upload job
   */
  async cancel(deleteJob?: boolean): Promise<void> {
    // If the upload has completed and complete job call has been made then
    // We directly resolve the promise setting progress as 0 for each chunk
    if (this.completed && this.jobDone) {
      this.chunks.forEach((chunk) => {
        chunk.abortController = null;
        chunk.progress = 0;
      });

      // To zero the update of a file progress bar
      this._updateProgressBar();
      return;
    }

    this.isPaused = true;

    // abort the requests that are in progress and set the progress to 0 for all chunks
    this.chunks.forEach((chunk) => {
      chunk.progress = 0;
      chunk.abort();
    });

    const cancelJobPromise = deleteJob ? this._cancelUploadJob() : Promise.resolve();

    // To zero the update of a file progress bar
    // TODO if this is called before start (no chunks), _updateProgressBar will mark the upload as completed.
    this._updateProgressBar();

    await cancelJobPromise;
  }

  /**
   * deletes the file metadata from the hatrac database and removes it from the namespace
   * @param contextHeaderParams - the object that will be logged
   */
  async deleteFile(contextHeaderParams?: UploadContextHeaderParams): Promise<void> {
    if (!contextHeaderParams || !isObject(contextHeaderParams)) {
      contextHeaderParams = this._getDefaultContextHeaderParams('upload/delete');
    }

    const config: HatracHTTPConfig = {
      headers: generateContextHeader(contextHeaderParams),
    };

    try {
      await this.http.delete(this._getAbsoluteUrl(this.url), config);
    } catch (err) {
      throw ErrorService.responseToError(err);
    }
  }

  /**
   * @private
   * The context header params that are used when the caller didn't provide any.
   * @param action the action that should be logged
   */
  _getDefaultContextHeaderParams(action: string): UploadContextHeaderParams {
    return {
      action,
      referrer: { ...this.reference.defaultLogInfo, column: this.column.name },
    };
  }

  /**
   * @private
   * This function converts a url to an absolute one, prepending it with SERVER_URI.
   * @param uri - uri string
   * @returns the absolute url containing the FQDN
   */
  _getAbsoluteUrl(uri: string): string {
    // A more universal, non case-sensitive, protocol-agnostic regex
    // to test a URL string is relative or absolute
    const r = new RegExp('^(?:[a-z]+:)?//', 'i');

    // The url is absolute so don't make any changes and return it as it is
    if (r.test(uri)) return uri;

    // If uri starts with "/" then simply prepend the server uri
    if (uri.indexOf('/') === 0) return this.SERVER_URI + uri;

    // else prepend the server uri with an additional "/"
    return this.SERVER_URI + '/' + uri;
  }

  /**
   * @private
   * The checksum object after calculateChecksum is done.
   */
  _getCalculatedHash(): Checksum {
    if (!this.hash) {
      throw new Error('The checksum of the file must be calculated first.');
    }
    return this.hash;
  }

  /**
   * @private
   * Call this function with the json row object to generate an upload url
   * @param row - row object containing keyvalues of entity
   * @param linkedData - object containing the linked data (outbound fk values)
   * @param templateVariables - other template variables that should be available
   */
  _generateURL(row: UploadRow, linkedData?: UploadRow, templateVariables?: UploadRow): string {
    const template = this.column.urlPattern;
    const hash = this._getCalculatedHash();

    // Populate all values in row depending on column from current
    if (this.column.filenameColumn) row[this.column.filenameColumn.name] = this.file.name;
    if (this.column.byteCountColumn) row[this.column.byteCountColumn.name] = this.file.size;
    if (this.column.md5 && typeof this.column.md5 === 'object') row[this.column.md5.name] = hash.md5_hex;
    // TODO sha256 is never calculated (see Checksum.sha256), so this sets the sha256 column to undefined.
    if (this.column.sha256 && typeof this.column.sha256 === 'object') row[this.column.sha256.name] = hash.sha256;

    const assetValue = row[this.column.name] as AssetUploadValue;
    assetValue.size = this.file.size;
    assetValue.mimetype = this.file.type;
    assetValue.md5_hex = hash.md5_hex;
    assetValue.md5_base64 = hash.md5_base64;
    assetValue.sha256 = hash.sha256;
    assetValue.filename = this.file.name;
    const filenameExt = getFilenameExtension(this.file.name, this.column.filenameExtFilter, this.column.filenameExtRegexp);
    assetValue.filename_ext = filenameExt;
    // filename_basename is everything from the file name except the last ext
    // For example if we have a file named "file.tar.zip"
    //    => "file.tar" is the basename
    //    => ".zip" is the extension
    assetValue.filename_basename = filenameExt ? this.file.name.substring(0, this.file.name.length - filenameExt.length) : this.file.name;

    // Generate url

    // the hatrac value in row is an object, which can be improved
    const keyValues = _getFormattedKeyValues(this.reference.table, this.reference.context, row, linkedData) as Record<string, unknown>;
    if (isObjectAndNotNull(templateVariables)) {
      Object.assign(keyValues, templateVariables);
    }

    const url: string | null = _renderTemplate(template, keyValues, this.reference.table.schema.catalog, {
      avoidValidation: true,
      templateEngine: this.column.templateEngine,
    });

    if (this.column.filenamePattern) {
      const filename: string | null = _renderTemplate(this.column.filenamePattern, keyValues, this.reference.table.schema.catalog, {
        avoidValidation: true,
        templateEngine: this.column.templateEngine,
      });

      if (filename && filename.trim() !== '') {
        this.storedFilename = filename;
        // update the filename column value on the row being submitted
        if (this.column.filenameColumn) row[this.column.filenameColumn.name] = this.storedFilename;
      }
    }

    // If the template is null then throw an error
    if (url === null || url.trim() === '') {
      throw new MalformedURIError('Some column values are null in the template or the template is invalid. The used template: ' + template);
    }

    // check for having hatrac
    if ((_parseUrl(url) as { pathname: string }).pathname.indexOf('/hatrac/') !== 0) {
      throw new MalformedURIError('The path for uploading a url should begin with /hatrac/ .');
    }

    // If new url has changed then there set all other flags to false to recompute them
    if (this.url !== url) {
      // To regenerate upload job url
      this.chunkUrl = null;

      // To make the filesExists call again
      this.fileExistsFlag = false;

      // To restart upload of all chunks
      this.completed = false;

      // To recall complete upload method
      this.jobDone = false;
    }

    this.url = url;

    // NOTE: url is returned but not used in either place this function is called
    return this.url;
  }

  /**
   * @private
   * This function fetches the upload job status if chunkUrl is defined
   * @returns the response of the status request (undefined if there isn't any upload job)
   */
  async _getExistingJobStatus(): Promise<HatracHTTPResponse | undefined> {
    const config: HatracHTTPConfig = {
      headers: generateContextHeader(this._getDefaultContextHeaderParams('upload/status')),
    };

    if (!this.chunkUrl) return undefined;

    return this.http.get(this._getAbsoluteUrl(this.chunkUrl), config);
  }

  /**
   * @private
   * This function is called by start method to start uploading the chunk to server.
   * Once the chunk is uploaded, it will start uploading the next chunk in the queue.
   * @param chunk - chunk object
   */
  _uploadPart(chunk: Chunk): void {
    // a request for this chunk might still be in flight
    if (chunk.abortController && !chunk.completed) {
      chunk.abort();
      chunk.progress = 0;
    }

    chunk.sendToHatrac(this).then((uploaded) => {
      // if the chunk failed or was aborted, or the upload is paused/canceled, we should not continue with the rest of the queue.
      // (the request might finish right before the pause/cancel, which is why isPaused must be checked too)
      if (!uploaded || this.isPaused) return;

      const nextChunk = this.chunkQueue.shift();
      if (nextChunk) this._uploadPart(nextChunk);
    });
  }

  /**
   * @private
   * This function should be called to update the progress of upload
   * It calls the onProgressChanged callback that the user subscribes
   * In addition if the upload has been completed then it will resolve the promise that start returned.
   */
  _updateProgressBar(): void {
    const length = this.chunks.length;
    // progressDone and chunksComplete should be intiialized if we had an existing upload job
    let progressDone = this.startChunkIdx * this.PART_SIZE;
    let chunksComplete = this.startChunkIdx;
    for (const chunk of this.chunks) {
      progressDone = progressDone + chunk.progress;
      if (chunk.completed) chunksComplete++;
    }

    if (this.uploadProgressCallback) this.uploadProgressCallback(this.completed ? this.file.size : progressDone, this.file.size);

    if (chunksComplete === length && !this.completed) {
      this.completed = true;
      if (this.uploadPromise) this.uploadPromise.resolve(this.url);
    }
  }

  /**
   * @private
   * Code to cancel upload job
   * We resolve the promise successfully even though the delete fails
   * because it won't affect the upload
   * Setting chunkUrl null marks that when we reupload this file, we should create a new job
   */
  async _cancelUploadJob(): Promise<void> {
    const config: HatracHTTPConfig = {
      headers: generateContextHeader(this._getDefaultContextHeaderParams('upload/cancel')),
    };

    if (!this.chunkUrl) return;

    try {
      await this.http.delete(this._getAbsoluteUrl(this.chunkUrl), config);
    } catch {
      // the upload is canceled, so it's fine if we couldn't delete the job
    }

    this.chunkUrl = null;
  }

  /**
   * @private
   * This function will be called by chunk upload hanlder with the actual response
   * @param response - network error response
   */
  _onUploadError(response: unknown): void {
    if (this.erred) return;
    this.erred = true;
    if (this.uploadPromise) this.uploadPromise.reject(ErrorService.responseToError(response));
  }
}
