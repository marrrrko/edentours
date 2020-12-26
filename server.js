const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const bookingDbMigrations = require('./db/bookingDbMigrations')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    return bookingDbMigrations.prepareDb()
  })
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    }).listen(3000, (err) => {
      if (err) throw err
      console.log('> Eden Tours Ready on http://localhost:3000')
    })
  })
