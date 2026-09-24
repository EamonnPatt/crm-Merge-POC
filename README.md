# Add-Impact Sales Platform

The web app lives in `web-app/` (React + Vite; see its README for development). The repo root is the Node app that serves it in production:

- `npm run build` installs `web-app/`'s dependencies and builds it to `web-app/dist/`
- `npm start` runs `server.js`, an Express server that serves `web-app/dist/`, returns `index.html` for page URLs like `/sales-pipeline` so deep links survive a refresh, and answers `GET /healthz` with `ok`

Requires Node 20.19+ (22 recommended). The server listens on `$PORT`, or 3000 if unset.

The older Flask POC (`app.py`, `templates/`, `static/`) is not used by the Node app.

## Deploying on cPanel (Setup Node.js App)

1. Put the repo on the server, e.g. with **Git Version Control** → Clone.
2. Open **Setup Node.js App** → **Create Application**:
   - **Node.js version:** 22
   - **Application mode:** Production
   - **Application root:** the folder the repo was cloned into
   - **Application URL:** a domain or subdomain root (the app expects to be served from `/`, not a sub-path)
   - **Application startup file:** `server.js`
3. Click **Run NPM Install**.
4. Build the app: **Run JS script** → `build`. Or, over SSH, run the "enter the virtual environment" command shown at the top of the app's page, then `npm run build`.
5. Click **Restart**.

To update: pull the new code, repeat steps 3 (only if dependencies changed) and 4, then restart.

If the app won't start, check `stderr.log` in the application root. "web-app/dist/index.html not found" means step 4 hasn't run.

If the server's resource limits stop the build, run `npm run build` locally and upload `web-app/dist/` into the same folder on the server instead.

## Other Node hosts

Use the repo root as the app root, `npm install && npm run build` as the build command, and `npm start` as the start command.
