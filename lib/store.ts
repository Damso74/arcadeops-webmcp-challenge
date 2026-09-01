import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { relayConfig } from "@/lib/config";
import { createInitialState } from "@/lib/seed";
import { newPublicId } from "@/lib/security";
import type { RelayState } from "@/lib/types";

type RelayDatabase = DatabaseSync;

const globalDatabase = globalThis as typeof globalThis & { __relayDatabase?: RelayDatabase };

function database(): RelayDatabase {
  if (globalDatabase.__relayDatabase) return globalDatabase.__relayDatabase;
  const databasePath = path.resolve(relayConfig().databasePath);
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS relay_sessions (
      id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revision INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS relay_rate_limits (
      key TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      count INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS relay_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  globalDatabase.__relayDatabase = db;
  return db;
}

export function createSession(): RelayState {
  const sessionId = newPublicId("session");
  const state = createInitialState(sessionId);
  database()
    .prepare("INSERT INTO relay_sessions (id, state_json, expires_at, revision) VALUES (?, ?, ?, ?)")
    .run(sessionId, JSON.stringify(state), state.expiresAt, state.revision);
  return state;
}

export function getSession(sessionId: string): RelayState | null {
  const row = database()
    .prepare("SELECT state_json, expires_at FROM relay_sessions WHERE id = ?")
    .get(sessionId) as { state_json: string; expires_at: string } | undefined;
  if (!row || Date.parse(row.expires_at) <= Date.now()) return null;
  return JSON.parse(row.state_json) as RelayState;
}

export function deleteSession(sessionId: string): void {
  database().prepare("DELETE FROM relay_sessions WHERE id = ?").run(sessionId);
}

export function mutateSession(
  sessionId: string,
  mutate: (state: RelayState) => { state: RelayState; changed: boolean },
): RelayState {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = getSession(sessionId);
    if (!current) throw new Error("SESSION_NOT_FOUND");
    const draft = structuredClone(current);
    const result = mutate(draft);
    if (!result.changed) {
      db.exec("COMMIT");
      return current;
    }
    result.state.revision = current.revision + 1;
    const updated = db
      .prepare("UPDATE relay_sessions SET state_json = ?, expires_at = ?, revision = ? WHERE id = ? AND revision = ?")
      .run(
        JSON.stringify(result.state),
        result.state.expiresAt,
        result.state.revision,
        sessionId,
        current.revision,
      );
    if (updated.changes !== 1) throw new Error("SESSION_CONFLICT");
    db.exec("COMMIT");
    return result.state;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function enforceRateLimit(key: string, limit = 80, windowMs = 60_000): void {
  const db = database();
  const now = Date.now();
  const row = db.prepare("SELECT window_started_at, count FROM relay_rate_limits WHERE key = ?").get(key) as
    | { window_started_at: number; count: number }
    | undefined;
  if (!row || now - row.window_started_at >= windowMs) {
    db.prepare(
      "INSERT INTO relay_rate_limits (key, window_started_at, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_started_at = excluded.window_started_at, count = 1",
    ).run(key, now);
    return;
  }
  if (row.count >= limit) throw new Error("RATE_LIMITED");
  db.prepare("UPDATE relay_rate_limits SET count = count + 1 WHERE key = ?").run(key);
}

export function metaGet(key: string): string | null {
  const row = database().prepare("SELECT value FROM relay_meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function metaSet(key: string, value: string): void {
  database()
    .prepare("INSERT INTO relay_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}
