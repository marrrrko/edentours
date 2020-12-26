import sqlite3 from 'sqlite3'
import { v4 as uuid } from 'uuid'

export async function getUpcomingEvents() {
  let db = await getDb()
  let rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM Tour', (error, rows) => {
      if (error) reject(error)
      else resolve(rows)
    })
  })
  await closeDb(db)

  return rows.map((r) => {
    let event = JSON.parse(r.doc)
    event.start = new Date(event.start)
    return event
  })
}

export async function getEvent(eventId) {
  let db = await getDb()
  let row = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM Tour WHERE TourId = $eventId',
      { $eventId: eventId },
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

export async function createNewEvents(events) {
  events.forEach((eventData) => {
    if (!eventData || !eventData.start || !eventData.id) {
      throw new Error('Invalid event: ' + JSON.stringify(eventData))
    }
  })

  let db = await getDb()
  let creationTasks = events.map((e) => insertEvent(db, e))
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
    id: bookingId,
    tourId: tourId
  }

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO Booking VALUES (?,json(?))',
      [doc.id, JSON.stringify(doc)],
      (err) => {
        if (err) {
          reject(err)
        } else {
          console.log('Created booking #' + bookingId)
          resolve()
        }
      }
    )
  })
  await closeDb(db)

  return bookingId
}

async function insertEvent(db, eventData) {
  const eventId = uuid()
  let doc = {
    ...eventData,
    id: eventId,
    externalEventId: eventData.id,
    start: new Date(eventData.start).toISOString()
  }

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO Tour VALUES (?,json(?))',
      [doc.id, JSON.stringify(doc)],
      (err) => {
        if (err) {
          reject(err)
        } else {
          console.log('Created event #' + eventId)
          resolve()
        }
      }
    )
  })

  return eventId
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
