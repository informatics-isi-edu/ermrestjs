// models
import { Reference, type Tuple, type VisibleColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import { BatchUnlinkResponse, InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

// utils
import { isObject, isObjectAndNotNull, verify } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { _facetFilterTypes, _parserAliases } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { _compressSource } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

import { Catalog, ForeignKeyRef, Table } from '@isrd-isi-edu/ermrestjs/js/core';
import { Location } from '@isrd-isi-edu/ermrestjs/js/parser';
import { _isValidModelCommentDisplay, _processSourceObjectComment, generateKeyValueFilters } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

export class RelatedReference extends Reference {
  private _mainTable: Table;
  private _mainTuple?: Tuple;
  private _origFKR: ForeignKeyRef;
  private _compressedDataSource?: any;
  private _derivedAssociationReference?: DerivedAssociationReference;

  public _relatedKeyColumnPositions: number[];
  public _relatedFkColumnPositions: number[];

  constructor(
    location: Location,
    catalog: Catalog,
    mainTable: Table,
    origFKR: ForeignKeyRef,
    relatedKeyColumnPositions: number[],
    relatedFkColumnPositions: number[],
    compressedDataSource?: any,
    mainTuple?: Tuple,
    displayname?: DisplayName,
    comment?: CommentType,
    pseudoColumn?: VisibleColumn,
  ) {
    super(location, catalog, displayname, comment, pseudoColumn);

    this._mainTable = mainTable;
    this._mainTuple = mainTuple;
    this._origFKR = origFKR;

    this._relatedKeyColumnPositions = relatedKeyColumnPositions;
    this._relatedFkColumnPositions = relatedFkColumnPositions;

    this._compressedDataSource = compressedDataSource;
  }

  /**
   * the main table
   * NOTE: the table that this reference represents is the related one, and
   * it is not the same as the main table.
   */
  get mainTable(): Table {
    return this._mainTable;
  }

  /**
   * the main tuple
   */
  get mainTuple(): Tuple | undefined {
    return this._mainTuple;
  }

  get origFKR(): ForeignKeyRef {
    return this._origFKR;
  }

  get compressedDataSource(): any {
    return this._compressedDataSource;
  }

  set derivedAssociationReference(ref: DerivedAssociationReference) {
    this._derivedAssociationReference = ref;
  }

  get derivedAssociationReference(): DerivedAssociationReference | undefined {
    return this._derivedAssociationReference;
  }

  /**
   * create a new instance with the same properties.
   *
   * you can customized the properties of the new instance by passing new ones to this function.
   * You must pass undefined for other props that you don't want to change.
   */
  copy(displayname?: DisplayName, comment?: CommentType, pseudoColumn?: VisibleColumn): RelatedReference {
    const res = new RelatedReference(
      this.location,
      this.location.catalogObject,
      this._mainTable,
      this._origFKR,
      this._relatedKeyColumnPositions,
      this._relatedFkColumnPositions,
      this._compressedDataSource,
      this._mainTuple,
      typeof displayname !== 'undefined' ? displayname : this.displayname,
      typeof comment !== 'undefined' ? comment : this.comment,
      typeof pseudoColumn !== 'undefined' ? pseudoColumn : this.pseudoColumn,
    );

    if (this.derivedAssociationReference) {
      res.derivedAssociationReference = this.derivedAssociationReference;
    }

    res.setContext(this.context);
    return res;
  }

  /**
   * If the current reference is derived from an association related table and filtered, this
   * function will delete the set of tuples included and return a set of success responses and
   * a set of errors for the corresponding delete actions for the provided entity set from the
   * corresponding association table denoted by the list of tuples.
   *
   * For example, assume
   * Table1(K1,C1) <- AssociationTable(FK1, FK2) -> Table2(K2,C2)
   * and the current tuples are from Table2 with k2 = "2" and k2 = "3".
   * With origFKRData = {"k1": "1"} this function will return a set of success and error responses for
   * delete requests to AssociationTable with FK1 = "1" as a part of the path and FK2 = "2" and FK2 = "3"
   * as the filters that define the set and how they are related to Table1.
   *
   * To make sure a deletion occurs only for the tuples specified, we need to verify each reference path that
   * is created includes a parent constraint and has one or more filters based on the other side of the association
   * table's uniqueness constraint. Some more information about the validations that need to occur based on the above example:
   *  - parent value has to be not null
   *    - FK1 has to have a not null constraint
   *  - child values have to have at least 1 value and all not null
   *    - for FK2, all selected values are not null
   *
   * @param {Array} mainTuple - an ERMrest.Tuple from Table1 (from example above)
   * @param {Array} tuples - an array of ERMrest.Tuple objects from Table2 (same as self) (from example above)
   * @param {Object} contextHeaderParams the object that we want to log.
   *
   * @returns {Object} an ERMrest.BatchUnlinkResponse "error" object
   **/
  deleteBatchAssociationTuples(
    parentTuple: Tuple,
    tuples: Array<Tuple>,
    contextHeaderParams?: Record<string, unknown>,
  ): Promise<BatchUnlinkResponse> {
    return new Promise((resolve, reject) => {
      try {
        verify(parentTuple, '`parentTuple` must be specified');
        verify(tuples, '`tuples` must be specified');
        verify(tuples.length > 0, '`tuples` must have at least one row to delete');
        // Can occur using an unfiltered reference
        verify(this.derivedAssociationReference, 'The current reference must have a derived association reference defined');

        const encode = fixedEncodeURIComponent;
        if (!contextHeaderParams || !isObject(contextHeaderParams)) {
          contextHeaderParams = { action: 'delete' };
        }
        const config = {
          headers: this._generateContextHeader(contextHeaderParams),
        };

        let successTupleData: Array<Record<string, unknown>> = [];
        let failedTupleData: Array<Record<string, unknown>> = [];
        const deleteSubmessage: Array<string> = [];
        const associationRef = this.derivedAssociationReference!;
        const mainKeyCol = associationRef.origFKR.colset.columns[0];

        // the path starting from association table, with filters based on the fk to the main table
        let compactPath = encode(associationRef.table.schema.name) + ':' + encode(associationRef.table.name) + '/';
        compactPath += encode(mainKeyCol.name) + '=' + encode(parentTuple.data[associationRef.origFKR.mapping.get(mainKeyCol).name]) + '&';

        // keyColumns should be a set of columns that are unique and not-null
        // columns tells us what the key column names are in the fkr "_to" relationship
        const keyColumns = associationRef.associationToRelatedFKR.colset.columns;
        // mapping tells us what the column name is on the leaf tuple, so we know what data to fetch from each tuple for identifying
        const mapping = associationRef.associationToRelatedFKR.mapping;

        // add the filters based on the fk to the related table
        const keyFromAssocToRelatedData = tuples.map((t) => {
          const res: Record<string, unknown> = {};
          keyColumns.forEach((col) => {
            res[col.name] = t.data[mapping.get(col).name];
          });
          return res;
        });
        const keyValueRes = generateKeyValueFilters(
          keyColumns,
          keyFromAssocToRelatedData,
          associationRef.table.schema.catalog,
          compactPath.length + 1, // 1 is for added `/` between filter and compactPath
          associationRef.displayname.value as string,
        );
        if (!keyValueRes.successful && keyValueRes.message) {
          reject(new InvalidInputError(keyValueRes.message));
          return;
        }

        // send the requests one at a time
        const recursiveDelete = (index: number) => {
          const currFilter = keyValueRes.filters![index];
          const url = [associationRef.location.service, 'catalog', associationRef.location.catalog, 'entity', compactPath + currFilter.path].join(
            '/',
          );

          this.server.http
            .delete(url, config)
            .then(() => {
              successTupleData = successTupleData.concat(currFilter.keyData);
            })
            .catch((err: any) => {
              failedTupleData = failedTupleData.concat(currFilter.keyData);
              deleteSubmessage.push(err.data);
            })
            .finally(() => {
              if (index < keyValueRes.filters!.length - 1) {
                recursiveDelete(index + 1);
              } else {
                resolve(new BatchUnlinkResponse(successTupleData, failedTupleData, deleteSubmessage.join('\n')));
              }
            });
        };

        recursiveDelete(0);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export class DerivedAssociationReference extends Reference {
  private _origFKR: ForeignKeyRef;
  private _associationToRelatedFKR: ForeignKeyRef;

  constructor(location: Location, catalog: Catalog, origFKR: ForeignKeyRef, associationToRelatedFKR: ForeignKeyRef) {
    super(location, catalog);

    this._associationToRelatedFKR = associationToRelatedFKR;
    this._origFKR = origFKR;
  }
  /**
   * the main tuple
   */
  get associationToRelatedFKR(): ForeignKeyRef {
    return this._associationToRelatedFKR;
  }

  get origFKR(): ForeignKeyRef {
    return this._origFKR;
  }

  copy(): DerivedAssociationReference {
    const ref = new DerivedAssociationReference(this.location, this.location.catalogObject, this._origFKR, this._associationToRelatedFKR);
    ref.setContext(this.context);
    return ref;
  }
}

/**
 * given a reference, the first inbound fk, and/or the sourceObjectWrapper summarizing the path, return the related reference.
 * @param mainRef the main reference
 * @param fkr the inbound fk
 * @param mainTuple the main tuple for the main reference
 * @param checkForAssociation whether we should check for association
 * @param sourceObjectWrapper the sourceObjectWrapper summarizing the path
 */
export const generateRelatedReference = (
  mainRef: Reference,
  fkr: ForeignKeyRef,
  mainTuple?: Tuple,
  checkForAssociation?: boolean,
  sourceObjectWrapper?: SourceObjectWrapper,
): RelatedReference => {
  const useFaceting = isObjectAndNotNull(mainTuple);

  let location, displayname, relatedKeyColumnPositions, relatedFkColumnPositions, derivedAssociationReference;
  let comment, commentDisplayMode, commentRenderMarkdown, tableDisplay, fkDisplay;
  const filterSource: any[] = [];
  const catalog = mainRef.table.schema.catalog;
  let dataSource: any = [{ inbound: fkr.constraint_names[0] }];
  const fkrTable = fkr.colset.columns[0].table;
  let relatedTable;

  if (checkForAssociation && fkrTable.isPureBinaryAssociation) {
    // find the other foreignkey
    const pureBinaryFKs = fkrTable.pureBinaryForeignKeys;
    let otherFK: ForeignKeyRef;
    for (let j = 0; j < pureBinaryFKs.length; j++) {
      if (pureBinaryFKs[j] !== fkr) {
        otherFK = pureBinaryFKs[j];
        break;
      }
    }

    relatedTable = otherFK!.key.table;
    const assocTable = otherFK!.colset.columns[0].table;

    // all the display settings must come from the same table (assoc table)
    // so if we get the comment from assoc table, displayname must also be from assoc table
    fkDisplay = otherFK!.getDisplay(mainRef.context);
    tableDisplay = assocTable.getDisplay(mainRef.context);

    // displayname
    if (fkDisplay.toName) {
      displayname = { isHTML: false, value: fkDisplay.toName, unformatted: fkDisplay.toName };
    } else {
      displayname = assocTable.displayname;
    }

    // comment
    if (fkDisplay.toComment) {
      comment = fkDisplay.toComment.unformatted;
    } else {
      comment = tableDisplay.comment ? tableDisplay.comment.unformatted : null;
    }
    if (_isValidModelCommentDisplay(fkDisplay.toCommentDisplayMode)) {
      commentDisplayMode = fkDisplay.toCommentDisplayMode;
    } else {
      commentDisplayMode = tableDisplay.tableCommentDisplayMode;
    }
    if (typeof fkDisplay.commentRenderMarkdown === 'boolean') {
      commentRenderMarkdown = fkDisplay.commentRenderMarkdown;
    } else {
      commentRenderMarkdown = tableDisplay.commentRenderMarkdown;
    }

    // uri and location
    if (!useFaceting) {
      location = parse(mainRef.location.compactUri + '/' + fkr.toString() + '/' + otherFK!.toString(true), catalog);
      // constructor will take care of this
      // location.referenceObject = newRef;
    }

    // additional values for sorting related references
    relatedKeyColumnPositions = fkr.key.colset._getColumnPositions();
    relatedFkColumnPositions = otherFK!.colset._getColumnPositions();

    // will be used to determine whether this related reference is derived from association relation or not
    derivedAssociationReference = new DerivedAssociationReference(parse(mainRef.location.compactUri + '/' + fkr.toString()), catalog, fkr, otherFK!);

    // build the filter source (the alias is used in the read function to get the proper acls)
    filterSource.push({ inbound: otherFK!.constraint_names[0], alias: _parserAliases.ASSOCIATION_TABLE });

    // build the data source
    dataSource.push({ outbound: otherFK!.constraint_names[0] });
  } else {
    relatedTable = fkrTable;
    fkDisplay = fkr.getDisplay(mainRef.context);
    tableDisplay = relatedTable.getDisplay(mainRef.context);

    // displayname
    if (fkDisplay.fromName) {
      displayname = { isHTML: false, value: fkDisplay.fromName, unformatted: fkDisplay.fromName };
    } else {
      displayname = relatedTable.displayname;
    }

    // comment
    if (fkDisplay.fromComment) {
      comment = fkDisplay.fromComment.unformatted;
    } else {
      comment = tableDisplay.comment ? tableDisplay.comment.unformatted : null;
    }
    if (_isValidModelCommentDisplay(fkDisplay.fromCommentDisplayMode)) {
      commentDisplayMode = fkDisplay.fromCommentDisplayMode;
    } else {
      commentDisplayMode = tableDisplay.tableCommentDisplayMode;
    }
    if (typeof fkDisplay.commentRenderMarkdown === 'boolean') {
      commentRenderMarkdown = fkDisplay.commentRenderMarkdown;
    } else {
      commentRenderMarkdown = tableDisplay.commentRenderMarkdown;
    }

    // uri and location
    if (!useFaceting) {
      location = parse(mainRef.location.compactUri + '/' + fkr.toString(), catalog);
      // constructor will take care of this
      // newRef._location.referenceObject = newRef;
    }

    // additional values for sorting related references
    relatedKeyColumnPositions = fkr.key.colset._getColumnPositions();
    relatedFkColumnPositions = fkr.colset._getColumnPositions();
  }

  let sourceObject;
  if (sourceObjectWrapper) {
    sourceObject = sourceObjectWrapper.sourceObject;
  }

  // if markdown_name in source object is defined
  if (sourceObject && typeof sourceObject.markdown_name === 'string') {
    displayname = {
      value: renderMarkdown(sourceObject.markdown_name, true),
      unformatted: sourceObject.markdown_name,
      isHTML: true,
    };
  }

  if (sourceObject && sourceObject.source) {
    dataSource = sourceObject.source;
  } else if (relatedTable.shortestKey.length === 1) {
    dataSource = dataSource.concat(relatedTable.shortestKey[0].name);
  }

  // complete the path
  filterSource.push({ outbound: fkr.constraint_names[0] });

  if (useFaceting) {
    let facets;
    location = parse(
      [
        catalog.server.uri,
        'catalog',
        catalog.id,
        'entity',
        fixedEncodeURIComponent(relatedTable.schema.name) + ':' + fixedEncodeURIComponent(relatedTable.name),
      ].join('/'),
      catalog,
    );

    // if the sourceObjectWrapper is passed, filter source is reverse of that.
    // NOTE the related table might have filters, that's why we have to do this and cannot
    // just rely on the structure
    if (isObjectAndNotNull(sourceObjectWrapper)) {
      const addAlias = checkForAssociation && fkrTable.isPureBinaryAssociation;
      facets = sourceObjectWrapper!.getReverseAsFacet(mainTuple!, fkr.key.table, addAlias ? _parserAliases.ASSOCIATION_TABLE : '');
    } else {
      //filters
      const filters: any[] = [];
      fkr.key.table.shortestKey.forEach(function (col) {
        const filter: any = {
          source: filterSource.concat(col.name),
        };
        filter[_facetFilterTypes.CHOICE] = [mainTuple!.data[col.name]];
        filters.push(filter);
      });

      facets = { and: filters };
    }

    // the facets are basd on the value of shortest key of current table
    location.facets = facets;
  }

  const newRef = new RelatedReference(
    location!,
    catalog,
    mainRef.table,
    fkr,
    relatedKeyColumnPositions,
    relatedFkColumnPositions,
    _compressSource(dataSource),
    mainTuple,
    displayname,
    _processSourceObjectComment(sourceObject, comment, commentRenderMarkdown, commentDisplayMode),
  );

  if (derivedAssociationReference) {
    newRef.derivedAssociationReference = derivedAssociationReference;
  }

  return newRef;
};
