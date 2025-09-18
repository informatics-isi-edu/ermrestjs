import type { Reference, Tuple, VisibleColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference';

import { _renderTemplate } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _processWaitForList } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

export interface CitationObject {
  author?: string | null;
  title?: string | null;
  journal?: string | null;
  year?: string | null;
  url?: string | null;
  id?: string | null;
}

export interface CitationAnnotation {
  journal_pattern?: string;
  year_pattern?: string;
  url_pattern?: string;
  author_pattern?: string;
  title_pattern?: string;
  id_pattern?: string;
  template_engine?: string;
  wait_for?: any;
}

/**
 * Constructs a citation for the given tuple.
 * The given citationAnnotation must be valid and have the appropriate variables.
 */
export class Citation {
  private _table: any;
  private _citationAnnotation: CitationAnnotation;

  public waitFor: VisibleColumn[];
  public hasWaitFor: boolean;
  public hasWaitForAggregate: boolean;

  constructor(reference: Reference, citationAnnotation: CitationAnnotation) {
    this._table = reference.table;

    /**
     * citation specific properties include:
     *   - journal*
     *   - author
     *   - title
     *   - year*
     *   - url*
     *   - id
     * other properties:
     *   - template_engine
     *   - wait_for
     */
    this._citationAnnotation = citationAnnotation;

    const waitForRes = _processWaitForList(citationAnnotation.wait_for, reference, reference.table, null, null, 'citation');

    this.waitFor = waitForRes.waitForList;
    this.hasWaitFor = waitForRes.hasWaitFor;
    this.hasWaitForAggregate = waitForRes.hasWaitForAggregate;
  }

  /**
   * Given the templateVariables variables, will generate the citaiton.
   * @param tuple - the tuple object that this citaiton is based on
   * @param templateVariables - if it's not an obect, we will use the tuple templateVariables
   * @return if the returned template for required attributes are empty, it will return null.
   */
  compute(tuple: Tuple, templateVariables?: any): CitationObject | null {
    const table = this._table;
    const citationAnno = this._citationAnnotation;

    // make sure required parameters are present
    if (!citationAnno.journal_pattern || !citationAnno.year_pattern || !citationAnno.url_pattern) {
      return null;
    }

    if (!templateVariables) {
      templateVariables = tuple.templateVariables.values;
    }

    const keyValues = Object.assign({ $self: tuple.selfTemplateVariable }, templateVariables);

    const citation: CitationObject = {};
    // author, title, id set to null if not defined
    (['author', 'title', 'journal', 'year', 'url', 'id'] as const).forEach((key) => {
      citation[key] = _renderTemplate(citationAnno[`${key}_pattern`]!, keyValues, table.schema.catalog, {
        templateEngine: citationAnno.template_engine,
      });
    });

    // if after processing the templates, any of the required fields are null, template is invalid
    if (!citation.journal || !citation.year || !citation.url) {
      return null;
    }

    return citation;
  }
}
