/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable prettier/prettier */
import { ArrayBuffer } from 'spark-md5';

// models
// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';
import { MalformedURIError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

// services
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
import HTTPService from '@isrd-isi-edu/ermrestjs/src/services/http';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

// utils
import { hexToBase64 } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { isObject } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { contextHeaderName, ENV_IS_NODE } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { _validateTemplate, _renderTemplate, _getFormattedKeyValues, _parseUrl } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

const FILENAME_REGEXP = /[^a-zA-Z0-9_.-]/gi;
// // Check for whether the environment is Node.js or Browser
var blobSlice;
if (ENV_IS_NODE) {
  // eslint-disable-next-line no-undef
  blobSlice = Buffer.prototype.slice;
} else {
  blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
}

/**
 * @memberof ERMrest
 * @param {Object} {file} - A browser file object
 * @param {Object} {options} - An optional parameters object. The (key, value)
 * @constructor
 */
export function Checksum(file, options) {
  this.file = file;
  this.options = options || {};
}

/**
 * This callback will be called for progress during checksum calculation
 * @callback checksumOnProgres
 * @param {number} uploaded the amount that has been uploaded
 * @param {number} fileSize the total size of the file.
 */

/**
 * This callback will be called for success of checksum calculation
 * @callback checksumOnSuccess
 */

/**
 * This callback will be called when we counter an error during checksum calculation
 * @callback checksumOnError
 * @param {Error} err the error object
 */

/**
 * @param {number} chunkSize size of the chunks, in which the file is supposed to be broken
 * @param {checksumOnProgress} fn callback function to be called for progress
 * @param {checksumOnSuccess} fn callback function to be called for success
 * @param {checksumOnError} fn callback function to be called for error
 * @returns {Promise} if the schema exists or not
 * @desc Calculates  MD5 checksum for a file using spark-md5 library
 */
Checksum.prototype.calculate = function (chunkSize, onProgress, onSuccess, onError) {
  var self = this,
    file = this.file;
  if (!onProgress || typeof onProgress != 'function') onProgress = function () {};
  if (!onSuccess || typeof onSuccess != 'function') onSuccess = function () {};
  if (!onError || typeof onError != 'function') onError = function () {};

  // If checksum is already calculated then don't calculate it again
  if (this.md5_hex) {
    onProgress(this.file.size);
    onSuccess(this);
    return;
  }

  var chunks = Math.ceil(file.size / chunkSize),
    currentChunk = 0,
    spark = new ArrayBuffer();

  // THis function is called by fileReader on successful chunk read
  // It keeps adding the chunk to the digest
  // Once all chunks are done, it calculates the final md5 and converts it in hex format calling onSuccess
  var onLoad = function (e) {
    //console.log("\nRead chunk number " + parseInt(currentChunk + 1) + " of " + chunks);

    spark.append(e.target.result); // append array buffer

    currentChunk++;

    var completed = chunkSize * currentChunk;

    onProgress(completed > file.size ? file.size : completed, file.size);

    if (currentChunk < chunks) loadNext();
    else {
      self.md5_hex = spark.end();
      self.md5_base64 = hexToBase64(self.md5_hex);
      //console.log("\nFinished loading :)\n\nComputed hash: "  + self.md5_base64 + "\n!");
      onSuccess(self);
    }
  };

  // Call this function to read next chunk of file
  var loadNext = function () {
    var start = currentChunk * chunkSize,
      end = start + chunkSize >= file.size ? file.size : start + chunkSize;

    if (ENV_IS_NODE) {
      setTimeout(function () {
        onLoad({ target: { result: blobSlice.call(self.file.buffer, start, end) } });
      }, 1);
    } else {
      var fileReader = new FileReader();
      fileReader.onload = onLoad;
      fileReader.onerror = onError;

      fileReader.readAsArrayBuffer(blobSlice.call(self.file, start, end));
    }
  };

  loadNext();
};

const _generateContextHeader = function (contextHeaderParams) {
  if (!contextHeaderParams || !isObject(contextHeaderParams)) {
    contextHeaderParams = {};
  }

  var headers = {};
  headers[contextHeaderName] = contextHeaderParams;
  return headers;
};

/**
 * given a filename, will return the extension
 * By default, it will extract the last of the filename after the last `.`.
 * The second parameter can be used for passing a regular expression
 * if we want a different method of extracting the extension.
 * @param {string} filename
 * @param {string[]} allowedExtensions
 * @param {string[]} regexArr
 * @returns the filename extension string. if we cannot find any matches, it will return null
 * @private
 * @ignore
 */
const _getFilenameExtension = function (filename, allowedExtensions, regexArr) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return null;
  }

  // first find in the list of allowed extensions
  var res = -1;
  var isInAllowed =
    Array.isArray(allowedExtensions) &&
    allowedExtensions.some(function (ext) {
      res = ext;
      return typeof ext === 'string' && ext.length > 0 && filename.endsWith(ext);
    });
  if (isInAllowed) {
    return res;
  }

  // we will return null if we cannot find anything
  res = null;
  // no matching allowed extension, try the regular expressions
  if (Array.isArray(regexArr) && regexArr.length > 0) {
    regexArr.some(function (regexp) {
      // since regular expression comes from annotation, it might not be valid
      try {
        var matches = filename.match(new RegExp(regexp, 'g'));
        if (matches && matches[0] && typeof matches[0] === 'string') {
          res = matches[0];
        } else {
          res = null;
        }
        return res;
      } catch {
        res = null;
        return false;
      }
    });
  } else {
    var dotIndex = filename.lastIndexOf('.');
    // it's only a valid filename if there's some string after `.`
    if (dotIndex !== -1 && dotIndex !== filename.length - 1) {
      res = filename.slice(dotIndex);
    }
  }

  return res;
};

/**
 * @desc upload Object
 * Create a new instance with new upload(file, otherInfo)
 * To validate url generation for a file call validateUrl(row, linkedData) with row of data and the fk data
 * To calculate checksum call calculateChecksum(row, linkedData) with row of data and the fk data
 * To check for existing file call fileExists()
 * To create an upload call createUploadJob()
 * To start uploading, call start()
 * To complete upload job call completeUpload()
 * You can pause with pause()
 * Resume with resume()
 * Cancel with cancel()
 *
 * @memberof ERMrest
 * @class
 * @param {Object} file - A browser file object
 * @param {type} {otherInfo} - A set of options
 * 1. chunkSize - Default is 5MB
 * 2. column - {@link ERMrest.Column} object is mandatory
 * 3. reference - {@link ERMrest.Reference} object  is mandatory
 *
 * @returns {upload}
 */
export function Upload(file, otherInfo) {
  this.PART_SIZE = otherInfo.chunkSize || 5 * 1024 * 1024; //minimum part size defined by hatrac 5MB

  this.CHUNK_QUEUE_SIZE = otherInfo.chunkQueueSize || 4;

  this.file = file;
  if (!this.file) throw new Error('No file provided while creating hatrac file object');

  this.storedFilename = file.name; // the name that will be used for content-disposition and filename column
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
  if (ENV_IS_NODE) this.file.buffer = require('fs').readFileSync(file.path);

  this.column = otherInfo.column;
  if (!this.column) throw new Error('No column provided while creating hatrac file object');

  this.reference = otherInfo.reference;
  if (!this.reference) throw new Error('No reference provided while creating hatrac file object');

  this.SERVER_URI = this.reference._server.uri.replace('/ermrest', '');

  this.http = this.reference._server.http;

  this.isPaused = false;
  this.otherInfo = otherInfo;

  this.chunks = [];
  // array of true values for tracking which chunks are uploaded so far
  // used to determine what chunk to resume upload from if needed
  this.chunkTracker = [];
  this.startChunkIdx = 0;

  this.log = console.log;
}

/**
 * @desc Call this function with the ERMrestJS column object and the json object row To determine it is able to generate a url
 * If any properties in the template are found null without null handling then return false
 * @param {object} row - row object containing keyvalues of entity
 * @param {object} linkedData - object containing the linked data (outbound fk values)
 *
 * @returns {boolean}
 */
Upload.prototype.validateURL = function (row, linkedData) {
  if (this.column.urlPattern) {
    var template = this.column.urlPattern;

    var ignoredColumns = [];

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

    // TODO we can improve this (should not rely on _validateTemplate to format them)
    return _validateTemplate(template, row, linkedData, this.reference.table, this.reference._context, {
      ignoredColumns: ignoredColumns,
      templateEngine: this.column.templateEngine,
    });
  }

  return true;
};

/**
 * @desc Call this function to calculate checksum before uploading to server
 * @param {object} row - row object containing keyvalues of entity
 * @param {object} linkedData - object containing the linked data (outbound fk values)
 * @param {(uploaded: number) => void | undefined} onProgress - a callback function to be called for progress
 *
 * @returns {Promise} A promise resolved with a url where we will upload the file
 * or rejected with error if unable to calculate checkum
 * and notified with a progress handler, sending number in bytes done
 */
Upload.prototype.calculateChecksum = function (row, linkedData, onProgress) {
  this.erred = false;
  var deferred = ConfigService.q.defer();

  // If the hash is calculated then simply generate the url
  // and notify and reoslve the promise
  if (this.hash && (this.hash.md5_base64 || this.hash.sha256)) {
    this._generateURL(row, linkedData);
    if (onProgress) onProgress(this.file.size);
    deferred.resolve(this.url);
    return deferred.promise;
  } else {
    this.hash = new Checksum(this.file);
  }

  var self = this;
  this.hash.calculate(
    this.PART_SIZE,
    function (uploaded) {
      if (onProgress) onProgress(uploaded);
    },
    function () {
      self._generateURL(row, linkedData);
      deferred.resolve(self.url);
    },
    function (err) {
      deferred.reject(new Error((err && err.message ? err.message : 'Unable to calculate checksum for file') + ' ' + self.file.name));
    },
  );

  return deferred.promise;
};

/**
 * @desc Call this function to determine file exists on the server
 * If it doesn't then resolve the promise with url.
 * If it does then set isPaused, completed and jobDone to true
 * @param {string} jobUrl - if an existing job is being tracked locally and the checksum for current `upload`
 *     matches that matched job, return the stored previousJobUrl to be used if a 409 is returned
 *       - a 409 could mean the namespace already exists and we have an existing job for that namespace we know is partially uplaoded
 *       - if all the above is true, set the `upload.chunkUrl` to the jobUrl we were tracking locally
 * @returns {Promise}
 */
Upload.prototype.fileExists = function (previousJobUrl, contextHeaderParams) {
  var self = this;

  var deferred = ConfigService.q.defer();

  if (!contextHeaderParams || !isObject(contextHeaderParams)) {
    contextHeaderParams = {
      action: 'upload/file-exists',
      referrer: this.reference.defaultLogInfo,
    };
    contextHeaderParams.referrer.column = this.column.name;
  }

  var config = {
    headers: _generateContextHeader(contextHeaderParams),
  };

  this.http.head(this._getAbsoluteUrl(this.url), config).then(
    function (response) {
      var headers = HTTPService.getResponseHeader(response);
      var md5 = headers['content-md5'];
      var length = headers['content-length'];
      var contentDisposition = headers['content-disposition'];

      // If the file is not same, then simply resolve the promise without setting completed and jobDone
      if (md5 != self.hash.md5_base64 || length != self.file.size) {
        deferred.resolve(self.url);
        return;
      }

      // hatrac only supports `filename*=UTF-8''` in the content disposition so check for this string to get the filename
      var contentDispositionPrefix = "filename*=UTF-8''";
      var filenameIndex = contentDisposition.indexOf(contentDispositionPrefix) + contentDispositionPrefix.length;

      // check if filename in content disposition is different from filename being uploaded
      // if it is, create an update metadata request for updating the content-disposition
      if (contentDisposition.substring(filenameIndex, contentDisposition.length) != self.storedFilename.replace(FILENAME_REGEXP, '_')) {
        // Prepend the url with server uri if it is relative
        var url = self._getAbsoluteUrl(self.url + ';metadata/content-disposition');
        var data = "filename*=UTF-8''" + self.storedFilename.replace(FILENAME_REGEXP, '_');
        contextHeaderParams.action = 'upload/metadata/update';

        var config = {
          headers: _generateContextHeader(contextHeaderParams),
        };
        config.headers['content-type'] = 'text/plain';

        return self.http.put(url, data, config).then(
          function () {
            // mark as completed and job done since this is a metadata update request that doesn't transfer file data
            self.isPaused = false;
            self.completed = true;
            self.jobDone = true;

            deferred.resolve(self.url);
          },
          function (response) {
            var error = ErrorService.responseToError(response);
            deferred.reject(error);
          },
        );
      }

      self.isPaused = false;
      self.completed = true;
      self.jobDone = true;
      self.versionedUrl = HTTPService.getResponseHeader(response)['content-location'];
      deferred.resolve(self.url);
    },
    function (response) {
      // 403 - file exists but user can't read it -> create a new one
      // 404 - file doesn't exist -> create new one
      // 409 - The parent path does not denote a namespace OR the namespace already exists (from hatrac docs)
      if (response.status == 403 || response.status == 404) {
        deferred.resolve(self.url);
      } else if (response.status == 409) {
        // the namespace might exist with no content, maybe there is a partial upload
        // set the chunkUrl to the previousJobUrl that we stored in chaise with a partial upload
        // previousJobUrl = self.url + ';upload/' + job.hash
        if (previousJobUrl) self.chunkUrl = previousJobUrl;
        deferred.resolve(self.url);
      } else {
        deferred.reject(ErrorService.responseToError(response));
      }
    },
  );

  return deferred.promise;
};

/**
 * @desc Call this function to create an upload job for chunked uploading
 *
 * @returns {Promise} A promise resolved with a url where we will upload the file
 * or rejected with error if unable to calculate checkum
 */
Upload.prototype.createUploadJob = function (contextHeaderParams) {
  var self = this;
  this.erred = false;

  var deferred = ConfigService.q.defer();

  if (this.completed && this.jobDone) {
    deferred.resolve(this.chunkUrl);
    return deferred.promise;
  }

  // Check whether an existing upload job is available for current file
  this._getExistingJobStatus()
    .then(function (response) {
      // if upload job exists then use current chunk url
      // else create a new chunk url
      // if the md5 of the url is same as the once that we calculated then
      // resolve the promise with the true
      // else resolve it with false
      if (response && response.data['content-md5'] == self.hash.md5_base64) {
        deferred.resolve(self.chunkUrl);
      } else {
        self.chunkUrl = null;

        // Prepend the url with server uri if it is relative
        var url = self._getAbsoluteUrl(self.url + ';upload?parents=true');

        var data = {
          'chunk-length': self.PART_SIZE,
          'content-length': self.file.size,
          'content-type': self.file.type,
          'content-md5': self.hash.md5_base64,
          'content-disposition': "filename*=UTF-8''" + self.storedFilename.replace(FILENAME_REGEXP, '_'),
        };

        if (!contextHeaderParams || !isObject(contextHeaderParams)) {
          contextHeaderParams = {
            action: 'upload/create',
            referrer: self.reference.defaultLogInfo,
          };
          contextHeaderParams.referrer.column = self.column.name;
        }

        var config = {
          headers: _generateContextHeader(contextHeaderParams),
        };
        config.headers['content-type'] = 'application/json';

        return self.http.post(url, data, config);
      }
    })
    .then(
      function (response) {
        if (response) {
          self.chunkUrl = HTTPService.getResponseHeader(response).location;
          deferred.resolve(self.chunkUrl);
        }
      },
      function (response) {
        var error = ErrorService.responseToError(response);
        deferred.reject(error);
      },
    );

  return deferred.promise;
};

/**
 * @desc Call this function to start chunked upload to server. It reads the file and divides in into chunks
 * If the completed flag is true, then this means that all chunks were already uploaded, thus it will resolve the promize with url
 * else it will start uploading the chunks. If the job was paused then resume by uploading just those chunks which were not completed.
 *
 * @param {number} startChunkIdx - the index of the chunk to start uploading from in case of resuming a found incomplete upload job
 * @param {(size: number) => void | undefined} onProgress - a callback function to be called for progress
 * @returns {Promise} A promise resolved with a url where we uploaded the file
 * or rejected with error if unable to upload any chunk
 * and notified with a progress handler, sending number in bytes uploaded uptil now
 */
Upload.prototype.start = function (startChunkIdx, onProgress) {
  var self = this;

  this.erred = false;

  var deferred = ConfigService.q.defer();

  this.uploadPromise = deferred;
  this.uploadProgressCallback = onProgress;

  if (this.completed) {
    if (onProgress) onProgress(this.file.size);

    setTimeout(function () {
      deferred.resolve(self.url);
    }, 10);

    return deferred.promise;
  }

  // If isPaused is not true, or chunks length is 0 then create chunks and start uploading
  // else directly start uploading the chunks
  if (!this.isPaused || this.chunks.length === 0) {
    var start = 0;
    var index = 0;
    this.chunks = [];

    if (this.file.size === 0) {
      deferred.resolve(this.url);
      return deferred.promise;
    } else {
      while (start < this.file.size) {
        const end = Math.min(start + this.PART_SIZE, this.file.size);
        var chunk = new Chunk(index++, start, end);
        this.chunks.push(chunk);
        start = end;
      }

      this.startChunkIdx = startChunkIdx || 0;
      // intialize array to the same length as the number of chunks we have
      // this initializes every index to `Empty`
      this.chunkTracker = Array(this.chunks.length);
      // set index in array to true for each chunk we know is already uploaded
      for (var j = 0; j < startChunkIdx; j++) this.chunkTracker[j] = true;
    }
  }

  this.isPaused = false;
  this.chunkQueue = [];

  this.chunks.forEach(function (chunk, idx) {
    // check the startChunkIdx before uploading the chunk in the case we are resuming an upload job
    if (idx < startChunkIdx) return;

    chunk.retryCount = 0;
    self.chunkQueue.push(chunk);
  });

  for (var i = 0; i < this.CHUNK_QUEUE_SIZE; i++) {
    var nextChunk = self.chunkQueue.shift();
    if (nextChunk) self._uploadPart(nextChunk);
  }

  return deferred.promise;
};

/**
 *  @desc This function is used to complete the chunk upload by notifying hatrac about it returning a promise with final url
 *
 *  @returns {Promise} A promise resolved with a url where we uploaded the file
 *  or rejected with error if unable to complete the job
 */
Upload.prototype.completeUpload = function (contextHeaderParams) {
  var self = this;

  var deferred = ConfigService.q.defer();

  if (this.completed && this.jobDone) {
    deferred.resolve(this.versionedUrl ? this.versionedUrl : this.url);
    return deferred.promise;
  }

  if (!contextHeaderParams || !isObject(contextHeaderParams)) {
    contextHeaderParams = {
      action: 'upload/complete',
      referrer: this.reference.defaultLogInfo,
    };
    contextHeaderParams.referrer.column = this.column.name;
  }

  var config = {
    headers: _generateContextHeader(contextHeaderParams),
  };
  config.headers['content-type'] = 'application/json';

  // get's the versioned hatrac url
  this.http.post(this._getAbsoluteUrl(this.chunkUrl), {}, config).then(
    function (response) {
      self.jobDone = true;

      var loc = HTTPService.getResponseHeader(response).location;
      if (loc) {
        var versionedUrl = loc;
        self.versionedUrl = versionedUrl;
        deferred.resolve(versionedUrl);
      } else {
        deferred.reject(ErrorService.responseToError(response));
      }
    },
    function (response) {
      deferred.reject(HTTPService.responseToError(response));
    },
  );

  return deferred.promise;
};

/**
 * @desc Pause the upload
 * Remember, the current progressing part will fail,
 * that part will start from beginning (< 5MB of upload is wasted)
 */
Upload.prototype.pause = function () {
  if (this.completed || this.isPaused) return;

  this.isPaused = true;
  this.chunks.forEach(function (chunk) {
    chunk.xhr = null;
    if (!chunk.completed) chunk.progress = 0;
  });
  this._updateProgressBar();
};

/**
 * @desc Resumes the upload
 *
 */
Upload.prototype.resume = function () {
  if (!this.isPaused) return;

  this.erred = false;

  // code to handle reupload
  this.start();
};

/**
 * @desc Aborts/cancels the upload
 * @returns {Promise}
 */
Upload.prototype.cancel = function (deleteJob) {
  var deferred = ConfigService.q.defer();

  // If the upload has completed and complete job call has been made then
  // We directly resolve the promise setting progress as 0 and xhr as null for each chunk
  if (this.completed && this.jobDone) {
    // Iterate over each chunk to abort the HTTP call
    // Set the xhr to null, progress to 0 for all cases
    this.chunks.forEach(function (chunk) {
      chunk.xhr = null;
      chunk.progress = 0;
    });

    // To zero the update of a file progress bar
    this._updateProgressBar();

    deferred.resolve();

    return deferred.promise;
  }

  // Set isPaused, completed and jobDone to false
  this.isPaused = true;

  // Iterate over each chunk to abort the HTTP call
  // Abort only if the chunk is not completed and has an xhr in progress and set completed to false for chunk
  // Set the xhr to null, progress to 0 for all cases
  this.chunks.forEach(function (chunk) {
    chunk.progress = 0;
    chunk.abort();
    chunk.xhr = null;
  });

  if (deleteJob) this._cancelUploadJob();

  // To zero the update of a file progress bar
  this._updateProgressBar();

  return deferred.promise;
};

/**
 * @desc deletes the file metadata from the hatrac database and removes it from the namespace
 * @returns {Promise}
 */
Upload.prototype.deleteFile = function (contextHeaderParams) {
  var deferred = ConfigService.q.defer();

  if (!contextHeaderParams || !isObject(contextHeaderParams)) {
    contextHeaderParams = {
      action: 'upload/delete',
      referrer: this.reference.defaultLogInfo,
    };
    contextHeaderParams.referrer.column = this.column.name;
  }

  var config = {
    headers: _generateContextHeader(contextHeaderParams),
  };

  this.http.delete(this._getAbsoluteUrl(this.url), config).then(
    function () {
      deferred.resolve();
    },
    function (err) {
      deferred.reject(ErrorService.responseToError(err));
    },
  );

  return deferred.promise;
};

// Private function for upload Object

/**
 * @private
 * @desc This function converts a url to an absolute one, prepending it with SERVER_URI.
 * @param {string} uri - uri string
 * @returns {string} - the absolute url containing the FQDN
 */
Upload.prototype._getAbsoluteUrl = function (uri) {
  // A more universal, non case-sensitive, protocol-agnostic regex
  // to test a URL string is relative or absolute
  var r = new RegExp('^(?:[a-z]+:)?//', 'i');

  // The url is absolute so don't make any changes and return it as it is
  if (r.test(uri)) return uri;

  // If uri starts with "/" then simply prepend the server uri
  if (uri.indexOf('/') === 0) return this.SERVER_URI + uri;

  // else prepend the server uri with an additional "/"
  return this.SERVER_URI + '/' + uri;
};

/**
 * @private
 * @desc Call this function with the json row object to  generate an upload url
 * @param {object} row - row object containing keyvalues of entity
 * @param {object} linkedData - object containing the linked data (outbound fk values)
 *
 * @returns {string}
 */
Upload.prototype._generateURL = function (row, linkedData) {
  var template = this.column.urlPattern;

  // Populate all values in row depending on column from current
  if (this.column.filenameColumn) row[this.column.filenameColumn.name] = this.file.name;
  if (this.column.byteCountColumn) row[this.column.byteCountColumn.name] = this.file.size;
  if (this.column.md5 && typeof this.column.md5 === 'object') row[this.column.md5.name] = this.hash.md5_hex;
  if (this.column.sha256 && typeof this.column.sha256 === 'object') row[this.column.sha256.name] = this.hash.sha256;

  row[this.column.name].size = this.file.size;
  row[this.column.name].mimetype = this.file.type;
  row[this.column.name].md5_hex = this.hash.md5_hex;
  row[this.column.name].md5_base64 = this.hash.md5_base64;
  row[this.column.name].sha256 = this.hash.sha256;
  row[this.column.name].filename = this.file.name;
  var filename_ext = _getFilenameExtension(this.file.name, this.column.filenameExtFilter, this.column.filenameExtRegexp);
  row[this.column.name].filename_ext = filename_ext;
  // filename_basename is everything from the file name except the last ext
  // For example if we have a file named "file.tar.zip"
  //    => "file.tar" is the basename
  //    => ".zip" is the extension
  row[this.column.name].filename_basename = filename_ext ? this.file.name.substring(0, this.file.name.length - filename_ext.length) : this.file.name;

  // Generate url

  // TODO should use the tuple.templateVariables
  // the hatrac value in row is an object, which can be improved
  var keyValues = _getFormattedKeyValues(this.reference.table, this.reference._context, row, linkedData);

  var url = _renderTemplate(template, keyValues, this.reference.table.schema.catalog, {
    avoidValidation: true,
    templateEngine: this.column.templateEngine,
  });

  if (this.column.filenamePattern) {
    var filename = _renderTemplate(this.column.filenamePattern, keyValues, this.reference.table.schema.catalog, {
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
  if (_parseUrl(url).pathname.indexOf('/hatrac/') !== 0) {
    throw new MalformedURIError('The path for uploading a url should begin with /hatrac/ .');
  }

  // If new url has changed then there set all other flags to false to recompute them
  if (this.url !== url) {
    // To regenerate upload job url
    this.chunkUrl = false;

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
};

/**
 * @private
 * @desc This function fetches the upload job status if chunkurl is not null
 * @returns {Promise}
 */
Upload.prototype._getExistingJobStatus = function () {
  var deferred = ConfigService.q.defer();

  var contextHeaderParams = {
    action: 'upload/status',
    referrer: this.reference.defaultLogInfo,
  };
  contextHeaderParams.referrer.column = this.column.name;

  var config = {
    headers: _generateContextHeader(contextHeaderParams),
  };
  // If chunkUrl is not null then fetch the status of the uploadJob
  // and resolve promise with it.
  // else resolve it without any response
  if (this.chunkUrl) {
    this.http.get(this._getAbsoluteUrl(this.chunkUrl), config).then(
      function (response) {
        deferred.resolve(response);
      },
      function (response) {
        deferred.reject(response);
      },
    );
  } else {
    deferred.resolve();
  }

  return deferred.promise;
};

/**
 * @private
 * @desc This function is called by start methid to start uploading the chunk to server.
 * If the chunk is not completed and has an xhr then set its progress to 0 and xhr to null
 * @param {Chunk} chunk - chunk object
 */
Upload.prototype._uploadPart = function (chunk) {
  var self = this;
  if (chunk.xhr && !chunk.completed) {
    chunk.xhr.resolve();
    chunk.xhr = null;
    chunk.progress = 0;
  }

  chunk.sendToHatrac(this).then(function () {
    var nextChunk = self.chunkQueue.shift();

    if (nextChunk) self._uploadPart(nextChunk);
  });
};

/**
 * @private
 * @desc This function should be called to update the progress of upload
 * It calls the onProgressChanged callback that the user subscribes
 * In addition if the upload has been completed then it will call onuploadCompleted for regular upload
 * and completeupload to complete the chunk upload
 */
Upload.prototype._updateProgressBar = function () {
  var length = this.chunks.length;
  // progressDone and chunksComplete should be intiialized if we had an existing upload job
  var progressDone = this.startChunkIdx * this.PART_SIZE;
  var chunksComplete = this.startChunkIdx;
  for (var i = 0; i < length; i++) {
    progressDone = progressDone + this.chunks[i].progress;
    if (this.chunks[i].completed) chunksComplete++;
  }

  if (this.uploadProgressCallback) this.uploadProgressCallback(this.completed ? this.file.size : progressDone, this.file.size);

  if (chunksComplete === length && !this.completed) {
    this.completed = true;
    if (this.uploadPromise) this.uploadPromise.resolve(this.url);
  }
};

/**
 * @private
 * @desc Code to cancel upload job
 * We resolve the promise successfully even though the delete fails
 * because it won't affect the upload
 * Setting chunkUrl null marks that when we reupload this file, we should create a new job
 *
 * @returns {Promise}
 */
Upload.prototype._cancelUploadJob = function () {
  var deferred = ConfigService.q.defer();

  var contextHeaderParams = {
    action: 'upload/cancel',
    referrer: this.reference.defaultLogInfo,
  };
  contextHeaderParams.referrer.column = this.column.name;

  var config = {
    headers: _generateContextHeader(contextHeaderParams),
  };

  if (this.chunkUrl) {
    this.http.delete(this._getAbsoluteUrl(this.chunkUrl), config).then(
      function () {
        deferred.resolve();
      },
      function () {
        deferred.resolve();
      },
    );
  } else {
    deferred.resolve();
  }

  return deferred.promise;
};

/**
 * @private
 * @desc This function will be called by chunk upload hanlder with the actual response
 * @param {object} response - network error response
 */
Upload.prototype._onUploadError = function (response) {
  if (this.erred) return;
  this.erred = true;
  this.uploadPromise.reject(ErrorService.responseToError(response));
};

/**
 * @desc chunk Object
 * Create a new instance with new Chunk(index, start, end)
 * This class contains one of the chunks of the {Ermrest.upload} instance.
 * It will upload the chunk and call _updateProgressBar
 *
 * @class
 * @param {number} index - Index of the chunk
 * @param {number} start - Start index of the chunk in file
 * @param {number} end - End index of the chunk in file
 *
 * @returns {Chunk}
 */
var Chunk = function (index, start, end) {
  this.index = index;
  this.start = start;
  this.end = end;
  this.completed = false;
  this.xhr = null;
  this.progress = 0;
  this.size = end - start;
  this.retryCount = 0;
};

/**
 * @desc This function will upload a chunk of file to the url and call _updateProgressBar
 * @param {upload} {upload} - An instance of the upload to which this chunk belongs
 */
Chunk.prototype.sendToHatrac = function (upload) {
  var deferred = ConfigService.q.defer();

  if (this.xhr || this.completed) {
    this.progress = this.size;

    deferred.resolve();

    upload._updateProgressBar();

    return deferred.promise;
  }

  var self = this;

  // blob is the sliced version of the file from start and end index
  var blob;
  if (ENV_IS_NODE) {
    // eslint-disable-next-line no-undef
    blob = Buffer.prototype.slice.call(upload.file.buffer, this.start, this.end);
  } else {
    blob = upload.file.slice(this.start, this.end);
  }

  this.progress = 0;

  // set content-type to "application/octet-stream"
  var contextHeaderParams = {
    action: 'upload/chunk',
    referrer: upload.reference.defaultLogInfo,
  };
  contextHeaderParams.referrer.column = upload.column.name;

  var headers = _generateContextHeader(contextHeaderParams);
  headers['content-type'] = 'application/octet-stream';

  self.xhr = ConfigService.q.defer();

  var request = {
    // If index is -1 then upload it to the url or upload it to chunkUrl
    url: upload._getAbsoluteUrl(upload.chunkUrl) + '/' + this.index,
    method: 'PUT',
    config: {
      headers: headers,
      uploadEventHandlers: {
        progress: function (e) {
          // To track progress on upload
          if (e.lengthComputable) {
            self.progress = e.loaded;
            upload._updateProgressBar();
          }
        },
      },
      // the following is only doable in angularjs and not axios
      // timeout : self.xhr.promise,
      // the following is not an available config and doesn't affect anything
      // cancel : self.xhr
    },
    data: blob,
  };

  // Send the request
  // If upload is aborted using .abort() for pause or cancel scenario
  // then error callback will be called for which the status code would be 0
  // else it would be in range of 400 and 500
  upload.http.put(request.url, request.data, request.config).then(
    function () {
      // Set progress to blob size, and set chunk completed
      self.progress = self.size;
      self.completed = true;
      self.xhr = null;

      deferred.resolve();

      // this chunk was successfully uploaded, update the chunkTracker
      upload.chunkTracker[self.index] = true;
      upload._updateProgressBar();
    },
    function (response) {
      self.progress = 0;

      // If upload is not paused
      // and the status code is in range of 500 then there is a server error, keep retrying for 5 times
      // else the error is in 400 series which is some client error
      if (!upload.isPaused) {
        upload._updateProgressBar();
        upload._onUploadError(response);
      } else {
        upload._updateProgressBar();
      }
    },
  );

  return deferred.promise;
};

/**
 * @desc This function will abort a chunk of file to the url and call _updateProgressBar
 * @param {upload} {upload} - An instance of the upload to which this chunk belongs
 */
Chunk.prototype.abort = function () {
  if (this.xhr && typeof this.xhr.resolve == 'function') this.xhr.resolve();
};
