import DefaultErrorPage from 'next/error'
import Router from 'next/router'
import NewTourBooking from '../../components/new-tour-booking'

const Page = ({ tourId }) => {
  if (!tourId) {
    return <DefaultErrorPage statusCode={404} />
  }

  return <NewTourBooking tourId={tourId} />
}

export async function getServerSideProps(context) {
  const { tourId } = context.query
  return { props: { tourId } }
}

export default Page

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
