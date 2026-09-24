# Add-Impact Sales Platform (demo)

React + TypeScript + Tailwind, built with Vite. Runs on dummy data held in the browser; there is no database yet.

Requires Node 20.19+ (see `.node-version`).

## Development

```sh
npm install
npm run dev        # Vite dev server with hot reload
npm run build      # type-check and build to dist/
```

For production, the repo root is the Node app: its `server.js` serves this folder's `dist/`. See the root `README.md` for deployment.
