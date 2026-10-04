import { describe, expect, it, beforeEach } from "vitest";
import { DomainError } from "@/domain/errors";
import { createGameService } from "@/domain/game/service";
import { assignRoles } from "@/domain/round/assign-roles";
import { assertValidRoleConfig, maxSpecialRoles } from "@/domain/round/role-config";
import { canTransition } from "@/domain/room/transitions";
import { calculateVoteResult } from "@/domain/voting/calculate-result";
import { createMemoryStore, resetMemoryStore } from "@/lib/store/memory-store";
import type { Player, Vote } from "@/domain/types";

function service() {
  return createGameService(createMemoryStore(), "memory");
}

async function roomWithPlayers(count: number, mode: "CLASSIC_IMPOSTOR" | "UNDERCOVER" = "CLASSIC_IMPOSTOR") {
  const game = service();
  const created = await game.createRoom({
    nickname: "Host",
    mode,
    impostorCount: 1,
    category: "RANDOM",
    roundCount: 1,
  });
  const tokens = [created.sessionToken];
  for (let i = 1; i < count; i += 1) {
    const joined = await game.joinRoom(created.room.code, `P${i}`);
    tokens.push(joined.sessionToken);
  }
  return { game, code: created.room.code, tokens };
}

describe("role config", () => {
  it("limits special roles by table size", () => {
    expect(maxSpecialRoles(3)).toBe(1);
    expect(maxSpecialRoles(6)).toBe(1);
    expect(maxSpecialRoles(7)).toBe(2);
    expect(maxSpecialRoles(10)).toBe(2);
    expect(() =>
      assertValidRoleConfig({ playerCount: 5, impostorCount: 2, mode: "CLASSIC_IMPOSTOR" }),
    ).toThrow(DomainError);
    expect(() =>
      assertValidRoleConfig({ playerCount: 2, impostorCount: 1, mode: "CLASSIC_IMPOSTOR" }),
    ).toThrow(DomainError);
  });
});

describe("assignRoles", () => {
  it("assigns exact impostor count with unique players", () => {
    const playerIds = ["a", "b", "c", "d", "e"];
    const plans = assignRoles({
      playerIds,
      mode: "CLASSIC_IMPOSTOR",
      impostorCount: 1,
      civilianWord: "xe ôm",
      undercoverWord: "phương tiện",
      impostorHint: "phương tiện",
      category: "Miền Nam",
      random: () => 0,
    });
    expect(plans).toHaveLength(5);
    expect(plans.filter((plan) => plan.role === "IMPOSTOR")).toHaveLength(1);
    expect(plans.filter((plan) => plan.role === "CIVILIAN")).toHaveLength(4);
    expect(new Set(plans.map((plan) => plan.playerId)).size).toBe(5);
    const impostor = plans.find((plan) => plan.role === "IMPOSTOR");
    // Impostors now get a hint word related to the category, not null
    expect(impostor?.word).toBeTruthy();
    expect(typeof impostor?.word).toBe("string");
    expect(impostor?.word).toBe("phương tiện");
    expect(plans.filter((plan) => plan.role === "CIVILIAN").every((plan) => plan.word === "xe ôm")).toBe(
      true,
    );
  });

  it("assigns undercover a different word", () => {
    const plans = assignRoles({
      playerIds: ["a", "b", "c", "d"],
      mode: "UNDERCOVER",
      impostorCount: 1,
      civilianWord: "Cà phê",
      undercoverWord: "Trà sữa",
      random: () => 0,
    });
    const undercover = plans.find((plan) => plan.role === "UNDERCOVER");
    expect(undercover?.word).toBe("Trà sữa");
    expect(plans.some((plan) => plan.role === "IMPOSTOR")).toBe(false);
  });
});

describe("vote calculation", () => {
  const players: Player[] = [
    mockPlayer("1", "Minh"),
    mockPlayer("2", "Huy"),
    mockPlayer("3", "Nam"),
  ];

  it("picks a unique leader", () => {
    const votes: Vote[] = [
      mockVote("1", "2"),
      mockVote("2", "1"),
      mockVote("3", "1"),
    ];
    const result = calculateVoteResult({
      players,
      votes,
      impostorPlayerIds: ["1"],
    });
    expect(result.isTie).toBe(false);
    expect(result.selectedSuspectId).toBe("1");
    expect(result.correctVoterIds.sort()).toEqual(["2", "3"]);
  });

  it("detects a tie", () => {
    const votes: Vote[] = [
      mockVote("1", "2"),
      mockVote("2", "1"),
      mockVote("3", "1"),
      mockVote("4", "2"),
    ];
    const four = [...players, mockPlayer("4", "Long")];
    const result = calculateVoteResult({
      players: four,
      votes,
      impostorPlayerIds: ["3"],
    });
    expect(result.isTie).toBe(true);
    expect(result.selectedSuspectId).toBeNull();
    expect(result.suspects.sort()).toEqual(["1", "2"]);
  });
});

describe("room state machine", () => {
  it("allows the documented transitions only", () => {
    expect(canTransition("LOBBY", "ASSIGNING")).toBe(true);
    expect(canTransition("ROLE_REVEAL", "DISCUSSION")).toBe(true);
    expect(canTransition("DISCUSSION", "VOTING")).toBe(true);
    expect(canTransition("VOTING", "RESULT")).toBe(true);
    expect(canTransition("RESULT", "ROLE_REVEAL")).toBe(true);
    expect(canTransition("LOBBY", "VOTING")).toBe(false);
    expect(canTransition("CLOSED", "LOBBY")).toBe(false);
  });
});

describe("game service", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("rejects start below minimum players", async () => {
    const { game, code, tokens } = await roomWithPlayers(2);
    await expect(game.startRound(code, tokens[0])).rejects.toMatchObject({ code: "MIN_PLAYERS" });
  });

  it("only host can start", async () => {
    const { game, code, tokens } = await roomWithPlayers(3);
    await expect(game.startRound(code, tokens[1])).rejects.toMatchObject({ code: "NOT_HOST" });
  });

  it("does not create a duplicate player on reconnect", async () => {
    const { game, code, tokens } = await roomWithPlayers(3);
    const again = await game.joinRoom(code, "OtherName", tokens[1]);
    expect(again.reconnected).toBe(true);
    const room = await game.getPublicRoom(code);
    expect(room.playerCount).toBe(3);
    expect(room.players.some((player) => player.nickname === "OtherName")).toBe(false);
  });

  it("rejects duplicate nicknames", async () => {
    const { game, code } = await roomWithPlayers(2);
    await expect(game.joinRoom(code, "Host")).rejects.toMatchObject({
      code: "DUPLICATE_NICKNAME",
    });
  });

  it("assigns private roles and hides them from public room", async () => {
    const { game, code, tokens } = await roomWithPlayers(4);
    await game.startRound(code, tokens[0]);
    const room = await game.getPublicRoom(code);
    expect(room.status).toBe("ROLE_REVEAL");
    expect(JSON.stringify(room)).not.toContain("xe ôm");
    const secrets = await Promise.all(tokens.map((token) => game.getMe(code, token)));
    const impostors = secrets.filter((me) => me.assignment?.role === "IMPOSTOR");
    const civilians = secrets.filter((me) => me.assignment?.role === "CIVILIAN");
    expect(impostors).toHaveLength(1);
    expect(civilians).toHaveLength(3);
    // Impostors now get a hint word related to the category, not null
    expect(impostors[0]?.assignment?.word).toBeTruthy();
    expect(typeof impostors[0]?.assignment?.word).toBe("string");
    expect(civilians[0]?.assignment?.word).toBeTruthy();
  });

  it("blocks join after start", async () => {
    const { game, code, tokens } = await roomWithPlayers(3);
    await game.startRound(code, tokens[0]);
    await expect(game.joinRoom(code, "Late")).rejects.toMatchObject({ code: "ROOM_STARTED" });
  });

  it("rejects self votes and double votes", async () => {
    const { game, code, tokens } = await roomWithPlayers(3);
    await game.startRound(code, tokens[0]);
    await game.startDiscussion(code, tokens[0]);
    await game.startVoting(code, tokens[0]);
    const me = await game.getMe(code, tokens[0]);
    await expect(game.castVote(code, me.playerId, tokens[0])).rejects.toMatchObject({
      code: "CANNOT_VOTE_SELF",
    });
    const room = await game.getPublicRoom(code);
    const other = room.players.find((player) => player.id !== me.playerId);
    await game.castVote(code, other!.id, tokens[0]);
    await expect(game.castVote(code, other!.id, tokens[0])).rejects.toMatchObject({
      code: "ALREADY_VOTED",
    });
  });

  it("resets round-specific state on next round", async () => {
    const { game, code, tokens } = await roomWithPlayers(3);
    await game.startRound(code, tokens[0]);
    await game.startDiscussion(code, tokens[0]);
    await game.startVoting(code, tokens[0]);
    const room = await game.getPublicRoom(code);
    const host = await game.getMe(code, tokens[0]);
    const other = room.players.find((player) => player.id !== host.playerId)!;
    await game.castVote(code, other.id, tokens[0]);
    await game.castVote(code, host.playerId, tokens[1]);
    await game.castVote(code, host.playerId, tokens[2]);
    await game.startRound(code, tokens[0]);
    const after = await game.getPublicRoom(code);
    expect(after.status).toBe("ROLE_REVEAL");
    expect(after.currentRoundNumber).toBe(2);
    expect(after.voteProgress).toBeNull();
    const me = await game.getMe(code, tokens[1]);
    expect(me.hasVoted).toBe(false);
    expect(me.assignment).toBeTruthy();
  });

  it("rejects invalid discussion skip", async () => {
    const { game, code, tokens } = await roomWithPlayers(3);
    await expect(game.startVoting(code, tokens[0])).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });
});

function mockPlayer(id: string, nickname: string): Player {
  return {
    id,
    roomId: "r",
    nickname,
    sessionToken: id,
    isHost: false,
    status: "ACTIVE",
    joinedAt: new Date().toISOString(),
    score: 0,
  };
}

function mockVote(voter: string, target: string): Vote {
  return {
    id: `${voter}-${target}`,
    roundId: "round",
    voterPlayerId: voter,
    targetPlayerId: target,
    createdAt: new Date().toISOString(),
  };
}
