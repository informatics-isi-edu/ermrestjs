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

        beforeAll(function(done) {
            
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

            it("should return 11 values for a tuple", function() {
                var values = tuples[tupleIndex].values;
                expect(values.length).toBe(11);
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
        };



        describe('for tuple 0 with row values {"id":4000, "some_markdown": "** date is :**", "name":"Hank", "url": "https://www.google.com", "some_gene_sequence": "GATCGATCGCGTATT"},', function() {
            var values = ['4000',
                          '<h2>Hank</h2>\n',
                          '<p><a href="https://www.google.com/Hank">link</a></p>\n',
                          '<p><img src="http://example.com/4000.png" alt="image"></p>\n',
                          '<p><img src="https://www.google.com/4000.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                          '<div class="embed-block"><div class="embed-caption">Hank caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></div>',
                          '<p><strong>date is :</strong></p>\n',
                          '<p><strong>Name is :</strong> Hank<br>\n<strong>date is :</strong></p>\n',
                          '<code>GATCGATCGC GTATT</code>',
                          'NA'];

            // Change last false to true once gene_sequence type is added
            var isHTML = [false, true, true, true, true, true, true, true, true, true, false];

            testTupleValidity(0, values, isHTML);
        });

        describe('for tuple 1 with row values {"id":4001, "name":"Harold","some_invisible_column": "Junior"},', function() {

            var values = ['4001',
                          '<h2>Harold</h2>\n',
                          '<p><a href="/Harold">link</a></p>\n',
                          '<p><img src="http://example.com/4001.png" alt="image"></p>\n',
                          '<p><img src="/4001.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="" download="">download link</a></p>\n',
                          '<div class="embed-block"><div class="embed-caption">Harold caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></div>',
                          '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '<p><strong>Name is :</strong> Harold<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '',
                          '<p><a href="http://example.com/Junior">Junior</a></p>\n'];

            // Change last false to true once gene_sequence type is added
            var isHTML = [false, true, true, true, true, true, true, true, true, true, true];

            testTupleValidity(1, values, isHTML);            
        });

        describe('for tuple 2 with row values {"id":4002, "url": "https://www.google.com"},', function() {

            var values = ['4002',
                          null,
                          '',
                          '<p><img src="http://example.com/4002.png" alt="image"></p>\n',
                          '<p><img src="https://www.google.com/4002.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                          '',
                          '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '',
                          '',
                          'NA'];

            // Change last false to true once gene_sequence type is added
            var isHTML = [false, false, false, true, true, true, false, true, false, true, false];

            testTupleValidity(2, values, isHTML);
        });

        describe('for tuple 3 with row values {"id":4003 ,"some_invisible_column": "Freshmen"},', function() {

            var values = ['4003',
                          null,
                          '',
                          '<p><img src="http://example.com/4003.png" alt="image"></p>\n',
                          '<p><img src="/4003.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="" download="">download link</a></p>\n',
                          '',
                          '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '',
                          '',
                          '<p><a href="http://example.com/Freshmen">Freshmen</a></p>\n'];
            // Change last false to true once gene_sequence type is added
            var isHTML = [false, false, false, true, true, true, false, true, false, true, true];

            testTupleValidity(3, values, isHTML);
        });

        describe('for tuple 4 with row values {"id":4004, "name": "weird & HTML < " },', function() {

            var values = ['4004',
                          '<h2>weird &amp; HTML &lt;</h2>\n',
                          '<p>[link](/weird &amp; HTML &lt; )</p>\n',
                          '<p><img src="http://example.com/4004.png" alt="image"></p>\n',
                          '<p><img src="/4004.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="" download="">download link</a></p>\n',
                          '<div class="embed-block"><div class="embed-caption">weird &amp; HTML &lt;  caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></div>',
                          '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '<p><strong>Name is :</strong> weird &amp; HTML &lt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '',
                          'NA'];

            // Change last false to true once gene_sequence type is added
            var isHTML = [false, true, true, true, true, true, true, true, true, true, false];

            testTupleValidity(4, values, isHTML);
        });

        describe('for tuple 5 with row values {"id":4005, "name": "<a href=\'javascript:alert();\'></a>" , "some_invisible_column": "Senior"},', function() {

            var values = ['4005',
                          '<h2>&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;</h2>\n',
                          '<p>[link](/&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;)</p>\n',
                          '<p><img src="http://example.com/4005.png" alt="image"></p>\n',
                          '<p><img src="/4005.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="" download="">download link</a></p>\n',
                          '<div class="embed-block"><div class="embed-caption">&lt;a href=‘javascript:alert();’&gt;&lt;/a&gt; caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></div>',
                          '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '<p><strong>Name is :</strong> &lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '',
                          '<p><a href="http://example.com/Senior">Senior</a></p>\n'];

            // Change last false to true once gene_sequence type is added
            var isHTML = [false, true, true, true, true, true, true, true, true, true, true];

            testTupleValidity(5, values, isHTML);
        });

        describe('for tuple 6 with row values {"id":4006, "name": "<script>alert();</script>", "some_gene_sequence": "GATCGATCGCGTATT" , "some_invisible_column": "Sophomore"},', function() {

            var values = ['4006',
                          '<h2>&lt;script&gt;alert();&lt;/script&gt;</h2>\n',
                          '<p><a href="/%3Cscript%3Ealert();%3C/script%3E">link</a></p>\n',
                          '<p><img src="http://example.com/4006.png" alt="image"></p>\n',
                          '<p><img src="/4006.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="" download="">download link</a></p>\n',
                          '<div class="embed-block"><div class="embed-caption">&lt;script&gt;alert();&lt;/script&gt; caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></div>',
                          '<p><strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '<p><strong>Name is :</strong> &lt;script&gt;alert();&lt;/script&gt;<br>\n<strong>This is some markdown</strong> with some <code>code</code> and a <a href="http://www.example.com">link</a></p>\n',
                          '<code>GATCGATCGC GTATT</code>',
                          '<p><a href="http://example.com/Sophomore">Sophomore</a></p>\n'];

            // Change last false to true once gene_sequence type is added
            var isHTML = [false, true, true, true, true, true, true, true, true, true, true];

            testTupleValidity(6, values, isHTML);
        });

    });
};
