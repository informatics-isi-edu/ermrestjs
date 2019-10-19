exports.execute = function (options) {

    describe("testing pre-format annotation,", function () {

        var catalog_id = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_pre_format_values",
            lowerLimit = 3999,
            upperLimit = 4003,
            limit = 3;

        var multipleEntityUri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":"
            + tableName + "/id::gt::" + lowerLimit + "&id::lt::" + upperLimit + "/@sort(id)";

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
         * @desc
         * This function checks for the value of a particular tuple at the tupleIndex
         * and a particular column value at the specified valuedIndex
         */
        var checkValue = function(columnName, tupleIndex, valueIndex, expectedValues) {

            it("should check " + columnName + " to be `" + expectedValues[valueIndex] + "`", function() {
                var tuple = tuples[tupleIndex];
                var value = tuple.values[valueIndex];
                var expectedValue = expectedValues[valueIndex];

                // Check value is same as expected
                expect(value).toBe(expectedValue);
            });

        };

        describe("testing tuple values for format", function() {
            var testObjects = [{
                "expectedValues": ["4000","Hank","http://example.com/google.com","No","10000000000 1024 1024 1.024e+3","   0.234","<pre>null</pre>", "", ""]
            },
            {
                "expectedValues": ["4001","Harold", "","Yes","", "10,000.345", "<pre>My name is Harold Durden. My age is 29 years and I study at USC located in Los Angeles, CA. My GPA is 3.93</pre>", "", ""]
            },
            {
                "expectedValues": ["4002", null, "http://example.com/google.com","","10001100101001 9001 9001 9.001e+3","","<pre>null</pre>", "<p>YES, NOPE, <em>No value</em></p>\n", "<p>2.340, 2.400, <em>No value</em></p>\n"]
            }];

            var i = 0;

            testObjects.forEach(function(obj, i) {
                checkValue("id", i, 0, testObjects[i].expectedValues);
                checkValue("name", i, 1, testObjects[i].expectedValues);
                checkValue("url", i, 2, testObjects[i].expectedValues);
                checkValue("isvalid", i, 3, testObjects[i].expectedValues);
                checkValue("numeric", i, 4, testObjects[i].expectedValues);
                checkValue("float", i, 5, testObjects[i].expectedValues);
                checkValue("json", i, 6, testObjects[i].expectedValues);
                checkValue("array_boolean", i, 7, testObjects[i].expectedValues);
                checkValue("array_float", i, 8, testObjects[i].expectedValues);
                i++;
            });
        });

    });

};
