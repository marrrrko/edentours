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
                      <div className="font-bold w-10">{label.language}</div>
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
      <div className="flex flex-col content-center mt-5">
        {guides.map((guide) => {
          return (
            <div
              key={guide._id}
              title={JSON.stringify(guide, null, ' ')}
              className="flex text-base "
            >
              <div className="font-mono w-32">{guide._id}</div>
              <div className="w-48">{guide.displayLabel}</div>
              <div className="w-48">{guide.email}</div>
            </div>
          )
        })}
      </div>
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
