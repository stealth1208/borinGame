import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GameStore } from "@/lib/store/game-store";
import type {
  Player,
  PlayerAssignment,
  Round,
  Room,
  RoomSettings,
  Vote,
  WordPair,
} from "@/domain/types";

type RoomRow = {
  id: string;
  code: string;
  host_player_id: string;
  status: Room["status"];
  settings: RoomSettings;
  current_round_number: number;
  current_round_id: string | null;
  created_at: string;
  expires_at: string;
  host_last_seen_at: string;
};

type PlayerRow = {
  id: string;
  room_id: string;
  nickname: string;
  session_token: string;
  is_host: boolean;
  status: Player["status"];
  joined_at: string;
  score: number;
};

type RoundRow = {
  id: string;
  room_id: string;
  round_number: number;
  status: Round["status"];
  word_pair_id: string;
  speaking_order: string[];
  created_at: string;
  tie_break: Round["tieBreak"];
};

type AssignmentRow = {
  id: string;
  round_id: string;
  player_id: string;
  role: PlayerAssignment["role"];
  word: string | null;
};

type VoteRow = {
  id: string;
  round_id: string;
  voter_player_id: string;
  target_player_id: string;
  created_at: string;
};

type WordPairRow = {
  id: string;
  category: string;
  civilian_word: string;
  undercover_word: string;
  difficulty: WordPair["difficulty"];
  language: WordPair["language"];
  active: boolean;
};

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    code: row.code,
    hostPlayerId: row.host_player_id,
    status: row.status,
    settings: row.settings,
    currentRoundNumber: row.current_round_number,
    currentRoundId: row.current_round_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    hostLastSeenAt: row.host_last_seen_at,
  };
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    roomId: row.room_id,
    nickname: row.nickname,
    sessionToken: row.session_token,
    isHost: row.is_host,
    status: row.status,
    joinedAt: row.joined_at,
    score: row.score,
  };
}

function mapRound(row: RoundRow): Round {
  return {
    id: row.id,
    roomId: row.room_id,
    roundNumber: row.round_number,
    status: row.status,
    wordPairId: row.word_pair_id,
    speakingOrder: row.speaking_order,
    createdAt: row.created_at,
    tieBreak: row.tie_break,
  };
}

function mapAssignment(row: AssignmentRow): PlayerAssignment {
  return {
    id: row.id,
    roundId: row.round_id,
    playerId: row.player_id,
    role: row.role,
    word: row.word,
  };
}

function mapVote(row: VoteRow): Vote {
  return {
    id: row.id,
    roundId: row.round_id,
    voterPlayerId: row.voter_player_id,
    targetPlayerId: row.target_player_id,
    createdAt: row.created_at,
  };
}

function mapWordPair(row: WordPairRow): WordPair {
  return {
    id: row.id,
    category: row.category,
    civilianWord: row.civilian_word,
    undercoverWord: row.undercover_word,
    difficulty: row.difficulty,
    language: row.language,
    active: row.active,
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function assertOk<T>(error: { message: string } | null, data: T | null): T {
  if (error) {
    throw new Error(error.message);
  }
  if (data === null) {
    throw new Error("Supabase returned no data");
  }
  return data;
}

export function createSupabaseStore(client = createServiceClient()): GameStore {
  const locks = new Map<string, Promise<void>>();

  return {
    async runExclusive<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
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
      const { data, error } = await client
        .from("rooms")
        .select("*")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapRoom(data as RoomRow) : null;
    },

    async getRoomById(id) {
      const { data, error } = await client.from("rooms").select("*").eq("id", id).maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapRoom(data as RoomRow) : null;
    },

    async insertRoom(room) {
      const { error } = await client.from("rooms").insert({
        id: room.id,
        code: room.code,
        host_player_id: room.hostPlayerId,
        status: room.status,
        settings: room.settings,
        current_round_number: room.currentRoundNumber,
        current_round_id: room.currentRoundId,
        created_at: room.createdAt,
        expires_at: room.expiresAt,
        host_last_seen_at: room.hostLastSeenAt,
      });
      if (error) {
        throw new Error(error.message);
      }
    },

    async updateRoom(room) {
      const { error } = await client
        .from("rooms")
        .update({
          host_player_id: room.hostPlayerId,
          status: room.status,
          settings: room.settings,
          current_round_number: room.currentRoundNumber,
          current_round_id: room.currentRoundId,
          expires_at: room.expiresAt,
          host_last_seen_at: room.hostLastSeenAt,
        })
        .eq("id", room.id);
      if (error) {
        throw new Error(error.message);
      }
    },

    async listPlayers(roomId) {
      const { data, error } = await client
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true });
      return (assertOk(error, data) as PlayerRow[]).map(mapPlayer);
    },

    async getPlayerById(id) {
      const { data, error } = await client.from("players").select("*").eq("id", id).maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapPlayer(data as PlayerRow) : null;
    },

    async getPlayerBySession(token) {
      const { data, error } = await client
        .from("players")
        .select("*")
        .eq("session_token", token)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapPlayer(data as PlayerRow) : null;
    },

    async insertPlayer(player) {
      const { error } = await client.from("players").insert({
        id: player.id,
        room_id: player.roomId,
        nickname: player.nickname,
        session_token: player.sessionToken,
        is_host: player.isHost,
        status: player.status,
        joined_at: player.joinedAt,
        score: player.score,
      });
      if (error) {
        throw new Error(error.message);
      }
    },

    async updatePlayer(player) {
      const { error } = await client
        .from("players")
        .update({
          nickname: player.nickname,
          session_token: player.sessionToken,
          is_host: player.isHost,
          status: player.status,
          score: player.score,
        })
        .eq("id", player.id);
      if (error) {
        throw new Error(error.message);
      }
    },

    async insertRound(round) {
      const { error } = await client.from("rounds").insert({
        id: round.id,
        room_id: round.roomId,
        round_number: round.roundNumber,
        status: round.status,
        word_pair_id: round.wordPairId,
        speaking_order: round.speakingOrder,
        created_at: round.createdAt,
        tie_break: round.tieBreak,
      });
      if (error) {
        throw new Error(error.message);
      }
    },

    async updateRound(round) {
      const { error } = await client
        .from("rounds")
        .update({
          status: round.status,
          speaking_order: round.speakingOrder,
          tie_break: round.tieBreak,
        })
        .eq("id", round.id);
      if (error) {
        throw new Error(error.message);
      }
    },

    async getRoundById(id) {
      const { data, error } = await client.from("rounds").select("*").eq("id", id).maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapRound(data as RoundRow) : null;
    },

    async listRounds(roomId) {
      const { data, error } = await client
        .from("rounds")
        .select("*")
        .eq("room_id", roomId)
        .order("round_number", { ascending: true });
      return (assertOk(error, data) as RoundRow[]).map(mapRound);
    },

    async insertAssignments(assignments) {
      if (assignments.length === 0) {
        return;
      }
      const { error } = await client.from("player_assignments").insert(
        assignments.map((assignment) => ({
          id: assignment.id,
          round_id: assignment.roundId,
          player_id: assignment.playerId,
          role: assignment.role,
          word: assignment.word,
        })),
      );
      if (error) {
        throw new Error(error.message);
      }
    },

    async listAssignments(roundId) {
      const { data, error } = await client
        .from("player_assignments")
        .select("*")
        .eq("round_id", roundId);
      return (assertOk(error, data) as AssignmentRow[]).map(mapAssignment);
    },

    async getAssignment(roundId, playerId) {
      const { data, error } = await client
        .from("player_assignments")
        .select("*")
        .eq("round_id", roundId)
        .eq("player_id", playerId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapAssignment(data as AssignmentRow) : null;
    },

    async deleteAssignments(roundId) {
      const { error } = await client.from("player_assignments").delete().eq("round_id", roundId);
      if (error) {
        throw new Error(error.message);
      }
    },

    async insertVote(vote) {
      const { error } = await client.from("votes").insert({
        id: vote.id,
        round_id: vote.roundId,
        voter_player_id: vote.voterPlayerId,
        target_player_id: vote.targetPlayerId,
        created_at: vote.createdAt,
      });
      if (error) {
        throw new Error(error.message);
      }
    },

    async listVotes(roundId) {
      const { data, error } = await client.from("votes").select("*").eq("round_id", roundId);
      return (assertOk(error, data) as VoteRow[]).map(mapVote);
    },

    async getVote(roundId, voterPlayerId) {
      const { data, error } = await client
        .from("votes")
        .select("*")
        .eq("round_id", roundId)
        .eq("voter_player_id", voterPlayerId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapVote(data as VoteRow) : null;
    },

    async deleteVotes(roundId) {
      const { error } = await client.from("votes").delete().eq("round_id", roundId);
      if (error) {
        throw new Error(error.message);
      }
    },

    async listWordPairs() {
      const { data, error } = await client.from("word_pairs").select("*").eq("active", true);
      return (assertOk(error, data) as WordPairRow[]).map(mapWordPair);
    },

    async getWordPair(id) {
      const { data, error } = await client
        .from("word_pairs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapWordPair(data as WordPairRow) : null;
    },
  };
}
