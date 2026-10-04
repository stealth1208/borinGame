import type { WordPair } from "@/domain/types";

type SeedPair = Omit<WordPair, "id" | "language" | "active">;

const SEED: SeedPair[] = [
  { category: "Miền Nam", civilianWord: "xe ôm", undercoverWord: "phương tiện", impostorHint: "phương tiện", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "áo bà ba", undercoverWord: "đồ mặc", impostorHint: "đồ mặc", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "hủ tiếu", undercoverWord: "ăn sáng", impostorHint: "ăn sáng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "cơm tấm", undercoverWord: "nướng", impostorHint: "nướng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "nón lá", undercoverWord: "che nắng", impostorHint: "che nắng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "cà phê sữa", undercoverWord: "đồ uống", impostorHint: "đồ uống", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "bánh mì", undercoverWord: "ăn sáng", impostorHint: "ăn sáng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "bánh xèo", undercoverWord: "đồ chiên", impostorHint: "đồ chiên", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "gỏi cuốn", undercoverWord: "đồ cuốn", impostorHint: "đồ cuốn", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "bún mắm", undercoverWord: "món nước", impostorHint: "món nước", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "hủ tiếu Nam Vang", undercoverWord: "ăn sáng", impostorHint: "ăn sáng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "chè", undercoverWord: "đồ ngọt", impostorHint: "đồ ngọt", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "đá me", undercoverWord: "đồ uống", impostorHint: "đồ uống", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "nước mía", undercoverWord: "đồ uống", impostorHint: "đồ uống", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "sinh tố", undercoverWord: "đồ uống", impostorHint: "đồ uống", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "trà đá", undercoverWord: "đồ uống", impostorHint: "đồ uống", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "xe buýt", undercoverWord: "phương tiện", impostorHint: "phương tiện", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "xe khách", undercoverWord: "phương tiện", impostorHint: "phương tiện", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "ghe", undercoverWord: "phương tiện", impostorHint: "phương tiện", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "xuồng", undercoverWord: "phương tiện", impostorHint: "phương tiện", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "chợ", undercoverWord: "nơi mua bán", impostorHint: "nơi mua bán", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "quán cóc", undercoverWord: "chỗ ngồi", impostorHint: "chỗ ngồi", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "lề đường", undercoverWord: "chỗ ngồi", impostorHint: "chỗ ngồi", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "võng", undercoverWord: "chỗ nằm", impostorHint: "chỗ nằm", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "chiếu", undercoverWord: "chỗ nằm", impostorHint: "chỗ nằm", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "nồi đất", undercoverWord: "đồ nấu", impostorHint: "đồ nấu", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "cà mên", undercoverWord: "đồ đựng", impostorHint: "đồ đựng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "rổ", undercoverWord: "đồ đựng", impostorHint: "đồ đựng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "thúng", undercoverWord: "đồ đựng", impostorHint: "đồ đựng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "nón", undercoverWord: "che nắng", impostorHint: "che nắng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "dép lào", undercoverWord: "đồ mang", impostorHint: "đồ mang", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "áo thun", undercoverWord: "đồ mặc", impostorHint: "đồ mặc", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "khăn rằn", undercoverWord: "đồ quấn", impostorHint: "đồ quấn", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "ba lô", undercoverWord: "đồ đựng", impostorHint: "đồ đựng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "vịt quay", undercoverWord: "đồ nướng", impostorHint: "đồ nướng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "heo quay", undercoverWord: "đồ nướng", impostorHint: "đồ nướng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "phá lấu", undercoverWord: "đồ ăn", impostorHint: "đồ ăn", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "bò kho", undercoverWord: "món nước", impostorHint: "món nước", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "cá lóc", undercoverWord: "đồ nướng", impostorHint: "đồ nướng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "tôm", undercoverWord: "đồ ăn", impostorHint: "đồ ăn", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "mít", undercoverWord: "trái cây", impostorHint: "trái cây", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "sầu riêng", undercoverWord: "trái cây", impostorHint: "trái cây", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "mãng cầu", undercoverWord: "trái cây", impostorHint: "trái cây", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "dừa", undercoverWord: "trái cây", impostorHint: "trái cây", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "mía", undercoverWord: "cây", impostorHint: "cây", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "lúa", undercoverWord: "cây trồng", impostorHint: "cây trồng", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "ao", undercoverWord: "chỗ nước", impostorHint: "chỗ nước", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "vườn", undercoverWord: "chỗ cây", impostorHint: "chỗ cây", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "cầu khỉ", undercoverWord: "lối đi", impostorHint: "lối đi", difficulty: "easy" },
  { category: "Miền Nam", civilianWord: "hẻm", undercoverWord: "lối đi", impostorHint: "lối đi", difficulty: "easy" },
];

export function createSeedWordPairs(): WordPair[] {
  return SEED.map((pair, index) => ({
    id: `wp_${String(index + 1).padStart(3, "0")}`,
    language: "vi",
    active: true,
    ...pair,
  }));
}

export function listCategories(pairs: WordPair[]): string[] {
  return [...new Set(pairs.filter((pair) => pair.active).map((pair) => pair.category))].sort(
    (a, b) => a.localeCompare(b, "vi"),
  );
}
