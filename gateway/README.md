# Gateway / Portal Service

## Run locally

```bash
cd gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Server listens on `http://localhost:3005` by default.

## Required env vars for Google OAuth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:3005/auth/google/callback`)
- `GATEWAY_SECRET_KEY`

## Optional app target env vars

- `SURVEY_URL`
- `ARGUS_URL`
- `SYSREVIEW_URL`
- `CHATBOT_URL`
