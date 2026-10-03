export const ROOM_STATUSES = [
  "LOBBY",
  "ASSIGNING",
  "ROLE_REVEAL",
  "DISCUSSION",
  "VOTING",
  "RESULT",
  "CLOSED",
] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const GAME_MODES = ["CLASSIC_IMPOSTOR", "UNDERCOVER"] as const;

export type GameMode = (typeof GAME_MODES)[number];

export const PLAYER_ROLES = [
  "CIVILIAN",
  "IMPOSTOR",
  "UNDERCOVER",
  "MR_WHITE",
] as const;

export type PlayerRole = (typeof PLAYER_ROLES)[number];

export const PLAYER_STATUSES = ["ACTIVE", "REMOVED"] as const;

export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
export const DEFAULT_IMPOSTOR_COUNT = 1;

export type RoomSettings = {
  mode: GameMode;
  impostorCount: number;
  category: string;
  roundCount: number;
  maxPlayers: number;
  impostorsKnowEachOther?: boolean;
};

export type Room = {
  id: string;
  code: string;
  hostPlayerId: string;
  status: RoomStatus;
  settings: RoomSettings;
  currentRoundNumber: number;
  currentRoundId: string | null;
  createdAt: string;
  expiresAt: string;
  hostLastSeenAt: string;
  category?: string;
};

export type Player = {
  id: string;
  roomId: string;
  nickname: string;
  sessionToken: string;
  isHost: boolean;
  status: PlayerStatus;
  joinedAt: string;
  score: number;
};

export type Round = {
  id: string;
  roomId: string;
  roundNumber: number;
  status: RoomStatus;
  wordPairId: string;
  speakingOrder: string[];
  createdAt: string;
  tieBreak: "NONE" | "REVOTING" | "REVEALED_ANYWAY";
};

export type PlayerAssignment = {
  id: string;
  roundId: string;
  playerId: string;
  role: PlayerRole;
  word: string | null;
};

export type Vote = {
  id: string;
  roundId: string;
  voterPlayerId: string;
  targetPlayerId: string;
  createdAt: string;
};

export type WordPair = {
  id: string;
  category: string;
  civilianWord: string;
  undercoverWord: string;
  difficulty: "easy" | "medium" | "hard";
  language: "vi";
  active: boolean;
};

export type VoteTally = {
  playerId: string;
  nickname: string;
  count: number;
};

export type VoteResult = {
  tallies: VoteTally[];
  isTie: boolean;
  topVoteCount: number;
  suspects: string[];
  selectedSuspectId: string | null;
  correctVoterIds: string[];
};
