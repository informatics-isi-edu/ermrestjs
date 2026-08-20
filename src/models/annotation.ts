// models
import type { AnnotationContent } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

/**
 * Container of Annotation objects, keyed by annotation URI.
 */
export class Annotations {
  _annotations: Record<string, Annotation> = {};

  _all?: Annotation[];

  _push(annotation: Annotation): void {
    this._annotations[annotation._uri] = annotation;
  }

  /**
   * list of all annotations
   */
  all(): Annotation[] {
    if (!this._all) {
      this._all = [];
      for (const key in this._annotations) {
        this._all.push(this._annotations[key]);
      }
    }
    return this._all;
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * number of annotations
   */
  length(): number {
    return Object.keys(this._annotations).length;
  }

  /**
   * array of annotation names
   */
  names(): string[] {
    return Object.keys(this._annotations);
  }

  /**
   * get annotation by URI
   * @param uri uri of annotation
   * @throws {NotFoundError} annotation not found
   */
  get(uri: string): Annotation {
    if (!(uri in this._annotations)) {
      throw new NotFoundError('', 'Annotation ' + uri + ' not found.');
    }

    return this._annotations[uri];
  }

  /**
   * whether or not annotation exists
   * @param uri uri of annotation
   */
  contains(uri: string): boolean {
    return uri in this._annotations;
  }
}

/**
 * A single annotation attached to a model element.
 */
export class Annotation {
  /**
   * One of schema,table,column,key,foreignkeyref
   */
  subject: string;

  _uri: string;

  /**
   * json content
   */
  content: AnnotationContent;

  /**
   * @param subject subject of the annotation: schema,table,column,key,foreignkeyref.
   * @param uri uri id of the annotation.
   * @param jsonAnnotation json of annotation.
   */
  constructor(subject: string, uri: string, jsonAnnotation: AnnotationContent) {
    this.subject = subject;
    this._uri = uri;
    this.content = jsonAnnotation;
  }

  contains(name: string): boolean {
    return name in this.content;
  }

  get(name: string): AnnotationContent {
    return this.content[name];
  }
}
