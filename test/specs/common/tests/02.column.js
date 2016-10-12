exports.execute = function(options) {

    describe('About the Column class, ', function() {
        var schemaName2 = 'common_schema_2', table1_schema2;

        beforeAll(function(done) {
            table1_schema2 = options.catalog.schemas.get(schemaName2).tables.get('table_1_schema_2');
            done();
        });

        // Test Cases:
        describe('a column in Table class, ', function() {
            var column;
            beforeAll(function() {
                column = table1_schema2.columns.get('table_1_text');
            });

            it('should be defined.', function() {
                expect(column).toBeDefined();
            });

            it('should have a getInputDisabled fn', function() {
                expect(column.getInputDisabled).toBeDefined();
            });

            describe('the .getInputDisabled fn, ', function() {
                it('in a create context, should return an object if the column is generated', function() {

                });

                describe('in an update context', function() {
                    it('should return true if the column is generated', function() {

                    });

                    it('should return true if the column is immutable', function() {

                    });
                });

                it('should return false if column is not generated or immutable', function() {

                });
            });

            it('should have a .formatvalue property.', function() {
                expect(column.formatvalue).toBeDefined();
            });

            describe('the .formatvalue property, ', function() {
                var formatUtils = options.includes.ermRest._formatUtils;

                describe('when column value is null, ', function() {
                    var columnWithAnnotation, columnWithoutAnnotation;

                    beforeAll(function(done){
                        columnWithAnnotation = table1_schema2.columns.get('table_1_show_nulls_annotation');
                        columnWithoutAnnotation = table1_schema2.columns.get('table_1_text');
                        done();
                    });

                    function runShowNullTestCases (column, testCases){
                        for(key in testCases){
                            expect(column.formatvalue(null, {context:key})).toBe(testCases[key]);
                        }
                    }
                    it('should return the value that is defined in its `show_nulls` display annotation based on context.', function() {
                        runShowNullTestCases(
                            columnWithAnnotation,
                            {"record": "empty", "detailed": "", "compact": "", "entry/edit": null, "*": "default"}
                        );
                    });
                    it('when the specified context is not defined in its `show_nulls` display annotation should return the value that is defined in default context .', function() {
                        runShowNullTestCases(columnWithAnnotation,{"filter": "default"});
                    });
                    it('when `show_nulls` annotation is not defined in column, should return the value that is defined in its table `show_nulls` display annotation based on context.', function() {
                        runShowNullTestCases(columnWithoutAnnotation, {"entry/create": "table"});
                    });
                    it('when `show_nulls` annotation is not defined in column or table, should return the value that is defined in its schema `show_nulls` display annotation based on context.', function() {
                        runShowNullTestCases(columnWithoutAnnotation, {"entry": "schema"});
                    });
                    it('when `show_nulls` annotation is not defined and context is `detailed`, should return null.', function() {
                        runShowNullTestCases(columnWithoutAnnotation, {"detailed": null});
                    });
                    it('when `show_nulls` annotation is not defined and context is not `detailed`, should return empty string.', function() {
                        runShowNullTestCases(columnWithoutAnnotation,{"filter": ""});
                    });
                    it('when context is not specified in options and default context is defined in annotation, should use the default context.', function() {
                        expect(columnWithAnnotation.formatvalue(null)).toBe("default");
                    });

                    it('when context is not specified in options and default context it not defined in annotation, should return an empty string.', function() {
                        expect(columnWithoutAnnotation.formatvalue(null)).toBe("");
                    });
                })


                describe('should call printText() to format,', function() {
                    var formattedValue = undefined;

                    it('text columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printText').and.callThrough();
                        var textCol = table1_schema2.columns.get('table_1_text');
                        formattedValue = textCol.formatvalue('text value');
                        expect(spy).toHaveBeenCalledWith('text value', undefined);
                        expect(formattedValue).toBe('text value');
                    });

                    it('longtext columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printText').and.callThrough();
                        var longtextCol = table1_schema2.columns.get('table_1_longtext');
                        var longtext = 'asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja';
                        formattedValue = longtextCol.formatvalue(longtext);
                        expect(spy).toHaveBeenCalledWith(longtext, undefined);
                        expect(formattedValue).toBe(longtext);
                    });

                    afterEach(function() {
                        expect(formattedValue).toEqual(jasmine.any(String));
                        formattedValue = undefined;
                    });
                });

                describe('should call printDate() to format,', function() {
                    it('date columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printDate').and.callThrough();
                        var testVal = '2016-05-02 13:00:00.00 PST';
                        var col = table1_schema2.columns.get('table_1_date');
                        var options = {separator: '.', leadingZero: false};
                        var formattedValue = col.formatvalue(testVal, options);
                        expect(spy).toHaveBeenCalledWith(testVal, options);
                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('2016.5.2');
                    });
                });

                describe('should call printBoolean() to format,', function() {
                    it('boolean columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printBoolean').and.callThrough();
                        var col = table1_schema2.columns.get('table_1_boolean');

                        var trueBoolean = col.formatvalue(true);
                        expect(spy).toHaveBeenCalledWith(true, undefined);
                        expect(trueBoolean).toEqual(jasmine.any(String));
                        expect(trueBoolean).toBe('true');

                        var falseBoolean = col.formatvalue(false);
                        expect(spy).toHaveBeenCalledWith(false, undefined);
                        expect(falseBoolean).toEqual(jasmine.any(String));
                        expect(falseBoolean).toBe('false');

                        expect(spy.calls.count()).toBe(2);
                    });
                });

                describe('should call printTimestamp() to format,', function() {
                    it('timestamptz columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printTimestamp').and.callThrough();
                        var testVal = '2011-05-06T08:25:25-07:00';
                        var col = table1_schema2.columns.get('table_1_timestamp');
                        var formattedValue = col.formatvalue(testVal);
                        expect(spy).toHaveBeenCalledWith(testVal, undefined);
                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe(new Date(testVal).toLocaleString());
                    });
                });

                describe('should call printFloat() to format,', function() {
                    var formattedValue = undefined;

                    it('float4 columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printFloat').and.callThrough();
                        var col = table1_schema2.columns.get('table_1_float4');
                        formattedValue = col.formatvalue(11.1);
                        expect(spy).toHaveBeenCalledWith(11.1, undefined);
                        expect(formattedValue).toBe('11.10');
                    });

                    it('float8 columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printFloat').and.callThrough();
                        var col = table1_schema2.columns.get('table_1_float8');
                        var options = {numDecDigits: 7};
                        formattedValue = col.formatvalue(234523523.023045230450245, options);
                        expect(spy).toHaveBeenCalledWith(234523523.023045230450245, options);
                        expect(formattedValue).toBe('234,523,523.0230452');
                    });

                    afterEach(function() {
                        expect(formattedValue).toEqual(jasmine.any(String));
                        formattedValue = undefined;
                    });
                });

                describe('should call printInteger() to format,', function() {
                    var formattedValue = undefined;

                    it('int2 columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printInteger').and.callThrough();
                        var col = table1_schema2.columns.get('table_1_int2');
                        var int2 = 32768;
                        formattedValue = col.formatvalue(int2);
                        expect(spy).toHaveBeenCalledWith(int2, undefined);
                        expect(formattedValue).toBe('32,768');
                    });

                    it('int4 columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printInteger').and.callThrough();
                        var col = table1_schema2.columns.get('table_1_int4');
                        var int4 = -2147483648;
                        formattedValue = col.formatvalue(int4);
                        expect(spy).toHaveBeenCalledWith(int4, undefined);
                        expect(formattedValue).toBe('-2,147,483,648');
                    });

                    it('int8 columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printInteger').and.callThrough();
                        var col = table1_schema2.columns.get('table_1_int8');
                        var int8 = 9007199254740991; // Max safe integer in JS
                        var options = {numDecDigits: 7};
                        formattedValue = col.formatvalue(int8);
                        expect(spy).toHaveBeenCalledWith(int8, undefined);
                        expect(formattedValue).toBe('9,007,199,254,740,991');
                    });

                    afterEach(function() {
                        expect(formattedValue).toEqual(jasmine.any(String));
                        formattedValue = undefined;
                    });
                });

                describe('should not call printMarkdown() to format,', function() {
                    it('Markdown columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printMarkdown').and.callThrough();
                        var testVal = '*taylor ^swift^*';
                        var col = table1_schema2.columns.get('table_1_markdown');
                        var formattedValue = col.formatvalue(testVal);
                        expect(spy).not.toHaveBeenCalledWith(testVal, undefined);
                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('*taylor ^swift^*');
                    });
                });

                describe('should call printGeneSeq() to format,', function() {
                    it('gene_sequence columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printGeneSeq').and.callThrough();
                        var testVal = 'GATCGATCGCGTATT';
                        var col = table1_schema2.columns.get('table_1_gene_sequence');
                        var formattedValue = col.formatvalue(testVal);
                        expect(spy).toHaveBeenCalledWith(testVal, undefined);
                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('<code>GATCGATCGC GTATT</code>');
                    });
                });
            });

        });
    });
};
