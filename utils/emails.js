import { v4 as uuid } from 'uuid'
import bs58 from 'bs58'
import {
  insertEmailTransaction,
  getEmailTransaction,
  getEmailTransactionsForEvent,
  getUpcomingBookings,
  markEmailTransactionAsSent,
  getBookingRecords,
  insertActionKey
} from '../db/bookingDb'
import {
  aggregateBookingRecords,
  indexToursAndBookings
} from '../aggregates/booking'
import { SES, config } from 'aws-sdk'
import { buildTourDateStrings } from './tour-dates'

const fixedTimezone = 'Europe/Istanbul'

config.update({ region: 'us-east-1' })

export async function buildBookingConfirmationEmail(bookingId) {
  const booking = aggregateBookingRecords(await getBookingRecords(bookingId))
  if (!booking.email || booking.email.indexOf('@') === -1) {
    throw new Error('Booking does not have a valid email')
  }

  const modifyKey = bs58.encode(Buffer.from(uuid().replace(/-/g, ''), 'hex'))
  await insertActionKey(
    modifyKey,
    'modify-booking',
    bookingId,
    new Date(new Date().setDate(new Date(booking.tour.start).getDate() + 14))
  )
  const unsubscribeKey = bs58.encode(
    Buffer.from(uuid().replace(/-/g, ''), 'hex')
  )
  await insertActionKey(unsubscribeKey, 'unsubscribe', bookingId, null)
  const modifyUrl = `https://eden.tours/book/${booking.tour.tourId}?action=${modifyKey}`
  const unsubscribeUrl = `https://eden.tours/user/unsubscribe?action=${unsubscribeKey}`

  const recipients = {
    to: [booking.email],
    cc: [],
    bcc: []
  }
  const subject = `Eden·Tours Booking Confirmation`
  const body = {
    html: createConfirmationEmailHtml(
      booking.tour.summary,
      booking.tour.start,
      booking.participantCount,
      modifyUrl,
      unsubscribeUrl
    ),
    plaintext: ''
  }

  return {
    recipients,
    subject,
    body
  }
}

export async function buildTourStartEmail(tour, booking) {
  const unsubscribeKey = bs58.encode(
    Buffer.from(uuid().replace(/-/g, ''), 'hex')
  )
  await insertActionKey(unsubscribeKey, 'unsubscribe', booking.bookingId, null)
  const unsubscribeUrl = `https://eden.tours/user/unsubscribe?action=${unsubscribeKey}`

  const recipients = {
    to: [booking.email],
    cc: [],
    bcc: []
  }
  const subject = `Connection Information for your Upcomming Eden·Tour`
  const body = {
    html: createTourStartEmailHtml(
      tour.summary,
      tour.start,
      booking.participantCount,
      tour.description,
      unsubscribeUrl
    ),
    plaintext: createTourStartEmailPlaintext(
      tour.summary,
      tour.start,
      booking.participantCount,
      tour.description,
      unsubscribeUrl
    )
  }

  return {
    recipients,
    subject,
    body
  }
}

export async function createEmailTransaction(
  messageType,
  associatedEventId,
  email,
  targetId = null
) {
  const transactionId = uuid()
  await insertEmailTransaction(
    transactionId,
    messageType,
    associatedEventId,
    email,
    targetId
  )

  return transactionId
}

export async function sendEmail(transactionId) {
  const transaction = await getEmailTransaction(transactionId)
  if (!transaction.sentAt) {
    try {
      const awsEmailDoc = {
        Destination: {
          ToAddresses: transaction.email.recipients.to,
          CcAddresses: transaction.email.recipients.cc,
          BccAddresses: transaction.email.recipients.bcc
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: transaction.email.body.html
            },
            Text: {
              Charset: 'UTF-8',
              Data: transaction.email.body.plaintext
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: transaction.email.subject
          }
        },
        Source: process.env.EMAIL_FROM
      }
      const { MessageId } = await new SES({ apiVersion: '2010-12-01' })
        .sendEmail(awsEmailDoc)
        .promise()
      console.log(`${transaction.transactionType} email sent`)
      await markEmailTransactionAsSent(transactionId, MessageId, new Date())
    } catch (emailSendErr) {
      console.error('Failed to send email', emailSendErr)
    }
  }
}

function createConfirmationEmailHtml(
  tourName,
  tourDate,
  numConnections,
  modifyUrl,
  unsubscribeUrl
) {
  const tourDates = buildTourDateStrings(tourDate, fixedTimezone)

  return `
<p><h2>Congrats! Your Tour is Booked</h2></p>
<p>We are pleased to have you as our guest for a tour. We know you will have a great time, deepen your Bible knowledge, and make new acquaintances.</p>

<p>Your details are below:</p>

&nbsp;&nbsp;Tour: ${tourName} <br />
&nbsp;&nbsp;Date: ${tourDates.fixedTime.combined} <br />
&nbsp;&nbsp;Number of Connections: ${numConnections} <br />

<p>Zoom connection details will be sent three days before your tour date. Please check our <a href="https://eden.tours/faq">frequently asked questions page</a> if you need more information.</p>
<p>To cancel or modify your reservation, please click the following link:</p>
<p><a href="${modifyUrl}">${modifyUrl}</a></p>
<p>See you soon.<br />https://eden.tours</p>



<br /><br />
<p>You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
  `
}

function createTourStartEmailHtml(
  tourName,
  tourDate,
  numConnections,
  connectionInfo,
  unsubscribeUrl
) {
  const tourDates = buildTourDateStrings(tourDate, fixedTimezone)

  return `
<p>Dear Friends,</p>

<p>Greetings from Asia! We are looking forward to meeting you on your upcoming tour. Here are your reservation details as well as your Zoom Meeting ID and password.</p>

&nbsp;&nbsp;Tour: ${tourName} <br />
&nbsp;&nbsp;Date: ${tourDates.fixedTime.combined} <br />
&nbsp;&nbsp;Maximum Number of Connections: ${numConnections} <br />

<h3>Connection Details</h3>
<pre>${connectionInfo}</pre>
<p>See you soon.<br />https://eden.tours</p>



<br /><br />
<p>You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
  `
}

function createTourStartEmailPlaintext(
  tourName,
  tourDate,
  numConnections,
  connectionInfo,
  unsubscribeUrl
) {
  const tourDates = buildTourDateStrings(tourDate, fixedTimezone)

  return `
Dear Friends,

Greetings from Asia! We are looking forward to meeting you on your upcoming tour. Here are your reservation details as well as your Zoom Meeting ID and password.

  Tour: ${tourName}
  Date: ${tourDates.fixedTime.combined}
  Maximum Number of Connections: ${numConnections}


Connection details
${connectionInfo}



See you soon.
https://eden.tours



You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can unsubscribe with this link: ${unsubscribeUrl}.
`
}

export async function catchUpUnsentConfirmationEmails(apply = false) {
  const toursAndBookings = await getUpcomingBookings()
  const upcomingToursWithBookings = indexToursAndBookings(toursAndBookings)
  let upcomingBookings = []
  upcomingToursWithBookings.forEach((tour) => {
    upcomingBookings = upcomingBookings.concat(
      tour.bookings.map((booking) => ({
        ...booking,
        tour: tour.tour
      }))
    )
  })

  const output = []
  await upcomingBookings.reduce(async (prev, next) => {
    await prev
    return sendEmailIfNeeded(next, apply).then((r) => output.push(r))
  }, Promise.resolve())

  return output
}

async function sendEmailIfNeeded(booking, apply = false) {
  const emailsForBooking = await getEmailTransactionsForEvent(booking.bookingId)
  const sentEmailsForBooking = emailsForBooking.filter(
    (transaction) =>
      transaction.sentAt && new Date(transaction.sentAt).getFullYear() >= 2020
  )

  let sent = false
  const emailMustBeSent = sentEmailsForBooking.length === 0
  if (emailMustBeSent && apply) {
    const email = await buildBookingConfirmationEmail(booking.bookingId)
    const transactionId = await createEmailTransaction(
      'booking-confirmation',
      booking.bookingId,
      email
    )
    await sendEmail(transactionId)
    sent = true
  }

  return {
    tourId: booking.tourId,
    bookingId: booking.bookingId,
    summary: booking.tour.summary,
    start: booking.tour.start,
    email: booking.email,
    emailSent: !emailMustBeSent || sent
  }
}
