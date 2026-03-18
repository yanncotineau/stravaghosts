# stravaghosts

Visualize any recurring Strava activity as animated "ghost" traces racing on a map. Pull GPS data from Strava, filter the activities you care about, and watch them all replay side by side in a browser.

## Setup

```bash
npm install
```

### Strava API credentials

You need three values: a **Client ID**, a **Client Secret**, and a **Refresh Token**.

1. Go to https://www.strava.com/settings/api and create an application (or use an existing one).
2. Note your **Client ID** and **Client Secret**.
3. To get a **Refresh Token** with activity read permissions:
   - Open this URL in your browser (replace `YOUR_CLIENT_ID`):
     ```
     https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&scope=activity:read_all&approval_prompt=force
     ```
   - Authorize the app. You'll be redirected to `http://localhost/?code=XXXXX&...`. Copy the `code` value from the URL.
   - Exchange the code for tokens:
     ```bash
     curl -X POST https://www.strava.com/oauth/token \
       -d client_id=YOUR_CLIENT_ID \
       -d client_secret=YOUR_CLIENT_SECRET \
       -d code=THE_CODE_YOU_GOT \
       -d grant_type=authorization_code
     ```
   - The response JSON contains your `refresh_token`.

4. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
ACTIVITIES_CACHE_TTL_HOURS=24
```

## Usage

```bash
npm start
```

This fetches your activities, filters them, downloads GPS streams, and writes `visualization-data.json`. Open `visualization.html` in a browser to see the result.

The activities list is cached for `ACTIVITIES_CACHE_TTL_HOURS` hours (default 24). Individual GPS track caches are kept indefinitely since they don't change. To force a fresh fetch regardless of TTL:

```bash
npm start -- --no-cache
```

## Filtering

Edit the `isCommutingWalk` function in `src/index.ts` to match whatever recurring activity you want to visualize. For example, the default filter selects my weekday morning commuting walks:

- Activity type is Walk
- Duration > 1 hour
- Started on a weekday between 7:00 and 10:00

You could adapt this to your daily bike commute, weekend long runs, or any other pattern.
