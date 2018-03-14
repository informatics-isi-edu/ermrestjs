exports.execute = function (options) {
    var module = options.includes.ermRest;
    var printf = module._printf;

    describe("printf,", function () {
    	it("check type formatting for string, boolean, decimal, float, char, json, exponential, unsigned integer, hexadecimal and octal values", function() {

    		expect(printf({ format: '%b' }, 2)).toBe('10', '%b should be formatted as 10');

    		expect(printf({ format: '%c' }, 65)).toBe('A', '%c should be formatted as A');

    		expect(printf({ format: '%i' }, 2)).toBe('2', '%i should be formatted as 2');
    		expect(printf({ format: '%i' }, '10')).toBe('10', '%i should be formatted as 10');
    		expect(printf({ format: '%i' }, -2)).toBe('-2', '%i should be formatted as -2');

    		expect(printf({ format: '%d' }, '10')).toBe('10', '%d should be formatted as 10');
    		expect(printf({ format: '%d' }, 10)).toBe('10', '%d should be formatted as 10');
    		expect(printf({ format: '%d' }, -10)).toBe('-10', '%d should be formatted as -10');

    		expect(printf({ format: '%s' }, '%s')).toBe('%s', '%s should be formatted as %s');
    		expect(printf({ format: '%j' }, { foo: 'bar' })).toBe('{"foo":"bar"}', '%j should be formatted as {"foo":"bar"}');
    		expect(printf({ format: '%j' }, ["foo","bar"])).toBe('["foo","bar"]', '%j should be formatted as ["foo","bar"]');

    		expect(printf({ format: '%e' }, 2)).toBe('2e+0', '%e should be formatted as 2e+0');

    		expect(printf({ format: '%u' }, 2)).toBe('2', '%u should be formatted as 2');
    		expect(printf({ format: '%u' }, -2)).toBe('4294967294', '%u should be formatted as 4294967294');

    		expect(printf({ format: '%f' }, 2.2)).toBe('2.2', '%f should be formatted as 2.2');
    		expect(printf({ format: '%f' }, -2.2)).toBe('-2.2', '%f should be formatted as -2.2');
    		expect(printf({ format: '%g' }, 3.141592653589793)).toBe('3.141592653589793', '%g should be formatted as 3.141592653589793');

    		expect(printf({ format: '%o' }, 8)).toBe('10', '%o should be formatted as 10');
    		expect(printf({ format: '%o' }, -8)).toBe('37777777770', '%o should be formatted as 37777777770');

    		expect(printf({ format: '%X' }, 255)).toBe('FF', '%X should be formatted as FF');
    		expect(printf({ format: '%X' }, -255)).toBe('FFFFFF01', '%X should be formatted as FFFFFF01');

    		expect(printf({ format: '%t' }, true)).toBe('true', '%t should be formatted as true');
    		expect(printf({ format: '%t', bool_true_value: 'Yes' }, true)).toBe('Yes', '%t should be formatted as Yes for true');
    		expect(printf({ format: '%t' }, false)).toBe('false', '%t should be formatted as false');
    		expect(printf({ format: '%t', bool_false_value: 'No' }, false)).toBe('No', '%t should be formatted as No for false');
    		expect(printf({ format: '%t' }, '')).toBe('false', '%t should be formatted as false for empty string value');
    		expect(printf({ format: '%t' }, 0)).toBe('false', '%t should be formatted as false for 0 value');
    	});

    	it('check precision for boolean and float,', function() {
    		expect(printf({ format: '%.1t' }, true)).toBe('t', '%.1t should be formatted as t');
    		expect(printf({ format: '%.1t' }, false)).toBe('f', '%.1t should be formatted as f');

    		expect(printf({ format: '%.1f' }, -2.34)).toBe('-2.3', '%.1f should be formatted as -2.3');
    		expect(printf({ format: '%.1f' }, -0.01)).toBe('-0.0', '%.1f should be formatted as -0.0');

    		expect(printf({ format: '%.6f' }, 3.141592653589793)).toBe('3.141593', '%.6f should be formatted as 3.14159');
    		expect(printf({ format: '%.3f' }, 3.141592653589793)).toBe('3.142', '%.3f should be formatted as 3.14');
    		expect(printf({ format: '%.1f' }, 3.141592653589793)).toBe('3.1', '%.1f should be formatted as 3');
    	});

    	it('check sign for decimal, float and integer', function() {
			expect(printf({ format: '%+d' }, 2)).toBe('+2', '%+d should be formatted as +2');
			expect(printf({ format: '%+d' }, -2)).toBe('-2', '%+d should be formatted as -2');

			expect(printf({ format: '%+i' }, 2)).toBe('+2', '%+i should be formatted as +2');
			expect(printf({ format: '%+i' }, -2)).toBe('-2', '%+i should be formatted as -2');

			expect(printf({ format: '%+f' }, 2.2)).toBe('+2.2', '%+f should be formatted as +2.2');
			expect(printf({ format: '%+f' }, -2.2)).toBe('-2.2', '%+f should be formatted as -2.2');
    	});

    	it('check sign, padding and width for decimal, integer, float, string with right and left alignment and use space as default padding', function() {
            expect(printf({ format: '%+010d' }, -123)).toBe('-000000123', '%+010d should be formatted as -000000123');
            expect(printf({ format: '%+#_10d' }, -123)).toBe('______-123', '%+#_10d should be formatted as ______-123');

            expect(printf({ format: '%05d' }, -2)).toBe('-0002', '%05d should be formatted as -0002');
            expect(printf({ format: '%+05d' }, 2)).toBe('+0002', '%05d should be formatted as +0002 with a sign');

            expect(printf({ format: '%05i' }, -2)).toBe('-0002', '%05i should be formatted as -0002');
            expect(printf({ format: '%+05i' }, 2)).toBe('+0002', '%05i should be formatted as +0002 with a sign');

            expect(printf({ format: '%02u' }, 1234)).toBe('1234', '%02u should be formatted as 1234');

            expect(printf({ format: '%j' }, { 'foo': 'bar' })).toBe('{"foo":"bar"}', '%2j should be formatted as {"foo":"bar"}');
            expect(printf({ format: '%j' }, ["foo", "bar"])).toBe('["foo","bar"]', '%2j should be formatted as ["foo","bar"]');
            expect(printf({ format: '%2j' }, { 'foo': 'bar' })).toBe('{\n  "foo": "bar"\n}', '%2j should be formatted as {\n  "foo": "bar"\n}');
            expect(printf({ format: '%2j' }, ["foo", "bar"])).toBe('[\n  "foo",\n  "bar"\n]', '%2j should be formatted as [\n  "foo",\n  "bar"\n]');

            expect(printf({ format: '%5s' }, '<')).toBe('    <', '%5s should be formatted as "    <"');
            expect(printf({ format: '%5s' }, 'xxxxxxxx')).toBe('xxxxxxxx', '%5s should be formatted as xxxxxxxx for longer length value');
            expect(printf({ format: '%05s' }, '<')).toBe('0000<', '%05s should be formatted as 0000<');
            expect(printf({ format: '%#_5s' }, '<')).toBe('____<', '%#_5s should be formatted as ____<');

            // Left alignment
            expect(printf({ format: '%-5s' }, '>')).toBe('>    ', '%-5s should be formatted as ">    "');
            expect(printf({ format: '%0-5s' }, '>')).toBe('>0000', '%0-s should be formatted as >0000');
            expect(printf({ format: '%#_-5s' }, '>')).toBe('>____', '%#_-s should be formatted as >____');

            expect(printf({ format: '%-5d' }, -2)).toBe('-2   ', '%-5d should be formatted as "-2   "');
            expect(printf({ format: '%+-5i' }, 2)).toBe('+2   ', '%+-5i should be formatted as "+2   " with a sign');
            expect(printf({ format: '%+-5d' }, 2)).toBe('+2   ', '%+-5i should be formatted as "+2   " with a sign');

        });

        it("checks thousand separator", function() {
        	expect(printf({ format: "%'15.3f" }, 10000.23456)).toBe('     10,000.235', '%15.3f should be formatted as "     10,000.235"');
        	expect(printf({ format: "%'15d" }, 12345668)).toBe('     12,345,668', '%15d should be formatted as "     12,345,668"')
        });

        it ("check sign, padding, width and precision and use space as default padding", function() {

            expect(printf({ format: '%5.1s' }, 'xxxxxxx')).toBe('    x', '%5.1f should be formatted as "    x"');
            expect(printf({ format: '%8.3f' }, -10.23456)).toBe(' -10.235', '%8.3f should be formatted as " -10.235"');
            expect(printf({ format: '%08.3f' }, -10.23456)).toBe('-010.235', '%08.3f should be formatted as -010.235');
            expect(printf({ format: '%#_10.3f' }, -10.23456)).toBe('___-10.235', '%#_10.3f should be formatted as ___-10.235');
            expect(printf({ format: '%+#_10.3f' }, 10.23456)).toBe('___+10.235', '%+#_10.3f should be formatted as ___+10.235');
            expect(printf({ format: '%+#_-10.3f' }, 10.23456)).toBe('+10.235___', '%+#_10.3f should be formatted as +10.235___');

            expect(printf({ format: '%5.5s' }, 'xxxxxxx')).toBe('xxxxx', '%5.5s should be formatted as xxxxx');
            expect(printf({ format: '%5.1s' }, 'xxxxxxx')).toBe('    x', '%5.1f should be formatted as "    x"');
        });

        it("check json key with other flags and padding", function() {
            expect(printf({ format: 'Hello %(who)s!' }, { who: 'world' })).toBe('Hello world!', 'Hello %(who)s! should be formatted as "Hello world!"');
            expect(printf({ format: 'My name is %(name)s. My age is %(age)d years and I study at %(school.name)s located in %(school.location)s. My GPA is %(grade).2f' },
                    { name: 'John Doe', age: 22, school: { name: 'USC',  location: 'Los Angeles CA' }, grade: 3.9822 }))
                .toBe('My name is John Doe. My age is 22 years and I study at USC located in Los Angeles CA. My GPA is 3.98');
        });

        it("should format dates, timestamps, timestamptz values properly.", function () {
            // Date
            expect(printf({ format: 'YYYY-MM-DD'}, "2016-11-22", "date")).toBe("2016-11-22", "'2016-11-22' is not reformatted properly");
            expect(printf({ format: 'MM-DD-YYYY'}, "2014-06-22", "date")).toBe("06-22-2014", "'2014-06-22' is not reformatted properly");
            expect(printf({ format: 'MMM Do'}, "2017-03-12", "date")).toBe("Mar 12th", "'2017-03-12' is not reformatted properly");
            expect(printf({ format: 'YY-M-D'}, "2012-01-06", "date")).toBe("12-1-6", "'2012-01-06' is not reformatted properly");
                // make sure time values can still be output from a "date"
            expect(printf({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ'}, "2016-11-22", "date")).toBe("2016-11-22 00:00:00.000-08:00", "'2016-11-22' is not reformatted properly");

            // Timestamp
            expect(printf({ format: 'YYYY-MM-DD'}, "2016-11-22 12:26:08", "timestamp")).toBe("2016-11-22", "'2016-11-22 12:26:08' is not reformatted properly");
            expect(printf({ format: 'MM-DD-YYYY'}, "2014-06-22 18:03:56", "timestamp")).toBe("06-22-2014", "'2014-06-22 18:03:56' is not reformatted properly");
            expect(printf({ format: 'MMM Do'}, "2017-03-12 02:03:04", "timestamp")).toBe("Mar 12th", "'2017-03-12 02:03:04' is not reformatted properly");
                // verify just time values show properly with
            expect(printf({ format: 'HH:mm'}, "2016-09-27 13:26:06", "timestamp")).toBe("13:26", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'hh:mm a'}, "2016-09-27 13:26:06", "timestamp")).toBe("01:26 pm", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'hh:mm A'}, "2016-09-27 13:26:06", "timestamp")).toBe("01:26 PM", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'HH:mm:ss.SSS'}, "2016-09-27 13:26:06", "timestamp")).toBe("13:26:06.000", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'HH:mm:ss.SSSZ'}, "2016-09-27 13:26:06", "timestamp")).toBe("13:26:06.000-07:00", "'2016-09-27 13:26:06' is not reformatted properly");

            // Timestamptz
            expect(printf({ format: 'YYYY-MM-DD'}, "2016-11-22 12:26:08-08:00", "timestamptz")).toBe("2016-11-22", "'2016-11-22 12:26:08' is not reformatted properly");
            expect(printf({ format: 'MM-DD-YYYY'}, "2014-06-22 18:03:56-07:00", "timestamptz")).toBe("06-22-2014", "'2014-06-22 18:03:56' is not reformatted properly");
            expect(printf({ format: 'MMM Do'}, "2017-03-12 02:03:04-07:00", "timestamptz")).toBe("Mar 12th", "'2017-03-12 02:03:04' is not reformatted properly");
                // verify just time values show properly with
            expect(printf({ format: 'HH:mm'}, "2016-09-27 13:26:06-07:00", "timestamptz")).toBe("13:26", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'hh:mm a'}, "2016-09-27 13:26:06-07:00", "timestamptz")).toBe("01:26 pm", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'hh:mm A'}, "2016-09-27 13:26:06-07:00", "timestamptz")).toBe("01:26 PM", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'HH:mm:ss.SSS'}, "2016-09-27 13:26:06-07:00", "timestamptz")).toBe("13:26:06.000", "'2016-09-27 13:26:06' is not reformatted properly");
            expect(printf({ format: 'HH:mm:ss.SSSZ'}, "2016-09-27 13:26:06-07:00", "timestamptz")).toBe("13:26:06.000-07:00", "'2016-09-27 13:26:06' is not reformatted properly");
        });

    });

};
