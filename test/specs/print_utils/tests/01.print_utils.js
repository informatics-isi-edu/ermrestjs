exports.execute = function (options) {
    var formatUtils = options.includes.ermRest._formatUtils;
    describe("For pretty printing values based on a value's type, ", function () {
        // Test Cases:
        it('printFloat() should format floats correctly.', function () {
            var printFloat = formatUtils.printFloat;
            var options = {numDecDigits: 4};
            expect(printFloat(null)).toBe('');
            expect(printFloat(1234.0, options)).toBe('1,234.0000');
            expect(printFloat(23.0)).toBe('23.00');
            expect(printFloat(.000)).toBe('0.00');
        });

        it('printBoolean() should format booleans correctly.', function () {
            var printBoolean = formatUtils.printBoolean;
            expect(printBoolean(null)).toBe('');
            expect(printBoolean(true)).toBe('true');
            expect(printBoolean(false)).toBe('false');
        });

        it('printInteger() should format integers correctly.', function () {
            var printInteger = formatUtils.printInteger;
            expect(printInteger(null)).toBe('');
            expect(printInteger(12341234)).toBe('12,341,234');
            expect(printInteger(0001)).toBe('1');
            expect(printInteger(233)).toBe('233');
            expect(printInteger(23.)).toBe('23');
            expect(printInteger(23.000000000)).toBe('23');
            expect(printInteger(.0000)).toBe('0');
            expect(printInteger(23.101)).toBe('23');
            expect(printInteger(.1)).toBe('0');
        });

        it('printDate() should format dates correctly.', function () {
            var printDate = formatUtils.printDate;
            expect(printDate(null)).toBe('');
            expect(printDate('2012-04-25 13:00:00.00 PST', {
                separator: '.',
                leadingZero: true
            })).toBe('2012.04.25');
            expect(function() {
                printDate(123.45)
            }).toThrowError(module.InvalidInputError);
        });

        it('printTimestamp() should format timestamps correctly.', function () {
            var printTimestamp = formatUtils.printTimestamp;
            var testTime = new Date();
            expect(printTimestamp(null)).toBe('');
            /* Default behavior w/o options parameter = transform time via toLocaleString().
            Cannot use a static timestamp because toLocaleString() will return
            different values in different test environments. */
            expect(printTimestamp(testTime)).toBe(testTime.toLocaleString());
            expect(function() {
                printTimestamp()
            }).toThrowError(module.InvalidInputError);
        });

        it('printText() should format text correctly.', function() {
            var printText = formatUtils.printText;
            expect(printText(null)).toBe('');
            expect(printText("<b>Some text! &amp;</b>")).toBe('<b>Some text! &amp;</b>');
        });

        it('printMarkdown() should process Markdown into HTML.', function() {
            var printMarkdown = formatUtils.printMarkdown;
            expect(printMarkdown(null)).toBe('');
            expect(printMarkdown('*markdown*')).toBe('<em>markdown</em>');
            expect(printMarkdown('markdown')).toBe('markdown');
            expect(printMarkdown("![a random image](random_image.com)"))
                .toBe('<img src="random_image.com" alt="a random image">');
            expect(printMarkdown('H~2~0')).toBe('H<sub>2</sub>0');
            expect(printMarkdown('13^th^')).toBe('13<sup>th</sup>');
        });
    });
};
