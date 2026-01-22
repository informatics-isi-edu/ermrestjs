/**
 * given a url and optional content-disposition header, will return the filename.
 *
 * NOTE: might return an empty string if no filename is found.
 */
export const getFilename = (url: string, contentDisposition?: string): string => {
  if (contentDisposition) {
    const prefix = "filename*=UTF-8''";
    const filenameIndex = contentDisposition.indexOf(prefix) + prefix.length;
    const filename = contentDisposition.substring(filenameIndex, contentDisposition.length);
    if (filename) return filename;
  }

  // hatrac files have a different format
  // eslint-disable-next-line no-useless-escape
  const parts = url.match(/^\/hatrac\/([^\/]+\/)*([^\/:]+)(:[^:]+)?$/);
  if (parts && parts.length === 4) {
    return parts[2];
  }

  return url.split('/').pop() || '';
};

/**
 * given a filename, will return the extension
 * By default, it will extract the last of the filename after the last `.` (including the dot).
 * The second parameter can be used for passing a regular expression
 * if we want a different method of extracting the extension.
 * @param {string} filename
 * @param {string[]} allowedExtensions
 * @param {string[]} regexArr
 * @returns the filename extension string. if we cannot find any matches, it will return null
 * @private
 * @ignore
 */
export const getFilenameExtension = function (filename: string, allowedExtensions?: string[], regexArr?: string[]): string | null {
  if (typeof filename !== 'string' || filename.length === 0) {
    return null;
  }

  // first find in the list of allowed extensions
  let res: string | null = null;
  const isInAllowed =
    Array.isArray(allowedExtensions) &&
    allowedExtensions.some((ext) => {
      res = ext;
      return typeof ext === 'string' && ext.length > 0 && filename.endsWith(ext);
    });
  if (isInAllowed) {
    return res;
  }

  // we will return null if we cannot find anything
  res = null;
  // no matching allowed extension, try the regular expressions
  if (Array.isArray(regexArr) && regexArr.length > 0) {
    regexArr.some((regexp) => {
      // since regular expression comes from annotation, it might not be valid
      try {
        const matches = filename.match(new RegExp(regexp, 'g'));
        if (matches && matches[0] && typeof matches[0] === 'string') {
          res = matches[0];
        } else {
          res = null;
        }
        return res;
      } catch {
        res = null;
        return false;
      }
    });
  } else {
    const dotIndex = filename.lastIndexOf('.');
    // it's only a valid filename if there's some string after `.`
    if (dotIndex !== -1 && dotIndex !== filename.length - 1) {
      res = filename.slice(dotIndex);
    }
  }

  return res;
};

/**
 * Check if file is a text-like file based on content type or extension
 */
export const checkIsTextFile = (contentType?: string, extension?: string | null): boolean => {
  // text-like files using content-type
  if (
    contentType &&
    (contentType.startsWith('text/') ||
      // cif files
      contentType === 'chemical/x-mmcif' ||
      contentType === 'chemical/x-cif')
  ) {
    return true;
  }

  // text-like files using extension
  if (extension && ['.txt', '.js', '.log', '.cif', '.pdb'].includes(extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is markdown based on content type or extension
 */
export const checkIsMarkdownFile = (contentType?: string, extension?: string | null): boolean => {
  if (contentType && (contentType.includes('markdown') || contentType.includes('md'))) {
    return true;
  }

  if (extension && ['.md', '.markdown'].includes(extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is CSV based on content type or extension
 */
export const checkIsCsvFile = (contentType?: string, extension?: string | null): boolean => {
  if (contentType && (contentType.includes('csv') || contentType.includes('comma-separated-values'))) {
    return true;
  }

  if (extension && extension === '.csv') {
    return true;
  }

  return false;
};

/**
 * Check if file is TSV based on content type or extension
 */
export const checkIsTsvFile = (contentType?: string, extension?: string | null): boolean => {
  if (contentType && contentType.includes('tab-separated-values')) {
    return true;
  }

  if (extension && extension === '.tsv') {
    return true;
  }

  return false;
};

/**
 * Check if file is JSON based on content type or extension
 */
export const checkIsJSONFile = (contentType?: string, extension?: string | null): boolean => {
  if (contentType && contentType.includes('application/json')) {
    return true;
  }

  // mvsj: MolViewSpec JSON (mol* viewer)
  if (extension && ['.json', '.mvsj'].includes(extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is an image based on content type or extension
 * Checks for common image formats supported by HTML img tag
 */
export const checkIsImageFile = (contentType?: string, extension?: string | null): boolean => {
  // TODO this should be more specific based on supported image formats
  if (contentType && contentType.startsWith('image/')) {
    return true;
  }

  if (extension && ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.avif', '.apng'].includes(extension)) {
    return true;
  }

  return false;
};
