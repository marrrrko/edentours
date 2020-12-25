import React from 'react'
import { parseISO, format } from 'date-fns'

export default function TourDates({ dates }) {
  const bookingOptions = dates.map((date, index) => {
    return (
      <div
        key={index}
        className={
          'py-6 px-2 ' +
          (index % 2 === 0 ? 'bg-indigo-100' : 'bg-blue-50') +
          (index === 0 ? ' rounded-t-lg' : '') +
          (index === dates.length - 1 ? ' rounded-b-lg' : '')
        }
      >
        <a
          href={'/book/' + date.id}
          className="flex-shrink-0 float-right bg-yellow-200 no-underline text-black text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200"
        >
          Book
        </a>
        <div className="text-lg font-bold">{date.label}</div>
        <div className="text-base">
          {format(parseISO(date.start), 'EEEE MMMM do yyyy - h:mm a OOOO')}
        </div>
      </div>
    )
  })

  return <div className="rounded">{bookingOptions}</div>
}
