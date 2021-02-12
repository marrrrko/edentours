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

//AWS Email is sent through a different region
config.update({ region: 'us-east-1' })

export async function buildBookingConfirmationEmail(bookingId) {
  const booking = aggregateBookingRecords(await getBookingRecords(bookingId))
  if (!booking.email || booking.email.indexOf('@') === -1) {
    throw new Error('Booking does not have a valid email')
  }

  const modifyKey = bs58.encode(Buffer.from(uuid().replace(/-/g, ''), 'hex'))
  let actionExpirationDate = new Date(booking.tour.start)
  actionExpirationDate = new Date(
    actionExpirationDate.setDate(actionExpirationDate.getDate() + 14)
  )

  await insertActionKey(
    modifyKey,
    'modify-booking',
    bookingId,
    actionExpirationDate
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
    plaintext: createConfirmationEmailPlaintext(
      booking.tour.summary,
      booking.tour.start,
      booking.participantCount,
      modifyUrl,
      unsubscribeUrl
    )
  }

  return {
    recipients,
    subject,
    body
  }
}

export async function buildTourStartEmail(
  tour,
  email,
  participantCount,
  targetId
) {
  const unsubscribeKey = bs58.encode(
    Buffer.from(uuid().replace(/-/g, ''), 'hex')
  )
  await insertActionKey(unsubscribeKey, 'unsubscribe', targetId, null)
  const unsubscribeUrl = `https://eden.tours/user/unsubscribe?action=${unsubscribeKey}`

  const recipients = {
    to: [email],
    cc: [],
    bcc: []
  }
  const tourDates = buildTourDateStrings(tour.start, fixedTimezone)
  const tourDay = tourDates.fixedTime.shortday
  const subject = `Zoom Connection Details For Your ${tourDay} Tour`
  const body = {
    html: createTourStartEmailHtml(
      tour.summary,
      tour.start,
      participantCount,
      tour.description,
      unsubscribeUrl
    ),
    plaintext: createTourStartEmailPlaintext(
      tour.summary,
      tour.start,
      participantCount,
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
      const to = transaction.email.recipients.to.filter(emailIsAllowed)
      const cc = transaction.email.recipients.cc.filter(emailIsAllowed)
      const bcc = transaction.email.recipients.bcc.filter(emailIsAllowed)

      if (!to.length && !cc.length && !bcc.length) {
        global.emailLog.warn(
          `Skipping recipientless email (transaction #${transactionId})`
        )
        return
      }

      const awsEmailDoc = {
        Destination: {
          ToAddresses: to,
          CcAddresses: cc,
          BccAddresses: bcc
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
      global.emailLog.info(
        `${transaction.transactionType} email sent (#${transactionId})`
      )
      await markEmailTransactionAsSent(transactionId, MessageId, new Date())
    } catch (emailSendErr) {
      global.emailLog.error('Failed to send email', emailSendErr)
    }
  }
}

function emailIsAllowed(email) {
  const emailSafetySetting = process.env.EMAIL_SENDING_SAFETY
  const allowed =
    emailSafetySetting != null &&
    emailSafetySetting.trim().toUpperCase() != 'X' &&
    (emailSafetySetting.trim() == '*' ||
      email.trim().indexOf(emailSafetySetting) != -1)
  return allowed
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

<p>Zoom connection details will be sent to you 48 hours before your tour starts. Please check our <a href="https://eden.tours/faq">frequently asked questions page</a> if you need more information.</p>
<p>To cancel or modify your reservation, please click the following link:</p>
<p><a href="${modifyUrl}">${modifyUrl}</a></p>
<p>See you soon.<br />https://eden.tours</p>



<br /><br />
<p>You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
  `
}

function createConfirmationEmailPlaintext(
  tourName,
  tourDate,
  numConnections,
  modifyUrl,
  unsubscribeUrl
) {
  const tourDates = buildTourDateStrings(tourDate, fixedTimezone)

  return `
Congrats! Your Tour is Booked
We are pleased to have you as our guest for a tour. We know you will have a great time, deepen your Bible knowledge, and make new acquaintances.

Your details are below:

  Tour: ${tourName}
  Date: ${tourDates.fixedTime.combined}
  Number of Connections: ${numConnections}

Zoom connection details will be sent to you 48 hours before your tour starts. Please check our frequently asked questions page (https://eden.tours/faq) if you need more information.
To cancel or modify your reservation, please use the following link: ${modifyUrl}

See you soon.
https://eden.tours




You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can unsubscribe using this link: ${unsubscribeUrl}.
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
  const formattedConnectionInfo =
    connectionInfo.indexOf('<br') != -1
      ? connectionInfo
      : connectionInfo.split('\n').join('<br />')

  return `
<p>Dear Friends,</p>

<p>Greetings from Turkey! We are looking forward to meeting you on your upcoming tour. Here are your final booking details as well as your video conferencing connection instructions.</p>

<h3>Tour Details</h3>
&nbsp;&nbsp;Tour: ${tourName} <br />
&nbsp;&nbsp;Date: <span style="font-weight: bold;">${tourDates.fixedTime.combined}</span> <br />
&nbsp;&nbsp;Maximum Number of Connections: ${numConnections} <br />

<h3>Video Conference Connection Details</h3>
<div style="margin-right: 10px; padding: 15px; background-color: #deffff;">
  ${formattedConnectionInfo}
</div>
<br/><p>See you soon.<br />https://eden.tours</p>



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

Greetings from Turkey! We are looking forward to meeting you on your upcoming tour. Here are your reservation details as well as your Zoom Meeting ID and password.

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
