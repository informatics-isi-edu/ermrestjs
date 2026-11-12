const moment = require('moment-timezone');

exports.execute = function (options) {
  var module = options.includes.ermRest;
  var printf = module.printf;

  describe('printf,', function () {
    it('check type formatting for string, boolean, decimal, float, char, json, exponential, unsigned integer, hexadecimal and octal values', function () {
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
      expect(printf({ format: '%j' }, ['foo', 'bar'])).toBe('["foo","bar"]', '%j should be formatted as ["foo","bar"]');

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

    it('check precision for boolean and float,', function () {
      expect(printf({ format: '%.1t' }, true)).toBe('t', '%.1t should be formatted as t');
      expect(printf({ format: '%.1t' }, false)).toBe('f', '%.1t should be formatted as f');

      expect(printf({ format: '%.1f' }, -2.34)).toBe('-2.3', '%.1f should be formatted as -2.3');
      expect(printf({ format: '%.1f' }, -0.01)).toBe('-0.0', '%.1f should be formatted as -0.0');

      expect(printf({ format: '%.6f' }, 3.141592653589793)).toBe('3.141593', '%.6f should be formatted as 3.141593');
      expect(printf({ format: '%.3f' }, 3.141592653589793)).toBe('3.142', '%.3f should be formatted as 3.142');
      expect(printf({ format: '%.1f' }, 3.141592653589793)).toBe('3.1', '%.1f should be formatted as 3.1');
    });

    it('check sign for decimal, float and integer', function () {
      expect(printf({ format: '%+d' }, 2)).toBe('+2', '%+d should be formatted as +2');
      expect(printf({ format: '%+d' }, -2)).toBe('-2', '%+d should be formatted as -2');

      expect(printf({ format: '%+i' }, 2)).toBe('+2', '%+i should be formatted as +2');
      expect(printf({ format: '%+i' }, -2)).toBe('-2', '%+i should be formatted as -2');

      expect(printf({ format: '%+f' }, 2.2)).toBe('+2.2', '%+f should be formatted as +2.2');
      expect(printf({ format: '%+f' }, -2.2)).toBe('-2.2', '%+f should be formatted as -2.2');
    });

    it('check sign, padding and width for decimal, integer, float, string with right and left alignment and use space as default padding', function () {
      expect(printf({ format: '%+010d' }, -123)).toBe('-000000123', '%+010d should be formatted as -000000123');
      expect(printf({ format: '%+#_10d' }, -123)).toBe('______-123', '%+#_10d should be formatted as ______-123');

      expect(printf({ format: '%05d' }, -2)).toBe('-0002', '%05d should be formatted as -0002');
      expect(printf({ format: '%+05d' }, 2)).toBe('+0002', '%+05d should be formatted as +0002');

      expect(printf({ format: '%05i' }, -2)).toBe('-0002', '%05i should be formatted as -0002');
      expect(printf({ format: '%+05i' }, 2)).toBe('+0002', '%+05i should be formatted as +0002');

      expect(printf({ format: '%02u' }, 1234)).toBe('1234', '%02u should be formatted as 1234');

      expect(printf({ format: '%j' }, { foo: 'bar' })).toBe('{"foo":"bar"}', '%j should be formatted as {"foo":"bar"}');
      expect(printf({ format: '%j' }, ['foo', 'bar'])).toBe('["foo","bar"]', '%j should be formatted as ["foo","bar"]');
      expect(printf({ format: '%2j' }, { foo: 'bar' })).toBe('{\n  "foo": "bar"\n}', '%2j should be formatted as {\n  "foo": "bar"\n}');
      expect(printf({ format: '%2j' }, ['foo', 'bar'])).toBe('[\n  "foo",\n  "bar"\n]', '%2j should be formatted as [\n  "foo",\n  "bar"\n]');

      expect(printf({ format: '%5s' }, '<')).toBe('    <', '%5s should be formatted as "    <"');
      expect(printf({ format: '%5s' }, 'xxxxxxxx')).toBe('xxxxxxxx', '%5s should be formatted as xxxxxxxx for longer length value');
      expect(printf({ format: '%05s' }, '<')).toBe('0000<', '%05s should be formatted as 0000<');
      expect(printf({ format: '%#_5s' }, '<')).toBe('____<', '%#_5s should be formatted as ____<');

      // Left alignment
      expect(printf({ format: '%-5s' }, '>')).toBe('>    ', '%-5s should be formatted as ">    "');
      expect(printf({ format: '%0-5s' }, '>')).toBe('>0000', '%0-5s should be formatted as >0000');
      expect(printf({ format: '%#_-5s' }, '>')).toBe('>____', '%#_-5s should be formatted as >____');

      expect(printf({ format: '%-5d' }, -2)).toBe('-2   ', '%-5d should be formatted as "-2   "');
      expect(printf({ format: '%+-5i' }, 2)).toBe('+2   ', '%+-5i should be formatted as "+2   " with a sign');
      expect(printf({ format: '%+-5d' }, 2)).toBe('+2   ', '%+-5d should be formatted as "+2   " with a sign');
    });

    it('checks thousand separator', function () {
      expect(printf({ format: "%'15.3f" }, 10000.23456)).toBe('     10,000.235', '%\'15.3f should be formatted as "     10,000.235"');
      expect(printf({ format: "%'15d" }, 12345668)).toBe('     12,345,668', '%\'15d should be formatted as "     12,345,668"');
    });

    it('check sign, padding, width and precision and use space as default padding', function () {
      expect(printf({ format: '%5.1s' }, 'xxxxxxx')).toBe('    x', '%5.1s should be formatted as "    x"');
      expect(printf({ format: '%8.3f' }, -10.23456)).toBe(' -10.235', '%8.3f should be formatted as " -10.235"');
      expect(printf({ format: '%08.3f' }, -10.23456)).toBe('-010.235', '%08.3f should be formatted as -010.235');
      expect(printf({ format: '%#_10.3f' }, -10.23456)).toBe('___-10.235', '%#_10.3f should be formatted as ___-10.235');
      expect(printf({ format: '%+#_10.3f' }, 10.23456)).toBe('___+10.235', '%+#_10.3f should be formatted as ___+10.235');
      expect(printf({ format: '%+#_-10.3f' }, 10.23456)).toBe('+10.235___', '%+#_-10.3f should be formatted as +10.235___');

      expect(printf({ format: '%5.5s' }, 'xxxxxxx')).toBe('xxxxx', '%5.5s should be formatted as xxxxx');
    });

    it('check json key with other flags and padding', function () {
      expect(printf({ format: 'Hello %(who)s!' }, { who: 'world' })).toBe('Hello world!', 'Hello %(who)s! should be formatted as "Hello world!"');
      expect(
        printf(
          {
            format:
              'My name is %(name)s. My age is %(age)d years and I study at %(school.name)s located in %(school.location)s. My GPA is %(grade).2f',
          },
          { name: 'John Doe', age: 22, school: { name: 'USC', location: 'Los Angeles CA' }, grade: 3.9822 },
        ),
      ).toBe('My name is John Doe. My age is 22 years and I study at USC located in Los Angeles CA. My GPA is 3.98');
    });

    it('formats %g with significant digits', function () {
      expect(printf({ format: '%.6g' }, 3.141592653589793)).toBe('3.14159', '%.6g should be formatted as 3.14159');
      expect(printf({ format: '%.3g' }, 3.141592653589793)).toBe('3.14', '%.3g should be formatted as 3.14');
      expect(printf({ format: '%.1g' }, 3.141592653589793)).toBe('3', '%.1g should be formatted as 3');
      expect(printf({ format: '%.0g' }, 3.141592653589793)).toBe('3', '%.0g should be treated as %.1g');
      expect(printf({ format: '%.3g' }, 2.5)).toBe('2.5', '%.3g should drop trailing zeros');
      expect(printf({ format: '%.2g' }, 123456)).toBe('120000', '%.2g should be formatted as 120000');
      expect(printf({ format: '%.2g' }, 0.001234)).toBe('0.0012', '%.2g should be formatted as 0.0012');
      expect(printf({ format: '%+.3g' }, 3.14159)).toBe('+3.14', '%+.3g should be formatted as +3.14');
      expect(printf({ format: '%+.3g' }, -3.14159)).toBe('-3.14', '%+.3g should be formatted as -3.14');
      expect(printf({ format: '%08.3g' }, -3.14159)).toBe('-0003.14', '%08.3g should be formatted as -0003.14');
      expect(printf({ format: '%g' }, '1e3')).toBe('1000', '%g should be formatted as 1000');
      expect(printf({ format: '%g' }, '')).toBe('NaN', '%g of an empty string should be NaN');

      expect(() => printf({ format: '%g' }, 'abc')).toThrowError(TypeError);
      expect(() => printf({ format: '%.101g' }, 1)).toThrowError(RangeError);
    });

    it('keeps decimals with the thousand separator', function () {
      expect(printf({ format: "%'.2f" }, 1234.5)).toBe('1,234.50', "%'.2f should be formatted as 1,234.50");
      expect(printf({ format: "%'.2f" }, -1234.5)).toBe('-1,234.50', "%'.2f should be formatted as -1,234.50");
      expect(printf({ format: "%'.0f" }, 1234.5)).toBe('1,235', "%'.0f should be formatted as 1,235");
      expect(printf({ format: "%'.3g" }, 123456789)).toBe('123,000,000', "%'.3g should be formatted as 123,000,000");
      expect(printf({ format: "%'e" }, 123456)).toBe('1.23456e+5', "%'e should keep the exponent form");
      expect(printf({ format: "%'f" }, 1e21)).toBe('1e+21', "%'f should keep the exponent form");
    });

    it('formats NaN, exponent, and long decimal inputs', function () {
      expect(printf({ format: '%f' }, NaN)).toBe('NaN', '%f should be formatted as NaN');
      expect(printf({ format: '%+f' }, NaN)).toBe('+NaN', '%+f should be formatted as +NaN');
      expect(printf({ format: '%d' }, 5e-7)).toBe('0', '%d should be formatted as 0');
      expect(printf({ format: '%i' }, '3e2')).toBe('300', '%i should be formatted as 300');
      expect(printf({ format: '%X' }, '2.55e2')).toBe('FF', '%X should be formatted as FF');
      expect(printf({ format: '%d' }, '1.99999999999999999')).toBe('1', '%d should truncate long decimal strings without rounding');
      expect(printf({ format: '%d' }, '9007199254740991.9')).toBe('9007199254740991', '%d should truncate long decimal strings without rounding');
    });

    it('rejects unknown types', function () {
      expect(() => printf({ format: '%h' }, 1.5)).toThrowError(SyntaxError);
      expect(() => printf({ format: '%hd' }, 5)).toThrowError(SyntaxError);
      expect(() => printf({ format: '%z' }, 5)).toThrowError(SyntaxError);
    });

    it('parses array indexes in json keys', function () {
      const users = [{ name: 'Dolly' }, { name: 'Molly' }];
      expect(printf({ format: '%(users[0].name)s' }, { users })).toBe('Dolly', 'JS style index');
      expect(printf({ format: '%(users.1.name)s' }, { users })).toBe('Molly', 'handlebars style index');
      expect(printf({ format: '%(users.[1].name)s' }, { users })).toBe('Molly', 'handlebars style bracket index');
      expect(printf({ format: '%(users.0)s' }, { users: ['a'] })).toBe('a', 'trailing index');
      expect(printf({ format: '%([0].name)s' }, users)).toBe('Dolly', 'index on an array value');
      expect(printf({ format: '%(1.name)s' }, users)).toBe('Molly', 'handlebars style index on an array value');
      expect(printf({ format: '%([0][1])s' }, [['a', 'b']])).toBe('b', 'nested indexes');

      ['%(.[0])s', '%(1bad)s', '%(a..b)s', '%(a.[b])s', '%(a.0b)s', '%()s'].forEach((format) => {
        expect(() => printf({ format }, {})).toThrowError(SyntaxError);
      });
    });

    it('formats missing json keys', function () {
      expect(printf({ format: '%(x)s' }, {})).toBe('', '%(x)s should be empty');
      expect(printf({ format: '%(x)t' }, {})).toBe('false', '%(x)t should be false');
      expect(printf({ format: '%(x)d' }, {})).toBe('NaN', '%(x)d should be NaN');
    });

    it('formats dates in the given timezone', function () {
      const tstz = '2016-11-22 12:26:08-08:00';
      expect(printf({ format: 'YYYY-MM-DD HH:mm z', timezone: 'UTC' }, tstz, 'timestamptz')).toBe('2016-11-22 20:26 UTC', 'UTC');
      expect(printf({ format: 'YYYY-MM-DD HH:mm Z', timezone: 'Asia/Kathmandu' }, tstz, 'timestamptz')).toBe('2016-11-23 02:11 +05:45', 'Kathmandu');

      // values without a timezone are read in the viewer's timezone first
      const format = 'YYYY-MM-DD HH:mm Z';
      const ts = '2016-11-22 12:26:08';
      expect(printf({ format, timezone: 'Asia/Kathmandu' }, ts, 'timestamp')).toBe(moment(ts).tz('Asia/Kathmandu').format(format), 'timestamp');
      expect(printf({ format, timezone: 'Asia/Kathmandu' }, '2016-11-22', 'date')).toBe(
        moment('2016-11-22').tz('Asia/Kathmandu').format(format),
        'date',
      );

      // null is treated as no timezone
      expect(printf({ format, timezone: null }, tstz, 'timestamptz')).toBe(printf({ format }, tstz, 'timestamptz'), 'null timezone');

      expect(() => printf({ format, timezone: 'Bad/Zone' }, tstz, 'timestamptz')).toThrowError(Error);
    });

    it('should format dates, timestamps, timestamptz values properly.', function () {
      const testTimeWithTimezone = (value, format, isTimestamp, message) => {
        const res = moment(value).format(format);
        expect(printf({ format }, value, isTimestamp ? 'timestamptz' : 'date')).toBe(res, `${message} is not reformatted properly`);
      };

      // Date
      expect(printf({ format: 'YYYY-MM-DD' }, '2016-11-22', 'date')).toBe('2016-11-22', "'2016-11-22' is not reformatted properly");
      expect(printf({ format: 'MM-DD-YYYY' }, '2014-06-22', 'date')).toBe('06-22-2014', "'2014-06-22' is not reformatted properly");
      expect(printf({ format: 'MMM Do' }, '2017-03-12', 'date')).toBe('Mar 12th', "'2017-03-12' is not reformatted properly");
      expect(printf({ format: 'YY-M-D' }, '2012-01-06', 'date')).toBe('12-1-6', "'2012-01-06' is not reformatted properly");
      // make sure time values can still be output from a "date"
      testTimeWithTimezone('2016-11-22', 'YYYY-MM-DD HH:mm:ss.SSSZ', false, 'date with timezone');

      // Timestamp
      expect(printf({ format: 'YYYY-MM-DD' }, '2016-11-22 12:26:08', 'timestamp')).toBe(
        '2016-11-22',
        "'2016-11-22 12:26:08' is not reformatted properly",
      );
      expect(printf({ format: 'MM-DD-YYYY' }, '2014-06-22 18:03:56', 'timestamp')).toBe(
        '06-22-2014',
        "'2014-06-22 18:03:56' is not reformatted properly",
      );
      expect(printf({ format: 'MMM Do' }, '2017-03-12 02:03:04', 'timestamp')).toBe('Mar 12th', "'2017-03-12 02:03:04' is not reformatted properly");
      // verify just time values show properly with
      expect(printf({ format: 'HH:mm' }, '2016-09-27 13:26:06', 'timestamp')).toBe('13:26', "'2016-09-27 13:26:06' is not reformatted properly");
      expect(printf({ format: 'hh:mm a' }, '2016-09-27 13:26:06', 'timestamp')).toBe('01:26 pm', "'2016-09-27 13:26:06' is not reformatted properly");
      expect(printf({ format: 'hh:mm A' }, '2016-09-27 13:26:06', 'timestamp')).toBe('01:26 PM', "'2016-09-27 13:26:06' is not reformatted properly");
      expect(printf({ format: 'HH:mm:ss.SSS' }, '2016-09-27 13:26:06', 'timestamp')).toBe(
        '13:26:06.000',
        "'2016-09-27 13:26:06' is not reformatted properly",
      );
      testTimeWithTimezone('2016-09-27 13:26:06', 'HH:mm:ss.SSSZ', true, 'timestamp 01');

      // Timestamptz
      testTimeWithTimezone('2016-11-22 12:26:08-08:00', 'YYYY-MM-DD', true, 'timestamptz 01');
      testTimeWithTimezone('2014-06-22 18:03:56-07:00', 'MM-DD-YYYY', true, 'timestamptz 02');
      testTimeWithTimezone('2017-03-12 02:03:04-07:00', 'MMM Do', true, 'timestamptz 03');
      // verify just time values show properly with
      testTimeWithTimezone('2016-09-27 13:26:06-07:00', 'HH:mm', true, 'timestamptz 04');
      testTimeWithTimezone('2016-09-27 13:26:06-07:00', 'hh:mm a', true, 'timestamptz 05');
      testTimeWithTimezone('2016-09-27 13:26:06-07:00', 'hh:mm A', true, 'timestamptz 06');
      testTimeWithTimezone('2016-09-27 13:26:06-07:00', 'HH:mm:ss.SSS', true, 'timestamptz 07');
      testTimeWithTimezone('2016-09-27 13:26:06-07:00', 'HH:mm:ss.SSSZ', true, 'timestamptz 08');
    });
  });
};
