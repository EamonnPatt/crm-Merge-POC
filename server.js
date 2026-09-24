// Production server: serves the Vite build in web-app/dist and falls back to
// index.html for client-side routes (React Router).
// CommonJS on purpose: cPanel's Passenger loads the startup file with require().
const { existsSync } = require('node:fs')
const path = require('node:path')
const compression = require('compression')
const express = require('express')

const distDir = path.join(__dirname, 'web-app', 'dist')
const indexHtml = path.join(distDir, 'index.html')

if (!existsSync(indexHtml)) {
  console.error('web-app/dist/index.html not found. Run "npm run build" before starting the app.')
  process.exit(1)
}

const app = express()
app.disable('x-powered-by')
app.use(compression())

app.get('/healthz', (_req, res) => {
  res.type('text').send('ok')
})

// Vite fingerprints everything in assets/, so it can be cached forever.
// fallthrough: false makes a missing asset a 404 instead of index.html.
app.use(
  '/assets',
  express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }),
)
app.use(express.static(distDir, { index: false }))

// Anything else that asks for HTML is a client-side route.
app.use((req, res, next) => {
  if ((req.method !== 'GET' && req.method !== 'HEAD') || !req.accepts('html')) return next()
  res.set('Cache-Control', 'no-cache')
  res.sendFile(indexHtml)
})

// Missing assets (e.g. an old tab after a redeploy) are routine; don't log a stack trace.
app.use((err, _req, res, next) => {
  if (err.status === 404) return res.sendStatus(404)
  next(err)
})

// Passenger (cPanel) intercepts listen() and binds its own socket, so the port
// only matters on hosts that set PORT or when running locally.
const port = Number(process.env.PORT) || 3000
const server = app.listen(port, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Listening on port ${port}`)
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
