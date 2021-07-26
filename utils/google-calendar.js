import { google } from 'googleapis'
import * as NodeCache from 'node-cache'
import { getUpcomingTours, createNewTours, updateTour } from '../db/bookingDb'
import { getAllTourPrograms } from '../db/tour-programs'
import { getAllGuides } from '../db/tour-guides'
import languageData from '../languages.json'
const googleEventCache = new NodeCache()
const invalidEventsCache = new NodeCache()
const eventsCacheKey = 'googleevents'
const validLanguages = languageData.languages.map((l) => l.code)

const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_KEY,
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
    orderBy: 'startTime',
  })

  const freshValues = response.data.items.map(parseGoogleCalendarResponse)

  googleEventCache.set(eventsCacheKey, freshValues, cacheMinutes * 60)

  return freshValues
}

function isValidTour(googleEvent) {
  let validationErrorMessage = [
    'Calendar event must have summary and start time',
  ]
  let isValid = googleEvent.id && googleEvent.summary && googleEvent.start

  if (isValid)
    validationErrorMessage = [
      `Calendar event must start with "Tour:" and contain exactly two "/" characters`,
    ]

  const cleanedSummary = googleEvent.summary.trim().toLowerCase()
  isValid =
    isValid &&
    cleanedSummary.startsWith('tour:') &&
    cleanedSummary.replace('tour:', '').split('/').length == 3

  if (isValid) {
    validationErrorMessage = [
      `Invalid event description or missing configuration:`,
    ]
    const [programId, language, guideId] = cleanedSummary
      .replace('tour:', '')
      .split('/')
      .map((p) => {
        return p.trim()
      })

    const validProgramId =
      validTourPrograms.map((tp) => tp._id).indexOf(programId) != -1
    if (!validProgramId)
      validationErrorMessage.push(`Unknown tour program id (${programId}).`)
    const validGuide =
      validTourGuides.map((tg) => tg._id).indexOf(guideId) != -1
    if (!validGuide)
      validationErrorMessage.push(`Unknown guide id (${guideId}).`)
    const validLanguage = validLanguages.indexOf(language) != -1
    if (!validLanguage)
      validationErrorMessage.push(`Unknown language (${language}).`)
    const labelForLanguageExists =
      !validProgramId ||
      validTourPrograms
        .filter((tp) => tp._id === programId)[0]
        .labels.filter((l) => l.language === language).length
    if (!labelForLanguageExists)
      validationErrorMessage.push(`Missing label for language (${language}).`)
    isValid =
      isValid &&
      validProgramId &&
      validGuide &&
      validLanguage &&
      labelForLanguageExists
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
        issue: validationErrorMessage.join(' '),
      },
    })
    console.log(
      `Skipping invalid event "${
        googleEvent.summary
      }" from google: ${validationErrorMessage.join(' ')}`
    )
  } else if (invalidEvents[googleEvent.id]) {
    delete invalidEvents[googleEvent.id]
    invalidEventsCache.set('invalid-events', invalidEvents)
  }
  console.log(`Found ${Object.keys(invalidEvents).length} invalid events`)

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

  const tourProgram = validTourPrograms.filter((tp) => tp._id === programId)[0]
  const matchingLanguageTours = tourProgram.labels.filter(
    (l) => l.language === language
  )
  const label = matchingLanguageTours[0].label

  return {
    ...googleEvent,
    summary: label,
    programId,
    language,
    guideId,
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
    location: calendarItem.location,
  }
}

let validTourGuides = []
let validTourPrograms = []
let lastTourProgramDataRefresh = 0
async function refreshTourProgramData(cacheMinutes = 1) {
  const nowSeconds = Math.ceil(new Date().getTime() / 1000)
  const refreshNeeded =
    (nowSeconds - lastTourProgramDataRefresh) / 60 > cacheMinutes

  if (refreshNeeded) {
    validTourPrograms = await getAllTourPrograms()
    validTourGuides = await getAllGuides()
    lastTourProgramDataRefresh = nowSeconds
  }
}

export async function synchronizeToursWithGoogle(cacheMinutes) {
  const scheduledTours = await getUpcomingTours()
  const scheduledToursByGoogleId = scheduledTours.reduce((acc, next) => {
    acc[next.externalEventId] = next
    return acc
  }, {})
  await refreshTourProgramData(cacheMinutes)
  const toursFromGoogle = (await getUpcomingEventsFromGoogle(cacheMinutes))
    .filter(isValidTour)
    .map(eventToTour)

  const newTours = toursFromGoogle.filter(
    (eventFromGoogle) =>
      scheduledToursByGoogleId[eventFromGoogle.id] == undefined
  )
  const toursToUpdate = toursFromGoogle.filter((tourFromGoogle) => {
    const existingTour = scheduledToursByGoogleId[tourFromGoogle.id]
    if (!existingTour) return false
    return existingTour.etag != tourFromGoogle.etag
  })

  const toursFromGoogleByGoogleId = toursFromGoogle.reduce((acc, next) => {
    acc[next.id] = next
    return acc
  }, {})
  const invalidTourIds = Object.keys(
    invalidEventsCache.get('invalid-events') || {}
  )
  const orphanTours = scheduledTours
    .filter((existingTour) => {
      return toursFromGoogleByGoogleId[existingTour.externalEventId] == null
    })
    .filter((e) => invalidTourIds.indexOf(e.externalEventId) === -1)

  invalidEventsCache.set('orphan-events', orphanTours)
  console.log(`Found ${orphanTours.length} orphan events`)

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
            programId: tourFromGoogle.programId,
            language: tourFromGoogle.language,
            guideId: tourFromGoogle.guideId,
            start: tourFromGoogle.start,
            end: tourFromGoogle.end,
            etag: tourFromGoogle.etag,
            description: tourFromGoogle.description,
            location: tourFromGoogle.location,
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

export async function getOrphanEvents() {
  const orphans = invalidEventsCache.get('orphan-events') || []
  return orphans
}
