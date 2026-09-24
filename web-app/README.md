# Add-Impact Sales Platform (demo)

React + TypeScript + Tailwind, built with Vite and served in production by a small Express server (`server.js`). Runs on dummy data held in the browser; there is no database yet.

Requires Node 20.19+ (see `.node-version`).

## Development

```sh
npm install
npm run dev        # Vite dev server with hot reload
```

## Production

```sh
npm ci --include=dev
npm run build      # type-check and build to dist/
npm start          # serve dist/ on $PORT (default 3000)
```

The server:

- serves the built files from `dist/`, with long-lived caching for the fingerprinted files in `dist/assets/`
- returns `index.html` for any other page URL, so deep links like `/sales-pipeline` work on refresh
- answers `GET /healthz` with `ok` for host health checks
- shuts down cleanly on `SIGTERM`

## Deploying

`render.yaml` in the repo root is a Render Blueprint that deploys this folder as a Node web service. On any other Node host, set the app root to `web-app/`, the build command to `npm ci --include=dev && npm run build`, and the start command to `npm start`. The host must provide `PORT`.
