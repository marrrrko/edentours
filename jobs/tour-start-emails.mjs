import { parentPort } from 'worker_threads'
import { getUpcomingTours, getBookings } from '../db/bookingDb'
;(async () => {
  // wait for a promise to finish
  await checkForTourEmailsToSend()

  // signal to parent that the job is done
  if (parentPort) parentPort.postMessage('Tour Email Send-Check Done')
  else process.exit(0)
})()

const emailSendHoursPriorToTourStart = 24

async function checkForTourEmailsToSend() {
  const tours = await getUpcomingTours()
  const toursThatNeedEmail = tours.filter((t) => {
    const start = new Date(t.start)
    const now = new Date()
    const diffInMs = start - now
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours > 0 && diffInHours < emailSendHoursPriorToTourStart) {
      return true
    }

    return false
  })

  console.log(`${toursThatNeedEmail.length} qualify for tour start email`)

  return Promise.all(toursThatNeedEmail.map(sendMissingTourStartEmails))
}

async function sendMissingTourStartEmails(tour) {
  return Promise.resolve()
}
