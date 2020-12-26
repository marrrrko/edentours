const { google } = require('googleapis')

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

export async function getUpcomingEvents() {
  const response = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 25,
    orderBy: 'startTime'
  })

  return response.data.items.map(parseGoogleCalendarResponse)
}

export function parseGoogleCalendarResponse(calendarItem) {
  return {
    id: calendarItem.id,
    summary: calendarItem.summary,
    description: calendarItem.description,
    start: calendarItem.start.dateTime,
    end: calendarItem.end.dateTime,
    creatorEmail: calendarItem.creator.email,
    etag: calendarItem.etag
  }
}
