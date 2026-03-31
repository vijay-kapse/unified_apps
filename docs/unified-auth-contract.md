# Unified Auth Contract

## Purpose
Define the shared-login contract for the in-repo unified platform gateway at `gateway/`.

## Canonical login origin (in-repo)
All human login begins from gateway pages:
- `gateway/web/index.html` at route `/`
- `gateway/web/unified-login.html` at route `/unified-login`

## Gateway auth ownership
Gateway backend owns auth lifecycle:
- OAuth start: `GET /auth/google/start`
- OAuth callback: `GET /auth/google/callback`
- Logout: `GET /auth/logout`

Implementation path: `gateway/app.py`.

## Identity/session model
On successful callback, gateway stores a session user object with:
- `email`
- `given_name`
- `family_name`
- `name`
- `sub`

Session storage currently uses Flask signed cookies (`session`).

## App launch contract
Gateway launch routes require authenticated gateway session before app redirect:
- `/survey` -> redirect target `SURVEY_URL`
- `/argus` -> redirect target `ARGUS_URL`
- `/sysreview` -> redirect target `SYSREVIEW_URL`
- `/chatbot` -> redirect target `CHATBOT_URL`

Unauthenticated behavior:
- redirect to `/unified-login` and continue through `/auth/google/start`.

## Runtime startup command

```bash
cd gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Environment variables
Required for OAuth:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GATEWAY_SECRET_KEY`

Optional app redirect targets:
- `SURVEY_URL`
- `ARGUS_URL`
- `SYSREVIEW_URL`
- `CHATBOT_URL`
