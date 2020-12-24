import DefaultErrorPage from 'next/error'
import Router from 'next/router'
import NewTourBooking from '../../components/new-tour-booking'

const Page = (props) => {
  if (!props.tourInfo) {
    return <DefaultErrorPage statusCode={404} />
  }

  return <NewTourBooking tourInfo={props.tourInfo} />
}

export async function getServerSideProps(context) {
  const { tourId } = context.query
  console.log(`Context: ${JSON.stringify(context.query)}`)

  const tourInfo = { id: tourId }

  return { props: { tourInfo } }
}

export default Page

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
