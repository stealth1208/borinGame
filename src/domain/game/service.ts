import { customAlphabet } from "nanoid";
import { randomBytes, randomUUID } from "node:crypto";
import { DomainError } from "@/domain/errors";
import { assignRoles, shuffleInPlace } from "@/domain/round/assign-roles";
import { assertValidRoleConfig, maxSpecialRoles } from "@/domain/round/role-config";
import { assertTransition } from "@/domain/room/transitions";
import {
  DEFAULT_IMPOSTOR_COUNT,
  MAX_PLAYERS,
  ROOM_TTL_MS,
  type GameMode,
  type Player,
  type PlayerAssignment,
  type PlayerRole,
  type Room,
  type RoomSettings,
  type Round,
  type VoteResult,
} from "@/domain/types";
import { calculateVoteResult } from "@/domain/voting/calculate-result";
import { listCategories } from "@/features/word-packs/seed";
import type { GameStore } from "@/lib/store/game-store";
import { emitRoomEvent } from "@/lib/realtime/bus";

const roomCodeAlphabet = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export type PublicPlayer = {
  id: string;
  nickname: string;
  isHost: boolean;
  status: Player["status"];
};

export type PublicRoomView = {
  code: string;
  status: Room["status"];
  mode: GameMode;
  settings: RoomSettings;
  playerCount: number;
  players: PublicPlayer[];
  currentRoundNumber: number;
  expiresAt: string;
  speakingOrder: PublicPlayer[];
  voteProgress: { voted: number; total: number } | null;
  result: PublicResultView | null;
  hostDisconnected: boolean;
  storageMode: "memory" | "supabase";
  category: string;
};

export type PublicResultView = {
  isTie: boolean;
  tallies: VoteResult["tallies"];
  selectedSuspect: PublicPlayer | null;
  revealedRoles: Array<{
    playerId: string;
    nickname: string;
    role: PlayerRole;
  }>;
  civilianWord: string;
  undercoverWord: string | null;
  correctVoters: PublicPlayer[];
  scores: Array<{ playerId: string; nickname: string; score: number }>;
};

export type PrivateMeView = {
  playerId: string;
  nickname: string;
  isHost: boolean;
  status: Player["status"];
  assignment: {
    role: PlayerRole;
    word: string | null;
    message: string;
    teammates?: string[];
  } | null;
  hasVoted: boolean;
  votedForPlayerId: string | null;
};

export type CreateRoomInput = {
  nickname: string;
  mode: GameMode;
  impostorCount: number;
  category: string;
  roundCount: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return randomUUID();
}

function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

function normalizeNickname(nickname: string): string {
  return nickname.trim().replace(/\s+/g, " ");
}

/**
 * Generate a unique anonymous nickname for a room
 * @param existingNicknames Array of existing nicknames to avoid collisions
 * @returns A unique anonymous nickname like "Anonymous", "Anonymous2", etc.
 */
function generateAnonymousNickname(existingNicknames: string[]): string {
  const baseNickname = "Anonymous";
  const normalizedExisting = existingNicknames.map((n) => n.toLowerCase());
  
  // Try base nickname first
  if (!normalizedExisting.includes(baseNickname.toLowerCase())) {
    return baseNickname;
  }
  
  // Try with numbers
  let counter = 2;
  while (counter < 1000) {
    const candidate = `${baseNickname}${counter}`;
    if (!normalizedExisting.includes(candidate.toLowerCase())) {
      return candidate;
    }
    counter += 1;
  }
  
  // Fallback with timestamp (should never reach here in practice)
  return `${baseNickname}${Date.now() % 10000}`;
}

function assertRoomAlive(room: Room): void {
  if (room.status === "CLOSED") {
    throw new DomainError("ROOM_CLOSED", "Room is closed", 410);
  }
  if (Date.now() > Date.parse(room.expiresAt)) {
    throw new DomainError("ROOM_EXPIRED", "Room expired", 410);
  }
}

function publicPlayers(players: Player[]): PublicPlayer[] {
  return players
    .filter((player) => player.status === "ACTIVE")
    .map((player) => ({
      id: player.id,
      nickname: player.nickname,
      isHost: player.isHost,
      status: player.status,
    }));
}

function assignmentMessage(role: PlayerRole): string {
  if (role === "IMPOSTOR") {
    return "Bạn không biết từ bí mật. Nghe kỹ và hòa vào.";
  }
  if (role === "UNDERCOVER") {
    return "Từ của bạn gần giống từ của dân thường. Đừng để lộ.";
  }
  return "Mô tả từ này, đừng nói đúng nguyên văn.";
}

async function requireRoom(store: GameStore, code: string): Promise<Room> {
  const room = await store.getRoomByCode(code);
  if (!room) {
    throw new DomainError("ROOM_NOT_FOUND", "Room not found", 404);
  }
  assertRoomAlive(room);
  return room;
}

async function requireSessionPlayer(
  store: GameStore,
  sessionToken: string | undefined,
  room: Room,
): Promise<Player> {
  if (!sessionToken) {
    throw new DomainError("NO_SESSION", "Missing session", 401);
  }
  const player = await store.getPlayerBySession(sessionToken);
  if (!player || player.roomId !== room.id) {
    throw new DomainError("NO_SESSION", "Session does not match this room", 401);
  }
  if (player.status === "REMOVED") {
    throw new DomainError("PLAYER_REMOVED", "Player was removed", 403);
  }
  return player;
}

function requireHost(player: Player): void {
  if (!player.isHost) {
    throw new DomainError("NOT_HOST", "Host only", 403);
  }
}

async function selectWordPair(
  store: GameStore,
  room: Room,
  category: string,
): Promise<{ id: string; civilianWord: string; undercoverWord: string }> {
  const pairs = (await store.listWordPairs()).filter((pair) => pair.active);
  const pool =
    category === "RANDOM"
      ? pairs
      : pairs.filter((pair) => pair.category === category);
  const usable = pool.length > 0 ? pool : pairs;
  if (usable.length === 0) {
    throw new DomainError("INVALID_INPUT", "No word pairs available");
  }

  const previousRounds = await store.listRounds(room.id);
  const used = new Set(previousRounds.map((round) => round.wordPairId));
  const unused = usable.filter((pair) => !used.has(pair.id));
  const finalPool = unused.length > 0 ? unused : usable;
  const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
  if (!picked) {
    throw new DomainError("INVALID_INPUT", "No word pairs available");
  }
  return picked;
}

async function startNewRound(store: GameStore, room: Room): Promise<Room> {
  const players = (await store.listPlayers(room.id)).filter(
    (player) => player.status === "ACTIVE",
  );
  assertValidRoleConfig({
    playerCount: players.length,
    impostorCount: room.settings.impostorCount,
    mode: room.settings.mode,
  });

  const wordPair = await selectWordPair(store, room, room.settings.category);
  const plans = assignRoles({
    playerIds: players.map((player) => player.id),
    mode: room.settings.mode,
    impostorCount: room.settings.impostorCount,
    civilianWord: wordPair.civilianWord,
    undercoverWord: wordPair.undercoverWord,
    category: room.settings.category,
  });
  const speakingOrder = shuffleInPlace(players.map((player) => player.id));
  const roundNumber = room.currentRoundNumber + 1;
  const round: Round = {
    id: newId(),
    roomId: room.id,
    roundNumber,
    status: "ROLE_REVEAL",
    wordPairId: wordPair.id,
    speakingOrder,
    createdAt: nowIso(),
    tieBreak: "NONE",
  };
  const assignments: PlayerAssignment[] = plans.map((plan) => ({
    id: newId(),
    roundId: round.id,
    playerId: plan.playerId,
    role: plan.role,
    word: plan.word,
  }));

  const nextRoom: Room = {
    ...room,
    status: "ROLE_REVEAL",
    currentRoundNumber: roundNumber,
    currentRoundId: round.id,
  };

  await store.insertRound(round);
  await store.insertAssignments(assignments);
  await store.updateRoom(nextRoom);
  return nextRoom;
}

async function buildResultView(
  store: GameStore,
  room: Room,
  players: Player[],
): Promise<PublicResultView | null> {
  if (room.status !== "RESULT" || !room.currentRoundId) {
    return null;
  }
  const round = await store.getRoundById(room.currentRoundId);
  if (!round) {
    return null;
  }
  const [assignments, votes, wordPair] = await Promise.all([
    store.listAssignments(round.id),
    store.listVotes(round.id),
    store.getWordPair(round.wordPairId),
  ]);
  const impostorIds = assignments
    .filter((item) => item.role === "IMPOSTOR" || item.role === "UNDERCOVER")
    .map((item) => item.playerId);
  const result = calculateVoteResult({
    players,
    votes,
    impostorPlayerIds: impostorIds,
  });
  const active = publicPlayers(players);
  const byId = new Map(players.map((player) => [player.id, player]));

  return {
    isTie: result.isTie,
    tallies: result.tallies,
    selectedSuspect: active.find((player) => player.id === result.selectedSuspectId) ?? null,
    revealedRoles: assignments.map((assignment) => ({
      playerId: assignment.playerId,
      nickname: byId.get(assignment.playerId)?.nickname ?? "?",
      role: assignment.role,
    })),
    civilianWord: wordPair?.civilianWord ?? "",
    undercoverWord:
      room.settings.mode === "UNDERCOVER" ? (wordPair?.undercoverWord ?? null) : null,
    correctVoters: result.correctVoterIds
      .map((id) => active.find((player) => player.id === id))
      .filter((player): player is PublicPlayer => Boolean(player)),
    scores: players
      .filter((player) => player.status === "ACTIVE")
      .map((player) => ({
        playerId: player.id,
        nickname: player.nickname,
        score: player.score,
      })),
  };
}

export function createGameService(store: GameStore, storageMode: "memory" | "supabase" = "memory") {
  async function toPublicRoom(room: Room): Promise<PublicRoomView> {
    const players = await store.listPlayers(room.id);
    const active = players.filter((player) => player.status === "ACTIVE");
    let speakingOrder: PublicPlayer[] = [];
    let voteProgress: PublicRoomView["voteProgress"] = null;
    if (room.currentRoundId) {
      const round = await store.getRoundById(room.currentRoundId);
      if (round) {
        const byId = new Map(active.map((player) => [player.id, player]));
        speakingOrder = round.speakingOrder
          .map((id) => byId.get(id))
          .filter((player): player is Player => Boolean(player))
          .map((player) => ({
            id: player.id,
            nickname: player.nickname,
            isHost: player.isHost,
            status: player.status,
          }));
        if (room.status === "VOTING" || room.status === "RESULT") {
          const votes = await store.listVotes(round.id);
          voteProgress = { voted: votes.length, total: active.length };
        }
      }
    }

    const host = players.find((player) => player.isHost);
    const hostDisconnected = host
      ? Date.now() - Date.parse(room.hostLastSeenAt) > 120_000
      : false;

    return {
      code: room.code,
      status: room.status,
      mode: room.settings.mode,
      settings: room.settings,
      playerCount: active.length,
      players: publicPlayers(players),
      currentRoundNumber: room.currentRoundNumber,
      expiresAt: room.expiresAt,
      speakingOrder,
      voteProgress,
      result: await buildResultView(store, room, players),
      hostDisconnected,
      storageMode,
      category: room.settings.category,
    };
  }

  return {
    maxSpecialRoles,
    listCategories: async () => listCategories(await store.listWordPairs()),

    async createRoom(input: CreateRoomInput) {
      const trimmed = normalizeNickname(input.nickname);
      const nickname = trimmed.length >= 1 && trimmed.length <= 16 
        ? trimmed 
        : "Anonymous";
      
      if (input.impostorCount < 1 || input.impostorCount > 3) {
        throw new DomainError("INVALID_ROLE_CONFIG", "Invalid impostor count");
      }
      const hostId = newId();
      const sessionToken = newSessionToken();
      const createdAt = nowIso();
      const room: Room = {
        id: newId(),
        code: roomCodeAlphabet(),
        hostPlayerId: hostId,
        status: "LOBBY",
        settings: {
          mode: input.mode,
          impostorCount: input.impostorCount,
          category: input.category,
          roundCount: input.roundCount,
          maxPlayers: MAX_PLAYERS,
          impostorsKnowEachOther: false,
        },
        currentRoundNumber: 0,
        currentRoundId: null,
        createdAt,
        expiresAt: new Date(Date.now() + ROOM_TTL_MS).toISOString(),
        hostLastSeenAt: createdAt,
      };
      const host: Player = {
        id: hostId,
        roomId: room.id,
        nickname,
        sessionToken,
        isHost: true,
        status: "ACTIVE",
        joinedAt: createdAt,
        score: 0,
      };
      await store.insertRoom(room);
      await store.insertPlayer(host);
      emitRoomEvent(room.code, "room.updated");
      return { room: await toPublicRoom(room), sessionToken, playerId: hostId };
    },

    async joinRoom(code: string, nickname: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      return store.runExclusive(room.id, async () => {
        const fresh = await requireRoom(store, code);
        if (sessionToken) {
          const existing = await store.getPlayerBySession(sessionToken);
          if (existing && existing.roomId === fresh.id) {
            if (existing.status === "REMOVED") {
              throw new DomainError("PLAYER_REMOVED", "Removed from room", 403);
            }
            return {
              room: await toPublicRoom(fresh),
              sessionToken: existing.sessionToken,
              playerId: existing.id,
              reconnected: true,
            };
          }
        }
        if (fresh.status !== "LOBBY") {
          throw new DomainError("ROOM_STARTED", "Game already started", 409);
        }
        
        const players = await store.listPlayers(fresh.id);
        const active = players.filter((player) => player.status === "ACTIVE");
        if (active.length >= fresh.settings.maxPlayers) {
          throw new DomainError("ROOM_FULL", "Room full", 409);
        }
        
        // Handle nickname: if empty or too short, generate anonymous nickname
        const trimmed = normalizeNickname(nickname);
        const finalNickname = trimmed.length >= 1 && trimmed.length <= 16
          ? trimmed
          : generateAnonymousNickname(active.map((p) => p.nickname));
        
        // Check for duplicates (case-insensitive)
        const taken = active.some(
          (player) => player.nickname.toLocaleLowerCase("vi") === finalNickname.toLocaleLowerCase("vi"),
        );
        if (taken) {
          throw new DomainError("DUPLICATE_NICKNAME", "Duplicate nickname", 409);
        }
        
        const token = newSessionToken();
        const player: Player = {
          id: newId(),
          roomId: fresh.id,
          nickname: finalNickname,
          sessionToken: token,
          isHost: false,
          status: "ACTIVE",
          joinedAt: nowIso(),
          score: 0,
        };
        await store.insertPlayer(player);
        emitRoomEvent(fresh.code, "room.updated");
        return {
          room: await toPublicRoom(fresh),
          sessionToken: token,
          playerId: player.id,
          reconnected: false,
        };
      });
    },

    async getPublicRoom(code: string) {
      const room = await requireRoom(store, code);
      return toPublicRoom(room);
    },

    async getMe(code: string, sessionToken?: string): Promise<PrivateMeView> {
      const room = await requireRoom(store, code);
      const player = await requireSessionPlayer(store, sessionToken, room);
      let assignment: PrivateMeView["assignment"] = null;
      if (room.currentRoundId && room.status !== "LOBBY") {
        const own = await store.getAssignment(room.currentRoundId, player.id);
        if (own) {
          let teammates: string[] | undefined;
          
          // If impostorsKnowEachOther is enabled and player is a special role
          if (
            room.settings.impostorsKnowEachOther &&
            (own.role === "IMPOSTOR" || own.role === "UNDERCOVER")
          ) {
            // Get all assignments for this round
            const allAssignments = await store.listAssignments(room.currentRoundId);
            const players = await store.listPlayers(room.id);
            const playerMap = new Map(players.map((p) => [p.id, p]));
            
            // Find other special roles (excluding self)
            teammates = allAssignments
              .filter((a) => 
                a.playerId !== player.id &&
                (a.role === "IMPOSTOR" || a.role === "UNDERCOVER")
              )
              .map((a) => playerMap.get(a.playerId)?.nickname)
              .filter((n): n is string => Boolean(n));
          }
          
          assignment = {
            role: own.role,
            word: own.word,
            message: assignmentMessage(own.role),
            teammates,
          };
        }
      }
      let hasVoted = false;
      let votedForPlayerId: string | null = null;
      if (room.currentRoundId && (room.status === "VOTING" || room.status === "RESULT")) {
        const vote = await store.getVote(room.currentRoundId, player.id);
        if (vote) {
          hasVoted = true;
          votedForPlayerId = vote.targetPlayerId;
        }
      }
      return {
        playerId: player.id,
        nickname: player.nickname,
        isHost: player.isHost,
        status: player.status,
        assignment,
        hasVoted,
        votedForPlayerId,
      };
    },

    async removePlayer(code: string, targetPlayerId: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      if (room.status !== "LOBBY") {
        throw new DomainError("INVALID_TRANSITION", "Can only remove players in lobby");
      }
      if (targetPlayerId === actor.id) {
        throw new DomainError("INVALID_INPUT", "Host cannot remove themselves");
      }
      const target = await store.getPlayerById(targetPlayerId);
      if (!target || target.roomId !== room.id) {
        throw new DomainError("PLAYER_NOT_FOUND", "Player not found", 404);
      }
      await store.updatePlayer({ ...target, status: "REMOVED" });
      emitRoomEvent(room.code, "room.updated");
      return toPublicRoom(room);
    },

    async startRound(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      return store.runExclusive(room.id, async () => {
        const fresh = await requireRoom(store, code);
        if (fresh.status !== "LOBBY" && fresh.status !== "RESULT") {
          throw new DomainError("INVALID_TRANSITION", "Can only start from lobby or result");
        }
        if (fresh.status === "RESULT") {
          assertTransition("RESULT", "ROLE_REVEAL");
        } else {
          assertTransition("LOBBY", "ASSIGNING");
          assertTransition("ASSIGNING", "ROLE_REVEAL");
        }
        const next = await startNewRound(store, fresh);
        emitRoomEvent(fresh.code, "room.updated");
        return toPublicRoom(next);
      });
    },

    async startDiscussion(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      assertTransition(room.status, "DISCUSSION");
      const next = { ...room, status: "DISCUSSION" as const };
      if (room.currentRoundId) {
        const round = await store.getRoundById(room.currentRoundId);
        if (round) {
          await store.updateRound({ ...round, status: "DISCUSSION" });
        }
      }
      await store.updateRoom(next);
      emitRoomEvent(room.code, "room.updated");
      return toPublicRoom(next);
    },

    async startVoting(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      assertTransition(room.status, "VOTING");
      const next = { ...room, status: "VOTING" as const };
      if (room.currentRoundId) {
        const round = await store.getRoundById(room.currentRoundId);
        if (round) {
          await store.updateRound({ ...round, status: "VOTING", tieBreak: "NONE" });
        }
      }
      await store.updateRoom(next);
      emitRoomEvent(room.code, "room.updated");
      return toPublicRoom(next);
    },

    async castVote(code: string, targetPlayerId: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      if (room.status !== "VOTING" || !room.currentRoundId) {
        throw new DomainError("NOT_VOTING", "Not in voting phase");
      }
      if (targetPlayerId === actor.id) {
        throw new DomainError("CANNOT_VOTE_SELF", "Cannot vote for self");
      }
      const target = await store.getPlayerById(targetPlayerId);
      if (!target || target.roomId !== room.id || target.status !== "ACTIVE") {
        throw new DomainError("PLAYER_NOT_FOUND", "Invalid vote target");
      }
      const existing = await store.getVote(room.currentRoundId, actor.id);
      if (existing) {
        throw new DomainError("ALREADY_VOTED", "Already voted", 409);
      }
      await store.insertVote({
        id: newId(),
        roundId: room.currentRoundId,
        voterPlayerId: actor.id,
        targetPlayerId,
        createdAt: nowIso(),
      });
      const players = (await store.listPlayers(room.id)).filter(
        (player) => player.status === "ACTIVE",
      );
      const votes = await store.listVotes(room.currentRoundId);
      emitRoomEvent(room.code, "room.updated");
      if (votes.length >= players.length) {
        return this.finishVoting(code, sessionToken, { auto: true });
      }
      return toPublicRoom(room);
    },

    async finishVoting(
      code: string,
      sessionToken?: string,
      options: { auto?: boolean } = {},
    ) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      if (!options.auto) {
        requireHost(actor);
      }
      if (room.status === "RESULT") {
        return toPublicRoom(room);
      }
      if (room.status !== "VOTING") {
        throw new DomainError("NOT_VOTING", "Not in voting phase");
      }
      assertTransition("VOTING", "RESULT");
      const next = { ...room, status: "RESULT" as const };
      if (room.currentRoundId) {
        const round = await store.getRoundById(room.currentRoundId);
        const players = await store.listPlayers(room.id);
        const votes = await store.listVotes(room.currentRoundId);
        const assignments = await store.listAssignments(room.currentRoundId);
        const impostorIds = assignments
          .filter((item) => item.role === "IMPOSTOR" || item.role === "UNDERCOVER")
          .map((item) => item.playerId);
        const result = calculateVoteResult({
          players,
          votes,
          impostorPlayerIds: impostorIds,
        });
        if (!result.isTie && result.selectedSuspectId) {
          for (const player of players) {
            let add = 0;
            if (impostorIds.includes(player.id) && result.selectedSuspectId !== player.id) {
              add += 1;
            }
            if (!impostorIds.includes(player.id) && result.selectedSuspectId && impostorIds.includes(result.selectedSuspectId)) {
              if (votes.some((vote) => vote.voterPlayerId === player.id && impostorIds.includes(vote.targetPlayerId))) {
                add += 1;
              }
            }
            if (add > 0) {
              await store.updatePlayer({ ...player, score: player.score + add });
            }
          }
        }
        if (round) {
          await store.updateRound({ ...round, status: "RESULT" });
        }
      }
      await store.updateRoom(next);
      emitRoomEvent(room.code, "room.updated");
      return toPublicRoom(next);
    },

    async revote(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      if (room.status !== "RESULT" || !room.currentRoundId) {
        throw new DomainError("INVALID_TRANSITION", "Can only revote from result");
      }
      const players = await store.listPlayers(room.id);
      const votes = await store.listVotes(room.currentRoundId);
      const assignments = await store.listAssignments(room.currentRoundId);
      const impostorIds = assignments
        .filter((item) => item.role === "IMPOSTOR" || item.role === "UNDERCOVER")
        .map((item) => item.playerId);
      const result = calculateVoteResult({
        players,
        votes,
        impostorPlayerIds: impostorIds,
      });
      if (!result.isTie) {
        throw new DomainError("INVALID_TRANSITION", "Revote is only for ties");
      }
      await store.deleteVotes(room.currentRoundId);
      const round = await store.getRoundById(room.currentRoundId);
      if (round) {
        await store.updateRound({ ...round, status: "VOTING", tieBreak: "REVOTING" });
      }
      const next = { ...room, status: "VOTING" as const };
      await store.updateRoom(next);
      emitRoomEvent(room.code, "room.updated");
      return toPublicRoom(next);
    },

    async backToLobby(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      assertTransition(room.status, "LOBBY");
      const next: Room = {
        ...room,
        status: "LOBBY",
        currentRoundId: null,
      };
      await store.updateRoom(next);
      emitRoomEvent(room.code, "room.updated");
      return toPublicRoom(next);
    },

    async restartRound(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      
      // Must be in an active round (not LOBBY or CLOSED)
      if (room.status === "LOBBY" || room.status === "CLOSED") {
        throw new DomainError("INVALID_TRANSITION", "Cannot restart from lobby or closed");
      }
      
      // Clear current round data if exists
      if (room.currentRoundId) {
        await store.deleteVotes(room.currentRoundId);
        await store.deleteAssignments(room.currentRoundId);
      }
      
      return store.runExclusive(room.id, async () => {
        const fresh = await requireRoom(store, code);
        // Start a new round with the same roster
        const next = await startNewRound(store, fresh);
        emitRoomEvent(fresh.code, "room.updated");
        return toPublicRoom(next);
      });
    },

    async closeRoom(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      requireHost(actor);
      const next = { ...room, status: "CLOSED" as const };
      await store.updateRoom(next);
      emitRoomEvent(room.code, "room.updated");
      return { ok: true };
    },

    async touchHost(code: string, sessionToken?: string) {
      const room = await requireRoom(store, code);
      const actor = await requireSessionPlayer(store, sessionToken, room);
      if (!actor.isHost) {
        return;
      }
      await store.updateRoom({ ...room, hostLastSeenAt: nowIso() });
    },

    defaultSettings(): RoomSettings {
      return {
        mode: "CLASSIC_IMPOSTOR",
        impostorCount: DEFAULT_IMPOSTOR_COUNT,
        category: "RANDOM",
        roundCount: 1,
        maxPlayers: MAX_PLAYERS,
        impostorsKnowEachOther: false,
      };
    },
  };
}

export type GameService = ReturnType<typeof createGameService>;
