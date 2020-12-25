import React from 'react'
import { parseISO, format } from 'date-fns'

export default function NewTourBookingForm({ tourInfo }) {
  console.log(`TI: ${JSON.stringify(tourInfo)}`)
  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto pb-36 pt-20 px-4 grid min-h-screen">
      <div className="bg-white">
        <div className="text-xl font-semibold text-center mb-3">
          New Tour Booking
        </div>
        <div className="text-lg text-center mt-6">{tourInfo.label}</div>
        <div className="text-xl text-center">
          {format(parseISO(tourInfo.date), 'EEEE MMMM do yyyy')} <br />
          {format(parseISO(tourInfo.date), 'h:mm a OOOO')}
        </div>
        <form className="mt-6">
          <label
            htmlFor="booker-name"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Your name
          </label>
          <input
            id="booker-name"
            type="text"
            name="booker-name"
            placeholder="John Doe"
            autoComplete="name"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
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
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            htmlFor="group-name"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Group Name
          </label>
          <input
            id="group-name"
            type="text"
            name="group-name"
            placeholder="Example: Friends from Bristol, UK"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            htmlFor="group-details"
            className="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Tell us a little bit about your group
          </label>
          <textarea
            id="group-details"
            name="group-details"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            htmlFor="participant-count"
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
            id="participant-count"
            type="number"
            name="participant-count"
            defaultValue="1"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            htmlFor="are-you-human"
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
            id="are-you-human"
            type="text"
            name="are-you-human"
            className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <button
            type="submit"
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
            a second email containing{' '}
            <a href="/zoom" target="_blank">
              Zoom connection details
            </a>{' '}
            will be sent to you.
          </p>
        </form>
      </div>
    </div>
  )
}
