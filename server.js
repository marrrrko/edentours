import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import bookingDbMigrations from './db/bookingDbMigrations'
import { startBackgroundJobs } from './utils/background-jobs'
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    return bookingDbMigrations.prepareDb()
  })
  .catch((dbErr) => {
    console.error(dbErr)
    console.log('Problem with database. Aborting.')
    process.exit(2)
  })
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    }).listen(3000, (err) => {
      if (err) throw err
      console.log('> Eden Tours Ready on http://localhost:3000')
    })
    startBackgroundJobs()
  })
