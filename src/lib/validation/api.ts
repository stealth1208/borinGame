import { z } from "zod";
import { GAME_MODES } from "@/domain/types";

export const createRoomSchema = z.object({
  nickname: z.string().trim().max(16).default(""),
  mode: z.enum(GAME_MODES),
  impostorCount: z.coerce.number().int().min(1).max(3),
  category: z.string().min(1).max(40),
  roundCount: z.coerce.number().int().min(1).max(20).default(1),
  impostorsKnowEachOther: z.boolean().optional().default(false),
});

export const joinRoomSchema = z.object({
  nickname: z.string().trim().max(16).default(""),
});

export const voteSchema = z.object({
  targetPlayerId: z.string().uuid(),
});

export const removePlayerSchema = z.object({
  playerId: z.string().uuid(),
});
