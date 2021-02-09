/**
 * Tour Record
 * @typedef {Object} TourRecord
    * @property {string} tourId
    * @property {string} summary
    * @property {string} description
    * @property {string} creatorEmail
    * @property {string} etag
    * @property {string} eventTime
    * @property {string} eventType
    * @property {string} externalEventId
    * @property {string} start
    * @property {string} end
  }
 */

/**
 * Booking Record
 * @typedef {Object} BookingRecord
 * @property {string} bookerName
 * @property {string} email
 * @property {string} groupName
 * @property {number} participantCount
 * @property {string} groupDetails
 * @property {string} bookingId
 * @property {string} eventTime
 * @property {string} eventType
 * @property {string} tourId
 */

/**
 * EmailTransaction
 * @typedef {Object} EmailTransaction
 * @property {string} transactionId
 * @property {string} transactionType
 * @property {string} transactionTime
 * @property {string} associatedEventId
 * @property {string|null} targetId
 * @property {Email} email
 */

/**
 * Email
 * @typedef {Object} Email
 * @property {EmailRecipients} recipients
 * @property {string} subject
 * @property {{ html: string, plaintext: string }} body
 * @property {string|null} sentAt
 * @property {string|null} sentMsgId
 */

/**
 * EmailRecipients
 * @typedef {Object} EmailRecipients
 * @property {string[]} to
 * @property {string[]} cc
 * @property {string[]} bcc
 */
