// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

/**
 * This function is used by http. It resolves promises by calling this function
 * to make sure thirdparty scripts are loaded.
 * TODO this function is not needed anymore and should be removed.
 * @deprecated
 */
export function onload() {
  const defer = ConfigService.q.defer();

  // if (_scriptsLoaded) defer.resolve();
  // else _defers.push(defer);

  defer.resolve();
  return defer.promise;
}

const startTime = Date.now();
/**
 * @returns {integer} A value set to determine the elapsed time
 * since the ermrestJS has been available (milliseconds).
 */
export function getElapsedTime() {
  return Date.now() - startTime;
}
