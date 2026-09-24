const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:[+-]\d{2}:\d{2})?$/

export function extractApiList(response, catalogName) {
  const body = response?.data ?? response

  if (body && typeof body === 'object' && body.success === false) {
    throw new Error(body.message || `No se pudo cargar ${catalogName}`)
  }

  const list = body && typeof body === 'object' && 'data' in body
    ? body.data
    : body

  if (!Array.isArray(list)) {
    throw new Error(`La respuesta de ${catalogName} no contiene un listado válido`)
  }

  return list
}

export function getActiveCampanaId(campanas) {
  const activeCampana = campanas.find(campana => campana.estadoActivo === true)
  const activeCampanaId = activeCampana?.id ?? activeCampana?.campana
  return activeCampanaId != null ? String(activeCampanaId) : ''
}

function toDateOnly(dateStr) {
  if (ISO_DATETIME_PATTERN.test(dateStr || '')) return dateStr.split('T')[0]
  return dateStr
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const raw = toDateOnly(dateStr)
  if (ISO_DATETIME_PATTERN.test(dateStr)) {
    const [datePart, timePart] = dateStr.split('T')
    const [, month, day] = datePart.split('-')
    return `${day}/${month}/${datePart.split('-')[0]} ${timePart.slice(0, 5)}`
  }
  if (!ISO_DATE_PATTERN.test(raw)) return ''
  const [year, month, day] = raw.split('-')
  return `${day}/${month}/${year}`
}

export function formatApiDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:00-05:00`
}

export function parseApiDate(dateStr) {
  if (ISO_DATETIME_PATTERN.test(dateStr || '')) {
    const [datePart, timePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
  }
  const raw = toDateOnly(dateStr)
  if (!ISO_DATE_PATTERN.test(raw || '')) return new Date()
  const [year, month, day] = raw.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isValidApiDate(dateStr) {
  if (!dateStr) return false
  if (ISO_DATETIME_PATTERN.test(dateStr)) {
    const [datePart, timePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    const parsed = new Date(year, month - 1, day, hours, minutes)
    return parsed.getFullYear() === year
      && parsed.getMonth() === month - 1
      && parsed.getDate() === day
      && parsed.getHours() === hours
      && parsed.getMinutes() === minutes
  }
  const raw = toDateOnly(dateStr)
  if (!ISO_DATE_PATTERN.test(raw)) return false
  const [year, month, day] = raw.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day
}

export function isDateBefore(candidate, reference) {
  if (!isValidApiDate(candidate) || !isValidApiDate(reference)) return false
  return toDateOnly(candidate) < toDateOnly(reference)
}

export function calcularMeses(inicio, fin) {
  const inicioDate = toDateOnly(inicio)
  const finDate = toDateOnly(fin)
  if (!isValidApiDate(inicioDate) || !isValidApiDate(finDate)) return ''
  const [startYear, startMonth, startDay] = inicioDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = finDate.split('-').map(Number)
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay))
  const endExclusive = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1))
  if (endExclusive <= start) return ''

  const addMonthsClamped = months => {
    const targetMonth = startMonth - 1 + months
    const targetYear = startYear + Math.floor(targetMonth / 12)
    const normalizedMonth = ((targetMonth % 12) + 12) % 12
    const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
    return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(startDay, lastDay)))
  }

  let completeMonths = (endExclusive.getUTCFullYear() - startYear) * 12
    + endExclusive.getUTCMonth() - (startMonth - 1)
  let anchor = addMonthsClamped(completeMonths)
  if (anchor > endExclusive) {
    completeMonths -= 1
    anchor = addMonthsClamped(completeMonths)
  }

  const remainingDays = (endExclusive - anchor) / (1000 * 60 * 60 * 24)
  return (completeMonths + remainingDays / 30.44).toFixed(2)
}
