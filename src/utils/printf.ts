/*!
 * Adapted from sprintf.js (https://github.com/alexei/sprintf.js), modified for ermrestjs.
 *
 * Copyright (c) 2007-present, Alexandru Mărășteanu <hello@alexei.ro>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 * * Neither the name of this software nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without
 *   specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import moment from 'moment-timezone';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';
import { isDefinedAndNotNull, isValidTimezone } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

export type PrintfOptions = {
  format: string;
  bool_true_value?: string;
  bool_false_value?: string;
  // only used for date, timestamp, and timestamptz values
  timezone?: string;
};

type PrintfPlaceholder = {
  placeholder: string;
  keys?: string[];
  sign?: boolean;
  padChar?: string;
  hasThousandSeparator?: boolean;
  leftAlign?: boolean;
  // kept as the captured strings since the truthiness checks rely on it (e.g. '0' in `%.0f`)
  width?: string;
  precision?: string;
  type: string;
};

type PrintfParseTree = Array<string | PrintfPlaceholder>;

// A list of regular expression to extract flags, width and precision from format strings
const re = {
  number: /[diefg]/,
  numeric_arg: /[bcdiefguX]/,
  text: /^[^\x25]+/,
  modulo: /^\x25{2}/,
  placeholder: /^\x25(?:\(([^)]+)\))?((?:(\+)?(\s|0|#[^\n\r1-9])?(')?(-)?)*)(\d+)?(?:\.(\d+))?([b-gijostuvX])/,
  // first segment of a named argument: `name`, `0`, or `[0]`
  key: /^(?:([a-z_][a-z_\d]*|\d+)|\[(\d+)\])/i,
  // the following segments: `.name`, `.0`, `[0]`, or `.[0]`
  key_access: /^(?:\.([a-z_][a-z_\d]*|\d+)|\.?\[(\d+)\])/i,
  sign: /^[+-]/,
};

const printfCache = new Map<string, PrintfParseTree>();

// parseInt reads exponent forms like `5e-7` as `5`, and parseFloat rounds long decimal strings before truncating
function toInteger(value: unknown): number {
  const str = String(value);
  return /e/i.test(str) ? Math.trunc(parseFloat(str)) : parseInt(str, 10);
}

function printfFormat(parseTree: PrintfParseTree, value: unknown, options: PrintfOptions): string {
  let output = '';

  for (const node of parseTree) {
    if (typeof node === 'string') {
      output += node;
      continue;
    }

    const ph = node;
    let arg: unknown = value;

    if (ph.keys) {
      // keyword argument
      for (const key of ph.keys) {
        if (!Object.prototype.hasOwnProperty.call(arg, key)) {
          $log.info('[printf] property "' + key + '" does not exist');
        }
        arg = (arg as Record<string, unknown>)[key];

        // For values which don't exist in json object for corresponding keys we substitute them with empty string
        if (arg === undefined || arg === null) {
          arg = '';
          break;
        }
      }
    }

    if (re.numeric_arg.test(ph.type) && typeof arg !== 'number' && isNaN(Number(arg))) {
      throw new TypeError('[printf] expecting number but found ' + String(arg));
    }

    const isNumber = re.number.test(ph.type);
    // written as "not negative" so NaN doesn't get a minus sign
    const isPositive = isNumber && !(Number(arg) < 0);

    let formatted: unknown = arg;
    switch (ph.type) {
      case 'b':
        formatted = toInteger(arg).toString(2);
        break;
      case 'c':
        formatted = String.fromCharCode(toInteger(arg));
        break;
      case 'd':
      case 'i':
        formatted = toInteger(arg);
        break;
      case 'j':
        formatted = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0);
        break;
      case 'e':
        formatted = ph.precision ? parseFloat(String(arg)).toExponential(Number(ph.precision)) : parseFloat(String(arg)).toExponential();
        break;
      case 'f':
        formatted = ph.precision ? parseFloat(String(arg)).toFixed(Number(ph.precision)) : parseFloat(String(arg));
        break;
      case 'g': {
        const num = parseFloat(String(arg));
        /*
         * same as sprintf.js: going through Number drops the trailing zeros, and the exponent form for
         * values between 1e-6 and 1e21. precision 0 is treated as 1, like C.
         */
        formatted = ph.precision ? String(Number(num.toPrecision(Math.max(1, Number(ph.precision))))) : num;
        break;
      }
      case 'o':
        formatted = (toInteger(arg) >>> 0).toString(8);
        break;
      case 's': {
        const str = String(arg);
        formatted = ph.precision ? str.substring(0, Number(ph.precision)) : str;
        break;
      }
      case 't': {
        let bool = arg;
        if (typeof bool === 'string') {
          if (bool === 'true') bool = true;
          else if (bool === 'false') bool = false;
          else if (bool === '0') bool = 0;
          else if (bool.length === 0) bool = false;
        }
        let str: string;
        if (bool) {
          str = options.bool_true_value || String(!!bool);
        } else {
          str = options.bool_false_value !== undefined ? options.bool_false_value : String(!!bool);
        }
        formatted = ph.precision ? str.substring(0, Number(ph.precision)) : str;
        break;
      }
      case 'u':
        formatted = toInteger(arg) >>> 0;
        break;
      case 'v': {
        // the casts keep the old behavior of throwing for null, and for non-strings when precision is set
        const primitive: unknown = (arg as object).valueOf();
        formatted = ph.precision ? (primitive as string).substring(0, Number(ph.precision)) : primitive;
        break;
      }
      case 'X':
        formatted = (toInteger(arg) >>> 0).toString(16).toUpperCase();
        break;
    }

    if (ph.type === 'j') {
      output += String(formatted);
    } else {
      let sign = '';
      if (isNumber) {
        if (ph.hasThousandSeparator) {
          const str = String(formatted);
          const num = Math.abs(Number(str));
          if (Number.isFinite(num) && !/e/i.test(str)) {
            /*
             * keep the decimals that are already formatted (toLocaleString defaults to at most 3).
             * abs since the sign is added below, and some locales use a non-ASCII minus.
             */
            const decimals = str.includes('.') ? str.length - str.indexOf('.') - 1 : 0;
            formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          }
        }

        if (!isPositive || ph.sign) {
          sign = isPositive ? '+' : '-';
          formatted = String(formatted).replace(re.sign, '');
        }
      }
      const text = String(formatted);
      const padCharacter = ph.padChar !== undefined ? ph.padChar : ' ';
      const padLength = Number(ph.width) - (sign + text).length;
      const pad = ph.width ? (padLength > 0 ? padCharacter.repeat(padLength) : '') : '';
      output += ph.leftAlign ? sign + text + pad : padCharacter === '0' ? sign + pad + text : pad + sign + text;
    }
  }
  return output;
}

function printfParse(fmt: string): PrintfParseTree {
  const cached = printfCache.get(fmt);
  if (cached) {
    return cached;
  }

  const parseTree: PrintfParseTree = [];
  let remaining = fmt;
  let match: RegExpExecArray | null;

  while (remaining) {
    if ((match = re.text.exec(remaining)) !== null) {
      parseTree.push(match[0]);
    } else if ((match = re.modulo.exec(remaining)) !== null) {
      parseTree.push('%');
    } else if ((match = re.placeholder.exec(remaining)) !== null) {
      let keys: string[] | undefined;
      if (match[1]) {
        keys = [];
        let replacementField = match[1];
        let fieldMatch = re.key.exec(replacementField);
        if (fieldMatch === null) {
          throw new SyntaxError('[printf] failed to parse named argument key');
        }
        // group 1 is a name or `0`, group 2 is the digits of `[0]`
        keys.push(fieldMatch[1] ?? fieldMatch[2]);
        while ((replacementField = replacementField.substring(fieldMatch[0].length)) !== '') {
          fieldMatch = re.key_access.exec(replacementField);
          if (fieldMatch === null) {
            throw new SyntaxError('[printf] failed to parse named argument key');
          }
          keys.push(fieldMatch[1] ?? fieldMatch[2]);
        }
      }

      const flags = match[2] || '';
      let leftAlign: boolean | undefined;
      let padChar: string | undefined;
      let sign: boolean | undefined;
      let hasThousandSeparator: boolean | undefined;
      let i = 0;

      while (i < flags.length) {
        const flag = flags[i];
        switch (flag) {
          case "'":
            if (hasThousandSeparator !== undefined) {
              throw new SyntaxError('[printf] format syntax ' + match[0] + " is invalid as it contains more than 1 (') thousand separator");
            } else {
              hasThousandSeparator = true;
            }
            break;

          case '+':
            if (sign !== undefined) {
              throw new SyntaxError('[printf] format syntax ' + match[0] + ' is invalid as it contains more than 1 (+) signs');
            } else {
              sign = true;
            }
            break;

          case '-':
            if (leftAlign !== undefined) {
              throw new SyntaxError('[printf] format syntax ' + match[0] + ' is invalid as it contains more than 1 (-) align operator');
            } else {
              leftAlign = true;
            }
            break;

          case '#':
            if (padChar !== undefined) {
              throw new SyntaxError('[printf] format syntax ' + match[0] + ' is invalid as it contains more than 1 (#) pad char syntax');
            } else {
              padChar = flags[++i];
            }
            break;
          case '0':
          case ' ':
            if (padChar !== undefined) {
              throw new SyntaxError('[printf] format syntax ' + match[0] + ' is invalid as it contains more than 1 pad char syntax');
            } else {
              padChar = flag;
            }
            break;
          default:
            throw new SyntaxError('[printf] format syntax ' + match[0] + ' is invalid as it contains invalid flag ' + flag);
        }

        i++;
      }

      parseTree.push({
        placeholder: match[0],
        keys,
        sign,
        padChar,
        hasThousandSeparator,
        leftAlign,
        width: match[7],
        precision: match[8],
        type: match[9],
      });
    } else {
      throw new SyntaxError('[printf] unexpected placeholder');
    }
    remaining = remaining.substring(match[0].length);
  }
  printfCache.set(fmt, parseTree);
  return parseTree;
}

/**
 * Format a value using a C-style printf format string (adapted from sprintf.js).
 *
 * %[(key)][flags][width][.precision]type
 *
 * Flags (zero or more, in any order):
 *   -         Left-align the output within the width. (The default is to right-align.)
 *   +         Add a plus sign to positive numbers for the numeric types (d, i, e, f, g).
 *             (By default only negative numbers get a sign.)
 *   0         Pad with zeros instead of spaces when a width is given, e.g. %2X with 3 gives " 3", while %02X gives "03".
 *   ' (quote) Separate thousands for the numeric types (d, i, e, f, g) using the locale's separators, keeping the
 *             decimals, e.g. %'d with 1234567 gives "1,234,567" and %'.2f with 1234.5 gives "1,234.50".
 *   #{char}   Pad with the given character, e.g. %#_5d with 10 gives "___10".
 *
 * Width: the minimum number of characters to output. Shorter output is padded, and longer output isn't truncated,
 *   e.g. %5d with 10 gives "   10". For the j type, the width is the number of spaces used to indent the JSON instead.
 *
 * Precision: for e and f, the number of digits after the decimal point (%.3f with 3.42134 gives "3.421").
 *   For g, the number of significant digits (%.3g with 3.14159 gives "3.14").
 *   For s, t and v, the maximum number of characters (%.3s with 3.42134 gives "3.4"). Other types ignore it.
 *
 * Types:
 *   %%     : a literal % character
 *   b      : an integer as a binary number
 *   c      : an integer as the character with that character code
 *   d or i : an integer as a signed decimal number
 *   e      : a float in scientific notation
 *   f      : a float as is, see precision above
 *   g      : a float with the given significant digits. Trailing zeros are dropped, and unlike C there's no
 *            exponent form for values between 1e-6 and 1e21 (%.2g with 123456 gives "120000").
 *   o      : an integer as an octal number
 *   s      : a string as is
 *   t      : "true" or "false", or the bool_true_value/bool_false_value options when given.
 *            The strings "true", "false", "0" and "" are read as booleans.
 *   u      : an integer as an unsigned decimal number
 *   v      : the primitive value of the argument (valueOf)
 *   X      : an integer as an uppercase hexadecimal number
 *   j      : an object or array as a JSON string
 *
 * Named arguments:
 *   Instead of formatting the whole value, a placeholder can refer to a key in it. The key goes in parentheses
 *   and can be followed by any number of keys or indexes. Indexes can be written JS style (users[0].name) or
 *   handlebars style (users.0.name or users.[0].name), and an array value can be indexed directly ([0].name).
 *
 *     printf({ format: 'Hello %(name)s' }, { name: 'Dolly' })
 *     // Hello Dolly
 *     printf({ format: 'Hello %(users[0].name)s and %(users[1].name)s' }, { users: [{ name: 'Dolly' }, { name: 'Molly' }] })
 *     // Hello Dolly and Molly
 *
 *   A missing key is formatted as an empty string, so s gives "", t gives "false", and the number types give
 *   "NaN" (u, o and X give "0"). If the value itself is null or undefined, a named placeholder throws.
 *
 *   Placeholders without a key format the whole value (%s %s with "a" gives "a a"), so mixing them with named
 *   placeholders isn't supported.
 *
 * @param options the format string, or an object with the format and the optional bool_true_value and bool_false_value
 *   used by the t type, and timezone used by date types.
 * @param value the value to format
 * @param type the column type of the value. For date, timestamp, and timestamptz, the format is a moment.js format
 *   string (e.g. YYYY-MM-DD) instead of a printf one, and the value is shown in the timezone option when given
 *   (an IANA name like UTC or America/Los_Angeles; an unknown name throws).
 */
export function printf(options: string | PrintfOptions, value: unknown, type?: string): string {
  if (typeof options === 'string') {
    options = { format: options };
  }
  if (typeof options.format !== 'string') {
    throw new SyntaxError("[printf] should be supplied with proper pre_format annotation with format string. Eg: { format: '%d' }");
  }
  if (type === 'date' || type === 'timestamp' || type === 'timestamptz') {
    const m = moment(value as moment.MomentInput);
    if (isDefinedAndNotNull(options.timezone)) {
      // throwing makes the column fall back to its default display, like an invalid format does
      if (!isValidTimezone(options.timezone)) {
        throw new Error(`[printf] invalid timezone in pre_format annotation: ${options.timezone}`);
      }
      m.tz(options.timezone);
    }
    return m.format(options.format);
  } else {
    return printfFormat(printfParse(options.format), value, options);
  }
}
