import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { SummaryActivity } from "strava-v3";
import { TrackPoint } from "./types";

const CACHE_DIR = join(__dirname, "..", ".cache");
const ACTIVITIES_PREFIX = "activities-";

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

function trackPath(activityId: number): string {
  return join(CACHE_DIR, `${activityId}.json`);
}

function getCacheTtlMs(): number {
  const hours = parseFloat(process.env.ACTIVITIES_CACHE_TTL_HOURS ?? "24");
  return hours * 3600 * 1000;
}

function findActivitiesCacheFile(): { path: string; epoch: number } | null {
  if (!existsSync(CACHE_DIR)) return null;
  const files = readdirSync(CACHE_DIR);
  for (const f of files) {
    if (f.startsWith(ACTIVITIES_PREFIX) && f.endsWith(".json")) {
      const epoch = parseInt(f.slice(ACTIVITIES_PREFIX.length, -5), 10);
      if (!isNaN(epoch)) return { path: join(CACHE_DIR, f), epoch };
    }
  }
  return null;
}

function deleteActivitiesCache(): void {
  const existing = findActivitiesCacheFile();
  if (existing) unlinkSync(existing.path);
}

// ── Activities list cache (TTL-based) ───────────────────────────────────────

export function getCachedActivities(): SummaryActivity[] | null {
  const entry = findActivitiesCacheFile();
  if (!entry) return null;
  const age = Date.now() - entry.epoch;
  if (age > getCacheTtlMs()) {
    unlinkSync(entry.path);
    return null;
  }
  return JSON.parse(readFileSync(entry.path, "utf-8"));
}

export function cacheActivities(activities: SummaryActivity[]): void {
  ensureCacheDir();
  deleteActivitiesCache();
  const file = join(CACHE_DIR, `${ACTIVITIES_PREFIX}${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(activities, null, 2));
}

// ── Per-activity track points cache ─────────────────────────────────────────

export function getCachedTrack(activityId: number): TrackPoint[] | null {
  const p = trackPath(activityId);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

export function cacheTrack(activityId: number, points: TrackPoint[]): void {
  ensureCacheDir();
  writeFileSync(trackPath(activityId), JSON.stringify(points));
}
