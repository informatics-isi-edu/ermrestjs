const { templates } = require("handlebars");

exports.execute = function (options) {
    var module = options.includes.ermRest;
    var formatUtils = module._formatUtils;
    describe("Print utils, For pretty printing values based on a value's type, ", function () {
        // Test Cases:
        it('printFloat() should format floats correctly.', function () {
            var printFloat = formatUtils.printFloat;
            var options = {numFracDigits: 4};
            expect(printFloat(null)).toBe('');
            expect(printFloat(1234.0, options)).toBe('1,234.0000');
            expect(printFloat(23.0)).toBe('23.0000');
            expect(printFloat(.000)).toBe('0.0000');
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
            expect(printDate('2012-04-25 13:00:00.00 PST')).toBe('2012-04-25');
            expect(function() {
                printDate(123.45)
            }).toThrowError(module.InvalidInputError);
        });

        it('printTimestamp() should format timestamps correctly.', function () {
            var printTimestamp = formatUtils.printTimestamp;
            var testTime = '2011-05-06T13:25:25-07:00';
            expect(printTimestamp(null)).toBe('');
            expect(printTimestamp(testTime)).toBe('2011-05-06 13:25:25');
            expect(function() {
                printTimestamp()
            }).toThrowError(module.InvalidInputError);
        });

        it('printText() should format text correctly.', function() {
            var printText = formatUtils.printText;
            expect(printText(null)).toBe('');
            expect(printText("<b>Some text! &amp;</b>")).toBe('<b>Some text! &amp;</b>');
            expect(printText({key:123})).toBe('{"key":123}');
            expect(printText({key:123,subkey:{subsubkey:456}})).toBe('{"key":123,"subkey":{"subsubkey":456}}');
        });

        it('printJSON() should show stringified version of JSON value.', function() {
            var printJSON = formatUtils.printJSON;
            expect(printJSON(null)).toBe('null');
            expect(printJSON('')).toBe('null');
            expect(printJSON(true)).toBe('true');
            expect(printJSON(false)).toBe('false');
            expect(printJSON(2.9)).toBe('2.9');
            let valueToTest={"name":"testing"};
            let expectedJSON= JSON.stringify(valueToTest,undefined,2);
            expect(printJSON(valueToTest)).toBe(expectedJSON);
        });

        describe("printMarkdown(), ", function () {
            var printMarkdown = formatUtils.printMarkdown;
            var testPrintMarkdown = function (input, expected, inline, error) {
                expect(printMarkdown(input, {inline: inline})).toBe(expected, error);
            };

            it ("should return the input if it's invalid format.", function () {
                expect(formatUtils.printMarkdown("[test](test\r.com){.download download}", {inline: true})).toBe("[test](test\r.com){.download download}");
            });

            describe ("should support default markdown tags.", function () {
                var testMarkdown = function (markdown, expected, message) {
                    if (message) {
                        expect(printMarkdown(markdown)).toBe(expected, message);
                    } else {
                        expect(printMarkdown(markdown)).toBe(expected);
                    }
                };

                it ("paragraph", function () {
                    testMarkdown('markdown', '<p>markdown</p>\n');
                });

                it ("strong", function () {
                    testMarkdown('*markdown*', '<p><em>markdown</em></p>\n', "case 1");
                    testMarkdown('_markdown_', '<p><em>markdown</em></p>\n', "case 2");

                });

                it ("emphasis", function () {
                    testMarkdown('**markdown**', '<p><strong>markdown</strong></p>\n', "case 1");
                    testMarkdown('__markdown__', '<p><strong>markdown</strong></p>\n', "case 2");
                    testMarkdown('*foo**bar**baz*', '<p><em>foo<strong>bar</strong>baz</em></p>\n', "case 3 (combination of strong and em)");
                });

                it ("heading 1", function () {
                    testMarkdown("# heading 1", "<h1>heading 1</h1>\n");
                });

                it ("heading 2", function () {
                    testMarkdown("## heading 2", "<h2>heading 2</h2>\n");
                });

                it ("link", function () {
                    testMarkdown('[NormalLink](https://dev.isrd.isi.edu/chaise/search)', '<p><a href=\"https://dev.isrd.isi.edu/chaise/search\">NormalLink</a></p>\n');
                });

                it ("image", function () {
                    testMarkdown("![a random image](random_image.com)", '<p><img src="random_image.com" alt="a random image" class="-chaise-post-load"></p>\n');
                });

                it ("block quote", function () {
                    testMarkdown("> some quote", "<blockquote>\n<p>some quote</p>\n</blockquote>\n");
                });

                it ("unordered list", function () {
                    testMarkdown("- item 1\n- item 2\n- item 3", "<ul>\n<li>item 1</li>\n<li>item 2</li>\n<li>item 3</li>\n</ul>\n", "case1");
                    testMarkdown("- item 1\n\n\n- item 2\n- item 3", "<ul>\n<li>\n<p>item 1</p>\n</li>\n<li>\n<p>item 2</p>\n</li>\n<li>\n<p>item 3</p>\n</li>\n</ul>\n", "case2 (with extra spacing)");

                    testMarkdown("- item 1\n\n :span::/span:\n- item 2\n- item 3", "<ul>\n<li>item 1</li>\n</ul>\n<p>:span::/span:</p>\n<ul>\n<li>item 2</li>\n<li>item 3</li>\n</ul>\n", "case2 (with span)");
                });

                it ("ordered list", function () {
                    testMarkdown("1. item 1\n2. item 2\n3. item 3", "<ol>\n<li>item 1</li>\n<li>item 2</li>\n<li>item 3</li>\n</ol>\n");
                });

                it ("hr rule", function () {
                    testMarkdown("Horizontal rule: \n\n---", "<p>Horizontal rule:</p>\n<hr>\n", "case 1");
                    testMarkdown("Horizontal rule: \n\n***", "<p>Horizontal rule:</p>\n<hr>\n", "case 2");
                });

                it ("inline code block", function () {
                    testMarkdown("`inline code` with backticks", "<p><code>inline code</code> with backticks</p>\n");
                });

                it ("code block", function () {
                    testMarkdown("```\n # code block\nprint `3 backticks or`\n[caption](example.com)\n```", "<pre><code> # code block\nprint `3 backticks or`\n[caption](example.com)\n</code></pre>\n");
                });

                it ("table", function () {
                    var expected = "<table>\n<thead>\n<tr>\n<th>heading1</th>\n<th>heading 2</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>text1</td>\n<td>text2</td>\n</tr>\n</tbody>\n</table>\n";
                    testMarkdown("|heading1|heading 2|\n|-|-|\n|text1|text2|\n", expected);
                });

                it ("table and link after it", function () {
                    var expected = "<table>\n<thead>\n<tr>\n<th>heading1</th>\n<th>heading 2</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>text1</td>\n<td>text2</td>\n</tr>\n</tbody>\n</table>\n<p><a href=\"https://example.com/a.2\">caption</a></p>\n";
                    testMarkdown("|heading1|heading 2|\n|-|-|\n|text1|text2|\n\n[caption](https://example.com/a.2)", expected);
                });

            });

            it ("should return empty string for null.", function () {
                expect(printMarkdown(null)).toBe('');
            });

            it ("should support elements with attributes.", function () {
                // Check for link tag with download attribute
                expect(printMarkdown('[Link With Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary}'))
                    .toBe('<p><a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="btn btn-primary">Link With Download</a></p>\n', "invalid link with tag");

                // Check for image tag with size
                expect(printMarkdown('**Image With Size** \n ![ImageWithSize](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=800 height=300}'))
                    .toBe('<p><strong>Image With Size</strong><br>\n<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="800" height="300" class="-chaise-post-load"></p>\n', "invalid image with tag");

                // Check for thumbnail with link to original image
                expect(printMarkdown("[![Image](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=500 height=400}](https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg){target=_blank}"))
                    .toBe('<p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" width="500" height="400" class="-chaise-post-load"></a></p>\n', "invalid thumbnail with tag");
            });

            it ("should support :::iframe.", function () {
                // 01: Check for iframe with height and width
                expect(printMarkdown('::: iframe [Chaise](https://dev.isrd.isi.edu/chaise/search){width=800 height=300} \n:::'))
                    .toBe('<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 800px;"><figcaption class="embed-caption">Chaise</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300"></iframe></figure>', "case 01");

                // 02: Check for iframe tag with a link and caption
                var iframeMarkdown = '::: iframe [SOME LINK CAPTION](https://dev.isrd.isi.edu/chaise/search){height=400 link=https://dev.isrd.isi.edu/chaise/search} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 100%;"><figcaption class="embed-caption"><a href="https://dev.isrd.isi.edu/chaise/search">SOME LINK CAPTION</a></figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="https://dev.isrd.isi.edu/chaise/search" height="400"></iframe></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 02");

                // 03: Check for iframe tag with a link and caption at the bottom with no figure-style and figure-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){link="https://dev.isrd.isi.edu/chaise/search" pos="bottom"} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div><iframe src="https://dev.isrd.isi.edu/chaise/search"></iframe><figcaption class="embed-caption"><a href="https://dev.isrd.isi.edu/chaise/search">CAPTION</a></figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 03");

                // 04: Check for iframe tag with a link and caption at the bottom with figure-style and figure-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){link="https://dev.isrd.isi.edu/chaise/search" pos="bottom" figure-class="iclass" figure-style="border:1px solid;"} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load iclass" style="border:1px solid;"><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div><iframe src="https://dev.isrd.isi.edu/chaise/search"></iframe><figcaption class="embed-caption"><a href="https://dev.isrd.isi.edu/chaise/search">CAPTION</a></figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 04");

                // 05: Check for iframe tag with a caption at the bottom with caption-style and caption-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){pos="bottom" caption-class="cclass" caption-style="font-weight:500;"} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div><iframe src="https://dev.isrd.isi.edu/chaise/search"></iframe><figcaption class="embed-caption cclass" style="font-weight:500;">CAPTION</figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 05");

                // 05.1: Check for iframe tag with min/max width applied to the iframe and the container for the caption and fullscreen button
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){style="min-width:400px; max-width:900px;"} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 100%;min-width:400px;max-width:900px"><figcaption class="embed-caption">CAPTION</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="https://dev.isrd.isi.edu/chaise/search" style="min-width:400px; max-width:900px;"></iframe></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 05.1");

                // 06: Check for iframe tag with a caption at the bottom with figure-style and caption-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){pos="bottom" caption-class="cclass" figure-style="font-weight:500;"} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load" style="font-weight:500;"><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search"><span class="fullscreen-icon"></span> Full screen</a></div><iframe src="https://dev.isrd.isi.edu/chaise/search"></iframe><figcaption class="embed-caption cclass">CAPTION</figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 06");

                // 07: check for iframe tag with classes and target=_blank for fullscreen button
                var iframeMarkdown = '::: iframe [SOME LINK CAPTION](https://dev.isrd.isi.edu/chaise/search){.class-one .class-two fullscreen-target=_blank} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 100%;"><figcaption class="embed-caption">SOME LINK CAPTION</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://dev.isrd.isi.edu/chaise/search" target=_blank><span class="fullscreen-icon"></span> Full screen</a></div></div><iframe src="https://dev.isrd.isi.edu/chaise/search" class="class-one class-two"></iframe></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 07");

                // 08: Testing for YouTube video with classes
                var iframeMarkdown = '::: iframe [SOME LINK CAPTION](https://www.youtube.com/embed/op1-Cw_l1Ow){.class-one .class-two} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 100%;"><figcaption class="embed-caption">SOME LINK CAPTION</figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://www.youtube.com/embed/op1-Cw_l1Ow"><span class="fullscreen-icon"></span> Full screen</a></div></div><span class="video-info-in-print" style="display:none;">Note: YouTube video ( https://www.youtube.com/embed/op1-Cw_l1Ow ) is hidden in print</span><iframe src="https://www.youtube.com/embed/op1-Cw_l1Ow" class="class-one class-two hide-in-print"></iframe></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 08");

                // 09: Testing for YouTube video
                var iframeMarkdown = '::: iframe [SOME LINK CAPTION](https://www.youtube.com/embed/op1-Cw_l1Ow){width=640 height=480 link=https://www.youtube.com/embed/op1-Cw_l1Ow} \n:::';
                var iframeHTML = '<figure class="embed-block -chaise-post-load"><div class="figcaption-wrapper" style="width: 640px;"><figcaption class="embed-caption"><a href="https://www.youtube.com/embed/op1-Cw_l1Ow">SOME LINK CAPTION</a></figcaption><div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="https://www.youtube.com/embed/op1-Cw_l1Ow"><span class="fullscreen-icon"></span> Full screen</a></div></div><span class="video-info-in-print" style="display:none;">Note: YouTube video ( https://www.youtube.com/embed/op1-Cw_l1Ow ) is hidden in print</span><iframe src="https://www.youtube.com/embed/op1-Cw_l1Ow" width="640" height="480" class="hide-in-print"></iframe></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML, "case 09");

                // 10: Check for dropdown tag
                var dropdownMarkdown = '::: dropdown MYCAPTION{.btn-lg} [CAPTION1](https://dev.isrd.isi.edu/chaise/search){.btn .btn-danger} [CAPTION2](https://dev.isrd.isi.edu/chaise/search) [CAPTION3](https://dev.isrd.isi.edu/chaise/search) \n:::';
                var dropdownHTML = '<div class="btn-group markdown-dropdown"><button type="button"  class="btn btn-primary btn-lg">MYCAPTION</button><button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"  class="btn btn-primary dropdown-toggle btn-lg"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="https://dev.isrd.isi.edu/chaise/search" class="btn btn-danger" >CAPTION1</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION2</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION3</a></li></ul></div>';
                expect(printMarkdown(dropdownMarkdown)).toBe(dropdownHTML, "case 10");

                // 11: Check for iframe followed by a dropdown using markdown for both
                expect(printMarkdown(iframeMarkdown + "\n" + dropdownMarkdown)).toBe(iframeHTML + dropdownHTML, "case 11");
            });

            describe ("should support :::image.", function () {

                it ('image with link and height', () => {
                    // Check for thumbnail with link to original image and a caption
                    expect(printMarkdown(":::image [Skyscrapers](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){height=200 link=https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg} \n:::"))
                    .toBe('<figure class="embed-block -chaise-post-load" style="display:inline-block;"><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><figcaption class="embed-caption">Skyscrapers</figcaption><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" height="200" /></a></figure>');
                });

                it ('image using chaise-image-preview', () => {
                    expect(printMarkdown(':::image [](https://example.com/a.png){figure-class=chaise-image-preview image-preview-max-height="40vh"} \n:::'))
                    .toBe('<figure class="embed-block -chaise-post-load chaise-image-preview" style="display:inline-block;"><figcaption class="embed-caption"></figcaption><img src="https://example.com/a.png" image-preview-max-height="40vh" /></figure>');
                });

                it ('image with figure-style', () => {
                    expect(printMarkdown(':::image [](https://example.com/a.png){figure-style=max-width:400px} \n:::'))
                    .toBe('<figure class="embed-block -chaise-post-load" style="max-width:400px"><figcaption class="embed-caption"></figcaption><img src="https://example.com/a.png" /></figure>');
                });

            });

            it ("should support :::video", function () {

                //01: Check for proper rendering of video tag with no attributes
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><span class="video-info-in-print" style="display:none;">Note: Video (http://techslides.com/demos/sample-videos/small.mp4) is hidden in print </span><video controls class="-chaise-post-load hide-in-print" ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "01");

                //02: Check for proper rendering of video tag with height and width attributes
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){width=800 height=200} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><span class="video-info-in-print" style="display:none;">Note: Video (http://techslides.com/demos/sample-videos/small.mp4) is hidden in print </span><video controls class="-chaise-post-load hide-in-print" width=800 height=200 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "02");

                //03: Check for proper rendering of video tag with height and width attributes and some boolean attributes like loop and muted
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){width=800 height=200 loop muted} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><span class="video-info-in-print" style="display:none;">Note: Video (http://techslides.com/demos/sample-videos/small.mp4) is hidden in print </span><video controls class="-chaise-post-load hide-in-print" width=800 height=200 loop muted ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "03");

                //04: Check for proper rendering of video tag with some invalid attributes
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){loop=5 width=800} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><span class="video-info-in-print" style="display:none;">Note: Video (http://techslides.com/demos/sample-videos/small.mp4) is hidden in print </span><video controls class="-chaise-post-load hide-in-print" width=800 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "04");

                //05: check for proper rendering of video tag with class
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){width=400 .class-one .class-two} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><span class="video-info-in-print" style="display:none;">Note: Video (http://techslides.com/demos/sample-videos/small.mp4) is hidden in print </span><video controls class="-chaise-post-load hide-in-print class-one class-two" width=400 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "05");
            });

            it ("should support :::div", function () {
                testPrintMarkdown(
                    ":::div value \n:::",
                    '<div>value</div>\n',
                    false,
                    "invalid string"
                );

                testPrintMarkdown(
                    ":::div value{.class-name} \n:::",
                    '<div class="class-name">value</div>\n',
                    false,
                    "invalid string with tag"
                );

                // NOTE currently these are the only two use cases of this.
            });

            it ("should support [[rid]]", function () {
                expect(printMarkdown("[[1-HBO4]]")).toBe('<p><a href="/id/1-HBO4">1-HBO4</a></p>\n', "invalid rid template");
                expect(printMarkdown("[[1-HBO4]]", {inline: true})).toBe('<a href="/id/1-HBO4">1-HBO4</a>', "invalid rid template");
                expect(printMarkdown("[[1-HBO4]]()")).toBe('<p><a href="">[1-HBO4]</a></p>\n', "link md syntax should take precedence");

            });

            it ("should support superscript and subscript.", function () {
                expect(printMarkdown('H~2~0')).toBe('<p>H<sub>2</sub>0</p>\n', "invalid sub");
                expect(printMarkdown('H~2~{.test}0')).toBe('<p>H<sub class="test">2</sub>0</p>\n', "invalid sub with attrs");
                expect(printMarkdown('13^th^')).toBe('<p>13<sup>th</sup></p>\n', "invalid sup");
            });

            it ("should support :span:.", function () {
                expect(printMarkdown("This is :span: special case:/span:.")).toBe("<p>This is <span> special case</span>.</p>\n", "invalid span");
                expect(printMarkdown("This is :span: special case:/span:.", {inline: true})).toBe("This is <span> special case</span>.", "invalid inline span");
                expect(printMarkdown(":span:special:/span:{.test}", {inline: true})).toBe('<span class="test">special</span>', "invalid inline span with attrs");
                expect(printMarkdown(":span::/span:{.glyph-icon .glyph-danger}", {inline: true})).toBe('<span class="glyph-icon glyph-danger"></span>', "invalid empty inline span with attrs");
            });

            it("should support table with classname attribute.", function () {
                var mkString = "|heading|\n|-|\n|text|\n\n{.class-name}";
                expect(printMarkdown(mkString)).toBe('<table class="class-name">\n<thead>\n<tr>\n<th>heading</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>text</td>\n</tr>\n</tbody>\n</table>\n');
            });

            describe("regarding external links, ", function () {
                it ("should not do anything extra if client-config is not set properly.", function () {
                    testPrintMarkdown('[caption](http://external.com)', '<a href="http://external.com">caption</a>', true, 'test 01');
                    testPrintMarkdown('[caption](http://internal.com){.test}', '<a href="http://internal.com" class="test">caption</a>', true, 'test 02');
                });

                it ("should use the passed hosts to detect external link and add external-link-icon and external-link", function (done) {
                    //add client config
                    options.ermRest.setClientConfig({
                        internalHosts: ['a.com', 'internal.com']
                    }).then(function () {
                        testPrintMarkdown('[caption](http://external.com)', '<a href="http://external.com" class="external-link-icon external-link">caption</a>', true, 'test 01');
                        testPrintMarkdown('[caption](http://external.com){.test}', '<a href="http://external.com" class="test external-link-icon external-link">caption</a>', true, 'test 02');
                        testPrintMarkdown('[caption](http://internal.com){.test}', '<a href="http://internal.com" class="test">caption</a>', true, 'test 03');
                        testPrintMarkdown('[caption](https://a.com?q=123)', '<a href="https://a.com?q=123">caption</a>', true, 'test 04');

                        // remove the client config
                        return options.ermRest.setClientConfig({});
                    }).then(function () {
                        done();
                    })

                });

                it ("should not add the external-link if the disableExternalLinkModal is true.", function (done) {
                    //add client config
                    options.ermRest.setClientConfig({
                        internalHosts: ['a.com', 'internal.com'],
                        disableExternalLinkModal: true,
                    }).then(function () {
                        testPrintMarkdown('[caption](http://external.com)', '<a href="http://external.com" class="external-link-icon">caption</a>', true, 'test 01');
                        testPrintMarkdown('[caption](http://external.com){.test}', '<a href="http://external.com" class="test external-link-icon">caption</a>', true, 'test 02');
                        testPrintMarkdown('[caption](http://internal.com){.test}', '<a href="http://internal.com" class="test">caption</a>', true, 'test 03');
                        testPrintMarkdown('[caption](https://a.com?q=123)', '<a href="https://a.com?q=123">caption</a>', true, 'test 04');

                        // remove the client config
                        return options.ermRest.setClientConfig({});
                    }).then(function () {
                        done();
                    })
                });
            });
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

        it('module._renderMustacheTemplate() should function correctly for Null and Non-null values', function() {
            expect(module._renderMustacheTemplate("My name is {{name}}", {name: 'John'})).toBe("My name is John");
            expect(module._renderMustacheTemplate("My name is {{name}}", { name: null })).toBe(null);
            expect(module._renderMustacheTemplate("My name is {{name}}", {})).toBe(null);
            expect(module._renderMustacheTemplate("My name is {{#name}}{{name}}{{/name}}", {})).toBe("My name is ");
            expect(module._renderMustacheTemplate("My name is {{^name}}{{name}}{{/name}}", {})).toBe("My name is ");
            expect(module._renderMustacheTemplate("My name is {{^name}}John{{/name}}", {})).toBe("My name is John");
        });

        it('module._renderMustacheTemplate() should inject $moment obj', function() {
            var moment = module._currDate;
            expect(moment).toBeDefined();
            expect(module._renderMustacheTemplate("{{name}} was born on {{$moment.day}} {{$moment.date}}/{{$moment.month}}/{{$moment.year}}", { name: 'John' })).toBe("John was born on " + moment.day + " " + moment.date + "/" + moment.month + "/" + moment.year);
            expect(module._renderMustacheTemplate("Todays date is {{$moment.dateString}}", {})).toBe("Todays date is " + moment.dateString);

            expect(module._renderMustacheTemplate("Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}} with timestamp {{$moment.timestamp}}", {})).toBe("Current time is " + moment.hours + ":" + moment.minutes + ":" + moment.seconds + ":" + moment.milliseconds + " with timestamp " + moment.timestamp);
            expect(module._renderMustacheTemplate("Current time is {{$moment.timeString}}", {})).toBe("Current time is " + moment.timeString);

            expect(module._renderMustacheTemplate("ISO string is {{$moment.ISOString}}", {})).toBe("ISO string is " + moment.ISOString);
            expect(module._renderMustacheTemplate("GMT string is {{$moment.GMTString}}", {})).toBe("GMT string is " + moment.GMTString);
            expect(module._renderMustacheTemplate("UTC string is {{$moment.UTCString}}", {})).toBe("UTC string is " + moment.UTCString);

            expect(module._renderMustacheTemplate("Local time string is {{$moment.localeTimeString}}", {})).toBe("Local time string is " + moment.localeTimeString);
        });

        it('module._valdiateMustacheTemplate() should accept templates that have $moment in them.', function () {
            expect(module._validateMustacheTemplate("{{name}} was born on {{$moment.day}} {{$moment.date}}/{{$moment.month}}/{{$moment.year}}", { name: 'John' })).toBe(true);
            expect(module._validateMustacheTemplate("Todays date is {{$moment.dateString}}", {})).toBe(true);

            expect(module._validateMustacheTemplate("Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}} with timestamp {{$moment.timestamp}}", {})).toBe(true);
            expect(module._validateMustacheTemplate("Current time is {{$moment.timeString}}", {})).toBe(true);

            expect(module._validateMustacheTemplate("ISO string is {{$moment.ISOString}}", {})).toBe(true);
            expect(module._validateMustacheTemplate("GMT string is {{$moment.GMTString}}", {})).toBe(true);
            expect(module._validateMustacheTemplate("UTC string is {{$moment.UTCString}}", {})).toBe(true);

            expect(module._validateMustacheTemplate("Local time string is {{$moment.localeTimeString}}", {})).toBe(true);
        });

        it ("_renderMustacheTemplate() should inject $dcctx obj", function () {
            expect(module._renderMustacheTemplate("cid: {{$dcctx.cid}}", {}, options.catalog)).toBe("cid: test");
        });

        it('module._renderMustacheTemplate() should inject $catalog obj', function () {
            expect(module._renderMustacheTemplate("catalog snapshot: {{$catalog.snapshot}}, catalog id: {{$catalog.id}}", {}, options.catalog)).toBe("catalog snapshot: " + process.env.DEFAULT_CATALOG + ", catalog id: " + process.env.DEFAULT_CATALOG);
        });

        it("module._renderMustacheTemplate() should NOT inject $catalog obj if 'catalog' is not passed to the function", function() {
            expect(module._renderMustacheTemplate("catalog snapshot:{{# $catalog.snapshot}} {{$catalog.snapshot}}{{/$catalog.snapshot}}", {})).toBe("catalog snapshot:");
        });

        it('module._renderMustacheTemplate() should inject $session obj', function () {
            expect(module._renderMustacheTemplate("{{$session.client.display_name}}", {})).not.toBeNull("display_name is null");
            expect(module._renderMustacheTemplate("{{$session.client.id}}", {})).not.toBeNull("id is null");
            expect(module._renderMustacheTemplate("{{$session.client.identities}}", {})).not.toBeNull("identities is null");
            expect(module._renderMustacheTemplate("{{$session.attributes}}", {})).not.toBeNull("attributes is null");

            expect(module._renderMustacheTemplate("{{$session.client.display_name}}", {})).toBe(options.session.client.display_name, "display_name not set");
            expect(module._renderMustacheTemplate("{{{$session.client.id}}}", {})).toBe(options.session.client.id, "id not set");
        });

        it('module._renderMustacheTemplate() should NOT inject $location obj', function () {
            // location isn't available in unit test environment
            expect(module._renderMustacheTemplate("{{$location.origin}}", {})).toBeNull();
        });

        var obj = {
            "str.witha.": "**somevalue ] which is ! special and [ contains special <bold> characters 12/26/2016 ( and **",
            "m1": "[a markdown link](http://example.com/foo)",
            "m2": "[a markdown link](http://example.com/foo/\\(a,b\\))",
            "u2": "http://example.com/foo/(a,b)",
            "p": "messy(){}[]<>/;,$=*punctuation",
            "n": "ǝɯɐu",
            "ǝɯɐu": "name"
        };

        var templateCases = [{
              "template": "{{{m1}}}",
              "after_mustache": "[a markdown link](http://example.com/foo)",
              "after_render": "<p><a href=\"http://example.com/foo\">a markdown link</a></p>"
            }, {
              "template": "{{{m2}}}",
              "after_mustache": "[a markdown link](http://example.com/foo/\\(a,b\\))",
              "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
            }, {
              "template": "[a markdown link]({{#escape}}{{{u2}}}{{/escape}})",
              "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
              "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
            }, {
              "template": "[a markdown link](http://example.com/foo/id={{#escape}}({{#encode}}{{{p}}}{{/encode}}){{/escape}})",
              "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
              "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
              "note": "here, the escape block protects the bare parens for us"
            }, {
              "template": "[a markdown link](http://example.com/foo/id=\\({{#encode}}{{{p}}}{{/encode}}\\))",
              "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
              "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
              "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{{ǝɯɐu}}}={{{n}}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=ǝɯɐu)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note": "the URL in this HTML is not actually valid according to RFC 3986!"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{#encode}}{{{n}}}{{/encode}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{#escape}}{{{ǝɯɐu}}}={{#encode}}{{{n}}}{{/encode}}{{/escape}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note1": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu",
              "note2": "the {{#escape}}...{{/escape}} is unnecessary here but doesn't hurt anything"
            }, {
                "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **)",
                "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                "note": "With no encoding and escaping. Should give malformed HTML"
            },{
                "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{#encode}}{{{str_witha_}}}{{/encode}})",
                "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
            },{
                "template" : "[{{#escape}}{{{str_witha_}}}{{/escape}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **)",
                "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                "note": "With escaping but no encoding. Should give malformed HTML"
            },{
                "template" : "[{{#escape}}{{{str_witha_}}}{{/escape}}](https://dev.isrd.isi.edu/key={{#encode}}{{{str_witha_}}}{{/encode}})",
                "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                "after_render": '<p><a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A">**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                "note": "With encoding and escaping. Should give correct HTML with valid caption a link"
            }];

        it('module._renderMustacheTemplate() and module.renderMarkdown() should function correctly for Markdown Escaping and Encoding', function() {
            templateCases.forEach(function(ex) {
                var template = module._renderMustacheTemplate(ex.template, obj);
                expect(template).toBe(ex.after_mustache);
                var html = module.renderMarkdown(template);
                expect(html).toBe(ex.after_render + '\n');
            });
        });

        describe('module.renderHandlebarsTemplate() should function correctly for', function () {
            it('Null and Non-null values', function() {
                expect(module.renderHandlebarsTemplate("My name is {{name}}", { name: 'Chloe' })).toBe("My name is Chloe");
                expect(module.renderHandlebarsTemplate("My name is {{name}}", { name: null })).toBe(null);
                expect(module.renderHandlebarsTemplate("My name is {{name}}", {})).toBe(null);
                expect(module.renderHandlebarsTemplate("My name is {{#if name}}{{name}}{{/if}}", {})).toBe("My name is ");
                expect(module.renderHandlebarsTemplate("My name is {{^if name}}{{name}}{{/if}}", {})).toBe("My name is ", "For inverted if with variable");
                expect(module.renderHandlebarsTemplate("My name is {{^if name}}John{{/if}}", {})).toBe("My name is John", "For inverted if with string");
                expect(module.renderHandlebarsTemplate("My name is {{#unless name}}Jona{{/unless}}", {})).toBe("My name is Jona", "For unless");
            });

            it ("escaping handlebars expression and raw helper", function () {
                expect(module.renderHandlebarsTemplate("\\{{name}}", { name: 'Chloe' })).toBe("{{name}}");
                expect(module.renderHandlebarsTemplate("\\{{{name}}}", { name: 'Chloe' })).toBe("{{{name}}}");
            });

            it('ifCond helper', function() {
                expect(module.renderHandlebarsTemplate("Name {{#ifCond name \"===\" 'Chloe'}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/ifCond}}", { name: 'Chloe' })).toBe("Name Chloe is equal to Chloe");
                expect(module.renderHandlebarsTemplate("Name {{#ifCond name \"===\" 'Chloe'}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/ifCond}}", { name: 'John' })).toBe("Name John is not equal to Chloe");
            });

            it('each helper', function () {
                expect(module.renderHandlebarsTemplate("{{#each values}}{{this}}\n{{/each}}", { values: [2, 3, 7, 9] })).toBe("2\n3\n7\n9\n");
            });

            it('formatDate helper', function () {
                expect(module.renderHandlebarsTemplate("{{formatDate '2018-07-26' 'YYYY'}}")).toBe("2018");
                expect(module.renderHandlebarsTemplate("{{formatDate '02-16-97' 'YYYY'}}")).toBe("1997");
                // should be able to handle invalid dates
                expect(module.renderHandlebarsTemplate("{{formatDate 'aaa' 'YYYY'}}")).toBe("");
                // should be able to handle null value
                expect(module.renderHandlebarsTemplate("{{formatDate date 'YYYY'}}", {date: null})).toBe("");
            });

            it('encodeFacet helper', function () {
                var facet = '{"and": [{"source": "id", "choices": ["1"]}]}';
                expect(module.renderHandlebarsTemplate("{{#encodeFacet}}" + facet + "{{/encodeFacet}}")).toBe('N4IghgdgJiBcAEBtUBnA9gVwE4GMCmc8IAljADRE4AWax+KhiIAjCALoC+nQA');
            });

            it('add helper', function () {
                expect(module.renderHandlebarsTemplate("{{add a b}}", { a: 1, b: 2 })).toBe("3");
                expect(module.renderHandlebarsTemplate("{{add a b}}", { a: "4", b: "2" })).toBe("6");
                expect(module.renderHandlebarsTemplate("{{add a b}}", { a: 1, b: "2" })).toBe("3");
            });

            it('subtract helper', function () {
                expect(module.renderHandlebarsTemplate("{{subtract a b}}", { a: 2, b: 1 })).toBe("1");
                expect(module.renderHandlebarsTemplate("{{subtract a b}}", { a: "4", b: "2" })).toBe("2");
                expect(module.renderHandlebarsTemplate("{{subtract a b}}", { a: 2, b: "1" })).toBe("1");
            });

            it('if eq (equals) helper', function () {
                expect(module.renderHandlebarsTemplate("Name {{#if (eq name 'Chloe')}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/if}}", { name: 'Chloe' })).toBe("Name Chloe is equal to Chloe");
                expect(module.renderHandlebarsTemplate("Name {{#if (eq name 'Chloe')}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/if}}", { name: 'John' })).toBe("Name John is not equal to Chloe");
            });

            it('if ne (not equals) helper', function () {
                expect(module.renderHandlebarsTemplate("Name {{#if (ne name 'Chloe')}}{{name}} is not equal to Chloe{{else}}{{name}} is equal to Chloe{{/if}}", { name: 'John' })).toBe("Name John is not equal to Chloe");
                expect(module.renderHandlebarsTemplate("Name {{#if (ne name 'Chloe')}}{{name}} is not equal to Chloe{{else}}{{name}} is equal to Chloe{{/if}}", { name: 'Chloe' })).toBe("Name Chloe is equal to Chloe");
            });

            it('if lt (less than) helper', function () {
                expect(module.renderHandlebarsTemplate("{{#if (lt value '10')}}{{value}} is less than 10{{else}}{{value}} is not less than 10{{/if}}", { value: 3 })).toBe("3 is less than 10");
                expect(module.renderHandlebarsTemplate("{{#if (lt value '10')}}{{value}} is less than 10{{else}}{{value}} is not less than 10{{/if}}", { value: 17 })).toBe("17 is not less than 10");
            });

            it('if gt (greater than) helper', function () {
                expect(module.renderHandlebarsTemplate("{{#if (gt value '10')}}{{value}} is greater than 10{{else}}{{value}} is not greater than 10{{/if}}", { value: 17 })).toBe("17 is greater than 10");
                expect(module.renderHandlebarsTemplate("{{#if (gt value '10')}}{{value}} is greater than 10{{else}}{{value}} is not greater than 10{{/if}}", { value: 3 })).toBe("3 is not greater than 10");
            });

            it('if lte (less than or equal to) helper', function () {
                expect(module.renderHandlebarsTemplate("{{#if (lte value '10')}}{{value}} is less than or equal to 10{{else}}{{value}} is not less than or equal to 10{{/if}}", { value: 3 })).toBe("3 is less than or equal to 10");
                expect(module.renderHandlebarsTemplate("{{#if (lte value '10')}}{{value}} is less than or equal to 10{{else}}{{value}} is not less than or equal to 10{{/if}}", { value: 10 })).toBe("10 is less than or equal to 10");
                expect(module.renderHandlebarsTemplate("{{#if (lte value '10')}}{{value}} is less than or equal to 10{{else}}{{value}} is not less than or equal to 10{{/if}}", { value: 17 })).toBe("17 is not less than or equal to 10");
            });

            it('if gte (greater than or equal to) helper', function () {
                expect(module.renderHandlebarsTemplate("{{#if (gte value '10')}}{{value}} is greater than or equal to 10{{else}}{{value}} is not greater than or equal to 10{{/if}}", { value: 17 })).toBe("17 is greater than or equal to 10");
                expect(module.renderHandlebarsTemplate("{{#if (gte value '10')}}{{value}} is greater than or equal to 10{{else}}{{value}} is not greater than or equal to 10{{/if}}", { value: 10 })).toBe("10 is greater than or equal to 10");
                expect(module.renderHandlebarsTemplate("{{#if (gte value '10')}}{{value}} is greater than or equal to 10{{else}}{{value}} is not greater than or equal to 10{{/if}}", { value: 3 })).toBe("3 is not greater than or equal to 10");
            });

            it('if and (conjunction) helper', function () {
                expect(module.renderHandlebarsTemplate("{{#if (and bool1 bool2)}}both booleans are true{{else}}one or more booleans are false{{/if}}", { bool1: true, bool2: true })).toBe("both booleans are true");
                expect(module.renderHandlebarsTemplate("{{#if (and bool1 bool2)}}both booleans are true{{else}}one or more booleans are false{{/if}}", { bool1: true, bool2: false })).toBe("one or more booleans are false");
                expect(module.renderHandlebarsTemplate("{{#if (and bool1 bool2 bool3)}}both booleans are true{{else}}one or more booleans are false{{/if}}", { bool1: true, bool2: false, bool3: true })).toBe("one or more booleans are false", "three arguments");
            });

            it('if or (disjunction) helper', function () {
                expect(module.renderHandlebarsTemplate("{{#if (or bool1 bool2)}}one or more booleans are true{{else}}both booleans are false{{/if}}", { bool1: false, bool2: true })).toBe("one or more booleans are true");
                expect(module.renderHandlebarsTemplate("{{#if (or bool1 bool2)}}one or more booleans are true{{else}}both booleans are false{{/if}}", { bool1: false, bool2: false })).toBe("both booleans are false");
                expect(module.renderHandlebarsTemplate("{{#if (or bool1 bool2 bool3)}}one or more booleans are true{{else}}both booleans are false{{/if}}", { bool1: false, bool2: false, bool3: true })).toBe("one or more booleans are true", "three arguments");
            });

            it ("if not (negate) helper", function () {
                expect(module.renderHandlebarsTemplate("{{#if (not bool1)}}false{{else}}true{{/if}}", { bool1: false})).toBe("false", "case 1");
                expect(module.renderHandlebarsTemplate("{{#if (not bool1)}}false{{else}}true{{/if}}", { bool1: true})).toBe("true", "case 2");
            });

            it ('if nested or (disjunction) / and (conjunction) / not (negate) helper', function () {
                var template = '{{#if (or (eq type "jpg") (eq type "png") )}}image{{else}}other{{/if}}';
                expect(module.renderHandlebarsTemplate(template, {"type": "jpg"})).toBe("image", "missmatch for 01");
                expect(module.renderHandlebarsTemplate(template, {"type": "txt"})).toBe("other", "missmatch for 02");

                template = '{{#if (or (and (gt v 1) (lt v 5) ) (and (gt v 10) (lt v 15) ) ) }}1-5 or 10-15{{else}}outside the range{{/if}}';
                expect(module.renderHandlebarsTemplate(template, {"v": 4})).toBe("1-5 or 10-15", "missmatch for 03");
                expect(module.renderHandlebarsTemplate(template, {"v": -1})).toBe("outside the range", "missmatch for 04");

                template = '{{#if (or cond1 (not cond2) cond3)}}ok{{else}}else{{/if}}';
                expect(module.renderHandlebarsTemplate(template, {"cond1": false, "cond2": false, "cond3": false})).toBe("ok", "missmatch for 05");
                expect(module.renderHandlebarsTemplate(template, {"cond1": false, "cond2": true, "cond3": false})).toBe("else", "missmatch for 06");
            });

            it ('regexMatch helper', function () {
                var template = '{{#if (regexMatch type "jpg|png")}}image{{else}}other{{/if}}';
                expect(module.renderHandlebarsTemplate(template, {"type": "jpg"})).toBe("image", "missmatch for 01");
                expect(module.renderHandlebarsTemplate(template, {"type": "txt"})).toBe("other", "missmatch for 02");
            });

            it ('regexFindFirst helper', function () {
                var template = '{{#regexFindFirst testString "jpg|png"}}{{this}}{{/regexFindFirst}}';
                expect(module.renderHandlebarsTemplate(template, {"testString": "house.jpg"}) ).toBe("jpg", "missmatch for 1st test");
                expect(module.renderHandlebarsTemplate(template, {"testString": "jumpng-fox.jpg"}) ).toBe("png", "missmatch for 2nd test");
                expect(module.renderHandlebarsTemplate(template, {"testString": "jumping-fox.wav"}) ).toBe("", "missmatch for 3rd test");

                var template2 = '{{#regexFindFirst testString "^\/(.+\/)*(.+)\.(.+)$"}}{{this}}{{/regexFindFirst}}';
                expect(module.renderHandlebarsTemplate(template2, {"testString": "/var/www/html/index.html"}) ).toBe("/var/www/html/index.html", "missmatch for 4th test");

                var template3 = '{{#regexFindFirst testString "[^\/]+$"}}{{this}}{{/regexFindFirst}}';
                expect(module.renderHandlebarsTemplate(template3, {"testString": "/var/www/html/index.html"}) ).toBe("index.html", "missmatch for 5th test");
            });

            it ('regexFindAll helper', function () {
                var template = '{{#each (regexFindAll testString "jpg|png")}}{{this}}\n{{/each}}';
                expect(module.renderHandlebarsTemplate(template, {"testString": "house-jpg.jpg"}) ).toBe("jpg\njpg\n", "missmatch for 1st test");
                expect(module.renderHandlebarsTemplate(template, {"testString": "jumpng-fox.jpg"}) ).toBe("png\njpg\n", "missmatch for 2nd test");
                expect(module.renderHandlebarsTemplate(template, {"testString": "jumping-fox.wav"}) ).toBe("", "missmatch for 3rd test");

                var template2 = '{{#each (regexFindAll testString "^\/(.+\/)*(.+)\.(.+)$")}}{{this}}\n{{/each}}';
                expect(module.renderHandlebarsTemplate(template2, {"testString": "/var/www/html/index.html"}) ).toBe("/var/www/html/index.html\n", "missmatch for 4th test");

                var template3 = '{{#each (regexFindAll testString "[^\/]+$")}}{{this}}\n{{/each}}';
                expect(module.renderHandlebarsTemplate(template3, {"testString": "/var/www/html/index.html"}) ).toBe("index.html\n", "missmatch for 5th test");
            });

            it ('replace helper', function () {
                var underscoreToWhitespace = "change_this_table_name";

                var template = '{{#replace "_" " "}}{{{string}}}{{/replace}}'

                expect(module.renderHandlebarsTemplate(template, {string: underscoreToWhitespace})).toEqual("change this table name", "missmatch for 1st test");
            });

            it ('jsonStringify helper', function () {
                var json = {
                    "testString": "test",
                    "testArray": ["string1", "string2"],
                    "testBool": true,
                    "testInt": 4
                };

                var template = '{{#jsonStringify}}{{{json}}}{{/jsonStringify}}';

                expect(module.renderHandlebarsTemplate(template, {json: json})).toBe(JSON.stringify(json), "missmatch for 1st test");

                var template2 = '{{#encodeFacet}}{{#jsonStringify}}{{{json}}}{{/jsonStringify}}{{/encodeFacet}}';
                expect(module.renderHandlebarsTemplate(template2, {json: json})).toBe(options.ermRest.encodeFacetString(JSON.stringify(json)), "missmatch for 2nd test");
            });

            it ('toTitleCase helper', function () {
                var string = "Hello world title case string"
                var template = '{{#toTitleCase}}{{{string}}}{{/toTitleCase}}'

                expect(module.renderHandlebarsTemplate(template, {string: string})).toBe("Hello World Title Case String", "missmatch for 1st test");

                var string2 = "HellO world miXed case titleCase string"
                var template2 = '{{#toTitleCase}}{{{string}}}{{/toTitleCase}}'

                expect(module.renderHandlebarsTemplate(template2, {string: string2})).toBe("HellO World MiXed Case TitleCase String", "missmatch for 2nd test");
            });

            it('lookup helper', function () {
                var map = {"id1": true, "id2": "alpha", "id3": 123}
                var template = "{{lookup map id}}"

                expect(module.renderHandlebarsTemplate("boolean: " + template, {map: map, id: "id1"})).toBe("boolean: true", "missmatch for 1st test");
                expect(module.renderHandlebarsTemplate("string: " + template, {map: map, id: "id2"})).toBe("string: alpha", "missmatch for 2nd test");
                expect(module.renderHandlebarsTemplate("integer: " + template, {map: map, id: "id3"})).toBe("integer: 123", "missmatch for 3rd test");
                expect(module.renderHandlebarsTemplate("undefined: " + template, {map: map, id: "id4"})).toBe("undefined: ", "missmatch for 4th test");
            });

            it('suppressed default helper log', function () {
                try {
                    module.renderHandlebarsTemplate("{{log 'Hello World'}}", {});
                } catch (err) {
                    expect(err.message).toBe("You specified knownHelpersOnly, but used the unknown helper log - 1:0");
                }
            });

            it('injecting $moment obj', function() {
                var moment = module._currDate;
                expect(moment).toBeDefined();
                expect(module.renderHandlebarsTemplate("{{name}} was born on {{$moment.day}} {{$moment.date}}/{{$moment.month}}/{{$moment.year}}", { name: 'John' })).toBe("John was born on " + moment.day + " " + moment.date + "/" + moment.month + "/" + moment.year);
                expect(module.renderHandlebarsTemplate("Todays date is {{$moment.dateString}}", {})).toBe("Todays date is " + moment.dateString);

                expect(module.renderHandlebarsTemplate("Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}} with timestamp {{$moment.timestamp}}", {})).toBe("Current time is " + moment.hours + ":" + moment.minutes + ":" + moment.seconds + ":" + moment.milliseconds + " with timestamp " + moment.timestamp);
                expect(module.renderHandlebarsTemplate("Current time is {{$moment.timeString}}", {})).toBe("Current time is " + moment.timeString);

                expect(module.renderHandlebarsTemplate("ISO string is {{$moment.ISOString}}", {})).toBe("ISO string is " + moment.ISOString);
                expect(module.renderHandlebarsTemplate("GMT string is {{$moment.GMTString}}", {})).toBe("GMT string is " + moment.GMTString);
                expect(module.renderHandlebarsTemplate("UTC string is {{$moment.UTCString}}", {})).toBe("UTC string is " + moment.UTCString);

                expect(module.renderHandlebarsTemplate("Local time string is {{$moment.localeTimeString}}", {})).toBe("Local time string is " + moment.localeTimeString);
            });

            it('injecting $catalog obj', function() {
                expect(module.renderHandlebarsTemplate("catalog snapshot: {{$catalog.snapshot}}, catalog id: {{$catalog.id}}", {}, options.catalog)).toBe("catalog snapshot: " + process.env.DEFAULT_CATALOG + ", catalog id: " + process.env.DEFAULT_CATALOG);
            });

            it("NOT injecting $catalog obj", function() {
                expect(module.renderHandlebarsTemplate("catalog snapshot:{{#if $catalog.snapshot}} {{$catalog.snapshot}}{{/if}}", {})).toBe("catalog snapshot:");
            });

            it('injecting $session obj', function () {
                // test cases dependent on which user runs them
                expect(module.renderHandlebarsTemplate("{{$session.client.display_name}}", {})).not.toBeNull();
                expect(module.renderHandlebarsTemplate("{{$session.client.id}}", {})).not.toBeNull();
                expect(module.renderHandlebarsTemplate("{{$session.client.identities}}", {})).not.toBeNull();
                expect(module.renderHandlebarsTemplate("{{$session.attributes}}", {})).not.toBeNull();

                expect(module.renderHandlebarsTemplate("{{$session.client.display_name}}", {})).toBe(options.session.client.display_name);
                expect(module.renderHandlebarsTemplate("{{$session.client.id}}", {})).toBe(options.session.client.id);

                expect(module.renderHandlebarsTemplate("{{#each $session.attributes}}{{#if @first}}{{../$session.attributes.length}}{{/if}}{{/each}}", {})).not.toBeNull();
                expect(module.renderHandlebarsTemplate("{{#each $session.attributes}}{{#if @first}}{{this.type}}{{/if}}{{/each}}", {})).not.toBeNull();
                expect(module.renderHandlebarsTemplate("{{#each $session.client.identities}}{{#if @first}}{{../$session.client.identities.length}}{{/if}}{{/each}}", {})).not.toBeNull();
            });

            it('NOT injecting $location obj', function () {
                // location isn't available in unit test environment
                expect(module.renderHandlebarsTemplate("{{$location.origin}}", {})).toBeNull();
            });

            var handlebarTemplateCases = [{
                  "template": "{{{m1}}}",
                  "after_mustache": "[a markdown link](http://example.com/foo)",
                  "after_render": "<p><a href=\"http://example.com/foo\">a markdown link</a></p>"
                }, {
                  "template": "{{{m2}}}",
                  "after_mustache": "[a markdown link](http://example.com/foo/\\(a,b\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
                }, {
                  "template": "[a markdown link]({{#escape u2}}{{/escape}})",
                  "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
                }, {
                  "template": "[a markdown link]({{escape u2}})",
                  "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id={{#escape '(' (encode p) ')'}}{{/escape}})",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, the escape block protects the bare parens for us"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id={{escape '(' (encode p) ')'}})",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, the escape block protects the bare parens for us"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id=\\({{#encode p}}{{/encode}}\\))",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id=\\({{encode p}}\\))",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{{ǝɯɐu}}}={{{n}}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=ǝɯɐu)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note": "the URL in this HTML is not actually valid according to RFC 3986!"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{#encode n}}{{/encode}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{encode n}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{#escape ǝɯɐu '=' (encode n)}}{{/escape}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note1": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu",
                  "note2": "the {{#escape}}...{{/escape}} is unnecessary here but doesn't hurt anything"
                },{
                    "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                    "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)",
                    "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                    "note": "With no encoding and escaping. Should give malformed HTML"
                },{
                    "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{#encode str_witha_}}{{/encode}})",
                    "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                    "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                    "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
                },{
                    "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{encode str_witha_}})",
                    "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                    "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                    "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
                },{
                    "template" : "[{{#escape str_witha_}}{{/escape}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                    "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)",
                    "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                    "note": "With escaping but no encoding. Should give malformed HTML"
                },{
                    "template" : "[{{#escape str_witha_}}{{/escape}}](https://dev.isrd.isi.edu/key={{#encode str_witha_}}{{/encode}})",
                    "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                    "after_render": '<p><a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A">**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                    "note": "With encoding and escaping. Should give correct HTML with valid caption a link"
                }];

            it('Markdown Escaping and Encoding', function() {
                var printMarkdown = formatUtils.printMarkdown;

                handlebarTemplateCases.forEach(function(ex) {
                    var template = module.renderHandlebarsTemplate(ex.template, obj);
                    expect(template).toBe(ex.after_mustache, "For template => " + ex.template);
                    var html = printMarkdown(template);
                    expect(html).toBe(ex.after_render + '\n', "For template => " + ex.template);
                });
            });
        });

        describe('module._renderHandlebarsTemplate() should behave the same as module.renderHandlebarsTemplate() for', function () {
            it('injecting $catalog obj', function() {
                expect(module._renderHandlebarsTemplate("catalog snapshot: {{$catalog.snapshot}}, catalog id: {{$catalog.id}}", {}, options.catalog)).toBe("catalog snapshot: " + process.env.DEFAULT_CATALOG + ", catalog id: " + process.env.DEFAULT_CATALOG);
            });
        });

    });
};
