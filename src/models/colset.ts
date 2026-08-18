// models
import type { Column } from '@isrd-isi-edu/ermrestjs/src/models/column';
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

/**
 * A set of Column objects.
 */
export class ColSet {
  /**
   * It won't preserve the order of given columns.
   * Returns set of columns sorted by their names.
   */
  columns: Column[];

  _columnPositions?: number[];
  _textColumnsCount?: number;
  _allSerialOrInt?: boolean;

  /**
   * @param columns an array of Column objects.
   */
  constructor(columns: Column[]) {
    this.columns = columns.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * returns string representation of colset object: (s:t:c1,s:t:c2)
   */
  toString(): string {
    return (
      '(' +
      this.columns
        .map(function (col) {
          return col.toString();
        })
        .join(',') +
      ')'
    );
  }

  /**
   * number of columns
   */
  length(): number {
    return this.columns.length;
  }

  _equals(colset: ColSet): boolean {
    const colsA = colset.columns;
    const colsB = this.columns;

    // for each col in colsetA, find equiv. col in colsetB
    if (colsA.length === colsB.length) {
      for (let a = 0; a < colsA.length; a++) {
        const colA = colsA[a];

        // find equiv col in colsetB
        // if not found, return false
        let foundMatchingCol = false;
        for (let b = 0; b < colsB.length; b++) {
          const colB = colsB[b];
          if (colA._equals(colB)) {
            foundMatchingCol = true;
            break;
          }
        }
        if (!foundMatchingCol) {
          return false;
        }
      }
    } else return false;

    return true;
  }

  // the index of columns in the actual table
  _getColumnPositions(): number[] {
    if (this._columnPositions === undefined) {
      this._columnPositions = this.columns
        .map(function (col) {
          return col.table.columns.all().indexOf(col);
        })
        .sort();
    }
    return this._columnPositions;
  }

  /**
   * how many text columns are in this colset
   */
  get textColumnsCount(): number {
    if (this._textColumnsCount === undefined) {
      let res = 0;
      for (let i = 0; i < this.columns.length; i++) {
        if (this.columns[i].type.name === 'text') res++;
      }
      this._textColumnsCount = res;
    }
    return this._textColumnsCount;
  }

  /**
   * whether all the columns are integer or serial
   */
  get allSerialOrInt(): boolean {
    if (this._allSerialOrInt === undefined) {
      this._allSerialOrInt = this.columns.every(function (column) {
        const current = column.type.name;
        return current.toUpperCase().startsWith('INT') || current.toUpperCase().startsWith('SERIAL');
      });
    }
    return this._allSerialOrInt;
  }
}

/**
 * A mapping between two sets of columns (used by foreign keys).
 */
export class Mapping {
  _from: Column[];
  _to: Column[];

  /**
   * @param from array of from Columns
   * @param to array of to Columns
   */
  constructor(from: Column[], to: Column[]) {
    this._from = from;
    this._to = to;
  }

  /**
   * returns string representation of Mapping object
   */
  toString(): string {
    // changing from and to to Colset, makes this easier.
    return [this._from, this._to]
      .map(function (columns) {
        // create toString for from and to
        return columns
          .slice()
          .sort(function (a, b) {
            return a.name.localeCompare(b.name);
          })
          .map(function (col) {
            return col.toString();
          })
          .join(',');
      })
      .join('>');
  }

  /**
   * number of mapping columns
   */
  length(): number {
    return this._from.length;
  }

  /**
   * the from columns
   */
  domain(): Column[] {
    return this._from;
  }

  /**
   * get the mapping column given the from column
   * @throws {NotFoundError} no mapping column found
   */
  get(fromCol: Column): Column {
    for (let i = 0; i < this._from.length; i++) {
      if (fromCol._equals(this._from[i])) {
        return this._to[i];
      }
    }

    throw new NotFoundError('', 'Mapping not found for column ' + fromCol.name);
  }

  /**
   * get the mapping column given the to column
   * @throws {NotFoundError} no mapping column found
   */
  getFromColumn(toCol: Column): Column {
    for (let i = 0; i < this._to.length; i++) {
      if (toCol._equals(this._to[i])) {
        return this._from[i];
      }
    }

    throw new NotFoundError('', 'Mapping not found for column ' + toCol.name);
  }
}
