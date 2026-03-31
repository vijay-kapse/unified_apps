import os
import secrets
from urllib.parse import urlencode

import requests
from flask import Flask, redirect, request, session, url_for

app = Flask(__name__, static_folder="web", static_url_path="/web")
app.secret_key = os.getenv("GATEWAY_SECRET_KEY", "dev-secret-change-me")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3005/auth/google/callback")

APP_LAUNCH_TARGETS = {
    "survey": os.getenv("SURVEY_URL", "http://localhost:8000/survey/"),
    "argus": os.getenv("ARGUS_URL", "http://localhost:8001/argus/home"),
    "sysreview": os.getenv("SYSREVIEW_URL", "http://localhost:8080/sysreview/"),
    "chatbot": os.getenv("CHATBOT_URL", "http://localhost:5000/chatbot/"),
}


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/unified-login")
def unified_login():
    return app.send_static_file("unified-login.html")


@app.get("/unified-logout")
def unified_logout():
    return app.send_static_file("unified-logout.html")


def _is_authenticated() -> bool:
    return bool(session.get("user"))


def _require_auth(app_name: str):
    if not _is_authenticated():
        return redirect(url_for("unified_login", next=url_for(app_name)))
    return None


@app.get("/auth/google/start")
def auth_google_start():
    state = secrets.token_urlsafe(24)
    next_url = request.args.get("next", url_for("index"))
    session["oauth_state"] = state
    session["oauth_next"] = next_url

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }

    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}")


@app.get("/auth/google/callback")
def auth_google_callback():
    saved_state = session.get("oauth_state")
    incoming_state = request.args.get("state")
    if not saved_state or incoming_state != saved_state:
        return "Invalid OAuth state", 400

    code = request.args.get("code")
    if not code:
        return "Missing OAuth code", 400

    token_resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    token_resp.raise_for_status()
    token_data = token_resp.json()

    userinfo_resp = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
        timeout=10,
    )
    userinfo_resp.raise_for_status()
    userinfo = userinfo_resp.json()

    session["user"] = {
        "email": userinfo.get("email"),
        "given_name": userinfo.get("given_name"),
        "family_name": userinfo.get("family_name"),
        "name": userinfo.get("name"),
        "sub": userinfo.get("sub"),
    }

    return redirect(session.pop("oauth_next", url_for("index")))


@app.get("/auth/logout")
def auth_logout():
    session.clear()
    return redirect(url_for("unified_logout"))


@app.get("/survey")
def survey():
    auth_redirect = _require_auth("survey")
    if auth_redirect:
        return auth_redirect
    return redirect(APP_LAUNCH_TARGETS["survey"])


@app.get("/argus")
def argus():
    auth_redirect = _require_auth("argus")
    if auth_redirect:
        return auth_redirect
    return redirect(APP_LAUNCH_TARGETS["argus"])


@app.get("/sysreview")
def sysreview():
    auth_redirect = _require_auth("sysreview")
    if auth_redirect:
        return auth_redirect
    return redirect(APP_LAUNCH_TARGETS["sysreview"])


@app.get("/chatbot")
def chatbot():
    auth_redirect = _require_auth("chatbot")
    if auth_redirect:
        return auth_redirect
    return redirect(APP_LAUNCH_TARGETS["chatbot"])


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "3005")), debug=True)
