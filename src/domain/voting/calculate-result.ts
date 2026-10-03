import type { Player, Vote, VoteResult } from "@/domain/types";

export function calculateVoteResult(input: {
  players: Player[];
  votes: Vote[];
  impostorPlayerIds: string[];
}): VoteResult {
  const active = input.players.filter((player) => player.status === "ACTIVE");
  const counts = new Map<string, number>();
  for (const player of active) {
    counts.set(player.id, 0);
  }
  for (const vote of input.votes) {
    counts.set(vote.targetPlayerId, (counts.get(vote.targetPlayerId) ?? 0) + 1);
  }

  const tallies = active
    .map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
      count: counts.get(player.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.nickname.localeCompare(b.nickname));

  const topVoteCount = tallies[0]?.count ?? 0;
  const suspects =
    topVoteCount === 0
      ? []
      : tallies.filter((row) => row.count === topVoteCount).map((row) => row.playerId);
  const isTie = suspects.length !== 1;
  const selectedSuspectId = isTie ? null : (suspects[0] ?? null);

  const impostorSet = new Set(input.impostorPlayerIds);
  const correctVoterIds = input.votes
    .filter((vote) => impostorSet.has(vote.targetPlayerId))
    .map((vote) => vote.voterPlayerId);

  return {
    tallies,
    isTie,
    topVoteCount,
    suspects,
    selectedSuspectId,
    correctVoterIds,
  };
}
