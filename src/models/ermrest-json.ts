/**
 * Cheap structural interfaces for the ermrest catalog introspection JSON.
 * They only declare the properties our model constructors actually read;
 * anything uninspected stays `unknown`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Annotation payloads are free-form documents defined by each annotation's own spec.
 * This is the one sanctioned `any` of the introspection layer.
 */
export type AnnotationContent = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * ACL rights reported by ermrest for a model element.
 */
export interface RightsJSON {
  select?: boolean | null;
  insert?: boolean | null;
  update?: boolean | null;
  delete?: boolean | null;
  [right: string]: boolean | null | undefined;
}

export interface ColumnJSON {
  name: string;
  type: TypeJSON;
  rights: RightsJSON;
  nullok: boolean;
  annotations: Record<string, AnnotationContent>;
  comment?: string | null | false;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- free-form JSON scalar defined by the model */
  default?: any;
  RID?: string;
}

export interface TableJSON {
  table_name: string;
  kind?: string;
  column_definitions: ColumnJSON[];
  keys: KeyJSON[];
  foreign_keys: ForeignKeyRefJSON[];
  rights: RightsJSON;
  annotations?: Record<string, AnnotationContent>;
  comment?: string | null | false;
  RID?: string;
}

export interface KeyJSON {
  unique_columns: string[];
  /**
   * The exact `names` array in the key definition: a list of [schema, constraint] pairs.
   */
  names: string[][];
  annotations?: Record<string, AnnotationContent>;
  comment?: string | null | false;
  RID?: string;
}

export interface ForeignKeyColumnJSON {
  column_name: string;
  table_name?: string;
  schema_name?: string;
}

export interface ForeignKeyRefJSON {
  foreign_key_columns: ForeignKeyColumnJSON[];
  referenced_columns: Required<ForeignKeyColumnJSON>[];
  /**
   * The exact `names` array in the foreign key definition: a list of [schema, constraint] pairs.
   */
  names: string[][];
  rights: RightsJSON;
  annotations?: Record<string, AnnotationContent>;
  comment?: string | null | false;
  on_delete?: string;
  RID?: string;
}

/**
 * The response of the `/catalog/<id>` request.
 */
export interface CatalogJSON {
  snaptime?: string;
  features?: Record<string, boolean>;
  annotations?: Record<string, AnnotationContent>;
  rights?: RightsJSON;
}

export interface SchemaJSON {
  schema_name: string;
  tables: Record<string, TableJSON>;
  rights: RightsJSON;
  annotations?: Record<string, AnnotationContent>;
  comment?: string | null | false;
  RID?: string;
}

export interface TypeJSON {
  typename: string;
  is_array?: boolean;
  is_domain?: boolean;
  base_type?: TypeJSON;
}
