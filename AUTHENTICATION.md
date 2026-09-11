# Authentication and credential handling

The dashboard remains public by default. Set `VITE_AUTH_ENABLED=true` on a Vercel deployment to put the application behind the included username/password gate.

## Components

- `src/AuthGate.tsx`: browser UI and session-state handling. It never stores a password or JWT.
- `api/login.js`: validates credentials on the server and creates the session.
- `api/session.js`: validates the existing session for page reloads.
- `api/logout.js`: expires the session cookie.
- `api/_auth.js`: password verification, JWT signing/verification, cookie parsing, and response helpers.

## Request flow

1. With `VITE_AUTH_ENABLED=true`, `src/main.tsx` renders `AuthGate` before the dashboard.
2. `AuthGate` calls `GET /api/session`. The browser automatically includes the HttpOnly cookie, but JavaScript cannot read it.
3. If there is no valid session, the sign-in form posts the username and password over HTTPS to `POST /api/login`.
4. The server compares the username to `AUTH_USERNAME` and verifies the password with `scrypt` against `AUTH_PASSWORD_HASH`.
5. On success, the server creates an HMAC-SHA256 JWT with an eight-hour expiry and sends it only in a `Secure; HttpOnly; SameSite=Lax` cookie.
6. Subsequent session checks verify the JWT signature and expiry server-side. Logout expires the cookie.

## Deployment secrets

Configure these as Vercel environment variables. Never put their values in `.env` files that are committed to GitHub.

```text
VITE_AUTH_ENABLED=true
AUTH_USERNAME=<login name>
AUTH_PASSWORD_HASH=<salt>:<scrypt hash in hex>
AUTH_JWT_SECRET=<long random secret>
```

Generate a password hash locally without exposing the password in source control:

```bash
node -e "const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');process.stdout.write(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex')+'\n')" 'replace-with-password'
```

Generate a signing secret with:

```bash
node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url')+'\n')"
```

`VITE_AUTH_ENABLED` is intentionally public because Vite embeds `VITE_` variables into browser code. The username, password hash, and JWT signing secret do **not** use the `VITE_` prefix and are read only by serverless API functions.

## Security boundaries

The cookie protects access through the application's UI and session APIs. The current dashboard data itself is committed public data and the repository is public, so this gate must not be treated as protection for confidential datasets. There is no refresh token, no token in `localStorage`/`sessionStorage`, and no credential embedded in the client bundle.

For a multi-user production system, replace the single deployment credential with a managed identity provider and per-user authorization rather than adding more passwords to environment variables.
