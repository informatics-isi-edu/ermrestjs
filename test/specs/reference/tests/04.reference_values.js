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


        var checkValue = function(columnName, tupleIndex, valueIndex, expectedValues) {
            it("should check " + columnName + " to be `" + expectedValues[valueIndex] + "`", function() {
                expect(tuples[tupleIndex].values[valueIndex]).toBe(expectedValues[valueIndex]);
            });
        };

        var testTupleValidity = function(tupleIndex, expectedValues) {

            it("should return 9 values for a tuple", function() {
                var values = tuples[tupleIndex].values;
                expect(values.length).toBe(9);
            });
            
            checkValue("id", tupleIndex, 0, expectedValues);
            checkValue("name", tupleIndex, 1, expectedValues);
            checkValue("url", tupleIndex, 2, expectedValues);
            checkValue("image", tupleIndex, 3, expectedValues);
            checkValue("image_with_size", tupleIndex, 4, expectedValues);
            checkValue("download_link", tupleIndex, 5, expectedValues);
            checkValue("iframe", tupleIndex, 6, expectedValues);
            checkValue("some_markdown", tupleIndex, 7, expectedValues);
            checkValue("some_date", tupleIndex, 8, expectedValues);
            
        };

        describe('for tuple 0 with row values {"id":4000, "some_markdown": "** date is :**", "name":"Hank", "url": "https://www.google.com", "some_date": "2016-08-18"},', function() {
            var values = ['4000',
                          '<h2>Hank</h2>\n',
                          '<p><a href="https://www.google.com/Hank">link</a></p>\n',
                          '<p><img src="http://example.com/4000.png" alt="image"></p>\n',
                          '<p><img src="https://www.google.com/4000.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                          '<p><div class="caption">Hank caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>',
                          '<p>** date is :**</p>\n',
                          '<h1>Name is Hank</h1>\n<p>&lt;p&gt;** date is :**&lt;/p&gt;\n<code>2016&amp;#x2F;8&amp;#x2F;17</code></p>\n'];

            testTupleValidity(0, values);
        });

        describe('for tuple 1 with row values {"id":4001, "some_markdown": "** date is :**", "name":"Harold", "some_date": "2016-08-01"},', function() {

            var values = ['4001',
                          '<h2>Harold</h2>\n',
                          '',
                          '<p><img src="http://example.com/4001.png" alt="image"></p>\n',
                          '',
                          '',
                          '<p><div class="caption">Harold caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>',
                          '<p>** date is :**</p>\n',
                          '<h1>Name is Harold</h1>\n<p>&lt;p&gt;** date is :**&lt;/p&gt;\n<code>2016&amp;#x2F;7&amp;#x2F;31</code></p>\n'];

            testTupleValidity(1, values);            
        });

        describe('for tuple 2 with row values {"id":4002, "some_markdown": "** date is :**", "url": "https://www.google.com"},', function() {

            var values = ['4002',
                          '',
                          '',
                          '<p><img src="http://example.com/4002.png" alt="image"></p>\n',
                          '<p><img src="https://www.google.com/4002.png" alt="image with size" width="400" height="400"></p>\n',
                          '<p><a href="https://www.google.com" download="">download link</a></p>\n',
                          '',
                          '<p>** date is :**</p>\n',
                          ''];

            testTupleValidity(2, values);
        });

        describe('for tuple 3 with row values {"id":4003, "some_markdown": "** date is :**", "some_date": "2016-08-01"},', function() {

            var values = ['4003',
                          '',
                          '',
                          '<p><img src="http://example.com/4003.png" alt="image"></p>\n',
                          '',
                          '',
                          '',
                          '<p>** date is :**</p>\n',
                          '<h1>Name is</h1>\n<p>&lt;p&gt;** date is :**&lt;/p&gt;\n<code>2016&amp;#x2F;7&amp;#x2F;31</code></p>\n'];

            testTupleValidity(3, values);
        });

        describe('for tuple 4 with row values {"id":4004, "some_markdown": "** date is :**", "name": "weird & HTML < " },', function() {

            var values = ['4004',
                          '<h2>weird &amp; HTML &lt;</h2>\n',
                          '',
                          '<p><img src="http://example.com/4004.png" alt="image"></p>\n',
                          '',
                          '',
                          '<p><div class="caption">weird &amp; HTML &lt;  caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>',
                          '<p>** date is :**</p>\n',
                          ''];

            testTupleValidity(4, values);
        });

        describe('for tuple 5 with row values {"id":4005, "some_markdown": "** date is :**", "name": "<a href=\'javascript:alert();\'></a>" },', function() {

            var values = ['4005',
                          '<h2>&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt;</h2>\n',
                          '',
                          '<p><img src="http://example.com/4005.png" alt="image"></p>\n',
                          '',
                          '',
                          '<p><div class="caption">&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt; caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>',
                          '<p>** date is :**</p>\n',
                          ''];

            testTupleValidity(5, values);
        });

        describe('for tuple 6 with row values {"id":4006, "some_markdown": "** date is :**", "name": "<script>alert();</script>" },', function() {

            var values = ['4006',
                          '<h2>&lt;script&gt;alert();&lt;/script&gt;</h2>\n',
                          '',
                          '<p><img src="http://example.com/4006.png" alt="image"></p>\n',
                          '',
                          '',
                          '<p><div class="caption">&lt;script&gt;alert();&lt;/script&gt; caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>',
                          '<p>** date is :**</p>\n',
                          ''];

            testTupleValidity(6, values);
        });

    });
};
