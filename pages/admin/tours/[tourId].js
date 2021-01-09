import Router from 'next/router'
import Link from 'next/link'
import { getBookings, getTour } from '../../../db/bookingDb'
import DefaultErrorPage from 'next/error'
import Cookies from 'cookies'
import {
  groupBookingsByBookingId,
  aggregateBookingRecords
} from '../../../aggregates/booking'
import { buildCombinedFixedTimeString } from '../../../utils/tour-dates'

export default function Bookings({
  accessGranted,
  bookings,
  separator,
  tourId,
  tourLabel,
  tourDate
}) {
  if (!accessGranted) {
    return <DefaultErrorPage statusCode={401} />
  }

  const emails = `mailto:?bcc=${bookings.map((b) => b.email).join(separator)}`

  return (
    <div className="px-10 pt-8 flex flex-col content-center">
      <div>
        <h2>Bookings</h2>
        <h3>{tourLabel}</h3>
        <h3>{tourDate}</h3>
      </div>
      {bookings.length > 0 && (
        <div className="block my-8">
          <a
            href={emails}
            target="_blank"
            className="bg-yellow-200 no-underline text-black text-xs font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
          >
            Email everyone
          </a>
        </div>
      )}
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
              <th>Modify</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              return (
                <tr key={booking.bookingId}>
                  <td className="border px-4 py-2">{booking.bookerName}</td>
                  <td className="border px-4 py-2">{booking.email}</td>
                  <td className="border px-4 py-2">{booking.groupName}</td>
                  <td className="border px-4 py-2">{booking.groupDetails}</td>
                  <td className="border px-4 py-2">
                    {booking.participantCount}
                  </td>
                  <td className="border px-4 py-2">{booking.userTimeZone}</td>
                  <td className="border px-4 py-2">{booking.eventType}</td>
                  <td className="border px-4 py-2">
                    <Link
                      href={`/book/${tourId}?admin=true&bid=${booking.bookingId}`}
                    >
                      Modify
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

  const cookies = new Cookies(context.req, context.res)
  const accessCookie = cookies.get('edenaccess')
  if (
    access != process.env.ADMIN_ACCESS &&
    accessCookie != process.env.ADMIN_ACCESS
  ) {
    return { props: { accessGranted: false, bookings: null } }
  }

  if (access === process.env.ADMIN_ACCESS) {
    cookies.set('edenaccess', access)
  }

  const tour = await getTour(tourId)
  const bookingRecords = await getBookings(tourId)
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
      tourDate
    }
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
