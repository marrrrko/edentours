const sqlite3 = require('sqlite3')

const migrations = [createTourTable, createBookingTable]

async function prepareDb() {
  return new Promise((resolve, reject) => {
    const bookingsDb = new sqlite3.Database('data/bookings.sqlite3', (err) => {
      if (err) {
        console.error(`SQLite Database Startup error`, err)
        reject(err)
      } else {
        bookingsDb.get('PRAGMA user_version', async (err, row) => {
          await applyMigrations(bookingsDb, parseInt(row.user_version))
          console.log('Database ready')
          bookingsDb.close((err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }
    })
  })
}

async function applyMigrations(db, startAt) {
  console.log(`${migrations.length - startAt} migration(s) must be applied`)
  const migrationsToBeApplied = migrations.slice(startAt)
  await migrationsToBeApplied.reduce(async (previousPromise, next, index) => {
    await previousPromise.then(() => {
      console.log('Applying migration ' + next.name)
    })
    return next.call(null, db, startAt + index)
  }, Promise.resolve())
  console.log('All migrations applied.')
}

async function createTourTable(db, migrationIndex) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
      CREATE TABLE Tour (
        tourId TEXT NOT NULL ,
        eventTime TEXT NOT NULL,
        doc TEXT NOT NULL,
        eventType TEXT NOT NULL GENERATED ALWAYS AS (json_extract(doc, '$.eventType')) VIRTUAL,        
        externalEventId TEXT GENERATED ALWAYS AS (json_extract(doc, '$.externalEventId')) VIRTUAL,
        start TEXT NOT NULL GENERATED ALWAYS AS (json_extract(doc, '$.start')) VIRTUAL,
        PRIMARY KEY (tourId, eventTime))`)
      db.run(
        `
    PRAGMA user_version = ${migrationIndex + 1}`,
        () => {
          resolve()
        }
      )
    })
  })
}

async function createBookingTable(db, migrationIndex) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
      CREATE TABLE Booking (
        bookingId TEXT NOT NULL,
        eventTime TEXT NOT NULL,
        doc TEXT NOT NULL,
        eventType TEXT NOT NULL GENERATED ALWAYS AS (json_extract(doc, '$.eventType')) VIRTUAL,        
        email TEXT GENERATED ALWAYS AS (json_extract(doc, '$.email')) VIRTUAL,
        tourId TEXT GENERATED ALWAYS AS (json_extract(doc, '$.tourId')) VIRTUAL,
        PRIMARY KEY (bookingId, eventTime))`)
      db.run(
        `
    PRAGMA user_version = ${migrationIndex + 1}`,
        () => {
          resolve()
        }
      )
    })
  })
}

module.exports = { prepareDb }
