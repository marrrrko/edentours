import { synchronizeToursWithGoogle } from '../../../utils/google-calendar'
import { indexToursAndBookings } from '../../../aggregates/booking'
import { getUpcomingBookings } from '../../../db/bookingDb'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await synchronizeToursWithGoogle(10)

      const toursAndBookings = await getUpcomingBookings()
      const upcomingToursAndBookings = indexToursAndBookings(toursAndBookings)
      const tours = upcomingToursAndBookings
        .map((tourAgg) => {
          const maxEnrollment =
            tourAgg.tour.location && parseInt(tourAgg.tour.location) > 0
              ? parseInt(tourAgg.tour.location)
              : parseInt(process.env.DEFAULT_MAX_ENROLLMENT)
          return {
            ...tourAgg.tour,
            enrollment: tourAgg.currentParticipantTotal,
            maxEnrollment
          }
        })
        .filter((tour) => {
          const hourDifference = (new Date(tour.start) - new Date()) / 3600000
          return hourDifference > 24
        })

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          tours: tours.map(t => ({summary: t.summary, start: t.start, tourId: t.tourId, remainingSpots: t.maxEnrollment - t.enrollment }))
        })
      )
    } else {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end({ msg: 'Invalid request' })
    }
  } catch (reqError) {
    global.log.error('Tour API error', reqError)
    throw reqError
  }
}
