import {
  getUpcomingTours,
  getBookingRecordsForTour,
  getEmailTransactionsForEvent
} from '../db/bookingDb'
import {
  aggregateBookingRecords,
  groupBookingsByBookingId
} from '../aggregates/booking'
import {
  buildTourStartEmail,
  createEmailTransaction,
  sendEmail
} from './emails'
import './types'
const emailSendHoursPriorToTourStart = 24

export async function ensureAllQualifyingTourStartEmailsSent() {
  const tours = await getUpcomingTours()
  const toursThatNeedEmail = tours.filter((t) => {
    const start = new Date(t.start)
    const now = new Date()
    const diffInMs = start - now
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours > 0 && diffInHours < emailSendHoursPriorToTourStart) {
      return true
    }

    return false
  })

  console.log(`${toursThatNeedEmail.length} tours qualify for tour start email`)

  return Promise.all(toursThatNeedEmail.map(sendMissingTourStartEmails))
}

async function sendMissingTourStartEmails(tour) {
  const bookingRecords = await getBookingRecordsForTour(tour.tourId)
  console.log(`${bookingRecords.length} booking records`)
  const bookingRecordsByBooking = groupBookingsByBookingId(bookingRecords)
  console.log(JSON.stringify(bookingRecordsByBooking, null, ' '))
  const bookings = Object.keys(bookingRecordsByBooking).map((bookingId) =>
    aggregateBookingRecords(bookingRecordsByBooking[bookingId])
  )
  const activeBookings = bookings.filter(
    (b) => b.participantCount > 0 && b.eventType != 'cancelled'
  )

  const tourEmailRecords = await getEmailTransactionsForEvent(tour.tourId)
  const tourStartEmailRecords = tourEmailRecords.filter(
    (er) => er.transactionType === 'tour-start' && er.targetId != null
  )

  const tourStartEmailRecordsByTargetId = tourStartEmailRecords.reduce(
    (acc, next) => {
      if (!acc[next.targetId]) {
        acc[next.targetId] = []
      }
      acc[next.targetId].push(next)
      return acc
    },
    {}
  )

  console.log(
    `${
      Object.keys(tourStartEmailRecordsByTargetId).length
    } tour start emails already sent`
  )
  const bookingsWithoutSentEmail = activeBookings.filter(
    (booking) => tourStartEmailRecordsByTargetId[booking.bookingId] == undefined
  )

  const sendJobs = bookingsWithoutSentEmail.map((booking) =>
    sendTourStartEmail(tour, booking)
  )
  console.log(`${sendJobs.length} email start emails need to be sent`)

  return Promise.all(sendJobs)
}

async function sendTourStartEmail(tour, booking) {
  const email = await buildTourStartEmail(tour, booking)
  const transactionId = await createEmailTransaction(
    'tour-start',
    tour.tourId,
    email,
    booking.bookingId
  )
  sendEmail(transactionId)
}
