/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import moment from 'moment-timezone';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import {
  _classNames,
  _dataFormats,
  _datetimeDuration,
  _specialPresentation,
  DURATION_DIRECTION,
  DURATION_UNIT,
  type DurationDirection,
  type DurationRealUnit,
  type DurationUnit,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isValidColorRGBHex } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

// legacy
import { _escapeMarkdownCharacters } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/**
 * Truncate a number to a given number of significant digits.
 *
 * Note this **truncates** (`Math.floor`) rather than rounding, and operates on
 * significant digits rather than decimal places — unlike `_toFixed`
 * below. Used by `humanizeBytes` to keep byte counts from being padded.
 *
 * @param num the number to truncate
 * @param precision target number of significant digits; coerced via `parseInt`
 *                  and clamped to `minAllowedPrecision`
 * @param minAllowedPrecision floor for `precision` (e.g. 3 for `si`, 4 for `binary`)
 * @returns the truncated value as a string (sign-prefixed when negative). Falls
 *          back to the un-truncated number when the calculation overflows to NaN.
 */
export function _toPrecision(num: number, precision: any, minAllowedPrecision: number): string | number {
  precision = parseInt(precision);
  precision = isNaN(precision) || precision < minAllowedPrecision ? minAllowedPrecision : precision;

  const isNegative = num < 0;
  if (isNegative) num = num * -1;

  // Truncation here depends on `minAllowedPrecision`; relaxing the floor needs new math.
  let displayedNum: any = num.toString();
  const f = displayedNum.indexOf('.');
  if (f !== -1) {
    // find the number of digits after decimal point
    const decimalPlaces = Math.pow(10, precision - f);

    // truncate the value
    displayedNum = Math.floor(num * decimalPlaces) / decimalPlaces;
  }

  // if precision is too large, the calculation might return NaN.
  if (isNaN(displayedNum)) {
    return (isNegative ? '-' : '') + num;
  }

  return (isNegative ? '-' : '') + displayedNum;
}

/**
 * Round `value` to `fraction` decimal places and emit it as a string with
 * trailing zeros preserved. Decimal-places + rounding semantics — NOT
 * `_toPrecision`, which truncates on significant digits.
 *
 * Distinct from `Number.prototype.toFixed` in that the value is explicitly
 * rounded via `Math.round` before formatting, avoiding the platform-specific
 * banker's-rounding edge cases that `toFixed` exhibits.
 *
 * @param value the number to format
 * @param fraction number of decimal places to retain
 * @returns the rounded number as a fixed-precision string
 */
function _toFixed(value: number, fraction: number): string {
  const m = Math.pow(10, fraction);
  return (Math.round(value * m) / m).toFixed(fraction);
}

/**
 * Pick the largest unit (year > month > ... > millisecond) for which the
 * given duration is at least one whole unit. Used by `unit="auto"`.
 *
 * @param absMs the absolute duration in milliseconds
 * @returns the chosen unit name (e.g. `'year'`, `'second'`)
 */
function _durationPickAutoUnit(absMs: number): DurationRealUnit {
  for (let i = 0; i < _datetimeDuration.UNIT_ORDER.length; i++) {
    const u = _datetimeDuration.UNIT_ORDER[i];
    if (absMs / _datetimeDuration.CONVERSION_RATES[u] >= 1) return u;
  }
  return DURATION_UNIT.MILLISECOND;
}

/**
 * Format a duration in a single named unit (e.g. `"1.5 days"`). When
 * `unit === 'auto'`, the unit is picked via `_durationPickAutoUnit`. Always
 * uses fixed Julian conversion rates (1Y = 365.25d, 1M = 30.4375d).
 *
 * @param absMs the absolute duration in milliseconds
 * @param unit one of the unit names in `_datetimeDuration.UNIT_ORDER`, or `'auto'`
 * @param fraction number of decimal places to show
 * @returns the formatted duration with a pluralized unit suffix
 */
function _durationFormatSingleUnit(absMs: number, unit: DurationUnit, fraction: number): string {
  const realUnit: DurationRealUnit = unit === DURATION_UNIT.AUTO ? _durationPickAutoUnit(absMs) : (unit as DurationRealUnit);
  const value = absMs / _datetimeDuration.CONVERSION_RATES[realUnit];
  return _toFixed(value, fraction) + ' ' + realUnit + 's';
}

/**
 * Format a duration as a chain of fixed-math unit components
 * (e.g. `"1M 4D 13h 30m 0s"`). Walks year > month > ... > minute consuming
 * whole units, then puts any remainder on seconds at the configured precision.
 *
 * Because the math is fixed-Julian rather than calendar-aware, round calendar
 * diffs will show "lopover": e.g. 365 days renders as `"11M 30D 4h 30m"`
 * since 1M = 30.4375d. For clean calendar output use `_durationFormatCalendarWalk`.
 *
 * @param absMs the absolute duration in milliseconds
 * @param fraction decimal places shown on the seconds component
 * @returns space-separated multi-unit string
 */
function _durationFormatMultiFixed(absMs: number, fraction: number): string {
  const parts: string[] = [];
  let rest = absMs;
  const midUnits: Array<keyof typeof _datetimeDuration.CONVERSION_RATES> = ['year', 'month', 'day', 'hour', 'minute'];
  for (let i = 0; i < midUnits.length; i++) {
    const u = midUnits[i];
    const whole = Math.floor(rest / _datetimeDuration.CONVERSION_RATES[u]);
    if (whole > 0) parts.push(whole + _datetimeDuration.ABBREVIATIONS[u]);
    rest -= whole * _datetimeDuration.CONVERSION_RATES[u];
  }
  const sec = rest / _datetimeDuration.CONVERSION_RATES.second;
  if (sec > 0 || parts.length === 0) {
    parts.push(_toFixed(sec, fraction) + 's');
  }
  return parts.join(' ');
}

/**
 * Format a duration as a chain of calendar-aware unit components using
 * `moment.diff` + `moment.add`. Yields clean breakdowns for round calendar
 * diffs (1 year → `"1Y"`, 1 month + 4 days → `"1M 4D"`), unlike the
 * fixed-math variant.
 *
 * Two quirks to know about:
 * - Operates in UTC so calendar boundaries don't shift with the host's local
 *   time zone (without this, "Jan 31Z → Feb 28Z" on an EST host would walk
 *   through "Jan 30 19:00 → Feb 27 19:00" and report 28 days instead of 1 month).
 * - Inherits moment's month-end clamping: `Jan 31 → Feb 28` consumes a whole
 *   month, producing `"1M 0D"`. This is moment's documented behavior.
 *
 * @param startM the start moment (sign re-applied by the caller)
 * @param endM the end moment
 * @param fraction decimal places shown on the seconds component
 * @returns space-separated multi-unit string
 */
function _durationFormatCalendarWalk(startM: moment.Moment, endM: moment.Moment, fraction: number): string {
  let a: moment.Moment, b: moment.Moment;
  if (endM.isBefore(startM)) {
    a = endM.clone().utc();
    b = startM.clone().utc();
  } else {
    a = startM.clone().utc();
    b = endM.clone().utc();
  }

  const cursor = a.clone();
  const parts: string[] = [];
  const midUnits: Array<'year' | 'month' | 'day' | 'hour' | 'minute'> = ['year', 'month', 'day', 'hour', 'minute'];
  for (let i = 0; i < midUnits.length; i++) {
    const u = midUnits[i];
    const n = b.diff(cursor, u);
    if (n > 0) parts.push(n + _datetimeDuration.ABBREVIATIONS[u]);
    cursor.add(n, u);
  }
  const sec = b.diff(cursor) / 1000;
  if (sec > 0 || parts.length === 0) {
    parts.push(_toFixed(sec, fraction) + 's');
  }
  return parts.join(' ');
}

/**
 * Apply the requested direction modifier to a formatted duration.
 *
 * Behavior:
 * - `unsigned` returns the value unchanged.
 * - `before/after` appends `"before"` or `"after"`.
 * - `earlier/later` appends `"earlier"` or `"later"`.
 * - `sign` (default) prepends `+` or `-`.
 *
 * @param visible the duration string to decorate
 * @param signSign +1 when end is after start, -1 otherwise
 * @param direction one of the values in `_datetimeDuration.VALID_DIRECTIONS`
 * @returns the directionally-adorned duration string
 */
function _durationApplyDirection(visible: string, signSign: number, direction: DurationDirection): string {
  if (direction === DURATION_DIRECTION.UNSIGNED) return visible;
  if (direction === DURATION_DIRECTION.BEFORE_AFTER) return visible + ' ' + (signSign > 0 ? 'after' : 'before');
  if (direction === DURATION_DIRECTION.EARLIER_LATER) return visible + ' ' + (signSign > 0 ? 'later' : 'earlier');
  return (signSign > 0 ? '+' : '-') + visible;
}

/**
 * Wrap a formatted duration in a Chaise tooltip span. The tooltip body shows
 * the fixed-math multi-unit form on line 1 and the Julian conversion rates
 * for only the units that appear in line 1 on a second line.
 *
 * @param visible the visible (signed) duration text
 * @param absMs the absolute duration in ms (used to derive the tooltip body)
 * @returns the wrapped Chaise tooltip span markup
 */
function _durationWrapTooltip(visible: string, absMs: number): string {
  const multi = _durationFormatMultiFixed(absMs, 2);

  const used = new Set<string>();
  for (const tok of multi.split(' ')) {
    const m = tok.match(/[a-zA-Z]+$/);
    if (m) used.add(m[0]);
  }
  const ratesByAbbrev: ReadonlyArray<[string, string]> = [
    ['Y', 'Y = 365.25 days'],
    ['M', 'M = 30.4375 days'],
    ['D', 'D = 24 hours'],
    ['h', 'h = 60 minutes'],
    ['m', 'm = 60 seconds'],
  ];
  const usedRates = ratesByAbbrev.filter(([abbrev]) => used.has(abbrev)).map(([, text]) => text);
  // Two rates per line to keep the tooltip from getting too wide.
  const rateLines: string[] = [];
  for (let i = 0; i < usedRates.length; i += 2) {
    rateLines.push(usedRates.slice(i, i + 2).join(', '));
  }
  const rates = rateLines.join('&#10;');

  // `&#10;` instead of literal `\n`: a real newline inside `{...}` breaks
  // markdown-it-attrs's parsing of the attribute block.
  const tooltip = rates ? multi + '&#10;&#10;' + rates : multi;
  return ':span:' + visible + ':/span:{data-chaise-tooltip="' + tooltip + '"}';
}

// --- Printable formatters (the contents of _formatUtils) ---

/**
 * Format a boolean value for display.
 *
 * @param value the value to format; `null` returns an empty string
 * @param options unused (kept for signature parity with the other formatters)
 * @returns `"true"`, `"false"`, or `""` for null
 */
export function printBoolean(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;
  if (value === null) {
    return '';
  }
  return Boolean(value).toString();
}

/**
 * Format an integer value with thousands separators (e.g. `1234567` -> `"1,234,567"`).
 * Any fractional part is rounded off via `Math.round`.
 *
 * @param value the value to format; `null` returns an empty string
 * @param options unused (kept for signature parity with the other formatters)
 * @returns the comma-separated integer string
 */
export function printInteger(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;
  if (value === null) {
    return '';
  }

  // Remove fractional digits
  value = Math.round(value);

  // Add comma separators
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format a timestamp value into the project's display format
 * (`_dataFormats.DATETIME.display`, e.g. `"2017-01-08 15:06:02"`).
 *
 * @param value any value moment() can parse (also `.toString()`-able)
 * @param options unused (kept for signature parity)
 * @returns the formatted timestamp, or `""` when the input is invalid/null
 */
export function printTimestamp(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;
  if (value === null) {
    return '';
  }

  try {
    value = value.toString();
  } catch (exception) {
    $log.error("Couldn't extract timestamp from input: " + value);
    $log.error(exception);
    return '';
  }

  if (!moment(value).isValid()) {
    $log.error("Couldn't transform input to a valid timestamp: " + value);
    return '';
  }

  return moment(value).format(_dataFormats.DATETIME.display);
}

/**
 * Format a date (or date-time) value into the project's date display format
 * (`_dataFormats.DATE`). Any time component is dropped.
 *
 * @param value any value moment() can parse (also `.toString()`-able)
 * @param options unused (kept for signature parity)
 * @returns the formatted date, or `""` when the input is invalid/null
 */
export function printDate(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;
  if (value === null) {
    return '';
  }
  try {
    value = value.toString();
  } catch (exception) {
    $log.error("Couldn't extract date info from input: " + value);
    $log.error(exception);
    return '';
  }

  if (!moment(value).isValid()) {
    $log.error("Couldn't transform input to a valid date: " + value);
    return '';
  }

  return moment(value).format(_dataFormats.DATE);
}

/**
 * Format a float for display: leading zeros stripped, thousands separators
 * added. When no explicit precision is given, values >= 1e12 or < 1e-6 fall
 * back to scientific notation; otherwise four fractional digits are shown.
 *
 * @param value the value to format; `null` returns an empty string
 * @param options optional config:
 *   - `numFracDigits` — number of fractional digits to keep (`toFixed` rounds)
 * @returns the formatted float string
 */
export function printFloat(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;

  if (value === null) {
    return '';
  }

  value = parseFloat(value);
  if (options.numFracDigits) {
    value = value.toFixed(options.numFracDigits); // toFixed() rounds the value, is ok?
  } else {
    // >= 1e12 or < 1e-6: switch to scientific notation. toPrecision(5) ensures
    // enough digits that the result formats as exponential rather than padded zeros.
    if (Math.abs(value) >= 1000000000000 || Math.abs(value) < 0.000001) {
      value = value.toPrecision(5);
    } else {
      value = value.toFixed(4);
    }
  }

  // Remove leading zeroes
  value = value.toString().replace(/^0+(?!\.|$)/, '');

  // Add comma separators
  const parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Format a text value for display. Objects are JSON-stringified; everything
 * else goes through `.toString()`.
 *
 * @param value the value to format; `null` returns an empty string
 * @param options unused (kept for signature parity)
 * @returns the value as a string
 */
export function printText(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;
  if (value === null) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
}

/**
 * Render a markdown string to HTML for display.
 *
 * @param value the markdown source; `null` returns an empty string
 * @param options optional config:
 *   - `inline` — render in inline mode (no block wrapping)
 * @returns the rendered HTML
 */
export function printMarkdown(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;
  if (value === null) {
    return '';
  }

  return renderMarkdown(value, options.inline);
}

/**
 * Format a JSON value as a pretty-printed string for display. An empty-string
 * input is treated as `null` (so `""` renders as `"null"`).
 *
 * @param value any JSON-serializable value
 * @param _options unused (kept for signature parity)
 * @returns the JSON-stringified value (2-space indent)
 */
export function printJSON(value: any, _options?: any): string {
  return value === '' ? JSON.stringify(null) : JSON.stringify(value, undefined, 2);
}

/**
 * Format a gene sequence in chunks separated by a delimiter, then render the
 * result through markdown so the output appears in a fixed-width font.
 * By default the sequence is split into 10-character chunks separated by a space.
 *
 * @param value the raw gene sequence string; `null` returns an empty string
 * @param options optional config:
 *   - `increment` — number of characters per chunk (default 10, negatives clamp to 1, 0 disables chunking)
 *   - `separator` — chunk delimiter (default `' '`)
 * @returns the chunked sequence rendered as inline markdown, or the original
 *          value when an exception bubbles out of the rendering layer
 */
export function printGeneSeq(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;

  if (value === null) {
    return '';
  }

  try {
    // Default separator is a space.
    if (!options.separator) {
      options.separator = ' ';
    }
    // Default increment is 10
    if (!options.increment) {
      options.increment = 10;
    }
    let inc = parseInt(options.increment, 10);

    if (inc === 0) {
      return value.toString();
    }

    // Reset the increment if it's negative
    if (inc <= -1) {
      inc = 1;
    }

    let formattedSeq = '`';
    const separator = options.separator;
    while (value.length >= inc) {
      // Get the first inc number of chars
      const chunk = value.slice(0, inc);
      // Append the chunk and separator
      formattedSeq += chunk + separator;
      // Remove this chunk from value
      value = value.slice(inc);
    }

    // Append any remaining chars from value that was too small to form an increment
    formattedSeq += value;

    // Slice off separator at the end
    if (formattedSeq.slice(-1) == separator) {
      formattedSeq = formattedSeq.slice(0, -1);
    }

    // Add the ending backtick at the end
    formattedSeq += '`';

    // Run it through renderMarkdown to get the sequence in a fixed-width font
    return renderMarkdown(formattedSeq, true);
  } catch (e) {
    $log.error("Couldn't parse the given markdown value: " + value);
    $log.error(e);
    return value;
  }
}

/**
 * Format an array into a comma-separated string (or an array of formatted
 * strings). `null` and `""` entries are replaced with their special markdown
 * presentation tokens (`_specialPresentation.NULL` and `EMPTY_STR`).
 *
 * @param value the array to format; non-arrays / empty arrays return `""`
 * @param options optional config:
 *   - `isMarkdown` — when true, do NOT markdown-escape the entries
 *   - `returnArray` — when true, return the formatted entries as an array
 *     instead of joining with `", "`
 * @returns the joined string by default, or `string[]` when `returnArray` is set
 */
export function printArray(value: any, options?: any): any {
  options = typeof options === 'undefined' ? {} : options;

  if (!value || !Array.isArray(value) || value.length === 0) {
    return '';
  }

  const arr = value.map(function (v) {
    let isMarkdown = options.isMarkdown === true;
    let pv = v;
    if (v === '') {
      pv = _specialPresentation.EMPTY_STR;
      isMarkdown = true;
    } else if (v == null) {
      pv = _specialPresentation.NULL;
      isMarkdown = true;
    }

    if (!isMarkdown) pv = _escapeMarkdownCharacters(pv);
    return pv;
  });

  if (options.returnArray) return arr;
  return arr.join(', ');
}

/**
 * Format a hex color string as a Chaise markdown span with a colored swatch
 * followed by the uppercase hex code. Invalid colors return an empty string.
 *
 * @param value the hex color string (e.g. `"#ff8800"`)
 * @param options unused (kept for signature parity)
 * @returns the markdown swatch + label, or `""` when the input is not a valid hex color
 */
export function printColor(value: any, options?: any): string {
  options = typeof options === 'undefined' ? {} : options;

  if (!isValidColorRGBHex(value)) {
    return '';
  }

  value = value.toUpperCase();
  return ':span: :/span:{.' + _classNames.colorPreview + ' style=background-color:' + value + '} ' + value;
}

/**
 * Format a byte count in a human-readable unit (e.g. `1234567` -> `"1.23 MB"`).
 *
 * The value is **truncated** (never rounded up) to honor the requested
 * precision via `_toPrecision`. The precision floor is 3 in `si` mode and 4
 * in `binary` mode; smaller values are clamped. `raw` mode bypasses the unit
 * conversion and returns the comma-separated integer.
 *
 * @param value the byte count (anything `parseFloat` accepts; `NaN` returns `""`)
 * @param mode `'raw'`, `'si'`, or `'binary'` (default `'si'` for invalid/missing)
 * @param precision number of significant digits to display (default 3, see
 *                  the per-mode floor above)
 * @param withTooltip when true and a unit conversion occurred, wrap the
 *                   output in a Chaise tooltip span showing the raw byte
 *                   count and the unit conversion factor
 * @returns the humanized byte string
 *
 * SECURITY: Do NOT interpolate raw, user-controlled strings into the output without escaping/validating them first.
 * The handlebars `humanizeBytes` helper returns this output as a Handlebars.SafeString (unescaped).
 */
export function humanizeBytes(value: any, mode?: any, precision?: any, withTooltip?: any): string {
  // we cannot use parseInt here since it won't allow larger numbers.
  let v = parseFloat(value);
  mode = ['raw', 'si', 'binary'].indexOf(mode) === -1 ? 'si' : mode;

  if (isNaN(v)) return '';
  if (v === 0 || mode === 'raw') {
    return printInteger(value);
  }

  let divisor = 1000;
  let units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  if (mode === 'binary') {
    divisor = 1024;
    units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  }

  // find the closest power of the divisor to the given number ('u').
  // in the end, 'v' will be the number that we should display.
  let u = 0;
  while (v >= divisor || -v >= divisor) {
    v /= divisor;
    u++;
  }

  // our units don't support this, so just return the "raw" mode value.
  if (u >= units.length) {
    return printInteger(value);
  }

  // we don't want to truncate the value, so we should set a minimum
  const minP = mode === 'si' ? 3 : 4;

  let res = (u ? _toPrecision(v, precision, minP) : v) + ' ' + units[u];
  if (typeof withTooltip === 'boolean' && withTooltip && u > 0) {
    const numBytes = printInteger(Math.pow(divisor, u));
    let tooltip = printInteger(value);
    tooltip += ' bytes (1 ' + units[u] + ' = ' + numBytes + ' bytes)';
    res = ':span:' + res + ':/span:{data-chaise-tooltip="' + tooltip + '"}';
  }
  return res;
}

/**
 * Format the duration between two datetimes for display
 * (e.g. `"+1.1 months"`, `"35 days before"`, `"1Y 4D"`).
 *
 * Math is fixed-Julian (1Y = 365.25d, 1M = 30.4375d) for every single-unit
 * mode and for `unit="multi"`. Calendar-aware walking via `moment.diff`/
 * `moment.add` is used only for `unit="calendar"`. See the per-helper JSDocs
 * above for the quirks of each mode (multi lopover, calendar month-end clamping).
 *
 * Edge cases:
 * - `start === end` returns `"0 seconds"` regardless of direction.
 * - Either side invalid (not moment-parseable) returns `""`.
 *
 * @param start any value moment() can parse
 * @param end any value moment() can parse
 * @param unit one of `"auto"` (default), `"year"`, `"month"`, `"day"`,
 *             `"hour"`, `"minute"`, `"second"`, `"millisecond"`, `"multi"`, `"calendar"`
 * @param fraction number of decimal places (default 1; invalid -> 1)
 * @param direction one of `"sign"` (default, prepends `+`/`-`),
 *                  `"before/after"`, `"earlier/later"`, `"unsigned"`
 * @param withTooltip when true, wrap the output in a tooltip span; suppressed
 *                   only for `unit="calendar"` (the calendar walk in the
 *                   tooltip body would conflict with the calendar walk
 *                   already visible in line 1)
 * @returns the formatted duration string
 *
 * SECURITY: Do NOT interpolate raw, user-controlled strings into the output without escaping/validating them first.
 * The handlebars `datetimeDuration` helper returns this output as a Handlebars.SafeString (unescaped).
 */
export function datetimeDuration(start: any, end: any, unit?: any, fraction?: any, direction?: any, withTooltip?: any): string {
  const startM = moment(start);
  const endM = moment(end);
  if (!startM.isValid() || !endM.isValid()) return '';

  // normalize args
  const normUnit: DurationUnit = _datetimeDuration.VALID_UNITS.indexOf(unit) === -1 ? DURATION_UNIT.AUTO : unit;
  const normDirection: DurationDirection = _datetimeDuration.VALID_DIRECTIONS.indexOf(direction) === -1 ? DURATION_DIRECTION.SIGN : direction;
  const f = parseInt(fraction);
  fraction = isNaN(f) || f < 0 ? 1 : f;

  const ms = endM.diff(startM);
  if (ms === 0) return '0 seconds';

  const absMs = Math.abs(ms);
  const signSign = ms > 0 ? 1 : -1;

  let res: string;
  if (normUnit === DURATION_UNIT.MULTI) {
    res = _durationFormatMultiFixed(absMs, fraction);
  } else if (normUnit === DURATION_UNIT.CALENDAR) {
    res = _durationFormatCalendarWalk(startM, endM, fraction);
  } else {
    res = _durationFormatSingleUnit(absMs, normUnit, fraction);
  }

  res = _durationApplyDirection(res, signSign, normDirection);

  if (withTooltip === true && normUnit !== DURATION_UNIT.CALENDAR) {
    res = _durationWrapTooltip(res, absMs);
  }
  return res;
}

/**
 * Pretty-print utility functions, exposed as the public `_formatUtils` object
 * on the `ERMrest` global (`ERMrest._formatUtils.printX(...)`). Each method
 * is also exported by name above for direct in-codebase imports.
 */
export const _formatUtils = {
  printBoolean,
  printInteger,
  printTimestamp,
  printDate,
  printFloat,
  printText,
  printMarkdown,
  printJSON,
  printGeneSeq,
  printArray,
  printColor,
  humanizeBytes,
  datetimeDuration,
};

/**
 * Dispatch to the appropriate `print*` formatter based on a column type
 * definition. Recurses into `type.baseType` when no case matches (and falls
 * back to `printText` when even the base type is unknown). Markdown columns
 * are passed through with `toString()` because final markdown rendering
 * happens later in the pipeline.
 *
 * @param type the column type descriptor (uses `type.name` and `type.baseType`)
 * @param data the raw value to format
 * @param options forwarded to the underlying `print*` formatter
 * @returns the formatted value (typically a string, but the type matches the underlying formatter)
 */
export function _formatValueByType(type: any, data: any, options?: any): any {
  switch (type.name) {
    case 'timestamp':
    case 'timestamptz':
      data = printTimestamp(data, options);
      break;
    case 'date':
      data = printDate(data, options);
      break;
    case 'numeric':
    case 'float4':
    case 'float8':
      data = printFloat(data, options);
      break;
    case 'int2':
    case 'int4':
    case 'int8':
      data = printInteger(data, options);
      break;
    case 'boolean':
      data = printBoolean(data, options);
      break;
    case 'markdown':
      // Do nothing as we will format markdown at the end of format
      data = data.toString();
      break;
    case 'gene_sequence':
      data = printGeneSeq(data, options);
      break;
    //Cases to support json and jsonb columns
    case 'json':
    case 'jsonb':
      data = printJSON(data, options);
      break;
    case 'color_rgb_hex':
      data = printColor(data, options);
      break;
    default: // includes 'text' and 'longtext' cases
      data = type.baseType ? _formatValueByType(type.baseType, data, options) : printText(data, options);
      break;
  }
  return data;
}
