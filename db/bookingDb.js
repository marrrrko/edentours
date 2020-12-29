import sqlite3 from 'sqlite3'
import { v4 as uuid } from 'uuid'

export async function getUpcomingTours() {
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

  return rows
    .map((r) => {
      let event = JSON.parse(r.doc)
      return event
    })
    .slice()
    .sort((a, b) => new Date(a.start) - new Date(b.start))
}

export async function getBookings(tourId) {
  let db = await getDb()
  let rows = await new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM Booking WHERE tourId = $tourId',
      { $tourId: tourId },
      (error, rows) => {
        if (error) reject(error)
        else resolve(rows)
      }
    )
  })
  await closeDb(db)

  return rows.map((r) => {
    let event = JSON.parse(r.doc)
    //event.start = new Date(event.start)
    return event
  })
}

export async function getUpcomingBookings() {
  let db = await getDb()
  let rows = await new Promise((resolve, reject) => {
    db.all(
      "SELECT Tour.tourId, Tour.doc as tourDoc, Booking.doc as bookingDoc FROM Tour LEFT JOIN Booking ON Tour.tourId = Booking.tourId WHERE Tour.start >= datetime('now')",
      (error, rows) => {
        if (error) reject(error)
        else resolve(rows)
      }
    )
  })
  await closeDb(db)

  const tourIndex = rows
    .map((r) => ({
      tourId: r.tourId,
      booking: JSON.parse(r.bookingDoc),
      tour: JSON.parse(r.tourDoc)
    }))
    .reduce((acc, next) => {
      if (!acc[next.tourId]) {
        acc[next.tourId] = {
          tour: next.tour,
          bookings: []
        }
      }
      if (next.booking) acc[next.tourId].bookings.push(next.booking)
      return acc
    }, {})

  const tourBookingList = Object.keys(tourIndex)
    .map((key) => tourIndex[key])
    .slice()
    .sort((a, b) => new Date(a.tour.start) - new Date(b.tour.start))

  const tourBookingAggregate = aggregateBookingsFromTours(tourBookingList)

  return tourBookingAggregate
}

function aggregateBookingsFromTours(upcomingToursAndBookings) {
  return upcomingToursAndBookings.map((tour) => {
    tour.allBookingsByEmail = tour.bookings.reduce((acc, next) => {
      if (!acc[next.email]) {
        acc[next.email] = []
      }
      acc[next.email].push(next)
      return acc
    }, {})

    // console.log(`---------- ${tour.tour.tourId} -------------`)
    // console.log(JSON.stringify(tour.allBookingsByEmail, null, '  '))

    tour.finalBookingsByEmail = Object.keys(tour.allBookingsByEmail).map(
      (email) => {
        return aggregateUsersBookings(email, tour.allBookingsByEmail[email])
      }
    )

    tour.currentParticipantTotal = tour.finalBookingsByEmail.reduce(
      (acc, next) => {
        return acc + next.participantCount
      },
      0
    )

    tour.currentGroupTotal = tour.finalBookingsByEmail.reduce((acc, next) => {
      if (next.latestBooking.eventType != 'cancelled') {
        return acc + 1
      }
      return acc
    }, 0)

    return tour
  })
}

function aggregateUsersBookings(email, bookings) {
  return bookings
    .slice()
    .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
    .reduce(
      (acc, next) => {
        if (acc.latestBooking == null) {
          acc.participantCount = next.participantCount
        } else if (next.eventType == 'created' || next.eventType == 'updated') {
          acc.participantCount = next.participantCount
        } else if (next.eventType == 'cancelled') {
          acc.participantCount = 0
        } else {
          throw new Error('Unknown event type: ' + next.eventType)
        }
        acc.latestBooking = next
        return acc
      },
      {
        email: email,
        participantCount: 0,
        latestBooking: null
      }
    )
}

export async function getTour(tourId) {
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
