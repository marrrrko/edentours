import Router from 'next/router'
import {
  getEmailTransactionsForBooking,
  getBookingRecords,
  getTour
} from '../../../../db/bookingDb'
import { aggregateBookingRecords } from '../../../../aggregates/booking'
import DefaultErrorPage from 'next/error'
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
  if (!accessGranted) {
    return <DefaultErrorPage statusCode={401} />
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
      {messages.map((message) => {
        return (
          <div key={message.transactionId} className="mb-5">
            <div title={message.sentMsgId}>
              Sent on:{' '}
              {DateTime.fromISO(message.sentAt)
                .toFormat("ccc LLL d, t z '(UTC'ZZ')'")
                .replace('_', ' ')}
            </div>
            <div>TO: {message.email.recipients.to.join(' , ')}</div>
            <div>CC: {message.email.recipients.cc.join(' , ')}</div>
            <div>BCC: {message.email.recipients.bcc.join(' , ')}</div>
            <div>Subject: {message.email.subject}</div>
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
  const { bookerName, tourId } = aggregateBookingRecords(bookingRecords)

  const { summary, start } = await getTour(tourId)

  const emailTransactions = await getEmailTransactionsForBooking(bookingId)

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
