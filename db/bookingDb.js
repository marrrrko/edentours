import sqlite3 from 'sqlite3'
import { v4 as uuid } from 'uuid'
import '../utils/types'

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

/**
 * Returns all booking records (unaggregated) for a given tourId
 * @param {string} tourId
 * @returns {PromiseLike<BookingRecord[]>}
 */
export async function getBookingRecordsForTour(tourId) {
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

  return rows.map((r) => JSON.parse(r.doc))
}

/**
 *
 * @returns {Array<Object>}
 */
export async function getBookingRecords(bookingId) {
  let db = await getDb()
  let rows = await new Promise((resolve, reject) => {
    db.all(
      'SELECT Booking.tourId, Booking.bookingId, Booking.doc as booking, Tour.doc as tour FROM Booking LEFT JOIN Tour on Tour.tourId = Booking.tourId WHERE Booking.bookingId = $bookingId',
      { $bookingId: bookingId },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
  })
  await closeDb(db)

  return rows.map((row) => ({
    ...JSON.parse(row.booking),
    tour: JSON.parse(row.tour)
  }))
}

/**
 * @returns({[{ tourId: string, tourDoc: object, bookingDoc: object}]})
 */
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

  return rows
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

  if (!row) return null

  let event = JSON.parse(row.doc)
  event.start = new Date(event.start)
  return event
}

export async function updateTour(previousEventTime, tourDoc) {
  let doc = {
    ...tourDoc,
    eventTime: new Date().toISOString(),
    eventType: 'updated'
  }

  let db = await getDb()

  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE Tour SET doc=json(?), eventTime=? WHERE tourId = ? AND eventTime = ?',
      [JSON.stringify(doc), doc.eventTime, doc.tourId, previousEventTime],
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
}

export async function createNewTours(events) {
  let validEvents = events.filter((eventData) => {
    if (!eventData || !eventData.start || !eventData.id) {
      global.log.warn('Invalid event. Skipping: ' + JSON.stringify(eventData))
      return false
    }
    return true
  })

  let db = await getDb()
  let creationTasks = validEvents.map((e) => insertNewTour(db, e))
  let ids = await creationTasks.reduce(async (previousPromise, next) => {
    await previousPromise
    return next
  }, Promise.resolve())

  await closeDb(db)

  return ids
}

export async function insertNewBooking(tourId, booking) {
  const bookingId = uuid()
  let doc = {
    ...booking,
    bookingId: bookingId,
    eventTime: new Date().toISOString(),
    eventType: 'created',
    tourId: tourId
  }

  let db = await getDb()
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

export async function insertBookingUpdate(bookingId, booking) {
  let db = await getDb()
  let doc = {
    ...booking,
    eventTime: new Date().toISOString(),
    eventType: 'updated'
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

export async function insertBookingCancellation(bookingId, booking) {
  let db = await getDb()
  let doc = {
    ...booking,
    eventTime: new Date().toISOString(),
    eventType: 'cancelled'
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

async function insertNewTour(db, eventData) {
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

export async function insertEmailTransaction(
  transactionId,
  transactionType,
  associatedEventId,
  email,
  targetId = null
) {
  let db = await getDb()

  let doc = {
    transactionId,
    transactionType,
    transactionTime: new Date().toISOString(),
    associatedEventId,
    email,
    sentAt: null
  }

  if (targetId) doc.targetId = targetId

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO EmailTransaction VALUES (?, json(?))',
      [transactionId, JSON.stringify(doc)],
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
  return transactionId
}

/**
 * Returns a specified email transaction (by Id)
 * @param {string} transactionId
 * @returns {EmailTransaction}
 */
export async function getEmailTransaction(transactionId) {
  let db = await getDb()
  let row = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM EmailTransaction WHERE transactionId = $transactionId',
      { $transactionId: transactionId },
      (error, rows) => {
        if (error) reject(error)
        else {
          resolve(rows)
        }
      }
    )
  })
  await closeDb(db)

  let transaction = JSON.parse(row.doc)
  return transaction
}

/**
 * Returns all email transactions associated with any system event (booking, tour, other)
 * @param {string} eventId
 * @returns {EmailTransaction[]}
 */
export async function getEmailTransactionsForEvent(eventId) {
  let db = await getDb()
  let rows = await new Promise((resolve, reject) => {
    db.all(
      'SELECT doc FROM EmailTransaction WHERE associatedEventId = $associatedEventId',
      { $associatedEventId: eventId },
      (error, rows) => {
        if (error) reject(error)
        else {
          resolve(rows)
        }
      }
    )
  })
  await closeDb(db)

  return rows.map((r) => JSON.parse(r.doc))
}

export async function markEmailTransactionAsSent(
  transactionId,
  messageId,
  sentAt
) {
  let db = await getDb()

  await new Promise((resolve, reject) => {
    db.run(
      "UPDATE EmailTransaction SET doc=(SELECT json_set(json_set(doc,'$.sentAt',?),'$.sentMsgId',?) FROM EmailTransaction WHERE transactionId=?) WHERE transactionId=?",
      [sentAt.toISOString(), messageId, transactionId, transactionId],
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
}

export async function insertActionKey(
  actionKey,
  actionType,
  actionTarget,
  expiration
) {
  let db = await getDb()

  let doc = {
    actionKey,
    actionType,
    actionTarget,
    created: new Date().toISOString(),
    expiration:
      expiration && expiration.getMonth === 'function'
        ? expiration.toISOString()
        : expiration
  }

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO ActionKey VALUES (?, json(?))',
      [actionKey, JSON.stringify(doc)],
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
}

export async function getAction(key) {
  let db = await getDb()
  let row = await new Promise((resolve, reject) => {
    db.get(
      'SELECT doc FROM ActionKey WHERE actionKey = $key',
      { $key: key },
      (error, rows) => {
        if (error) reject(error)
        else {
          resolve(rows)
        }
      }
    )
  })
  await closeDb(db)

  if (!row) return null

  let action = JSON.parse(row.doc)
  return action
}

async function getDb() {
  return new Promise((resolve, reject) => {
    const bookingsDb = new sqlite3.Database('data/bookings.sqlite3', (err) => {
      if (err) {
        global.log.error(`SQLite Database Connection Error`, err)
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
      else {
        resolve()
      }
    })
  })
}
