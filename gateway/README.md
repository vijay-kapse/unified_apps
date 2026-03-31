# Unified Gateway Backend

This service is the shared authentication gateway for all integrated apps.

## Endpoints
- `GET /auth/google/start`
- `GET /auth/google/callback`
- `GET /auth/logout`

## Required environment variables
- `GOOGLE_OIDC_CLIENT_ID`: Google OAuth client ID.
- `GOOGLE_OIDC_CLIENT_SECRET`: Google OAuth client secret.
- `GOOGLE_OIDC_REDIRECT_URI`: Redirect URL registered in Google console (must point to `/auth/google/callback`).
- `GOOGLE_OIDC_SCOPES`: OAuth scopes. Recommended: `openid email profile`.
- `GATEWAY_SESSION_SECRET`: Shared secret used to sign gateway-issued trusted artifacts consumed by app bridges.

## Trusted artifact exchange
After successful callback validation, gateway redirects to the requested `next` URL with `gateway_token` query param.
This token is HMAC-signed server-side and includes:
- `email`
- `name`
- `sub`
- `login_timestamp`
- `iat`
- `exp`

App bridges must validate signature + expiry before trusting identity.
