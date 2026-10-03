import type { RoomStatus } from "@/domain/types";
import { DomainError } from "@/domain/errors";

const ALLOWED_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
  LOBBY: ["ASSIGNING", "CLOSED"],
  ASSIGNING: ["ROLE_REVEAL", "CLOSED", "LOBBY"],
  ROLE_REVEAL: ["DISCUSSION", "CLOSED", "LOBBY", "ASSIGNING"],
  DISCUSSION: ["VOTING", "CLOSED", "LOBBY", "ASSIGNING", "ROLE_REVEAL"],
  VOTING: ["RESULT", "VOTING", "CLOSED", "LOBBY", "ASSIGNING", "ROLE_REVEAL"],
  RESULT: ["ROLE_REVEAL", "ASSIGNING", "LOBBY", "CLOSED"],
  CLOSED: [],
};

export function assertTransition(from: RoomStatus, to: RoomStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new DomainError(
      "INVALID_TRANSITION",
      `Cannot transition from ${from} to ${to}`,
    );
  }
}

export function canTransition(from: RoomStatus, to: RoomStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export const ROOM_TRANSITIONS = ALLOWED_TRANSITIONS;
