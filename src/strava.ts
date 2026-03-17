import strava, { SummaryActivity, StravaClientInstance } from "strava-v3";
import { TrackPoint, ActivityData } from "./types";
import {
  getCachedActivities,
  cacheActivities,
  getCachedTrack,
  cacheTrack,
} from "./cache";

export async function getClient(): Promise<StravaClientInstance> {
  const payload = await strava.oauth.refreshToken(
    process.env.STRAVA_REFRESH_TOKEN!
  );
  return new strava.client(payload.access_token);
}

export async function fetchAllActivities(
  client: StravaClientInstance,
  { bypassCache = false } = {}
): Promise<SummaryActivity[]> {
  if (!bypassCache) {
    const cached = getCachedActivities();
    if (cached) {
      console.log(`  (using cached activities: ${cached.length})`);
      return cached;
    }
  }

  const all: SummaryActivity[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const activities = await client.athlete.listActivities({
      page,
      per_page: perPage,
    });
    if (!activities || activities.length === 0) break;
    all.push(...activities);
    console.log(`  page ${page}: ${activities.length} activities`);
    if (activities.length < perPage) break;
    page++;
  }

  cacheActivities(all);
  console.log(`  cached ${all.length} activities`);
  return all;
}

async function fetchTrackPoints(
  client: StravaClientInstance,
  activity: SummaryActivity
): Promise<TrackPoint[]> {
  const streams = (await client.streams.activity({
    id: String(activity.id),
    keys: ["latlng", "time"],
    key_by_type: true,
  })) as unknown as Record<string, { data: number[] | [number, number][] }>;

  const latlngData = streams.latlng?.data as [number, number][] | undefined;
  const timeData = streams.time?.data as number[] | undefined;

  if (!latlngData) return [];

  return latlngData.map((coords, i) => ({
    lat: coords[0],
    lng: coords[1],
    elapsed: timeData
      ? timeData[i]
      : (i / latlngData.length) * activity.elapsed_time,
  }));
}

export async function fetchAllTracks(
  client: StravaClientInstance,
  walks: SummaryActivity[],
  { bypassCache = false } = {}
): Promise<ActivityData[]> {
  const allTracks: ActivityData[] = [];
  let fromCache = 0;
  let fetched = 0;

  for (const walk of walks) {
    let points: TrackPoint[] | null = null;

    if (!bypassCache) {
      points = getCachedTrack(walk.id);
    }

    if (points) {
      fromCache++;
    } else {
      points = await fetchTrackPoints(client, walk);
      cacheTrack(walk.id, points);
      fetched++;
      const date = new Date(walk.start_date_local).toLocaleDateString("fr-FR");
      console.log(`  ${date} ${walk.name}: ${points.length} pts`);
    }

    allTracks.push({ activity: walk, points });
  }

  if (fromCache > 0) console.log(`  ${fromCache} tracks from cache`);
  if (fetched > 0) console.log(`  ${fetched} tracks fetched from API`);

  return allTracks;
}
