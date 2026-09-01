import "server-only";

function positiveNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number`);
  return parsed;
}

export function relayConfig() {
  const secret = process.env.RELAY_SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("RELAY_SESSION_SECRET must contain at least 32 characters in production");
  }
  return {
    secret: secret || "local-development-secret-change-before-production",
    databasePath: process.env.RELAY_DB_PATH?.trim() || ".data/arcadeops-relay.sqlite",
    sessionTtlMinutes: positiveNumber("RELAY_SESSION_TTL_MINUTES", 120),
    maxMissionsPerSession: Math.floor(positiveNumber("RELAY_MAX_MISSIONS_PER_SESSION", 2)),
    maxCostUsd: positiveNumber("RELAY_MAX_COST_USD", 0.02),
    cookieSecure:
      process.env.RELAY_COOKIE_SECURE === "0"
        ? false
        : process.env.RELAY_COOKIE_SECURE === "1"
          ? true
          : process.env.NODE_ENV === "production",
  };
}
