import { ReferenceColumn, ReferenceColumnTypes } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';

import { _sourceColumnHelpers, _compressSource } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';
import { Reference } from '@isrd-isi-edu/ermrestjs/js/reference';
import { ForeignKeyRef, Table } from '@isrd-isi-edu/ermrestjs/js/core';
/**
 * @class
 * @param {Reference} reference column's reference
 * @param {Reference} relatedReference the related reference
 * @desc
 * Constructor for InboundForeignKeyPseudoColumn. This class is a wrapper for {@link ForeignKeyRef}.
 * This is a bit different than the {@link ForeignKeyPseudoColumn}, as that was for foreign keys
 * of current table. This wrapper is for inbound foreignkeys. It is actually warpping the whole reference (table).
 *
 * Note: The sourceObjectWrapper might include filters and therefore the relatedReference
 *       might not be a simple path from main to related table and it could have filters.
 *
 * This class extends the {@link ReferenceColumn}
 */
export class InboundForeignKeyPseudoColumn extends ReferenceColumn {
  /**
   * The reference that can be used to get the data for this pseudo-column
   * @type {Reference}
   */
  public reference: Reference;

  /**
   * The table that this pseudo-column represents
   * @type {Table}
   */
  public table: Table;

  /**
   * The {@link ForeignKeyRef} that this pseudo-column is based on.
   * @type {ForeignKeyRef}
   */
  public foreignKey: ForeignKeyRef;

  /**
   * @type {boolean}
   * @desc indicates that this object represents a PseudoColumn.
   */
  public isPseudo: boolean = true;

  /**
   * @type {boolean}
   * @desc Indicates that this ReferenceColumn is an inbound foreign key.
   */
  public isInboundForeignKey: boolean = true;

  public isUnique: boolean = false;

  private _currentRef: Reference;
  private _constraintName: string;

  constructor(reference: Reference, relatedReference: Reference, sourceObjectWrapper?: SourceObjectWrapper, name?: string) {
    const fk = relatedReference.origFKR;

    // call the parent constructor
    super(reference, fk.colset.columns, sourceObjectWrapper, name);

    this.referenceColumnType = ReferenceColumnTypes.INBOUND_FOREIGN_KEY;

    this.reference = relatedReference;
    this.reference.pseudoColumn = this;
    this.table = relatedReference.table;
    this.foreignKey = fk;

    this._context = reference._context;
    this._currentRef = reference;
    this._currentTable = reference.table;
    this._constraintName = fk._constraintName;
    this._name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatPresentation(data: any, context?: string, templateVariables?: any, options?: any): any {
    // NOTE this property should not be used.
    return { isHTML: true, value: '', unformatted: '' };
  }

  _determineSortable(): void {
    this._sortColumns_cached = [];
    this._sortable = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _determineInputDisabled(_: string): boolean | { message: string } {
    throw new Error('can not use this type of column in entry mode.');
  }

  get name(): string {
    if (this._name === undefined) {
      this._name = _sourceColumnHelpers.generateForeignKeyName(this.foreignKey, true) as string;
    }
    return this._name;
  }

  get displayname(): DisplayName {
    if (this._displayname === undefined) {
      this._displayname = this.reference.displayname;
    }
    return this._displayname!;
  }

  get comment(): CommentType {
    if (this._comment === undefined) {
      this._comment = this.reference.comment;
    }
    return this._comment!;
  }

  get default(): unknown {
    throw new Error('can not use this type of column in entry mode.');
  }

  get nullok(): boolean {
    throw new Error('can not use this type of column in entry mode.');
  }

  get compressedDataSource(): unknown {
    if (this._compressedDataSource === undefined) {
      let ds = null;
      if (this.sourceObject && this.sourceObject.source) {
        ds = _compressSource(this.sourceObject.source);
      } else if (this.reference.compressedDataSource) {
        ds = this.reference.compressedDataSource;
      }
      this._compressedDataSource = ds;
    }
    return this._compressedDataSource;
  }
}
