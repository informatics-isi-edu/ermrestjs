import type { AssetPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { FILE_PREVIEW } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

import { getFilename, getFilenameExtension } from '@isrd-isi-edu/ermrestjs/src/utils/file-utils';
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

/**
 * The supported file preview types
 */
export enum FilePreviewTypes {
  IMAGE = 'image',
  MARKDOWN = 'markdown',
  CSV = 'csv',
  TSV = 'tsv',
  JSON = 'json',
  TEXT = 'text',
}

/**
 * Type guard to check if a value is a FilePreviewTypes
 */
export const isFilePreviewType = (value: unknown): value is FilePreviewTypes => {
  if (typeof value !== 'string') return false;
  return Object.values(FilePreviewTypes).includes(value as FilePreviewTypes);
};

export const USE_EXT_MAPPING = 'use_ext_mapping';

const DEFAULT_CONTENT_TYPE_MAPPING: { [key: string]: FilePreviewTypes | typeof USE_EXT_MAPPING | false } = {
  // image:
  'image/png': FilePreviewTypes.IMAGE,
  'image/jpeg': FilePreviewTypes.IMAGE,
  'image/jpg': FilePreviewTypes.IMAGE,
  'image/gif': FilePreviewTypes.IMAGE,
  'image/bmp': FilePreviewTypes.IMAGE,
  'image/webp': FilePreviewTypes.IMAGE,
  'image/svg+xml': FilePreviewTypes.IMAGE,
  'image/x-icon': FilePreviewTypes.IMAGE,
  'image/avif': FilePreviewTypes.IMAGE,
  'image/apng': FilePreviewTypes.IMAGE,
  // markdown:
  'text/markdown': FilePreviewTypes.MARKDOWN,
  // csv:
  'text/csv': FilePreviewTypes.CSV,
  // tsv:
  'text/tab-separated-values': FilePreviewTypes.TSV,
  // json:
  'application/json': FilePreviewTypes.JSON,
  // text:
  'chemical/x-mmcif': FilePreviewTypes.TEXT,
  'chemical/x-cif': FilePreviewTypes.TEXT,
  // generic:
  'text/plain': USE_EXT_MAPPING,
  'application/octet-stream': USE_EXT_MAPPING,
};

const DEFAULT_EXTENSION_MAPPING: { [key: string]: FilePreviewTypes | false } = {
  // image:
  '.png': FilePreviewTypes.IMAGE,
  '.jpeg': FilePreviewTypes.IMAGE,
  '.jpg': FilePreviewTypes.IMAGE,
  '.gif': FilePreviewTypes.IMAGE,
  '.bmp': FilePreviewTypes.IMAGE,
  '.webp': FilePreviewTypes.IMAGE,
  '.svg': FilePreviewTypes.IMAGE,
  '.ico': FilePreviewTypes.IMAGE,
  '.avif': FilePreviewTypes.IMAGE,
  '.apng': FilePreviewTypes.IMAGE,
  // markdown:
  '.md': FilePreviewTypes.MARKDOWN,
  '.markdown': FilePreviewTypes.MARKDOWN,
  // csv:
  '.csv': FilePreviewTypes.CSV,
  // tsv:
  '.tsv': FilePreviewTypes.TSV,
  // json:
  '.json': FilePreviewTypes.JSON,
  '.mvsj': FilePreviewTypes.JSON, // MolViewSpec JSON (mol* viewer)
  // text:
  '.txt': FilePreviewTypes.TEXT,
  '.log': FilePreviewTypes.TEXT,
  '.cif': FilePreviewTypes.TEXT,
  '.pdb': FilePreviewTypes.TEXT,
};

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
    const disabledValue = { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null };
    const previewType = FilePreviewService.getFilePreviewType(url, column, storedFilename, contentDisposition, contentType);
    let prefetchBytes: number | null = null;
    let prefetchMaxFileSize: number | null = null;

    if (previewType === null) {
      return disabledValue;
    }

    if (column && column.filePreview) {
      if (column.filePreview.disabledTypes.includes(previewType)) {
        return disabledValue;
      }
      prefetchBytes = column.filePreview.getPrefetchBytes(previewType);
      prefetchMaxFileSize = column.filePreview.getPrefetchMaxFileSize(previewType);
    }

    if (typeof prefetchBytes !== 'number' || prefetchBytes < 0) {
      prefetchBytes = FILE_PREVIEW.PREFETCH_BYTES;
    }
    if (typeof prefetchMaxFileSize !== 'number' || prefetchMaxFileSize < 0) {
      prefetchMaxFileSize = FILE_PREVIEW.MAX_FILE_SIZE;
    }

    // if prefetchMaxFileSize is 0, we should not show the preview
    if (prefetchMaxFileSize === 0) {
      return disabledValue;
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
    let mappedFilePreviewType: FilePreviewTypes | typeof USE_EXT_MAPPING | false = USE_EXT_MAPPING;

    // extend the mappings based on the annotations
    let annotExtensionMapping;
    let annotContentTypeMapping;
    if (column && column.isAsset) {
      // if file_preview is false, then no preview is allowed
      if (!column.filePreview) return null;
      if (column.filePreview.contentTypeMapping) {
        annotContentTypeMapping = column.filePreview.contentTypeMapping;
      }
      if (column.filePreview.filenameExtMapping) {
        annotExtensionMapping = column.filePreview.filenameExtMapping;
      }
    }

    // if content-type is available, we must get the type from it.
    if (typeof contentType === 'string' && contentType.length > 0) {
      // remove any extra info like charset
      contentType = contentType.split(';')[0].trim().toLowerCase();
      let matched = false;

      // first match through annotation mapping
      if (annotContentTypeMapping) {
        // if the exact match is found, use it
        if (annotContentTypeMapping.exactMatch && contentType in annotContentTypeMapping.exactMatch) {
          mappedFilePreviewType = annotContentTypeMapping.exactMatch[contentType];
          matched = true;
        }
        // if exact match not found, try prefix matching
        else if (annotContentTypeMapping.prefixMatch) {
          const match = Object.keys(annotContentTypeMapping.prefixMatch).find((prefix) => contentType!.startsWith(prefix));
          if (match) {
            mappedFilePreviewType = annotContentTypeMapping.prefixMatch[match];
            matched = true;
          }
        }

        // if still not matched, check for default mapping (`*` in annotation)
        if (!matched && annotContentTypeMapping.default !== null) {
          mappedFilePreviewType = annotContentTypeMapping.default;
          matched = true;
        }
      }

      // if no match found through annotation, try the default mapping
      if (!matched && contentType in DEFAULT_CONTENT_TYPE_MAPPING) {
        mappedFilePreviewType = DEFAULT_CONTENT_TYPE_MAPPING[contentType];
        matched = true;
      }

      // if no match found, disable the preview
      if (!matched) {
        mappedFilePreviewType = false;
      }

      $log.debug(`FilePreviewService: Mapped content-type '${contentType}' to preview type '${mappedFilePreviewType}'`);
    }

    // use extenstion mapping, if the content-type matching dictates so
    if (mappedFilePreviewType === USE_EXT_MAPPING && typeof extension === 'string' && extension.length > 0) {
      if (annotExtensionMapping && extension in annotExtensionMapping) {
        mappedFilePreviewType = annotExtensionMapping[extension];
      } else if (extension in DEFAULT_EXTENSION_MAPPING) {
        mappedFilePreviewType = DEFAULT_EXTENSION_MAPPING[extension];
      } else {
        mappedFilePreviewType = false;
      }

      $log.debug(`FilePreviewService: Mapped extension '${extension}' to preview type '${mappedFilePreviewType}'`);
    }

    return isFilePreviewType(mappedFilePreviewType) ? mappedFilePreviewType : null;
  }
}
