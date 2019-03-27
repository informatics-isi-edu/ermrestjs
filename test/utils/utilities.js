var ermrestImport = require(process.env.PWD + '/test/utils/ermrest-import.js');

/**
 * @param {Array} pageData - data returned from update request
 * @param {Array} tuples - tuples sent to the database for update
 * @param {string} sortBy - name of column to compare the pageData/tuples by so they are similarly sorted
 * verifies that the returned data is the same as the submitted data
 */
exports.checkPageValues = function(pageData, tuples, sortBy) {
    pageData.sort(function(a, b) {
        return a[sortBy].toString().localeCompare(b[sortBy].toString());
    });

    tuples.sort(function(a, b) {
        return a._data[sortBy].toString().localeCompare(b._data[sortBy].toString());
    });

    for (var i = 0; i < pageData.length; i++) {
        var tupleData = tuples[i]._data;
        var columns = Object.keys(tupleData);
        var responseData = pageData[i];
        for (var j = 0; j < columns.length; j++) {
            var columnName = columns[j];
            expect(responseData[columnName]).toBe(tupleData[columnName], "Value " + responseData[columnName] + " for column " + columnName + " does not match tuple data value");
        }
    }
};


exports.setCatalogAcls = function (ERMrest, done, uri, catalogId, acls, cb, userCookie) {
    ermrestImport.importAcls(acls).then(function () {
        exports.removeCachedCatalog(ERMrest, catalogId);
        if (userCookie) {
            ERMrest.setUserCookie(userCookie);
        } else {
            ERMrest.resetUserCookie();
        }
        return ERMrest.resolve(uri, { cid: "test" });
    }).then(function (response) {
        cb(response);
        done();
    }).catch(function (err) {
        done.fail(err);
    });
};

exports.removeCachedCatalog = function (ERMrest, catalogId) {
    var server = ERMrest.ermrestFactory.getServer(process.env.ERMREST_URL, {cid: "test"});
    delete server.catalogs._catalogs[catalogId];
};

exports.resetCatalogAcls = function (done, acls) {
    ermrestImport.importAcls(acls).then(function (){
        done();
    }, function (err) {
        done.fail(err);
    });
};
