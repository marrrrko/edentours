import { ensureAllQualifyingTourStartEmailsSent } from './tour-start-emails'

const EMAIL_SENDING_ENABLED = !!process.env.EMAIL_SENDING_ENABLED
const runIntervalSeconds = 30

export function startBackgroundJobs() {
  let lastRunComplete = true

  if (EMAIL_SENDING_ENABLED) {
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
  } else {
    console.log('Email sending not enabled.')
  }
}
