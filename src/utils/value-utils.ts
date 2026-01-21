import { ENV_IS_NODE } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

/**
 * Given a string representing a hex, turn it into base64
 * @private
 * @param  {string} hex
 * @return {string}
 */
export function hexToBase64(hex: any) {
  const str = String.fromCharCode.apply(
    null,
    hex
      .replace(/\r|\n/g, '')
      .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
      .replace(/ +$/, '')
      .split(' '),
  );

  if (ENV_IS_NODE) {
    return Buffer.from(str, 'binary').toString('base64');
  } else {
    return btoa(str);
  }
}

/**
 * Given a base64 string, url encode it.
 *i.e. '+' and '/' are replaced with '-' and '_' also any trailing '=' removed.
 *
 */
export function urlEncodeBase64(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Given a url encoded base64 (output of `_urlEncodeBase64`), return the
 * actual base64 string.
 *
 */
export function urlDecodeBase64(str: string): string {
  str = (str + '===').slice(0, str.length + (str.length % 4));
  return str.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * Make sure the text is not rendered as HTML (by replacing speciall characters).
 * @returns HTML-escaped text
 */
export function escapeHTML(text: string): string {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * converts a string to an URI encoded string
 */
export function fixedEncodeURIComponent(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Strip the trailing slash if there's any
 */
export function stripTrailingSlash(str: string): string {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}

/**
 * trim the slashes that might exist at the begining or end of the string
 */
export function trimSlashes(str: string) {
  let start = 0;
  let end = str.length - 1;

  while (start <= end && str[start] === '/') {
    start++;
  }
  while (end >= start && str[end] === '/') {
    end--;
  }

  return start <= end ? str.slice(start, end + 1) : '';
}

/**
 * @function
 * @param copyTo the object to copy values to.
 * @param copyFrom the object to copy value from.
 * @desc
 * This private utility function does a shallow copy between objects.
 */
export function shallowCopy(copyTo: any, copyFrom: any): void {
  for (const key in copyFrom) {
    // only copy those properties that were set in the object, this
    // will skip properties from the source object's prototype
    if (Object.prototype.hasOwnProperty.call(copyFrom, key)) {
      copyTo[key] = copyFrom[key];
    }
  }
}

/**
 * This private utility function copies the attributes of one object into another if,
 *  - the attribute is missing from the original, or
 *  - the attribute is part of enforcedList.
 * @param  copyTo       The object to copy values to.
 * @param  copyFrom     The object to copy values from.
 * @param  enforcedList the list of attributes that must be copied.
 */
export function shallowCopyExtras(copyTo: any, copyFrom: any, enforcedList: string[]) {
  for (const key in copyFrom) {
    if (
      Object.prototype.hasOwnProperty.call(copyFrom, key) &&
      (!Object.prototype.hasOwnProperty.call(copyTo, key) || (Array.isArray(enforcedList) && enforcedList.indexOf(key) !== -1))
    ) {
      copyTo[key] = copyFrom[key];
    }
  }
}

/**
 * @param source the object that you want to be copied
 * @desc
 * Creat a deep copy of the given object.
 * NOTE: This is very limited and only works for simple objects.
 * Some of its limitations are:
 * 1. Cannot copy functions.
 * 2. Cannot work on circular references.
 * 3. Will convert date objects back to UTC in the string representation in the ISO8601 format.
 * 4. It will fail to copy anything that is not in the JSON spec.
 *
 * ONLY USE THIS FUNCTION IF IT IS NOT ANY OF THE GIVEN LIMIATIONS.
 */
export function simpleDeepCopy(source: object): any {
  return JSON.parse(JSON.stringify(source));
}
