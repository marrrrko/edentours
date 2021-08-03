import Link from 'next/link'
import Dropdown from './dropdown'

export default function TopBar({ programs }) {
  const toursButtonItems = [
    ...programs.map((p) => ({ label: p.label, url: '/' + p.id })),
    { label: 'View All Tour Dates', url: '/tours' }
  ]
  return (
    <div className="topbar w-full max-w-7xl mx-auto border-b flex flex-col sm:flex-row flex-nowrap items-center p-1 font-serif">
      <div className="flex-grow py-3 px-2 text-lg md:text-2xl font-extrabold ">
        <Link href="/">
          <a className="hover:bg-gray-200 p-2 px-2 sm:px-4 rounded no-underline">
            eden•tours
          </a>
        </Link>
      </div>
      <div className="hidden sm:flex flex-row flex-nowrap font-serif ml-0 text-sm mt-2">
        <div className="">
          <Dropdown name="Tours" items={toursButtonItems} />
        </div>
        <div className="">
          <Dropdown
            name="Explore"
            items={[
              { label: 'Turkey', url: '/turkey-today' },
              { label: 'Bible Research', url: '/research' }
            ]}
          />
        </div>
        <div className="mr-2">
          <Dropdown
            name="Info"
            items={[
              { label: 'Frequently Asked Questions', url: '/faq' },
              { label: 'About Us', url: '/about-us' },
              { label: 'Contact Us', url: '/contact-us' }
            ]}
          />
        </div>
      </div>
      <div className="flex sm:hidden flex-row flex-nowrap font-serif ml-0 text-sm mt-2">
        <div className="">
          <Dropdown name="Tours" items={toursButtonItems} centerAlign={true} />
        </div>
        <div className="">
          <Dropdown
            name="Explore"
            items={[
              { label: 'Turkey', url: '/turkey-today' },
              { label: 'Bible Research', url: '/research' }
            ]}
            centerAlign={true} 
          />
        </div>
        <div className="mr-2">
          <Dropdown
            name="Info"
            items={[
              { label: 'Frequently Asked', url: '/faq' },
              { label: 'About Us', url: '/about-us' },
              { label: 'Contact Us', url: '/contact-us' }
            ]}
            centerAlign={true} 
          />
        </div>
      </div>
    </div>
  )
}
