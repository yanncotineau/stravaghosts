import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { SummaryActivity } from "strava-v3";
import { TrackPoint } from "./types";

const CACHE_DIR = join(__dirname, "..", ".cache");
const ACTIVITIES_FILE = join(CACHE_DIR, "activities.json");

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

function trackPath(activityId: number): string {
  return join(CACHE_DIR, `${activityId}.json`);
}

// ── Activities list cache ───────────────────────────────────────────────────

export function getCachedActivities(): SummaryActivity[] | null {
  if (!existsSync(ACTIVITIES_FILE)) return null;
  return JSON.parse(readFileSync(ACTIVITIES_FILE, "utf-8"));
}

export function cacheActivities(activities: SummaryActivity[]): void {
  ensureCacheDir();
  writeFileSync(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
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
