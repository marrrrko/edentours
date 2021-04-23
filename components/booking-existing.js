import React, { useState, useEffect } from 'react'
import BookingForm from './booking-form'
import { buildTourDateStrings } from '../utils/tour-dates'
import BigLoader from './big-loader'

export default function ExistingTourBooking({ booking, actionKey }) {
  const [eventData, setEventData] = useState({
    tourId: booking.tourId,
    eventInfo: null,
    error: null,
    sending: false,
    done: false,
    tourInfo: booking.tour,
    formData: {
      ...booking,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      actionKey: actionKey
    }
  })

  const [tourTimes, setTourTimes] = useState({
    raw: booking.tour.start,
    userTime: {
      day: '',
      time: '',
      combined: ''
    },
    fixedTime: {
      day: '',
      time: ''
    }
  })

  useEffect(() => {
    setTourTimes(
      buildTourDateStrings(booking.tour.start, eventData.formData.userTimeZone)
    )
  }, [])

  const handleBookingSubmission = (formData) => {
    setEventData({
      ...eventData,
      formData: formData,
      sending: true
    })
  }

  const handleBookingCancellation = (formData) => {
    setEventData({
      ...eventData,
      formData: formData,
      cancel: true,
      sending: true
    })
  }

  const retry = () => {
    setEventData({ ...eventData, error: null, sending: false })
  }

  useEffect(() => {
    async function submitFormData() {
      try {
        let response = await fetch('/api/booking/' + booking.tourId, {
          method: eventData.cancel ? 'DELETE' : 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData.formData)
        })
        let responseMsg = await response.json()
        if (response.ok) {
          setEventData({
            ...eventData,
            sending: false,
            done: true
          })
        } else {
          setEventData({
            ...eventData,
            error: responseMsg.msg,
            sending: false
          })
        }
      } catch (err) {
        setEventData({
          ...eventData,
          error: err.toString(),
          sending: false
        })
      }
    }
    if (eventData.sending) submitFormData()
  }, [eventData.sending])

  if (eventData.sending) {
    return <BigLoader />
  } else if (eventData.done) {
    return (
      <div className="flex flex-col mt-20">
        <div className="text-center  text-3xl">✍</div>
        <div className="text-center  text-xl mt-5 mb-4">
          Your booking was {eventData.cancel ? 'cancelled' : 'updated'}.
        </div>
        <div className="text-center mt-8">
          <a
            href={'/'}
            className="flex-shrink-0 bg-yellow-200 no-underline text-black text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
          >
            Go back to starting page
          </a>
        </div>
      </div>
    )
  } else if (eventData.error != undefined) {
    return (
      <div className="flex flex-col mt-20">
        <div className="text-center text-3xl">⚔</div>
        <div className="text-center text-lg font-bold my-3">
          Sorry. Your booking could not be updated:
        </div>
        <div className="text-center  text-base font-sans">
          {eventData.error}
        </div>
        <div className="text-center  text-3xl">
          <a
            className="flex-shrink-0 bg-yellow-200 no-underline text-black text-base font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
            onClick={retry}
          >
            Retry
          </a>
        </div>
      </div>
    )
  } else {
    return (
      <BookingForm
        tourInfo={eventData.tourInfo}
        formData={eventData.formData}
        submitHandler={handleBookingSubmission}
        cancelHandler={handleBookingCancellation}
        isUpdate={true}
        tourTimes={tourTimes}
      />
    )
  }
}
