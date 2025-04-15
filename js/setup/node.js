// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';
/**
 * This function is used by http. It resolves promises by calling this function
 * to make sure thirdparty scripts are loaded.
 * TODO this function is not needed anymore and should be removed.
 * @deprecated
 */
export function onload() {
  return Promise.resolve();
  // const defer = new DeferredPromise();

  // if (_scriptsLoaded) defer.resolve();
  // else _defers.push(defer);

  // return defer.promise;
}

const startTime = Date.now();
/**
 * @returns {integer} A value set to determine the elapsed time
 * since the ermrestJS has been available (milliseconds).
 */
export function getElapsedTime() {
  return Date.now() - startTime;
}
