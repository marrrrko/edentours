import React from 'react'
import { DateTime } from 'luxon'

export default function TourDates({ dates: tours }) {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const bookingOptions = tours.map((tour, index) => {
    let tourStartDay_user = DateTime.fromISO(tour.start)
      .setZone(userTimeZone)
      .toFormat('DDDD')

    let tourStartTime_user = DateTime.fromISO(tour.start)
      .setZone(userTimeZone)
      .toFormat("t z '(UTC'ZZ')'")
      .replace('_', ' ')

    const fullyBooked = tour.enrollment >= tour.maxEnrollment
    const spotsLeftWarningThreshold = 20
    const spotsLeft = tour.maxEnrollment - tour.enrollment
    const isAlmostFullyBooked = spotsLeft < spotsLeftWarningThreshold

    return (
      <div
        key={index}
        className={
          'py-6 px-2 ' +
          (index % 2 === 0 ? 'bg-indigo-100' : 'bg-blue-50') +
          (index === 0 ? ' rounded-t-lg' : '') +
          (index === tours.length - 1 ? ' rounded-b-lg' : '')
        }
      >
        {!fullyBooked && (
          <div className="float-right text-center mt-4 mr-3">
            <a
              href={'/book/' + tour.tourId}
              className="bg-yellow-200 no-underline text-black text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-blue-200"
            >
              Book
            </a>
            {isAlmostFullyBooked && (
              <>
                <br />
                <span className="text-xs font-light">
                  {spotsLeft} spots left
                </span>
              </>
            )}
          </div>
        )}
        {fullyBooked && (
          <span className="float-right mr-3 mt-5 px-5 py-2 text-base font-bold bg-gray-500 text-gray-100 shadow-md rounded-lg">
            Full
          </span>
        )}
        <div className={fullyBooked ? 'text-gray-400' : ''}>
          <div className="text-lg font-bold">{tour.summary}</div>
          <div className="text-base">
            {tourStartDay_user}
            <br />
            <span className="text-sm">{tourStartTime_user}</span>
          </div>
        </div>
      </div>
    )
  })

  return <div className="rounded">{bookingOptions}</div>
}
