// models
import type { TypeJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';

/**
 * Represents the type of a column or key in the ermrest model.
 */
export class Type {
  /**
   * the database name of the type
   */
  name: string;

  /**
   * Currently used to signal whether there is a base type for this column
   */
  isArray?: boolean;

  _isDomain?: boolean;

  baseType?: Type;

  _rootName?: string;

  constructor(jsonType: TypeJSON) {
    this.name = jsonType.typename;
    this.isArray = jsonType.is_array;
    this._isDomain = jsonType.is_domain;

    if (jsonType.base_type !== undefined) {
      this.baseType = new Type(jsonType.base_type);
    }
  }

  /**
   * The column name of the base. This goes to the first level which
   * will be a type understandable by database.
   */
  get rootName(): string {
    if (this._rootName === undefined) {
      const getName = function (type: Type): string {
        return type.baseType ? getName(type.baseType) : type.name;
      };
      this._rootName = getName(this);
    }
    return this._rootName;
  }
}
