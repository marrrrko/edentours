import { getUnsentMessages } from '../../utils/emails'
import Error from '../_error'
import Cookies from 'cookies'
import { DateTime } from 'luxon'
import { useState, useEffect } from 'react'
import BigLoader from '../../components/big-loader'

export default function Tours({ accessGranted, emailList }) {
  const [selected, setSelected] = useState([])
  const [send, setSend] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {

    async function sendSelected() {
      let url = `/api/emails`
      let headers = {
        'Content-Type': 'application/json',        
      }
      let doc = {
        emailsToReSend: selected.map(s => s.replace('send-',''))        
      }
      const httpResponse = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(doc)
      })

      if (!httpResponse.ok) {
        alert('Badness!')
      } else {
        alert('Emails Resent')
        location.reload()
      }
    }

    if(send && !sending) {
      setSending(true)
      sendSelected()
    }

  }, [send])

  if (!accessGranted) {
    return <Error statusCode={401} title="Olmaz!" />
  }

  const everyId = emailList.map((e) => `send-${e.transactionId}`)

  const sendNow = () => {
    if(selected.length) {
      setSend(true)
    }
  }
  const handleCheckboxToggle = (e) => {
    const tValue = e.target.value
    if (tValue === 'select-all') {
      if (e.target.checked) setSelected(everyId)
      else setSelected([])
    } else {
      if (e.target.checked) setSelected(selected.concat(tValue))
      else setSelected(selected.filter((eid) => eid != tValue))
    }
  }

  const isChecked = (tValue) => {
    return selected.indexOf(tValue) !== -1
  }

  if(sending) {
    return <div className="text-center"><BigLoader /> <br /> <span className="text-xl font-bold">Sending. Please be patient.</span></div>
  }

  return (
    <div className="px-10 pt-8 flex flex-col content-center">
      <h1 className="mb-4">Unsent Emails from past 14 days</h1>

      <a
        className="my-4 mr-3 w-32 text-center bg-yellow-200 cursor-pointer no-underline text-black text-xs font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-200"
        title="View Emails" onClick={sendNow}
      >
        Send {selected.length} emails
      </a>

      <table className="table-auto">
        <thead>
          <tr>
            <td>
              <input
                type="checkbox"
                value="select-all"
                disabled={send}
                onChange={handleCheckboxToggle}
              />
            </td>
            <td className="font-bold">Subject</td>
            <td className="font-bold">Created</td>
            <td className="font-bold">Recipient</td>
          </tr>
        </thead>
        <tbody>
          {emailList.map((r) => {
            return (
              <tr key={r.transactionId}>
                <td>
                  <input
                    type="checkbox"
                    checked={isChecked(`send-${r.transactionId}`)}
                    value={`send-${r.transactionId}`}
                    disabled={send}
                    onChange={handleCheckboxToggle}
                  />
                </td>
                <td>{r.email.subject}</td>
                <td>
                  {DateTime.fromISO(r.transactionTime)
                    .setZone('local')
                    .toFormat('ccc LLL d H:m')}
                </td>
                <td>{r.email.recipients.to.join(', ')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { access, sendAll } = context.query

  const cookies = new Cookies(context.req, context.res)
  const accessCookie = cookies.get('edenaccess')
  if (
    access != process.env.ADMIN_ACCESS &&
    accessCookie != process.env.ADMIN_ACCESS
  ) {
    return { props: { accessGranted: false } }
  }

  if (access === process.env.ADMIN_ACCESS) {
    cookies.set('edenaccess', access)
  }

  const apply = sendAll || false
  const emails = await getUnsentMessages()

  return {
    props: {
      accessGranted: true,
      emailList: emails
    }
  }
}
