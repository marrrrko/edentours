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

function getTourStartInterval(tourStart) {
  const now = DateTime.local()
  const tourStartDt = DateTime.fromISO(tourStart)
  let isPast = now < tourStartDt

  let start = isPast ? now : tourStartDt
  let end = isPast ? tourStartDt : now

  let intervalObject = Interval.fromDateTimes(start, end)
    .toDuration(['days', 'hours', 'minutes', 'seconds'])
    .toObject()

  return {
    ...intervalObject,
    isPast
  }
}

const Page = ({ tourLabel, tourStart, errorMsg }) => {
  if (!tourStart || errorMsg) {
    return <Error statusCode={404} title="Hiç bir şey!" />
  }

  const [timeStrings, setTimeStrings] = useState(null)
  const [timeLeft, setTimeLeft] = useState(getTourStartInterval(tourStart))
  const timer = useRef(null) // we can save timer in useRef and pass it to child

  useEffect(() => {
    //window.DateTime = DateTime
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimeStrings(createTimeStrings(tourStart, userTimeZone))
    timer.current = setInterval(
      () => setTimeLeft(getTourStartInterval(tourStart)),
      1000
    )
    console.log(JSON.stringify(timeLeft, null, ' '))
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
        {timeLeft.isPast == true && (
          <h2 className="text-2xl mb-4">Tour will start in exactly</h2>
        )}
        {timeLeft.isPast == false && (
          <h2 className="text-2xl mb-4">Tour already started</h2>
        )}

        <div>
          <span className="text-6xl">{timeLeft.days}</span>
          <span className="text-xl ml-2">
            {timeLeft.days == 1 ? 'day' : 'days'}
          </span>
        </div>
        <div>
          <span className="text-6xl">{timeLeft.hours}</span>
          <span className="text-xl ml-2">
            {timeLeft.hours == 1 ? 'hour' : 'hours'}
          </span>
        </div>
        <div>
          <span className="text-6xl">{Math.floor(timeLeft.minutes)}</span>
          <span className="text-xl ml-2">
            {timeLeft.minutes == 1 ? 'minute' : 'minutes'}
          </span>
        </div>
        <div>
          <span className="text-6xl">{Math.floor(timeLeft.seconds)}</span>
          <span className="text-xl ml-2">
            {Math.floor(timeLeft.seconds) == 1 ? 'second' : 'seconds'}
          </span>
        </div>
        {timeLeft.isPast == false && <h2 className="text-2xl mt-8">ago</h2>}
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
