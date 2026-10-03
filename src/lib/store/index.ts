import { createMemoryStore } from "@/lib/store/memory-store";
import {
  createSupabaseStore,
  isSupabaseConfigured,
} from "@/lib/store/supabase-store";
import type { GameStore } from "@/lib/store/game-store";

const globalRef = globalThis as typeof globalThis & {
  __imposterStore?: GameStore;
};

export function getGameStore(): GameStore {
  if (globalRef.__imposterStore) {
    return globalRef.__imposterStore;
  }
  const store = isSupabaseConfigured() ? createSupabaseStore() : createMemoryStore();
  globalRef.__imposterStore = store;
  return store;
}

export function getStorageMode(): "supabase" | "memory" {
  return isSupabaseConfigured() ? "supabase" : "memory";
}
