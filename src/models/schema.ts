// models
import { Annotation, Annotations } from '@isrd-isi-edu/ermrestjs/src/models/annotation';
import type { Catalog } from '@isrd-isi-edu/ermrestjs/src/models/catalog';
import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import type { AnnotationContent, SchemaJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { MalformedURIError, NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { Table, Tables } from '@isrd-isi-edu/ermrestjs/src/models/table';

// utils
import { _annotations, _contexts } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isEmptyArray } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

// legacy
import {
  _determineDisplayName,
  _getRecursiveAnnotationValue,
  _processACLAnnotation,
  _processModelComment,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

// typed view of the untyped legacy helper; remove once js/utils/helpers.js is migrated to typescript.
const processModelComment = _processModelComment as (comment?: string | null | false, isMarkdown?: boolean, displayMode?: string) => CommentType;

/**
 * Container of the Schema objects of a catalog, keyed by schema name.
 */
export class Schemas {
  _schemas: Record<string, Schema> = {};

  _all?: Schema[];

  _push(schema: Schema): void {
    this._schemas[schema.name] = schema;
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * number of schemas
   */
  length(): number {
    return Object.keys(this._schemas).length;
  }

  /**
   * Array of all schemas in the catalog
   */
  all(): Schema[] {
    if (!this._all) {
      this._all = [];
      for (const key in this._schemas) {
        this._all.push(this._schemas[key]);
      }
    }
    return this._all;
  }

  /**
   * Array of schema names
   */
  names(): string[] {
    return Object.keys(this._schemas);
  }

  /**
   * get schema by schema name
   * @param name schema name
   * @throws {NotFoundError} schema not found
   */
  get(name: string): Schema {
    if (!(name in this._schemas)) {
      throw new NotFoundError('', 'Schema ' + name + ' not found in catalog.');
    }

    return this._schemas[name];
  }

  /**
   * check for schema name existence
   * @param name schema name
   */
  has(name: string): boolean {
    return name in this._schemas;
  }

  /**
   * Given table name and schema will find the table object.
   * If schema name is not given, it will still try to find the table.
   * If the table name exists in multiple schemas or it doesn't exist,
   * it will throw an error
   * @param tableName the name of table
   * @param schemaName the name of schema (optional)
   * @throws {MalformedURIError}
   * @throws {NotFoundError}
   */
  findTable(tableName: string, schemaName?: string): Table {
    if (schemaName) {
      return this.get(schemaName).tables.get(tableName);
    }

    const schemas = this.all();
    let schema;
    for (let i = 0; i < schemas.length; i++) {
      if (schemas[i].tables.names().indexOf(tableName) !== -1) {
        if (!schema) {
          schema = schemas[i];
        } else {
          throw new MalformedURIError('Ambiguous table name ' + tableName + '. Schema name is required.');
        }
      }
    }
    if (!schema) {
      throw new MalformedURIError('Table ' + tableName + ' not found');
    }

    return schema.tables.get(tableName);
  }
}

/**
 * A schema in the ermrest model.
 */
export class Schema {
  catalog: Catalog;

  /**
   * the database name of the schema
   */
  name: string;

  /**
   * The RID of this schema (might not be defined)
   */
  RID?: string;

  ignore: boolean;

  annotations: Annotations;

  rights: SchemaJSON['rights'];

  /**
   * whether schema is generated.
   * This should be done before initializing tables because tables require this field.
   */
  isGenerated: boolean | null;

  /**
   * whether schema is immutable.
   * true: schema is immutable (per annotation)
   * false: schema is mutable (per annotation)
   * null: annotation is not defined
   */
  isImmutable: boolean | null;

  /**
   * whether schema is non-deletable
   */
  isNonDeletable: boolean | null;

  _nameStyle: Record<string, unknown>; // Used in the displayname to store the name styles.

  /**
   * Preferred display name for user presentation only.
   * this.displayname.isHTML will return true/false
   * this.displayname.value has the value
   */
  displayname: DisplayName;

  tables: Tables;

  /**
   * Documentation for this schema
   */
  comment: CommentType;

  _appLinksAnnotation?: AnnotationContent;

  /**
   * @param catalog the catalog object.
   * @param jsonSchema json of the schema.
   */
  constructor(catalog: Catalog, jsonSchema: SchemaJSON) {
    this.catalog = catalog;

    this.name = jsonSchema.schema_name;

    this.RID = jsonSchema.RID;

    this.ignore = false;

    this.annotations = new Annotations();
    for (const uri in jsonSchema.annotations) {
      const jsonAnnotation = jsonSchema.annotations[uri];
      this.annotations._push(new Annotation('schema', uri, jsonAnnotation));

      if (uri === _annotations.HIDDEN) {
        this.ignore = true;
      } else if (uri === _annotations.IGNORE && (jsonAnnotation === null || isEmptyArray(jsonAnnotation))) {
        this.ignore = true;
      }
    }

    this.rights = jsonSchema.rights;

    this.isGenerated = _processACLAnnotation(this.annotations, _annotations.GENERATED, this.catalog.isGenerated);

    this.isImmutable = _processACLAnnotation(this.annotations, _annotations.IMMUTABLE, this.catalog.isImmutable);

    this.isNonDeletable = _processACLAnnotation(this.annotations, _annotations.NON_DELETABLE, this.catalog.isNonDeletable);

    this._nameStyle = {};

    this.displayname = _determineDisplayName(this, true, this.catalog);

    this.tables = new Tables();
    for (const key in jsonSchema.tables) {
      const jsonTable = jsonSchema.tables[key];
      this.tables._push(new Table(this, jsonTable));
    }

    this.comment = processModelComment(jsonSchema.comment);
    if (this.annotations.contains(_annotations.DISPLAY)) {
      const cm = processModelComment(this.annotations.get(_annotations.DISPLAY).content.comment);
      if (cm) {
        this.comment = cm;
      }
    }

    if (this.annotations.contains(_annotations.APP_LINKS)) {
      this._appLinksAnnotation = this.annotations.get(_annotations.APP_LINKS).content;
    }
  }

  /** not implemented (crud stub kept from the legacy api) */
  delete(): void {}

  /**
   * app tag defined on the schema level, or null if not found
   */
  _getAppLink(context?: string): string | null {
    let app: AnnotationContent = -1;
    if (this._appLinksAnnotation) {
      if (!context) app = _getRecursiveAnnotationValue(_contexts.DEFAULT, this._appLinksAnnotation);
      else app = _getRecursiveAnnotationValue(context, this._appLinksAnnotation);
    }

    // no app link found
    if (app === -1) return null;
    else return app;
  }
}
