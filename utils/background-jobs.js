import Graceful from '@ladjs/graceful'
import Bree from 'bree'

export function startBackgroundJobs() {
  const bree = new Bree({
    defaultExtension: 'mjs',
    jobs: [
      {
        name: 'tour-start-emails',
        interval: 'every 1 minute'
      }
    ]
  })

  const graceful = new Graceful({ brees: [bree] })
  graceful.listen()
  bree.start()
  console.log('Background jobs started')
}
