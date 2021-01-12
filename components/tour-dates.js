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
          <a
            href={'/book/' + tour.tourId}
            className="flex-shrink-0 mt-4 mr-3 float-right bg-yellow-200 no-underline text-black text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
          >
            Book
          </a>
        )}
        {fullyBooked && (
          <span className="float-right mr-3 mt-5 text-base font-bold bg-gray-600 text-white py-2 shadow-md px-4 rounded-lg">
            ⚔ Fully Booked
          </span>
        )}
        <div
          className={`text-lg font-bold ${fullyBooked ? ' line-through' : ''}`}
        >
          {tour.summary}
        </div>
        <div className="text-base">
          {tourStartDay_user}
          <br />
          <span className="text-sm">{tourStartTime_user}</span>
        </div>
      </div>
    )
  })

  return <div className="rounded">{bookingOptions}</div>
}
