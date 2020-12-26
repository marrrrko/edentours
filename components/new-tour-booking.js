import React, { useState, useEffect } from 'react'
import NewTourBookingForm from './new-tour-booking-form'

export default function NewTourBooking({ tourId }) {
  const [eventData, setEventData] = useState({
    tourId: tourId,
    eventInfo: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    async function fetchEventData() {
      try {
        let response = await fetch('/api/booking/' + tourId)
        let eventInfo = await response.json()
        if (!eventInfo.id || !eventInfo.label || !eventInfo.date) {
          setEventData({
            tourId: tourId,
            eventInfo: eventInfo,
            error: 'Invalid Event',
            loading: false
          })
        } else {
          setEventData({
            tourId: tourId,
            eventInfo: eventInfo,
            error: null,
            loading: false
          })
        }
      } catch (err) {
        setEventData({
          tourId: tourId,
          eventInfo: null,
          error: err,
          loading: false
        })
      }
    }
    if (eventData.loading) fetchEventData()
  })

  if (eventData.loading) {
    return (
      <svg
        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    )
  } else {
    return <NewTourBookingForm tourInfo={eventData.eventInfo} />
  }
}
