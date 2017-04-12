

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

var ERMrest = (function(module) {

    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

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
      return btoa(String.fromCharCode.apply(null,
        str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
      );
    };

    var Checksum = function(file, options) {
        this.file = file;
        this.options = options || {};
    };

    Checksum.prototype.calculate = function(onProgress, onSuccess, onError) {

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


        var chunkSize = 50 * 1024 * 1024, // read in chunks of 5MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer();

        var onLoad = function(e) {
            console.log("\nRead chunk number " + parseInt(currentChunk + 1) + " of " + chunks);
            spark.append(e.target.result); // append array buffer
            currentChunk++;
            
            var completed = chunkSize * currentChunk;

            onProgress(completed > file.size ? file.size: completed, file.size);

            if (currentChunk < chunks)
                loadNext();
            else {
                self.md5 = spark.end();
                //self.md5 = hexToBase64(self.checksum);
                console.log("\nFinished loading :)\n\nComputed hash: "  + self.md5 + "\n!");
                onSuccess(self.checksum, self);
            }
        };
        
        var loadNext = function () {
            var fileReader = new FileReader();
            fileReader.onload = onLoad;
            fileReader.onerror = onError;
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
            fileReader.readAsArrayBuffer(blobSlice.call(self.file, start, end));
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
        
        this.PART_SIZE = 50 * 1024 * 1024; //minimum part size defined by hatrac 50MB

        this.SERVER_LOC = otherInfo.baseURL; //location of the server
        
        this.file = file;
        
        this.column = otherInfo.column;

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

    /* 
      Call this function with the ermrestjs column object and the json object row
      To determine it is able to generate a url
      If any properties in the template are found null without null handling then return false
      */
    upload.prototype.validateURL = function(row) {
        var annotation = this.column._base.annotations.get("'tag:isrd.isi.edu,2016:asset'");

        var isValid = true;
        if (annotation.url_pattern) {
            
            var template = annotation.url_pattern;

            var ignoredColumns = ["_filename", "_size", "_md5", "_sha256"];

            // Add file properties depending on annotation to ignore_columns
            if (typeof annotation.filename_column == 'string') ignoredColumns.push(annotation.filename_column);
            if (typeof annotation.byte_count_column == 'string') ignoredColumns.push(annotation.byte_count_column);
            if (typeof annotation.md5 == 'string') ignoredColumns.push(annotation.filename_column);
            if (typeof annotation.sha256 == 'string') ignoredColumns.push(annotation.filename_column); 

            var conditionalRegex = /\{\{(#|\^)([\w\d-]+)\}\}/;

            // If no conditional Mustache statements of the form {{#var}}{{/var}} or {{^var}}{{/var}} not found then do direct null check
            if (!conditionalRegex.exec(template)) {

                // Grab all placeholders ({{PROP_NAME}}) in the template
                var placeholders = template.match(/\{\{([\w\d-]+)\}\}/ig);

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

                        // If key is not in ingored columns value for the key is null or undefined then return null
                        if ((ignoredColumns.indexOf(key) == -1) && row[key] === null || row[key] === undefined) {
                           return null;
                        }
                    }
                }
            }
        }

        return isValid;
    };

    upload.prototype.generateURL = function(row) {
        
        var annotation = this.column._base.annotations.get("'tag:isrd.isi.edu,2016:asset'");

        // If annotation has a url pattern then
        if (annotation.url_pattern) {
            
            // Populate all values in obj depending on annotation from current
            if (typeof annotation.filename_column == 'string') obj[annotation.filename_column] = this.file.name;
            if (typeof annotation.byte_count_column == 'string') obj[annotation.byte_count_column] = this.file.size;
            if (typeof annotation.md5 == 'string') obj[annotation.md5] = this.hash.md5;
            if (typeof annotation.sha256 == 'string') obj[annotation.sha256] = this.hash.sha256;

            row[this.column.name].filename_column = this.file.name;
            row[this.column.name].byte_count_column = this.file.size;
            row[this.column.name].md5 = this.hash.md5;
            row[this.column.name].sha256 = this.hash.sha256;

            // Inject the encode function in the keyValues object
            obj.encode = module._encodeForTemplate;

            // Inject the escape function in the keyValues object
            obj.escape = module._escapeForTemplate;

            // Generate url
            this.url = module._mustache.render(annotation.url_pattern, row);

        } else {
            this.url = this.SERVER_LOC;
        }
    };


    /**
     * Call this function to calculate checksum before uploading to server
     */
    upload.prototype.calculateChecksum = function(row) {
        this.erred = false;
        var deferred = module._q.defer();

        if (this.hash && (this.hash.md5 || this.hash.sha256)) {
            deferred.notify(this.file.size);
            deferred.resolve(self.url);
            return;
        } else {
            this.hash = new module.Checksum(this.file);
        }

        var self = this;
        this.hash.calculate(function(uploaded, fileSize) {
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


    /** private 
     * Call this function to create multipart upload job request to hatrac
     * It will generate a chunkupload identifier by calling ermrest and set it in the chunkUrl
     */
    upload.prototype.createUploadJob = function() {
        var self = this;
        this.erred = false;
        
        var deferred = module._q.defer();

        var request = {
            url: this.url + ";upload?parents=true",
            method: 'POST',
            data: {
                "chunk-length" : this.PART_SIZE,
                "content-length": this.file.size,
                "content-type": this.file.type,
                "content-md5": this.hash.md5,
                "content-disposition": "filename*=UTF-8''" + this.file.name
            },
            headers: { 'content-type' : 'application/json' }
        };


        module._http(request).then(function(response) {
            self.chunkUrl = response.headers('location'); 
            deferred.resolve(self.chunkUrl);
        }, function(response) {
            var error = module._responseToError(response);
            deferred.reject(error);
        });


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

        var request = {
            url: this.url,
            method: 'HEAD'   
        };

        module._http(request).then(function() {
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
    upload.prototype.start = function(isResume) {
        var self = this;

        this.erred = false;

        var deferred = module._q.defer();

        this.uploadPromise = deferred;

        if (this.completed) {
            deferred.resolve(this.url);
            return deferred.promise;
        }

        // If isResume is not true, then create chunks and start uploading
        // else directly start uploading the chunks
        if (!isResume) {
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

        if (chunk.completed) {
            this.updateProgressBar();
            return;
        } else if (chunk.xhr && !chunk.completed) {
            if (chunk.xhr) chunk.xhr.abort();
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

        var request = {
            url: this.chunkUrl,
            method: 'POST'
        };

        module._http(request).then(function(response) {

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
       
        this.uploadPromise.notify(done, this.file.size);

        if (done >= this.file.size && !this.completed && (!xhr || (xhr && (xhr.status >= 200 && xhr.status < 300)))) {
            this.completed = true;
            this.uploadPromise.resolve(this.url);
        }
    };


     /**
     * Pause the upload
     * Remember, the current progressing part will fail,
     * that part will start from beginning (< 50MB of upload is wasted)
     */
    upload.prototype.pause = function() {

        if(this.completed || this.isPaused) return;

        this.isPaused = true;
        this.chunks.forEach(function(chunk) {
            if (chunk.xhr) chunk.xhr.abort();
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

        this.isPaused = false;
        this.erred = false;

        // code to handle reupload
        this.start(true);
    };

    /**
     * Aborts/cancels the upload
     *
     */
    upload.prototype.cancel = function() {
        if (this.completed) return;

        var self = this;
        this.isPaused = true;
        this.completed = false;

        this.chunks.forEach(function(chunk) {
            if (chunk.xhr) chunk.xhr.abort();
            chunk.xhr = null;
            chunk.progress = 0;
            chunk.completed = false;
        });
        this.updateProgressBar();
        // code to cancel upload

        // This request will fire asynchronously
        module._http({
            url: this.chunkUrl,
            method: 'DELETE'
        });
    };

    upload.prototype.onUploadError = function(response) {
        if (this.erred) return;
        this.erred = true;
        this.promise.reject(module._responseToError(response));
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
     * This function will upload file/blob to the url
     * If the index is -1, then the upload is direct else it is chunked upload
     */
    Chunk.prototype.sendToHatrac = function(upload) {

        if (this.xhr || this.completed) {
            self.progress = this.size;
            upload.updateProgressBar();
            return;
        }

        var self = this;

        // If index is -1 then blob is the file else it is the 
        // sliced version of the file from start and end index
        var blob = (this.index == -1) ? upload.file : upload.file.slice(this.start, this.end);
        var size = blob.size;
        this.progress = 0;
       
        var headers = {};

        // Set content md5,type and disposition headers if index is -1 i.e the upload is direct
        // else set content-type to "application/octet-stream"
        if (this.index == -1) {
          headers['Content-type'] = upload.file.type;
          headers['Content-MD5'] = upload.hash.md5;
          headers['Content-Disposition']= "filename*=UTF-8''" + encodeURIComponent(upload.file.name);
        } else {
          headers["content-type"] = "application/octet-stream";
        }

        var request = {
            // If index is -1 then upload it to the url or upload it to chunkUrl
            url: (this.index == -1) ? (upload.url  + "?parents=true") : (upload.chunkUrl + "/" + this.index),
            method: "PUT",                      
            headers: headers,
            data: blob,
            uploadEventHandlers: {
              progress: function(e) {
                // To track progress on upload
                if (e.lengthComputable) {
                    self.progress = e.loaded;
                    upload.updateProgressBar(self.xhr);
                }
              }
            }
        };

        self.xhr = request;

        
        // Send the request
        // If upload is aborted using .abort() for pause or cancel scenario
        // then error callback will be called for which the status code would be 0
        // else it would be in range of 400 and 500
        module._http(request).then(function() {
            
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
