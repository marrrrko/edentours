export function calculateTotalParticipants(upcomingToursAndBookings) {
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

function aggregateUsersBookings(email, bookings) {
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
