import { randomInt } from "node:crypto";
import type { GameMode, PlayerRole } from "@/domain/types";
import { assertValidRoleConfig } from "@/domain/round/role-config";

export type RoleAssignmentPlan = {
  playerId: string;
  role: PlayerRole;
  word: string | null;
};

/**
 * Generate a hint word related to the category based on the civilian word.
 * This hint is thematically related but not the exact civilian word.
 * Used for classic impostors so they have context without knowing the exact word.
 */
function generateImpostorHint(civilianWord: string, category: string): string {
  // Map of category keywords to generic hint patterns
  const categoryHints: Record<string, string[]> = {
    "đồ ăn": ["món ăn", "thức ăn", "đồ ăn"],
    "đồ uống": ["đồ uống", "nước uống", "thức uống"],
    "công nghệ": ["công nghệ", "điện tử", "thiết bị"],
    "giải trí": ["giải trí", "vui chơi", "hoạt động"],
    "di chuyển": ["phương tiện", "di chuyển", "giao thông"],
    "đời sống": ["đồ dùng", "sinh hoạt", "đời sống"],
    "việt nam": ["việt nam", "văn hóa", "truyền thống"],
    "nghề nghiệp": ["nghề nghiệp", "công việc", "ngành nghề"],
    "động vật": ["động vật", "con vật", "sinh vật"],
    "thể thao": ["thể thao", "bộ môn", "vận động"],
    "trường học": ["trường học", "giáo dục", "học tập"],
  };
  
  const categoryLower = category.toLowerCase();
  const hints = categoryHints[categoryLower] || ["thứ gì đó", "một thứ", "cái gì đó"];
  
  return hints[randomInt(hints.length)] || hints[0] || "thứ gì đó";
}

export function shuffleInPlace<T>(items: T[], random = randomInt): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = random(i + 1);
    const current = items[i];
    const swap = items[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    items[i] = swap;
    items[j] = current;
  }
  return items;
}

export function assignRoles(input: {
  playerIds: string[];
  mode: GameMode;
  impostorCount: number;
  civilianWord: string;
  undercoverWord: string;
  impostorHint?: string;
  category?: string;
  random?: (max: number) => number;
}): RoleAssignmentPlan[] {
  const {
    playerIds,
    mode,
    impostorCount,
    civilianWord,
    undercoverWord,
    impostorHint,
    category = "RANDOM",
    random = randomInt,
  } = input;

  assertValidRoleConfig({
    playerCount: playerIds.length,
    impostorCount,
    mode,
  });

  const shuffled = shuffleInPlace([...playerIds], random);
  const specialRole: PlayerRole =
    mode === "UNDERCOVER" ? "UNDERCOVER" : "IMPOSTOR";
  
  // For undercover mode, use the undercover word
  // For classic impostor mode, generate a hint word related to the category
  const specialWord = mode === "UNDERCOVER"
    ? undercoverWord
    : impostorHint?.trim() || generateImpostorHint(civilianWord, category);

  return shuffled.map((playerId, index) => {
    const isSpecial = index < impostorCount;
    return {
      playerId,
      role: isSpecial ? specialRole : "CIVILIAN",
      word: isSpecial ? specialWord : civilianWord,
    };
  });
}
