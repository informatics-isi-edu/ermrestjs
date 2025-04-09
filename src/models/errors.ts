import { _errorMessage, _errorStatus, _HTTPErrorCodes } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

/**
 * @memberof ERMrest
 * @param  {int} code           http error code
 * @param  {string} status      message status/title in the modal box
 * @param  {string} message     main user error message
 * @param  {string} subMessage  technical details about the error. Appear in collapsible span in the modal box
 * @param  {string} redirectPath path that would be added to the host to create full redirect link in Chaise
 * @constructor
 */
export class ERMrestError extends Error {
  public errorData: {
    redirectPath?: string;
  };

  constructor(
    public code: string | number,
    public status: string,
    public message: string,
    public subMessage?: string,
    redirectPath?: string,
  ) {
    super(message);

    this.errorData = {};
    if (redirectPath !== undefined && redirectPath !== null) {
      this.errorData.redirectPath = redirectPath;
    }
  }
}

//---------------------- HTTP errors ----------------------//

export class TimedOutError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.TIME_OUT;
    super(0, usedStatus, message);
  }
}

export class BadRequestError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.BAD_REQUEST;
    super(_HTTPErrorCodes.BAD_REQUEST, usedStatus, message);
  }
}

export class QueryTimeoutError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.TIME_OUT;
    super(_HTTPErrorCodes.BAD_REQUEST, usedStatus, message);
  }
}

export class UnauthorizedError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.UNAUTHORIZED;
    super(_HTTPErrorCodes.UNAUTHORIZED, usedStatus, message);
  }
}

export class ForbiddenError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.FORBIDDEN;
    super(_HTTPErrorCodes.FORBIDDEN, usedStatus, message);
  }
}

export class NotFoundError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.NOT_FOUND;
    super(_HTTPErrorCodes.NOT_FOUND, usedStatus, message);
  }
}

export class ConflictError extends ERMrestError {
  constructor(status: string, message: string, subMessage?: string) {
    super(_HTTPErrorCodes.CONFLICT, _errorStatus.CONFLICT, message, subMessage);
  }
}

export class IntegrityConflictError extends ConflictError {
  constructor(status: string, message: string, subMessage?: string) {
    super(_errorStatus.CONFLICT, message, subMessage);
  }
}

export class DuplicateConflictError extends ConflictError {
  public duplicateReference: any;

  constructor(status: string, message: string, subMessage?: string, duplicateReference?: any) {
    super(_errorStatus.CONFLICT, message, subMessage);
    this.duplicateReference = duplicateReference;
  }
}

export class PreconditionFailedError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.PRECONDITION_FAILED;
    super(_HTTPErrorCodes.PRECONDITION_FAILED, usedStatus, message);
  }
}

export class InternalServerError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.INTERNAL_SERVER_ERROR;
    super(_HTTPErrorCodes.INTERNAL_SERVER_ERROR, usedStatus, message);
  }
}

export class BadGatewayError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.BAD_GATEWAY;
    super(_HTTPErrorCodes.BAD_GATEWAY, usedStatus, message);
  }
}

export class ServiceUnavailableError extends ERMrestError {
  constructor(status: string, message: string) {
    const usedStatus = isStringAndNotEmpty(status) ? status : _errorStatus.SERVIVE_UNAVAILABLE;
    super(_HTTPErrorCodes.SERVIVE_UNAVAILABLE, usedStatus, message);
  }
}

export class NoConnectionError extends ERMrestError {
  constructor(message: string) {
    message = message || _errorMessage.NO_CONNECTION_ERROR;
    super(-1, _errorStatus.NO_CONNECTION_ERROR, message);
  }
}

//---------------------- custom errors ----------------------//

export class InvalidFacetOperatorError extends ERMrestError {
  constructor(path: string, subMessage?: string) {
    //remove invalid facet filterString from path
    let redirectPath: string;

    // if URI has modifier starting with '@' then find the blob and replace it with blank
    // else remove entire facetFilter
    const modifierStart = path.indexOf('@');
    const facetBlobStart = path.search('\\*::facets::');

    if (modifierStart > 0) {
      const facetFilter = path.slice(facetBlobStart, modifierStart);
      redirectPath = path.replace(facetFilter, '');
    } else {
      redirectPath = path.slice(0, facetBlobStart);
    }

    super('', _errorStatus.INVALID_FACET, _errorMessage.INVALID_FACET, subMessage, redirectPath);
  }
}

export class InvalidCustomFacetOperatorError extends ERMrestError {
  constructor(path: string, subMessage?: string) {
    //remove invalid facet filterString from path
    let redirectPath: string;

    // if URI has modifier starting with '@' then find the blob and replace it with blank
    // else remove entire facetFilter
    const modifierStart = path.indexOf('@');
    const facetBlobStart = path.search('\\*::cfacets::');

    if (modifierStart > 0) {
      const facetFilter = path.slice(facetBlobStart, modifierStart);
      redirectPath = path.replace(facetFilter, '');
    } else {
      redirectPath = path.slice(0, facetBlobStart);
    }

    super('', _errorStatus.INVALID_CUSTOM_FACET, _errorMessage.INVALID_CUSTOM_FACET, subMessage, redirectPath);
  }
}

export class InvalidFilterOperatorError extends ERMrestError {
  constructor(message: string, path: string, invalidFilter?: string) {
    // path consits of facet filter alongwith table and schemaName
    // invalidFilter is removed from the path if found else everything is removed after path ends
    let redirectPath: string;

    if (isStringAndNotEmpty(invalidFilter)) {
      redirectPath = path.replace(invalidFilter!, '');
    } else {
      const lastIndex = path.indexOf('/');
      redirectPath = lastIndex === -1 ? path : path.slice(0, lastIndex);
    }

    super('', _errorStatus.INVALID_FILTER, message, '', redirectPath);
  }
}

export class InvalidSortCriteria extends ERMrestError {
  constructor(message: string, path?: string) {
    const redirectPath = removePageCondition(removeSortCondition(path));
    super('', _errorStatus.INVALID_SORT, message, '', redirectPath);
  }
}

export class InvalidPageCriteria extends ERMrestError {
  constructor(message: string, path?: string) {
    const redirectPath = removePageCondition(path);
    super('', _errorStatus.INVALID_PAGE, message, '', redirectPath);
  }
}

export class InvalidInputError extends ERMrestError {
  constructor(message: string) {
    super('', _errorStatus.INVALID_INPUT, message);
  }
}

export class InvalidServerResponse extends ERMrestError {
  constructor(uri: string, data: any, logAction: string) {
    let message = 'Request URI: ' + uri + '\n';
    message += 'Request action: ' + logAction + '\n';
    message += 'returned data:\n' + data;
    super('', _errorStatus.INVALID_SERVER_RESPONSE, message);
  }
}

export class MalformedURIError extends ERMrestError {
  constructor(message: string) {
    super('', _errorStatus.INVALID_URI, message);
  }
}

export class NoDataChangedError extends ERMrestError {
  constructor(message: string) {
    super('', _errorStatus.NO_DATA_CHANGED, message);
  }
}

export class BatchUnlinkResponse extends ERMrestError {
  public successTupleData: any;
  public failedTupleData: any;

  constructor(successTupleData: any, failedTupleData: any, subMessage?: string) {
    const message = generateBatchDeleteMessage(successTupleData, failedTupleData, true);
    super('', _errorStatus.BATCH_UNLINK, message, subMessage);

    this.successTupleData = successTupleData;
    this.failedTupleData = failedTupleData;
  }
}

export class BatchDeleteResponse extends ERMrestError {
  public successTupleData: any;
  public failedTupleData: any;

  constructor(successTupleData: any, failedTupleData: any, subMessage?: string) {
    const message = generateBatchDeleteMessage(successTupleData, failedTupleData, false);
    super('', _errorStatus.BATCH_DELETE, message, subMessage);

    this.successTupleData = successTupleData;
    this.failedTupleData = failedTupleData;
  }
}

export class UnsupportedFilters extends ERMrestError {
  constructor(discardedFacets: any, partialyDiscardedFacets: any) {
    // process discarded facets
    const discardedFacetMsg: any[] = [],
      discardedFacetSubMsg: any[] = [];
    discardedFacets.forEach(function (f: any) {
      if (!f.markdown_name) return;
      discardedFacetMsg.push(f.markdown_name);
      discardedFacetSubMsg.push(createDiscardedFacetSubMessage(f));
    });
    // process partialy discarded facets
    const partDiscardedFacetMsg: any[] = [],
      partDiscardedFacetSubMsg: any[] = [];
    partialyDiscardedFacets.forEach(function (f: any) {
      if (!f.markdown_name) return;
      partDiscardedFacetMsg.push(f.markdown_name);
      partDiscardedFacetSubMsg.push(createDiscardedFacetSubMessage(f, true));
    });

    // create the message:
    // TODO using HTML here looks hacky, although we already are using html
    //      in conflict error
    let message = '<p>' + _errorMessage.UNSUPPORTED_FILTERS + '</p>';
    if (discardedFacetMsg.length > 0 || partDiscardedFacetMsg.length > 0) {
      message += '<ul>';
      if (discardedFacetMsg.length > 0) {
        message += "<li style='list-style-type: disc;'> Discarded facets: " + discardedFacetMsg.join(', ') + '</li>';
      }
      if (partDiscardedFacetMsg.length > 0) {
        message += "<li style='list-style-type: disc;'> Facets with some discarded choices: " + partDiscardedFacetMsg.join(', ') + '</li>';
      }
      message += '</ul>';
    }

    // create the submessage
    let subMessage = '';
    if (discardedFacetSubMsg.length > 0) {
      subMessage += 'Discarded facets:\n\n';
      subMessage += discardedFacetSubMsg.join('\n') + '\n\n\n';
    }
    if (partDiscardedFacetSubMsg.length > 0) {
      subMessage += 'Partially discarded facets:\n\n';
      subMessage += partDiscardedFacetSubMsg.join('\n') + '\n';
    }
    super('', _errorStatus.UNSUPPORTED_FILTERS, message, subMessage);
  }
}

// ---------------- helper functions -------------------- //

const removePageCondition = (path?: string) => {
  if (path !== undefined) {
    path = path.replace(/(@before\([^)]*\))/, '');
    path = path.replace(/(@after\([^)]*\))/, '');
  }
  return path;
};

const removeSortCondition = (path?: string) => {
  if (path !== undefined) {
    return path.replace(/(@sort\([^)]*\))/, '');
  }
  return path;
};

const createDiscardedFacetSubMessage = (obj: any, onlyChoices?: boolean) => {
  const sum = [];
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    let tempSum = obj.choices.length;
    if (obj.total_choice_count) {
      tempSum += '/' + obj.total_choice_count;
    }
    tempSum += ' choice' + (obj.choices.length > 1 ? 's' : '');
    sum.push(tempSum);
  }

  if (!onlyChoices && Array.isArray(obj.ranges) && obj.ranges.length > 0) {
    sum.push(obj.ranges.length + ' range' + (obj.ranges.length > 1 ? 's' : ''));
  }

  if (!onlyChoices && obj.not_null) {
    sum.push('not null');
  }

  let values: any = [];
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    values = values.concat(
      obj.choices.map((ch: any) => {
        return '  - ' + ch;
      }),
    );
  }
  if (!onlyChoices && Array.isArray(obj.ranges) && obj.ranges.length > 0) {
    values = values.concat(
      obj.ranges.map((r: any) => {
        return '  - ' + JSON.stringify(r);
      }),
    );
  }
  if (!onlyChoices && obj.not_null) {
    values = values.concat('  - not null');
  }

  return '- ' + obj.markdown_name + ' (' + sum.join(',') + '):\n' + values.join('\n');
};

/**
 * return the proper message that should be displayed to users. format:
 * - one record:
 *   - success: The {chosen|displayed} record successfully {unlinked|deleted}.
 *   - failure: The {chosen|displayed} record could not be {unlinked|deleted}. <check error>
 * - multiple records:
 *   - all success: All of the <number> {chosen|displayed} records successfully {unlinked|deleted}.
 *   - all failure: None of the <number> {chosen|displayed} records could be {unlinked|deleted}. <check error>
 *   - mix: <number> records successfully {unlinked|deleted}. <number> records could not be {unlinked|deleted}. <check error>
 *
 * <check error>: Check the error details below to see more information.
 */
const generateBatchDeleteMessage = (successTupleData: any, failedTupleData: any, isUnlink: boolean) => {
  const totalSuccess = successTupleData.length,
    totalFail = failedTupleData.length;
  let message = '';
  const checkDetails = ' Check the error details below to see more information.';
  const verb = isUnlink ? 'unlinked' : 'deleted';
  const adj = isUnlink ? 'chosen' : 'displayed';

  // there was just one row
  if (totalSuccess + totalFail === 1) {
    if (totalSuccess > 0) {
      message = 'The ' + adj + ' record successfully ' + verb + '.';
    } else {
      message = 'The ' + adj + ' record could not be ' + verb + '.';
    }
  }
  // multiple rows
  else {
    if (totalFail === 0) {
      message = 'All of the ' + totalSuccess + ' ' + adj + ' records successfully ' + verb + '.';
    } else if (totalSuccess === 0) {
      message = 'None of the ' + totalFail + ' ' + adj + ' records could be ' + verb + '.';
    } else {
      message = totalSuccess + ' record' + (totalSuccess > 1 ? 's' : '') + ' successfully ' + verb + '.';
      message += ' ' + totalFail + ' record' + (totalFail > 1 ? 's' : '') + ' could not be ' + verb + '.';
    }
  }
  return message + (totalFail > 0 ? checkDetails : '');
};
