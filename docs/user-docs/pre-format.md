# PreFormat Column Value

For information on the annotation **tag:isrd.isi.edu,2016:column-display** specifics you can refer this [annotations document](annotation.md#tag-2016-column-display)

The annotation is represented as follows:

```javascript
{
   "CONTEXT_NAME" : {
       "pre_format": {
           "format": "%t",
           "bool_true_value": "YES",
           "bool_false_value": "NOPE",
       },
       ...
   }
}
```
The `pre_format` parameter of the annotation accepts an object with 3 properties.
1. **format**: (MANDATORY) It is the actual formatting string which is passed the column value and is mandatory. It uses a printf-style syntax based on [sprintf.js](https://github.com/alexei/sprintf.js). Each format is given a single value (the column value), so every placeholder formats that same value, unless it uses a [named argument](#named-arguments) to pick a part of it.
2. **bool_true_value** and **bool_false_value**: (OPTIONAL) These properties help to swap values of boolean true and false with relevant string values.

## Syntax

The format string uses following syntax:
```
%[(key)][flags][width][.precision]type
```

The placeholders in the format string are marked by `%` and are followed by one or more of these elements, in this order:

### Flags field:

The Flags field can be zero or more (in any order) of:

```
- (minus) Left-align the output of this placeholder. (The default is to right-align the output.)
          This is used in conjunction with width field.

+ (plus)  Prepends a plus for positive numbers with the d, i, e, f, and g types. positive = +, negative = -
          (The default doesn't prepend anything in front of positive numbers.)

0 (zero)  When the 'width' option is specified, prepends zeros instead of spaces, for every type except j.
          For example, %2X with 3 produces " 3", while %02X produces "03".
          Combined with the minus flag, the zeros go on the right: %0-5s with ">" produces ">0000",
          and %-05d with 2 produces "20000".

' (quote) Separates thousands for the d, i, e, f, and g types, keeping the formatted decimals.
          The separators follow the browser's locale, e.g. %'.2f with 1234.5 produces "1,234.50" in en-US
          and "1.234,50" in de-DE. Values in exponent form are not changed.

#{char}   An optional padding specifier that says what character to use for padding (if specified).
          Possible values are any character except the digits 1-9 and newlines, preceded by a # (hash).
          For example, %#_5d with 10 produces "___10".

(space)   Pads with spaces, which is already the default. Unlike C, it doesn't add a space before positive numbers.
```
### Width field

The Width field specifies a minimum number of characters to output, and is typically used to pad fixed-width fields, where the fields would otherwise be smaller, although it does not cause truncation of oversized fields.

For example, `%5d` with `10` will result in `"   10"` being printed, with a total width of 5 characters.

Though not part of the width field, a leading zero is interpreted as the zero-padding flag mentioned above.

When used with the j (JSON) type specifier, the width is the number of spaces used for indentation, and the output isn't padded.


### Precision Field

The Precision field usually specifies a maximum limit on the output, depending on the particular formatting type.

- For `e` and `f`, it specifies the number of digits after the decimal point that the output should be rounded to. For example, `%.3f` with `3.42134` results in `3.421`.
- For `g`, it specifies the number of significant digits. A precision of 0 is treated as 1, and a precision above 100 is not allowed.
- For `s` and `t`, it limits the number of characters that should be output, after which the string is truncated. For example, `%.3s` with `3.42134` results in `3.4`. `v` works the same way, but only for string values.
- Other types ignore it. For example, unlike C, `%.3d` doesn't zero-pad the integer.

### Type Field

It can be any of:

```
%%     : yields a literal % character
b      : yields an integer as a binary number
c      : yields an integer as the character with that character code
d or i : yields an integer as a signed decimal number
e      : yields a float using scientific notation
f      : yields a float as is; see notes on precision above
g      : yields a float with the given number of significant digits. Trailing zeros are dropped, and unlike C
         there's no exponent form for values between 1e-6 and 1e21 (%.2g with 123456 yields 120000).
o      : yields an integer as an octal number
s      : yields a string as is
t      : yields true or false (or bool_true_value and bool_false_value). The strings "true", "false", "0",
         and "" are read as booleans.
u      : yields an integer as an unsigned decimal number
v      : yields the primitive value of the argument (valueOf)
X      : yields an integer as a hexadecimal number (upper-case)
j      : yields a JavaScript object or array as a JSON encoded string
```

### Not supported

The following parts of C's printf and sprintf.js are not supported, and using them throws an error:

- `*` for the width or precision, and positional arguments like `%1$s`, since each format is given a single value.
- The `x`, `E`, `F`, and `G` types, and length modifiers like `%ld` or `%hd`.

### Named arguments:

Format strings may contain replacement fields rather than positional placeholders. Instead of referring to the whole value, you can refer to a certain key within it. Replacement fields are surrounded by parentheses - `(` and `)` - and begin with a key:

```js
value => { name: 'Dolly' }

format => 'Hello %(name)s'

output => Hello Dolly
```

Keys in replacement fields can be optionally followed by any number of keys or indexes:

```js
value => {
    users: [
        {name: 'Dolly'},
        {name: 'Molly'},
        {name: 'Polly'},
    ]
}

format => 'Hello %(users[0].name)s, %(users[1].name)s and %(users[2].name)s'

output => Hello Dolly, Molly and Polly
```

Indexes can also be written in the handlebars style (`users.0.name` or `users.[0].name`), and when the value itself is an array, it can be indexed directly (`[0].name` or `0.name`). Keys can contain letters, digits, and `_` (but can't start with a digit), and indexes are digits only, so keys with other characters, like handlebars' `[Column Name]`, are not supported.

If a key doesn't exist, it's formatted as an empty string: `s` yields `""`, `t` yields `false`, and the number types yield `NaN` (`u`, `o`, and `X` yield `0`).

## Examples:

| Expression   | Input     | Output        | Note |
| :-------------| :------- |:-------------|:-------------|
| '%.1f'| 2.345 | '2.3' | Round float to 1 decimal place |
| '%d' | 12345668 | '12345668' | Disable default thousand separator for integers |
| %'15d | 12345668 | '     12,345,668' | Enable thousand separator (width 15) |
| '%%'|  | '%' | Literal percent sign |
| '%b'| 2 | '10' | Integer as binary |
| '%c'| 65 | 'A' | Integer as ASCII character |
| '%d'| 2 | '2' | Signed decimal integer |
| '%i'| 2 | '2' | Signed decimal integer |
| '%d'| '2' | '2' | String coerced to integer |
| '%i'| '2' | '2' | String coerced to integer |
| '%j'| { "foo": "bar" } | '{"foo":"bar"}' | Object as JSON |
| '%j'| ["foo", "bar"] | '["foo","bar"]' | Array as JSON |
| '%e'| 2 | '2e+0' | Scientific notation |
| '%u'| 2 | '2' | Unsigned integer |
| '%u'| -2 | '4294967294' | Negative wraps as unsigned |
| '%f'| 2.2 | '2.2' | Float as-is |
| '%g'| 3.141592653589793 | '3.141592653589793' | Float as-is |
| '%o'| 8 | '10' | Integer as octal |
| '%o'| -8 | '37777777770' | Negative octal |
| '%s'| '%s' | '%s' | String as-is |
| '%X'| 255 | 'FF' | Integer as uppercase hex |
| '%X'| -255 | 'FFFFFF01' | Negative hex |
| 'Hello %(who)s!'| { who: 'world' } | 'Hello world!' | Named argument from object |
| '%t'| true | 'true' | Boolean as text |
| '%.1t'| true | 't' | Boolean truncated to 1 char |
| '%t'| 'true' | 'true' | Truthy value as boolean |
| '%t'| 1 | 'true' | Truthy value as boolean |
| '%t'| false | 'false' | Boolean as text |
| '%.1t'| false | 'f' | Boolean truncated to 1 char |
| '%t'| '' | 'false' | Falsy value as boolean |
| '%t'| 0 | 'false' | Falsy value as boolean |
| '%d'| 2 | '2' | Signed decimal integer |
| '%d'| -2 | '-2' | Negative integer |
| '%+d'| 2 | '+2' | Force sign on positives |
| '%+d'| -2 | '-2' | Force sign on positives |
| '%i'| 2 | '2' | Signed decimal integer |
| '%i'| -2 | '-2' | Negative integer |
| '%+i'| 2 | '+2' | Force sign on positives |
| '%+i'| -2 | '-2' | Force sign on positives |
| '%f'| 2.2 | '2.2' | Float as-is |
| '%f'| -2.2 | '-2.2' | Negative float |
| '%+f'| 2.2 | '+2.2' | Force sign on positives |
| '%+f'| -2.2 | '-2.2' | Force sign on positives |
| '%+.1f'| -2.34 | '-2.3' | Signed, 1 decimal place |
| '%+.1f'| -0.01 | '-0.0' | Signed, 1 decimal place |
| '%.6g'| 3.141592653589793 | '3.14159' | 6 significant digits |
| '%.3g'| 3.141592653589793 | '3.14' | 3 significant digits |
| '%.1g'| 3.141592653589793 | '3' | 1 significant digit |
| '%+010d'| -123 | '-000000123' | Signed, zero-padded to width |
| '%+#_10d'| -123 | '______-123' | Signed, custom pad char |
| '%f'| -234.34 | '-234.34' | Negative float |
| '%05d'| -2 | '-0002' | Pad with leading zeros to width 5 |
| '%05i'| -2 | '-0002' | Pad with leading zeros to width 5 |
| '%5s'| '<' | '    <' | Right-align to width 5 |
| '%05s'| '<' | '0000<' | Zero-pad string to width 5 |
| '%#_5s'| '<' | '____<' | Custom pad char to width 5 |
| '%-5s'| '>' | '>    ' | Left-align to width 5 |
| '%0-5s'| '>' | '>0000' | Left-align, zero-padded |
| '%#_-5s'| '>' | '>____' | Left-align, custom pad char |
| '%5s'| 'xxxxxx' | 'xxxxxx' | Width does not truncate |
| '%02u'| 1234 | '1234' | Width does not truncate |
| '%8.3f'| -10.23456 | ' -10.235' | Width 8, 3 decimal places |
| '%f %s'| -12.34 | '-12.34 -12.34' | Multiple placeholders format the same value |
| '%2j'| { "foo": "bar" } | '{\n  "foo": "bar"\n}' | Pretty-print JSON with 2-space indent |
| '%2j'| ["foo", "bar"] | '[\n  "foo",\n  "bar"\n]' | Pretty-print JSON array |
| '%5.5s'| 'xxxxxx' | 'xxxxx' | Precision truncates string |
| '%5.1s'| 'xxxxxx' | '    x' | Truncate then right-align |
| %'15.3f | 10000.23456 | '     10,000.235' | Thousand separator, 3 decimals |
| %'.2f | 1234.5 | '1,234.50' | Thousand separator keeps the decimals |
| '%.2g'| 123456 | '120000' | 2 significant digits |

Example for using json keys in format

```js
Format => "My name is %(name)s. My age is %(age)d years and I study at %(school.name)s located in %(school.location)s. My GPA is %(grade).2f"

Value => { name: 'John Doe', age: 24, school: { name: 'USC',  location: 'Los Angeles CA' }, grade: 3.9822 }

Output => 'My name is John Doe. My age is 24 years and I study at USC located in Los Angeles CA. My GPA is 3.98'

```
## Syntax for Dates and Timestamps

[Format tokens](https://momentjs.com/docs/#/displaying/format/) as defined in `moment.js` documentation.

### Most common Year, Month, and Day tokens:

| Input      | Example         | Description |
| ---------- | --------------- | ----------- |
| `YYYY`     | `2014`          | 4 digit year |
| `YY`       | `14`            | 2 digit year |
| `M MM`     | `1..12`         | Month number |
| `MMM MMMM` | `Jan..December` |  Month name in locale |
| `D DD`     | `1..31`         | Day of month |
| `Do`       | `1st..31st`     | Day of month with ordinal |
| `DDD DDDD` | `1..365`        | Day of year |

### Most common Hour, minute, second, millisecond, and offset tokens:

| Input      | Example  | Description |
| ---------- | -------- | ----------- |
| `H HH`     | `0..23`  | Hours (24 hour time) |
| `h hh`     | `1..12`  | Hours (12 hour time used with `a A`.) |
| `k kk`     | `1..24`  | Hours (24 hour time from 1 to 24) |
| `a A`      | `am pm`  | Post or ante meridiem |
| `m mm`     | `0..59`  | Minutes |
| `s ss`     | `0..59`  | Seconds |
| `S SS SSS` | `0..999` | Fractional seconds |
| `Z ZZ`     | `+12:00` | Offset from UTC as `+-HH:mm` or `+-HHmm` |
