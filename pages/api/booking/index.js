import { getUpcomingEventsFromGoogle } from '../../../utils/google-calendar'
import {
  getUpcomingTours,
  createNewTours,
  updateTour
} from '../../../db/bookingDb'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const events = await getUpdatedListOfEvents()
    const eventsInMoreThan24Hours = events.filter((event) => {
      const hourDifference = (new Date(event.start) - new Date()) / 3600000
      return hourDifference > 24
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        events: eventsInMoreThan24Hours.map((event) => ({
          ...event
        }))
      })
    )
  } else {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end({ msg: 'Invalid request' })
  }
}

async function getUpdatedListOfEvents() {
  const scheduledTours = await getUpcomingTours()
  const scheduledToursByGoogleId = scheduledTours.reduce((acc, next) => {
    acc[next.externalEventId] = next
    return acc
  }, {})
  const allEventsFromGoogle = await getUpcomingEventsFromGoogle(true)
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
    return scheduledTours
  } else {
    if (newEvents.length) {
      console.log(`${newEvents.length} new event(s) found. Creating`)
      await createNewTours(newEvents)
    }
    if (changedEvents.length) {
      console.log(`${changedEvents.length} modified event(s) found. Updating`)
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
          console.log('Missing event #' + eventToBeUpdated.externalEventId)
          return Promise.resolve()
        }
      }, Promise.resolve())
    }
    const updatedKnownEvents = await getUpcomingTours()
    return updatedKnownEvents
  }
}
