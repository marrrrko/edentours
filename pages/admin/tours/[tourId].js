import Router from 'next/router'
import { getBookings } from '../../../db/bookingDb'
import { parseISO, format } from 'date-fns'
import DefaultErrorPage from 'next/error'
import Cookies from 'cookies'

export default function Bookings({ accessGranted, bookings }) {
  if (!accessGranted) {
    return <DefaultErrorPage statusCode={401} />
  }

  return (
    <div className="px-10 pt-8">
      <h2>Bookings</h2>
      <table className="tablet-auto">
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
          {bookings.map((t) => {
            return (
              <tr key={t.bookingId}>
                <td className="border px-4 py-2">{t.eventType}</td>
                <td className="border px-4 py-2">
                  {format(parseISO(t.eventTime), 'MM/dd/yy - h:mm a OOOO')}
                </td>
                <td className="border px-4 py-2">{t.bookerName}</td>
                <td className="border px-4 py-2">{t.email}</td>
                <td className="border px-4 py-2">{t.groupName}</td>
                <td className="border px-4 py-2">{t.groupDetails}</td>
                <td className="border px-4 py-2">{t.participantCount}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { tourId, access } = context.query

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

  return { props: { accessGranted: true, bookings } }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
