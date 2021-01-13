import { catchUpUnsentConfirmationEmails } from '../../utils/emails'
import Error from '../_error'
import Cookies from 'cookies'

export default function Tours({ accessGranted, emailList }) {
  if (!accessGranted) {
    return <Error statusCode={401} title="Olmaz!" />
  }
  return (
    <div className="px-10 pt-8 flex flex-col content-center">
      <h1>Hi!</h1>
      <table className="table-auto">
        <thead>
          <tr>
            <td>Tour</td>
            <td>Email</td>
            <td>Sent?</td>
          </tr>
        </thead>
        <tbody>
          {emailList.map((r) => {
            return (
              <tr key={r.bookingId}>
                <td>
                  {r.summary} - {r.start}
                </td>
                <td>{r.email}</td>
                <td>{r.emailSent ? 'Yes' : 'No'}</td>
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
  const emails = await catchUpUnsentConfirmationEmails(apply)

  return {
    props: {
      accessGranted: true,
      emailList: emails
    }
  }
}
