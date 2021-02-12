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
const emailSendHoursPriorToTourStart = 48

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

  global.emailLog.info(
    `${toursThatNeedEmail.length} tours qualify for tour start email`
  )

  return Promise.all(toursThatNeedEmail.map(sendMissingTourStartEmails))
}

async function sendMissingTourStartEmails(tour) {
  const bookingRecords = await getBookingRecordsForTour(tour.tourId)
  const bookingRecordsByBooking = groupBookingsByBookingId(bookingRecords)
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

  global.emailLog.info(
    `${
      Object.keys(tourStartEmailRecordsByTargetId).length
    } tour start emails already sent for ${tour.tourId}`
  )

  //Should probably also check for unsent records (right now simply checking if they exist)
  //end re-try unsent. But let's not optimize too early. Could be handled elsewhere.
  const bookingsWithoutSentEmail = activeBookings.filter(
    (booking) => tourStartEmailRecordsByTargetId[booking.bookingId] == undefined
  )

  const sendJobs = bookingsWithoutSentEmail.map((booking) =>
    sendTourStartEmail(
      tour,
      booking.email,
      booking.participantCount,
      booking.bookingId
    )
  )

  //Let's email the guide too
  if (!tourStartEmailRecordsByTargetId['guide']) {
    sendJobs.push(sendTourStartEmail(tour, tour.creatorEmail, 0, 'guide'))
  }

  //Let's email ourselves too
  if (!tourStartEmailRecordsByTargetId['internal']) {
    sendJobs.push(
      sendTourStartEmail(tour, 'internal@eden.tours', 0, 'internal')
    )
  }

  global.emailLog.info(
    `${sendJobs.length} email start emails need to be sent for ${tour.tourId}`
  )

  return Promise.all(sendJobs)
}

async function sendTourStartEmail(tour, email, participantCount, targetId) {
  const emailMsg = await buildTourStartEmail(
    tour,
    email,
    participantCount,
    targetId
  )
  const transactionId = await createEmailTransaction(
    'tour-start',
    tour.tourId,
    emailMsg,
    targetId
  )
  sendEmail(transactionId)
}
