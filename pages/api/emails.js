import Cookies from 'cookies'
import { sendEmail } from '../../utils/emails'
export default async function handler(req, res) {
  const cookies = new Cookies(req, res)
  const accessCookie = cookies.get('edenaccess')
  if (accessCookie != process.env.ADMIN_ACCESS) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ msg: 'No access' }))
    return
  }

  if (req.method === 'POST') {
    const emails = req.body.emailsToReSend || []

    const sendJobs = emails.map(tId => sendEmail(tId))
    // const sendJobs = emails.map(tId => {
    //   return new Promise((resolve, reject) => {
    //     console.log(`Sending ${tId}`)
    //     setTimeout(resolve, 5)
    //   })
    // })
    await Promise.all(sendJobs)

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ msg: 'Resent', payload: emails }))
  }
}
