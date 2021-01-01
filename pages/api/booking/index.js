import { getUpcomingEvents } from '../../../utils/google-calendar'
import { getUpcomingTours, createNewTours } from '../../../db/bookingDb'

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
  const allEvents = await getUpcomingEvents()
  const newEvents = allEvents.filter(
    (eventFromGoogle) =>
      scheduledToursByGoogleId[eventFromGoogle.id] == undefined
  )

  if (!newEvents.length) {
    console.log('No new events found')
    return scheduledTours
  } else {
    console.log(`${newEvents.length} new event(s) found. Creating`)
    await createNewTours(newEvents)
    const updatedKnownEvents = await getUpcomingTours()
    return updatedKnownEvents
  }
}
