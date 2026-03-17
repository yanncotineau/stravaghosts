import { writeFileSync } from "fs";
import { join } from "path";
import { ActivityData } from "./types";

export const DATA_PATH = join(__dirname, "..", "visualization-data.json");

export function exportVisualizationData(tracks: ActivityData[]): string {
  // Compute bounds
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const t of tracks) {
    for (const p of t.points) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }
  }

  // Compute average finish point
  let finLat = 0, finLng = 0;
  for (const t of tracks) {
    const last = t.points[t.points.length - 1];
    if (last) { finLat += last.lat; finLng += last.lng; }
  }
  finLat /= tracks.length;
  finLng /= tracks.length;

  // Precompute cumulative distances & format dates
  const tracksData = tracks.map((t) => {
    const cumDist: number[] = [0];
    for (let i = 1; i < t.points.length; i++) {
      const prev = t.points[i - 1];
      const cur = t.points[i];
      const dLat = ((cur.lat - prev.lat) * Math.PI) / 180;
      const dLng = ((cur.lng - prev.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((cur.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      cumDist.push(cumDist[i - 1] + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }
    const d = new Date(t.activity.start_date_local);
    // Use UTC methods: Strava's start_date_local has Z suffix but represents local time
    const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
    const startHour = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    const year = d.getUTCFullYear();
    return {
      id: t.activity.id,
      label,
      startHour,
      year,
      distance: t.activity.distance,
      movingTime: t.activity.moving_time,
      elapsedTime: t.activity.elapsed_time,
      points: t.points,
      cumDist,
    };
  });

  // Downsample points for trails
  const TRAIL_STEP = 5;
  const trailCoords = tracksData.map((t) =>
    t.points
      .filter((_: unknown, i: number) => i % TRAIL_STEP === 0 || i === t.points.length - 1)
      .map((p: { lat: number; lng: number }) => [p.lng, p.lat])
  );

  const earliestStartHour = Math.min(...tracksData.map(t => t.startHour));

  // Add startOffset (delay relative to earliest walker) to each track
  const tracksWithOffsets = tracksData.map(t => ({
    ...t,
    startOffset: t.startHour - earliestStartHour,
  }));

  // Max simulation time accounts for staggered starts
  const maxSimTime = Math.max(
    ...tracksWithOffsets.map(t => t.startOffset + (t.points[t.points.length - 1]?.elapsed ?? 0))
  );

  const data = {
    tracks: tracksWithOffsets,
    trailCoords,
    maxElapsed: Math.ceil(maxSimTime),
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
    finishLat: finLat,
    finishLng: finLng,
    earliestStartHour,
    totalWalks: tracks.length,
  };

  writeFileSync(DATA_PATH, JSON.stringify(data));
  return DATA_PATH;
}
