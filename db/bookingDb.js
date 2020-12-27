import sqlite3 from 'sqlite3'
import { v4 as uuid } from 'uuid'

export async function getUpcomingEvents() {
  let db = await getDb()
  let rows = await new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM Tour WHERE start >= datetime('now')",
      (error, rows) => {
        if (error) reject(error)
        else resolve(rows)
      }
    )
  })
  await closeDb(db)

  return rows.map((r) => {
    let event = JSON.parse(r.doc)
    event.start = new Date(event.start)
    return event
  })
}

export async function getEvent(tourId) {
  let db = await getDb()
  let row = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM Tour WHERE tourId = $tourId',
      { $tourId: tourId },
      (error, rows) => {
        if (error) reject(error)
        else resolve(rows)
      }
    )
  })
  await closeDb(db)

  let event = JSON.parse(row.doc)
  event.start = new Date(event.start)
  return event
}

export async function createNewTours(events) {
  events.forEach((eventData) => {
    if (!eventData || !eventData.start || !eventData.id) {
      throw new Error('Invalid event: ' + JSON.stringify(eventData))
    }
  })

  let db = await getDb()
  let creationTasks = events.map((e) => insertTour(db, e))
  let ids = await creationTasks.reduce(async (previousPromise, next) => {
    await previousPromise
    return next
  }, Promise.resolve())

  await closeDb(db)

  return ids
}

export async function createNewBooking(tourId, booking) {
  let db = await getDb()
  const bookingId = uuid()
  let doc = {
    ...booking,
    bookingId: bookingId,
    eventTime: new Date().toISOString(),
    eventType: 'created',
    tourId: tourId
  }

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO Booking VALUES (?, ?, json(?))',
      [doc.bookingId, doc.eventTime, JSON.stringify(doc)],
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
  await closeDb(db)

  return bookingId
}

async function insertTour(db, eventData) {
  const tourId = uuid()
  const externalEventId = eventData.id
  delete eventData.id
  let doc = {
    ...eventData,
    tourId: tourId,
    eventTime: new Date().toISOString(),
    eventType: 'created',
    externalEventId: externalEventId,
    start: new Date(eventData.start).toISOString()
  }

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO Tour VALUES (?, ?, json(?))',
      [doc.tourId, doc.eventTime, JSON.stringify(doc)],
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })

  return tourId
}

async function getDb() {
  return new Promise((resolve, reject) => {
    const bookingsDb = new sqlite3.Database('data/bookings.sqlite3', (err) => {
      if (err) {
        console.error(`SQLite Database Connection Error`, err)
        reject(err)
      } else {
        resolve(bookingsDb)
      }
    })
  })
}

async function closeDb(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// getDatabase()
//   .then((db) => {
//     console.log('Got it!')
//     let sample = {
//       id: uuid(),
//       externalEventId: 'somegooglestring',
//       start: new Date().toISOString()
//     }
//     db.run(
//       'INSERT INTO Tour VALUES (?,json(?))',
//       [sample.id, JSON.stringify(sample)],
//       (err) => {
//         if (err) {
//           console.error("Couldn't insert", err)
//         } else {
//           console.log('Inserted!')
//         }
//       }
//     )
//   })
//   .catch((err) => {
//     console.error(`Something bad happened`, err)
//   })
