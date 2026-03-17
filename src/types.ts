import { SummaryActivity } from "strava-v3";

export interface TrackPoint {
  lat: number;
  lng: number;
  elapsed: number; // seconds from activity start
}

export interface ActivityData {
  activity: SummaryActivity;
  points: TrackPoint[];
}
