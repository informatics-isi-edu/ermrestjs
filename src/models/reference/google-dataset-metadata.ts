// models
import { Reference, Tuple } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// legacy
import validateJSONLD from '@isrd-isi-edu/ermrestjs/js/json_ld_validator';
import { _renderTemplate } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { Table } from '@isrd-isi-edu/ermrestjs/js/core';

/**
 * Constructs the Google Dataset metadata for the given tuple.
 * The given metadata must be valid and have the appropriate variables.
 */
export class GoogleDatasetMetadata {
  private _reference: Reference;
  private _table: any;
  private _gdsMetadataAnnotation: any;

  constructor(reference: Reference, gdsMetadataAnnotation: any) {
    this._reference = reference;
    this._table = reference.table;
    this._gdsMetadataAnnotation = gdsMetadataAnnotation;
  }

  /**
   * Given the templateVariables variables, will generate the metadata.
   * @param tuple - the tuple object that this metadata is based on
   * @param templateVariables - if it's not an object, we will use the tuple templateVariables
   * @return if the returned template for required attributes are empty or invalid, it will return null.
   */
  compute(tuple: Tuple, templateVariables?: any): any | null {
    const table = this._table;
    const metadataAnnotation = this._gdsMetadataAnnotation;

    if (!templateVariables) {
      templateVariables = tuple.templateVariables.values;
    }

    const keyValues = Object.assign({ $self: tuple.selfTemplateVariable }, templateVariables);
    const metadata: any = {};
    this.setMetadataFromTemplate(metadata, metadataAnnotation.dataset, metadataAnnotation.template_engine, keyValues, table);

    const result = validateJSONLD(metadata);

    if (!result.isValid) {
      console.error('JSON-LD not appended to <head> as validation errors found.');
      return null;
    }

    return result.modifiedJsonLd;
  }

  private setMetadataFromTemplate(metadata: any, metadataAnnotation: any, templateEngine: any, templateVariables: any, table: Table): void {
    Object.keys(metadataAnnotation).forEach((key) => {
      if (typeof metadataAnnotation[key] === 'object' && metadataAnnotation[key] != null && !Array.isArray(metadataAnnotation[key])) {
        metadata[key] = {};
        this.setMetadataFromTemplate(metadata[key], metadataAnnotation[key], templateEngine, templateVariables, table);
      } else if (Array.isArray(metadataAnnotation[key])) {
        metadata[key] = [];
        metadataAnnotation[key].forEach((element: any) => {
          metadata[key].push(
            _renderTemplate(element, templateVariables, table.schema.catalog, { templateEngine: templateEngine, allowObject: true }),
          );
        });
      } else {
        metadata[key] = _renderTemplate(metadataAnnotation[key], templateVariables, table.schema.catalog, {
          templateEngine: templateEngine,
          allowObject: true,
        });
      }
    });
  }
}
