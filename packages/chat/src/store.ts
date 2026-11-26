//packages\chat\src\limits.ts
export type KVStore<T> = {
  get(key: string): Promise<T | undefined>
  set(key: string, value: T): Promise<void>
  del(key: string): Promise<void>
  entries(): Promise<[string, T][]>
}

export function memoryStore<T>(): KVStore<T> {
  const map = new Map<string, T>()
  return {
    get: async (k) => map.get(k),
    set: async (k, v) => void map.set(k, structuredClone(v)),
    del: async (k) => void map.delete(k),
    entries: async () => [...map.entries()].map(([k, v]) => [k, structuredClone(v)]),
  }
}
