import Router from 'next/router'
import Link from 'next/link'
import { getUpcomingBookings } from '../../db/bookingDb'
import Error from '../_error'
import { buildCombinedFixedTimeString } from '../../utils/tour-dates'
import Cookies from 'cookies'
import { indexToursAndBookings } from '../../aggregates/booking'

export default function Tours({ accessGranted, upcomingToursAndBookings }) {
  if (!accessGranted) {
    return <Error statusCode={401} title="Olmaz!" />
  }
  return (
    <div className="px-10 mt-5 w-full flex flex-col">
      <h2 className="mx-auto">Upcomming Tours</h2>

      <div className="w-full flex flex-row content-center mt-5">
        <table className="table-auto mx-auto">
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
                  <td className="border px-4 py-2">{t.startString}</td>
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

  const toursAndBookings = await getUpcomingBookings()
  const upcomingToursAndBookings = indexToursAndBookings(toursAndBookings).map(
    (tb) => ({
      ...tb,
      startString: buildCombinedFixedTimeString(tb.tour.start)
    })
  )

  return { props: { accessGranted: true, upcomingToursAndBookings } }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
