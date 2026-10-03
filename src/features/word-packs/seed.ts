import type { WordPair } from "@/domain/types";

type SeedPair = Omit<WordPair, "id" | "language" | "active">;

const SEED: SeedPair[] = [
  { category: "Đồ ăn", civilianWord: "Phở", undercoverWord: "Bún bò", difficulty: "easy" },
  { category: "Đồ ăn", civilianWord: "Pizza", undercoverWord: "Hamburger", difficulty: "easy" },
  { category: "Đồ ăn", civilianWord: "Bánh mì", undercoverWord: "Bánh bao", difficulty: "easy" },
  { category: "Đồ ăn", civilianWord: "Cơm tấm", undercoverWord: "Cơm gà", difficulty: "easy" },
  { category: "Đồ ăn", civilianWord: "Gỏi cuốn", undercoverWord: "Chả giò", difficulty: "easy" },
  { category: "Đồ ăn", civilianWord: "Sushi", undercoverWord: "Sashimi", difficulty: "medium" },
  { category: "Đồ ăn", civilianWord: "Lẩu", undercoverWord: "Nướng", difficulty: "easy" },
  { category: "Đồ ăn", civilianWord: "Bánh xèo", undercoverWord: "Bánh khọt", difficulty: "medium" },
  { category: "Đồ uống", civilianWord: "Cà phê", undercoverWord: "Trà sữa", difficulty: "easy" },
  { category: "Đồ uống", civilianWord: "Trà đá", undercoverWord: "Nước mía", difficulty: "easy" },
  { category: "Đồ uống", civilianWord: "Bia", undercoverWord: "Rượu", difficulty: "easy" },
  { category: "Đồ uống", civilianWord: "Nước dừa", undercoverWord: "Sinh tố", difficulty: "easy" },
  { category: "Đồ uống", civilianWord: "Matcha", undercoverWord: "Cacao", difficulty: "medium" },
  { category: "Công nghệ", civilianWord: "iPhone", undercoverWord: "Samsung", difficulty: "easy" },
  { category: "Công nghệ", civilianWord: "MacBook", undercoverWord: "Laptop Windows", difficulty: "easy" },
  { category: "Công nghệ", civilianWord: "AirPods", undercoverWord: "Tai nghe Bluetooth", difficulty: "easy" },
  { category: "Công nghệ", civilianWord: "TikTok", undercoverWord: "Instagram", difficulty: "easy" },
  { category: "Công nghệ", civilianWord: "Zalo", undercoverWord: "Messenger", difficulty: "easy" },
  { category: "Công nghệ", civilianWord: "ChatGPT", undercoverWord: "Google", difficulty: "medium" },
  { category: "Giải trí", civilianWord: "Netflix", undercoverWord: "YouTube", difficulty: "easy" },
  { category: "Giải trí", civilianWord: "Karaoke", undercoverWord: "Bar", difficulty: "easy" },
  { category: "Giải trí", civilianWord: "Game online", undercoverWord: "Board game", difficulty: "medium" },
  { category: "Giải trí", civilianWord: "Phim chiếu rạp", undercoverWord: "Phim Netflix", difficulty: "easy" },
  { category: "Giải trí", civilianWord: "K-pop", undercoverWord: "V-pop", difficulty: "medium" },
  { category: "Di chuyển", civilianWord: "Grab", undercoverWord: "Taxi", difficulty: "easy" },
  { category: "Di chuyển", civilianWord: "Xe máy", undercoverWord: "Xe đạp", difficulty: "easy" },
  { category: "Di chuyển", civilianWord: "Máy bay", undercoverWord: "Tàu hỏa", difficulty: "easy" },
  { category: "Di chuyển", civilianWord: "Xe buýt", undercoverWord: "Xe khách", difficulty: "easy" },
  { category: "Di chuyển", civilianWord: "Tàu điện", undercoverWord: "Xe ôm", difficulty: "medium" },
  { category: "Đời sống", civilianWord: "Chợ", undercoverWord: "Siêu thị", difficulty: "easy" },
  { category: "Đời sống", civilianWord: "ATM", undercoverWord: "Ví MoMo", difficulty: "easy" },
  { category: "Đời sống", civilianWord: "Điều hòa", undercoverWord: "Quạt máy", difficulty: "easy" },
  { category: "Đời sống", civilianWord: "Gối", undercoverWord: "Chăn", difficulty: "easy" },
  { category: "Đời sống", civilianWord: "Dù", undercoverWord: "Áo mưa", difficulty: "easy" },
  { category: "Đời sống", civilianWord: "Nồi cơm điện", undercoverWord: "Lò vi sóng", difficulty: "medium" },
  { category: "Việt Nam", civilianWord: "Hồ Gươm", undercoverWord: "Hồ Tây", difficulty: "medium" },
  { category: "Việt Nam", civilianWord: "Áo dài", undercoverWord: "Áo bà ba", difficulty: "medium" },
  { category: "Việt Nam", civilianWord: "Tết", undercoverWord: "Trung thu", difficulty: "easy" },
  { category: "Việt Nam", civilianWord: "Nón lá", undercoverWord: "Nón bảo hiểm", difficulty: "easy" },
  { category: "Việt Nam", civilianWord: "Bánh chưng", undercoverWord: "Bánh tét", difficulty: "easy" },
  { category: "Việt Nam", civilianWord: "Đà Lạt", undercoverWord: "Sa Pa", difficulty: "medium" },
  { category: "Nghề nghiệp", civilianWord: "Giáo viên", undercoverWord: "Gia sư", difficulty: "easy" },
  { category: "Nghề nghiệp", civilianWord: "Bác sĩ", undercoverWord: "Y tá", difficulty: "easy" },
  { category: "Nghề nghiệp", civilianWord: "Shipper", undercoverWord: "Tài xế Grab", difficulty: "easy" },
  { category: "Nghề nghiệp", civilianWord: "Ca sĩ", undercoverWord: "Rapper", difficulty: "medium" },
  { category: "Động vật", civilianWord: "Mèo", undercoverWord: "Chó", difficulty: "easy" },
  { category: "Động vật", civilianWord: "Cá sấu", undercoverWord: "Thằn lằn", difficulty: "medium" },
  { category: "Động vật", civilianWord: "Voi", undercoverWord: "Hà mã", difficulty: "medium" },
  { category: "Thể thao", civilianWord: "Bóng đá", undercoverWord: "Futsal", difficulty: "easy" },
  { category: "Thể thao", civilianWord: "Cầu lông", undercoverWord: "Tennis", difficulty: "easy" },
  { category: "Thể thao", civilianWord: "Bơi lội", undercoverWord: "Lặn", difficulty: "medium" },
  { category: "Trường học", civilianWord: "Bài tập", undercoverWord: "Kiểm tra", difficulty: "easy" },
  { category: "Trường học", civilianWord: "Thầy cô", undercoverWord: "Hiệu trưởng", difficulty: "easy" },
  { category: "Trường học", civilianWord: "Căn tin", undercoverWord: "Thư viện", difficulty: "easy" },
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
