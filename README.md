# stravaghosts

Visualize your commuting walks as animated "ghost" traces on a map. Pulls GPS data from Strava, filters for weekday morning walks (7–10am, >1h), and generates an HTML visualization you can open in a browser.

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
```

## Usage

```bash
npm start
```

This fetches your activities, filters commuting walks, downloads GPS streams, and writes `visualization-data.json`. Open `visualization.html` in a browser to see the result.

API responses are cached in `.cache/` to avoid hitting Strava's rate limits on subsequent runs. To force a fresh fetch:

```bash
npm start -- --no-cache
```

## What counts as a "commuting walk"

- Activity type is Walk
- Duration > 1 hour
- Started on a weekday between 7:00 and 10:00
