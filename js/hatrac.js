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

    var Checksum = function(file, options) {
        this.file = file;
        this.options = options || {};
    };

    Checksum.prototype.calculate = function(chunkSize, onProgress, onSuccess, onError) {

        var self = this, file = this.file;
        if (!onProgress || (typeof onProgress != 'function')) onProgress = function() {};
        if (!onSuccess || (typeof onSuccess != 'function')) onSuccess = function() {};
        if (!onError || (typeof onError != 'function')) onError = function() {};


        // If checksum is already calculated then don't calculate it again
        if (this.checksum) {
            onProgress(this.file.size, this.file.size);
            onSuccess(this.checksum, this);
            return;
        }

        var chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer();

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
                onSuccess(self.checksum, self);
            }
        };
        
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
    /**
     * HatracMultiUpload Object
     * Create a new instance with new HatracMultiUpload(file, otherInfo)
     * To start uploading, call start()
     * You can pause with pause()
     * Resume with resume()
     * Cancel with cancel()
     *
     * You can override the following functions (no event emitter :( , description below on the function definition, at the end of the file)
     * onServerError = function(command, jqXHR, textStatus, errorThrown) {}
     * onUploadError = function(xhr) {}
     * onProgressChanged = function(uploadingSize, uploadedSize, totalSize) {}
     * onUploadCompleted = function() {}
     *
     * @param {type} file
     * @param {type} otherInfo
     * @returns {MultiUpload}
     */

    var upload = function (file, otherInfo) {
        
        this.PART_SIZE = otherInfo.chunkSize || 5 * 1024 * 1024; //minimum part size defined by hatrac 5MB
        
        this.file = file;
        
        if (isNode) this.file.buffer = require('fs').readFileSync(file.path);
        
        this.column = otherInfo.column;
        if (!this.column) throw new Error("No column provided while creating hatrac file object");

        this.reference = otherInfo.reference;
        if (!this.reference) throw new Error("No reference provided while creating hatrac file object");

        this.SERVER_URI = this.reference._server.uri.replace("/ermrest", "");

        this.http = this.reference._server._http;

        this.fileInfo = {
            name: this.file.name,
            type: this.file.type,
            size: this.file.size,
            lastModifiedDate: this.file.lastModifiedDate
        };
        
        this.isPaused = false;
        this.otherInfo = otherInfo;
        
        this.uploadedSize = 0;
        this.uploadingSize = 0;

        this.chunks = [];

        this.log = console.log;

    };

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
      Call this function with the ermrestjs column object and the json object row
      To determine it is able to generate a url
      If any properties in the template are found null without null handling then return false
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

            ignoredColumns.push("md5_checksum");
            ignoredColumns.push("md5_base64");
            ignoredColumns.push("filename");
            ignoredColumns.push("size");
            ignoredColumns.push(this.column.name + ".md5_hex");
            ignoredColumns.push(this.column.name + ".md5_base64");
            ignoredColumns.push(this.column.name + ".filename");
            ignoredColumns.push(this.column.name + ".size");

            var conditionalRegex = /\{\{(#|\^)([\w\d-_. ]+)\}\}/;

            // If no conditional Mustache statements of the form {{#var}}{{/var}} or {{^var}}{{/var}} not found then do direct null check
            if (!conditionalRegex.exec(template)) {

                // Grab all placeholders ({{PROP_NAME}}) in the template
                var placeholders = template.match(/\{\{([\w\d-_. ]+)\}\}/ig);

                // If there are any placeholders
                if (placeholders && placeholders.length) {

                    // Get unique placeholders
                    placeholders = placeholders.filter(function(item, i, ar) { return ar.indexOf(item) === i; });

                    /*
                     * Iterate over all placeholders to set pattern as null if any of the
                     * values turn out to be null or undefined
                     */
                    for (var i=0; i<placeholders.length;i++) {

                        // Grab actual key from the placeholder {{name}} = name, remove "{{" and "}}" from the string for key
                        var key = placeholders[i].substring(2, placeholders[i].length - 2);

                        if (key[0] == "{") key = key.substring(1, key.length -1);

                        // If key is not in ingored columns value for the key is null or undefined then return null
                        if ((ignoredColumns.indexOf(key) == -1) && (row[key] === null || row[key] === undefined)) {
                           return false;
                        }
                    }
                }
            }
        }

        return true;
    };

    /* 
       Private
       Call this function with the ermrestjs column object and the json object row
       To determine it is able to generate a url
       If any properties in the template are found null without null handling then return false
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

        // Inject the encode function in the keyValues object
        row.encode = module._encodeForTemplate;

        // Inject the escape function in the keyValues object
        row.escape = module._escapeForTemplate;

        // Generate url
        var url = module._renderTemplate(template, row, { avoidValidation: true });

        // If the template is null then throw an error
        if (url === null)  throw new module.MalformedURIError("Some column values are null in the template " + template);
        
        // Prepend the url with server uri if it is relative
        url = this.getAbsoluteUrl(url);

        // If new url has changed then there set all other flags to false to recompute them
        if (this.url !== url) {

            // Cancel existing upload job which is in progress if chunkUrl is not null
            this.cancelUploadJob();

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


    /**
     * Call this function to calculate checksum before uploading to server
     */
    upload.prototype.calculateChecksum = function(row) {
        this.erred = false;
        var deferred = module._q.defer();

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
        }, function(checksum) {
            self.generateURL(row);
            deferred.resolve(self.url);
        }, function(err) {
            deferred.reject(new Error(((err && err.message) ? 
                                        err.message : 
                                        "Unable to calculate checksum for file") + " " + self.file.name));
        });

        return deferred.promise;
    };


    /** Public 
     * Call this function to create multipart upload job request to hatrac
     * It will generate a chunkupload identifier by calling ermrest and set it in the chunkUrl
     */
    upload.prototype.createUploadJob = function() {
        var self = this;
        this.erred = false;
        
        var deferred = module._q.defer();


        //
        this.getExistingJobsForObject().then(function(exists) {

            if (exists) {
                deferred.resolve(self.chunkUrl);
            }  else {

                var url = self.url + ";upload?parents=true";
                
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
                self.chunkUrl = self.getAbsoluteUrl(response.headers('location')); 
                deferred.resolve(self.chunkUrl);
            }
        }, function(response) {
            var error = module._responseToError(response);
            deferred.reject(error);
        });

        return deferred.promise;
    };


    /*
     * Private
     * This function first makes call to hatrac upload job listing service to get all the upload jobs for a url
     * If it finds any then, it picks the first one and makes a call to hatrac for its status
     * If the content-md5 is the same as we calculated then we resolved with true
     * else we resolve the promise with  false
     */
    upload.prototype.getExistingJobsForObject = function() {

        var deferred = module._q.defer();

        var self = this;

        // get listing of all upload jobs for this object
        this.http.get(this.url + ";upload").then(function(response) {

            // If upload jobs found then check for its status
            // Else resolve the promise with no response
            if (response.data.length > 0) {
                self.chunkUrl = self.getAbsoluteUrl("/hatrac" + response.data[0]);
                return self.getExistingJobStatus();
            } else {
                deferred.resolve(false);
            }
            
        }).then(function(response) {
            // if the md5 of the url is same as the once that we calculated then
            // resolve the promise with the true
            // else resolve it with false
            if (response && response.data["content-md5"] == self.hash.md5_base64) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        }, function(response) {

            // If no uploadjobs found then resolve with no response
            // else reject the promise
            if (response.status == "404") {
                deferred.resolve();
            } else {
                deferred.reject(response);
            }

        });
        return deferred.promise;
    };

    /*
     * Private
     * This function fetches the upload job status if chunkurl is not null
     * It returns a promise
     */
    upload.prototype.getExistingJobStatus = function() {

        var deferred = module._q.defer();


        // If chunkUrl is not null then fetch  the status of the uploadJob
        // and resolve promise with it.
        // else just resolved it without any response
        if (this.chunkUrl) {
            this.http.get(this.chunkUrl).then(function(response) {
                deferred.resolve(response);
            }, function(response) {
                deferred.reject(response);
            });
        } else {
            deferred.resolve();
        }


        return deferred.promise;
    };


    /** private
     * Call this function to determine file exists on the server
     * If it doesn't then upload process will begin 
     * Depending on file size it is either uploaded in chunks or fully
     *
     */
    upload.prototype.fileExists = function() {
        var self = this;
        
        var deferred = module._q.defer();

        this.http.head(this.url).then(function(response) {
        
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
    
    /** public
     * Call this function to start multipart upload to server
     *
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
        this.chunks.forEach(function(chunk) {
            chunk.retryCount = 0;
            self.uploadPart(chunk);
            part++;
        });

        return deferred.promise;
    };

    /** private
     * Call this function to start uploading the chunk to server
     *
     */
    upload.prototype.uploadPart = function(chunk) {

        if (chunk.xhr && !chunk.completed) {
            chunk.xhr = null;
            chunk.progress = 0;
        }

        chunk.sendToHatrac(this);
    };

    /** private 
     *  This function is used to complete the chunk upload by notifying hatrac about it and calls 
     *  onUploadCompleted with final url
     *  else call serverError to notify about the error
     */
    upload.prototype.completeUpload = function() {
        var self = this;
        
        var deferred = module._q.defer();

        if (this.completed && this.jobDone) {
            deferred.resolve(this.url);
            return deferred.promise;
        }

        this.http.post(this.chunkUrl).then(function(response) {
            self.jobDone = true;

            if (response.headers('location')) {
                deferred.resolve(self.getAbsoluteUrl(response.headers('location')));
            } else {
                deferred.reject(module._responseToError(response));
            }
            
        }, function(response) {
            deferred.reject(module._responseToError(response));
        });

        return deferred.promise;
    };

    /** private 
     * This function should be called to update the progress of upload
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
     * Pause the upload
     * Remember, the current progressing part will fail,
     * that part will start from beginning (< 50MB of upload is wasted)
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
     * Resumes the upload
     *
     */
    upload.prototype.resume = function() {
        if (!this.isPaused) return;

        this.erred = false;

        // code to handle reupload
        this.start();
    };

    /**
     * Aborts/cancels the upload
     * Returns Promise
     */
    upload.prototype.cancel = function() {

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
            chunk.xhr = null;
            chunk.progress = 0;
        });

        // To zero the update of a file progress bar
        this.updateProgressBar();

        return deferred.promise;
    };

    /*
     * Code to cancel upload job
     * We resolve the promise successfully even though the delete fails
     * because it won't affect the upload
     * Setting chunkUrl null marks that when we reupload this file, we should create a new job
     */
    upload.prototype.cancelUploadJob = function(url) {

        var deferred = module._q.defer();

        if (this.chunkUrl) {
                this.http.delete(this.chunkUrl).then(function() {
                    deferred.resolve();
                }, function(err) {
                    deferred.resolve();
                });

        } else  {
            deferred.resolve();
        }

        return deferred.promise;
    };

    upload.prototype.onUploadError = function(response) {
        if (this.erred) return;
        this.erred = true;
        this.uploadPromise.reject(module._responseToError(response));
    };

    module.Upload = upload;

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

    /** private 
     * This function will upload a chunk of file to the url
     */
    Chunk.prototype.sendToHatrac = function(upload) {

        if (this.xhr || this.completed) {
            this.progress = this.size;
            upload.updateProgressBar();
            return;
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

        var request = {
            // If index is -1 then upload it to the url or upload it to chunkUrl
            url: upload.chunkUrl + "/" + this.index,
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
                }
            },
            data: blob
        };

        self.xhr = request;

        
        // Send the request
        // If upload is aborted using .abort() for pause or cancel scenario
        // then error callback will be called for which the status code would be 0
        // else it would be in range of 400 and 500
        upload.http.put(request.url, request.data, request.config).then(function() {
            
            // Set progress to blob size, and set chunk completed
            self.progress = self.size;
            self.completed = true;
            self.xhr = null;
            
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
       
    };

   return module; 
   
}(ERMrest || {}));
