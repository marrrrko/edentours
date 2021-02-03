import Graceful from '@ladjs/graceful'
import Bree from 'bree'

export function startBackgroundJobs() {
  const bree = new Bree({
    jobs: [
      {
        name: 'tour-start-emails',
        interval: 'every 30 seconds'
      }
    ]
  })

  const graceful = new Graceful({ brees: [bree] })
  graceful.listen()
  bree.start()
  console.log('Background jobs started')
}
