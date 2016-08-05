exports.execute = function(options) {

    describe('About the Column class, ', function() {
        var schemaName1 = "common_schema_1",
            schemaName2 = "common_schema_2";
        var table1_schema1, // has two outbound fks to table2_schema1. with foreign-key annotation.
            table2_schema1, // has outbound fk to table1_schema2.
            table1_schema2, // doesn't have any outbound foreignkeys. in different schema.
            catalog;

        beforeAll(function(done) {
            catalog = options.catalog;
            table1_schema1 = catalog.schemas.get(schemaName1).tables.get('table_1_schema_1');
            table2_schema1 = catalog.schemas.get(schemaName1).tables.get('table_2_schema_1');
            table1_schema2 = catalog.schemas.get(schemaName2).tables.get('table_1_schema_2');
            done();
        });

        // Test Cases:
        describe('a column in Table class, ', function() {
            var column;
            beforeAll(function() {
                column = table1_schema2.columns.getByPosition(2);
            });

            it('should be defined.', function() {
                expect(column).toBeDefined();
            });

            it('should have a .formatvalue property.', function() {
                expect(column.formatvalue).toBeDefined();
            });

            describe('the .formatvalue property, ', function() {
                var formatUtils = options.includes.ermRest._formatUtils;

                it('should be empty string if column value is null.', function() {
                    var column = table1_schema2.columns.getByPosition(2);
                    expect(column.formatvalue(null)).toEqual(jasmine.any(String));
                    expect(column.formatvalue(null)).toBe('');
                });

                describe('should call printText() to format,', function() {
                    var formattedValue = undefined;

                    it('text columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printText').and.callThrough();
                        var textCol = table1_schema2.columns.getByPosition(2);
                        formattedValue = textCol.formatvalue('text value');
                        expect(spy).toHaveBeenCalledWith('text value', undefined);
                        expect(formattedValue).toBe('text value');
                    });

                    it('longtext columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printText').and.callThrough();
                        var longtextCol = table1_schema2.columns.getByPosition(3);
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

                describe('should call printBoolean() to format,', function() {
                    it('boolean columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printBoolean').and.callThrough();
                        var col = table1_schema2.columns.getByPosition(5);

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

                xdescribe('should call printTimestamp() to format,', function() {
                    it('timestamptz columns correctly.', function() {
                        var spy = spyOn(formatUtils, 'printTimestamp').and.callThrough();
                        var col = table1_schema2.columns.getByPosition(6);
                        var formattedValue = col.formatvalue(true);
                        expect(spy).toHaveBeenCalled();
                        expect(formattedValue).toEqual(jasmine.any(String));
                        expect(formattedValue).toBe('true');
                    });
                });

                // describe('should call printDate()')
            });
        });
    });
};
