import fs from 'node:fs';
import path from 'node:path';

// Escape a value used as the body of a workflow command.
const escapeData = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

// Escape a value used as a workflow command property (title, file, ...).
const escapeProp = (s) => escapeData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');

// Escape a value for a markdown table cell. Backslashes must be escaped before
// pipes, otherwise a `\` in the input would consume the escape we add.
const escapeCell = (s) => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

// Pull the first `file:line:col` out of a stack trace and make it relative to
// the workspace, so the annotation can attach to the right line. Returns null
// when nothing usable is found.
const locationFromStack = (stack) => {
  if (!stack) return null;
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  for (const line of String(stack).split('\n')) {
    const m = line.match(/(\/[^\s():]+):(\d+):(\d+)/);
    if (m && !m[1].includes('node_modules')) {
      return { file: path.relative(workspace, m[1]), line: m[2], col: m[3] };
    }
  }
  return null;
};

/*
 * Jasmine reporter that surfaces failures on the GitHub Actions run, similar to
 * how Playwright's `github` reporter behaves:
 *   - emits `::error::` workflow commands so failures show as annotations
 *   - appends a markdown table to $GITHUB_STEP_SUMMARY for the job summary page
 *
 * It is a no-op outside GitHub Actions, so local `make test` output stays clean.
 */
export default class GithubReporter {
  constructor() {
    this.enabled = !!process.env.GITHUB_ACTIONS;
    this.failures = [];
  }

  #record(specName, failedExpectations = []) {
    if (!this.enabled) return;
    for (const err of failedExpectations) {
      const message = err.message || 'Failed expectation';
      const loc = locationFromStack(err.stack);

      // Annotation (shows at the top of the run and inline on the file).
      const props = [`title=${escapeProp(specName)}`];
      if (loc) {
        props.push(`file=${escapeProp(loc.file)}`, `line=${loc.line}`, `col=${loc.col}`);
      }
      console.log(`::error ${props.join(',')}::${escapeData(err.stack || message)}`);

      this.failures.push({ spec: specName, message });
    }
  }

  specDone(result) {
    if (result.status === 'failed') {
      this.#record(result.fullName || result.description, result.failedExpectations);
    }
  }

  // Captures beforeAll/afterAll failures, which Jasmine reports at the suite level.
  suiteDone(result) {
    if (result.failedExpectations?.length > 0) {
      this.#record(result.fullName || result.description, result.failedExpectations);
    }
  }

  jasmineDone() {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    let lines;
    if (this.failures.length === 0) {
      lines = ['## ✅ ERMrestJS unit tests passed', ''];
    } else {
      lines = [`## ❌ ERMrestJS unit tests: ${this.failures.length} failure(s)`, '', '| Spec | Message |', '| --- | --- |'];
      for (const f of this.failures) {
        // Collapse to a single line so the table stays intact.
        const msg = String(f.message).split('\n')[0];
        lines.push(`| ${escapeCell(f.spec)} | ${escapeCell(msg)} |`);
      }
      lines.push('');
    }

    try {
      fs.appendFileSync(summaryFile, `${lines.join('\n')}\n`);
    } catch (e) {
      console.log(`Unable to write GitHub step summary: ${e.message}`);
    }
  }
};
