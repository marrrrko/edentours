import { getEvent, createNewBooking } from '../../../db/bookingDb'

export default async function handler(req, res) {
  const tourId = req.query.bookingId

  if (tourId && req.method === 'GET') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    const event = await getEvent(tourId)
    res.end(
      JSON.stringify({
        ...event
      })
    )
  } else if (tourId && req.method === 'POST') {
    const errorMsg = await processBooking(tourId, req.body)
    if (errorMsg) {
      res.statusCode = 422
      res.setHeader('Content-Type', 'application/json')
      console.log(`${JSON.stringify(req.body)}`)
      res.end(JSON.stringify({ msg: errorMsg }))
    } else {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      console.log(`${JSON.stringify(req.body)}`)
      res.end(JSON.stringify({ msg: 'Booked!' }))
    }
  } else {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end({ msg: 'Invalid request' })
  }
}

async function processBooking(tourId, booking) {
  if (!booking.bookerName) {
    return 'Invalid name.'
  } else if (
    !booking.email ||
    !booking.email.length ||
    !emailIsValid(booking.email)
  ) {
    return 'Please specify a valid email address'
  } else if (!booking.groupName) {
    return 'Please specify a name for your group such as "Friends from Brazil".'
  } else if (!booking.areYouHuman || parseInt(booking.areYouHuman) != 1914) {
    return 'Incorrect answer to special question. Answer should be a 4 digit number.'
  } else if (JSON.stringify(booking).length > 10000) {
    return 'Too much data'
  }

  await createNewBooking(tourId, {
    bookerName: booking.bookerName,
    email: booking.email,
    groupName: booking.groupName,
    participantCount: parseInt(booking.participantCount),
    groupDetails: booking.groupDetails
  })

  return null
}

function emailIsValid(email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  )
}
