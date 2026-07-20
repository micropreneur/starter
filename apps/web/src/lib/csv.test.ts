import { describe, expect, it } from 'vitest'

import { csvCell } from './csv'

describe('CSV cell encoding', () => {
  it('escapes quotes and neutralizes spreadsheet formulas', () => {
    expect(csvCell('A "quoted" value')).toBe('"A ""quoted"" value"')

    for (const dangerous of ['=1+1', '+SUM(A1:A2)', '-2+3', '@IMPORTXML()', '  =cmd()']) {
      expect(csvCell(dangerous)).toBe(`"'${dangerous}"`)
    }
  })
})
