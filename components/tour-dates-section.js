import React, { useEffect, useState } from 'react'
import TourDates from './tour-dates'

export default function TourDatesSection({}) {
  const [bookingData, setBookingData] = useState({
    entries: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    async function fetchEventData() {
      try {
        let response = await fetch('/api/booking')
        let responseData = await response.json()
        if (!responseData.tours) {
          setBookingData({
            entries: responseData,
            error: 'Invalid Booking Data',
            loading: false
          })
        } else {
          setBookingData({
            entries: responseData.tours,
            error: null,
            loading: false
          })
        }
      } catch (err) {
        setBookingData({
          entries: null,
          error: err,
          loading: false
        })
      }
    }
    if (bookingData.loading) fetchEventData()
  })

  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4">
      {bookingData.loading && <span>Loading</span>}
      {!bookingData.loading && bookingData.error && (
        <span>Error: {bookingData.error}</span>
      )}
      {!bookingData.loading && bookingData.entries && (
        <TourDates dates={bookingData.entries} />
      )}
    </div>
  )
}
