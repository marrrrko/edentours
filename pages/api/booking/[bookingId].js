import {
  aggregateBookingRecords,
  indexToursAndBookings
} from '../../../aggregates/booking'
import {
  getTour,
  insertNewBooking,
  insertBookingUpdate,
  insertBookingCancellation,
  getAction,
  getBookingRecords,
  getUpcomingBookings
} from '../../../db/bookingDb'
import * as emailSending from '../../../utils/emails'
import Cookies from 'cookies'

export default async function handler(req, res) {
  try {
    const tourId = req.query.bookingId
    const cookies = new Cookies(req, res)

    if (tourId && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      const event = await getTour(tourId)
      if (!event) {
        res.statusCode = 404
        res.end(
          JSON.stringify({
            msg: 'Tour not found'
          })
        )
      } else {
        res.statusCode = 200
        res.end(
          JSON.stringify({
            ...event
          })
        )
      }
    } else if (tourId && req.method === 'POST') {
      const errorMsg = await processNewBooking(tourId, req.body)
      if (errorMsg) {
        res.statusCode = 422
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ msg: errorMsg }))
      } else {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ msg: 'Booked!' }))
      }
    } else if (tourId && req.method === 'PUT') {
      const errorMsg = await processExistingBooking(tourId, req.body, cookies)
      if (errorMsg) {
        res.statusCode = 422
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ msg: errorMsg }))
      } else {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ msg: 'Updated!' }))
      }
    } else if (tourId && req.method === 'DELETE') {
      const errorMsg = await cancelBooking(tourId, req.body, cookies)
      if (errorMsg) {
        res.statusCode = 422
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ msg: errorMsg }))
      } else {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ msg: 'Cancelled!' }))
      }
    } else {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end({ msg: 'Invalid request' })
    }
  } catch (reqError) {
    global.log.error('Booking API error', reqError)
    throw reqError
  }
}

async function getTourRemainingSpots(tourAgg) {
  const maxEnrollment =
    tourAgg.tour.location && parseInt(tourAgg.tour.location) > 0
      ? parseInt(tourAgg.tour.location)
      : parseInt(process.env.DEFAULT_MAX_ENROLLMENT)

  console.log(`Max enrollment = ${maxEnrollment}`)
  const enrollment = tourAgg.currentParticipantTotal
  console.log(`Current enrollment = ${enrollment}`)

  return maxEnrollment - enrollment
}

async function processNewBooking(tourId, booking) {
  const validationProblem = findBookingValidationProblem(booking)
  if (validationProblem) return validationProblem

  const toursAndBookings = await getUpcomingBookings(tourId)
  const tourAgg = indexToursAndBookings(toursAndBookings)[0]

  const alreadyBooked =
    tourAgg.finalBookingsByEmail.filter(
      (b) => b.email.toLowerCase() === booking.email.toLowerCase()
    ).length > 0

  if (alreadyBooked) {
    return 'This email is already registered for this tour on this date.\nIf you would like to modify your booking, please use the link included in your booking confirmation email.'
  }

  const availableSpots = await getTourRemainingSpots(tourAgg)
  if (parseInt(booking.participantCount) > availableSpots) {
    if (availableSpots > 0)
      return `Only ${availableSpots} spots remain for this tour on this date.`
    else return `No spots remain for this tour on this date`
  }

  const bookingId = await insertNewBooking(tourId, {
    bookerName: booking.bookerName,
    email: booking.email,
    groupName: booking.groupName,
    participantCount: parseInt(booking.participantCount),
    groupDetails: booking.groupDetails,
    userTimeZone: booking.userTimeZone
  })

  const email = await emailSending.buildBookingConfirmationEmail(bookingId)
  const transactionId = await emailSending.createEmailTransaction(
    'booking-confirmation',
    bookingId,
    email
  )
  emailSending.sendEmail(transactionId)

  return null //null for success
}

async function processExistingBooking(tourId, booking, cookies) {
  const validationProblem = findBookingValidationProblem(booking, false)
  if (validationProblem) return validationProblem
  if (
    !booking.actionKey ||
    !tourId ||
    !booking.bookingId ||
    booking.tour.tourId != tourId
  ) {
    return 'Invalid request'
  }

  let accessNote = ''
  if (booking.actionKey === 'admin' && isAdmin(cookies)) {
    accessNote = 'admin'
  } else if (isValidActionKey(booking.actionKey, booking.bookingId)) {
    accessNote = 'K:' + booking.actionKey
  } else {
    return 'No access'
  }

  const originalBooking = aggregateBookingRecords(
    await getBookingRecords(booking.bookingId)
  )
  if (originalBooking.email != booking.email) {
    return 'Something is fishy'
  }

  const toursAndBookings = await getUpcomingBookings(tourId)
  const tourAgg = indexToursAndBookings(toursAndBookings)[0]
  const availableSpots =
    (await getTourRemainingSpots(tourAgg)) + originalBooking.participantCount
  if (parseInt(booking.participantCount) > availableSpots) {
    if (availableSpots > 0)
      return `Only ${availableSpots} spots are available for this tour on this date.`
    else return `No spots remain for this tour on this date`
  }

  const bookingId = await insertBookingUpdate(tourId, {
    ...originalBooking,
    bookerName: booking.bookerName,
    groupName: booking.groupName,
    participantCount: parseInt(booking.participantCount),
    groupDetails: booking.groupDetails,
    userTimeZone: booking.userTimeZone,
    accessNote
  })

  return null
}

function isAdmin(cookies) {
  const accessCookie = cookies.get('edenaccess')
  return accessCookie === process.env.ADMIN_ACCESS
}

async function isValidActionKey(actionKey, targetId) {
  const action = await getAction(actionKey)
  if (!action) return false

  const { actionType, actionTarget, expiration } = action
  if (
    actionType != 'modify-booking' ||
    (expiration && new Date(expiration) < new Date()) ||
    actionTarget != targetId
  ) {
    return false
  } else {
    return true
  }
}

async function cancelBooking(tourId, booking, cookies) {
  if (
    !booking.actionKey ||
    !tourId ||
    !booking.bookingId ||
    booking.tour.tourId != tourId
  ) {
    return 'Invalid request'
  }

  let accessNote = ''
  if (booking.actionKey === 'admin' && isAdmin(cookies)) {
    accessNote = 'admin'
  } else if (isValidActionKey(booking.actionKey, booking.bookingId)) {
    accessNote = 'K:' + booking.actionKey
  } else {
    return 'No access'
  }

  const originalBooking = aggregateBookingRecords(
    await getBookingRecords(booking.bookingId)
  )
  if (originalBooking.email != booking.email) {
    return 'Something is fishy'
  }

  await insertBookingCancellation(tourId, {
    bookingId: originalBooking.bookingId,
    email: originalBooking.email,
    tourId: originalBooking.tourId,
    userTimeZone: booking.userTimeZone,
    accessNote
  })

  return null
}

function findBookingValidationProblem(booking, requiredHumanCheck = true) {
  if (!booking.bookerName) {
    return 'Invalid name.'
  } else if (
    !booking.email ||
    !booking.email.length ||
    !emailIsValid(booking.email)
  ) {
    return 'Invalid email address'
  } else if (
    requiredHumanCheck &&
    (!booking.areYouHuman || parseInt(booking.areYouHuman) != 1914)
  ) {
    return 'Incorrect answer to special question.'
  } else if (JSON.stringify(booking).length > 10000) {
    return 'Too much data'
  }
  return null
}

function emailIsValid(email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  )
}
