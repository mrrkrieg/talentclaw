import BetterSqlite3 from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema.js";

const DATA_DIR = path.resolve(process.cwd(), ".talentclaw");
const DB_PATH = path.resolve(DATA_DIR, "talentclaw.sqlite");

let db: any = null;

export function getDb(): any {
  if (db) {
    return db;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new BetterSqlite3(DB_PATH);
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  return db;
}

export function dbPath(): string {
  return DB_PATH;
}
