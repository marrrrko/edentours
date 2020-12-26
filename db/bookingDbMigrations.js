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
    TourId TEXT NOT NULL PRIMARY KEY,
    doc TEXT NOT NULL,
    ExternalEventId TEXT GENERATED ALWAYS AS (json_extract(doc, '$.externalEventId')) VIRTUAL,
    StartDate TEXT GENERATED ALWAYS AS (json_extract(doc, '$.start')) VIRTUAL)`)
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
    BookingId TEXT NOT NULL PRIMARY KEY,
    doc TEXT NOT NULL,
    Email TEXT GENERATED ALWAYS AS (json_extract(doc, '$.email')) VIRTUAL,
    TourId TEXT GENERATED ALWAYS AS (json_extract(doc, '$.tourId')) VIRTUAL)`)
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
