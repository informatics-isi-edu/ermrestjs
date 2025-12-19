import moment from 'moment-timezone';

// models
import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

import { contextHeaderName, _operationsFlag, _dataFormats } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import {
  ERMrestError,
  NoConnectionError,
  TimedOutError,
  QueryTimeoutError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  IntegrityConflictError,
  DuplicateConflictError,
  ConflictError,
  SnapshotNotFoundError,
} from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy

import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import { ermrestFactory } from '@isrd-isi-edu/ermrestjs/js/core';
import HistoryService from '@isrd-isi-edu/ermrestjs/src/services/history';

export default class ErrorService {
  /**
   * Log the error object to the given ermrest location.
   * It will generate a put request to the /terminal_error with the correct headers.
   * ermrset will return a 400 page, but will log the message.
   * @param  {object} err             the error object
   * @param  {string} ermrestLocation the ermrest location
   */
  static logError(err: any, ermrestLocation: any, contextHeaderParams?: any) {
    return new Promise<void>((resolve, reject) => {
      const server = ermrestFactory.getServer(ermrestLocation);

      if (!contextHeaderParams || typeof contextHeaderParams !== 'object') {
        contextHeaderParams = {};
      }
      contextHeaderParams.e = 1;
      contextHeaderParams.name = err.constructor.name;
      contextHeaderParams.message = err.message;

      const headers: Record<string, any> = {};
      headers[contextHeaderName] = contextHeaderParams;

      // this http request will fail but will still log the message.
      server.http
        .put(ermrestLocation + '/terminal_error', {}, { headers: headers })
        .then(function () {
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * create an error object from http response
   * @param response http response object
   * @param reference the reference object
   * @param ctionFlag the flag that signals the action that the error occurred from
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static responseToError(response: any, reference?: any, actionFlag?: string) {
    const status = response.status;
    if (response instanceof ERMrestError) {
      return response;
    }
    switch (status) {
      case -1:
        return new NoConnectionError(response.data);
      case 0:
        return new TimedOutError(response.statusText, response.data);
      case 400:
        if (response.data.includes('Query run time limit exceeded')) return new QueryTimeoutError(response.statusText, response.data);
        return new BadRequestError(response.statusText, response.data);
      case 401:
        return new UnauthorizedError(response.statusText, response.data);
      case 403:
        return new ForbiddenError(response.statusText, response.data);
      case 404:
        return new NotFoundError(response.statusText, response.data);
      case 408:
        return new TimedOutError(response.statusText, response.data);
      case 409:
        return ErrorService._conflictErrorMapping(response.statusText, response.data, reference, actionFlag);
      case 412:
        return new PreconditionFailedError(response.statusText, response.data);
      case 500:
        return new InternalServerError(response.statusText, response.data);
      case 502:
        return new BadGatewayError(response.statusText, response.data);
      case 503:
        return new ServiceUnavailableError(response.statusText, response.data);
      default:
        if (response.statusText || response.data) {
          return new Error(response.statusText);
        } else {
          return new Error(response);
        }
    }
  }

  /**
   * @function
   * @param  {string} errorStatusText    http error status text
   * @param  {string} generatedErrMessage response data returned by http request
   * @return {object}                    error object
   * @desc
   *  - Integrity error message: This entry cannot be deleted as it is still referenced from the Human Age table.
   *                           All dependent entries must be removed before this item can be deleted.
   *  - Duplicate error message: The entry cannot be created/updated. Please use a different ID for this record.
   *                            Or (The entry cannot be created. Please use a combination of different _fields_ to create new record.)
   *
   */
  private static _conflictErrorMapping(errorStatusText: string, generatedErrMessage: string, reference?: any, actionFlag?: string) {
    let refTable, mappedErrMessage: string;
    const conflictErrorPrefix = ['409 Conflict\nThe request conflicts with the state of the server. ', 'Request conflicts with state of server.'];
    let siteAdminMsg = '\nIf you have trouble removing dependencies please contact the site administrator.';

    if (generatedErrMessage.indexOf('Requested catalog revision ') > -1 && generatedErrMessage.indexOf('is prior to any known revision.') > -1) {
      const match = generatedErrMessage.match(/Requested catalog revision "([^"]+)"/);
      const snapshot = match ? match[1] : '';
      let formattedTime = '';
      if (snapshot) {
        formattedTime = HistoryService.snapshotToDatetimeISO(snapshot, true);
        if (formattedTime) {
          formattedTime = moment(formattedTime).format(_dataFormats.DATETIME.display);
        }
      }
      const newMessage = `The requested snapshot time ${formattedTime ? '(' + formattedTime + ') ' : ''}is older than any available history.`;

      return new SnapshotNotFoundError(errorStatusText, newMessage);
    } else if (generatedErrMessage.indexOf('violates foreign key constraint') > -1 && actionFlag === _operationsFlag.DELETE) {
      let referenceTable: any = '';

      let detail: string | number = generatedErrMessage.search(/DETAIL:/g);
      if (detail > -1) {
        detail = generatedErrMessage.substring(detail, generatedErrMessage.length);
        referenceTable = detail.match(/referenced from table "(.*)"(.*)/);
        if (referenceTable && referenceTable.length > 1) {
          refTable = referenceTable[1];
          referenceTable = refTable;
        }
      }

      const fkConstraintMatch = generatedErrMessage.match(/foreign key constraint "(.*?)"/); //get constraintName
      let fkConstraint = '';
      if (fkConstraintMatch && fkConstraintMatch.length > 1) {
        fkConstraint = fkConstraintMatch[1];
      }
      if (typeof reference === 'object' && typeof fkConstraint === 'string' && fkConstraint !== '') {
        const relatedRef = reference.related; //get all related references

        for (let i = 0; i < relatedRef.length; i++) {
          const key = relatedRef[i];
          if (key.origFKR && key.origFKR.constraint_names['0'][1] === fkConstraint && key.origFKR._table.name === refTable) {
            referenceTable = key.displayname.value;
            siteAdminMsg = '';
            break;
          }
        }
      }

      // make sure referenceTable is defined first
      if (referenceTable) {
        referenceTable = 'the <code>' + referenceTable + '</code>';
      } else {
        referenceTable = 'another';
      }

      // NOTE we cannot make any assumptions abou tthe table name. for now we just show the table name that database sends us.
      mappedErrMessage =
        'This entry cannot be deleted as it is still referenced from ' +
        referenceTable +
        ' table. \n All dependent entries must be removed before this item can be deleted.' +
        siteAdminMsg;
      return new IntegrityConflictError(errorStatusText, mappedErrMessage, generatedErrMessage);
    } else if (generatedErrMessage.indexOf('violates unique constraint') > -1) {
      let msgTail;
      const keyValueMap: Record<string, string> = {};
      let duplicateReference = null;
      const columnRegExp = /\(([^)]+)\)/,
        valueRegExp = /=\(([^)]+)\)/,
        matches = columnRegExp.exec(generatedErrMessage),
        values = valueRegExp.exec(generatedErrMessage);

      // parse out column names and values from generatedErrMessage
      const primaryColumns = matches ? matches[1].split(',') : [];
      const conflictValues = values ? values[1].split(',') : [];

      // trim first because sort will put strings with whitespace in front of them before other strings, i.e. " id"
      primaryColumns.forEach(function (col, index) {
        let trimmedName = col.trim();
        // strip off " character, if present
        if (trimmedName.indexOf('"') != -1) trimmedName = trimmedName.split('"')[1];
        primaryColumns[index] = trimmedName;
        keyValueMap[trimmedName] = conflictValues[index].trim();
      });

      if (matches && matches.length > 1) {
        const numberOfKeys = primaryColumns.length;

        if (numberOfKeys > 1) {
          let columnString = '';
          // sort the keys because ermrest returns them in a random order every time
          primaryColumns.sort();
          primaryColumns.forEach(function (col, index) {
            columnString += (index !== 0 ? ', ' : '') + col;
          });

          msgTail = 'combination of ' + columnString;
        } else {
          msgTail = primaryColumns;
        }
      }

      mappedErrMessage = 'The entry cannot be created/updated. ';
      if (msgTail) {
        mappedErrMessage += 'Please use a different ' + msgTail + ' for this record.';
      } else {
        mappedErrMessage += 'Input data violates unique constraint.';
      }

      const conflictKeyValues: string[] = [];
      primaryColumns.forEach(function (colName) {
        conflictKeyValues.push(fixedEncodeURIComponent(colName) + '=' + fixedEncodeURIComponent(keyValueMap[colName]));
      });

      if (reference) {
        const uri = reference.unfilteredReference.uri + '/' + conflictKeyValues.join('&');
        // Reference for the conflicting row that already exists with the unique constraints
        duplicateReference = new Reference(parse(uri, null), reference.table.schema.catalog);
      }
      return new DuplicateConflictError(errorStatusText, mappedErrMessage, generatedErrMessage, duplicateReference);
    } else {
      mappedErrMessage = generatedErrMessage;

      // remove the previx if exists
      let hasPrefix = false;
      conflictErrorPrefix.forEach(function (p) {
        if (!hasPrefix && mappedErrMessage.startsWith(p)) {
          mappedErrMessage = mappedErrMessage.slice(p.length);
          hasPrefix = true;
        }
      });

      // remove the suffix is exists
      const errEnd = mappedErrMessage.search(/CONTEXT:/g);
      if (errEnd > -1) {
        mappedErrMessage = mappedErrMessage.substring(0, errEnd - 1);
      }

      return new ConflictError(errorStatusText, mappedErrMessage, generatedErrMessage);
    }
  }
}
