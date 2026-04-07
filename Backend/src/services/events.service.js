const events = []

export function addEvent(event) {
  events.push(event)
}

export function getEvents() {
  return events
}
