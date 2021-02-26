import React, { useState, useEffect } from 'react'
import BookingForm from './booking-form'
import { buildTourDateStrings } from '../utils/tour-dates'
import BigLoader from './big-loader'

export default function NewTourBooking({ tourId }) {
  const [eventData, setEventData] = useState({
    tourId: tourId,
    eventInfo: null,
    error: null,
    loading: true,
    sending: false,
    done: false,
    formData: {
      bookerName: '',
      email: '',
      groupName: '',
      groupDetails: '',
      participantCount: 1,
      areYouHuman: '',
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  })

  const handleBookingSubmission = (formData) => {
    setEventData({
      ...eventData,
      formData: formData,
      sending: true
    })
  }

  const retry = () => {
    setEventData({ ...eventData, error: null, sending: false })
  }

  const [tourTimes, setTourTimes] = useState({
    raw: null,
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
    async function postFormData() {
      try {
        let response = await fetch('/api/booking/' + tourId, {
          method: 'POST',
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
          loading: false,
          sending: false
        })
      }
    }
    if (eventData.sending) postFormData()
  }, [eventData.sending])

  useEffect(() => {
    async function fetchEventData() {
      try {
        let response = await fetch('/api/booking/' + tourId)
        let eventInfo = await response.json()
        if (!eventInfo.tourId || !eventInfo.summary || !eventInfo.start) {
          setEventData({
            ...eventData,
            eventInfo: eventInfo,
            error: 'Invalid Event',
            loading: false
          })
        } else {
          setEventData({
            ...eventData,
            eventInfo: eventInfo,
            error: null,
            loading: false
          })

          setTourTimes(
            buildTourDateStrings(
              eventInfo.start,
              eventData.formData.userTimeZone
            )
          )
        }
      } catch (err) {
        setEventData({
          ...eventData,
          error: err.toString(),
          loading: false
        })
      }
    }
    if (eventData.loading) fetchEventData()
  }, [])

  if (eventData.loading || eventData.sending) {
    return <BigLoader />
  } else if (eventData.done) {
    return (
      <div className="flex flex-col mt-20">
        <div className="text-center  text-3xl">✍</div>
        <div className="text-center  text-xl mt-5 mb-4">
          Your booking was recorded.
        </div>
        <div className="text-center  text-base">
          An email will be sent to you.
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
        tourInfo={eventData.eventInfo}
        formData={eventData.formData}
        submitHandler={handleBookingSubmission}
        tourTimes={tourTimes}
      />
    )
  }
}
