import { DateTime } from 'luxon'

export function buildTourDateStrings(
  tourStart,
  userTimeZone,
  fixedTimezone = 'Europe/Istanbul'
) {
  let tourDates = {
    raw: tourStart,
    userTime: {
      day: DateTime.fromISO(tourStart)
        .setZone(userTimeZone)
        .toFormat('DDDD')
        .replace('_', ' '),
      shortday: DateTime.fromISO(tourStart)
        .setZone(userTimeZone)
        .toFormat('LLL-d'),
      time: DateTime.fromISO(tourStart)
        .setZone(userTimeZone)
        .toFormat("t z '(UTC'ZZ')'")
        .replace('_', ' '),
      combined: DateTime.fromISO(tourStart)
        .setZone(userTimeZone)
        .toFormat("ccc LLL d, t z '(UTC'ZZ')'")
        .replace('_', ' ')
    },
    fixedTime: {
      day: DateTime.fromISO(tourStart).setZone(fixedTimezone).toFormat('DDDD'),
      shortday: DateTime.fromISO(tourStart)
        .setZone(fixedTimezone)
        .toFormat('LLL-d'),
      time: DateTime.fromISO(tourStart)
        .setZone(fixedTimezone)
        .toFormat("t z '(UTC'ZZ')'"),
      combined: DateTime.fromISO(tourStart)
        .setZone(fixedTimezone)
        .toFormat("ccc LLL d, t z '(UTC'ZZ')'")
        .replace('_', ' ')
    }
  }
  return tourDates
}

export function buildCombinedFixedTimeString(
  tourStart,
  fixedTimezone = 'Europe/Istanbul'
) {
  return DateTime.fromISO(tourStart)
    .setZone(fixedTimezone)
    .toFormat("ccc LLL d, t z '(UTC'ZZ')'")
    .replace('_', ' ')
}
