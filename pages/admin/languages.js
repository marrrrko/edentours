import Router from 'next/router'
import Link from 'next/link'
import Error from '../_error'
import Cookies from 'cookies'
import { useState, useEffect } from 'react'
import cookie from 'cookie'
import languageData from '../../languages.json'
import AdminMenu from '../../components/admin-menu'
export default function Languages({ accessGranted, languages }) {
  if (!accessGranted) {
    return <Error statusCode={401} title="Olmaz!" />
  }

  return (
    <div className="px-10 mt-5 mb-20 w-full flex flex-col">
      <div className="flex flex-row-reverse">
        <AdminMenu />
      </div>

      <h2 className="mx-auto mt-10">Language Codes</h2>
      <div className="flex flex-col content-center mt-5">
        {languages.map((language) => {
          return (
            <div
              key={language.code}
              title={JSON.stringify(language, null, ' ')}
              className="text-base"
            >
              <span className="font-mono font-bold inline-block w-10">
                {language.code}
              </span>
              <span className="ml-4">{language.nativeName}</span>
              <span className=""> - {language.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { access } = context.query

  context.req.connection.encrypted = true
  const cookies = new Cookies(context.req, context.res)
  const accessCookie = cookies.get('edenaccess')
  if (
    access != process.env.ADMIN_ACCESS &&
    accessCookie != process.env.ADMIN_ACCESS
  ) {
    return { props: { accessGranted: false } }
  }

  if (access === process.env.ADMIN_ACCESS) {
    cookies.set('edenaccess', access, { maxAge: 90 * 24 * 60 * 60 * 60, secure: true, sameSite: 'strict' })
  }

  return {
    props: {
      accessGranted: true,
      languages: languageData.languages,
    },
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
