import React, { useState, useEffect } from 'react'
import BookingForm from './booking-form'
import { buildTourDateStrings } from '../utils/tour-dates'

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
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          margin: 'auto',
          background: 'transparent',
          display: 'block'
        }}
        width="287px"
        height="287px"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
      >
        <circle
          cx="50"
          cy="50"
          r="32"
          strokeWidth="8"
          stroke="#182731"
          strokeDasharray="50.26548245743669 50.26548245743669"
          fill="none"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur="2.380952380952381s"
            repeatCount="indefinite"
            keyTimes="0;1"
            values="0 50 50;360 50 50"
          ></animateTransform>
        </circle>
        <circle
          cx="50"
          cy="50"
          r="23"
          strokeWidth="8"
          stroke="#a7d4ec"
          strokeDasharray="36.12831551628262 36.12831551628262"
          strokeDashoffset="36.12831551628262"
          fill="none"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur="2.380952380952381s"
            repeatCount="indefinite"
            keyTimes="0;1"
            values="0 50 50;-360 50 50"
          ></animateTransform>
        </circle>
      </svg>
    )
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
        <div className="text-center  text-3xl">⚔</div>
        <div className="text-center  text-lg">An error occurred:</div>
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
