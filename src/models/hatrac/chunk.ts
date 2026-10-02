// models
import { sliceUploadFile } from '@isrd-isi-edu/ermrestjs/src/models/hatrac/checksum';
import type { HatracHTTPConfig, Upload } from '@isrd-isi-edu/ermrestjs/src/models/hatrac/upload';

// utils
import { contextHeaderName } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

/**
 * This class contains one of the chunks of the {@link Upload} instance.
 * It will upload the chunk and call _updateProgressBar
 */
export class Chunk {
  /**
   * index of the chunk
   */
  index: number;

  /**
   * start index of the chunk in file
   */
  start: number;

  /**
   * end index of the chunk in file
   */
  end: number;

  /**
   * size of the chunk in bytes
   */
  size: number;

  /**
   * whether the chunk is uploaded
   */
  completed = false;

  /**
   * the amount of this chunk that is uploaded so far
   */
  progress = 0;

  /**
   * used for aborting the request of this chunk that is in flight (null if there isn't any)
   */
  abortController: AbortController | null = null;

  /**
   * @param index index of the chunk
   * @param start start index of the chunk in file
   * @param end end index of the chunk in file
   */
  constructor(index: number, start: number, end: number) {
    this.index = index;
    this.start = start;
    this.end = end;
    this.size = end - start;
  }

  /**
   * Uploads this chunk to the upload job of the given upload, and calls _updateProgressBar.
   * @param upload the upload that this chunk belongs to
   * @returns true if the chunk is uploaded, false if the request failed or was aborted.
   */
  async sendToHatrac(upload: Upload): Promise<boolean> {
    if (this.completed) {
      this.progress = this.size;
      upload._updateProgressBar();
      return true;
    }

    this.progress = 0;

    const controller = new AbortController();
    this.abortController = controller;

    try {
      if (!upload.chunkUrl) {
        throw new Error('The upload job must be created before uploading the file chunks.');
      }

      const config: HatracHTTPConfig = {
        headers: {
          [contextHeaderName]: upload._getDefaultContextHeaderParams('upload/chunk'),
          'content-type': 'application/octet-stream',
        },
        signal: controller.signal,
        onUploadProgress: (event) => {
          // To track progress on upload
          if (event.lengthComputable) {
            this.progress = event.loaded;
            upload._updateProgressBar();
          }
        },
      };

      await upload.http.put(upload._getAbsoluteUrl(upload.chunkUrl) + '/' + this.index, sliceUploadFile(upload.file, this.start, this.end), config);
    } catch (err) {
      // aborted by pause or cancel. they already took care of the progress.
      if (controller.signal.aborted) return false;

      this.abortController = null;
      this.progress = 0;
      upload._updateProgressBar();

      // if upload is paused, the error is expected
      if (!upload.isPaused) {
        upload._onUploadError(err);
      }
      return false;
    }

    // Set progress to blob size, and set chunk completed
    this.abortController = null;
    this.progress = this.size;
    this.completed = true;

    // this chunk was successfully uploaded, update the chunkTracker
    upload.chunkTracker[this.index] = true;
    upload._updateProgressBar();
    return true;
  }

  /**
   * Aborts the request of this chunk that is in flight (if any).
   */
  abort(): void {
    if (!this.abortController) return;
    this.abortController.abort();
    this.abortController = null;
  }
}
