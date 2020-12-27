import Router from 'next/router'
import Link from 'next/link'
import { getUpcomingTours } from '../../db/bookingDb'
import DefaultErrorPage from 'next/error'
import { parseISO, format } from 'date-fns'
import Cookies from 'cookies'

export default function Tours({ accessGranted, upcommingTours }) {
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
            <th>More</th>
          </tr>
        </thead>
        <tbody>
          {upcommingTours.map((t) => {
            return (
              <tr key={t.tourId}>
                <td className="border px-4 py-2">{t.summary}</td>
                <td className="border px-4 py-2">
                  {format(parseISO(t.start), 'EEEE MMMM do yyyy - h:mm a OOOO')}
                </td>
                <td className="border px-4 py-2">
                  <Link href={'/admin/tours/' + t.tourId}>More</Link>
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
    return { props: { accessGranted: false, upcommingTours: null } }
  }

  if (access === process.env.ADMIN_ACCESS) {
    cookies.set('edenaccess', access)
  }

  const upcommingTours = await getUpcomingTours()

  return { props: { accessGranted: true, upcommingTours } }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
