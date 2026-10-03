import { createSeedWordPairs } from "@/features/word-packs/seed";
import type { GameStore } from "@/lib/store/game-store";
import type {
  Player,
  PlayerAssignment,
  Round,
  Room,
  Vote,
  WordPair,
} from "@/domain/types";

type MemoryState = {
  rooms: Map<string, Room>;
  roomsByCode: Map<string, string>;
  players: Map<string, Player>;
  playersBySession: Map<string, string>;
  rounds: Map<string, Round>;
  assignments: Map<string, PlayerAssignment>;
  votes: Map<string, Vote>;
  wordPairs: WordPair[];
};

const globalStore = globalThis as typeof globalThis & {
  __imposterMemory?: MemoryState;
  __imposterLocks?: Map<string, Promise<void>>;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function getState(): MemoryState {
  if (!globalStore.__imposterMemory) {
    globalStore.__imposterMemory = {
      rooms: new Map(),
      roomsByCode: new Map(),
      players: new Map(),
      playersBySession: new Map(),
      rounds: new Map(),
      assignments: new Map(),
      votes: new Map(),
      wordPairs: createSeedWordPairs(),
    };
  }
  return globalStore.__imposterMemory;
}

function getLocks(): Map<string, Promise<void>> {
  if (!globalStore.__imposterLocks) {
    globalStore.__imposterLocks = new Map();
  }
  return globalStore.__imposterLocks;
}

export function resetMemoryStore(): void {
  globalStore.__imposterMemory = {
    rooms: new Map(),
    roomsByCode: new Map(),
    players: new Map(),
    playersBySession: new Map(),
    rounds: new Map(),
    assignments: new Map(),
    votes: new Map(),
    wordPairs: createSeedWordPairs(),
  };
}

export function createMemoryStore(): GameStore {
  return {
    async runExclusive<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
      const locks = getLocks();
      const previous = locks.get(roomId) ?? Promise.resolve();
      let release: () => void = () => undefined;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      const chained = previous.then(() => current);
      locks.set(roomId, chained);
      await previous;
      try {
        return await fn();
      } finally {
        release();
        if (locks.get(roomId) === chained) {
          locks.delete(roomId);
        }
      }
    },

    async getRoomByCode(code) {
      const state = getState();
      const id = state.roomsByCode.get(code.toUpperCase());
      if (!id) {
        return null;
      }
      const room = state.rooms.get(id);
      return room ? clone(room) : null;
    },

    async getRoomById(id) {
      const room = getState().rooms.get(id);
      return room ? clone(room) : null;
    },

    async insertRoom(room) {
      const state = getState();
      state.rooms.set(room.id, clone(room));
      state.roomsByCode.set(room.code, room.id);
    },

    async updateRoom(room) {
      const state = getState();
      state.rooms.set(room.id, clone(room));
      state.roomsByCode.set(room.code, room.id);
    },

    async listPlayers(roomId) {
      return [...getState().players.values()]
        .filter((player) => player.roomId === roomId)
        .map(clone)
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    },

    async getPlayerById(id) {
      const player = getState().players.get(id);
      return player ? clone(player) : null;
    },

    async getPlayerBySession(token) {
      const state = getState();
      const id = state.playersBySession.get(token);
      if (!id) {
        return null;
      }
      const player = state.players.get(id);
      return player ? clone(player) : null;
    },

    async insertPlayer(player) {
      const state = getState();
      state.players.set(player.id, clone(player));
      state.playersBySession.set(player.sessionToken, player.id);
    },

    async updatePlayer(player) {
      const state = getState();
      const previous = state.players.get(player.id);
      if (previous) {
        state.playersBySession.delete(previous.sessionToken);
      }
      state.players.set(player.id, clone(player));
      state.playersBySession.set(player.sessionToken, player.id);
    },

    async insertRound(round) {
      getState().rounds.set(round.id, clone(round));
    },

    async updateRound(round) {
      getState().rounds.set(round.id, clone(round));
    },

    async getRoundById(id) {
      const round = getState().rounds.get(id);
      return round ? clone(round) : null;
    },

    async listRounds(roomId) {
      return [...getState().rounds.values()]
        .filter((round) => round.roomId === roomId)
        .map(clone)
        .sort((a, b) => a.roundNumber - b.roundNumber);
    },

    async insertAssignments(assignments) {
      const state = getState();
      for (const assignment of assignments) {
        state.assignments.set(assignment.id, clone(assignment));
      }
    },

    async listAssignments(roundId) {
      return [...getState().assignments.values()]
        .filter((assignment) => assignment.roundId === roundId)
        .map(clone);
    },

    async getAssignment(roundId, playerId) {
      const assignment = [...getState().assignments.values()].find(
        (item) => item.roundId === roundId && item.playerId === playerId,
      );
      return assignment ? clone(assignment) : null;
    },

    async deleteAssignments(roundId) {
      const state = getState();
      for (const [id, assignment] of state.assignments) {
        if (assignment.roundId === roundId) {
          state.assignments.delete(id);
        }
      }
    },

    async insertVote(vote) {
      getState().votes.set(vote.id, clone(vote));
    },

    async listVotes(roundId) {
      return [...getState().votes.values()]
        .filter((vote) => vote.roundId === roundId)
        .map(clone);
    },

    async getVote(roundId, voterPlayerId) {
      const vote = [...getState().votes.values()].find(
        (item) => item.roundId === roundId && item.voterPlayerId === voterPlayerId,
      );
      return vote ? clone(vote) : null;
    },

    async deleteVotes(roundId) {
      const state = getState();
      for (const [id, vote] of state.votes) {
        if (vote.roundId === roundId) {
          state.votes.delete(id);
        }
      }
    },

    async listWordPairs() {
      return clone(getState().wordPairs);
    },

    async getWordPair(id) {
      const pair = getState().wordPairs.find((item) => item.id === id);
      return pair ? clone(pair) : null;
    },
  };
}
