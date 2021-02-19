import { getUpcomingEventsFromGoogle } from '../../../utils/google-calendar'
import { indexToursAndBookings } from '../../../aggregates/booking'
import {
  getUpcomingTours,
  getUpcomingBookings,
  createNewTours,
  updateTour
} from '../../../db/bookingDb'

const cacheSetting = process.env.ENABLE_GOOGLE
const cacheEventsFromGoogle = cacheSetting == undefined ? true : cacheSetting

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await synchronizeToursWithGoogle()

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
          tours: tours
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

async function synchronizeToursWithGoogle() {
  const scheduledTours = await getUpcomingTours()
  const scheduledToursByGoogleId = scheduledTours.reduce((acc, next) => {
    acc[next.externalEventId] = next
    return acc
  }, {})
  const allEventsFromGoogle = await getUpcomingEventsFromGoogle(
    cacheEventsFromGoogle
  )
  const newEvents = allEventsFromGoogle.filter(
    (eventFromGoogle) =>
      scheduledToursByGoogleId[eventFromGoogle.id] == undefined
  )
  const changedEvents = allEventsFromGoogle.filter((eventFromGoogle) => {
    const localEvent = scheduledToursByGoogleId[eventFromGoogle.id]
    if (!localEvent) return false
    return localEvent.etag != eventFromGoogle.etag
  })

  if (!newEvents.length && !changedEvents.length) {
    return
  } else {
    if (newEvents.length) {
      global.log.info(`${newEvents.length} new event(s) found. Creating`)
      await createNewTours(newEvents)
    }
    if (changedEvents.length) {
      global.log.info(
        `${changedEvents.length} modified event(s) found. Updating`
      )
      await changedEvents.reduce(async (previous, googleEvent) => {
        await previous
        let eventToBeUpdated = scheduledToursByGoogleId[googleEvent.id]
        if (eventToBeUpdated && googleEvent) {
          return updateTour(eventToBeUpdated.eventTime, {
            ...eventToBeUpdated,
            summary: googleEvent.summary,
            start: googleEvent.start,
            end: googleEvent.end,
            etag: googleEvent.etag,
            description: googleEvent.description,
            location: googleEvent.location
          })
        } else {
          global.log.info('Missing event #' + eventToBeUpdated.externalEventId)
          return Promise.resolve()
        }
      }, Promise.resolve())
    }
  }
}
