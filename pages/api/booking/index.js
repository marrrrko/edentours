import { getUpcomingEvents as getUpcomingEventsFromGoogle } from '../../../utils/google-calendar'
import {
  getUpcomingEvents as getUpcomingEventsFromLocalDatabase,
  createNewTours
} from '../../../db/bookingDb'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const events = await getUpdatedListOfEvents()

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        events: events.map((event) => ({
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
  const knownEvents = await getUpcomingEventsFromLocalDatabase()
  const knownEventsByGoogleId = knownEvents.reduce((acc, next) => {
    acc[next.externalEventId] = next
    return acc
  }, {})
  const allEvents = await getUpcomingEventsFromGoogle()
  const newEvents = allEvents.filter(
    (eventFromGoogle) => knownEventsByGoogleId[eventFromGoogle.id] == undefined
  )

  if (!newEvents.length) {
    console.log('No new events found')
    return knownEvents
  } else {
    console.log(`${newEvents.length} new event(s) found. Creating`)
    await createNewTours(newEvents)
    const updatedKnownEvents = await getUpcomingEventsFromLocalDatabase()
    return updatedKnownEvents
  }
}
