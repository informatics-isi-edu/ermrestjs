import type { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';
import type { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import type { FacetObjectGroupWrapper } from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import type { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';

import { _processSourceObjectComment } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

export class FacetGroup {
  /**
   * The reference that this facet blongs to
   */
  public reference: Reference;
  /**
   * the index of this group in the reference.facetColumnsStructure array
   */
  public structureIndex: number;
  /**
   * the facet object group wrapper from the source object
   */
  public facetObjectGroupWrapper: FacetObjectGroupWrapper;
  /**
   * the indices of the children facet columns in the facetColumns array
   */
  public children: Array<number>;

  public displayname: DisplayName;
  public comment: CommentType;

  private _isOpen?: boolean;

  constructor(reference: Reference, index: number, facetObjectGroupWrapper: FacetObjectGroupWrapper, children: Array<number>) {
    this.reference = reference;
    this.structureIndex = index;
    this.facetObjectGroupWrapper = facetObjectGroupWrapper;
    this.children = children;
    this.displayname = facetObjectGroupWrapper.displayname;
    this.comment = _processSourceObjectComment(facetObjectGroupWrapper.sourceObject);
  }

  /**
   * whether the group should be opened by default or not
   */
  get isOpen(): boolean {
    if (this._isOpen === undefined) {
      // by default all groups are opened
      let isOpen = true;

      // if the source object has open property, use it
      const sourceOpen = this.facetObjectGroupWrapper.sourceObject.open;
      if (typeof sourceOpen === 'boolean') {
        isOpen = sourceOpen;
      }

      // if any of the childrens have filters, the group should be opened
      for (const child of this.facetObjectGroupWrapper.children) {
        const facet = this.reference.facetColumns.find((fc) => fc.sourceObjectWrapper.name === child.name);
        if (facet && facet.filters.length > 0) {
          isOpen = true;
          break;
        }
      }

      this._isOpen = isOpen;
    }
    return this._isOpen;
  }

  /**
   * creates a copy of this facet group for the new reference
   * @param newReference the reference that the cloned facet group will belong to
   * @returns a cloned facet group
   */
  copy(newReference?: Reference): FacetGroup {
    const newFg = new FacetGroup(
      newReference ? newReference : this.reference,
      this.structureIndex,
      this.facetObjectGroupWrapper,
      this.children.slice(),
    );
    return newFg;
  }
}
