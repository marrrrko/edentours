import Link from 'next/link'

export default function TopBar(props) {
  return (
    <div className="topbar w-full border-b flex flex-row flex-wrap items-center p-1 font-serif">
      <div className="flex-grow py-3 px-2 sm:pl-10 md:pl-20 text-lg md:text-2xl font-extrabold ">
        <Link href="/">
          <a className="hover:bg-gray-200 p-2 px-2 sm:px-4 rounded no-underline">
            eden•tours
          </a>
        </Link>
      </div>
      <div className="font-serif ml-0">
        <ul className="flex flex-row flex-wrap list-none ml-0">
          <li className="mr-1 md:mr-3">
            <Link href="/tours">
              <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded">
                Tours
              </a>
            </Link>
          </li>
          <li className="mr-1 md:mr-3">
            <Link href="/research">
              <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded">
                Research
              </a>
            </Link>
          </li>
          <li className="mr-1 md:mr-7">
            <Link href="/faq">
              <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded">FAQ</a>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
