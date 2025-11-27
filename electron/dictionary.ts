import { DatabaseSync } from "node:sqlite";
import { distance as levenshtein } from "fastest-levenshtein";

const db = new DatabaseSync("./resources/dictionary.db", {
  allowExtension: true,
});

function setup() {
  db.loadExtension("/usr/lib/spellfix.so");

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_fts
    USING fts5(id UNINDEXED, title);`);

  const ftsCount = db
    .prepare("SELECT COUNT(*) as count FROM dictionary_fts")
    .get() as { count: number };
  if (ftsCount.count === 0) {
    db.exec(
      "INSERT INTO dictionary_fts(id, title) SELECT id, title from definitions;"
    );
  }

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_spellfix
    USING spellfix1;`);

  const spellCount = db
    .prepare(`SELECT COUNT(*) as count FROM dictionary_spellfix`)
    .get() as { count: number };
  if (spellCount.count === 0) {
    db.exec(
      `INSERT INTO dictionary_spellfix(word) SELECT DISTINCT title FROM definitions;`
    );
  }
}

export function search(query: string, limit = 100) {
  const results = new Map();
  query = query.toLowerCase();

  const stmt = db.prepare(`
    SELECT d.id, d.title, d.entry
    FROM dictionary_fts f
    JOIN definitions d ON f.title = d.title
    WHERE dictionary_fts MATCH ?
  `);

  const matches = stmt.all(query + "*") as {
    id: string;
    title: string;
    entry: string;
  }[];
  matches.forEach((row) => results.set(row.id, row));

  const fuzzyStmt = db.prepare(`
    SELECT d.id, d.title, d.entry
    FROM dictionary_spellfix s
    JOIN definitions d ON s.word = d.title
    WHERE s.word MATCH ?
  `);

  const fuzzyMatches = fuzzyStmt.all(query) as {
    id: string;
    title: string;
    entry: string;
    score: number;
  }[];
  fuzzyMatches.forEach((row) => results.set(row.id, row));

  const scored = Array.from(results.values()).map((x) => ({
    id: x.id,
    title: x.title,
    entry: Buffer.from(x.entry).toString(),
    distance: levenshtein(query, x.title.toLowerCase()),
  }));

  scored.sort((a, b) => a.distance - b.distance);

  return scored.slice(0, limit);
}

setup();
