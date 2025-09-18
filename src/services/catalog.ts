import { ForeignKeyRef, Key } from '@isrd-isi-edu/ermrestjs/js/core';
import { _constraintTypes } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

export default class CatalogService {
  private static constraintNames: Record<
    string,
    Record<string, Record<string, { subject: _constraintTypes; object: Key | ForeignKeyRef; RID: string }>>
  > = {};

  static addConstraintName(catalogId: string, schemaName: string, constraintName: string, obj: any, subject: _constraintTypes) {
    if (!(catalogId in CatalogService.constraintNames)) {
      CatalogService.constraintNames[catalogId] = {};
    }

    if (!(schemaName in CatalogService.constraintNames[catalogId])) {
      CatalogService.constraintNames[catalogId][schemaName] = {};
    }

    CatalogService.constraintNames[catalogId][schemaName][constraintName] = {
      subject: subject,
      object: obj,
      RID: obj.RID,
    };
  }

  static getConstraintObject(catalogId: string, schemaName: string, constraintName: string, subject?: _constraintTypes) {
    let result;
    if (catalogId in CatalogService.constraintNames && schemaName in CatalogService.constraintNames[catalogId]) {
      result = CatalogService.constraintNames[catalogId][schemaName][constraintName];
    }
    return result === undefined || (subject !== undefined && result.subject !== subject) ? null : result;
  }

  static clearConstraintNames() {
    CatalogService.constraintNames = {};
  }
}
