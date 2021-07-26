import { v4 as uuid } from 'uuid'
import bs58 from 'bs58'
import {
  insertEmailTransaction,
  getEmailTransaction,
  getUnsentEmailsInRange,
  markEmailTransactionAsSent,
  getBookingRecords,
  insertActionKey
} from '../db/bookingDb'
import {
  aggregateBookingRecords  
} from '../aggregates/booking'
import { SES, config } from 'aws-sdk'
import { buildTourDateStrings } from './tour-dates'
import {
  createTourStartEmailPlaintext,
  createTourStartEmailHtml,
  createConfirmationEmailPlaintext,
  createConfirmationEmailHtml
} from './email-templates'
import { DateTime } from 'luxon'

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

  const tourDates = buildTourDateStrings(booking.tour.start, fixedTimezone)

  const timeUrl = `https://eden.tours/book/${booking.tour.tourId}/time`

  const recipients = {
    to: [booking.email],
    cc: [],
    bcc: []
  }
  const subject = `Eden·Tours Booking Confirmation`
  const body = {
    html: createConfirmationEmailHtml(
      booking.tour.summary,
      tourDates,
      booking.participantCount,
      modifyUrl,
      unsubscribeUrl,
      timeUrl
    ),
    plaintext: createConfirmationEmailPlaintext(
      booking.tour.summary,
      tourDates,
      booking.participantCount,
      modifyUrl,
      unsubscribeUrl,
      timeUrl
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
  const timeUrl = `https://eden.tours/book/${tour.tourId}/time`

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
      tourDates,
      participantCount,
      tour.description,
      unsubscribeUrl,
      timeUrl
    ),
    plaintext: createTourStartEmailPlaintext(
      tour.summary,
      tourDates,
      participantCount,
      tour.description,
      unsubscribeUrl,
      timeUrl
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

export async function getUnsentMessages(numDays = 14) {
  const startSeconds = DateTime.now().minus({ days: numDays }).toSeconds()
  const endSeconds = DateTime.now().minus({ minutes: 30 }).toSeconds()
  const unsentMessages = await getUnsentEmailsInRange(startSeconds, endSeconds)
  return unsentMessages
}