exports.execute = function (options) {
    var module = options.includes.ermRest;
    var formatUtils = module._formatUtils;
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
            expect(printInteger(.5)).toBe('1');
            expect(printInteger(-435.00)).toBe('-435');
            expect(printInteger(-1435.00)).toBe('-1,435');
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
            var testTime = '2011-05-06T08:25:25-07:00';
            expect(printTimestamp(null)).toBe('');
            /* Default behavior w/o options parameter = transform time via toLocaleString().
            Cannot use a static timestamp because toLocaleString() will return
            different values in different test environments. */
            expect(printTimestamp(testTime)).toBe(new Date(testTime).toLocaleString());
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
            expect(printMarkdown('*markdown*')).toBe('<p><em>markdown</em></p>\n');
            expect(printMarkdown('markdown')).toBe('<p>markdown</p>\n');
            expect(printMarkdown("![a random image](random_image.com)"))
                .toBe('<p><img src="random_image.com" alt="a random image"></p>\n');
            expect(printMarkdown('H~2~0')).toBe('<p>H<sub>2</sub>0</p>\n');
            expect(printMarkdown('13^th^')).toBe('<p>13<sup>th</sup></p>\n');
            
            // Check for iframe 
            expect(printMarkdown('::: iframe [Chaise](https://dev.isrd.isi.edu/chaise/search){width=800 height=300} \n:::'))
                .toBe('<p><div class="caption">Chaise</div><iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300" ></iframe></p>');
            
            // Check for anchor tags
            expect(printMarkdown('[NormalLink](https://dev.isrd.isi.edu/chaise/search)'))
                .toBe('<p><a href=\"https://dev.isrd.isi.edu/chaise/search\">NormalLink</a></p>\n');
        
            // Check for link tag with download attribute
            expect(printMarkdown('[Link With Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary}'))
                .toBe('<p><a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="btn btn-primary">Link With Download</a></p>\n');
            
            // Check for image tag with size
            expect(printMarkdown('**Image With Size** \n ![ImageWithSize](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=800 height=300}'))
                .toBe('<p><strong>Image With Size</strong>\n<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="800" height="300"></p>\n');
            
            // Check for iframe tag
            var iframeMarkdown = ':::iframe  [CAPTION](https://dev.isrd.isi.edu/chaise/search) \n:::';
            var iframeHTML = '<p><div class="caption">CAPTION</div><iframe src="https://dev.isrd.isi.edu/chaise/search" ></iframe></p>';
            expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);

            // Check for dropdown tag
            var dropdownMarkdown = ':::dropdown MYCAPTION{.btn-lg} [CAPTION1](https://dev.isrd.isi.edu/chaise/search){.btn .btn-danger} [CAPTION2](https://dev.isrd.isi.edu/chaise/search) [CAPTION3](https://dev.isrd.isi.edu/chaise/search) \n:::';
            var dropdownHTML = '<p><div class="btn-group markdown-dropdown"><button type="button"  class="btn btn-primary btn-lg">MYCAPTION</button><button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"  class="btn btn-primary dropdown-toggle btn-lg"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="https://dev.isrd.isi.edu/chaise/search" class="btn btn-danger" >CAPTION1</a></li><br><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION2</a></li><br><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION3</a></li></ul></div></p>';
            expect(printMarkdown(dropdownMarkdown)).toBe(dropdownHTML);  

            expect(printMarkdown(iframeMarkdown + "\n" + dropdownMarkdown)).toBe(iframeHTML + dropdownHTML);
        });

        it('printGeneSeq() should format gene sequences correctly.', function() {
            var printGeneSeq = formatUtils.printGeneSeq;
            expect(printGeneSeq(null)).toBe('');
            expect(printGeneSeq('sample', {increment: 0})).toBe('<code>sample</code>');
            var testCases = [
                {
                    input: 'as',
                    defaultFormat: '<code>as</code>',
                    negativeIncrement: '<code>a s</code>',
                    incrementOf5WithDashes: '<code>as</code>',
                },
                {
                    input: 'GATCTCGATGACTGAGAGGTA',
                    defaultFormat: '<code>GATCTCGATG ACTGAGAGGT A</code>',
                    negativeIncrement: '<code>G A T C T C G A T G A C T G A G A G G T A</code>',
                    incrementOf5WithDashes: '<code>GATCT-CGATG-ACTGA-GAGGT-A</code>',
                }
            ];

            for (var i = 0, len = testCases.length; i < len; i++) {
                var testCase = testCases[i];
                expect(printGeneSeq(testCase.input)).toBe(testCase.defaultFormat);
                expect(printGeneSeq(testCase.input, {increment: -34})).toBe(testCase.negativeIncrement);
                expect(printGeneSeq(testCase.input, {separator: '-', increment: 5})).toBe(testCase.incrementOf5WithDashes);
            }
        });

    });
};
