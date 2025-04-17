/**
 * TODO I added this to replace the usage of Q.defer().
 * But doing so broke the flow-control of chaise. We should investigate this later so we can remove Q.
 */
export default class DeferredPromise<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
