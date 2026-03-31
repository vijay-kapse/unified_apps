"""Unified gateway backend implementing Google OAuth/OIDC and trusted artifact minting."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.parse
from typing import Any, Dict

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

ALLOWED_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}

app = FastAPI(title="Unified Gateway")


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def _b64_url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_url_decode(data: str) -> bytes:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def mint_gateway_token(identity: Dict[str, Any], ttl_seconds: int = 600) -> str:
    secret = _require_env("GATEWAY_SESSION_SECRET")
    issued_at = int(time.time())
    payload = {
        **identity,
        "iat": issued_at,
        "exp": issued_at + ttl_seconds,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64_url(payload_bytes)
    signature = hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64_url(signature)}"


def _state_payload(next_url: str) -> str:
    data = {
        "nonce": secrets.token_urlsafe(24),
        "next": next_url,
        "created_at": int(time.time()),
    }
    return _b64_url(json.dumps(data, separators=(",", ":")).encode("utf-8"))


def _read_state(raw_state: str) -> Dict[str, Any]:
    try:
        return json.loads(_b64_url_decode(raw_state))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from exc


@app.get("/auth/google/start")
def auth_google_start(next: str = "/"):
    client_id = _require_env("GOOGLE_OIDC_CLIENT_ID")
    redirect_uri = _require_env("GOOGLE_OIDC_REDIRECT_URI")
    scopes = os.getenv("GOOGLE_OIDC_SCOPES", "openid email profile")

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scopes,
        "state": _state_payload(next),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "select_account",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}")


@app.get("/auth/google/callback")
def auth_google_callback(code: str, state: str):
    client_id = _require_env("GOOGLE_OIDC_CLIENT_ID")
    client_secret = _require_env("GOOGLE_OIDC_CLIENT_SECRET")
    redirect_uri = _require_env("GOOGLE_OIDC_REDIRECT_URI")

    state_payload = _read_state(state)
    next_url = state_payload.get("next", "/")

    token_resp = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if token_resp.status_code >= 400:
        raise HTTPException(status_code=401, detail="Unable to exchange auth code")

    idt = token_resp.json().get("id_token")
    if not idt:
        raise HTTPException(status_code=401, detail="Missing id_token from provider")

    claims = id_token.verify_oauth2_token(idt, GoogleRequest(), client_id)

    # Explicit claim checks requested by requirements
    if claims.get("iss") not in ALLOWED_ISSUERS:
        raise HTTPException(status_code=401, detail="Invalid issuer")
    if claims.get("aud") != client_id:
        raise HTTPException(status_code=401, detail="Invalid audience")
    if int(claims.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Expired token")
    if not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Missing sub claim")
    if claims.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Unverified email")

    login_timestamp = int(time.time())
    identity = {
        "email": claims.get("email"),
        "name": claims.get("name", ""),
        "sub": claims.get("sub"),
        "login_timestamp": login_timestamp,
    }
    gateway_token = mint_gateway_token(identity)

    joiner = "&" if "?" in next_url else "?"
    return RedirectResponse(f"{next_url}{joiner}gateway_token={urllib.parse.quote(gateway_token)}")


@app.get("/auth/logout")
def auth_logout(request: Request):
    post_logout_redirect = request.query_params.get("next", "/")
    response = RedirectResponse(post_logout_redirect)
    response.delete_cookie("gateway_session")
    return response


@app.get("/auth/introspect")
def introspect(token: str):
    """Optional internal endpoint for debugging token exchange."""
    try:
        payload_b64, sig_b64 = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Malformed token") from exc

    secret = _require_env("GATEWAY_SESSION_SECRET")
    expected_sig = _b64_url(hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest())
    if not hmac.compare_digest(sig_b64, expected_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(_b64_url_decode(payload_b64))
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired")

    return JSONResponse(payload)
