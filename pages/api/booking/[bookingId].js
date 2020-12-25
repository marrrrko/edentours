export default function handler(req, res) {
  const bookingId = req.query.bookingId
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      body: `${JSON.parse(JSON.stringify(req.body))}`,
      id: bookingId,
      label: 'Super duper Tour',
      date: new Date()
    })
  )
}

function processBooking(booking) {
  return {
    result: 'rejected',
    reason: "I don't know how"
  }
}
