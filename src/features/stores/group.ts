import type { Store } from "./types";

export function groupStoresAlphabetically(stores: Store[]) {
  const groups = new Map<string, Store[]>();

  for (const store of stores) {
    const letter = store.name.trim().charAt(0).toLocaleUpperCase("sv-SE") || "#";
    const key = /[A-ZÅÄÖ]/i.test(letter) ? letter : "#";
    const current = groups.get(key) ?? [];
    current.push(store);
    groups.set(key, current);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "sv"));
}
