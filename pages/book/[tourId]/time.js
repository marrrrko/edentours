import Error from '../../_error'
import Router from 'next/router'
import { getTour } from '../../../db/bookingDb'
import { useState, useEffect, useRef } from 'react'
import { DateTime, Interval } from 'luxon'
import BigLoader from '../../../components/big-loader'

const fixedTimezone = 'Europe/Istanbul'

function createTimeStrings(tourStart, userTimeZone) {
  return {
    ourTimeZoneName: DateTime.fromISO(tourStart)
      .setZone(fixedTimezone)
      .toFormat(`z`)
      .replace('_', ' '),
    ourTimeZoneUTC: DateTime.fromISO(tourStart)
      .setZone(fixedTimezone)
      .toFormat(`'UTC'ZZ`)
      .replace('_', ' '),
    ourTimeZoneStartDay: DateTime.fromISO(tourStart)
      .setZone(fixedTimezone)
      .toFormat(`cccc, LLL d`)
      .replace('_', ' '),
    ourTimeZoneStartTime: DateTime.fromISO(tourStart)
      .setZone(fixedTimezone)
      .toFormat(`t`)
      .replace('_', ' '),
    yourTimeZoneName: DateTime.fromISO(tourStart)
      .setZone(userTimeZone)
      .toFormat(`z`)
      .replace('_', ' '),
    yourTimeZoneUTC: DateTime.fromISO(tourStart)
      .setZone(userTimeZone)
      .toFormat(`'UTC'ZZ`)
      .replace('_', ' '),
    yourTimeZoneStartDay: DateTime.fromISO(tourStart)
      .setZone(userTimeZone)
      .toFormat(`cccc, LLL d`)
      .replace('_', ' '),
    yourTimeZoneStartTime: DateTime.fromISO(tourStart)
      .setZone(userTimeZone)
      .toFormat(`t`)
      .replace('_', ' ')
  }
}

const Page = ({ tourLabel, tourStart, errorMsg }) => {
  if (!tourStart || errorMsg) {
    return <Error statusCode={404} title="Hiç bir şey!" />
  }

  const [timeStrings, setTimeStrings] = useState(null)
  const [timeLeft, setTimeLeft] = useState(
    Interval.fromDateTimes(DateTime.utc(), DateTime.fromISO(tourStart))
      .toDuration(['days', 'hours', 'minutes', 'seconds'])
      .toObject()
  )
  const timer = useRef(null) // we can save timer in useRef and pass it to child

  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimeStrings(createTimeStrings(tourStart, userTimeZone))
    timer.current = setInterval(
      () =>
        setTimeLeft((v) =>
          Interval.fromDateTimes(DateTime.utc(), DateTime.fromISO(tourStart))
            .toDuration(['days', 'hours', 'minutes', 'seconds'])
            .toObject()
        ),
      1000
    )
    return () => {
      clearInterval(timer.current)
    }
  }, [])

  if (!timeStrings) {
    return <BigLoader />
  }
  return (
    <div className="w-full md:w-3/5 2xl:w-3/5 mx-auto my-5 px-4 text-center">
      <h1 className="text-4xl mt-10">{tourLabel}</h1>

      <div className="mt-20 mb-20">
        <h2 className="text-2xl">
          Tour Start Time for&nbsp;
          <span className="bg-green-200">&nbsp;your&nbsp;</span>&nbsp;current
          timezone
        </h2>
        <h3 className="text-lg">
          ({timeStrings.yourTimeZoneName} {timeStrings.yourTimeZoneUTC})
        </h3>
        <div className="mt-8">
          <span className="text-4xl mt-10">
            {timeStrings.yourTimeZoneStartDay}
          </span>{' '}
          <br />
          <span className="text-6xl">{timeStrings.yourTimeZoneStartTime}</span>
        </div>
      </div>
      <hr />

      {/* <div className="mt-20 mb-20">
        <h2 className="text-2xl">
          Tour Start in&nbsp;
          <span className="bg-yellow-200">&nbsp;our&nbsp;</span>&nbsp;timezone
        </h2>
        <h3 className="text-lg">
          ({timeStrings.ourTimeZoneName} {timeStrings.ourTimeZoneUTC})
        </h3>
        <div className="mt-8">
          <span className="text-4xl mt-10 mb-0">{timeStrings.ourTimeZoneStartDay}</span>{' '}
          <br />
          <span className="text-6xl">{timeStrings.ourTimeZoneStartTime}</span>
        </div>
      </div> */}
      <hr />
      <div className="mt-20 mb-20">
        <h2 className="text-2xl mb-4">Tour will start in exactly</h2>

        <div>
          <span className="text-6xl">{timeLeft.days}</span>
          <span className="text-xl ml-2">days</span>
        </div>
        <div>
          <span className="text-6xl">{timeLeft.hours}</span>
          <span className="text-xl ml-2">hours</span>
        </div>
        <div>
          <span className="text-6xl">{Math.floor(timeLeft.minutes)}</span>
          <span className="text-xl ml-2">minutes</span>
        </div>
        <div>
          <span className="text-6xl">{Math.floor(timeLeft.seconds)}</span>
          <span className="text-xl ml-2">seconds</span>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { tourId } = context.query

  const tour = await getTour(tourId)

  if (!tour || !tour.start) {
    return { props: { errorMsg: 'Valid tour not found' } }
  }

  const tourLabel = tour.summary
  const tourStart = tour.start.toISOString()

  return { props: { tourLabel, tourStart } }
}

export default Page

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
