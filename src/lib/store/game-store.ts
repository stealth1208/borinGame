import type {
  Player,
  PlayerAssignment,
  Round,
  Room,
  Vote,
  WordPair,
} from "@/domain/types";

export type GameStore = {
  runExclusive<T>(roomId: string, fn: () => Promise<T>): Promise<T>;
  getRoomByCode(code: string): Promise<Room | null>;
  getRoomById(id: string): Promise<Room | null>;
  insertRoom(room: Room): Promise<void>;
  updateRoom(room: Room): Promise<void>;
  listPlayers(roomId: string): Promise<Player[]>;
  getPlayerById(id: string): Promise<Player | null>;
  getPlayerBySession(token: string): Promise<Player | null>;
  insertPlayer(player: Player): Promise<void>;
  updatePlayer(player: Player): Promise<void>;
  insertRound(round: Round): Promise<void>;
  updateRound(round: Round): Promise<void>;
  getRoundById(id: string): Promise<Round | null>;
  listRounds(roomId: string): Promise<Round[]>;
  insertAssignments(assignments: PlayerAssignment[]): Promise<void>;
  listAssignments(roundId: string): Promise<PlayerAssignment[]>;
  getAssignment(roundId: string, playerId: string): Promise<PlayerAssignment | null>;
  deleteAssignments(roundId: string): Promise<void>;
  insertVote(vote: Vote): Promise<void>;
  listVotes(roundId: string): Promise<Vote[]>;
  getVote(roundId: string, voterPlayerId: string): Promise<Vote | null>;
  deleteVotes(roundId: string): Promise<void>;
  listWordPairs(): Promise<WordPair[]>;
  getWordPair(id: string): Promise<WordPair | null>;
};
