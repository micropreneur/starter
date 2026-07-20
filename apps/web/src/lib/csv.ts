const FORMULA_PREFIX = /^\s*[=+\-@]/

/** Escape a value for CSV and prevent spreadsheet formula evaluation. */
export function csvCell(value: string) {
  const safeValue = FORMULA_PREFIX.test(value) ? `'${value}` : value
  return `"${safeValue.replaceAll('"', '""')}"`
}
