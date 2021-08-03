import Router from 'next/router'
import Link from 'next/link'
import { getBookingRecordsForTour, getTour } from '../../../db/bookingDb'
import Cookies from 'cookies'
import Error from '../../_error'
import {
  groupBookingsByBookingId,
  aggregateBookingRecords,
} from '../../../aggregates/booking'
import { buildCombinedFixedTimeString } from '../../../utils/tour-dates'
import { uniq } from 'ramda'
import { useState } from 'react'
import AdminMenu from '../../../components/admin-menu'

export default function Bookings({
  accessGranted,
  bookings,
  separator,
  tourId,
  tourLabel,
  tourDate,
}) {
  const [values, setValues] = useState({ hideCancelled: true })

  if (!accessGranted) {
    return <Error statusCode={401} title="Yasak!" />
  }

  if (tourId == null) {
    return <Error statusCode={404} title="Hiç bir şey!" />
  }

  const emails = `mailto:?bcc=${uniq(
    bookings
      .filter((b) => b.eventType !== 'cancelled' && b.participantCount > 0)
      .map((b) => b.email)
  ).join(separator)}`

  return (
    <div className="px-10 pt-5 mb-20 flex flex-col content-center">
      <div className="flex flex-row-reverse mb-4">
        <AdminMenu />
      </div>
      <div className="mx-auto text-center mb-5">
        <h2>Bookings</h2>
        <h3>{tourLabel}</h3>
        <h3>{tourDate}</h3>
      </div>
      <div className="w-full flex flex-row my-3">
        <a
          href={emails}
          target="_blank"
          className="bg-yellow-200 no-underline text-black text-xs font-semibold py-3 mt-1 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
        >
          Email everyone
        </a>
        <div className="ml-5 mt-1 bg-yellow-200 py-3 px-4 text-xs font-semibold rounded-lg shadow-md hover:bg-yellow-400">
          <input
            type="checkbox"
            id="hideCancelledCBox"
            checked={values.hideCancelled}
            value={values.hideCancelled}
            onChange={(e) => {
              setValues({ ...values, hideCancelled: !values.hideCancelled })
            }}
          />
          <label htmlFor="hideCancelledCBox" className="ml-2">
            Hide Cancelled
          </label>
        </div>
        <a
          href={`/book/${tourId}`}
          target="_blank"
          className="bg-yellow-200 no-underline text-black text-xs font-semibold py-3 mt-1 ml-5 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
        >
          Create Booking
        </a>
      </div>
      <div>
        <table className="mx-auto">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Group name</th>
              <th>About group</th>
              <th>Participant Count</th>
              <th>Timezone</th>
              <th>Latest Action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              if (values.hideCancelled && booking.eventType == 'cancelled')
                return null

              return (
                <tr key={booking.bookingId}>
                  <td className="border px-4 py-2">{booking.bookerName}</td>
                  <td className="border px-4 py-2">
                    <a href={'mailto:' + booking.email}>{booking.email}</a>
                  </td>
                  <td className="border px-4 py-2">{booking.groupName}</td>
                  <td className="border px-4 py-2">{booking.groupDetails}</td>
                  <td className="border px-4 py-2">
                    {booking.participantCount}
                  </td>
                  <td className="border px-4 py-2">{booking.userTimeZone}</td>
                  <td className="border px-4 py-2">{booking.eventType}</td>
                  <td className="border px-4 py-2 text-xs">
                    <Link
                      href={`/book/${tourId}?admin=true&bid=${booking.bookingId}`}
                    >
                      <a
                        className="mt-4 mr-3 bg-gray-200 no-underline text-black text-xs font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
                        title="Modify booking"
                      >
                        ✏️
                      </a>
                    </Link>
                    <br />
                    <br />
                    <Link href={`/admin/booking/${booking.bookingId}/emails`}>
                      <a
                        className="mt-4 mr-3 bg-gray-200 no-underline text-black text-xs font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
                        title="View Emails"
                      >
                        ✉️
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
  const { tourId, access, sep } = context.query

  let separator = sep || ';'

  context.req.connection.encrypted = true
  const cookies = new Cookies(context.req, context.res)
  const accessCookie = cookies.get('edenaccess')
  if (
    access != process.env.ADMIN_ACCESS &&
    accessCookie != process.env.ADMIN_ACCESS
  ) {
    return { props: { accessGranted: false, bookings: null } }
  }

  if (access === process.env.ADMIN_ACCESS) {
    cookies.set('edenaccess', access, { maxAge: 90 * 24 * 60 * 60 * 60, secure: true, sameSite: 'strict' })
  }

  const tour = await getTour(tourId)

  if (tour == undefined) {
    return {
      props: {
        accessGranted: true,
        bookings: [],
        separator,
        tourId: null,
        tourLabel: null,
        tourDate: null,
      },
    }
  }

  const bookingRecords = await getBookingRecordsForTour(tourId)
  const bookingRecordsByBooking = groupBookingsByBookingId(bookingRecords)
  const bookings = Object.keys(bookingRecordsByBooking).map((bookingId) =>
    aggregateBookingRecords(bookingRecordsByBooking[bookingId])
  )

  let tourLabel = tour.summary
  let tourDate = buildCombinedFixedTimeString(tour.start.toISOString())

  return {
    props: {
      accessGranted: true,
      bookings,
      separator,
      tourId,
      tourLabel,
      tourDate,
    },
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
