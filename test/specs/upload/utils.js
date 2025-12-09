const { resolve } = require('path');
const fs = require('fs');

/**
 * Mock File object to mimic browser File API for Node.js testing
 * @param {string} path - The file path to create a File object from
 * @returns {File} A File-like object compatible with ermRest.Upload
 */
function createMockFile(path) {
  const stats = fs.statSync(path);
  const buffer = fs.readFileSync(path);

  const file = {
    name: path.split('/').pop(),
    size: stats.size,
    type: getMimeType(path.split('/').pop()),
    lastModified: stats.mtime.getTime(),
    lastModifiedDate: stats.mtime,
    _buffer: buffer,
    path: path, // Upload constructor expects file.path

    // Add slice method for compatibility with chunked uploads
    slice: function(start, end, contentType) {
      const slicedBuffer = this._buffer.slice(start, end);
      return {
        size: slicedBuffer.length,
        type: contentType || this.type,
        _buffer: slicedBuffer
      };
    }
  };

  return file;
}

/**
 * Get MIME type based on file extension
 * @param {string} filename - The filename to get MIME type for
 * @returns {string} The MIME type
 */
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'tiff': 'image/tiff',
    'zip': 'application/zip',
    'json': 'application/json'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

exports.createMockFile = createMockFile;

/**
 * @param {File} file - the file object to be uploaded
 * @param {int} fileNumber - the file number based on column definitions in update table
 * @param {Object} validRow - the row values
 * @param {string} uploadURL - the hatrac object locaiton
 * @param {Object} uploadObj - the upload object
 * @param {Object} options - contains ermRest and therefore the Upload class
 * @returns {Promise} - the returned promise includes the url of the file, a row of values representing the file, and the upload object itself
 * This function is to be used onlly with the `upload` schema
 * It relies on the structure of the file_update_table
 **/
exports.uploadFileForTests = function (file, fileNumber, validRow, uploadURL, uploadObj, options) {
  return new Promise((resolve, reject) => {
    expect(uploadObj instanceof options.ermRest.Upload).toBe(true, "Upload object is not of type 'ermrest.Upload'");

    uploadObj
      .calculateChecksum(validRow)
      .then(function (url) {
        expect(url).toBe(uploadURL, 'File generated url is not the same after calculating the checksum');

        expect(validRow['file' + fileNumber + '_name']).toBe(file.name, 'file.name is not the same');
        expect(validRow['file' + fileNumber + '_bytes']).toBe(file.size, 'file.size is not the same');
        expect(validRow['file' + fileNumber + '_MD5']).toBe(file.hash, 'file.hash is not the same');

        return uploadObj.createUploadJob();
      })
      .then(function (url) {
        expect(url).toBeDefined('Chunk url not returned');

        return uploadObj.start();
      })
      .then(function (url) {
        expect(url).toBe(uploadURL, 'File url is not the same during upload');

        return uploadObj.completeUpload();
      })
      .then(function (url) {
        expect(url).toContain(uploadURL, 'File url is not the same after upload has completed');

        resolve({ url: url, validRow: validRow });
      })
      .catch(function (error) {
        console.dir(error);
        reject(error);
      });
  });
};
