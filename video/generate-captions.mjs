import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const narration = await readFile(path.join(root, "narration.txt"), "utf8");
const words = narration.replace(/\s+/g, " ").trim().split(" ");
const chunks = [];

for (let cursor = 0; cursor < words.length; ) {
  let end = Math.min(cursor + 7, words.length);
  while (end < words.length && end > cursor + 4 && !/[.!?]$/.test(words[end - 1])) end -= 1;
  if (end <= cursor + 4) end = Math.min(cursor + 7, words.length);
  chunks.push(words.slice(cursor, end).join(" "));
  cursor = end;
}

const speechStart = 0.7;
const speechEnd = 71.25;
const secondsPerWord = (speechEnd - speechStart) / words.length;

function timestamp(seconds) {
  const millis = Math.round(seconds * 1000);
  const hours = Math.floor(millis / 3_600_000);
  const minutes = Math.floor((millis % 3_600_000) / 60_000);
  const secs = Math.floor((millis % 60_000) / 1000);
  const ms = millis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

let wordCursor = 0;
const entries = chunks.map((text, index) => {
  const count = text.split(" ").length;
  const start = speechStart + wordCursor * secondsPerWord;
  wordCursor += count;
  const end = speechStart + wordCursor * secondsPerWord;
  return `${index + 1}\n${timestamp(start)} --> ${timestamp(end)}\n${text}\n`;
});

await writeFile(
  path.join(root, "assets", "captions.en.srt"),
  `${entries.join("\n").trimEnd()}\n`,
  "utf8",
);
process.stdout.write(`Wrote ${entries.length} captions for ${words.length} words.\n`);
