const sensitiveKey = /(?:authorization|cookie|token|secret|password|database.?url|raw.?prompt|private.?key)/i;
const sensitiveValue = /(?:sk-[a-z0-9_-]{16,}|gh[opsu]_[a-z0-9]{20,}|postgres(?:ql)?:\/\/[^\s]+|Bearer\s+[a-z0-9._-]{16,})/gi;

export function redactToolOutput(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return value.replace(sensitiveValue, "[REDACTED]");
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((entry) => redactToolOutput(entry, seen));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKey.test(key) ? "[REDACTED]" : redactToolOutput(entry, seen),
    ]),
  );
}
