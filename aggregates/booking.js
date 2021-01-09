export function indexToursAndBookings(rows) {
  const tourIndex = rows
    .map((r) => ({
      tourId: r.tourId,
      booking: JSON.parse(r.bookingDoc),
      tour: JSON.parse(r.tourDoc)
    }))
    .reduce((acc, next) => {
      if (!acc[next.tourId]) {
        acc[next.tourId] = {
          tour: next.tour,
          bookings: []
        }
      }
      if (next.booking) acc[next.tourId].bookings.push(next.booking)
      return acc
    }, {})

  const tourBookingList = Object.keys(tourIndex)
    .map((key) => tourIndex[key])
    .slice()
    .sort((a, b) => new Date(a.tour.start) - new Date(b.tour.start))

  const tourBookingAggregate = aggregateBookingsFromTours(tourBookingList)
  return tourBookingAggregate
}

export function aggregateBookingsFromTours(upcomingToursAndBookings) {
  return upcomingToursAndBookings.map((tour) => {
    tour.allBookingsByEmail = tour.bookings.reduce((acc, next) => {
      if (!acc[next.email]) {
        acc[next.email] = []
      }
      acc[next.email].push(next)
      return acc
    }, {})

    tour.finalBookingsByEmail = Object.keys(tour.allBookingsByEmail).map(
      (email) => {
        return aggregateUsersBookings(email, tour.allBookingsByEmail[email])
      }
    )

    tour.currentParticipantTotal = tour.finalBookingsByEmail.reduce(
      (acc, next) => {
        return acc + next.participantCount
      },
      0
    )

    tour.currentGroupTotal = tour.finalBookingsByEmail.reduce((acc, next) => {
      if (next.latestBooking.eventType != 'cancelled') {
        return acc + 1
      }
      return acc
    }, 0)

    return tour
  })
}

export function aggregateUsersBookings(email, bookings) {
  return bookings
    .slice()
    .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
    .reduce(
      (acc, next) => {
        if (acc.latestBooking == null) {
          acc.participantCount = next.participantCount
        } else if (next.eventType == 'created' || next.eventType == 'updated') {
          acc.participantCount = next.participantCount
        } else if (next.eventType == 'cancelled') {
          acc.participantCount = 0
        } else {
          throw new Error('Unknown event type: ' + next.eventType)
        }
        acc.latestBooking = next
        return acc
      },
      {
        email: email,
        participantCount: 0,
        latestBooking: null
      }
    )
}

export function groupBookingsByBookingId(bookingDocs) {
  return bookingDocs.reduce((acc, next) => {
    if (!acc[next.bookingId]) acc[next.bookingId] = []
    acc[next.bookingId].push(next)
    return acc
  }, {})
}

export function aggregateBookingRecords(bookingRecords) {
  return bookingRecords
    .slice()
    .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
    .reduce((acc, next) => {
      if (next.eventType == 'created' || next.eventType == 'updated') {
        acc = { ...next }
      } else if (next.eventType == 'cancelled') {
        acc = acc || {}
        acc.participantCount = 0
        acc.eventType = 'cancelled'
      } else {
        throw new Error('Unknown event type: ' + next.eventType)
      }
      return acc
    }, null)
}
