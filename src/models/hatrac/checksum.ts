import { ArrayBuffer as SparkMD5ArrayBuffer } from 'spark-md5';

// utils
import { hexToBase64 } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

/**
 * The file that is passed from Node (unit tests).
 * The content is read from `buffer` so the browser bundle doesn't need any of the Node built-ins (like `fs`).
 */
export type NodeUploadFile = {
  name: string;
  size: number;
  type: string;
  buffer: Buffer;
};

/**
 * A browser file object, or the file object that Node (unit tests) provides.
 */
export type UploadFile = File | NodeUploadFile;

/**
 * This callback will be called for progress during checksum calculation
 * @param uploaded the amount that has been processed so far
 * @param fileSize the total size of the file.
 */
export type ChecksumProgressCallback = (uploaded: number, fileSize?: number) => void;

/**
 * Returns the part of the file that is between the given start and end indexes.
 */
export const sliceUploadFile = (file: UploadFile, start: number, end: number): Blob | Buffer => {
  if ('buffer' in file) return file.buffer.subarray(start, end);
  return file.slice(start, end);
};

export class Checksum {
  file: UploadFile;

  /**
   * TODO this is not used anywhere.
   */
  options: Record<string, unknown>;

  /**
   * the md5 checksum of the file in hex format (defined after calculate is done)
   */
  md5_hex?: string;

  /**
   * the md5 checksum of the file in base64 format (defined after calculate is done)
   */
  md5_base64?: string;

  /**
   * TODO this is read by Upload (to see if the checksum is already calculated, and to populate the sha256 column)
   * but it's never calculated.
   */
  sha256?: string;

  /**
   * @param file the file object
   * @param options an optional parameters object.
   */
  constructor(file: UploadFile, options?: Record<string, unknown>) {
    this.file = file;
    this.options = options || {};
  }

  /**
   * Calculates the MD5 checksum for a file using spark-md5 library
   * @param chunkSize size of the chunks, in which the file is supposed to be broken
   * @param onProgress callback function to be called for progress
   * @param onSuccess callback function to be called for success
   * @param onError callback function to be called for error
   */
  calculate(
    chunkSize: number,
    onProgress?: ChecksumProgressCallback,
    onSuccess?: (checksum: Checksum) => void,
    onError?: (err: unknown) => void,
  ): void {
    const progressCallback = typeof onProgress === 'function' ? onProgress : () => {};
    const successCallback = typeof onSuccess === 'function' ? onSuccess : () => {};
    const errorCallback = typeof onError === 'function' ? onError : () => {};

    const file = this.file;

    // If checksum is already calculated then don't calculate it again
    if (this.md5_hex) {
      progressCallback(file.size);
      successCallback(this);
      return;
    }

    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5ArrayBuffer();

    // called on successful chunk read. It keeps adding the chunk to the digest.
    // Once all chunks are done, it calculates the final md5 and converts it in hex format calling onSuccess
    const onLoad = (content: ArrayBuffer) => {
      spark.append(content);

      currentChunk++;

      const completed = chunkSize * currentChunk;

      progressCallback(completed > file.size ? file.size : completed, file.size);

      if (currentChunk < chunks) {
        loadNext();
      } else {
        this.md5_hex = spark.end();
        this.md5_base64 = hexToBase64(this.md5_hex);
        successCallback(this);
      }
    };

    // reads the next chunk of the file
    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      const content = sliceUploadFile(file, start, end);

      if (content instanceof Blob) {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          if (fileReader.result instanceof ArrayBuffer) {
            onLoad(fileReader.result);
          } else {
            errorCallback(new Error('Unable to read the content of file'));
          }
        };
        fileReader.onerror = errorCallback;
        fileReader.readAsArrayBuffer(content);
      } else {
        // Node (unit tests) doesn't have FileReader, so the buffer is used directly
        setTimeout(() => {
          onLoad(new Uint8Array(content).buffer);
        }, 1);
      }
    };

    loadNext();
  }
}
