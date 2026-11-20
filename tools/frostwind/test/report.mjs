export const REPORT_ENABLED =
  /^(1|true|yes|on)$/i.test(process.env.FROSTWIND_TEST_REPORT || '');

export function report(...args) {
  if (REPORT_ENABLED) globalThis.console.log(...args);
}

// Import as `console` in measurement-heavy suites so assertions and their
// failure diagnostics stay untouched while successful runs remain concise.
export const reportConsole = Object.freeze({ log: report });
