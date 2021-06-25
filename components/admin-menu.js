import Link from 'next/link'

export default function AdminMenu({ activeLink }) {
  return (
    <ul className="flex flex-row flex-wrap list-none ml-0">
      <li className="mr-1 md:mr-3">
        <Link href="/admin/events">
          <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded no-underline">
            Events
          </a>
        </Link>
      </li>
      <li className="mr-1 md:mr-3">
        <Link href="/admin/programs">
          <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded no-underline">
            Programs
          </a>
        </Link>
      </li>
    </ul>
  )
}
