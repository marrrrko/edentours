import Router from 'next/router'
import Link from 'next/link'
import { getUpcomingBookings } from '../../db/bookingDb'
import Error from '../_error'
import { buildCombinedFixedTimeString } from '../../utils/tour-dates'
import Cookies from 'cookies'
import { indexToursAndBookings } from '../../aggregates/booking'
import { uniq } from 'ramda'
import { useState, useEffect } from 'react'
import cookie from 'cookie'
import {
  synchronizeToursWithGoogle,
  getInvalidEvents,
  getOrphanEvents,
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
  orphanEvents,
}) {
  if (!accessGranted) {
    return <Error statusCode={401} title="Yasak!" />
  }

  const [filterData, setFilterData] = useState('none')

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
      {orphanEvents.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm text-red-700">
            The following tours are missing from Google.
          </h3>
          {orphanEvents.map((orphanEvent) => {
            return (
              <div
                key={orphanEvent.eventId}
                className="w-3/4 ml-8 text-xs mt-4 bg-gray-200 p-3 rounded"
              >
                Date: {orphanEvent.date} <br />
                Creator: {orphanEvent.creator} <br />
                Summary: {orphanEvent.summary} <br />
                Issue: {orphanEvent.issue}
              </div>
            )
          })}
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
              return (
                <tr
                  key={t.tour.tourId}
                  className={
                    filterData == 'all' || t.tour.creatorEmail == filterData
                      ? ''
                      : 'hidden'
                  }
                  title={JSON.stringify(t.tour, null, ' ')}
                >
                  <td className="border px-4 py-2">{t.tour.summary}</td>
                  <td className="border px-4 py-2">{t.tour.language}</td>
                  <td className="border px-4 py-2">
                    {capitalize(t.tour.guideId)}
                  </td>
                  <td className="border px-4 py-2">{t.startString}</td>
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
  const { access } = context.query

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
    cookies.set('edenaccess', access)
  }

  const toursAndBookings = await getUpcomingBookings()
  const upcomingToursAndBookings = indexToursAndBookings(toursAndBookings).map(
    (tb) => {
      return {
        ...tb,
        startString: buildCombinedFixedTimeString(tb.tour.start),
      }
    }
  )

  const invalidEvents = await getInvalidEvents()
  const orphanEvents = await getOrphanEvents()

  return {
    props: {
      accessGranted: true,
      upcomingToursAndBookings,
      invalidEvents,
      orphanEvents,
    },
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
