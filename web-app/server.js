// Production server: serves the Vite build in dist/ and falls back to
// index.html for client-side routes (React Router).
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import compression from 'compression'
import express from 'express'

const distDir = fileURLToPath(new URL('./dist', import.meta.url))
const indexHtml = fileURLToPath(new URL('./dist/index.html', import.meta.url))

if (!existsSync(indexHtml)) {
  console.error('dist/index.html not found. Run "npm run build" before "npm start".')
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
  express.static(`${distDir}/assets`, { immutable: true, maxAge: '1y', fallthrough: false }),
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
