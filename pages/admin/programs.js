import Router from 'next/router'
import Link from 'next/link'
import { getAllTourPrograms } from '../../db/tour-programs'
import { getAllGuides } from '../../db/tour-guides'
import Error from '../_error'
import Cookies from 'cookies'
import { useState, useEffect } from 'react'
import cookie from 'cookie'
import AdminMenu from '../../components/admin-menu'
export default function Programs({ accessGranted, programs, guides }) {
  const [program, setProgram] = useState(null)
  const [language, setLanguage] = useState(null)
  const [guide, setSetGuide] = useState(null)

  if (!accessGranted) {
    return <Error statusCode={401} title="Olmaz!" />
  }

  return (
    <div className="px-10 mt-5 mb-20 w-full flex flex-col">
      <div className="flex flex-row-reverse">
        <AdminMenu />
      </div>

      <h2 className="mx-auto">Programs</h2>
      <div className="flex flex-col content-center mt-5">
        {programs.map((program) => {
          return (
            <div key={program._id} className="mb-6">
              <h2 className="font-mono text-base">{program._id}</h2>
              <hr />
              <div>
                {program.labels.map((label) => {
                  return (
                    <div key={label.language} className="flex">
                      <div className="font-bold w-10 mb-2 mr-2">
                        <a
                          onClick={() => {
                            setProgram(program._id)
                            setLanguage(label.language)
                          }}
                          className="bg-gray-200 hover:bg-yellow-200 p-1 md:px-3 cursor-pointer rounded no-underline"
                        >
                          {label.language}
                        </a>
                      </div>
                      <div>{label.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-10">
        <Link href="/admin/languages">
          <a>View All Possible Language Codes</a>
        </Link>
      </div>

      <h2 className="mx-auto mt-10">Guides</h2>
      <div className="flex flex-col content-center justify-center mt-5">
        {guides.map((guide) => {
          return (
            <div
              key={guide._id}
              title={JSON.stringify(guide, null, ' ')}
              className="flex text-base"
            >
              <div className="font-mono text-sm font-bold w-32 mb-4">
                <a
                  onClick={() => setSetGuide(guide._id)}
                  className="bg-gray-200 hover:bg-yellow-200 p-2 md:px-3 cursor-pointer rounded no-underline"
                >
                  {guide._id}
                </a>
              </div>
              <div className="w-48">{guide.displayLabel}</div>
              <div className="w-48">{guide.email}</div>
            </div>
          )
        })}
      </div>

      <div className="w-screen bottom-0 -ml-10 px-12 py-2 text-center font-mono h-12 fixed bg-yellow-100">
        Tour: {program || '<program id>'} / {language || '<language code>'} /{' '}
        {guide || '<guide id>'}
      </div>

      {program && guide && language && (
        <div className="fixed bottom-0 right-0 mb-2 mr-4">
          <a
            href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
              'Tour: ' + program + ' / ' + language + ' / ' + guide
            )}&location=92`}
            target="_blank"
            className="bg-gray-200 hover:bg-blue-200 float-right p-1 text-xs px-3 cursor-pointer rounded no-underline"
          >
            Add to Calendar
          </a>
        </div>
      )}
    </div>
  )
}

export async function getServerSideProps(context) {
  const { access } = context.query

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

  const programs = await getAllTourPrograms()
  const guides = await getAllGuides()
  return {
    props: {
      accessGranted: true,
      programs,
      guides,
    },
  }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}
