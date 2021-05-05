import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { setupGlobalLogging } from './utils/server-logging'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import bookingDbMigrations from './db/bookingDbMigrations'
import { startBackgroundJobs } from './utils/background-jobs'

setupGlobalLogging()
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

global.log.info('****************************')
global.log.info('****************************')
global.log.info('** EdenWeb Startup *********')
global.log.info('****************************')
global.log.info('****************************')

app
  .prepare()
  .then(() => {
    return bookingDbMigrations.prepareDb()
  })
  .catch((dbErr) => {
    global.log.error(dbErr)
    global.log.error('Problem with database. Aborting.')
    process.exit(2)
  })
  .then(() => {
    const SERVICE_PORT = process.env.SERVICE_PORT || 3001
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      try {
        handle(req, res, parsedUrl)
      } catch (requestError) {
        global.log.error('Request error', requestError)
      }
    }).listen(SERVICE_PORT, (err) => {
      if (err) throw err
      global.log.info(`EdenWeb Ready on port ${SERVICE_PORT}`)
    })
  })
  .then(() => {
    startBackgroundJobs()
  })
  .catch((runError) => {
    global.log.error('Something very bad has happened', runError)
    process.exit(2)
  })
