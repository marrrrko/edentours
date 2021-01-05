import Router from 'next/router'
import { getBookings } from '../../../db/bookingDb'
import { parseISO, format } from 'date-fns'
import DefaultErrorPage from 'next/error'
import Cookies from 'cookies'

export default function Bookings({ accessGranted, bookings, separator }) {
  if (!accessGranted) {
    return <DefaultErrorPage statusCode={401} />
  }

  const emails = `mailto:?bcc=${bookings.map((b) => b.email).join(separator)}`

  return (
    <div className="px-10 pt-8 flex flex-col content-center">
      <div>
        <h2>Bookings</h2>
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
              <th>Action</th>
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Group name</th>
              <th>About group</th>
              <th>Participant Count</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              return (
                <tr key={booking.bookingId}>
                  <td className="border px-4 py-2">{booking.eventType}</td>
                  <td className="border px-4 py-2">
                    {format(
                      parseISO(booking.eventTime),
                      'MM/dd/yy - h:mm a zzzz'
                    )}
                  </td>
                  <td className="border px-4 py-2">{booking.bookerName}</td>
                  <td className="border px-4 py-2">{booking.email}</td>
                  <td className="border px-4 py-2">{booking.groupName}</td>
                  <td className="border px-4 py-2">{booking.groupDetails}</td>
                  <td className="border px-4 py-2">
                    {booking.participantCount}
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

  const bookings = await getBookings(tourId)

  return { props: { accessGranted: true, bookings, separator } }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
