// models
import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// utils
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy

/**
 * Constructs an Aggregate Funciton object
 *
 * Reference Aggregate Functions is a collection of available aggregates for the
 * particular Reference (count for the table). Each aggregate should return the string
 * representation for querying that information.
 *
 * Usage:
 *  Clients _do not_ directly access this constructor. ERMrest.Reference will
 *  access this constructor for purposes of fetching aggregate data about the table.
 */
export class ReferenceAggregateFn {
  private _ref: Reference;

  constructor(reference: Reference) {
    this._ref = reference;
  }

  /**
   * count aggregate representation
   */
  get countAgg(): string {
    if (this._ref.table.shortestKey.length > 1) {
      throw new Error('Table `' + this._ref.table.name + '`' + "doesn't have any simple keys. For getting count simple key is required.");
    }

    return 'cnt_d(' + fixedEncodeURIComponent(this._ref.table.shortestKey[0].name) + ')';
  }
}
