import Router from 'next/router'
import Link from 'next/link'
import { getUpcomingBookings } from '../../db/bookingDb'
import Error from '../_error'
import { buildCombinedFixedTimeString } from '../../utils/tour-dates'
import Cookies from 'cookies'
import { indexToursAndBookings } from '../../aggregates/booking'
import { uniq } from 'ramda'
import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import cookie from 'cookie'
import {
  synchronizeToursWithGoogle,
  getInvalidEvents,
  getOrphanEvents
} from '../../utils/google-calendar'
import AdminMenu from '../../components/admin-menu'

const DEFAULT_MAX_ENROLLMENT = process.env.DEFAULT_MAX_ENROLLMENT || 82

function getCookieValue(key, defaultValue) {
  const value = cookie.parse(document.cookie)
  return value[key] ?? defaultValue
}

const capitalize = (word) =>
  word && word.length ? `${word[0].toUpperCase()}${word.slice(1)}` : ''

const filterCookieName = 'edenadminguidefilter'


export default function Events({
  accessGranted,
  upcomingToursAndBookings,
  invalidEvents,
  orphanEventIds
}) {
  if (!accessGranted) {
    return <Error statusCode={401} title="Yasak!" />
  }

  const [tourToCancel, setTourToCancel] = useState(null)
  const [tourToRestore, setTourToRestore] = useState(null)
  const [filterData, setFilterData] = useState('none')

  useEffect(() => {

    async function cancelTour(tourId) {
      setTourToCancel(null)
      if(confirm(`Cancel tour? The tour will be hidden from the site (but not deleted)`)) {
        let response = await fetch('/api/events/' + tourId, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }        
        })        
        if (response.ok) {          
          location.reload()
        } else {
          alert('Failed to cancel')
        }
      }
    }

    if(tourToCancel) cancelTour(tourToCancel)

  }, [tourToCancel])

  useEffect(() => {

    async function restoreTour(tourId) {
      setTourToRestore(null)
      if(confirm(`Restore tour? The tour will become visible on the site again.`)) {
        let response = await fetch(`/api/events/${tourId}?restore=true`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }        
        })        
        if (response.ok) {          
          location.reload()
        } else {
          alert('Failed to restore')
        }
      }
    }

    if(tourToRestore) restoreTour(tourToRestore)

  }, [tourToRestore])

  useEffect(() => {
    let existingValueFromCookie = getCookieValue(filterCookieName, 'all')
    setFilterData(existingValueFromCookie)
  }, [])

  const guides = uniq(upcomingToursAndBookings.map((t) => t.tour.creatorEmail))

  const handleFilterChange = (e) => {
    document.cookie = cookie.serialize(filterCookieName, e.target.value)
    setFilterData(e.target.value)
  }

  return (
    <div className="px-10 mt-5 mb-20 w-full flex flex-col">
      <div className="flex flex-row-reverse">
        <AdminMenu />
      </div>
      <h2 className="mx-auto">Upcoming Events</h2>
      <div className="flex flex-row content-center">
        <select
          className="inline-block w-64  mx-auto mt-4 p-2 rounded"
          onChange={handleFilterChange}
          value={filterData}
        >
          <option value="all" className="py-2">
            All Guides
          </option>
          {guides.map((g) => {
            return (
              <option key={g} value={g} className="py-2">
                {g}
              </option>
            )
          })}
        </select>
      </div>
      {invalidEvents.length > 0 && (
        <div className="flex-col mt-5">
          <div>
            <h3 className="text-sm text-red-700 text-center">
              The following calendar events were not imported/updated because
              they are not correctly formatted. Please correct them in the
              Google calendar.
            </h3>
          </div>
          {invalidEvents.map((invalidEvent) => {
            return (
              <div
                key={invalidEvent.eventId}
                className="w-3/4 mx-auto text-xs mt-4 bg-gray-200 p-3 rounded"
              >
                Date: {invalidEvent.date} <br />
                Creator: {invalidEvent.creator} <br />
                Summary: {invalidEvent.summary} <br />
                Issue: {invalidEvent.issue}
              </div>
            )
          })}
          <div className="mt-8 mb-12">
            <div className="text-center">
              Required Calendar Format:
              <br />
              <span className="font-mono p-1 bg-yellow-200 rounded-sm">
                Tour: &lt;program id&gt; / &lt;language code&gt; / &lt;guide
                id&gt;
              </span>
            </div>
            <div className="text-center mt-2">
              Example:
              <br />
              <span className="font-mono p-1 bg-yellow-200 rounded-sm">
                Tour: seven / it / stefania
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-row content-center mt-5">
        <table className="table-auto mx-auto">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Lang</th>
              <th>Guide</th>
              <th>Date</th>
              <th>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {upcomingToursAndBookings.map((t) => {
              const hasValidEnrollmentOverride =
                t.tour.location &&
                parseInt(t.tour.location) == t.tour.location &&
                parseInt(t.tour.location) > 0
              const maxEnrollment = hasValidEnrollmentOverride
                ? parseInt(t.tour.location)
                : parseInt(DEFAULT_MAX_ENROLLMENT)

              const isCancelled = !!t.tour.cancelled
              const isOrphaned = orphanEventIds.find(oe => oe === t.tour.tourId) != null

              return (
                <tr
                  key={t.tour.tourId}
                  className={`${
                    filterData == 'all' || t.tour.creatorEmail == filterData
                      ? ''
                      : 'hidden'
                  } ${!isCancelled && isOrphaned ? 'text-red-400' : ''}`}                  
                >
                  <td className={`border px-4 py-2`}>
                    {t.tour.summary}
                    {!isCancelled && isOrphaned && (<div className="text-xs">Not found in calendar. <a className="cursor-pointer" onClick={() => setTourToCancel(t.tour.tourId)}>Cancel tour</a></div>)}
                    {isCancelled && (<div className="text-xs font-bold">(cancelled) {!isOrphaned && <a className="cursor-pointer" onClick={() => setTourToRestore(t.tour.tourId)}>Restore tour</a>}</div>)}
                    </td>
                  <td className="border px-4 py-2">{t.tour.language}</td>
                  <td className="border px-4 py-2">
                    {capitalize(t.tour.guideId)}
                  </td>
                  <td className={`border px-4 py-2 ${isCancelled ? 'line-through' : ''}`}>{t.startString}</td>
                  <td className="border px-4 py-2 text-center w-40 text-lg">
                    <Link href={'/admin/tours/' + t.tour.tourId}>
                      <a>
                        {t.currentParticipantTotal} / {maxEnrollment}
                        <br />
                        <span className="text-xs">
                          ({t.currentGroupTotal} groups)
                        </span>
                      </a>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { access, sinceDays } = context.query

  await synchronizeToursWithGoogle(0.25)

  const cookies = new Cookies(context.req, context.res)
  const accessCookie = cookies.get('edenaccess')
  if (
    access != process.env.ADMIN_ACCESS &&
    accessCookie != process.env.ADMIN_ACCESS
  ) {
    return { props: { accessGranted: false } }
  }

  if (access === process.env.ADMIN_ACCESS) {
    cookies.set('edenaccess', access, { maxAge: 90 * 24 * 60 * 60 * 60 })
  }

  let sinceDate = null
  if(sinceDays && sinceDays == parseInt(sinceDays) && sinceDays > 0) {
    sinceDate = DateTime.now().minus({ days: parseInt(sinceDays)}).toJSDate()
  }
  const toursAndBookings = await getUpcomingBookings(null, sinceDate)
  const upcomingToursAndBookings = indexToursAndBookings(toursAndBookings).map(
    (tb) => {
      return {
        ...tb,
        startString: buildCombinedFixedTimeString(tb.tour.start)
      }
    }
  )

  const invalidEvents = await getInvalidEvents()
  const orphanEventIds = (await getOrphanEvents()).map(oe => oe.tourId)

  return {
    props: {
      accessGranted: true,
      upcomingToursAndBookings,
      invalidEvents,
      orphanEventIds
    }
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
