import Router from 'next/router'
import Link from 'next/link'
import { getUpcomingBookings } from '../../db/bookingDb'
import DefaultErrorPage from 'next/error'
import { parseISO, format } from 'date-fns'
import Cookies from 'cookies'

export default function Tours({ accessGranted, upcomingToursAndBookings }) {
  if (!accessGranted) {
    return <DefaultErrorPage statusCode={401} />
  }

  return (
    <div className="px-10">
      <h2>Tours</h2>
      <table className="tablet-auto">
        <thead>
          <tr>
            <th>Tour</th>
            <th>Date</th>
            <th>Groups</th>
            <th>Participants</th>
            <th>More</th>
          </tr>
        </thead>
        <tbody>
          {upcomingToursAndBookings.map((t) => {
            return (
              <tr key={t.tour.tourId}>
                <td className="border px-4 py-2">{t.tour.summary}</td>
                <td className="border px-4 py-2">
                  {format(
                    parseISO(t.tour.start),
                    'EEEE MMMM do yyyy - h:mm a zzzz'
                  )}
                </td>
                <td className="border px-4 py-2">{t.currentGroupTotal}</td>
                <td className="border px-4 py-2">
                  {t.currentParticipantTotal}
                </td>
                <td className="border px-4 py-2">
                  <Link href={'/admin/tours/' + t.tour.tourId}>More</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { access } = context.query

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

  const upcomingToursAndBookings = await getUpcomingBookings()

  return { props: { accessGranted: true, upcomingToursAndBookings } }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}