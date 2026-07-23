#!/usr/bin/env node
/**
 * Import a portfolio localStorage snapshot JSON into src/lib/defaults.ts
 *
 * Usage:
 *   node scripts/import-snapshot-to-defaults.mjs path/to/portfolio-snapshot.json
 *
 * Then review `src/lib/defaults.ts` / `src/lib/default-snapshot.json` and commit.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const input = process.argv[2];
if (!input) {
  console.error(
    "Usage: node scripts/import-snapshot-to-defaults.mjs <snapshot.json>"
  );
  process.exit(1);
}

const abs = path.resolve(input);
if (!fs.existsSync(abs)) {
  console.error("File not found:", abs);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
if (!raw.profile || !raw.skills) {
  console.error("Invalid snapshot: missing profile/skills");
  process.exit(1);
}

// Persist as JSON consumed by defaults (clean version stamp)
const outJson = path.join(root, "src/lib/default-snapshot.json");
const snapshot = { ...raw, version: 20 };
fs.writeFileSync(outJson, JSON.stringify(snapshot, null, 2));
console.log("Wrote", outJson);
console.log("  photo:", String(snapshot.profile?.photo || "").slice(0, 90));
console.log("  languages:", snapshot.languages?.length);
console.log("  featureVideos:", snapshot.featureVideos?.length);
console.log("  skills:", snapshot.skills?.length);
console.log("  experiences:", snapshot.experiences?.length);
console.log("\nNext: wire DEFAULT_PORTFOLIO to import this JSON (already supported if present).");
