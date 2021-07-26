import Link from 'next/link'
import Dropdown from './dropdown'

export default function TopBar({ programs }) {
  const toursButtonItems = [
    ...programs.map((p) => ({ label: p.label, url: '/' + p.id })),
    { label: 'View All Tours', url: '/tours' },
  ]
  return (
    <div className="topbar w-full border-b flex flex-row flex-wrap items-center p-1 font-serif">
      <div className="flex-grow py-3 px-2 sm:pl-10 md:pl-20 text-lg md:text-2xl font-extrabold ">
        <Link href="/">
          <a className="hover:bg-gray-200 p-2 px-2 sm:px-4 rounded no-underline">
            eden•tours
          </a>
        </Link>
      </div>
      <div className="font-serif ml-0 text-sm mt-2">
        <ul className="flex flex-row flex-wrap list-none ml-0">
          <li className="">
            <Dropdown name="Tours" items={toursButtonItems} />
          </li>
          <li className="">
            <Dropdown
              name="Explore"
              items={[
                { label: 'Turkey', url: '/turkey-today' },
                { label: 'Bible Research', url: '/research' },
              ]}
            />
          </li>
          <li className="mr-2">
            <Dropdown
              name="Info"
              items={[
                { label: 'Frequently Asked', url: '/faq' },
                { label: 'About Us', url: '/about-us' },
                { label: 'Contact Us', url: '/contact' },
              ]}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
