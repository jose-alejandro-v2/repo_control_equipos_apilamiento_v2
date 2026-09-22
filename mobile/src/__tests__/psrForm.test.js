import {
  calcularMeses,
  extractApiList,
  formatApiDate,
  formatDisplayDate,
  getActiveCampanaId,
  isValidApiDate,
} from '../utils/psrForm'

describe('utilidades del formulario PSR', () => {
  it('extrae listados desde ApiResponse', () => {
    const rows = [{ id: 1 }]
    expect(extractApiList({ data: { success: true, data: rows } }, 'sedes')).toEqual(rows)
  })

  it('rechaza respuestas sin listado', () => {
    expect(() => extractApiList({ data: { success: true, data: {} } }, 'sedes'))
      .toThrow('La respuesta de sedes no contiene un listado válido')
  })

  it('selecciona la campaña marcada como activa', () => {
    const campanas = [
      { id: 1, estadoActivo: false },
      { id: 2, estadoActivo: true },
    ]
    expect(getActiveCampanaId(campanas)).toBe('2')
  })

  it('convierte fechas entre API y presentación dd/mm/yyyy hh:mm', () => {
    expect(formatDisplayDate('2026-07-24')).toBe('24/07/2026')
    expect(formatDisplayDate('2026-07-24T14:30')).toBe('24/07/2026 14:30')
    expect(formatDisplayDate('2026-07-24T14:30:00-05:00')).toBe('24/07/2026 14:30')
    expect(formatApiDate(new Date(2026, 6, 24, 0, 0))).toBe('2026-07-24T00:00:00-05:00')
  })

  it('valida fechas reales y calcula meses', () => {
    expect(isValidApiDate('2026-02-29')).toBe(false)
    expect(isValidApiDate('2026-07-24')).toBe(true)
    expect(calcularMeses('2026-01-01', '2026-01-31')).toBe('1.00')
    expect(calcularMeses('2026-08-01', '2026-10-31')).toBe('3.00')
    expect(calcularMeses('2026-02-01', '2026-01-01')).toBe('')
  })
})
