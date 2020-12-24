import React from 'react'

export default function NewTourBooking({ tourInfo }) {
  //return <div>Form goes here. Tour #{tourInfo.id}</div>
  return (
    <div class="w-full md:w-3/5 2xl:w-2/5 mx-auto pt-20 px-4 grid min-h-screen">
      <div class="bg-white">
        <div class="text-xl font-semibold text-center mb-3">
          New Tour Booking
        </div>
        <div class="text-lg text-center">Tour Name Goes here</div>
        <div class="text-lg text-center">Booking Date Goes Here</div>
        <form class="mt-6">
          <label
            for="booker-name"
            class="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Your name
          </label>
          <input
            id="booker-name"
            type="text"
            name="booker-name"
            placeholder="John Doe"
            autocomplete="name"
            class="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />

          <label
            for="email"
            class="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Your E-mail
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="john.doe@company.com"
            autocomplete="email"
            class="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            for="group-name"
            class="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Group Name
          </label>
          <input
            id="group-name"
            type="text"
            name="group-name"
            placeholder="Example: Friends from Bristol, UK"
            class="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            for="group-details"
            class="block mt-2 text-xs font-semibold text-gray-600 uppercase"
          >
            Tell us a little bit about your group
          </label>
          <textarea
            id="group-details"
            name="group-details"
            class="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <label
            for="participant-count"
            class="block mt-2 text-xs font-semibold text-gray-600 uppercase"
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
            class="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner"
            required
          />
          <button
            type="submit"
            class="w-full py-3 mt-6 font-extrabold tracking-widest text-white uppercase bg-black shadow-lg focus:outline-none hover:bg-blue-900 hover:shadow-none"
          >
            Book
          </button>
          <p class="p-0 m-0 mt-4 mb-1 text-xs text-gray-800">
            <span className="font-bold">After clicking Book</span>, an email
            message containing instructions for modifying or cancelling this
            booking will be sent to you.
          </p>
          <p class="p-0 m-0 mt-2 text-xs text-gray-800">
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
