import { getEvent } from '../../../db/bookingDb'

export default async function handler(req, res) {
  const bookingId = req.query.bookingId

  if (bookingId && req.method === 'GET') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    const event = await getEvent(bookingId)
    res.end(
      JSON.stringify({
        ...event
      })
    )
  } else {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end({ msg: 'Invalid request' })
  }
}

function processBooking(booking) {
  return {
    result: 'rejected',
    reason: "I don't know how"
  }
}
