import moment from 'moment-timezone';

// models
import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import { ReferenceColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { verify } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { _contexts, _dataFormats, _histogramSupportedTypes } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { Column, Type } from '@isrd-isi-edu/ermrestjs/js/core';
import {
  AttributeGroupColumn,
  AttributeGroupReference,
  AttributeGroupLocation,
  BucketAttributeGroupReference,
} from '@isrd-isi-edu/ermrestjs/js/ag_reference';

/**
 * Constructs an Aggregate Function object
 *
 * Column Aggregate Functions is a collection of available aggregates for the
 * particular ReferenceColumn (min, max, count not null, and count distinct for it's column).
 * Each aggregate should return the string representation for querying for that information.
 *
 * Usage:
 *  Clients _do not_ directly access this constructor. ERMrest.ReferenceColumn
 *  will access this constructor for purposes of fetching aggregate data
 *  for a specific column
 */
export class ColumnAggregateFn {
  public column: ReferenceColumn;

  constructor(column: ReferenceColumn) {
    this.column = column;
  }

  /**
   * minimum aggregate representation
   */
  get minAgg(): string {
    return 'min(' + fixedEncodeURIComponent(this.column.name) + ')';
  }

  /**
   * maximum aggregate representation
   */
  get maxAgg(): string {
    return 'max(' + fixedEncodeURIComponent(this.column.name) + ')';
  }

  /**
   * not null count aggregate representation
   */
  get countNotNullAgg(): string {
    return 'cnt(' + fixedEncodeURIComponent(this.column.name) + ')';
  }

  /**
   * distinct count aggregate representation
   */
  get countDistinctAgg(): string {
    return 'cnt_d(' + fixedEncodeURIComponent(this.column.name) + ')';
  }
}

/**
 * Interface for sort column objects used in entityCounts method
 */
interface SortColumn {
  column?: Column;
  num_occurrences?: boolean;
  descending?: boolean;
}

/**
 * Can be used to access group aggregate functions.
 * Usage:
 *  Clients _do not_ directly access this constructor. ERMrest.ReferenceColumn
 *  will access this constructor for purposes of fetching grouped aggregate data
 *  for a specific column
 */
export class ColumnGroupAggregateFn {
  public column: ReferenceColumn;
  private _ref: Reference;

  constructor(column: ReferenceColumn, ref: Reference) {
    this.column = column;
    this._ref = ref;
  }

  /**
   * Will return a compact/select attribute group reference which can be used to show distinct values and their counts
   * The result is based on shortest key of the parent table. If we have join
   * in the path, we are counting the shortest key of the parent table (not the end table).
   * NOTE: Will create a new reference by each call.
   * @param columnDisplayname the displayname of main column.
   * @param sortColumns the sort column object that you want to pass
   * @param hideNumOccurrences whether we should add number of Occurrences or not.
   * @param dontAllowNull whether the null value should be returned for the facet or not.
   * @returns AttributeGroupReference
   */
  entityCounts(
    columnDisplayname?: DisplayName | string,
    sortColumns?: SortColumn[],
    hideNumOccurrences?: boolean,
    dontAllowNull?: boolean,
  ): AttributeGroupReference {
    if (this.column.isPseudo) {
      throw new Error('Cannot use this API on pseudo-column.');
    }

    if (this._ref.location.hasJoin && this._ref.facetBaseTable.shortestKey.length > 1) {
      throw new Error('Table must have a simple key for entity counts: ' + this._ref.facetBaseTable.name);
    }

    const countColName = 'count';
    const context = _contexts.COMPACT_SELECT;
    const column = this.column;
    let sortCounts = false;
    const keyColumns: AttributeGroupColumn[] = [];
    let sortObj: Array<{ column: string; descending: boolean }> = [];
    let i = 0;
    let colAlias: string;

    // key columns will have numbers as alias, and the aggregate is `count`
    const addToKeyColumns = (col: Column, isVisible: boolean, displayname?: DisplayName | string): string => {
      colAlias = (i++).toString();
      keyColumns.push(
        new AttributeGroupColumn(
          colAlias,
          fixedEncodeURIComponent(col.name),
          col,
          displayname,
          null,
          col.getDisplay(context).comment,
          true,
          isVisible,
        ),
      );
      return colAlias;
    };

    // the first column is always the column that we want to get the values of
    addToKeyColumns(column.baseColumns[0], true, columnDisplayname);

    if (Array.isArray(sortColumns) && sortColumns.length > 0) {
      sortColumns.forEach((sc) => {
        // if column is not sortable
        if (sc.column && typeof sc.column._getSortColumns?.(context) === 'undefined') {
          $log.info('column ' + sc.column.name + ' is not sortable and we are removing it from sort columns (entityCounts).');
          return;
        }

        if (sc.num_occurrences && !sortCounts) {
          sortCounts = true;
          sortObj.push({ column: countColName, descending: !!sc.descending });
        } else if (sc.column && sc.column.name === column.name) {
          sortObj.push({ column: '0', descending: !!sc.descending });
        } else if (sc.column) {
          // add to key columns
          const keyAlias = addToKeyColumns(sc.column as any, false);

          // add to sortObj
          sortObj.push({ column: keyAlias, descending: !!sc.descending });
        }
      });
    } else {
      // by default we're sorting based on descending count and ascending raw value.
      sortObj = [
        { column: countColName, descending: true },
        { column: '0', descending: false },
      ];
    }

    // search will be on the table not the aggregated results, so the column name must be the column name in the database
    const searchObj = { column: this.column.name, term: null };

    let path = this._ref.location.ermrestCompactPath;
    if (dontAllowNull) {
      const encodedColName = fixedEncodeURIComponent(this.column.name);
      path += '/!(' + encodedColName + '::null::';
      // when it's json, we cannot possibly know the difference between database null and
      // json null, so we need to filter both.
      if (this.column.type.name.indexOf('json') === 0) {
        path += ';' + encodedColName + '=null';
      }
      path += ')';
    }

    const loc = new AttributeGroupLocation(this._ref.location.service, this._ref.table.schema.catalog, path, searchObj, sortObj);

    const aggregateColumns: AttributeGroupColumn[] = [];

    // if it's hidden and also not in the sort, then we don't need it.
    if (!hideNumOccurrences || sortCounts) {
      let countName = 'cnt(*)';
      if (this._ref.location.hasJoin) {
        countName =
          'cnt_d(' + this._ref.location.facetBaseTableAlias + ':' + fixedEncodeURIComponent(this._ref.facetBaseTable.shortestKey[0].name) + ')';
      }

      aggregateColumns.push(
        new AttributeGroupColumn(
          countColName,
          countName,
          null,
          'Number of Occurrences',
          new Type({ typename: 'int' }),
          null,
          true,
          !hideNumOccurrences,
        ),
      );
    }

    return new AttributeGroupReference(keyColumns, aggregateColumns, loc, this._ref.table.schema.catalog, this._ref.table, context);
  }

  /**
   * Given number of buckets, min and max will return bin of results.
   * The result is based on shortest key of the parent table. If we have join
   * in the path, we are creating the histogram based on shortest key of the
   * parent table (not the end table).
   * @param bucketCount number of buckets
   * @param min minimum value
   * @param max maximum value
   * @return BucketAttributeGroupReference
   */
  histogram(bucketCount: number, min: any, max: any): BucketAttributeGroupReference {
    verify(typeof bucketCount === 'number', 'Invalid bucket count type.');
    verify(min !== undefined && max !== undefined, 'Minimum and maximum are required.');
    verify(max >= min, 'Maximum must be greater than the minimum');
    const column = this.column;
    const reference = this._ref;

    if (column.isPseudo) {
      throw new Error('Cannot use this API on pseudo-column.');
    }

    if (_histogramSupportedTypes.indexOf(column.type.rootName) === -1) {
      throw new Error('Binning is not supported on column type ' + column.type.name);
    }

    if (reference.location.hasJoin && reference.facetBaseTable.shortestKey.length > 1) {
      throw new Error('Table must have a simple key.');
    }

    let width: number;
    let minMoment: moment.Moment, maxMoment: moment.Moment;
    let absMax = max;

    if (column.type.rootName.indexOf('date') > -1) {
      // we don't want to make a request for date aggregates that split in the middle of a day, so the max
      // value used is adjusted so that the range between min and max divided by number of buckets is a whole
      // integer after converted back to days ( (max-min)/width )
      minMoment = moment(min);
      maxMoment = moment(max);

      // bin API does not support using an equivalent min and max
      if (maxMoment.diff(minMoment) === 0) {
        maxMoment.add(1, 'd');
      }

      // moment.diff() returns the number of milliseconds between the 2 moments in time.
      // moment.duration(milliseconds).asDays() creates a duration from the milliseconds value and converts
      //   that to the number of days that milliseconds value represents
      // We don't want a bucket to represent a portion of a day, so define our width as the next largest number of days
      width = Math.ceil(moment.duration(maxMoment.diff(minMoment) / bucketCount).asDays());
      // This is adjusted so that if we have 30 buckets and a range of 2 days, one day isn't split into multiple buckets (dates represent a whole day)
      absMax = minMoment.add(width * bucketCount, 'd').format(_dataFormats.DATE);
    } else if (column.type.rootName.indexOf('timestamp') > -1) {
      minMoment = moment(min);
      maxMoment = moment(max);

      // bin API does not support using an equivalent min and max
      if (maxMoment.diff(minMoment) === 0) {
        // generate a new max value so each bucket represents a 10 second period of time
        maxMoment.add(10 * bucketCount, 's');
        absMax = maxMoment.format(_dataFormats.DATETIME.submission);
      }

      width = Math.round(moment.duration(maxMoment.diff(minMoment) / bucketCount).asSeconds());

      // increase width to be minimum of 1 second
      if (width < 1) {
        width = 1;
      }
    } else {
      // bin API does not support using an equivalent min and max
      if (max - min === 0) {
        max++;
        absMax = max;
      }

      width = (max - min) / bucketCount;
      if (column.type.rootName.indexOf('int') > -1) {
        // we don't want to make a request for int aggregates that create float values for bucket min/max values, so the max
        // value used is adjusted so that the range between min and max divided by number of buckets is a whole integer
        width = Math.ceil(width);
        absMax = min + width * bucketCount;
      }
    }

    return new BucketAttributeGroupReference(column, reference, min, absMax, bucketCount, width);
  }
}
