exports.execute = function (options) {

    describe("For determining 'tag:isrd.isi.edu,2016:column-display' presentation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_values",
            lowerLimit = 3999,
            upperLimit = 4007,
            limit = 7;

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit;

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

        beforeAll(function(done) {
            options.ermRest.appLinkFn(appLinkFn);

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
        var checkValueAndIsHTML = function(columnName, tupleIndex, valueIndex, expectedValues, expectedIsHTMLValues) {
           
            it("should check " + columnName + " to be `" + expectedValues[valueIndex] + "`", function() {
                var tuple = tuples[tupleIndex];
                var value = tuple.values[valueIndex];
                var expectedValue = expectedValues[valueIndex];

                // Check value is same as expected
                expect(value).toBe(expectedValue);
            });


            it("should check isHTML for " + columnName + " to be `" + expectedIsHTMLValues[valueIndex] + "`", function() {
                var tuple = tuples[tupleIndex];
                var isHTML = tuple.isHTML[valueIndex];
                var expectedValue = expectedIsHTMLValues[valueIndex];

                // Check isHTML is same as expected; either true or false
                expect(isHTML).toBe(expectedValue);
            });

        };

        /*
         * @function
         * @param {integer} tupleIndex The index of the columnValue in the {values} array returned by `tuple.values`.
         * @param {array} expectedValues The expected array of values that should be returned by `tuple.values`.
         * @param {array} expectedIsHTMLValues The expected array of isHTML arrays that should be returned by `tuple.isHTML`.
         * @desc
         * This function calls checkValueAndIsHTML for each column value at the specified tupleIndex
         */
        var testTupleValidity = function(tupleIndex, expectedValues, expectedIsHTMLValues) {

            it("should return 13 values for a tuple", function() {
                var values = tuples[tupleIndex].values;
                expect(values.length).toBe(13);
            });
            
            checkValueAndIsHTML("id", tupleIndex, 0, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("name", tupleIndex, 1, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("url", tupleIndex, 2, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("image", tupleIndex, 3, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("image_with_size", tupleIndex, 4, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("download_link", tupleIndex, 5, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("iframe", tupleIndex, 6, expectedValues, expectedIsHTMLValues);
            checkValueAndIsHTML("some_markdown", tupleIndex, 7, expectedValues, expectedIsHTMLValues);  
            checkValueAndIsHTML("some_markdown_with_pattern", tupleIndex, 8, expectedValues, expectedIsHTMLValues);  
            checkValueAndIsHTML("some_gene_sequence", tupleIndex, 9, expectedValues, expectedIsHTMLValues);    
            checkValueAndIsHTML("video_col", tupleIndex, 11, expectedValues, expectedIsHTMLValues);       
            checkValueAndIsHTML("fkeys_col", tupleIndex, 12, expectedValues, expectedIsHTMLValues);
        };
        
        describe("Testing tuples values", function() {
            var testObjects ={ 
                "test1": {
                        "rowValue" : ["id=4000, some_markdown= **date is :**, name=Hank, url= https://www.google.com, some_gene_sequence= GATCGATCGCGTATT, video_col= http://techslides.com/demos/sample-videos/small.mp4" ],
                        "expectedValue" : [ '4000',
                                            '<h2>Hank</h2>\n',
                                            '<p><a href="https://www.google.com/Hank">link</a></p>\n',
                                            '<p><img src="http://example.com/4000.png" alt="image"></p>\n',
                                            '<p><img src="https://www.google.com/4000.png" alt="image with size" width="400" height="400"></p>\n',
                                            '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                                            '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Hank caption</figcaption><iframe src="http://example.com/iframe" width="300" ></iframe></figure>',
                                            '<p><strong>date is :</strong></p>\n',
                                            '<p><strong>Name is :</strong> Hank<br>\n<strong>date is :</strong></p>\n',
                                            '<code>GATCGATCGC GTATT</code>',
                                            'NA',
                                            '<video controls height=500 width=600 loop ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video>',
                                            'TODO'
                                             ],
                        "isHTML" : [false, true, true, true, true, true, true, true, true, true, false, true, true]              
                        },
                "test2": {
                    "rowValue" :["id=4001, name=Harold,some_invisible_column= Junior"],
                    "expectedValue" : [
                                    '4001',
                                    '<h2>Harold</h2>\n',
                                    '<p><a href="/Harold">link</a></p>\n',
                                    '<p><img src="http://example.com/4001.png" alt="image"></p>\n',
                                    '<p><img src="/4001.png" alt="image with size" width="400" height="400"></p>\n',
                                    '<p><a href="" download="">download link</a></p>\n',
                                    '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Harold caption</figcaption><iframe src="http://example.com/iframe" width="300" ></iframe></figure>',
                                    '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '<p><strong>Name is :</strong> Harold<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '',
                                    '<p><a href="http://example.com/Junior">Junior</a></p>\n',
                                    '',
                                    '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9000" class="class-9000">9000 and Hank</a></p>\n'
                                ],
                    "isHTML" : [false, true, true, true, true, true, true, true, true, true, true, true, true]
                    },
            "test3": {
                    "rowValue" : ["id=4002, url= https://www.google.com, video_col= http://techslides.com/demos/sample-videos/small.mp4"],
                    "expectedValue" :[
                                    '4002',
                                    null,
                                    '',
                                    '<p><img src="http://example.com/4002.png" alt="image"></p>\n',
                                    '<p><img src="https://www.google.com/4002.png" alt="image with size" width="400" height="400"></p>\n',
                                    '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                                    '',
                                    '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '',
                                    '',
                                    'NA',
                                    '',
                                    '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9001" class="class-9001">9001 and Harold</a></p>\n'         
                                    ],
                    "isHTML" : [false, false, false, true, true, true, false, true, false, true, false, true, true]
                    },
            "test4": {
                    "rowValue" : ["id=4003 ,some_invisible_column= Freshmen"],
                    "expectedValue" : [
                                    '4003',
                                    null,
                                    '',
                                    '<p><img src="http://example.com/4003.png" alt="image"></p>\n',
                                    '<p><img src="/4003.png" alt="image with size" width="400" height="400"></p>\n',
                                    '<p><a href="" download="">download link</a></p>\n',
                                    '',
                                    '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '',
                                    '',
                                    '<p><a href="http://example.com/Freshmen">Freshmen</a></p>\n',
                                    '',
                                    '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9002" class="class-9002">9002 and Heather</a></p>\n'         
                                    ],
                    "isHTML" : [false, false, false, true, true, true, false, true, false, true, true, true, true]
                    },
            "test5": {
                    "rowValue" :  ["id=4004, name= weird & HTML < "],
                    "expectedValue" : [
                                    '4004',
                                    '<h2>weird &amp; HTML &lt;</h2>\n',
                                    '<p>[link](/weird &amp; HTML &lt; )</p>\n',
                                    '<p><img src="http://example.com/4004.png" alt="image"></p>\n',
                                    '<p><img src="/4004.png" alt="image with size" width="400" height="400"></p>\n',
                                    '<p><a href="" download="">download link</a></p>\n',
                                    '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">weird &amp; HTML &lt;  caption</figcaption><iframe src="http://example.com/iframe" width="300" ></iframe></figure>',
                                    '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '<p><strong>Name is :</strong> weird &amp; HTML &lt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '',
                                    'NA',
                                    '',
                                    '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9003" class="class-9003">9003 and Henry</a></p>\n'          
                                    ],
                    "isHTML" : [false, true, true, true, true, true, true, true, true, true, false, true, true]
                    },
            "test6": {
                    "rowValue" : ["id=4005, name= <a href='javascript:alert();'></a>, some_invisible_column= Senior"],
                    "expectedValue" : [
                                    '4005',
                                    '<h2>&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;</h2>\n',
                                    '<p>[link](/&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;)</p>\n',
                                    '<p><img src="http://example.com/4005.png" alt="image"></p>\n',
                                    '<p><img src="/4005.png" alt="image with size" width="400" height="400"></p>\n',
                                    '<p><a href="" download="">download link</a></p>\n',
                                    '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">&lt;a href=‘javascript:alert();’&gt;&lt;/a&gt; caption</figcaption><iframe src="http://example.com/iframe" width="300" ></iframe></figure>',
                                    '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '<p><strong>Name is :</strong> &lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '',
                                    '<p><a href="http://example.com/Senior">Senior</a></p>\n',
                                    '',
                                    '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9004" class="class-9004">9004 and Helga</a></p>\n'          
                                    ],
                    "isHTML" : [false, true, true, true, true, true, true, true, true, true, true, true, true]
                    },
            "test7": {
                    "rowValue" : ["id=4006, name= <script>alert();</script>, some_gene_sequence= GATCGATCGCGTATT, some_invisible_column= Sophomore"],
                    "expectedValue" : [
                                    '4006',
                                    '<h2>&lt;script&gt;alert();&lt;/script&gt;</h2>\n',
                                    '<p><a href="/%3Cscript%3Ealert();%3C/script%3E">link</a></p>\n',
                                    '<p><img src="http://example.com/4006.png" alt="image"></p>\n',
                                    '<p><img src="/4006.png" alt="image with size" width="400" height="400"></p>\n',
                                    '<p><a href="" download="">download link</a></p>\n',
                                    '<figure class="embed-block" style=""><figcaption class="embed-caption" style="">&lt;script&gt;alert();&lt;/script&gt; caption</figcaption><iframe src="http://example.com/iframe" width="300" ></iframe></figure>',
                                    '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '<p><strong>Name is :</strong> &lt;script&gt;alert();&lt;/script&gt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                                    '<code>GATCGATCGC GTATT</code>',
                                    '<p><a href="http://example.com/Sophomore">Sophomore</a></p>\n',
                                    '',
                                    '<p><a href="https://dev.isrd.isi.edu/chaise/record/reference_schema:reference_table/id=9005" class="class-9005">9005 and Harry</a></p>\n'           
                                    ],
                    "isHTML" : [false, true, true, true, true, true, true, true, true, true, true, true, true]
                }
                
            }
            
            var i = 0;
            for(var key in testObjects){
                var rowValue = testObjects[key].rowValue;
                var expectedValue = testObjects[key].expectedValue;
                var isHTML = testObjects[key].isHTML;
                describe('Testing for tuple '+ i +" with row values {"+ rowValue + "}", function(){
                    testTupleValidity(i, expectedValue, isHTML);
                })
                i++;    
            }
        });

    });
    
    describe("Test JSON values with and without markdown,", function() {
        //Tested these values as formatted values inside it, to get the exact string after JSON.stringify()
        var expectedValues=[{"id":"1001","json_col":true,"jsonb_col":true,"json_col_with_markdownpattern": "<p>Status is: “processed”</p>\n", "col_markdown_blankable": '<p><a href="https://madeby.google.com/static/images/google_g_logo.svg" target="_blank"><img src="https://madeby.google.com/static/images/google_g_logo.svg" alt="" height="90"></a></p>\n'},
        {"id":"1002","json_col":{},"jsonb_col":{}, "json_col_with_markdownpattern": "<p>Status is: “Activated”</p>\n", "col_markdown_blankable": ""},
        {"id":"1003","json_col":{"name":"test"},"jsonb_col":{"name":"test"}, "json_col_with_markdownpattern": "<p>Status is: “Analysed”</p>\n", "col_markdown_blankable": ""},
        {"id":"1004","json_col":false,"jsonb_col":false, "json_col_with_markdownpattern": "<p>Status is: “Shipped”</p>\n", "col_markdown_blankable": '<p><a href="https://madeby.google.com/abc.jpeg" target="_blank"><img src="https://madeby.google.com/abc.jpeg" alt="" height="90"></a></p>\n'},
        {"id":"1005","json_col":2.9,"jsonb_col":2.9, "json_col_with_markdownpattern": "<p>Status is: “OnHold”</p>\n", "col_markdown_blankable": ""},
        {"id":"1006","json_col":null,"jsonb_col":null, "json_col_with_markdownpattern": "<p>Status is: “Complete”</p>\n", "col_markdown_blankable": '<p><a href="myurl" target="_blank"><img src="myurl" alt="" height="90"></a></p>\n'}];

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "jsontest_table",
            lowerLimit = 1001,
            upperLimit = 2001,
            limit = 6;

        var multipleEntityUri=options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"+ tableName ;

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
};
