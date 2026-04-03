import '@testing-library/jest-dom'

// Node.js v25+ exposes a broken experimental localStorage via globalThis
// (missing setItem/getItem implementations without a valid --localstorage-file).
// Override both globalThis.localStorage and window.localStorage with a
// proper in-memory implementation so all tests have a working Web Storage API.
const createInMemoryStorage = (): Storage => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  }
}

const inMemoryStorage = createInMemoryStorage()
Object.defineProperty(globalThis, 'localStorage', {
  value: inMemoryStorage,
  writable: true,
  configurable: true,
})
Object.defineProperty(window, 'localStorage', {
  value: inMemoryStorage,
  writable: true,
  configurable: true,
})
