# Unified Portal Routing Map

## Gateway source location (in-repo)
- Gateway backend: `gateway/app.py`
- Gateway static homepage: `gateway/web/index.html`
- Gateway static login entry: `gateway/web/unified-login.html`
- Gateway static logout page: `gateway/web/unified-logout.html`

## Startup command
From repository root:

```bash
cd gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Default runtime URL: `http://127.0.0.1:3005`

## Portal pages
- `/` -> Unified Research Gateway landing page
- `/unified-login` -> Shared login origin for all four apps
- `/unified-logout` -> Shared logout return page

## Gateway-owned auth routes
- `/auth/google/start` -> Starts Google OAuth flow
- `/auth/google/callback` -> Handles authorization code exchange and stores gateway session
- `/auth/logout` -> Clears gateway session and routes to `/unified-logout`

## App launch routing behavior (auth enforced before redirect)
- `/survey` -> requires gateway session, then redirects to `SURVEY_URL`
- `/argus` -> requires gateway session, then redirects to `ARGUS_URL`
- `/sysreview` -> requires gateway session, then redirects to `SYSREVIEW_URL`
- `/chatbot` -> requires gateway session, then redirects to `CHATBOT_URL`

If user is unauthenticated, all launch routes redirect to `/unified-login` first.
