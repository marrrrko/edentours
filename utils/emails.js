import { v4 as uuid } from 'uuid'
import {
  insertEmailTransaction,
  getEmailTransaction,
  markEmailTransactionAsSent,
  getBooking
} from '../db/bookingDb'
import { SES, config } from 'aws-sdk'

config.update({ region: 'us-east-1' })

export async function buildBookingConfirmationEmail(bookingId) {
  const booking = await getBooking(bookingId)
  const recipients = {
    to: ['markcarrier@gmail.com'],
    cc: [],
    bcc: []
  }
  const subject = `Confirmation for ${booking.tour.summary}`
  const body = { html: 'Hello email!', plaintext: 'Hello email!' }

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
      await markEmailTransactionAsSent(transactionId, MessageId, new Date())
    } catch (emailSendErr) {
      console.error('Failed to send email', emailSendErr)
    }
  }
}
