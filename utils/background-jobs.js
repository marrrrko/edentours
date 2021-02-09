import { ensureAllQualifyingTourStartEmailsSent } from './tour-start-emails'

const runIntervalSeconds = 30

export function startBackgroundJobs() {
  let lastRunComplete = true

  setInterval(async () => {
    if (lastRunComplete) {
      try {
        lastRunComplete = false
        await ensureAllQualifyingTourStartEmailsSent()
      } catch (bgRunErr) {
        global.emailLog.error('Failed to send tour start emails', bgRunErr)
      } finally {
        lastRunComplete = true
      }
    } else {
      global.emailLog.warn(
        'Last background email job did not complete yet. Skipping.'
      )
    }
  }, runIntervalSeconds * 1000)
}
