/*
 * Copyright 2016 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var isNode =  false;

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    isNode = true;
}

var ERMrest = (function(module) {

    var blobSlice, SparkMD5;
    // Check for whether the environment is Node.js or Browser
    if (isNode) {
        SparkMD5 = require('spark-md5');
        blobSlice =  Buffer.prototype.slice;
    } else {
        SparkMD5 = window.SparkMD5;
        blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    }

    if (typeof window != 'object') window = {};

    if (!window.atob) {
        var tableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var table = tableStr.split("");

        window.atob = function (base64) {
            if (/(=[^=]+|={3,})$/.test(base64)) throw new Error("String contains an invalid character");
            base64 = base64.replace(/=/g, "");
            var n = base64.length & 3;
            if (n === 1) throw new Error("String contains an invalid character");
            for (var i = 0, j = 0, len = base64.length / 4, bin = []; i < len; ++i) {
                var a = tableStr.indexOf(base64[j++] || "A"), b = tableStr.indexOf(base64[j++] || "A");
                var c = tableStr.indexOf(base64[j++] || "A"), d = tableStr.indexOf(base64[j++] || "A");
                if ((a | b | c | d) < 0) throw new Error("String contains an invalid character");
                bin[bin.length] = ((a << 2) | (b >> 4)) & 255;
                bin[bin.length] = ((b << 4) | (c >> 2)) & 255;
                bin[bin.length] = ((c << 6) | d) & 255;
            }
            return String.fromCharCode.apply(null, bin).substr(0, bin.length + n - 4);
        };

        window.btoa = function (bin) {
            for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
                var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
                if ((a | b | c) > 255) throw new Error("String contains an invalid character");
                base64[base64.length] = table[a >> 2] + table[((a << 4) & 63) | (b >> 4)] +
                                      (isNaN(b) ? "=" : table[((b << 2) & 63) | (c >> 6)]) +
                                      (isNaN(b + c) ? "=" : table[c & 63]);
            }
            return base64.join("");
        };

    }

    var checkHex = function(n) {
        return/^[0-9A-Fa-f]{1,64}$/.test(n);
    };

    var Hex2Bin = function(n) { 
        if (!checkHex(n)) return 0;
        return parseInt(n,16).toString(2); 
    };

    var hexToBase64 = function (str) {
      return window.btoa(String.fromCharCode.apply(null,
        str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
      );
    };

    /**
     * @memberof ERMrest
     * @param {Object} {file} - A browser file object
     * @param {Object} {options} - An optional parameters object. The (key, value)
     * @constructor
     */
    var Checksum = function(file, options) {
        this.file = file;
        this.options = options || {};
    };

    /**
     * @param {number} chunkSize size of the chunks, in which the file is supposed to be broken
     * @callback onProgress
     * @param {onProgress} fn callback function to be called for progress
     * @callback onSuccess
     * @param {onSuccess} fn callback function to be called for success
     * @callback onError
     * @param {onError} fn callback function to be called for error
     * @returns {Promise} if the schema exists or not
     * @desc Calculates  MD5 checksum for a file using spark-md5 library
     */ 
    Checksum.prototype.calculate = function(chunkSize, onProgress, onSuccess, onError) {

        var self = this, file = this.file;
        if (!onProgress || (typeof onProgress != 'function')) onProgress = function() {};
        if (!onSuccess || (typeof onSuccess != 'function')) onSuccess = function() {};
        if (!onError || (typeof onError != 'function')) onError = function() {};


        // If checksum is already calculated then don't calculate it again
        if (this.md5_hex) {
            onProgress(this.file.size);
            onSuccess(this);
            return;
        }

        var chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer();

        // THis function is called by fileReader on successful chunk read
        // It keeps adding the chunk to the digest
        // Once all chunks are done, it calculates the final md5 and converts it in hex format calling onSuccess
        var onLoad = function(e) {
            //console.log("\nRead chunk number " + parseInt(currentChunk + 1) + " of " + chunks);
            
            spark.append(e.target.result); // append array buffer
            
            currentChunk++;
            
            var completed = chunkSize * currentChunk;

            onProgress(completed > file.size ? file.size: completed, file.size);

            if (currentChunk < chunks)
                loadNext();
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
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

            if (isNode) {
                setTimeout(function() {
                    onLoad({ target: {result : blobSlice.call(self.file.buffer, start, end) } });
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

    module.Checksum = Checksum;

    return module; 

})(ERMrest || {});

var ERMrest = (function(module) {

    var allowedHttpErrors = [500, 503, 408, 401];

    /**
     * @desc upload Object
     * Create a new instance with new upload(file, otherInfo)
     * To validate url generation for a file call validateUrl(row) with row of data
     * To calculate checksum call calculateChecksum(row) with row of data
     * To create an upload call createUploadJob()
     * To check for existing file call fileExists()
     * To start uploading, call start()
     * To complete upload job call completeUploadJob()
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
    var upload = function (file, otherInfo) {
        
        this.PART_SIZE = otherInfo.chunkSize || 5 * 1024 * 1024; //minimum part size defined by hatrac 5MB
        
        this.CHUNK_QUEUE_SIZE = otherInfo.chunkQueueSize || 10;

        this.file = file;
        
        if (isNode) this.file.buffer = require('fs').readFileSync(file.path);
        
        this.column = otherInfo.column;
        if (!this.column) throw new Error("No column provided while creating hatrac file object");

        this.reference = otherInfo.reference;
        if (!this.reference) throw new Error("No reference provided while creating hatrac file object");

        this.SERVER_URI = this.reference._server.uri.replace("/ermrest", "");

        this.http = this.reference._server._http;
        
        this.isPaused = false;
        this.otherInfo = otherInfo;
        
        this.uploadedSize = 0;
        this.uploadingSize = 0;

        this.chunks = [];

        this.log = console.log;

    };

    /**
     * @private
     * @desc This function converts a url to an absolute one, prepending it with SERVER_URI.
     * @param {string} uri - uri string
     * @returns {string}
     */
    upload.prototype.getAbsoluteUrl = function(uri) {
        // A more universal, non case-sensitive, protocol-agnostic regex
        // to test a URL string is relative or absolute 
        var r = new RegExp('^(?:[a-z]+:)?//', 'i');

        // The url is absolute so don't make any changes and return it as it is
        if (r.test(uri))  return uri;
        
        // If uri starts with "/" then simply prepend the server uri
        if (uri.indexOf("/") === 0)  return this.SERVER_URI + uri; 
        
        // else prepend the server uri with an additional "/"
        return this.SERVER_URI + "/" + uri; 
    };

    /* 
     * @desc Call this function with the ermrestjs column object and the json object row To determine it is able to generate a url
     * If any properties in the template are found null without null handling then return false
     * @param {object} row - row object containing keyvalues of entity
     *
     * @returns {boolean}
     */
    upload.prototype.validateURL = function(row) {

        if (this.column.urlPattern) {
            
            var template = this.column.urlPattern;

            var ignoredColumns = [];

            // Add file properties depending on column to ignore_columns
            if (this.column.filenameColumn) ignoredColumns.push(this.column.filenameColumn.name);
            if (this.column.byteCountColumn) ignoredColumns.push(this.column.byteCountColumn.name);
            if (this.column.md5 && typeof this.column.md5 === "object") ignoredColumns.push(this.column.md5.name);
            if (this.column.sha256 && typeof this.column.sha256 === "object") ignoredColumns.push(this.column.sha256.name); 
            
            // since we are going to format the values, ignoredColumns will be available
            // in formmatted and unformatted forms. Following makes sure that we have
            // added these two to the ignoredColumns
            for(var i = 0; i < ignoredColumns.length; i++) {
                
            }
            
            ignoredColumns.push(this.column.name + ".md5_hex");
            ignoredColumns.push(this.column.name + ".md5_base64");
            ignoredColumns.push(this.column.name + ".filename");
            ignoredColumns.push(this.column.name + ".size");
            
            return module._validateTemplate(template, row, this.reference.table, this.reference._context, {ignoredColumns: ignoredColumns});
        }

        return true;
    };

    /* 
     * @Private
     * @desc Call this function with the json row object to  generate an upload url
     * @param {object} row - row object containing keyvalues of entity
     *
     * @returns {string}
     */
    upload.prototype.generateURL = function(row) {
        
        var template = this.column.urlPattern;
        
        // Populate all values in row depending on column from current
        if (this.column.filenameColumn) row[this.column.filenameColumn.name] = this.file.name;
        if (this.column.byteCountColumn) row[this.column.byteCountColumn.name] = this.file.size;
        if (this.column.md5 && typeof this.column.md5 === 'object') row[this.column.md5.name] = this.hash.md5_hex;
        if (this.column.sha256 && typeof this.column.sha256 === 'object') row[this.column.sha256.name] = this.hash.sha256;

        row[this.column.name].filename = this.file.name;
        row[this.column.name].size = this.file.size;
        row[this.column.name].md5_hex = this.hash.md5_hex;
        row[this.column.name].md5_base64 = this.hash.md5_base64;
        row[this.column.name].sha256 = this.hash.sha256;

        // Generate url
        var url = module._renderTemplate(template, row, this.reference.table, this.reference._context, { avoidValidation: true });

        // If the template is null then throw an error
        if (url === null)  throw new module.MalformedURIError("Some column values are null in the template " + template);
        
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

        return this.url;
    };


    /* 
     *
     * @desc Call this function to calculate checksum before uploading to server
     * @param {object} row - row object containing keyvalues of entity
     *
     * @returns {Promise} A promise resolved with a url where we will upload the file
     * or rejected with error if unable to calculate checkum
     * and notified with a progress handler, sending number in bytes done
     */
    upload.prototype.calculateChecksum = function(row) {
        this.erred = false;
        var deferred = module._q.defer();

        // If the hash is calculated then simply generate the url
        // and notify and reoslve the promise
        if (this.hash && (this.hash.md5_base64 || this.hash.sha256)) {
            this.generateURL(row);
            deferred.notify(this.file.size);
            deferred.resolve(this.url);
            return deferred.promise;
        } else {
            this.hash = new module.Checksum(this.file);
        }


        var self = this;
        this.hash.calculate(this.PART_SIZE, function(uploaded, fileSize) {
            deferred.notify(uploaded);
        }, function() {
            self.generateURL(row);
            deferred.resolve(self.url);
        }, function(err) {
            deferred.reject(new Error(((err && err.message) ? 
                                        err.message : 
                                        "Unable to calculate checksum for file") + " " + self.file.name));
        });

        return deferred.promise;
    };


    /* 
     *
     * @desc Call this function to create an upload job for chunked uploading
     *
     * @returns {Promise} A promise resolved with a url where we will upload the file
     * or rejected with error if unable to calculate checkum
     */
    upload.prototype.createUploadJob = function() {
        var self = this;
        this.erred = false;
        
        var deferred = module._q.defer();


        // Check whether an existing upload job is available for current file
        this.getExistingJobStatus().then(function(response) {

            // if upload job exists then use current chunk url
            // else create a new chunk url
            // if the md5 of the url is same as the once that we calculated then
            // resolve the promise with the true
            // else resolve it with false
            if (response && response.data["content-md5"] == self.hash.md5_base64) {
                deferred.resolve(self.chunkUrl);
            }  else {

                self.chunkUrl = null;

                // Prepend the url with server uri if it is relative
                var url =  self.getAbsoluteUrl(self.url + ";upload?parents=true");
                
                var data = {
                    "chunk-length" : self.PART_SIZE,
                    "content-length": self.file.size,
                    "content-type": self.file.type,
                    "content-md5": self.hash.md5_base64,
                    "content-disposition": "filename*=UTF-8''" + self.file.name.replace(/[^a-zA-Z0-9_.-]/ig, '_')
                };
               
                var config = {
                    headers: { 'content-type' : 'application/json' }
                };

                return self.http.post(url, data, config);
            }

        }).then(function(response) {
            if (response) {
                self.chunkUrl = response.headers('location'); 
                deferred.resolve(self.chunkUrl);
            }
        }, function(response) {
            var error = module._responseToError(response);
            deferred.reject(error);
        });

        return deferred.promise;
    };


    /*
     * @Private
     * @desc This function fetches the upload job status if chunkurl is not null
     * @returns {Promise}
     */
    upload.prototype.getExistingJobStatus = function() {

        var deferred = module._q.defer();


        // If chunkUrl is not null then fetch  the status of the uploadJob
        // and resolve promise with it.
        // else just resolved it without any response
        if (this.chunkUrl) {
            this.http.get(this.getAbsoluteUrl(this.chunkUrl)).then(function(response) {
                deferred.resolve(response);
            }, function(response) {
                deferred.reject(response);
            });
        } else {
            deferred.resolve();
        }


        return deferred.promise;
    };


    /**
     * @desc Call this function to determine file exists on the server
     * If it doesn't then resolve the promise with url.
     * If it does then set isPaused, completed and jobDone to true
     * @returns {Promise}
     */
    upload.prototype.fileExists = function() {
        var self = this;
        
        var deferred = module._q.defer();

        this.http.head(this.getAbsoluteUrl(this.url)).then(function(response) {
        
            var headers = response.headers();
            var md5 = headers["content-md5"];
            var length = headers["content-length"];
            var filename = headers["content-disposition"].replace("filename*=UTF-8''","");

            // If the md5, length of filename are not same then simply resolve the promise without setting completed and jobDone
            if ((md5 != self.hash.md5_base64) || (length != self.file.size) || (filename != self.file.name)) {
                deferred.resolve(self.url);  
                return;
            }

            self.isPaused = false;
            self.completed = true;
            self.jobDone = true;
            deferred.resolve(self.url);
        }, function(response) {

            if (response.status == 404 || response.status == 409) {
              deferred.resolve(self.url);  
            } else {
              deferred.reject(module._responseToError(response));
            }
        });

        return deferred.promise;
    };
    
    /** 
     * @desc Call this function to start chunked upload to server. It reads the file and divides in into chunks
     * If the completed flag is true, then this means that all chunks were already uploaded, thus it will resolve the promize with url
     * else it will start uploading the chunks. If the job was paused then resume by uploading just those chunks which were not completed.
     *
     * @returns {Promise} A promise resolved with a url where we uploaded the file
     * or rejected with error if unable to upload any chunk
     * and notified with a progress handler, sending number in bytes uploaded uptil now
     */
    upload.prototype.start = function() {
        var self = this;

        this.erred = false;

        var deferred = module._q.defer();

        this.uploadPromise = deferred;

        if (this.completed) {

            deferred.notify(this.file.size);

            setTimeout(function() {
                deferred.resolve(self.url);
            }, 10);
            
            return deferred.promise;
        }

        // If isPaused is not true, or chunks length is 0 then create chunks and start uploading
        // else directly start uploading the chunks
        if (!this.isPaused || this.chunks.length === 0) {
            var start = 0;
            var blob;
            var index = 0;
            this.chunks = [];
            while (start < this.file.size) {
                end = Math.min(start + this.PART_SIZE, this.file.size);
                var chunk = new Chunk(index++, start, end);
                self.chunks.push(chunk);
                start = end;          
            }
        }
 
        this.isPaused = false;
        var part = 0;

        this.chunkQueue = [];

        this.chunks.forEach(function(chunk) {
            chunk.retryCount = 0;
            self.chunkQueue.push(chunk);
            part++;
        });

        for (var i = 0; i < this.CHUNK_QUEUE_SIZE; i++) {
            var nextChunk = self.chunkQueue.shift();
            if (nextChunk) self.uploadPart(nextChunk);
        }
        
        return deferred.promise;
    };

    /*
     * @private
     * @desc This function is called by start methid to start uploading the chunk to server. 
     * If the chunk is not completed and has an xhr then set its progress to 0 and xhr to null
     * @param {Chunk} chunk - chunk object
     */
    upload.prototype.uploadPart = function(chunk) {

        var self = this;
        if (chunk.xhr && !chunk.completed) {
            chunk.xhr.resolve();
            chunk.xhr = null;
            chunk.progress = 0;
        }

        chunk.sendToHatrac(this).then(function() {
            var nextChunk = self.chunkQueue.shift();

            if (nextChunk) self.uploadPart(nextChunk);
        });
    };


    /*  
     *  @desc This function is used to complete the chunk upload by notifying hatrac about it returning a promise with final url
     *
     *  @returns {Promise} A promise resolved with a url where we uploaded the file
     *  or rejected with error if unable to complete the job
     */
    upload.prototype.completeUpload = function() {
        var self = this;
        
        var deferred = module._q.defer();

        if (this.completed && this.jobDone) {
            deferred.resolve(this.url);
            return deferred.promise;
        }

        this.http.post(this.getAbsoluteUrl(this.chunkUrl)).then(function(response) {
            self.jobDone = true;

            if (response.headers('location')) {
                deferred.resolve(response.headers('location'));
            } else {
                deferred.reject(module._responseToError(response));
            }
            
        }, function(response) {
            deferred.reject(module._responseToError(response));
        });

        return deferred.promise;
    };

    /** 
     * @private 
     * @desc This function should be called to update the progress of upload
     * It calls the onProgressChanged callback that the user subscribes
     * In addition if the upload has been combleted then it will call onUploadCompleted for regular upload
     * and completeUpload to complete the chunk upload
     */
    upload.prototype.updateProgressBar = function(xhr) {
        var length = this.chunks.length;
        var done = 0;
        for (var i = 0; i < this.chunks.length; i++) {
            done = done + this.chunks[i].progress;
        }

        if (this.uploadPromise) this.uploadPromise.notify(this.completed ? this.file.size : done, this.file.size);

        if (done >= this.file.size && !this.completed && (!xhr || (xhr && (xhr.status >= 200 && xhr.status < 300)))) {
            this.completed = true;
            if (this.uploadPromise) this.uploadPromise.resolve(this.url);
        }
    };


    /**
     * @desc Pause the upload
     * Remember, the current progressing part will fail,
     * that part will start from beginning (< 5MB of upload is wasted)
     */
    upload.prototype.pause = function() {

        if (this.completed || this.isPaused) return;

        this.isPaused = true;
        this.chunks.forEach(function(chunk) {
            chunk.xhr = null;
            if (!chunk.completed) chunk.progress = 0;
        });
        this.updateProgressBar();
    };

    /**
     * @desc Resumes the upload
     *
     */
    upload.prototype.resume = function() {
        if (!this.isPaused) return;

        this.erred = false;

        // code to handle reupload
        this.start();
    };

    /**
     * @desc Aborts/cancels the upload
     * @returns {Promise} 
     */
    upload.prototype.cancel = function(deleteJob) {

        var deferred = module._q.defer();

        // If the upload has completed and complete job call has been made then
        // We directly resolve the promise setting progress as 0 and xhr as null for each chunk
        if (this.completed && this.jobDone) {
            // Iterate over each chunk to abort the HTTP call
            // Set the xhr to null, progress to 0 for all cases
            this.chunks.forEach(function(chunk) {
                chunk.xhr = null;
                chunk.progress = 0;
            });

            // To zero the update of a file progress bar
            this.updateProgressBar();
            
            deferred.resolve();
            
            return deferred.promise;
        } 

        // Set isPaused, completed and jobDone to false
        var self = this;

        this.isPaused = true;

        // Iterate over each chunk to abort the HTTP call
        // Abort only if the chunk is not completed and has an xhr in progress and set completed to false for chunk
        // Set the xhr to null, progress to 0 for all cases
        this.chunks.forEach(function(chunk) {
            chunk.progress = 0;
            chunk.abort();
            chunk.xhr = null;
        });

        if (deleteJob) this.cancelUploadJob();

        // To zero the update of a file progress bar
        this.updateProgressBar();

        return deferred.promise;
    };

    /* @private
     * @desc Code to cancel upload job
     * We resolve the promise successfully even though the delete fails
     * because it won't affect the upload
     * Setting chunkUrl null marks that when we reupload this file, we should create a new job
     *
     * @returns {Promise} 
     */
    upload.prototype.cancelUploadJob = function(url) {

        var deferred = module._q.defer();

        if (this.chunkUrl) {
            this.http.delete(this.getAbsoluteUrl(this.chunkUrl)).then(function() {
                deferred.resolve();
            }, function(err) {
                deferred.resolve();
            });
        } else  {
            deferred.resolve();
        }

        return deferred.promise;
    };

    /* @private
     * @desc This function will be called by chunk upload hanlder with the actual response
     * @param {object} response - network error response
     */
    upload.prototype.onUploadError = function(response) {
        if (this.erred) return;
        this.erred = true;
        this.uploadPromise.reject(module._responseToError(response));
    };

    module.Upload = upload;


    /**
     * @desc chunk Object
     * Create a new instance with new Chunk(index, start, end)
     * This class contains one of the chunks of the {Ermrest.upload} instance.
     * It will upload the chunk and call updateProgressBar
     * 
     * @class
     * @param {number} index - Index of the chunk
     * @param {number} start - Start index of the chunk in file
     * @param {number} end - End index of the chunk in file
     *
     * @returns {Chunk}
     */
    var Chunk = function(index, start, end) {
        this.index = index;
        this.start = start;
        this.end = end;
        this.completed = false;
        this.xhr = null;
        this.progress = 0;
        this.size = end-start;
        this.retryCount = 0;
    };    

    /**  
     * @desc This function will upload a chunk of file to the url and call updateProgressBar
     * @param {upload} {upload} - An instance of the upload to which this chunk belongs
     */
    Chunk.prototype.sendToHatrac = function(upload) {

        var deferred = module._q.defer();

        if (this.xhr || this.completed) {
            
            this.progress = this.size;
            
            deferred.resolve();

            upload.updateProgressBar();

            return deferred.promise;
        }

        var self = this;
        
        // blob is the sliced version of the file from start and end index
        var blob;
        if (isNode) {
            blob = Buffer.prototype.slice.call(upload.file.buffer, this.start, this.end);
        } else {
            blob = upload.file.slice(this.start, this.end);
        }

        var size = blob.size;
        this.progress = 0;
       
        var headers = {};

        // set content-type to "application/octet-stream"
        
        headers["content-type"] = "application/octet-stream";

        self.xhr  = module._q.defer();
    
        var request = {
            // If index is -1 then upload it to the url or upload it to chunkUrl
            url: upload.getAbsoluteUrl(upload.chunkUrl) + "/" + this.index,
            method: "PUT",                      
            config: { 
                headers: headers,
                uploadEventHandlers: {
                    progress: function(e) {
                        // To track progress on upload
                        if (e.lengthComputable) {
                            self.progress = e.loaded;
                            upload.updateProgressBar(self.xhr);
                        }
                    }
                },
                timeout : self.xhr.promise, 
                cancel : self.xhr
            },
            data: blob
        };

        // Send the request
        // If upload is aborted using .abort() for pause or cancel scenario
        // then error callback will be called for which the status code would be 0
        // else it would be in range of 400 and 500
        upload.http.put(request.url, request.data, request.config).then(function() {
            
            // Set progress to blob size, and set chunk completed
            self.progress = self.size;
            self.completed = true;
            self.xhr = null;
            
            deferred.resolve();

            upload.updateProgressBar();
        }, function(response) {
            self.progress = 0;
            var status = response.status;

            // If upload is not paused 
            // and the status code is in range of 500 then there is a server error, keep retrying for 5 times
            // else the error is in 400 series which is some client error
            if (!upload.isPaused) {
                upload.updateProgressBar(self.xhr);
                upload.onUploadError(response);
            } else {
                upload.updateProgressBar(self.xhr);
            }
        });

        return deferred.promise;
       
    };


    /**  
     * @desc This function will abort a chunk of file to the url and call updateProgressBar
     * @param {upload} {upload} - An instance of the upload to which this chunk belongs
     */
    Chunk.prototype.abort = function(upload) {
        if (this.xhr && (typeof this.xhr.resolve == 'function')) this.xhr.resolve();
    };


   return module; 
   
}(ERMrest || {}));
