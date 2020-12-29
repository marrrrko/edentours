import React, { useState } from 'react'
import { parseISO, format } from 'date-fns'

export default function NewTourBookingForm({
  tourInfo,
  formData,
  submitHandler
}) {
  const [values, setValues] = useState(formData)

  const handleBookButtonClick = (e) => {
    let msg = getValidationErrorMsg(values)
    if (msg) {
      alert(msg)
    } else {
      submitHandler(values)
    }
    e.preventDefault()
  }

  function getValidationErrorMsg(data) {
    if (!data.bookerName) {
      return 'Please specify your name.'
    } else if (!data.email || !data.email.length || !emailIsValid(data.email)) {
      return 'Please specify a valid email address'
    } else if (!data.groupName) {
      return 'Please specify a name for your group such as "Friends from Brazil".'
    } else if (
      !data.areYouHuman ||
      parseInt(data.areYouHuman) != data.areYouHuman ||
      simpleHash(parseInt(data.areYouHuman).toString()) != 1516107
    ) {
      return 'Incorrect answer to special question. Answer should be a 4 digit number.'
    } else if (JSON.stringify(data).length > 10000) {
      return 'Too much data'
    }

    return null
  }

  function simpleHash(value) {
    var hash = 0
    if (value.length == 0) {
      return hash
    }
    for (var i = 0; i < value.length; i++) {
      var char = value.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  function emailIsValid(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
  }

  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto pb-36 pt-20 px-4 grid min-h-screen">
      <div className="bg-white">
        <div className="text-xl font-semibold text-center mb-3">
          New Tour Booking
        </div>
        <div className="text-lg text-center mt-6">{tourInfo.summary}</div>
        <div className="text-xl text-center">
          {format(parseISO(tourInfo.start), 'EEEE MMMM do yyyy')} <br />
          {format(parseISO(tourInfo.start), 'h:mm a zzzz')}
        </div>
        <form className="mt-6">
          <label
            htmlFor="bookerName"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Your name
          </label>
          <input
            id="bookerName"
            type="text"
            name="bookerName"
            placeholder="John Doe"
            autoComplete="name"
            maxLength="100"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
            value={values.bookerName}
            onChange={handleInputChange}
          />

          <label
            htmlFor="email"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Your E-mail
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="john.doe@company.com"
            autoComplete="email"
            maxLength="100"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
            value={values.email}
            onChange={handleInputChange}
          />
          <label
            htmlFor="groupName"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Group Name
          </label>
          <input
            id="groupName"
            type="text"
            name="groupName"
            placeholder="Example: Friends from Bristol, UK"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
            maxLength="100"
            value={values.groupName}
            onChange={handleInputChange}
          />
          <label
            htmlFor="groupDetails"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Tell us a little bit about your group
          </label>
          <textarea
            id="groupDetails"
            name="groupDetails"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
            maxLength="500"
            value={values.groupDetails}
            onChange={handleInputChange}
          />
          <label
            htmlFor="participantCount"
            className="block mt-5 text-xs font-semibold text-gray-600 uppercase"
          >
            Maximum Number of Expected Participants
          </label>
          <p className="text-xs p-0 m-0">
            The number of available connections is limited. Please estimate as
            best possible the number of people you expect to require their own
            connection. You will be able to modify this until 24 hours prior to
            the tour.
          </p>
          <input
            id="participantCount"
            type="number"
            name="participantCount"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
            min="1"
            max="500"
            value={values.participantCount}
            onChange={handleInputChange}
          />
          <label
            htmlFor="areYouHuman"
            className="block mt-5 text-xs font-semibold text-gray-600 uppercase"
          >
            Quick question
          </label>
          <p className="text-sm font-bold p-0 m-0">
            In what year did God's Kingdom start ruling? <br />
            <span className="text-xs font-normal">
              (This question helps make sure you're not a robot.)
            </span>
          </p>
          <input
            id="areYouHuman"
            type="text"
            name="areYouHuman"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
            value={values.areYouHuman}
            onChange={handleInputChange}
          />
          <button
            type="submit"
            onClick={handleBookButtonClick}
            className="w-full py-3 mt-6 font-extrabold tracking-widest text-white uppercase bg-black shadow-lg focus:outline-none hover:bg-blue-900 hover:shadow-none"
          >
            Book
          </button>
          <p className="p-0 m-0 mt-4 mb-1 text-xs text-gray-800">
            By clicking Book you agree to receiving tour related emails. We will
            not share your email with other organizations.
          </p>
          <p className="p-0 m-0 mt-4 mb-1 text-xs text-gray-800">
            <span className="font-bold">After clicking Book</span>, an email
            message containing instructions for modifying or cancelling this
            booking will be sent to you.
          </p>
          <p className="p-0 m-0 mt-2 text-xs text-gray-800">
            <span className="font-bold">24 hours prior to your tour date</span>,
            a second email containing Zoom connection details will be sent to
            you.
          </p>
        </form>
      </div>
    </div>
  )
}
