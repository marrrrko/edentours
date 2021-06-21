import React from 'react'
import { DateTime } from 'luxon'

export default function TourDates({ tours, programId, guideId, language }) {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const filteredTours = tours.filter((t) => {
    return (
      (programId === '*' || t.programId === programId) &&
      (guideId === '*' || t.guide.id === guideId) &&
      (language === '*' || t.language === language)
    )
  })
  const bookingOptions = filteredTours.map((tour, index) => {
    let tourStartDay_user = DateTime.fromISO(tour.start)
      .setZone(userTimeZone)
      .toFormat('DDDD')

    let tourStartTime_user = DateTime.fromISO(tour.start)
      .setZone(userTimeZone)
      .toFormat("t z '(UTC'ZZ')'")
      .replace('_', ' ')

    const fullyBooked = tour.remainingSpots <= 0
    const spotsLeftWarningThreshold = 20
    const spotsLeft = tour.remainingSpots
    const isAlmostFullyBooked = spotsLeft < spotsLeftWarningThreshold

    return (
      <div key={index} className="py-6 px-2 pl-4 shadow-xl bg-yellow-100 mb-7">
        {!fullyBooked && (
          <div className="float-right text-center mt-10 mr-3">
            <a
              href={'/book/' + tour.tourId}
              className="bg-blue-900 no-underline text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-blue-200"
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
          <div className="text-sm mt-3 flex flex-row">
            <div className="flex-grow">
              <span className="font-bold">Guide: </span>
              <span>{tour.guide.name}</span>
            </div>
            <div className="flex-grow">
              <span className="font-bold">Language: </span>
              <span>
                {tour.language?.nativeName}{' '}
                {tour.language?.nativeName !== tour.language?.name && (
                  <span>({tour.language?.name})</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  })

  return (
    <div
      data-program-id={programId}
      data-guide-id={guideId}
      data-language={language}
      className=""
    >
      {bookingOptions}
    </div>
  )
}
