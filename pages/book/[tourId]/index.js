import Error from '../../_error'
import Router from 'next/router'
import NewTourBooking from '../../../components/booking-new'
import ExistingTourBooking from '../../../components/booking-existing'
import { getAction, getBookingRecords } from '../../../db/bookingDb'
import { aggregateBookingRecords } from '../../../aggregates/booking'
import Cookies from 'cookies'

const Page = ({ tourId, errorMsg, preexistingBooking, actionKey }) => {
  if (!tourId || errorMsg) {
    return <Error statusCode={404} title="Hiç bir şey!" />
  }

  if (preexistingBooking) {
    return (
      <ExistingTourBooking booking={preexistingBooking} actionKey={actionKey} />
    )
  }

  return <NewTourBooking tourId={tourId} />
}

export async function getServerSideProps(context) {
  const { tourId, action, admin, bid } = context.query

  if (admin && bid) {
    const cookies = new Cookies(context.req, context.res)
    const accessCookie = cookies.get('edenaccess')
    if (accessCookie != process.env.ADMIN_ACCESS) {
      return { props: { errorMsg: "You're not an admin!" } }
    }
    let booking = aggregateBookingRecords(await getBookingRecords(bid))
    if (booking.tourId != tourId) {
      return { props: { errorMsg: 'Invalid action' } }
    }
    return {
      props: { tourId, preexistingBooking: booking, actionKey: 'admin' }
    }
  }

  if (action) {
    let actionData = await getAction(action)
    if (!actionData) return { props: { errorMsg: 'Invalid action' } }
    const { actionType, actionTarget, expiration } = actionData
    if (
      actionType != 'modify-booking' ||
      (expiration && new Date(expiration) < new Date())
    ) {
      return { props: { errorMsg: 'Invalid action' } }
    } else {
      let booking = aggregateBookingRecords(
        await getBookingRecords(actionTarget)
      )
      if (booking.tourId != tourId) {
        return { props: { errorMsg: 'Invalid action' } }
      }
      return {
        props: { tourId, preexistingBooking: booking, actionKey: action }
      }
    }
  }

  return { props: { tourId } }
}

export default Page

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
