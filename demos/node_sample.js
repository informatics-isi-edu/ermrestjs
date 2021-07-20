var ERMrest = require("./../build/ermrest.js");

var server = "https://dev.isrd.isi.edu";


// set the user cookie if you want to perform actions that are not public
// ERMrest.setUserCookie(cookie)

// provide an applink function
// if you don't provide this, ermrestjs might throw an error
ERMrest.appLinkFn(function () {

    var chaiseURL = server + "/chaise";
    var recordURL = chaiseURL + "/record";
    var record2URL = chaiseURL + "/record-two";
    var viewerURL = chaiseURL + "/viewer";
    var searchURL = chaiseURL + "/search";
    var recordsetURL = chaiseURL + "/recordset";

    var appLinkFn = function (tag, location) {
        var url;
        switch (tag) {
            case "tag:isrd.isi.edu,2016:chaise:record":
                url = recordURL;
                break;
            case "tag:isrd.isi.edu,2016:chaise:record-two":
                url = record2URL;
                break;
            case "tag:isrd.isi.edu,2016:chaise:viewer":
                url = viewerURL;
                break;
            case "tag:isrd.isi.edu,2016:chaise:search":
                url = searchURL;
                break;
            case "tag:isrd.isi.edu,2016:chaise:recordset":
                url = recordsetURL;
                break;
            default:
                url = recordURL;
                break;
        }

        url = url + "/" + location.path;

        return url;
    };
});



// resolve a uri to be able to use reference API
var uri = server + "/ermrest/catalog/1/entity/isa:dataset";
var columns;

ERMrest.resolve(uri, {cid: "test"}).then(function (reference) {
    console.log("resolved the `" + reference.displayname.value + "` displayname.");

    // change the context
    reference = reference.contextualize.compact;

    // the columns
    columns = reference.columns;

    // you can sort/search the reference
    // reference = reference.sort([{"column":"id", "descending": true}]);
    // reference = reference.search("value")

    // read the reference values
    return reference.read(5);
}).then(function (page) {

    // you can use the returned page to get the previous and next one
    /*
    if (page.hasPrevious) {
        var prevReference = page.previous;
    }
    if (page.hasNext) {
        var nextReference = page.next;
    }
    */

    // get the tuples
    page.tuples.forEach(function (tuple, tIndex) {
        console.log("values for tuple index=" + tIndex);

        // get values of tuple which is an array in the same order of columns.
        tuple.values.forEach(function (value, vIndex) {
            console.log(columns[i].displayname.value + " = " + value);
        });
    });

}).catch(function (err) {
    console.log(err);
});
