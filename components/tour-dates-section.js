import React, { useEffect, useState } from 'react'
import TourDates from './tour-dates'

export default function TourDatesSection({}) {
  const [calendarData, setCalendarData] = useState({
    entries: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    gapi.load('client', loadCalendarEvents)

    function loadCalendarEvents() {
      gapi.client
        .init({
          apiKey: 'AIzaSyCugr28FW9yey69bQ9DZvKLWGOM6x3LJVs',
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
          ]
        })
        .then(function () {
          return gapi.client.calendar.events.list({
            calendarId: 'p0cqdb7ehvbd0fm7e4sq3kthc8@group.calendar.google.com',
            timeMin: new Date().toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 50,
            orderBy: 'startTime'
          })
        })
        .then(
          function (response) {
            setCalendarData({
              entries: parseGoogleCalendarResponse(response),
              error: null,
              loading: false
            })
          },
          function (reason) {
            setCalendarData({
              entries: null,
              error: reason.result.error.message,
              loading: false
            })
          }
        )
    }
  })

  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4">
      {calendarData.loading && <span>Loading</span>}
      {!calendarData.loading && calendarData.error && (
        <span>Error: {calendarData.error}</span>
      )}
      {!calendarData.loading && calendarData.entries && (
        <TourDates dates={calendarData.entries} />
      )}
    </div>
  )
}

function parseGoogleCalendarResponse(response) {
  return response.result.items.map((calendarItem) => ({
    id: calendarItem.id,
    label: calendarItem.summary,
    start: calendarItem.start.dateTime
  }))
}
