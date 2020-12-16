import Link from 'next/link'

export default function TopBar(props) {
  return (
    <div className="topbar w-full border-b flex flex-row flex-wrap items-center p-1 font-serif">
      <div className="flex-grow p-3 md:pl-20 pl-2 text-lg md:text-2xl font-extrabold ">
        <a href="/" className="hover:bg-gray-200 p-2 px-4 rounded no-underline">
          <span>eden•tours</span>
        </a>
      </div>
      <div className="font-serif">
        <ul className="flex flex-row flex-wrap list-none">
          <li className="mr-1 md:mr-3 hover:bg-gray-200 p-1 md:px-3 rounded">
            <Link href="/tours">Tours</Link>
          </li>
          <li className="mr-1 md:mr-3 hover:bg-gray-200 p-1 md:px-3 rounded">
            <Link href="/research">Research</Link>
          </li>
          <li className="mr-4 md:mr-7 hover:bg-gray-200 p-1 md:px-3 rounded">
            <Link href="/faq">FAQ</Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
