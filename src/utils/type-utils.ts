import { InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

export function isDefinedAndNotNull(obj: unknown): boolean {
  return obj !== undefined && obj !== null;
}

/**
 * Verifies that the object is not null and is defined.
 */
export function isObjectAndNotNull(obj: unknown): boolean {
  return typeof obj === 'object' && obj !== null;
}

/**
 * Returns true if given parameter is object and doesn't have any items.
 */
export function isEmptyArray(value: unknown) {
  return Array.isArray(value) && value.length === 0;
}

/**
 * Returns true if given paramter is a non-empty string.
 */
export function isStringAndNotEmpty(value: unknown) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Whether the given value is a valid color_rgb_hex value
 */
export function isValidColorRGBHex(value: unknown) {
  return typeof value === 'string' && value.length > 0 && /#[0-9a-fA-F]{6}$/i.test(value);
}

/**
 * Returns true if given paramter is object.
 */
export function isObject(value: unknown) {
  return value === Object(value) && !Array.isArray(value);
}

/**
 * Check if object has all the keys in the given array
 * @param obj the object
 * @param arr array of key strings
 */
export function ObjectHasAllKeys(obj: object, arr: string[]) {
  return arr.every(function (item) {
    return Object.prototype.hasOwnProperty.call(obj, item);
  });
}

/**
 * Returns true if given parameter isan integer
 */
export function isInteger(value: unknown) {
  return typeof value === 'number' && value % 1 === 0;
}

/**
 * Throws an InvalidInputError if test is not `True`.
 * @memberof ERMrest
 * @function verify
 * @param {boolean} test The test
 * @param {string} message The message
 * @throws {ERMrest.InvalidInputError} If test is not true.
 * @private
 */
export function verify(test: any, message: string) {
  if (!test) {
    throw new InvalidInputError(message);
  }
}
