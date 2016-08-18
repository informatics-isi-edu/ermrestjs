exports.execute = function (options) {

    describe("For determining format presentation,", function () {

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

        describe('for tuple 0 with row values {"id":4000,"name":"Hank", "url": "https://www.google.com"},', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[0].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4000
                expect(values[0]).toBe('4000');

                // name should be set to Hank
                expect(values[1]).toBe('<p>Hank</p>\n');

                // url 
                expect(values[2]).toBe('<p><a href="https://www.google.com/Hank">link</a></p>\n');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4000.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('<p><img src="https://www.google.com/4000.png" alt="image with size" width="400" height="400"></p>\n');

                // download_link 
                expect(values[5]).toBe('<p><a href="https://www.google.com" download="">download link</a></p>\n');

                // iframe 
                expect(values[6]).toBe('<p><div class="caption">Hank caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>');
                
            });

        });

        describe('for tuple 1 with row values {"id":4001,"name":"Harold"},', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[1].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4001
                expect(values[0]).toBe('4001');

                // name should be set to Harold
                expect(values[1]).toBe('<p>Harold</p>\n');

                // url 
                expect(values[2]).toBe('');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4001.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('');

                // download_link 
                expect(values[5]).toBe('');

                // iframe 
                expect(values[6]).toBe('<p><div class="caption">Harold caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>');
                
            });

        });

        describe('for tuple 2 with row values {"id":4002, "url": "https://www.google.com"},', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[2].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4002
                expect(values[0]).toBe('4002');

                // name should be set to ''
                expect(values[1]).toBe('');

                // url 
                expect(values[2]).toBe('');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4002.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('<p><img src="https://www.google.com/4002.png" alt="image with size" width="400" height="400"></p>\n');

                // download_link 
                expect(values[5]).toBe('<p><a href="https://www.google.com" download="">download link</a></p>\n');

                // iframe 
                expect(values[6]).toBe('');
                
            });

        });

        describe('for tuple 3 with row values {"id":4003},', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[3].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4003
                expect(values[0]).toBe('4003');

                // name should be set to ''
                expect(values[1]).toBe('');

                // url 
                expect(values[2]).toBe('');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4003.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('');

                // download_link 
                expect(values[5]).toBe('');

                // iframe 
                expect(values[6]).toBe('');
                
            });

        });

        describe('for tuple 4 with row values {"id":4004, "name": "weird & HTML < " },', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[4].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4004
                expect(values[0]).toBe('4004');

                // name should be set to '<p>weird &amp; HTML &lt;</p>'
                expect(values[1]).toBe('<p>weird &amp; HTML &lt;</p>\n');

                // url 
                expect(values[2]).toBe('');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4004.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('');

                // download_link 
                expect(values[5]).toBe('');

                // iframe 
                expect(values[6]).toBe('<p><div class="caption">weird &amp; HTML &lt;  caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>');
                
            });

        });

        describe('for tuple 5 with row values {"id":4005, "name": "<a href=\'javascript:alert();\'></a>" },', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[5].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4005
                expect(values[0]).toBe('4005');

                // name should be set to '<a href='javascript:alert();'></a>'
                expect(values[1]).toBe("<p>&lt;a href='javascript:alert();'&gt;&lt;/a&gt;</p>\n");

                // url 
                expect(values[2]).toBe('');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4005.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('');

                // download_link 
                expect(values[5]).toBe('');

                // iframe 
                expect(values[6]).toBe('<p><div class="caption">&lt;a href=\'javascript:alert();\'&gt;&lt;/a&gt; caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>');
                
            });

        });

        describe('for tuple 6 with row values {"id":4006, "name": "<script>alert();</script>" },', function() {

            var values;

            it("should return 7 values", function() {
                values = tuples[6].values;
                expect(values.length).toBe(7);
            });

            it("should validate id, name, url, image, image_with_size, download_link and iframe properties in values", function() {
                // id at index 0 should be set to 4006
                expect(values[0]).toBe('4006');

                // name should be set to '<p>weird &amp; HTML &lt;</p>'
                expect(values[1]).toBe('<p>&lt;script&gt;alert();&lt;/script&gt;</p>\n');

                // url 
                expect(values[2]).toBe('');

                // image 
                expect(values[3]).toBe('<p><img src="http://example.com/4006.png" alt="image"></p>\n');

                // image_with_size 
                expect(values[4]).toBe('');

                // download_link 
                expect(values[5]).toBe('');

                // iframe 
                expect(values[6]).toBe('<p><div class="caption">&lt;script&gt;alert();&lt;/script&gt; caption</div><iframe src="http://example.com/iframe" width="300" ></iframe></p>');
                
            });

        });

    });
};
