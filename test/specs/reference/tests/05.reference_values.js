var moment = require('moment');

exports.execute = function (options) {

    describe("For determining 'tag:isrd.isi.edu,2016:column-display' presentation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_values",
            lowerLimit = 3999,
            upperLimit = 4007,
            limit = 7;

        var getRID;

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/@sort(id)";

        var reference, page, tuples;

        var chaiseURL = "https://dev.isrd.isi.edu/chaise";
        var recordURL = chaiseURL + "/record";
        var record2URL = chaiseURL + "/record-two";
        var viewerURL = chaiseURL + "/viewer";
        var searchURL = chaiseURL + "/search";
        var recordsetURL = chaiseURL + "/recordset";

        var appLinkFn = function (tag, location) {
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

        var moment = options.ermRest._currDate;
        var expectedMomentValue = "<p>" + moment.day + " " + moment.date + "/" + moment.month + "/" + moment.year + "</p>\n";
        var testObjects ={
            "test1": {
                    "rowValue" : ["id=4000, some_markdown= **date is :**, name=Hank, url= https://www.google.com, some_gene_sequence= GATCGATCGCGTATT, video_col= http://techslides.com/demos/sample-videos/small.mp4, catalog_snapshot_uri=schema:table, catalog_id_uri=schema:table" ],
                    "expectedValue" : [ '4000',
                                        '<h2>Hank</h2>\n',
                                        '<p><a href="https://www.google.com/Hank">link</a></p>\n',
                                        '<p><img src="http://example.com/4000.png" alt="image" class="-chaise-post-load"></p>\n',
                                        '<p><img src="https://www.google.com/4000.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                        '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                                        '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 300px;"><figcaption class="embed-caption">Hank caption</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="http://example.com/iframe"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="http://example.com/iframe" width="300"></iframe></figure>',
                                        '<p><strong>date is :</strong></p>\n',
                                        '<p><strong>Name is :</strong> Hank<br>\n<strong>date is :</strong></p>\n',
                                        '<code>GATCGATCGC GTATT</code>',
                                        'NA',
                                        '<span class="video-info-in-print" style="display:none;">Note: Video (http://techslides.com/demos/sample-videos/small.mp4) is hidden in print </span><video controls class="-chaise-post-load hide-in-print" height=500 width=600 loop ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video>',
                                        '', // This value is set later by setLinkRID()
                                        '<p>'+catalog_id+': '+catalog_id+'/schema:table</p>\n',
                                        expectedMomentValue,
                                        '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABnYF14BfeL7oA</p>\n',
                                        '<p><span class="chaise-color-preview" background-color="#00FF00"> </span> #00FF00</p>\n'
                                         ],
                    "isHTML" : [false, true, true, true, true, true, true, true, true, true, false, true, false, true, true, true, true]
                    },
            "test2": {
                "rowValue" :["id=4001, name=Harold,some_invisible_column= Junior"],
                "expectedValue" : [
                                '4001',
                                '<h2>Harold</h2>\n',
                                '<p><a href="/Harold">link</a></p>\n',
                                '<p><img src="http://example.com/4001.png" alt="image" class="-chaise-post-load"></p>\n',
                                '<p><img src="/4001.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                '<p><a href="" download="">download link</a></p>\n',
                                '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 300px;"><figcaption class="embed-caption">Harold caption</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="http://example.com/iframe"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="http://example.com/iframe" width="300"></iframe></figure>',
                                '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '<p><strong>Name is :</strong> Harold<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '',
                                '<p><a href="http://example.com/Junior">Junior</a></p>\n',
                                '',
                                '',  // This value is set later by setLinkRID()
                                '',
                                expectedMomentValue,
                                '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABlYEYBdeAX3h68gA</p>\n',
                                '<p><span class="chaise-color-preview" background-color="#0000FF"> </span> #0000FF</p>\n'
                            ],
                "isHTML" : [false, true, true, true, true, true, true, true, true, true, true, true, true, false, true, true, true]
                },
            "test3": {
                "rowValue" : ["id=4002, url= https://www.google.com, video_col= http://techslides.com/demos/sample-videos/small.mp4"],
                "expectedValue" :[
                                '4002',
                                null,
                                '',
                                '<p><img src="http://example.com/4002.png" alt="image" class="-chaise-post-load"></p>\n',
                                '<p><img src="https://www.google.com/4002.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                                '',
                                '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '',
                                '',
                                'NA',
                                '',
                                '', // This value is set later by setLinkRID()
                                '',
                                expectedMomentValue,
                                '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABlYCYBdeAX3h68gA</p>\n',
                                '<p><span class="chaise-color-preview" background-color="#FF3411"> </span> #FF3411</p>\n'
                                ],
                "isHTML" : [false, false, false, true, true, true, false, true, false, true, false, true, true, false, true, true, true]
                },
            "test4": {
                "rowValue" : ["id=4003 ,some_invisible_column= Freshmen"],
                "expectedValue" : [
                                '4003',
                                null,
                                '',
                                '<p><img src="http://example.com/4003.png" alt="image" class="-chaise-post-load"></p>\n',
                                '<p><img src="/4003.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                '<p><a href="" download="">download link</a></p>\n',
                                '',
                                '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '',
                                '',
                                '<p><a href="http://example.com/Freshmen">Freshmen</a></p>\n',
                                '',
                                '', // This value is set later by setLinkRID()
                                '',
                                expectedMomentValue,
                                '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABlYGYBdeAX3h68gA</p>\n',
                                ''
                                ],
                "isHTML" : [false, false, false, true, true, true, false, true, false, true, true, true, true, false, true, true, false]
                },
            "test5": {
                "rowValue" :  ["id=4004, name= weird & HTML < "],
                "expectedValue" : [
                                '4004',
                                '<h2>weird &amp; HTML &lt;</h2>\n',
                                '<p>[link](/weird &amp; HTML &lt; )</p>\n',
                                '<p><img src="http://example.com/4004.png" alt="image" class="-chaise-post-load"></p>\n',
                                '<p><img src="/4004.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                '<p><a href="" download="">download link</a></p>\n',
                                '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 300px;"><figcaption class="embed-caption">weird &amp; HTML &lt;  caption</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="http://example.com/iframe"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="http://example.com/iframe" width="300"></iframe></figure>',
                                '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '<p><strong>Name is :</strong> weird &amp; HTML &lt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '',
                                'NA',
                                '',
                                '', // This value is set later by setLinkRID()
                                '',
                                expectedMomentValue,
                                '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABleYF14BfebnkA</p>\n',
                                ''
                                ],
                "isHTML" : [false, true, true, true, true, true, true, true, true, true, false, true, true, false, true, true, false]
                },
            "test6": {
                "rowValue" : ["id=4005, name= <a href='javascript:alert();'></a>, some_invisible_column= Senior"],
                "expectedValue" : [
                                '4005',
                                '<h2>&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;</h2>\n',
                                '<p>[link](/&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;)</p>\n',
                                '<p><img src="http://example.com/4005.png" alt="image" class="-chaise-post-load"></p>\n',
                                '<p><img src="/4005.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                '<p><a href="" download="">download link</a></p>\n',
                                '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 300px;"><figcaption class="embed-caption">&lt;a href=‘javascript:alert();’&gt;&lt;/a&gt; caption</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="http://example.com/iframe"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="http://example.com/iframe" width="300"></iframe></figure>',
                                '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '<p><strong>Name is :</strong> &lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '',
                                '<p><a href="http://example.com/Senior">Senior</a></p>\n',
                                '',
                                '', // This value is set later by setLinkRID()
                                '',
                                expectedMomentValue,
                                '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABlYFYBdeAX3h68gA</p>\n',
                                ''
                                ],
                "isHTML" : [false, true, true, true, true, true, true, true, true, true, true, true, true, false, true, true, false]
                },
            "test7": {
                "rowValue" : ["id=4006, name= <script>alert();</script>, some_gene_sequence= GATCGATCGCGTATT, some_invisible_column= Sophomore"],
                "expectedValue" : [
                                '4006',
                                '<h2>&lt;script&gt;alert();&lt;/script&gt;</h2>\n',
                                '<p><a href="/%3Cscript%3Ealert();%3C/script%3E">link</a></p>\n',
                                '<p><img src="http://example.com/4006.png" alt="image" class="-chaise-post-load"></p>\n',
                                '<p><img src="/4006.png" alt="image with size" width="400" height="400" class="-chaise-post-load"></p>\n',
                                '<p><a href="" download="">download link</a></p>\n',
                                '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 300px;"><figcaption class="embed-caption">&lt;script&gt;alert();&lt;/script&gt; caption</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="http://example.com/iframe"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="http://example.com/iframe" width="300"></iframe></figure>',
                                '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '<p><strong>Name is :</strong> &lt;script&gt;alert();&lt;/script&gt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                '<code>GATCGATCGC GTATT</code>',
                                '<p><a href="http://example.com/Sophomore">Sophomore</a></p>\n',
                                '',
                                '', // This value is set later by setLinkRID()
                                '',
                                expectedMomentValue,
                                '<p>/*::facets::N4IghgdgJiBcAEBteoDOB7ArgJwMYFM54QBLGAGmNwAt0SDUjEAWABlYDYBdeAX3h68gA</p>\n',
                                ''
                                ],
                "isHTML" : [false, true, true, true, true, true, true, true, true, true, true, true, true, false, true, true, false]
            }
        };

        beforeAll(function(done) {
            options.ermRest.appLinkFn(appLinkFn);

            // has to be defined here because it relies on values in options.entities and needs to be scoped somewhere it's available
            getRID = function (id) {
                return options.entities[schemaName]["table_w_composite_key"].filter(function(e) {
                    return e.id == id;
                })[0].RID;
            };

            // Fetch the entities beforehand
            options.ermRest.resolve(multipleEntityUri, {cid: "test"}).then(function (response) {
                reference = response;
                expect(reference).toEqual(jasmine.any(Object));
                return reference.read(limit);
            }).then(function (response) {
                page = response;

                expect(page).toEqual(jasmine.any(Object));
                expect(page._data.length).toBe(limit);

                expect(page.tuples).toBeDefined();
                tuples = page.tuples;
                expect(tuples.length).toBe(limit);

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            }).catch(function(err) {
                console.dir(err);
                done.fail();
            });

        });

        describe("Testing tuples values", function() {
            /*
             * @function
             * @param {String} key name of key in testObjects
             * Takes the key to get the appropriate test object so that one of the expectedValues can be modified with the RID value
             * Calling setLinkRID has to be done in a `before` or an `it` block to have access to options.entities
             */
            var setLinkRID = function (key) {
                var rowValues = testObjects[key].expectedValue;
                switch (key) {
                    case "test2":
                        rowValues[12] = '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/RID=' + getRID(1) + '" class="class-10">4000 , 4001</a></p>\n';
                        break;
                    case "test3":
                        rowValues[12] = '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/RID=' + getRID(2) + '" class="class-20">4000 , 4002</a></p>\n';
                        break;
                    case "test4":
                        rowValues[12] = '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/RID=' + getRID(3) + '" class="class-30">4000 , 4003</a></p>\n';
                        break;
                    case "test5":
                        rowValues[12] = '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/RID=' + getRID(4) + '" class="class-40">4001 , 4002</a></p>\n';
                        break;
                    case "test6":
                        rowValues[12] = '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/RID=' + getRID(5) + '" class="class-50">4002 , 4000</a></p>\n';
                        break;
                    case "test7":
                        rowValues[12] = '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:table_w_composite_key/RID=' + getRID(6) + '" class="class-60">4000 , 4000</a></p>\n';
                        break;
                }
            }

            /*
             * @function
             * @param {string} columName Name of the column.
             * @param {integer} tupleIndex The index of the tuple in {tuples} array.
             * @param {integer} valueIndex The index of the columnValue in the {values} array returned by `tuple.values`.
             * @param {array} expectedValues The expected array of values that should be returned by `tuple.values`.
             * @param {array} expectedIsHTMLValues The expected array of isHTML arrays that should be returned by `tuple.isHTML`.
             * @desc
             * This function checks for the value and isHTML for a particular tuple at the tupleIndex
             * and a particular column value at the specified valuedIndex
             */
            var checkValueAndIsHTML = function(tuple, valueIndex, key) {
                // value check
                var value = tuple.values[valueIndex];
                var expectedValue = testObjects[key].expectedValue[valueIndex];

                // Check value is same as expected
                expect(value).toBe(expectedValue);

                // isHTML check
                var isHTML = tuple.isHTML[valueIndex];
                var expectedHTMLValue = testObjects[key].isHTML[valueIndex];

                // Check isHTML is same as expected; either true or false
                expect(isHTML).toBe(expectedHTMLValue);
            };

            /*
             * @function
             * @param {integer} tupleIndex The index of the columnValue in the {values} array returned by `tuple.values`.
             * @param {array} expectedValues The expected array of values that should be returned by `tuple.values`.
             * @param {array} expectedIsHTMLValues The expected array of isHTML arrays that should be returned by `tuple.isHTML`.
             * @desc
             * This function calls checkValueAndIsHTML for each column value at the specified tupleIndex
             */
            var testTupleValidity = function(tupleIndex, key) {
                it("should return 16 values for a tuple", function() {
                    // get the RID value that was set on options.entities[schema_name][table_name]
                    setLinkRID(key);

                    expect(tuples[tupleIndex].values.length).toBe(17);
                });

                var columnNames = [
                    "id", "name", "url", "image", "image_with_size", "download_link",
                    "iframe","some_markdown", "some_markdown_with_pattern",
                    "some_gene_sequence", "column_using_invisble_column",
                    "video_col", "fkeys_col", "catalog_snapshot",
                    "moment_col", "encodefacet_col"
                ]
                for (var j=0; j<columnNames.length; j++) {
                    (function (columnIndex) {
                        // NOTE: There was no index 10 in checkValueAndIsHTML functions defined before
                        if (columnIndex !== 10) {
                            it("should check value and isHTML for '" + columnNames[columnIndex] + "' column", function() {
                                checkValueAndIsHTML(tuples[tupleIndex], columnIndex, key);
                            });
                        }
                    }(j));
                }
            };

            var i = 0;
            for(var key in testObjects){
                var rowValue = testObjects[key].rowValue;
                describe('Testing for tuple '+ i +" with row values {"+ rowValue + "}", function(){
                    testTupleValidity(i, key);
                });
                i++;
            }
        });

    });

    describe("Test JSON values with and without markdown,", function() {
        //Tested these values as formatted values inside it, to get the exact string after JSON.stringify()
        var expectedValues=[{"id":"1001","json_col":true,"jsonb_col":true,"json_col_with_markdownpattern": "<p>Status is: “processed”</p>\n", "col_markdown_blankable": '<p><a href="https://madeby.google.com/static/images/google_g_logo.svg" target="_blank"><img src="https://madeby.google.com/static/images/google_g_logo.svg" alt="" height="90" class="-chaise-post-load"></a></p>\n'},
        {"id":"1002","json_col":{},"jsonb_col":{}, "json_col_with_markdownpattern": "<p>Status is: “Activated”</p>\n", "col_markdown_blankable": ""},
        {"id":"1003","json_col":{"name":"test"},"jsonb_col":{"name":"test"}, "json_col_with_markdownpattern": "<p>Status is: “Analysed”</p>\n", "col_markdown_blankable": ""},
        {"id":"1004","json_col":false,"jsonb_col":false, "json_col_with_markdownpattern": "<p>Status is: “Shipped”</p>\n", "col_markdown_blankable": '<p><a href="https://madeby.google.com/abc.jpeg" target="_blank"><img src="https://madeby.google.com/abc.jpeg" alt="" height="90" class="-chaise-post-load"></a></p>\n'},
        {"id":"1005","json_col":2.9,"jsonb_col":2.9, "json_col_with_markdownpattern": "<p>Status is: “OnHold”</p>\n", "col_markdown_blankable": ""},
        {"id":"1006","json_col":null,"jsonb_col":null, "json_col_with_markdownpattern": "<p>Status is: “Complete”</p>\n", "col_markdown_blankable": '<p><a href="myurl" target="_blank"><img src="myurl" alt="" height="90" class="-chaise-post-load"></a></p>\n'}];

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "jsontest_table",
            lowerLimit = 1001,
            upperLimit = 2001,
            limit = 6;

        var multipleEntityUri=options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"+ tableName + "/@sort(id)";

        var reference, page, tuples, url;

        beforeAll(function(done) {

            // Fetch the entities beforehand
            options.ermRest.resolve(multipleEntityUri).then(function (response) {
                reference = response;
                expect(reference).toEqual(jasmine.any(Object));
                return reference.read(limit);
            }).then(function (response) {
                page = response;

                expect(page).toEqual(jasmine.any(Object));
                expect(page._data.length).toBe(limit);

                expect(page.tuples).toBeDefined();
                tuples = page.tuples;
                expect(tuples.length).toBe(limit);

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            }).catch(function(err) {
                console.dir(err);
                done.fail();
            });
        });

        it("JSON column should display pre tags without markdown and should not append pre tag with markdown", function() {

            for( var i=0; i<limit; i++){
                var values=tuples[i].values;
                var json='<pre>'+JSON.stringify(expectedValues[i].json_col,"undefined",2)+'</pre>';
                var jsonb='<pre>'+JSON.stringify(expectedValues[i].jsonb_col,"undefined",2)+'</pre>';
                expect(values[0]).toBe(json, "Mismatch in tuple with index = "+ i +", column= json_col");
                expect(values[1]).toBe(jsonb ,"Mismatch in tuple with index = "+ i +", column= jsonb_col");
                expect(values[2]).toBe(expectedValues[i].json_col_with_markdownpattern, "Mismatch in tuple with index = "+ i +", column= json_col_with_markdownpattern");
                expect(values[3]).toBe(expectedValues[i].col_markdown_blankable, "Mismatch in tuple with index = "+ i +", column= col_markdown_blankable");
            }
        });

    });

    describe("Test Array column values,", function () {
        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "table_w_array",
            limit = 5;

        var tableWArrayUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName + "@sort(id)";
        var reference, page, tuples;

        var testValues = function (cases) {
            cases.forEach(function (c, colIndex) {
                describe (c.column  + " values,", function () {
                    c.values.forEach(function (v, rowIndex) {
                        it ("for row index=`" + rowIndex + "` should be as expected.", function () {
                            var tuple = tuples[rowIndex];
                            expect(tuple.isHTML[colIndex]).toBe((v != "" && v != null), "isHTML missmatch.");
                            expect(tuple.values[colIndex]).toEqual(v, "value missmatch.");
                        });
                    });
                });
            });
        };

        var testValuesByIndex = function (colIndex, expectedValues) {
            expect(tuples.length).toBe(expectedValues.length, "tuple length missmatch.");
            tuples.forEach(function (t, rowIndex) {
                var v = expectedValues[rowIndex];
                expect(t.values[colIndex]).toEqual(v, "value missmatch for row index=" + rowIndex);
                expect(t.isHTML[colIndex]).toBe((v != "" && v != null), "isHTML missmatch for row index=" + rowIndex);
            });
        };

        var formatTZ = function (val) {
            return moment(val).format("YYYY-MM-DD HH:mm:ss");
        };

        beforeAll(function (done) {
            // Fetch the entities beforehand
            options.ermRest.resolve(tableWArrayUri).then(function (response) {
                reference = response;
                expect(reference).toEqual(jasmine.any(Object), "reference is not defined.");
                return reference.read(limit);
            }).then(function (response) {
                page = response;

                expect(page).toEqual(jasmine.any(Object), "page not defined.");
                expect(page._data.length).toBe(limit, "page length invalid");

                tuples = page.tuples;
                expect(tuples.length).toBe(limit, "tuples length invalid");

                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            }).catch(function(err) {
                console.dir(err);
                done.fail();
            });
        });

        describe("when markdown_pattern is missing.", function () {
            //NOTE This are based on visible-columns list (columns should be the same order)
            testValues([
                {
                    "column": "text_array",
                    "values": [
                        "", "", "<p>*Empty*, &lt;em&gt;Empty&lt;/em&gt;, <em>No value</em>, <em>Empty</em></p>\n", "<p><em>No value</em></p>\n", "<p><em>Empty</em></p>\n"
                    ]
                },
                {
                    "column": "boolean_array",
                    "values": [
                        "", "", "<p>false, <em>No value</em>, true</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "date_array",
                    "values": [
                        "", "", "<p>2016-01-18, <em>No value</em>, 2015-04-18</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "timestamp_array",
                    "values": [
                        "", "", "<p>2016-01-18 13:00:00, <em>No value</em>, 2015-02-18 16:00:00</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "timestamptz_array",
                    "values": [
                        "", "", "<p>" + formatTZ("2016-01-18T00:00:00-08:00") + ", <em>No value</em>, " + formatTZ("2016-01-28T00:00:00-08:00") +"</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "float4_array",
                    "values": [
                        "", "", "<p>2.4300, <em>No value</em>, 5.4213</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "float8_array",
                    "values": [
                        "", "", "<p>5,234.1234, <em>No value</em>, 4,123.2340</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "numeric_array",
                    "values": [
                        "", "", "<p>12,345.2340, <em>No value</em>, -41,232.2300</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "int2_array",
                    "values": [
                        "", "", "<p>1,245, <em>No value</em>, 6,242</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "int4_array",
                    "values": [
                        "", "", "<p>128,361, <em>No value</em>, 41,234</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                },
                {
                    "column": "int8_array",
                    "values": [
                        "", "", "<p>41,245,264, <em>No value</em>, 1,241,232</p>\n", "<p><em>No value</em></p>\n", ""
                    ]
                }
            ]);
        });

        describe("when used in the markdown_pattern.", function () {
            it ("should be able to inject markdown in markdown (if we have array of text and the text has markdown in it).", function () {
                testValuesByIndex(11, [
                    "",
                    "",
                    "<p>text array: <em>Empty</em>, &lt;em&gt;Empty&lt;/em&gt;, <em>No value</em>, <em>Empty</em></p>\n",
                    "<p>text array: <em>No value</em></p>\n",
                    "<p>text array: <em>Empty</em></p>\n"
                ]);
            });

            it ("should be able to access formatted value (the same output as formatPresentation for column).", function () {
                testValuesByIndex(12, [
                    "",
                    "",
                    "<ul>\n<li>boolean: false, <em>No value</em>, true</li>\n<li>timestamp: 2016-01-18 13:00:00, <em>No value</em>, 2015-02-18 16:00:00</li>\n<li>numeric: 12,345.2340, <em>No value</em>, -41,232.2300</li>\n</ul>\n",
                    "<ul>\n<li>boolean: <em>No value</em></li>\n<li>timestamp: <em>No value</em></li>\n<li>numeric: <em>No value</em></li>\n</ul>\n",
                    ""
                ]);
            });

            it ("should be able to iterate over array values.", function () {
                testValuesByIndex(13, [
                    "",
                    "",
                    "<ul>\n<li>41245264</li>\n<li><em>No value</em></li>\n<li>1241232</li>\n</ul>\n",
                    "<ul>\n<li><em>No value</em></li>\n</ul>\n",
                    ""
                ]);
            });
        });
    });
};
