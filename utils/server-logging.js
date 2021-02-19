import winston from 'winston'
import WinstonCloudWatch from 'winston-cloudwatch'
//const dev = process.env.NODE_ENV !== 'production'

export function setupGlobalLogging() {
  const consoleLogFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(function (info) {
      return `${new Date().toISOString()} [${info.level}] [${info.service}] ${JSON.stringify(info.message, null, 2)}`
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

  if (process.env.USE_CLOUDWATCH == 'TRUE') {
    console.log(`Logs will be sent to cloudwatch`)
    defaultTransports.push(
      new WinstonCloudWatch({
        name: 'eden-web-stream',
        logGroupName: 'eden',
        logStreamName: 'eden-web',
        awsRegion: 'ca-central-1'
      })
    )
    emailTransports.push(
      new WinstonCloudWatch({
        name: 'eden-email-stream',
        logGroupName: 'eden',
        logStreamName: 'eden-email',
        awsRegion: 'ca-central-1'
      })
    )
  } else {
    console.log(`Logs will NOT be sent to cloudwatch`)
  }

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
