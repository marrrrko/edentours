import winston from 'winston'
import WinstonCloudWatch from 'winston-cloudwatch'
//const dev = process.env.NODE_ENV !== 'production'

export function setupGlobalLogging() {
  const consoleLogFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(function (info) {
      return `[${
        info.level
      }] [${info.service}] ${JSON.stringify(info.message, null, 2)}`
    })
  )

  let defaultTransports = [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      level: level,
      format: consoleLogFormat
    })
  ]
  let emailTransports = [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      level: level,
      format: consoleLogFormat
    })
  ]

  const level = process.env.NODE_ENV !== 'production' ? 'debug' : 'info'
  const defaultLogger = winston.createLogger({
    level: level,
    format: winston.format.json(),
    defaultMeta: { service: 'eden-web' },
    transports: defaultTransports,
    exceptionHandlers: defaultTransports,
    exitOnError: false
  })

  const emailLogger = winston.createLogger({
    level: level,
    format: winston.format.json(),
    defaultMeta: { service: 'eden-email' },
    transports: emailTransports
  })

  global.log = defaultLogger
  global.emailLog = emailLogger
}
