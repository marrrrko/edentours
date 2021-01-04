import { v4 as uuid } from 'uuid'
import bs58 from 'bs58'
import {
  insertEmailTransaction,
  getEmailTransaction,
  getEmailTransactionsForBooking,
  getUpcomingBookings,
  markEmailTransactionAsSent,
  getBooking,
  insertActionKey
} from '../db/bookingDb'
import { format } from 'date-fns-tz'
import { SES, config } from 'aws-sdk'

config.update({ region: 'us-east-1' })

export async function buildBookingConfirmationEmail(bookingId) {
  const booking = await getBooking(bookingId)
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

export async function createEmailTransaction(
  messageType,
  associatedEventId,
  email
) {
  const transactionId = uuid()
  await insertEmailTransaction(
    transactionId,
    messageType,
    associatedEventId,
    email
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
      console.log('Email sent')
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
  return `
<p><h2>Congrats! Your Tour is Booked</h2></p>
<p>We are pleased to have you as our guest for a tour. We know you will have a great time, deepen your Bible knowledge, and make new acquaintances.</p>

<p>Your details are below:</p>

&nbsp;&nbsp;Tour: ${tourName} <br />
&nbsp;&nbsp;Date: ${
    format(
      new Date(tourDate),
      "EEEE MMMM do yyyy h:mm a 'Istanbul Time (UTC' xxx",
      { timeZone: 'Europe/Istanbul' }
    ) + ')'
  } <br />
&nbsp;&nbsp;Number of Connections: ${numConnections} <br />

<p>Zoom connection details will be sent three days before your tour date. Please check our <a href="https://eden.tours/faq">frequently asked questions page</a> if you need more information.</p>
<p>To cancel or modify your reservation, please click the following link:</p>
<p><a href="${modifyUrl}">${modifyUrl}</a></p>
<p>See you soon.<br />https://eden.tours</p>



<br /><br />
<p>You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
  `
}

export async function catchUpUnsentConfirmationEmails(apply = false) {
  const upcomingToursWithBookings = await getUpcomingBookings()
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
  const emailsForBooking = await getEmailTransactionsForBooking(
    booking.bookingId
  )
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
