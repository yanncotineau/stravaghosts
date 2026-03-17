import "dotenv/config";
import { SummaryActivity } from "strava-v3";
import { getClient, fetchAllActivities, fetchAllTracks } from "./strava";
import { exportVisualizationData } from "./visualization";

function isCommutingWalk(activity: SummaryActivity): boolean {
  if (activity.type !== "Walk" && activity.sport_type !== "Walk") return false;
  if (activity.moving_time <= 3600) return false;

  const start = new Date(activity.start_date_local);
  const day = start.getDay();
  if (day === 0 || day === 6) return false;

  const hour = start.getHours();
  if (hour < 7 || hour >= 10) return false;

  return true;
}

async function main() {
  const bypassCache = process.argv.includes("--no-cache");
  const client = await getClient();

  console.log("Fetching all activities...");
  const allActivities = await fetchAllActivities(client, { bypassCache });
  console.log(`Total activities: ${allActivities.length}\n`);

  const walks = allActivities.filter(isCommutingWalk);
  console.log(`Matching walks (weekday 7-10am, >1h): ${walks.length}\n`);

  console.log("Fetching GPS streams...");
  const allTracks = await fetchAllTracks(client, walks, { bypassCache });

  console.log(`\nExporting visualization data...`);
  const outputPath = exportVisualizationData(allTracks);
  console.log(`Done! Data written to: ${outputPath}`);
  console.log(`Open visualization.html in a browser to view.`);
}

main().catch(console.error);
