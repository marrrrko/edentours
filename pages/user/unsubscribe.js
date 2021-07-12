import Router from 'next/router'
import Error from '../_error'
import { getAction } from '../../db/bookingDb'

export default function Tours({ accessGranted, errorMsg }) {
  if (!accessGranted || errorMsg) {
    return <Error statusCode={401} title="Yasak!" />
  }
  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4 mt-10">
      <h2 className="my-5">Unsubscribe</h2>
      <p>Still working on this. Please email info@eden.tours</p>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { action } = context.query

  if (!action) {
    return { props: { accessGranted: false } }
  }

  let actionData = await getAction(action)
  if (!actionData) return { props: { errorMsg: 'Invalid action' } }
  const { actionType, actionTarget, expiration } = actionData
  if (
    actionType != 'unsubscribe' ||
    (expiration && new Date(expiration) < new Date())
  ) {
    return { props: { errorMsg: 'Invalid action' } }
  } else {
    return {
      props: { accessGranted: true }
    }
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
