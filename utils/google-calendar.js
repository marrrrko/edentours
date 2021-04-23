import { google } from 'googleapis'
import * as NodeCache from 'node-cache'
import { getUpcomingTours, createNewTours, updateTour } from '../db/bookingDb'
import tourConfig from '../data/programs.default.json'

const googleEventCache = new NodeCache()
const invalidEventsCache = new NodeCache()
const eventsCacheKey = 'googleevents'
const validProgramIds = tourConfig.programs.map((t) => t.id)
const validTourGuides = tourConfig.guides.map((g) => g.id)
const validLanguages = [
  'en',
  'fr',
  'es',
  'ar',
  'zh',
  'ru',
  'de',
  'it',
  'ja',
  'el',
  'hi',
  'vi',
  'th',
  'ko',
  'fa'
]
const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_KEY
})

async function getUpcomingEventsFromGoogle(cacheMinutes = 5) {
  let cachedValues = googleEventCache.get(eventsCacheKey)
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

  const freshValues = response.data.items.map(parseGoogleCalendarResponse)

  googleEventCache.set(eventsCacheKey, freshValues, cacheMinutes * 60)

  return freshValues
}

function isValidTour(googleEvent) {
  let validationErrorMessage = 'Calendar event must have summary and start time'
  let isValid = googleEvent.id && googleEvent.summary && googleEvent.start

  if (isValid)
    validationErrorMessage = `Calendar event must start with "Tour:" and contain exactly two "/" characters`

  const cleanedSummary = googleEvent.summary.trim().toLowerCase()
  isValid =
    isValid &&
    cleanedSummary.startsWith('tour:') &&
    cleanedSummary.replace('tour:', '').split('/').length == 3

  if (isValid) {
    validationErrorMessage = `You must specify a known program id, language and guide id.`
    const [programId, language, guideId] = cleanedSummary
      .replace('tour:', '')
      .split('/')
      .map((p) => {
        return p.trim()
      })

    const validProgramId = validProgramIds.indexOf(programId) != -1
    const validGuide = validTourGuides.indexOf(guideId) != -1
    const validLanguage = validLanguages.indexOf(language) != -1
    isValid = isValid && validProgramId && validGuide && validLanguage
  }

  let invalidEvents = invalidEventsCache.get('invalid-events') || {}
  if (!isValid) {
    invalidEventsCache.set('invalid-events', {
      ...invalidEvents,
      [googleEvent.id]: {
        eventId: googleEvent.id,
        summary: googleEvent.summary || null,
        date: googleEvent.date || null,
        creator: googleEvent.creatorEmail,
        issue: validationErrorMessage
      }
    })
    console.log(`Skipping invalid event from google: ${validationErrorMessage}`)
  } else if (invalidEvents[googleEvent.id]) {
    delete invalidEvents[googleEvent.id]
    invalidEventsCache.set('invalid-events', invalidEvents)
  }

  return isValid
}

function eventToTour(googleEvent) {
  const [programId, language, guideId] = googleEvent.summary
    .trim()
    .toLowerCase()
    .replace('tour:', '')
    .split('/')
    .map((p) => {
      return p.trim()
    })

  return {
    ...googleEvent,
    programId,
    language,
    guideId
  }
}

function parseGoogleCalendarResponse(calendarItem) {
  return {
    id: calendarItem.id,
    summary: calendarItem.summary,
    description: calendarItem.description,
    start: calendarItem.start.dateTime,
    date: calendarItem.start.dateTime || calendarItem.start.date,
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
  const toursFromGoogle = (await getUpcomingEventsFromGoogle(cacheMinutes))
    .filter(isValidTour)
    .map(eventToTour)

  console.log(`Tours from G: ${JSON.stringify(toursFromGoogle, null, ' ')}`)
  const newTours = toursFromGoogle.filter(
    (eventFromGoogle) =>
      scheduledToursByGoogleId[eventFromGoogle.id] == undefined
  )
  const toursToUpdate = toursFromGoogle.filter((tourFromGoogle) => {
    const existingTour = scheduledToursByGoogleId[tourFromGoogle.id]
    if (!existingTour) return false
    return existingTour.etag != tourFromGoogle.etag
  })

  if (!newTours.length && !toursToUpdate.length) {
    return
  } else {
    if (newTours.length) {
      global.log.info(`${newTours.length} new event(s) found. Creating.`)
      await createNewTours(newTours)
    }
    if (toursToUpdate.length) {
      global.log.info(
        `${toursToUpdate.length} modified tours(s) found. Updating.`
      )
      await toursToUpdate.reduce(async (previous, tourFromGoogle) => {
        await previous
        let tourToBeUpdated = scheduledToursByGoogleId[tourFromGoogle.id]
        if (tourToBeUpdated && tourFromGoogle) {
          return updateTour(tourToBeUpdated.eventTime, {
            ...tourToBeUpdated,
            summary: tourFromGoogle.summary,
            start: tourFromGoogle.start,
            end: tourFromGoogle.end,
            etag: tourFromGoogle.etag,
            description: tourFromGoogle.description,
            location: tourFromGoogle.location
          })
        } else {
          global.log.info('Missing tour #' + tourToBeUpdated.externalEventId)
          return Promise.resolve()
        }
      }, Promise.resolve())
    }
  }
}

export async function getInvalidEvents() {
  const badEvents = invalidEventsCache.get('invalid-events') || {}
  return Object.values(badEvents)
}
