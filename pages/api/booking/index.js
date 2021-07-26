import { synchronizeToursWithGoogle } from '../../../utils/google-calendar'
import { indexToursAndBookings } from '../../../aggregates/booking'
import { getUpcomingBookings } from '../../../db/bookingDb'
import languageData from '../../../languages.json'
import { getAllGuides } from '../../../db/tour-guides'

const languageDict = languageData.languages.reduce((acc, next) => {
  acc[next.code] = next
  return acc
}, {})

let tourGuides = null
let lastTourProgramDataRefresh = 0
async function refreshTourProgramData(cacheSeconds = 30) {
  const nowSeconds = Math.ceil(new Date().getTime() / 1000)
  const refreshNeeded = nowSeconds - lastTourProgramDataRefresh > cacheSeconds

  if (refreshNeeded) {
    //validTourPrograms = await getAllTourPrograms()
    tourGuides = (await getAllGuides()).reduce((acc, next) => {
      acc[next._id] = next
      return acc
    }, {})
    lastTourProgramDataRefresh = nowSeconds
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await Promise.all([
        refreshTourProgramData(),
        synchronizeToursWithGoogle(10)
      ])

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
        .filter((tour) => !tour.cancelled)

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          tours: tours.map((t) => ({
            summary: t.summary,
            start: t.start,
            tourId: t.tourId,
            remainingSpots: t.maxEnrollment - t.enrollment,
            programId: t.programId,
            language: languageDict[t.language],
            guide: {
              id: t.guideId,
              name: tourGuides[t.guideId]?.displayLabel
            }
          }))
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
