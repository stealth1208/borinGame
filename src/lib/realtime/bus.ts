type RoomListener = (event: string) => void;

const globalRef = globalThis as typeof globalThis & {
  __imposterBus?: Map<string, Set<RoomListener>>;
};

function getBus(): Map<string, Set<RoomListener>> {
  if (!globalRef.__imposterBus) {
    globalRef.__imposterBus = new Map();
  }
  return globalRef.__imposterBus;
}

export function emitRoomEvent(roomCode: string, event: string): void {
  const listeners = getBus().get(roomCode.toUpperCase());
  if (!listeners) {
    return;
  }
  for (const listener of listeners) {
    listener(event);
  }
}

export function subscribeRoom(roomCode: string, listener: RoomListener): () => void {
  const bus = getBus();
  const key = roomCode.toUpperCase();
  const set = bus.get(key) ?? new Set<RoomListener>();
  set.add(listener);
  bus.set(key, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      bus.delete(key);
    }
  };
}
