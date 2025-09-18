// models
import { Page, Reference, RelatedReference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';

// utils
import { fixedEncodeURIComponent, shallowCopy, simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { _ERMrestACLs, _contexts, _permissionMessages } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

import { isAllOutboundColumn } from '@isrd-isi-edu/ermrestjs/src/utils/column-utils';
import { _generateRowName, _generateTupleUniqueId, _getRowTemplateVariables, _isEntryContext } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';

/**
 * Constructs a new Tuple. In database jargon, a tuple is a row in a
 * relation. This object represents a row returned by a query to ERMrest.
 *
 * Usage:
 *  Clients _do not_ directly access this constructor.
 *  See {@link Page#tuples}.
 */
export class Tuple {
  private _pageRef: Reference | RelatedReference;
  private _page: Page;
  private _data: Record<string, any>;
  private _linkedData: Record<string, any>;
  private _linkedDataRIDs: Record<string, any>;
  private _rightsSummary: Record<string, any>;
  private _associationRightsSummary: Record<string, any>;

  // TODO
  public _oldData?: Record<string, any>;

  private _ref?: Reference;
  private _canUpdate?: boolean;
  private _canUpdateReason?: string;
  private _canDelete?: boolean;
  private _canUnlink?: boolean;
  private _values?: string[];
  private _isHTML?: boolean[];
  private _canUpdateValues?: boolean[];
  private _displayname?: DisplayName;
  private _rowName?: DisplayName;
  private _uniqueId?: string;
  private _templateVariables?: any;
  private _selfTemplateVariable?: any;

  constructor(
    pageReference: Reference,
    page: Page,
    data?: Record<string, any>,
    linkedData?: Record<string, any>,
    linkedDataRIDs?: Record<string, any>,
    rightsSummary?: Record<string, any>,
    associationRightsSummary?: Record<string, any>,
  ) {
    this._pageRef = pageReference;
    this._page = page;
    this._data = data || {};
    this._linkedData = typeof linkedData === 'object' ? linkedData : {};
    this._linkedDataRIDs = typeof linkedDataRIDs === 'object' ? linkedDataRIDs : {};
    this._rightsSummary = typeof rightsSummary === 'object' ? rightsSummary : {};
    this._associationRightsSummary = typeof associationRightsSummary === 'object' ? associationRightsSummary : {};
  }

  /**
   * This is the reference of the Tuple
   */
  get reference(): Reference {
    if (this._ref === undefined) {
      const newRef = this._pageRef.copy();

      let uri = this._pageRef.location.service + '/catalog/' + this._pageRef.location.catalog + '/' + this._pageRef.location.api + '/';

      // if this is an alternative table, use base table
      if (this._pageRef.table._isAlternativeTable()) {
        const baseTable = this._pageRef.table._baseTable;
        newRef.setNewTable(baseTable);
        uri = uri + fixedEncodeURIComponent(baseTable.schema.name) + ':' + fixedEncodeURIComponent(baseTable.name) + '/';

        // convert filter columns to base table columns using shared key
        const fkey = this._pageRef.table._altForeignKey;
        fkey.mapping.domain().forEach((altColumn: any, index: number) => {
          const baseCol = fkey.mapping.get(altColumn);
          if (index === 0) {
            uri = uri + fixedEncodeURIComponent(baseCol.name) + '=' + fixedEncodeURIComponent(this._data[altColumn.name]);
          } else {
            uri = uri + '&' + fixedEncodeURIComponent(baseCol.name) + '=' + fixedEncodeURIComponent(this._data[altColumn.name]);
          }
        });
      } else {
        // update its location by adding the tuple's key filter to the URI
        // don't keep any modifiers
        uri = uri + fixedEncodeURIComponent(newRef.table.schema.name) + ':' + fixedEncodeURIComponent(newRef.table.name) + '/';
        for (let k = 0; k < newRef.shortestKey.length; k++) {
          const col = newRef.shortestKey[k].name;
          if (k === 0) {
            uri = uri + fixedEncodeURIComponent(col) + '=' + fixedEncodeURIComponent(this._data[col]);
          } else {
            uri = uri + '&' + fixedEncodeURIComponent(col) + '=' + fixedEncodeURIComponent(this._data[col]);
          }
        }
      }

      newRef.setLocation(parse(uri, newRef.table.schema.catalog));

      this._ref = newRef;
    }
    return this._ref;
  }

  /**
   * This is the page of the Tuple
   */
  get page(): Page {
    return this._page;
  }

  /**
   * Foreign key data.
   * During the read we get extra information about the foreign keys,
   * client could use these extra information for different purposes.
   * One of these usecases is domain_filter_pattern which they can
   * include foreignkey data in the pattern language.
   */
  get linkedData(): Record<string, any> {
    return this._linkedData;
  }

  /**
   * Foreign key data RID names.
   * Map of `column.name` keys with the `column.RID` as the value so RIDs
   * can be used in cases that require safe strings
   */
  get linkedDataRIDs(): Record<string, any> {
    return this._linkedDataRIDs;
  }

  /**
   * Used for getting the current set of data for the reference.
   * This stores the original data in the _oldData object to preserve
   * it before any changes are made and those values can be properly
   * used in update requests.
   *
   * Notably, if a key value is changed, the old value needs to be kept
   * track of so that the column projections for the uri can be properly created
   * and both the old and new value for the modified key are submitted together
   * for proper updating.
   */
  get data(): Record<string, any> {
    if (this._oldData === undefined) {
      this._oldData = simpleDeepCopy(this._data);
    }
    return this._data;
  }

  checkPermissions(permission: string, colName?: string, isAssoc = false): boolean {
    let sum = this._rightsSummary[permission];
    if (isAssoc) {
      sum = this._associationRightsSummary[permission];
    }

    if (permission === _ERMrestACLs.COLUMN_UPDATE) {
      if (!isObjectAndNotNull(sum) || typeof sum[colName!] !== 'boolean') return true;
      return sum[colName!];
    }

    if (typeof sum !== 'boolean') return true;
    return sum;
  }

  /**
   * Indicates whether the client can update this tuple. Reporting a `true`
   * value DOES NOT guarantee the user right since some policies may be
   * undecidable until query execution.
   *
   * Usage:
   * ```
   * if (tuple.canUpdate) {
   *   console.log(tuple.displayname, "may be updated by this client");
   * }
   * else {
   *   console.log(tuple.displayname, "cannot be updated by this client");
   * }
   * ```
   */
  get canUpdate(): boolean {
    if (this._canUpdate === undefined) {
      const pm = _permissionMessages;
      let canUpdateOneCol: boolean;

      this._canUpdate = true;

      // make sure table can be updated
      if (!this._pageRef.canUpdate) {
        this._canUpdate = false;
        this._canUpdateReason = this._pageRef.canUpdateReason;
      }
      // check row level permission
      else if (!this.checkPermissions(_ERMrestACLs.UPDATE)) {
        this._canUpdate = false;
        this._canUpdateReason = pm.NO_UPDATE_ROW;
      } else {
        // make sure at least one column can be updated
        // (dynamic acl allows it and also it's not disabled)
        canUpdateOneCol = true;
        if (this._pageRef.context === _contexts.EDIT) {
          canUpdateOneCol = this.canUpdateValues.some((canUpdateValue, i) => {
            return canUpdateValue && !this._pageRef.columns[i].inputDisabled;
          });
        } else {
          // see if at least one visible column in edit context can be updated
          const ref = this._pageRef.contextualize.entryEdit;
          if (ref.table == this._pageRef.table) {
            // make sure not alternative
            canUpdateOneCol = ref.columns.some((col: any) => {
              return (
                !col.inputDisabled &&
                !col.baseColumns.some((bcol: any) => {
                  return !this.checkPermissions(_ERMrestACLs.COLUMN_UPDATE, bcol.name);
                })
              );
            });
          }
        }

        if (!canUpdateOneCol) {
          this._canUpdate = false;
          this._canUpdateReason = pm.NO_UPDATE_COLUMN;
        }
      }
    }
    return this._canUpdate;
  }

  /**
   * Indicates the reason as to why a user cannot update this tuple.
   */
  get canUpdateReason(): string | undefined {
    if (this._canUpdateReason === undefined) {
      // will generate the reason
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const bool = this.canUpdate;
    }
    return this._canUpdateReason;
  }

  /**
   * Indicates whether the client can delete this tuple. Reporting a `true`
   * value DOES NOT guarantee the user right since some policies may be
   * undecidable until query execution.
   *
   * Usage:
   * ```
   * if (tuple.canDelete) {
   *   console.log(tuple.displayname, "may be deleted by this client");
   * }
   * else {
   *   console.log(tuple.displayname, "cannot be deleted by this client");
   * }
   * ```
   */
  get canDelete(): boolean {
    if (this._canDelete === undefined) {
      // make sure table and row can be deleted
      this._canDelete = this._pageRef.canDelete && this.checkPermissions(_ERMrestACLs.DELETE);
    }
    return this._canDelete;
  }

  get canUnlink(): boolean {
    if (this._canUnlink === undefined) {
      const relRef = this._pageRef as RelatedReference;
      if (!relRef.derivedAssociationReference) {
        this._canUnlink = false;
      } else {
        const ref = relRef.derivedAssociationReference;
        // make sure association table and row can be deleted
        this._canUnlink = (ref.canDelete as boolean) && this.checkPermissions('delete', undefined, true);
      }
    }
    return this._canUnlink;
  }

  /**
   * The array of formatted/raw values of this tuple on basis of context "edit".
   * The ordering of the values in the array matches the ordering of the columns
   * in the reference (see {@link ERMrest.Reference#columns}).
   *
   * Usage (iterating over all values in the tuple):
   * ```
   * for (var i=0; len=reference.columns.length; i<len; i++) {
   *   console.log(tuple.displayname, "has a", ref.columns[i].displayname,
   *       "with value", tuple.values[i]);
   * }
   * ```
   *
   * Usage (getting a specific value by column position):
   * ```
   * var column = reference.columns[8]; // the 8th column in this refernece
   * console.log(tuple.displayname, "has a", column.displayname,
   *     "with value", tuple.values[column.position]);
   * ```
   */
  get values(): string[] {
    if (this._values === undefined) {
      /*
       * There are multiple annotations involved in getting the value of column,
       * one of these annotations is markdown_pattern that can be defined on columns.
       * For that annotation, we need the templateVariables of all the columns.
       * Therefore at first we're calling `_getFormattedKeyValues` which internally
       * will call `formatvalue` for all the columns and also adds the extra attributes.
       * We're passing the raw value to the formatPresentation, because that function
       * will call the `formatvalue` iself which its value might be different from what
       * `_getFormattedKeyValues` is returning for the column. For example, in case of
       * array of texts, we should not treat the values as markdown and we should
       * escpae markdown characters. This special case exists only for array, because we're
       * manipulating some special cases (null and empty string) and we want those to be treated as markdown.
       * Then to make it easier for us, we are escaping other markdown characters. For instance
       * assume the value of array column is ["", "*Empty*"]. We expect the final returned
       * value for the column to be "<p><em>Empty</em>, *Empty*</p>". But if another column
       * is using this column in its markdown pattern (assume column name is col therefore
       * a markdown_pattern of {{{col}}}) the expected value is "<p><em>Empty</em>, <em>Empty</em>".
       * And that's because we're allowing injection of markdown in markdown_pattern even if the
       * column type is text.
       *
       * tl;dr
       * - call `_getFormattedKeyValues` to get formmated values of all columns for the usage of markdown_pattern.
       * - call formatPresentation for each column.
       *   - calls formatvalue for the column to get the formatted value (might be different from `_getFormattedKeyValues` for the column).
       *   - if markdown_pattern exists:
       *     - use the template with result of `_getFormattedKeyValues` to get the value.
       *   - otherwise:
       *     - if json, attach <pre> tag to the formatted value.
       *     - if array, call printArray which will return a string.
       *     - otherwise return the formatted value.
       */

      this._values = [];
      this._isHTML = [];
      this._canUpdateValues = [];

      const checkUpdateColPermission = (col: any) => {
        return !this.checkPermissions(_ERMrestACLs.COLUMN_UPDATE, col.name);
      };

      // key value pair of formmated values, to be used in formatPresentation
      const keyValues = this.templateVariables.values;

      // If context is entry
      if (_isEntryContext(this._pageRef.context)) {
        // Return raw values according to the visibility and sequence of columns
        for (let i = 0; i < this._pageRef.columns.length; i++) {
          const column = this._pageRef.columns[i];

          // if user cannot update any of the base_columns then the column should be disabled
          this._canUpdateValues[i] = !column.baseColumns.some(checkUpdateColPermission);

          if (column.isPseudo) {
            let presentation;
            if (isAllOutboundColumn(column)) {
              presentation = column.formatPresentation(this._linkedData[column.name], this._pageRef.context, keyValues);
            } else {
              presentation = column.formatPresentation(this._data, this._pageRef.context, keyValues);
            }
            this._values[i] = presentation.value;
            this._isHTML[i] = presentation.isHTML;
          }
          //Added this if conditon explicitly for json/jsonb because we need to pass the
          //formatted string representation of JSON and JSONBvalues
          else if (column.type.name === 'json' || column.type.name === 'jsonb') {
            this._values[i] = keyValues[column.name];
            this._isHTML[i] = false;
          } else {
            this._values[i] = this._data[column.name];
            this._isHTML[i] = false;
          }
        }
      } else {
        /*
         * use this variable to avoid using computed formatted values in other columns while templating
         */
        const values: any[] = [];

        // format values according to column display annotation
        for (let i = 0; i < this._pageRef.columns.length; i++) {
          const column = this._pageRef.columns[i];
          if (column.isPseudo) {
            if (isAllOutboundColumn(column)) {
              values[i] = column.formatPresentation(this._linkedData[column.name], this._pageRef.context, keyValues);
            } else {
              values[i] = column.formatPresentation(this._data, this._pageRef.context, keyValues);
            }
          } else {
            values[i] = column.formatPresentation(this._data, this._pageRef.context, keyValues);

            if (column.type.name === 'gene_sequence') {
              values[i].isHTML = true;
            }
          }
        }

        values.forEach((fv) => {
          this._values!.push(fv.value);
          this._isHTML!.push(fv.isHTML);
        });
      }
    }
    return this._values;
  }

  /**
   * The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
   * values in the array matches the ordering of the columns in the
   * reference (see {@link ERMrest.Reference#columns}).
   *
   * Usage (iterating over all values in the tuple):
   * ```
   * for (var i=0; len=reference.columns.length; i<len; i++) {
   *   console.log(tuple.displayname, tuple.isHTML[i] ? " has an HTML value" : " does not has an HTML value");
   * }
   * ```
   */
  get isHTML(): boolean[] {
    // this._isHTML has not been populated then call this.values getter to populate values and isHTML array
    if (this._isHTML === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const value = this.values;
    }

    return this._isHTML!;
  }

  /**
   * currently only populated in entry context
   */
  get canUpdateValues(): boolean[] {
    if (this._canUpdateValues === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const value = this.values;
    }

    return this._canUpdateValues!;
  }

  /**
   * The _display name_ of this tuple. For example, if this tuple is a
   * row from a table, then the display name is defined by the
   * row_markdown_pattern annotation for the _row_name/title_ context
   * or by the heuristics (title, name, id(text), SHORTESTKEY Concatenation using ':')
   *
   * Usage:
   * ```
   * console.log("This tuple has a displayable name of ", tuple.displayname.value);
   * ```
   */
  get displayname(): DisplayName {
    if (this._displayname === undefined) {
      this._displayname = _generateRowName(this._pageRef.table, this._pageRef.context, this._data, this._linkedData, true);
    }
    return this._displayname;
  }

  /**
   * The row name_ of this tuple. For example, if this tuple is a
   * row from a table, then the display name is defined by the
   * row_markdown_pattern annotation for the _row_name_ context
   * or by the heuristics (title, name, id(text), SHORTESTKEY Concatenation using ':')
   *
   * Usage:
   * ```
   * console.log("This tuple has a displayable name of ", tuple.rowName.value);
   * ```
   */
  get rowName(): DisplayName {
    if (this._rowName === undefined) {
      this._rowName = _generateRowName(this._pageRef.table, this._pageRef.context, this._data, this._linkedData, false);
    }
    return this._rowName;
  }

  /**
   * The unique identifier for this tuple composed of the values for each
   * of the shortest key columns concatenated together by an '_'
   */
  get uniqueId(): string {
    if (this._uniqueId === undefined) {
      this._uniqueId = _generateTupleUniqueId(this._pageRef.table.shortestKey, this.data);
    }
    return this._uniqueId;
  }

  /**
   * An object of what is available in templating environment for this tuple
   * it has the following attributes:
   * - values
   * - rowName
   * - uri
   */
  get templateVariables(): any {
    if (this._templateVariables === undefined) {
      const context = this._pageRef.context;
      const keyValues = _getRowTemplateVariables(this._pageRef.table, context, this._data, this._linkedData);

      // TODO should we move these to the _getFormattedKeyValues?
      // the multi-fk all-outbounds
      const sm = this._pageRef.table.sourceDefinitions.sourceMapping;

      this._pageRef.activeList.allOutBounds.forEach((col: any) => {
        // data is null, so we don't need to add it
        if (!this._linkedData[col.name]) return;

        // see if it exists in the mapping
        if (Array.isArray(sm[col.name])) {
          if (col.isForeignKey || col.isEntityMode) {
            // alloutbound entity
            const fkTempVal = _getRowTemplateVariables(col.table, context, this._linkedData[col.name]);

            sm[col.name].forEach((key: string) => {
              keyValues.values[key] = fkTempVal;
            });
          } else {
            // alloutbound scalar
            sm[col.name].forEach((key: string) => {
              const rawVal = this._linkedData[col.name][col.baseColumn.name];
              keyValues.values[key] = col.baseColumn.formatvalue(rawVal, context);
              keyValues.values['_' + key] = rawVal;
            });
          }
        }
      });

      // the self_links
      let selfLinkValue: any;
      this._pageRef.activeList.selfLinks.forEach((col: any) => {
        if (Array.isArray(sm[col.name])) {
          // compute it once and use it for all the self-links.
          if (!selfLinkValue) {
            selfLinkValue = _getRowTemplateVariables(col.table, context, this._data, null, col.key);
          }

          sm[col.name].forEach((key: string) => {
            keyValues.values[key] = selfLinkValue;
          });
        }
      });

      this._templateVariables = keyValues;
    }
    return this._templateVariables;
  }

  /**
   * Should be used for populating $self for this tuple in templating environments
   * It will have,
   * - rowName
   * - uri
   */
  get selfTemplateVariable(): any {
    if (this._selfTemplateVariable === undefined) {
      const $self: any = {};
      for (const j in this.templateVariables) {
        if (Object.prototype.hasOwnProperty.call(this.templateVariables, j) && j != 'values') {
          $self[j] = this.templateVariables[j];
        }
      }
      this._selfTemplateVariable = $self;
    }
    return this._selfTemplateVariable;
  }

  /**
   * If the Tuple is derived from an association related table,
   * this function will return a reference to the corresponding
   * entity of this tuple's association table.
   *
   * For example, assume
   * Table1(K1,C1) <- AssocitaitonTable(FK1, FK2) -> Table2(K2,C2)
   * and current tuple is from Table2 with k2 = "2".
   * With origFKRData = {"k1": "1"} this function will return a reference
   * to AssocitaitonTable with FK1 = "1"" and FK2 = "2".
   */
  getAssociationRef(origTableData: Record<string, any>): Reference | null {
    const relRef = this._pageRef as RelatedReference;
    if (!relRef.derivedAssociationReference) {
      return null;
    }

    const associationRef = relRef.derivedAssociationReference;
    const encoder = fixedEncodeURIComponent;
    const newFilter: string[] = [];
    let missingData = false;

    const addFilter = (fkr: any, data: Record<string, any>): boolean => {
      const keyCols = fkr.colset.columns;
      const mapping = fkr.mapping;
      let d: any;

      for (let i = 0; i < keyCols.length; i++) {
        try {
          d = data[mapping.get(keyCols[i]).name];
          if (d === undefined || d === null) return false;

          newFilter.push(encoder(keyCols[i].name) + '=' + encoder(d));
        } catch {
          return false;
        }
      }
      return true;
    };
    // filter based on the first key
    missingData = !addFilter(associationRef.origFKR, origTableData);
    //filter based on the second key
    missingData = missingData || !addFilter(associationRef.associationToRelatedFKR, this._data);

    if (missingData) {
      return null;
    }
    const loc = associationRef.location;
    const uri = [
      loc.service,
      'catalog',
      loc.catalog,
      loc.api,
      encoder(associationRef.table.schema.name) + ':' + encoder(associationRef.table.name),
      newFilter.join('&'),
    ].join('/');

    const reference = new Reference(parse(uri), this._pageRef.table.schema.catalog);
    return reference;
  }

  /**
   * @desc
   * This function takes the current Tuple (this) and creates a shallow copy of it while de-referencing
   * the _data attribute. This way _data can be modified in chaise without changing the originating Tuple
   * @returns a shallow copy of _this_ tuple with it's _data de-referenced
   */
  copy(): Tuple {
    const newTuple = Object.create(Tuple.prototype);
    shallowCopy(newTuple, this);
    newTuple._data = {};

    //change _data though
    const keys = Object.keys(this._data);
    for (let i = 0; i < keys.length; i++) {
      newTuple._data[keys[i]] = this._data[keys[i]];
    }

    return newTuple;
  }
}
