exports.execute = function(options) {

    describe('About the Column class, ', function() {
        var schemaName2 = 'common_schema_2',
            columnName = 'table_1_text',
            table1_schema2;

        beforeAll(function(done) {
            table1_schema2 = options.catalog.schemas.get(schemaName2).tables.get('table_1_schema_2');
            done();
        });

        // Test Cases:
        describe('a column in Table class, ', function() {
            var column;
            beforeAll(function() {
                column = table1_schema2.columns.get(columnName);
            });

            it('should be defined.', function() {
                expect(column).toBeDefined();
            });

            it('should have properties defined in the constructor.', function() {
                expect(column.position).not.toBeDefined();
                expect(column.table).toBeDefined();
                expect(column.name).toBe(columnName);

                expect(column.type).toEqual(jasmine.any(Object));
                expect(column.type.name).toBe("text");

                expect(column.nullok).toBeTruthy();
                expect(column.comment).toBeNull();
                expect(column.ignore).toBeFalsy();
                expect(column.annotations).toEqual(jasmine.any(Object));

                expect(column.displayname.isHTML).toBeFalsy();
                expect(column.displayname.value).toBe(columnName);
                expect(column.displayname.unformatted).toBe(columnName);

                expect(column.memberOfKeys).toEqual(jasmine.any(Array));
                expect(column.memberOfKeys.length).toBe(0);
                expect(column.memberOfForeignKeys).toEqual(jasmine.any(Array));
                expect(column.memberOfForeignKeys.length).toBe(0);
            });

            it('should have nullok false if required annotation is present.', function() {
                expect(table1_schema2.columns.get('table_1_required').nullok).toBeFalsy();
            });

            it('should have a .getInputDisabled method', function() {
                expect(column.getInputDisabled).toBeDefined();
            });

            describe('the .getInputDisabled method, ', function() {
                var contexts, immutableCol, generatedCol, serialCol;
                beforeAll(function() {
                    contexts = options.includes.ermRest._contexts;
                    generatedCol = table1_schema2.columns.get('table_1_generated');
                    immutableCol = table1_schema2.columns.get('table_1_immutable');
                    serialCol = table1_schema2.columns.get('table_1_serial4');
                });

                it('should return false if column is not generated or immutable or of serial type', function() {
                    // Using the existing column from previous it specs.. this column is text type and has no immutable or generated annotations
                    var result1 = column.getInputDisabled(contexts.CREATE);
                    expect(result1).toBe(false);
                    var result2 = column.getInputDisabled(contexts.EDIT);
                    expect(result2).toBe(false);
                });


                describe('in a create context, ', function() {
                    var result = null;

                    afterEach(function() {
                        expect(typeof result).toEqual('object');
                        expect(result.hasOwnProperty('message')).toBe(true);
                        expect(result.message).toBe('Automatically generated');
                        result = null;
                    });

                    it('should return an object with a message if the column is generated', function() {
                        result = generatedCol.getInputDisabled(contexts.CREATE);
                    });

                    it('should return an object with a message if the column\'s type is serial', function() {
                        result = serialCol.getInputDisabled(contexts.CREATE);
                    });
                });

                describe('in an update context, ', function() {
                    it('should return true if the column is generated', function() {
                        var result = generatedCol.getInputDisabled(contexts.EDIT);
                        expect(result).toBe(true);
                    });

                    it('should return true if the column is immutable', function() {
                        var result = immutableCol.getInputDisabled(contexts.EDIT);
                        expect(result).toBe(true);
                    });

                    it('should return true if the column\'s type is serial', function() {
                        var result = serialCol.getInputDisabled(contexts.EDIT);
                        expect(result).toBe(true);
                    })
                });
            });

            it('should have a .formatvalue property.', function() {
                expect(column.formatvalue).toBeDefined();
            });

            describe('the .formatvalue property, ', function() {
                var formatUtils = options.includes.ermRest._formatUtils;

                var testFormatvalue = function (colName, value, expected, errMessage) {
                    expect(table1_schema2.columns.get(colName).formatvalue(value)).toEqual(expected, errMessage ? errMessage : "");
                }

                describe('when column value is null, ', function() {
                    var columnWithAnnotation, columnWithoutAnnotation;

                    beforeAll(function(done){
                        columnWithAnnotation = table1_schema2.columns.get('table_1_show_null_annotation');
                        columnWithoutAnnotation = table1_schema2.columns.get(columnName);
                        done();
                    });

                    function runShowNullTestCases (column, testCases){
                        for(key in testCases){
                            expect(column.formatvalue(null, key)).toBe(testCases[key], "missmatch for context=" + key);
                        }
                    }
                    it('should return the value that is defined in its `show_null` display annotation based on context.', function() {
                        runShowNullTestCases(
                            columnWithAnnotation,
                            {"compact/brief": "empty", "detailed": "", "entry/edit": null}
                        );
                    });
                    it ("should use `show_nulls` if `show_null` is not defined in display annotation for the context.", function () {
                        runShowNullTestCases(columnWithAnnotation, {"compact": "backward compatibility", "*": "default"});
                    });

                    it('when the specified context is not defined in its `show_null` display annotation should return the value that is defined in default context .', function() {
                        runShowNullTestCases(columnWithAnnotation,{"filter": "default"});
                    });
                    it('when `show_null` annotation is not defined in column, should return the value that is defined in its table `show_null` display annotation based on context.', function() {
                        runShowNullTestCases(columnWithoutAnnotation, {"entry/create": "table"});
                    });
                    it('when `show_null` annotation is not defined in column or table, should return the value that is defined in its schema `show_null` display annotation based on context.', function() {
                        runShowNullTestCases(columnWithoutAnnotation, {"entry": "schema"});
                    });
                    it('when `show_null` annotation is not defined and context is `detailed`, should return null.', function() {
                        runShowNullTestCases(columnWithoutAnnotation, {"detailed": null});
                    });
                    it('when `show_null` annotation is not defined and context is not `detailed`, should return empty string.', function() {
                        runShowNullTestCases(columnWithoutAnnotation,{"filter": ""});
                    });
                    it('when context is not specified in options and default context is defined in annotation, should use the default context.', function() {
                        expect(columnWithAnnotation.formatvalue(null)).toBe("default");
                    });

                    it('when context is not specified in options and default context it not defined in annotation, should return an empty string.', function() {
                        expect(columnWithoutAnnotation.formatvalue(null)).toBe("");
                    });
                });

                it ("should not format the value if column is part of a simple key.", function () {
                    var col = table1_schema2.columns.get("table_1_int_key");
                    expect(col.formatvalue("1234567")).toBe("1234567", "int missmatch.");
                    col = table1_schema2.columns.get("table_1_serial_key");
                    expect(col.formatvalue("1234567")).toBe("1234567", "int missmatch.");
                });

                describe('should call printText() to format,', function() {
                    formattedValue = undefined;

                    it('text columns correctly.', function() {
                        var textCol = table1_schema2.columns.get(columnName);
                        formattedValue = textCol.formatvalue('text value');

                        expect(formattedValue).toBe('text value');
                    });

                    it('longtext columns correctly.', function() {
                        var longtextCol = table1_schema2.columns.get('table_1_longtext');
                        var longtext = 'asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja';
                        formattedValue = longtextCol.formatvalue(longtext);

                        expect(formattedValue).toBe(longtext);
                    });

                    afterEach(function() {
                        expect(formattedValue).toEqual(jasmine.any(String));
                        formattedValue = undefined;
                    });
                });

                describe('should call printDate() to format,', function() {
                    it('date columns correctly.', function() {
                        var testVal = '2016/05/02 13:00:00.00 PST';
                        var col = table1_schema2.columns.get('table_1_date');
                        var formattedValue = col.formatvalue(testVal);

                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('2016-05-02');
                    });
                });

                describe('should call printBoolean() to format,', function() {
                    it('boolean columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_boolean');

                        var trueBoolean = col.formatvalue(true);
                        expect(trueBoolean).toEqual(jasmine.any(String));
                        expect(trueBoolean).toBe('true');

                        var falseBoolean = col.formatvalue(false);
                        expect(falseBoolean).toEqual(jasmine.any(String));
                        expect(falseBoolean).toBe('false');
                    });
                });

                describe('should call printTimestamp() to format,', function() {
                    it('timestamptz columns correctly.', function() {
                        var testVal = '2011-05-06T08:25:25-07:00';
                        var col = table1_schema2.columns.get('table_1_timestamp');
                        var formattedValue = col.formatvalue(testVal);

                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe(options.ermRest._moment(testVal).format(options.ermRest._dataFormats.DATETIME.display));
                    });
                });

                describe('should call printFloat() to format,', function() {
                    var formattedValue = undefined;

                    it('float4 columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_float4');
                        formattedValue = col.formatvalue(11.1);

                        expect(formattedValue).toBe('11.1000');
                    });

                    it('float8 columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_float8');
                        var options = {numFracDigits: 7};
                        formattedValue = col.formatvalue(234523523.023045230450245, null, options);

                        expect(formattedValue).toBe('234,523,523.0230452');
                    });

                    it('numeric columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_numeric');
                        var options = {numFracDigits: 8};
                        formattedValue = col.formatvalue(456456.234682307474076, null, options);

                        expect(formattedValue).toBe('456,456.23468231');
                    })

                    afterEach(function() {
                        expect(formattedValue).toEqual(jasmine.any(String));
                        formattedValue = undefined;
                    });
                });

                describe('should call printInteger() to format,', function() {
                    var formattedValue = undefined;

                    it('int2 columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_int2');
                        var int2 = 32768;
                        formattedValue = col.formatvalue(int2);

                        expect(formattedValue).toBe('32,768');
                    });

                    it('int4 columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_int4');
                        var int4 = -2147483648;
                        formattedValue = col.formatvalue(int4);

                        expect(formattedValue).toBe('-2,147,483,648');
                    });

                    it('int8 columns correctly.', function() {
                        var col = table1_schema2.columns.get('table_1_int8');
                        var int8 = 9007199254740991; // Max safe integer in JS
                        var options = {numFracDigits: 7};
                        formattedValue = col.formatvalue(int8);

                        expect(formattedValue).toBe('9,007,199,254,740,991');
                    });

                    afterEach(function() {
                        expect(formattedValue).toEqual(jasmine.any(String));
                        formattedValue = undefined;
                    });
                });

                describe('should not call renderMarkdown() to format,', function() {
                    it('Markdown columns correctly.', function() {
                        var testVal = '*taylor ^swift^*';
                        var col = table1_schema2.columns.get('table_1_markdown');
                        var formattedValue = col.formatvalue(testVal);

                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('*taylor ^swift^*');
                    });
                });

                describe('should call printGeneSeq() to format,', function() {
                    it('gene_sequence columns correctly.', function() {
                        var testVal = 'GATCGATCGCGTATT';
                        var col = table1_schema2.columns.get('table_1_gene_sequence');
                        var formattedValue = col.formatvalue(testVal);

                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('<code>GATCGATCGC GTATT</code>');
                    });
                });

                describe('should call printColor() to format,', function () {
                    it('color_rgb_hex columns correctly.', function () {
                        testFormatvalue('table_1_color_rgb_hex', null, '', 'empty value');
                        testFormatvalue('table_1_color_rgb_hex', '00ff00', '', 'invalid value 1');
                        testFormatvalue('table_1_color_rgb_hex', '#00kj00', '', 'invalid value 2');
                        testFormatvalue('table_1_color_rgb_hex', '#00ff00', ':span: :/span:{.chaise-color-preview style=background-color:#00FF00} #00FF00', 'valid value');
                    });
                });

                describe('should handle array columns.', function () {
                    var cases = [
                        {
                            type: "text",
                            column: "table_1_text_array",
                            tests: [
                                {value: ["val 1", "val 2", null, ""], expected: ["val 1", "val 2", null, ""]}
                            ]
                        },
                        {
                            type: "boolean",
                            column: "table_1_boolean_array",
                            tests: [
                                {value: [true, null, false], expected: ["true", null, "false"]}
                            ]
                        },
                        {
                            type: "date",
                            column: "table_1_date_array",
                            tests: [
                                {value: ["2016/05/02 13:00:00.00 PST", null, "2015/03/02 13:00:00.00 PST"], expected: ["2016-05-02", null, "2015-03-02"]}
                            ]
                        },
                        {
                            type: "timestamp",
                            column: "table_1_timestamp_array",
                            tests: [
                                {value: ["2016/05/02 13:00:00", null, "2015/03/02 14:00:00"], expected: ["2016-05-02 13:00:00", null, "2015-03-02 14:00:00"]}
                            ]
                        },
                        {
                            type: "float4",
                            column: "table_1_float4_array",
                            tests: [
                                {value: [31231.1, null, 2413.3], expected: ['31,231.1000', null, '2,413.3000']}
                            ]
                        },
                        {
                            type: "float8",
                            column: "table_1_float8_array",
                            tests: [
                                {value: [234523523.1, null, 241235.3], expected: ['234,523,523.1000', null, '241,235.3000']}
                            ]
                        },
                        {
                            type: "numeric",
                            column: "table_1_numeric_array",
                            tests: [
                                {value: [1223, null, 4133], expected: ['1,223.0000', null, '4,133.0000']}
                            ]
                        },
                        {
                            type: "int2",
                            column: "table_1_int2_array",
                            tests: [
                                {value: [4031, null, 32768], expected: ['4,031', null, '32,768']}
                            ]
                        },
                        {
                            type: "int4",
                            column: "table_1_int4_array",
                            tests: [
                                {value: [-2147483648, null, 214748364], expected: ['-2,147,483,648', null, '214,748,364']}
                            ]
                        },
                        {
                            type: "int8",
                            column: "table_1_int8_array",
                            tests: [
                                {value: [9007199254740991, null, 9007199254740990], expected: ['9,007,199,254,740,991', null, '9,007,199,254,740,990']}
                            ]
                        }
                    ];

                    cases.forEach(function (c) {
                        it ("for column type " + c.type + ".", function () {
                            c.tests.forEach(function (t) {
                                testFormatvalue(c.column, t.value, t.expected, t.errMessage);
                            });
                        });
                    });
                });
            });

            describe('column defaults, ', function () {
                var table;
                var tableName = "table_w_defaults",
                    nullColumns = [
                        "boolean_improper", "date_improper", "timestamp_improper", "timestamptz_improper",
                        "float4_improper", "float8_improper", "numeric_improper", "int2_improper", "int4_improper",
                        "int8_improper", "color_rgb_hex_improper_1", "color_rgb_hex_improper_2",
                        "RID", "RCB", "RMB", "RCT", "RMT"
                    ],
                    notNullColumns = [
                        "boolean_proper", "date_proper", "timestamp_proper",
                        "timestamptz_proper", "float4_proper", "float8_proper", "numeric_proper",
                        "int2_proper", "int4_proper", "int8_proper", "color_rgb_hex_proper"
                    ];

                beforeAll(function (done) {
                    table = options.catalog.schemas.get(schemaName2).tables.get(tableName);
                    done();
                });

                for (var i=0; i<nullColumns.length; i++) {
                    (function(columnName) {
                        it("for column `" + columnName + "`, default should be null", function (done) {
                            var column = table.columns.get(columnName);
                            expect(column.default).toBeNull("default is not set properly");
                            done();
                        });
                    }) (nullColumns[i]);
                }

                for (var i=0; i<notNullColumns.length; i++) {
                    (function(columnName) {
                        it("for column `" + columnName + "`, default should not be null", function (done) {
                            var column = table.columns.get(columnName);
                            expect(column.default).not.toBeNull("default is not set properly");
                            done();
                        });
                    }) (notNullColumns[i]);
                }
            });

            describe('being a system column, ', function(){
                var systemColumns = ["RID", "RCB", "RMB", "RCT", "RMT"];
                var comments = {
                    "RID": "Persistent, citable resource identifier",
                    "RCB": "Record creator",
                    "RMB": "Record last modifier",
                    "RCT": "Record creation timestamp",
                    "RMT": "Record last modified timestamp"
                };

                it('should have a default comment.', function(){
                    for(var i=0;i<systemColumns.length;i++){
                        expect(table1_schema2.columns.get(systemColumns[i]).comment).toBe(comments[systemColumns[i]], "Column "+ systemColumns[i]+ " doesn't have the correct default comment.");
                    }
                });
            });
        });
    });
};
