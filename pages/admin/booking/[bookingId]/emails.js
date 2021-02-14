import Router from 'next/router'
import {
  getEmailTransactionsForEvent,
  getBookingRecords,
  getTour
} from '../../../../db/bookingDb'
import { aggregateBookingRecords } from '../../../../aggregates/booking'
import Error from '../../../_error'
import Cookies from 'cookies'
import { DateTime } from 'luxon'
import { buildCombinedFixedTimeString } from '../../../../utils/tour-dates'
export default function Bookings({
  accessGranted,
  bookerName,
  tourSummary,
  tourStart,
  messages
}) {
  if (bookerName == null || tourStart == null) {
    return <Error statusCode={404} title="Hiç bir şey!" />
  }

  if (!accessGranted) {
    return <Error statusCode={401} title="Olmaz!" />
  }

  return (
    <div className="w-full md:w-3/5 lg:2/5 mx-auto pt-8 font-serif">
      <div className="text-lg mt-5">
        <div>
          Emails to <br />
          <span className="ml-4 text-base">{bookerName}</span>
        </div>
        <div className="mt-2">
          for tour
          <br />
          <span className="ml-4 text-base">{tourSummary}</span>
          <br />
          <span className="ml-4 text-base">
            {buildCombinedFixedTimeString(tourStart)}
          </span>
        </div>
      </div>
      <br />
      <hr />
      <br />
      {messages.map((message, idx) => {
        return (
          <div key={message.transactionId} className="mb-8">
            <h3 className="mt-2 mb-4 font-bold text-3xl">Message #{idx + 1}</h3>
            <div className="bg-yellow-100 p-3">
              <div title={message.sentMsgId}>
                Sent on:{' '}
                <b>
                  {message.sentAt == null
                    ? '--'
                    : DateTime.fromISO(message.sentAt)
                        .toFormat("ccc LLL d, t z '(UTC'ZZ')'")
                        .replace('_', ' ')}{' '}
                </b>
              </div>
              <div>
                to: <b>{message.email.recipients.to.join(' , ')}</b>
              </div>
              <div>
                Subject: <b>{message.email.subject}</b>
              </div>
            </div>
            <div
              className="space-y-4 font-serif"
              dangerouslySetInnerHTML={getEmailHtml(message)}
            ></div>
            <br />
            <hr />
          </div>
        )
      })}
      {messages.length == 0 && <h1>Hiç!</h1>}
    </div>
  )
}

function getEmailHtml(message) {
  return {
    __html: message.email.body.html
  }
}

export async function getServerSideProps(context) {
  const { bookingId } = context.query

  const cookies = new Cookies(context.req, context.res)
  const accessCookie = cookies.get('edenaccess')
  if (accessCookie != process.env.ADMIN_ACCESS) {
    return { props: { accessGranted: false } }
  }

  const bookingRecords = await getBookingRecords(bookingId)

  if (bookingRecords == null) {
    return {
      props: {
        accessGranted: true,
        bookerName: null,
        tourSummary: null,
        tourStart: null,
        messages: []
      }
    }
  }

  const { bookerName, tourId } = aggregateBookingRecords(bookingRecords)

  const { summary, start } = await getTour(tourId)

  const bookingEmailTransactions = await getEmailTransactionsForEvent(bookingId)
  const tourEmailTransactions = await getEmailTransactionsForEvent(tourId)
  const tourEmailTransactionsForThisPerson = tourEmailTransactions.filter(
    (t) => t.targetId && t.targetId == bookingId
  )

  const emailTransactions = bookingEmailTransactions
    .concat(tourEmailTransactionsForThisPerson)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))

  return {
    props: {
      accessGranted: true,
      bookerName,
      tourSummary: summary,
      tourStart: start.toISOString(),
      messages: emailTransactions
    }
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
