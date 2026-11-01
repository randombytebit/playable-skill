// Minimal pub/sub. Runs in both Node and the browser — no DOM, no deps.
export function createEmitter() {
  const handlers = new Map()
  return {
    on(event, fn) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event).add(fn)
      return () => handlers.get(event).delete(fn)
    },
    emit(event, ...args) {
      for (const fn of handlers.get(event) ?? []) {
        try {
          fn(...args)
        } catch (err) {
          // One bad handler must not stop the tick or drop a peer event.
          console.error(`[playable] handler for "${event}" threw:`, err)
        }
      }
    },
  }
}
