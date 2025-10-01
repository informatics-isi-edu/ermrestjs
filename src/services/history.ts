export default class HistoryService {
  /**
   * convert ISO datetime string to snapshot version string
   * @throws {Error} Might throw some errors if the input is invalid
   */
  static datetimeISOToSnapshot(value: string): string {
    return HistoryService.urlb32Encode(HistoryService.datetimeEpochUs(value));
  }

  /**
   * convert snapshot version string to ISO datetime string
   * @param {string} snapshot - the snapshot version string
   * @param {boolean} dontThrowError - if true, will return empty string instead of throwing error
   *                                   when the input is invalid
   * @returns {string} the ISO datetime string
   * @throws {Error} Might throw some errors if the input is invalid
   */
  static snapshotToDatetimeISO(snapshot: string, dontThrowError?: boolean): string {
    try {
      const epochUs = HistoryService.urlb32Decode(snapshot);
      return HistoryService.epochUsToIso(epochUs);
    } catch (e) {
      if (dontThrowError) return '';
      else throw e;
    }
  }

  /**
   * Return microseconds-since-epoch integer for given ISO datetime string
   */
  static datetimeEpochUs(isoString: string): bigint {
    // Parse the ISO string to extract microseconds
    const match = isoString.match(/^(.+?)(?:\.(\d{1,6}))?([+-]\d{2}:?\d{2}|Z)$/);
    if (!match) {
      throw new Error(`Invalid ISO datetime format: ${isoString}`);
    }

    const [, baseTime, fractionalSeconds = '0', timezone] = match;

    // Pad fractional seconds to 6 digits (microseconds)
    const microsecondStr = fractionalSeconds.padEnd(6, '0').slice(0, 6);
    const microseconds = BigInt(microsecondStr);

    // Create date from the base time + timezone
    const dt = new Date(baseTime + timezone);
    const timestampMs = BigInt(dt.getTime());

    return timestampMs * 1000n + microseconds;
  }

  /**
   * Encode integer as per ERMrest's base-32 snapshot encoding
   */
  static urlb32Encode(i: bigint): string {
    if (i > 2n ** 63n - 1n) {
      throw new Error(`Value ${i} exceeds maximum`);
    } else if (i < -(2n ** 63n)) {
      throw new Error(`Value ${i} below minimum`);
    }

    // pad 64 bit to 65 bits for 13 5-bit digits
    let raw = i << 1n;
    const encodedRev: string[] = [];

    for (let d = 1; d <= 13; d++) {
      if (d > 2 && (d - 1) % 4 === 0) {
        encodedRev.push('-');
      }
      const code = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Number(raw % 32n)];
      encodedRev.push(code);
      raw = raw / 32n; // Integer division with BigInt
    }

    // Remove trailing '0' and '-' characters
    while (encodedRev.length > 0 && (encodedRev[encodedRev.length - 1] === '0' || encodedRev[encodedRev.length - 1] === '-')) {
      encodedRev.pop();
    }

    if (encodedRev.length === 0) {
      encodedRev.push('0');
    }

    const encoded = encodedRev.reverse();
    return encoded.join('');
  }

  /**
   * Decode base-32 snapshot encoding back to integer
   */
  static urlb32Decode(encoded: string): bigint {
    const code = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const codeMap: { [key: string]: number } = {};
    for (let i = 0; i < code.length; i++) {
      codeMap[code[i]] = i;
    }

    let result = 0n;

    for (const char of encoded) {
      if (char === '-') {
        continue; // Skip separator characters
      }

      if (!(char in codeMap)) {
        throw new Error(`Invalid character in encoded string: ${char}`);
      }

      result = result * 32n + BigInt(codeMap[char]);
    }

    // Reverse the 65-bit padding (shift right by 1)
    return result >> 1n;
  }

  /**
   * Convert microseconds-since-epoch back to ISO datetime string
   */
  static epochUsToIso(epochUs: bigint): string {
    const epochMs = epochUs / 1000n;
    const microseconds = epochUs % 1000n;

    const dt = new Date(Number(epochMs));

    // Format to ISO string and insert microseconds
    // ISO format is: YYYY-MM-DDTHH:mm:ss.sssZ
    // We need to replace the .sss with .sssuuu (milliseconds + microseconds)
    const isoString = dt.toISOString();

    // Insert microseconds into the ISO string
    const milliseconds = dt.getUTCMilliseconds();
    const totalMicroseconds = milliseconds * 1000 + Number(microseconds);
    const microsecondsStr = totalMicroseconds.toString().padStart(6, '0');

    return isoString.replace(/\.\d{3}Z$/, `.${microsecondsStr}+00:00`);
  }
}
