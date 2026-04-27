const events = []
const MAX_EVENTS = 500

export function addEvent(event) {
  events.push(event)

  // Evita crescimento indefinido em memória em processos longos.
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS)
  }
}

export function getEvents() {
  // Retorna uma cópia para não permitir mutação externa acidental.
  return [...events]
}
