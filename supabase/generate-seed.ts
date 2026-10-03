import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createSeedWordPairs } from "../src/features/word-packs/seed";

const dir = dirname(fileURLToPath(import.meta.url));
const rows = createSeedWordPairs()
  .map((pair) => {
    const esc = (value: string) => value.replaceAll("'", "''");
    return `('${pair.id}', '${esc(pair.category)}', '${esc(pair.civilianWord)}', '${esc(pair.undercoverWord)}', '${pair.difficulty}', '${pair.language}', true)`;
  })
  .join(",\n");

const sql = `-- Generated word pair seed
insert into public.word_pairs (id, category, civilian_word, undercover_word, difficulty, language, active)
values
${rows}
on conflict (id) do update set
  category = excluded.category,
  civilian_word = excluded.civilian_word,
  undercover_word = excluded.undercover_word,
  difficulty = excluded.difficulty,
  language = excluded.language,
  active = excluded.active;
`;

writeFileSync(join(dir, "seed.sql"), sql);
console.log(`Wrote ${createSeedWordPairs().length} word pairs to supabase/seed.sql`);
