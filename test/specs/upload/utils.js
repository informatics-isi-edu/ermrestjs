/**
 * @param {File} file - the file object to be uploaded
 * @param {int} fileNumber - the file number based on column definitions in update table
 * @param {Column} column - represents the uri column for the asset
 * @param {Reference} reference - represents the table the file is being uploaded to
 * @param {Object} options - contains ermRest and therefore the Upload class
 * @returns {Promise} - the returned promise includes the url of the file, a row of values representing the file, and the upload object itself
 * This function is to be used onlly with the `upload` schema
 * It relies on the structure of the file_update_table
 **/
exports.uploadFileForTests = function(file, fileNumber, validRow, uploadObj, options) {
    var defer = require('q').defer();

    expect(uploadObj instanceof options.ermRest.Upload).toBe(true, "Upload object is not of type 'ermrest.Upload'");

    uploadObj.calculateChecksum(validRow).then(function(url) {
        expect(url).toBe("/hatrac/js/ermrestjs/" + validRow.timestamp + "/" + file.hash, "File generated url is not the same after calculating the checksum");

        expect(validRow["file" + fileNumber + "_name"]).toBe(file.name, "file.name is not the same");
        expect(validRow["file" + fileNumber + "_bytes"]).toBe(file.size, "file.size is not the same");
        expect(validRow["file" + fileNumber + "_MD5"]).toBe(file.hash, "file.hash is not the same");

        return uploadObj.createUploadJob();
    }).then(function(url) {
        expect(url).toBeDefined("Chunk url not returned");

        return uploadObj.start();
    }).then(function(url) {
        expect(url).toBe("/hatrac/js/ermrestjs/" + validRow.timestamp + "/" + file.hash, "File url is not the same during upload");

        return uploadObj.completeUpload();
    }).then(function(url) {
        expect(url).toContain("/hatrac/js/ermrestjs/" + validRow.timestamp + "/" + file.hash, "File url is not the same after upload has completed");

        return defer.resolve({url: url, validRow: validRow});
    }).catch(function(error) {
        console.dir(error);
        return defer.reject();
    });

    return defer.promise;
}
