// models
import { ForeignKeyPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';

// utils
import { _serialTypes, _systemColumns } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

/**
 * Constructor to create a BulkCreateForeignKeyObject object
 *
 * NOTE: Potential improvement to the heuristics when there is no annotation defined
 *   if we have:
 *     - >2 FK columns
 *     - there is a key with 2 foreign key columns in it
 *     - that key includes the _mainColumn mentioned in prefillObject
 *   should we assume that's the main/leaf columns for the association?
 */
export class BulkCreateForeignKeyObject {
  private _reference: Reference;
  private _prefillObject: any;
  private _mainColumn: ForeignKeyPseudoColumn;
  private _leafColumn: ForeignKeyPseudoColumn;
  private _isUnique: boolean = false;
  private _disabledRowsFilters?: any[];
  private _andFilters?: any[];

  /**
   * @param reference reference for the association table
   * @param prefillObject generated prefill object from chaise after extracting the query param and fetching the data from cookie storage
   * @param fkCols set of foreignkey columns that are not system columns (they might be overlapping so we're not using array)
   * @param mainColumn the column from the assocation table that points to the main table in the association
   * @param leafColumn the column from the assocation table that points to the leaf table in the association we are selecting rows from to associate to main
   */
  constructor(
    reference: Reference,
    prefillObject: any,
    fkCols: Record<string, boolean>,
    mainColumn: ForeignKeyPseudoColumn,
    leafColumn: ForeignKeyPseudoColumn,
  ) {
    this._reference = reference;
    this._prefillObject = prefillObject;
    this._mainColumn = mainColumn;
    this._leafColumn = leafColumn;
    this._isUnique = false;

    const tempKeys = reference.table.keys.all().filter((key) => {
      const keyCols = key.colset.columns;
      return !(
        keyCols.length === 1 &&
        (_serialTypes.indexOf(keyCols[0].type.name) !== -1 || _systemColumns.indexOf(keyCols[0].name) !== -1) &&
        !(keyCols[0].name in fkCols)
      );
    });

    // to calculate isUnique
    //   - One of the keys should contain the main and leaf foreign key columns
    tempKeys.forEach((key) => {
      let mainMatch = false;
      let leafMatch = false;

      key.colset.columns.forEach((col) => {
        if (col.name === this._leafColumn.baseColumns[0].name) {
          leafMatch = true;
        } else if (col.name === this._mainColumn.baseColumns[0].name) {
          mainMatch = true;
        }
      });

      if (leafMatch && mainMatch) this._isUnique = true;
    });
  }

  /**
   * the column that points to the table that rows are being selected from
   */
  get leafColumn(): ForeignKeyPseudoColumn {
    return this._leafColumn;
  }

  /**
   * if the 2 foreign key columns are part of a unqiue key
   */
  get isUnique(): boolean {
    return this._isUnique;
  }

  /**
   * @returns filters array for getting the rows that should be disabled
   */
  disabledRowsFilter(): any[] {
    if (this._disabledRowsFilters === undefined) {
      const filters: any[] = [];
      Object.keys(this._prefillObject.keys).forEach((key) => {
        filters.push({
          source: [
            { inbound: this._leafColumn.foreignKey.constraint_names[0] },
            { outbound: this._mainColumn.foreignKey.constraint_names[0] },
            this._mainColumn.foreignKey.mapping._to[0].name,
          ],
          choices: [this._prefillObject.keys[key]],
        });
      });

      this._disabledRowsFilters = filters;
    }

    return this._disabledRowsFilters;
  }

  /**
   * @returns filters array to use on leafColumn.reference for ensuring rows from the table are only able to be added if their key information is not null
   */
  andFiltersForLeaf(): any[] {
    if (this._andFilters === undefined) {
      const filters: any[] = [];
      // loop through all of key columns of the leaf foreign key pseudo column that make up the key information for the tablerows are selected from and create non-null filters
      this._leafColumn.foreignKey.key.colset.columns.forEach((col) => {
        filters.push({
          source: col.name,
          hidden: true,
          not_null: true,
        });
      });

      this._andFilters = filters;
    }

    return this._andFilters;
  }
}
