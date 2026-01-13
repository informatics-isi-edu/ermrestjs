import type { AssetPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { FILE_PREVIEW } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

import {
  checkIsCsvFile,
  checkIsImageFile,
  checkIsJSONFile,
  checkIsMarkdownFile,
  checkIsTextFile,
  checkIsTsvFile,
  getFilename,
  getFilenameExtension,
} from '@isrd-isi-edu/ermrestjs/src/utils/file-utils';

// NOTE: order of values matters here. the least specific ones should come last.
export enum FilePreviewTypes {
  IMAGE = 'image',
  MARKDOWN = 'markdown',
  CSV = 'csv',
  TSV = 'tsv',
  JSON = 'json',
  TEXT = 'text',
}

export default class FilePreviewService {
  /**
   * Returns the preview info based on the given file properties and the column's file preview settings.
   * @param url the file url
   * @param column the asset column
   * @param storedFilename the stored filename
   * @param contentDisposition content-disposition header value
   * @param contentType content-type header value
   */
  static getFilePreviewInfo(
    url: string,
    column?: AssetPseudoColumn,
    storedFilename?: string,
    contentDisposition?: string,
    contentType?: string,
  ): {
    previewType: FilePreviewTypes | null;
    prefetchBytes: number | null;
    prefetchMaxFileSize: number | null;
  } {
    const previewType = FilePreviewService.getFilePreviewType(url, column, storedFilename, contentDisposition, contentType);
    let prefetchBytes: number | null = null;
    let prefetchMaxFileSize: number | null = null;

    if (previewType !== null && column && column.filePreview) {
      prefetchBytes = column.filePreview.getPrefetchBytes(previewType);
      if (typeof prefetchBytes !== 'number' || prefetchBytes < 0) {
        prefetchBytes = FILE_PREVIEW.PREFETCH_BYTES;
      }
      prefetchMaxFileSize = column.filePreview.getPrefetchMaxFileSize(previewType);
      if (typeof prefetchMaxFileSize !== 'number' || prefetchMaxFileSize < 0) {
        prefetchMaxFileSize = FILE_PREVIEW.MAX_FILE_SIZE;
      }
    }

    return { previewType, prefetchBytes, prefetchMaxFileSize };
  }

  /**
   * Returns the preview type based on the given file properties and the column's file preview settings.
   * @param url the file url
   * @param column the asset column
   * @param storedFilename the stored filename
   * @param contentDisposition content-disposition header value
   * @param contentType content-type header value
   */
  private static getFilePreviewType(
    url: string,
    column?: AssetPseudoColumn,
    storedFilename?: string,
    contentDisposition?: string,
    contentType?: string,
  ): FilePreviewTypes | null {
    const filename = storedFilename || getFilename(url, contentDisposition);
    const extension = getFilenameExtension(filename, column?.filenameExtFilter, column?.filenameExtRegexp);

    // based on annotation
    if (column && column.isAsset) {
      const filePreviewProps = column ? column.filePreview : null;
      // if file_preview is false, then no preview is allowed
      if (!filePreviewProps) return null;
      // see if the file preview type is explicitly set
      for (const previewType of Object.values(FilePreviewTypes)) {
        const res = filePreviewProps.checkFileType(previewType as FilePreviewTypes, contentType, extension);
        if (res) return previewType;
      }
    }

    // based on file properties
    if (checkIsImageFile(contentType, extension)) {
      return FilePreviewTypes.IMAGE;
    }
    if (checkIsMarkdownFile(contentType, extension)) {
      return FilePreviewTypes.MARKDOWN;
    }
    if (checkIsCsvFile(contentType, extension)) {
      return FilePreviewTypes.CSV;
    }
    if (checkIsTsvFile(contentType, extension)) {
      return FilePreviewTypes.TSV;
    }
    if (checkIsJSONFile(contentType, extension)) {
      return FilePreviewTypes.JSON;
    }
    if (checkIsTextFile(contentType, extension)) {
      return FilePreviewTypes.TEXT;
    }

    return null;
  }
}
