import { google } from 'googleapis'
import * as NodeCache from 'node-cache'
import { getUpcomingTours, createNewTours, updateTour } from '../db/bookingDb'

const eventCache = new NodeCache()
const eventsCacheKey = 'googleevents'

const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_KEY
})

export async function getEventInfo(eventId) {
  const response = await calendar.events.get({
    calendarId: process.env.CALENDAR_ID,
    eventId: eventId
  })

  if (!response || !response.data) {
    return null
  }

  return parseGoogleCalendarResponse(response.data)
}

export async function getUpcomingEventsFromGoogle(cacheMinutes = 5) {
  let cachedValues = eventCache.get(eventsCacheKey)
  if (cacheMinutes > 0 && cachedValues) {
    return cachedValues
  }

  const response = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 25,
    orderBy: 'startTime'
  })

  const freshValues = response.data.items
    .map(parseGoogleCalendarResponse)
    .filter((event) => event.summary.trim().toLowerCase().startsWith('tour:'))
    .map((event) => ({
      ...event,
      summary: event.summary.trim().slice(5).trim()
    }))

  eventCache.set(eventsCacheKey, freshValues, cacheMinutes * 60)

  return freshValues
}

export function parseGoogleCalendarResponse(calendarItem) {
  return {
    id: calendarItem.id,
    summary: calendarItem.summary,
    description: calendarItem.description,
    start: calendarItem.start.dateTime,
    end: calendarItem.end.dateTime,
    creatorEmail: calendarItem.creator.email,
    etag: calendarItem.etag,
    location: calendarItem.location
  }
}

export async function synchronizeToursWithGoogle(cacheMinutes) {
  const scheduledTours = await getUpcomingTours()
  const scheduledToursByGoogleId = scheduledTours.reduce((acc, next) => {
    acc[next.externalEventId] = next
    return acc
  }, {})
  const allEventsFromGoogle = await getUpcomingEventsFromGoogle(cacheMinutes)
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
