/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ENV_IS_DEV_MODE } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

export enum LoggerLevels {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  LOG = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

class Logger {
  private _level = LoggerLevels.INFO;

  private isAllowed(level: LoggerLevels): boolean {
    return this._level <= level;
  }

  public enableAll() {
    this._level = LoggerLevels.TRACE;
  }

  public disableAll() {
    this._level = LoggerLevels.SILENT;
  }

  public setLevel(level: LoggerLevels) {
    this._level = level;
  }

  public trace(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.TRACE)) return;
    console.trace(...args);
  }

  public debug(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.DEBUG)) return;
    console.debug(...args);
  }

  public info(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.INFO)) return;
    console.info(...args);
  }

  public log(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.LOG)) return;
    console.log(...args);
  }

  public warn(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.WARN)) return;
    console.warn(...args);
  }

  public error(...args: any[]): void {
    if (!this.isAllowed(LoggerLevels.ERROR)) return;
    console.error(...args);
  }
}

const $log = new Logger();

$log.setLevel(ENV_IS_DEV_MODE ? LoggerLevels.TRACE : LoggerLevels.INFO);

export default $log;
