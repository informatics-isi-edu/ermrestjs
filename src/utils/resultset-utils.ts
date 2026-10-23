// models
import type { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { ForeignKeyPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type { ForeignKeyRef } from '@isrd-isi-edu/ermrestjs/src/models/foreign-key';
import type { Key } from '@isrd-isi-edu/ermrestjs/src/models/key';

// utils
import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

type Row = Record<string, any>;

/**
 * Build the linked data (foreign key rows) of the rows returned by create/update.
 *
 * The response only has the raw foreign key values. Each foreign key gets the same key-only data
 * that Page builds for entity rows. That data is replaced with a row the client already has (e.g. the
 * row selected in recordedit) only when its key values exactly match the values in the response.
 *
 * The result is stored under `fk.name` (used by $fkeys) and under the name of any all-outbound
 * foreign key column of resultRef that has a different name (e.g. source-defined columns).
 *
 * @param mutationRef the reference used for create/update. its columns define the names used in formLinkedData.
 * @param resultRef the reference of the result page
 * @param rows the rows returned by create/update
 * @param formLinkedData the linked data of each submitted row, in the form of `{ [columnName]: row }`
 */
export function buildResultsetLinkedData(
  mutationRef: Reference,
  resultRef: Reference,
  rows: Row[],
  formLinkedData?: Row[],
): { linkedData: Row[]; linkedDataRIDs: Row[] } {
  const knownRows = indexKnownRows(mutationRef, formLinkedData);
  const fks = resultRef.table.foreignKeys.all();

  const renamedFKColumns = (resultRef.activeList.allOutBounds as ForeignKeyPseudoColumn[]).filter((col) => {
    return col.isForeignKey && col.name !== col.foreignKey.name;
  });

  const linkedData: Row[] = [];
  const linkedDataRIDs: Row[] = [];
  rows.forEach((row) => {
    const rowLinkedData: Row = {};
    const rowLinkedDataRIDs: Row = {};

    fks.forEach((fk) => {
      rowLinkedData[fk.name] = resolveForeignKeyData(fk, row, knownRows);
      rowLinkedDataRIDs[fk.name] = fk.RID;
    });

    renamedFKColumns.forEach((col) => {
      rowLinkedData[col.name] = rowLinkedData[col.foreignKey.name];
      rowLinkedDataRIDs[col.name] = col.RID;
    });

    linkedData.push(rowLinkedData);
    linkedDataRIDs.push(rowLinkedDataRIDs);
  });

  return { linkedData, linkedDataRIDs };
}

/**
 * Index the rows that the client has for foreign keys, so they can be found by their key values.
 */
function indexKnownRows(mutationRef: Reference, formLinkedData?: Row[]): Map<string, Row> {
  const knownRows = new Map<string, Row>();
  if (!Array.isArray(formLinkedData) || formLinkedData.length === 0) return knownRows;

  // the foreign key columns that the names in formLinkedData refer to
  const fkColumns: Record<string, ForeignKeyPseudoColumn> = {};
  (mutationRef.activeList.allOutBounds as ForeignKeyPseudoColumn[]).forEach((col) => {
    if (col.isForeignKey) fkColumns[col.name] = col;
  });

  formLinkedData.forEach((formData) => {
    if (!isObjectAndNotNull(formData)) return;

    Object.keys(formData).forEach((colName) => {
      const fkCol = fkColumns[colName];
      const knownRow = formData[colName];
      if (!fkCol || !isObjectAndNotNull(knownRow)) return;

      /*
       * the client might have read the rows of tables with alternatives from an alternative table
       * (e.g. compact/select), so their RID and other values could belong to another table.
       */
      const refTable = fkCol.foreignKey.key.table;
      if (refTable._isAlternativeTable() || Object.keys(refTable._alternatives ?? {}).length > 0) return;

      // a row can serve any foreign key to its table, so index it under every key it has values for
      refTable.keys.all().forEach((key: Key) => {
        const values = key.colset.columns.map((col) => knownRow[col.name]);
        if (values.some((v) => v === null || v === undefined)) return;

        const id = getKnownRowId(key, values);
        const existing = knownRows.get(id);
        // prefer the row with more data (e.g. a full row over the key values used for defaults)
        if (!existing || Object.keys(knownRow).length > Object.keys(existing).length) {
          knownRows.set(id, knownRow);
        }
      });
    });
  });

  return knownRows;
}

/**
 * Return the linked data of the given foreign key for the given row.
 */
function resolveForeignKeyData(fk: ForeignKeyRef, row: Row, knownRows: Map<string, Row>): Row {
  // same as the data that Page creates for entity rows (only the key values)
  const keyOnlyData: Row = {};
  fk.colset.columns.forEach((col) => {
    keyOnlyData[fk.mapping.get(col).name] = row[col.name];
  });

  if (knownRows.size === 0) return keyOnlyData;

  /*
   * walk the key columns (not fk.colset) so the id is built the same way as the index.
   * colsets are sorted by column name, so the two orders can differ for composite keys.
   */
  const values = fk.key.colset.columns.map((keyCol) => row[fk.mapping.getFromColumn(keyCol).name]);
  if (values.some((v) => v === null || v === undefined)) return keyOnlyData;

  return knownRows.get(getKnownRowId(fk.key, values)) ?? keyOnlyData;
}

function getKnownRowId(key: Key, values: unknown[]): string {
  return key.colset.toString() + JSON.stringify(values);
}
