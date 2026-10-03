import { DomainError } from "@/domain/errors";
import { MAX_PLAYERS, MIN_PLAYERS, type GameMode } from "@/domain/types";

export function maxSpecialRoles(playerCount: number): number {
  if (playerCount < MIN_PLAYERS) {
    return 0;
  }
  if (playerCount <= 6) {
    return 1;
  }
  if (playerCount <= 10) {
    return 2;
  }
  return Math.min(3, Math.floor(playerCount / 3));
}

export function assertValidRoleConfig(input: {
  playerCount: number;
  impostorCount: number;
  mode: GameMode;
}): void {
  const { playerCount, impostorCount } = input;
  if (playerCount < MIN_PLAYERS) {
    throw new DomainError("MIN_PLAYERS", "Need at least 3 players");
  }
  if (playerCount > MAX_PLAYERS) {
    throw new DomainError("ROOM_FULL", "Too many players");
  }
  if (!Number.isInteger(impostorCount) || impostorCount < 1) {
    throw new DomainError(
      "INVALID_ROLE_CONFIG",
      "Impostor count must be at least 1",
    );
  }
  const max = maxSpecialRoles(playerCount);
  if (impostorCount > max) {
    throw new DomainError(
      "INVALID_ROLE_CONFIG",
      `At most ${max} special role(s) for ${playerCount} players`,
    );
  }
  if (impostorCount >= playerCount) {
    throw new DomainError(
      "INVALID_ROLE_CONFIG",
      "Need at least one civilian",
    );
  }
}
