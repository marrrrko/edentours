const { google } = require('googleapis')
const NodeCache = require('node-cache')

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

export async function getUpcomingEventsFromGoogle(allowCache = true) {
  let cachedValues = eventCache.get(eventsCacheKey)
  if (allowCache && cachedValues) {
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

  eventCache.set(eventsCacheKey, freshValues, 5 * 60)

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
