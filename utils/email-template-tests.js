const fs = require('fs').promises

require('@babel/register')({
  presets: ['@babel/preset-env'],
  ignore: ['node_modules', '.next']
})

// Import the rest of our application.
const templates = require('./email-templates.js')
const { buildTourDateStrings } = require('./tour-dates')
console.log('Creating samples emails')

try {
  const fixedTimezone = 'Europe/Istanbul'
  const demoTourName = 'Seven Cities, Seven Congregations (Guide: Clem)'
  const demoTourDates = buildTourDateStrings(
    new Date('2021-03-14T19:30:00').toISOString(),
    fixedTimezone
  )
  const demoTourNumConnections = 4
  const demoTourConnectionInfo = `Topic: Seven Cities, Seven Congregations<br>Time: Mar 14, 2021 07:30 PM Istanbul (12:30 PM Eastern Standard Time<br><br>Join Zoom Meeting<br><a href="https://us02web.zoom.us/j/88150928244?pwd=Qmh0SmZzQmdwQmQveFphd2FPanJydz09">https://us02web.zoom.us/j/88150928244?pwd=Qmh0SmZzQmdwQmQveFphd2FPanJydz09</a><br><br>Meeting ID: 881 5092 8244<br>Passcode: 024394<span><span></span></span><br><span><span><br><br><span><br><span>The tour is absolutely FREE. Tips are not expected.&nbsp;</span><br><span>If you wish to send a donation, you can use:&nbsp;</span><br><span><a href="https://cash.app/$Clemandlarissa">https://cash.app/$Clemandlarissa</a></span><br><span><a href="https://www.paypal.me/clemandlarissa">https://www.paypal.me/clemandlarissa</a></span></span></span></span><br><span><span><span><span><span><span><span>Please mention it's a donation in the note. </span></span></span></span></span></span></span><br><span></span>`
  const demoTourUnsubscribeUrl = 'Unsubscribe here'

  let samples = [
    {
      name: 'tour-start',
      type: 'txt',
      body: templates.createTourStartEmailPlaintext(
        demoTourName,
        demoTourDates,
        demoTourNumConnections,
        demoTourConnectionInfo,
        demoTourUnsubscribeUrl
      )
    },
    {
      name: 'tour-start',
      type: 'html',
      body: templates.createTourStartEmailHtml(
        demoTourName,
        demoTourDates,
        demoTourNumConnections,
        demoTourConnectionInfo,
        demoTourUnsubscribeUrl
      )
    }
  ]

  let sampleSaving = samples.map((sample) => {
    let fileContent
    if (sample.type == 'html') {
      fileContent = `<!DOCTYPE html><html><body><div style="max-width: 600px; margin: 30px 30px 30px 30px;">${sample.body}</div></body></html>`
    } else {
      fileContent = sample.body
    }

    const filePath = `../email-samples/${sample.name}.${sample.type}`
    return fs.writeFile(filePath, fileContent, 'utf8')
  })

  Promise.all(sampleSaving)
    .then(() => {
      console.log('Done')
    })
    .catch((iErr) => {
      console.log('Error')
      console.log(iErr.toString())
    })
} catch (err) {
  console.log('Error')
  console.log(err.toString())
}
